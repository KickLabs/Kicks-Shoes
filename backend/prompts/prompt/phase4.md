# Universal Test Optimization Prompts

## Prompt 1: Increase Test Coverage

### **Coverage Enhancement Prompt**

I want to increase the unit test coverage for the following file:

**File Path**: `<FILE_PATH>`

**Feature Context**: `[FEATURE_NAME]` - `[FEATURE_DESCRIPTION]`

### **Goals**

- Increase coverage to **≥ 90%** for this file
- Include tests for: Happy Path, Edge Cases, Error Handling, and Branch Coverage
- Maintain existing test quality and structure

### **Your Task**

1. **Analyze** all functions and detect non-covered branches
2. **Generate** new additional Jest tests to improve coverage
3. **Do NOT rewrite** existing tests — generate only missing tests
4. **Return** the output as a single `.test.js` code block

### **Coverage Analysis Requirements**

#### **Function Analysis**

- [ ] Identify uncovered functions and methods
- [ ] Detect uncovered branches and conditionals
- [ ] Find missing error handling paths
- [ ] Locate untested edge cases and boundary conditions

#### **Test Type Coverage**

- [ ] **Happy Path**: Normal successful execution flows
- [ ] **Edge Cases**: Boundary values, limits, and special conditions
- [ ] **Error Handling**: Exception scenarios and error conditions
- [ ] **Branch Coverage**: All conditional branches and early returns

### **Output Format**

#### **Coverage Gap Analysis**

- Short summary of current coverage gaps
- Specific functions/methods needing additional tests
- Missing test scenarios identified

#### **New Test Cases**

- Jest test cases needed to reach ≥ 90% coverage
- Code block: `// FILE: <FILE_NAME>.additional.test.js`

### **Best Practices**

- Include assertions to cover branches, conditionals, early returns, and thrown errors
- Use realistic test data appropriate for the feature domain
- Follow Given/When/Then structure in test comments
- Ensure tests are deterministic and CI-friendly
- Maintain consistency with existing test patterns

---

## Prompt 2: Debug & Fix Failing Unit Test

### **Test Debugging Prompt**

Help me fix this failing unit test.

**Feature Context**: `[FEATURE_NAME]` - `[FEATURE_DESCRIPTION]`

### **Error Information**

**ERROR LOG:**

```
[PASTE ERROR LOG HERE]
```

**TEST CODE:**

```javascript
[PASTE TEST CODE HERE]
```

**SOURCE CODE:**

```javascript
[PASTE SOURCE CODE HERE]
```

### **Required Analysis**

Please provide:

1. **Root Cause** — Why it fails
2. **Issue Location** — Is the issue in test code or source code?
3. **Fixed Version** — Corrected test and/or source code
4. **Working Example** — Complete working corrected example
5. **Explanation** — Short Given–When–Then explanation for the fix

### **Debugging Checklist**

#### **Common Issues to Check**

- [ ] Mock setup and teardown
- [ ] Async/await handling
- [ ] Promise rejection handling
- [ ] Database connection issues
- [ ] Environment variable configuration
- [ ] Import/export module issues
- [ ] Test data setup problems
- [ ] Assertion expectations

#### **Fix Categories**

- **Test Issues**: Incorrect assertions, wrong mock setup, async handling
- **Source Issues**: Logic errors, missing error handling, incorrect return values
- **Configuration Issues**: Environment setup, module imports, dependencies
- **Data Issues**: Test data format, mock data accuracy

---

## Prompt 3: Generate Comprehensive Mocks

### **Mock Generation Prompt**

Create high-quality Jest mock objects for all external dependencies used in the **`[FEATURE_NAME]`** feature.

**Feature Context**: `[FEATURE_DESCRIPTION]`

### **Your Tasks**

Generate Jest mock modules for the following dependencies:

#### **Core Service Mocks**

- `[SERVICE_NAME].service.[METHOD_NAME](params)`
- `[SERVICE_NAME].service.[METHOD_NAME](params)`
- `[SERVICE_NAME].service.[METHOD_NAME](params)`

#### **Integration Mocks**

- `[EXTERNAL_SERVICE].service.[METHOD_NAME](params)`
- `[API_SERVICE].service.[METHOD_NAME](params)`
- `[NOTIFICATION_SERVICE].service.[METHOD_NAME](params)`

### **Mock Requirements**

#### **Data Standards**

- Include **realistic Vietnamese test data** for the feature domain
- Provide **proper mock setup & teardown** (beforeAll, beforeEach, afterEach, afterAll)
- Ensure mocks support both:
  - Happy path responses
  - Error/exception simulation (e.g., service unavailable, validation errors, network failures)

#### **Mock Interface**

- Include default mock return values
- Provide methods for overriding (e.g. `__set`, `__reset`, `__throw`)
- Support multiple scenarios per service
- Include state management for complex mocks

### **Expected Output**

#### **1. Mock Files**

- Individual mock files for each service (e.g., `[serviceName].mock.js`)
- Consistent naming convention: `[feature-name]-[service-name].mock.js`

#### **2. Shared Test Utilities**

- `[feature-name]TestUtils.js` with reusable helpers:
  - `make[Entity](overrides)` - Data factory functions
  - `mock[Service]()` - Service mock setup
  - `resetAllMocks()` - Global mock reset
  - `mockDate(timestamp)` - Date mocking utilities

#### **3. Sample Test Integration**

- Sample test snippet demonstrating mock usage
- Integration examples for different test scenarios
- Best practices for mock management

### **Mock Scenarios per Service**

Each service mock should provide at least 3 scenarios:

1. **Successful Response** - Normal happy path
2. **Edge Case** - No data found, empty results, boundary conditions
3. **Error Simulation** - Thrown exceptions, rejected promises, service failures

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

### **Best Practices**

#### **Mock Design**

- Use in-memory Maps for deterministic state
- Always reset mock state between tests
- Provide realistic Vietnamese test data
- Support both sync and async operations

#### **Test Data Standards**

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

#### **Mock Management**

- Consistent naming conventions
- Proper setup/teardown patterns
- State isolation between tests
- Error simulation capabilities

---

## Usage Instructions

### **For Coverage Enhancement**

1. Replace `<FILE_PATH>` with the actual file path
2. Replace `[FEATURE_NAME]` and `[FEATURE_DESCRIPTION]` with feature details
3. Run the prompt to get additional test cases

### **For Test Debugging**

1. Replace `[FEATURE_NAME]` and `[FEATURE_DESCRIPTION]` with feature details
2. Paste the actual error log, test code, and source code
3. Get comprehensive debugging analysis and fixes

### **For Mock Generation**

1. Replace `[FEATURE_NAME]` and `[FEATURE_DESCRIPTION]` with feature details
2. List the specific services and methods that need mocking
3. Get comprehensive mock files with Vietnamese test data

### **Customization Guidelines**

#### **E-commerce Features**

- Focus on product, order, payment, and inventory mocks
- Include Vietnamese product names, prices in VND
- Mock external payment gateways and shipping services

#### **User Management Features**

- Focus on authentication, authorization, and user data mocks
- Include Vietnamese user names and addresses
- Mock external identity providers and permission systems

#### **Content Management Features**

- Focus on content CRUD, file upload, and media processing mocks
- Include Vietnamese content examples
- Mock external storage and CDN services

#### **Analytics/Reporting Features**

- Focus on data aggregation and report generation mocks
- Include realistic metrics and KPIs
- Mock external analytics services and databases
