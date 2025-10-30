# test-cases-matrix-categories.md

## Test Cases Matrix for Categories Feature

**Feature:** Categories Management  
**Modules:** `controllers/categoryController.js`, `services/category.service.js`, `models/Category.js`, `routes/categoryRoutes.js`, `controllers/dashboardController.js`  
**Generated:** 2025-01-28  
**Total Test Cases:** 52

---

## Test Case Matrix

| Test ID     | Category          | Test Scenario                                           | Pre-conditions                           | Test Steps                                                                                                                                  | Test Data                                                     | Expected Result                                                           | Priority | Dependencies                                   |
| ----------- | ----------------- | ------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- | -------- | ---------------------------------------------- |
| **CAT-001** | Unit - Model      | Slug generation from simple category name               | MongoDB connected, Category model loaded | 1. Create category instance with name "Running"<br>2. Trigger save operation<br>3. Verify slug field                                        | `{ name: "Running", description: "Running shoes" }`           | Slug is auto-generated as "running"                                       | HIGH     | Category Model, Mongoose                       |
| **CAT-002** | Unit - Model      | Slug generation with multiple words                     | MongoDB connected                        | 1. Create category with name "Basketball Shoes"<br>2. Save document<br>3. Check slug value                                                  | `{ name: "Basketball Shoes" }`                                | Slug = "basketball-shoes" (lowercase, hyphenated)                         | HIGH     | Category Model                                 |
| **CAT-003** | Unit - Model      | Slug handles special characters                         | MongoDB connected                        | 1. Create category with name "Men's Shoes & Boots"<br>2. Save to database<br>3. Verify slug transformation                                  | `{ name: "Men's Shoes & Boots" }`                             | Slug = "men-s-shoes-boots" (special chars converted to hyphens)           | HIGH     | Category Model                                 |
| **CAT-004** | Unit - Model      | Slug handles multiple spaces                            | MongoDB connected                        | 1. Create category with name "Outdoor Adventure"<br>2. Trigger pre-save hook<br>3. Validate slug                                            | `{ name: "Outdoor   Adventure" }`                             | Slug = "outdoor-adventure" (multiple spaces become single hyphen)         | MEDIUM   | Category Model                                 |
| **CAT-005** | Unit - Model      | Slug removes leading/trailing hyphens                   | MongoDB connected                        | 1. Create category with name "-Hiking-"<br>2. Save document<br>3. Check slug                                                                | `{ name: "-Hiking-" }`                                        | Slug = "hiking" (hyphens trimmed)                                         | MEDIUM   | Category Model                                 |
| **CAT-006** | Unit - Model      | Default status value when not provided                  | MongoDB connected                        | 1. Create category without status field<br>2. Save to DB<br>3. Verify status value                                                          | `{ name: "Casual" }`                                          | status = true (default value applied)                                     | MEDIUM   | Category Model                                 |
| **CAT-007** | Unit - Model      | Default description as empty string                     | MongoDB connected                        | 1. Create category without description<br>2. Save document<br>3. Check description field                                                    | `{ name: "Sports" }`                                          | description = "" (empty string)                                           | LOW      | Category Model                                 |
| **CAT-008** | Unit - Model      | Validation error when name is missing                   | MongoDB connected                        | 1. Attempt to create category without name<br>2. Catch validation error                                                                     | `{ description: "Test description" }`                         | Throws Mongoose validation error: "name is required"                      | HIGH     | Category Model                                 |
| **CAT-009** | Unit - Service    | Get all categories without filter                       | Categories exist in DB                   | 1. Call CategoryService.getCategories(null)<br>2. Verify returned array                                                                     | Mock: 5 categories in DB                                      | Returns array of all 5 categories, sorted by name                         | HIGH     | CategoryService, Category Model                |
| **CAT-010** | Unit - Service    | Filter categories by productType='shoes'                | Categories with different types exist    | 1. Call getCategories('shoes')<br>2. Verify filter logic<br>3. Check returned categories                                                    | Mock: 3 shoe categories, 2 clothing                           | Returns only shoe-related categories (Sneaker, Basketball, Running)       | HIGH     | CategoryService                                |
| **CAT-011** | Unit - Service    | Filter categories by productType='clothing'             | Mixed categories in DB                   | 1. Call getCategories('clothing')<br>2. Validate filtering                                                                                  | Mock: 2 clothing, 3 shoes                                     | Returns only clothing categories (Tops, Bottoms, T-Shirts)                | HIGH     | CategoryService                                |
| **CAT-012** | Unit - Service    | Filter categories by productType='accessory'            | Accessory categories exist               | 1. Call getCategories('accessory')<br>2. Check results                                                                                      | Mock: 2 accessories, 3 others                                 | Returns accessory categories (Backpacks, Beanies, Socks)                  | MEDIUM   | CategoryService                                |
| **CAT-013** | Unit - Service    | ProductType='all' returns all categories                | Categories exist                         | 1. Call getCategories('all')<br>2. Compare with null filter                                                                                 | Mock: 5 categories                                            | Returns all categories (same as null)                                     | MEDIUM   | CategoryService                                |
| **CAT-014** | Unit - Service    | Invalid productType returns empty array                 | Categories exist                         | 1. Call getCategories('invalidType')<br>2. Verify result                                                                                    | Mock: 5 categories                                            | Returns empty array (no matches)                                          | LOW      | CategoryService                                |
| **CAT-015** | Unit - Service    | Get category by valid ID - exists                       | Category with ID exists                  | 1. Call getCategoryById(validId)<br>2. Verify returned object                                                                               | `validId = "507f1f77bcf86cd799439011"`                        | Returns category document with matching \_id                              | HIGH     | CategoryService, Mongoose                      |
| **CAT-016** | Unit - Service    | Get category by invalid ObjectId format                 | N/A                                      | 1. Call getCategoryById('invalid123')<br>2. Catch error                                                                                     | `id = "invalid123"`                                           | Throws error: "Invalid category ID"                                       | HIGH     | CategoryService, Mongoose                      |
| **CAT-017** | Unit - Service    | Get category by valid ID - not exists                   | Valid ObjectId, no matching category     | 1. Call getCategoryById(nonExistentId)<br>2. Catch error                                                                                    | `id = "507f1f77bcf86cd799439099"`                             | Throws error: "Category not found with id of..."                          | HIGH     | CategoryService                                |
| **CAT-018** | Unit - Service    | Create category with valid data                         | DB connected                             | 1. Call createCategory(validData)<br>2. Verify creation<br>3. Check slug generation                                                         | `{ name: "Golf", description: "Golf shoes" }`                 | Category created successfully with auto-generated slug "golf"             | HIGH     | CategoryService                                |
| **CAT-019** | Unit - Service    | Create category without description                     | DB connected                             | 1. Call createCategory({ name: "Test" })<br>2. Verify document                                                                              | `{ name: "Test" }`                                            | Category created with empty description                                   | MEDIUM   | CategoryService                                |
| **CAT-020** | Unit - Service    | Create category without status                          | DB connected                             | 1. Call createCategory with no status<br>2. Check default value                                                                             | `{ name: "Default Status" }`                                  | status defaults to true                                                   | MEDIUM   | CategoryService                                |
| **CAT-021** | Unit - Service    | Update category name - slug regenerates                 | Category exists                          | 1. Call updateCategory(id, { name: "New Name" })<br>2. Verify slug update                                                                   | `id = valid, updateData = { name: "Golf Shoes" }`             | Category updated, slug regenerated to "golf-shoes"                        | HIGH     | CategoryService                                |
| **CAT-022** | Unit - Service    | Update category with invalid ID                         | N/A                                      | 1. Call updateCategory('invalid', data)<br>2. Catch error                                                                                   | `id = "invalid"`                                              | Throws "Invalid category ID"                                              | HIGH     | CategoryService                                |
| **CAT-023** | Unit - Service    | Update non-existent category                            | Valid ObjectId format                    | 1. Call updateCategory(nonExistentId, data)<br>2. Catch error                                                                               | `id = "507f1f77bcf86cd799439099"`                             | Throws "Category not found with id of..."                                 | MEDIUM   | CategoryService                                |
| **CAT-024** | Unit - Service    | Delete category with valid ID                           | Category exists, no products             | 1. Call deleteCategory(validId)<br>2. Verify deletion                                                                                       | `id = "507f1f77bcf86cd799439011"`                             | Category deleted successfully                                             | HIGH     | CategoryService                                |
| **CAT-025** | Unit - Service    | Delete category with invalid ID                         | N/A                                      | 1. Call deleteCategory('invalid')<br>2. Catch error                                                                                         | `id = "invalid"`                                              | Throws "Invalid category ID"                                              | HIGH     | CategoryService                                |
| **CAT-026** | Unit - Service    | Delete non-existent category                            | Valid ObjectId                           | 1. Call deleteCategory(nonExistentId)<br>2. Catch error                                                                                     | `id = "507f1f77bcf86cd799439099"`                             | Throws "Category not found with id of..."                                 | MEDIUM   | CategoryService                                |
| **CAT-027** | Unit - Controller | GET /api/categories - no filters                        | Categories exist                         | 1. Send GET request to /api/categories<br>2. Verify response structure                                                                      | N/A                                                           | HTTP 200, `{ success: true, count: 5, data: [...] }`                      | HIGH     | CategoryController, CategoryService            |
| **CAT-028** | Unit - Controller | GET /api/categories?productType=shoes                   | Shoe categories exist                    | 1. Send GET with query param<br>2. Check filtered results                                                                                   | `?productType=shoes`                                          | HTTP 200 with only shoe categories                                        | HIGH     | CategoryController                             |
| **CAT-029** | Unit - Controller | GET /api/categories/:id with valid ID                   | Category exists                          | 1. Send GET /api/categories/{validId}<br>2. Verify single category returned                                                                 | `id = "507f1f77bcf86cd799439011"`                             | HTTP 200, `{ success: true, data: category }`                             | HIGH     | CategoryController                             |
| **CAT-030** | Unit - Controller | GET /api/categories/:id with invalid ID                 | N/A                                      | 1. Send GET with invalid ID<br>2. Expect error response                                                                                     | `id = "invalid123"`                                           | HTTP 404, error message                                                   | MEDIUM   | CategoryController                             |
| **CAT-031** | Unit - Controller | POST /api/categories with valid data (admin)            | Authenticated as admin                   | 1. Send POST with valid category data<br>2. Include auth token<br>3. Verify creation                                                        | `{ name: "New Category", description: "Test" }` + admin token | HTTP 201, `{ success: true, data: createdCategory }`                      | HIGH     | CategoryController, Auth Middleware            |
| **CAT-032** | Unit - Controller | POST /api/categories without auth token                 | No authentication                        | 1. Send POST without Authorization header<br>2. Expect rejection                                                                            | Valid category data, no token                                 | HTTP 401 Unauthorized                                                     | HIGH     | CategoryController, Auth Middleware            |
| **CAT-033** | Unit - Controller | POST /api/categories as non-admin user                  | Authenticated as regular user            | 1. Send POST with regular user token<br>2. Expect permission denied                                                                         | Valid data + user token (not admin)                           | HTTP 403 Forbidden                                                        | HIGH     | CategoryController, Role Middleware            |
| **CAT-034** | Unit - Controller | PUT /api/categories/:id (admin)                         | Category exists, admin auth              | 1. Send PUT with updated data<br>2. Include admin token<br>3. Verify update                                                                 | `id = valid, body = { name: "Updated" }` + admin token        | HTTP 200, `{ success: true, data: updatedCategory }`                      | HIGH     | CategoryController                             |
| **CAT-035** | Unit - Controller | DELETE /api/categories/:id (admin)                      | Category exists, no products, admin auth | 1. Send DELETE request<br>2. Include admin token<br>3. Confirm deletion                                                                     | `id = valid` + admin token                                    | HTTP 200, `{ success: true, data: {} }`                                   | HIGH     | CategoryController                             |
| **CAT-036** | Unit - Dashboard  | Create category with unique name                        | No duplicate exists                      | 1. Call DashboardController.createCategory<br>2. Verify duplicate check<br>3. Create category                                               | `{ name: "Unique Name", description: "..." }`                 | HTTP 201, category created                                                | HIGH     | DashboardController, Category Model            |
| **CAT-037** | Unit - Dashboard  | Create category with duplicate name (exact match)       | Category "Running" exists                | 1. Attempt to create category named "Running"<br>2. Expect duplicate error                                                                  | `{ name: "Running" }` (existing category)                     | HTTP 400, "Category with this name already exists"                        | HIGH     | DashboardController                            |
| **CAT-038** | Unit - Dashboard  | Create category with duplicate name (case-insensitive)  | Category "Running" exists                | 1. Attempt to create "RUNNING"<br>2. Verify case-insensitive check                                                                          | `{ name: "RUNNING" }`                                         | HTTP 400, duplicate error (case-insensitive match)                        | HIGH     | DashboardController                            |
| **CAT-039** | Unit - Dashboard  | Update category to unique name                          | Category exists                          | 1. Update category name to new unique value<br>2. Verify no conflict                                                                        | `{ name: "UniqueNewName" }`                                   | HTTP 200, category updated                                                | MEDIUM   | DashboardController                            |
| **CAT-040** | Unit - Dashboard  | Update category to duplicate name                       | Two categories exist                     | 1. Update category A to name of category B<br>2. Expect conflict error                                                                      | `categoryA.name = categoryB.name`                             | HTTP 400, "Category with this name already exists"                        | HIGH     | DashboardController                            |
| **CAT-041** | Unit - Dashboard  | Delete category with associated products                | Category has 5 products                  | 1. Attempt to delete category<br>2. Check product count<br>3. Expect rejection                                                              | `categoryId` linked to 5 products                             | HTTP 400, "Cannot delete category. It has 5 products associated with it." | HIGH     | DashboardController, Product Model             |
| **CAT-042** | Unit - Dashboard  | Delete category without products                        | Category has 0 products                  | 1. Check product count (0)<br>2. Delete category<br>3. Confirm deletion                                                                     | `categoryId` with no products                                 | HTTP 200, "Category deleted successfully"                                 | HIGH     | DashboardController                            |
| **CAT-043** | Unit - Dashboard  | Activate inactive category                              | Category with status=false               | 1. Call activateCategory(id)<br>2. Verify status change                                                                                     | `categoryId, status=false`                                    | HTTP 200, status changed to true                                          | MEDIUM   | DashboardController                            |
| **CAT-044** | Unit - Dashboard  | Deactivate active category                              | Category with status=true                | 1. Call deactivateCategory(id)<br>2. Verify status change                                                                                   | `categoryId, status=true`                                     | HTTP 200, status changed to false                                         | MEDIUM   | DashboardController                            |
| **CAT-045** | Integration       | Full CRUD lifecycle                                     | DB connected, authenticated admin        | 1. Create new category<br>2. Read category by ID<br>3. Update category name<br>4. Delete category<br>5. Verify each step                    | Complete category object through lifecycle                    | All operations succeed, data consistent at each step                      | HIGH     | All controllers, services, models              |
| **CAT-046** | Integration       | Category-Product relationship - delete with products    | Category linked to products              | 1. Create category<br>2. Create products referencing category<br>3. Attempt to delete category<br>4. Verify rejection                       | 1 category + 3 products                                       | Delete blocked, error message about product count                         | HIGH     | Category & Product Models, DashboardController |
| **CAT-047** | Integration       | Category-Product relationship - delete without products | Category exists, no products             | 1. Create category<br>2. Verify no products linked<br>3. Delete category<br>4. Confirm deletion                                             | 1 category, 0 products                                        | Category deleted successfully                                             | HIGH     | Category & Product Models                      |
| **CAT-048** | Integration       | Filter products by category                             | Products with category references        | 1. Create category<br>2. Create 3 products in category<br>3. Call GET /api/products?category=categoryId<br>4. Verify filtering              | 1 category, 3 products in category, 2 products in other       | Returns only 3 products in specified category                             | HIGH     | ProductController, CategoryService             |
| **CAT-049** | Integration       | List categories with productType filter                 | Mixed categories in DB                   | 1. Seed DB with shoes, clothing, accessory categories<br>2. Call GET /api/categories?productType=shoes<br>3. Verify correct subset returned | 3 shoes, 2 clothing, 2 accessory categories                   | Returns only 3 shoe categories                                            | MEDIUM   | CategoryController, CategoryService            |
| **CAT-050** | Edge Case         | Handle orphaned products when category deleted          | Products reference deleted category ID   | 1. Force delete category (bypass validation)<br>2. Query products with deleted category reference<br>3. Verify handling                     | Products with categoryId that doesn't exist                   | System should handle gracefully (depends on implementation)               | MEDIUM   | Product queries, error handling                |
| **CAT-051** | Edge Case         | Category name with only whitespace                      | Empty/whitespace name                    | 1. Attempt to create category with name " "<br>2. Expect validation error                                                                   | `{ name: "   " }`                                             | Validation error or trimmed to empty (then error)                         | MEDIUM   | Category Model, validation                     |
| **CAT-052** | Edge Case         | Very long category description                          | Description exceeds reasonable length    | 1. Create category with 10,000 character description<br>2. Verify handling                                                                  | `{ name: "Test", description: "A".repeat(10000) }`            | Should succeed (or fail gracefully if max length enforced)                | LOW      | Category Model                                 |

---

## Test Coverage Summary

### By Category Type

- **Unit - Model**: 8 test cases (CAT-001 to CAT-008)
- **Unit - Service**: 18 test cases (CAT-009 to CAT-026)
- **Unit - Controller**: 9 test cases (CAT-027 to CAT-035)
- **Unit - Dashboard**: 9 test cases (CAT-036 to CAT-044)
- **Integration**: 5 test cases (CAT-045 to CAT-049)
- **Edge Cases**: 3 test cases (CAT-050 to CAT-052)

### By Priority

- **HIGH**: 37 test cases
- **MEDIUM**: 13 test cases
- **LOW**: 2 test cases

### By Functional Area

- **Slug Generation**: 5 cases
- **CRUD Operations**: 15 cases
- **ProductType Filtering**: 6 cases
- **Duplicate Name Validation**: 4 cases
- **Product Association**: 4 cases
- **Authorization & Auth**: 4 cases
- **Error Handling**: 10 cases
- **Edge Cases**: 4 cases

---

## Test Execution Notes

### Prerequisites

1. **Test Environment Setup**

   - MongoDB test database (use `mongodb-memory-server` or Docker)
   - Test user with admin role
   - Test JWT tokens for auth testing
   - Mock data fixtures for categories and products

2. **Test Data Preparation**

   - Seed script for initial categories
   - Mock category data factory
   - Mock product data with category references
   - Auth token generator for different user roles

3. **Mocking Strategy**
   - Unit tests: Mock database models and external dependencies
   - Integration tests: Use real database with test data
   - Controllers: Mock service layer for unit tests
   - Services: Mock model layer for unit tests

### Execution Order

1. **Phase 1 - Unit Tests (Model)**: CAT-001 to CAT-008
2. **Phase 2 - Unit Tests (Service)**: CAT-009 to CAT-026
3. **Phase 3 - Unit Tests (Controller)**: CAT-027 to CAT-035
4. **Phase 4 - Unit Tests (Dashboard)**: CAT-036 to CAT-044
5. **Phase 5 - Integration Tests**: CAT-045 to CAT-049
6. **Phase 6 - Edge Cases**: CAT-050 to CAT-052

### Dependencies for Test Execution

- Jest testing framework
- Supertest (for HTTP endpoint testing)
- Sinon (for mocking and stubbing)
- mongodb-memory-server (for in-memory database)
- Factory functions for test data generation
- Auth helper functions for token generation

---

## Test Case Traceability

### Requirements Coverage

| Requirement                    | Test Cases                                                                      | Coverage |
| ------------------------------ | ------------------------------------------------------------------------------- | -------- |
| Slug auto-generation           | CAT-001 to CAT-005, CAT-021                                                     | 100%     |
| Unique category names          | CAT-037, CAT-038, CAT-040                                                       | 100%     |
| Product association validation | CAT-041, CAT-042, CAT-046, CAT-047                                              | 100%     |
| ProductType filtering          | CAT-010 to CAT-014, CAT-049                                                     | 100%     |
| CRUD operations                | CAT-018, CAT-021, CAT-024, CAT-027, CAT-029, CAT-031, CAT-034, CAT-035, CAT-045 | 100%     |
| Authorization & roles          | CAT-031, CAT-032, CAT-033                                                       | 100%     |
| Error handling                 | CAT-008, CAT-016, CAT-017, CAT-022, CAT-023, CAT-025, CAT-026, CAT-030          | 100%     |
| Default values                 | CAT-006, CAT-007, CAT-020                                                       | 100%     |

---

## Risk-Based Test Priority Matrix

| Risk Level   | Business Impact                       | Test Cases                                                                               | Execution Priority |
| ------------ | ------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------ |
| **Critical** | Data corruption, security breach      | CAT-008, CAT-032, CAT-033, CAT-037, CAT-038, CAT-041                                     | 1st (Must pass)    |
| **High**     | Feature broken, user impact           | CAT-001, CAT-009, CAT-015, CAT-018, CAT-021, CAT-024, CAT-027, CAT-031, CAT-045, CAT-046 | 2nd (Should pass)  |
| **Medium**   | Partial functionality, edge scenarios | CAT-004, CAT-005, CAT-013, CAT-023, CAT-043, CAT-044, CAT-049                            | 3rd (Nice to pass) |
| **Low**      | Minor issues, cosmetic                | CAT-007, CAT-014, CAT-052                                                                | 4th (Optional)     |

---

## Automation Recommendations

### Automated Tests (48 cases)

- All Unit tests (CAT-001 to CAT-044)
- Integration tests (CAT-045 to CAT-049)
- Edge cases (CAT-050 to CAT-052)

### Manual Verification (4 areas)

- Visual verification of slug in UI
- User experience flow for category creation
- Error message display in frontend
- Performance with large datasets

---

## Notes

- Test cases assume current implementation without parent-child category relationships
- If hierarchical categories are added in the future, additional test cases for cycles prevention and cascade delete will be needed
- Product orphaning (CAT-050) should be prevented by foreign key constraints or application-level validation
- Consider adding performance tests for large category lists (1000+ categories)
- Consider adding concurrent access tests for duplicate name checking under high load

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-28  
**Related Documents**: `output_phase1_categories.md`
