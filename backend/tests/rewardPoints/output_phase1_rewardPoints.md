# Reward Points – Technical & Testing Analysis

## 1. Feature Overview

### Business Purpose

The Reward Points system incentivizes customer purchases by automatically awarding points when orders are paid. Users can:

- **Earn** points based on order value (100 points per 1 million VND)
- **Redeem** points for discount codes
- **Track** point history, expirations, and balances

### Key UI Flows

1. **View Reward Points**: User accesses account page → Reward Points tab → Views statistics & transaction history
2. **Earn Points**: User completes order → Payment confirmed → System auto-creates reward points
3. **Redeem Points**: User selects points to redeem → System generates unique discount code → Email sent with code

### Main Business Rules

- **Earning Rate**: 1 point per 10,000 VND spent
- **Minimum Redemption**: 10 points
- **Minimum Discount**: 10,000 VND
- **Point Expiry**: 1 year from earn date
- **Point Types**: `earn`, `redeem`, `expire`, `adjust`
- **Statuses**: `active`, `expired`, `redeemed`

### Testing Importance

- **Financial Impact**: Incorrect calculations affect revenue
- **User Trust**: Points are perceived as user assets
- **Integration**: Tied to Orders, Payments, Discounts, Email services
- **Concurrency**: Multiple users redeeming simultaneously

---

## 2. UI/UX Flow Mapping

### Flow 1: View Reward Points

| Step | UI Screen/Component | User Action               | System Behavior                                     |
| ---- | ------------------- | ------------------------- | --------------------------------------------------- |
| 1    | Account Dashboard   | Click "Reward Points" tab | Navigate to RewardPointsDetail                      |
| 2    | RewardPointsDetail  | Page loads                | Fetch `/reward-points/user/:userId/total`           |
| 3    | Statistics Cards    | View stats                | Display: Available, Earned, Redeemed, Expired       |
| 4    | Transaction Table   | Scroll/filter             | Fetch `/reward-points/user/:userId?page=1&limit=10` |
| 5    | Transaction Table   | Click filter              | Client-side filter by type/status                   |

### Flow 2: Earn Points (Automatic)

| Step | UI Screen/Component | User Action      | System Behavior                                    |
| ---- | ------------------- | ---------------- | -------------------------------------------------- |
| 1    | Checkout            | Complete payment | Payment gateway callback received                  |
| 2    | Backend             | (Automatic)      | Order status → "paid"                              |
| 3    | Backend             | (Automatic)      | Check `hasOrderEarnedRewardPoints(orderId)`        |
| 4    | Backend             | (Automatic)      | Calculate points: `Math.floor(totalPrice / 10000)` |
| 5    | Backend             | (Automatic)      | Create RewardPoint record (type: earn)             |
| 6    | Backend             | (Automatic)      | Set expiry date (+1 year)                          |

### Flow 3: Redeem Points

| Step | UI Screen/Component | User Action                    | System Behavior                                            |
| ---- | ------------------- | ------------------------------ | ---------------------------------------------------------- |
| 1    | RedeemPointsSection | Enter points & discount amount | Validate: points ≥ 10, discount ≥ 10000                    |
| 2    | RedeemPointsSection | Click "Redeem"                 | POST `/reward-points/redeem`                               |
| 3    | Backend             | (Validation)                   | Check available points >= requested                        |
| 4    | Backend             | (Generate)                     | Create unique discount code: `REWARD{timestamp}{random}`   |
| 5    | Backend             | (DB)                           | Create Discount record (usageLimit: 1)                     |
| 6    | Backend             | (DB)                           | Create RewardPoint record (type: redeem, points: negative) |
| 7    | Backend             | (Email)                        | Send discount code to user email                           |
| 8    | RedeemPointsSection | Success modal                  | Display discount code & expiry                             |

---

## 3. Related Files, Components & Modules

| File/Path                                                     | Layer          | Responsibility          | Key Methods/Props/States                                                 |
| ------------------------------------------------------------- | -------------- | ----------------------- | ------------------------------------------------------------------------ |
| **Backend Models**                                            |                |                         |                                                                          |
| `models/RewardPoint.js`                                       | Data           | Schema definition       | `user`, `points`, `type`, `order`, `description`, `expiryDate`, `status` |
|                                                               |                | Pre-save hook           | Auto-set expiry date for 'earn' type                                     |
| **Backend Services**                                          |                |                         |                                                                          |
| `services/rewardPoint.service.js`                             | Business Logic | Core reward logic       | `createRewardPointsForOrder(order)`                                      |
|                                                               |                |                         | `getUserTotalPoints(userId)`                                             |
|                                                               |                |                         | `hasOrderEarnedRewardPoints(orderId)`                                    |
|                                                               |                |                         | `deductRewardPointsForOrder(order)`                                      |
| **Backend Controllers**                                       |                |                         |                                                                          |
| `controllers/rewardPointController.js`                        | HTTP Handlers  | API endpoints           | `createRewardPoint` (POST /)                                             |
|                                                               |                | Validation              | `getUserRewardPoints` (GET /user/:userId)                                |
|                                                               |                |                         | `getUserTotalPointsController` (GET /user/:userId/total)                 |
|                                                               |                |                         | `redeemPoints` (POST /redeem)                                            |
|                                                               |                |                         | `cleanupTestData` (DELETE /cleanup-test-data)                            |
| **Backend Routes**                                            |                |                         |                                                                          |
| `routes/rewardPointRoutes.js`                                 | Routing        | Protected routes        | All routes require `protect` middleware                                  |
| **Integration Points**                                        |                |                         |                                                                          |
| `controllers/orderController.js`                              | Order Flow     | Call on payment success | Line 769: `createRewardPointsForOrder(fullOrder)`                        |
| `controllers/vnpayController.js`                              | Payment Flow   | Call on VNPAY callback  | Import `createRewardPointsForOrder`                                      |
| **Frontend Components**                                       |                |                         |                                                                          |
| `components/pages/account/components/RewardPointsDetail.jsx`  | UI             | Display & manage points | `pointsStats`, `rewardPoints`, `pagination`                              |
|                                                               |                |                         | `fetchData()`, `handleTableChange()`                                     |
| `components/pages/account/components/RedeemPointsSection.jsx` | UI             | Redeem interface        | `availablePoints`, `onSuccess`                                           |
| **External Dependencies**                                     |                |                         |                                                                          |
| `models/Discount.js`                                          | Data           | Discount codes          | Created on redemption                                                    |
| `services/email.service.js`                                   | Email          | Send codes              | `sendDiscountCodeEmail(user, discountData)`                              |
| `models/User.js`                                              | Data           | User info               | For email sending                                                        |
| `models/Order.js`                                             | Data           | Order details           | `totalPrice`, `orderNumber`, `user`                                      |

---

## 4. Core Functions / Methods to Test

### 4.1. `createRewardPointsForOrder(order)` - service

**Purpose:** Automatically create reward points when order is paid

**Inputs:**

- `order` (Object): Order document with `_id`, `user`, `totalPrice` (or `subtotal`, `shippingCost`, `tax`, `discount`), `orderNumber`

**Outputs:**

- `Promise<Object|null>`: Created RewardPoint record or null if no points earned

**Logic:**

1. Validate `totalPrice` exists and > 0 (fallback calculation if missing)
2. Calculate `pointsEarned = Math.floor(totalPrice / 10000)`
3. Return null if `pointsEarned <= 0`
4. Calculate `expiryDate` (+1 year)
5. Create RewardPoint with type='earn', status='active'

**Edge Cases:**

- `totalPrice` = 0 or negative → return null
- `totalPrice` < 10,000 → return null (0 points)
- `totalPrice` = 9,999 → return null
- `totalPrice` = 10,000 → earn 1 point
- `totalPrice` = 1,000,000 → earn 100 points
- Missing `order.totalPrice` → fallback calculation
- Invalid `order.user` → Mongoose validation error

**Dependencies:**

- `RewardPoint.create()` (mock)
- `logger.info/error()` (mock)

---

### 4.2. `getUserTotalPoints(userId)` - service

**Purpose:** Calculate user's available, earned, redeemed, expired points

**Inputs:**

- `userId` (string): User ID

**Outputs:**

- `Promise<Object>`: `{ totalEarned, totalRedeemed, totalExpired, availablePoints }`

**Logic:**

1. Aggregate earned points: `type='earn' AND status='active'`
2. Aggregate redeemed points: `type='redeem'` (abs value)
3. Aggregate expired points: `type='expire' OR status='expired'`
4. Calculate: `available = earned - redeemed - expired` (max 0)

**Edge Cases:**

- User has no points → all zeros
- Negative available (over-redeemed) → return 0
- Large numbers (millions of points)
- Invalid userId format → Mongoose error
- userId doesn't exist → return zeros

**Dependencies:**

- `RewardPoint.aggregate()` (mock)
- `mongoose.Types.ObjectId()` (real or mock)

---

### 4.3. `redeemPoints` - controller

**Purpose:** Redeem points for discount code

**Inputs (req.body):**

- `points` (number): Points to redeem (min 10)
- `discountAmount` (number): Discount value in VND (min 10,000)
- `description` (string, optional)

**Inputs (req.user):**

- `_id`: User ID
- Email for sending code

**Outputs:**

- `201`: `{ success: true, data: { rewardPoint, discount }, message }`
- `400`: Insufficient points or validation errors
- `401`: User not authenticated
- `500`: Server error

**Logic:**

1. Validate request body (express-validator)
2. Check user is authenticated
3. Get user's available points
4. Check if `availablePoints >= points`
5. Generate unique discount code: `REWARD{timestamp}{random}`
6. Create Discount (type: fixed, usageLimit: 1, endDate: +1 year)
7. Create RewardPoint (type: redeem, points: negative, status: redeemed)
8. Send email with code (non-blocking)
9. Return success with discount details

**Edge Cases:**

- `points < 10` → validation error
- `discountAmount < 10000` → validation error
- Insufficient available points → 400 error
- Discount code collision (unlikely but possible) → retry logic missing
- Email send fails → log error but don't fail request
- Concurrent redemptions by same user → race condition possible

**Dependencies:**

- `getUserTotalPoints(userId)` (service)
- `Discount.create()` (model)
- `RewardPoint.create()` (model)
- `EmailService.sendDiscountCodeEmail()` (service)
- `User.findById()` (model)

---

### 4.4. `hasOrderEarnedRewardPoints(orderId)` - service

**Purpose:** Check if order already has earned reward points (prevent duplicates)

**Inputs:**

- `orderId` (string): Order ID

**Outputs:**

- `Promise<boolean>`: true if points already exist

**Logic:**

1. Query RewardPoint where `order = orderId AND type = 'earn'`
2. Return `!!existingRewardPoint`

**Edge Cases:**

- Order doesn't exist → return false
- Multiple earn records for same order (bug) → return true
- Invalid orderId format → return false (catch error)

**Dependencies:**

- `RewardPoint.findOne()` (mock)

---

### 4.5. `deductRewardPointsForOrder(order)` - service

**Purpose:** Deduct points when order is refunded/cancelled

**Inputs:**

- `order` (Object): Order with `_id`, `user`, `orderNumber`

**Outputs:**

- `Promise<Object|null>`: Created adjustment record or null

**Logic:**

1. Find earned points for this order (`type='earn'`)
2. If not found, return null
3. Create RewardPoint with `type='adjust'`, negative points
4. Description: "Deduct reward points due to refund/cancel order #..."

**Edge Cases:**

- Order has no earned points → return null
- Order already deducted → creates duplicate adjustment (no idempotency check)
- Partial refunds → deducts all points (no partial logic)

**Dependencies:**

- `RewardPoint.findOne()` (mock)
- `RewardPoint.create()` (mock)

---

### 4.6. `getUserRewardPoints` - controller

**Purpose:** Get paginated list of user's reward point transactions

**Inputs (req.params):**

- `userId` (string)

**Inputs (req.query):**

- `page` (number, default: 1)
- `limit` (number, default: 10)
- `type` (string, optional): filter by type
- `status` (string, optional): filter by status

**Outputs:**

- `200`: `{ success: true, data: [...], pagination: {...} }`
- `500`: Server error

**Logic:**

1. Build query with userId + optional filters
2. Apply pagination (skip/limit)
3. Populate order details
4. Count total documents
5. Return data + pagination metadata

**Edge Cases:**

- `page < 1` → still works (MongoDB skip can be 0)
- `limit` very large (e.g., 1000) → performance issue, no cap
- No results → return empty array
- Invalid userId → no error, just empty results

**Dependencies:**

- `RewardPoint.find()` (mock)
- `RewardPoint.countDocuments()` (mock)

---

## 5. Test Case Matrix

| Category                                 | Scenario                      | Pre-condition                             | Input                                 | Expected Output/Behavior                                                        |
| ---------------------------------------- | ----------------------------- | ----------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------- |
| **Unit: createRewardPointsForOrder**     |                               |                                           |                                       |                                                                                 |
| Happy                                    | Create points for valid order | Order paid                                | `totalPrice: 100000`                  | Points: 10, expiry: +1 year, status: active                                     |
| Happy                                    | Large order amount            | Order paid                                | `totalPrice: 5000000`                 | Points: 500                                                                     |
| Edge                                     | Order below threshold         | Order paid                                | `totalPrice: 9999`                    | Return null (0 points)                                                          |
| Edge                                     | Exact threshold               | Order paid                                | `totalPrice: 10000`                   | Points: 1                                                                       |
| Edge                                     | Zero total price              | Order paid                                | `totalPrice: 0`                       | Return null, log error                                                          |
| Edge                                     | Negative total                | Order                                     | `totalPrice: -1000`                   | Return null, log error                                                          |
| Edge                                     | Missing totalPrice            | Order                                     | No `totalPrice` field                 | Fallback calculation or null                                                    |
| Error                                    | Invalid order object          | None                                      | `order: null`                         | Throw error                                                                     |
| Error                                    | Database error                | DB down                                   | Valid order                           | Throw error, log                                                                |
| **Unit: getUserTotalPoints**             |                               |                                           |                                       |                                                                                 |
| Happy                                    | User with points              | User has earned 100, redeemed 30          | `userId: validId`                     | `{ totalEarned: 100, totalRedeemed: 30, totalExpired: 0, availablePoints: 70 }` |
| Happy                                    | User with no points           | New user                                  | `userId: validId`                     | All zeros                                                                       |
| Edge                                     | Over-redeemed user            | Earned 10, redeemed 20 (adjust)           | `userId`                              | `availablePoints: 0` (not negative)                                             |
| Edge                                     | Mix of statuses               | earned (active), earned (expired), redeem | `userId`                              | Correct calculation                                                             |
| Error                                    | Invalid userId format         | None                                      | `userId: "invalid"`                   | Mongoose CastError                                                              |
| Error                                    | Non-existent user             | User deleted                              | `userId: deletedId`                   | Return zeros (no error)                                                         |
| **Unit: redeemPoints**                   |                               |                                           |                                       |                                                                                 |
| Happy                                    | Valid redemption              | User has 100 points                       | `points: 50, discountAmount: 50000`   | 201, discount created, email sent                                               |
| Happy                                    | Minimum values                | User has 10 points                        | `points: 10, discountAmount: 10000`   | 201 success                                                                     |
| Validation                               | Points below minimum          | User has 100 points                       | `points: 9`                           | 400, validation error                                                           |
| Validation                               | Discount below minimum        | User has 100 points                       | `discountAmount: 9999`                | 400, validation error                                                           |
| Error                                    | Insufficient points           | User has 30 points                        | `points: 50`                          | 400, "Not enough points"                                                        |
| Error                                    | User not authenticated        | No req.user                               | Valid body                            | 401, "User not authenticated"                                                   |
| Edge                                     | Email fails                   | User valid                                | Valid redemption                      | 201 success (email error logged)                                                |
| Edge                                     | Discount code collision       | Existing code                             | Redemption                            | Success (timestamp+random should prevent)                                       |
| Concurrency                              | Simultaneous redemptions      | User has 100 points                       | 2 concurrent requests: 60 points each | Race condition: both may succeed or one fails                                   |
| **Unit: hasOrderEarnedRewardPoints**     |                               |                                           |                                       |                                                                                 |
| Happy                                    | Order has points              | RewardPoint exists                        | `orderId: existingOrder`              | Return true                                                                     |
| Happy                                    | Order has no points           | RewardPoint not exists                    | `orderId: newOrder`                   | Return false                                                                    |
| Edge                                     | Invalid orderId               | None                                      | `orderId: "invalid"`                  | Return false (catch error)                                                      |
| Edge                                     | Multiple earn records         | Duplicate records exist                   | `orderId`                             | Return true (bug exists)                                                        |
| **Unit: deductRewardPointsForOrder**     |                               |                                           |                                       |                                                                                 |
| Happy                                    | Deduct for refunded order     | Order has earned 50 points                | Order object                          | Create adjust: -50 points                                                       |
| Edge                                     | Order has no points           | Order never earned                        | Order object                          | Return null                                                                     |
| Edge                                     | Already deducted              | Adjustment exists                         | Order object                          | Create duplicate adjustment (no idempotency)                                    |
| Error                                    | Database error                | DB down                                   | Order object                          | Throw error                                                                     |
| **Integration: getUserRewardPoints**     |                               |                                           |                                       |                                                                                 |
| Happy                                    | Get paginated list            | User has 25 records                       | `page=1, limit=10`                    | Return 10 records, pagination: total=3 pages                                    |
| Happy                                    | Filter by type                | User has mixed records                    | `type=earn`                           | Return only earn records                                                        |
| Happy                                    | Filter by status              | User has mixed statuses                   | `status=active`                       | Return only active records                                                      |
| Edge                                     | Page beyond range             | User has 10 records                       | `page=999`                            | Return empty array, pagination valid                                            |
| Edge                                     | Large limit                   | User has 5 records                        | `limit=1000`                          | Return all 5 (no cap enforcement)                                               |
| **Integration: POST /redeem**            |                               |                                           |                                       |                                                                                 |
| Happy                                    | Full flow                     | User logged in, 100 points                | POST with valid body                  | 201, discount code, email sent, points deducted                                 |
| Security                                 | Missing auth token            | No token                                  | POST /redeem                          | 401 unauthorized                                                                |
| Security                                 | Invalid token                 | Expired/malformed token                   | POST /redeem                          | 401 unauthorized                                                                |
| **Integration: GET /user/:userId/total** |                               |                                           |                                       |                                                                                 |
| Happy                                    | Get total                     | User logged in                            | GET /user/:userId/total               | 200, stats object                                                               |
| Security                                 | Access other user's total     | User A logged in                          | GET /user/{userB}/total               | 200 (no authZ check - potential issue)                                          |

---

## 6. Test Priority Recommendation

| Module/Function              | Priority   | Justification                                                                                                                             |
| ---------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `createRewardPointsForOrder` | **HIGH**   | - Core revenue logic<br>- Auto-triggered on payments<br>- Calculation errors = financial loss<br>- Integration with Order & Payment flows |
| `getUserTotalPoints`         | **HIGH**   | - Used in UI statistics<br>- Used in redemption validation<br>- Aggregation logic complex<br>- User trust depends on accuracy             |
| `redeemPoints`               | **HIGH**   | - Creates financial discount codes<br>- Deducts user assets (points)<br>- Integration with Discount, Email, User<br>- Concurrency risks   |
| `getUserRewardPoints`        | **MEDIUM** | - Read-only operation<br>- Pagination logic standard<br>- Lower business risk<br>- UI-facing, UX impact if broken                         |
| `hasOrderEarnedRewardPoints` | **MEDIUM** | - Prevents duplicate point awards<br>- Simple logic but critical check<br>- Edge cases (duplicate records)                                |
| `deductRewardPointsForOrder` | **MEDIUM** | - Reverses points on refunds<br>- Less frequently called<br>- No idempotency check (issue)                                                |
| RewardPoint Model            | **MEDIUM** | - Pre-save hook for expiry date<br>- Schema validations<br>- Indexes for performance                                                      |
| Frontend Component           | **LOW**    | - Display logic only<br>- No complex calculations<br>- Standard React patterns<br>- UI bugs less critical than data bugs                  |

---

## 7. Mocking & Test Data Preparation

| Dependency                  | What to Mock          | Mocking Strategy                   | Sample Mock Data                                                                                                         |
| --------------------------- | --------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **RewardPoint Model**       | DB operations         | Jest mock or mongodb-memory-server | `{ user: ObjectId, points: 100, type: 'earn', order: ObjectId, description: '...', expiryDate: Date, status: 'active' }` |
| **Discount Model**          | DB create             | Jest mock                          | `{ code: 'REWARD...', type: 'fixed', value: 50000, startDate: Date, endDate: Date, usageLimit: 1 }`                      |
| **User Model**              | findById              | Jest mock                          | `{ _id: ObjectId, email: 'user@test.com', fullName: 'Test User' }`                                                       |
| **Order Object**            | Input data            | Factory/fixture                    | `{ _id: ObjectId, user: ObjectId, totalPrice: 500000, orderNumber: 'ORD123', status: 'paid' }`                           |
| **EmailService**            | sendDiscountCodeEmail | Jest mock/spy                      | Mock to resolve(), assert called with correct args                                                                       |
| **logger**                  | info/error            | Jest mock                          | `jest.spyOn(logger, 'info').mockImplementation()`                                                                        |
| **mongoose.Types.ObjectId** | ObjectId creation     | Use real or mock                   | `new mongoose.Types.ObjectId()` or mocked string IDs                                                                     |
| **express-validator**       | validationResult      | Mock or use real                   | Real validator in integration, mock for unit                                                                             |
| **req/res/next**            | Express objects       | Factory function                   | `{ body: {}, params: {}, query: {}, user: {} }`                                                                          |

### Sample Fixtures

```javascript
// Order Fixtures
const mockOrder = {
  _id: new mongoose.Types.ObjectId(),
  user: new mongoose.Types.ObjectId(),
  orderNumber: 'ORD001',
  totalPrice: 1000000, // 1 million VND = 100 points
  status: 'paid',
  subtotal: 950000,
  shippingCost: 50000,
  tax: 0,
  discount: 0,
};

// User Fixture
const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'customer',
};

// RewardPoint Fixtures
const earnedPoint = {
  _id: new mongoose.Types.ObjectId(),
  user: mockUser._id,
  points: 100,
  type: 'earn',
  order: mockOrder._id,
  description: 'Reward points earned from order #ORD001',
  expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  status: 'active',
};

const redeemedPoint = {
  _id: new mongoose.Types.ObjectId(),
  user: mockUser._id,
  points: -50,
  type: 'redeem',
  description: 'Redeemed 50 points for 50000 VND discount',
  status: 'redeemed',
};
```

---

## 8. Suggested Next Prompts

### Prompt 1: Generate Detailed Test Cases

```
Generate a comprehensive Test Cases Matrix (Markdown) for the feature **Reward Points**, based on this analysis document.

The matrix must include all scenarios from section 5, expanded with:
- Detailed test steps (Given-When-Then format)
- Expected API responses (status codes, body structure)
- Database state assertions
- Mock expectations

Output format: `tests/rewardPoints/test-cases-reward-points.md`
```

### Prompt 2: Generate Unit Test Code (Service Layer)

```
Generate Jest unit test code for Reward Points service layer:
- File: tests/rewardPoints/reward-point-service.test.js
- Test all functions in services/rewardPoint.service.js:
  - createRewardPointsForOrder
  - getUserTotalPoints
  - hasOrderEarnedRewardPoints
  - deductRewardPointsForOrder
- Use Jest mocks for RewardPoint model, logger
- Target: ≥90% coverage for service layer
- Include edge cases from test matrix
```

### Prompt 3: Generate Integration Test Code (Controller + Routes)

```
Generate Jest integration test code for Reward Points API:
- File: tests/rewardPoints/reward-point-controller-integration.test.js
- Use supertest for HTTP requests
- Use mongodb-memory-server for real DB
- Test all endpoints in rewardPointRoutes.js
- Include authentication/authorization checks
- Test validation errors
- Target: ≥85% coverage for controller
```

### Prompt 4: Generate Concurrency & Edge Case Tests

```
Generate Jest test code for Reward Points concurrency and edge cases:
- File: tests/rewardPoints/reward-point-edge-cases.test.js
- Test concurrent redemptions (race conditions)
- Test negative balance prevention
- Test expiry date logic
- Test duplicate order point prevention
- Test fallback price calculations
- Use Promise.all for concurrent scenarios
```

### Prompt 5: Generate E2E Flow Tests

```
Generate end-to-end test for complete Reward Points flow:
- File: tests/rewardPoints/reward-point-e2e.test.js
- Flow: Create user → Create order → Payment success → Points earned → Redeem points → Verify discount code
- Test integration with Order, Payment, Discount, Email services
- Use real DB (mongodb-memory-server)
- Mock external services (Email, Payment gateway)
```

### Prompt 6: Generate Model & Schema Tests

```
Generate Jest test code for RewardPoint model:
- File: tests/rewardPoints/reward-point-model.test.js
- Test schema validations (required fields, enums)
- Test pre-save hook (auto expiry date)
- Test indexes
- Test timestamps
- Target: 100% coverage for model
```

---

## Additional Notes

### Known Issues

1. **No idempotency in `deductRewardPointsForOrder`**: Can create duplicate adjustments on multiple refund attempts
2. **No authZ check in `getUserRewardPoints`**: User A can fetch User B's points (privacy issue)
3. **No cap on redemption limit**: Single endpoint call can create large discounts
4. **No concurrency protection**: Race condition in `redeemPoints` if user sends parallel requests
5. **No partial deduction**: Refunds always deduct full earned points, even for partial refunds

### Performance Considerations

- **Aggregation queries**: `getUserTotalPoints` uses 3 separate aggregations; could be optimized
- **No caching**: Total points recalculated on every request
- **No pagination cap**: `getUserRewardPoints` allows unlimited page size

### Security Recommendations

- Add rate limiting on `/redeem` endpoint
- Add authorization check: users can only access their own points
- Validate `userId` in params matches `req.user._id`
- Add CAPTCHA or two-factor for large redemptions

### Test Environment Setup

```bash
# Install test dependencies
npm install --save-dev jest supertest mongodb-memory-server

# Run tests
npm test -- tests/rewardPoints/

# Run with coverage
npm test -- tests/rewardPoints/ --coverage
```
