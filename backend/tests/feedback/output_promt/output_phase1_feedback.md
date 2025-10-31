# Feedback – Technical & Testing Analysis

## 1. Feature Overview

### Business Purpose

The **Feedback** feature enables customers to leave product reviews and ratings after receiving delivered orders. It includes comprehensive feedback management, reporting mechanisms for inappropriate content, and admin moderation capabilities.

### Key UI Flows

1. **Customer submits feedback**: After order delivery, customer can submit rating (1-5 stars) and comments
2. **Customer edits/deletes feedback**: User can update or delete their own feedback
3. **Public viewing**: Reviews are displayed on product detail pages
4. **Reporting system**: Users can report inappropriate reviews
5. **Admin moderation**: Admin can approve or delete reported reviews
6. **Email notifications**: Automated emails sent for various feedback events

### Main Business Rules & Success Criteria

- Customers can only review products from delivered orders
- One feedback per unique combination of user, order, and product (enforced by MongoDB unique index)
- Rating must be between 1-5
- Comment must be between 10-500 characters
- Feedback status (active/deleted) controls visibility
- Image uploads validated for URL format (max 5 images)
- Soft delete by admin; hard delete by user
- Email notifications sent to shop owner, review author, and reporter on key events

### Why This Feature is Important for Testing

- **Trust & Reputation**: Reviews directly impact product credibility and customer purchasing decisions
- **Data Integrity**: Unique constraint prevents duplicate reviews but needs validation
- **Content Moderation**: Report/review system requires proper permission checks
- **Email Integration**: Multi-party notifications must be tested for accuracy
- **Edge Cases**: Massive text, HTML injection, duplicate submissions need handling
- **User Permissions**: Owner validation critical for edit/delete operations

## 2. UI/UX Flow Mapping

### Customer Flow: Submit Feedback

| Step | UI Screen/Component                     | User Action                               | System Behavior                                                   |
| ---- | --------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| 1    | Order Details Page (`OrderDetails.jsx`) | Customer views delivered order            | System shows "Leave Review" button for products                   |
| 2    | Modal opens (`Feedback.jsx`)            | Customer clicks "Leave Review"            | Feedback modal displays with rating, comment, and upload fields   |
| 3    | Form Validation                         | Customer inputs rating and comment        | Client-side validation: min 10 chars, max 500 chars               |
| 4    | Image Upload                            | Customer uploads images (optional, max 5) | Images uploaded to Cloudinary via `/feedback/upload`              |
| 5    | Submit                                  | Customer clicks "Submit"                  | POST `/api/feedback` with order, product, rating, comment, images |
| 6    | Success                                 | System creates feedback                   | Success message shown, modal closes, product rating updated       |

### Customer Flow: Edit/Delete Feedback

| Step | UI Screen/Component | User Action                          | System Behavior                             |
| ---- | ------------------- | ------------------------------------ | ------------------------------------------- |
| 1    | Order Details       | Customer views existing feedback     | System shows "Edit" and "Delete" buttons    |
| 2    | Edit Modal          | Customer clicks "Edit"               | Modal loads existing feedback data          |
| 3    | Update              | Customer modifies fields and submits | PUT `/api/feedback/:id` updates feedback    |
| 4    | Delete              | Customer clicks "Delete"             | DELETE `/api/feedback/:id` removes feedback |

### Public Viewing Flow

| Step | UI Screen/Component                           | User Action                         | System Behavior                                           |
| ---- | --------------------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| 1    | Product Detail Page (`ProductDetailPage.jsx`) | User navigates to product           | Product page loads                                        |
| 2    | Comment Section (`CommentSection.jsx`)        | User scrolls to reviews             | GET `/api/feedback?product={productId}` fetches feedbacks |
| 3    | Filter by Rating                              | User clicks star filter (5,4,3,2,1) | Client filters reviews by selected rating                 |
| 4    | Pagination                                    | User navigates pages                | Reviews paginated (5 per page)                            |

### Reporting Flow

| Step | UI Screen/Component                    | User Action             | System Behavior                                |
| ---- | -------------------------------------- | ----------------------- | ---------------------------------------------- |
| 1    | Product Reviews (`CommentSection.jsx`) | User views review       | User sees "Report" button                      |
| 2    | Report Modal                           | User clicks "Report"    | Modal opens with reason, description fields    |
| 3    | Submit Report                          | User submits report     | POST `/api/feedback/:id/report` creates report |
| 4    | Email Notifications                    | System processes report | Emails sent to shop owner, reporter            |

### Admin Moderation Flow

| Step | UI Screen/Component                    | User Action                     | System Behavior                                          |
| ---- | -------------------------------------- | ------------------------------- | -------------------------------------------------------- |
| 1    | Admin Dashboard (`AdminDashboard.jsx`) | Admin navigates to Feedback tab | GET `/dashboard/admin/feedback` fetches reported reviews |
| 2    | Review List                            | Admin views pending reports     | Table shows customer, product, rating, comment, images   |
| 3    | Approve                                | Admin clicks "Approve"          | PUT `/api/feedback/:id/approve` approves review          |
| 4    | Delete                                 | Admin clicks "Delete"           | DELETE `/api/feedback/:id/delete` soft-deletes review    |
| 5    | Email Notifications                    | System processes action         | Emails sent to review author, shop, reporter             |

## 3. Related Files, Components & Modules

### Backend Components

| File/Path                                        | Layer          | Responsibility                    | Key Methods/Props/States                                                                                                      |
| ------------------------------------------------ | -------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/models/Feedback.js`                 | Data Model     | Feedback schema definition        | Schema fields: user, product, order, rating, comment, images, status, isVerified, deletedBy; Unique index: user+order+product |
| `backend/src/models/Report.js`                   | Data Model     | Report schema for flagged content | Fields: reporter, targetType, targetId, reason, description, evidence, status; Unique: reporter+targetType+targetId           |
| `backend/src/controllers/feedbackController.js`  | API Layer      | HTTP request handlers             | `createFeedback()`, `updateFeedback()`, `deleteFeedback()`, `getAllFeedback()`, `reportFeedback()`, `adminApproveFeedback()`  |
| `backend/src/middlewares/feedback.middleware.js` | Middleware     | Authorization checks              | `checkFeedbackOwner()` - verifies user owns the feedback                                                                      |
| `backend/src/services/feedback.service.js`       | Business Logic | Core feedback operations          | `createFeedback()`, `updateFeedback()`, `deleteFeedback()`, `getFeedbacks()`, `findOne()`                                     |
| `backend/src/routes/feedbackRoutes.js`           | Routing        | API endpoints definition          | POST `/`, PUT `/:id`, DELETE `/:id`, GET `/`, POST `/:id/report`, PUT `/:id/approve`, DELETE `/:id/delete`                    |
| `backend/src/utils/sendEmail.js`                 | Utility        | Email notification                | `sendTemplatedEmail()` - sends template-based emails                                                                          |
| `backend/src/templates/email.templates.js`       | Templates      | Email content                     | `REVIEW_DELETED`, `REVIEW_REPORTED`, `REVIEW_REPORT_SUBMITTED`, `REPORT_RESOLVED`, `REVIEW_DELETED_SHOP`                      |

### Frontend Components

| File/Path                                                             | Layer            | Responsibility                      | Key Methods/Props/States                                                                                                  |
| --------------------------------------------------------------------- | ---------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/components/common/components/Feedback.jsx`              | UI Component     | Modal for creating/editing feedback | State: `fileList`, `loading`, `fid`; Methods: `onFinish()`, `customRequest()`, `handleDelete()`                           |
| `frontend/src/components/common/components/OrderDetails.jsx`          | UI Component     | Order details with review section   | State: `existingFeedbacks`, `feedbackVisible`, `selectedProduct`; Methods: `openFeedbackModal()`, `handleFeedbackSaved()` |
| `frontend/src/components/pages/product/components/CommentSection.jsx` | UI Component     | Display product reviews             | State: `comments`, `filterRating`, `currentPage`; Fetches: GET `/feedback?product={id}`                                   |
| `frontend/src/components/pages/dashboard/AdminDashboard.jsx`          | UI Component     | Admin feedback management           | State: `feedback`, `replyModalOpen`; Fetches: GET `/dashboard/admin/feedback`                                             |
| `frontend/src/services/axiosInstance.js`                              | API Service      | HTTP client configuration           | Axios instance with baseURL, interceptors                                                                                 |
| `frontend/src/contexts/AuthContext.jsx`                               | State Management | User authentication state           | `user` object with role, id                                                                                               |

## 4. Core Functions / Methods to Test

### Backend Functions

#### `createFeedback()` - `feedbackController.js`

- **Purpose**: Create new feedback with validation and duplicate checking
- **Inputs**: `{ order, product, rating, comment, images }`, `user` (from req.user)
- **Outputs**: `{ success, message, data: feedback }` (201) or error (400/500)
- **State Change**: Creates new Feedback document; updates product.rating via aggregate
- **Edge Cases**:
  - Duplicate feedback (error code 11000) - already reviewed this product for this order
  - Missing required fields
  - Rating outside 1-5 range
  - Comment too short/long
  - Invalid image URLs
  - Non-existent product/order
- **Dependencies**: `FeedbackService.createFeedback()`, `Feedback`, `Product`, `mongoose`

#### `updateFeedback()` - `feedbackController.js`

- **Purpose**: Update existing feedback (rating, comment, images)
- **Inputs**: `feedbackId` (params), `{ rating, comment, images }` (body), `user` (req.user)
- **Outputs**: `{ success, message, data: feedback }` (200) or error (404/400/500)
- **State Change**: Updates Feedback document fields
- **Edge Cases**:
  - Feedback not found (404)
  - User not owner (403 via middleware)
  - Validation errors
- **Dependencies**: `FeedbackService.updateFeedback()`, `checkFeedbackOwner` middleware

#### `deleteFeedback()` - `feedbackController.js`

- **Purpose**: Delete feedback with email notifications
- **Inputs**: `feedbackId` (params), `user` (req.user)
- **Outputs**: `{ success, message }` (200) or error
- **State Change**: Hard deletes Feedback (user), soft deletes (admin); updates pending Reports to "resolved"
- **Edge Cases**:
  - Feedback not found
  - User not owner
  - Email sending failures (should not block deletion)
- **Dependencies**: `FeedbackService.deleteFeedback()`, `Report` model, `sendTemplatedEmail()`, `User` model

#### `getAllFeedback()` - `feedbackController.js`

- **Purpose**: Retrieve all active feedbacks with optional filters
- **Inputs**: Query params `{ order, product, user }`
- **Outputs**: `{ success, data: feedbacks[] }` (200)
- **State Change**: None (read-only)
- **Edge Cases**:
  - Empty result set
  - Invalid query params
- **Dependencies**: `Feedback.find()`

#### `reportFeedback()` - `feedbackController.js`

- **Purpose**: Create report for inappropriate feedback
- **Inputs**: `feedbackId` (params), `{ reason, description, evidence }` (body), `user` (req.user)
- **Outputs**: `{ success, message, data: report }` (201)
- **State Change**: Creates new Report document; sends emails to shop and reporter
- **Edge Cases**:
  - Feedback not found (404)
  - Duplicate report (unique constraint)
  - Missing required fields
- **Dependencies**: `Report`, `Feedback`, `sendTemplatedEmail()`, `User`

#### `adminApproveFeedback()` - `feedbackController.js`

- **Purpose**: Admin approve or delete reported feedback
- **Inputs**: `feedbackId` (params), HTTP method (PUT/DELETE), `user` (admin role)
- **Outputs**: Success/error response
- **State Change**: Updates feedback status; resolves report; sends emails
- **Edge Cases**:
  - Feedback not found (404)
  - No pending report (400)
  - User not admin (403)
- **Dependencies**: `Feedback`, `Report`, `checkFeedbackOwner`, `requireRoles('admin')`

#### `checkFeedbackOwner()` - `feedback.middleware.js`

- **Purpose**: Verify user owns the feedback before update/delete
- **Inputs**: `req.params.id`, `req.user.id`
- **Outputs**: Calls next() or returns 403
- **State Change**: None
- **Edge Cases**:
  - Feedback not found (404)
  - Feedback.user != req.user.id (403)
- **Dependencies**: `Feedback.findById()`

#### `FeedbackService.createFeedback()` - `feedback.service.js`

- **Purpose**: Business logic for creating feedback and updating product rating
- **Inputs**: `{ user, order, product, rating, comment, images }`
- **Outputs**: Created Feedback document
- **State Change**: Creates feedback; aggregates and updates product.rating
- **Edge Cases**:
  - Product not found
  - Aggregate returns no results (uses new rating as default)
- **Dependencies**: `Feedback`, `Product`, MongoDB aggregation

#### `FeedbackService.deleteFeedback()` - `feedback.service.js`

- **Purpose**: Delete feedback with hard vs soft delete logic
- **Inputs**: `feedbackId`, `deletedBy` ('user' or 'admin')
- **Outputs**: Deleted feedback document
- **State Change**: Hard delete for users; soft delete (status: false, deletedBy) for admins
- **Edge Cases**:
  - Feedback not found
  - Deletion fails
- **Dependencies**: `Feedback.findByIdAndDelete()`, `Feedback.findByIdAndUpdate()`

### Frontend Functions

#### `onFinish()` - `Feedback.jsx`

- **Purpose**: Submit create or update feedback form
- **Inputs**: Form values `{ rating, comment }`, `fileList`
- **Outputs**: Shows success/error message; closes modal; calls `onSaved()`
- **State Change**: Calls `refreshFeedbacks()` in parent
- **Edge Cases**:
  - Validation errors (comment too short/long)
  - Duplicate review error
  - Network failures
- **Dependencies**: `axiosInstance.post()`, `axiosInstance.put()`, `onSaved()` callback

#### `openFeedbackModal()` - `OrderDetails.jsx`

- **Purpose**: Open feedback modal with product context
- **Inputs**: `productId`, `feedbackId` (optional for edit mode)
- **Outputs**: Opens modal; fetches existing feedback if editing
- **State Change**: Sets `selectedProduct`, `selectedFeedbackId`, `feedbackVisible = true`
- **Dependencies**: Modal component state, `axiosInstance.get()` for edit mode

## 5. Test Case Matrix

| Category                | Scenario                               | Pre-condition                                             | Input                                                                         | Expected Output/Behavior                                                             |
| ----------------------- | -------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Happy Path - Create** | Valid feedback submission              | User authenticated; order delivered; no existing feedback | rating: 5, comment: "Great product, highly recommended", images: [valid URLs] | 201 Created; feedback saved; product rating updated; success message shown           |
| **Happy Path - Edit**   | Update existing feedback               | User owns feedback                                        | rating: 4, comment: "Updated review"                                          | 200 OK; feedback updated; changes visible                                            |
| **Happy Path - Delete** | User deletes own feedback              | User owns feedback                                        | DELETE /api/feedback/:id                                                      | 200 OK; feedback hard deleted; emails sent; UI updated                               |
| **Happy Path - View**   | Display product reviews                | Product exists with feedbacks                             | GET /api/feedback?product={id}                                                | 200 OK; returns feedback array with populated user data                              |
| **Happy Path - Report** | User reports review                    | Review exists; user authenticated                         | reason: "spam", description: "Repeated content"                               | 201 Created; report saved; emails sent                                               |
| **Validation**          | Rating too low                         | Valid order/product                                       | rating: 0, comment: "Bad"                                                     | 400 Bad Request; error: "Rating must be at least 1"                                  |
| **Validation**          | Rating too high                        | Valid order/product                                       | rating: 6, comment: "Excellent"                                               | 400 Bad Request; error: "Rating cannot exceed 5"                                     |
| **Validation**          | Comment too short                      | Valid order/product                                       | rating: 5, comment: "Bad"                                                     | 400 Bad Request; error: "Comment must be at least 10 characters"                     |
| **Validation**          | Comment too long                       | Valid order/product                                       | rating: 5, comment: "A" \* 501                                                | 400 Bad Request; error: "Comment cannot exceed 500 characters"                       |
| **Validation**          | Invalid image URL                      | Valid order/product                                       | images: ["not-a-url"]                                                         | 400 Bad Request; error: "Image URL must be a valid URL"                              |
| **Duplicate**           | Submit duplicate review                | Feedback already exists for order+product                 | Same order, product, user                                                     | 400 Bad Request; error code 11000; message: "You have already reviewed this product" |
| **Authorization**       | Update another user's feedback         | Feedback exists; user != feedback.user                    | PUT /api/feedback/:id                                                         | 403 Forbidden; middleware blocks; message: "You are not authorized"                  |
| **Authorization**       | Delete another user's feedback         | Feedback exists; user != feedback.user                    | DELETE /api/feedback/:id                                                      | 403 Forbidden; middleware blocks                                                     |
| **Authorization**       | Admin deletes feedback                 | User role = admin; feedback reported                      | DELETE /api/feedback/:id/delete                                               | 200 OK; soft delete; status = false; emails sent                                     |
| **Authorization**       | Admin approves feedback                | User role = admin; feedback reported                      | PUT /api/feedback/:id/approve                                                 | 200 OK; report resolved; feedback marked approved                                    |
| **Edge Case**           | Massive text input                     | Valid fields                                              | comment: "A" \* 10000                                                         | Client: maxLength stops at 500; Server: Returns error                                |
| **Edge Case**           | HTML/script injection                  | Valid fields                                              | comment: "<script>alert('xss')</script>Hello world"                           | Client: Text escaped by React; Server: Saves as-is (stored XSS risk)                 |
| **Edge Case**           | Multiple images                        | Valid fields                                              | images: [5 valid URLs]                                                        | Success; all images saved                                                            |
| **Edge Case**           | Too many images (6+)                   | Valid fields                                              | images: [6 valid URLs]                                                        | Client: Upload disabled after 5; Server: Returns error                               |
| **Edge Case**           | Feedback for non-delivered order       | Order status != 'delivered'                               | Valid fields                                                                  | Client: "Not available yet" message; Button disabled                                 |
| **Edge Case**           | Missing product reference              | Valid user, order                                         | product: null                                                                 | 400 Bad Request; error: "Product is required"                                        |
| **Edge Case**           | Missing order reference                | Valid user, product                                       | order: null                                                                   | 400 Bad Request; error: "Order is required"                                          |
| **Edge Case**           | Get feedbacks for non-existent product | Product ID invalid                                        | product: "invalid-id"                                                         | 200 OK; Empty array returned                                                         |
| **Edge Case**           | Filter by non-existent user            | User ID invalid                                           | user: "invalid-id"                                                            | 200 OK; Empty array returned                                                         |
| **Integration**         | Create feedback updates product rating | Product with 2 feedbacks (rating 4, 5)                    | Submit new rating 3                                                           | Product rating = (4+5+3)/3 = 4                                                       |
| **Integration**         | Delete feedback updates product rating | Product with 3 feedbacks                                  | Delete one feedback                                                           | Product rating recalculated                                                          |
| **Integration**         | Email sent on delete                   | User deletes feedback                                     | DELETE request                                                                | Shop owner, user, reporter (if report exists) receive emails                         |
| **Error Handling**      | Database connection fails              | DB down                                                   | Any request                                                                   | 500 Error; message: "Failed to create feedback"                                      |
| **Error Handling**      | Email service fails                    | Valid delete request                                      | SMTP error                                                                    | 200 OK; deletion succeeds; error logged; no email sent                               |
| **Error Handling**      | Cloudinary upload fails                | Valid create request                                      | Cloudinary API error                                                          | 400/500 Error; feedback not created                                                  |

## 6. Test Priority Recommendation

### High Priority

**1. `createFeedback()` Controller** - **Why**: Core feature; business critical; directly impacts product ratings and user trust  
**2. `checkFeedbackOwner()` Middleware** - **Why**: Security vulnerability if broken; prevents unauthorized access  
**3. Duplicate prevention (unique index)** - **Why**: Data integrity issue; user experience impact  
**4. Validation middleware** - **Why**: Prevents invalid data; protects database integrity

### Medium Priority

**5. `updateFeedback()` Controller** - **Why**: Common use case but less critical than create  
**6. `deleteFeedback()` Controller** - **Why**: Affects content moderation; includes email integration complexity  
**7. Product rating aggregation** - **Why**: Important for product credibility; may have performance impact  
**8. Image upload validation** - **Why**: Security risk (malicious URLs); requires external service mocking

### Low Priority

**9. `getAllFeedback()` Controller** - **Why**: Read-only operation; simpler logic  
**10. `reportFeedback()` Controller** - **Why**: Secondary feature; less frequently used  
**11. `adminApproveFeedback()` Controller** - **Why**: Admin-only feature; lower user impact  
**12. Email notification content** - **Why**: Non-critical; can fail silently

## 7. Mocking & Test Data Preparation

| Dependency                    | What to Mock            | Mocking Strategy                                            | Sample Mock Data                                                                                                                                                                                                                                                                                  |
| ----------------------------- | ----------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MongoDB/Feedback Model**    | Database operations     | Use in-memory database or mock with `__mocks__/Feedback.js` | `{ _id: '507f1f77bcf86cd799439011', user: '507f1f77bcf86cd799439012', product: '507f1f77bcf86cd799439013', order: '507f1f77bcf86cd799439014', rating: 5, comment: 'Great product!', images: [], status: true, isVerified: false, deletedBy: null, createdAt: new Date(), updatedAt: new Date() }` |
| **MongoDB/Product Model**     | Product data            | Mock aggregate query for rating calculation                 | `[{ _id: productId, avgRating: 4.5 }]`                                                                                                                                                                                                                                                            |
| **MongoDB/Report Model**      | Report data             | Mock for duplicate report check and email triggers          | `{ _id: '507f1f77bcf86cd799439015', reporter: '507f1f77bcf86cd799439016', targetType: 'review', targetId: '507f1f77bcf86cd799439011', reason: 'spam', description: 'Repeated content', status: 'pending' }`                                                                                       |
| **MongoDB/User Model**        | User data (email, name) | Mock for email notifications                                | `{ _id: '507f1f77bcf86cd799439012', fullName: 'John Doe', email: 'john@example.com', role: 'customer' }`                                                                                                                                                                                          |
| **FeedbackService**           | Service layer methods   | Mock entire service or specific methods                     | `jest.mock('../services/feedback.service.js')`                                                                                                                                                                                                                                                    |
| **sendEmail.js**              | Email sending           | Mock to avoid actual email sends                            | `jest.mock('../utils/sendEmail.js', () => ({ sendTemplatedEmail: jest.fn().mockResolvedValue(true) }))`                                                                                                                                                                                           |
| **Authentication Middleware** | req.user object         | Mock in request object                                      | `{ id: '507f1f77bcf86cd799439012', role: 'customer', email: 'john@example.com' }`                                                                                                                                                                                                                 |
| **Cloudinary**                | Image upload API        | Mock upload middleware                                      | `{ path: 'https://res.cloudinary.com/example/image/upload/v123456/image.jpg' }`                                                                                                                                                                                                                   |
| **Order Model**               | Order status validation | Mock order exists and delivered                             | `{ _id: '507f1f77bcf86cd799439014', status: 'delivered', user: '507f1f77bcf86cd799439012' }`                                                                                                                                                                                                      |

## 8. Suggested Next Prompts

### Prompt 1: Generate Unit Tests

```
Create comprehensive Jest unit tests for the Feedback feature backend using the following specs:

Focus on these high-priority test cases:
- createFeedback() controller: Happy path, validation errors, duplicate prevention
- checkFeedbackOwner() middleware: Valid owner, unauthorized access
- Feedback model validation: Rating bounds, comment length, image URL format
- FeedbackService.createFeedback(): Rating aggregation, product update

Use the mocking strategies from the analysis document.
Include test coverage for edge cases: massive text, HTML injection, missing fields.
```

### Prompt 2: Generate Integration Tests

```
Create integration tests for the Feedback feature covering:

1. Full create feedback flow: POST /api/feedback → Database → Email sent → Product rating updated
2. Edit feedback flow: PUT /api/feedback/:id with owner check
3. Delete feedback flow: DELETE /api/feedback/:id with email notifications
4. Report feedback flow: POST /api/feedback/:id/report → Report creation → Emails sent
5. Admin moderation flow: PUT /api/feedback/:id/approve and DELETE /api/feedback/:id/delete

Test actual database operations, mock external services (email, Cloudinary).
Verify database state changes and email call arguments.
```

### Prompt 3: Generate E2E Tests

```
Create end-to-end tests for the Feedback feature using Supertest or similar tool:

Test scenarios:
1. User creates feedback from Order Details page
2. User edits their feedback
3. User deletes their feedback
4. User tries to edit another user's feedback (should fail with 403)
5. Admin views reported feedback in dashboard
6. Admin approves feedback
7. Admin deletes inappropriate feedback

Include UI component testing for: Feedback.jsx modal, OrderDetails.jsx review section, CommentSection.jsx display.

Verify API responses, database state, and UI state changes.
```

### Prompt 4: Generate Security Tests

```
Create security-focused tests for the Feedback feature:

1. Authorization bypass attempts: Update/delete another user's feedback
2. SQL/NoSQL injection: Malicious input in comment field
3. XSS attacks: Script tags in comments
4. Mass assignment: Attempting to set status, deletedBy, etc.
5. Duplicate submission bypass: Race condition tests
6. File upload abuse: Invalid file types, oversized files via Cloudinary

Use penetration testing techniques to identify vulnerabilities.
```

### Prompt 5: Generate Mock Data & Fixtures

```
Create a complete test data fixture library for the Feedback feature:

Include:
- Sample feedback objects for various scenarios (high rating, low rating, with images, without images)
- Mock user objects (customer, admin, shop owner)
- Mock order objects (delivered, pending, cancelled)
- Mock product objects with varying ratings
- Mock report objects (pending, resolved, investigating)
- Mock email payloads for all notification types

Include edge cases: deleted feedbacks, banned reviews, verified reviews.

Export as reusable factories/fixtures for all test types.
```
