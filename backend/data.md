# Database Schema Documentation

## User Schema

```javascript
const UserSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: String,
  role: { type: String, enum: ["customer", "shop", "admin"], required: true },
  avatar: String,
  address: String,
  phone: String,
  reward_point: { type: Number, default: 0 },
  status: { type: Boolean, default: true },
});
```

## Store Schema

```javascript
const StoreSchema = new Schema({
  owner_id: { type: Schema.Types.ObjectId, ref: "User" },
  name: String,
  address: String,
  contact: String,
  status: { type: Boolean, default: true },
});
```

## Category Schema

```javascript
const CategorySchema = new Schema({
  name: String,
  description: String,
});
```

## Product Schema

```javascript
const ProductSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  summary: String,
  price: { type: Number, required: true },
  regularPrice: { type: Number, required: true },
  salePrice: Number,
  sizes: [String],
  colors: [String],
  category_id: { type: Schema.Types.ObjectId, ref: "Category" },
  store_id: { type: Schema.Types.ObjectId, ref: "Store" },
  rating: { type: Number, default: 0 },
  images: [String],
  image: String,
  brand: String,
  type: String,
  sku: String,
  stock: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 },
  isNew: { type: Boolean, default: false },
  isSale: { type: Boolean, default: false },
  salePercent: { type: Number, default: 0 },
  tags: [String],
  status: { type: Boolean, default: true },
});
```

## Order Schema

```javascript
const OrderSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User" },
  status: String,
  total_price: Number,
  payment_method: String,
  created_at: { type: Date, default: Date.now },
});
```

## Order Item Schema

```javascript
const OrderItemSchema = new Schema({
  order_id: { type: Schema.Types.ObjectId, ref: "Order" },
  product_id: { type: Schema.Types.ObjectId, ref: "Product" },
  quantity: Number,
  price: Number,
});
```

## Cart Schema

```javascript
const CartSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User" },
  items: [
    {
      product_id: { type: Schema.Types.ObjectId, ref: "Product" },
      quantity: Number,
    },
  ],
});
```

## Favorite Schema

```javascript
const FavoriteSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User" },
  items: [
    {
      product_id: { type: Schema.Types.ObjectId, ref: "Product" },
    },
  ],
});
```

## Feedback Schema

```javascript
const FeedbackSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User" },
  product_id: { type: Schema.Types.ObjectId, ref: "Product" },
  rating: Number,
  comment: String,
  created_at: { type: Date, default: Date.now },
});
```

## Reward Point Schema

```javascript
const RewardPointSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User" },
  points: Number,
  created_at: { type: Date, default: Date.now },
});
```

## Refund Schema

```javascript
const RefundSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User" },
  order_id: { type: Schema.Types.ObjectId, ref: "Order" },
  refund_reason: String,
  refund_amount: Number,
  refund_image: String,
  created_at: { type: Date, default: Date.now },
});
```

## Discount Schema

```javascript
const DiscountSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User" },
  discount_percentage: Number,
  discount_code: String,
  number_of_discount: Number,
  total_use: Number,
  status: Boolean,
});
```

## Report Schema

```javascript
const ReportSchema = new Schema({
  reported_by: { type: Schema.Types.ObjectId, ref: "User" },
  target_type: String,
  target_id: Schema.Types.ObjectId,
  reason: String,
  status: String,
  created_at: { type: Date, default: Date.now },
});
```

# API Endpoints Documentation

## 1. User (Authentication & Profile)

| Method | Endpoint         | Description                    | Middleware |
| ------ | ---------------- | ------------------------------ | ---------- |
| POST   | `/auth/register` | Register a new user            | -          |
| POST   | `/auth/login`    | Login and return token         | -          |
| GET    | `/auth/profile`  | Get current user profile       | auth       |
| PUT    | `/auth/profile`  | Update user profile            | auth       |
| POST   | `/auth/logout`   | (Optional) Logout, clear token | auth       |

## 2. Favorite

| Method | Endpoint         | Description                        | Middleware |
| ------ | ---------------- | ---------------------------------- | ---------- |
| GET    | `/favorites`     | Get list of user favorite products | auth       |
| POST   | `/favorites/:id` | Add product to favorites           | auth       |
| DELETE | `/favorites/:id` | Remove product from favorites      | auth       |

## 3. Store & Product & Category

| Method | Endpoint          | Description            | Middleware  |
| ------ | ----------------- | ---------------------- | ----------- |
| POST   | `/store`          | Create new store       | auth(store) |
| GET    | `/store/:id`      | Get store info         | -           |
| PUT    | `/store/:id`      | Update store info      | auth(store) |
| DELETE | `/store/:id`      | Delete store           | auth(store) |
| GET    | `/stores`         | List all stores        | -           |
| POST   | `/category`       | Create category        | auth(admin) |
| GET    | `/categories`     | List categories        | -           |
| POST   | `/store/products` | Create new product     | auth(store) |
| GET    | `/store/products` | List products by store | auth(store) |
| GET    | `/products`       | Explore all products   | -           |
| GET    | `/products/:id`   | Get product detail     | -           |
| PUT    | `/products/:id`   | Update product         | auth(store) |
| DELETE | `/products/:id`   | Delete product         | auth(store) |

## 4. Cart

| Method | Endpoint        | Description             | Middleware |
| ------ | --------------- | ----------------------- | ---------- |
| GET    | `/cart`         | View current cart       | auth       |
| POST   | `/cart`         | Add item to cart        | auth       |
| PUT    | `/cart/:itemId` | Update quantity in cart | auth       |
| DELETE | `/cart/:itemId` | Remove item from cart   | auth       |

## 5. Order & OrderItem

| Method | Endpoint             | Description               | Middleware |
| ------ | -------------------- | ------------------------- | ---------- |
| POST   | `/order`             | Create order from cart    | auth       |
| GET    | `/order/history`     | View user's order history | auth       |
| GET    | `/order/:id`         | View order detail         | auth       |
| POST   | `/order/refund/:id`  | Request refund            | auth       |
| POST   | `/order/payment/:id` | (Mock) Process payment    | auth       |

## 6. Feedback

| Method | Endpoint    | Description               | Middleware |
| ------ | ----------- | ------------------------- | ---------- |
| POST   | `/feedback` | Submit feedback           | auth       |
| GET    | `/feedback` | List feedbacks (filtered) | Public     |

## 7. Report (System Operations)

| Method | Endpoint             | Description                        | Middleware  |
| ------ | -------------------- | ---------------------------------- | ----------- |
| POST   | `/report`            | Submit report (product/user/store) | auth        |
| GET    | `/admin/reports`     | View all reports                   | auth(admin) |
| PATCH  | `/admin/reports/:id` | Resolve report (mark as handled)   | auth(admin) |

## 8. Admin Actions

| Method | Endpoint              | Description              | Middleware  |
| ------ | --------------------- | ------------------------ | ----------- |
| PATCH  | `/admin/ban/:id`      | Ban user or store        | auth(admin) |
| DELETE | `/admin/products/:id` | Remove violating product | auth(admin) |

## 9. RewardPoint & Discount

| Method | Endpoint               | Description                  | Middleware  |
| ------ | ---------------------- | ---------------------------- | ----------- |
| GET    | `/reward`              | View reward points           | auth        |
| POST   | `/reward/add/:orderId` | Add reward points from order | auth        |
| POST   | `/reward/redeem`       | Redeem reward points         | auth        |
| GET    | `/discount`            | List discount codes          | Public      |
| POST   | `/discount`            | Create discount code         | auth(admin) |
| PUT    | `/discount/:id`        | Update discount              | auth(admin) |
| DELETE | `/discount/:id`        | Delete discount              | auth(admin) |
