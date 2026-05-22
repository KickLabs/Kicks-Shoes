"""
Security Guard Lambda — W6 MH-SEC
Detects S3 bucket with Block Public Access disabled and re-enables it.

Triggers:
  1. EventBridge rule on CloudTrail events:
     PutBucketPolicy / PutBucketAcl / DeletePublicAccessBlock
  2. EventBridge Scheduler — daily cron 21:00 UTC (fallback scan)

IAM: least-privilege — s3:PutPublicAccessBlock + s3:GetPublicAccessBlock + s3:ListAllMyBuckets
"""

import boto3
from botocore.exceptions import ClientError
import json
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")


def handler(event, context):
    logger.info("Security Guard triggered. Event: %s", json.dumps(event))

    remediated = []
    buckets_to_check = []

    # -------------------------------------------------------------------------
    # If triggered by CloudTrail event via EventBridge — check specific bucket
    # -------------------------------------------------------------------------
    if "detail" in event and "requestParameters" in event.get("detail", {}):
        bucket_name = event["detail"]["requestParameters"].get("bucketName")
        if bucket_name:
            buckets_to_check = [bucket_name]
            logger.info("Checking specific bucket from CloudTrail event: %s", bucket_name)

    # -------------------------------------------------------------------------
    # Scheduled scan — check all project buckets
    # -------------------------------------------------------------------------
    if not buckets_to_check:
        project_name = os.environ.get("PROJECT_NAME", "kicks-shoes")
        response = s3.list_buckets()
        buckets_to_check = [
            b["Name"]
            for b in response["Buckets"]
            if project_name in b["Name"]
        ]
        logger.info(
            "Scheduled scan — checking %d project buckets", len(buckets_to_check)
        )

    for bucket_name in buckets_to_check:
        try:
            bpa = s3.get_public_access_block(Bucket=bucket_name)
            config = bpa["PublicAccessBlockConfiguration"]

            is_public = not all(
                [
                    config.get("BlockPublicAcls", False),
                    config.get("IgnorePublicAcls", False),
                    config.get("BlockPublicPolicy", False),
                    config.get("RestrictPublicBuckets", False),
                ]
            )

            if is_public:
                logger.warning(
                    "VIOLATION: Bucket %s has public access enabled. Remediating...",
                    bucket_name,
                )
                _remediate(bucket_name)
                remediated.append(bucket_name)
            else:
                logger.info("OK: Bucket %s Block Public Access is ON", bucket_name)

        except ClientError as exc:
            if exc.response.get("Error", {}).get("Code") == "NoSuchPublicAccessBlockConfiguration":
                logger.warning(
                    "VIOLATION: Bucket %s has no Block Public Access config. Creating...",
                    bucket_name,
                )
                _remediate(bucket_name)
                remediated.append(bucket_name)
            else:
                logger.error("Error checking bucket %s: %s", bucket_name, exc)

        except Exception as exc:
            logger.error("Error checking bucket %s: %s", bucket_name, exc)

    result = {
        "statusCode": 200,
        "remediated": remediated,
        "count": len(remediated),
    }
    logger.info(
        "Security Guard complete. Remediated %d buckets: %s",
        len(remediated),
        remediated,
    )
    return result


def _remediate(bucket_name: str) -> None:
    """Re-enable all four Block Public Access settings on a bucket."""
    s3.put_public_access_block(
        Bucket=bucket_name,
        PublicAccessBlockConfiguration={
            "BlockPublicAcls": True,
            "IgnorePublicAcls": True,
            "BlockPublicPolicy": True,
            "RestrictPublicBuckets": True,
        },
    )
    logger.info("REMEDIATED: Block Public Access re-enabled on %s", bucket_name)
