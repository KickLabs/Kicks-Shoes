# Universal Test Optimization Prompts - Rationale Analysis

## **1. Main Purpose of the Prompt**

### **Why is This Prompt Needed?**

- **Test Quality Improvement**: Improve quality of existing test cases
- **Coverage Enhancement**: Increase test coverage to higher level (≥90%)
- **Test Debugging**: Help debug and fix test failures quickly
- **Mock Generation**: Create comprehensive mocks for testing

### **Problems This Prompt Solves:**

- **Low test coverage**: Low test coverage, insufficient confidence
- **Test failures**: Tests fail but don't know how to fix
- **Poor mocking**: Mocks are incomplete or unrealistic
- **Test maintenance**: Difficult to maintain and update tests

## **2. How is the Structure of 3 Prompts Designed?**

### **Prompt 1: Increase Test Coverage**

#### **Purpose**

- Increase test coverage to ≥90%
- Cover missing scenarios
- Maintain existing test quality

#### **Why is This Prompt Needed?**

- **Coverage gaps**: Many code paths are not tested
- **Quality assurance**: Need higher confidence in code
- **Risk reduction**: Reduce risk of bugs in production

#### **Coverage Analysis Requirements**

- **Function Analysis**: Identify uncovered functions and methods
- **Test Type Coverage**: Happy Path, Edge Cases, Error Handling, Branch Coverage
- **Why needed**: Ensure comprehensive test coverage

### **Prompt 2: Debug & Fix Failing Unit Test**

#### **Purpose**

- Debug test failures quickly
- Fix issues in test code or source code
- Provide working solutions

#### **Why is This Prompt Needed?**

- **Test failures**: Tests fail but don't know the cause
- **Debugging complexity**: Debugging tests is complex and time-consuming
- **Quick fixes**: Need to fix quickly to avoid blocking development

#### **Debugging Checklist**

- **Common Issues**: Mock setup, async handling, database issues
- **Fix Categories**: Test Issues, Source Issues, Configuration Issues, Data Issues
- **Why needed**: Systematic approach to debug and fix

### **Prompt 3: Generate Comprehensive Mocks**

#### **Purpose**

- Create comprehensive mocks for external dependencies
- Provide realistic Vietnamese test data
- Support multiple test scenarios

#### **Why is This Prompt Needed?**

- **Mock complexity**: Creating mocks is complex and time-consuming
- **Data consistency**: Need realistic data for testing
- **Test isolation**: Need mocks for test isolation

## **3. Prompt 1: Coverage Enhancement - Detailed Rationale**

### **Goals Design**

#### **≥90% Coverage Target**

- **Rationale**: 90% is a high coverage level, ensuring confidence
- **Why 90%**: Balance between coverage and effort
- **Benefits**: High confidence in code quality

#### **Test Types Coverage**

- **Happy Path**: Normal successful execution flows
- **Edge Cases**: Boundary values, limits, special conditions
- **Error Handling**: Exception scenarios and error conditions
- **Branch Coverage**: All conditional branches and early returns
- **Why needed**: Comprehensive test coverage

### **Coverage Analysis Requirements**

#### **Function Analysis**

- **Identify uncovered functions**: Find functions not yet tested
- **Detect uncovered branches**: Find conditional branches not covered
- **Find missing error handling**: Find error paths not tested
- **Locate untested edge cases**: Find boundary conditions not tested
- **Why needed**: Systematic analysis to identify gaps

#### **Test Type Coverage**

- **Happy Path**: Ensure normal flows work
- **Edge Cases**: Test boundary conditions
- **Error Handling**: Test error scenarios
- **Branch Coverage**: Test all code paths
- **Why needed**: Ensure comprehensive test coverage

### **Output Format**

#### **Coverage Gap Analysis**

- **Short summary**: Summary of current gaps
- **Specific functions**: Functions needing additional tests
- **Missing scenarios**: Missing test scenarios
- **Why needed**: Clear understanding of current state

#### **New Test Cases**

- **Jest test cases**: Additional tests to reach ≥90%
- **Code block format**: `// FILE: <FILE_NAME>.additional.test.js`
- **Why needed**: Ready-to-use test code

### **Best Practices**

#### **Assertions Coverage**

- **Branches**: Cover all conditional branches
- **Conditionals**: Test all if/else conditions
- **Early returns**: Test early return paths
- **Thrown errors**: Test exception scenarios
- **Why needed**: Comprehensive code coverage

#### **Test Data Standards**

- **Realistic data**: Use appropriate data for feature domain
- **Given/When/Then**: Follow BDD structure
- **Deterministic**: Ensure tests are CI-friendly
- **Consistency**: Maintain consistency with existing patterns
- **Why needed**: High-quality test standards

## **4. Prompt 2: Test Debugging - Detailed Rationale**

### **Required Analysis Structure**

#### **Root Cause Analysis**

- **Why it fails**: Identify underlying cause
- **Why needed**: Understanding root cause to fix properly

#### **Issue Location**

- **Test code vs Source code**: Determine where the issue is
- **Why needed**: Focus fix effort on the right place

#### **Fixed Version**

- **Corrected code**: Provide working solution
- **Why needed**: Ready-to-use fix

#### **Working Example**

- **Complete example**: Show how to use the fix
- **Why needed**: Clear implementation guidance

#### **Explanation**

- **Given-When-Then**: Explain the fix clearly
- **Why needed**: Understanding to prevent similar issues

### **Debugging Checklist**

#### **Common Issues to Check**

- **Mock setup and teardown**: Common source of test failures
- **Async/await handling**: Complex async patterns
- **Promise rejection handling**: Error handling in promises
- **Database connection issues**: External dependencies
- **Environment variable configuration**: Configuration problems
- **Import/export module issues**: Module resolution problems
- **Test data setup problems**: Data preparation issues
- **Assertion expectations**: Wrong expectations
- **Why needed**: Systematic checklist to debug

#### **Fix Categories**

- **Test Issues**: Problems in test code
- **Source Issues**: Problems in source code
- **Configuration Issues**: Environment and setup problems
- **Data Issues**: Test data problems
- **Why needed**: Categorize fixes to apply appropriate solutions

## **5. Prompt 3: Mock Generation - Detailed Rationale**

### **Mock Requirements Design**

#### **Data Standards**

- **Vietnamese test data**: Realistic data for Vietnamese context
- **Proper setup/teardown**: Jest best practices
- **Happy path responses**: Normal successful operations
- **Error simulation**: Service failures, validation errors, network failures
- **Why needed**: Comprehensive mock support

#### **Mock Interface**

- **Default return values**: Standard mock behavior
- **Override methods**: `__set`, `__reset`, `__throw`
- **Multiple scenarios**: Support different test scenarios
- **State management**: Complex mock state handling
- **Why needed**: Flexible and maintainable mocks

### **Expected Output Structure**

#### **1. Mock Files**

- **Individual files**: Separate mock files for each service
- **Naming convention**: `[feature-name]-[service-name].mock.js`
- **Why needed**: Organized and maintainable mock structure

#### **2. Shared Test Utilities**

- **Data factory functions**: `make[Entity](overrides)`
- **Service mock setup**: `mock[Service]()`
- **Global mock reset**: `resetAllMocks()`
- **Date mocking**: `mockDate(timestamp)`
- **Why needed**: Reusable utilities for testing

#### **3. Sample Test Integration**

- **Usage examples**: How to use mocks in tests
- **Integration examples**: Different test scenarios
- **Best practices**: Mock management guidelines
- **Why needed**: Clear guidance for implementation

### **Mock Scenarios per Service**

#### **3 Scenarios Design**

1. **Successful Response**: Normal happy path
2. **Edge Case**: No data found, empty results, boundary conditions
3. **Error Simulation**: Thrown exceptions, rejected promises, service failures

- **Why needed**: Comprehensive test coverage

### **Feature-Specific Mock Examples**

#### **E-commerce Features**

```javascript
const productServiceMock = {
  findById: jest.fn(),
  findBySku: jest.fn(),
  updateStock: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __reset: () => {
    /* ... */
  },
  __throw: (method, error) => {
    /* ... */
  },
};
```

- **Rationale**: E-commerce has specific business logic
- **Methods**: Product-related operations
- **Why needed**: Domain-specific mock interface

#### **User Management Features**

```javascript
const authServiceMock = {
  login: jest.fn(),
  register: jest.fn(),
  validateToken: jest.fn(),
  checkPermission: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __reset: () => {
    /* ... */
  },
  __throw: (method, error) => {
    /* ... */
  },
};
```

- **Rationale**: Authentication has specific flow
- **Methods**: Auth-related operations
- **Why needed**: Auth-specific mock interface

#### **Content Management Features**

```javascript
const contentServiceMock = {
  createContent: jest.fn(),
  updateContent: jest.fn(),
  publishContent: jest.fn(),
  deleteContent: jest.fn(),
  __set: (method, implementation) => {
    /* ... */
  },
  __reset: () => {
    /* ... */
  },
  __throw: (method, error) => {
    /* ... */
  },
};
```

- **Rationale**: Content management has CRUD operations
- **Methods**: Content-related operations
- **Why needed**: Content-specific mock interface

## **6. Test Data Standards - Detailed Rationale**

### **Vietnamese Data Examples**

#### **User Data**

```javascript
const testData = {
  users: {
    valid: {
      id: 'user_123',
      name: 'Nguyễn Văn A',
      email: 'test@example.com',
      phone: '0912345678',
    },
  },
};
```

- **Rationale**: App is used in Vietnam
- **Benefits**: Realistic testing with local context
- **Why needed**: Detect bugs related to localization

#### **Product Data**

```javascript
const testData = {
  products: {
    valid: {
      id: 'prod_123',
      name: 'Giày thể thao Nike',
      sku: 'NK-001',
      price: 1500000,
      currency: 'VND',
    },
  },
};
```

- **Rationale**: E-commerce context with Vietnamese products
- **Benefits**: Realistic product data
- **Why needed**: Test with real-world data

### **Data Consistency**

- **Phone format**: Vietnamese phone number format
- **Address format**: Vietnamese address format
- **Currency**: VND formatting
- **Names**: Vietnamese names
- **Why needed**: Consistent data format easy to maintain

## **7. Best Practices - Detailed Rationale**

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

### **Test Data Standards**

#### **Concrete Data**

- **No placeholders**: Use real, specific values
- **Benefits**: Easy implementation and debugging
- **Why needed**: Ready-to-use test data

#### **Vietnamese Context**

- **Localized data**: Vietnamese names, addresses, phone numbers
- **Benefits**: Realistic testing
- **Why needed**: App context

### **Mock Management**

#### **Naming Conventions**

- **Consistent naming**: Standard naming patterns
- **Benefits**: Easy to find and maintain
- **Why needed**: Code organization

#### **Setup/Teardown Patterns**

- **Proper lifecycle**: beforeAll, beforeEach, afterEach, afterAll
- **Benefits**: Clean test environment
- **Why needed**: Test isolation

#### **State Isolation**

- **Independent tests**: Tests don't affect each other
- **Benefits**: Reliable test execution
- **Why needed**: Test reliability

#### **Error Simulation**

- **Comprehensive errors**: Support various error scenarios
- **Benefits**: Complete test coverage
- **Why needed**: Error handling testing

## **8. Usage Instructions - Detailed Rationale**

### **For Coverage Enhancement**

#### **Step 1: Replace placeholders**

- **File path**: Actual file path to analyze
- **Feature context**: Feature name and description
- **Why needed**: Context for analysis

#### **Step 2: Run prompt**

- **Get additional tests**: Generate missing test cases
- **Why needed**: Increase coverage

### **For Test Debugging**

#### **Step 1: Provide context**

- **Feature details**: Feature name and description
- **Why needed**: Context for debugging

#### **Step 2: Paste information**

- **Error log**: Actual error information
- **Test code**: Failing test code
- **Source code**: Related source code
- **Why needed**: Complete information for debugging

#### **Step 3: Get analysis**

- **Comprehensive analysis**: Root cause, fix, explanation
- **Why needed**: Complete solution

### **For Mock Generation**

#### **Step 1: Provide context**

- **Feature details**: Feature name and description
- **Why needed**: Context for mock generation

#### **Step 2: List dependencies**

- **Services and methods**: Specific dependencies to mock
- **Why needed**: Targeted mock generation

#### **Step 3: Get mocks**

- **Comprehensive mocks**: Complete mock files
- **Why needed**: Ready-to-use mocks

### **Customization Guidelines**

#### **E-commerce Features**

- **Focus areas**: Product, order, payment, inventory
- **Vietnamese data**: Product names, VND prices
- **External services**: Payment gateways, shipping
- **Why needed**: Domain-specific customization

#### **User Management Features**

- **Focus areas**: Authentication, authorization, user data
- **Vietnamese data**: User names, addresses
- **External services**: Identity providers, permission systems
- **Why needed**: Auth-specific customization

#### **Content Management Features**

- **Focus areas**: Content CRUD, file upload, media processing
- **Vietnamese data**: Content examples
- **External services**: Storage, CDN services
- **Why needed**: Content-specific customization

#### **Analytics/Reporting Features**

- **Focus areas**: Data aggregation, report generation
- **Realistic data**: Metrics and KPIs
- **External services**: Analytics services, databases
- **Why needed**: Analytics-specific customization

## **9. Rationale Summary**

### **Core Principles**

1. **Test Quality Improvement**: Improve test quality
2. **Coverage Enhancement**: Increase test coverage
3. **Test Debugging**: Debug and fix test failures
4. **Mock Generation**: Create comprehensive mocks
5. **Realistic Testing**: Use realistic data
6. **Maintainability**: Easy to maintain and update
7. **Scalability**: Apply to any feature
8. **Best Practices**: Follow testing best practices

### **Key Benefits**

- **Time Saving**: Reduce time debugging and fixing tests
- **Quality Improvement**: Higher test quality
- **Coverage Increase**: More complete test coverage
- **Mock Quality**: Comprehensive and realistic mocks
- **Maintainability**: Easy to maintain and update
- **Team Productivity**: Increase team efficiency
- **Code Confidence**: Higher confidence in code quality

### **Technical Excellence**

- **Jest Best Practices**: Use Jest correctly
- **Mock Strategy**: Comprehensive mocking approach
- **Vietnamese Data**: Realistic, localized test data
- **Error Handling**: Complete error scenario coverage
- **Test Isolation**: Proper test isolation
- **Performance**: Efficient test execution

### **Business Value**

- **Risk Reduction**: Reduce bug risk
- **Quality Assurance**: Ensure code quality
- **Team Efficiency**: Increase team productivity
- **Customer Satisfaction**: Better user experience
- **Cost Reduction**: Reduce bug fix costs

This prompt is designed to improve test quality and coverage, helping teams achieve higher confidence in code quality and reduce the risk of bugs in production.
