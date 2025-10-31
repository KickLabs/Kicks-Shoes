# Universal Jest Test Code Generator Prompt

## Prompt: Generate Jest Test Code from Test Case Matrix

Read the Test Case Matrix file and generate runnable Jest test code for **one selected Test Suite** of any feature.

### **Inputs**

- **Feature Name**: `[FEATURE_NAME]`
- **Test matrix file path**: `<ABSOLUTE_PATH_TO_MATRIX_MD>`  
  Example: `D:\Workspace\Kicks-Shoes\backend\prompts\output_phase2.md`
- **Suite heading (exact or case-insensitive match)**: `<SUITE_HEADING>`  
  Example: `Test Suite 3: Chat Message Handling`

### **Your Task**

- Parse the `<SUITE_HEADING>` section from the Test Case Matrix
- For **each test case** under that suite, create **one** corresponding `test()` block in Jest
- Test name must keep the **Test ID prefix**: `TC-xxx | <concise scenario>`
- Use **Given–When–Then** structure as comments inside each test
- Map the correct Subject Under Test based on the suite and feature type

### **Subject Under Test Mapping**

#### **Generic Test Suite Mapping**

| Suite Number | Suite Type          | Subject Under Test Pattern                              |
| ------------ | ------------------- | ------------------------------------------------------- |
| Suite 1      | Core Functionality  | `[SERVICE_NAME].service.[MAIN_METHOD](params)`          |
| Suite 2      | Input Validation    | `[SERVICE_NAME].service.[VALIDATION_METHOD](inputData)` |
| Suite 3      | Service Integration | `[SERVICE_NAME].service.[INTEGRATION_METHOD](data)`     |
| Suite 4      | Controller/API      | `[CONTROLLER_NAME]Controller.[METHOD](req, res)`        |
| Suite 5      | Business Logic      | `[SERVICE_NAME].service.[BUSINESS_METHOD](data)`        |
| Suite 6      | Error Handling      | Cross-service error handling                            |
| Suite 7      | E2E Integration     | Full workflow integration tests                         |

#### **Feature-Specific Mapping Examples**

##### **E-commerce Features**

| Suite   | Focus                | Subject Under Test                                  |
| ------- | -------------------- | --------------------------------------------------- |
| Suite 1 | Product Management   | `productService.createProduct(productData)`         |
| Suite 2 | Order Processing     | `orderService.processOrder(orderData)`              |
| Suite 3 | Payment Integration  | `paymentService.processPayment(paymentData)`        |
| Suite 4 | Order Controller     | `orderController.createOrder(req, res)`             |
| Suite 5 | Inventory Management | `inventoryService.updateStock(productId, quantity)` |

##### **User Management Features**

| Suite   | Focus            | Subject Under Test                              |
| ------- | ---------------- | ----------------------------------------------- |
| Suite 1 | Authentication   | `authService.login(credentials)`                |
| Suite 2 | User Validation  | `userService.validateUser(userData)`            |
| Suite 3 | Permission Check | `authService.checkPermission(userId, resource)` |
| Suite 4 | User Controller  | `userController.updateProfile(req, res)`        |
| Suite 5 | Role Management  | `roleService.assignRole(userId, roleId)`        |

##### **Content Management Features**

| Suite   | Focus              | Subject Under Test                           |
| ------- | ------------------ | -------------------------------------------- |
| Suite 1 | Content CRUD       | `contentService.createContent(contentData)`  |
| Suite 2 | File Upload        | `uploadService.uploadFile(fileData)`         |
| Suite 3 | Media Processing   | `mediaService.processImage(imageData)`       |
| Suite 4 | Content Controller | `contentController.publishContent(req, res)` |
| Suite 5 | Content Workflow   | `workflowService.approveContent(contentId)`  |

### **Output Requirements (code only)**

Generate the following files:

#### **1. Main Test File**

`tests/[feature-slug]/[suite-slug].test.js`

- `<feature-slug>` = lowercase feature name with hyphens (e.g., `order-management`)
- `<suite-slug>` = lowercase suite title, spaces and "&" replaced with hyphens (e.g., `chat-message-handling`)
- Use: `describe('[FEATURE_NAME] — <SUITE_HEADING>', ...)`
- One `test()` per test case (no merging, no missing tests)
- Assertions must reflect the "Expected Result" from the matrix
- Include **Given / When / Then** comments in each test

#### **2. Mock Files (as needed)**

`tests/mocks/[service-name].mock.js`

- Provide in-memory mock modules with standard methods
- Include `__set`, `__clear`, and `__reset` methods
- Mock external dependencies (DB, APIs, file system, etc.)

#### **3. Test Utilities**

`tests/_helpers/[feature-name]TestUtils.js`

- Include feature-specific helper functions
- Data generators, assertion helpers, setup utilities
- Common test data and mock factories

#### **4. Integration Helpers (for Suite 7)**

`tests/_helpers/[feature-name]IntegrationUtils.js`

- E2E test setup and teardown
- Database seeding and cleanup
- API client helpers and authentication

#### **5. Documentation Updates**

`prompts/log.md`

- Append this entry:  
  `YYYY-MM-DD HH:mm | Generated tests for "[FEATURE_NAME] - <SUITE_HEADING>" (N cases)`

`README.md`

- Add test execution guide if missing:  
  `npm test -- --coverage --testPathPattern=[feature-slug]`

### **Test Structure Requirements**

#### **Jest Configuration**

- Use **Jest** (CommonJS). No additional test libraries
- Include proper setup/teardown (`beforeAll`, `beforeEach`, `afterEach`, `afterAll`)
- Use proper assertions: `toEqual`, `toBe`, `toThrow`, `toHaveBeenCalledWith`, etc.
- Test names must be clear, descriptive, and start with **TC-ID**

#### **Mocking Strategy**

- Mock all external I/O (DB, network, email, file system, third-party APIs)
- Use Jest mocks for functions and modules
- Provide realistic mock data that matches expected behavior
- Ensure mocks are reset between tests

#### **Test Quality Standards**

- Tests must be **deterministic** and CI-friendly
- Target ≥ 80% coverage for the tested suite
- Use realistic test data (Vietnamese data where applicable)
- Include both positive and negative test cases
- Test edge cases and error scenarios

### **Feature-Specific Customization**

#### **For E-commerce Features**

```javascript
// Example mock structure
const productServiceMock = {
  findById: jest.fn(),
  findBySku: jest.fn(),
  updateStock: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __clear: () => {
    /* ... */
  },
};
```

#### **For User Management Features**

```javascript
// Example mock structure
const authServiceMock = {
  login: jest.fn(),
  register: jest.fn(),
  validateToken: jest.fn(),
  checkPermission: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __clear: () => {
    /* ... */
  },
};
```

#### **For Content Management Features**

```javascript
// Example mock structure
const contentServiceMock = {
  createContent: jest.fn(),
  updateContent: jest.fn(),
  publishContent: jest.fn(),
  deleteContent: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __clear: () => {
    /* ... */
  },
};
```

### **Test Data Standards**

#### **Vietnamese Data Examples**

```javascript
const testData = {
  users: {
    valid: {
      name: 'Nguyễn Văn A',
      email: 'test@example.com',
      phone: '0912345678',
      address: '123 Đường ABC, Quận 1, TP.HCM',
    },
  },
  products: {
    valid: {
      name: 'Giày thể thao Nike',
      sku: 'NK-001',
      price: 1500000,
      currency: 'VND',
    },
  },
};
```

#### **Common Test Scenarios**

- Valid input scenarios
- Invalid input scenarios
- Edge cases (boundary values)
- Error conditions
- Authentication/authorization
- Data validation
- Business rule enforcement

### **Sample Test Structure**

```javascript
describe('[FEATURE_NAME] — <SUITE_HEADING>', () => {
  beforeAll(async () => {
    // Setup test environment
  });

  beforeEach(() => {
    // Reset mocks and prepare test data
  });

  afterEach(() => {
    // Cleanup after each test
  });

  afterAll(async () => {
    // Final cleanup
  });

  test('TC-101 | Valid scenario description', async () => {
    // Given: Setup test data and preconditions
    const inputData = {
      /* test data */
    };

    // When: Execute the function under test
    const result = await serviceUnderTest.method(inputData);

    // Then: Assert expected results
    expect(result).toEqual(expectedResult);
  });
});
```

### **Output Validation Checklist**

Before finalizing, ensure:

- [ ] All test cases from the matrix are covered
- [ ] Test names include TC-ID prefix
- [ ] Given/When/Then structure is used
- [ ] Proper mocking is implemented
- [ ] Assertions match expected results
- [ ] Vietnamese test data is used where appropriate
- [ ] Setup/teardown is properly implemented
- [ ] Tests are deterministic and CI-friendly
- [ ] Coverage target is achievable (≥80%)

---

**Usage Instructions:**

1. Replace `[FEATURE_NAME]` with the actual feature name
2. Replace `<ABSOLUTE_PATH_TO_MATRIX_MD>` with the matrix file path
3. Replace `<SUITE_HEADING>` with the specific suite heading
4. Choose appropriate Subject Under Test mapping based on feature type
5. Customize mock structures for the specific feature domain
6. Adjust test data standards based on feature requirements
7. Generate only the code files listed above — no extra explanation
