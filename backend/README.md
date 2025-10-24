# Kicks Shoes Backend - Testing Guide

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Specific Test Suite

```bash
# Suite 1: Message Analysis & Order Detection
npm test tests/orderDetection.analyze.spec.js

# Suite 2: Product Information Extraction
npm test tests/orderDetection.extract.spec.js

# Suite 3: Chat Message Handling
npm test tests/chat-message-handling.test.js

# Suite 4: Potential Order Management
npm test tests/potential-order-management.test.js

# Suite 5: Order Auto-Creation
npm test tests/order-auto-creation.test.js

# Suite 4: Livestream Socket Handlers
npm test tests/livestream-socket.test.js
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Tests with Specific Timeout

```bash
npm test -- --testTimeout=20000
```

## Test Coverage

View coverage report after running tests with `--coverage`:

```bash
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

## Test Structure

```
tests/
├── _helpers/
│   └── testUtils.js           # Shared test utilities
├── mocks/
│   ├── productService.mock.js # Product service mocks
│   └── sanitize.mock.js       # Sanitization mocks
├── setup.js                   # Global test setup
├── orderDetection.analyze.spec.js
├── orderDetection.extract.spec.js
├── chat-message-handling.test.js
├── potential-order-management.test.js
└── livestream-socket.test.js
```

## Test Database

Tests use a separate MongoDB instance:

- Default: `mongodb://localhost:27017/kicks-shoes-test`
- Set via environment variable: `MONGODB_URI`

## Coverage Goals

- Statements: ≥80%
- Branches: ≥80%
- Functions: ≥80%
- Lines: ≥80%

## Current Coverage

| File                        | Statements | Branches | Functions | Lines  |
| --------------------------- | ---------- | -------- | --------- | ------ |
| livestream.service.js       | 94.55%     | 83.33%   | 93.33%    | 94.52% |
| livestreamSocket.service.js | 93.04%     | 84.61%   | 94.11%    | 92.92% |
| orderDetection.service.js   | 48.12%     | 33.83%   | 64.28%    | 50%    |

## Test Suites

### Suite 1: Message Analysis & Order Detection (15 tests)

Tests for `orderDetectionService.analyzeMessage()`:

- Phone number detection
- Order keyword detection
- Confidence scoring
- Database operations

### Suite 2: Product Information Extraction

Tests for `orderDetectionService.extractProductInfo()`:

- SKU matching
- Size/color extraction
- Quantity parsing

### Suite 3: Chat Message Handling (44 tests)

Tests for `liveStreamService.handleChatMessage()`:

- Real-time chat broadcasting
- Order detection integration
- Error handling
- Performance testing

### Suite 4: Potential Order Management (10 tests)

Tests for `potentialOrderController` operations:

- CRUD operations (TC-401 to TC-410)
- Filtering & pagination
- Authorization checks
- Statistics aggregation

### Suite 5: Order Auto-Creation (15 tests)

Tests for `updateOrderStatus()` with status = "confirmed":

- Order creation from potential orders
- Flash sale price application
- Inventory checks and out-of-stock handling
- Email notifications
- Error handling and rollback scenarios
- Authorization and security checks

# Suite 6: Livestream Socket Handlers (27 tests)

Tests for Socket.IO integration:

- Join/leave events
- WebRTC signaling
- Message broadcasting
- Error handling

## Writing New Tests

### Test Naming Convention

```javascript
test('TC-XXX | Brief description of what is being tested', () => {
  // Given: Setup preconditions
  // When: Execute action
  // Then: Assert expected results
});
```

### Using Test Helpers

```javascript
const { makeMessage, makeStream, makeUser, makePotentialOrder } = require('./_helpers/testUtils');

const testMessage = makeMessage('Chốt đơn giày', {
  type: 'text',
  senderId: userId,
});
```

## Troubleshooting

### MongoDB Connection Issues

Ensure MongoDB is running:

```bash
# macOS/Linux
sudo systemctl status mongod

# Windows
sc query MongoDB
```

### Test Timeout Errors

Increase timeout for slow tests:

```javascript
test('slow test', async () => {
  // test code
}, 30000); // 30 second timeout
```

### Mock Issues

Clear mocks between tests:

```javascript
afterEach(() => {
  jest.clearAllMocks();
});
```
