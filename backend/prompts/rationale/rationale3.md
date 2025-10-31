# Universal Jest Test Code Generator - Rationale Analysis

## **Rationale Overview**

### **Main Purpose of the Prompt**

This prompt is designed to **automate Jest test code generation** from Test Case Matrix, solving the following problems:

1. **Manual test writing**: Manual test writing is time-consuming and error-prone
2. **Inconsistent test structure**: Each developer writes tests differently
3. **Missing test coverage**: Easy to miss important test cases
4. **Poor test organization**: Test files are not organized with clear structure
5. **Mock complexity**: Mock setup is complex and error-prone

## **1. How is the Input Structure Designed?**

### **Feature Name**

- **Purpose**: Identifies the context of the feature being tested
- **Usage**: Used for naming files and test descriptions
- **Why needed**: Ensures test code has clear context

### **Test Matrix File Path**

- **Purpose**: Path to the file containing test cases
- **Format**: Absolute path to avoid confusion
- **Why needed**: AI needs to read test cases to generate code

### **Suite Heading**

- **Purpose**: Identifies the specific suite to generate
- **Format**: Exact or case-insensitive match
- **Why needed**: A matrix has multiple suites, need to select the correct suite

## **2. Subject Under Test Mapping - Why is it Needed?**

### **Generic Mapping**

- **Purpose**: Common template for any feature
- **Structure**: Suite Number → Suite Type → Subject Pattern
- **Why needed**: Can be applied to any feature

### **Feature-Specific Mapping**

- **Purpose**: Customize for each type of feature
- **Examples**: E-commerce, User Management, Content Management
- **Why needed**: Each domain has different business logic

#### **E-commerce Features**

```javascript
// Rationale: E-commerce has main services
- Product Management: productService.createProduct()
- Order Processing: orderService.processOrder()
- Payment Integration: paymentService.processPayment()
- Inventory Management: inventoryService.updateStock()
```

#### **User Management Features**

```javascript
// Rationale: User management has authentication flow
- Authentication: authService.login()
- User Validation: userService.validateUser()
- Permission Check: authService.checkPermission()
- Role Management: roleService.assignRole()
```

#### **Content Management Features**

```javascript
// Rationale: Content management has CRUD operations
- Content CRUD: contentService.createContent()
- File Upload: uploadService.uploadFile()
- Media Processing: mediaService.processImage()
- Content Workflow: workflowService.approveContent()
```

## **3. Output Requirements - Why are 5 File Types Needed?**

### **1. Main Test File**

- **Path**: `tests/[feature-slug]/[suite-slug].test.js`
- **Purpose**: Contains main test cases
- **Rationale**:
  - Organized by feature and suite
  - Easy to maintain and navigate
  - Clear naming convention

### **2. Mock Files**

- **Path**: `tests/mocks/[service-name].mock.js`
- **Purpose**: Mock external dependencies
- **Rationale**:
  - Separate mocks from test files
  - Reusable across multiple test files
  - Standard mock interface (`__set`, `__clear`, `__reset`)

### **3. Test Utilities**

- **Path**: `tests/_helpers/[feature-name]TestUtils.js`
- **Purpose**: Helper functions and data generators
- **Rationale**:
  - DRY principle - don't repeat code
  - Centralized test data management
  - Feature-specific utilities

### **4. Integration Helpers**

- **Path**: `tests/_helpers/[feature-name]IntegrationUtils.js`
- **Purpose**: E2E test setup and teardown
- **Rationale**:
  - E2E tests need complex setup
  - Database seeding and cleanup
  - API client helpers

### **5. Documentation Updates**

- **Files**: `prompts/log.md`, `README.md`
- **Purpose**: Track test generation and provide usage guide
- **Rationale**:
  - Audit trail for test generation
  - Documentation for team members
  - Usage instructions

## **4. Test Structure Requirements - Why is Strict Structure Needed?**

### **Jest Configuration**

- **CommonJS**: Ensures compatibility with existing codebase
- **No additional libraries**: Keep dependencies minimal
- **Why needed**: Ensures tests can run in any environment

### **Setup/Teardown Pattern**

```javascript
beforeAll(); // Setup test environment
beforeEach(); // Reset mocks and prepare data
afterEach(); // Cleanup after each test
afterAll(); // Final cleanup
```

- **Rationale**: Ensures test isolation and consistency
- **Why needed**: Prevents test interference and flaky tests

### **Test Naming Convention**

- **Format**: `TC-xxx | <concise scenario>`
- **Rationale**: Easy to trace back to test case matrix
- **Why needed**: Debugging and maintenance

## **5. Mocking Strategy - Why is Comprehensive Mocking Needed?**

### **Mock All External I/O**

- **Database**: Avoid dependency on real database
- **Network**: Avoid dependency on external APIs
- **File System**: Avoid dependency on file system
- **Why needed**: Tests must be deterministic and fast

### **Mock Interface Standards**

```javascript
const serviceMock = {
  method: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __clear: () => {
    /* ... */
  },
  __reset: () => {
    /* ... */
  },
};
```

- **Rationale**: Consistent interface across all mocks
- **Why needed**: Easy to use and maintain

### **Realistic Mock Data**

- **Vietnamese data**: Appropriate for app context
- **Concrete data**: Don't use placeholders
- **Why needed**: Tests must reflect real usage

## **6. Test Quality Standards - Why is Strict Quality Needed?**

### **Deterministic Tests**

- **No random data**: Ensure tests run consistently
- **No external dependencies**: Avoid flaky tests
- **Why needed**: CI/CD pipeline needs reliable tests

### **Coverage Target (≥80%)**

- **Rationale**: Ensure test coverage is high enough
- **Why needed**: Confidence in code quality

### **Vietnamese Test Data**

- **Realistic context**: Tests must reflect real usage
- **Localization**: App is used in Vietnam
- **Why needed**: Detect bugs related to localization

## **7. Feature-Specific Customization - Why is Customization Needed?**

### **E-commerce Mock Structure**

```javascript
const productServiceMock = {
  findById: jest.fn(),
  findBySku: jest.fn(),
  updateStock: jest.fn(),
  // ... e-commerce specific methods
};
```

- **Rationale**: E-commerce has unique business logic
- **Why needed**: Mocks must reflect actual service interface

### **User Management Mock Structure**

```javascript
const authServiceMock = {
  login: jest.fn(),
  register: jest.fn(),
  validateToken: jest.fn(),
  // ... auth specific methods
};
```

- **Rationale**: Authentication has unique flow
- **Why needed**: Mocks must support auth scenarios

### **Content Management Mock Structure**

```javascript
const contentServiceMock = {
  createContent: jest.fn(),
  updateContent: jest.fn(),
  publishContent: jest.fn(),
  // ... content specific methods
};
```

- **Rationale**: Content management has CRUD operations
- **Why needed**: Mocks must support content workflows

## **8. Test Data Standards - Why is Vietnamese Data Needed?**

### **Realistic Testing**

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
};
```

- **Rationale**: Testing with real data will detect bugs better
- **Why needed**: App is used in Vietnam

### **Data Consistency**

- **Phone format**: Vietnamese phone number format
- **Address format**: Vietnamese address format
- **Currency**: VND formatting
- **Why needed**: Easy to validate and debug

## **9. Sample Test Structure - Why is a Template Needed?**

### **Given-When-Then Pattern**

```javascript
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
```

- **Rationale**: BDD pattern is easy to read and maintain
- **Why needed**: Consistency across all tests

### **Clear Test Structure**

- **Setup**: Given section
- **Execution**: When section
- **Assertion**: Then section
- **Why needed**: Easy to debug when test fails

## **10. Output Validation Checklist - Why is a Checklist Needed?**

### **Quality Assurance**

- **Completeness**: Ensure no missing test cases
- **Consistency**: Ensure correct format
- **Accuracy**: Ensure assertions are correct

### **Maintainability**

- **Standards**: Easy to maintain and update
- **Debugging**: Easy to debug when issues arise
- **Collaboration**: Easy to share with team members

## **11. Usage Instructions - Why are Detailed Instructions Needed?**

### **Step-by-step Guide**

1. Replace placeholders with actual values
2. Choose appropriate mapping
3. Customize mock structures
4. Adjust test data standards
5. Generate code files

### **Why needed**

- **Clarity**: Easy to understand how to use
- **Consistency**: Ensure everyone uses it correctly
- **Efficiency**: Avoid mistakes and rework

## **Rationale Summary**

### **Core Principles**

1. **Automation**: Automate test code generation
2. **Consistency**: Ensure test structure is consistent
3. **Quality**: Ensure high test quality
4. **Maintainability**: Easy to maintain and update
5. **Scalability**: Can be applied to any feature
6. **Realism**: Use real data for testing
7. **Organization**: Organize test files clearly
8. **Documentation**: Have complete documentation

### **Key Benefits**

- **Time Saving**: Reduce time writing tests
- **Quality Improvement**: Higher test quality
- **Consistency**: Consistent test structure
- **Coverage**: Complete test coverage
- **Maintainability**: Easy to maintain and update
- **Scalability**: Can be applied to any feature
- **Team Collaboration**: Easy to share and collaborate

### **Technical Excellence**

- **Jest Best Practices**: Use Jest correctly
- **Mock Strategy**: Comprehensive mocking strategy
- **Test Data**: Realistic Vietnamese test data
- **Error Handling**: Cover error scenarios
- **Edge Cases**: Cover edge cases
- **Performance**: Tests run fast and reliably

This prompt is designed to create a complete, high-quality test generation system that can scale for any feature in the system.
