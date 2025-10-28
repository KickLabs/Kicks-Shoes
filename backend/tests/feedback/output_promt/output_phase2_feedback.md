# Feedback Testing - Phase 2: Integration Tests

## Overview

Phase 2 focuses on integration testing for the Feedback API routes, testing the complete HTTP request/response cycle with authentication, authorization, database operations, and email notifications.

## Test Coverage

### 1. POST /api/feedback - Create Feedback

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Submit valid feedback with all fields (201 Created)
- ✅ Submit feedback without images (201 Created)
- ✅ Return 401 without authentication token
- ✅ Return 400 for missing required fields
- ✅ Return 400 for duplicate user+order+product combination
- ✅ Return 400 for rating validation (0-5 range)
- ✅ Return 400 for comment length validation (10-500 chars)
- ✅ Return 400 for invalid image URL format
- ✅ Upload maximum images (5) successfully

**Test Cases**: 9 tests
**Authentication**: Required (User)

---

### 2. GET /api/feedback/product/:productId - Get Product Reviews

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Get all feedbacks for product (200 OK)
- ✅ Paginate results (page, limit)
- ✅ Filter by rating
- ✅ Return empty array for non-existent product
- ✅ Return empty array for product with no reviews
- ✅ Handle invalid product ID format

**Test Cases**: 6 tests
**Authentication**: Not required (Public API)

---

### 3. PUT /api/feedback/:id - Update Feedback

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Update own feedback with valid token (200 OK)
- ✅ Return 401 without token
- ✅ Return 403 when updating another user's feedback
- ✅ Return 404 for non-existent feedback ID
- ✅ Handle partial updates
- ✅ Validate updated rating and comment

**Test Cases**: 6 tests
**Authentication**: Required (Feedback Owner)

---

### 4. DELETE /api/feedback/:id - Delete Feedback

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Delete own feedback with valid token (200 OK)
- ✅ Verify feedback is removed from database
- ✅ Return 401 without token
- ✅ Return 403 when deleting another user's feedback
- ✅ Return 404 for non-existent feedback ID
- ✅ Verify product rating is recalculated after deletion

**Test Cases**: 6 tests
**Authentication**: Required (Feedback Owner)

---

### 5. POST /api/feedback/:id/report - Report Feedback

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Report inappropriate feedback (201 Created)
- ✅ Return 401 without authentication token
- ✅ Return 400 for duplicate report by same user
- ✅ Return 404 for non-existent feedback ID
- ✅ Verify email notifications sent to shop owner and reporter

**Test Cases**: 5 tests
**Authentication**: Required (User)

---

### 6. PUT /api/feedback/:id/approve - Admin Approve Feedback

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Admin approves reported feedback (200 OK)
- ✅ Return 401 without token
- ✅ Return 403 with user token (not admin)
- ✅ Return 404 for non-existent feedback ID
- ✅ Verify email notifications sent to all parties

**Test Cases**: 5 tests
**Authentication**: Required (Admin only)

---

### 7. PUT /api/feedback/:id/ban - Admin Ban Feedback

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Admin bans reported feedback (200 OK)
- ✅ Verify soft delete applied (status = false)
- ✅ Return 401 without token
- ✅ Return 403 with user token (not admin)
- ✅ Verify email notifications sent to all parties

**Test Cases**: 5 tests
**Authentication**: Required (Admin only)

---

### 8. Edge Cases & Error Handling

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Handle HTML/script injection in comments
- ✅ Handle NoSQL injection attempts
- ✅ Handle extra large payload (massive text)
- ✅ Handle upload more than 5 images
- ✅ Handle database connection failures
- ✅ Handle email service failures
- ✅ Handle Cloudinary upload failures
- ✅ Handle concurrent feedback creation
- ✅ Handle request timeouts
- ✅ Handle memory limit exceeded

**Test Cases**: 10 tests

---

### 9. Integration & Email Notifications

**Status**: ⚠️ **Connection Issues**

#### Test Scenarios:

- ✅ Create feedback updates product rating aggregation
- ✅ Delete feedback updates product rating recalculation
- ✅ Delete feedback sends email notifications
- ✅ Report feedback sends email notifications
- ✅ Admin actions trigger email chains
- ✅ Complete feedback lifecycle testing

**Test Cases**: 6 tests

---

## Summary Statistics

| Endpoint                           | Method | Tests  | Status   | Auth Required |
| ---------------------------------- | ------ | ------ | -------- | ------------- |
| `/api/feedback`                    | POST   | 9      | ⚠️       | User          |
| `/api/feedback/product/:productId` | GET    | 6      | ⚠️       | No            |
| `/api/feedback/:id`                | PUT    | 6      | ⚠️       | Owner         |
| `/api/feedback/:id`                | DELETE | 6      | ⚠️       | Owner         |
| `/api/feedback/:id/report`         | POST   | 5      | ⚠️       | User          |
| `/api/feedback/:id/approve`        | PUT    | 5      | ⚠️       | Admin         |
| `/api/feedback/:id/ban`            | PUT    | 5      | ⚠️       | Admin         |
| Edge Cases                         | -      | 10     | ⚠️       | -             |
| Integration                        | -      | 6      | ⚠️       | -             |
| **TOTAL**                          | -      | **58** | **0/58** | -             |

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

### Test Data Setup

```javascript
// Create test order and product
const order = await Order.create({
  user: regularUser._id,
  status: 'delivered',
  items: [{ product: productId, quantity: 1 }],
});

const product = await Product.create({
  name: 'Test Product',
  brand: 'Test Brand',
  price: { regular: 1000000 },
});
```

---

## API Test Examples

### Example 1: Create Feedback (User)

```javascript
const response = await request(app)
  .post('/api/feedback')
  .set('Authorization', `Bearer ${userToken}`)
  .send({
    order: orderId,
    product: productId,
    rating: 5,
    comment: 'Great product, highly recommended!',
    images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  });

expect(response.status).toBe(201);
expect(response.body.success).toBe(true);
expect(response.body.data.rating).toBe(5);
```

### Example 2: Get Product Reviews

```javascript
const response = await request(app).get(`/api/feedback/product/${productId}`).query({
  page: 1,
  limit: 10,
  rating: 5,
});

expect(response.status).toBe(200);
expect(response.body.data.feedbacks).toBeDefined();
expect(Array.isArray(response.body.data.feedbacks)).toBe(true);
```

### Example 3: Update Feedback (Owner)

```javascript
const response = await request(app)
  .put(`/api/feedback/${feedbackId}`)
  .set('Authorization', `Bearer ${userToken}`)
  .send({
    rating: 4,
    comment: 'Updated review: Still good but could be better',
  });

expect(response.status).toBe(200);
expect(response.body.data.rating).toBe(4);
```

### Example 4: Report Feedback

```javascript
const response = await request(app)
  .post(`/api/feedback/${feedbackId}/report`)
  .set('Authorization', `Bearer ${userToken}`)
  .send({
    reason: 'spam',
    description: 'This review contains inappropriate content',
  });

expect(response.status).toBe(201);
expect(response.body.success).toBe(true);
```

### Example 5: Admin Approve Feedback

```javascript
const response = await request(app)
  .put(`/api/feedback/${feedbackId}/approve`)
  .set('Authorization', `Bearer ${adminToken}`);

expect(response.status).toBe(200);
expect(response.body.data.isVerified).toBe(true);
```

---

## Authorization Matrix

| Endpoint                      | Admin | User | Guest |
| ----------------------------- | ----- | ---- | ----- |
| POST /api/feedback            | ✅    | ✅   | ❌    |
| GET /api/feedback/product/:id | ✅    | ✅   | ✅    |
| PUT /api/feedback/:id         | ✅    | ✅\* | ❌    |
| DELETE /api/feedback/:id      | ✅    | ✅\* | ❌    |
| POST /api/feedback/:id/report | ✅    | ✅   | ❌    |
| PUT /api/feedback/:id/approve | ✅    | ❌   | ❌    |
| PUT /api/feedback/:id/ban     | ✅    | ❌   | ❌    |

\*Only for own feedback

---

## Performance Benchmarks

### Response Times (Target)

- GET /api/feedback/product/:id: < 100ms
- POST /api/feedback: < 200ms
- PUT /api/feedback/:id: < 150ms
- DELETE /api/feedback/:id: < 100ms
- POST /api/feedback/:id/report: < 150ms

### Concurrent Requests

- 10 simultaneous feedback submissions: Should handle without errors
- Response time degradation: < 20%

---

## Next Steps

### Immediate Actions

1. 🔴 **Fix MongoDB connection conflict**

   - Implement proper connection management
   - Test with both sequential and parallel execution

2. 🟡 **Re-run all integration tests**
   - Verify all 58 tests pass
   - Document any remaining issues

### Future Enhancements

1. Add load testing (100+ concurrent requests)
2. Add stress testing (database failures)
3. Add security testing (XSS, injection attacks)
4. Add performance monitoring
5. Add email delivery testing
6. Add image upload testing with Cloudinary

---

## Test File Structure

```
tests/feedback/
├── feedback.unit.test.js              (Phase 1 - Unit tests)
└── feedback.integration.test.js       (Phase 2 - Integration tests)
```

---

## Dependencies

```json
{
  "supertest": "^6.3.x",
  "mongodb-memory-server": "^9.x",
  "mongoose": "^8.x",
  "jest": "^29.x",
  "nodemailer": "^6.x"
}
```

---

## Execution Command

```bash
# Run only integration tests
npm test -- feedback.integration.test.js

# Run with verbose output
npm test -- feedback.integration.test.js --verbose

# Run with coverage
npm test -- feedback.integration.test.js --coverage
```

---

**Generated**: 2025-01-27
**Test Framework**: Jest 29.x + Supertest
**Database**: MongoDB Memory Server
**Authentication**: JWT Bearer Token
**Email Service**: Nodemailer Mock
