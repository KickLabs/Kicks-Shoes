# Discounts & Flash Sales – Technical & Testing Analysis

## 1. Feature Overview

- **Business purpose**: The system provides two main promotional mechanisms: discount codes for cart/order discounts and flash sales for time-limited product price reductions
- **Key UI flows involved**:
  - Admin creates/manages discount codes and flash sales
  - Customers view flash sale products on homepage and product listings
  - Customers apply discount codes during checkout
  - Flash sale prices override regular prices in cart and checkout
- **Main business rules & success criteria**:
  - Discount codes have usage limits, minimum purchase requirements, and validity periods
  - Flash sales have active time windows and can override regular product pricing
  - Flash sales take priority over regular discounts
  - Discount codes can be stacked with flash sales (flash sale price + discount code)
- **Why this feature is important for testing**: Critical revenue impact, complex pricing logic, time-sensitive operations, and potential for pricing conflicts

## 2. UI/UX Flow Mapping

| Step | UI Screen/Component       | User Action                  | System Behavior                                             |
| ---- | ------------------------- | ---------------------------- | ----------------------------------------------------------- |
| 1    | Homepage FlashSaleSection | View flash sale products     | Display active flash sale products with countdown timers    |
| 2    | ProductCard               | View product with flash sale | Show flash sale badge, countdown, and flash price           |
| 3    | ProductInfoSection        | View product details         | Display flash sale info, countdown timer, and flash pricing |
| 4    | Cart/Checkout             | Add flash sale product       | Apply flash sale price to cart item                         |
| 5    | OrderSummary              | Enter discount code          | Validate and apply discount code to order total             |
| 6    | CheckOutForm              | Complete order               | Apply both flash sale prices and discount codes             |
| 7    | Admin Dashboard           | Create flash sale            | Set products, timing, and pricing for flash sale            |
| 8    | Admin Dashboard           | Create discount              | Set code, value, limits, and validity period                |

## 3. Related Files, Components & Modules

| File/Path                                                                 | Layer (UI/Logic/Service/State/API) | Responsibility                        | Key Methods/Props/States                                                                 |
| ------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Backend Models**                                                        |
| `backend/src/models/Discount.js`                                          | Data/Model                         | Discount schema and validation        | `isValid()`, `updateStatus()`, validation rules                                          |
| `backend/src/models/FlashSale.js`                                         | Data/Model                         | Flash sale schema and product pricing | `FlashSaleProductSchema`, status enum                                                    |
| **Backend Controllers**                                                   |
| `backend/src/controllers/discountController.js`                           | API/Controller                     | Discount CRUD and validation          | `validateDiscountCode()`, `getActiveDiscounts()`, `createDiscount()`                     |
| `backend/src/controllers/flashSaleController.js`                          | API/Controller                     | Flash sale CRUD and product retrieval | `getCurrentActiveFlashSale()`, `createFlashSale()`, `getFlashSaleByProductId()`          |
| **Backend Services**                                                      |
| `backend/src/services/discount.service.js`                                | Business Logic                     | Discount validation and application   | `validateDiscountCode()`, `applyDiscountToOrder()`, `getActiveDiscounts()`               |
| `backend/src/services/flashSale.service.js`                               | Business Logic                     | Flash sale management and pricing     | `calculateFlashSalePrice()`, `isProductInActiveFlashSale()`, `updateFlashSaleStatuses()` |
| `backend/src/services/order.service.js`                                   | Business Logic                     | Order pricing with flash sales        | `getProductFlashSale()`, order creation with pricing                                     |
| **Frontend Components**                                                   |
| `frontend/src/components/pages/home/components/FlashSaleSection.jsx`      | UI/Component                       | Homepage flash sale display           | `fetchFlashSaleProducts()`, product grid display                                         |
| `frontend/src/components/common/components/ProductCard.jsx`               | UI/Component                       | Product card with flash sale info     | `getProductFlashSale()`, price display logic                                             |
| `frontend/src/components/pages/product/components/ProductInfoSection.jsx` | UI/Component                       | Product detail with flash sale        | Flash sale countdown, pricing display                                                    |
| `frontend/src/components/pages/checkout/components/OrderSummary.jsx`      | UI/Component                       | Discount code application             | `validateDiscountCode()`, `handleApplyCoupon()`                                          |
| `frontend/src/components/pages/checkout/components/CheckOutForm.jsx`      | UI/Component                       | Order creation with pricing           | `prepareOrderData()`, flash sale price application                                       |
| `frontend/src/components/pages/checkout/components/OrderDetails.jsx`      | UI/Component                       | Order display with pricing            | Flash sale price display in order items                                                  |
| `frontend/src/components/pages/dashboard/FlashSaleManagement.jsx`         | UI/Component                       | Admin flash sale management           | CRUD operations for flash sales                                                          |
| **Frontend Services**                                                     |
| `frontend/src/services/discountService.js`                                | API/Service                        | Discount API calls                    | `validateDiscountCode()`, `getActiveDiscounts()`, CRUD operations                        |
| `frontend/src/hooks/useFlashSales.js`                                     | State/Hook                         | Flash sale state management           | `getProductFlashSale()`, `refreshFlashSales()`, periodic updates                         |

## 4. Core Functions / Methods to Test

### Discount Validation (`validateDiscountCode`)

- **Purpose**: Validate discount code against cart and user constraints
- **Inputs + Types**: `code: string`, `userId: string`, `cartTotal: number`, `cartItems: Array`
- **Outputs / Return**: `{isValid: boolean, message?: string, discount?: object, discountAmount?: number}`
- **State Change / Side Effects**: None (read-only validation)
- **Edge Cases**: Expired codes, usage limits exceeded, minimum purchase not met, invalid codes
- **Dependencies (mock needed?)**: `Discount` model, `Order` model for usage tracking

### Flash Sale Price Calculation (`calculateFlashSalePrice`)

- **Purpose**: Calculate final price for products in flash sales
- **Inputs + Types**: `originalPrice: number`, `discountPercent: number`, `flashPrice: number`
- **Outputs / Return**: `number` (calculated price)
- **State Change / Side Effects**: None (pure function)
- **Edge Cases**: `flashPrice` takes priority over `discountPercent`, null/undefined values
- **Dependencies (mock needed?)**: None (pure function)

### Flash Sale Status Update (`updateFlashSaleStatuses`)

- **Purpose**: Automatically update flash sale statuses based on current time
- **Inputs + Types**: None (uses current time)
- **Outputs / Return**: `{upcomingToActive: number, activeToEnded: number}`
- **State Change / Side Effects**: Updates multiple `FlashSale` documents
- **Edge Cases**: Overlapping time windows, concurrent updates
- **Dependencies (mock needed?)**: `FlashSale` model, current time

### Product Flash Sale Check (`getProductFlashSale`)

- **Purpose**: Check if a product is in an active flash sale and return best price
- **Inputs + Types**: `productId: string`
- **Outputs / Return**: `{flashPrice: number, discountPercent: number, flashSaleId: string} | null`
- **State Change / Side Effects**: None (read-only)
- **Edge Cases**: Multiple flash sales for same product, expired flash sales
- **Dependencies (mock needed?)**: `FlashSale` model

### Discount Code Application (`applyDiscountToOrder`)

- **Purpose**: Apply validated discount code to an order
- **Inputs + Types**: `orderId: string`, `discountCode: string`
- **Outputs / Return**: `{success: boolean, message: string, data?: object}`
- **State Change / Side Effects**: Updates order total, increments discount usage count
- **Edge Cases**: Order not found, discount validation fails, concurrent usage
- **Dependencies (mock needed?)**: `Order` model, `Discount` model

## 5. Test Case Matrix

| Category                             | Scenario                              | Pre-condition                                | Input                                                          | Expected Output/Behavior                                 |
| ------------------------------------ | ------------------------------------- | -------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| **Discount Validation - Happy Path** |
| Happy                                | Valid percentage discount             | Active discount code, sufficient cart total  | `code: "SAVE20", cartTotal: 1000`                              | `{isValid: true, discountAmount: 200}`                   |
| Happy                                | Valid fixed discount                  | Active discount code, sufficient cart total  | `code: "FIXED100", cartTotal: 1000`                            | `{isValid: true, discountAmount: 100}`                   |
| Happy                                | Discount with max limit               | Percentage discount with maxDiscount         | `code: "SAVE50", cartTotal: 10000, maxDiscount: 500`           | `{isValid: true, discountAmount: 500}`                   |
| **Discount Validation - Edge Cases** |
| Edge                                 | Expired discount code                 | Discount past endDate                        | `code: "EXPIRED", cartTotal: 1000`                             | `{isValid: false, message: "expired"}`                   |
| Edge                                 | Usage limit reached                   | Discount.usedCount >= usageLimit             | `code: "LIMITED", cartTotal: 1000`                             | `{isValid: false, message: "usage limit reached"}`       |
| Edge                                 | Minimum purchase not met              | Cart total below minPurchase                 | `code: "MIN1000", cartTotal: 500`                              | `{isValid: false, message: "minimum purchase required"}` |
| Edge                                 | User limit exceeded                   | User already used discount                   | `code: "ONCE", userId: "user1"`                                | `{isValid: false, message: "already used"}`              |
| **Flash Sale Pricing - Happy Path**  |
| Happy                                | Flash price specified                 | Product in active flash sale                 | `originalPrice: 1000, flashPrice: 800`                         | `800`                                                    |
| Happy                                | Discount percent specified            | Product in active flash sale                 | `originalPrice: 1000, discountPercent: 20`                     | `800`                                                    |
| Happy                                | Both specified (flash price priority) | Product with both pricing methods            | `originalPrice: 1000, flashPrice: 800, discountPercent: 30`    | `800`                                                    |
| **Flash Sale Pricing - Edge Cases**  |
| Edge                                 | No flash sale data                    | Product not in flash sale                    | `originalPrice: 1000, discountPercent: null, flashPrice: null` | `1000`                                                   |
| Edge                                 | Invalid discount percent              | Negative or >100% discount                   | `originalPrice: 1000, discountPercent: 150`                    | `1000` (no discount applied)                             |
| Edge                                 | Zero flash price                      | Flash price set to 0                         | `originalPrice: 1000, flashPrice: 0`                           | `0`                                                      |
| **Flash Sale Status - Happy Path**   |
| Happy                                | Upcoming to active                    | Flash sale start time reached                | `status: "upcoming", startDate: past`                          | Status updated to "active"                               |
| Happy                                | Active to ended                       | Flash sale end time reached                  | `status: "active", endDate: past`                              | Status updated to "ended"                                |
| **Flash Sale Status - Edge Cases**   |
| Edge                                 | Overlapping flash sales               | Multiple active flash sales for same product | Product in 2 active flash sales                                | Return best (lowest) price                               |
| Edge                                 | Concurrent status updates             | Multiple processes updating status           | Race condition scenario                                        | Consistent final state                                   |
| **Integration - Cart/Checkout**      |
| Integration                          | Flash sale + discount code            | Product in flash sale + valid discount       | Flash sale product + discount code                             | Flash price + discount applied                           |
| Integration                          | Regular product + discount            | Normal product + valid discount              | Regular product + discount code                                | Regular price + discount applied                         |
| Integration                          | Expired flash sale                    | Product was in flash sale but expired        | Product with expired flash sale                                | Use regular price                                        |
| **Error Handling**                   |
| Error                                | Database connection failure           | Database unavailable                         | Any discount/flash sale operation                              | Graceful error handling                                  |
| Error                                | Invalid product ID                    | Non-existent product                         | `getProductFlashSale("invalid")`                               | Return null                                              |
| Error                                | Malformed discount data               | Invalid discount object                      | Corrupted discount data                                        | Validation error                                         |

## 6. Test Priority Recommendation

| Module/Function               | Priority | Justification                                           |
| ----------------------------- | -------- | ------------------------------------------------------- |
| **High Priority**             |
| `validateDiscountCode`        | High     | Core business logic, revenue impact, user-facing        |
| `calculateFlashSalePrice`     | High     | Critical pricing logic, affects all flash sale displays |
| `getProductFlashSale`         | High     | Used throughout UI, affects product pricing everywhere  |
| `applyDiscountToOrder`        | High     | Revenue impact, order processing critical path          |
| **Medium Priority**           |
| `updateFlashSaleStatuses`     | Medium   | Automated process, affects flash sale availability      |
| `isProductInActiveFlashSale`  | Medium   | Used in product displays, affects user experience       |
| `getCurrentActiveFlashSale`   | Medium   | Homepage display, affects user engagement               |
| **Low Priority**              |
| `getFlashSaleDetailedStats`   | Low      | Admin analytics, not user-facing                        |
| `createFlashSaleFromProducts` | Low      | Admin utility function                                  |
| `getUpcomingFlashSales`       | Low      | Admin/display function                                  |

## 7. Mocking & Test Data Preparation

| Dependency                   | What to Mock                          | Mocking Strategy                 | Sample Mock Data                                                       |
| ---------------------------- | ------------------------------------- | -------------------------------- | ---------------------------------------------------------------------- |
| **Database Models**          |
| `Discount`                   | `findOne()`, `find()`, `save()`       | Jest mock with resolved values   | `{code: "SAVE20", type: "percentage", value: 20, isValid: () => true}` |
| `FlashSale`                  | `find()`, `findOne()`, `updateMany()` | Jest mock with resolved values   | `{status: "active", products: [{productId: "123", flashPrice: 800}]}`  |
| `Order`                      | `countDocuments()`, `findById()`      | Jest mock for usage tracking     | `{user: "user1", discountCode: "SAVE20", status: "delivered"}`         |
| **External Services**        |
| `logger`                     | `info()`, `error()`, `warn()`         | Jest mock functions              | `{info: jest.fn(), error: jest.fn()}`                                  |
| **Time-dependent Functions** |
| `new Date()`                 | Current time                          | Mock with `jest.useFakeTimers()` | `new Date('2024-01-15T10:00:00Z')`                                     |
| **API Responses**            |
| Discount validation API      | HTTP responses                        | Mock axios responses             | `{data: {isValid: true, discountAmount: 200}}`                         |
| Flash sale API               | HTTP responses                        | Mock axios responses             | `{data: {data: [{_id: "123", flashPrice: 800}]}}`                      |

## 8. Suggested Next Prompts

- **Generate detailed test cases**: "Create comprehensive unit test cases for discount validation and flash sale pricing functions with edge cases and error scenarios"
- **Generate unit test code**: "Write Jest unit tests for discount.service.js and flashSale.service.js with proper mocking and test data setup"
- **Generate integration tests**: "Create integration tests for discount code application in checkout flow and flash sale price display in product components"
- **Generate E2E tests**: "Write end-to-end tests for complete discount and flash sale user journeys from product view to order completion"
- **Generate performance tests**: "Create performance tests for flash sale status updates and discount validation under high load"
- **Generate security tests**: "Write security tests for discount code validation to prevent abuse and unauthorized access"
