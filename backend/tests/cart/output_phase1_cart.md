# Cart – Technical & Testing Analysis (Backend)

## 1. Feature Overview

### Business Purpose

Cart is a shopping cart feature that allows authenticated users to store products they want to purchase. Each user has their own cart with the ability to:

- Add/update products with variants (size, color)
- Adjust quantities
- Remove products from cart
- Automatically calculate total price
- Remove ordered items

### Key Business Rules

1. **Authentication Required**: All cart operations require logged-in and verified users
2. **One Cart Per User**: Each user has only one cart
3. **Product Variants**: Each cart item must have product, size, color, price, quantity
4. **Quantity Validation**: Quantity must be >= 1
5. **Price Validation**: Price must be >= 0
6. **Auto Cleanup**: Items with deleted products are automatically removed
7. **Auto Calculation**: TotalPrice is automatically calculated from items

### Success Criteria

- ✅ Users can add products to cart with complete variant information
- ✅ Duplicate items (same product, size, color) have quantities merged
- ✅ TotalPrice is always accurate
- ✅ Invalid items are automatically cleaned up
- ✅ Cart operations are thread-safe (concurrent modifications)

### Why Important for Testing

- **High User Impact**: Cart is a core feature directly affecting checkout flow
- **Data Integrity**: Errors in cart lead to incorrect orders and revenue loss
- **Complex State Management**: Many edge cases regarding quantity, variants, deleted products
- **Performance Critical**: Frequent updates require handling concurrent requests

---

## 2. Related Files, Components & Modules

| File/Path                                    | Layer        | Responsibility                                 | Key Methods/Exports                                                                                             |
| -------------------------------------------- | ------------ | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `backend/src/models/Cart.js`                 | Model/Schema | Define Cart schema, validation, pre-save hooks | `Cart` model, `cartSchema.pre('save')`                                                                          |
| `backend/src/controllers/cartController.js`  | Controller   | Business logic for cart operations             | `getCart`, `addOrUpdateItem`, `updateCartItem`, `removeCartItem`, `removeOrderedItems`, `recalculateTotalPrice` |
| `backend/src/routes/cartRoutes.js`           | Routes       | API endpoints for cart                         | `GET /`, `POST /`, `PUT /:itemId`, `DELETE /:itemId`, `POST /remove-ordered`                                    |
| `backend/src/middlewares/auth.middleware.js` | Middleware   | Authentication & authorization                 | `protect`                                                                                                       |
| `backend/src/models/Product.js`              | Model/Schema | Product schema (dependency)                    | `Product` model, inventory methods                                                                              |
| `backend/src/models/User.js`                 | Model/Schema | User schema (dependency)                       | `User` model                                                                                                    |

### Dependencies

- **Mongoose**: ODM for MongoDB
- **JWT**: Authentication via `protect` middleware
- **Product Model**: Cart items reference Product (populated)
- **User Model**: Cart belongs to User

---

## 3. Core Functions / Methods to Test

### 3.1. `getCart(req, res)` - Get user's cart

**Purpose:** Return user's cart, automatically create if doesn't exist, cleanup invalid items

**Inputs:**

- `req.user.id` (String/ObjectId) - User ID from auth middleware

**Outputs:**

- **200**: Cart object with items populated with product details
  ```json
  {
    "_id": "cart_id",
    "user": "user_id",
    "items": [
      {
        "_id": "item_id",
        "product": {
          /* populated product */
        },
        "quantity": 2,
        "size": "42",
        "color": "Black",
        "price": 1500000,
        "image": "url"
      }
    ],
    "totalPrice": 3000000,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```
- **500**: Error message

**State Changes:**

- Create new cart if doesn't exist
- Cleanup items with product = null/undefined
- Recalculate totalPrice if cleanup occurred

**Edge Cases:**

1. User has no cart → create new empty cart
2. Cart has items but product was deleted → cleanup items
3. Cart items have null product → filter out
4. User not authenticated → middleware returns 401

**Dependencies to Mock:**

- `Cart.findOne()`, `Cart.populate()`
- `req.user.id`
- `Product` model (via populate)

---

### 3.2. `addOrUpdateItem(req, res)` - Add or update item in cart

**Purpose:** Add new product to cart or increase quantity if item exists (same product, size, color)

**Inputs:**

- `req.user.id` (String/ObjectId)
- `req.body`:
  ```json
  {
    "product": "product_id",
    "quantity": 1,
    "size": "42",
    "color": "Black",
    "price": 1500000,
    "image": "optional_image_url"
  }
  ```

**Validation Rules:**

- `product`: required
- `quantity`: required, >= 1
- `size`: required (String)
- `color`: required (String)
- `price`: required, >= 0

**Outputs:**

- **200**: Updated cart with populated items
- **400**: Validation error messages
- **500**: Server error

**State Changes:**

- Create new cart if doesn't exist
- If item exists (same product, size, color) → **increase quantity**
- If new item → **push to items array**
- Recalculate totalPrice
- Cleanup invalid items before processing

**Edge Cases:**

1. **Duplicate item detection**: Same product + size + color → merge quantity
2. **New item**: Different size/color → add new item
3. **Missing required fields** → 400 error
4. **Negative quantity** → 400 error
5. **Negative price** → 400 error
6. **Invalid product ID** → item added but populate will be null
7. **Cart doesn't exist** → create new
8. **Cleanup invalid items** before adding

**Dependencies to Mock:**

- `Cart.findOne()`, `Cart.save()`, `Cart.findById().populate()`
- `req.user.id`, `req.body`

---

### 3.3. `updateCartItem(req, res)` - Update specific item information

**Purpose:** Update quantity, size, color, price of an existing cart item

**Inputs:**

- `req.user.id` (String/ObjectId)
- `req.params.itemId` (String/ObjectId) - Cart item \_id
- `req.body` (partial update):
  ```json
  {
    "quantity": 3, // optional
    "size": "43", // optional
    "color": "Red", // optional
    "price": 1600000 // optional
  }
  ```

**Outputs:**

- **200**: Updated cart
- **404**: Cart not found / Item not found
- **500**: Server error

**State Changes:**

- Update item fields if provided
- Recalculate totalPrice
- Return cart with populated products

**Edge Cases:**

1. **Item doesn't exist** → 404
2. **Cart doesn't exist** → 404
3. **Update quantity = 0** → item still exists (no auto remove)
4. **Update multiple fields at once** → OK
5. **No fields in body** → item unchanged
6. **Invalid itemId format** → 500 or 404
7. **Update size/color same as another item** → may create duplicates

**Dependencies to Mock:**

- `Cart.findOne()`, `cart.items.id()`, `Cart.findById().populate()`
- `req.user.id`, `req.params.itemId`, `req.body`

---

### 3.4. `removeCartItem(req, res)` - Remove item from cart

**Purpose:** Remove a specific cart item from the shopping cart

**Inputs:**

- `req.user.id` (String/ObjectId)
- `req.params.itemId` (String/ObjectId)

**Outputs:**

- **200**: Updated cart after removal
- **404**: Cart not found
- **500**: Server error

**State Changes:**

- Filter item out of items array
- Recalculate totalPrice
- If all items removed → empty cart but still exists

**Edge Cases:**

1. **Item doesn't exist** → filter no match, cart unchanged
2. **Cart doesn't exist** → 404
3. **Remove last item** → cart.items = []
4. **Invalid itemId** → filter no match

**Dependencies to Mock:**

- `Cart.findOne()`, `Cart.save()`, `Cart.findById().populate()`

---

### 3.5. `removeOrderedItems(req, res)` - Remove ordered items

**Purpose:** After successful checkout, remove ordered items from cart

**Inputs:**

- `req.user.id` (String/ObjectId)
- `req.body.orderedItems` (Array of item objects/IDs):
  ```json
  {
    "orderedItems": [{ "_id": "item_id_1" }, { "id": "item_id_2" }]
  }
  ```

**Outputs:**

- **200**: Updated cart
- **400**: orderedItems not array or missing
- **500**: Server error

**State Changes:**

- Filter out items with \_id in orderedItems list
- Recalculate totalPrice
- Create new empty cart if doesn't exist

**Edge Cases:**

1. **orderedItems empty array** → nothing removed
2. **orderedItems not array** → 400
3. **orderedItems missing** → 400
4. **Item IDs don't exist in cart** → ignore
5. **Cart doesn't exist** → create empty cart
6. **Mixed \_id and id formats** → code handles both

**Dependencies to Mock:**

- `Cart.findOne()`, `Cart.save()`, `Cart.findById().populate()`

---

### 3.6. `recalculateTotalPrice(cart)` - Helper function

**Purpose:** Recalculate totalPrice from items array

**Inputs:**

- `cart` (Cart document)

**Logic:**

```javascript
cart.totalPrice = cart.items.reduce((total, item) => {
  return total + item.price * item.quantity;
}, 0);
```

**Edge Cases:**

1. Empty items array → totalPrice = 0
2. Items with price = 0 → OK
3. Items with quantity = 0 → contribute 0

---

### 3.7. Cart Model Pre-save Hook

**Purpose:** Auto calculate totalPrice before save

**Location:** `backend/src/models/Cart.js` lines 63-68

```javascript
cartSchema.pre('save', function (next) {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
  next();
});
```

**Test Cases:**

- TotalPrice calculated correctly on save
- Empty items → totalPrice = 0

---

## 4. Test Case Matrix

### A. Unit Tests - Controller Functions

| Category               | Scenario                              | Pre-condition                           | Input                                            | Expected Output/Behavior                       |
| ---------------------- | ------------------------------------- | --------------------------------------- | ------------------------------------------------ | ---------------------------------------------- |
| **getCart**            |                                       |                                         |                                                  |                                                |
| Happy                  | User has cart with valid items        | Cart exists, items valid                | `req.user.id`                                    | 200, cart object with populated items          |
| Happy                  | User has no cart                      | Cart doesn't exist                      | `req.user.id`                                    | 200, new empty cart created                    |
| Edge                   | Cart has items but product deleted    | Cart has items, product = null          | `req.user.id`                                    | 200, items cleaned up, totalPrice recalculated |
| Edge                   | Cart has mixed valid/invalid items    | Mixed valid/invalid items               | `req.user.id`                                    | 200, only valid items, totalPrice correct      |
| Error                  | Database error                        | MongoDB connection fail                 | `req.user.id`                                    | 500, error message                             |
| **addOrUpdateItem**    |                                       |                                         |                                                  |                                                |
| Happy                  | Add new item to cart                  | Cart exists, item not present           | Valid item data                                  | 200, item added, totalPrice updated            |
| Happy                  | Add item to empty cart                | Empty cart                              | Valid item data                                  | 200, item added                                |
| Happy                  | Cart doesn't exist                    | No cart                                 | Valid item data                                  | 200, new cart created with item                |
| Happy                  | Update quantity of existing item      | Item exists (same product, size, color) | Same variant, quantity +1                        | 200, quantity increased, totalPrice updated    |
| Happy                  | Add different variant of same product | Product has different variant           | Same product, different size                     | 200, new item added                            |
| Edge                   | Add item with large quantity          | Cart exists                             | `quantity: 999`                                  | 200, item added with quantity 999              |
| Edge                   | Add item with price = 0               | Cart exists                             | `price: 0`                                       | 200, item added                                |
| Edge                   | Optional image field missing          | Cart exists                             | No `image` in body                               | 200, item added without image                  |
| Edge                   | Optional image field provided         | Cart exists                             | With `image` in body                             | 200, item added with image                     |
| Edge                   | Cleanup invalid items before add      | Cart has invalid items                  | Valid new item                                   | 200, old invalid items cleaned, new item added |
| Error                  | Missing product field                 | Cart exists                             | No `product`                                     | 400, "Product is required"                     |
| Error                  | Missing quantity field                | Cart exists                             | No `quantity`                                    | 400, "Valid quantity is required"              |
| Error                  | Quantity < 1                          | Cart exists                             | `quantity: 0`                                    | 400, "Valid quantity is required"              |
| Error                  | Quantity < 1 (negative)               | Cart exists                             | `quantity: -1`                                   | 400, "Valid quantity is required"              |
| Error                  | Missing size field                    | Cart exists                             | No `size`                                        | 400, "Size is required"                        |
| Error                  | Missing color field                   | Cart exists                             | No `color`                                       | 400, "Color is required"                       |
| Error                  | Missing price field                   | Cart exists                             | No `price`                                       | 400, "Valid price is required"                 |
| Error                  | Price < 0                             | Cart exists                             | `price: -100`                                    | 400, "Valid price is required"                 |
| Error                  | Database save error                   | MongoDB error                           | Valid data                                       | 500, error message                             |
| **updateCartItem**     |                                       |                                         |                                                  |                                                |
| Happy                  | Update item quantity                  | Cart has item                           | `{ quantity: 5 }`                                | 200, quantity updated, totalPrice recalculated |
| Happy                  | Update item size                      | Cart has item                           | `{ size: "43" }`                                 | 200, size updated                              |
| Happy                  | Update item color                     | Cart has item                           | `{ color: "Red" }`                               | 200, color updated                             |
| Happy                  | Update item price                     | Cart has item                           | `{ price: 2000000 }`                             | 200, price updated                             |
| Happy                  | Update multiple fields at once        | Cart has item                           | `{ quantity: 2, size: "44" }`                    | 200, all fields updated                        |
| Edge                   | Update with empty body                | Cart has item                           | `{}`                                             | 200, item unchanged                            |
| Edge                   | Update quantity = 0                   | Cart has item                           | `{ quantity: 0 }`                                | 200, item still exists (not removed)           |
| Edge                   | Update with undefined fields          | Cart has item                           | `{ quantity: undefined }`                        | 200, field unchanged                           |
| Error                  | Cart doesn't exist                    | No cart                                 | Valid itemId                                     | 404, "Cart not found"                          |
| Error                  | Item doesn't exist in cart            | Cart exists                             | Invalid itemId                                   | 404, "Item not found"                          |
| Error                  | Invalid itemId format                 | Cart exists                             | `itemId: "invalid"`                              | 500 or 404                                     |
| **removeCartItem**     |                                       |                                         |                                                  |                                                |
| Happy                  | Remove item from cart                 | Cart has multiple items                 | Valid itemId                                     | 200, item removed, totalPrice recalculated     |
| Happy                  | Remove last item                      | Cart has 1 item                         | Valid itemId                                     | 200, cart.items = [], totalPrice = 0           |
| Edge                   | Remove non-existent item              | Cart has items                          | Invalid itemId                                   | 200, cart unchanged                            |
| Edge                   | Filter logic with multiple items      | Cart has 5 items                        | Remove 1 item                                    | 200, 4 items remain                            |
| Error                  | Cart doesn't exist                    | No cart                                 | Valid itemId                                     | 404, "Cart not found"                          |
| **removeOrderedItems** |                                       |                                         |                                                  |                                                |
| Happy                  | Remove 1 ordered item                 | Cart has multiple items                 | `orderedItems: [{ _id: "id1" }]`                 | 200, 1 item removed                            |
| Happy                  | Remove multiple ordered items         | Cart has multiple items                 | `orderedItems: [{ _id: "id1" }, { _id: "id2" }]` | 200, 2 items removed                           |
| Happy                  | Remove all items                      | Cart has items                          | orderedItems = all items                         | 200, cart.items = []                           |
| Happy                  | Cart doesn't exist                    | No cart                                 | Valid orderedItems                               | 200, new empty cart created                    |
| Edge                   | orderedItems empty                    | Cart has items                          | `orderedItems: []`                               | 200, no items removed                          |
| Edge                   | orderedItems has non-existent IDs     | Cart has items                          | Invalid IDs                                      | 200, cart unchanged                            |
| Edge                   | Mixed \_id and id format              | Cart has items                          | Some use `_id`, some use `id`                    | 200, both formats work                         |
| Error                  | orderedItems not array                | Cart has items                          | `orderedItems: "string"`                         | 400, "Ordered items array is required"         |
| Error                  | orderedItems missing                  | Cart has items                          | No orderedItems                                  | 400, "Ordered items array is required"         |

### B. Integration Tests - API Endpoints

| Category                      | Scenario                        | Setup                    | Request                                 | Expected Response                 |
| ----------------------------- | ------------------------------- | ------------------------ | --------------------------------------- | --------------------------------- |
| **GET /cart**                 |                                 |                          |                                         |                                   |
| Happy                         | Get cart when authenticated     | User logged in, has cart | `GET /cart` with auth token             | 200, cart data                    |
| Happy                         | Get cart first time             | User logged in, no cart  | `GET /cart` with auth token             | 200, empty cart created           |
| Auth                          | Get cart without token          | No auth                  | `GET /cart` no token                    | 401, "No valid token provided"    |
| Auth                          | Get cart with invalid token     | Invalid token            | `GET /cart` bad token                   | 401, "Not authorized"             |
| Auth                          | Get cart with blacklisted token | Token logged out         | `GET /cart` blacklisted token           | 401, "Token has been invalidated" |
| **POST /cart**                |                                 |                          |                                         |                                   |
| Happy                         | Add item to cart                | User logged in           | `POST /cart` with valid item data       | 200, updated cart                 |
| Happy                         | Add duplicate item              | Item exists              | `POST /cart` same variant               | 200, quantity merged              |
| Error                         | Add item missing fields         | User logged in           | `POST /cart` missing required           | 400, validation error             |
| Auth                          | Add item without token          | No auth                  | `POST /cart` no token                   | 401                               |
| **PUT /cart/:itemId**         |                                 |                          |                                         |                                   |
| Happy                         | Update item quantity            | User has item in cart    | `PUT /cart/:itemId` with new quantity   | 200, updated cart                 |
| Error                         | Update non-existent item        | User has cart            | `PUT /cart/invalid_id`                  | 404, "Item not found"             |
| Auth                          | Update item without token       | No auth                  | `PUT /cart/:itemId`                     | 401                               |
| **DELETE /cart/:itemId**      |                                 |                          |                                         |                                   |
| Happy                         | Remove item                     | User has item            | `DELETE /cart/:itemId`                  | 200, item removed                 |
| Error                         | Remove non-existent item        | User has cart            | `DELETE /cart/invalid_id`               | 200, cart unchanged               |
| Auth                          | Remove item without token       | No auth                  | `DELETE /cart/:itemId`                  | 401                               |
| **POST /cart/remove-ordered** |                                 |                          |                                         |                                   |
| Happy                         | Remove ordered items            | User checked out         | `POST /cart/remove-ordered` with items  | 200, items removed                |
| Error                         | Remove with invalid data        | User has cart            | `POST /cart/remove-ordered` with string | 400                               |
| Auth                          | Remove without token            | No auth                  | `POST /cart/remove-ordered`             | 401                               |

### C. Edge Cases & Error Handling

| Category             | Scenario                                | Test Approach                                            |
| -------------------- | --------------------------------------- | -------------------------------------------------------- |
| **Concurrency**      | 2 requests add same item simultaneously | Race condition test, verify quantity increases correctly |
| **Concurrency**      | Update and Delete simultaneously        | Verify final state consistency                           |
| **Data Integrity**   | Product deleted after being in cart     | Verify cleanup on getCart                                |
| **Data Integrity**   | Price changes in Product model          | Cart keeps old price (snapshot pricing)                  |
| **Large Data**       | Cart with 100+ items                    | Performance test, verify calculations                    |
| **Invalid ObjectId** | ItemId not valid ObjectId               | Should handle gracefully                                 |
| **Mongoose Errors**  | Duplicate key, validation errors        | Proper error responses                                   |

---

## 5. Test Priority Recommendation

### 🔴 **HIGH Priority** (Must Test First)

| Module/Function           | Reason                                                                       | Business Risk                                                           |
| ------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `addOrUpdateItem`         | Core functionality, many validation rules, complex duplicate detection logic | **CRITICAL** - Wrong merge logic can lose data or miscalculate quantity |
| `getCart` auto cleanup    | Cleaning invalid items is critical for data integrity                        | **HIGH** - Invalid items cause checkout errors                          |
| `recalculateTotalPrice`   | Price calculation directly affects revenue                                   | **CRITICAL** - Wrong price = lost money                                 |
| Authentication middleware | Cart data security                                                           | **CRITICAL** - Data leakage to other users                              |
| `removeOrderedItems`      | Related to checkout flow                                                     | **HIGH** - Items not removed confuse users                              |

### 🟡 **MEDIUM Priority**

| Module/Function        | Reason                                    | Business Risk                                       |
| ---------------------- | ----------------------------------------- | --------------------------------------------------- |
| `updateCartItem`       | Less frequently used, simpler logic       | **MEDIUM** - Users can workaround with remove + add |
| `removeCartItem`       | Simple logic, but edge cases need testing | **MEDIUM** - Affects UX but not critical            |
| Cart Model validations | Schema validation built-in                | **LOW-MEDIUM** - Mongoose auto validates            |
| Pre-save hooks         | Backup for recalculateTotalPrice          | **MEDIUM** - Safety net                             |

### 🟢 **LOW Priority**

| Module/Function          | Reason                    | Business Risk |
| ------------------------ | ------------------------- | ------------- |
| Error message formatting | UX improvement            | **LOW**       |
| Populate options         | Standard Mongoose feature | **LOW**       |
| Console logs             | Debug only                | **NONE**      |

---

## 6. Mocking & Test Data Preparation

### A. Dependencies to Mock

| Dependency                 | What to Mock                                      | Mocking Strategy                     | Sample Mock Data                                                             |
| -------------------------- | ------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| **Mongoose Cart Model**    | `findOne()`, `save()`, `findById()`, `populate()` | Jest mock or `mongodb-memory-server` | See below                                                                    |
| **Mongoose Product Model** | Product documents for populate                    | Mock product objects                 | See below                                                                    |
| **Mongoose User Model**    | User documents                                    | Mock user object                     | `{ _id: 'user123', email: 'test@test.com', isVerified: true, status: true }` |
| **Auth Middleware**        | `req.user`                                        | Mock `req.user = { id: 'user123' }`  | User object                                                                  |
| **Request Object**         | `req.body`, `req.params`, `req.user`              | Mock express request                 | See test examples                                                            |
| **Response Object**        | `res.json()`, `res.status()`                      | Jest mock functions                  | `const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }`        |

### B. Sample Mock Data

#### Mock User

```javascript
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'testuser@example.com',
  name: 'Test User',
  role: 'user',
  isVerified: true,
  status: true,
};
```

#### Mock Product

```javascript
const mockProduct = {
  _id: '507f1f77bcf86cd799439012',
  name: 'Nike Air Max 90',
  brand: 'Nike',
  price: {
    regular: 2000000,
    isOnSale: false,
    discountPercent: 0,
  },
  variants: {
    sizes: ['40', '41', '42', '43'],
    colors: ['Black', 'White', 'Red'],
  },
  images: ['https://example.com/image1.jpg'],
  mainImage: 'https://example.com/main.jpg',
  stock: 100,
  productType: 'shoes',
  status: true,
};
```

#### Mock Cart (Empty)

```javascript
const mockEmptyCart = {
  _id: '507f1f77bcf86cd799439013',
  user: '507f1f77bcf86cd799439011',
  items: [],
  totalPrice: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn().mockResolvedValue(this),
};
```

#### Mock Cart (With Items)

```javascript
const mockCartWithItems = {
  _id: '507f1f77bcf86cd799439013',
  user: '507f1f77bcf86cd799439011',
  items: [
    {
      _id: '507f1f77bcf86cd799439014',
      product: '507f1f77bcf86cd799439012', // Reference to mockProduct
      quantity: 2,
      size: '42',
      color: 'Black',
      price: 2000000,
      image: 'https://example.com/black.jpg',
    },
    {
      _id: '507f1f77bcf86cd799439015',
      product: '507f1f77bcf86cd799439012',
      quantity: 1,
      size: '43',
      color: 'Red',
      price: 2000000,
      image: 'https://example.com/red.jpg',
    },
  ],
  totalPrice: 6000000, // 2*2000000 + 1*2000000
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn(),
  populate: jest.fn().mockReturnThis(),
};
```

#### Mock Cart Item (for addOrUpdateItem)

```javascript
const mockNewItem = {
  product: '507f1f77bcf86cd799439012',
  quantity: 1,
  size: '42',
  color: 'Black',
  price: 2000000,
  image: 'https://example.com/black.jpg',
};
```

### C. Test Utilities / Helpers

#### Helper: Create Mock Request

```javascript
const createMockRequest = (user, body = {}, params = {}) => ({
  user: user || mockUser,
  body,
  params,
  headers: {
    authorization: 'Bearer valid_token',
  },
});
```

#### Helper: Create Mock Response

```javascript
const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
```

#### Helper: Reset Mocks

```javascript
const resetAllMocks = () => {
  jest.clearAllMocks();
  Cart.findOne.mockReset();
  Cart.findById.mockReset();
  // ... reset other mocks
};
```

### D. Database Setup (Integration Tests)

**Option 1: mongodb-memory-server** (Recommended)

```javascript
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

**Option 2: Jest Mock** (Unit Tests)

```javascript
jest.mock('../models/Cart.js');
jest.mock('../models/Product.js');
jest.mock('../models/User.js');

// In test file
Cart.findOne = jest.fn();
Cart.prototype.save = jest.fn();
```

---

## 7. Suggested Test File Structure

```
backend/tests/cart/
├── unit/
│   ├── cart.controller.test.js        # Unit tests for controller functions
│   ├── cart.model.test.js             # Unit tests for model, schema, hooks
│   └── cart.helpers.test.js           # Unit tests for helper functions
├── integration/
│   ├── cart.api.test.js               # Integration tests for API endpoints
│   ├── cart.auth.test.js              # Auth flow integration tests
│   └── cart.concurrent.test.js        # Concurrent modification tests
├── edge-cases/
│   ├── cart.cleanup.test.js           # Edge cases for cleanup invalid items
│   ├── cart.validation.test.js        # Edge cases for validation
│   └── cart.data-integrity.test.js    # Edge cases for data integrity
└── helpers/
    ├── cart.mocks.js                  # Mock data and mock functions
    └── cart.testUtils.js              # Test utilities
```

---

## 8. Suggested Next Prompts

### 🔹 Prompt 1: Generate Unit Tests for Cart Controller

```
Create detailed unit tests for backend/src/controllers/cartController.js with requirements:

1. Test all 5 functions: getCart, addOrUpdateItem, updateCartItem, removeCartItem, removeOrderedItems
2. Use Jest + mongodb-memory-server
3. Mock dependencies: Cart model, Product model, req/res objects
4. Cover all test cases in Test Case Matrix (Happy path, Edge cases, Error cases)
5. Test coverage > 90%
6. Use mock data from "Mocking & Test Data Preparation" section
7. Test concurrent modifications for addOrUpdateItem
8. Test auto cleanup invalid items in getCart

Output file: backend/tests/cart/unit/cart.controller.test.js
```

### 🔹 Prompt 2: Generate Unit Tests for Cart Model

```
Create unit tests for Cart model (backend/src/models/Cart.js) including:

1. Schema validation tests:
   - Required fields (user, items)
   - Item validation (product, quantity >= 1, size, color, price >= 0)
   - TotalPrice validation (>= 0)

2. Pre-save hook tests:
   - Auto calculate totalPrice
   - Empty items → totalPrice = 0
   - Multiple items → correct sum

3. Index tests:
   - User index created

4. Edge cases:
   - Negative quantity → validation error
   - Negative price → validation error
   - Missing required fields → validation error

Output file: backend/tests/cart/unit/cart.model.test.js
```

### 🔹 Prompt 3: Generate Integration Tests for Cart API

```
Create integration tests (E2E) for Cart API endpoints with requirements:

1. Setup mongodb-memory-server + express app
2. Test all routes in cartRoutes.js:
   - GET /cart
   - POST /cart
   - PUT /cart/:itemId
   - DELETE /cart/:itemId
   - POST /cart/remove-ordered

3. Test authentication flow:
   - Valid token → 200
   - No token → 401
   - Invalid token → 401
   - Blacklisted token → 401

4. Test full user flow:
   - User login → get cart → add items → update quantity → checkout → remove ordered items

5. Test concurrent requests:
   - 2 users add items simultaneously (don't affect each other)
   - 1 user 2 requests add same item (quantity increases correctly)

Output file: backend/tests/cart/integration/cart.api.test.js
```

### 🔹 Prompt 4: Generate Edge Cases & Error Handling Tests

```
Create comprehensive edge case tests for Cart feature:

1. Data cleanup scenarios:
   - Cart has items with product = null → auto cleanup
   - Cart has items with deleted product → cleanup on getCart
   - Mixed valid/invalid items

2. Concurrent modification tests:
   - Race condition when adding duplicate items
   - Update and delete simultaneously
   - Multiple concurrent updates

3. Large data tests:
   - Cart with 100+ items
   - Verify performance < 1s
   - Verify totalPrice calculation correct

4. Invalid data handling:
   - Invalid ObjectId formats
   - Malformed request bodies
   - Type coercion issues

5. Database error scenarios:
   - MongoDB connection lost
   - Duplicate key errors
   - Validation errors from Mongoose

Output file: backend/tests/cart/edge-cases/cart.edge-cases.test.js
```

### 🔹 Prompt 5: Generate Mock Data & Test Utilities

```
Create utilities and mock data files for Cart tests:

1. Mock data generators:
   - mockUser(overrides)
   - mockProduct(overrides)
   - mockCart(itemCount, overrides)
   - mockCartItem(overrides)

2. Test helpers:
   - createMockRequest(user, body, params)
   - createMockResponse()
   - resetAllMocks()
   - setupTestDatabase()
   - teardownTestDatabase()
   - createAuthenticatedUser()

3. Assertion helpers:
   - expectCartToMatch(actual, expected)
   - expectTotalPriceCorrect(cart)
   - expectItemsValid(items)

4. Test fixtures:
   - Multiple pre-configured carts (empty, with 1 item, with multiple items)
   - Multiple pre-configured products
   - Multiple user types

Files:
- backend/tests/cart/helpers/cart.mocks.js
- backend/tests/cart/helpers/cart.testUtils.js
```

### 🔹 Prompt 6: Generate Test Coverage Report & Improvement Plan

```
Run test coverage for Cart feature and create improvement plan:

1. Run coverage: `npm test -- --coverage --collectCoverageFrom="src/controllers/cartController.js" --collectCoverageFrom="src/models/Cart.js"`

2. Analyze coverage report:
   - Identify untested branches
   - Identify untested edge cases
   - List missing test scenarios

3. Create improvement plan:
   - Priority list of test cases to add
   - Estimate effort
   - Dependencies

4. Generate missing tests to achieve 100% coverage

Output file: backend/tests/cart/coverage-report.md
```

---

## 9. Test Implementation Guidelines

### A. Naming Conventions

```javascript
// Test file naming
cart.controller.test.js
cart.model.test.js
cart.api.integration.test.js

// Test suite naming
describe('Cart Controller - getCart()', () => {
  describe('Happy Path', () => { ... });
  describe('Edge Cases', () => { ... });
  describe('Error Handling', () => { ... });
});

// Test case naming
it('should return existing cart with populated items when user has cart', async () => { ... });
it('should create new empty cart when user has no cart', async () => { ... });
it('should cleanup items with null product references', async () => { ... });
```

### B. AAA Pattern (Arrange-Act-Assert)

```javascript
it('should add new item to cart', async () => {
  // Arrange
  const mockReq = createMockRequest(mockUser, mockNewItem);
  const mockRes = createMockResponse();
  Cart.findOne.mockResolvedValue(mockEmptyCart);

  // Act
  await addOrUpdateItem(mockReq, mockRes);

  // Assert
  expect(mockRes.status).toHaveBeenCalledWith(200);
  expect(mockEmptyCart.items).toHaveLength(1);
  expect(mockEmptyCart.save).toHaveBeenCalled();
});
```

### C. Async/Await Best Practices

```javascript
// ✅ Good - properly await async operations
it('should handle async errors', async () => {
  Cart.findOne.mockRejectedValue(new Error('DB Error'));
  await addOrUpdateItem(mockReq, mockRes);
  expect(mockRes.status).toHaveBeenCalledWith(500);
});

// ❌ Bad - missing await
it('should handle async errors', () => {
  Cart.findOne.mockRejectedValue(new Error('DB Error'));
  addOrUpdateItem(mockReq, mockRes); // Missing await!
  expect(mockRes.status).toHaveBeenCalledWith(500); // Won't work
});
```

### D. Isolation & Cleanup

```javascript
describe('Cart Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any state
  });

  afterEach(() => {
    // Cleanup if needed
  });

  afterAll(async () => {
    // Close database connections
    await mongoose.disconnect();
  });
});
```

---

## 10. Performance & Security Considerations

### Performance Testing Checklist

- [ ] Test cart with 100+ items (must be < 1s response time)
- [ ] Test concurrent requests (10+ simultaneous adds)
- [ ] Test populate performance with many products
- [ ] Monitor memory usage with large datasets

### Security Testing Checklist

- [ ] Verify user can only access their own cart
- [ ] Test SQL/NoSQL injection in filters
- [ ] Test XSS in item data (size, color fields)
- [ ] Verify rate limiting (if present)
- [ ] Test token validation thoroughly

### Edge Cases Checklist

- [ ] Mongoose ObjectId validation
- [ ] Type coercion issues
- [ ] Empty array/object handling
- [ ] Null/undefined field handling
- [ ] Very large numbers (quantity, price)
- [ ] Special characters in strings

---

## 11. Integration with Checkout Flow

### Cart → Order Flow

When testing Cart, note integration with Order:

1. **removeOrderedItems** is called after order success
2. Cart maintains **snapshot pricing** (doesn't sync with Product price changes)
3. **Stock validation** should check at Order creation, not Cart

### Test Cases Integration

```javascript
describe('Cart-Order Integration', () => {
  it('should remove ordered items after successful checkout', async () => {
    // 1. User has cart with items
    // 2. User checkouts → create order
    // 3. Call removeOrderedItems with ordered items
    // 4. Verify items removed from cart
    // 5. Verify non-ordered items still in cart
  });

  it('should keep cart items if checkout fails', async () => {
    // Verify cart not modified if order creation fails
  });
});
```

---

## 12. Known Issues & Limitations

### Current Implementation Issues

1. **No Guest Cart Support**

   - Current: Only supports authenticated users
   - Missing: Guest cart merge on login
   - Impact: Guest users can't add to cart

2. **No Stock Validation**

   - Cart doesn't check product stock on add/update
   - User can add quantity > available stock
   - Stock check must be done at checkout

3. **No Price Sync**

   - Cart stores snapshot price when adding item
   - If Product price changes, cart price doesn't update
   - Feature or bug? (May be intentional - snapshot pricing)

4. **Duplicate Detection Logic**

   - Updating size/color may create duplicate items
   - No unique constraint for (product + size + color)

5. **No Expiration**
   - Cart items have no TTL
   - Old items can exist indefinitely

### Recommended Improvements

```javascript
// TODO: Add guest cart support
// TODO: Add stock validation in addOrUpdateItem
// TODO: Add price sync option
// TODO: Add unique validation for variants
// TODO: Add TTL for cart items (e.g., 30 days)
// TODO: Add cart merge logic on login
```

---

## 13. Summary & Next Steps

### Testing Roadmap

**Phase 1: Core Unit Tests** ⭐ (Week 1)

- ✅ Cart controller unit tests (5 functions)
- ✅ Cart model tests (schema, hooks)
- ✅ Helper function tests

**Phase 2: Integration Tests** (Week 2)

- ✅ API endpoint tests
- ✅ Authentication flow tests
- ✅ Database integration tests

**Phase 3: Edge Cases** (Week 3)

- ✅ Concurrent modification tests
- ✅ Data cleanup tests
- ✅ Error handling tests

**Phase 4: Performance & Security** (Week 4)

- ✅ Load testing (100+ items)
- ✅ Security testing (auth, injection)
- ✅ Integration with checkout flow

### Success Metrics

- **Code Coverage**: > 90%
- **Test Count**: > 50 test cases
- **All Critical Paths**: 100% covered
- **Performance**: < 1s response time
- **Zero Security Issues**

---

## Appendix: Quick Reference

### Controller Functions Summary

| Function             | Method                    | Auth | Purpose                                     |
| -------------------- | ------------------------- | ---- | ------------------------------------------- |
| `getCart`            | GET /cart                 | ✅   | Get cart, create if needed, cleanup invalid |
| `addOrUpdateItem`    | POST /cart                | ✅   | Add new item or merge quantity if duplicate |
| `updateCartItem`     | PUT /cart/:itemId         | ✅   | Update quantity/size/color/price of item    |
| `removeCartItem`     | DELETE /cart/:itemId      | ✅   | Remove item from cart                       |
| `removeOrderedItems` | POST /cart/remove-ordered | ✅   | Remove ordered items from cart              |

### Validation Rules Summary

| Field    | Required | Type     | Constraints            |
| -------- | -------- | -------- | ---------------------- |
| product  | ✅       | ObjectId | Must reference Product |
| quantity | ✅       | Number   | >= 1                   |
| size     | ✅       | String   | Any string             |
| color    | ✅       | String   | Any string             |
| price    | ✅       | Number   | >= 0                   |
| image    | ❌       | String   | Optional URL           |

### Mock Data Quick Copy

```javascript
// Quick mock user
const user = { _id: 'user123', email: 'test@test.com', isVerified: true, status: true };

// Quick mock item
const item = {
  product: 'prod123',
  quantity: 1,
  size: '42',
  color: 'Black',
  price: 2000000,
};

// Quick mock request
const req = { user: { id: 'user123' }, body: item };
const res = {
  json: jest.fn(),
  status: jest.fn().mockReturnThis(),
};
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-28  
**Author**: AI Assistant  
**Review Status**: Ready for Implementation
