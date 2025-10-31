# Universal Mock Generator Prompt - Rationale Analysis

## **1. Main Purpose of the Prompt**

### **Why is This Prompt Needed?**

- **Mock Complexity**: Creating mocks is complex and time-consuming
- **Test Isolation**: Mocks are needed for test isolation
- **Data Consistency**: Realistic data is needed for testing
- **Quality Assurance**: Ensure mocks are high quality

### **Problems This Prompt Solves:**

- **Manual Mock Creation**: Manual mock creation is time-consuming
- **Inconsistent Mock Structure**: Each developer creates mocks differently
- **Poor Mock Quality**: Mocks are not realistic or complete
- **Missing Test Data**: Lack of realistic test data
- **Mock Maintenance**: Difficult to maintain and update mocks

## **2. How is the Feature Context Structure Designed?**

### **Feature Name**

- **Purpose**: Identifies the context of the feature being tested
- **Usage**: Used for naming files and mock descriptions
- **Why needed**: Ensures mocks have clear context

### **Feature Description**

- **Purpose**: Detailed feature description
- **Usage**: Understand business logic to create appropriate mocks
- **Why needed**: Mocks must reflect actual feature behavior

### **Feature Domain**

- **Purpose**: Classify features by domain
- **Values**: E-commerce, User Management, Content Management, Analytics
- **Why needed**: Each domain has different mock patterns

## **3. Your Tasks - Why are 3 Types of Dependencies Needed?**

### **Core Service Dependencies**

- **Purpose**: Mock internal services of the feature
- **Examples**: `[SERVICE_NAME].service.[METHOD_NAME](params)`
- **Why needed**: Core business logic needs to be mocked

### **Integration Dependencies**

- **Purpose**: Mock external services and APIs
- **Examples**: `[EXTERNAL_SERVICE].service.[METHOD_NAME](params)`
- **Why needed**: External dependencies need to be mocked for test isolation

### **Database Dependencies**

- **Purpose**: Mock database operations
- **Examples**: `[MODEL_NAME].findById(id)`, `[MODEL_NAME].create(data)`
- **Why needed**: Database operations need to be mocked for test isolation

## **4. Mock Requirements - Detailed Rationale**

### **Data Standards**

#### **Vietnamese Test Data**

- **Rationale**: App is used in Vietnam, needs Vietnamese data
- **Benefits**: Detect bugs related to localization
- **Examples**: Vietnamese names, addresses, phone numbers

#### **Proper Setup & Teardown**

- **beforeAll**: Setup mocks once for all tests
- **beforeEach**: Reset mocks before each test
- **afterEach**: Cleanup after each test
- **afterAll**: Final cleanup
- **Why needed**: Ensures test isolation and consistency

#### **Happy Path & Error Simulation**

- **Happy path**: Normal successful operations
- **Error simulation**: Service failures, validation errors, network issues
- **Why needed**: Test both success and error scenarios

### **Mock Interface Standards**

#### **Default Mock Return Values**

- **Purpose**: Standard behavior for mocks
- **Benefits**: Consistent mock behavior
- **Why needed**: Predictable test behavior

#### **Override Methods**

- **`__set`**: Override mock implementation
- **`__reset`**: Reset mock to default state
- **`__throw`**: Simulate errors
- **`__clear`**: Clear mock state
- **Why needed**: Flexible mock control

#### **Multiple Scenarios Support**

- **Purpose**: Support different test scenarios
- **Benefits**: Comprehensive test coverage
- **Why needed**: Test various conditions

#### **State Management**

- **Purpose**: Manage complex mock state
- **Benefits**: Realistic mock behavior
- **Why needed**: Complex mocks need state management

#### **Sync/Async Support**

- **Purpose**: Support both operation types
- **Benefits**: Complete mock coverage
- **Why needed**: Modern JavaScript patterns

## **5. Expected Output - Why are 3 File Types Needed?**

### **1. Individual Mock Files**

- **Path**: `[feature-name]-[service-name].mock.js`
- **Purpose**: Separate mock files for each service
- **Benefits**: Organized, maintainable, reusable
- **Why needed**: Easy to maintain and reuse mocks

### **2. Shared Test Utilities**

- **Path**: `[feature-name]TestUtils.js`
- **Purpose**: Reusable helper functions
- **Functions**: `make[Entity]()`, `mock[Service]()`, `resetAllMocks()`, `mockDate()`, `mockEnvironment()`
- **Why needed**: DRY principle, centralized utilities

### **3. Sample Test Integration**

- **Purpose**: Demonstrate mock usage
- **Content**: Sample test code, integration examples, best practices
- **Why needed**: Clear guidance for implementation

## **6. Feature-Specific Mock Templates - Detailed Rationale**

### **E-commerce Features**

#### **Product Service Mock**

```javascript
const productServiceMock = {
  findById: jest.fn(),
  findBySku: jest.fn(),
  findByCategory: jest.fn(),
  updateStock: jest.fn(),
  getPrice: jest.fn(),
  // ... standard mock methods
};
```

- **Rationale**: E-commerce has product management logic
- **Methods**: Product-related operations
- **Why needed**: Domain-specific mock interface

#### **Order Service Mock**

```javascript
const orderServiceMock = {
  createOrder: jest.fn(),
  updateOrder: jest.fn(),
  cancelOrder: jest.fn(),
  getOrderById: jest.fn(),
  getOrdersByUser: jest.fn(),
  // ... standard mock methods
};
```

- **Rationale**: Order processing is core to e-commerce
- **Methods**: Order-related operations
- **Why needed**: Order workflow testing

#### **Payment Service Mock**

```javascript
const paymentServiceMock = {
  processPayment: jest.fn(),
  refundPayment: jest.fn(),
  getPaymentStatus: jest.fn(),
  validatePayment: jest.fn(),
  // ... standard mock methods
};
```

- **Rationale**: Payment processing needs mocking for test isolation
- **Methods**: Payment-related operations
- **Why needed**: Payment flow testing

### **User Management Features**

#### **Auth Service Mock**

```javascript
const authServiceMock = {
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  validateToken: jest.fn(),
  refreshToken: jest.fn(),
  // ... standard mock methods
};
```

- **Rationale**: Authentication is core to user management
- **Methods**: Auth-related operations
- **Why needed**: Auth flow testing

#### **User Service Mock**

```javascript
const userServiceMock = {
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  changePassword: jest.fn(),
  updateProfile: jest.fn(),
  // ... standard mock methods
};
```

- **Rationale**: User data management
- **Methods**: User-related operations
- **Why needed**: User management testing

#### **Permission Service Mock**

```javascript
const permissionServiceMock = {
  checkPermission: jest.fn(),
  assignRole: jest.fn(),
  revokeRole: jest.fn(),
  getUserRoles: jest.fn(),
  // ... standard mock methods
};
```

- **Rationale**: Authorization and permission management
- **Methods**: Permission-related operations
- **Why needed**: Authorization testing

### **Content Management Features**

#### **Content Service Mock**

```javascript
const contentServiceMock = {
  createContent: jest.fn(),
  updateContent: jest.fn(),
  deleteContent: jest.fn(),
  publishContent: jest.fn(),
  getContentById: jest.fn(),
  // ... standard mock methods
};
```

- **Rationale**: Content CRUD operations
- **Methods**: Content-related operations
- **Why needed**: Content management testing

#### **File Upload Service Mock**

```javascript
const uploadServiceMock = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getFileUrl: jest.fn(),
  validateFile: jest.fn(),
  // ... standard mock methods
};
```

- **Rationale**: File handling operations
- **Methods**: File-related operations
- **Why needed**: File upload testing

#### **Media Processing Service Mock**

```javascript
const mediaServiceMock = {
  processImage: jest.fn(),
  resizeImage: jest.fn(),
  generateThumbnail: jest.fn(),
  optimizeImage: jest.fn(),
  // ... standard mock methods
};
```

- **Rationale**: Media processing operations
- **Methods**: Media-related operations
- **Why needed**: Media processing testing

## **7. Vietnamese Test Data Standards - Detailed Rationale**

### **User Data**

```javascript
const userTestData = {
  valid: {
    id: 'user_123',
    name: 'Nguyễn Văn A',
    email: 'test@example.com',
    phone: '0912345678',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    role: 'customer',
  },
};
```

- **Rationale**: App is used in Vietnam
- **Benefits**: Realistic testing with local context
- **Why needed**: Detect bugs related to localization

### **Product Data (E-commerce)**

```javascript
const productTestData = {
  valid: {
    id: 'prod_123',
    name: 'Giày thể thao Nike Air Max',
    sku: 'NK-AM-001',
    price: 2500000,
    currency: 'VND',
    category: 'Giày thể thao',
    brand: 'Nike',
    sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44'],
    colors: ['đen', 'trắng', 'xanh', 'đỏ'],
  },
};
```

- **Rationale**: E-commerce context with Vietnamese products
- **Benefits**: Realistic product data
- **Why needed**: Test with real-world data

### **Order Data (E-commerce)**

```javascript
const orderTestData = {
  valid: {
    id: 'order_123',
    userId: 'user_123',
    items: [
      /* order items */
    ],
    total: 5000000,
    currency: 'VND',
    status: 'pending',
    shippingAddress: '123 Đường ABC, Quận 1, TP.HCM',
  },
};
```

- **Rationale**: Order processing with Vietnamese context
- **Benefits**: Realistic order data
- **Why needed**: Order flow testing

### **Content Data (Content Management)**

```javascript
const contentTestData = {
  valid: {
    id: 'content_123',
    title: 'Hướng dẫn chọn giày thể thao phù hợp',
    content: 'Khi chọn giày thể thao, bạn cần chú ý đến...',
    category: 'Hướng dẫn',
    status: 'published',
    authorId: 'user_123',
    tags: ['giày thể thao', 'hướng dẫn', 'thể thao'],
  },
};
```

- **Rationale**: Content management with Vietnamese content
- **Benefits**: Realistic content data
- **Why needed**: Content management testing

## **8. Mock Scenarios per Service - Detailed Rationale**

### **3 Scenarios Design**

#### **1. Successful Response**

```javascript
mockService.method.mockResolvedValue({
  success: true,
  data: expectedData,
  message: 'Operation successful',
});
```

- **Purpose**: Test happy path scenarios
- **Benefits**: Verify normal operation flow
- **Why needed**: Ensure normal operations work

#### **2. Edge Case Response**

```javascript
mockService.method.mockResolvedValue({
  success: true,
  data: null, // or empty array/object
  message: 'No data found',
});
```

- **Purpose**: Test edge cases and boundary conditions
- **Benefits**: Verify edge case handling
- **Why needed**: Test boundary conditions

#### **3. Error Simulation**

```javascript
mockService.method.mockRejectedValue(new Error('Service unavailable'));
// or
mockService.method.mockResolvedValue({
  success: false,
  error: 'Validation failed',
  message: 'Invalid input data',
});
```

- **Purpose**: Test error scenarios
- **Benefits**: Verify error handling
- **Why needed**: Test error conditions

## **9. Test Utilities Template - Detailed Rationale**

### **Data Factory Functions**

```javascript
static makeUser(overrides = {}) {
  return {
    id: "user_" + Math.random().toString(36).substr(2, 9),
    name: "Nguyễn Văn A",
    email: "test@example.com",
    phone: "0912345678",
    ...overrides
  };
}
```

- **Purpose**: Generate test data with defaults
- **Benefits**: DRY principle, consistent data
- **Why needed**: Easy to create test data

### **Service Mock Setup**

```javascript
static mock[Service]() {
  // Setup service mock
}
```

- **Purpose**: Standardized mock setup
- **Benefits**: Consistent mock configuration
- **Why needed**: Easy to setup mocks

### **Global Mock Reset**

```javascript
static resetAllMocks() {
  jest.clearAllMocks();
  jest.restoreAllMocks();
}
```

- **Purpose**: Reset all mocks globally
- **Benefits**: Clean test environment
- **Why needed**: Test isolation

### **Date Mocking**

```javascript
static mockDate(timestamp) {
  const mockDate = new Date(timestamp);
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  return mockDate;
}
```

- **Purpose**: Mock date/time for testing
- **Benefits**: Deterministic time-based tests
- **Why needed**: Time-sensitive testing

### **Environment Mocking**

```javascript
static mockEnvironment(env) {
  Object.keys(env).forEach(key => {
    process.env[key] = env[key];
  });
}
```

- **Purpose**: Mock environment variables
- **Benefits**: Test different configurations
- **Why needed**: Configuration testing

## **10. Sample Test Integration - Detailed Rationale**

### **Test Structure**

```javascript
describe('[FEATURE_NAME] - Sample Test', () => {
  let mockService;
  let testUtils;

  beforeAll(() => {
    mockService = require('./mocks/[service-name].mock');
    testUtils = require('./_helpers/[feature-name]TestUtils');
  });

  beforeEach(() => {
    testUtils.resetAllMocks();
  });
  // ... test cases
});
```

- **Purpose**: Demonstrate proper test setup
- **Benefits**: Clear example for implementation
- **Why needed**: Best practices guidance

### **Happy Path Test**

```javascript
test('should handle successful operation', async () => {
  // Given
  const testData = testUtils.makeUser();
  mockService.getUserById.mockResolvedValue({
    success: true,
    data: testData,
  });

  // When
  const result = await serviceUnderTest.getUser(testData.id);

  // Then
  expect(result).toEqual(testData);
  expect(mockService.getUserById).toHaveBeenCalledWith(testData.id);
});
```

- **Purpose**: Demonstrate happy path testing
- **Benefits**: Clear test structure
- **Why needed**: Happy path testing example

### **Error Case Test**

```javascript
test('should handle error case', async () => {
  // Given
  const error = new Error('User not found');
  mockService.getUserById.mockRejectedValue(error);

  // When & Then
  await expect(serviceUnderTest.getUser('invalid_id')).rejects.toThrow('User not found');
});
```

- **Purpose**: Demonstrate error case testing
- **Benefits**: Clear error testing structure
- **Why needed**: Error handling testing example

## **11. Best Practices - Detailed Rationale**

### **Mock Design**

#### **In-memory Maps**

- **Purpose**: Deterministic state management
- **Benefits**: Predictable test behavior
- **Why needed**: Test isolation and consistency

#### **State Reset**

- **Purpose**: Clean state between tests
- **Benefits**: Test independence
- **Why needed**: Avoid test interference

#### **Realistic Data**

- **Purpose**: Test with real-world scenarios
- **Benefits**: Better bug detection
- **Why needed**: Quality testing

#### **Sync/Async Support**

- **Purpose**: Support both operation types
- **Benefits**: Comprehensive mock coverage
- **Why needed**: Modern JavaScript patterns

#### **Error Simulation**

- **Purpose**: Test error scenarios
- **Benefits**: Complete error testing
- **Why needed**: Error handling testing

### **Mock Management**

#### **Naming Conventions**

- **Purpose**: Consistent naming patterns
- **Benefits**: Easy to find and maintain
- **Why needed**: Code organization

#### **Setup/Teardown Patterns**

- **Purpose**: Proper lifecycle management
- **Benefits**: Clean test environment
- **Why needed**: Test isolation

#### **State Isolation**

- **Purpose**: Independent tests
- **Benefits**: Reliable test execution
- **Why needed**: Test reliability

#### **Error Simulation Capabilities**

- **Purpose**: Comprehensive error testing
- **Benefits**: Complete error coverage
- **Why needed**: Error handling testing

#### **Performance Considerations**

- **Purpose**: Efficient mock execution
- **Benefits**: Fast test execution
- **Why needed**: Test performance

### **Test Data Quality**

#### **Realistic Vietnamese Data**

- **Purpose**: Localized testing
- **Benefits**: Better bug detection
- **Why needed**: Vietnamese context

#### **Proper Currency Formatting**

- **Purpose**: VND formatting
- **Benefits**: Realistic financial data
- **Why needed**: E-commerce context

#### **Edge Case Data**

- **Purpose**: Boundary condition testing
- **Benefits**: Complete test coverage
- **Why needed**: Edge case testing

#### **Data Consistency**

- **Purpose**: Consistent data across mocks
- **Benefits**: Predictable test behavior
- **Why needed**: Test reliability

## **12. Usage Instructions - Detailed Rationale**

### **Step 1: Replace Placeholders**

- **Feature Name**: Actual feature name
- **Feature Description**: Feature description
- **Feature Domain**: Feature domain classification
- **Why needed**: Context for mock generation

### **Step 2: List Dependencies**

- **Core Service Methods**: Internal service methods
- **External API Calls**: External service calls
- **Database Operations**: Database operations
- **File System Operations**: File operations
- **Why needed**: Targeted mock generation

### **Step 3: Choose Template**

- **E-commerce**: Product, Order, Payment mocks
- **User Management**: Auth, User, Permission mocks
- **Content Management**: Content, Upload, Media mocks
- **Why needed**: Domain-specific customization

### **Step 4: Customize Test Data**

- **Feature Requirements**: Specific data needs
- **Why needed**: Relevant test data

### **Step 5: Generate Mocks**

- **Comprehensive Mocks**: Complete mock files
- **Vietnamese Data**: Localized test data
- **Error Handling**: Complete error scenarios
- **Why needed**: Ready-to-use mocks

## **13. Rationale Summary**

### **Core Principles**

1. **Mock Quality**: High-quality, realistic mocks
2. **Test Isolation**: Proper test isolation
3. **Data Consistency**: Consistent, realistic test data
4. **Maintainability**: Easy to maintain and update
5. **Scalability**: Can be applied to any feature
6. **Best Practices**: Follow mocking best practices
7. **Vietnamese Context**: Localized testing
8. **Comprehensive Coverage**: Complete mock coverage

### **Key Benefits**

- **Time Saving**: Reduce time creating mocks
- **Quality Improvement**: Higher mock quality
- **Test Isolation**: Proper test isolation
- **Realistic Testing**: Use realistic data
- **Maintainability**: Easy to maintain and update
- **Team Productivity**: Increase team efficiency
- **Code Confidence**: Higher confidence in tests

### **Technical Excellence**

- **Jest Best Practices**: Use Jest correctly
- **Mock Strategy**: Comprehensive mocking approach
- **Vietnamese Data**: Realistic, localized test data
- **Error Handling**: Complete error scenario coverage
- **Test Isolation**: Proper test isolation
- **Performance**: Efficient mock execution

### **Business Value**

- **Risk Reduction**: Reduce bug risk
- **Quality Assurance**: Ensure test quality
- **Team Efficiency**: Increase team productivity
- **Customer Satisfaction**: Better user experience
- **Cost Reduction**: Reduce bug fix costs

This prompt is designed to create comprehensive, high-quality Jest mocks with Vietnamese test data, helping teams achieve good test isolation and high confidence in testing.
