````markdown
# Favourites – Technical & Testing Analysis

## 1. Feature Overview

- **Business purpose:** To allow authenticated users to save products they are interested in to a personal "Favourites" or "Wishlist." This feature aims to increase user engagement, drive repeat visits, and facilitate future purchases by keeping desired items easily accessible.
- **Key UI flows:**
  1.  A user (on a Product List or Product Detail Page) clicks an icon (e.g., a "heart") to add a product to their Favourites.
  2.  The user clicks the same icon again to remove the product.
  3.  The user navigates to their account page to view a dedicated "My Favourites" list.
  4.  The user can remove items directly from this list page.
- **Main business rules & success criteria:**
  - **Success:** A user can successfully add, view, and remove products from their list. The list is persistent across sessions.
  - **Auth:** Only authenticated (logged-in) users can have Favourites.
  - **Uniqueness:** A user cannot add the exact same product to their list more than once (duplicate prevention).
  - **Integrity:** If a product is deleted from the store, it should be handled gracefully in the user's list (ideally removed).
- **Why this feature is important for testing:** This is a critical user engagement feature. Failures (e.g., items not saving, list not loading, errors on add/remove) directly lead to user frustration, a perception of a buggy site, and potential lost sales. It also has a key security component: ensuring one user cannot see or modify another user's list.

## 2. UI/UX Flow Mapping

_(Based on inferred standard e-commerce frontend)_

| Step | UI Screen/Component                          | User Action                                                     | System Behavior                                                                                                                                                                                                                                                                                    |
| :--- | :------------------------------------------- | :-------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Product List/Detail Page (`ProductCard.jsx`) | User clicks 'Add to Favourites' icon (e.g., empty heart).       | 1. (FE) Sends `POST /api/favourites` with `{ "productId": "..." }` and auth token.<br>2. (BE) `auth.middleware` verifies user JWT.<br>3. (BE) `favouriteController.addFavourite` validates input and creates a new `Favourite` document.<br>4. (FE) Icon optimistically updates to 'filled heart'. |
| 2    | Product List/Detail Page (`ProductCard.jsx`) | User clicks 'Remove from Favourites' icon (e.g., filled heart). | 1. (FE) Sends `DELETE /api/favourites/:productId` with auth token.<br>2. (BE) `auth.middleware` verifies user JWT.<br>3. (BE) `favouriteController.removeFavourite` finds and deletes the `Favourite` document.<br>4. (FE) Icon optimistically updates to 'empty heart'.                           |
| 3    | Navigation Menu (`Navbar.jsx`)               | User clicks "My Account" -> "My Favourites".                    | 1. (FE) Navigates to client-side route `/account/favourites`.                                                                                                                                                                                                                                      |
| 4    | Favourites Page (`FavouritesPage.jsx`)       | Page loads.                                                     | 1. (FE) Sends `GET /api/favourites` with auth token.<br>2. (BE) `auth.middleware` verifies user JWT.<br>3. (BE) `favouriteController.getFavourites` finds all favourites for the user and populates product details.<br>4. (FE) Renders the list of favourited products.                           |
| 5    | Favourites Page (`FavouritesPage.jsx`)       | User clicks 'Remove' button next to an item.                    | 1. (FE) Sends `DELETE /api/favourites/:productId`.<br>2. (FE) Item is removed from the UI list (optimistic or on success).                                                                                                                                                                         |

## 3. Related Files, Components & Modules

| File/Path                                | Layer (UI/Logic/Service/API) | Responsibility                                                              | Key Methods/Props/States                                                                                                                                                 |
| :--------------------------------------- | :--------------------------- | :-------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`routes/favouriteRoutes.js`**          | API                          | Defines API endpoints for favourites and applies auth middleware.           | `router.get('/', protect, getFavourites)`<br>`router.post('/', protect, addFavourite)`<br>`router.delete('/:id', protect, removeFavourite)`                              |
| **`controllers/favouriteController.js`** | Logic (Controller)           | Handles `req`/`res` objects, implements business logic, calls Model.        | `getFavourites`<br>`addFavourite`<br>`removeFavourite`                                                                                                                   |
| **`models/Favourite.js`**                | Logic (Model)                | Mongoose/Sequelize schema. Defines the data structure for a favourite item. | `user: { type: Schema.Types.ObjectId, ref: 'User' }`<br>`product: { type: Schema.Types.ObjectId, ref: 'Product' }`<br>`index: { user: 1, product: 1 }, { unique: true }` |
| `middlewares/auth.middleware.js`         | API (Middleware)             | (Dependency) Protects all routes, attaches `req.user` from JWT.             | `protect`                                                                                                                                                                |
| `models/User.js`                         | Logic (Model)                | (Dependency) User data, referenced by `Favourite` model.                    | (Schema)                                                                                                                                                                 |
| `models/Product.js`                      | Logic (Model)                | (Dependency) Product data, referenced by `Favourite` model.                 | (Schema)                                                                                                                                                                 |
| `(FE) components/FavouriteIcon.jsx`      | UI                           | (Inferred) Reusable "heart" icon component.                                 | `isFavourited` (prop)<br>`onClick` (prop)                                                                                                                                |
| `(FE) pages/FavouritesPage.jsx`          | UI                           | (Inferred) Displays the user's list of saved items.                         | `useFavouritesQuery()` (hook)                                                                                                                                            |
| `(FE) services/favouriteService.js`      | Service (FE)                 | (Inferred) Axios/fetch functions to call the backend API.                   | `getFavourites()`<br>`addFavourite(productId)`<br>`removeFavourite(productId)`                                                                                           |

## 4. Core Functions / Methods to Test

### 1. `favouriteController.addFavourite`

- **Purpose:** To add a single product to the currently authenticated user's favourites list.
- **Inputs + Types:** `req` (Express Request, with `req.user.id` from auth, `req.body.productId` as String), `res` (Express Response).
- **Outputs / Return:** `201 Created` with the new favourite object.
- **State Change / Side Effects:** Creates a new document in the `favourites` collection.
- **Edge Cases:**
  - `productId` is missing or invalid.
  - Product with `productId` does not exist.
  - Item is already in the user's favourites (triggers unique index error).
  - (If implemented) User hits max list size (e.g., 50 items).
- **Dependencies:** `Favourite` model (`.create`, `.findOne`), `Product` model (`.findById`).

### 2. `favouriteController.removeFavourite`

- **Purpose:** To remove a single product from the currently authenticated user's favourites list.
- **Inputs + Types:** `req` (Express Request, with `req.user.id` from auth, `req.params.id` as ProductId), `res` (Express Response).
- **Outputs / Return:** `200 OK` with a success message (or `204 No Content`).
- **State Change / Side Effects:** Deletes a document from the `favourites` collection.
- **Edge Cases:**
  - `productId` is invalid.
  - User tries to remove a product that isn't in their list.
  - Security: The logic _must_ query by `productId` AND `userId` (e.g., `deleteOne({ product: req.params.id, user: req.user.id })`).
- **Dependencies:** `Favourite` model (`.deleteOne` or `.findOneAndDelete`).

### 3. `favouriteController.getFavourites`

- **Purpose:** To retrieve all favourite products for the currently authenticated user.
- **Inputs + Types:** `req` (Express Request, with `req.user.id` from auth), `res` (Express Response).
- **Outputs / Return:** `200 OK` with an array of favourite objects (ideally populated with product details).
- **State Change / Side Effects:** None.
- **Edge Cases:**
  - User has no favourites (should return an empty array `[]`).
  - A favourited product has since been deleted (test if `populate('product')` returns `null` for that item and if the frontend handles it).
- **Dependencies:** `Favourite` model (`.find`), `Product` model (for `.populate()`).

### 4. `Favourite` Model (Schema)

- **Purpose:** To enforce data integrity at the database level.
- **Inputs + Types:** `user` (ObjectId), `product` (ObjectId).
- **Outputs / Return:** Saved Mongoose document.
- **State Change / Side Effects:** (See controller).
- **Edge Cases:**
  - Test the `unique` compound index: ensure saving `{user: 'A', product: 'B'}` twice fails.
  - Test `ref` constraints: ensure `user` and `product` fields require valid ObjectIds.
- **Dependencies:** Mongoose.

## 5. Test Case Matrix

| Category        | Scenario                                                            | Pre-condition                                                                       | Input                                                    | Expected Output/Behavior                                                                                                                                          |
| :-------------- | :------------------------------------------------------------------ | :---------------------------------------------------------------------------------- | :------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Integration** | (Auth) Deny access to GET favourites if not logged in               | User is logged out.                                                                 | `GET /api/favourites` (no token)                         | **401 Unauthorized** error.                                                                                                                                       |
| **Integration** | (Auth) Deny access to POST favourite if not logged in               | User is logged out.                                                                 | `POST /api/favourites` (no token)                        | **401 Unauthorized** error.                                                                                                                                       |
| **Integration** | (Auth) Deny access to DELETE favourite if not logged in             | User is logged out.                                                                 | `DELETE /api/favourites/P123` (no token)                 | **401 Unauthorized** error.                                                                                                                                       |
| **Happy Path**  | User adds a new product to favourites                               | User "A" is logged in. Product "P123" exists.                                       | `POST /api/favourites` with `{"productId": "P123"}`      | **201 Created**. DB now contains `{ user: "A_id", product: "P123" }`.                                                                                             |
| **Happy Path**  | User views their list of favourites                                 | User "A" is logged in and has "P123" favourited.                                    | `GET /api/favourites`                                    | **200 OK**. Response body is an array containing the populated product object for "P123".                                                                         |
| **Happy Path**  | User removes a product from favourites                              | User "A" is logged in and has "P123" favourited.                                    | `DELETE /api/favourites/P123`                            | **200 OK**. The DB entry `{ user: "A_id", product: "P123" }` is deleted.                                                                                          |
| **Negative**    | (Duplicate) User tries to add the same product twice                | User "A" _already_ has "P123" favourited.                                           | `POST /api/favourites` with `{"productId": "P123"}`      | **400 Bad Request** (or 409 Conflict). Error message "Product already in favourites". (This may come from a controller check or a DB E11000 duplicate key error). |
| **Negative**    | User tries to add a product that does not exist                     | User "A" is logged in. Product "P_INVALID" does not exist in `products` DB.         | `POST /api/favourites` with `{"productId": "P_INVALID"}` | **44 Not Found**. Error message "Product not found".                                                                                                              |
| **Negative**    | User tries to remove a product that is not in their list            | User "A" is logged in. Their favourites list is empty.                              | `DELETE /api/favourites/P999`                            | **404 Not Found**. Error message "Favourite not found".                                                                                                           |
| **Edge Case**   | User's favourite list is empty                                      | User "A" is logged in and has no favourites.                                        | `GET /api/favourites`                                    | **200 OK**. Response body is an empty array `[]`.                                                                                                                 |
| **Edge Case**   | (Max Size) User tries to add beyond max list size                   | (If implemented) User "A" has `MAX_ITEMS` (e.g., 50) favourites.                    | `POST /api/favourites` with `{"productId": "P51"}`       | **400 Bad Request**. Error message "Favourites list is full".                                                                                                     |
| **Edge Case**   | (Product Deleted) User fetches list with a now-deleted product      | User "A" has "P_DELETED" favourited. "P_DELETED" no longer exists in `products` DB. | `GET /api/favourites`                                    | **200 OK**. The response array is returned, but the item for "P_DELETED" is `null` (if using `populate`). The FE must handle this.                                |
| **Edge Case**   | (User Deleted) A user's favourites are cleared when user is deleted | User "A" is deleted from the `users` table.                                         | (DB Check)                                               | All entries in `favourites` where `user == "A_id"` should be deleted (via cascade delete or a cleanup job).                                                       |

## 6. Test Priority Recommendation

- **`favouriteController.js` (HIGH)**
  - **Justification:** This is the heart of the feature's logic. Any bug here (e.g., adding to the wrong user, failing to remove, poor error handling) breaks the feature completely. The security check (isolating favourites by `req.user.id`) is critical.
- **`routes/favouriteRoutes.js` (HIGH)**
  - **Justification:** Integration testing of the routes is high priority. A missing or misconfigured `protect` middleware would be a critical security vulnerability, exposing all users' favourites.
- **`models/Favourite.js` (MEDIUM)**
  - **Justification:** The schema itself is simple, but the **unique compound index** (`['user', 'product']`) is vital for data integrity and preventing duplicates. This constraint _must_ be tested.
- **Edge Case: Deleted Product/User (LOW)**
  - **Justification:** This is a data integrity/cleanup scenario. While important for a clean DB, it doesn't typically cause a hard crash for the user (at worst, they see a "broken" item). It's a lower priority than the core add/remove/view functionality.

## 7. Mocking & Test Data Preparation

| Dependency                           | What to Mock                                                                                | Mocking Strategy                                                                                                                                                                        | Sample Mock Data                                                                                                                                                                                                                                                                                               |
| :----------------------------------- | :------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`models/Favourite.js`**            | Mongoose static methods (`.find`, `.findOne`, `.create`, `.deleteOne`, `.findOneAndDelete`) | `jest.mock('../models/Favourite')` to mock the entire model. Use `jest.fn()` for each method.                                                                                           | `// Mock DB State (use a Map)`<br>`const mockFavDB = new Map();`<br>`// Mock Implementation`<br>`Favourite.create.mockImplementation((data) => {`<br>`  if (dbHas(data)) throw new Error('E11000');`<br>`  return Promise.resolve(data);`<br>`});`                                                             |
| **`models/Product.js`**              | Mongoose static method (`.findById`)                                                        | `jest.mock('../models/Product')`                                                                                                                                                        | `Product.findById.mockImplementation((id) => {`<br>`  if (id === 'P123') return Promise.resolve({ _id: 'P123', name: 'Valid Product' });`<br>`  return Promise.resolve(null);`<br>`});`                                                                                                                        |
| **`middlewares/auth.middleware.js`** | `protect` function                                                                          | `jest.mock('../middlewares/auth.middleware', () => ({`<br>`  protect: (req, res, next) => {`<br>`    req.user = { id: 'user_A_id', role: 'user' };`<br>`    next();`<br>`  }`<br>`}));` | `// Injected by mock`<br>`{ id: 'user_A_id', role: 'user' }`                                                                                                                                                                                                                                                   |
| **Express `req`/`res`**              | `req`, `res`, `next` objects                                                                | Use `jest.fn()` to create mock objects for testing controller/middleware functions in isolation.                                                                                        | `const mockRequest = (user, body, params) => ({`<br>`  user, body, params`<br>`});`<br>`const mockResponse = () => {`<br>`  const res = {};`<br>`  res.status = jest.fn().mockReturnValue(res);`<br>`  res.json = jest.fn().mockReturnValue(res);`<br>`  return res;`<br>`};`<br>`const mockNext = jest.fn();` |

## 8. Suggested Next Prompts

1.  **Generate Test Case Matrix (Detailed):**

    ```
    # Prompt: Generate Test Cases Matrix for Favourites

    Generate a comprehensive Test Cases Matrix (Markdown) for the feature "Favourites", based on the provided analysis.

    - Include suites for: Unit, Integration (API), and Edge Cases.
    - Focus on the modules: `favouriteController.js`, `favouriteRoutes.js`, `models/Favourite.js`.
    - Cover all scenarios from the analysis: auth, happy path (add/get/remove), duplicate prevention, non-existent product, max list size, and deleted product handling.

    Output format (8 columns):
    `Test ID | Category | Test Scenario | Pre-conditions | Test Steps | Test Data | Expected Result | Priority`
    ```

2.  **Generate Jest Unit Tests (Controller):**

    ```
    # Prompt: Generate Jest Unit Tests for FavouriteController

    I want to generate Jest unit tests for the file `controllers/favouriteController.js`.

    - Use the analysis to create tests for `getFavourites`, `addFavourite`, and `removeFavourite`.
    - Mock all dependencies: `models/Favourite.js`, `models/Product.js`.
    - Mock the `req`, `res`, and `next` objects.
    - `req.user` should be hardcoded (e.g., `{ id: 'user_A_id' }`) as auth middleware is mocked.
    - Include tests for:
        1. `addFavourite`: Happy path (201), duplicate (400, via DB error), product not found (404).
        2. `getFavourites`: Happy path (200, returns array), empty list (200, returns []).
        3. `removeFavourite`: Happy path (200), item not found (404).

    Return the output as a single `// FILE: favouriteController.test.js` code block.
    ```

3.  **Generate Jest Integration Tests (API Routes):**

    ```
    # Prompt: Generate Jest Integration Tests for Favourite Routes

    Generate Jest integration tests for the file `routes/favouriteRoutes.js` using `supertest`.

    - The tests must spin up the Express app.
    - Mock the `auth.middleware` to inject a test user OR simulate no user.
    - Mock the `Favourite` and `Product` models to control DB responses.
    - Include tests for:
        1. `GET /api/favourites`: 401 (no auth), 200 (with auth, returns list).
        2. `POST /api/favourites`: 401 (no auth), 201 (with auth, valid data), 400 (duplicate data).
        3. `DELETE /api/favourites/:id`: 401 (no auth), 200 (with auth, item exists), 404 (item does not exist).

    Return the output as a single `// FILE: favourite.integration.test.js` code block.
    ```
````
