# Universal Mock Generator Prompt

## Prompt: Generate Comprehensive Jest Mocks

Create high-quality Jest mock objects for all external dependencies used in the **`[FEATURE_NAME]`** feature.

### **Feature Context**

**Feature Name**: `[FEATURE_NAME]`  
**Feature Description**: `[FEATURE_DESCRIPTION]`  
**Feature Domain**: `[FEATURE_DOMAIN]` (e.g., E-commerce, User Management, Content Management, Analytics)

### **Your Tasks**

Generate Jest mock modules for the following dependencies:

#### **Core Service Dependencies**

- `[SERVICE_NAME].service.[METHOD_NAME](params)`
- `[SERVICE_NAME].service.[METHOD_NAME](params)`
- `[SERVICE_NAME].service.[METHOD_NAME](params)`

#### **Integration Dependencies**

- `[EXTERNAL_SERVICE].service.[METHOD_NAME](params)`
- `[API_SERVICE].service.[METHOD_NAME](params)`
- `[NOTIFICATION_SERVICE].service.[METHOD_NAME](params)`

#### **Database Dependencies**

- `[MODEL_NAME].findById(id)`
- `[MODEL_NAME].create(data)`
- `[MODEL_NAME].update(id, data)`
- `[MODEL_NAME].delete(id)`

### **Mock Requirements**

#### **Data Standards**

- Include **realistic Vietnamese test data** appropriate for the feature domain
- Provide **proper mock setup & teardown** (beforeAll, beforeEach, afterEach, afterAll)
- Ensure mocks support both:
  - **Happy path responses** - Normal successful operations
  - **Error/exception simulation** - Service failures, validation errors, network issues

#### **Mock Interface Standards**

- Include default mock return values
- Provide methods for overriding (e.g. `__set`, `__reset`, `__throw`, `__clear`)
- Support multiple scenarios per service
- Include state management for complex mocks
- Support both synchronous and asynchronous operations

### **Expected Output**

#### **1. Individual Mock Files**

- Mock files for each service: `[feature-name]-[service-name].mock.js`
- Consistent naming convention and structure
- Complete mock implementation with all required methods

#### **2. Shared Test Utilities**

- `[feature-name]TestUtils.js` with reusable helpers:
  - `make[Entity](overrides)` - Data factory functions
  - `mock[Service]()` - Service mock setup functions
  - `resetAllMocks()` - Global mock reset utility
  - `mockDate(timestamp)` - Date mocking utilities
  - `mockEnvironment(env)` - Environment variable mocking

#### **3. Sample Test Integration**

- Sample test snippet demonstrating mock usage
- Integration examples for different test scenarios
- Best practices for mock management in tests

### **Feature-Specific Mock Templates**

#### **E-commerce Features**

```javascript
// Product Service Mock
const productServiceMock = {
  findById: jest.fn(),
  findBySku: jest.fn(),
  findByCategory: jest.fn(),
  updateStock: jest.fn(),
  getPrice: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __reset: () => {
    /* ... */
  },
  __throw: (method, error) => {
    /* ... */
  },
  __clear: () => {
    /* ... */
  },
};

// Order Service Mock
const orderServiceMock = {
  createOrder: jest.fn(),
  updateOrder: jest.fn(),
  cancelOrder: jest.fn(),
  getOrderById: jest.fn(),
  getOrdersByUser: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __reset: () => {
    /* ... */
  },
  __throw: (method, error) => {
    /* ... */
  },
  __clear: () => {
    /* ... */
  },
};

// Payment Service Mock
const paymentServiceMock = {
  processPayment: jest.fn(),
  refundPayment: jest.fn(),
  getPaymentStatus: jest.fn(),
  validatePayment: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __reset: () => {
    /* ... */
  },
  __throw: (method, error) => {
    /* ... */
  },
  __clear: () => {
    /* ... */
  },
};
```

#### **User Management Features**

```javascript
// Auth Service Mock
const authServiceMock = {
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  validateToken: jest.fn(),
  refreshToken: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __reset: () => {
    /* ... */
  },
  __throw: (method, error) => {
    /* ... */
  },
  __clear: () => {
    /* ... */
  },
};

// User Service Mock
const userServiceMock = {
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  changePassword: jest.fn(),
  updateProfile: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __reset: () => {
    /* ... */
  },
  __throw: (method, error) => {
    /* ... */
  },
  __clear: () => {
    /* ... */
  },
};

// Permission Service Mock
const permissionServiceMock = {
  checkPermission: jest.fn(),
  assignRole: jest.fn(),
  revokeRole: jest.fn(),
  getUserRoles: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __reset: () => {
    /* ... */
  },
  __throw: (method, error) => {
    /* ... */
  },
  __clear: () => {
    /* ... */
  },
};
```

#### **Content Management Features**

```javascript
// Content Service Mock
const contentServiceMock = {
  createContent: jest.fn(),
  updateContent: jest.fn(),
  deleteContent: jest.fn(),
  publishContent: jest.fn(),
  getContentById: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __reset: () => {
    /* ... */
  },
  __throw: (method, error) => {
    /* ... */
  },
  __clear: () => {
    /* ... */
  },
};

// File Upload Service Mock
const uploadServiceMock = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getFileUrl: jest.fn(),
  validateFile: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __reset: () => {
    /* ... */
  },
  __throw: (method, error) => {
    /* ... */
  },
  __clear: () => {
    /* ... */
  },
};

// Media Processing Service Mock
const mediaServiceMock = {
  processImage: jest.fn(),
  resizeImage: jest.fn(),
  generateThumbnail: jest.fn(),
  optimizeImage: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __reset: () => {
    /* ... */
  },
  __throw: (method, error) => {
    /* ... */
  },
  __clear: () => {
    /* ... */
  },
};
```

### **Vietnamese Test Data Standards**

#### **User Data**

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
  admin: {
    id: 'admin_456',
    name: 'Trần Thị B',
    email: 'admin@example.com',
    phone: '0987654321',
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    role: 'admin',
  },
};
```

#### **Product Data (E-commerce)**

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
  outOfStock: {
    id: 'prod_456',
    name: 'Áo thun Adidas',
    sku: 'AD-TS-001',
    price: 500000,
    currency: 'VND',
    stock: 0,
  },
};
```

#### **Order Data (E-commerce)**

```javascript
const orderTestData = {
  valid: {
    id: 'order_123',
    userId: 'user_123',
    items: [
      {
        productId: 'prod_123',
        quantity: 2,
        price: 2500000,
        size: '42',
        color: 'đen',
      },
    ],
    total: 5000000,
    currency: 'VND',
    status: 'pending',
    shippingAddress: '123 Đường ABC, Quận 1, TP.HCM',
  },
};
```

#### **Content Data (Content Management)**

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

### **Mock Scenarios per Service**

Each service mock should provide at least 3 scenarios:

#### **1. Successful Response**

```javascript
// Happy path - normal successful operation
mockService.method.mockResolvedValue({
  success: true,
  data: expectedData,
  message: 'Operation successful',
});
```

#### **2. Edge Case Response**

```javascript
// Edge case - no data found, empty results, boundary conditions
mockService.method.mockResolvedValue({
  success: true,
  data: null, // or empty array/object
  message: 'No data found',
});
```

#### **3. Error Simulation**

```javascript
// Error case - thrown exceptions, rejected promises, service failures
mockService.method.mockRejectedValue(new Error('Service unavailable'));
// or
mockService.method.mockResolvedValue({
  success: false,
  error: 'Validation failed',
  message: 'Invalid input data',
});
```

### **Test Utilities Template**

```javascript
// [feature-name]TestUtils.js
class FeatureTestUtils {
  static makeUser(overrides = {}) {
    return {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      name: 'Nguyễn Văn A',
      email: 'test@example.com',
      phone: '0912345678',
      ...overrides,
    };
  }

  static makeProduct(overrides = {}) {
    return {
      id: 'prod_' + Math.random().toString(36).substr(2, 9),
      name: 'Sản phẩm test',
      sku: 'TEST-' + Math.random().toString(36).substr(2, 6),
      price: 100000,
      currency: 'VND',
      ...overrides,
    };
  }

  static mockDate(timestamp) {
    const mockDate = new Date(timestamp);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    return mockDate;
  }

  static resetAllMocks() {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  }

  static mockEnvironment(env) {
    Object.keys(env).forEach(key => {
      process.env[key] = env[key];
    });
  }
}

module.exports = FeatureTestUtils;
```

### **Sample Test Integration**

```javascript
// Sample test demonstrating mock usage
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

  test('should handle error case', async () => {
    // Given
    const error = new Error('User not found');
    mockService.getUserById.mockRejectedValue(error);

    // When & Then
    await expect(serviceUnderTest.getUser('invalid_id')).rejects.toThrow('User not found');
  });
});
```

### **Best Practices**

#### **Mock Design**

- Use in-memory Maps for deterministic state
- Always reset mock state between tests
- Provide realistic Vietnamese test data
- Support both sync and async operations
- Include proper error simulation

#### **Mock Management**

- Consistent naming conventions
- Proper setup/teardown patterns
- State isolation between tests
- Error simulation capabilities
- Performance considerations

#### **Test Data Quality**

- Use realistic Vietnamese names, addresses, and content
- Include proper currency formatting (VND)
- Provide edge case data (empty, null, boundary values)
- Ensure data consistency across mocks

### **Usage Instructions**

1. **Replace placeholders** with actual feature information:

   - `[FEATURE_NAME]` - Actual feature name
   - `[FEATURE_DESCRIPTION]` - Feature description
   - `[FEATURE_DOMAIN]` - Feature domain (E-commerce, User Management, etc.)

2. **List dependencies** that need mocking:

   - Core service methods
   - External API calls
   - Database operations
   - File system operations

3. **Choose appropriate template** based on feature domain:

   - E-commerce: Product, Order, Payment mocks
   - User Management: Auth, User, Permission mocks
   - Content Management: Content, Upload, Media mocks

4. **Customize test data** for your specific feature requirements

5. **Generate comprehensive mocks** with Vietnamese test data and proper error handling

---

**Output**: Generate only the mock files and test utilities listed above — no extra explanation.
