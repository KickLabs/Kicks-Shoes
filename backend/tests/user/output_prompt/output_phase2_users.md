# test-cases-matrix-users.md

## Comprehensive Test Cases Matrix - Users Feature

**Feature**: Users (Profile Management, Authentication, Role-Based Access Control)  
**Modules**: `controllers/userController.js`, `services/user.service.js`, `models/User.js`, `routes/userRoutes.js`  
**Generated**: Based on Phase 1 Technical Analysis

---

## Test Cases Overview

| Category                 | Count  | Description                                        |
| ------------------------ | ------ | -------------------------------------------------- |
| Unit - User Model        | 20     | Schema validation, password hashing, matchPassword |
| Unit - User Controller   | 18     | Profile CRUD operations, status management         |
| Unit - User Service      | 8      | Pagination, search, filtering                      |
| Integration - API Routes | 15     | End-to-end route testing with middleware           |
| Edge Cases               | 12     | Error handling, boundary conditions                |
| Security                 | 10     | XSS, injection, unauthorized access                |
| **Total**                | **83** | **Complete coverage**                              |

---

## Unit Tests - User Model (models/User.js)

| Test ID | Category | Test Scenario                                      | Pre-conditions                            | Test Steps                                                                                                                               | Test Data                                                                                                                                        | Expected Result                                                                                                                                   | Priority | Dependencies                |
| ------- | -------- | -------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------- |
| UM-001  | Unit     | Create user with valid data                        | Database empty, Mongoose connected        | 1. Create user object with all required fields<br>2. Call `user.save()`<br>3. Verify user saved                                          | `{ fullName: 'John Doe', username: 'johndoe', email: 'john@example.com', password: 'password123', phone: '1234567890', address: '123 Main St' }` | User saved successfully, `_id` generated, default values applied (avatar URL, status: true, isVerified: false, reward_point: 0, role: 'customer') | HIGH     | Mongoose, bcrypt            |
| UM-002  | Unit     | Password hashing on save                           | User document created with plain password | 1. Create user with password 'password123'<br>2. Call `user.save()`<br>3. Retrieve user from DB<br>4. Verify password field              | `{ password: 'password123' }`                                                                                                                    | Password field contains bcrypt hash starting with `$2a$10$`, not plain text                                                                       | HIGH     | bcrypt.genSalt, bcrypt.hash |
| UM-003  | Unit     | Password not hashed when not modified              | Existing user in DB                       | 1. Fetch user from DB<br>2. Update non-password field (e.g., fullName)<br>3. Call `user.save()`<br>4. Compare password hash before/after | `{ fullName: 'Updated Name' }`                                                                                                                   | Password hash remains unchanged, pre-save hook skips hashing                                                                                      | HIGH     | bcrypt                      |
| UM-004  | Unit     | matchPassword returns true for correct password    | User exists with hashed password          | 1. Fetch user with select('+password')<br>2. Call `user.matchPassword('password123')`<br>3. Verify return value                          | `enteredPassword: 'password123'`, stored hash: `$2a$10$N9qo8u...`                                                                                | `matchPassword()` returns `true`                                                                                                                  | HIGH     | bcrypt.compare              |
| UM-005  | Unit     | matchPassword returns false for incorrect password | User exists with hashed password          | 1. Fetch user with select('+password')<br>2. Call `user.matchPassword('wrongpassword')`<br>3. Verify return value                        | `enteredPassword: 'wrongpassword'`                                                                                                               | `matchPassword()` returns `false`                                                                                                                 | HIGH     | bcrypt.compare              |
| UM-006  | Unit     | matchPassword handles empty password               | User exists                               | 1. Call `user.matchPassword('')`                                                                                                         | `enteredPassword: ''`                                                                                                                            | Returns `false` without throwing error                                                                                                            | MEDIUM   | bcrypt.compare              |
| UM-007  | Unit     | Validation: Missing required field - fullName      | None                                      | 1. Create user without fullName<br>2. Call `user.save()`                                                                                 | `{ username: 'test', email: 'test@example.com', password: 'pass' }` (missing fullName)                                                           | ValidationError thrown: 'Full name is required'                                                                                                   | HIGH     | Mongoose validation         |
| UM-008  | Unit     | Validation: Missing required field - username      | None                                      | 1. Create user without username<br>2. Call `user.save()`                                                                                 | `{ fullName: 'Test', email: 'test@example.com', password: 'pass' }` (missing username)                                                           | ValidationError thrown: 'Username is required'                                                                                                    | HIGH     | Mongoose validation         |
| UM-009  | Unit     | Validation: Missing required field - email         | None                                      | 1. Create user without email<br>2. Call `user.save()`                                                                                    | `{ fullName: 'Test', username: 'test', password: 'pass' }` (missing email)                                                                       | ValidationError thrown: 'Email is required'                                                                                                       | HIGH     | Mongoose validation         |
| UM-010  | Unit     | Validation: Invalid email format                   | None                                      | 1. Create user with invalid email<br>2. Call `user.save()`                                                                               | `{ email: 'invalid-email-format' }`                                                                                                              | ValidationError thrown: 'Please enter a valid email'                                                                                              | HIGH     | Mongoose validation         |
| UM-011  | Unit     | Validation: Email not lowercase                    | None                                      | 1. Create user with uppercase email<br>2. Call `user.save()`<br>3. Verify stored email                                                   | `{ email: 'John@EXAMPLE.COM' }`                                                                                                                  | Email stored as lowercase: 'john@example.com'                                                                                                     | MEDIUM   | Mongoose schema options     |
| UM-012  | Unit     | Validation: Username too short                     | None                                      | 1. Create user with 2-char username<br>2. Call `user.save()`                                                                             | `{ username: 'ab' }`                                                                                                                             | ValidationError: 'Username must be at least 3 characters long'                                                                                    | MEDIUM   | Mongoose validation         |
| UM-013  | Unit     | Validation: Username too long                      | None                                      | 1. Create user with 31-char username<br>2. Call `user.save()`                                                                            | `{ username: 'a'.repeat(31) }`                                                                                                                   | ValidationError: 'Username cannot exceed 30 characters'                                                                                           | MEDIUM   | Mongoose validation         |
| UM-014  | Unit     | Validation: Full name too short                    | None                                      | 1. Create user with 1-char fullName<br>2. Call `user.save()`                                                                             | `{ fullName: 'A' }`                                                                                                                              | ValidationError: 'Full name must be at least 2 characters long'                                                                                   | MEDIUM   | Mongoose validation         |
| UM-015  | Unit     | Validation: Full name too long                     | None                                      | 1. Create user with 51-char fullName<br>2. Call `user.save()`                                                                            | `{ fullName: 'a'.repeat(51) }`                                                                                                                   | ValidationError: 'Full name cannot exceed 50 characters'                                                                                          | MEDIUM   | Mongoose validation         |
| UM-016  | Unit     | Validation: Invalid phone format                   | None                                      | 1. Create user with 5-digit phone<br>2. Call `user.save()`                                                                               | `{ phone: '12345' }`                                                                                                                             | ValidationError: 'Please enter a valid phone number'                                                                                              | MEDIUM   | Mongoose validation         |
| UM-017  | Unit     | Validation: About me exceeds max length            | None                                      | 1. Create user with 501-char aboutMe<br>2. Call `user.save()`                                                                            | `{ aboutMe: 'a'.repeat(501) }`                                                                                                                   | ValidationError: 'About me cannot exceed 500 characters'                                                                                          | MEDIUM   | Mongoose validation         |
| UM-018  | Unit     | Validation: Invalid gender enum                    | None                                      | 1. Create user with gender 'unknown'<br>2. Call `user.save()`                                                                            | `{ gender: 'unknown' }`                                                                                                                          | ValidationError: 'unknown is not a valid gender'                                                                                                  | MEDIUM   | Mongoose validation         |
| UM-019  | Unit     | Validation: Invalid role enum                      | None                                      | 1. Create user with role 'superuser'<br>2. Call `user.save()`                                                                            | `{ role: 'superuser' }`                                                                                                                          | ValidationError: 'superuser is not a valid role'                                                                                                  | MEDIUM   | Mongoose validation         |
| UM-020  | Unit     | Duplicate email rejected                           | User with email exists                    | 1. Create first user with email<br>2. Create second user with same email<br>3. Call `user.save()`                                        | First: `{ email: 'test@example.com' }`, Second: same email                                                                                       | MongoError E11000: Duplicate key error on email field                                                                                             | HIGH     | MongoDB unique index        |

---

## Unit Tests - User Controller (controllers/userController.js)

| Test ID | Category | Test Scenario                                             | Pre-conditions                     | Test Steps                                                                                                                                     | Test Data                                                                                       | Expected Result                                                                        | Priority | Dependencies                       |
| ------- | -------- | --------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------- | ---------------------------------- |
| UC-001  | Unit     | getUserProfile returns full profile for verified user     | User exists with isVerified: true  | 1. Mock User.findOne() to return verified user<br>2. Call getUserProfile with req.params.username<br>3. Verify response                        | `username: 'johndoe'`, user isVerified: true                                                    | Status 200, full user object returned (excluding password, verificationToken)          | HIGH     | User.findOne, logger               |
| UC-002  | Unit     | getUserProfile returns limited fields for unverified user | User exists with isVerified: false | 1. Mock User.findOne() to return unverified user<br>2. Call getUserProfile<br>3. Verify response fields                                        | `username: 'unverified'`, user isVerified: false                                                | Status 200, only username, avatar, role returned                                       | MEDIUM   | User.findOne, logger               |
| UC-003  | Unit     | getUserProfile returns 404 for non-existent user          | No user in DB                      | 1. Mock User.findOne() to return null<br>2. Call getUserProfile<br>3. Verify error response                                                    | `username: 'nonexistent'`                                                                       | Status 404, ErrorResponse: 'User not found'                                            | HIGH     | User.findOne, ErrorResponse        |
| UC-004  | Unit     | updateUserProfile updates allowed fields only             | Authenticated user                 | 1. Mock req.user.\_id and req.body with mixed fields<br>2. Mock User.findByIdAndUpdate<br>3. Call updateUserProfile<br>4. Verify update object | `req.body: { fullName: 'Updated', email: 'new@email.com', password: 'newpass', role: 'admin' }` | Only fullName updated, email/password/role filtered out, Status 200                    | HIGH     | User.findByIdAndUpdate, logger     |
| UC-005  | Unit     | updateUserProfile handles avatar upload                   | Authenticated user, file uploaded  | 1. Mock req.file with Cloudinary path<br>2. Mock User.findByIdAndUpdate<br>3. Call updateUserProfile<br>4. Verify avatar in update             | `req.file: { path: 'https://cloudinary.com/avatar.jpg' }`                                       | Avatar field updated with HTTPS URL, Status 200                                        | HIGH     | User.findByIdAndUpdate, Cloudinary |
| UC-006  | Unit     | updateUserProfile without file upload                     | Authenticated user, no file        | 1. Set req.file to undefined<br>2. Mock User.findByIdAndUpdate<br>3. Call updateUserProfile<br>4. Verify avatar not in update                  | `req.file: undefined`, `req.body: { fullName: 'Updated' }`                                      | Avatar unchanged, only body fields updated                                             | MEDIUM   | User.findByIdAndUpdate             |
| UC-007  | Unit     | updateUserProfile returns 404 for non-existent user       | Invalid user ID in req.user        | 1. Mock User.findByIdAndUpdate to return null<br>2. Call updateUserProfile<br>3. Verify error                                                  | `req.user._id: 'invalid-id'`                                                                    | Status 404, ErrorResponse: 'User not found'                                            | HIGH     | User.findByIdAndUpdate             |
| UC-008  | Unit     | updateUserProfile logs successful update                  | Authenticated user                 | 1. Mock User.findByIdAndUpdate<br>2. Mock logger.info<br>3. Call updateUserProfile<br>4. Verify logger called                                  | Valid update data                                                                               | logger.info called with 'Profile updated successfully' and userId                      | MEDIUM   | logger                             |
| UC-009  | Unit     | updateUserProfile validates runValidators                 | Authenticated user                 | 1. Mock User.findByIdAndUpdate with invalid data<br>2. Call updateUserProfile<br>3. Verify validation error                                    | `req.body: { fullName: 'A' }` (too short)                                                       | ValidationError thrown, runValidators: true in findByIdAndUpdate options               | MEDIUM   | User.findByIdAndUpdate             |
| UC-010  | Unit     | toggleUserStatus flips status to false                    | Admin user, target user active     | 1. Mock User.findById to return active user<br>2. Mock user.save()<br>3. Call toggleUserStatus<br>4. Verify status flipped                     | Target user status: true                                                                        | Status 200, message: 'User has been banned', status: false                             | HIGH     | User.findById, user.save           |
| UC-011  | Unit     | toggleUserStatus flips status to true                     | Admin user, target user banned     | 1. Mock User.findById to return banned user<br>2. Mock user.save()<br>3. Call toggleUserStatus<br>4. Verify status flipped                     | Target user status: false                                                                       | Status 200, message: 'User has been unbanned', status: true                            | HIGH     | User.findById, user.save           |
| UC-012  | Unit     | toggleUserStatus returns 404 for non-existent user        | Admin user                         | 1. Mock User.findById to return null<br>2. Call toggleUserStatus<br>3. Verify error                                                            | `req.params.id: 'invalid-id'`                                                                   | Status 404, message: 'User not found'                                                  | HIGH     | User.findById                      |
| UC-013  | Unit     | getUsers calls UserService with query params              | Admin authenticated                | 1. Mock UserService.getAllUsers<br>2. Call getUsers with query params<br>3. Verify service called                                              | `req.query: { page: '2', limit: '20', keyword: 'john' }`                                        | UserService.getAllUsers called with query object, Status 200, returns { users, total } | HIGH     | UserService.getAllUsers            |
| UC-014  | Unit     | getUsers handles service error                            | Admin authenticated                | 1. Mock UserService.getAllUsers to throw error<br>2. Call getUsers<br>3. Verify error response                                                 | Query params                                                                                    | Status 500, error message returned                                                     | MEDIUM   | UserService.getAllUsers            |
| UC-015  | Unit     | getUser returns single user by ID                         | Admin authenticated                | 1. Mock User.findById to return user<br>2. Call getUser<br>3. Verify response                                                                  | `req.params.id: '507f1f77bcf86cd799439011'`                                                     | Status 200, user object returned (excluding password)                                  | MEDIUM   | User.findById                      |
| UC-016  | Unit     | getUser returns 404 for non-existent ID                   | Admin authenticated                | 1. Mock User.findById to return null<br>2. Call getUser<br>3. Verify error                                                                     | `req.params.id: 'nonexistent'`                                                                  | Status 404, message: 'User not found'                                                  | MEDIUM   | User.findById                      |
| UC-017  | Unit     | getUsersIsActive returns only active users                | Shop user authenticated            | 1. Mock User.find({ status: true })<br>2. Call getUsersIsActive<br>3. Verify filter                                                            | None                                                                                            | All returned users have status: true, password excluded                                | MEDIUM   | User.find                          |
| UC-018  | Unit     | getShopUser returns user with role shop                   | Any user                           | 1. Mock User.findOne({ role: 'shop' })<br>2. Call getShopUser<br>3. Verify response                                                            | None                                                                                            | Status 200, shop user returned, or 404 if not found                                    | LOW      | User.findOne                       |

---

## Unit Tests - User Service (services/user.service.js)

| Test ID | Category | Test Scenario                                              | Pre-conditions                       | Test Steps                                                                                                                                                           | Test Data                | Expected Result                                                                                         | Priority | Dependencies                   |
| ------- | -------- | ---------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------- | -------- | ------------------------------ |
| US-001  | Unit     | getAllUsers returns paginated users                        | 25 users in DB                       | 1. Mock User.countDocuments to return 25<br>2. Mock User.find().skip().limit() to return 10 users<br>3. Call getAllUsers({ page: 1, limit: 10 })<br>4. Verify result | `{ page: 1, limit: 10 }` | Returns { users: [10 users], total: 25 }, skip(0), limit(10)                                            | HIGH     | User.countDocuments, User.find |
| US-002  | Unit     | getAllUsers returns correct page 3                         | 25 users in DB                       | 1. Mock countDocuments to return 25<br>2. Mock find().skip().limit() for page 3<br>3. Call getAllUsers({ page: 3, limit: 10 })<br>4. Verify skip calculation         | `{ page: 3, limit: 10 }` | Returns users 21-25, skip(20), limit(10)                                                                | HIGH     | User.countDocuments, User.find |
| US-003  | Unit     | getAllUsers searches by keyword in fullName/email/username | Users in DB                          | 1. Mock User.find with $or filter<br>2. Call getAllUsers({ keyword: 'john' })<br>3. Verify filter contains $or with regex                                            | `{ keyword: 'john' }`    | Filter: `{ $or: [{ fullName: /john/i }, { email: /john/i }, { username: /john/i }] }`, case-insensitive | HIGH     | User.find                      |
| US-004  | Unit     | getAllUsers filters by status: true                        | 15 users in DB (10 active, 5 banned) | 1. Mock User.find with status filter<br>2. Call getAllUsers({ status: 'true' })<br>3. Verify filter                                                                  | `{ status: 'true' }`     | Filter: `{ status: true }`, returns only active users                                                   | MEDIUM   | User.find                      |
| US-005  | Unit     | getAllUsers filters by status: false                       | 15 users in DB                       | 1. Mock User.find with status: false<br>2. Call getAllUsers({ status: 'false' })<br>3. Verify filter                                                                 | `{ status: 'false' }`    | Filter: `{ status: false }`, returns only banned users                                                  | MEDIUM   | User.find                      |
| US-006  | Unit     | getAllUsers returns empty array for page beyond data       | 10 users in DB                       | 1. Mock countDocuments to return 10<br>2. Mock find to return []<br>3. Call getAllUsers({ page: 5, limit: 10 })                                                      | `{ page: 5, limit: 10 }` | Returns { users: [], total: 10 }                                                                        | MEDIUM   | User.countDocuments, User.find |
| US-007  | Unit     | getAllUsers handles empty keyword                          | 10 users in DB                       | 1. Call getAllUsers({ keyword: '' })<br>2. Verify no $or filter in query                                                                                             | `{ keyword: '' }`        | Returns all users, no keyword filter applied                                                            | MEDIUM   | User.find                      |
| US-008  | Unit     | getAllUsers logs errors on failure                         | DB error                             | 1. Mock User.countDocuments to throw error<br>2. Mock logger.error<br>3. Call getAllUsers<br>4. Verify logger and error thrown                                       | None                     | logger.error called with error details, error re-thrown                                                 | MEDIUM   | logger                         |

---

## Integration Tests - API Routes (routes/userRoutes.js)

| Test ID | Category    | Test Scenario                                                          | Pre-conditions                            | Test Steps                                                                                                                                             | Test Data                                                                                           | Expected Result                                                           | Priority | Dependencies                         |
| ------- | ----------- | ---------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------- | ------------------------------------ |
| INT-001 | Integration | GET /api/users returns paginated users (admin only)                    | Admin user logged in, 15 users in test DB | 1. Generate admin JWT token<br>2. Send GET /api/users?page=1&limit=10<br>3. Verify response                                                            | Headers: `Authorization: Bearer <admin-token>`, Query: `page=1&limit=10`                            | Status 200, returns { success: true, data: [10 users], total: 15 }        | HIGH     | Auth middleware, User model, Test DB |
| INT-002 | Integration | GET /api/users blocked for non-admin user                              | Regular customer logged in                | 1. Generate customer JWT token<br>2. Send GET /api/users<br>3. Verify rejection                                                                        | Headers: `Authorization: Bearer <customer-token>`                                                   | Status 403, error: 'Admin access required'                                | HIGH     | Auth middleware, requireAdmin        |
| INT-003 | Integration | GET /api/users/:id returns user by ID (admin)                          | Admin logged in, target user exists       | 1. Create test user in DB<br>2. Generate admin token<br>3. Send GET /api/users/:id<br>4. Verify user data                                              | Headers: `Authorization: Bearer <admin-token>`, Params: `id: <userId>`                              | Status 200, returns user object excluding password                        | MEDIUM   | Auth, requireAdmin, User model       |
| INT-004 | Integration | GET /api/users/profile returns current user                            | User logged in                            | 1. Create user in test DB<br>2. Generate JWT token for that user<br>3. Send GET /api/users/profile<br>4. Verify own data returned                      | Headers: `Authorization: Bearer <user-token>`                                                       | Status 200, returns { data: <current user> }                              | HIGH     | Auth middleware, protect             |
| INT-005 | Integration | GET /api/users/profile/:username returns public profile                | User exists in DB                         | 1. Create verified user<br>2. Send GET /api/users/profile/johndoe (no auth)<br>3. Verify response                                                      | Params: `username: 'johndoe'`                                                                       | Status 200, returns full profile (user is verified)                       | MEDIUM   | optionalAuth middleware              |
| INT-006 | Integration | GET /api/users/profile/:username returns limited fields for unverified | Unverified user exists                    | 1. Create unverified user<br>2. Send GET /api/users/profile/unverified<br>3. Verify limited fields                                                     | Params: `username: 'unverified'`                                                                    | Status 200, returns only { username, avatar, role }                       | MEDIUM   | optionalAuth, User model             |
| INT-007 | Integration | PUT /api/users/profile updates own profile                             | User logged in                            | 1. Create user in test DB<br>2. Generate JWT token<br>3. Send PUT /api/users/profile with updates<br>4. Verify DB update                               | Headers: `Authorization: Bearer <token>`, Body: `{ fullName: 'Updated Name', phone: '9876543210' }` | Status 200, user updated in DB, returns updated user                      | HIGH     | Auth, User model                     |
| INT-008 | Integration | PUT /api/users/profile uploads avatar to Cloudinary                    | User logged in                            | 1. Generate JWT token<br>2. Send PUT /api/users/profile with multipart/form-data<br>3. Upload avatar file<br>4. Verify Cloudinary upload and DB update | Headers: `Authorization: Bearer <token>`, Body: FormData with `avatar` file                         | Status 200, avatar field updated with Cloudinary HTTPS URL                | HIGH     | Auth, upload middleware, Cloudinary  |
| INT-009 | Integration | PUT /api/users/profile filters restricted fields                       | User logged in                            | 1. Generate token<br>2. Send PUT with email/password/role in body<br>3. Verify restricted fields not updated                                           | Body: `{ fullName: 'Valid', email: 'hacker@evil.com', role: 'admin' }`                              | Status 200, only fullName updated, email/role unchanged                   | HIGH     | Auth, updateUserProfile logic        |
| INT-010 | Integration | PUT /api/users/profile validates data                                  | User logged in                            | 1. Generate token<br>2. Send PUT with invalid data<br>3. Verify validation error                                                                       | Body: `{ fullName: 'A' }` (too short)                                                               | Status 400, ValidationError                                               | MEDIUM   | Auth, Mongoose validation            |
| INT-011 | Integration | PATCH /api/users/:id/status bans user (admin)                          | Admin logged in, target user active       | 1. Create target user (active)<br>2. Generate admin token<br>3. Send PATCH /api/users/:id/status<br>4. Verify status toggled in DB                     | Headers: `Authorization: Bearer <admin-token>`, Params: `id: <userId>`                              | Status 200, user.status changed to false, message: 'User has been banned' | HIGH     | Auth, requireAdmin, User model       |
| INT-012 | Integration | PATCH /api/users/:id/status blocked for non-admin                      | Customer logged in                        | 1. Generate customer token<br>2. Send PATCH /api/users/:id/status<br>3. Verify rejection                                                               | Headers: `Authorization: Bearer <customer-token>`                                                   | Status 403, error: 'Admin access required'                                | HIGH     | Auth, requireAdmin                   |
| INT-013 | Integration | GET /api/users/shop returns shop user                                  | Shop user exists in DB                    | 1. Create user with role: 'shop'<br>2. Send GET /api/users/shop (public)<br>3. Verify shop user returned                                               | None                                                                                                | Status 200, returns shop user object                                      | LOW      | User model                           |
| INT-014 | Integration | GET /api/users/active returns only active users (shop)                 | Shop user logged in, mixed users in DB    | 1. Create 5 active + 3 banned users<br>2. Generate shop token<br>3. Send GET /api/users/active<br>4. Verify only active returned                       | Headers: `Authorization: Bearer <shop-token>`                                                       | Status 200, returns 5 active users only                                   | MEDIUM   | Auth, requireShop, User model        |
| INT-015 | Integration | All protected routes reject requests without token                     | No auth token                             | 1. Send requests to protected routes without Authorization header<br>2. Verify all rejected                                                            | Routes: GET /api/users, PUT /api/users/profile, etc.                                                | Status 401, error: 'No valid token provided'                              | HIGH     | Auth middleware                      |

---

## Edge Cases

| Test ID  | Category | Test Scenario                                         | Pre-conditions                 | Test Steps                                                                                                        | Test Data                                       | Expected Result                                                               | Priority | Dependencies                         |
| -------- | -------- | ----------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- | -------- | ------------------------------------ |
| EDGE-001 | Edge     | updateUserProfile with partial update                 | User logged in                 | 1. Send PUT /api/users/profile with only 1 field<br>2. Verify only that field updated                             | Body: `{ phone: '1112223333' }` (only phone)    | Status 200, only phone updated, other fields unchanged                        | MEDIUM   | User.findByIdAndUpdate               |
| EDGE-002 | Edge     | updateUserProfile with large payload                  | User logged in                 | 1. Send PUT with many fields + large aboutMe<br>2. Verify all valid fields updated                                | Body: All allowed fields + `aboutMe: 500 chars` | Status 200, all valid fields updated, aboutMe at max length                   | MEDIUM   | User model validation                |
| EDGE-003 | Edge     | updateUserProfile with invalid date of birth (future) | User logged in                 | 1. Send PUT with dateOfBirth in future<br>2. Verify rejection (if frontend validation exists)                     | Body: `{ dateOfBirth: '2030-01-01' }`           | Status 400 or data accepted (backend doesn't validate), frontend should catch | LOW      | User model                           |
| EDGE-004 | Edge     | getUserProfile with special characters in username    | User exists with special chars | 1. Create user with username containing dots<br>2. Send GET /api/users/profile/user.name<br>3. Verify user found  | Params: `username: 'user.name'`                 | Status 200, user returned (if username allows special chars)                  | LOW      | User.findOne                         |
| EDGE-005 | Edge     | getAllUsers with invalid page number                  | Admin logged in                | 1. Send GET /api/users?page=-1<br>2. Verify handling                                                              | Query: `page=-1, limit=10`                      | Should default to page 1 or return validation error                           | MEDIUM   | UserService validation               |
| EDGE-006 | Edge     | getAllUsers with very large limit                     | Admin logged in                | 1. Send GET /api/users?limit=999999<br>2. Verify handling                                                         | Query: `page=1, limit=999999`                   | Should enforce max limit or return all users (performance concern)            | MEDIUM   | UserService validation               |
| EDGE-007 | Edge     | getAllUsers keyword with regex special chars          | Admin logged in                | 1. Send GET /api/users?keyword=user@domain.com<br>2. Verify no regex injection                                    | Query: `keyword='user@domain.com'`              | Regex special chars escaped, no error thrown, safe search                     | MEDIUM   | UserService regex handling           |
| EDGE-008 | Edge     | toggleUserStatus with invalid ObjectId                | Admin logged in                | 1. Send PATCH /api/users/invalid-id/status<br>2. Verify error handling                                            | Params: `id: 'not-an-objectid'`                 | Status 500 or 400, error message about invalid ID                             | MEDIUM   | Mongoose, toggleUserStatus           |
| EDGE-009 | Edge     | Upload oversized avatar file                          | User logged in                 | 1. Attempt PUT /api/users/profile with >10MB file<br>2. Verify multer rejects                                     | File: 11MB image                                | Status 400, error: File size exceeds limit                                    | MEDIUM   | upload middleware, multer            |
| EDGE-010 | Edge     | Upload non-image file as avatar                       | User logged in                 | 1. Attempt PUT /api/users/profile with .pdf file<br>2. Verify multer rejects                                      | File: document.pdf                              | Status 400, error: 'Only image files are allowed!'                            | MEDIUM   | upload middleware, multer fileFilter |
| EDGE-011 | Edge     | Duplicate username creation attempt                   | User with username exists      | 1. Create user with username 'testuser'<br>2. Attempt to create another with same username<br>3. Verify rejection | Second user: `{ username: 'testuser' }`         | MongoError E11000, duplicate key error                                        | HIGH     | MongoDB unique index                 |
| EDGE-012 | Edge     | matchPassword with very long password                 | User exists                    | 1. Call matchPassword with 100-char string<br>2. Verify bcrypt handles gracefully                                 | `enteredPassword: 'a'.repeat(100)`              | Returns false (or true if matches), no error (bcrypt has 72-byte limit)       | LOW      | bcrypt.compare                       |

---

## Security Tests

| Test ID | Category | Test Scenario                                       | Pre-conditions              | Test Steps                                                                                                               | Test Data                                             | Expected Result                                                                 | Priority | Dependencies                     |
| ------- | -------- | --------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------- | -------- | -------------------------------- |
| SEC-001 | Security | XSS attempt in fullName field                       | User logged in              | 1. Send PUT /api/users/profile with XSS payload in fullName<br>2. Verify sanitization or rejection                       | Body: `{ fullName: '<script>alert("XSS")</script>' }` | XSS payload escaped/sanitized, or rejected with validation error                | HIGH     | Input sanitization middleware    |
| SEC-002 | Security | XSS attempt in aboutMe field                        | User logged in              | 1. Send PUT /api/users/profile with XSS in aboutMe<br>2. Verify handling                                                 | Body: `{ aboutMe: '<img src=x onerror=alert(1)>' }`   | XSS payload escaped/sanitized                                                   | HIGH     | Input sanitization               |
| SEC-003 | Security | NoSQL injection in email search                     | Admin logged in             | 1. Send GET /api/users?keyword={"$ne":null}<br>2. Verify query sanitization                                              | Query: `keyword={"$ne":null}`                         | Query treated as string, no NoSQL injection, safe search                        | HIGH     | Query sanitization               |
| SEC-004 | Security | SQL injection attempt in username (N/A for MongoDB) | User registration           | 1. Attempt register with username containing SQL<br>2. Verify no injection                                               | `{ username: "admin'--" }`                            | Treated as literal string, MongoDB not vulnerable to SQL injection              | LOW      | Mongoose (inherently safe)       |
| SEC-005 | Security | Unauthorized profile update (user A updates user B) | Two users exist             | 1. Login as User A<br>2. Attempt to manipulate req.user.\_id to User B<br>3. Verify rejection                            | User A token, attempt to modify User B                | Fails: req.user.\_id set by middleware (immutable), User A can only update self | HIGH     | Auth middleware, protect         |
| SEC-006 | Security | Role escalation via profile update                  | Customer logged in          | 1. Send PUT /api/users/profile with role: 'admin'<br>2. Verify role not updated                                          | Body: `{ role: 'admin' }`                             | Status 200, role unchanged (filtered out by allowedUpdates)                     | HIGH     | updateUserProfile logic          |
| SEC-007 | Security | Password exposure in API responses                  | Any API call returning user | 1. Call GET /api/users/:id<br>2. Verify password not in response                                                         | Admin token, valid user ID                            | User object returned without password field (select('-password'))               | HIGH     | Controller select logic          |
| SEC-008 | Security | Token reuse after logout                            | User logs out               | 1. Login, get token<br>2. Logout (token blacklisted)<br>3. Attempt to use same token for API call<br>4. Verify rejection | Headers: `Authorization: Bearer <blacklisted-token>`  | Status 401, error: 'Token has been invalidated'                                 | HIGH     | Auth middleware, TokenBlacklist  |
| SEC-009 | Security | Bypass authentication with malformed token          | No valid token              | 1. Send request with Authorization: 'Bearer undefined'<br>2. Verify rejection                                            | Headers: `Authorization: 'Bearer undefined'`          | Status 401, error: 'No valid token provided'                                    | HIGH     | Auth middleware token validation |
| SEC-010 | Security | Access protected route with expired token           | Token expired               | 1. Generate token with past expiry<br>2. Send request to protected route<br>3. Verify rejection                          | Headers: `Authorization: Bearer <expired-token>`      | Status 401, error: 'Not authorized to access this route'                        | HIGH     | Auth middleware, jwt.verify      |

---

## Test Execution Priority Guide

### Priority Levels

- **HIGH (Critical)**: Must pass before release. Security, authentication, core CRUD operations.
- **MEDIUM (Important)**: Should pass. Feature completeness, validation, common edge cases.
- **LOW (Optional)**: Nice to have. Uncommon edge cases, logging, informational tests.

### Recommended Test Execution Order

1. **Phase 1 - Unit Tests**: UM-001 to UM-020, UC-001 to UC-018, US-001 to US-008 (Foundation)
2. **Phase 2 - Security Tests**: SEC-001 to SEC-010 (Critical vulnerabilities)
3. **Phase 3 - Integration Tests**: INT-001 to INT-015 (API contract validation)
4. **Phase 4 - Edge Cases**: EDGE-001 to EDGE-012 (Robustness)

---

## Dependencies & Mocking Requirements

### Required Mocks for Unit Tests

| Dependency                  | Mock Method             | Purpose                    |
| --------------------------- | ----------------------- | -------------------------- |
| `User.findOne()`            | `jest.spyOn()` or stub  | Simulate DB queries        |
| `User.findById()`           | `jest.spyOn()`          | Find user by ID            |
| `User.findByIdAndUpdate()`  | `jest.spyOn()`          | Update operations          |
| `User.create()`             | `jest.spyOn()`          | Create user                |
| `bcrypt.hash()`             | `jest.mock('bcryptjs')` | Fast deterministic hashing |
| `bcrypt.compare()`          | `jest.mock('bcryptjs')` | Password comparison        |
| `logger.info/error()`       | `jest.spyOn()`          | Prevent console spam       |
| `UserService.getAllUsers()` | `jest.spyOn()`          | Service layer isolation    |
| `req, res, next`            | `node-mocks-http`       | HTTP mocks                 |

### Required Setup for Integration Tests

| Requirement     | Setup Method                                             |
| --------------- | -------------------------------------------------------- |
| Test Database   | MongoDB in-memory server or separate test DB             |
| JWT Tokens      | Helper function to generate valid/expired/invalid tokens |
| Test Users      | Seed function to create users with different roles       |
| Cloudinary Mock | Mock cloudinary upload or use test account               |
| File Uploads    | Mock `multer` or use real files in test fixtures         |

---

## Test Data Samples

### Sample User Objects

```javascript
// Valid Test User
const validUser = {
  fullName: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  password: 'Password123!',
  phone: '1234567890',
  address: '123 Test St, Test City, TS 12345',
};

// Admin User
const adminUser = {
  ...validUser,
  username: 'admin',
  email: 'admin@example.com',
  role: 'admin',
};

// Unverified User
const unverifiedUser = {
  ...validUser,
  username: 'unverified',
  email: 'unverified@example.com',
  isVerified: false,
};

// Banned User
const bannedUser = {
  ...validUser,
  username: 'banned',
  email: 'banned@example.com',
  status: false,
};
```

### JWT Token Samples

```javascript
// Valid Token (use real JWT generation)
const validToken = generateToken({ id: userId }, '1d');

// Expired Token
const expiredToken = generateToken({ id: userId }, '-1s');

// Invalid Signature Token
const invalidToken = validToken.slice(0, -5) + 'XXXXX';
```

---

## Test Coverage Goals

| Module                    | Target Coverage | Current Priority |
| ------------------------- | --------------- | ---------------- |
| User Model                | 95%+            | HIGH             |
| User Controller           | 90%+            | HIGH             |
| User Service              | 85%+            | MEDIUM           |
| User Routes (Integration) | 80%+            | HIGH             |
| Edge Cases                | 70%+            | MEDIUM           |
| Security Tests            | 100%            | HIGH             |

**Total Test Cases**: 83  
**Estimated Execution Time**: ~15-20 minutes (all tests)  
**Manual Tests Required**: File upload UI tests (Cloudinary), Browser-based XSS testing

---

## Notes

1. **File Upload Tests**: Integration tests for avatar upload require Cloudinary mock or test account.
2. **Database State**: Each test should clean up after itself (use `beforeEach` to clear collections).
3. **Token Generation**: Use helper function to generate tokens with different expiry times for testing.
4. **Parallel Execution**: Unit tests can run in parallel; integration tests should run serially if sharing DB.
5. **Environment Variables**: Ensure `JWT_SECRET`, `CLOUDINARY_*` vars set for integration tests.
6. **Mongoose Validation**: Some tests rely on Mongoose validation being enabled (ensure `runValidators: true`).

---

**Document Version**: 1.0  
**Last Updated**: Generated from Phase 1 Analysis  
**Total Test Cases**: 83  
**Coverage**: Unit (46), Integration (15), Edge (12), Security (10)
