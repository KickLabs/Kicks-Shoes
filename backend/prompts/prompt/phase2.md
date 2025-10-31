# Universal Test Case Generator Prompt

## Prompt: Generate Comprehensive Test Cases Matrix

Generate a comprehensive **Test Cases Matrix** (Markdown) for any feature, based on the provided feature analysis document.

### **Feature Context**

**Feature Name**: `[FEATURE_NAME]`  
**Feature Summary**: `[FEATURE_DESCRIPTION]`  
**Analysis Document**: `[FEATURE_ANALYSIS_DOCUMENT]`

### **Output Requirements**

Return exactly ONE Markdown file with header:
`# test-cases-matrix-[feature-name].md`

Each test case must be a row with **8 columns** in this order:
`Test ID | Category | Test Scenario | Pre-conditions | Test Steps | Test Data | Expected Result | Priority | Dependencies`

### **Test Suite Structure**

Generate test cases in the following order with minimum counts:

#### **1. Core Functionality Tests (≥20)**

- **Target**: Main business logic functions
- **Focus**: Primary use cases and happy paths
- **Examples**: CRUD operations, data processing, business rules

#### **2. Input Validation & Data Processing (≥15)**

- **Target**: Data validation, parsing, transformation functions
- **Focus**: Valid/invalid inputs, edge cases, data formats
- **Examples**: Form validation, data parsing, type checking

#### **3. Service Layer Integration (≥12)**

- **Target**: Service functions and external integrations
- **Focus**: Service calls, API integrations, external dependencies
- **Examples**: Database operations, third-party APIs, file operations

#### **4. Controller & API Endpoints (≥10)**

- **Target**: Controller methods and API endpoints
- **Focus**: HTTP requests/responses, routing, middleware
- **Examples**: REST endpoints, request handling, response formatting

#### **5. Business Logic & Workflow (≥15)**

- **Target**: Complex business processes and workflows
- **Focus**: Multi-step processes, state management, business rules
- **Examples**: Order processing, user workflows, approval processes

#### **6. Edge Cases & Error Handling (≥15)**

- **Target**: Error scenarios and boundary conditions
- **Focus**: Exception handling, edge cases, failure scenarios
- **Examples**: Null/undefined values, boundary limits, system failures

#### **7. Integration & End-to-End (≥8)**

- **Target**: Complete user journeys and system integration
- **Focus**: Full workflows, cross-module interactions
- **Examples**: Complete user flows, system integration tests

### **Test Case Standards**

#### **ID & Categories**

- **Test ID format**: `TC-[SuiteNumber][SequentialNumber]` (e.g., TC-101, TC-201)
- **Category values**:
  - `Happy Path` - Normal successful scenarios
  - `Alternative Path` - Valid alternative flows
  - `Edge Case` - Boundary conditions and limits
  - `Negative Test` - Invalid inputs and error conditions
  - `Error Handling` - Exception and error scenarios
  - `Performance` - Load, stress, and performance tests
  - `Security` - Authentication, authorization, and security tests

#### **Test Data Standards**

Use realistic Vietnamese data where applicable:

- **Phone numbers**: `0912345678`, `0987654321`, `0355123456` (+ variants with spaces/dots/dashes)
- **Names**: Vietnamese names (e.g., `Nguyễn Văn A`, `Trần Thị B`)
- **Addresses**: Vietnamese addresses (e.g., `123 Đường ABC, Quận 1, TP.HCM`)
- **Emails**: `test@example.com`, `user@domain.vn`
- **Dates**: Vietnamese date formats (`DD/MM/YYYY`)
- **Currency**: Vietnamese Dong (VND) with proper formatting

#### **Test Steps Format**

Use BDD (Behavior-Driven Development) style:

- **Given**: Initial state and preconditions
- **When**: Action or trigger
- **Then**: Expected outcome
- **And**: Additional conditions or assertions (optional)

### **Coverage Requirements**

#### **Must Include (Generic)**

- [ ] Happy path scenarios for all main functions
- [ ] Input validation (valid/invalid/edge cases)
- [ ] Error handling and exception scenarios
- [ ] Boundary value testing
- [ ] Null/undefined value handling
- [ ] Concurrent operation handling
- [ ] Security considerations (injection, XSS, authorization)
- [ ] Performance edge cases
- [ ] Database operation failures
- [ ] Network/API failure scenarios
- [ ] Data integrity checks
- [ ] State transition validations

#### **Feature-Specific Coverage**

- [ ] Core business logic validation
- [ ] Data transformation accuracy
- [ ] Integration point testing
- [ ] Workflow completeness
- [ ] User permission checks
- [ ] Data consistency maintenance

### **Quality Constraints**

#### **Language & Format**

- **Language**: Vietnamese prose for descriptions; English for technical terms, function names, and code
- **Test Steps**: One line each, BDD format (Given/When/Then/And)
- **Data**: Use only concrete, realistic data (no placeholders like `[VALUE]`)
- **Priority Distribution**: At least 30% High priority overall

#### **Technical Requirements**

- **Dependencies**: Cross-reference related functions/modules from analysis document
- **Expected Results**: Include specific return values, status codes, or state changes
- **Test Data**: Provide complete, realistic test datasets
- **Pre-conditions**: Specify required system state and data setup

### **Expected Result Formats**

#### **For Service Functions**

```json
{
  "success": true,
  "data": {
    "id": "generated_id",
    "status": "success_status",
    "result": "expected_result"
  },
  "message": "Success message"
}
```

#### **For API Endpoints**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "resource_id",
    "attributes": "expected_attributes"
  },
  "message": "Success message"
}
```

#### **For Error Scenarios**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": "Additional error details"
  }
}
```

### **Customization Guidelines**

#### **For E-commerce Features**

- Include product data (SKUs, prices, inventory)
- Test shopping cart, checkout, payment flows
- Validate order processing and fulfillment

#### **For User Management Features**

- Test authentication, authorization, roles
- Validate user data, permissions, access control
- Test password policies, account management

#### **For Content Management Features**

- Test CRUD operations for content
- Validate file uploads, media processing
- Test content publishing, approval workflows

#### **For Analytics/Reporting Features**

- Test data aggregation, calculation accuracy
- Validate report generation, export functionality
- Test filtering, sorting, pagination

### **Output Validation Checklist**

Before finalizing, ensure:

- [ ] All test cases have unique IDs
- [ ] Categories are properly assigned
- [ ] Test steps follow BDD format
- [ ] Test data is concrete and realistic
- [ ] Expected results are specific and measurable
- [ ] Dependencies are properly referenced
- [ ] Priority distribution meets requirements (≥30% High)
- [ ] Coverage requirements are met
- [ ] Vietnamese language is used appropriately
- [ ] Technical terms are in English

---

**Usage Instructions:**

1. Replace `[FEATURE_NAME]` with the actual feature name
2. Replace `[FEATURE_DESCRIPTION]` with a brief feature summary
3. Replace `[FEATURE_ANALYSIS_DOCUMENT]` with the analysis document name
4. Customize the feature-specific coverage section based on the feature type
5. Adjust test suite counts based on feature complexity
6. Add specific data standards relevant to the feature domain
