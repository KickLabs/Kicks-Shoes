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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
```

## Store Schema

```javascript
const StoreSchema = new Schema({
  owner_id: { type: Schema.Types.ObjectId, ref: "User" },
  name: String,
  description: String,
  address: String,
  contact: String,
  logo: String,
  banner: String,
  rating: { type: Number, default: 0 },
  status: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
```

## Category Schema

```javascript
const CategorySchema = new Schema({
  name: { type: String, required: true },
  description: String,
  image: String,
  status: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
```

## Order Schema

```javascript
const OrderSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ],
    default: "pending",
  },
  total_price: Number,
  shipping_address: String,
  payment_method: String,
  payment_status: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  tracking_number: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
```

## Order Item Schema

```javascript
const OrderItemSchema = new Schema({
  order_id: { type: Schema.Types.ObjectId, ref: "Order" },
  product_id: { type: Schema.Types.ObjectId, ref: "Product" },
  quantity: Number,
  price: Number,
  size: String,
  color: String,
  created_at: { type: Date, default: Date.now },
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
      size: String,
      color: String,
    },
  ],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
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
  created_at: { type: Date, default: Date.now },
});
```

## Feedback Schema

```javascript
const FeedbackSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User" },
  product_id: { type: Schema.Types.ObjectId, ref: "Product" },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  images: [String],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
```

## Reward Point Schema

```javascript
const RewardPointSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User" },
  points: Number,
  type: { type: String, enum: ["earn", "redeem"] },
  description: String,
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
  refund_image: [String],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "completed"],
    default: "pending",
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
```

## Discount Schema

```javascript
const DiscountSchema = new Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ["percentage", "fixed"], required: true },
  value: { type: Number, required: true },
  min_order_value: Number,
  max_discount: Number,
  start_date: Date,
  end_date: Date,
  usage_limit: Number,
  used_count: { type: Number, default: 0 },
  status: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
```

## Report Schema

```javascript
const ReportSchema = new Schema({
  reported_by: { type: Schema.Types.ObjectId, ref: "User" },
  target_type: { type: String, enum: ["product", "store", "user"] },
  target_id: Schema.Types.ObjectId,
  reason: String,
  description: String,
  status: {
    type: String,
    enum: ["pending", "investigating", "resolved", "dismissed"],
    default: "pending",
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
```

# API Endpoints Documentation

## 1. Authentication & User Management

| Method | Endpoint             | Description                | Middleware  |
| ------ | -------------------- | -------------------------- | ----------- |
| POST   | `/api/auth/register` | Register a new user        | -           |
| POST   | `/api/auth/login`    | Login and return token     | -           |
| GET    | `/api/auth/profile`  | Get current user profile   | auth        |
| PUT    | `/api/auth/profile`  | Update user profile        | auth        |
| POST   | `/api/auth/logout`   | Logout and clear token     | auth        |
| GET    | `/api/users`         | Get all users (admin only) | auth(admin) |
| PUT    | `/api/users/:id`     | Update user (admin only)   | auth(admin) |
| DELETE | `/api/users/:id`     | Delete user (admin only)   | auth(admin) |

## 2. Store Management

| Method | Endpoint                   | Description        | Middleware |
| ------ | -------------------------- | ------------------ | ---------- |
| POST   | `/api/stores`              | Create new store   | auth(shop) |
| GET    | `/api/stores`              | List all stores    | -          |
| GET    | `/api/stores/:id`          | Get store details  | -          |
| PUT    | `/api/stores/:id`          | Update store       | auth(shop) |
| DELETE | `/api/stores/:id`          | Delete store       | auth(shop) |
| GET    | `/api/stores/:id/products` | Get store products | -          |

## 3. Product Management

| Method | Endpoint               | Description         | Middleware |
| ------ | ---------------------- | ------------------- | ---------- |
| POST   | `/api/products`        | Create new product  | auth(shop) |
| GET    | `/api/products`        | List all products   | -          |
| GET    | `/api/products/:id`    | Get product details | -          |
| PUT    | `/api/products/:id`    | Update product      | auth(shop) |
| DELETE | `/api/products/:id`    | Delete product      | auth(shop) |
| GET    | `/api/products/search` | Search products     | -          |
| GET    | `/api/products/filter` | Filter products     | -          |

## 4. Category Management

| Method | Endpoint              | Description          | Middleware  |
| ------ | --------------------- | -------------------- | ----------- |
| POST   | `/api/categories`     | Create category      | auth(admin) |
| GET    | `/api/categories`     | List all categories  | -           |
| GET    | `/api/categories/:id` | Get category details | -           |
| PUT    | `/api/categories/:id` | Update category      | auth(admin) |
| DELETE | `/api/categories/:id` | Delete category      | auth(admin) |

## 5. Cart Management

| Method | Endpoint            | Description      | Middleware |
| ------ | ------------------- | ---------------- | ---------- |
| GET    | `/api/cart`         | Get cart items   | auth       |
| POST   | `/api/cart`         | Add item to cart | auth       |
| PUT    | `/api/cart/:itemId` | Update cart item | auth       |
| DELETE | `/api/cart/:itemId` | Remove cart item | auth       |
| DELETE | `/api/cart`         | Clear cart       | auth       |

## 6. Order Management

| Method | Endpoint                 | Description         | Middleware |
| ------ | ------------------------ | ------------------- | ---------- |
| POST   | `/api/orders`            | Create new order    | auth       |
| GET    | `/api/orders`            | Get user orders     | auth       |
| GET    | `/api/orders/:id`        | Get order details   | auth       |
| PUT    | `/api/orders/:id`        | Update order status | auth(shop) |
| POST   | `/api/orders/:id/cancel` | Cancel order        | auth       |
| POST   | `/api/orders/:id/refund` | Request refund      | auth       |

## 7. Favorite Management

| Method | Endpoint             | Description           | Middleware |
| ------ | -------------------- | --------------------- | ---------- |
| GET    | `/api/favorites`     | Get user favorites    | auth       |
| POST   | `/api/favorites/:id` | Add to favorites      | auth       |
| DELETE | `/api/favorites/:id` | Remove from favorites | auth       |

## 8. Feedback Management

| Method | Endpoint            | Description          | Middleware |
| ------ | ------------------- | -------------------- | ---------- |
| POST   | `/api/feedback`     | Submit feedback      | auth       |
| GET    | `/api/feedback`     | Get product feedback | -          |
| PUT    | `/api/feedback/:id` | Update feedback      | auth       |
| DELETE | `/api/feedback/:id` | Delete feedback      | auth       |

## 9. Reward Points & Discounts

| Method | Endpoint              | Description             | Middleware  |
| ------ | --------------------- | ----------------------- | ----------- |
| GET    | `/api/rewards`        | Get user rewards        | auth        |
| POST   | `/api/rewards/redeem` | Redeem points           | auth        |
| GET    | `/api/discounts`      | Get available discounts | -           |
| POST   | `/api/discounts`      | Create discount (admin) | auth(admin) |
| PUT    | `/api/discounts/:id`  | Update discount         | auth(admin) |
| DELETE | `/api/discounts/:id`  | Delete discount         | auth(admin) |

## 10. Report Management

| Method | Endpoint           | Description          | Middleware  |
| ------ | ------------------ | -------------------- | ----------- |
| POST   | `/api/reports`     | Submit report        | auth        |
| GET    | `/api/reports`     | Get reports (admin)  | auth(admin) |
| PUT    | `/api/reports/:id` | Update report status | auth(admin) |
| DELETE | `/api/reports/:id` | Delete report        | auth(admin) |
