# Order in Livestream - Technical & Testing Analysis

**Last Updated**: October 25, 2025  
**Status**: Ready for Test Implementation  
**Coverage Target**: 80%+ for critical paths

---

## 1. Tổng quan Feature

### Mục đích của feature

Feature "Order in Livestream" cho phép hệ thống tự động phát hiện và xử lý đơn hàng từ các tin nhắn chat trong livestream. Khi người xem (viewer) gửi tin nhắn có chứa thông tin mua hàng (số điện thoại, tên sản phẩm, size, màu), hệ thống sẽ:

- Phân tích tin nhắn bằng AI/NLP pattern matching
- Trích xuất thông tin khách hàng và sản phẩm
- Tạo "Potential Order" (đơn hàng tiềm năng)
- Thông báo realtime cho host qua Socket.IO
- Cho phép host xác nhận và tự động tạo đơn hàng thật
- Kiểm tra inventory và gửi email confirmation

### Lý do nên chọn feature này để viết test

1. **Business Critical**: Đây là tính năng tạo doanh thu trực tiếp từ livestream (~70% conversion rate)
2. **Complex Logic**: Nhiều bước xử lý phức tạp (NLP, regex, validation, order creation, real-time events)
3. **High Risk**: Bug có thể dẫn đến mất đơn hàng (revenue loss) hoặc tạo sai đơn (customer churn)
4. **Real-time Requirements**: Liên quan đến WebSocket, socket.io, cần test concurrency và race conditions
5. **Multiple Dependencies**: Database (Mongoose), WebSocket (Socket.IO), AI detection, Email service, Inventory management
6. **Edge Cases**: Nhiều trường hợp đặc biệt (SKU variations, size/color parsing, phone formats, inventory check, flash sales)
7. **Data Integrity**: Cần đảm bảo consistency giữa PotentialOrder, Order, và Inventory

### Business logic chính

```
Flow chính (Happy Path):
1. Viewer gửi chat message trong livestream
   ↓
2. Socket.IO nhận message → liveStreamService.handleChatMessage()
   ↓
3. Lưu message vào LiveStreamChat collection
   ↓
4. OrderDetectionService.analyzeMessage() phân tích tin nhắn
   - extractPhoneNumbers() → Tìm số điện thoại
   - extractProductInfo() → Tìm SKU/size/color/quantity
   - calculateConfidence() → Tính confidence score (0-1)
   ↓
5. Nếu phát hiện order (confidence >= 0.3):
   → Tạo PotentialOrder document với:
      - customerInfo (phone, userId, name)
      - productInfo (productId, size, color, quantity)
      - detectionData (confidence, keywords)
      - priority (calculated: urgent/high/medium/low)
   ↓
6. Gửi realtime event 'potential_order_detected' cho Host qua Socket.IO
   ↓
7. Host xem danh sách potential orders và thay đổi status:
   - pending → contacted → confirmed
   ↓
8. Khi status = "confirmed":
   - Kiểm tra inventory cho variant cụ thể (size/color)
   - Nếu hết hàng: Send email LIVESTREAM_OUT_OF_STOCK, stop
   - Nếu còn hàng:
     * Tạo Order thực với OrderService.createOrder()
     * Link convertedOrderId vào PotentialOrder
     * Update status = 'converted'
     * Gửi email LIVESTREAM_ORDER_SUCCESS cho customer
   ↓
9. Order được tạo với status = 'pending', chờ payment confirmation

Alternative Flows:
- Status = "ignored" hoặc "spam": Không tạo order, đánh dấu để skip
- Confidence < 0.3: Không tạo PotentialOrder
- Multiple products detected: Chọn product có SKU match, hoặc featuredProducts[last]
- Email fails: Log error nhưng vẫn tạo order thành công (async retry)
```

### Key Metrics & Performance Requirements

| Metric                         | Target  | Critical Threshold |
| ------------------------------ | ------- | ------------------ |
| Message Analysis Time          | < 100ms | < 200ms            |
| Order Creation Time            | < 500ms | < 1000ms           |
| Detection Accuracy (Precision) | > 85%   | > 75%              |
| Detection Recall               | > 90%   | > 80%              |
| False Positive Rate            | < 10%   | < 20%              |
| Concurrent Messages Support    | 100/sec | 50/sec             |
| Email Delivery Rate            | > 95%   | > 90%              |
| Inventory Check Accuracy       | 100%    | 100%               |

---

## 2. Files / Modules liên quan trong dự án

### Core Services

| File/Path                                          | Mô tả vai trò                                                  | Hàm/Method quan trọng                                                                                                                       | Dependencies                                       | Test Priority |
| -------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------- |
| `backend/src/services/orderDetection.service.js`   | Core AI/NLP service phát hiện order từ chat message            | `analyzeMessage()`, `extractPhoneNumbers()`, `extractProductInfo()`, `savePotentialOrder()`, `calculateConfidence()`, `updateOrderStatus()` | Product, PotentialOrder, LiveStreamChat, Logger    | **HIGH**      |
| `backend/src/services/livestream.service.js`       | Quản lý livestream rooms, WebSocket connections, chat handling | `handleChatMessage()`, `joinAsViewer()`, `joinAsHost()`, `leaveRoom()`, `broadcastMessage()`                                                | LiveStream, User, OrderDetectionService, Socket.IO | **HIGH**      |
| `backend/src/services/livestreamSocket.service.js` | Socket.IO event handlers cho WebRTC và real-time chat          | `chat_message` handler, `join_room` handler, `potential_order_detected` emit, `new_potential_order` broadcast                               | LiveStreamService, Logger                          | **MEDIUM**    |
| `backend/src/services/order.service.js`            | Tạo và quản lý orders thật, apply flash sales                  | `OrderService.createOrder()`, `getProductFlashSale()`, `validateOrderData()`, `applyDiscount()`                                             | Order, OrderItem, Product, FlashSale, Discount     | **HIGH**      |
| `backend/src/services/email.service.js`            | Email notification service                                     | `sendTemplatedEmail()`, templates: LIVESTREAM_ORDER_SUCCESS, LIVESTREAM_OUT_OF_STOCK                                                        | Nodemailer, Email templates                        | **MEDIUM**    |

### Controllers

| File/Path                                             | Mô tả vai trò                      | Hàm/Method quan trọng                                                                                                                        | Auth Required    | Test Priority |
| ----------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------- |
| `backend/src/controllers/potentialOrderController.js` | REST API cho potential orders CRUD | `updateOrderStatus()` (auto-create order), `getPotentialOrdersForStream()`, `getMyPotentialOrders()`, `markAsViewed()`, `bulkUpdateStatus()` | Yes (Host/Admin) | **HIGH**      |
| `backend/src/controllers/livestreamController.js`     | REST API cho livestream management | `createStream()`, `endStream()`, `addFeaturedProduct()`, `getStreamStats()`                                                                  | Yes (Host)       | **LOW**       |

### Models (Mongoose Schemas)

| File/Path                              | Mô tả vai trò                  | Instance Methods                                                              | Static Methods                       | Hooks/Middleware                               | Test Priority |
| -------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------- | ------------- |
| `backend/src/models/PotentialOrder.js` | Schema cho potential orders    | `markAsViewed()`, `convertToOrder()`                                          | `findByStream()`, `findByStatus()`   | `pre('save')`: calculate priority, timestamps  | **HIGH**      |
| `backend/src/models/LiveStreamChat.js` | Schema cho chat messages       | `markAsAnalyzed()`, `linkToPotentialOrder()`                                  | `findByStream()`, `findUnanalyzed()` | `pre('save')`: validate content                | **MEDIUM**    |
| `backend/src/models/LiveStream.js`     | Schema cho livestream sessions | `addFeaturedProduct()`, `updateViewerCount()`, `end()`                        | `findActive()`, `findByHost()`       | `pre('save')`: generate roomId                 | **LOW**       |
| `backend/src/models/Product.js`        | Schema sản phẩm                | `checkInventory({ size, color })`, `getFlashSalePrice()`, `updateInventory()` | `findBySku()`, `searchByKeyword()`   | Virtuals: `finalPrice`, `isInStock`            | **HIGH**      |
| `backend/src/models/Order.js`          | Schema đơn hàng thật           | `calculateTotal()`, `markAsPaid()`                                            | `findByUser()`, `findByStatus()`     | `pre('save')`: validate items, calculate total | **HIGH**      |
| `backend/src/models/OrderItem.js`      | Schema chi tiết đơn hàng       | None                                                                          | None                                 | `pre('save')`: validate price > 0              | **MEDIUM**    |

### Routes

| File/Path                                    | Endpoints                                                                                                                                                                  | Middleware                      | Test Priority |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------- |
| `backend/src/routes/potentialOrderRoutes.js` | GET `/api/potential-orders/stream/:streamId`<br>GET `/api/potential-orders/my-orders`<br>PUT `/api/potential-orders/:id/status`<br>POST `/api/potential-orders/:id/viewed` | `authenticate`, `authorizeHost` | **HIGH**      |
| `backend/src/routes/livestreamRoutes.js`     | POST `/api/livestreams`<br>PUT `/api/livestreams/:id/end`<br>POST `/api/livestreams/:id/featured-products`                                                                 | `authenticate`, `authorizeHost` | **MEDIUM**    |

### Templates & Utilities

| File/Path                                    | Mô tả vai trò                       | Test Priority                                         |
| -------------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| `backend/src/templates/email.templates.js`   | Email HTML templates                | **LOW**                                               |
| `backend/src/utils/phoneValidator.js`        | Phone number validation (VN format) | **MEDIUM**                                            |
| `backend/src/utils/logger.js`                | Winston logger configuration        | **LOW**                                               |
| `backend/src/models/LiveStream.js`           | Schema cho livestream sessions      | `addFeaturedProduct()`, `updateViewerCount()`         |
| `backend/src/models/Product.js`              | Schema sản phẩm                     | `checkInventory()`, SKU matching                      |
| `backend/src/models/Order.js`                | Schema đơn hàng thật                | Order validation, pre-save hooks                      |
| `backend/src/routes/potentialOrderRoutes.js` | Routes cho potential order APIs     | All CRUD routes                                       |
| `backend/src/templates/email.templates.js`   | Email templates                     | `LIVESTREAM_ORDER_SUCCESS`, `LIVESTREAM_OUT_OF_STOCK` |

---

## 3. Các hàm (function/method) cốt lõi cần test

### 3.1. `orderDetectionService.analyzeMessage(messageData, streamData, userData)`

**Chức năng chính**: Phân tích tin nhắn chat để phát hiện potential order

**Input parameters + type**:

- `messageData`: Object (LiveStreamChat document)
  - `content`: String (nội dung tin nhắn)
  - `_id`: ObjectId
- `streamData`: Object (LiveStream document)
  - `_id`: ObjectId
  - `roomId`: String
  - `featuredProducts`: Array
- `userData`: Object (User document)
  - `_id`: ObjectId
  - `username`: String
  - `fullName`: String

**Output / return**:

- `null` nếu không phát hiện order
- Object `{ isOrder: true, confidence: Number, data: {...} }` nếu phát hiện

**Side effects / state change**:

- Không có side effect (pure function)

**Edge cases tiềm năng**:

- Tin nhắn có nhiều số điện thoại
- Tin nhắn ngắn < 10 ký tự
- Số điện thoại không đúng format Việt Nam
- Không có order keywords
- Tin nhắn spam/rác
- Confidence score ở ngưỡng biên (0.3)

**Dependency cần mock**:

- `Product.findOne()` (database query)
- Logger

---

### 3.2. `orderDetectionService.extractProductInfo(rawMessage, streamData)`

**Chức năng chính**: Trích xuất thông tin sản phẩm (SKU, size, color, quantity) từ message

**Input parameters + type**:

- `rawMessage`: String
- `streamData`: Object (LiveStream document)

**Output / return**:

```javascript
{
  size: String | null,
  color: String | null,
  quantity: Number (default: 1),
  productId: ObjectId | null
}
```

**Side effects / state change**:

- Query database để tìm product theo SKU

**Edge cases tiềm năng**:

- SKU không tồn tại
- SKU trùng lặp
- Size pattern phức tạp: "size 42", "cỡ 42", "42 size", "XL", "ONESIZE"
- Color bằng tiếng Việt vs tiếng Anh
- Composite pattern: "chốt 2 đôi HJ6777 màu đen size 42"
- Featured product vs SKU mention
- Variant SKU (inventory.sku) vs base product SKU

**Dependency cần mock**:

- `Product.findOne({ sku })` (multiple calls)
- Logger

---

### 3.3. `liveStreamService.handleChatMessage(socketId, messageData)`

**Chức năng chính**: Xử lý chat message, lưu vào DB, phát hiện order, broadcast message

**Input parameters + type**:

- `socketId`: String (Socket.IO connection ID)
- `messageData`: Object `{ text: String, type?: String }`

**Output / return**:

```javascript
{
  roomId: String,
  message: LiveStreamChat document,
  potentialOrder: PotentialOrder document | null
}
```

**Side effects / state change**:

- Tạo mới LiveStreamChat document
- Increment `stats.totalMessages` trong LiveStream
- Nếu có order: Tạo PotentialOrder document
- Link chatMessage với potentialOrder

**Edge cases tiềm năng**:

- Socket không tồn tại trong socketToRoom map
- Room không tồn tại
- User không authenticated
- System message (không phân tích order)
- Order detection service throws error (phải catch và log, không fail chat)
- Concurrent messages từ nhiều viewers

**Dependency cần mock**:

- `socketToRoom` Map
- `rooms` Map
- `LiveStreamChat` model
- `LiveStream.findByIdAndUpdate()`
- `User.findById()`
- `orderDetectionService.analyzeMessage()`
- `orderDetectionService.savePotentialOrder()`
- Logger

---

### 3.4. `potentialOrderController.updateOrderStatus(req, res)`

**Chức năng chính**: Cập nhật status của potential order, tự động tạo order thật khi status = "confirmed"

**Input parameters + type**:

- `req.params.id`: String (PotentialOrder ID)
- `req.body.status`: String (enum: pending, contacted, confirmed, converted, ignored, spam)
- `req.body.notes`: String (optional)
- `req.user.id`: String (Host user ID)

**Output / return**:

- Response JSON: `{ success: true, data: updatedOrder }`

**Side effects / state change**:

- Update PotentialOrder status
- Nếu status = "confirmed":
  - Check inventory
  - Nếu hết hàng: Send email out-of-stock, không tạo order
  - Nếu còn hàng: Tạo Order thật, link với PotentialOrder, send email success

**Edge cases tiềm năng**:

- PotentialOrder không tồn tại
- Unauthorized (không phải host của stream)
- Invalid status value
- User hoặc Product không tồn tại (khi auto-create order)
- Product out of stock cho variant cụ thể
- Price = 0 hoặc invalid
- Email service failure (không nên block order creation)
- Inventory check failure (log và proceed)

**Dependency cần mock**:

- `PotentialOrder.findById()`
- `orderDetectionService.updateOrderStatus()`
- `User.findById()`
- `Product.findById()`
- `product.checkInventory()`
- `OrderService.createOrder()`
- `EmailService.sendTemplatedEmail()`
- Logger

---

### 3.5. `OrderService.createOrder(orderData)`

**Chức năng chính**: Tạo Order và OrderItems, áp dụng flash sale nếu có

**Input parameters + type**:

```javascript
{
  user: ObjectId,
  products: Array<{ id, quantity, price, size, color }>,
  totalAmount: Number,
  paymentMethod: String,
  shippingAddress: String,
  notes?: String
}
```

**Output / return**:

- Order document (populated with items and products)

**Side effects / state change**:

- Tạo Order document
- Tạo OrderItem documents
- Update discount usage nếu có discountCode
- Check flash sale và apply flash price

**Edge cases tiềm năng**:

- Products array empty
- Missing required fields
- Total price mismatch với sum of items
- Flash sale active nhưng hết quota
- Discount code invalid/expired
- Order items creation thất bại giữa chừng (transaction rollback)

**Dependency cần mock**:

- `Order` model
- `OrderItem` model
- `FlashSale.find()`
- `Discount.findOne()`
- `validateDiscountCode()`
- Mongoose session (transaction)
- Logger

---

### 3.6. `product.checkInventory({ size, color, clothingSize, isOneSize })`

**Chức năng chính**: Kiểm tra tồn kho cho variant cụ thể

**Input parameters + type**:

- Object với size/color/clothingSize tùy thuộc vào productType

**Output / return**:

```javascript
{
  available: Boolean,
  quantity: Number,
  variant?: Object
}
```

**Side effects / state change**: Không có

**Edge cases tiềm năng**:

- Product type mismatch (shoes nhưng check clothingSize)
- Variant không tồn tại
- isOneSize = true nhưng không có inventory entry
- Multiple variants match (color nhiều shades)

**Dependency cần mock**: Không có (instance method)

---

## 4. Ma trận Test Cases (Test Case Matrix)

### 4.1. Message Analysis & Detection (OrderDetectionService)

| Test ID | Category              | Scenario                                       | Input Example                                          | Expected Output/Behavior                                                         | Priority   |
| ------- | --------------------- | ---------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------- | ---------- |
| ODT-001 | Happy Path            | Viewer gửi message với phone và order keywords | `"Chốt đơn 0912345678 size 42"`                        | Create PotentialOrder với confidence >= 0.4, priority high/medium                | **HIGH**   |
| ODT-002 | Happy Path            | Message có SKU chính xác                       | `"Mua HJ6777 màu đen size 42 sđt 0912345678"`          | productId found, extractedSize = "42", extractedColor = "đen", confidence >= 0.6 | **HIGH**   |
| ODT-003 | Happy Path            | Composite pattern với quantity                 | `"chốt 2 đôi NK-HBP-101 màu trắng size 40 0987654321"` | quantity = 2, productId found, color = "trắng", size = "40"                      | **HIGH**   |
| ODT-004 | Happy Path            | High confidence keywords                       | `"ship cho em 1 đôi size 42 sđt 0912345678"`           | confidence >= 0.7, priority = "high" hoặc "urgent"                               | **MEDIUM** |
| ODT-005 | Edge Case             | Message chỉ có phone, không có keywords        | `"0912345678"`                                         | Return null (không tạo PotentialOrder)                                           | **HIGH**   |
| ODT-006 | Edge Case             | Message có keywords nhưng không có phone       | `"Mua giày size 42 màu đen"`                           | Return null                                                                      | **HIGH**   |
| ODT-007 | Edge Case             | Phone number không đúng format VN              | `"Mua size 42 phone: 1234567890"`                      | Return null hoặc confidence < 0.3                                                | **MEDIUM** |
| ODT-008 | Edge Case             | Message quá ngắn (< 10 chars)                  | `"ok 0912"`                                            | Confidence bị penalty -0.1, likely < 0.3 → không tạo order                       | **MEDIUM** |
| ODT-009 | Edge Case             | Nhiều số điện thoại trong message              | `"0912345678 hoặc 0987654321 size 42 chốt đơn"`        | Lấy số phone đầu tiên (phoneNumbers[0])                                          | **MEDIUM** |
| ODT-010 | Edge Case             | SKU không tồn tại                              | `"Mua INVALID123 0912345678 size 42"`                  | productId = null, vẫn tạo PotentialOrder nếu có featured product                 | **MEDIUM** |
| ODT-011 | Edge Case             | Message spam/rác                               | `"aaaaaaaaaa 0912345678"`                              | Confidence thấp, không tạo order                                                 | **LOW**    |
| ODT-012 | Edge Case             | System message                                 | `{ type: 'system', text: 'User joined' }`              | Không phân tích, return null                                                     | **HIGH**   |
| ODT-013 | Boundary              | Confidence = 0.30 (threshold)                  | Mock confidence exactly 0.30                           | Tạo PotentialOrder (>= 0.3)                                                      | **MEDIUM** |
| ODT-014 | Boundary              | Confidence = 0.29                              | Mock confidence exactly 0.29                           | Không tạo PotentialOrder (< 0.3)                                                 | **MEDIUM** |
| ODT-015 | Vietnamese Variations | Size patterns khác nhau                        | `"size 42"`, `"cỡ 42"`, `"42 size"`, `"size: 42"`      | Tất cả extract được size = "42"                                                  | **HIGH**   |
| ODT-016 | Vietnamese Variations | Color variations                               | `"màu đen"`, `"đen"`, `"black"`, `"màu: đen"`          | Tất cả extract được color = "đen" hoặc "black"                                   | **MEDIUM** |
| ODT-017 | Vietnamese Variations | Quantity patterns                              | `"2 đôi"`, `"2 cái"`, `"2đôi"`, `"hai đôi"`            | quantity = 2                                                                     | **MEDIUM** |

### 4.2. Product Extraction (extractProductInfo)

| Test ID | Category      | Scenario                          | Input Example                                              | Expected Output                                   | Priority   |
| ------- | ------------- | --------------------------------- | ---------------------------------------------------------- | ------------------------------------------------- | ---------- |
| PRD-001 | Happy Path    | SKU exact match                   | `"Mua HJ6777 size 42"`, streamData with product            | productId found, size = "42"                      | **HIGH**   |
| PRD-002 | Happy Path    | Featured product fallback         | `"mua cái này size 42"`, featuredProducts = [prod1, prod2] | productId = prod2.\_id (last featured)            | **HIGH**   |
| PRD-003 | Happy Path    | Inventory SKU variant             | `"Mua HJ6777-42-BLK"`, SKU trong inventory.sku             | productId found, infer size = "42", color = "đen" | **HIGH**   |
| PRD-004 | Edge Case     | Multiple SKUs mentioned           | `"So sánh HJ6777 vs NK-HBP-101"`                           | Lấy SKU đầu tiên hoặc last matched                | **MEDIUM** |
| PRD-005 | Edge Case     | SKU trùng lặp (multiple products) | Database có 2 products với cùng SKU                        | Lấy product đầu tiên hoặc log warning             | **LOW**    |
| PRD-006 | Edge Case     | No SKU, no featured products      | `"mua size 42"`, featuredProducts = []                     | productId = null                                  | **MEDIUM** |
| PRD-007 | Special Cases | One-size product                  | productType = "accessory", isOneSize = true                | extractedSize = "ONESIZE"                         | **MEDIUM** |
| PRD-008 | Special Cases | Clothing vs Shoes size            | `"size L"` vs `"size 42"`                                  | Correctly identify clothingSize vs size           | **MEDIUM** |

### 4.3. Order Status Update & Auto-Creation

| Test ID | Category       | Scenario                                    | Input                                               | Expected Behavior                                    | Priority   |
| ------- | -------------- | ------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------- | ---------- |
| STA-001 | Happy Path     | Confirm potential order → Auto create order | status = "confirmed", product in stock              | Tạo Order, link convertedOrderId, send email success | **HIGH**   |
| STA-002 | Happy Path     | Change status to contacted                  | status = "contacted"                                | Update status, không tạo order                       | **MEDIUM** |
| STA-003 | Happy Path     | Ignore spam order                           | status = "spam"                                     | Update status, không tạo order                       | **MEDIUM** |
| STA-004 | Edge Case      | Product out of stock khi confirm            | status = "confirmed", inventory.quantity = 0        | Không tạo Order, send email LIVESTREAM_OUT_OF_STOCK  | **HIGH**   |
| STA-005 | Edge Case      | Variant cụ thể out of stock                 | status = "confirmed", size 42 hết, size 41 còn      | Không tạo Order, notify out of stock for size 42     | **HIGH**   |
| STA-006 | Edge Case      | Product price = 0                           | status = "confirmed", finalPrice = 0                | Skip auto-create, log warning                        | **MEDIUM** |
| STA-007 | Edge Case      | User không tồn tại                          | status = "confirmed", customerInfo.userId invalid   | Skip auto-create, log error                          | **MEDIUM** |
| STA-008 | Edge Case      | Product không tồn tại                       | status = "confirmed", productInfo.productId invalid | Skip auto-create, log error                          | **MEDIUM** |
| STA-009 | Error Handling | Email service failure                       | sendTemplatedEmail() throws error                   | Log error, vẫn tạo order thành công                  | **HIGH**   |
| STA-010 | Error Handling | PotentialOrder không tồn tại                | req.params.id = invalid ObjectId                    | Return 404 Not Found                                 | **MEDIUM** |
| STA-011 | Error Handling | Unauthorized update                         | Viewer cố update order của host khác                | Return 403 Forbidden                                 | **HIGH**   |
| STA-012 | Error Handling | Invalid status value                        | status = "invalid_status"                           | Return 400 Bad Request, validation error             | **MEDIUM** |
| STA-013 | Concurrency    | Concurrent order confirms                   | 2 hosts confirm cùng 1 order simultaneously         | Chỉ tạo 1 order, sử dụng transaction hoặc lock       | **HIGH**   |
| STA-014 | Business Logic | Flash sale active                           | Product có flash sale, status = "confirmed"         | Order sử dụng flashPrice thay vì regular price       | **MEDIUM** |

### 4.4. Real-time Chat & Socket.IO

| Test ID | Category    | Scenario                       | Input                                             | Expected Behavior                               | Priority   |
| ------- | ----------- | ------------------------------ | ------------------------------------------------- | ----------------------------------------------- | ---------- |
| SOC-001 | Happy Path  | Viewer sends chat message      | socketId, { text: "Chốt đơn 0912345678 size 42" } | Save LiveStreamChat, emit to room, detect order | **HIGH**   |
| SOC-002 | Happy Path  | Potential order detected event | Order detection result                            | Emit 'potential_order_detected' to host         | **HIGH**   |
| SOC-003 | Edge Case   | Socket không tồn tại           | socketId not in socketToRoom map                  | Log warning, không crash                        | **MEDIUM** |
| SOC-004 | Edge Case   | Room không tồn tại             | roomId invalid                                    | Return error, không crash                       | **MEDIUM** |
| SOC-005 | Edge Case   | User not authenticated         | Socket connection without auth token              | Reject message hoặc mark as anonymous           | **HIGH**   |
| SOC-006 | Performance | 100 messages cùng lúc          | Stress test với 100 concurrent messages           | Tất cả messages được xử lý, không bị drop       | **HIGH**   |
| SOC-007 | Performance | Order detection throws error   | analyzeMessage() throws exception                 | Catch error, log, vẫn save chat message         | **HIGH**   |

### 4.5. Inventory Management

| Test ID | Category   | Scenario                   | Input                                         | Expected Output                                   | Priority   |
| ------- | ---------- | -------------------------- | --------------------------------------------- | ------------------------------------------------- | ---------- |
| INV-001 | Happy Path | Check in-stock variant     | size = 42, color = "đen", quantity > 0        | { available: true, quantity: 10, variant: {...} } | **HIGH**   |
| INV-002 | Happy Path | Check out-of-stock variant | size = 42, color = "đen", quantity = 0        | { available: false, quantity: 0, variant: {...} } | **HIGH**   |
| INV-003 | Edge Case  | Variant không tồn tại      | size = 99, color = "rainbow"                  | { available: false, quantity: 0 }                 | **MEDIUM** |
| INV-004 | Edge Case  | Product type mismatch      | productType = "shoes", check với clothingSize | Return error hoặc { available: false }            | **MEDIUM** |
| INV-005 | Edge Case  | isOneSize = true           | productType = "accessory", isOneSize: true    | Check inventory entry với size = "ONESIZE"        | **MEDIUM** |

### 4.6. Integration & E2E Tests

| Test ID | Category       | Scenario                                 | Steps                                                                                            | Expected End State                          | Priority   |
| ------- | -------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------- | ---------- |
| E2E-001 | Full Flow      | Chat → Detect → Confirm → Order          | 1. Send chat<br>2. Verify PotentialOrder created<br>3. Confirm status<br>4. Verify Order created | Order exists, email sent, inventory updated | **HIGH**   |
| E2E-002 | Full Flow      | Out of stock flow                        | 1. Send chat<br>2. Confirm order<br>3. Product out of stock                                      | No Order created, out-of-stock email sent   | **HIGH**   |
| E2E-003 | Error Recovery | DB connection lost during order creation | 1. Start order creation<br>2. Disconnect DB<br>3. Reconnect                                      | Graceful error handling, no data corruption | **MEDIUM** |

### Test Coverage Summary

| Test Suite                   | Total Cases | High Priority | Medium Priority | Low Priority |
| ---------------------------- | ----------- | ------------- | --------------- | ------------ |
| Message Analysis & Detection | 17          | 9             | 7               | 1            |
| Product Extraction           | 8           | 4             | 4               | 0            |
| Order Status Update          | 14          | 8             | 6               | 0            |
| Real-time Socket.IO          | 7           | 5             | 2               | 0            |
| Inventory Management         | 5           | 2             | 3               | 0            |
| Integration & E2E            | 3           | 2             | 1               | 0            |
| **TOTAL**                    | **54**      | **30**        | **23**          | **1**        |

---

## 5. Gợi ý mức độ ưu tiên test (Test Priority)

### High Priority (Must Test)

1. **analyzeMessage() với các pattern phổ biến**

   - _Lý do_: Core logic, ảnh hưởng trực tiếp đến detection rate
   - _Risk_: False negative → mất đơn hàng

2. **extractProductInfo() với SKU matching**

   - _Lý do_: Sai SKU = sai sản phẩm = customer complaint
   - _Risk_: Tạo đơn sai hoặc không tạo được

3. **updateOrderStatus() auto-create order flow**

   - _Lý do_: Tạo order thật = doanh thu
   - _Risk_: Bug ở đây có thể tạo đơn trùng, sai giá, sai sản phẩm

4. **Inventory check trước khi create order**

   - _Lý do_: Tránh overselling
   - _Risk_: Customer experience xấu nếu đặt được nhưng hết hàng

5. **Phone number extraction và validation**
   - _Lý do_: Số phone sai = không liên lạc được khách
   - _Risk_: Mất khách hàng tiềm năng

### Medium Priority

6. **handleChatMessage() error handling**

   - _Lý do_: Đảm bảo chat không bị crash khi order detection lỗi
   - _Risk_: Service downtime

7. **Priority calculation logic**

   - _Lý do_: Giúp host ưu tiên đơn quan trọng
   - _Risk_: Trải nghiệm host kém hơn, không ảnh hưởng conversion

8. **Flash sale price application**

   - _Lý do_: Đảm bảo khách được giá flash sale
   - _Risk_: Pricing error

9. **Email notification**
   - _Lý do_: Customer communication
   - _Risk_: Không critical, có thể send sau

### Low Priority

10. **Size/Color pattern variations**

    - _Lý do_: Edge cases ít gặp
    - _Risk_: Một số order phải manual

11. **Analytics và stats**

    - _Lý do_: Không ảnh hưởng core flow
    - _Risk_: Reporting không chính xác

12. **Viewer count update**
    - _Lý do_: Cosmetic
    - _Risk_: UX minor issue

---

## 6. Đề xuất Mock cần chuẩn bị

| Dependency                            | Mock Strategy                                                | Dữ liệu mẫu mock                                                                                  |
| ------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **Product.findOne({ sku })**          | Stub trả về product document hoặc null                       | `{ _id: 'prod123', sku: 'HJ6777', name: 'Nike Air Max', finalPrice: 1500000, inventory: [...] }`  |
| **User.findById()**                   | Stub trả về user document                                    | `{ _id: 'user123', username: 'nguyenvana', email: 'test@example.com', fullName: 'Nguyen Van A' }` |
| **LiveStreamChat.create()**           | Mock constructor, spy on save()                              | Message object với timestamp                                                                      |
| **PotentialOrder.create()**           | Mock constructor, track createdOrders                        | Potential order với customerInfo, productInfo                                                     |
| **OrderService.createOrder()**        | Stub để test integration, spy để verify calls                | Order với items array                                                                             |
| **EmailService.sendTemplatedEmail()** | Stub resolve() hoặc reject()                                 | Không return gì, chỉ log                                                                          |
| **Socket.IO server**                  | Mock io.of(), socket.emit(), socket.on()                     | Event emitter mock                                                                                |
| **LiveStream.findById()**             | Stub trả về stream document                                  | `{ _id: 'stream123', roomId: 'room-abc', hostId: 'host123', featuredProducts: [] }`               |
| **Mongoose session**                  | Mock startSession(), commitTransaction(), abortTransaction() | Session object                                                                                    |
| **Logger**                            | Mock info(), error(), warn()                                 | Không return, chỉ spy để verify log calls                                                         |
| **product.checkInventory()**          | Stub method trên product instance                            | `{ available: true, quantity: 10, variant: {...} }`                                               |

### Mock Data Templates

```javascript
// Sample Livestream
const mockStream = {
  _id: new ObjectId('507f1f77bcf86cd799439011'),
  roomId: 'test-room-123',
  title: 'Test Livestream',
  hostId: new ObjectId('507f1f77bcf86cd799439012'),
  featuredProducts: [
    {
      productId: new ObjectId('507f1f77bcf86cd799439013'),
      addedAt: new Date(),
    },
  ],
  isActive: true,
  status: 'live',
};

// Sample Chat Message (có order)
const mockChatMessage = {
  _id: new ObjectId('507f1f77bcf86cd799439014'),
  streamId: mockStream._id,
  roomId: mockStream.roomId,
  senderId: new ObjectId('507f1f77bcf86cd799439015'),
  senderRole: 'viewer',
  content: 'Chốt đơn HJ6777 màu đen size 42 sđt 0912345678',
  messageType: 'text',
  timestamp: new Date(),
};

// Sample User
const mockUser = {
  _id: new ObjectId('507f1f77bcf86cd799439015'),
  username: 'buyer123',
  fullName: 'Nguyen Van A',
  email: 'buyer@example.com',
  phone: '0912345678',
  address: '123 Test Street, HCMC',
};

// Sample Product
const mockProduct = {
  _id: new ObjectId('507f1f77bcf86cd799439013'),
  sku: 'HJ6777',
  name: 'Nike Air Jordan 1',
  brand: 'Nike',
  finalPrice: 3500000,
  price: { regular: 4000000 },
  productType: 'shoes',
  inventory: [
    { size: 40, color: 'đen', quantity: 5, sku: 'HJ6777-40-BLK' },
    { size: 42, color: 'đen', quantity: 10, sku: 'HJ6777-42-BLK' },
    { size: 42, color: 'trắng', quantity: 0, sku: 'HJ6777-42-WHT' },
  ],
};

// Sample Potential Order Detection Result
const mockDetectionResult = {
  isOrder: true,
  confidence: 0.75,
  data: {
    customerInfo: {
      userId: mockUser._id,
      customerName: 'buyer123',
      phoneNumber: '0912345678',
    },
    productInfo: {
      originalMessage: 'Chốt đơn HJ6777 màu đen size 42 sđt 0912345678',
      productId: mockProduct._id,
      extractedSize: '42',
      extractedColor: 'đen',
      extractedQuantity: 1,
    },
    detectionData: {
      confidence: 0.75,
      detectedKeywords: ['chốt', 'đơn', 'màu', 'size'],
      phoneMatches: ['0912345678'],
    },
    streamId: mockStream._id,
    roomId: mockStream.roomId,
    chatMessageId: mockChatMessage._id,
  },
};
```

---

## 7. Gợi ý hành động tiếp theo

### A. Test Implementation Roadmap

#### Phase 1: Setup (Week 1)

- [ ] Setup Jest configuration (`jest.config.js`)
- [ ] Install dependencies: `jest`, `@types/jest`, `supertest`, `mongodb-memory-server`
- [ ] Create test directory structure
- [ ] Setup mock data templates
- [ ] Configure code coverage reporting (Istanbul)

#### Phase 2: Unit Tests - Core Services (Week 2-3)

- [ ] **orderDetection.service.test.js** (Priority: HIGH)
  - [ ] Test `analyzeMessage()` - 10+ cases (ODT-001 to ODT-017)
  - [ ] Test `extractPhoneNumbers()` - 5+ formats
  - [ ] Test `extractProductInfo()` - 8+ patterns (PRD-001 to PRD-008)
  - [ ] Test `calculateConfidence()` - boundary values
  - [ ] Test `savePotentialOrder()` - DB integration

#### Phase 3: Unit Tests - Controllers (Week 3-4)

- [ ] **potentialOrderController.test.js** (Priority: HIGH)
  - [ ] Test `updateOrderStatus()` - all status transitions (STA-001 to STA-014)
  - [ ] Test `getPotentialOrdersForStream()` - filtering & pagination
  - [ ] Test authorization middleware
  - [ ] Test error handling

#### Phase 4: Integration Tests (Week 4-5)

- [ ] **livestreamOrder.integration.test.js** (Priority: HIGH)
  - [ ] Chat message → Potential order creation (E2E-001)
  - [ ] Confirm potential order → Real order creation
  - [ ] Inventory check → Out of stock handling (E2E-002)
  - [ ] Email notification flow

#### Phase 5: Real-time & Performance Tests (Week 5-6)

- [ ] **livestreamSocket.test.js** (Priority: MEDIUM)
  - [ ] Socket.IO event handling (SOC-001 to SOC-007)
  - [ ] Concurrent messages (100 messages/sec)
  - [ ] Error recovery

#### Phase 6: E2E & Regression (Week 6-7)

- [ ] Full flow E2E tests with real MongoDB
- [ ] Load testing with Artillery
- [ ] Security testing (XSS, injection)
- [ ] Regression test suite

---

### B. Prompt Templates for Next Phases

#### Prompt 1: Generate Jest Test Code (Phase 2)

```
Based on the test case matrix (ODT-001 to ODT-017), generate comprehensive Jest unit tests for the OrderDetectionService.analyzeMessage() function.

Requirements:
1. Create file: `backend/tests/services/orderDetection.service.test.js`
2. Use the mock data templates provided in section 6
3. Include these test cases:
   - ODT-001: Happy path with phone + keywords
   - ODT-005: Edge case - phone only, no keywords
   - ODT-006: Edge case - keywords only, no phone
   - ODT-007: Invalid phone format
   - ODT-013: Boundary test - confidence = 0.30
   - ODT-014: Boundary test - confidence = 0.29

4. Mock Strategy:
   - Mock Product.findOne() using jest.spyOn()
   - Mock Logger methods
   - Use beforeEach() to reset mocks

5. Assertions should verify:
   - Return value structure
   - Confidence score calculation
   - Product ID extraction
   - Phone number extraction
   - Detection keywords matched

6. Code style:
   - Use async/await
   - Clear test descriptions
   - Group related tests in describe() blocks
   - Add comments for complex logic

Output: Complete Jest test file with all imports and setup.
```

#### Prompt 2: Generate Integration Tests (Phase 4)

```
Generate integration tests for the complete "Order in Livestream" flow from chat message to order creation.

Test File: `backend/tests/integration/livestream-order.integration.test.js`

Test Scenarios:
1. E2E-001: Full successful flow
   - Setup: Create livestream, user, product with inventory
   - Action: Send chat message with order intent
   - Verify: PotentialOrder created, confidence correct, priority calculated
   - Action: Host confirms order (status = "confirmed")
   - Verify: Real Order created, inventory updated, email sent

2. E2E-002: Out of stock flow
   - Setup: Product with 0 inventory
   - Action: Send chat, host confirms
   - Verify: No order created, out-of-stock email sent

3. Error Recovery: DB failure during order creation
   - Setup: Mock DB connection loss
   - Action: Attempt order creation
   - Verify: Graceful error handling, no data corruption

Use:
- mongodb-memory-server for in-memory database
- supertest for API requests
- Real Socket.IO client for WebSocket testing
- Cleanup after each test (afterEach)

Output: Complete integration test file with setup/teardown.
```

#### Prompt 3: Generate Mock Data Factory (Phase 1)

```
Create a test data factory file for generating realistic mock data for "Order in Livestream" tests.

File: `backend/tests/helpers/mockDataFactory.js`

Export these factory functions:

1. createMockUser(overrides = {})
   - Returns User object with realistic Vietnamese data
   - Overrides: custom fields like _id, phone, email

2. createMockProduct(overrides = {})
   - Returns Product object with inventory variants
   - Support productType: shoes, clothing, accessory
   - Include SKU, price, inventory array

3. createMockLiveStream(overrides = {})
   - Returns LiveStream with roomId, hostId, featuredProducts

4. createMockChatMessage(overrides = {})
   - Returns LiveStreamChat with content, senderId, timestamp

5. createMockPotentialOrder(overrides = {})
   - Returns PotentialOrder with customerInfo, productInfo, detectionData

6. createMockOrder(overrides = {})
   - Returns complete Order with OrderItems

Use:
- faker.js for realistic data (Vietnamese names, addresses)
- mongoose.Types.ObjectId() for IDs
- Sensible defaults for all fields

Output: Complete factory file with JSDoc comments.
```

---

### C. Recommended Testing Tools & Setup

| Tool                      | Version | Purpose                      | Installation                                   |
| ------------------------- | ------- | ---------------------------- | ---------------------------------------------- |
| **Jest**                  | ^29.7.0 | Test framework               | `npm install --save-dev jest`                  |
| **@types/jest**           | ^29.5.0 | TypeScript types for Jest    | `npm install --save-dev @types/jest`           |
| **Supertest**             | ^6.3.3  | HTTP API testing             | `npm install --save-dev supertest`             |
| **MongoDB Memory Server** | ^9.1.3  | In-memory MongoDB            | `npm install --save-dev mongodb-memory-server` |
| **socket.io-client**      | ^4.x    | Socket.IO client for testing | `npm install --save-dev socket.io-client`      |
| **@faker-js/faker**       | ^8.3.1  | Generate test data           | `npm install --save-dev @faker-js/faker`       |
| **jest-extended**         | ^4.0.2  | Additional Jest matchers     | `npm install --save-dev jest-extended`         |

#### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/config/**', '!src/templates/**'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
    './src/services/orderDetection.service.js': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
};
```

---

### D. Testing Checklist

#### Unit Tests - High Priority

- [ ] `analyzeMessage()` - 10+ test cases covering happy path + edge cases
- [ ] `extractProductInfo()` - 8+ patterns (SKU, size, color, quantity)
- [ ] `extractPhoneNumbers()` - 5+ formats (VN phone validation)
- [ ] `calculateConfidence()` - boundary values (0.29, 0.30, 0.70, 1.0)
- [ ] `updateOrderStatus()` - all status transitions (pending → contacted → confirmed)
- [ ] `product.checkInventory()` - in-stock, out-of-stock, variant matching

#### Unit Tests - Medium Priority

- [ ] `handleChatMessage()` - error handling when detection fails
- [ ] `savePotentialOrder()` - DB save validation
- [ ] Priority calculation logic (urgent, high, medium, low)
- [ ] Flash sale price application
- [ ] Email template rendering

#### Integration Tests - High Priority

- [ ] Chat message → Potential order creation (full flow)
- [ ] Confirm potential order → Real order creation
- [ ] Inventory check → Out of stock email notification
- [ ] Email notification success & failure scenarios
- [ ] Transaction rollback on order creation failure

#### Real-time Tests - High Priority

- [ ] Socket.IO: Viewer sends chat message
- [ ] Socket.IO: Host receives `potential_order_detected` event
- [ ] Socket.IO: Broadcast message to all viewers
- [ ] Concurrent messages (100 messages/sec load test)
- [ ] Error handling when Socket disconnects

#### E2E Tests - Medium Priority

- [ ] Full flow: Join stream → Send chat → Detect order → Confirm → Order created
- [ ] Out of stock flow end-to-end
- [ ] Multiple viewers sending orders simultaneously
- [ ] Host ignores spam orders

#### Performance & Load Tests - Low Priority

- [ ] Artillery script for 100 concurrent users
- [ ] Response time < 100ms for message analysis
- [ ] Response time < 500ms for order creation
- [ ] Memory leak testing for long-running streams

#### Security Tests - Medium Priority

- [ ] XSS injection in message content
- [ ] SQL injection attempts (though using Mongoose)
- [ ] Authorization bypass attempts
- [ ] Rate limiting for order creation

#### Code Coverage Targets

- [ ] Overall: 80%+ line coverage
- [ ] orderDetection.service.js: 90%+ (critical path)
- [ ] potentialOrderController.js: 85%+
- [ ] order.service.js: 85%+
- [ ] Branch coverage: 70%+

---

### E. CI/CD Integration

#### GitHub Actions Workflow (`.github/workflows/test.yml`)

```yaml
name: Run Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci
        working-directory: ./backend

      - name: Run unit tests
        run: npm run test:unit
        working-directory: ./backend

      - name: Run integration tests
        run: npm run test:integration
        working-directory: ./backend

      - name: Generate coverage report
        run: npm run test:coverage
        working-directory: ./backend

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

      - name: Check coverage thresholds
        run: npm run test:coverage:check
        working-directory: ./backend
```

#### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=tests/.*\\.test\\.js$",
    "test:integration": "jest --testPathPattern=tests/integration/.*\\.test\\.js$",
    "test:e2e": "jest --testPathPattern=tests/e2e/.*\\.test\\.js$",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:coverage:check": "jest --coverage --coverageThreshold='{\"global\":{\"lines\":80}}'",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```

- [ ] Unit tests cho `analyzeMessage()` (10+ test cases)
- [ ] Unit tests cho `extractProductInfo()` (15+ patterns)
- [ ] Unit tests cho `extractPhoneNumbers()` (5+ formats)
- [ ] Unit tests cho `calculateConfidence()` (boundary values)
- [ ] Unit tests cho `updateOrderStatus()` (all status transitions)
- [ ] Integration test: Chat message → Potential order creation
- [ ] Integration test: Confirm potential order → Real order creation
- [ ] Integration test: Inventory check → Out of stock handling
- [ ] E2E test: Full flow từ chat đến order confirm
- [ ] Error handling tests (DB errors, network errors)
- [ ] Concurrency tests (100 messages đồng thời)
- [ ] Performance tests (response time < 100ms)
- [ ] Security tests (injection, XSS)
- [ ] Email notification tests (success + failure)

---

## 8. Known Issues & Technical Debt

1. **Regex Performance**: Nhiều regex patterns có thể chậm với messages dài

   - **Solution**: Limit message length, optimize regex

2. **Race Condition**: Multiple confirms cùng lúc có thể tạo duplicate orders

   - **Solution**: Sử dụng transaction hoặc optimistic locking

3. **No Rollback**: Nếu email fails sau khi tạo order, không có retry mechanism

   - **Solution**: Implement message queue (Redis/RabbitMQ)

4. **Hard-coded Keywords**: Vietnamese keywords hard-coded trong service

   - **Solution**: Move to config file hoặc database

5. **No ML**: Dùng regex thay vì ML model thật
   - **Solution**: Tích hợp ML model nếu có budget

---

## 9. Dependencies Version Requirements

```json
{
  "mongoose": "^7.x",
  "socket.io": "^4.x",
  "express": "^4.x",
  "express-validator": "^7.x",
  "nanoid": "^5.x"
}
```

---

## 10. Related Documentation

- Livestream WebRTC Setup: `/livestream.md`
- API Integration Guide: `/API_INTEGRATION.md`
- Email Templates: `backend/src/templates/email.templates.js`
- Database Schema ERD: (Cần tạo)
- Socket.IO Events Specification: (Cần tạo)
