# Dashboard & Reports - Backend Analysis

## 1. Feature Overview

### Business Purpose

Dashboard & Reports là tính năng cốt lõi cho phép Shop Owner và Admin theo dõi, quản lý và phân tích hoạt động kinh doanh của hệ thống e-commerce. Feature này cung cấp:

- **Shop Dashboard**: Thống kê doanh thu, đơn hàng, sản phẩm bán chạy, feedback, và quản lý discount
- **Admin Dashboard**: Giám sát toàn bộ hệ thống (users, orders, products, stores), xử lý reports, quản lý categories
- **Financial Reports**: Báo cáo doanh thu, tăng trưởng khách hàng, top sản phẩm theo thời gian (daily/weekly/monthly)
- **Report Management**: Xử lý các báo cáo vi phạm từ users về products/reviews

### Key Business Rules

1. **Authorization**:

   - Shop routes: Chỉ users có role 'shop' mới truy cập được
   - Admin routes: Chỉ users có role 'admin' mới truy cập được
   - My reports: Authenticated users có thể xem reports về feedback của chính họ

2. **Data Aggregation**:

   - Revenue chỉ tính từ orders có status 'delivered'
   - Statistics có thể filter theo period: daily, weekly, monthly
   - Pagination cho danh sách có nhiều records

3. **Report Resolution**:

   - Admin có thể ignore (no_action), warning, hoặc delete (product/comment)
   - Khi resolve report: gửi email thông báo cho các bên liên quan (reporter, shop, review author)
   - Soft delete cho feedback (status=false) thay vì hard delete

4. **Reward Points Integration**:
   - Khi order status chuyển sang 'delivered', tự động cộng reward points cho customer
   - Kiểm tra để không cộng points trùng lặp

### Success Criteria

- Tất cả endpoints trả về đúng data format
- Authorization middleware hoạt động chính xác (403 nếu không có quyền)
- Aggregation queries hiệu quả với large dataset
- Email notifications được gửi đúng khi resolve reports
- Empty data handling: trả về empty arrays hoặc 0 values thay vì errors

### Why Important for Testing

- **High Business Impact**: Dashboard là công cụ chính để ra quyết định kinh doanh
- **Complex Aggregations**: MongoDB aggregation pipelines cần test kỹ (empty data, edge cases)
- **Authorization Critical**: Không được để shop xem data của admin và ngược lại
- **Performance**: Các queries có thể chậm với large datasets
- **Side Effects**: Resolve reports trigger emails, cập nhật multiple models

---

## 2. UI/UX Flow Mapping

**Note**: Người dùng yêu cầu không test frontend, nên phần này mô tả flow từ góc nhìn API endpoints.

### Shop Dashboard Flow

| Step | API Endpoint                                     | User Action                   | System Behavior                                                                                                                  |
| ---- | ------------------------------------------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `GET /api/dashboard/shop/stats`                  | Shop owner truy cập dashboard | Trả về tổng quan: totalOrders, totalRevenue, revenueChange %, totalProducts, averageRating, orderStatusDistribution, topProducts |
| 2    | `GET /api/dashboard/shop/orders?page=1&limit=10` | Xem danh sách orders          | Trả về orders với pagination, populate user và items                                                                             |
| 3    | `PUT /api/dashboard/shop/orders/:orderId/status` | Cập nhật order status         | Cập nhật status, tự động cộng reward points nếu status='delivered'                                                               |
| 4    | `GET /api/dashboard/shop/sales?period=monthly`   | Xem biểu đồ sales             | Trả về sales data aggregated theo period (daily/weekly/monthly)                                                                  |
| 5    | `GET /api/dashboard/shop/feedback?page=1`        | Xem feedback của shop         | Trả về active feedbacks với pagination                                                                                           |
| 6    | `GET /api/dashboard/shop/discounts`              | Quản lý discounts             | Trả về danh sách discounts do shop tạo (source='shop')                                                                           |
| 7    | `POST /api/dashboard/shop/discounts`             | Tạo discount mới              | Tạo discount với source='shop'                                                                                                   |
| 8    | `DELETE /api/dashboard/shop/discounts/:id`       | Xóa discount                  | Xóa discount theo ID                                                                                                             |

### Admin Dashboard Flow

| Step | API Endpoint                                         | User Action              | System Behavior                                                                         |
| ---- | ---------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| 1    | `GET /api/dashboard/admin/stats`                     | Admin truy cập dashboard | Trả về: totalUsers, totalOrders, totalRevenue, totalProducts, totalStores, recentOrders |
| 2    | `GET /api/dashboard/admin/users?page=1`              | Quản lý users            | Trả về danh sách users với pagination (exclude password)                                |
| 3    | `PUT /api/dashboard/admin/users/:userId/ban`         | Ban user                 | Cập nhật user.status=false, gửi email thông báo USER_BANNED                             |
| 4    | `PUT /api/dashboard/admin/users/:userId/unban`       | Unban user               | Cập nhật user.status=true, gửi email USER_UNBANNED                                      |
| 5    | `GET /api/dashboard/admin/reported-products?page=1`  | Xem reports              | Trả về reports với populated targetId (product/feedback/comment/user)                   |
| 6    | `PUT /api/dashboard/admin/reports/:id/resolve`       | Xử lý report             | Cập nhật report status, thực hiện action (delete/warning), gửi emails                   |
| 7    | `PUT /api/dashboard/admin/reports/:id/ignore`        | Ignore report            | Cập nhật status='resolved', resolution='no_action'                                      |
| 8    | `GET /api/dashboard/admin/categories?page=1`         | Quản lý categories       | Trả về categories với productsCount                                                     |
| 9    | `POST /api/dashboard/admin/categories`               | Tạo category mới         | Tạo category, validate tên không trùng                                                  |
| 10   | `PUT /api/dashboard/admin/categories/:id`            | Sửa category             | Cập nhật category, validate tên không trùng với category khác                           |
| 11   | `DELETE /api/dashboard/admin/categories/:id`         | Xóa category             | Kiểm tra không có products, nếu có thì reject                                           |
| 12   | `PUT /api/dashboard/admin/categories/:id/activate`   | Activate category        | Cập nhật status=true                                                                    |
| 13   | `PUT /api/dashboard/admin/categories/:id/deactivate` | Deactivate category      | Cập nhật status=false                                                                   |

### Financial Reports Flow

| Step | API Endpoint                                              | User Action           | System Behavior                                   |
| ---- | --------------------------------------------------------- | --------------------- | ------------------------------------------------- |
| 1    | `GET /api/dashboard/admin/revenue?period=monthly`         | Xem revenue report    | Aggregate revenue theo period từ delivered orders |
| 2    | `GET /api/dashboard/admin/user-growth?period=monthly`     | Xem user growth       | Aggregate số users mới theo period                |
| 3    | `GET /api/dashboard/admin/orders-data?period=monthly`     | Xem orders report     | Aggregate số orders theo period                   |
| 4    | `GET /api/dashboard/admin/top-products?limit=5`           | Xem top products      | Aggregate top selling products                    |
| 5    | `GET /api/dashboard/admin/shop-revenue`                   | Xem revenue theo shop | Aggregate revenue grouped by store                |
| 6    | `GET /api/dashboard/admin/customer-growth?period=monthly` | Xem customer growth   | Aggregate customers (role='customer') theo period |

### User Report Flow

| Step | API Endpoint                             | User Action                           | System Behavior                                                  |
| ---- | ---------------------------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| 1    | `GET /api/dashboard/my/feedback-reports` | User xem reports về feedback của mình | Tìm feedbacks của user, sau đó tìm reports về những feedbacks đó |

---

## 3. Related Files, Components & Modules

| File/Path                                        | Layer      | Responsibility                                       | Key Methods/Props/States                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------ | ---------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `backend/src/controllers/dashboardController.js` | Controller | Xử lý business logic cho tất cả dashboard endpoints  | **Shop**: `getShopStats`, `getShopOrders`, `getShopFeedback`, `getShopDiscounts`, `getShopSalesData`, `updateOrderStatus`, `createDiscount`, `deleteDiscount` <br>**Admin**: `getAdminStats`, `getAdminUsers`, `getAdminReportedProducts`, `getAdminFeedback`, `getAdminRevenueData`, `getAdminUserGrowthData`, `getAdminOrdersData`, `getAdminTopProductsData`, `getAdminShopRevenueData`, `getAdminCustomerGrowthData`, `getAdminCategories`, `activateCategory`, `deactivateCategory`, `createCategory`, `updateCategory`, `deleteCategory`, `banUser`, `unbanUser`, `deleteReportedProduct`, `deleteFeedback`, `ignoreProductReport`, `resolveProductReport`, `getMyFeedbackReports`, `getAdminDiscounts`, `createAdminDiscount` |
| `backend/src/routes/dashboardRoutes.js`          | Routes     | Map HTTP endpoints to controllers, apply middlewares | 25 routes với các middlewares: `protect`, `requireAdmin`, `requireShop`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `backend/src/models/Report.js`                   | Model      | Schema cho reports về products/reviews               | Fields: `reporter`, `targetType` (product/review), `targetId`, `reason`, `description`, `evidence[]`, `status` (pending/investigating/resolved/dismissed), `adminNote`, `resolution`, `resolvedBy`, `resolvedAt` <br>Indexes: reporter, targetType+targetId, status, reason, createdAt <br>Unique index: reporter+targetType+targetId                                                                                                                                                                                                                                                                                                                                                                                                |
| `backend/src/models/Order.js`                    | Model      | Schema cho orders (dependency)                       | Sử dụng trong aggregations: `status`, `totalPrice`, `createdAt`, `user`, `items`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `backend/src/models/User.js`                     | Model      | Schema cho users (dependency)                        | Sử dụng trong: count users, ban/unban, role filtering                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `backend/src/models/Product.js`                  | Model      | Schema cho products (dependency)                     | Sử dụng trong: count products, delete products, aggregations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `backend/src/models/Feedback.js`                 | Model      | Schema cho feedbacks (dependency)                    | Sử dụng trong: get feedbacks, delete feedbacks, rating aggregations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `backend/src/models/Discount.js`                 | Model      | Schema cho discounts (dependency)                    | Sử dụng trong: create/delete discounts, filter by source (shop/admin)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `backend/src/models/Store.js`                    | Model      | Schema cho stores (dependency)                       | Sử dụng trong: count stores, shop revenue aggregation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `backend/src/models/Category.js`                 | Model      | Schema cho categories                                | CRUD operations, status management                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `backend/src/middlewares/auth.middleware.js`     | Middleware | Authentication                                       | `protect`: Verify JWT token, attach req.user                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `backend/src/middlewares/role.middleware.js`     | Middleware | Authorization                                        | `requireAdmin`: Check user.role === 'admin' <br>`requireShop`: Check user.role === 'shop' <br>`requireRoles`: Check user.role in allowed roles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `backend/src/middlewares/async.middleware.js`    | Middleware | Error handling                                       | `asyncHandler`: Wrap async functions để catch errors                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `backend/src/utils/errorResponse.js`             | Utility    | Custom error class                                   | `ErrorResponse`: Extend Error với statusCode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `backend/src/utils/sendEmail.js`                 | Utility    | Email service                                        | `sendTemplatedEmail`: Gửi emails khi ban/unban users, resolve reports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `backend/src/templates/email.templates.js`       | Templates  | Email templates                                      | Templates: USER_BANNED, USER_UNBANNED, REVIEW_DELETED, REVIEW_DELETED_SHOP, REPORT_RESOLVED, PRODUCT_DELETED, PRODUCT_WARNING, REVIEW_WARNING                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `backend/src/services/rewardPoint.service.js`    | Service    | Reward points logic                                  | `createRewardPointsForOrder`: Tự động cộng points khi order delivered <br>`hasOrderEarnedRewardPoints`: Kiểm tra đã cộng points chưa                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

---

## 4. Core Functions / Methods to Test

### 4.1. Shop Dashboard Functions

#### `getShopStats(req, res)`

- **Purpose**: Lấy tổng quan thống kê cho shop dashboard
- **Inputs**:
  - `req.user.storeId` hoặc `req.user.id` (number/ObjectId)
- **Outputs**:
  ```json
  {
    "success": true,
    "data": {
      "totalOrders": Number,
      "totalRevenue": Number,
      "totalRevenueChange": Number,
      "totalProducts": Number,
      "averageRating": Number,
      "totalReviews": Number,
      "orderStatusDistribution": [{ "name": String, "value": Number }],
      "topProducts": [{ "name": String, "mainImage": String, "category": ObjectId, "price": Number, "sales": Number }]
    }
  }
  ```
- **State Change**: None (read-only)
- **Edge Cases**:
  - Không có orders nào → totalOrders = 0, totalRevenue = 0
  - Không có delivered orders → totalRevenue = 0
  - Previous month revenue = 0 → revenueChange = 0
  - Không có feedback → averageRating = 0, totalReviews = 0
  - Không có products → topProducts = []
- **Dependencies**:
  - `Order.countDocuments()`
  - `Order.aggregate()` (revenue, current/previous month, status distribution, top products)
  - `Product.countDocuments()`
  - `Feedback.aggregate()` (rating)

#### `getShopOrders(req, res)`

- **Purpose**: Lấy danh sách orders với pagination
- **Inputs**:
  - `req.query.page` (number, default: 1)
  - `req.query.limit` (number, default: 10)
- **Outputs**:
  ```json
  {
    "success": true,
    "data": {
      "orders": Array,
      "pagination": { "page": Number, "limit": Number, "total": Number, "pages": Number }
    }
  }
  ```
- **State Change**: None (read-only)
- **Edge Cases**:
  - page < 1 → NaN or invalid skip
  - limit quá lớn (>1000) → performance issue
  - Không có orders → orders = []
  - Invalid page/limit strings → parseInt returns NaN
- **Dependencies**: `Order.find()`, `Order.countDocuments()`, `Order.populate()`

#### `getShopFeedback(req, res)`

- **Purpose**: Lấy danh sách active feedbacks với pagination
- **Inputs**: `req.query.page`, `req.query.limit`
- **Outputs**: Tương tự `getShopOrders` nhưng với feedback data
- **Edge Cases**: Tương tự getShopOrders, thêm filter `status: true`
- **Dependencies**: `Feedback.find()`, `Feedback.countDocuments()`, `Feedback.populate()`

#### `getShopDiscounts(req, res)`

- **Purpose**: Lấy danh sách discounts do shop tạo
- **Inputs**: None (auto filter by source='shop')
- **Outputs**: `{ success: true, data: Array }`
- **Edge Cases**: Không có discounts → data = []
- **Dependencies**: `Discount.find({ source: 'shop' })`

#### `getShopSalesData(req, res)`

- **Purpose**: Lấy sales data theo period
- **Inputs**: `req.query.period` (daily/weekly/monthly, default: monthly)
- **Outputs**:
  ```json
  {
    "success": true,
    "data": [{ "_id": String, "totalSales": Number, "orderCount": Number }]
  }
  ```
- **State Change**: None
- **Edge Cases**:
  - Invalid period → default to monthly
  - Không có delivered orders → data = []
  - Date format theo period: daily (%Y-%m-%d), weekly (%Y-%U), monthly (%Y-%m)
- **Dependencies**: `Order.aggregate()` với `$dateToString`

#### `updateOrderStatus(req, res)`

- **Purpose**: Cập nhật order status và tự động cộng reward points nếu delivered
- **Inputs**:
  - `req.params.orderId` (ObjectId)
  - `req.body.status` (String)
- **Outputs**: `{ success: true, data: Order }`
- **State Change**:
  - Order.status được update
  - Nếu status = 'delivered': Tạo RewardPoint record cho user
- **Edge Cases**:
  - orderId không tồn tại → 404 error
  - status = 'delivered' nhưng đã cộng points rồi → không cộng lại
  - Reward service fails → log error nhưng vẫn cập nhật order status
  - Missing status in body → status = undefined (invalid)
- **Dependencies**:
  - `Order.findById()`, `Order.save()`
  - `hasOrderEarnedRewardPoints(orderId)`
  - `createRewardPointsForOrder(order)`

#### `createDiscount(req, res)`

- **Purpose**: Tạo discount mới cho shop
- **Inputs**: `req.body` (discount data)
- **Outputs**: `{ success: true, data: Discount }`
- **State Change**: Tạo mới Discount document với source='shop'
- **Edge Cases**:
  - Missing required fields → Mongoose validation error
  - Invalid date ranges → Business logic error
- **Dependencies**: `Discount.create()`

#### `deleteDiscount(req, res)`

- **Purpose**: Xóa discount
- **Inputs**: `req.params.discountId`
- **Outputs**: `{ success: true, message: String }`
- **State Change**: Xóa Discount document
- **Edge Cases**:
  - discountId không tồn tại → 404 error
  - Invalid ObjectId → Mongoose cast error
- **Dependencies**: `Discount.findByIdAndDelete()`

---

### 4.2. Admin Dashboard Functions

#### `getAdminStats(req, res)`

- **Purpose**: Lấy tổng quan thống kê cho admin dashboard
- **Inputs**: None
- **Outputs**:
  ```json
  {
    "success": true,
    "data": {
      "totalUsers": Number,
      "totalOrders": Number,
      "totalRevenue": Number,
      "totalProducts": Number,
      "totalStores": Number,
      "recentOrders": Array
    }
  }
  ```
- **State Change**: None (read-only)
- **Edge Cases**: Tương tự getShopStats
- **Dependencies**: User, Order, Product, Store models

#### `getAdminUsers(req, res)`

- **Purpose**: Lấy danh sách users với pagination (exclude password)
- **Inputs**: `req.query.page`, `req.query.limit`
- **Outputs**: Pagination response với users data
- **Edge Cases**: Tương tự getShopOrders
- **Dependencies**: `User.find().select('-password')`

#### `getAdminReportedProducts(req, res)`

- **Purpose**: Lấy danh sách reports với populated target
- **Inputs**: `req.query.page`, `req.query.limit`
- **Outputs**: Pagination response với reports và populated target
- **State Change**: None
- **Edge Cases**:
  - targetId không tồn tại (đã bị xóa) → populatedTarget = null
  - targetType không nằm trong [product, feedback, comment, user] → không populate
  - Large number of reports → performance issue với Promise.all
- **Dependencies**:
  - `Report.find()`, `Report.populate('reporter')`
  - `Product.findById()`, `Feedback.findById()`, `Comment.findById()`, `User.findById()`

#### `getAdminFeedback(req, res)`

- **Purpose**: Lấy feedbacks chưa bị xóa (status != false)
- **Inputs**: `req.query.page`, `req.query.limit`
- **Outputs**: Pagination response
- **Edge Cases**: Tương tự getShopFeedback nhưng filter khác
- **Dependencies**: `Feedback.find({ status: { $ne: false } })`

#### `getAdminRevenueData(req, res)`

- **Purpose**: Lấy revenue data theo period
- **Inputs**: `req.query.period`
- **Outputs**: Aggregation result với totalRevenue và orderCount
- **Edge Cases**: Tương tự getShopSalesData
- **Dependencies**: `Order.aggregate()`

#### `getAdminUserGrowthData(req, res)`

- **Purpose**: Aggregate user growth theo period
- **Inputs**: `req.query.period`
- **Outputs**: `{ success: true, data: [{ "_id": String, "customers": Number }] }`
- **Edge Cases**: Không có users → data = []
- **Dependencies**: `User.aggregate()`

#### `getAdminOrdersData(req, res)`

- **Purpose**: Aggregate orders data theo period (delivered/shipped/processing)
- **Inputs**: `req.query.period`
- **Outputs**: `{ success: true, data: [{ "_id": String, "orders": Number }] }`
- **Edge Cases**: Không có orders với status match → data = []
- **Dependencies**: `Order.aggregate()`

#### `getAdminTopProductsData(req, res)`

- **Purpose**: Lấy top selling products
- **Inputs**: `req.query.limit` (default: 5)
- **Outputs**: `{ success: true, data: [{ "productName": String, "sales": Number }] }`
- **Edge Cases**:
  - Không có orders → data = []
  - limit quá lớn → tất cả products
  - limit = 0 → data = []
- **Dependencies**: `Order.aggregate()` với lookup orderitems và products

#### `getAdminShopRevenueData(req, res)`

- **Purpose**: Aggregate revenue grouped by store
- **Inputs**: None
- **Outputs**: `{ success: true, data: [{ "shopName": String, "revenue": Number }] }`
- **Edge Cases**:
  - Orders không có store field → không match trong lookup
  - Store bị xóa → shopName = null/undefined
- **Dependencies**: `Order.aggregate()` với lookup stores

#### `getAdminCustomerGrowthData(req, res)`

- **Purpose**: Aggregate customer (role='customer') growth theo period
- **Inputs**: `req.query.period`
- **Outputs**: `{ success: true, data: [{ "_id": String, "customers": Number }] }`
- **Edge Cases**: Không có users với role='customer' → data = []
- **Dependencies**: `User.aggregate()` với match role='customer'

#### `getAdminCategories(req, res)`

- **Purpose**: Lấy categories với productsCount
- **Inputs**: `req.query.page`, `req.query.limit`
- **Outputs**: Categories với productsCount cho mỗi category
- **State Change**: None
- **Edge Cases**:
  - Category không có products → productsCount = 0
  - Performance issue với Promise.all khi có nhiều categories
- **Dependencies**: `Category.find()`, `Product.countDocuments({ category: id })`

#### `activateCategory(req, res)` / `deactivateCategory(req, res)`

- **Purpose**: Cập nhật category status
- **Inputs**: `req.params.categoryId`
- **Outputs**: `{ success: true, data: Category }`
- **State Change**: Category.status = true/false
- **Edge Cases**: categoryId không tồn tại → 404
- **Dependencies**: `Category.findByIdAndUpdate()`

#### `createCategory(req, res)`

- **Purpose**: Tạo category mới
- **Inputs**: `req.body` (name, description, image, status)
- **Outputs**: `{ success: true, data: Category }`
- **State Change**: Tạo mới Category document
- **Edge Cases**:
  - Tên category đã tồn tại (case-insensitive) → 400 error
  - Missing name → Mongoose validation error
- **Dependencies**: `Category.findOne()` (check duplicate), `Category.create()`

#### `updateCategory(req, res)`

- **Purpose**: Cập nhật category
- **Inputs**: `req.params.categoryId`, `req.body`
- **Outputs**: `{ success: true, data: Category }`
- **State Change**: Cập nhật Category document
- **Edge Cases**:
  - categoryId không tồn tại → 404
  - Tên mới trùng với category khác → 400 error
  - Không đổi tên (name giữ nguyên) → skip duplicate check
- **Dependencies**: `Category.findById()`, `Category.findOne()`, `Category.findByIdAndUpdate()`

#### `deleteCategory(req, res)`

- **Purpose**: Xóa category nếu không có products
- **Inputs**: `req.params.categoryId`
- **Outputs**: `{ success: true, message: String }`
- **State Change**: Xóa Category document
- **Edge Cases**:
  - categoryId không tồn tại → 404
  - Category có products → 400 error với message
  - productsCount > 0 → reject deletion
- **Dependencies**: `Category.findById()`, `Product.countDocuments()`, `Category.findByIdAndDelete()`

#### `banUser(req, res)` / `unbanUser(req, res)`

- **Purpose**: Ban/unban user và gửi email thông báo
- **Inputs**:
  - `req.params.userId`
  - `req.body.adminNote`, `req.body.banReason` (for ban)
- **Outputs**: `{ success: true, data: User, message: String }`
- **State Change**:
  - User.status = false/true
  - Gửi email thông báo
- **Edge Cases**:
  - userId không tồn tại → 404
  - User không có email → skip email, không fail request
  - Email service fails → log error, không fail request
  - Missing adminNote/banReason → sử dụng default values
- **Dependencies**:
  - `User.findByIdAndUpdate()`
  - `sendTemplatedEmail()` (USER_BANNED, USER_UNBANNED templates)

#### `deleteReportedProduct(req, res)`

- **Purpose**: Xóa product (khi admin xử lý report)
- **Inputs**: `req.params.productId`
- **Outputs**: `{ success: true, message: String }`
- **State Change**: Xóa Product document
- **Edge Cases**: productId không tồn tại → 404
- **Dependencies**: `Product.findByIdAndDelete()`

#### `deleteFeedback(req, res)`

- **Purpose**: Soft delete feedback và gửi emails thông báo
- **Inputs**: `req.params.feedbackId`, `req.user.id` (admin)
- **Outputs**: `{ success: true, message: String }`
- **State Change**:
  - Feedback.status = false, deletedBy = 'admin'
  - Gửi emails: REVIEW_DELETED (to author), REVIEW_DELETED_SHOP (to shop), REPORT_RESOLVED (to reporter)
  - Cập nhật pending report status = 'resolved', resolution = 'delete_comment'
- **Edge Cases**:
  - feedbackId không tồn tại → 404
  - Feedback không có user/product → skip some emails
  - Không có pending report → skip reporter email
  - Email fails → log error, không fail request
- **Dependencies**:
  - `Feedback.findById()`, `Feedback.findByIdAndUpdate()`
  - `User.findOne({ role: 'shop' })`, `User.findById()`
  - `Report.findOne()`, `Report.save()`
  - `sendTemplatedEmail()`

#### `ignoreProductReport(req, res)`

- **Purpose**: Ignore report (no action)
- **Inputs**: `req.params.id`, `req.user.id`
- **Outputs**: `{ success: true, message: String }`
- **State Change**: Report.status = 'resolved', resolution = 'no_action', resolvedBy, resolvedAt
- **Edge Cases**: reportId không tồn tại → 404
- **Dependencies**: `Report.findById()`, `Report.save()`

#### `resolveProductReport(req, res)`

- **Purpose**: Resolve report với action (delete_product, delete_comment, warning, no_action)
- **Inputs**:
  - `req.params.id`
  - `req.body.resolution` (String)
  - `req.body.adminNote` (String)
  - `req.user.id`
- **Outputs**: `{ success: true, message: String, data: Report }`
- **State Change**:
  - Report được cập nhật
  - Nếu resolution = 'delete_product': Xóa product, gửi emails
  - Nếu resolution = 'delete_comment': Soft delete feedback, gửi emails
  - Nếu resolution = 'warning': Gửi warning emails
  - Nếu resolution = 'no_action': Chỉ cập nhật report
- **Edge Cases**:
  - reportId không tồn tại → 404
  - targetType không phải product/review → không làm gì
  - Product/feedback đã bị xóa → không tìm thấy để delete
  - Missing resolution/adminNote → undefined values
  - Email fails → log error, không fail request
- **Dependencies**:
  - `Report.findById()`, `Report.save()`
  - `Product.findById()`, `Product.findByIdAndDelete()`
  - `Feedback.findById()`, `Feedback.findByIdAndUpdate()`
  - `User.findOne()`, `User.findById()`
  - `sendTemplatedEmail()` (multiple templates)

#### `getMyFeedbackReports(req, res)`

- **Purpose**: User xem reports về feedbacks của chính họ
- **Inputs**: `req.user.id`
- **Outputs**: `{ success: true, data: Array }`
- **State Change**: None
- **Edge Cases**:
  - User chưa có feedback nào → data = []
  - Feedback đã bị xóa → vẫn show report
  - Report về feedback đã xóa → feedback = null
- **Dependencies**:
  - `Feedback.find({ user: req.user.id })`
  - `Report.find({ targetType: 'review', targetId: { $in: feedbackIds } })`
  - `Report.populate()`, `Feedback.findById().populate()`

#### `getAdminDiscounts(req, res)` / `createAdminDiscount(req, res)`

- **Purpose**: Quản lý admin discounts (source='admin')
- **Inputs**: req.body (for create)
- **Outputs**: `{ success: true, data: Discount/Array }`
- **State Change**: Tạo mới Discount với source='admin'
- **Edge Cases**: Tương tự shop discounts
- **Dependencies**: `Discount.find()`, `Discount.create()`

---

## 5. Test Case Matrix

### 5.1. Shop Dashboard Tests

| Category        | Scenario                                                    | Pre-condition                                            | Input                         | Expected Output/Behavior                        |
| --------------- | ----------------------------------------------------------- | -------------------------------------------------------- | ----------------------------- | ----------------------------------------------- |
| **Unit**        | getShopStats: Tính revenue change khi previous month = 0    | DB có orders tháng hiện tại, không có orders tháng trước | -                             | revenueChange = 0                               |
| **Unit**        | getShopStats: Tính revenue change khi có cả 2 tháng         | Previous month: 1000, Current month: 1500                | -                             | revenueChange = 50                              |
| **Unit**        | getShopStats: Empty data - không có orders                  | DB không có orders                                       | -                             | totalOrders=0, totalRevenue=0, revenueChange=0  |
| **Unit**        | getShopStats: Empty data - không có feedbacks               | DB không có feedbacks                                    | -                             | averageRating=0, totalReviews=0                 |
| **Unit**        | getShopStats: Top products aggregation                      | DB có orders với orderItems                              | -                             | topProducts array (max 4 items) với sales count |
| **Unit**        | getShopStats: Order status distribution                     | DB có orders với các status khác nhau                    | -                             | orderStatusDistribution array với tất cả status |
| **Unit**        | getShopOrders: Pagination với page = 1, limit = 10          | DB có 25 orders                                          | page=1, limit=10              | 10 orders, total=25, pages=3                    |
| **Unit**        | getShopOrders: Pagination với page không hợp lệ             | DB có orders                                             | page=0 hoặc page=-1           | NaN skip hoặc negative skip                     |
| **Unit**        | getShopOrders: Empty orders list                            | DB không có orders                                       | page=1                        | orders=[], total=0, pages=0                     |
| **Unit**        | getShopFeedback: Filter chỉ active feedback                 | DB có feedback với status=true và status=false           | -                             | Chỉ trả về status=true                          |
| **Unit**        | getShopDiscounts: Filter by source='shop'                   | DB có discounts với source='shop' và 'admin'             | -                             | Chỉ trả về source='shop'                        |
| **Unit**        | getShopSalesData: Period = daily                            | DB có delivered orders                                   | period='daily'                | \_id format: YYYY-MM-DD                         |
| **Unit**        | getShopSalesData: Period = weekly                           | DB có delivered orders                                   | period='weekly'               | \_id format: YYYY-WW                            |
| **Unit**        | getShopSalesData: Period = monthly (default)                | DB có delivered orders                                   | period='monthly' or undefined | \_id format: YYYY-MM                            |
| **Unit**        | getShopSalesData: Invalid period                            | DB có orders                                             | period='yearly'               | Default to monthly                              |
| **Unit**        | getShopSalesData: Empty data                                | Không có delivered orders                                | -                             | data = []                                       |
| **Unit**        | updateOrderStatus: Update to 'delivered'                    | Order tồn tại, chưa có reward points                     | orderId, status='delivered'   | Order.status updated, RewardPoint created       |
| **Unit**        | updateOrderStatus: Update to 'delivered' nhưng đã có points | Order tồn tại, đã có reward points                       | orderId, status='delivered'   | Order.status updated, không tạo RewardPoint mới |
| **Unit**        | updateOrderStatus: Order không tồn tại                      | -                                                        | orderId='invalid'             | 404 error                                       |
| **Unit**        | updateOrderStatus: Reward service fails                     | Order tồn tại, reward service throws error               | orderId, status='delivered'   | Order vẫn được update, log error                |
| **Unit**        | createDiscount: Valid data                                  | -                                                        | Valid discount body           | 201 created, source='shop'                      |
| **Unit**        | createDiscount: Missing required fields                     | -                                                        | body = {}                     | Mongoose validation error                       |
| **Unit**        | deleteDiscount: Discount tồn tại                            | Discount ID hợp lệ                                       | discountId                    | 200 success message                             |
| **Unit**        | deleteDiscount: Discount không tồn tại                      | -                                                        | discountId='invalid'          | 404 error                                       |
| **Integration** | GET /shop/stats: Unauthorized access                        | User not authenticated                                   | No token                      | 401 error                                       |
| **Integration** | GET /shop/stats: Customer role access                       | User authenticated, role='customer'                      | Valid token                   | 403 forbidden                                   |
| **Integration** | GET /shop/stats: Shop role access                           | User authenticated, role='shop'                          | Valid token                   | 200 success with data                           |
| **Integration** | PUT /shop/orders/:orderId/status: Missing status in body    | Order exists                                             | body = {}                     | Order.status = undefined (invalid)              |
| **Integration** | POST /shop/discounts: Invalid JSON body                     | -                                                        | Invalid JSON                  | 400 bad request                                 |
| **Edge**        | getShopStats: Large date range                              | 10+ years of orders                                      | -                             | Query performance test                          |
| **Edge**        | getShopOrders: limit = 1000                                 | DB có 10000 orders                                       | limit=1000                    | Performance acceptable, all 1000 returned       |
| **Edge**        | getShopSalesData: Date range cross year boundary            | Orders từ Dec 2023 đến Jan 2024                          | period='monthly'              | Correctly group by YYYY-MM                      |

### 5.2. Admin Dashboard Tests

| Category        | Scenario                                                   | Pre-condition                                      | Input                                 | Expected Output/Behavior                                |
| --------------- | ---------------------------------------------------------- | -------------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| **Unit**        | getAdminStats: All counters                                | DB có users, orders, products, stores              | -                                     | All count values correct                                |
| **Unit**        | getAdminStats: Recent orders limit                         | DB có 100 orders                                   | -                                     | recentOrders array (max 5)                              |
| **Unit**        | getAdminUsers: Exclude password                            | DB có users                                        | -                                     | Users không có password field                           |
| **Unit**        | getAdminReportedProducts: Populate targetId (product)      | Report với targetType='product'                    | -                                     | report.target là populated product object               |
| **Unit**        | getAdminReportedProducts: Populate targetId (feedback)     | Report với targetType='review'                     | -                                     | report.target là populated feedback với user và product |
| **Unit**        | getAdminReportedProducts: Target đã bị xóa                 | Report có targetId không còn tồn tại               | -                                     | report.target = null                                    |
| **Unit**        | getAdminReportedProducts: Multiple targetTypes             | Reports với product, review, comment, user         | -                                     | Mỗi report.target được populate đúng                    |
| **Unit**        | getAdminFeedback: Filter status != false                   | DB có feedback status=true và status=false         | -                                     | Chỉ trả về status != false                              |
| **Unit**        | getAdminRevenueData: Aggregate by period                   | Orders delivered trong 6 tháng                     | period='monthly'                      | 6 records với revenue per month                         |
| **Unit**        | getAdminUserGrowthData: Count all users                    | 100 users trong DB                                 | -                                     | Aggregate count by period                               |
| **Unit**        | getAdminOrdersData: Filter multiple status                 | Orders với delivered, shipped, processing          | -                                     | Aggregate chỉ 3 status này                              |
| **Unit**        | getAdminTopProductsData: Limit = 5                         | 100 products                                       | limit=5                               | 5 top products                                          |
| **Unit**        | getAdminTopProductsData: Limit = 0                         | Products exist                                     | limit=0                               | data = []                                               |
| **Unit**        | getAdminShopRevenueData: No store field in orders          | Orders không có store                              | -                                     | data = [] (không match lookup)                          |
| **Unit**        | getAdminShopRevenueData: Store đã bị xóa                   | Order.store tồn tại nhưng Store không tồn tại      | -                                     | shopName = null/undefined                               |
| **Unit**        | getAdminCustomerGrowthData: Filter role='customer'         | Users có role customer, shop, admin                | -                                     | Chỉ count customers                                     |
| **Unit**        | getAdminCategories: productsCount = 0                      | Category không có products                         | -                                     | category.productsCount = 0                              |
| **Unit**        | getAdminCategories: Performance với 100 categories         | 100 categories                                     | -                                     | Promise.all performance test                            |
| **Unit**        | activateCategory: Category tồn tại                         | Valid categoryId                                   | categoryId                            | status=true, 200 success                                |
| **Unit**        | activateCategory: Category không tồn tại                   | Invalid categoryId                                 | categoryId                            | 404 error                                               |
| **Unit**        | deactivateCategory: Category tồn tại                       | Valid categoryId                                   | categoryId                            | status=false, 200 success                               |
| **Unit**        | createCategory: Tên unique                                 | Category name chưa tồn tại                         | name='Sneakers'                       | 201 created                                             |
| **Unit**        | createCategory: Tên trùng (case-insensitive)               | Category 'Sneakers' đã tồn tại                     | name='sneakers'                       | 400 error (duplicate)                                   |
| **Unit**        | createCategory: Missing name                               | -                                                  | body = {}                             | Mongoose validation error                               |
| **Unit**        | updateCategory: Update name không trùng                    | Category tồn tại, tên mới unique                   | name='New Name'                       | 200 updated                                             |
| **Unit**        | updateCategory: Update name trùng category khác            | 2 categories, update category A thành tên của B    | name=B.name                           | 400 error (duplicate)                                   |
| **Unit**        | updateCategory: Update name giữ nguyên                     | Category name='A', update name='A'                 | name='A'                              | 200 success (skip duplicate check)                      |
| **Unit**        | updateCategory: Category không tồn tại                     | Invalid categoryId                                 | categoryId                            | 404 error                                               |
| **Unit**        | deleteCategory: Category không có products                 | Category tồn tại, productsCount=0                  | categoryId                            | 200 deleted                                             |
| **Unit**        | deleteCategory: Category có products                       | Category tồn tại, productsCount>0                  | categoryId                            | 400 error với message                                   |
| **Unit**        | deleteCategory: Category không tồn tại                     | Invalid categoryId                                 | categoryId                            | 404 error                                               |
| **Unit**        | banUser: User tồn tại, có email                            | Valid userId, user có email                        | userId, adminNote, banReason          | status=false, email sent                                |
| **Unit**        | banUser: User không có email                               | Valid userId, user.email=null                      | userId                                | status=false, skip email                                |
| **Unit**        | banUser: Email service fails                               | Valid userId, sendTemplatedEmail throws error      | userId                                | status=false, log error, request success                |
| **Unit**        | banUser: User không tồn tại                                | Invalid userId                                     | userId                                | 404 error                                               |
| **Unit**        | banUser: Missing adminNote/banReason                       | Valid userId                                       | userId only                           | Sử dụng default values                                  |
| **Unit**        | unbanUser: User tồn tại                                    | Valid userId                                       | userId, adminNote                     | status=true, email sent                                 |
| **Unit**        | deleteReportedProduct: Product tồn tại                     | Valid productId                                    | productId                             | 200 deleted                                             |
| **Unit**        | deleteReportedProduct: Product không tồn tại               | Invalid productId                                  | productId                             | 404 error                                               |
| **Unit**        | deleteFeedback: Feedback tồn tại, có pending report        | Valid feedbackId, report exists                    | feedbackId                            | status=false, report resolved, 3 emails sent            |
| **Unit**        | deleteFeedback: Feedback tồn tại, không có report          | Valid feedbackId, no report                        | feedbackId                            | status=false, 2 emails sent (no reporter)               |
| **Unit**        | deleteFeedback: Feedback không có user                     | Feedback.user=null                                 | feedbackId                            | status=false, skip author email                         |
| **Unit**        | deleteFeedback: Feedback không có product                  | Feedback.product=null                              | feedbackId                            | status=false, skip shop email                           |
| **Unit**        | deleteFeedback: Feedback không tồn tại                     | Invalid feedbackId                                 | feedbackId                            | 404 error                                               |
| **Unit**        | ignoreProductReport: Report tồn tại                        | Valid reportId                                     | reportId                              | status='resolved', resolution='no_action'               |
| **Unit**        | ignoreProductReport: Report không tồn tại                  | Invalid reportId                                   | reportId                              | 404 error                                               |
| **Unit**        | resolveProductReport: resolution='delete_product'          | Report targetType='product'                        | reportId, resolution, adminNote       | Product deleted, emails sent                            |
| **Unit**        | resolveProductReport: resolution='warning' (product)       | Report targetType='product'                        | reportId, resolution='warning'        | Emails sent, product not deleted                        |
| **Unit**        | resolveProductReport: resolution='delete_comment'          | Report targetType='review'                         | reportId, resolution, adminNote       | Feedback soft deleted, emails sent                      |
| **Unit**        | resolveProductReport: resolution='warning' (review)        | Report targetType='review'                         | reportId, resolution='warning'        | Warning emails sent                                     |
| **Unit**        | resolveProductReport: resolution='no_action'               | Valid report                                       | reportId, resolution='no_action'      | Report updated, no other actions                        |
| **Unit**        | resolveProductReport: Product đã bị xóa                    | Report targetType='product', product không tồn tại | reportId, resolution='delete_product' | Report updated, không tìm thấy product                  |
| **Unit**        | resolveProductReport: Missing resolution                   | Valid report                                       | reportId only                         | resolution=undefined                                    |
| **Unit**        | resolveProductReport: Email fails                          | Valid data, email service throws                   | reportId, resolution                  | Report updated, log email error                         |
| **Unit**        | getMyFeedbackReports: User có feedbacks và reports         | User đã tạo feedbacks, có reports                  | -                                     | Array of reports về feedbacks của user                  |
| **Unit**        | getMyFeedbackReports: User chưa có feedbacks               | User chưa tạo feedback nào                         | -                                     | data = []                                               |
| **Unit**        | getMyFeedbackReports: Feedback đã bị xóa                   | Feedback tồn tại nhưng đã soft delete              | -                                     | Vẫn show report, feedback có thể null                   |
| **Unit**        | getAdminDiscounts: Filter by source='admin'                | DB có discounts source='admin' và 'shop'           | -                                     | Chỉ trả về source='admin'                               |
| **Unit**        | createAdminDiscount: Valid data                            | -                                                  | Valid body                            | 201 created, source='admin'                             |
| **Integration** | GET /admin/stats: Admin role required                      | User role='customer'                               | Valid token                           | 403 forbidden                                           |
| **Integration** | GET /admin/stats: Admin role access                        | User role='admin'                                  | Valid token                           | 200 success                                             |
| **Integration** | PUT /admin/users/:userId/ban: Validate body                | Valid userId                                       | Empty body                            | banReason=undefined, adminNote=undefined                |
| **Integration** | DELETE /admin/categories/:categoryId: Category có products | Category với products                              | categoryId                            | 400 cannot delete                                       |
| **Integration** | POST /admin/categories: Duplicate name                     | Category name đã tồn tại                           | body với name trùng                   | 400 duplicate error                                     |
| **Edge**        | getAdminReportedProducts: 1000 reports                     | DB có 1000 reports                                 | page=1, limit=1000                    | Promise.all performance, populate 1000 targets          |
| **Edge**        | getAdminTopProductsData: No orderitems                     | Orders không có orderItems                         | -                                     | data = [] (không unwind được)                           |
| **Edge**        | resolveProductReport: Multiple reports cùng target         | 5 reports về cùng 1 product                        | Resolve 1 report                      | Chỉ 1 report được update                                |
| **Edge**        | getAdminShopRevenueData: Large date range                  | 10 years of orders                                 | -                                     | Aggregation performance test                            |

### 5.3. Model & Validation Tests

| Category | Scenario                              | Pre-condition                                           | Input                            | Expected Output/Behavior                                                 |
| -------- | ------------------------------------- | ------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------ |
| **Unit** | Report model: Create với valid data   | -                                                       | Valid report data                | Report created successfully                                              |
| **Unit** | Report model: targetType validation   | -                                                       | targetType='invalid'             | Validation error (enum)                                                  |
| **Unit** | Report model: reason validation       | -                                                       | reason='not_in_enum'             | Validation error                                                         |
| **Unit** | Report model: description minlength   | -                                                       | description='short' (< 10 chars) | Validation error                                                         |
| **Unit** | Report model: description maxlength   | -                                                       | description > 500 chars          | Validation error                                                         |
| **Unit** | Report model: evidence URL validation | -                                                       | evidence=['not-a-url']           | Validation error                                                         |
| **Unit** | Report model: Unique index            | Reporter=A, targetType='product', targetId=X đã tồn tại | Tạo duplicate report             | Duplicate key error                                                      |
| **Unit** | Report model: status default value    | Tạo report không set status                             | -                                | status='pending'                                                         |
| **Unit** | Report model: Indexes tồn tại         | -                                                       | -                                | Verify indexes: reporter, targetType+targetId, status, reason, createdAt |

### 5.4. Authorization & Middleware Tests

| Category        | Scenario                                 | Pre-condition        | Input                    | Expected Output/Behavior |
| --------------- | ---------------------------------------- | -------------------- | ------------------------ | ------------------------ |
| **Integration** | Shop routes: Require shop role           | User role='admin'    | GET /shop/stats          | 403 forbidden            |
| **Integration** | Shop routes: Require shop role           | User role='customer' | GET /shop/stats          | 403 forbidden            |
| **Integration** | Shop routes: Require shop role           | User role='shop'     | GET /shop/stats          | 200 success              |
| **Integration** | Admin routes: Require admin role         | User role='shop'     | GET /admin/stats         | 403 forbidden            |
| **Integration** | Admin routes: Require admin role         | User role='customer' | GET /admin/stats         | 403 forbidden            |
| **Integration** | Admin routes: Require admin role         | User role='admin'    | GET /admin/stats         | 200 success              |
| **Integration** | All routes: Require authentication       | No token             | Any dashboard route      | 401 unauthorized         |
| **Integration** | All routes: Require authentication       | Invalid token        | Any dashboard route      | 401 unauthorized         |
| **Integration** | All routes: Require authentication       | Expired token        | Any dashboard route      | 401 unauthorized         |
| **Integration** | My reports route: Any authenticated user | User role='customer' | GET /my/feedback-reports | 200 success              |

---

## 6. Test Priority Recommendation

### High Priority (Critical Business Functions)

| Module/Function                     | Priority | Justification                                                                         |
| ----------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| `getShopStats`                      | **HIGH** | Core dashboard feature, complex aggregations, multiple dependencies                   |
| `getAdminStats`                     | **HIGH** | Core admin dashboard, critical for business overview                                  |
| `updateOrderStatus`                 | **HIGH** | Có side effect (reward points), critical business logic                               |
| `resolveProductReport`              | **HIGH** | Complex logic, multiple branches (delete/warning), sends emails, high business impact |
| `deleteFeedback`                    | **HIGH** | Sends emails, updates report, soft delete logic                                       |
| `banUser` / `unbanUser`             | **HIGH** | Critical security feature, sends emails, business impact                              |
| `deleteCategory`                    | **HIGH** | Có validation logic (check products), prevent data integrity issues                   |
| `createCategory` / `updateCategory` | **HIGH** | Duplicate name validation critical                                                    |
| Authorization middlewares           | **HIGH** | Security critical - prevent unauthorized access                                       |

### Medium Priority (Important Features)

| Module/Function                            | Priority   | Justification                                           |
| ------------------------------------------ | ---------- | ------------------------------------------------------- |
| `getShopOrders` / `getShopFeedback`        | **MEDIUM** | Standard CRUD với pagination, ít edge cases             |
| `getAdminUsers` / `getAdminFeedback`       | **MEDIUM** | Standard CRUD, important but straightforward            |
| `getShopSalesData` / `getAdminRevenueData` | **MEDIUM** | Aggregation queries, performance concern với large data |
| `getAdminReportedProducts`                 | **MEDIUM** | Complex populate logic, performance concern             |
| `getAdminCategories`                       | **MEDIUM** | Performance concern với Promise.all                     |
| `ignoreProductReport`                      | **MEDIUM** | Simple update, low complexity                           |
| `getMyFeedbackReports`                     | **MEDIUM** | User-facing feature, moderate complexity                |
| Report model validations                   | **MEDIUM** | Data integrity important                                |

### Low Priority (Nice to Have)

| Module/Function                                         | Priority | Justification                                          |
| ------------------------------------------------------- | -------- | ------------------------------------------------------ |
| `getShopDiscounts` / `getAdminDiscounts`                | **LOW**  | Simple filter query, low risk                          |
| `createDiscount` / `deleteDiscount`                     | **LOW**  | Standard CRUD, covered by model validation             |
| `getAdminUserGrowthData` / `getAdminCustomerGrowthData` | **LOW**  | Similar to revenue aggregations, lower business impact |
| `getAdminOrdersData` / `getAdminTopProductsData`        | **LOW**  | Reporting features, non-critical                       |
| `getAdminShopRevenueData`                               | **LOW**  | Reporting feature, lower priority                      |
| `activateCategory` / `deactivateCategory`               | **LOW**  | Simple update operations                               |
| `deleteReportedProduct`                                 | **LOW**  | Simple delete, low complexity                          |
| `createAdminDiscount`                                   | **LOW**  | Standard CRUD                                          |

---

## 7. Mocking & Test Data Preparation

### 7.1. Dependencies to Mock

| Dependency                                 | What to Mock                  | Mocking Strategy                                                                                                                                                                           | Sample Mock Data                                    |
| ------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| **Database Models**                        | All Mongoose model methods    | Use `jest.mock()` hoặc in-memory MongoDB (mongodb-memory-server)                                                                                                                           | -                                                   |
| `Order.countDocuments()`                   | Count queries                 | `jest.fn().mockResolvedValue(100)`                                                                                                                                                         | `100`                                               |
| `Order.aggregate()`                        | Aggregation pipelines         | `jest.fn().mockResolvedValue([{ _id: '2024-01', totalRevenue: 5000 }])`                                                                                                                    | Array of aggregation results                        |
| `Order.find()`                             | Query with pagination         | `jest.fn().mockReturnValue({ sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), populate: jest.fn().mockResolvedValue([...orders]) })` | Array of order objects                              |
| `User.findByIdAndUpdate()`                 | Update operations             | `jest.fn().mockResolvedValue(mockUser)`                                                                                                                                                    | `{ _id: 'user1', fullName: 'John', status: false }` |
| `Category.findOne()`                       | Duplicate check               | `jest.fn().mockResolvedValue(null)` (no duplicate) hoặc `mockCategory` (duplicate)                                                                                                         | `null` or `{ _id: 'cat1', name: 'Sneakers' }`       |
| `Product.countDocuments({ category: id })` | Count products per category   | `jest.fn().mockResolvedValue(5)`                                                                                                                                                           | `5`                                                 |
| `Report.populate()`                        | Populate reporter             | `jest.fn().mockReturnThis()`                                                                                                                                                               | -                                                   |
| **Email Service**                          | sendTemplatedEmail            | `jest.fn().mockResolvedValue(true)`                                                                                                                                                        | `true` (success)                                    |
| **Reward Service**                         | `hasOrderEarnedRewardPoints`  | `jest.fn().mockResolvedValue(false)`                                                                                                                                                       | `false` (chưa cộng points)                          |
| **Reward Service**                         | `createRewardPointsForOrder`  | `jest.fn().mockResolvedValue({ points: 50 })`                                                                                                                                              | `{ points: 50, user: 'user1' }`                     |
| **ErrorResponse**                          | Custom error class            | Import real class hoặc mock                                                                                                                                                                | `new ErrorResponse('Not found', 404)`               |
| **asyncHandler**                           | Middleware wrapper            | Import real hoặc mock để test error handling                                                                                                                                               | -                                                   |
| **Authentication Middleware**              | `protect`                     | Mock `req.user`                                                                                                                                                                            | `req.user = { id: 'user1', role: 'admin' }`         |
| **Authorization Middleware**               | `requireAdmin`, `requireShop` | Mock để test access control                                                                                                                                                                | Call `next()` hoặc throw 403 error                  |

### 7.2. Sample Mock Data

#### Mock User

```javascript
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  fullName: 'John Doe',
  email: 'john@example.com',
  role: 'admin',
  status: true,
  createdAt: new Date('2024-01-01'),
};
```

#### Mock Order

```javascript
const mockOrder = {
  _id: '507f1f77bcf86cd799439012',
  user: '507f1f77bcf86cd799439011',
  status: 'delivered',
  totalPrice: 1500000,
  items: [{ product: 'prod1', quantity: 2, price: 750000 }],
  createdAt: new Date('2024-01-15'),
  save: jest.fn().mockResolvedValue(this),
};
```

#### Mock Report

```javascript
const mockReport = {
  _id: '507f1f77bcf86cd799439013',
  reporter: '507f1f77bcf86cd799439011',
  targetType: 'product',
  targetId: '507f1f77bcf86cd799439014',
  reason: 'fake_product',
  description: 'This product is fake and misleading',
  evidence: ['https://example.com/evidence.jpg'],
  status: 'pending',
  createdAt: new Date(),
  save: jest.fn().mockResolvedValue(this),
};
```

#### Mock Category

```javascript
const mockCategory = {
  _id: '507f1f77bcf86cd799439015',
  name: 'Sneakers',
  description: 'Athletic footwear',
  image: 'https://example.com/sneakers.jpg',
  status: true,
  createdAt: new Date(),
  toObject: jest.fn().mockReturnValue({ ...this }),
};
```

#### Mock Feedback

```javascript
const mockFeedback = {
  _id: '507f1f77bcf86cd799439016',
  user: mockUser,
  product: { _id: 'prod1', name: 'Nike Air Max' },
  rating: 5,
  comment: 'Great product!',
  status: true,
  createdAt: new Date(),
};
```

#### Mock Aggregation Results

```javascript
// Revenue by month
const mockRevenueData = [
  { _id: '2024-01', totalRevenue: 5000000, orderCount: 50 },
  { _id: '2024-02', totalRevenue: 7000000, orderCount: 70 },
  { _id: '2024-03', totalRevenue: 6500000, orderCount: 65 },
];

// Top products
const mockTopProducts = [
  { productName: 'Nike Air Max', sales: 100 },
  { productName: 'Adidas Ultraboost', sales: 85 },
  { productName: 'Puma Suede', sales: 70 },
];

// Order status distribution
const mockStatusDistribution = [
  { name: 'pending', value: 20 },
  { name: 'processing', value: 30 },
  { name: 'delivered', value: 100 },
];
```

### 7.3. Test Data Setup Strategy

**Option 1: Pure Mocking (Unit Tests)**

- Mock tất cả database calls
- Fast, isolated tests
- Sử dụng `jest.mock()` cho models
- Thích hợp cho: test logic, branching, error handling

**Option 2: In-Memory Database (Integration Tests)**

- Sử dụng `mongodb-memory-server`
- Real database operations
- Seed data trước mỗi test suite
- Thích hợp cho: test aggregations, populate, indexes

**Option 3: Hybrid Approach**

- Unit tests: pure mocking
- Integration tests: in-memory DB
- E2E tests: test database (Docker)

**Recommended Approach for Dashboard & Reports**: **Hybrid**

- **Unit tests** (pure mocking): Test individual controller logic, branches, error handling
- **Integration tests** (in-memory DB): Test aggregation pipelines, pagination, populate, authorization
- **Edge case tests** (in-memory DB + large datasets): Performance testing với large data

---

## 8. Suggested Next Prompts

### Prompt 1: Generate Unit Test Cases

```
Generate comprehensive unit tests for the following Dashboard & Reports functions:
- getShopStats
- updateOrderStatus
- resolveProductReport
- createCategory
- deleteCategory
- banUser

Test framework: Jest
Requirements:
- Mock all database dependencies
- Test all branches and edge cases
- Include error scenarios
- Test email sending logic
- Achieve >85% code coverage

Output: Individual test files in backend/tests/dashboard&reports/
```

### Prompt 2: Generate Integration Test Cases

```
Generate integration tests for Dashboard & Reports routes in backend/src/routes/dashboardRoutes.js

Test requirements:
- Use mongodb-memory-server for real database operations
- Test authentication with protect middleware
- Test authorization with requireAdmin and requireShop middlewares
- Test all GET endpoints with pagination
- Test all POST/PUT/DELETE endpoints with valid and invalid data
- Verify HTTP status codes and response formats

Output: backend/tests/dashboard&reports/dashboard-routes.integration.test.js
```

### Prompt 3: Generate Edge Case & Performance Tests

```
Generate edge case and performance tests for Dashboard & Reports:

Test scenarios:
- Large datasets (10,000+ orders) for aggregation queries
- Empty data handling for all endpoints
- Invalid date ranges (cross year boundaries)
- Concurrent report resolutions
- Email service failures
- Promise.all performance với 1000 categories
- Pagination với extreme values (page=0, limit=10000)

Framework: Jest with performance benchmarks
Output: backend/tests/dashboard&reports/dashboard-edge-cases.test.js
```

### Prompt 4: Generate E2E Test Flow

```
Generate end-to-end test flow for Dashboard & Reports:

Scenarios:
1. Admin dashboard flow: Login → View stats → Ban user → Resolve report → Check emails sent
2. Shop dashboard flow: Login → View stats → Update order status → Check reward points created → View sales data
3. Report management flow: User creates report → Admin views reports → Admin resolves with delete → Verify emails and data updates

Tools: Supertest, mongodb-memory-server
Output: backend/tests/dashboard&reports/dashboard-e2e.test.js
```

### Prompt 5: Generate Test Data Factories & Helpers

```
Generate test data factories and helper utilities for Dashboard & Reports:

Requirements:
- Factory functions: createMockUser, createMockOrder, createMockReport, createMockCategory, createMockFeedback
- Helper functions: seedDatabase, clearDatabase, createAuthToken, setupTestData
- Mock email service
- Mock reward service
- Database cleanup utilities

Output: backend/tests/dashboard&reports/_helpers/
```

### Prompt 6: Generate Coverage Report & Analysis

```
After running all tests:
1. Generate coverage report for Dashboard & Reports module
2. Analyze uncovered lines and branches
3. Identify missing test scenarios
4. Provide recommendations to achieve 85%+ coverage
5. Create coverage summary markdown

Output: backend/tests/dashboard&reports/coverage-analysis.md
```

---

**Document Version**: 1.0  
**Created**: 2025-01-29  
**Feature**: Dashboard & Reports (Backend Only)  
**Test Framework**: Jest  
**Target Coverage**: 85%+
