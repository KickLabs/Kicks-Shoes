# Categories – Technical & Testing Analysis

## 1. Feature Overview

### Business Purpose

The Categories feature is a fundamental organizational component of the Kicks-Shoes e-commerce application. It provides a hierarchical system to classify and organize products (shoes, clothing, accessories) into logical groups, enabling users to browse and filter products efficiently.

### Key UI Flows Involved

1. **View All Categories** - Browse all available product categories with search/filter capabilities
2. **View Category Details** - Display detailed information about a specific category
3. **Create New Category** (Admin only) - Add new product categories to the system
4. **Update Category** (Admin only) - Modify existing category information
5. **Delete Category** (Admin only) - Remove categories (with validation for associated products)
6. **Activate/Deactivate Category** (Admin only) - Toggle category status

### Main Business Rules & Success Criteria

| Rule                      | Description                                                                | Success Criteria                                    |
| ------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------- |
| **Unique Category Names** | Category names must be unique (case-insensitive)                           | System prevents duplicate category creation         |
| **Product Association**   | Categories can be linked to products                                       | Cannot delete categories with associated products   |
| **Auto-Slug Generation**  | System auto-generates URL-friendly slugs from category names               | Slug is lowercase, hyphenated, and unique           |
| **Product Type Mapping**  | Categories are mapped to product types (shoes, clothing, accessory, other) | Filtering by productType returns correct categories |
| **Status Management**     | Categories can be active or inactive                                       | Only active categories appear in public listings    |
| **Authorization**         | Only admin users can create/update/delete categories                       | Proper role-based access control enforced           |

### Why This Feature is Important for Testing

- **Core Dependency**: Categories are referenced by Products (foreign key relationship)
- **Data Integrity**: Deletion must check for product associations to prevent orphaned references
- **Authorization Critical**: Admin-only operations require robust auth/role testing
- **Business Logic**: Slug generation, name uniqueness, and product type mapping need validation
- **User Impact**: Broken categories directly impact product browsing and search functionality

---

## 2. UI/UX Flow Mapping

### Flow 1: View All Categories

| Step | UI Screen/Component | User Action                               | System Behavior                                         |
| ---- | ------------------- | ----------------------------------------- | ------------------------------------------------------- |
| 1    | AllCategories.jsx   | User navigates to `/dashboard/categories` | Component mounts and triggers `fetchCategories()`       |
| 2    | AllCategories.jsx   | System fetches categories                 | Calls `GET /api/categories` endpoint                    |
| 3    | Backend API         | API processes request                     | CategoryController.getCategories executes               |
| 4    | CategoryService     | Service retrieves data                    | Fetches all categories from MongoDB, sorted by name     |
| 5    | AllCategories.jsx   | Component receives response               | Renders grid of CategoryCard components with pagination |
| 6    | AllCategories.jsx   | User enters search term                   | Filters categories by name/description locally          |

### Flow 2: Create New Category (Admin)

| Step | UI Screen/Component | User Action                       | System Behavior                                     |
| ---- | ------------------- | --------------------------------- | --------------------------------------------------- |
| 1    | AllCategories.jsx   | User clicks "ADD NEW CATEGORY"    | Redirects to `/dashboard/categories/add-new`        |
| 2    | CategoryDetail.jsx  | Component loads in "add-new" mode | Empty form displayed                                |
| 3    | CategoryDetail.jsx  | User enters name and description  | Form validation on input                            |
| 4    | CategoryDetail.jsx  | User clicks "Create Category"     | Validates form (name required)                      |
| 5    | CategoryDetail.jsx  | Valid form submission             | Calls `POST /api/categories` with auth headers      |
| 6    | Backend API         | Auth middleware validates token   | Checks JWT token and admin role                     |
| 7    | CategoryController  | Controller receives request       | Calls CategoryService.createCategory                |
| 8    | CategoryService     | Service creates category          | MongoDB creates document with auto-generated slug   |
| 9    | Category Model      | Pre-save hook executes            | Generates slug from name                            |
| 10   | CategoryDetail.jsx  | Success response received         | Shows success message, redirects to categories list |

### Flow 3: Update Category (Admin)

| Step | UI Screen/Component | User Action                              | System Behavior                                        |
| ---- | ------------------- | ---------------------------------------- | ------------------------------------------------------ |
| 1    | AllCategories.jsx   | User clicks edit button on category card | Redirects to `/dashboard/categories/{id}`              |
| 2    | CategoryDetail.jsx  | Component mounts                         | Calls `GET /api/categories/{id}` to fetch details      |
| 3    | CategoryDetail.jsx  | Form populated with existing data        | User can modify name/description                       |
| 4    | CategoryDetail.jsx  | User clicks "Update Category"            | Validates form and calls `PUT /api/categories/{id}`    |
| 5    | Backend API         | Update request processed                 | Validates category ID, checks name uniqueness          |
| 6    | CategoryService     | Service updates category                 | Updates document with `new: true, runValidators: true` |
| 7    | CategoryDetail.jsx  | Success response received                | Shows success message, redirects to list               |

### Flow 4: Delete Category (Admin)

| Step | UI Screen/Component | User Action                         | System Behavior                                           |
| ---- | ------------------- | ----------------------------------- | --------------------------------------------------------- |
| 1    | CategoryCard.jsx    | User clicks delete button           | Triggers `onDelete(categoryId)` callback                  |
| 2    | AllCategories.jsx   | Delete handler executes             | Calls `DELETE /api/categories/{id}` with auth headers     |
| 3    | Backend API         | Delete request processed            | Validates admin role and category existence               |
| 4    | CategoryService     | Service checks product associations | Queries Product collection for category reference         |
| 5    | CategoryService     | No products found                   | Deletes category via `category.deleteOne()`               |
| 6    | CategoryService     | Products exist                      | Throws error: "Cannot delete category. It has X products" |
| 7    | AllCategories.jsx   | Success response                    | Refreshes category list                                   |

### Flow 5: Filter Products by Category

| Step | UI Screen/Component | User Action                  | System Behavior                                 |
| ---- | ------------------- | ---------------------------- | ----------------------------------------------- |
| 1    | Product Listing     | User selects category filter | Adds category ID to query params                |
| 2    | Frontend            | Request sent                 | Calls `GET /api/products?category={categoryId}` |
| 3    | ProductController   | getAllProducts processes     | Filters products by category reference          |
| 4    | ProductService      | Builds MongoDB query         | `{ category: ObjectId(categoryId) }`            |
| 5    | Frontend            | Products displayed           | Shows only products matching selected category  |

---

## 3. Related Files, Components & Modules

### Backend Components

| File/Path                                        | Layer                  | Responsibility                            | Key Methods/Props/States                                                                                                      |
| ------------------------------------------------ | ---------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/models/Category.js`                 | Model/Schema           | Defines Category data structure and hooks | **Schema**: name, slug, description, status, timestamps<br>**Hook**: Pre-save slug generation                                 |
| `backend/src/controllers/categoryController.js`  | Controller             | Handles HTTP requests for categories      | `getCategories()`, `getCategory()`, `createCategory()`, `updateCategory()`, `deleteCategory()`                                |
| `backend/src/services/category.service.js`       | Service/Business Logic | Contains category business logic          | `getCategories(productType)`, `getCategoryById(id)`, `createCategory(data)`, `updateCategory(id, data)`, `deleteCategory(id)` |
| `backend/src/routes/categoryRoutes.js`           | Routes                 | Maps endpoints to controllers             | Public: GET `/`, GET `/:id`<br>Admin: POST `/`, PUT `/:id`, DELETE `/:id`, PATCH `/:id/status`                                |
| `backend/src/controllers/dashboardController.js` | Controller             | Dashboard-specific category operations    | `createCategory()`, `updateCategory()`, `deleteCategory()`, `activateCategory()`, `deactivateCategory()`                      |
| `backend/src/models/Product.js`                  | Model                  | References Category via foreign key       | **Field**: `category: ObjectId ref 'Category'`<br>**Static**: `findByCategory(categoryId)`                                    |

### Frontend Components

| File/Path                                                                 | Layer        | Responsibility                     | Key Methods/Props/States                                                                                                                         |
| ------------------------------------------------------------------------- | ------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/src/components/pages/categories/AllCategories.jsx`              | UI Page      | Main categories listing page       | **State**: categories, filteredCategories, currentPage, searchTerm<br>**Methods**: fetchCategories(), handleDeleteCategory(), handlePageChange() |
| `frontend/src/components/pages/categories/CategoryDetail.jsx`             | UI Page      | Create/Edit category form          | **State**: category, loading, pageLoading<br>**Methods**: handleCreate(), handleUpdate(), handleDelete(), validateForm()                         |
| `frontend/src/components/pages/categories/components/CategoryCard.jsx`    | UI Component | Displays individual category card  | **Props**: category, onDelete<br>**Methods**: handleEdit(), handleDelete()                                                                       |
| `frontend/src/components/pages/listing-page/components/CategoryPanel.jsx` | UI Component | Category filter panel for products | Used in product filtering UI                                                                                                                     |
| `frontend/src/services/dashboardService.js`                               | API Service  | Frontend API calls for dashboard   | `createCategory()`, `updateCategory()`, `deleteCategory()`, `activateCategory()`, `deactivateCategory()`                                         |
| `frontend/src/components/pages/categories/categories.css`                 | Styles       | CSS for category components        | Category card, grid, pagination styles                                                                                                           |

### Middleware & Utilities

| File/Path                                     | Layer      | Responsibility               | Key Methods/Props/States             |
| --------------------------------------------- | ---------- | ---------------------------- | ------------------------------------ |
| `backend/src/middlewares/auth.middleware.js`  | Middleware | JWT authentication           | `protect()`, `optionalAuth()`        |
| `backend/src/middlewares/role.middleware.js`  | Middleware | Role-based authorization     | `requireAdmin()`, `requireShop()`    |
| `backend/src/middlewares/async.middleware.js` | Middleware | Async error handling wrapper | `asyncHandler()`                     |
| `backend/src/utils/errorResponse.js`          | Utility    | Custom error response class  | `ErrorResponse(message, statusCode)` |
| `backend/src/utils/logger.js`                 | Utility    | Logging service              | `logger.info()`, `logger.error()`    |

---

## 4. Core Functions / Methods to Test

### 4.1 Category Model - Slug Generation

**Location**: `backend/src/models/Category.js` (lines 41-49)

- **Purpose:** Auto-generate URL-friendly slug from category name before saving
- **Inputs + Types:**
  - `this.name` (String) - Category name to convert to slug
- **Outputs / Return:**
  - Sets `this.slug` (String) - Lowercase, hyphenated slug
- **State Change / Side Effects:**
  - Modifies `this.slug` field
  - Only triggers when `name` is modified
- **Edge Cases:**
  - Special characters (é, ñ, &, etc.) → Converted to hyphens
  - Multiple spaces → Single hyphen
  - Leading/trailing hyphens → Removed
  - Unicode characters → Non-alphanumeric removed
  - Empty name → Empty slug
- **Dependencies (mock needed?):**
  - None (pure transformation)

---

### 4.2 CategoryService.getCategories(productType)

**Location**: `backend/src/services/category.service.js` (lines 18-78)

- **Purpose:** Retrieve all categories, optionally filtered by product type
- **Inputs + Types:**
  - `productType` (String|null) - One of: 'shoes', 'clothing', 'accessory', 'other', 'all', or null
- **Outputs / Return:**
  - `Promise<Array<Category>>` - Array of category documents
- **State Change / Side Effects:**
  - Queries MongoDB
  - Logs info/error messages
- **Edge Cases:**
  - `productType = null` → Returns ALL categories
  - `productType = 'all'` → Returns ALL categories
  - `productType = 'shoes'` → Returns only shoe-related categories (Sneaker, Basketball, Running, etc.)
  - `productType = 'invalid'` → Returns empty array (no matching categories)
  - Database error → Throws error with log
- **Dependencies (mock needed?):**
  - **Category Model** (mock for unit tests)
  - **logger** (mock to verify logging)

---

### 4.3 CategoryService.getCategoryById(id)

**Location**: `backend/src/services/category.service.js` (lines 85-103)

- **Purpose:** Fetch a single category by MongoDB ObjectId
- **Inputs + Types:**
  - `id` (String) - MongoDB ObjectId as string
- **Outputs / Return:**
  - `Promise<Category>` - Category document
  - Throws error if not found or invalid ID
- **State Change / Side Effects:**
  - Queries MongoDB
  - Logs info/error messages
- **Edge Cases:**
  - Valid ID, category exists → Returns category
  - Valid ID, category doesn't exist → Throws "Category not found with id of {id}"
  - Invalid ObjectId format → Throws "Invalid category ID"
  - null/undefined ID → Throws "Invalid category ID"
- **Dependencies (mock needed?):**
  - **Category.findById()** (mock)
  - **mongoose.Types.ObjectId.isValid()** (mock)
  - **logger** (mock)

---

### 4.4 CategoryService.createCategory(categoryData)

**Location**: `backend/src/services/category.service.js` (lines 110-124)

- **Purpose:** Create a new category in the database
- **Inputs + Types:**
  - `categoryData` (Object):
    - `name` (String, required)
    - `description` (String, optional)
    - `status` (Boolean, optional, default: true)
- **Outputs / Return:**
  - `Promise<Category>` - Newly created category with auto-generated slug
- **State Change / Side Effects:**
  - Creates document in MongoDB
  - Triggers pre-save hook for slug generation
  - Logs info/error messages
- **Edge Cases:**
  - Valid data → Creates category successfully
  - Missing name → Mongoose validation error
  - Duplicate name → Should fail (validation in controller/dashboard)
  - Empty description → Saves with empty string
  - No status provided → Defaults to true
- **Dependencies (mock needed?):**
  - **Category.create()** (mock)
  - **logger** (mock)

---

### 4.5 CategoryService.updateCategory(id, updateData)

**Location**: `backend/src/services/category.service.js` (lines 132-156)

- **Purpose:** Update an existing category
- **Inputs + Types:**
  - `id` (String) - Category ObjectId
  - `updateData` (Object) - Fields to update
- **Outputs / Return:**
  - `Promise<Category>` - Updated category document
- **State Change / Side Effects:**
  - Updates MongoDB document
  - Runs validators
  - Triggers slug regeneration if name changed
  - Logs info/error messages
- **Edge Cases:**
  - Valid ID, category exists → Updates successfully
  - Invalid ID → Throws "Invalid category ID"
  - Category not found → Throws "Category not found with id of {id}"
  - Name update → Re-generates slug
  - Validation error → Throws Mongoose validation error
- **Dependencies (mock needed?):**
  - **Category.findByIdAndUpdate()** (mock)
  - **mongoose.Types.ObjectId.isValid()** (mock)
  - **logger** (mock)

---

### 4.6 CategoryService.deleteCategory(id)

**Location**: `backend/src/services/category.service.js` (lines 163-182)

- **Purpose:** Delete a category (without product association check - that's in dashboard controller)
- **Inputs + Types:**
  - `id` (String) - Category ObjectId
- **Outputs / Return:**
- `Promise<void>`
- **State Change / Side Effects:**
  - Deletes document from MongoDB
  - Logs info/error messages
- **Edge Cases:**
  - Valid ID, category exists → Deletes successfully
  - Invalid ID → Throws "Invalid category ID"
  - Category not found → Throws "Category not found with id of {id}"
  - **NOTE**: Product association check is in dashboardController.deleteCategory
- **Dependencies (mock needed?):**
  - **Category.findById()** (mock)
  - **category.deleteOne()** (mock)
  - **mongoose.Types.ObjectId.isValid()** (mock)
  - **logger** (mock)

---

### 4.7 CategoryController.getCategories(req, res)

**Location**: `backend/src/controllers/categoryController.js` (lines 17-30)

- **Purpose:** HTTP handler for GET /api/categories
- **Inputs + Types:**
  - `req.query.productType` (String, optional)
- **Outputs / Return:**
  - HTTP 200 with JSON: `{ success: true, count: Number, data: Array }`
- **State Change / Side Effects:**
  - Calls CategoryService.getCategories()
  - Logs request info
- **Edge Cases:**
  - No productType → Returns all categories
  - Valid productType → Returns filtered categories
  - Service error → Caught by asyncHandler middleware
- **Dependencies (mock needed?):**
  - **CategoryService.getCategories()** (mock)
  - **logger** (mock)

---

### 4.8 CategoryController.createCategory(req, res)

**Location**: `backend/src/controllers/categoryController.js` (lines 47-55)

- **Purpose:** HTTP handler for POST /api/categories
- **Inputs + Types:**
  - `req.body` (Object) - Category data
- **Outputs / Return:**
- HTTP 201: `{ success: true, data: Category }`
  - HTTP error: Handled by asyncHandler
- **State Change / Side Effects:**
  - Calls CategoryService.createCategory()
  - Logs creation info
- **Edge Cases:**
  - Valid data → Creates and returns category
  - Invalid data → Service/model throws validation error
  - **NOTE**: Duplicate name checking is in dashboardController, not here
- **Dependencies (mock needed?):**
  - **CategoryService.createCategory()** (mock)
  - **logger** (mock)

---

### 4.9 DashboardController.createCategory(req, res)

**Location**: `backend/src/controllers/dashboardController.js` (lines 872-894)

- **Purpose:** Admin-specific category creation with duplicate name check
- **Inputs + Types:**
  - `req.body`: { name, description, image, status }
- **Outputs / Return:**
- HTTP 201: `{ success: true, data: Category }`
  - HTTP 400: `{ message: 'Category with this name already exists' }`
- **State Change / Side Effects:**
  - Checks for duplicate names (case-insensitive)
  - Creates category in MongoDB
- **Edge Cases:**
  - Unique name → Creates successfully
  - Duplicate name (case-insensitive) → Returns 400 error
  - Status not provided → Defaults to true
- **Dependencies (mock needed?):**
  - **Category.findOne()** (mock)
  - **Category.create()** (mock)

---

### 4.10 DashboardController.deleteCategory(req, res)

**Location**: `backend/src/controllers/dashboardController.js` (lines 944-968)

- **Purpose:** Delete category with product association validation
- **Inputs + Types:**
  - `req.params.categoryId` (String)
- **Outputs / Return:**
  - HTTP 200: `{ success: true, message: 'Category deleted successfully' }`
  - HTTP 404: Category not found
  - HTTP 400: Category has associated products
- **State Change / Side Effects:**
  - Checks Product collection for references
  - Deletes category if no products associated
- **Edge Cases:**
  - Category exists, no products → Deletes successfully
  - Category exists, has products → Returns 400 with product count
  - Category not found → Returns 404
- **Dependencies (mock needed?):**
  - **Category.findById()** (mock)
  - **Product.countDocuments()** (mock)
  - **Category.findByIdAndDelete()** (mock)

---

### 4.11 Frontend: CategoryDetail.validateForm()

**Location**: `frontend/src/components/pages/categories/CategoryDetail.jsx` (lines 65-73)

- **Purpose:** Client-side form validation before submission
- **Inputs + Types:**
  - Uses component state: `category.name`
- **Outputs / Return:**
  - Array of error messages (empty if valid)
- **State Change / Side Effects:**
  - None (pure validation)
- **Edge Cases:**
  - Name empty/whitespace → Returns error
  - Name valid → Returns empty array
- **Dependencies (mock needed?):**
  - None (pure function)

---

### 4.12 Frontend: CategoryDetail.handleCreate()

**Location**: `frontend/src/components/pages/categories/CategoryDetail.jsx` (lines 75-142)

- **Purpose:** Handle category creation from UI
- **Inputs + Types:**
  - Uses component state: `category.name`, `category.description`
- **Outputs / Return:**
  - Sets loading state
  - Shows success/error messages
  - Redirects on success
- **State Change / Side Effects:**
  - Calls POST /api/categories
  - Updates loading state
  - Shows Ant Design messages
  - Redirects to category list
- **Edge Cases:**
  - Valid form → Creates successfully, redirects
  - Validation fails → Shows error messages, no API call
  - API 404 → Shows endpoint not found message
  - API 401 → Shows unauthorized message
  - API 403 → Shows permission denied message
  - Network error → Shows connection error
- **Dependencies (mock needed?):**
  - **axios.post()** (mock)
  - **localStorage** (mock for auth token)
  - **message** from Ant Design (mock)
  - **window.location.href** (mock for redirect)

---

### 4.13 Frontend: AllCategories.fetchCategories()

**Location**: `frontend/src/components/pages/categories/AllCategories.jsx` (lines 18-33)

- **Purpose:** Fetch all categories from API
- **Inputs + Types:**
  - None (uses axiosInstance configured base URL)
- **Outputs / Return:**
  - Updates state: categories, filteredCategories, totalCategories
- **State Change / Side Effects:**
  - Sets loading state
  - Calls GET /api/categories
  - Updates component state
  - Shows error message on failure
- **Edge Cases:**
  - Successful fetch → Updates state with data
  - API error → Shows error message, sets loading false
  - Empty response → Sets empty arrays
- **Dependencies (mock needed?):**
  - **axiosInstance.get()** (mock)
  - **message** from Ant Design (mock)

---

## 5. Test Case Matrix

### Category Model Tests

| Category       | Scenario                              | Pre-condition              | Input                              | Expected Output/Behavior                   |
| -------------- | ------------------------------------- | -------------------------- | ---------------------------------- | ------------------------------------------ |
| **Happy Path** | Create category with valid name       | Database connected         | `{ name: 'Running Shoes' }`        | Category created with slug 'running-shoes' |
| **Happy Path** | Slug auto-generation for simple name  | Model pre-save hook active | `{ name: 'Sneakers' }`             | slug = 'sneakers'                          |
| **Happy Path** | Slug handles multiple words           | Model pre-save hook active | `{ name: 'Basketball Shoes' }`     | slug = 'basketball-shoes'                  |
| **Edge Case**  | Slug handles special characters       | Model pre-save hook active | `{ name: 'Men\'s Shoes & Boots' }` | slug = 'men-s-shoes-boots'                 |
| **Edge Case**  | Slug handles multiple spaces          | Model pre-save hook active | `{ name: 'Outdoor   Adventure' }`  | slug = 'outdoor-adventure'                 |
| **Edge Case**  | Slug removes leading/trailing hyphens | Model pre-save hook active | `{ name: '-Hiking-' }`             | slug = 'hiking'                            |
| **Edge Case**  | Status defaults to true               | No status provided         | `{ name: 'Casual' }`               | category.status = true                     |
| **Edge Case**  | Description defaults to empty string  | No description provided    | `{ name: 'Sports' }`               | category.description = ''                  |
| **Error**      | Create without name                   | Model validation active    | `{ description: 'Test' }`          | Validation error: name required            |
| **Error**      | Name exceeds max length               | Model validation active    | `{ name: 'A'.repeat(300) }`        | Depends on schema validation               |

---

### CategoryService Tests

| Category       | Scenario                                 | Pre-condition                | Input                                                         | Expected Output/Behavior                                                  |
| -------------- | ---------------------------------------- | ---------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Happy Path** | Get all categories                       | Categories exist in DB       | `getCategories(null)`                                         | Returns array of all categories sorted by name                            |
| **Happy Path** | Get categories for 'shoes' product type  | Categories exist             | `getCategories('shoes')`                                      | Returns only shoe-related categories (Sneaker, Basketball, Running, etc.) |
| **Happy Path** | Get categories for 'clothing'            | Categories exist             | `getCategories('clothing')`                                   | Returns only clothing categories (Tops, Bottoms, T-Shirts, etc.)          |
| **Happy Path** | Get categories for 'accessory'           | Categories exist             | `getCategories('accessory')`                                  | Returns accessory categories (Backpacks, Beanies, Socks, etc.)            |
| **Happy Path** | Get category by valid ID                 | Category exists              | `getCategoryById('validObjectId')`                            | Returns category object                                                   |
| **Happy Path** | Create category with valid data          | DB connected                 | `createCategory({ name: 'Golf', description: 'Golf shoes' })` | Returns created category with \_id and slug                               |
| **Happy Path** | Update category name                     | Category exists              | `updateCategory(id, { name: 'Golf Shoes' })`                  | Updates category, regenerates slug                                        |
| **Happy Path** | Delete category                          | Category exists, no products | `deleteCategory(validId)`                                     | Category deleted successfully                                             |
| **Edge Case**  | Get categories with 'all' product type   | Categories exist             | `getCategories('all')`                                        | Returns all categories (same as null)                                     |
| **Edge Case**  | Get categories with invalid product type | Categories exist             | `getCategories('invalid')`                                    | Returns empty array (no matches)                                          |
| **Edge Case**  | Create category without description      | Valid name provided          | `createCategory({ name: 'Test' })`                            | Category created with empty description                                   |
| **Edge Case**  | Update non-existent field                | Category exists              | `updateCategory(id, { nonExistent: 'value' })`                | Field ignored, category updated                                           |
| **Error**      | Get category with invalid ObjectId       | N/A                          | `getCategoryById('invalid')`                                  | Throws "Invalid category ID"                                              |
| **Error**      | Get category with non-existent ID        | Valid ObjectId               | `getCategoryById('507f1f77bcf86cd799439011')`                 | Throws "Category not found with id of..."                                 |
| **Error**      | Create category without name             | DB connected                 | `createCategory({ description: 'Test' })`                     | Throws validation error                                                   |
| **Error**      | Update with invalid ID                   | N/A                          | `updateCategory('invalid', data)`                             | Throws "Invalid category ID"                                              |
| **Error**      | Delete with invalid ID                   | N/A                          | `deleteCategory('invalid')`                                   | Throws "Invalid category ID"                                              |
| **Error**      | Delete non-existent category             | Valid ObjectId               | `deleteCategory('507f1f77bcf86cd799439011')`                  | Throws "Category not found"                                               |

---

### CategoryController Tests

| Category       | Scenario                                 | Pre-condition                            | Input                                  | Expected Output/Behavior                              |
| -------------- | ---------------------------------------- | ---------------------------------------- | -------------------------------------- | ----------------------------------------------------- |
| **Happy Path** | GET /api/categories                      | Categories exist                         | `req.query = {}`                       | HTTP 200, { success: true, count: N, data: [...] }    |
| **Happy Path** | GET /api/categories?productType=shoes    | Categories exist                         | `req.query.productType = 'shoes'`      | HTTP 200 with filtered categories                     |
| **Happy Path** | GET /api/categories/:id                  | Category exists                          | `req.params.id = validId`              | HTTP 200, { success: true, data: category }           |
| **Happy Path** | POST /api/categories (admin)             | Authenticated admin                      | `req.body = { name: 'New' }`           | HTTP 201, { success: true, data: category }           |
| **Happy Path** | PUT /api/categories/:id (admin)          | Category exists, admin auth              | `req.body = { name: 'Updated' }`       | HTTP 200, { success: true, data: category }           |
| **Happy Path** | DELETE /api/categories/:id (admin)       | Category exists, no products, admin auth | `req.params.id = validId`              | HTTP 200, { success: true, data: {} }                 |
| **Error**      | GET /api/categories/:id with invalid ID  | N/A                                      | `req.params.id = 'invalid'`            | HTTP 404, error message                               |
| **Error**      | POST /api/categories without auth        | No auth token                            | `req.body = { name: 'Test' }`          | HTTP 401 Unauthorized                                 |
| **Error**      | POST /api/categories as non-admin        | Authenticated user (not admin)           | `req.body = { name: 'Test' }`          | HTTP 403 Forbidden                                    |
| **Error**      | DELETE /api/categories/:id with products | Category has products                    | `req.params.id = categoryWithProducts` | HTTP 400, "Cannot delete category. It has X products" |

---

### DashboardController Category Tests

| Category       | Scenario                                      | Pre-condition                 | Input                                         | Expected Output/Behavior                                                  |
| -------------- | --------------------------------------------- | ----------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| **Happy Path** | Create category with unique name              | No duplicate                  | `{ name: 'Golf', description: 'Golf items' }` | HTTP 201, category created                                                |
| **Happy Path** | Update category with new unique name          | Category exists               | `{ name: 'NewName', description: 'Updated' }` | HTTP 200, category updated                                                |
| **Happy Path** | Activate category                             | Category exists, status=false | PATCH /categories/:id/activate                | status changed to true                                                    |
| **Happy Path** | Deactivate category                           | Category exists, status=true  | PATCH /categories/:id/deactivate              | status changed to false                                                   |
| **Edge Case**  | Create without status field                   | Valid name                    | `{ name: 'Test' }`                            | Category created with status=true (default)                               |
| **Edge Case**  | Update without changing name                  | Category exists               | `{ description: 'New desc' }`                 | Updates description only, no name conflict check                          |
| **Error**      | Create with duplicate name (exact match)      | Category 'Running' exists     | `{ name: 'Running' }`                         | HTTP 400, "Category with this name already exists"                        |
| **Error**      | Create with duplicate name (case-insensitive) | Category 'Running' exists     | `{ name: 'RUNNING' }`                         | HTTP 400, duplicate error                                                 |
| **Error**      | Update to duplicate name                      | Two categories exist          | `{ name: 'ExistingCategory' }`                | HTTP 400, duplicate error                                                 |
| **Error**      | Delete category with products                 | Category has 5 products       | DELETE /categories/:id                        | HTTP 400, "Cannot delete category. It has 5 products associated with it." |
| **Error**      | Update non-existent category                  | Category doesn't exist        | PUT /categories/nonExistentId                 | HTTP 404, "Category not found"                                            |
| **Error**      | Delete non-existent category                  | Category doesn't exist        | DELETE /categories/nonExistentId              | HTTP 404, "Category not found"                                            |

---

### Frontend Component Tests

| Category       | Scenario                                  | Pre-condition                      | Input                            | Expected Output/Behavior                 |
| -------------- | ----------------------------------------- | ---------------------------------- | -------------------------------- | ---------------------------------------- |
| **Happy Path** | AllCategories loads and displays          | API returns categories             | Component mounts                 | Fetches categories, displays grid        |
| **Happy Path** | Search filters categories by name         | Categories loaded                  | User types 'run'                 | Shows only categories with 'run' in name |
| **Happy Path** | Search filters by description             | Categories loaded                  | User types keyword               | Shows matching categories                |
| **Happy Path** | Pagination changes page                   | 20 categories loaded (pageSize=12) | User clicks page 2               | Displays items 13-20                     |
| **Happy Path** | CategoryDetail creates new category       | Form in add-new mode               | User fills form, clicks Create   | API called, success message, redirect    |
| **Happy Path** | CategoryDetail updates category           | Form in edit mode                  | User changes name, clicks Update | API called, success message, redirect    |
| **Happy Path** | CategoryDetail validates before submit    | Form has empty name                | User clicks Create               | Shows error, no API call                 |
| **Happy Path** | Delete category from card                 | Category exists                    | User clicks delete               | Confirmation, API call, list refreshes   |
| **Edge Case**  | AllCategories with empty results          | API returns empty array            | Component mounts                 | Shows empty state                        |
| **Edge Case**  | Search with no matches                    | Categories loaded                  | User types 'xyz'                 | Shows no results                         |
| **Edge Case**  | CategoryDetail cancel button              | Form has changes                   | User clicks Cancel               | Redirects without saving                 |
| **Error**      | AllCategories API failure                 | API returns error                  | Component mounts                 | Shows error message                      |
| **Error**      | CategoryDetail create 401                 | No auth token                      | User submits form                | Shows "Unauthorized" message             |
| **Error**      | CategoryDetail create 403                 | User not admin                     | User submits form                | Shows "Permission denied" message        |
| **Error**      | CategoryDetail create 404                 | API endpoint not found             | User submits form                | Shows "API endpoint not found" message   |
| **Error**      | CategoryDetail update with duplicate name | Another category exists            | User changes to duplicate name   | API returns 400, shows error message     |

---

### Integration Tests

| Category        | Scenario                              | Pre-condition                | Input                              | Expected Output/Behavior                     |
| --------------- | ------------------------------------- | ---------------------------- | ---------------------------------- | -------------------------------------------- |
| **Integration** | Full category lifecycle               | DB empty                     | Create → Read → Update → Delete    | All operations succeed in sequence           |
| **Integration** | Product-Category relationship         | Category and Product exist   | Delete category with products      | Deletion blocked                             |
| **Integration** | Product-Category relationship         | Category exists, no products | Delete category                    | Deletion succeeds                            |
| **Integration** | Category filtering in product listing | Products with categories     | GET /products?category=categoryId  | Returns only products in that category       |
| **Integration** | Slug uniqueness constraint            | Category exists              | Create another with same slug      | Should handle via name uniqueness (indirect) |
| **Integration** | Auth + Role flow                      | User logged in               | Non-admin tries to create category | Blocked at middleware level                  |

---

## 6. Test Priority Recommendation

### HIGH Priority

| Module/Function                               | Justification                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| **CategoryService.createCategory()**          | Core business logic; creates data foundation; errors impact all features    |
| **CategoryService.deleteCategory()**          | High risk: can orphan products if validation fails; data integrity critical |
| **DashboardController.deleteCategory()**      | Contains product association check; prevents data corruption                |
| **DashboardController.createCategory()**      | Duplicate name validation; prevents data inconsistency                      |
| **Category Model slug generation**            | Affects URLs and SEO; bugs impact discoverability                           |
| **Auth + Role middleware**                    | Security critical; prevents unauthorized access                             |
| **Product-Category foreign key relationship** | Data integrity; broken links break product browsing                         |

**Reasoning**: These functions handle data integrity, security, and core business rules. Failures here cascade to break product listings, search, and filtering.

---

### MEDIUM Priority

| Module/Function                        | Justification                                     |
| -------------------------------------- | ------------------------------------------------- |
| **CategoryService.getCategories()**    | Read operation; lower risk but critical for UI    |
| **CategoryService.getCategoryById()**  | Read operation; used by detail views              |
| **CategoryService.updateCategory()**   | Modifies data but less risky than create/delete   |
| **CategoryController (all methods)**   | Integration layer; important but thin logic       |
| **Frontend AllCategories component**   | UI; bugs are visible but don't corrupt data       |
| **Frontend CategoryDetail validation** | Prevents bad submissions but server validates too |

**Reasoning**: These are important for user experience but have redundant validation layers or are read-only operations.

---

### LOW Priority

| Module/Function                          | Justification                                 |
| ---------------------------------------- | --------------------------------------------- |
| **Frontend search/filter functionality** | Client-side only; no data impact              |
| **Frontend pagination**                  | UI convenience; no business logic             |
| **CategoryCard component**               | Display only; minimal logic                   |
| **CSS styling**                          | Visual only; no functional impact             |
| **Logging statements**                   | Monitoring; doesn't affect core functionality |

**Reasoning**: These are UI enhancements or monitoring features that don't affect core business logic or data integrity.

---

## 7. Mocking & Test Data Preparation

### Backend Unit Tests

| Dependency                  | What to Mock             | Mocking Strategy                                                                                        | Sample Mock Data                                                                                                                                     |
| --------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category Model**          | MongoDB operations       | Use `sinon.stub()` or Jest mock for `Category.find()`, `Category.findById()`, `Category.create()`, etc. | `{ _id: '507f...', name: 'Running', slug: 'running', description: 'Running shoes', status: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }` |
| **Product Model**           | Product count queries    | Mock `Product.countDocuments()`                                                                         | `countDocuments.resolves(5)` or `countDocuments.resolves(0)`                                                                                         |
| **mongoose.Types.ObjectId** | ID validation            | Mock `isValid()` method                                                                                 | `isValid.returns(true)` or `isValid.returns(false)`                                                                                                  |
| **logger**                  | Logging calls            | Mock `logger.info()`, `logger.error()`                                                                  | Verify calls with `.calledWith()`                                                                                                                    |
| **req, res, next**          | Express request/response | Use `supertest` or mock objects                                                                         | `req = { body: {...}, params: {...}, query: {...} }`, `res = { status: sinon.stub().returnsThis(), json: sinon.stub() }`                             |

### Frontend Unit Tests

| Dependency                | What to Mock        | Mocking Strategy                                 | Sample Mock Data                                                        |
| ------------------------- | ------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| **axios / axiosInstance** | HTTP requests       | Use `jest.mock()` or `msw` (Mock Service Worker) | `{ data: { success: true, data: [...] } }`                              |
| **localStorage**          | Token storage       | Mock `getItem()`, `setItem()`                    | `{ userInfo: JSON.stringify({ token: 'fake-jwt-token' }) }`             |
| **window.location.href**  | Redirects           | Mock or spy on assignments                       | `delete window.location; window.location = { href: '' };`               |
| **Ant Design message**    | Toast notifications | Mock `message.success()`, `message.error()`      | Verify calls with `expect(message.success).toHaveBeenCalledWith('...')` |
| **React Router**          | Navigation          | Use `MemoryRouter` in tests                      | Render with `<MemoryRouter initialEntries={['/dashboard/categories']}>` |

### Integration Tests

| Dependency         | What to Mock             | Mocking Strategy                                  | Sample Mock Data                                 |
| ------------------ | ------------------------ | ------------------------------------------------- | ------------------------------------------------ |
| **MongoDB**        | Real database            | Use `mongodb-memory-server` or Docker test DB     | Seed with test categories and products           |
| **Authentication** | JWT tokens               | Generate valid test tokens or use test middleware | `{ userId: 'testUserId', role: 'admin' }`        |
| **File uploads**   | Cloudinary/image uploads | Mock cloudinary service                           | `{ url: 'https://fake-image-url.com/test.jpg' }` |

---

### Sample Test Data

```javascript
// Mock Categories
export const mockCategories = [
  {
    _id: '507f1f77bcf86cd799439011',
    name: 'Running',
    slug: 'running',
    description: 'Running shoes and gear',
    status: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439012',
    name: 'Basketball',
    slug: 'basketball',
    description: 'Basketball shoes',
    status: true,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439013',
    name: 'Casual Shoes',
    slug: 'casual-shoes',
    description: 'Everyday casual footwear',
    status: false, // Inactive category
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

// Mock Category Input Data
export const validCategoryInput = {
  name: 'Golf Shoes',
  description: 'Professional golf footwear',
};

export const invalidCategoryInput = {
  description: 'Missing name field',
};

// Mock Admin Token
export const mockAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Mock Products with Category References
export const mockProductsWithCategory = [
  {
    _id: '607f1f77bcf86cd799439021',
    name: 'Nike Air Zoom Pegasus',
    category: '507f1f77bcf86cd799439011', // Running category
    brand: 'Nike',
    price: { regular: 120, finalPrice: 120 },
  },
  {
    _id: '607f1f77bcf86cd799439022',
    name: 'Adidas Ultraboost',
    category: '507f1f77bcf86cd799439011', // Running category
    brand: 'Adidas',
    price: { regular: 180, finalPrice: 180 },
  },
];
```

---

## 8. Suggested Next Prompts

### 8.1 Generate Detailed Test Cases

```markdown
Based on the Categories Technical & Testing Analysis document, generate comprehensive test case specifications for the following modules:

1. **Category Model Tests** - Focus on slug generation, validation, and schema constraints
2. **CategoryService Tests** - Cover all CRUD operations, productType filtering, and error handling
3. **CategoryController & DashboardController Tests** - HTTP endpoint tests with auth/role scenarios
4. **Frontend Component Tests** - AllCategories, CategoryDetail, CategoryCard with user interactions

For each test case, provide:

- Test ID and name
- Setup/preconditions
- Test steps
- Expected results
- Assertions
- Teardown

Format: Markdown tables or Gherkin syntax (Given-When-Then)
```

---

### 8.2 Generate Jest Unit Test Code - Backend

```markdown
Generate Jest unit test code for the Categories feature backend components:

**Priority order:**

1. `backend/src/services/category.service.js` - All methods with mocked Category model
2. `backend/src/models/Category.js` - Slug generation pre-save hook
3. `backend/src/controllers/categoryController.js` - Controller methods with mocked service
4. `backend/src/controllers/dashboardController.js` - Admin category operations (create, update, delete with product check)

**Requirements:**

- Use Jest and Sinon for mocking
- Mock MongoDB models, logger, and mongoose utilities
- Include happy path, edge cases, and error scenarios
- Aim for 90%+ code coverage
- Follow existing test patterns in `backend/tests/` directory
- Use `describe`, `it`, `beforeEach`, `afterEach` structure

**Output:** Separate test files for each module (e.g., `category.service.test.js`, `category-model.test.js`)
```

---

### 8.3 Generate React Testing Library Tests - Frontend

```markdown
Generate React Testing Library tests for Categories frontend components:

**Components to test:**

1. `AllCategories.jsx` - Rendering, fetching, search, pagination, delete
2. `CategoryDetail.jsx` - Create mode, edit mode, validation, form submission
3. `CategoryCard.jsx` - Display, edit button, delete button

**Requirements:**

- Use React Testing Library (RTL) and Jest
- Mock axios/axiosInstance with `msw` or `jest.mock()`
- Mock Ant Design message component
- Test user interactions (click, type, submit)
- Test async data fetching and loading states
- Test error handling and edge cases
- Use `render`, `screen`, `fireEvent`, `waitFor` from RTL

**Output:** Test files following pattern `ComponentName.test.jsx`
```

---

### 8.4 Generate Integration & E2E Tests

```markdown
Generate integration and end-to-end test scenarios for the Categories feature:

**Integration Tests:**

1. Full CRUD lifecycle (Create → Read → Update → Delete)
2. Category-Product relationship (deletion validation)
3. ProductType filtering integration
4. Auth + Role middleware integration

**E2E Tests (using Supertest or similar):**

1. Admin creates category via API → Verify in database
2. User attempts to delete category with products → Should fail
3. Admin updates category name → Slug regenerates
4. Public user fetches categories by productType → Returns correct subset

**Requirements:**

- Use `mongodb-memory-server` or Docker test DB
- Use `supertest` for HTTP endpoint testing
- Set up test database seeding and cleanup
- Test with real JWT tokens (test user creation)
- Cover happy paths and critical error scenarios

**Output:** Integration test file `category-integration.test.js` and E2E test file `category-e2e.test.js`
```

---

### 8.5 Generate Mock Data Factory

```markdown
Create a comprehensive mock data factory for Categories testing:

**Generate:**

1. `backend/tests/mocks/category.mock.js` - Mock category data, fixtures, and factory functions
2. Functions to generate:
   - `createMockCategory(overrides)` - Generate single category with optional field overrides
   - `createMockCategories(count)` - Generate array of categories
   - `getMockCategoriesByProductType(productType)` - Get categories filtered by type
   - `createMockCategoryInput(valid = true)` - Generate valid/invalid input data
   - `createMockAdminUser()` - Mock admin with token
   - `createMockRegularUser()` - Mock non-admin user

**Include:**

- Edge cases: duplicate names, special characters in names, very long descriptions
- Invalid data examples for negative testing
- Mock products with category references

**Output:** Mock factory file ready to import in tests
```

---

### 8.6 Generate API Test Collection (Postman/Insomnia)

```markdown
Generate a Postman/Insomnia collection for manual and automated API testing of Categories:

**Endpoints to include:**

- GET /api/categories
- GET /api/categories?productType=shoes
- GET /api/categories/:id
- POST /api/categories (admin)
- PUT /api/categories/:id (admin)
- DELETE /api/categories/:id (admin)
- POST /api/dashboard/admin/categories (admin, with duplicate check)
- DELETE /api/dashboard/admin/categories/:id (admin, with product check)

**Include:**

- Environment variables for base URL, auth tokens
- Pre-request scripts for token generation
- Test assertions in Postman format
- Example requests and responses

**Output:** JSON file for Postman collection v2.1
```

---

### 8.7 Generate Test Documentation

```markdown
Create comprehensive testing documentation for the Categories feature:

**Documents to generate:**

1. **Test Plan** - Testing strategy, scope, resources, schedule
2. **Test Coverage Report Template** - What to measure and track
3. **Bug Report Template** - How to report issues found during testing
4. **Test Execution Checklist** - Step-by-step manual testing guide

**Include:**

- Smoke tests for quick validation
- Regression test scenarios
- Performance test considerations (loading 1000+ categories)
- Security test cases (auth, XSS, SQL injection attempts)

**Output:** Markdown files in `backend/tests/categories/docs/`
```

---

## Summary

This document provides a complete technical and testing analysis of the **Categories** feature in the Kicks-Shoes application. It covers:

✅ **Business context** and feature importance  
✅ **UI/UX flows** from user action to system response  
✅ **Complete file mapping** (backend, frontend, middleware, utilities)  
✅ **Detailed function analysis** with inputs, outputs, edge cases, and dependencies  
✅ **Comprehensive test case matrix** covering happy paths, edge cases, and errors  
✅ **Test priority recommendations** based on risk and impact  
✅ **Mocking strategies** and sample test data  
✅ **Next-step prompts** for generating actual test code

This analysis serves as the foundation for:

- Writing unit, integration, and E2E tests
- Understanding the complete feature implementation
- Identifying potential bugs and edge cases
- Planning QA test coverage

---

**Generated**: 2025-01-28  
**Feature**: Categories  
**Application**: Kicks-Shoes E-commerce Platform  
**Analysis Type**: Technical & Testing Analysis (Phase 1)
