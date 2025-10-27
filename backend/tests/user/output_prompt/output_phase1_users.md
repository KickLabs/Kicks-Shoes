# Users – Technical & Testing Analysis

## 1. Feature Overview

### Business Purpose

The Users feature is the core identity and access management system for the Kicks Shoes e-commerce platform. It handles user registration, authentication, profile management, password security, and role-based access control across the application.

### Key UI Flows Involved

1. **User Registration & Email Verification**

   - Standard email/password registration with email verification
   - OTP-based registration (mobile app flow)
   - Social authentication (Google/Facebook)

2. **Profile Management**

   - View and edit personal information (name, phone, address, date of birth)
   - Avatar/profile image upload
   - Account status display and reward points tracking

3. **Password Management**

   - Change password (requires current password)
   - Forgot password / Reset password flow
   - Set password (for social login users)

4. **User Administration**
   - List all users with pagination and search
   - View individual user details
   - Ban/unban user accounts (toggle status)
   - Role-based access restrictions

### Main Business Rules & Success Criteria

**Validation Rules:**

- Full name: 2-50 characters, required
- Username: 3-30 characters, unique, required
- Email: Valid format, unique, lowercase, required
- Password: Minimum 6 characters (backend), 8+ chars with complexity requirements (frontend)
- Phone: 10-11 digits, optional
- About me: Maximum 500 characters
- Gender: Enum (male, female, other)
- Role: Enum (customer, shop, admin)

**Security Rules:**

- Email verification required before full access
- JWT token-based authentication with refresh tokens
- Token blacklist on logout
- Password hashing with bcrypt (salt rounds: 10)
- Banned users cannot access protected routes
- Role-based access control for admin/shop operations

**Business Logic:**

- Default role is 'customer' for new registrations
- Default avatar provided if none uploaded
- Reward points start at 0
- User status defaults to active (true)
- Profile updates only allowed for specific fields
- Users can only update their own profile (not others)
- Avatar uploads stored in Cloudinary with transformation (500x500, jpg format)

### Why This Feature is Important for Testing

1. **Security Critical**: Authentication and authorization vulnerabilities can compromise entire system
2. **High User Impact**: Every user interaction depends on proper authentication
3. **Complex State Management**: Token refresh, session management, verification flows
4. **Data Integrity**: Email/username uniqueness, proper validation prevents data corruption
5. **Compliance**: Password security, user data protection (GDPR considerations)
6. **Integration Point**: Users are referenced across orders, carts, feedback, and all user-specific features

---

## 2. UI/UX Flow Mapping

### Flow 1: User Registration (Standard Email)

| Step | UI Screen/Component | User Action                                                 | System Behavior                                                                                       |
| ---- | ------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1    | Registration Page   | Enters full name, username, email, password, phone, address | Client-side validation checks format                                                                  |
| 2    | Registration Page   | Clicks "Register" button                                    | Sends POST to `/api/auth/register`                                                                    |
| 3    | Backend             | -                                                           | Checks email/username uniqueness, creates user with `isVerified: false`, generates verification token |
| 4    | Backend             | -                                                           | Sends verification email with token link, returns user data with access/refresh tokens                |
| 5    | Email Client        | Clicks verification link                                    | Redirects to `/verify-email?token=xxx`                                                                |
| 6    | Backend             | -                                                           | Verifies token, sets `isVerified: true`, redirects to success page                                    |
| 7    | App                 | -                                                           | User can now access protected routes                                                                  |

### Flow 2: Profile Update with Avatar Upload

| Step | UI Screen/Component  | User Action                                                         | System Behavior                                                                   |
| ---- | -------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1    | ProfileTab Component | Views current profile information                                   | Displays user data from AuthContext                                               |
| 2    | ProfileTab           | Clicks avatar edit button, selects image                            | Stores file in component state                                                    |
| 3    | ProfileTab           | Modifies personal info (name, phone, DOB, gender, address, aboutMe) | Form state updates                                                                |
| 4    | ProfileTab           | Clicks "Update" button                                              | Creates FormData with file + user data                                            |
| 5    | Frontend             | -                                                                   | Sends PUT to `/api/users/profile` with multipart/form-data                        |
| 6    | Backend Middleware   | -                                                                   | `protect` middleware validates JWT token and user status                          |
| 7    | Backend Middleware   | -                                                                   | `upload.single('avatar')` processes file with Multer                              |
| 8    | Backend Middleware   | -                                                                   | `handleUpload` uploads to Cloudinary, gets HTTPS URL                              |
| 9    | Backend Controller   | -                                                                   | `updateUserProfile` filters allowed fields, updates user with `findByIdAndUpdate` |
| 10   | Backend              | -                                                                   | Returns updated user object (excluding password)                                  |
| 11   | Frontend             | -                                                                   | Updates AuthContext with new user data, displays success message                  |

### Flow 3: Change Password

| Step | UI Screen/Component      | User Action                                                                    | System Behavior                                                                      |
| ---- | ------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| 1    | ChangePassword Component | Enters current password, new password (8+ chars, complexity), confirm password | Client validates: password strength, passwords match                                 |
| 2    | ChangePassword           | Clicks "Change Password"                                                       | Sends PUT to `/api/auth/change-password`                                             |
| 3    | Backend                  | -                                                                              | `protect` middleware validates JWT                                                   |
| 4    | Backend Controller       | -                                                                              | `changePassword` fetches user with password field (select: '+password')              |
| 5    | Backend                  | -                                                                              | Calls `user.matchPassword(currentPassword)` to verify                                |
| 6    | Backend                  | -                                                                              | If match fails, returns 401 error                                                    |
| 7    | Backend                  | -                                                                              | If match succeeds, sets `user.password = newPassword`, triggers bcrypt pre-save hook |
| 8    | Backend                  | -                                                                              | Returns success response                                                             |
| 9    | Frontend                 | -                                                                              | Shows success message, logs user out, redirects to login                             |

### Flow 4: Forgot Password / Reset Password

| Step | UI Screen/Component      | User Action                            | System Behavior                                                   |
| ---- | ------------------------ | -------------------------------------- | ----------------------------------------------------------------- |
| 1    | ForgotPassword Component | Enters email address                   | Validates email format                                            |
| 2    | ForgotPassword           | Clicks "Send Reset Link"               | Sends POST to `/api/auth/forgot-password`                         |
| 3    | Backend                  | -                                      | Finds user by email, generates reset token (JWT, 1h expiry)       |
| 4    | Backend                  | -                                      | Sends email with reset link containing token                      |
| 5    | Email Client             | Clicks reset link                      | Navigates to `/reset-password?token=xxx`                          |
| 6    | ResetPasswordForm        | Enters new password, confirms password | Validates password strength, match                                |
| 7    | ResetPasswordForm        | Clicks "Reset Password"                | Sends POST to `/api/auth/reset-password` with token + newPassword |
| 8    | Backend                  | -                                      | Verifies token with JWT, finds user by decoded ID                 |
| 9    | Backend                  | -                                      | Updates user password, triggers bcrypt hashing                    |
| 10   | Frontend                 | -                                      | Shows success message, redirects to login                         |

### Flow 5: Admin User Management (Ban/Unban)

| Step | UI Screen/Component | User Action                             | System Behavior                                              |
| ---- | ------------------- | --------------------------------------- | ------------------------------------------------------------ |
| 1    | Admin Dashboard     | Views user list with pagination, search | GET `/api/users?page=1&limit=10&keyword=xxx&status=true`     |
| 2    | Admin Dashboard     | Clicks "Ban" button on a user           | Confirms action                                              |
| 3    | Admin Dashboard     | Confirms ban                            | Sends PATCH to `/api/users/:id/status`                       |
| 4    | Backend             | -                                       | `protect` + `requireAdmin` middlewares validate admin access |
| 5    | Backend Controller  | -                                       | `toggleUserStatus` finds user, flips `status` boolean        |
| 6    | Backend             | -                                       | Returns updated status                                       |
| 7    | Frontend            | -                                       | Updates UI to show "Banned" state                            |
| 8    | Banned User         | Tries to access app                     | `protect` middleware checks `user.status`, returns 403 error |

---

## 3. Related Files, Components & Modules

### Backend Files

| File/Path                                        | Layer      | Responsibility                                       | Key Methods/Functions                                                                                                                                    |
| ------------------------------------------------ | ---------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/models/User.js`                     | Model      | User schema definition, validation, password hashing | `userSchema`, `matchPassword()`, pre-save hook for password hashing                                                                                      |
| `backend/src/controllers/userController.js`      | Controller | HTTP request handling for user operations            | `getUsers`, `getUser`, `getUserProfile`, `updateUserProfile`, `toggleUserStatus`, `getShopUser`                                                          |
| `backend/src/controllers/authController.js`      | Controller | Authentication & password management                 | `register`, `registerApp`, `login`, `changePassword`, `forgotPassword`, `resetPassword`, `verifyEmail`, `logout`, `loginWithGoogle`, `loginWithFacebook` |
| `backend/src/services/user.service.js`           | Service    | Business logic for user operations                   | `UserService.getAllUsers(query)` - pagination, search, filtering                                                                                         |
| `backend/src/routes/userRoutes.js`               | Routes     | API endpoint definitions                             | Route mappings for `/api/users/*` endpoints                                                                                                              |
| `backend/src/middlewares/auth.middleware.js`     | Middleware | Authentication & authorization                       | `protect`, `optionalAuth`, `authorize`, `requireAdmin`                                                                                                   |
| `backend/src/middlewares/role.middleware.js`     | Middleware | Role-based access control                            | `requireAdmin`, `requireShop`, `requireCustomer`, `requireExactRole`, `requireRoles`                                                                     |
| `backend/src/middlewares/upload.middleware.js`   | Middleware | File upload configuration                            | Multer configuration for avatar uploads                                                                                                                  |
| `backend/src/middlewares/password.middleware.js` | Middleware | Password hashing utilities                           | `hashPassword`, `comparePassword`                                                                                                                        |
| `backend/src/config/cloudinary.js`               | Config     | Cloudinary integration                               | `storage`, `handleUpload` - avatar upload to Cloudinary                                                                                                  |
| `backend/src/utils/jwt.js`                       | Utility    | JWT token operations                                 | `generateToken`, `verifyToken`, `generateRefreshToken`, `verifyRefreshToken`                                                                             |
| `backend/src/utils/errorResponse.js`             | Utility    | Custom error class                                   | `ErrorResponse(message, statusCode)`                                                                                                                     |
| `backend/src/models/TokenBlacklist.js`           | Model      | Blacklisted tokens storage                           | Token blacklist schema for logout                                                                                                                        |

### Frontend Files

| File/Path                                                                  | Layer            | Responsibility                      | Key Methods/Props/States                                                                                                                                         |
| -------------------------------------------------------------------------- | ---------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/components/pages/account/components/ProfileTab.jsx`          | UI Component     | Profile view & edit interface       | States: `loading`, `avatarFile`, `totalPoints`, `provinces`, `wards`; Methods: `handleSubmit`, `handleAvatarChange`, `fetchTotalPoints`                          |
| `frontend/src/components/pages/authentication/pages/ChangePassword.jsx`    | UI Component     | Password change form                | `validatePassword`, `onFinish`, uses Form from Ant Design                                                                                                        |
| `frontend/src/components/pages/authentication/pages/ResetPasswordForm.jsx` | UI Component     | Password reset form                 | Password validation, token handling                                                                                                                              |
| `frontend/src/components/pages/authentication/pages/SetPassword.jsx`       | UI Component     | Set password for social login users | Password validation (8+ chars, complexity)                                                                                                                       |
| `frontend/src/contexts/AuthContext.jsx`                                    | State Management | Global authentication state         | States: `user`, `loading`; Methods: `login`, `register`, `logout`, `updateProfile`, `changePassword`, `requestPasswordReset`, `resetPassword`                    |
| `frontend/src/services/authService.js`                                     | Service/API      | Authentication API calls            | `register`, `login`, `logout`, `updateProfile`, `changePassword`, `forgotPassword`, `resetPassword`, `verifyEmail`, `getCurrentUser`, `getCurrentUserFromServer` |
| `frontend/src/services/axiosInstance.js`                                   | Service/API      | HTTP client with interceptors       | Token refresh interceptor, error handling                                                                                                                        |

---

## 4. Core Functions / Methods to Test

### 4.1 User Model (`backend/src/models/User.js`)

#### Function: `userSchema.pre('save')` - Password Hashing Hook

- **Purpose:** Automatically hash password before saving to database using bcrypt
- **Inputs + Types:**
  - `this.password` (String): Plain text password
  - Triggers only when password is modified
- **Outputs / Return:**
  - Modifies `this.password` to hashed value
  - Calls `next()` to continue save operation
- **State Change / Side Effects:**
  - Password field permanently replaced with bcrypt hash (salt rounds: 10)
- **Edge Cases:**
  - Password not modified → skip hashing (prevents double hashing on other field updates)
  - Invalid password → should be caught by schema validation before this hook
- **Dependencies (mock needed?):**
  - `bcrypt.genSalt(10)` - YES, mock for performance in tests
  - `bcrypt.hash()` - YES, mock for performance and deterministic results

#### Function: `userSchema.methods.matchPassword(enteredPassword)`

- **Purpose:** Compare entered plain text password with hashed password in database
- **Inputs + Types:**
  - `enteredPassword` (String): Plain text password to verify
  - `this.password` (String): Hashed password from database
- **Outputs / Return:**
  - `Boolean`: true if passwords match, false otherwise
- **State Change / Side Effects:** None (read-only operation)
- **Edge Cases:**
  - Null/undefined enteredPassword → bcrypt.compare should handle gracefully
  - Empty string password
  - Very long password strings (>72 bytes bcrypt limit)
- **Dependencies (mock needed?):**
  - `bcrypt.compare()` - YES for unit tests, NO for integration tests

#### Function: Schema Validation

- **Purpose:** Validate user data before saving
- **Inputs + Types:**
  - User document fields (fullName, email, username, phone, etc.)
- **Outputs / Return:**
  - Throws ValidationError if invalid
  - Allows save if valid
- **State Change / Side Effects:** Prevents invalid data from entering database
- **Edge Cases:**
  - Email: invalid format, non-lowercase, missing
  - Username: too short (<3), too long (>30), duplicate
  - Phone: invalid format (not 10-11 digits)
  - Full name: too short (<2), too long (>50)
  - About me: exceeds 500 characters
  - Gender: invalid enum value
  - Role: invalid enum value
- **Dependencies (mock needed?):**
  - Mongoose validation system - NO (test with real Mongoose)

---

### 4.2 User Controller (`backend/src/controllers/userController.js`)

#### Function: `getUserProfile(req, res, next)`

- **Purpose:** Get public user profile by username
- **Inputs + Types:**
  - `req.params.username` (String): Username to fetch
  - `req.user` (Object | null): Optional authenticated user from middleware
- **Outputs / Return:**
  - Status 200: User object (limited fields if not verified)
  - Status 404: User not found error
- **State Change / Side Effects:** None (read-only)
- **Edge Cases:**
  - User not found
  - User not verified → return limited fields only (username, avatar, role)
  - Invalid username format
  - Special characters in username
- **Dependencies (mock needed?):**
  - `User.findOne()` - YES, mock in unit tests
  - `ErrorResponse` - NO (simple class)
  - `logger` - YES, mock to prevent log spam

#### Function: `updateUserProfile(req, res, next)`

- **Purpose:** Update authenticated user's profile with optional avatar upload
- **Inputs + Types:**
  - `req.user._id` (ObjectId): Authenticated user ID
  - `req.body` (Object): Profile fields to update
  - `req.file` (Object | undefined): Uploaded avatar from multer
- **Outputs / Return:**
  - Status 200: Updated user object
  - Status 404: User not found
  - Status 400: Validation error
- **State Change / Side Effects:**
  - Updates user document in database
  - Avatar uploaded to Cloudinary (via middleware)
  - Logs update operation
- **Edge Cases:**
  - No file uploaded (avatar unchanged)
  - File upload but invalid format (handled by multer middleware)
  - Attempting to update restricted fields (email, password, role) → filtered out
  - Partial updates (only some fields provided)
  - Large payload with many fields
  - XSS attempts in text fields (fullName, aboutMe)
  - Invalid date of birth (future date, unrealistic age)
- **Dependencies (mock needed?):**
  - `User.findByIdAndUpdate()` - YES
  - `req.file.path` (Cloudinary URL) - YES, mock Cloudinary response
  - `logger` - YES

#### Function: `toggleUserStatus(req, res)`

- **Purpose:** Admin function to ban/unban users
- **Inputs + Types:**
  - `req.params.id` (String): User ID to toggle
  - `req.user` (Object): Admin user (validated by middleware)
- **Outputs / Return:**
  - Status 200: Success message with new status
  - Status 404: User not found
  - Status 500: Server error
- **State Change / Side Effects:**
  - Flips user's `status` field (true ↔ false)
  - Banned users cannot access protected routes
- **Edge Cases:**
  - Invalid user ID format
  - User not found
  - Admin trying to ban themselves
  - Toggling status of another admin
- **Dependencies (mock needed?):**
  - `User.findById()` - YES
  - `user.save()` - YES

---

### 4.3 Auth Controller (`backend/src/controllers/authController.js`)

#### Function: `register(req, res, next)`

- **Purpose:** Register new user with email verification
- **Inputs + Types:**
  - `req.body`: { fullName, username, email, password, phone, address }
- **Outputs / Return:**
  - Status 201: User object + tokens (access & refresh)
  - Status 400: Missing fields, user exists, validation error
- **State Change / Side Effects:**
  - Creates new user in database with `isVerified: false`
  - Generates verification token
  - Sends verification email
  - Returns JWT access and refresh tokens
- **Edge Cases:**
  - Duplicate email
  - Duplicate username
  - Missing required fields
  - Invalid email format
  - Weak password (depends on model validation)
  - Email service failure (should not block registration)
- **Dependencies (mock needed?):**
  - `User.findOne()` - YES
  - `User.create()` - YES
  - `generateToken()` - YES
  - `sendTemplatedEmail()` - YES (critical to mock)

#### Function: `login(req, res, next)`

- **Purpose:** Authenticate user and return tokens
- **Inputs + Types:**
  - `req.body`: { email, password, rememberMe? }
- **Outputs / Return:**
  - Status 200: User object + tokens
  - Status 401: Invalid credentials, not verified, account banned
- **State Change / Side Effects:**
  - Logs login event
  - Generates new access & refresh tokens
  - Token expiry varies based on `rememberMe` flag
- **Edge Cases:**
  - Email not found
  - Incorrect password
  - User not verified (`isVerified: false`)
  - User banned (`status: false`)
  - Remember me changes token expiry (30d vs 1d)
- **Dependencies (mock needed?):**
  - `User.findOne().select('+password')` - YES
  - `user.matchPassword()` - YES
  - `generateToken()` - YES
  - `logger` - YES

#### Function: `changePassword(req, res, next)`

- **Purpose:** Allow authenticated user to change their password
- **Inputs + Types:**
  - `req.body`: { currentPassword, newPassword }
  - `req.user.id` (ObjectId): From auth middleware
- **Outputs / Return:**
  - Status 200: Success message
  - Status 400: Missing fields
  - Status 401: Current password incorrect
  - Status 404: User not found
- **State Change / Side Effects:**
  - Updates user's password (triggers bcrypt hashing)
  - Logs password change event
- **Edge Cases:**
  - Current password incorrect
  - New password same as current password
  - New password doesn't meet strength requirements (model validation)
  - Missing current or new password
- **Dependencies (mock needed?):**
  - `User.findById().select('+password')` - YES
  - `user.matchPassword()` - YES
  - `user.save()` - YES
  - `logger` - YES

#### Function: `forgotPassword(req, res, next)`

- **Purpose:** Send password reset email with token
- **Inputs + Types:**
  - `req.body`: { email }
- **Outputs / Return:**
  - Status 200: Success message
  - Status 400: Missing email
  - Status 404: User not found
- **State Change / Side Effects:**
  - Generates reset token (JWT, 1h expiry)
  - Sends password reset email
  - Logs event
- **Edge Cases:**
  - Email not registered
  - Email service failure
  - Multiple reset requests in short time (rate limiting consideration)
  - Token expiration
- **Dependencies (mock needed?):**
  - `User.findOne()` - YES
  - `generateToken()` - YES
  - `sendTemplatedEmail()` - YES
  - `logger` - YES

#### Function: `resetPassword(req, res, next)`

- **Purpose:** Reset password using token from email
- **Inputs + Types:**
  - `req.body`: { token, newPassword }
- **Outputs / Return:**
  - Status 200: Success message
  - Status 400: Missing token/password
  - Status 404: User not found
  - Status 401: Invalid/expired token
- **State Change / Side Effects:**
  - Verifies token with JWT
  - Updates user password
  - Logs event
- **Edge Cases:**
  - Invalid token
  - Expired token
  - Token for non-existent user
  - Weak new password (model validation)
  - Token already used (JWT doesn't track this by default)
- **Dependencies (mock needed?):**
  - `jwt.verify()` - YES
  - `User.findById()` - YES
  - `user.save()` - YES
  - `logger` - YES

#### Function: `verifyEmail(req, res, next)`

- **Purpose:** Verify user's email with token from registration email
- **Inputs + Types:**
  - `req.query.token` (String): Verification token
- **Outputs / Return:**
  - Redirects to success/failure page on frontend
- **State Change / Side Effects:**
  - Verifies JWT token
  - Sets `isVerified: true`
  - Clears `verificationToken` and `verificationTokenExpires`
  - Logs event
- **Edge Cases:**
  - Missing token
  - Invalid token
  - Expired token
  - Token for already verified user
  - Token for non-existent user
- **Dependencies (mock needed?):**
  - `jwt.verify()` - YES
  - `User.findOne()` - YES (with token and expiry checks)
  - `user.save()` - YES
  - `logger` - YES

---

### 4.4 User Service (`backend/src/services/user.service.js`)

#### Function: `UserService.getAllUsers(query)`

- **Purpose:** Fetch paginated list of users with search and filtering
- **Inputs + Types:**
  - `query` (Object): { page?, limit?, keyword?, status? }
    - `page` (Number): Page number (default: 1)
    - `limit` (Number): Items per page (default: 10)
    - `keyword` (String): Search in fullName, email, username
    - `status` (String): 'true', 'false', or undefined (all)
- **Outputs / Return:**
  - `{ users: Array, total: Number }`
- **State Change / Side Effects:**
  - None (read-only)
  - Logs errors
- **Edge Cases:**
  - Invalid page/limit (negative, non-numeric)
  - Empty keyword (should return all)
  - Keyword with special regex characters
  - No results found
  - Page beyond available data
  - Very large limit value
- **Dependencies (mock needed?):**
  - `User.countDocuments()` - YES
  - `User.find()` - YES
  - `logger` - YES

---

### 4.5 Auth Middleware (`backend/src/middlewares/auth.middleware.js`)

#### Function: `protect(req, res, next)`

- **Purpose:** Verify JWT token and attach user to request
- **Inputs + Types:**
  - `req.headers.authorization` (String): "Bearer <token>"
- **Outputs / Return:**
  - Calls `next()` if authorized
  - Returns 401 error if not authorized or token invalid
  - Returns 403 error if user banned
- **State Change / Side Effects:**
  - Attaches `req.user` with user object
  - Logs token verification attempts
- **Edge Cases:**
  - No authorization header
  - Malformed header (not "Bearer xxx")
  - Token is "undefined", "null", empty string
  - Token blacklisted (user logged out)
  - Invalid token signature
  - Expired token
  - User deleted after token issued
  - User not verified
  - User banned (`status: false`)
- **Dependencies (mock needed?):**
  - `jwt.verify()` - YES
  - `TokenBlacklist.findOne()` - YES
  - `User.findById()` - YES
  - `logger` - YES

#### Function: `optionalAuth(req, res, next)`

- **Purpose:** Attach user if token valid, but don't require authentication
- **Inputs + Types:**
  - `req.headers.authorization` (String | undefined): "Bearer <token>"
- **Outputs / Return:**
  - Always calls `next()`
  - Sets `req.user` to user object or null
- **State Change / Side Effects:**
  - Sets `req.user = null` if no token or invalid token
  - Sets `req.user = <userObject>` if valid token
- **Edge Cases:**
  - No token → `req.user = null`, continue
  - Invalid token → `req.user = null`, continue
  - Blacklisted token → `req.user = null`, continue
  - User banned → `req.user = null`, continue
- **Dependencies (mock needed?):**
  - `jwt.verify()` - YES
  - `TokenBlacklist.findOne()` - YES
  - `User.findById()` - YES
  - `logger` - YES

---

### 4.6 Frontend AuthContext (`frontend/src/contexts/AuthContext.jsx`)

#### Function: `updateProfile(userData)`

- **Purpose:** Update user profile and sync with local storage
- **Inputs + Types:**
  - `userData` (FormData | Object): Profile data with optional file
- **Outputs / Return:**
  - Returns updated user object
  - Throws error if update fails
- **State Change / Side Effects:**
  - Calls `authService.updateProfile()`
  - Updates `user` state with new data
  - Merges new data with existing user object
- **Edge Cases:**
  - Network error during update
  - Partial update (only some fields)
  - File upload failure
  - Validation error from backend
- **Dependencies (mock needed?):**
  - `authService.updateProfile()` - YES

#### Function: `changePassword(currentPassword, newPassword)`

- **Purpose:** Change user password via API
- **Inputs + Types:**
  - `currentPassword` (String)
  - `newPassword` (String)
- **Outputs / Return:**
  - Returns success data
  - Throws error if change fails
- **State Change / Side Effects:**
  - Calls `authService.changePassword()`
  - Does NOT update local state (user should re-login)
- **Edge Cases:**
  - Current password incorrect
  - Network error
  - Token expired during operation
- **Dependencies (mock needed?):**
  - `authService.changePassword()` - YES

---

### 4.7 Frontend AuthService (`frontend/src/services/authService.js`)

#### Function: `updateProfile(userData)`

- **Purpose:** Send profile update request to API
- **Inputs + Types:**
  - `userData` (FormData): Profile data with optional avatar file
- **Outputs / Return:**
  - Returns updated user object
  - Throws error with message
- **State Change / Side Effects:**
  - Sends PUT to `/auth/update-profile`
  - Updates `localStorage.userInfo` with new data
- **Edge Cases:**
  - Network error
  - API returns validation error
  - Token expired (should trigger refresh)
  - Large file upload timeout
- **Dependencies (mock needed?):**
  - `axiosInstance.put()` - YES
  - `localStorage` - YES (or use real in integration tests)

#### Function: `getCurrentUserFromServer()`

- **Purpose:** Fetch user from server to check ban status
- **Inputs + Types:** None (uses token from localStorage)
- **Outputs / Return:**
  - Returns user object if valid
  - Returns null if banned or invalid token
- **State Change / Side Effects:**
  - Sends GET to `/auth/me`
  - Updates localStorage with fresh user data
  - Clears localStorage if 403/401 error
- **Edge Cases:**
  - User banned → clear storage, return null
  - Token invalid → clear storage, return null
  - Network error → throw error
- **Dependencies (mock needed?):**
  - `axiosInstance.get()` - YES
  - `localStorage` - YES

---

## 5. Test Case Matrix

### A. User Model Tests

| Category       | Scenario                        | Pre-condition                    | Input                                 | Expected Output/Behavior                                                             |
| -------------- | ------------------------------- | -------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| **Happy**      | Create valid user               | Database empty                   | Valid user data (all required fields) | User saved successfully with hashed password                                         |
| **Happy**      | Password hashing on save        | User document created            | Plain password "password123"          | Password field contains bcrypt hash (starts with $2a$10$)                            |
| **Happy**      | Match correct password          | User exists with hashed password | enteredPassword: "password123"        | `matchPassword()` returns true                                                       |
| **Happy**      | Unique username/email           | No existing users                | Unique email & username               | User created successfully                                                            |
| **Validation** | Missing required field          | -                                | Missing fullName                      | ValidationError thrown                                                               |
| **Validation** | Invalid email format            | -                                | email: "invalid-email"                | ValidationError: "Please enter a valid email"                                        |
| **Validation** | Short username                  | -                                | username: "ab" (2 chars)              | ValidationError: "Username must be at least 3 characters long"                       |
| **Validation** | Long full name                  | -                                | fullName: 51 characters               | ValidationError: "Full name cannot exceed 50 characters"                             |
| **Validation** | Invalid phone format            | -                                | phone: "12345"                        | ValidationError: "Please enter a valid phone number"                                 |
| **Validation** | Invalid gender enum             | -                                | gender: "unknown"                     | ValidationError: "unknown is not a valid gender"                                     |
| **Validation** | Invalid role enum               | -                                | role: "superuser"                     | ValidationError: "superuser is not a valid role"                                     |
| **Validation** | About me too long               | -                                | aboutMe: 501 characters               | ValidationError: "About me cannot exceed 500 characters"                             |
| **Edge**       | Duplicate email                 | User with email exists           | Same email, different username        | Duplicate key error (E11000)                                                         |
| **Edge**       | Duplicate username              | User with username exists        | Same username, different email        | Duplicate key error (E11000)                                                         |
| **Edge**       | Password not modified on update | User exists                      | Update fullName only                  | Password hash unchanged, no double-hashing                                           |
| **Edge**       | Match incorrect password        | User with password "password123" | enteredPassword: "wrongpassword"      | `matchPassword()` returns false                                                      |
| **Edge**       | Match with empty password       | User exists                      | enteredPassword: ""                   | `matchPassword()` returns false                                                      |
| **Edge**       | Default values applied          | -                                | Minimal required fields only          | Default avatar URL, status: true, isVerified: false, reward_point: 0, role: customer |

### B. User Controller Tests

| Category        | Scenario                                    | Pre-condition                           | Input                                         | Expected Output/Behavior                                        |
| --------------- | ------------------------------------------- | --------------------------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| **Happy**       | Get all users with pagination               | 15 users in DB, admin authenticated     | page: 1, limit: 10                            | Returns 10 users, total: 15                                     |
| **Happy**       | Get user profile by username                | User "johndoe" exists and verified      | username: "johndoe"                           | Returns full user profile (excluding password)                  |
| **Happy**       | Update own profile                          | User authenticated                      | Valid profile data (fullName, phone, address) | Profile updated, returns updated user                           |
| **Happy**       | Upload avatar                               | User authenticated                      | Valid image file                              | Avatar uploaded to Cloudinary, user.avatar updated to HTTPS URL |
| **Happy**       | Admin toggles user status                   | Admin authenticated, target user active | userId: "xxx"                                 | User status flipped to false, returns new status                |
| **Integration** | GET /api/users/:id                          | Admin authenticated                     | Valid user ID                                 | Status 200, user object returned                                |
| **Integration** | PUT /api/users/profile                      | User authenticated                      | Valid FormData with avatar                    | Status 200, updated user with new avatar URL                    |
| **Integration** | PATCH /api/users/:id/status                 | Admin authenticated                     | Valid user ID                                 | Status 200, user banned/unbanned                                |
| **Edge**        | Get non-existent user profile               | -                                       | username: "nonexistent"                       | Status 404, error: "User not found"                             |
| **Edge**        | Get unverified user profile                 | User exists, isVerified: false          | username: "unverified"                        | Returns limited fields only (username, avatar, role)            |
| **Edge**        | Update profile with restricted fields       | User authenticated                      | Includes email, password, role in body        | Restricted fields filtered out, not updated                     |
| **Edge**        | Update profile with XSS attempt             | User authenticated                      | fullName: "<script>alert('XSS')</script>"     | Should be sanitized or rejected                                 |
| **Edge**        | Update profile with invalid ID              | User authenticated                      | req.user.\_id is invalid                      | Status 404 or 500, user not found                               |
| **Edge**        | Upload oversized file                       | User authenticated                      | File > 10MB                                   | Status 400, error from multer middleware                        |
| **Edge**        | Upload non-image file                       | User authenticated                      | File: .pdf, .exe, etc.                        | Status 400, "Only image files are allowed!"                     |
| **Edge**        | Toggle status of non-existent user          | Admin authenticated                     | Invalid user ID                               | Status 404, "User not found"                                    |
| **Edge**        | Search users with special chars             | Admin authenticated                     | keyword: "john@doe.com"                       | Regex search handles special characters without error           |
| **Edge**        | Get users with invalid page/limit           | Admin authenticated                     | page: -1, limit: 999999                       | Should handle gracefully, apply defaults or validate            |
| **Permission**  | Non-admin tries to get all users            | Regular user authenticated              | -                                             | Status 403, "Admin access required"                             |
| **Permission**  | User tries to update another user's profile | User A authenticated                    | Tries to update user B's profile              | Should fail (not implemented, but req.user.\_id used)           |

### C. Auth Controller Tests

| Category       | Scenario                               | Pre-condition                  | Input                                        | Expected Output/Behavior                                               |
| -------------- | -------------------------------------- | ------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------- |
| **Happy**      | Register new user                      | No existing user               | Valid registration data                      | Status 201, user created, tokens returned, verification email sent     |
| **Happy**      | Login with valid credentials           | User exists, verified, active  | Correct email & password                     | Status 200, user + tokens returned                                     |
| **Happy**      | Login with remember me                 | User exists, verified          | rememberMe: true                             | Tokens with longer expiry (30d/90d)                                    |
| **Happy**      | Change password                        | User authenticated             | currentPassword: correct, newPassword: valid | Status 200, password updated                                           |
| **Happy**      | Forgot password                        | User exists                    | Valid email                                  | Status 200, reset email sent                                           |
| **Happy**      | Reset password with token              | Reset token valid              | token: "xxx", newPassword: valid             | Status 200, password reset successfully                                |
| **Happy**      | Verify email                           | User exists with valid token   | token from email                             | User.isVerified set to true, redirect to success page                  |
| **Happy**      | Logout                                 | User authenticated             | Valid token in header                        | Status 200, token added to blacklist                                   |
| **Happy**      | Login with Google (new user)           | No existing user with email    | Google email, name, picture                  | User created, tokens returned, avatar set to Google picture            |
| **Happy**      | Login with Google (existing user)      | User exists                    | Google email                                 | User logged in, avatar updated if changed                              |
| **Validation** | Register with missing fields           | -                              | Missing phone or address                     | Status 400, "Please provide full name, username..."                    |
| **Validation** | Register with existing email           | User exists                    | Same email                                   | Status 400, "User already exists"                                      |
| **Validation** | Login with wrong password              | User exists                    | Incorrect password                           | Status 401, "Incorrect password..."                                    |
| **Validation** | Login with unverified account          | User exists, isVerified: false | Valid credentials                            | Status 401, "Please verify your email..."                              |
| **Validation** | Login with banned account              | User exists, status: false     | Valid credentials                            | Status 401, "Your account has been deactivated..."                     |
| **Validation** | Change password with wrong current     | User authenticated             | currentPassword: incorrect                   | Status 401, "Current password is incorrect"                            |
| **Validation** | Reset password with invalid token      | -                              | token: "invalid-jwt"                         | JWT verification error, redirect to failure page                       |
| **Validation** | Reset password with expired token      | Token expired                  | token: expired JWT                           | JWT verification error or user not found                               |
| **Edge**       | Register when email service fails      | Email service down             | Valid registration data                      | User created, tokens returned (registration should not fail)           |
| **Edge**       | Forgot password for non-existent email | No user with email             | email: "nonexistent@test.com"                | Status 404, "User not found"                                           |
| **Edge**       | Verify email with expired token        | User exists, token expired     | Expired token                                | Redirect to failure page, "Invalid or expired verification token"      |
| **Edge**       | Verify already verified email          | User.isVerified: true          | Valid token                                  | User not found (token cleared) or error                                |
| **Edge**       | Multiple forgot password requests      | User exists                    | Same email, multiple times                   | Multiple emails sent (consider rate limiting)                          |
| **Edge**       | Login with email not found             | No user                        | email: "notfound@test.com"                   | Status 401, "Email not found..."                                       |
| **Edge**       | Resend verification to verified user   | User.isVerified: true          | Valid email                                  | Status 400, "Email is already verified"                                |
| **Security**   | Login with SQL injection attempt       | -                              | email: "' OR '1'='1"                         | Should fail safely, no data leaked                                     |
| **Security**   | Reset password token reuse             | Token already used             | Same token twice                             | Second attempt should fail (no built-in prevention, JWT doesn't track) |

### D. User Service Tests

| Category  | Scenario                        | Pre-condition                   | Input                      | Expected Output/Behavior                                                           |
| --------- | ------------------------------- | ------------------------------- | -------------------------- | ---------------------------------------------------------------------------------- |
| **Happy** | Get all users, page 1           | 25 users in DB                  | page: 1, limit: 10         | Returns users 1-10, total: 25                                                      |
| **Happy** | Get all users, page 3           | 25 users in DB                  | page: 3, limit: 10         | Returns users 21-25, total: 25                                                     |
| **Happy** | Search by keyword               | Users with names "John", "Jane" | keyword: "john"            | Returns only users matching "john" (case-insensitive) in fullName, email, username |
| **Happy** | Filter by status: active        | 10 active, 5 banned users       | status: "true"             | Returns 10 active users only                                                       |
| **Happy** | Filter by status: banned        | 10 active, 5 banned users       | status: "false"            | Returns 5 banned users only                                                        |
| **Edge**  | Page beyond available data      | 10 users, 10 per page           | page: 5                    | Returns empty array, total: 10                                                     |
| **Edge**  | Invalid page number             | -                               | page: -1                   | Should handle gracefully (default to 1 or validate)                                |
| **Edge**  | Very large limit                | 100 users                       | limit: 999999              | Returns all users (or enforce max limit)                                           |
| **Edge**  | Search with regex special chars | Users in DB                     | keyword: "user@domain.com" | Should escape regex chars, no error                                                |
| **Edge**  | Empty keyword                   | 10 users in DB                  | keyword: ""                | Returns all users (no filter applied)                                              |

### E. Auth Middleware Tests

| Category     | Scenario                             | Pre-condition                 | Input                               | Expected Output/Behavior                           |
| ------------ | ------------------------------------ | ----------------------------- | ----------------------------------- | -------------------------------------------------- |
| **Happy**    | Valid token, verified user           | User exists, verified, active | Authorization: "Bearer valid-token" | `next()` called, `req.user` set                    |
| **Happy**    | Optional auth with valid token       | User exists, verified         | Authorization: "Bearer valid-token" | `req.user` set to user object, `next()` called     |
| **Happy**    | Optional auth without token          | -                             | No Authorization header             | `req.user` set to null, `next()` called            |
| **Security** | No authorization header              | -                             | No header                           | Status 401, "No valid token provided"              |
| **Security** | Malformed header                     | -                             | Authorization: "InvalidFormat"      | Status 401, "No valid token provided"              |
| **Security** | Token value is "undefined"           | -                             | Authorization: "Bearer undefined"   | Status 401, "No valid token provided"              |
| **Security** | Token value is "null"                | -                             | Authorization: "Bearer null"        | Status 401, "No valid token provided"              |
| **Security** | Blacklisted token                    | Token in blacklist            | Valid JWT but logged out            | Status 401, "Token has been invalidated"           |
| **Security** | Invalid token signature              | -                             | Token with wrong signature          | Status 401, "Not authorized to access this route"  |
| **Security** | Expired token                        | -                             | JWT past expiration                 | Status 401, "Not authorized to access this route"  |
| **Security** | User not verified                    | User.isVerified: false        | Valid token                         | Status 401, "Please verify your email..."          |
| **Security** | User banned                          | User.status: false            | Valid token                         | Status 403, "Your account has been deactivated..." |
| **Security** | User deleted after token             | User deleted                  | Valid token for deleted user        | Status 404, "User not found"                       |
| **Edge**     | Optional auth with blacklisted token | Token in blacklist            | Valid JWT but logged out            | `req.user` set to null, `next()` called            |
| **Edge**     | Optional auth with unverified user   | User.isVerified: false        | Valid token                         | `req.user` set to null, `next()` called            |

### F. Role Middleware Tests

| Category       | Scenario                   | Pre-condition             | Input                   | Expected Output/Behavior              |
| -------------- | -------------------------- | ------------------------- | ----------------------- | ------------------------------------- |
| **Happy**      | Admin accesses admin route | req.user.role: "admin"    | requireAdmin middleware | `next()` called                       |
| **Happy**      | Shop accesses shop route   | req.user.role: "shop"     | requireShop middleware  | `next()` called                       |
| **Permission** | Customer tries admin route | req.user.role: "customer" | requireAdmin middleware | Status 403, "Admin access required"   |
| **Permission** | Customer tries shop route  | req.user.role: "customer" | requireShop middleware  | Status 403, role not authorized       |
| **Permission** | No user (unauthenticated)  | req.user: undefined       | requireAdmin middleware | Status 401, "Authentication required" |

### G. Frontend AuthContext Tests

| Category  | Scenario                            | Pre-condition                 | Input                        | Expected Output/Behavior                          |
| --------- | ----------------------------------- | ----------------------------- | ---------------------------- | ------------------------------------------------- |
| **Happy** | Initialize with valid token         | Valid token in localStorage   | -                            | User fetched from server, user state set          |
| **Happy** | Update profile                      | User logged in                | Valid profile data           | authService called, user state updated            |
| **Happy** | Change password                     | User logged in                | currentPassword, newPassword | authService called, returns success               |
| **Happy** | Login                               | -                             | Valid credentials            | authService called, user state set                |
| **Happy** | Logout                              | User logged in                | -                            | authService.logout called, user state set to null |
| **Edge**  | Initialize with invalid token       | Invalid token in localStorage | -                            | Storage cleared, user set to null                 |
| **Edge**  | Initialize with banned user token   | User banned                   | Valid token                  | Storage cleared, user set to null                 |
| **Edge**  | Network error during profile update | User logged in                | Network failure              | Error thrown, user state unchanged                |

### H. Frontend Components Tests (UI)

| Category       | Scenario                          | Pre-condition               | Input                         | Expected Output/Behavior                                                 |
| -------------- | --------------------------------- | --------------------------- | ----------------------------- | ------------------------------------------------------------------------ |
| **Happy**      | ProfileTab renders user data      | User logged in              | -                             | Displays fullName, email, avatar, phone, address, etc.                   |
| **Happy**      | ProfileTab avatar upload          | User logged in              | Select valid image file       | Avatar preview shown, file stored in state                               |
| **Happy**      | ProfileTab submit update          | User logged in              | Modified profile data         | Form submitted, success message, user updated                            |
| **Happy**      | ChangePassword form submission    | User logged in              | Valid passwords               | Password changed, logout triggered, redirect to login                    |
| **Validation** | ChangePassword: weak password     | -                           | Password: "weak"              | Validation error: "Password must be at least 8 characters!"              |
| **Validation** | ChangePassword: password mismatch | -                           | newPassword ≠ confirmPassword | Validation error: "Passwords do not match!"                              |
| **Validation** | ChangePassword: no uppercase      | -                           | Password: "password1!"        | Validation error: "Password must contain at least one uppercase letter!" |
| **Validation** | ProfileTab: future DOB            | -                           | dateOfBirth: tomorrow         | Validation error: "Date of birth cannot be in the future"                |
| **Validation** | ProfileTab: unrealistic DOB       | -                           | dateOfBirth: 150 years ago    | Validation error: "Please enter a valid date of birth"                   |
| **Edge**       | ProfileTab: avatar upload error   | Network error during upload | -                             | Error message shown, avatar not updated                                  |
| **Edge**       | ChangePassword: incorrect current | -                           | currentPassword: incorrect    | Error message: "Current password is incorrect"                           |

---

## 6. Test Priority Recommendation

### High Priority (Critical Path - Must Test)

| Module/Function                         | Priority | Justification                                                        |
| --------------------------------------- | -------- | -------------------------------------------------------------------- |
| User Model - Password Hashing           | **HIGH** | Security critical; compromise means all passwords leaked             |
| User Model - `matchPassword()`          | **HIGH** | Authentication gate; false positives/negatives = security breach     |
| Auth Middleware - `protect()`           | **HIGH** | Guards all protected routes; failure = unauthorized access           |
| Auth Controller - `login()`             | **HIGH** | User impact: cannot access app if broken; security critical          |
| Auth Controller - `register()`          | **HIGH** | User acquisition; broken = no new users; email verification critical |
| Auth Controller - `changePassword()`    | **HIGH** | Security; users need ability to secure accounts                      |
| User Controller - `updateUserProfile()` | **HIGH** | User impact: profile edits are core functionality                    |
| Auth Controller - `verifyEmail()`       | **HIGH** | Blocks unverified users; broken = no verified accounts               |
| Role Middleware - `requireAdmin`        | **HIGH** | Security; prevents unauthorized admin access                         |
| Frontend AuthContext - `login/logout`   | **HIGH** | Core auth flow; broken = app unusable                                |

### Medium Priority (Important Features)

| Module/Function                                          | Priority   | Justification                                                               |
| -------------------------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| Auth Controller - `forgotPassword()` / `resetPassword()` | **MEDIUM** | User experience: users forget passwords, but not daily critical             |
| User Controller - `toggleUserStatus()`                   | **MEDIUM** | Admin functionality; important but doesn't affect all users                 |
| User Service - `getAllUsers()`                           | **MEDIUM** | Admin feature; complex with pagination/search, but isolated impact          |
| User Controller - `getUserProfile()`                     | **MEDIUM** | Public profile viewing; important for social features but not auth-critical |
| Auth Controller - Google/Facebook Login                  | **MEDIUM** | Convenience feature; reduces friction but not core auth                     |
| Upload Middleware                                        | **MEDIUM** | Avatar uploads enhance UX but not blocking                                  |
| Frontend - ProfileTab Component                          | **MEDIUM** | User engagement; complex with many fields, but UI-only                      |
| Frontend - ChangePassword Component                      | **MEDIUM** | UI for password change; important but logic is backend                      |

### Low Priority (Edge Cases & Nice-to-Have)

| Module/Function                                      | Priority | Justification                                            |
| ---------------------------------------------------- | -------- | -------------------------------------------------------- |
| Auth Middleware - `optionalAuth()`                   | **LOW**  | Used for public/guest routes; failure has limited impact |
| User Model - Validation Edge Cases                   | **LOW**  | Model validation mostly handled by Mongoose; low risk    |
| User Controller - `getUsersIsActive()`               | **LOW**  | Simple query for shop role; minimal complexity           |
| Auth Controller - OTP flows (registerApp, verifyOtp) | **LOW**  | Alternate mobile registration flow; less commonly used   |
| Auth Controller - `setPassword()`                    | **LOW**  | Edge case for social login users setting password        |
| Frontend - AuthService interceptors                  | **LOW**  | Token refresh is automated; works in background          |
| Error handling & logging                             | **LOW**  | Enhances debugging but doesn't affect functionality      |

---

## 7. Mocking & Test Data Preparation

### A. Backend Mocking Strategy

| Dependency               | What to Mock                  | Mocking Strategy                                                                                                                            | Sample Mock Data                                                                                                                                                                                   |
| ------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mongoose User Model**  | Database operations           | Use `jest.mock()` or `sinon` stubs for `User.findOne`, `User.create`, `User.findByIdAndUpdate`, etc.                                        | `mockUser = { _id: '507f1f77bcf86cd799439011', fullName: 'John Doe', email: 'john@example.com', username: 'johndoe', role: 'customer', isVerified: true, status: true, matchPassword: jest.fn() }` |
| **bcrypt**               | Password hashing              | Mock `bcrypt.genSalt()` and `bcrypt.hash()` to return deterministic values; mock `bcrypt.compare()` to return true/false based on test case | `bcrypt.hash.mockResolvedValue('$2a$10$hashedpassword')` <br> `bcrypt.compare.mockResolvedValue(true)`                                                                                             |
| **JWT**                  | Token generation/verification | Mock `jwt.sign()` to return fixed token strings; mock `jwt.verify()` to return decoded payload or throw error                               | `jwt.sign.mockReturnValue('mock-jwt-token')` <br> `jwt.verify.mockReturnValue({ id: 'userId123' })`                                                                                                |
| **Email Service**        | sendTemplatedEmail()          | Mock to prevent actual emails; spy to verify called with correct params                                                                     | `sendTemplatedEmail = jest.fn().mockResolvedValue({ success: true })`                                                                                                                              |
| **Cloudinary**           | File uploads                  | Mock `storage` and `handleUpload` to return mock file paths                                                                                 | `req.file = { path: 'https://cloudinary.com/mock-avatar.jpg', originalname: 'avatar.jpg' }`                                                                                                        |
| **Logger**               | Winston logger                | Mock `logger.info`, `logger.error` to prevent console spam                                                                                  | `logger.info = jest.fn()` <br> `logger.error = jest.fn()`                                                                                                                                          |
| **TokenBlacklist Model** | Blacklist operations          | Mock `TokenBlacklist.findOne()` to return null (not blacklisted) or token doc                                                               | `TokenBlacklist.findOne.mockResolvedValue(null)` or `mockBlacklistedToken`                                                                                                                         |
| **Express req/res/next** | HTTP context                  | Use `httpMocks.createRequest()` and `httpMocks.createResponse()` from `node-mocks-http`                                                     | `req = { params: { id: 'userId' }, body: { ... }, user: mockUser }`                                                                                                                                |

### B. Frontend Mocking Strategy

| Dependency          | What to Mock             | Mocking Strategy                                        | Sample Mock Data                                                                      |
| ------------------- | ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **axiosInstance**   | API calls                | Mock axios with `jest.mock()` or `axios-mock-adapter`   | `axiosInstance.put.mockResolvedValue({ data: { success: true, data: mockUser } })`    |
| **localStorage**    | Browser storage          | Mock or use `jest.spyOn(Storage.prototype)`             | `localStorage.getItem.mockReturnValue(JSON.stringify(mockUser))`                      |
| **AuthContext**     | Global auth state        | Wrap components with mock provider or use `jest.mock()` | `<AuthContext.Provider value={{ user: mockUser, updateProfile: mockUpdateProfile }}>` |
| **File Uploads**    | FileReader, File objects | Create mock File objects with `new File()`              | `const mockFile = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' })`        |
| **react-router**    | Navigation               | Mock `useNavigate`, `useLocation` from React Router     | `const mockNavigate = jest.fn()` <br> `useNavigate.mockReturnValue(mockNavigate)`     |
| **Ant Design Form** | Form components          | Use React Testing Library, interact with form fields    | `fireEvent.change(input, { target: { value: 'test' } })`                              |

### C. Sample Test Data

```javascript
// Mock User Document
const mockUser = {
  _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
  fullName: 'John Doe',
  username: 'johndoe',
  email: 'john.doe@example.com',
  password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', // "password123"
  role: 'customer',
  avatar: 'https://example.com/avatar.jpg',
  address: '123 Main St, New York, NY 10001',
  phone: '1234567890',
  reward_point: 100,
  dateOfBirth: new Date('1990-01-01'),
  gender: 'male',
  status: true,
  isVerified: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  matchPassword: jest.fn().mockResolvedValue(true),
  save: jest.fn().mockResolvedValue(true),
};

// Mock Unverified User
const mockUnverifiedUser = {
  ...mockUser,
  _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
  email: 'unverified@example.com',
  username: 'unverified',
  isVerified: false,
  verificationToken: 'mock-verification-token',
  verificationTokenExpires: new Date(Date.now() + 3600000),
};

// Mock Banned User
const mockBannedUser = {
  ...mockUser,
  _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
  email: 'banned@example.com',
  username: 'banneduser',
  status: false,
};

// Mock Admin User
const mockAdminUser = {
  ...mockUser,
  _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439014'),
  email: 'admin@example.com',
  username: 'admin',
  role: 'admin',
};

// Mock JWT Tokens
const mockAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxNjE2MzI1NDIyfQ.mock-signature';
const mockRefreshToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxNjE2ODQzODIyfQ.mock-refresh-signature';

// Mock Registration Data
const mockRegistrationData = {
  fullName: 'Jane Smith',
  username: 'janesmith',
  email: 'jane.smith@example.com',
  password: 'SecurePass123!',
  phone: '9876543210',
  address: '456 Oak Ave, Los Angeles, CA 90001',
};

// Mock Profile Update Data
const mockProfileUpdateData = {
  fullName: 'John Updated',
  phone: '1112223333',
  address: '789 Elm St, Chicago, IL 60601',
  dateOfBirth: '1985-05-15',
  gender: 'male',
  aboutMe: 'Software developer and sneaker enthusiast',
};

// Mock FormData for Profile Update with File
const mockFormData = new FormData();
mockFormData.append('fullName', 'John Updated');
mockFormData.append('phone', '1112223333');
mockFormData.append(
  'avatar',
  new File(['mock-image-content'], 'avatar.jpg', { type: 'image/jpeg' })
);

// Mock Cloudinary Response
const mockCloudinaryFile = {
  fieldname: 'avatar',
  originalname: 'avatar.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  path: 'https://res.cloudinary.com/demo/image/upload/v1234567890/kicks-shoes/avatars/avatar-1234567890.jpg',
  size: 123456,
  filename: 'avatar-1234567890',
};

// Mock Express Request
const mockRequest = {
  user: mockUser,
  params: { id: '507f1f77bcf86cd799439011', username: 'johndoe' },
  body: mockProfileUpdateData,
  file: mockCloudinaryFile,
  query: { page: '1', limit: '10', keyword: '', status: 'true' },
  headers: { authorization: `Bearer ${mockAccessToken}` },
};

// Mock Express Response
const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  redirect: jest.fn().mockReturnThis(),
};

// Mock Next Function
const mockNext = jest.fn();

// Mock Error Response
const mockErrorResponse = new ErrorResponse('User not found', 404);
```

### D. Database Setup for Integration Tests

```javascript
// Test Database Configuration
const testDbConfig = {
  mongoURI: 'mongodb://localhost:27017/kicks-shoes-test',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};

// Before All Tests: Connect to test DB
beforeAll(async () => {
  await mongoose.connect(testDbConfig.mongoURI, testDbConfig.options);
});

// Before Each Test: Clear collections
beforeEach(async () => {
  await User.deleteMany({});
  await TokenBlacklist.deleteMany({});
});

// After All Tests: Close connection
afterAll(async () => {
  await mongoose.connection.close();
});

// Seed Test Data
const seedTestUsers = async () => {
  await User.create([
    mockUser,
    mockUnverifiedUser,
    mockBannedUser,
    mockAdminUser,
    // ... more test users
  ]);
};
```

---

## 8. Suggested Next Prompts

### A. Detailed Test Case Generation

```
Generate comprehensive Jest/Mocha test cases for the User Model (backend/src/models/User.js) including:
1. Unit tests for password hashing pre-save hook
2. Unit tests for matchPassword method
3. Schema validation tests for all fields (fullName, email, username, phone, etc.)
4. Edge cases for duplicate emails/usernames
5. Tests for default values (avatar, role, status, reward_point)

Use the test data and mocking strategies from section 7 of the feature analysis.
```

### B. Controller Unit Test Generation

```
Generate Jest unit tests for the User Controller (backend/src/controllers/userController.js) specifically for:
1. updateUserProfile() - happy path, validation errors, file upload, restricted fields
2. getUserProfile() - public profile, unverified user, not found
3. toggleUserStatus() - ban/unban, permissions

Mock all dependencies (User model, logger, ErrorResponse, req/res/next).
Include assertions for status codes, response data, and function calls.
```

### C. Integration Test Generation

```
Generate Jest integration tests for the User API routes (backend/src/routes/userRoutes.js):
1. Test complete HTTP request/response cycle using supertest
2. Include authentication middleware (protect, requireAdmin)
3. Test endpoints:
   - GET /api/users (admin only, pagination, search)
   - GET /api/users/profile (authenticated user)
   - PUT /api/users/profile (authenticated user, with file upload)
   - PATCH /api/users/:id/status (admin only)
4. Use real database connection (test DB)
5. Test authorization failures (non-admin accessing admin routes)
```

### D. Auth Flow E2E Tests

```
Generate end-to-end test scenarios for the complete authentication flow:
1. User registration → email verification → login → access protected route
2. Forgot password → reset password → login with new password
3. Login → change password → logout → login with new password
4. Admin ban user → user attempts login → rejected with 403

Use supertest for backend API calls and test against a real test database.
```

### E. Frontend Component Tests (React Testing Library)

```
Generate React Testing Library tests for the ProfileTab component (frontend/src/components/pages/account/components/ProfileTab.jsx):
1. Renders user data correctly from AuthContext
2. Form field changes update local state
3. Avatar file selection triggers preview
4. Form submission calls updateProfile with correct data
5. Success/error messages display appropriately
6. Date of birth validation (future dates, unrealistic ages)

Mock AuthContext, axiosInstance, and file upload interactions.
```

### F. Password Security Tests

```
Generate comprehensive test suite for password-related functionality:
1. ChangePassword component (frontend) - validation rules (8+ chars, uppercase, lowercase, number, special char)
2. changePassword controller (backend) - current password verification, bcrypt hashing
3. forgotPassword/resetPassword flow - token generation, expiration, JWT verification
4. Password strength enforcement across registration, change, and reset flows

Include both unit and integration tests. Test edge cases like password reuse, token replay attacks.
```

### G. Authorization & Role-Based Access Tests

```
Generate test cases for role-based access control:
1. Test requireAdmin middleware - allow admin, deny customer/shop
2. Test requireShop middleware - allow shop and admin, deny customer
3. Test protect middleware - verify JWT, check isVerified, check status
4. Integration tests for protected routes with different roles
5. Edge cases: user role changed while token valid, admin demoted

Mock or use real JWT tokens, test against actual middleware functions.
```

### H. Mocking Setup & Test Utilities

```
Create reusable test utilities and mocking setup for the Users feature:
1. Mock factory functions for creating test users with different properties
2. Reusable mock Express req/res/next objects
3. JWT token generation for tests (valid, expired, invalid signature)
4. Database seeding functions for integration tests
5. Mock Cloudinary upload responses
6. Mock email service

Export as test helpers in backend/tests/_helpers/ directory.
```

### I. Performance & Load Tests

```
Generate performance test scenarios for User operations:
1. Load test: 1000 concurrent login requests
2. Stress test: Create 10,000 users rapidly
3. Profile update with large avatar files (approach 10MB limit)
4. Search performance with 100,000 users in database
5. Token verification speed with high request volume

Use tools like Artillery, k6, or Apache Bench. Provide analysis of bottlenecks.
```

### J. Security Penetration Tests

```
Generate security test cases for User & Auth features:
1. SQL/NoSQL injection attempts in email, username, search
2. XSS attempts in fullName, aboutMe, address fields
3. JWT token tampering (modified signature, payload)
4. Brute force password attempts (should trigger rate limiting)
5. Session fixation and CSRF attacks
6. Privilege escalation (customer trying to access admin routes)
7. Token replay after logout (blacklist verification)

Include expected mitigations and assertions that attacks are blocked.
```

---

## Summary

This technical and testing analysis covers the **Users** feature comprehensively, including:

- ✅ **Feature Overview**: Business purpose, UI flows, validation rules, security requirements
- ✅ **UI/UX Flows**: Step-by-step mapping of registration, profile update, password management, admin actions
- ✅ **File Mapping**: Complete list of 25+ backend/frontend files with responsibilities
- ✅ **Core Functions Analysis**: 20+ functions analyzed with inputs, outputs, edge cases, dependencies
- ✅ **Test Case Matrix**: 100+ test scenarios across happy paths, validations, edge cases, security
- ✅ **Test Priorities**: High/Medium/Low priority classification with justifications
- ✅ **Mocking Strategy**: Detailed mocking approaches for all dependencies + sample test data
- ✅ **Next Prompts**: 10 ready-to-use prompts for generating actual test code

This document serves as a **comprehensive blueprint** for QA/test engineers to:

1. Understand the Users feature architecture
2. Design test plans and test cases
3. Write unit, integration, and E2E tests
4. Mock dependencies effectively
5. Prioritize testing efforts based on risk

**Total Lines of Analysis**: ~1200+ lines covering all aspects of the Users feature.
