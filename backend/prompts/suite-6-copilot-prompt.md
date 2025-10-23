# Prompt for Copilot: Test Suite 6 - Edge Cases & Error Handling

## 🎯 **ROLE & CONTEXT**

You are a Senior Test Engineer working on the "Order in Livestream" feature. Your task is to implement comprehensive unit tests for **Suite 6: Edge Cases & Error Handling** with 80-100% code coverage.

## 📋 **TEST SUITE REQUIREMENTS**

### **Suite 6 Focus:**

- **Boundary values, null/undefined, exceptions**
- **Database errors, concurrent operations, invalid inputs**
- **15 test cases** (TC-601 to TC-615)
- **Type**: Unit Tests (mocked dependencies, no integration)

### **Coverage Target:**

- **80-100% code coverage**
- **Fast execution** (< 1s per test)
- **Isolated testing** (each function tested separately)

## 🎯 **TEST CASES TO IMPLEMENT**

### **Edge Cases (TC-601 to TC-609)**

```javascript
// TC-601: Null/undefined message content
// TC-602: Empty string message
// TC-603: Message length > 500 chars
// TC-604: Unicode characters (emoji, Vietnamese)
// TC-605: Phone number với spaces/dots/dashes
// TC-606: Size "ONESIZE" cho accessories
// TC-607: Color pattern matching (Vietnamese)
// TC-608: Quantity extraction với các format khác nhau
// TC-609: Composite SKU + size + color pattern
```

### **Error Handling (TC-610 to TC-613)**

```javascript
// TC-610: MongoDB duplicate key error
// TC-611: MongooseError khi invalid ObjectId
// TC-612: Network timeout khi query Product
// TC-613: Logger failure không crash app
```

### **Concurrent Operations (TC-614 to TC-615)**

```javascript
// TC-614: 2 hosts confirm cùng 1 PotentialOrder
// TC-615: Race conditions với inventory
```

## 📁 **FILES TO TEST**

### **Primary Files (High Priority)**

```javascript
// Services
-src / services / orderDetection.service.js(95 % +coverage) -
  src / services / order.service.js(85 % +coverage) -
  src / services / email.service.js(90 % +coverage) -
  // Controllers
  src / controllers / potentialOrderController.js(90 % +coverage) -
  src / controllers / orderController.js(85 % +coverage) -
  // Middlewares
  src / middlewares / error.middleware.js(100 % coverage) -
  // Models
  src / models / PotentialOrder.js(90 % +coverage) -
  src / models / Product.js(85 % +coverage) -
  src / models / LiveStreamChat.js(90 % +coverage) -
  // Utils
  src / utils / logger.js(95 % +coverage) -
  src / utils / validation.js(90 % +coverage);
```

## 🛠️ **IMPLEMENTATION REQUIREMENTS**

### **Test File Structure:**

```javascript
// File: backend/tests/suite-6-edge-cases-error-handling.test.js

describe('Order in Livestream — Suite 6: Edge Cases & Error Handling', () => {
  // Setup mocks for all dependencies
  // Implement 15 test cases (TC-601 to TC-615)
  // Use Given-When-Then structure
  // Mock all external dependencies
  // Test edge cases and error scenarios
});
```

### **Mocking Strategy:**

```javascript
// Mock all external dependencies
- Database connections (MongoDB)
- Email services
- Logger functions
- Network requests
- File system operations
- External APIs
```

### **Test Data Requirements:**

```javascript
// Vietnamese test data
- Phone numbers: "0912345678", "0912 345 678", "0912.345.678"
- Product SKUs: "HJ6777", "NK001", "AD123"
- Colors: "đen", "đỏ", "xanh navy", "xanh dương"
- Sizes: "42", "43", "ONESIZE"
- Quantities: "2 đôi", "3 cái", "mua 5"
- Unicode: "Chốt đơn 😍🔥 size 42 sđt 0912345678"
```

## 🎯 **SPECIFIC TEST SCENARIOS**

### **Edge Case Testing:**

```javascript
// TC-601: Test null/undefined message content
test('TC-601: Verify null/undefined message content', async () => {
  // Given: handleChatMessage() called với null text
  // When: Send message với text = null
  // Then: Return validation error, no DB write
});

// TC-604: Test Unicode characters
test('TC-604: Verify Unicode characters trong message', async () => {
  // Given: Message có emoji, Vietnamese chars
  // When: Send "Chốt đơn 😍 0912345678"
  // Then: Unicode chars preserved, order detection works
});
```

### **Error Handling Testing:**

```javascript
// TC-610: Test MongoDB duplicate key error
test('TC-610: Verify MongoDB duplicate key error', async () => {
  // Given: Try to save duplicate PotentialOrder
  // When: Save same chatMessageId twice
  // Then: Error caught, log error, don't crash
});

// TC-613: Test Logger failure
test('TC-613: Verify Logger failure không crash app', async () => {
  // Given: Logger.error() throws exception
  // When: Trigger any error that logs
  // Then: App doesn't crash, error silently ignored
});
```

### **Concurrent Operations Testing:**

```javascript
// TC-614: Test 2 hosts confirm cùng 1 PotentialOrder
test('TC-614: Verify 2 hosts confirm cùng 1 PotentialOrder', async () => {
  // Given: Race condition scenario
  // When: Host A confirms order, Host B confirms same order 1ms later
  // Then: Only 1 Order created, second call returns error
});
```

## 📊 **COVERAGE REQUIREMENTS**

### **Coverage Targets:**

```javascript
// Critical files (95%+ coverage)
-orderDetection.service.js -
  error.middleware.js -
  logger.js -
  // Important files (90%+ coverage)
  potentialOrderController.js -
  email.service.js -
  PotentialOrder.js -
  LiveStreamChat.js -
  validation.js -
  // Standard files (85%+ coverage)
  order.service.js -
  orderController.js -
  Product.js;
```

### **Coverage Metrics:**

- **Line Coverage**: 80%+
- **Branch Coverage**: 85%+
- **Function Coverage**: 90%+
- **Statement Coverage**: 80%+

## 🚀 **EXECUTION INSTRUCTIONS**

### **Test Execution:**

```bash
# Run Suite 6 tests
npm test -- tests/suite-6-edge-cases-error-handling.test.js

# Run with coverage
npm test -- --coverage tests/suite-6-edge-cases-error-handling.test.js

# Run specific test case
npm test -- --testNamePattern="TC-601" tests/suite-6-edge-cases-error-handling.test.js
```

### **Expected Results:**

- **15 test cases** all passing
- **80-100% code coverage** achieved
- **Fast execution** (< 1s per test)
- **No flaky tests** (deterministic results)

## 📝 **DELIVERABLES**

### **Required Files:**

1. `backend/tests/suite-6-edge-cases-error-handling.test.js` - Main test file
2. `backend/tests/_helpers/edgeCaseUtils.js` - Helper functions
3. `backend/tests/mocks/errorMocks.js` - Error simulation mocks
4. `backend/coverage/index.html` - Coverage report

### **Test Quality Standards:**

- **Given-When-Then** structure in each test
- **Descriptive test names** with TC-XXX prefixes
- **Comprehensive assertions** for each scenario
- **Proper error simulation** and handling
- **Vietnamese test data** for realistic scenarios

## 🎯 **SUCCESS CRITERIA**

### **Functional Requirements:**

- ✅ All 15 test cases implemented and passing
- ✅ Edge cases properly tested (null, undefined, Unicode, etc.)
- ✅ Error handling scenarios covered
- ✅ Concurrent operations tested
- ✅ Vietnamese language support verified

### **Technical Requirements:**

- ✅ 80-100% code coverage achieved
- ✅ Fast execution (< 1s per test)
- ✅ No external dependencies (all mocked)
- ✅ Deterministic test results
- ✅ Proper error simulation

### **Quality Requirements:**

- ✅ Clear, maintainable test code
- ✅ Comprehensive test data
- ✅ Proper mocking strategy
- ✅ Edge case coverage
- ✅ Error scenario coverage

---

**Note**: This is a **UNIT TEST** suite focusing on edge cases and error handling. All external dependencies must be mocked. No integration testing required.
