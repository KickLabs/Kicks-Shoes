# Test Cases Matrix - Favourites Feature

> **Note**: Comprehensive test cases for the Favourites/Wishlist feature, covering Authentication, CRUD operations, Security, Integration, and Edge Case scenarios.

---

## Test Summary

| Metric               | Count |
| -------------------- | ----- |
| **Total Test Cases** | 24    |
| **High Priority**    | 13    |
| **Medium Priority**  | 6     |
| **Low Priority**     | 5     |

---

## Test Suites Breakdown

| #   | Test Suite                     | Test Cases | Status          |
| --- | ------------------------------ | ---------- | --------------- |
| 1   | Authentication & Authorization | 6          | ✅ Complete     |
| 2   | Add to Favourites - Happy Path | 2          | ✅ Complete     |
| 3   | Add to Favourites - Negative   | 6          | ✅ Complete     |
| 4   | View Favourites                | 5          | ✅ Complete     |
| 5   | Remove from Favourites         | 3          | ✅ Complete     |
| 6   | Integration & Complete Flow    | 1          | ✅ Complete     |
| 7   | Edge Cases & Data Integrity    | 3          | ✅ Complete     |
| --- | ---                            | ---        | ---             |
|     | **TOTAL**                      | **24**     | **✅ Complete** |

---

# Test Suite 1: Authentication & Authorization

**Focus**: `auth.middleware.js` protection on all routes  
**Scope**: Token validation, user isolation, unauthorized access prevention

---

| Test ID        | Category    | Test Scenario                                  | Pre-conditions                                                                    | Test Steps                                                                                                            | Test Data                                                                                                        | Expected Result                                                                                                                                                               | Priority | Dependencies                                      |
| -------------- | ----------- | ---------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------- |
| **TC-FAV-001** | Integration | Access GET favourites without authentication   | User is not logged in, API server is running                                      | 1. Send GET request to `/api/favourites`<br>2. Omit Authorization header or send invalid token<br>3. Observe response | `GET /api/favourites`<br>`Headers: {}`                                                                           | HTTP **401 Unauthorized**<br>Error message: "Not authorized, token required"                                                                                                  | High     | auth.middleware.js                                |
| **TC-FAV-002** | Integration | Access POST favourite without authentication   | User is not logged in, API server is running                                      | 1. Send POST request to `/api/favourites`<br>2. Omit Authorization header<br>3. Observe response                      | `POST /api/favourites`<br>`Headers: {}`<br>`Body: { "productId": "P123" }`                                       | HTTP **401 Unauthorized**<br>Error message: "Not authorized, token required"                                                                                                  | High     | auth.middleware.js                                |
| **TC-FAV-003** | Integration | Access DELETE favourite without authentication | User is not logged in, API server is running                                      | 1. Send DELETE request to `/api/favourites/P123`<br>2. Omit Authorization header<br>3. Observe response               | `DELETE /api/favourites/P123`<br>`Headers: {}`                                                                   | HTTP **401 Unauthorized**<br>Error message: "Not authorized, token required"                                                                                                  | High     | auth.middleware.js                                |
| **TC-FAV-016** | Security    | User B cannot access User A's favourites       | User "A" is authenticated<br>User "A" has favourites<br>User "B" is authenticated | 1. User "B" sends GET request<br>2. Observe response                                                                  | `GET /api/favourites`<br>`Headers: { Authorization: "Bearer user_B_token" }`                                     | HTTP **200 OK**<br>Response contains ONLY User "B"'s favourites (empty array if none)<br>Does NOT contain User "A"'s data                                                     | High     | favouriteController.js (user isolation)           |
| **TC-FAV-017** | Security    | User B cannot delete User A's favourite        | User "A" has "P123" in favourites<br>User "B" is authenticated                    | 1. User "B" sends DELETE request for "P123"<br>2. Observe response<br>3. Query database                               | `DELETE /api/favourites/P123`<br>`Headers: { Authorization: "Bearer user_B_token" }`                             | HTTP **404 Not Found**<br>User "A"'s favourite for "P123" still exists in database<br>Query: `db.favourites.findOne({ user: "user_A_id", product: "P123" })` returns document | High     | favouriteController.js (user isolation in delete) |
| **TC-FAV-018** | Security    | User B cannot add favourite as User A          | User "A" and "B" both exist and are authenticated                                 | 1. User "B" sends POST request with any valid productId<br>2. Query database to verify ownership                      | `POST /api/favourites`<br>`Headers: { Authorization: "Bearer user_B_token" }`<br>`Body: { "productId": "P123" }` | HTTP **201 Created**<br>Database entry has `user: "user_B_id"` (from `req.user`)<br>Does NOT have `user: "user_A_id"`                                                         | High     | favouriteController.js (uses req.user.id)         |

---

# Test Suite 2: Add to Favourites - Happy Path

**Focus**: `favouriteController.addFavourite()`  
**Scope**: Successful addition of products to favourites list

---

| Test ID        | Category   | Test Scenario                                      | Pre-conditions                                                                                                | Test Steps                                                                                                                                              | Test Data                                                                                                           | Expected Result                                                                                                                                                                                       | Priority | Dependencies                                |
| -------------- | ---------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------- |
| **TC-FAV-004** | Happy Path | User adds a new product to favourites successfully | User "A" is authenticated<br>Product "P123" exists in database<br>User "A" does not have "P123" in favourites | 1. Send POST request with valid JWT token<br>2. Include `productId` in request body<br>3. Observe response<br>4. Query database to verify entry created | `POST /api/favourites`<br>`Headers: { Authorization: "Bearer valid_jwt_token" }`<br>`Body: { "productId": "P123" }` | HTTP **201 Created**<br>Response body contains `{ user: "user_A_id", product: "P123", createdAt: "..." }`<br>Database contains new `Favourite` document with `{ user: "user_A_id", product: "P123" }` | High     | favouriteController.js, models/Favourite.js |

---

# Test Suite 3: Add to Favourites - Negative

**Focus**: `favouriteController.addFavourite()` error handling  
**Scope**: Duplicate prevention, invalid inputs, validation

---

| Test ID        | Category  | Test Scenario                                        | Pre-conditions                                                                                  | Test Steps                                                                                                   | Test Data                                                                                                                                                                     | Expected Result                                                                                                                                                                                            | Priority | Dependencies                                               |
| -------------- | --------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------- |
| **TC-FAV-007** | Negative  | Attempt to add duplicate product to favourites       | User "A" is authenticated<br>Product "P123" exists<br>User "A" already has "P123" in favourites | 1. Send POST request with same productId<br>2. Observe response<br>3. Check database for no new entry        | `POST /api/favourites`<br>`Headers: { Authorization: "Bearer valid_jwt_token" }`<br>`Body: { "productId": "P123" }`                                                           | HTTP **400 Bad Request** or **409 Conflict**<br>Error message: "Product already in favourites" or "Duplicate entry"<br>Database still contains only one entry for `{ user: "user_A_id", product: "P123" }` | High     | favouriteController.js, models/Favourite.js (unique index) |
| **TC-FAV-008** | Negative  | Attempt to add non-existent product                  | User "A" is authenticated<br>Product "P_INVALID" does not exist in database                     | 1. Send POST request with invalid productId<br>2. Observe response<br>3. Check database for no entry created | `POST /api/favourites`<br>`Headers: { Authorization: "Bearer valid_jwt_token" }`<br>`Body: { "productId": "P_INVALID" }`                                                      | HTTP **404 Not Found**<br>Error message: "Product not found"<br>No database entry created                                                                                                                  | High     | favouriteController.js, models/Product.js                  |
| **TC-FAV-009** | Negative  | Attempt to add product with missing productId        | User "A" is authenticated                                                                       | 1. Send POST request without productId field<br>2. Observe response                                          | `POST /api/favourites`<br>`Headers: { Authorization: "Bearer valid_jwt_token" }`<br>`Body: { }`                                                                               | HTTP **400 Bad Request**<br>Error message: "productId is required"                                                                                                                                         | High     | favouriteController.js (input validation)                  |
| **TC-FAV-011** | Negative  | Attempt to add product with invalid productId format | User "A" is authenticated                                                                       | 1. Send POST request with invalid format (not ObjectId)<br>2. Observe response                               | `POST /api/favourites`<br>`Headers: { Authorization: "Bearer valid_jwt_token" }`<br>`Body: { "productId": "not-a-valid-objectid" }`                                           | HTTP **400 Bad Request**<br>Error message: "Invalid productId format"                                                                                                                                      | Medium   | favouriteController.js (input validation)                  |
| **TC-FAV-022** | Edge Case | Malformed JSON in POST request                       | User "A" is authenticated<br>API accepts JSON only                                              | 1. Send POST request with malformed JSON in body<br>2. Observe response                                      | `POST /api/favourites`<br>`Headers: { Authorization: "Bearer valid_jwt_token", Content-Type: "application/json" }`<br>`Body: { "productId": "P123", ` (missing closing brace) | HTTP **400 Bad Request**<br>Error message: "Malformed JSON" or similar<br>Request is rejected before controller logic                                                                                      | Low      | Express JSON parser middleware                             |
| **TC-FAV-023** | Edge Case | Empty string productId                               | User "A" is authenticated                                                                       | 1. Send POST request with empty string productId<br>2. Observe response                                      | `POST /api/favourites`<br>`Headers: { Authorization: "Bearer valid_jwt_token" }`<br>`Body: { "productId": "" }`                                                               | HTTP **400 Bad Request**<br>Error message: "Invalid productId"                                                                                                                                             | Medium   | favouriteController.js (input validation)                  |

---

# Test Suite 4: View Favourites

**Focus**: `favouriteController.getFavourites()`  
**Scope**: Retrieving user's favourites with populated product details

---

| Test ID        | Category    | Test Scenario                                    | Pre-conditions                                                                                                                     | Test Steps                                                                              | Test Data                                                                       | Expected Result                                                                                                                                                                                                     | Priority | Dependencies                                           |
| -------------- | ----------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------ |
| **TC-FAV-005** | Happy Path  | User views their list of favourites              | User "A" is authenticated<br>User "A" has products "P123" and "P456" in favourites<br>Products exist in database                   | 1. Send GET request with valid JWT token<br>2. Observe response                         | `GET /api/favourites`<br>`Headers: { Authorization: "Bearer valid_jwt_token" }` | HTTP **200 OK**<br>Response body is an array with populated product details<br>`[{ favourite: {...}, product: { id: "P123", name: "...", ... } }, { favourite: {...}, product: { id: "P456", name: "...", ... } }]` | High     | favouriteController.js, models/Favourite.js            |
| **TC-FAV-012** | Edge Case   | User's favourites list is empty                  | User "A" is authenticated<br>User "A" has no items in favourites                                                                   | 1. Send GET request with valid JWT token<br>2. Observe response                         | `GET /api/favourites`<br>`Headers: { Authorization: "Bearer valid_jwt_token" }` | HTTP **200 OK**<br>Response body is empty array: `[]`<br>No error thrown                                                                                                                                            | Medium   | favouriteController.js                                 |
| **TC-FAV-014** | Edge Case   | Favourites list contains deleted product         | User "A" is authenticated<br>User "A" has "P_DELETED" in favourites<br>Product "P_DELETED" no longer exists in products collection | 1. Send GET request<br>2. Observe response<br>3. Check how deleted products are handled | `GET /api/favourites`<br>`Headers: { Authorization: "Bearer valid_jwt_token" }` | HTTP **200 OK**<br>Response contains the favourites entry, but populated product field is `null`<br>OR: Entry is automatically removed from response<br>Frontend handles null product gracefully                    | Low      | models/Favourite.js (populate), favouriteController.js |
| **TC-FAV-021** | Integration | Verify product details are populated in response | User "A" is authenticated<br>User "A" has "P123" in favourites<br>Product "P123" has full details (name, price, images)            | 1. Send GET request<br>2. Inspect response structure                                    | `GET /api/favourites`<br>`Headers: { Authorization: "Bearer valid_jwt_token" }` | HTTP **200 OK**<br>Response includes complete product details:<br>`[{ product: { _id: "P123", name: "...", price: ..., images: [...], ... } }]`<br>Fields like name, description, price are present                 | Medium   | models/Favourite.js (populate method)                  |
| **TC-FAV-024** | Performance | GET favourites with large list (100+ items)      | User "A" is authenticated<br>User "A" has 100+ favourites<br>Products exist and are valid                                          | 1. Send GET request<br>2. Measure response time<br>3. Verify data integrity             | `GET /api/favourites`<br>`Headers: { Authorization: "Bearer valid_jwt_token" }` | HTTP **200 OK**<br>Response time < 500ms<br>All 100+ items returned with populated details<br>No timeout or memory issues                                                                                           | Low      | models/Favourite.js, database query optimization       |

---

# Test Suite 5: Remove from Favourites

**Focus**: `favouriteController.removeFavourite()`  
**Scope**: Deleting items from favourites list

---

| Test ID        | Category   | Test Scenario                                    | Pre-conditions                                                                                                          | Test Steps                                                                                                      | Test Data                                                                               | Expected Result                                                                                                                | Priority | Dependencies                                |
| -------------- | ---------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------- |
| **TC-FAV-006** | Happy Path | User removes a product from favourites           | User "A" is authenticated<br>User "A" has product "P123" in favourites<br>Entry exists in database                      | 1. Send DELETE request with valid JWT token<br>2. Observe response<br>3. Query database to verify entry deleted | `DELETE /api/favourites/P123`<br>`Headers: { Authorization: "Bearer valid_jwt_token" }` | HTTP **200 OK** or **204 No Content**<br>Success message<br>Database entry `{ user: "user_A_id", product: "P123" }` is deleted | High     | favouriteController.js, models/Favourite.js |
| **TC-FAV-010** | Negative   | Attempt to remove product not in favourites list | User "A" is authenticated<br>User "A" does not have product "P999" in favourites<br>Product "P999" may or may not exist | 1. Send DELETE request for product not in user's favourites<br>2. Observe response                              | `DELETE /api/favourites/P999`<br>`Headers: { Authorization: "Bearer valid_jwt_token" }` | HTTP **404 Not Found**<br>Error message: "Favourite not found" or "Item not in your favourites"                                | Medium   | favouriteController.js                      |

---

# Test Suite 6: Integration & Complete Flow

**Focus**: End-to-end workflows  
**Scope**: Complete user journeys across multiple operations

---

| Test ID        | Category    | Test Scenario                        | Pre-conditions                                                                             | Test Steps                                                                                                                  | Test Data                                                                                                                              | Expected Result                                                                                                                                            | Priority | Dependencies               |
| -------------- | ----------- | ------------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------- |
| **TC-FAV-020** | Integration | Complete flow: Add -> View -> Remove | User "A" is authenticated<br>Clean state (no existing favourites)<br>Product "P123" exists | 1. POST to add "P123"<br>2. GET to verify "P123" is in list<br>3. DELETE to remove "P123"<br>4. GET to verify list is empty | `POST /api/favourites` with `{ productId: "P123" }`<br>`GET /api/favourites`<br>`DELETE /api/favourites/P123`<br>`GET /api/favourites` | HTTP **201 Created**<br>HTTP **200 OK** with "P123" in array<br>HTTP **200 OK**<br>HTTP **200 OK** with empty array `[]`<br>Complete flow works end-to-end | High     | All controllers and models |

---

# Test Suite 7: Edge Cases & Data Integrity

**Focus**: Boundary conditions and data integrity  
**Scope**: Limits, cascade deletions, unique constraints

---

| Test ID        | Category  | Test Scenario                                            | Pre-conditions                                                                                            | Test Steps                                                                                                   | Test Data                                                                                                                                               | Expected Result                                                                                                                         | Priority | Dependencies                                |
| -------------- | --------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------- |
| **TC-FAV-013** | Edge Case | Attempt to add beyond maximum list size (if implemented) | User "A" is authenticated<br>User "A" has exactly MAX_ITEMS (e.g., 50) favourites<br>Product "P51" exists | 1. Send POST request for new product<br>2. Observe response<br>3. Verify database count                      | `POST /api/favourites`<br>`Headers: { Authorization: "Bearer valid_jwt_token" }`<br>`Body: { "productId": "P51" }`<br>(User has 50 existing favourites) | HTTP **400 Bad Request**<br>Error message: "Favourites list is full. Maximum 50 items allowed."<br>Database count remains at 50 items   | Low      | favouriteController.js (if max implemented) |
| **TC-FAV-015** | Edge Case | Cascade delete favourites when user is deleted           | User "A" exists with favourites entries<br>User is being deleted                                          | 1. Delete user "A" from users collection<br>2. Query favourites collection for user "A"<br>3. Verify cleanup | Database operation: Delete user document<br>Query: `db.favourites.find({ user: "user_A_id" })`                                                          | All favourites entries where `user == "user_A_id"` are deleted from database (via cascade or cleanup job)<br>Query returns empty result | Low      | Database cascade rules or cleanup service   |
| **TC-FAV-019** | Unit      | Favourite model unique compound index                    | Database supports unique indexes<br>Favourite model is defined with unique index on [user, product]       | 1. Create favourite `{ user: "A", product: "P123" }`<br>2. Attempt to create duplicate entry                 | Database: `db.favourites.create({ user: "A", product: "P123" })`<br>`db.favourites.create({ user: "A", product: "P123" })`                              | First creation succeeds<br>Second creation throws error: "E11000 duplicate key error"<br>Database maintains only one entry              | Medium   | models/Favourite.js (schema definition)     |

---

## Priority Classification

- **High**: Core functionality, security, and user-critical flows. Must pass before deployment.
- **Medium**: Important edge cases and data integrity. Should be tested regularly.
- **Low**: Rare scenarios, performance, and cleanup operations. Can be tested periodically.

## Test Execution Notes

1. **Authentication**: All API tests (except TC-FAV-001 to TC-FAV-003) require valid JWT tokens in the Authorization header.
2. **Database State**: Tests may require setup/teardown of test data. Use beforeEach/afterEach hooks in test files.
3. **Mock Strategy**: Unit tests should mock models and services; Integration tests should use real database or test database.
4. **Cleanup**: Ensure test data is cleaned up after each test to prevent test pollution.

## Coverage Summary - FINAL

| Metric               | Count |
| -------------------- | ----- |
| **Total Test Cases** | 24    |
| **High Priority**    | 13    |
| **Medium Priority**  | 6     |
| **Low Priority**     | 5     |

**Coverage Areas**:

- Authentication & Authorization (6 cases)
- Happy Path Flows (3 cases)
- Negative Scenarios (6 cases)
- Edge Cases (6 cases)
- Security (3 cases)

---

**File Version:** 1.0 - FULL VERSION  
**Generated:** 2025-01-21  
**Based on:** `output_phase1_favourite.md`  
**Status:** Ready for implementation with Jest/Mocha
