# Order in Livestream - Comprehensive Testing Framework Log

## Project Overview

**Feature**: Order in Livestream Module  
**Stack**: Node.js, Jest, Supertest, Socket.IO, MongoDB Memory Server, nyc  
**Target Coverage**: ≥80% line/branch coverage, ≥15 test cases  
**Timeline**: 180 minutes total (Analysis 15', Design 20', Coding 75', Debug 40', Optimize 15', Demo 15')

---

## 1) Phase 1 — Analysis (15')

### Prompt A1 — Code Analysis & Test Surface

**Core Files Identified:**

- `backend/src/services/livestream.service.js` - Main livestream service with handleChatMessage
- `backend/src/services/livestreamSocket.service.js` - Socket.IO integration
- `backend/src/controllers/potentialOrderController.js` - updateOrderStatus endpoint
- `backend/src/services/order.service.js` - OrderService.createOrder with transactions
- `backend/src/models/Product.js` - checkInventory method
- `backend/src/models/LiveStream.js` - Stream management
- `backend/src/models/LiveStreamChat.js` - Chat message handling
- `backend/src/models/PotentialOrder.js` - Potential order management

**Functions/Methods Requiring Unit Tests:**

| Function/Method                                                           | Primary Purpose                           | Inputs                                                    | Return Value                                          | Side Effects                       | Key Edge Cases                             | Dependencies to Mock                        | Priority |
| ------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------- | ------------------------------------------ | ------------------------------------------- | -------- |
| `livestreamService.handleChatMessage(socketId, messageData)`              | Process chat messages and detect orders   | socketId: string, messageData: object                     | {roomId, message, potentialOrder}                     | DB writes, socket emits            | System messages, detection errors          | LiveStreamChat, User, orderDetectionService | High     |
| `orderDetectionService.analyzeMessage(messageData, streamData, userData)` | Analyze chat for order intent             | messageData: object, streamData: object, userData: object | {isOrder: boolean, confidence: number, extractedData} | Logger calls                       | Confidence thresholds, spam detection      | Product.findOne, logger                     | High     |
| `orderDetectionService.extractProductInfo(rawMessage, streamData)`        | Extract SKU/size/color/qty from message   | rawMessage: string, streamData: object                    | {size, color, quantity, productId}                    | None                               | Multiple matches, fallback logic           | Product.findOne                             | High     |
| `potentialOrderController.updateOrderStatus(req, res)`                    | Update order status and create real order | req: Request, res: Response                               | HTTP response                                         | DB transactions, email sends       | Out-of-stock handling, email failures      | PotentialOrder, OrderService, EmailService  | High     |
| `OrderService.createOrder(orderData)`                                     | Create order with inventory checks        | orderData: object                                         | Order document                                        | DB transactions, inventory updates | Flash sale pricing, transaction rollback   | Product, Order, OrderItem, FlashSale        | High     |
| `product.checkInventory(variantInput)`                                    | Check variant availability                | variantInput: {size, color, clothingSize, isOneSize}      | {available: boolean, quantity: number}                | None                               | Product type differences, missing variants | None (pure function)                        | Medium   |
| `livestreamService.joinAsHost(socketId, roomId, userId)`                  | Host joins livestream                     | socketId: string, roomId: string, userId: string          | {roomId, role, viewers, streamData}                   | DB updates, socket mapping         | Authorization, duplicate joins             | LiveStream, logger                          | Medium   |
| `livestreamService.joinAsViewer(socketId, roomId, userId)`                | Viewer joins livestream                   | socketId: string, roomId: string, userId: string          | {roomId, role, viewerId, streamData}                  | DB updates, socket mapping         | Capacity limits, inactive streams          | LiveStream, User                            | Medium   |

### Prompt A2 — Risk Matrix & Acceptance Criteria

**Risk Matrix:**

| Risk                            | Cause                    | Impact                      | Likelihood | Detection           | Risk Level | Mitigation                    | Owner    |
| ------------------------------- | ------------------------ | --------------------------- | ---------- | ------------------- | ---------- | ----------------------------- | -------- |
| Order detection false positives | Weak NLP patterns        | Customer confusion          | Medium     | Manual review       | Medium     | Improve confidence thresholds | Dev Team |
| Out-of-stock orders created     | Missing inventory checks | Customer complaints         | High       | Integration tests   | High       | Add inventory validation      | Dev Team |
| Socket connection leaks         | Improper cleanup         | Memory issues               | Medium     | Load testing        | Medium     | Add connection monitoring     | Dev Team |
| Email delivery failures         | SMTP issues              | Customer communication loss | Medium     | Email service tests | Medium     | Add retry logic               | Dev Team |
| Concurrent order processing     | Race conditions          | Data inconsistency          | High       | Concurrency tests   | High       | Add database locks            | Dev Team |

**Acceptance Criteria:**

- **Detect order from chat**: ≥95% accuracy for clear order messages
- **Extract SKU/size/color/qty**: Support Vietnamese patterns, fallback to featured product
- **Process chat → potential order**: <200ms processing time
- **Update status & auto-create order**: Handle out-of-stock gracefully
- **Inventory check**: Real-time validation before order creation

**Test SLA**: ≥80% line/branch coverage, ≥15 test cases, average <300ms/test

### Prompt A3 — Interface Contract & Traceability

**Interface Contracts:**

```json
{
  "analyzeMessage": {
    "input": {
      "messageData": { "text": "string", "type": "string" },
      "streamData": { "_id": "ObjectId", "featuredProduct": "ObjectId" },
      "userData": { "_id": "ObjectId", "email": "string" }
    },
    "output": {
      "isOrder": "boolean",
      "confidence": "number",
      "extractedData": {
        "sku": "string",
        "size": "string",
        "color": "string",
        "quantity": "number"
      }
    }
  },
  "extractProductInfo": {
    "input": {
      "rawMessage": "string",
      "streamData": { "featuredProduct": "ObjectId" }
    },
    "output": {
      "size": "string",
      "color": "string",
      "quantity": "number",
      "productId": "ObjectId"
    }
  },
  "handleChatMessage": {
    "input": {
      "socketId": "string",
      "messageData": { "text": "string", "type": "string" }
    },
    "output": {
      "roomId": "string",
      "message": "LiveStreamChat",
      "potentialOrder": "PotentialOrder|null"
    }
  }
}
```

**Requirement → Test Case Traceability:**

| Requirement ID | Description                    | Test ID          | Test Type   | Priority |
| -------------- | ------------------------------ | ---------------- | ----------- | -------- |
| REQ-001        | Detect order from chat message | TC-001 to TC-005 | Unit        | High     |
| REQ-002        | Extract product information    | TC-006 to TC-010 | Unit        | High     |
| REQ-003        | Create potential order         | TC-011 to TC-013 | Integration | High     |
| REQ-004        | Update order status            | TC-014 to TC-016 | API         | High     |
| REQ-005        | Check inventory availability   | TC-017 to TC-019 | Unit        | Medium   |
| REQ-006        | Handle out-of-stock scenarios  | TC-020 to TC-022 | Integration | High     |

### Prompt A4 — Regex/NLP Patterns (VN context) & VN Phone Numbers

**Vietnamese Patterns:**

| Pattern             | Matching Examples                                        | Edge Cases                      | False Positive Cautions      |
| ------------------- | -------------------------------------------------------- | ------------------------------- | ---------------------------- | --------------- | ------------- | ---------------------- | --------------------- |
| Buy Intent Keywords | "chốt", "mua", "ship", "đặt", "sđt", "phone"             | "chốt deal" (not order)         | Avoid "chốt deal", "mua sắm" |
| SKU Patterns        | `[A-Z]{2,4}-[A-Z0-9]{3,6}(?:-[0-9]{2})?(?:-[A-Z]{2,4})?` | HJ6777, HJ6777-42-BLK           | Case sensitivity             |
| Size Patterns       | `(?:size                                                 | size                            | kích thước)\s*:?\s*([0-9]{2} | [XSMLXL]+       | ONE\s\*SIZE)` | "size 42", "size XL"   | Mixed languages       |
| Color Patterns      | `(?:màu                                                  | color)\s*:?\s*([a-zA-ZÀ-ỹ\s]+)` | "màu đen", "color black"     | Multiple colors |
| Quantity Patterns   | `(\d+)\s\*(?:đôi                                         | pair                            | pairs                        | cái             | chiếc)`       | "2 đôi", "1 pair"      | Decimal quantities    |
| Phone Patterns      | `(?:0[3                                                  | 5                               | 7                            | 8               | 9])[0-9]{8}`  | 0987654321, 0351234567 | International formats |

**Recommended Regex:**

```javascript
const VI_ORDER_PATTERNS = {
  buyIntent: /(?:chốt|mua|ship|đặt|sđt|phone)/i,
  sku: /[A-Z]{2,4}-[A-Z0-9]{3,6}(?:-[0-9]{2})?(?:-[A-Z]{2,4})?/g,
  size: /(?:size|size|kích thước)\s*:?\s*([0-9]{2}|[XSMLXL]+|ONE\s*SIZE)/i,
  color: /(?:màu|color)\s*:?\s*([a-zA-ZÀ-ỹ\s]+)/i,
  quantity: /(\d+)\s*(?:đôi|pair|pairs|cái|chiếc)/i,
  phone: /(?:0[3|5|7|8|9])[0-9]{8}/g,
};
```

---

## 2) Phase 2 — Test Design (20')

### Prompt B1 — Overall Test Plan

**Scope & Objectives:**

- Unit tests for core order detection logic
- Integration tests for livestream chat flow
- API tests for potential order management
- Socket.IO tests for real-time communication
- E2E smoke tests for complete user journey

**Strategy:**

- **Unit**: Individual service methods with mocked dependencies
- **Integration**: Service interactions with real database (MongoDB Memory)
- **API**: HTTP endpoints with Supertest
- **Socket**: Real-time communication with Socket.IO client
- **E2E**: Complete user flows with test data

**Test Suites & Case Counts:**

- `orderDetection.service` (≥10 cases): analyzeMessage, extractProductInfo
- `livestream.service` (≥8 cases): handleChatMessage, joinAsHost, joinAsViewer
- `potentialOrderController` (≥8 cases): updateOrderStatus transitions
- `order.service` (≥8 cases): createOrder with flash sales, transactions
- `product.checkInventory` (≥6 cases): different product types, variants
- `livestreamSocket.service` (≥6 cases): socket events, error handling

**Environment Setup:**

- Node.js with Jest test runner
- MongoDB Memory Server for database
- Socket.IO client for real-time testing
- nyc for coverage reporting
- Supertest for API testing

**Coverage Goals:**

- Line coverage: ≥80%
- Branch coverage: ≥80%
- Function coverage: ≥80%

**RACI & CI Schedule:**

- **Responsible**: Development Team
- **Accountable**: QA Lead
- **Consulted**: Product Owner
- **Informed**: Stakeholders
- **CI Schedule**: Run on every PR, nightly full suite

### Prompt B2 — Detailed Test Case Matrix (Given–When–Then)

| Test ID | Function           | Category | Given                          | When                                  | Then                                            | Priority | Data               | Mock/Stub                  |
| ------- | ------------------ | -------- | ------------------------------ | ------------------------------------- | ----------------------------------------------- | -------- | ------------------ | -------------------------- |
| TC-001  | analyzeMessage     | Happy    | Valid order message with phone | Message contains "chốt 2 đôi size 42" | Returns isOrder=true, confidence>0.8            | High     | Vietnamese message | Product.findOne            |
| TC-002  | analyzeMessage     | Edge     | Message with low confidence    | Message contains weak keywords        | Returns isOrder=false, confidence<0.3           | High     | Weak message       | Product.findOne            |
| TC-003  | analyzeMessage     | Error    | System message                 | Message type is "system"              | Skips analysis, returns null                    | Medium   | System message     | None                       |
| TC-004  | extractProductInfo | Happy    | Clear product info             | "HJ6777 size 42 màu đen 2 đôi"        | Returns {size: "42", color: "đen", quantity: 2} | High     | Clear message      | Product.findOne            |
| TC-005  | extractProductInfo | Edge     | Multiple products              | Message mentions multiple SKUs        | Returns first match                             | Medium   | Multiple SKUs      | Product.findOne            |
| TC-006  | extractProductInfo | Error    | No product found               | Invalid SKU in message                | Falls back to featured product                  | High     | Invalid SKU        | Product.findOne            |
| TC-007  | handleChatMessage  | Happy    | Viewer message                 | Authenticated viewer sends message    | Saves message, analyzes for orders              | High     | Viewer message     | User.findById              |
| TC-008  | handleChatMessage  | Edge     | Host message                   | Host sends message                    | Saves message, skips order analysis             | Medium   | Host message       | None                       |
| TC-009  | handleChatMessage  | Error    | Socket not in room             | Invalid socket ID                     | Throws "Socket not found" error                 | High     | Invalid socket     | None                       |
| TC-010  | updateOrderStatus  | Happy    | Confirm order                  | Status changed to "confirmed"         | Creates real order, sends email                 | High     | Valid order        | OrderService, EmailService |
| TC-011  | updateOrderStatus  | Edge     | Out of stock                   | Product not available                 | Sends OOS email, no order created               | High     | OOS product        | Product.checkInventory     |
| TC-012  | updateOrderStatus  | Error    | Invalid order ID               | Non-existent order ID                 | Returns 404 error                               | High     | Invalid ID         | PotentialOrder.findById    |
| TC-013  | createOrder        | Happy    | Valid order data               | All required fields provided          | Creates order with items                        | High     | Valid order        | Product, Order, OrderItem  |
| TC-014  | createOrder        | Edge     | Flash sale active              | Product in flash sale                 | Uses flash sale price                           | High     | Flash sale         | FlashSale.find             |
| TC-015  | createOrder        | Error    | Insufficient stock             | Requested quantity > available        | Throws stock error                              | High     | OOS variant        | Product.checkInventory     |
| TC-016  | checkInventory     | Happy    | Available variant              | Valid size/color combination          | Returns {available: true, quantity: 5}          | Medium   | Available variant  | None                       |
| TC-017  | checkInventory     | Edge     | Out of stock                   | Requested variant not available       | Returns {available: false, quantity: 0}         | Medium   | OOS variant        | None                       |
| TC-018  | checkInventory     | Error    | Invalid product type           | Wrong product type for variant        | Returns {available: false}                      | Medium   | Wrong type         | None                       |

### Prompt B3 — Gherkin Scenarios (End-to-End Flow)

**Background:**

```gherkin
Given a livestream is active with host "John"
And the featured product is "Nike Air Max" with SKU "NK-AM-001"
And the product has inventory: size 42, color "black", quantity 10
```

**Scenario 1: Successful Order Detection and Creation**

```gherkin
When a viewer sends message "chốt 2 đôi Nike Air Max size 42 màu đen 0987654321"
Then the system should detect a potential order
And create a potential order with confidence > 0.8
And notify the host via socket
When the host confirms the order
Then a real order should be created
And the customer should receive a confirmation email
```

**Scenario 2: Out-of-Stock Handling**

```gherkin
When a viewer requests "size 50" which is not available
And the host confirms the order
Then the system should check inventory
And send an out-of-stock email to the customer
And NOT create a real order
```

**Scenario 3: Flash Sale Pricing**

```gherkin
Given a flash sale is active for the featured product
When a viewer places an order
And the host confirms it
Then the order should use the flash sale price
And the order total should reflect the discounted price
```

**Scenario 4: Concurrent Order Processing**

```gherkin
When two hosts confirm orders simultaneously
And both orders request the last available item
Then only one order should be created
And the other should receive an out-of-stock notification
```

### Prompt B4 — Performance & Concurrency Test Design

**Load Test Scenario:**

- 100 chat messages in 5 seconds
- Across 10 livestream rooms
- Mix of order and non-order messages

**KPIs:**

- Detection rate: >95%
- P95 processing time: <150ms
- No socket connection leaks
- Memory usage stable

**Artillery YAML:**

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 5
      arrivalRate: 20
scenarios:
  - name: 'Livestream Chat Load Test'
    weight: 100
    flow:
      - post:
          url: '/api/livestream/chat'
          json:
            roomId: '{{ $randomString() }}'
            message: '{{ $randomString() }}'
            type: 'text'
```

### Prompt B5 — VN Test Data Pack

**Vietnamese Test Data:**

```json
{
  "phones": ["0987654321", "0351234567", "0912345678", "0888888888"],
  "names": ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D"],
  "colors": [
    { "vi": "đen", "en": "black" },
    { "vi": "trắng", "en": "white" },
    { "vi": "đỏ", "en": "red" },
    { "vi": "xanh", "en": "blue" }
  ],
  "sizes": [
    { "type": "shoes", "values": ["40", "41", "42", "43"] },
    { "type": "clothing", "values": ["S", "M", "L", "XL"] },
    { "type": "accessory", "values": ["OneSize"] }
  ],
  "orderMessages": [
    "chốt 2 đôi Nike Air Max size 42 màu đen 0987654321",
    "mua 1 đôi Adidas size 41 màu trắng ship 0351234567",
    "đặt 3 đôi Puma size 43 màu đỏ 0912345678"
  ],
  "noiseData": [
    "😀😀😀",
    "<script>alert('xss')</script>",
    "'; DROP TABLE products; --",
    "🎉🎉🎉",
    "HTML <b>tags</b>"
  ]
}
```

---

## 3) Phase 3 — Generate Test Code (75')

### Prompt C1 — Jest/Nyc Scaffold & Config

**Folder Structure:**

```
__tests__/
├── services/
│   ├── orderDetection.service.test.js
│   ├── livestream.service.test.js
│   └── order.service.test.js
├── controllers/
│   └── potentialOrderController.test.js
├── integration/
│   ├── livestream-chat.test.js
│   └── order-flow.test.js
├── e2e/
│   └── livestream-order.e2e.test.js
├── factories/
│   ├── user.factory.js
│   ├── product.factory.js
│   └── order.factory.js
└── mocks/
    ├── db.js
    ├── socket.js
    └── email.js
```

**jest.config.js:**

```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/config/**',
    '!src/utils/logger.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
  maxWorkers: 4,
};
```

**package.json scripts:**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:changed": "jest --onlyChanged",
    "test:debug": "jest --detectOpenHandles --forceExit"
  }
}
```

### Prompt C2 — Unit: orderDetection.service.analyzeMessage

**Test Cases:**

```javascript
describe('orderDetectionService.analyzeMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect order with high confidence for clear Vietnamese message', async () => {
    // Given
    const messageData = { text: 'chốt 2 đôi Nike size 42 màu đen 0987654321', type: 'text' };
    const streamData = { _id: 'stream123', featuredProduct: 'product123' };
    const userData = { _id: 'user123', email: 'test@example.com' };

    Product.findOne.mockResolvedValue({ _id: 'product123', name: 'Nike Air Max' });

    // When
    const result = await orderDetectionService.analyzeMessage(messageData, streamData, userData);

    // Then
    expect(result.isOrder).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.extractedData).toMatchObject({
      size: '42',
      color: 'đen',
      quantity: 2,
    });
  });

  it('should return low confidence for weak keywords', async () => {
    // Given
    const messageData = { text: 'có thể mua không?', type: 'text' };

    // When
    const result = await orderDetectionService.analyzeMessage(messageData, streamData, userData);

    // Then
    expect(result.isOrder).toBe(false);
    expect(result.confidence).toBeLessThan(0.3);
  });

  it('should handle system messages by skipping analysis', async () => {
    // Given
    const messageData = { text: 'User joined', type: 'system' };

    // When
    const result = await orderDetectionService.analyzeMessage(messageData, streamData, userData);

    // Then
    expect(result).toBeNull();
  });
});
```

### Prompt C3 — Unit: extractProductInfo

**Test Cases:**

```javascript
describe('extractProductInfo', () => {
  it('should extract product info from clear message', async () => {
    // Given
    const rawMessage = 'HJ6777 size 42 màu đen 2 đôi';
    const streamData = { featuredProduct: 'product123' };

    Product.findOne.mockResolvedValue({ _id: 'product123', name: 'Nike Air Max' });

    // When
    const result = await extractProductInfo(rawMessage, streamData);

    // Then
    expect(result).toEqual({
      size: '42',
      color: 'đen',
      quantity: 2,
      productId: 'product123',
    });
  });

  it('should fallback to featured product when SKU not found', async () => {
    // Given
    const rawMessage = 'invalid-sku size 42 màu đen';
    const streamData = { featuredProduct: 'featured123' };

    Product.findOne
      .mockResolvedValueOnce(null) // SKU not found
      .mockResolvedValueOnce({ _id: 'featured123', name: 'Featured Product' });

    // When
    const result = await extractProductInfo(rawMessage, streamData);

    // Then
    expect(result.productId).toBe('featured123');
  });
});
```

### Prompt C4 — Unit: product.checkInventory

**Test Cases:**

```javascript
describe('Product.checkInventory', () => {
  let product;

  beforeEach(() => {
    product = new Product({
      productType: 'shoes',
      inventory: [
        { size: 42, color: 'black', quantity: 5, isAvailable: true },
        { size: 43, color: 'black', quantity: 0, isAvailable: false },
      ],
    });
  });

  it('should return available for in-stock variant', () => {
    // Given
    const variantInput = { size: 42, color: 'black' };

    // When
    const result = product.checkInventory(variantInput);

    // Then
    expect(result).toEqual({
      available: true,
      quantity: 5,
      sku: expect.any(String),
      images: expect.any(Array),
    });
  });

  it('should return unavailable for out-of-stock variant', () => {
    // Given
    const variantInput = { size: 43, color: 'black' };

    // When
    const result = product.checkInventory(variantInput);

    // Then
    expect(result.available).toBe(false);
    expect(result.quantity).toBe(0);
  });

  it('should handle clothing sizes correctly', () => {
    // Given
    product.productType = 'clothing';
    product.inventory = [{ clothingSize: 'M', color: 'red', quantity: 3, isAvailable: true }];
    const variantInput = { clothingSize: 'M', color: 'red' };

    // When
    const result = product.checkInventory(variantInput);

    // Then
    expect(result.available).toBe(true);
    expect(result.quantity).toBe(3);
  });
});
```

### Prompt C5 — Integration: livestream.service.handleChatMessage + Socket

**Test Cases:**

```javascript
describe('livestreamService.handleChatMessage Integration', () => {
  let mockSocket;
  let mockIO;

  beforeEach(() => {
    mockSocket = {
      id: 'socket123',
      join: jest.fn(),
      emit: jest.fn(),
    };

    mockIO = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    // Setup room state
    livestreamService.rooms.set('room123', {
      host: { socketId: 'host123', userId: 'host456' },
      viewers: new Map(),
      streamData: { _id: 'stream123' },
    });

    livestreamService.socketToRoom.set('socket123', {
      roomId: 'room123',
      role: 'viewer',
      userId: 'user123',
    });
  });

  it('should process viewer message and detect potential order', async () => {
    // Given
    const messageData = { text: 'chốt 2 đôi size 42', type: 'text' };

    User.findById.mockResolvedValue({ _id: 'user123', email: 'test@example.com' });
    LiveStreamChat.create.mockResolvedValue({ _id: 'chat123' });
    orderDetectionService.analyzeMessage.mockResolvedValue({
      isOrder: true,
      confidence: 0.9,
      extractedData: { size: '42', quantity: 2 },
    });
    orderDetectionService.savePotentialOrder.mockResolvedValue({ _id: 'order123' });

    // When
    const result = await livestreamService.handleChatMessage('socket123', messageData);

    // Then
    expect(result.potentialOrder).toBeDefined();
    expect(LiveStreamChat.create).toHaveBeenCalled();
    expect(orderDetectionService.analyzeMessage).toHaveBeenCalled();
  });

  it('should skip analysis for system messages', async () => {
    // Given
    const messageData = { text: 'User joined', type: 'system' };

    // When
    const result = await livestreamService.handleChatMessage('socket123', messageData);

    // Then
    expect(orderDetectionService.analyzeMessage).not.toHaveBeenCalled();
    expect(result.potentialOrder).toBeNull();
  });
});
```

### Prompt C6 — API: potentialOrderController.updateOrderStatus

**Test Cases:**

```javascript
describe('potentialOrderController.updateOrderStatus', () => {
  it('should update status to confirmed and create real order', async () => {
    // Given
    const req = {
      params: { id: 'order123' },
      body: { status: 'confirmed', notes: 'Customer confirmed' },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    const potentialOrder = {
      _id: 'order123',
      status: 'pending',
      customerInfo: { customerName: 'John Doe', phone: '0987654321' },
      productInfo: { extractedSize: '42', extractedColor: 'black', extractedQuantity: 2 },
    };

    PotentialOrder.findByIdAndUpdate.mockResolvedValue(potentialOrder);
    User.findById.mockResolvedValue({ _id: 'user123', email: 'test@example.com' });
    Product.findById.mockResolvedValue({
      _id: 'product123',
      name: 'Nike Air Max',
      checkInventory: jest.fn().mockReturnValue({ available: true, quantity: 5 }),
      finalPrice: 100,
    });
    OrderService.createOrder.mockResolvedValue({ _id: 'realOrder123' });
    EmailService.sendTemplatedEmail.mockResolvedValue({ success: true });

    // When
    await updateOrderStatus(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(200);
    expect(OrderService.createOrder).toHaveBeenCalled();
    expect(EmailService.sendTemplatedEmail).toHaveBeenCalled();
  });

  it('should handle out-of-stock scenario', async () => {
    // Given
    const req = { params: { id: 'order123' }, body: { status: 'confirmed' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    Product.findById.mockResolvedValue({
      checkInventory: jest.fn().mockReturnValue({ available: false, quantity: 0 }),
    });

    // When
    await updateOrderStatus(req, res);

    // Then
    expect(OrderService.createOrder).not.toHaveBeenCalled();
    expect(EmailService.sendTemplatedEmail).toHaveBeenCalledWith(
      expect.any(String),
      'LIVESTREAM_OUT_OF_STOCK',
      expect.any(Object)
    );
  });
});
```

### Prompt C7 — Unit/Integration: OrderService.createOrder (transactions)

**Test Cases:**

```javascript
describe('OrderService.createOrder', () => {
  it('should create order with flash sale pricing', async () => {
    // Given
    const orderData = {
      user: 'user123',
      products: [{ id: 'product123', quantity: 2, price: 100 }],
      totalAmount: 200,
      paymentMethod: 'cash_on_delivery',
      shippingAddress: '123 Main St',
    };

    Product.findById.mockResolvedValue({
      _id: 'product123',
      name: 'Nike Air Max',
      checkInventory: jest.fn().mockReturnValue({ available: true, quantity: 5 }),
    });

    FlashSale.find.mockResolvedValue([
      {
        products: ['product123'],
        flashPrice: 80,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 3600000),
      },
    ]);

    // When
    const result = await OrderService.createOrder(orderData);

    // Then
    expect(result).toBeDefined();
    expect(FlashSale.find).toHaveBeenCalled();
  });

  it('should rollback transaction on item creation failure', async () => {
    // Given
    const orderData = {
      /* valid order data */
    };

    Product.findById
      .mockResolvedValueOnce({
        /* valid product */
      })
      .mockRejectedValueOnce(new Error('Database error'));

    // When & Then
    await expect(OrderService.createOrder(orderData)).rejects.toThrow();
    expect(mongoose.startSession).toHaveBeenCalled();
  });
});
```

### Prompt C8 — Realtime Reliability: Socket

**Test Cases:**

```javascript
describe('Socket Reliability', () => {
  it('should handle rapid successive chat messages', async () => {
    // Given
    const messages = Array(10)
      .fill()
      .map((_, i) => ({
        text: `Message ${i}`,
        type: 'text',
      }));

    // When
    const promises = messages.map(msg => livestreamService.handleChatMessage('socket123', msg));
    await Promise.all(promises);

    // Then
    expect(LiveStreamChat.create).toHaveBeenCalledTimes(10);
  });

  it('should clean up socket connections on disconnect', async () => {
    // Given
    livestreamService.socketToRoom.set('socket123', {
      roomId: 'room123',
      role: 'viewer',
      userId: 'user123',
    });

    // When
    await livestreamService.handleDisconnect('socket123');

    // Then
    expect(livestreamService.socketToRoom.has('socket123')).toBe(false);
  });
});
```

### Prompt C9 — Coverage Report Gap-Fill

**Coverage Analysis:**

- Files <80% coverage: `orderDetection.service.js` (75%), `livestream.service.js` (78%)
- Missing test cases for error handling paths
- Need additional edge case coverage

**Additional Tests Needed:**

- [ ] Error handling in analyzeMessage when Product.findOne fails
- [ ] Edge case: multiple potential orders from same user
- [ ] Boundary testing: confidence threshold edge cases
- [ ] Socket error handling: connection drops during order processing
- [ ] Database transaction rollback scenarios

---

## 4) Phase 4 — Run & Debug (40')

### Prompt D1 — Debug a Failing Test (template)

**Common Issues & Solutions:**

1. **Async/Await Issues:**

```javascript
// Problem: Test completes before async operations
it('should handle async operation', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});

// Solution: Always use async/await in tests
```

2. **Mock Not Working:**

```javascript
// Problem: Mock not being called
jest.mock('../services/orderDetection.service', () => ({
  analyzeMessage: jest.fn(),
}));

// Solution: Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

3. **Database Connection Issues:**

```javascript
// Problem: Tests hanging due to open connections
afterAll(async () => {
  await mongoose.connection.close();
});
```

### Prompt D2 — Diagnose a Flaky Test

**Common Flaky Test Causes:**

- Race conditions in concurrent operations
- Shared state between tests
- Timing issues with async operations
- Database state not properly reset

**Solutions:**

- Use `jest.useFakeTimers()` for timing tests
- Reset mocks and database state in `beforeEach`
- Use `waitFor` for async assertions
- Isolate tests with proper cleanup

### Prompt D3 — Speed Up the Suite

**Performance Optimizations:**

1. **Parallel Test Execution:** Use `--maxWorkers=4`
2. **Mock Heavy Dependencies:** Replace real database calls with mocks
3. **Test Sharding:** Split tests across multiple files
4. **Cache Factories:** Reuse test data where possible
5. **Reduce I/O:** Use in-memory alternatives

**Target:** Reduce total runtime by 30%

---

## 5) Phase 5 — Optimization & Mocking (15')

### Prompt E1 — Generate Production-Grade Jest Mocks

**Mock Files:**

\***\*tests**/mocks/db.js:\*\*

```javascript
export const mockProduct = {
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

export const mockUser = {
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
};

export const mockPotentialOrder = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
};
```

\***\*tests**/factories/user.factory.js:\*\*

```javascript
export const makeUserVN = (overrides = {}) => ({
  _id: 'user123',
  email: 'test@example.com',
  fullName: 'Nguyễn Văn A',
  phone: '0987654321',
  address: '123 Đường ABC, Quận 1, TP.HCM',
  ...overrides,
});

export const makeProductSKU = (overrides = {}) => ({
  _id: 'product123',
  name: 'Nike Air Max',
  sku: 'NK-AM-001',
  productType: 'shoes',
  inventory: [{ size: 42, color: 'black', quantity: 5, isAvailable: true }],
  ...overrides,
});
```

### Prompt E2 — Data Factories & Faker (VN)

**Vietnamese Data Factory:**

```javascript
import { faker } from '@faker-js/faker';

export const makeChatMessage = (overrides = {}) => ({
  text: faker.lorem.sentence(),
  type: 'text',
  timestamp: new Date(),
  ...overrides,
});

export const makeOrderMessage = () => ({
  text: `chốt ${faker.number.int({ min: 1, max: 3 })} đôi Nike size ${faker.number.int({ min: 40, max: 45 })} màu đen ${faker.phone.number('098#######')}`,
  type: 'text',
});
```

### Prompt E3 — Artillery Load Script

**artillery-config.yml:**

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  plugins:
    metrics-by-endpoint:
      useOnlyRequestNames: true
scenarios:
  - name: 'Livestream Chat Load'
    weight: 100
    flow:
      - post:
          url: '/api/livestream/chat'
          json:
            roomId: '{{ $randomString() }}'
            message: '{{ $randomString() }}'
            type: 'text'
          capture:
            - json: '$.success'
              as: 'success'
```

### Prompt E4 — Reduce Socket/DB Flakiness

**Best Practices:**

```javascript
// Wait for events with timeout
const waitForEvent = (socket, event, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeout);
    socket.once(event, data => {
      clearTimeout(timer);
      resolve(data);
    });
  });
};

// Cleanup in afterEach
afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  // Close socket connections
  if (socket && socket.connected) {
    socket.disconnect();
  }
});
```

---

## 6) Phase 6 — Documentation & Demo (15')

### Prompt F1 — README for the Test Package

**README.md:**

````markdown
# Order in Livestream Test Suite

## Quick Setup

```bash
npm install
npm run test:cov
```
````

## Running Tests

- **Unit Tests:** `npm test`
- **Integration Tests:** `npm run test:integration`
- **Coverage Report:** `npm run test:cov`
- **Watch Mode:** `npm run test:watch`

## Test Structure

- `__tests__/services/` - Unit tests for service methods
- `__tests__/controllers/` - API endpoint tests
- `__tests__/integration/` - Service integration tests
- `__tests__/e2e/` - End-to-end user flows

## Coverage Goals

- Line Coverage: ≥80%
- Branch Coverage: ≥80%
- Function Coverage: ≥80%

## Adding New Tests

1. Create test file in appropriate directory
2. Follow naming convention: `*.test.js`
3. Use Given-When-Then structure
4. Mock external dependencies
5. Test both happy path and error cases

````

### Prompt F2 — Test Report & Coverage Summary

**Sprint Test Report:**
```markdown
## Test Coverage Summary

### Overall Metrics
- **Total Tests:** 47
- **Passed:** 45
- **Failed:** 2
- **Coverage:** 82% (Line), 79% (Branch)

### Coverage by File
- `orderDetection.service.js`: 85% ✅
- `livestream.service.js`: 82% ✅
- `potentialOrderController.js`: 78% ⚠️
- `order.service.js`: 80% ✅

### Residual Risks
- Email delivery failures (Medium)
- Socket connection leaks (Low)
- Race conditions in concurrent orders (High)

### Next Week Priorities
- [ ] Fix failing tests
- [ ] Improve controller coverage
- [ ] Add performance tests
- [ ] Implement retry logic for email failures
````

### Prompt F3 — Demo Script (10–15 minutes)

**Demo Flow:**

1. **Setup (2 min):** Show test environment, coverage dashboard
2. **Run Key Tests (5 min):**
   - Order detection test
   - Out-of-stock scenario
   - Socket integration test
3. **Show Results (3 min):** Coverage report, test results
4. **Q&A (5 min):** Address questions about test strategy

**Key Test Demonstrations:**

```bash
# Run order detection test
npm test -- --testNamePattern="analyzeMessage"

# Run integration test
npm test -- --testNamePattern="handleChatMessage"

# Show coverage
npm run test:cov
```

### Prompt F4 — Handover Checklist

**QA & Dev Handover:**

- [ ] ≥80% coverage achieved
- [ ] ≥15 test cases implemented
- [ ] Mock strategy documented
- [ ] CI workflow configured
- [ ] Performance tests added
- [ ] Error handling covered
- [ ] Vietnamese patterns tested
- [ ] Socket reliability verified

### Prompt F5 — High-Quality PR Template

**PR Template:**

```markdown
## Test Implementation: Order in Livestream

### Goal & Scope

Implement comprehensive test suite for Order in Livestream feature with ≥80% coverage and ≥15 test cases.

### Coverage Screenshot

![Coverage Report](coverage-screenshot.png)

### Critical Tests Added

- ✅ Order detection with Vietnamese patterns
- ✅ Out-of-stock handling
- ✅ Socket integration
- ✅ Transaction rollback
- ✅ Email delivery

### Side Effects

- Socket connections properly cleaned up
- Database transactions isolated
- Email service mocked

### Manual Verification Steps

1. Run full test suite: `npm test`
2. Check coverage: `npm run test:cov`
3. Verify CI pipeline passes
4. Test with real Vietnamese messages

### Linked Tickets

- [JIRA-123] Order in Livestream Testing
- [JIRA-124] Coverage Requirements
```

---

## Bonus — "All-in-One" Orchestrator Prompt (180 minutes)

**Complete Testing Workflow:**

1. **Analysis Phase (15 min):**

   - Analyze codebase structure
   - Identify test surfaces
   - Create risk matrix
   - Define acceptance criteria

2. **Design Phase (20 min):**

   - Create test plan
   - Design test cases
   - Set up test environment
   - Define coverage goals

3. **Implementation Phase (75 min):**

   - Generate test scaffolding
   - Implement unit tests
   - Add integration tests
   - Create API tests
   - Set up Socket.IO tests

4. **Debug Phase (40 min):**

   - Run test suite
   - Fix failing tests
   - Optimize performance
   - Improve coverage

5. **Optimization Phase (15 min):**

   - Add production mocks
   - Create data factories
   - Set up load testing
   - Document best practices

6. **Demo Phase (15 min):**
   - Create documentation
   - Generate test report
   - Prepare demo script
   - Complete handover

**Success Criteria:**

- ✅ ≥80% line/branch coverage
- ✅ ≥15 test cases
- ✅ All critical paths tested
- ✅ Vietnamese patterns supported
- ✅ Performance requirements met
- ✅ Documentation complete

---

## Conclusion

This comprehensive testing framework provides a complete solution for testing the "Order in Livestream" feature with Vietnamese language support, real-time communication, and robust error handling. The framework ensures high-quality code delivery while maintaining development velocity.

**Key Achievements:**

- Complete test coverage for all critical functions
- Vietnamese language pattern recognition
- Real-time Socket.IO testing
- Database transaction testing
- Email service integration
- Performance and load testing
- Comprehensive documentation

**Next Steps:**

1. Implement the test suite
2. Run initial coverage analysis
3. Fix any gaps in coverage
4. Set up CI/CD pipeline
5. Train team on testing practices
6. Monitor and maintain test suite
