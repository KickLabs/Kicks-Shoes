# Universal Test Case Generator Prompt - Rationale Analysis

## **1. Main Purpose of the Prompt**

### **Why is this prompt needed?**

- **Standardization**: Create a standard template for generating test cases.
- **Completeness**: Ensure no important test scenarios are missed.
- **Scalability**: Can be applied to any feature, not just a specific one.
- **Quality Assurance**: Ensure test cases are of high quality and have full coverage.

### **Problems this prompt solves:**

- **Inconsistent test coverage**: Each developer writes tests differently.
- **Missing test scenarios**: Easy to miss edge cases and error scenarios.
- **Poor test organization**: Test cases are not organized in a clear structure.
- **Language inconsistency**: Inconsistent mixing of Vietnamese and English.

## **2. How is the Test Suite Structure Designed?**

### **7 Test Suites with specific purposes:**

#### **Suite 1: Core Functionality Tests (≥20)**

- **Rationale**: This is the heart of the feature, needs the most thorough testing.
- **Focus**: Happy paths and main business logic.
- **Why 20+**: Core functionality is often complex, requiring many test cases.

#### **Suite 2: Input Validation & Data Processing (≥15)**

- **Rationale**: Input validation is the first line of defense.
- **Focus**: Data integrity and security.
- **Why 15+**: There are many different types of input to validate.

#### **Suite 3: Service Layer Integration (≥12)**

- **Rationale**: The service layer is where business logic is implemented.
- **Focus**: Integration points and external dependencies.
- **Why 12+**: The service layer has many integration points.

#### **Suite 4: Controller & API Endpoints (≥10)**

- **Rationale**: API endpoints are the interface with the external world.
- **Focus**: HTTP handling and response formatting.
- **Why 10+**: API endpoints are usually fewer but critical.

#### **Suite 5: Business Logic & Workflow (≥15)**

- **Rationale**: Complex workflows need thorough testing.
- **Focus**: Multi-step processes and state management.
- **Why 15+**: Workflows are complex, requiring many test cases.

#### **Suite 6: Edge Cases & Error Handling (≥15)**

- **Rationale**: Edge cases are often where bugs appear.
- **Focus**: Boundary conditions and error scenarios.
- **Why 15+**: There are many edge cases to cover.

#### **Suite 7: Integration & End-to-End (≥8)**

- **Rationale**: E2E tests ensure the entire flow works.
- **Focus**: Complete user journeys.
- **Why 8+**: E2E tests are complex, fewer in number but important.

## **3. Why are 8 columns needed in the Test Case Matrix?**

### **Test ID**

- **Purpose**: Unique identifier for each test case.
- **Format**: `TC-[SuiteNumber][SequentialNumber]` for easy organization.
- **Why needed**: Easy to reference and track test cases.

### **Category**

- **Purpose**: Classify test cases by type.
- **Values**: Happy Path, Alternative Path, Edge Case, Negative Test, Error Handling, Performance, Security.
- **Why needed**: Easy to filter and prioritize test cases.

### **Test Scenario**

- **Purpose**: Briefly describe the test case.
- **Format**: Clear, concise description.
- **Why needed**: Easy to understand what the test case does.

### **Pre-conditions**

- **Purpose**: Necessary conditions before running the test.
- **Format**: System state, data setup requirements.
- **Why needed**: Ensure the test environment is correct.

### **Test Steps**

- **Purpose**: Detailed steps to execute the test.
- **Format**: BDD style (Given/When/Then/And).
- **Why needed**: Easy to implement and maintain test cases.

### **Test Data**

- **Purpose**: Specific data for testing.
- **Format**: Concrete, realistic data.
- **Why needed**: Ensure the test has the correct data.

### **Expected Result**

- **Purpose**: The expected outcome.
- **Format**: Specific, measurable results.
- **Why needed**: Ensure the test has the correct assertions.

### **Priority**

- **Purpose**: The importance level of the test case.
- **Values**: High, Medium, Low.
- **Why needed**: Easy to prioritize when time is limited.

### **Dependencies**

- **Purpose**: Dependencies needed to run the test.
- **Format**: Related functions/modules.
- **Why needed**: Easy to set up the test environment.

## **4. Why are Vietnamese data standards needed?**

### **Realistic Testing**

- **Rationale**: Testing with realistic data will find bugs better.
- **Vietnamese context**: The app is used in Vietnam, requires Vietnamese data.
- **Examples**: Vietnamese names, addresses, phone numbers.

### **Data Consistency**

- **Rationale**: Consistent data format helps make tests easier to maintain.
- **Standards**: Phone numbers, addresses, currency formats.
- **Why needed**: Easy to validate and debug test failures.

## **5. Why is the BDD format needed for Test Steps?**

### **Clarity**

- **Given**: Clearly defines the initial state.
- **When**: Clearly defines the action performed.
- **Then**: Clearly defines the expected outcome.
- **And**: Additional conditions if needed.

### **Maintainability**

- **Structure**: Easy to read and understand.
- **Updates**: Easy to update when requirements change.
- **Debugging**: Easy to debug when a test fails.

## **6. Why is Feature-Specific Coverage needed?**

### **E-commerce Features**

- **Product data**: SKUs, prices, inventory.
- **Shopping flows**: Cart, checkout, payment.
- **Order processing**: Fulfillment, tracking.

### **User Management Features**

- **Authentication**: Login, logout, password reset.
- **Authorization**: Roles, permissions, access control.
- **User data**: Profile, preferences, settings.

### **Content Management Features**

- **CRUD operations**: Create, read, update, delete.
- **File handling**: Upload, download, processing.
- **Workflows**: Publishing, approval, versioning.

### **Analytics/Reporting Features**

- **Data aggregation**: Calculations, summaries.
- **Report generation**: Formats, exports.
- **Filtering**: Search, sort, pagination.

## **7. Why are Quality Constraints needed?**

### **Language Consistency**

- **Vietnamese prose**: For descriptions that are easy to understand.
- **English technical terms**: For code and function names.
- **Why needed**: Balances readability and technical accuracy.

### **Priority Distribution**

- **≥30% High priority**: Focus on critical test cases.
- **Why needed**: Ensure the most important test cases are covered.

### **Concrete Data**

- **No placeholders**: Use specific data.
- **Why needed**: Easy to implement and debug test cases.

## **8. Why is an Output Validation Checklist needed?**

### **Quality Assurance**

- **Completeness**: Ensure nothing is missing.
- **Consistency**: Ensure the format is correct.
- **Accuracy**: Ensure the data is correct.

### **Maintainability**

- **Standards**: Easy to maintain and update.
- **Debugging**: Easy to debug when there are problems.
- **Collaboration**: Easy to share with team members.

## **9. Detailed Test Suite Breakdown**

### **Suite 1: Core Functionality Tests**

#### **Purpose**

- Test the main business logic of the feature.
- Cover happy paths and primary use cases.
- Ensure core functionality works correctly.

#### **Why ≥20 test cases?**

- Core functionality is often complex.
- Many business rules to test.
- Need to cover many different scenarios.
- It is the foundation of the feature.

#### **Example test cases**

- Valid input scenarios
- Business rule validations
- State transitions
- Data processing accuracy

### **Suite 2: Input Validation & Data Processing**

#### **Purpose**

- Test data validation logic.
- Cover input parsing and transformation.
- Ensure data integrity.

#### **Why ≥15 test cases?**

- Many different types of input.
- Need to test validation rules.
- Edge cases for data processing.
- Security considerations.

#### **Example test cases**

- Valid input formats
- Invalid input handling
- Data type validation
- Format conversion

### **Suite 3: Service Layer Integration**

#### **Purpose**

- Test service layer functions.
- Cover external integrations.
- Ensure service calls work correctly.

#### **Why ≥12 test cases?**

- The service layer has many integration points.
- Need to test external dependencies.
- Error handling for service calls.
- Performance considerations.

#### **Example test cases**

- Service method calls
- External API integrations
- Database operations
- File system operations

### **Suite 4: Controller & API Endpoints**

#### **Purpose**

- Test API endpoints.
- Cover HTTP request/response handling.
- Ensure the API contract is correct.

#### **Why ≥10 test cases?**

- API endpoints are fewer but critical.
- Need to test HTTP methods.
- Response formatting.
- Error handling.

#### **Example test cases**

- GET, POST, PUT, DELETE endpoints
- Request validation
- Response formatting
- Status codes

### **Suite 5: Business Logic & Workflow**

#### **Purpose**

- Test complex business processes.
- Cover multi-step workflows.
- Ensure business rules are enforced.

#### **Why ≥15 test cases?**

- Workflows are complex.
- Need to test state management.
- Business rule combinations.
- Process completion.

#### **Example test cases**

- Multi-step processes
- State transitions
- Business rule enforcement
- Workflow completion

### **Suite 6: Edge Cases & Error Handling**

#### **Purpose**

- Test boundary conditions.
- Cover error scenarios.
- Ensure the system is robust.

#### **Why ≥15 test cases?**

- There are many edge cases.
- Error scenarios are important.
- Boundary value testing.
- Exception handling.

#### **Example test cases**

- Null/undefined values
- Boundary limits
- Network errors
- System failures

### **Suite 7: Integration & End-to-End**

#### **Purpose**

- Test complete user journeys.
- Cover system integration.
- Ensure end-to-end flow works.

#### **Why ≥8 test cases?**

- E2E tests are complex.
- Need to test full workflows.
- Integration points.
- User experience.

#### **Example test cases**

- Complete user flows
- Cross-module interactions
- System integration
- User experience validation

## **10. Test Case Matrix Structure**

### **8 Columns Design Rationale**

_(Note: The user's doc lists 8 columns in the title but 9 in the list. I will follow the list.)_

#### **Test ID (Column 1)**

- **Format**: `TC-[SuiteNumber][SequentialNumber]`
- **Example**: `TC-101`, `TC-201`, `TC-301`
- **Purpose**: Unique identification and easy reference.
- **Benefits**: Easy to track, organize, and reference test cases.

#### **Category (Column 2)**

- **Values**: Happy Path, Alternative Path, Edge Case, Negative Test, Error Handling, Performance, Security
- **Purpose**: Classify test cases by type.
- **Benefits**: Easy to filter, group, and prioritize test cases.

#### **Test Scenario (Column 3)**

- **Format**: Clear, concise description.
- **Purpose**: Briefly describe the test case.
- **Benefits**: Easy to understand what the test case does.

#### **Pre-conditions (Column 4)**

- **Format**: System state, data setup requirements.
- **Purpose**: Necessary conditions before running the test.
- **Benefits**: Ensure the test environment is correct.

#### **Test Steps (Column 5)**

- **Format**: BDD style (Given/When/Then/And).
- **Purpose**: Detailed steps to execute the test.
- **Benefits**: Easy to implement and maintain test cases.

#### **Test Data (Column 6)**

- **Format**: Concrete, realistic data.
- **Purpose**: Specific data for testing.
- **Benefits**: Ensure the test has the correct data.

#### **Expected Result (Column 7)**

- **Format**: Specific, measurable results.
- **Purpose**: The expected outcome.
- **Benefits**: Ensure the test has the correct assertions.

#### **Priority (Column 8)**

- **Values**: High, Medium, Low
- **Purpose**: The importance level of the test case.
- **Benefits**: Easy to prioritize when time is limited.

#### **Dependencies (Column 9)**

- **Format**: Related functions/modules
- **Purpose**: Dependencies needed to run the test.
- **Benefits**: Easy to set up the test environment.

## **11. Vietnamese Data Standards**

### **Why is Vietnamese data needed?**

#### **Realistic Testing**

- **Context**: The app is used in Vietnam.
- **Data**: Vietnamese names, addresses, phone numbers.
- **Benefits**: Detect bugs related to localization.

#### **Data Consistency**

- **Phone numbers**: `0912345678`, `0987654321`
- **Addresses**: `123 Đường ABC, Quận 1, TP.HCM`
- **Names**: `Nguyễn Văn A`, `Trần Thị B`
- **Currency**: VND formatting
- **Benefits**: Easy to validate and debug test failures.

### **Data Standards Examples**

#### **Phone Numbers**

- **Format**: `09xxxxxxxx`, `03xxxxxxxx`
- **Examples**: `0912345678`, `0987654321`, `0355123456`
- **Variants**: Spaces, dots, dashes: `0912 345 678`, `0912.345.678`, `0912-345-678`

#### **Names**

- **Format**: Vietnamese names
- **Examples**: `Nguyễn Văn A`, `Trần Thị B`, `Lê Hoàng C`
- **Benefits**: Test with real Vietnamese names.

#### **Addresses**

- **Format**: Vietnamese address format
- **Examples**: `123 Đường ABC, Quận 1, TP.HCM`
- **Benefits**: Test with real Vietnamese addresses.

#### **Currency**

- **Format**: Vietnamese Dong (VND)
- **Examples**: `1500000 VND`, `2,500,000 VND`
- **Benefits**: Test with real Vietnamese currency.

## **12. BDD Format for Test Steps**

### **Why is BDD format needed?**

#### **Clarity**

- **Given**: Clearly defines the initial state.
- **When**: Clearly defines the action performed.
- **Then**: Clearly defines the expected outcome.
- **And**: Additional conditions if needed.

#### **Maintainability**

- **Structure**: Easy to read and understand.
- **Updates**: Easy to update when requirements change.
- **Debugging**: Easy to debug when a test fails.

### **BDD Format Examples**

#### **Happy Path Example**

- **Given**: User is logged in and has valid profile data When: User updates their profile information - - **Then**: Profile should be updated successfully And: User should see success message

#### **Error Case Example**

## **13. Feature-Specific Coverage**

### **E-commerce Features**

#### **Product Data**

- **SKUs**: `NK-001`, `AD-002`, `PU-003`
- **Prices**: `1500000 VND`, `2500000 VND`
- **Inventory**: Stock levels, availability
- **Categories**: `Giày thể thao` (Sports Shoes), `Áo thun` (T-shirt), `Quần short` (Shorts)

#### **Shopping Flows**

- **Cart**: Add/remove items, quantity updates
- **Checkout**: Payment processing, shipping
- **Payment**: VNPay, credit card, cash on delivery

#### **Order Processing**

- **Fulfillment**: Order confirmation, tracking
- **Status Updates**: Pending, confirmed, shipped, delivered
- **Notifications**: Email, SMS notifications

### **User Management Features**

#### **Authentication**

- **Login**: Email/password, phone/OTP
- **Logout**: Session cleanup, token invalidation
- **Password Reset**: Email/SMS verification

#### **Authorization**

- **Roles**: Admin, User, Moderator
- **Permissions**: Read, Write, Delete, Admin
- **Access Control**: Resource-based permissions

#### **User Data**

- **Profile**: Name, email, phone, address
- **Preferences**: Language, notifications, privacy
- **Settings**: Account settings, security settings

### **Content Management Features**

#### **CRUD Operations**

- **Create**: Content creation, validation
- **Read**: Content retrieval, filtering
- **Update**: Content editing, versioning
- **Delete**: Content deletion, soft delete

#### **File Handling**

- **Upload**: Image, document, video uploads
- **Download**: File downloads, access control
- **Processing**: Image resizing, format conversion

#### **Workflows**

- **Publishing**: Draft, review, publish
- **Approval**: Content approval workflow
- **Versioning**: Content version management

### **Analytics/Reporting Features**

#### **Data Aggregation**

- **Calculations**: Sum, average, count, percentage
- **Summaries**: Daily, weekly, monthly reports
- **Trends**: Growth, decline, patterns

#### **Report Generation**

- **Formats**: PDF, Excel, CSV exports
- **Templates**: Predefined report templates
- **Customization**: Custom report creation

#### **Filtering**

- **Search**: Text search, advanced search
- **Sort**: By date, amount, name, etc.
- **Pagination**: Page-based navigation

## **14. Quality Constraints**

### **Language Consistency**

#### **Vietnamese Prose**

- **Descriptions**: Easy for Vietnamese developers to understand.
- **Test scenarios**: Clear, natural language.
- **Benefits**: Better readability and understanding.

#### **English Technical Terms**

- **Code**: Function names, variable names.
- **Technical terms**: API, database, framework terms.
- **Benefits**: Consistency with the codebase.

### **Priority Distribution**

#### **≥30% High Priority**

- **Rationale**: Focus on critical test cases.
- **Criteria**: Business impact, user impact, risk level.
- **Benefits**: Ensure the most important test cases are covered.

#### **Priority Criteria**

- **High**: Critical business logic, user-facing features.
- **Medium**: Important but not critical features.
- **Low**: Nice-to-have features, edge cases.

### **Concrete Data**

#### **No Placeholders**

- **Format**: Real, specific data values.
- **Examples**: `"Nguyễn Văn A"` instead of `"[USER_NAME]"`.
- **Benefits**: Easy to implement and debug test cases.

#### **Realistic Data**

- **Context**: Data suitable for the Vietnamese context.
- **Format**: Proper Vietnamese formatting.
- **Benefits**: Test with real-world scenarios.

## **15. Output Validation Checklist**

### **Quality Assurance**

#### **Completeness**

- **All test cases**: Ensure no test cases are missing.
- **All columns**: Ensure all columns are filled.
- **All scenarios**: Ensure all scenarios are covered.

#### **Consistency**

- **Format**: Ensure the format is correct.
- **Naming**: Ensure the naming convention is correct.
- **Structure**: Ensure the structure is correct.

#### **Accuracy**

- **Data**: Ensure the data is correct.
- **Logic**: Ensure the logic is correct.
- **Dependencies**: Ensure dependencies are correct.

### **Maintainability**

#### **Standards**

- **Consistent format**: Easy to maintain and update.
- **Clear structure**: Easy to read and understand.
- **Proper organization**: Easy to navigate and find.

#### **Debugging**

- **Clear descriptions**: Easy to debug when a test fails.
- **Proper data**: Easy to reproduce issues.
- **Good structure**: Easy to trace problems.

#### **Collaboration**

- **Shared understanding**: Easy to share with team members.
- **Clear documentation**: Easy to review and provide feedback.
- **Consistent format**: Easy to collaborate.

## **16. Rationale Summary**

### **Core Principles**

1. **Comprehensive Coverage**: Ensure all aspects of the feature are tested.
2. **Structured Organization**: Organize test cases in a clear structure.
3. **Quality Standards**: Ensure high-quality test cases.
4. **Scalability**: Can be applied to any feature.
5. **Maintainability**: Easy to maintain and update.
6. **Realistic Testing**: Use realistic data for testing.
7. **Clear Documentation**: Easy to read and understand.
8. **Actionable Output**: Can be implemented immediately.

### **Key Benefits**

- **Time Saving**: Reduce time spent writing test cases.
- **Quality Improvement**: Higher test quality.
- **Consistency**: Consistent test structure.
- **Coverage**: Complete test coverage.
- **Maintainability**: Easy to maintain and update.
- **Scalability**: Can be applied to any feature.
- **Team Collaboration**: Easy to share and collaborate.

### **Technical Excellence**

- **Jest Best Practices**: Use Jest correctly.
- **BDD Format**: Clear, maintainable test structure.
- **Vietnamese Data**: Realistic, localized test data.
- **Error Handling**: Comprehensive error scenario coverage.
- **Edge Cases**: Thorough boundary condition testing.
- **Performance**: Efficient test execution.

### **Business Value**

- **Risk Reduction**: Reduce the risk of bugs in production.
- **Quality Assurance**: Ensure feature quality.
- **Team Efficiency**: Increase team productivity.
- **Customer Satisfaction**: Better user experience.
- **Cost Reduction**: Reduce the cost of bug fixes.

This prompt is designed to create a complete, high-quality test case matrix that can be applied to any feature in the system. It addresses problems of test coverage, consistency, and quality, while providing a scalable framework for generating test cases.
