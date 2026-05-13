import os, json, logging, asyncio
from contextlib import asynccontextmanager
from typing import Optional

import boto3
import redis.asyncio as redis
from botocore.config import Config
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger("product-api")

TABLE_NAME = os.environ["TABLE_NAME"]
REDIS_HOST = os.environ["REDIS_HOST"]
REDIS_AUTH = os.environ["REDIS_AUTH_TOKEN"]
CACHE_TTL = int(os.environ.get("CACHE_TTL_SECONDS", "300"))
AWS_REGION = os.environ.get("AWS_REGION", "ap-southeast-1")

# Boto3 with retry & connection reuse
boto_cfg = Config(
    region_name=AWS_REGION,
    retries={"max_attempts": 3, "mode": "adaptive"},
    max_pool_connections=50,
)
ddb = boto3.resource("dynamodb", config=boto_cfg)
table = ddb.Table(TABLE_NAME)

# Redis client (TLS + AUTH)
redis_client: Optional[redis.Redis] = None

# Singleflight: tránh cache stampede
inflight: dict[str, asyncio.Future] = {}
inflight_lock = asyncio.Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=6379,
        password=REDIS_AUTH,
        ssl=True,
        ssl_cert_reqs=None,  # ElastiCache uses AWS CA, simplified for lab
        decode_responses=True,
        socket_timeout=2,
        socket_connect_timeout=2,
        retry_on_timeout=True,
        health_check_interval=30,
    )
    try:
        await redis_client.ping()
        log.info("Connected to Redis")
    except Exception as e:
        log.error(f"Redis connect failed: {e}")
    yield
    await redis_client.aclose()


app = FastAPI(title="product-api", lifespan=lifespan)


class Product(BaseModel):
    category: str
    sku: str
    name: str
    price: float
    stock: int


def cache_key(category: str, sku: str) -> str:
    return f"product:{category}:{sku}"


async def get_from_cache(key: str) -> Optional[dict]:
    try:
        data = await redis_client.get(key)
        return json.loads(data) if data else None
    except Exception as e:
        log.warning(f"Cache GET failed (graceful degrade): {e}")
        return None


async def set_to_cache(key: str, value: dict, ttl: int = CACHE_TTL):
    try:
        await redis_client.setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        log.warning(f"Cache SET failed: {e}")


async def invalidate_cache(key: str):
    try:
        await redis_client.delete(key)
    except Exception as e:
        log.warning(f"Cache DEL failed: {e}")


async def fetch_from_ddb(category: str, sku: str) -> Optional[dict]:
    resp = table.get_item(Key={"pk": f"PRODUCT#{category}", "sk": f"SKU#{sku}"})
    item = resp.get("Item")
    if not item:
        return None
    return {
        "category": category,
        "sku": sku,
        "name": item["name"],
        "price": float(item["price"]),
        "stock": int(item["stock"]),
    }


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/readyz")
async def readyz():
    try:
        await redis_client.ping()
        table.load()
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(503, f"not ready: {e}")


@app.get("/products/{category}/{sku}")
async def get_product(category: str, sku: str):
    key = cache_key(category, sku)

    # 1. Cache lookup
    cached = await get_from_cache(key)
    if cached:
        log.info(f"cache HIT key={key}")
        return {"source": "cache", **cached}

    # 2. Singleflight để tránh stampede
    async with inflight_lock:
        if key in inflight:
            fut = inflight[key]
        else:
            fut = asyncio.get_event_loop().create_future()
            inflight[key] = fut
            asyncio.create_task(_load_and_set(category, sku, key, fut))

    item = await fut
    if not item:
        raise HTTPException(404, "Product not found")
    return {"source": "ddb", **item}


async def _load_and_set(category: str, sku: str, key: str, fut: asyncio.Future):
    try:
        log.info(f"cache MISS key={key} → DDB")
        item = await asyncio.to_thread(fetch_from_ddb, category, sku)
        if item:
            await set_to_cache(key, item)
        fut.set_result(item)
    except Exception as e:
        fut.set_exception(e)
    finally:
        async with inflight_lock:
            inflight.pop(key, None)


@app.put("/products/{category}/{sku}")
async def upsert_product(category: str, sku: str, p: Product):
    table.put_item(Item={
        "pk": f"PRODUCT#{category}",
        "sk": f"SKU#{sku}",
        "name": p.name,
        "price": int(p.price),
        "stock": p.stock,
        "gsi1pk": "STATUS#active",
        "gsi1sk": f"PRICE#{int(p.price):010d}",
    })
    # Cache invalidation (cache-aside)
    await invalidate_cache(cache_key(category, sku))
    return {"status": "ok"}
