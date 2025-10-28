# Order in Livestream - Technical & Testing Analysis

## 1. Tổng quan Feature

### Mục đích của feature

Feature "Order in Livestream" cho phép hệ thống tự động phát hiện và xử lý đơn hàng từ các tin nhắn chat trong livestream. Khi người xem (viewer) gửi tin nhắn có chứa thông tin mua hàng (số điện thoại, tên sản phẩm, size, màu), hệ thống sẽ:

- Phân tích tin nhắn bằng AI/NLP pattern matching
- Trích xuất thông tin khách hàng và sản phẩm
- Tạo "Potential Order" (đơn hàng tiềm năng)
- Thông báo realtime cho host
- Cho phép host xác nhận và tự động tạo đơn hàng thật

### Lý do nên chọn feature này để viết test

1. **Business Critical**: Đây là tính năng tạo doanh thu trực tiếp từ livestream
2. **Complex Logic**: Nhiều bước xử lý phức tạp (NLP, regex, validation, order creation)
3. **High Risk**: Bug có thể dẫn đến mất đơn hàng hoặc tạo sai đơn
4. **Real-time**: Liên quan đến WebSocket, socket.io, cần test concurrency
5. **Multiple Dependencies**: Database, WebSocket, AI detection, email service
6. **Edge Cases**: Nhiều trường hợp đặc biệt (SKU, size, color variations, inventory check)

### Business logic chính

```
Flow chính:
1. Viewer gửi chat message trong livestream
2. OrderDetectionService phân tích tin nhắn
3. Nếu phát hiện order → Tạo PotentialOrder với confidence score
4. Gửi realtime notification cho Host qua Socket.IO
5. Host xem và thay đổi status: pending → contacted → confirmed
6. Khi status = "confirmed" → Tự động tạo Order thật
7. Kiểm tra inventory trước khi tạo order
8. Gửi email confirmation cho khách hàng
```

---

## 2. Files / Modules liên quan trong dự án

| File/Path                                             | Mô tả vai trò                                   | Hàm/Method quan trọng                                                                       |
| ----------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `backend/src/services/orderDetection.service.js`      | Core AI/NLP service phát hiện order từ chat     | `analyzeMessage()`, `extractPhoneNumbers()`, `extractProductInfo()`, `savePotentialOrder()` |
| `backend/src/services/livestream.service.js`          | Quản lý livestream rooms, WebSocket connections | `handleChatMessage()`, `joinAsViewer()`, `joinAsHost()`                                     |
| `backend/src/services/livestreamSocket.service.js`    | Socket.IO handlers cho WebRTC và chat           | `chat_message` handler, `potential_order_detected` emit                                     |
| `backend/src/services/order.service.js`               | Tạo và quản lý orders thật                      | `OrderService.createOrder()`, `getProductFlashSale()`                                       |
| `backend/src/controllers/potentialOrderController.js` | REST API cho potential orders                   | `updateOrderStatus()`, `getPotentialOrdersForStream()`, `getMyPotentialOrders()`            |
| `backend/src/models/PotentialOrder.js`                | Schema cho potential orders                     | `markAsViewed()`, `convertToOrder()`, `pre('save')` priority calculation                    |
| `backend/src/models/LiveStreamChat.js`                | Schema cho chat messages                        | `markAsAnalyzed()`, `linkToPotentialOrder()`                                                |
| `backend/src/models/LiveStream.js`                    | Schema cho livestream sessions                  | `addFeaturedProduct()`, `updateViewerCount()`                                               |
| `backend/src/models/Product.js`                       | Schema sản phẩm                                 | `checkInventory()`, SKU matching                                                            |
| `backend/src/models/Order.js`                         | Schema đơn hàng thật                            | Order validation, pre-save hooks                                                            |
| `backend/src/routes/potentialOrderRoutes.js`          | Routes cho potential order APIs                 | All CRUD routes                                                                             |
| `backend/src/templates/email.templates.js`            | Email templates                                 | `LIVESTREAM_ORDER_SUCCESS`, `LIVESTREAM_OUT_OF_STOCK`                                       |

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

| Category           | Scenario                                         | Input                                                  | Expected Output/Behavior                                         |
| ------------------ | ------------------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------- |
| **Happy Path**     | Viewer gửi message với phone và order keywords   | `"Chốt đơn 0912345678 size 42"`                        | Tạo PotentialOrder với confidence >= 0.4, priority high/medium   |
| **Happy Path**     | Message có SKU chính xác                         | `"Mua HJ6777 màu đen size 42 sđt 0912345678"`          | Tìm được productId, extractedSize = "42", extractedColor = "đen" |
| **Happy Path**     | Host confirm potential order → Auto create order | Status change to "confirmed"                           | Tạo Order, link convertedOrderId, send email                     |
| **Happy Path**     | Composite pattern với quantity                   | `"chốt 2 đôi NK-HBP-101 màu trắng size 40 0987654321"` | quantity = 2, productId found, color = "trắng", size = "40"      |
| **Edge Case**      | Message chỉ có phone, không có keywords          | `"0912345678"`                                         | Return null (không tạo PotentialOrder)                           |
| **Edge Case**      | Message có keywords nhưng không có phone         | `"Mua giày size 42"`                                   | Return null                                                      |
| **Edge Case**      | Phone number không đúng format VN                | `"Mua size 42 phone: 1234567890"`                      | Return null hoặc confidence thấp                                 |
| **Edge Case**      | Message quá ngắn (< 10 chars)                    | `"ok 0912"`                                            | Confidence bị penalty -0.1                                       |
| **Edge Case**      | Nhiều số điện thoại trong message                | `"0912345678 hoặc 0987654321"`                         | Lấy số phone đầu tiên (phoneNumbers[0])                          |
| **Edge Case**      | SKU không tồn tại                                | `"Mua INVALID123 0912345678"`                          | productId = null, vẫn tạo PotentialOrder nếu có featured product |
| **Edge Case**      | Product out of stock khi confirm                 | Inventory quantity = 0                                 | Không tạo Order, send email LIVESTREAM_OUT_OF_STOCK              |
| **Edge Case**      | Variant cụ thể out of stock                      | Size 42 hết, size 41 còn                               | Không tạo Order, notify out of stock for size 42                 |
| **Edge Case**      | Product price = 0 hoặc null                      | finalPrice = 0                                         | Skip auto-create order, log warning                              |
| **Edge Case**      | User không tồn tại khi confirm                   | customerInfo.userId invalid                            | Skip auto-create order, log error                                |
| **Edge Case**      | Concurrent order confirms                        | 2 hosts confirm cùng lúc                               | Sử dụng transaction để đảm bảo consistency                       |
| **Error Handling** | Database connection lost                         | Any DB operation                                       | Throw error, catch và trả về error response                      |
| **Error Handling** | Email service failure                            | sendTemplatedEmail throws                              | Log error nhưng vẫn tạo order thành công                         |
| **Error Handling** | Socket disconnected giữa chừng                   | handleChatMessage while socket closed                  | Graceful handling, không crash server                            |
| **Error Handling** | Invalid ObjectId                                 | req.params.id = "invalid"                              | Return 400 Bad Request                                           |
| **Error Handling** | Unauthorized status update                       | Viewer update host's order                             | Return 403 Forbidden                                             |
| **Business Logic** | High confidence keywords                         | Message có "chốt đơn", "ship cho"                      | confidence += 0.3                                                |
| **Business Logic** | Priority calculation                             | confidence = 0.85, có productId, size, qty > 1         | priority = "urgent"                                              |
| **Business Logic** | Flash sale active                                | Product có flash sale price                            | Sử dụng flashPrice thay vì regular price                         |
| **Business Logic** | Featured product matching                        | Message "mua cái này" khi có featured product          | productId = featuredProducts[last]                               |
| **Business Logic** | Inventory SKU vs base SKU                        | SKU trong inventory.sku                                | Tìm được product, infer size/color từ inventory                  |
| **Business Logic** | One-size product                                 | productType = "accessory", isOneSize = true            | extractedSize = "ONESIZE"                                        |
| **Performance**    | 100 messages cùng lúc                            | Stress test                                            | Tất cả messages được xử lý, không bị drop                        |
| **Performance**    | Large featured products array                    | 50 products featured                                   | extractProductInfo vẫn performant                                |
| **Security**       | SQL injection trong message                      | `"'; DROP TABLE--"`                                    | Sanitize, không ảnh hưởng DB                                     |
| **Security**       | XSS trong message content                        | `<script>alert('xss')</script>`                        | Content được escape khi lưu/hiển thị                             |

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

### A. Prompt đề xuất test cases (dành cho giai đoạn 2)

```
Dựa trên feature analysis document, hãy tạo một test plan chi tiết cho feature "Order in Livestream" với các yêu cầu sau:

1. Chia thành các test suites:
   - Unit tests cho OrderDetectionService
   - Unit tests cho PotentialOrderController
   - Integration tests cho Order Creation Flow
   - E2E tests cho Livestream Order Flow

2. Mỗi test case cần có:
   - Test ID (ví dụ: ODT-001)
   - Test description
   - Pre-conditions
   - Test steps
   - Expected results
   - Priority (High/Medium/Low)
   - Test data cụ thể

3. Tập trung vào:
   - Các edge cases đã liệt kê trong ma trận test cases
   - Error handling scenarios
   - Boundary value testing (confidence threshold, phone format, etc.)
   - Performance testing (concurrent messages)

4. Format output dưới dạng table markdown để dễ đọc và track.
```

---

### B. Prompt để generate Jest test code (dành cho giai đoạn 3)

```
Dựa trên feature analysis và test plan đã tạo, hãy generate Jest test code cho các test cases ưu tiên cao (High Priority) của feature "Order in Livestream".

Yêu cầu cụ thể:

1. Sử dụng Jest framework với các best practices:
   - describe/it blocks rõ ràng
   - beforeEach/afterEach cho setup/teardown
   - Proper mocking với jest.mock()
   - Async/await handling
   - Assertions đầy đủ

2. Tạo test files theo cấu trúc:
   - `__tests__/services/orderDetection.service.test.js`
   - `__tests__/controllers/potentialOrder.controller.test.js`
   - `__tests__/integration/livestreamOrder.integration.test.js`

3. Mock strategy:
   - Mock Mongoose models (Product, User, PotentialOrder, Order)
   - Mock external services (EmailService, Logger)
   - Sử dụng mock data templates đã định nghĩa

4. Test coverage:
   - Bắt đầu với analyzeMessage() function
   - Test extractProductInfo() với nhiều patterns
   - Test updateOrderStatus() auto-create flow
   - Test inventory check logic

5. Đảm bảo tests:
   - Isolated (không depend vào external systems)
   - Repeatable (có thể chạy nhiều lần)
   - Fast (mock DB calls)
   - Comprehensive (cover happy path + edge cases)

Output format: Code blocks với comments giải thích từng test case.
```

---

### C. Recommended Testing Tools

| Tool                      | Purpose                | Why                                             |
| ------------------------- | ---------------------- | ----------------------------------------------- |
| **Jest**                  | Test framework         | De-facto standard cho Node.js, built-in mocking |
| **Supertest**             | API testing            | Test Express routes without starting server     |
| **Sinon.js**              | Advanced mocking       | Better control over stubs/spies vs Jest mocks   |
| **MongoDB Memory Server** | In-memory DB for tests | Faster than real DB, isolated                   |
| **Socket.IO Client**      | WebSocket testing      | Test real-time features                         |
| **Faker.js**              | Generate test data     | Create realistic mock data                      |
| **Istanbul/nyc**          | Code coverage          | Measure test coverage %                         |
| **Artillery**             | Load testing           | Test concurrent messages performance            |

---

### D. Testing Checklist

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

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-19  
**Author**: AI Technical Analysis  
**Review Status**: Ready for Testing Team
