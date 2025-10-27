# Product Catalog Testing - Phase 2: Integration Tests

## Overview

Phase 2 focuses on integration testing for the Product Catalog API routes, testing the complete HTTP request/response cycle with authentication, authorization, and database operations.

## Test Coverage

### 1. POST /api/products - Create Product

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Create product with admin token (201 Created)
- ✅ Return 401 without authentication token
- ✅ Return 403 with user token (not admin)
- ✅ Return 400 for missing required fields
- ✅ Return 400 for duplicate SKU

**Test Cases**: 5 tests
**Authentication**: Required (Admin only)

---

### 2. GET /api/products - Get All Products

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Get all products (public access, no auth required)
- ✅ Paginate results (page, limit)
- ✅ Filter by brand
- ✅ Filter by product type
- ✅ Filter by price range (minPrice, maxPrice)
- ✅ Filter by size
- ✅ Filter by color
- ✅ Filter by category
- ✅ Sort by finalPrice (ascending)
- ✅ Sort by finalPrice (descending)
- ✅ Sort by createdAt
- ✅ Sort by sales (popularity)
- ✅ Handle empty results
- ✅ Handle empty database

**Test Cases**: 14 tests
**Authentication**: Not required (Public API)

---

### 3. GET /api/products/:id - Get Product By ID

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Get product by valid ID (200 OK)
- ✅ Return 404 for non-existent ID
- ✅ Return 400 for invalid ID format

**Test Cases**: 3 tests
**Authentication**: Not required (Public API)

---

### 4. PUT /api/products/:id - Update Product

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Update product with admin token (200 OK)
- ✅ Return 401 without token
- ✅ Return 403 with user token
- ✅ Return 404 for non-existent ID
- ✅ Handle partial updates

**Test Cases**: 5 tests
**Authentication**: Required (Admin only)

---

### 5. DELETE /api/products/:id - Delete Product

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Delete product with admin token (200 OK)
- ✅ Verify product is removed from database
- ✅ Return 401 without token
- ✅ Return 403 with user token
- ✅ Return 404 for non-existent ID

**Test Cases**: 5 tests
**Authentication**: Required (Admin only)

---

### 6. PUT /api/products/:id/recalculate-price - Recalculate Final Price

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Recalculate final price with admin token (200 OK)
- ✅ Verify price is recalculated correctly
- ✅ Return 401 without token
- ✅ Return 500 if product not found

**Test Cases**: 4 tests
**Authentication**: Required (Admin only)

---

### 7. GET /api/products/search - Search Products

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Search by keyword
- ✅ Return empty for no matches
- ✅ Case-insensitive search

**Test Cases**: 3 tests
**Authentication**: Not required (Public API)

---

### 8. GET /api/products/filter - Advanced Filtering

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Filter by multiple criteria simultaneously
- ✅ Filter by rating (minRating)
- ✅ Filter by isOnSale status
- ✅ Combine multiple filters

**Test Cases**: 4 tests
**Authentication**: Not required (Public API)

---

### 9. Edge Cases & Error Handling

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Handle very large page number
- ✅ Handle negative price filter
- ✅ Handle malformed query params
- ✅ Handle concurrent requests (10 simultaneous)
- ✅ Handle empty database

**Test Cases**: 5 tests

---

## Summary Statistics

| Endpoint                              | Method | Tests  | Status   | Auth Required |
| ------------------------------------- | ------ | ------ | -------- | ------------- |
| `/api/products`                       | POST   | 5      | ⚠️       | Admin         |
| `/api/products`                       | GET    | 14     | ⚠️       | No            |
| `/api/products/:id`                   | GET    | 3      | ⚠️       | No            |
| `/api/products/:id`                   | PUT    | 5      | ⚠️       | Admin         |
| `/api/products/:id`                   | DELETE | 5      | ⚠️       | Admin         |
| `/api/products/:id/recalculate-price` | PUT    | 4      | ⚠️       | Admin         |
| `/api/products/search`                | GET    | 3      | ⚠️       | No            |
| `/api/products/filter`                | GET    | 4      | ⚠️       | No            |
| Edge Cases                            | -      | 5      | ⚠️       | -             |
| **TOTAL**                             | -      | **48** | **0/48** | -             |

---

## Issues Identified

### Critical Issue

1. **MongoDB Connection Conflict**

   ```
   MongooseError: Can't call `openUri()` on an active connection
   with different connection strings.
   ```

   **Root Cause**:

   - Integration tests try to create new MongoDB connection
   - Conflicts with existing connection from unit tests
   - Both tests running in same Jest process

   **Solutions**:

   - Option 1: Check if mongoose is already connected before calling connect()
   - Option 2: Use separate test files and run sequentially
   - Option 3: Disconnect before connecting in integration tests
   - Option 4: Use `mongoose.createConnection()` instead of `mongoose.connect()`

### Recommended Fix

```javascript
// In integration test beforeAll():
beforeAll(async () => {
  // Disconnect existing connection if any
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // ... rest of setup
});
```

---

## Test Setup

### Authentication Setup

```javascript
// Create test users
const adminUser = await User.create({
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@test.com',
  password: 'hashedPassword123',
  role: 'admin',
});

const regularUser = await User.create({
  firstName: 'Regular',
  lastName: 'User',
  email: 'user@test.com',
  password: 'hashedPassword123',
  role: 'user',
});

// Generate JWT tokens
adminToken = generateToken({ id: adminUser._id, role: 'admin' });
userToken = generateToken({ id: regularUser._id, role: 'user' });
```

### Test Category Setup

```javascript
const category = await Category.create({
  name: 'Test Category',
  slug: 'test-category',
});
```

---

## API Test Examples

### Example 1: Create Product (Admin)

```javascript
const response = await request(app)
  .post('/api/products')
  .set('Authorization', `Bearer ${adminToken}`)
  .send({
    name: 'Nike Air Max 90',
    brand: 'Nike',
    category: categoryId,
    productType: 'shoes',
    price: { regular: 1500000 },
    inventory: [{ size: 42, color: 'Black', quantity: 10 }],
  });

expect(response.status).toBe(201);
expect(response.body.success).toBe(true);
```

### Example 2: Get Products with Filters

```javascript
const response = await request(app).get('/api/products').query({
  brand: 'Nike',
  minPrice: 500000,
  maxPrice: 2000000,
  size: '42',
  color: 'Black',
  sortBy: 'finalPrice',
  order: 'asc',
  page: 1,
  limit: 10,
});

expect(response.status).toBe(200);
expect(response.body.data.products).toBeDefined();
```

### Example 3: Update Product (Admin)

```javascript
const response = await request(app)
  .put(`/api/products/${productId}`)
  .set('Authorization', `Bearer ${adminToken}`)
  .send({
    name: 'Updated Name',
    price: { regular: 1200000, isOnSale: true, discountPercent: 20 },
  });

expect(response.status).toBe(200);
expect(response.body.data.name).toBe('Updated Name');
```

---

## Authorization Matrix

| Endpoint                                | Admin | User | Guest |
| --------------------------------------- | ----- | ---- | ----- |
| POST /api/products                      | ✅    | ❌   | ❌    |
| GET /api/products                       | ✅    | ✅   | ✅    |
| GET /api/products/:id                   | ✅    | ✅   | ✅    |
| PUT /api/products/:id                   | ✅    | ❌   | ❌    |
| DELETE /api/products/:id                | ✅    | ❌   | ❌    |
| PUT /api/products/:id/recalculate-price | ✅    | ❌   | ❌    |
| GET /api/products/search                | ✅    | ✅   | ✅    |
| GET /api/products/filter                | ✅    | ✅   | ✅    |

---

## Performance Benchmarks

### Response Times (Target)

- GET /api/products: < 100ms
- GET /api/products/:id: < 50ms
- POST /api/products: < 200ms
- PUT /api/products/:id: < 150ms
- DELETE /api/products/:id: < 100ms

### Concurrent Requests

- 10 simultaneous requests: Should handle without errors
- Response time degradation: < 20%

---

## Next Steps

### Immediate Actions

1. 🔴 **Fix MongoDB connection conflict**

   - Implement proper connection management
   - Test with both sequential and parallel execution

2. 🟡 **Re-run all integration tests**
   - Verify all 48 tests pass
   - Document any remaining issues

### Future Enhancements

1. Add load testing (100+ concurrent requests)
2. Add stress testing (database failures)
3. Add security testing (SQL injection, XSS)
4. Add performance monitoring
5. Add API documentation generation from tests

---

## Test File Structure

```
tests/product/
├── product-catalog.unit.test.js         (Phase 1 - Unit tests)
└── product-catalog.integration.test.js  (Phase 2 - Integration tests)
```

---

## Dependencies

```json
{
  "supertest": "^6.3.x",
  "mongodb-memory-server": "^9.x",
  "mongoose": "^8.x",
  "jest": "^29.x"
}
```

---

## Execution Command

```bash
# Run only integration tests
npm test -- product-catalog.integration.test.js

# Run with verbose output
npm test -- product-catalog.integration.test.js --verbose

# Run with coverage
npm test -- product-catalog.integration.test.js --coverage
```

---

**Generated**: 2025-10-27
**Test Framework**: Jest 29.x + Supertest
**Database**: MongoDB Memory Server
**Authentication**: JWT Bearer Token
