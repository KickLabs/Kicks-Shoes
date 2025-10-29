# Authentication & Authorization – Technical & Testing Analysis

## 1. Feature Overview

### Business Purpose

The Authentication & Authorization feature is the **security backbone** of the Kicks-Shoes application. It ensures:

- **User Identity Management**: Users can register, login, verify email, reset password
- **Access Control**: Protects sensitive routes and data based on user roles (customer, shop, admin)
- **Session Management**: JWT-based token authentication with refresh tokens
- **Account Security**: Email verification, password hashing (bcrypt), token blacklisting

### Key UI Flows Involved

1. **User Registration Flow**: Register → Email Verification → Login
2. **User Login Flow**: Login → Verify Credentials → Check Email Verified → Check Account Status → Issue Tokens
3. **Password Management Flow**: Forgot Password → Reset Email → Reset Password
4. **Social Authentication Flow**: Google/Facebook Login → Auto-create or Login User
5. **Profile Access Flow**: Protected Routes → Verify JWT → Check Role → Grant/Deny Access
6. **OTP Verification Flow** (Mobile App): Register → Receive OTP → Verify OTP → Activate Account

### Main Business Rules & Success Criteria

| Rule                            | Description                                                    | Success Criteria                                             |
| ------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| **Email Uniqueness**            | Each email can only be registered once                         | System rejects duplicate emails with 400 error               |
| **Password Security**           | Minimum 6 characters, bcrypt hashing                           | Passwords hashed before storage, never returned in responses |
| **Email Verification Required** | Users must verify email before login                           | Unverified users get 401 "Please verify your email"          |
| **Token Expiration**            | Access tokens expire (1d default), refresh tokens (7d default) | Expired tokens rejected with 401 error                       |
| **Token Blacklisting**          | Logged-out tokens cannot be reused                             | Blacklisted tokens return 401 "Token has been invalidated"   |
| **Role-Based Access**           | Admin routes only accessible by admin users                    | Non-admin users get 403 "Role not authorized"                |
| **Account Ban Check**           | Banned users cannot login                                      | Banned users get 401 "Account has been deactivated"          |
| **Remember Me**                 | Extended token expiration (30d/90d)                            | Token lifetimes adjust based on rememberMe flag              |

### Why This Feature is Important for Testing

- **Security Critical**: Authentication flaws can expose entire system
- **Business Risk**: Account takeover, data breaches, unauthorized access
- **Complex State**: Multiple token types, expiration, blacklisting, role hierarchy
- **High User Impact**: Login failures directly affect user experience
- **Regulatory Compliance**: Password security, data protection standards

---

## 2. UI/UX Flow Mapping

### Flow 1: User Registration (Web)

| Step | UI Screen/Component | User Action                                               | System Behavior                                 |
| ---- | ------------------- | --------------------------------------------------------- | ----------------------------------------------- |
| 1    | Register Form       | Enter fullName, username, email, password, phone, address | Validate required fields                        |
| 2    | Register Form       | Click "Register"                                          | Send POST /api/auth/register                    |
| 3    | Backend             | N/A                                                       | Check if email exists; return 400 if duplicate  |
| 4    | Backend             | N/A                                                       | Create user with isVerified=false               |
| 5    | Backend             | N/A                                                       | Generate verification token (JWT, 1h expiry)    |
| 6    | Backend             | N/A                                                       | Send verification email with link               |
| 7    | Backend             | N/A                                                       | Generate access token (1d) & refresh token (7d) |
| 8    | Success Screen      | See success message + tokens                              | Store tokens in localStorage/cookies            |
| 9    | Email Inbox         | Click verification link                                   | Redirect to /verify-email?token=xxx             |
| 10   | Backend             | N/A                                                       | Verify token; set isVerified=true               |
| 11   | Success Screen      | Email verified message                                    | User can now login                              |

### Flow 2: User Login

| Step | UI Screen/Component | User Action                                | System Behavior                                          |
| ---- | ------------------- | ------------------------------------------ | -------------------------------------------------------- |
| 1    | Login Form          | Enter email, password, rememberMe checkbox | Validate fields not empty                                |
| 2    | Login Form          | Click "Login"                              | Send POST /api/auth/login                                |
| 3    | Backend             | N/A                                        | Find user by email; return 401 if not found              |
| 4    | Backend             | N/A                                        | Compare password with bcrypt; return 401 if mismatch     |
| 5    | Backend             | N/A                                        | Check isVerified; return 401 if false                    |
| 6    | Backend             | N/A                                        | Check status (banned); return 401 if false               |
| 7    | Backend             | N/A                                        | Generate tokens (30d/90d if rememberMe=true, else 1d/7d) |
| 8    | Dashboard           | Store tokens, redirect to home             | User authenticated successfully                          |

### Flow 3: Accessing Protected Route

| Step | UI Screen/Component                | User Action              | System Behavior                                             |
| ---- | ---------------------------------- | ------------------------ | ----------------------------------------------------------- |
| 1    | Any Protected Page                 | Navigate to /api/auth/me | Browser sends Authorization: Bearer {token}                 |
| 2    | auth.middleware.js                 | N/A                      | Extract token from header                                   |
| 3    | auth.middleware.js                 | N/A                      | Check if token is blacklisted; return 401 if yes            |
| 4    | auth.middleware.js                 | N/A                      | Verify token with JWT_SECRET; return 401 if invalid/expired |
| 5    | auth.middleware.js                 | N/A                      | Find user by decoded.id; return 404 if not found            |
| 6    | auth.middleware.js                 | N/A                      | Check isVerified; return 401 if false                       |
| 7    | auth.middleware.js                 | N/A                      | Check status; return 403 if banned                          |
| 8    | auth.middleware.js                 | N/A                      | Attach user to req.user; call next()                        |
| 9    | role.middleware.js (if applicable) | N/A                      | Check user.role matches required role; return 403 if not    |
| 10   | Controller                         | N/A                      | Execute business logic; return 200 with data                |

### Flow 4: Password Reset

| Step | UI Screen/Component | User Action            | System Behavior                                         |
| ---- | ------------------- | ---------------------- | ------------------------------------------------------- |
| 1    | Forgot Password     | Enter email            | Send POST /api/auth/forgot-password                     |
| 2    | Backend             | N/A                    | Find user; return 404 if not found                      |
| 3    | Backend             | N/A                    | Generate reset token (JWT, 1h expiry)                   |
| 4    | Backend             | N/A                    | Send reset email with link                              |
| 5    | Email Inbox         | Click reset link       | Navigate to /reset-password?token=xxx                   |
| 6    | Reset Password Form | Enter newPassword      | Send POST /api/auth/reset-password {token, newPassword} |
| 7    | Backend             | N/A                    | Verify token; return 401 if expired/invalid             |
| 8    | Backend             | N/A                    | Find user; update password (bcrypt hashed)              |
| 9    | Success Screen      | Password reset success | User can login with new password                        |

### Flow 5: Logout

| Step | UI Screen/Component | User Action    | System Behavior                                  |
| ---- | ------------------- | -------------- | ------------------------------------------------ |
| 1    | Any Page            | Click "Logout" | Send POST /api/auth/logout with token in header  |
| 2    | Backend             | N/A            | Extract token from Authorization header          |
| 3    | Backend             | N/A            | Add token to TokenBlacklist with expiresAt (24h) |
| 4    | Backend             | N/A            | Return 200 success                               |
| 5    | Frontend            | N/A            | Clear tokens from storage; redirect to login     |

---

## 3. Related Files, Components & Modules

### Backend Components

| File/Path                        | Layer      | Responsibility                           | Key Methods/Props/States                                                                                                                                                                                                     |
| -------------------------------- | ---------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `controllers/authController.js`  | Controller | Handle auth HTTP requests/responses      | `register`, `login`, `getMe`, `updateProfile`, `changePassword`, `forgotPassword`, `resetPassword`, `logout`, `verifyEmail`, `refreshToken`, `loginWithGoogle`, `loginWithFacebook`, `registerApp`, `verifyOtp`, `resendOtp` |
| `middlewares/auth.middleware.js` | Middleware | JWT verification, user authentication    | `protect`, `optionalAuth`, `authorize`, `requireAdmin`                                                                                                                                                                       |
| `middlewares/role.middleware.js` | Middleware | Role-based access control                | `ROLES`, `ROLE_HIERARCHY`, `checkRoleLevel`, `requireCustomer`, `requireShop`, `requireAdmin`, `requireExactRole`, `requireRoles`                                                                                            |
| `models/User.js`                 | Model      | User data schema & validation            | `userSchema`, `matchPassword`, `pre('save')` password hashing hook                                                                                                                                                           |
| `models/TokenBlacklist.js`       | Model      | Track invalidated tokens                 | `tokenBlacklistSchema` with TTL index                                                                                                                                                                                        |
| `utils/jwt.js`                   | Utility    | JWT token operations                     | `generateToken`, `verifyToken`, `generateRefreshToken`, `verifyRefreshToken`                                                                                                                                                 |
| `routes/authRoutes.js`           | Router     | Map auth endpoints to controllers        | Public routes: `/register`, `/login`, `/verify-email`, `/forgot-password`, `/reset-password`, `/refresh-token`; Protected routes: `/me`, `/update-profile`, `/change-password`, `/logout`                                    |
| `routes/userRoutes.js`           | Router     | Map user endpoints with auth/role checks | `/profile/:username` (optionalAuth), `/profile` (protect), `/:id` (protect + requireAdmin)                                                                                                                                   |
| `utils/errorResponse.js`         | Utility    | Custom error handling                    | `ErrorResponse` class                                                                                                                                                                                                        |
| `utils/sendEmail.js`             | Utility    | Email sending (verification, reset)      | `sendTemplatedEmail`                                                                                                                                                                                                         |
| `utils/logger.js`                | Utility    | Application logging                      | `logger.info`, `logger.error`                                                                                                                                                                                                |

### Frontend Components (Inferred from API)

| Component             | Responsibility              | Key States/Props                                                      |
| --------------------- | --------------------------- | --------------------------------------------------------------------- |
| LoginForm             | User login UI               | email, password, rememberMe, isLoading, error                         |
| RegisterForm          | User registration UI        | fullName, username, email, password, phone, address, isLoading, error |
| ForgotPasswordForm    | Request password reset      | email, isLoading, successMessage, error                               |
| ResetPasswordForm     | Reset password with token   | token (from URL), newPassword, confirmPassword, isLoading, error      |
| EmailVerificationPage | Verify email from link      | token (from URL), verificationStatus, error                           |
| ProtectedRoute        | Guard routes requiring auth | isAuthenticated, user, loading                                        |
| AdminRoute            | Guard admin-only routes     | isAuthenticated, user.role === 'admin', loading                       |
| AuthContext/Store     | Global auth state           | user, tokens, isAuthenticated, login(), logout(), register()          |

---

## 4. Core Functions / Methods to Test

### 4.1 JWT Utilities (`utils/jwt.js`)

#### `generateToken(payload, expiresIn)`

- **Purpose**: Create signed JWT access token
- **Inputs + Types**:
  - `payload: Object` (e.g., `{id: userId}`)
  - `expiresIn: string` (e.g., '1d', '1h')
- **Outputs / Return**: `string` (JWT token)
- **State Change / Side Effects**: None (pure function)
- **Edge Cases**:
  - Missing `JWT_SECRET` env variable
  - Invalid `expiresIn` format
  - Payload with sensitive data
- **Dependencies (mock needed?)**:
  - `jsonwebtoken.sign`: ✅ Mock for unit tests
  - `process.env.JWT_SECRET`: ✅ Mock env variable
  - `logger.error`: ✅ Mock to verify error logging

#### `verifyToken(token)`

- **Purpose**: Verify and decode JWT token
- **Inputs + Types**: `token: string` (JWT token)
- **Outputs / Return**: `Object` (decoded payload: `{id, iat, exp}`)
- **State Change / Side Effects**: None (pure function)
- **Edge Cases**:
  - Expired token (throws `TokenExpiredError`)
  - Malformed token (throws `JsonWebTokenError`)
  - Token signed with different secret
  - Token with invalid signature
  - Token with missing/extra claims
- **Dependencies (mock needed?)**:
  - `jsonwebtoken.verify`: ✅ Mock for error scenarios
  - `process.env.JWT_SECRET`: ✅ Mock env variable
  - `logger.error`: ✅ Mock

#### `generateRefreshToken(payload)` & `verifyRefreshToken(token)`

- **Purpose**: Same as access token but uses different secret (`JWT_REFRESH_SECRET`)
- **Inputs/Outputs**: Same as `generateToken` / `verifyToken`
- **Edge Cases**: Same as access token methods
- **Dependencies**:
  - `process.env.JWT_REFRESH_SECRET`: ✅ Mock

---

### 4.2 Auth Middleware (`middlewares/auth.middleware.js`)

#### `protect(req, res, next)`

- **Purpose**: Authenticate user from JWT token in request header
- **Inputs + Types**:
  - `req: Request` with `headers.authorization: string`
  - `res: Response`
  - `next: Function`
- **Outputs / Return**: Calls `next()` if authorized, or `next(ErrorResponse)` if not
- **State Change / Side Effects**:
  - Sets `req.user` with authenticated user object
  - Queries database: `User.findById`, `TokenBlacklist.findOne`
- **Edge Cases**:
  - Missing `Authorization` header → 401 "No valid token provided"
  - Header format: `"Bearer "` (lowercase), `"BEARER "` (uppercase), extra spaces
  - Token value: `undefined`, `null`, `""` (empty string)
  - Token blacklisted → 401 "Token has been invalidated"
  - Token expired → 401 "Not authorized to access this route"
  - Token malformed → 401 "Not authorized to access this route"
  - Token from different env/secret → 401
  - User not found (deleted after token issued) → 404 "User not found"
  - User not verified (`isVerified: false`) → 401 "Please verify your email"
  - User banned (`status: false`) → 403 "Account has been deactivated"
- **Dependencies (mock needed?)**:
  - `jwt.verify`: ✅ Mock to simulate valid/expired/malformed tokens
  - `TokenBlacklist.findOne`: ✅ Mock database query
  - `User.findById`: ✅ Mock database query
  - `logger.error`: ✅ Mock
  - `ErrorResponse`: ✅ Mock/spy

#### `optionalAuth(req, res, next)`

- **Purpose**: Check if user is authenticated but don't require it (for public/private hybrid routes)
- **Inputs + Types**: Same as `protect`
- **Outputs / Return**: Always calls `next()`; sets `req.user = null` if not authenticated
- **State Change / Side Effects**: Sets `req.user` to user object or `null`
- **Edge Cases**:
  - No token provided → continue as guest (`req.user = null`)
  - Valid token → attach user to `req.user`
  - Invalid/expired token → continue as guest (`req.user = null`)
  - Blacklisted token → continue as guest (`req.user = null`)
- **Dependencies (mock needed?)**:
  - `jwt.verify`: ✅ Mock
  - `TokenBlacklist.findOne`: ✅ Mock
  - `User.findById`: ✅ Mock

#### `authorize(...roles)` / `requireAdmin(req, res, next)`

- **Purpose**: Check if authenticated user has required role
- **Inputs + Types**:
  - `roles: string[]` (e.g., `['admin', 'shop']`)
  - `req.user: User` (set by `protect` middleware)
- **Outputs / Return**: Calls `next()` if authorized, or `next(ErrorResponse)` if not
- **State Change / Side Effects**: None
- **Edge Cases**:
  - User role not in allowed roles → 403 "User role {role} is not authorized"
  - `req.user` missing (middleware called without `protect`) → undefined behavior
  - User role is `null` or undefined
- **Dependencies (mock needed?)**:
  - `ErrorResponse`: ✅ Mock

---

### 4.3 Role Middleware (`middlewares/role.middleware.js`)

#### `checkRoleLevel(requiredLevel)`

- **Purpose**: Check if user's role hierarchy level meets minimum requirement
- **Inputs + Types**:
  - `requiredLevel: number` (e.g., `ROLE_HIERARCHY.customer = 1`)
  - `req.user: User`
- **Outputs / Return**: Middleware function that calls `next()` or `next(ErrorResponse)`
- **State Change / Side Effects**: None
- **Edge Cases**:
  - `req.user` missing → 401 "Authentication required"
  - User role not in `ROLE_HIERARCHY` → 403 "Invalid user role"
  - User role level < required level → 403 "Role not authorized"
  - Guest user (level 0) accessing customer routes (level 1) → 403
- **Dependencies (mock needed?)**:
  - `ErrorResponse`: ✅ Mock
  - `logger.error`: ✅ Mock

#### `requireRoles(...roles)`

- **Purpose**: Check if user has any of the specified roles
- **Inputs + Types**:
  - `roles: string[]` (e.g., `['admin', 'shop']`)
  - `req.user: User`
- **Outputs / Return**: Middleware function
- **State Change / Side Effects**: None
- **Edge Cases**:
  - `req.user` missing → 401
  - User role matches one of the roles → allowed
  - User role doesn't match any role → 403 with role list in error message
  - Multiple roles provided: `['admin', 'shop', 'customer']`
- **Dependencies (mock needed?)**: None (pure logic)

---

### 4.4 User Model (`models/User.js`)

#### `userSchema.pre('save')` - Password Hashing Hook

- **Purpose**: Automatically hash password before saving to database
- **Inputs + Types**: User document (before save)
- **Outputs / Return**: Hashed password in `this.password`
- **State Change / Side Effects**: Modifies `this.password` if password was modified
- **Edge Cases**:
  - Password not modified (skip hashing) → early return
  - Password already hashed (re-save without modification) → should not double-hash
  - bcrypt.genSalt fails → error propagates
  - bcrypt.hash fails → error propagates
- **Dependencies (mock needed?)**:
  - `bcrypt.genSalt`: ✅ Mock for unit tests
  - `bcrypt.hash`: ✅ Mock for unit tests

#### `userSchema.methods.matchPassword(enteredPassword)`

- **Purpose**: Compare plaintext password with hashed password
- **Inputs + Types**: `enteredPassword: string` (plaintext)
- **Outputs / Return**: `Promise<boolean>` (true if match, false otherwise)
- **State Change / Side Effects**: None
- **Edge Cases**:
  - Correct password → returns true
  - Wrong password → returns false
  - Empty password → returns false
  - Password with special characters
  - bcrypt.compare fails → error propagates
- **Dependencies (mock needed?)**:
  - `bcrypt.compare`: ✅ Mock for unit tests

---

### 4.5 Auth Controller (`controllers/authController.js`)

#### `register(req, res, next)`

- **Purpose**: Register new user with email verification
- **Inputs + Types**:
  - `req.body: {fullName, username, email, password, phone, address}`
- **Outputs / Return**:
  - 201 with `{success, data: {user, tokens: {accessToken, refreshToken}}}`
  - 400 if validation fails or email exists
- **State Change / Side Effects**:
  - Creates user in database with `isVerified: false`
  - Generates verification token
  - Sends verification email
  - Generates access & refresh tokens
- **Edge Cases**:
  - Missing required fields → 400 "Please provide..."
  - Duplicate email → 400 "User already exists"
  - Duplicate username → 400 (Mongoose validation error)
  - Invalid email format → 400 (Mongoose validation error)
  - Password < 6 characters → 400 (Mongoose validation error)
  - Email service fails → error propagates
  - Database save fails → error propagates
- **Dependencies (mock needed?)**:
  - `User.findOne`: ✅ Mock to check duplicate email
  - `User.create`: ✅ Mock user creation
  - `generateToken`: ✅ Mock token generation
  - `sendTemplatedEmail`: ✅ Mock email sending
  - `logger.info`: ✅ Mock
  - `logger.error`: ✅ Mock

#### `login(req, res, next)`

- **Purpose**: Authenticate user and issue tokens
- **Inputs + Types**:
  - `req.body: {email, password, rememberMe: boolean?}`
- **Outputs / Return**:
  - 200 with `{success, data: {user, tokens}}`
  - 401 if credentials invalid or user not verified/banned
  - 400 if fields missing
- **State Change / Side Effects**: None (read-only)
- **Edge Cases**:
  - Missing email or password → 400 "Please provide email and password"
  - Email not found → 401 "Email not found..."
  - Password incorrect → 401 "Incorrect password..."
  - User not verified → 401 "Please verify your email..."
  - User banned (`status: false`) → 401 "Account has been deactivated..."
  - rememberMe=true → tokens with 30d/90d expiry
  - rememberMe=false/undefined → tokens with 1d/7d expiry
- **Dependencies (mock needed?)**:
  - `User.findOne`: ✅ Mock with `.select('+password')`
  - `user.matchPassword`: ✅ Mock bcrypt comparison
  - `generateToken`: ✅ Mock
  - `logger.info`: ✅ Mock
  - `logger.error`: ✅ Mock

#### `logout(req, res, next)`

- **Purpose**: Invalidate user's current access token
- **Inputs + Types**:
  - `req.headers.authorization: "Bearer {token}"`
- **Outputs / Return**: 200 with `{success: true, data: {}}`
- **State Change / Side Effects**:
  - Adds token to TokenBlacklist with expiresAt
- **Edge Cases**:
  - No token in header → still returns 200 (graceful handling)
  - Token already blacklisted → duplicate insert (should handle with try-catch or check first)
  - Database insert fails → error propagates
- **Dependencies (mock needed?)**:
  - `TokenBlacklist.create`: ✅ Mock

#### `forgotPassword(req, res, next)`

- **Purpose**: Send password reset email
- **Inputs + Types**: `req.body: {email}`
- **Outputs / Return**:
  - 200 "Password reset email sent"
  - 404 if user not found
  - 400 if email missing
- **State Change / Side Effects**:
  - Generates reset token (JWT, 1h expiry)
  - Sends reset email
- **Edge Cases**:
  - Email not provided → 400 "Please provide an email"
  - User not found → 404 "User not found"
  - Email service fails → error propagates
- **Dependencies (mock needed?)**:
  - `User.findOne`: ✅ Mock
  - `generateToken`: ✅ Mock
  - `sendTemplatedEmail`: ✅ Mock
  - `logger.info`: ✅ Mock
  - `logger.error`: ✅ Mock

#### `resetPassword(req, res, next)`

- **Purpose**: Reset user password with token
- **Inputs + Types**: `req.body: {token, newPassword}`
- **Outputs / Return**:
  - 200 "Password reset successfully"
  - 404 if user not found
  - 401 if token invalid/expired
  - 400 if fields missing
- **State Change / Side Effects**:
  - Updates user password (triggers bcrypt hashing)
  - Saves user to database
- **Edge Cases**:
  - Missing token or newPassword → 400 "Please provide..."
  - Token expired → jwt.verify throws TokenExpiredError
  - Token invalid → jwt.verify throws JsonWebTokenError
  - User deleted after token issued → 404 "User not found"
  - newPassword < 6 characters → 400 (Mongoose validation error)
  - Database save fails → error propagates
- **Dependencies (mock needed?)**:
  - `jwt.verify`: ✅ Mock token verification
  - `User.findById`: ✅ Mock user lookup
  - `user.save`: ✅ Mock (triggers password hashing)
  - `logger.info`: ✅ Mock
  - `logger.error`: ✅ Mock

#### `verifyEmail(req, res, next)`

- **Purpose**: Verify user's email from verification link
- **Inputs + Types**: `req.query.token: string`
- **Outputs / Return**:
  - Redirect to success page if valid
  - Redirect to error page if invalid/expired
- **State Change / Side Effects**:
  - Sets `user.isVerified = true`
  - Clears `verificationToken` and `verificationTokenExpires`
  - Saves user to database
- **Edge Cases**:
  - Missing token → redirect to error page
  - Token expired → redirect to error page
  - Token invalid → redirect to error page
  - User not found → redirect to error page
  - Token doesn't match user's stored token → redirect to error page
  - Token expired (verificationTokenExpires < Date.now()) → redirect to error page
- **Dependencies (mock needed?)**:
  - `jwt.verify`: ✅ Mock
  - `User.findOne`: ✅ Mock with query conditions
  - `user.save`: ✅ Mock
  - `logger.info`: ✅ Mock
  - `logger.error`: ✅ Mock

#### `refreshToken(req, res, next)`

- **Purpose**: Issue new access token from valid refresh token
- **Inputs + Types**: `req.body: {refreshToken}`
- **Outputs / Return**:
  - 200 with `{success, token: newAccessToken}`
  - 401 if refresh token invalid
  - 404 if user not found
  - 400 if refresh token missing
- **State Change / Side Effects**: Generates new access token
- **Edge Cases**:
  - Missing refreshToken → 400 "Refresh token is required"
  - Refresh token expired → 401 "Invalid refresh token"
  - Refresh token signed with wrong secret → 401
  - User deleted after refresh token issued → 404 "User not found"
- **Dependencies (mock needed?)**:
  - `jwt.verify` (with JWT_REFRESH_SECRET): ✅ Mock
  - `User.findById`: ✅ Mock
  - `jwt.sign`: ✅ Mock
  - `ErrorResponse`: ✅ Mock

#### `loginWithGoogle(req, res)` / `loginWithFacebook(req, res)`

- **Purpose**: Social login (auto-create user if not exists)
- **Inputs + Types**: `req.body: {email, name, picture, rememberMe}`
- **Outputs / Return**:
  - 200 with `{success, message, user, token, refreshToken, isNewUser}`
  - 400 if email missing
  - 500 if error occurs
- **State Change / Side Effects**:
  - Creates new user if email doesn't exist
  - Generates unique username (email prefix + counter if collision)
  - Sets `isVerified: true` (social login trusted)
  - Updates avatar if picture provided
  - Generates tokens
- **Edge Cases**:
  - Missing email → 400 "Missing email from Google/Facebook"
  - New user (email not found) → create user with auto-generated username, isNewUser=true
  - Existing user → update avatar if changed, isNewUser=false
  - Username collision → append counter (username1, username2, etc.)
  - Database save/update fails → 500
- **Dependencies (mock needed?)**:
  - `User.findOne`: ✅ Mock
  - `User.exists`: ✅ Mock (for username collision check)
  - `User` constructor & `user.save`: ✅ Mock
  - `createTokens`: ✅ Mock helper function
  - `jwt.sign`: ✅ Mock

#### `registerApp(req, res, next)` / `verifyOtp(req, res, next)`

- **Purpose**: Mobile app registration with OTP verification
- **Inputs + Types**:
  - registerApp: `req.body: {fullName, username, email, password, phone, address}`
  - verifyOtp: `req.body: {email, otp}`
- **Outputs / Return**:
  - registerApp: 201 with `{success, message, data: {user, tokens, otpExpiresAt}}`
  - verifyOtp: 200 with `{success, message, data: {user, tokens}}`
  - 400 if validation fails
  - 404 if user not found (verifyOtp)
- **State Change / Side Effects**:
  - registerApp: Creates user, generates 6-digit OTP, stores in `otpStore` Map (5min expiry), sends OTP email
  - verifyOtp: Sets `isVerified: true`, deletes OTP from store
- **Edge Cases**:
  - registerApp: Duplicate email → 400
  - verifyOtp: Invalid OTP → 400 "Invalid or expired OTP"
  - verifyOtp: Expired OTP (Date.now() > expiresAt) → 400
  - verifyOtp: User not found → 404
  - OTP not found in store (never requested or expired) → 400
- **Dependencies (mock needed?)**:
  - `User.findOne`: ✅ Mock
  - `User.create`: ✅ Mock
  - `User.findOneAndUpdate`: ✅ Mock
  - `sendTemplatedEmail`: ✅ Mock
  - `generateToken`: ✅ Mock
  - `otpStore` Map: ✅ Mock/spy

---

### 4.6 Token Blacklist Model (`models/TokenBlacklist.js`)

#### `TokenBlacklist.create({token, expiresAt})`

- **Purpose**: Add token to blacklist (logout)
- **Inputs + Types**: `{token: string, expiresAt: Date}`
- **Outputs / Return**: Saved document or error if duplicate
- **State Change / Side Effects**: Inserts document into MongoDB; TTL index auto-deletes after expiresAt
- **Edge Cases**:
  - Duplicate token (already blacklisted) → E11000 duplicate key error
  - Invalid expiresAt date → Mongoose validation error
  - Database connection failure → error propagates
- **Dependencies (mock needed?)**:
  - MongoDB connection: ✅ Mock for unit tests

#### `TokenBlacklist.findOne({token})`

- **Purpose**: Check if token is blacklisted
- **Inputs + Types**: `{token: string}`
- **Outputs / Return**: Document if found, null otherwise
- **State Change / Side Effects**: None (read-only)
- **Edge Cases**:
  - Token found → returns document
  - Token not found → returns null
  - Database query fails → error propagates
- **Dependencies (mock needed?)**:
  - MongoDB connection: ✅ Mock

---

## 5. Test Case Matrix

### 5.1 JWT Utilities (`utils/jwt.js`)

| Category       | Scenario                                           | Pre-condition                                     | Input                                 | Expected Output/Behavior                                               |
| -------------- | -------------------------------------------------- | ------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| **Happy Path** | Generate token with valid payload                  | JWT_SECRET set                                    | `{id: 'user123'}`, '1d'               | Returns valid JWT string                                               |
| **Happy Path** | Verify valid non-expired token                     | JWT_SECRET set                                    | Valid JWT signed with correct secret  | Returns decoded payload `{id, iat, exp}`                               |
| **Happy Path** | Generate refresh token                             | JWT_REFRESH_SECRET set                            | `{id: 'user123'}`                     | Returns valid JWT string                                               |
| **Happy Path** | Verify valid refresh token                         | JWT_REFRESH_SECRET set                            | Valid refresh JWT                     | Returns decoded payload                                                |
| **Edge Case**  | Generate token with custom expiry                  | JWT_SECRET set                                    | `{id: 'user123'}`, '10m'              | Token expires in 10 minutes                                            |
| **Edge Case**  | Generate token without expiry (use default)        | JWT_SECRET set, JWT_EXPIRES_IN='2h'               | `{id: 'user123'}`, undefined          | Uses default 2h from env                                               |
| **Error**      | Verify expired token                               | JWT_SECRET set                                    | Expired JWT                           | Throws `TokenExpiredError` with message 'jwt expired'                  |
| **Error**      | Verify malformed token                             | JWT_SECRET set                                    | 'invalid.token.string'                | Throws `JsonWebTokenError` with message 'jwt malformed'                |
| **Error**      | Verify token with wrong secret                     | JWT_SECRET='secret1', token signed with 'secret2' | Token signed with different secret    | Throws `JsonWebTokenError` with message 'invalid signature'            |
| **Error**      | Verify token with missing signature                | JWT_SECRET set                                    | Token with tampered signature         | Throws `JsonWebTokenError`                                             |
| **Error**      | Generate token when JWT_SECRET missing             | JWT_SECRET undefined                              | `{id: 'user123'}`                     | Throws error, logger.error called                                      |
| **Error**      | Verify token when JWT_SECRET missing               | JWT_SECRET undefined                              | Valid token                           | Throws error, logger.error called                                      |
| **Security**   | Verify token with audience/issuer (if implemented) | JWT_SECRET set                                    | Token with wrong audience             | Throws error                                                           |
| **Security**   | Generate token with sensitive data                 | JWT_SECRET set                                    | `{id: 'user123', password: 'secret'}` | Token contains password in payload (security risk - should be avoided) |

### 5.2 Auth Middleware (`middlewares/auth.middleware.js`)

#### `protect` Middleware

| Category       | Scenario                                    | Pre-condition                             | Input                                           | Expected Output/Behavior                                                   |
| -------------- | ------------------------------------------- | ----------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| **Happy Path** | Valid token, verified user                  | User exists, isVerified=true, status=true | `Authorization: Bearer {validToken}`            | Sets `req.user`, calls `next()`                                            |
| **Happy Path** | Valid token with userId in payload          | Token has `userId` instead of `id`        | `Authorization: Bearer {token with userId}`     | Sets `req.user`, calls `next()`                                            |
| **Edge Case**  | Header format: lowercase "bearer"           | Valid token                               | `Authorization: bearer {token}`                 | Should handle case-insensitive (current code only accepts "Bearer ")       |
| **Edge Case**  | Header format: extra spaces                 | Valid token                               | `Authorization: Bearer  {token}` (double space) | Should handle extra spaces                                                 |
| **Edge Case**  | Token value: "undefined" string             | None                                      | `Authorization: Bearer undefined`               | Calls `next(ErrorResponse)` with 401 "No valid token provided"             |
| **Edge Case**  | Token value: "null" string                  | None                                      | `Authorization: Bearer null`                    | Calls `next(ErrorResponse)` with 401                                       |
| **Edge Case**  | Token value: empty string                   | None                                      | `Authorization: Bearer ` (trailing space)       | Calls `next(ErrorResponse)` with 401                                       |
| **Error**      | Missing Authorization header                | None                                      | No header                                       | Calls `next(ErrorResponse)` with 401 "No valid token provided"             |
| **Error**      | Authorization header without "Bearer "      | None                                      | `Authorization: {token}` (no "Bearer ")         | Calls `next(ErrorResponse)` with 401                                       |
| **Error**      | Expired token                               | Token expired                             | `Authorization: Bearer {expiredToken}`          | Calls `next(ErrorResponse)` with 401 "Not authorized to access this route" |
| **Error**      | Malformed token                             | Invalid token                             | `Authorization: Bearer invalid.token`           | Calls `next(ErrorResponse)` with 401                                       |
| **Error**      | Token from different environment            | Token signed with different secret        | `Authorization: Bearer {tokenFromDifferentEnv}` | Calls `next(ErrorResponse)` with 401                                       |
| **Error**      | Blacklisted token                           | Token exists in TokenBlacklist            | `Authorization: Bearer {blacklistedToken}`      | Calls `next(ErrorResponse)` with 401 "Token has been invalidated"          |
| **Error**      | User not found (deleted after token issued) | User ID in token doesn't exist            | `Authorization: Bearer {validToken}`            | Calls `next(ErrorResponse)` with 404 "User not found"                      |
| **Error**      | User not verified                           | User exists, isVerified=false             | `Authorization: Bearer {validToken}`            | Calls `next(ErrorResponse)` with 401 "Please verify your email..."         |
| **Error**      | User banned                                 | User exists, status=false                 | `Authorization: Bearer {validToken}`            | Calls `next(ErrorResponse)` with 403 "Account has been deactivated..."     |
| **Security**   | Brute-force with many invalid tokens        | None                                      | 100 requests with invalid tokens                | All return 401 (no account lockout currently)                              |
| **Security**   | Token with extra claims                     | Valid token                               | Token with `admin: true` in payload             | Should not affect authorization (role checked from database user.role)     |

#### `optionalAuth` Middleware

| Category       | Scenario                           | Pre-condition                             | Input                                      | Expected Output/Behavior               |
| -------------- | ---------------------------------- | ----------------------------------------- | ------------------------------------------ | -------------------------------------- |
| **Happy Path** | Valid token, verified user         | User exists, isVerified=true, status=true | `Authorization: Bearer {validToken}`       | Sets `req.user`, calls `next()`        |
| **Happy Path** | No token provided (guest)          | None                                      | No Authorization header                    | Sets `req.user = null`, calls `next()` |
| **Edge Case**  | Expired token (guest fallback)     | Token expired                             | `Authorization: Bearer {expiredToken}`     | Sets `req.user = null`, calls `next()` |
| **Edge Case**  | Invalid token (guest fallback)     | Invalid token                             | `Authorization: Bearer invalid`            | Sets `req.user = null`, calls `next()` |
| **Edge Case**  | Blacklisted token (guest fallback) | Token in blacklist                        | `Authorization: Bearer {blacklistedToken}` | Sets `req.user = null`, calls `next()` |
| **Edge Case**  | Unverified user (guest fallback)   | User isVerified=false                     | `Authorization: Bearer {validToken}`       | Sets `req.user = null`, calls `next()` |
| **Edge Case**  | Banned user (guest fallback)       | User status=false                         | `Authorization: Bearer {validToken}`       | Sets `req.user = null`, calls `next()` |

#### `authorize(...roles)` / `requireAdmin`

| Category       | Scenario                                  | Pre-condition                | Input                        | Expected Output/Behavior                                                       |
| -------------- | ----------------------------------------- | ---------------------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| **Happy Path** | User has allowed role                     | `req.user.role = 'admin'`    | `authorize('admin', 'shop')` | Calls `next()`                                                                 |
| **Happy Path** | Admin accessing admin route               | `req.user.role = 'admin'`    | `requireAdmin`               | Calls `next()`                                                                 |
| **Happy Path** | User has one of multiple allowed roles    | `req.user.role = 'shop'`     | `authorize('admin', 'shop')` | Calls `next()`                                                                 |
| **Error**      | User role not allowed                     | `req.user.role = 'customer'` | `authorize('admin')`         | Calls `next(ErrorResponse)` with 403 "User role customer is not authorized..." |
| **Error**      | Missing req.user (middleware order issue) | `req.user = undefined`       | `authorize('admin')`         | TypeError: Cannot read property 'role' of undefined                            |
| **Error**      | User role is null                         | `req.user.role = null`       | `authorize('admin')`         | Calls `next(ErrorResponse)` with 403                                           |

### 5.3 Role Middleware (`middlewares/role.middleware.js`)

#### `checkRoleLevel(requiredLevel)`

| Category       | Scenario                              | Pre-condition                                          | Input                       | Expected Output/Behavior                                                      |
| -------------- | ------------------------------------- | ------------------------------------------------------ | --------------------------- | ----------------------------------------------------------------------------- |
| **Happy Path** | User role meets requirement           | `req.user.role = 'admin'` (level 3)                    | `requireCustomer` (level 1) | Calls `next()`                                                                |
| **Happy Path** | User role exactly matches requirement | `req.user.role = 'customer'` (level 1)                 | `requireCustomer` (level 1) | Calls `next()`                                                                |
| **Error**      | User role below requirement           | `req.user.role = 'guest'` (level 0)                    | `requireCustomer` (level 1) | Calls `next(ErrorResponse)` with 403 "Role guest is not authorized..."        |
| **Error**      | Missing req.user                      | `req.user = undefined`                                 | `requireCustomer`           | Calls `next(ErrorResponse)` with 401 "Authentication required"                |
| **Error**      | User role not in hierarchy            | `req.user.role = 'superadmin'` (not in ROLE_HIERARCHY) | `requireCustomer`           | Calls `next(ErrorResponse)` with 403 "Invalid user role", logger.error called |
| **Error**      | User role is null/undefined           | `req.user.role = null`                                 | `requireCustomer`           | Calls `next(ErrorResponse)` with 403 "Invalid user role"                      |

#### `requireRoles(...roles)`

| Category       | Scenario                      | Pre-condition                | Input                                       | Expected Output/Behavior                                   |
| -------------- | ----------------------------- | ---------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| **Happy Path** | User role in allowed list     | `req.user.role = 'admin'`    | `requireRoles('admin', 'shop')`             | Calls `next()`                                             |
| **Happy Path** | Single role match             | `req.user.role = 'shop'`     | `requireRoles('shop')`                      | Calls `next()`                                             |
| **Error**      | User role not in allowed list | `req.user.role = 'customer'` | `requireRoles('admin', 'shop')`             | Returns 403 JSON with error message listing required roles |
| **Error**      | Missing req.user              | `req.user = undefined`       | `requireRoles('admin')`                     | Returns 401 JSON "Authentication required"                 |
| **Edge Case**  | Multiple roles provided       | `req.user.role = 'customer'` | `requireRoles('admin', 'shop', 'customer')` | Calls `next()`                                             |

### 5.4 User Model (`models/User.js`)

#### Password Hashing (`pre('save')` hook)

| Category       | Scenario                                | Pre-condition     | Input                                        | Expected Output/Behavior                |
| -------------- | --------------------------------------- | ----------------- | -------------------------------------------- | --------------------------------------- |
| **Happy Path** | Save new user with password             | New user document | `user.password = 'password123'`              | Password hashed with bcrypt before save |
| **Happy Path** | Save user after password change         | Existing user     | `user.password = 'newPassword'; user.save()` | Password re-hashed                      |
| **Edge Case**  | Save user without password modification | Existing user     | `user.fullName = 'New Name'; user.save()`    | Password NOT re-hashed (early return)   |
| **Edge Case**  | Save user with already hashed password  | Existing user     | `user.save()` (no password change)           | Password NOT double-hashed              |
| **Error**      | bcrypt.genSalt fails                    | None              | `user.password = 'password123'`              | Error propagates, save fails            |
| **Error**      | bcrypt.hash fails                       | None              | `user.password = 'password123'`              | Error propagates, save fails            |

#### `matchPassword(enteredPassword)`

| Category       | Scenario                         | Pre-condition             | Input                                         | Expected Output/Behavior                     |
| -------------- | -------------------------------- | ------------------------- | --------------------------------------------- | -------------------------------------------- |
| **Happy Path** | Correct password                 | User with hashed password | `await user.matchPassword('correctPassword')` | Returns `true`                               |
| **Happy Path** | Wrong password                   | User with hashed password | `await user.matchPassword('wrongPassword')`   | Returns `false`                              |
| **Edge Case**  | Empty password                   | User with hashed password | `await user.matchPassword('')`                | Returns `false`                              |
| **Edge Case**  | Password with special characters | User with hashed password | `await user.matchPassword('P@$$w0rd!')`       | Returns `true` if correct, `false` otherwise |
| **Error**      | bcrypt.compare fails             | None                      | `await user.matchPassword('password')`        | Error propagates                             |

### 5.5 Auth Controller (`controllers/authController.js`)

#### `register(req, res, next)`

| Category       | Scenario                          | Pre-condition         | Input                                                   | Expected Output/Behavior                                            |
| -------------- | --------------------------------- | --------------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| **Happy Path** | Valid registration data           | Email not exists      | `{fullName, username, email, password, phone, address}` | 201 with user & tokens, verification email sent, logger.info called |
| **Error**      | Missing required field (fullName) | None                  | `{username, email, password, phone, address}`           | Calls `next(ErrorResponse)` with 400 "Please provide full name..."  |
| **Error**      | Missing required field (email)    | None                  | `{fullName, username, password, phone, address}`        | Calls `next(ErrorResponse)` with 400                                |
| **Error**      | Duplicate email                   | Email exists in DB    | `{..., email: 'existing@test.com'}`                     | Calls `next(ErrorResponse)` with 400 "User already exists"          |
| **Error**      | Duplicate username                | Username exists in DB | `{..., username: 'existingUser'}`                       | Mongoose E11000 duplicate key error, calls `next(error)`            |
| **Error**      | Invalid email format              | None                  | `{..., email: 'invalid-email'}`                         | Mongoose validation error, calls `next(error)`                      |
| **Error**      | Password < 6 characters           | None                  | `{..., password: '12345'}`                              | Mongoose validation error "Password must be at least 6 characters"  |
| **Error**      | Email service fails               | Email service down    | Valid input                                             | Error propagates, logger.error called                               |
| **Security**   | Password stored as plaintext      | None                  | `{..., password: 'password123'}`                        | Password hashed before storage (bcrypt)                             |

#### `login(req, res, next)`

| Category       | Scenario                          | Pre-condition                             | Input                                                 | Expected Output/Behavior                                                                              |
| -------------- | --------------------------------- | ----------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Happy Path** | Valid credentials, verified user  | User exists, isVerified=true, status=true | `{email, password}`                                   | 200 with user & tokens (1d/7d), logger.info called                                                    |
| **Happy Path** | Valid credentials with rememberMe | User verified & active                    | `{email, password, rememberMe: true}`                 | 200 with tokens (30d/90d expiry)                                                                      |
| **Error**      | Missing email                     | None                                      | `{password: 'password123'}`                           | Calls `next(ErrorResponse)` with 400 "Please provide email and password"                              |
| **Error**      | Missing password                  | None                                      | `{email: 'test@test.com'}`                            | Calls `next(ErrorResponse)` with 400                                                                  |
| **Error**      | Email not found                   | Email doesn't exist                       | `{email: 'nonexistent@test.com', password: 'pass'}`   | Calls `next(ErrorResponse)` with 401 "Email not found..."                                             |
| **Error**      | Wrong password                    | User exists                               | `{email: 'user@test.com', password: 'wrongPassword'}` | Calls `next(ErrorResponse)` with 401 "Incorrect password..."                                          |
| **Error**      | User not verified                 | User exists, isVerified=false             | `{email, password}` (correct credentials)             | Calls `next(ErrorResponse)` with 401 "Please verify your email..."                                    |
| **Error**      | User banned                       | User exists, status=false                 | `{email, password}` (correct credentials)             | Calls `next(ErrorResponse)` with 401 "Account has been deactivated..."                                |
| **Security**   | Error message doesn't leak info   | None                                      | `{email: 'nonexistent@test.com', password: 'pass'}`   | Error message avoids saying "email OR password is wrong" (current: specific message - potential leak) |
| **Security**   | Brute-force handling              | None                                      | 100 failed login attempts                             | No account lockout currently (potential improvement)                                                  |

#### `logout(req, res, next)`

| Category       | Scenario                  | Pre-condition           | Input                                      | Expected Output/Behavior                         |
| -------------- | ------------------------- | ----------------------- | ------------------------------------------ | ------------------------------------------------ |
| **Happy Path** | Valid token               | Token in header         | `Authorization: Bearer {token}`            | 200, token added to blacklist with expiresAt=24h |
| **Edge Case**  | No token in header        | No Authorization header | None                                       | 200 (gracefully handles missing token)           |
| **Edge Case**  | Token already blacklisted | Token in blacklist      | `Authorization: Bearer {blacklistedToken}` | 200, duplicate insert handled                    |
| **Error**      | Database insert fails     | DB down                 | `Authorization: Bearer {token}`            | Error propagates                                 |

#### `forgotPassword(req, res, next)`

| Category       | Scenario            | Pre-condition       | Input                             | Expected Output/Behavior                                              |
| -------------- | ------------------- | ------------------- | --------------------------------- | --------------------------------------------------------------------- |
| **Happy Path** | Valid email         | User exists         | `{email: 'user@test.com'}`        | 200 "Password reset email sent", reset email sent, logger.info called |
| **Error**      | Missing email       | None                | `{}`                              | Calls `next(ErrorResponse)` with 400 "Please provide an email"        |
| **Error**      | User not found      | Email doesn't exist | `{email: 'nonexistent@test.com'}` | Calls `next(ErrorResponse)` with 404 "User not found"                 |
| **Error**      | Email service fails | Email service down  | `{email: 'user@test.com'}`        | Error propagates, logger.error called                                 |
| **Security**   | Reset token expiry  | None                | Valid input                       | Token expires in 1h (JWT_RESET_EXPIRES_IN)                            |

#### `resetPassword(req, res, next)`

| Category       | Scenario                   | Pre-condition                   | Input                                                 | Expected Output/Behavior                                                     |
| -------------- | -------------------------- | ------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Happy Path** | Valid token & password     | User exists                     | `{token: validResetToken, newPassword: 'NewPass123'}` | 200 "Password reset successfully", password updated, logger.info called      |
| **Error**      | Missing token              | None                            | `{newPassword: 'NewPass123'}`                         | Calls `next(ErrorResponse)` with 400 "Please provide token and new password" |
| **Error**      | Missing newPassword        | None                            | `{token: validToken}`                                 | Calls `next(ErrorResponse)` with 400                                         |
| **Error**      | Token expired              | Expired reset token             | `{token: expiredToken, newPassword: 'NewPass123'}`    | jwt.verify throws TokenExpiredError, calls `next(error)`                     |
| **Error**      | Token invalid              | Malformed token                 | `{token: 'invalid.token', newPassword: 'NewPass123'}` | jwt.verify throws JsonWebTokenError, calls `next(error)`                     |
| **Error**      | User not found             | User deleted after token issued | `{token: validToken, newPassword: 'NewPass123'}`      | Calls `next(ErrorResponse)` with 404 "User not found"                        |
| **Error**      | newPassword < 6 characters | None                            | `{token: validToken, newPassword: '12345'}`           | Mongoose validation error, calls `next(error)`                               |

#### `verifyEmail(req, res, next)`

| Category       | Scenario                         | Pre-condition                           | Input                                    | Expected Output/Behavior                                              |
| -------------- | -------------------------------- | --------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| **Happy Path** | Valid verification token         | User exists, token matches, not expired | `?token={validToken}`                    | Redirect to success page, user.isVerified=true, logger.info called    |
| **Error**      | Missing token                    | None                                    | No query params                          | Redirect to error page "?error=Verification token is required"        |
| **Error**      | Token expired                    | Token.exp < Date.now()                  | `?token={expiredToken}`                  | jwt.verify throws TokenExpiredError, redirect to error page           |
| **Error**      | Token invalid                    | Malformed token                         | `?token=invalid.token`                   | jwt.verify throws error, redirect to error page                       |
| **Error**      | User not found                   | User doesn't exist                      | `?token={validToken}` (user deleted)     | Redirect to error page "?error=Invalid or expired verification token" |
| **Error**      | Token doesn't match stored token | Token valid but different               | `?token={validTokenA}` (user has tokenB) | User.findOne returns null, redirect to error page                     |
| **Error**      | Token expired (DB check)         | verificationTokenExpires < Date.now()   | `?token={token}`                         | User.findOne returns null (query condition), redirect to error page   |

#### `refreshToken(req, res, next)`

| Category       | Scenario                               | Pre-condition                                              | Input                                  | Expected Output/Behavior                                         |
| -------------- | -------------------------------------- | ---------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| **Happy Path** | Valid refresh token                    | User exists                                                | `{refreshToken: validRefreshToken}`    | 200 with new accessToken                                         |
| **Error**      | Missing refreshToken                   | None                                                       | `{}`                                   | Calls `next(ErrorResponse)` with 400 "Refresh token is required" |
| **Error**      | Refresh token expired                  | Expired refresh token                                      | `{refreshToken: expiredToken}`         | Calls `next(ErrorResponse)` with 401 "Invalid refresh token"     |
| **Error**      | Refresh token invalid                  | Malformed token                                            | `{refreshToken: 'invalid.token'}`      | Calls `next(ErrorResponse)` with 401                             |
| **Error**      | Refresh token signed with wrong secret | Token signed with JWT_SECRET instead of JWT_REFRESH_SECRET | `{refreshToken: tokenWithWrongSecret}` | jwt.verify throws error, calls `next(ErrorResponse)` with 401    |
| **Error**      | User not found                         | User deleted after refresh token issued                    | `{refreshToken: validToken}`           | Calls `next(ErrorResponse)` with 404 "User not found"            |

#### `loginWithGoogle(req, res)` / `loginWithFacebook(req, res)`

| Category       | Scenario               | Pre-condition                                   | Input                                                              | Expected Output/Behavior                                                    |
| -------------- | ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **Happy Path** | New user (auto-create) | Email doesn't exist                             | `{email, name, picture}`                                           | 200 with user, tokens, `isNewUser: true`, user created with isVerified=true |
| **Happy Path** | Existing user          | Email exists                                    | `{email, name, picture}`                                           | 200 with user, tokens, `isNewUser: false`, avatar updated if changed        |
| **Happy Path** | With rememberMe        | Email exists                                    | `{email, name, picture, rememberMe: true}`                         | 200 with tokens (30d/90d expiry)                                            |
| **Error**      | Missing email          | None                                            | `{name, picture}`                                                  | 400 "Missing email from Google/Facebook"                                    |
| **Edge Case**  | Username collision     | Email doesn't exist, username from email exists | `{email: 'test@example.com'}` (username 'test' exists)             | New user created with username 'test1', 'test2', etc.                       |
| **Edge Case**  | No name provided       | Email doesn't exist                             | `{email, picture}` (no name)                                       | User created with fullName='Google User' or 'Facebook User'                 |
| **Edge Case**  | Avatar update          | Existing user, new picture                      | `{email, name, picture: 'newAvatar.jpg'}` (user.avatar != picture) | User avatar updated to new picture                                          |
| **Error**      | Database save fails    | None                                            | Valid input                                                        | 500 "Login Google/Facebook failed"                                          |

#### `registerApp(req, res, next)` / `verifyOtp(req, res, next)`

| Category                     | Scenario               | Pre-condition                    | Input                                                   | Expected Output/Behavior                                            |
| ---------------------------- | ---------------------- | -------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| **Happy Path - registerApp** | Valid registration     | Email doesn't exist              | `{fullName, username, email, password, phone, address}` | 201 with user, tokens, OTP sent to email, otpExpiresAt              |
| **Happy Path - verifyOtp**   | Valid OTP              | OTP exists in store, not expired | `{email, otp: '123456'}`                                | 200 with user, tokens, user.isVerified=true, OTP deleted from store |
| **Error - registerApp**      | Missing required field | None                             | `{fullName, email, password}` (no username)             | Calls `next(ErrorResponse)` with 400 "Missing required fields"      |
| **Error - registerApp**      | Duplicate email        | Email exists                     | `{..., email: 'existing@test.com'}`                     | Calls `next(ErrorResponse)` with 400 "User already exists"          |
| **Error - verifyOtp**        | Missing email or OTP   | None                             | `{email}` (no OTP)                                      | Calls `next(ErrorResponse)` with 400 "Email and OTP are required"   |
| **Error - verifyOtp**        | Invalid OTP            | OTP in store doesn't match       | `{email, otp: 'wrongOtp'}`                              | Calls `next(ErrorResponse)` with 400 "Invalid or expired OTP"       |
| **Error - verifyOtp**        | Expired OTP            | Date.now() > otpExpiresAt        | `{email, otp: '123456'}` (expired)                      | Calls `next(ErrorResponse)` with 400 "Invalid or expired OTP"       |
| **Error - verifyOtp**        | OTP not found          | No OTP in store for email        | `{email, otp: '123456'}`                                | Calls `next(ErrorResponse)` with 400 "Invalid or expired OTP"       |
| **Error - verifyOtp**        | User not found         | Email doesn't exist in DB        | `{email, otp: '123456'}`                                | Calls `next(ErrorResponse)` with 404 "User not found"               |
| **Edge Case - registerApp**  | OTP format             | None                             | Valid input                                             | OTP is 6-digit string (100000-999999)                               |
| **Edge Case - verifyOtp**    | OTP cleanup            | Valid OTP verified               | `{email, otp: '123456'}`                                | OTP deleted from otpStore after verification                        |

#### `resendOtp(req, res, next)`

| Category       | Scenario              | Pre-condition                 | Input                             | Expected Output/Behavior                                           |
| -------------- | --------------------- | ----------------------------- | --------------------------------- | ------------------------------------------------------------------ |
| **Happy Path** | User not verified     | User exists, isVerified=false | `{email: 'user@test.com'}`        | 200 "OTP resent successfully", new OTP sent to email, otpExpiresAt |
| **Error**      | User not found        | Email doesn't exist           | `{email: 'nonexistent@test.com'}` | Calls `next(ErrorResponse)` with 404 "User not found"              |
| **Error**      | User already verified | User exists, isVerified=true  | `{email: 'verified@test.com'}`    | Calls `next(ErrorResponse)` with 400 "User already verified"       |

### 5.6 Integration Tests (Routes + Middleware + Controller)

#### Auth Routes (`/api/auth/*`)

| Category        | Scenario                                                 | Pre-condition                 | Input                                             | Expected Output/Behavior                                                        |
| --------------- | -------------------------------------------------------- | ----------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Integration** | POST /api/auth/register → login → access protected route | None                          | Register, then login, then GET /api/auth/me       | All succeed, final request returns user profile                                 |
| **Integration** | POST /api/auth/login (success)                           | User exists, verified, active | `{email, password}`                               | 200 with tokens                                                                 |
| **Integration** | POST /api/auth/login (fail - unverified)                 | User exists, isVerified=false | `{email, password}`                               | 401 "Please verify your email..."                                               |
| **Integration** | POST /api/auth/login (fail - banned)                     | User exists, status=false     | `{email, password}`                               | 401 "Account has been deactivated..."                                           |
| **Integration** | GET /api/auth/me (no token)                              | None                          | No Authorization header                           | 401 "No valid token provided"                                                   |
| **Integration** | GET /api/auth/me (invalid token)                         | None                          | `Authorization: Bearer invalid.token`             | 401 "Not authorized..."                                                         |
| **Integration** | GET /api/auth/me (expired token)                         | Token expired                 | `Authorization: Bearer {expiredToken}`            | 401 "Not authorized..."                                                         |
| **Integration** | GET /api/auth/me (valid token)                           | User verified & active        | `Authorization: Bearer {validToken}`              | 200 with user data                                                              |
| **Integration** | POST /api/auth/logout → reuse token                      | User logged in                | Logout, then GET /api/auth/me with same token     | Logout succeeds, subsequent request fails with 401 "Token has been invalidated" |
| **Integration** | POST /api/auth/refresh-token                             | Refresh token valid           | `{refreshToken}`                                  | 200 with new accessToken                                                        |
| **Integration** | PUT /api/auth/change-password                            | User authenticated            | `{currentPassword, newPassword}` with valid token | 200 "Password changed successfully"                                             |

#### User Routes with Role Checks (`/api/users/*`)

| Category        | Scenario                            | Pre-condition               | Input                                   | Expected Output/Behavior                 |
| --------------- | ----------------------------------- | --------------------------- | --------------------------------------- | ---------------------------------------- |
| **Integration** | GET /api/users (admin)              | Admin user authenticated    | `Authorization: Bearer {adminToken}`    | 200 with users list                      |
| **Integration** | GET /api/users (customer)           | Customer user authenticated | `Authorization: Bearer {customerToken}` | 403 "Role customer is not authorized..." |
| **Integration** | GET /api/users (no auth)            | No authentication           | No Authorization header                 | 401 "No valid token provided"            |
| **Integration** | GET /api/users/active (shop)        | Shop user authenticated     | `Authorization: Bearer {shopToken}`     | 200 with active users                    |
| **Integration** | GET /api/users/active (customer)    | Customer user authenticated | `Authorization: Bearer {customerToken}` | 403 "Role customer is not authorized..." |
| **Integration** | PATCH /api/users/:id/status (admin) | Admin user authenticated    | `Authorization: Bearer {adminToken}`    | 200, user banned/unbanned                |
| **Integration** | PATCH /api/users/:id/status (shop)  | Shop user authenticated     | `Authorization: Bearer {shopToken}`     | 403 "Role shop is not authorized..."     |

---

## 6. Test Priority Recommendation

### High Priority (Critical for Security & Business)

| Module/Function                                  | Priority | Justification                                                                              |
| ------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------ |
| **`protect` middleware**                         | **HIGH** | Core auth check; failure exposes all protected routes; affects all authenticated endpoints |
| **`login` controller**                           | **HIGH** | Main entry point; password verification critical; handles account status checks            |
| **User.matchPassword**                           | **HIGH** | Password comparison; incorrect logic = unauthorized access                                 |
| **Password hashing (pre-save hook)**             | **HIGH** | Passwords must be hashed; failure = plaintext storage (critical security risk)             |
| **Token blacklisting (logout)**                  | **HIGH** | Prevents token reuse; failure = users can't logout securely                                |
| **JWT verifyToken**                              | **HIGH** | Token validation; failure = invalid tokens accepted                                        |
| **Role middleware (requireAdmin, requireRoles)** | **HIGH** | Access control for admin routes; failure = privilege escalation                            |
| **register controller**                          | **HIGH** | User creation entry point; validation critical                                             |

### Medium Priority (Important but Lower Risk)

| Module/Function                    | Priority   | Justification                                                                     |
| ---------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| **refreshToken controller**        | **MEDIUM** | Token refresh flow; failure affects session continuity but not immediate security |
| **forgotPassword / resetPassword** | **MEDIUM** | Password recovery; important UX but less frequently used                          |
| **verifyEmail controller**         | **MEDIUM** | Email verification flow; affects new user onboarding                              |
| **optionalAuth middleware**        | **MEDIUM** | Hybrid auth; used for public/private routes but less critical than protect        |
| **authorize middleware**           | **MEDIUM** | Role check; important but less complex than requireRoles                          |
| **JWT generateToken**              | **MEDIUM** | Token creation; critical but simpler logic than verification                      |
| **Social login (Google/Facebook)** | **MEDIUM** | Alternative auth flow; important for UX but not primary login method              |

### Low Priority (Edge Cases & Nice-to-Have)

| Module/Function                               | Priority | Justification                                                     |
| --------------------------------------------- | -------- | ----------------------------------------------------------------- |
| **OTP registration (registerApp, verifyOtp)** | **LOW**  | Mobile app specific; alternative flow to web registration         |
| **resendOtp / resendVerification**            | **LOW**  | Retry mechanisms; important UX but not core functionality         |
| **updateProfile controller**                  | **LOW**  | Profile updates; important but not auth-critical                  |
| **checkRoleLevel middleware**                 | **LOW**  | Role hierarchy checks; less commonly used than exact role checks  |
| **TokenBlacklist model operations**           | **LOW**  | Database layer; covered by integration tests                      |
| **Logger calls**                              | **LOW**  | Observability; important for debugging but not functional testing |

---

## 7. Mocking & Test Data Preparation

### 7.1 Dependencies to Mock

| Dependency                       | What to Mock                | Mocking Strategy                                                                                                     | Sample Mock Data                                                                                                                               |
| -------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **`jsonwebtoken.sign`**          | JWT token generation        | Use `jest.fn().mockReturnValue('mockToken123')`                                                                      | `'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'` (fake JWT)                                                                                         |
| **`jsonwebtoken.verify`**        | Token verification          | Mock to return decoded payload or throw errors                                                                       | Success: `{id: 'user123', iat: 1234567890, exp: 1234571490}`<br>Error: `throw new jwt.TokenExpiredError('jwt expired')`                        |
| **`bcrypt.genSalt`**             | Salt generation             | `jest.fn().mockResolvedValue('$2a$10$mockedSalt')`                                                                   | `'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'`                                                                               |
| **`bcrypt.hash`**                | Password hashing            | `jest.fn().mockResolvedValue('hashedPassword123')`                                                                   | `'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'`                                                                               |
| **`bcrypt.compare`**             | Password comparison         | `jest.fn().mockResolvedValue(true/false)`                                                                            | Success: `true`, Failure: `false`                                                                                                              |
| **`User.findOne`**               | Find user by email/username | `jest.fn().mockResolvedValue(mockUserDocument)`                                                                      | `{_id: 'user123', email: 'test@test.com', password: 'hashedPass', isVerified: true, status: true, role: 'customer', matchPassword: jest.fn()}` |
| **`User.findById`**              | Find user by ID             | `jest.fn().mockResolvedValue(mockUserDocument)`                                                                      | Same as User.findOne                                                                                                                           |
| **`User.create`**                | Create new user             | `jest.fn().mockResolvedValue(mockUserDocument)`                                                                      | `{_id: 'newUser123', email: 'new@test.com', fullName: 'Test User', isVerified: false, ...}`                                                    |
| **`User.findByIdAndUpdate`**     | Update user                 | `jest.fn().mockResolvedValue(updatedUserDocument)`                                                                   | `{_id: 'user123', fullName: 'Updated Name', ...}`                                                                                              |
| **`TokenBlacklist.findOne`**     | Check if token blacklisted  | `jest.fn().mockResolvedValue(null)` (not blacklisted)<br>`jest.fn().mockResolvedValue({token: 'xxx'})` (blacklisted) | Blacklisted: `{_id: 'blacklist123', token: 'blacklistedToken', expiresAt: Date}`                                                               |
| **`TokenBlacklist.create`**      | Add token to blacklist      | `jest.fn().mockResolvedValue({token: 'xxx'})`                                                                        | `{_id: 'blacklist123', token: 'loggedOutToken', expiresAt: new Date()}`                                                                        |
| **`sendTemplatedEmail`**         | Send email                  | `jest.fn().mockResolvedValue(true)`                                                                                  | N/A (spy to verify call with correct params)                                                                                                   |
| **`logger.info / logger.error`** | Logging                     | `jest.fn()` (spy to verify logging)                                                                                  | N/A                                                                                                                                            |
| **`ErrorResponse`**              | Custom error class          | Spy or mock constructor                                                                                              | N/A (verify error message & status code)                                                                                                       |
| **`process.env`**                | Environment variables       | Mock with `jest.spyOn(process.env, 'JWT_SECRET', 'get').mockReturnValue('testSecret')`                               | `JWT_SECRET: 'testSecretKey'`, `JWT_EXPIRES_IN: '1d'`, `JWT_REFRESH_SECRET: 'testRefreshSecret'`                                               |

### 7.2 Test Data Samples

#### Mock User Documents

```javascript
// Mock verified, active customer user
const mockCustomerUser = {
  _id: 'customer123',
  fullName: 'Nguyễn Văn A',
  username: 'nguyenvana',
  email: 'nguyenvana@gmail.com',
  password: '$2a$10$hashedPasswordHere', // bcrypt hash
  phone: '0987654321',
  address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
  role: 'customer',
  avatar: 'https://example.com/avatar.jpg',
  isVerified: true,
  status: true,
  reward_point: 0,
  gender: 'male',
  dateOfBirth: new Date('1990-01-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
  matchPassword: jest.fn().mockResolvedValue(true), // Mock instance method
};

// Mock unverified user
const mockUnverifiedUser = {
  ...mockCustomerUser,
  _id: 'unverified123',
  email: 'unverified@test.com',
  isVerified: false,
  verificationToken: 'verifyToken123',
  verificationTokenExpires: new Date(Date.now() + 3600000),
};

// Mock banned user
const mockBannedUser = {
  ...mockCustomerUser,
  _id: 'banned123',
  email: 'banned@test.com',
  status: false,
};

// Mock admin user
const mockAdminUser = {
  ...mockCustomerUser,
  _id: 'admin123',
  email: 'admin@kicks-shoes.com',
  role: 'admin',
};

// Mock shop user
const mockShopUser = {
  ...mockCustomerUser,
  _id: 'shop123',
  email: 'shop@kicks-shoes.com',
  role: 'shop',
};
```

#### Mock Tokens

```javascript
// Mock valid JWT tokens (fake strings for testing)
const mockAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImN1c3RvbWVyMTIzIiwiaWF0IjoxNjE2MjM5MDIyfQ.mockSignature';
const mockRefreshToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImN1c3RvbWVyMTIzIiwiaWF0IjoxNjE2MjM5MDIyfQ.mockRefreshSignature';

// Mock decoded token payload
const mockDecodedToken = {
  id: 'customer123',
  iat: 1616239022,
  exp: 1616325422, // 1 day later
};

// Mock expired decoded token
const mockExpiredDecodedToken = {
  id: 'customer123',
  iat: 1616239022,
  exp: 1616239022, // Already expired
};
```

#### Mock Request/Response Objects

```javascript
// Mock Express request object
const mockReq = {
  body: {},
  params: {},
  query: {},
  headers: {
    authorization: 'Bearer mockAccessToken',
  },
  user: mockCustomerUser, // Set by protect middleware
  file: null,
  files: null,
};

// Mock Express response object
const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  redirect: jest.fn(),
};

// Mock next function
const mockNext = jest.fn();
```

#### Mock OTP Store

```javascript
// Mock OTP store (Map)
const mockOtpStore = new Map();
mockOtpStore.set('user@test.com', {
  otp: '123456',
  expiresAt: Date.now() + 300000, // 5 minutes
});
```

---

## 8. Suggested Next Prompts

### 8.1 Detailed Test Case Generation

```
Generate comprehensive Jest unit tests for the following auth module:
- Module: `utils/jwt.js`
- Coverage goal: ≥90%
- Include tests for:
  1. generateToken with valid payload
  2. generateToken with missing JWT_SECRET
  3. verifyToken with valid token
  4. verifyToken with expired token
  5. verifyToken with malformed token
  6. verifyToken with token from different secret
  7. generateRefreshToken and verifyRefreshToken
- Use proper mocking for jsonwebtoken and logger
- Output: Complete test file with setup, teardown, and all test cases
```

### 8.2 Integration Test Generation

```
Generate integration tests for the authentication flow using Jest and Supertest:
- Test scenarios:
  1. Register → Verify Email → Login → Access Protected Route (success path)
  2. Register with duplicate email (error case)
  3. Login with unverified account (error case)
  4. Login → Logout → Reuse token (should fail)
  5. Access /api/auth/me without token (401)
  6. Access /api/auth/me with expired token (401)
  7. Admin access /api/users (success)
  8. Customer access /api/users (403 forbidden)
- Use actual MongoDB test database
- Include setup/teardown for database
- Output: Complete integration test file
```

### 8.3 Security Test Cases

```
Generate security-focused test cases for authentication:
- Test scenarios:
  1. Brute-force attack simulation (100 failed login attempts)
  2. JWT token with tampered signature
  3. JWT token with extended expiration (manually modified)
  4. SQL injection in email field during login
  5. XSS payload in registration fields
  6. Password stored as plaintext (verify bcrypt hashing)
  7. Token reuse after logout (blacklist check)
  8. Role escalation attempt (customer trying to access admin route)
  9. Token from different environment (wrong JWT_SECRET)
  10. CSRF attack simulation
- Include security best practices validation
- Output: Security test suite
```

### 8.4 End-to-End Test Generation

```
Generate Playwright E2E tests for authentication flows:
- Test scenarios:
  1. User Registration Flow (UI form → email verification → login)
  2. User Login Flow (form submission → dashboard redirect)
  3. Forgot Password Flow (email → reset link → new password)
  4. Social Login (Google OAuth flow simulation)
  5. Protected Route Access (redirect to login if not authenticated)
  6. Logout Flow (button click → clear tokens → redirect to home)
- Include page objects for reusability
- Handle asynchronous email verification (mock or timeout)
- Output: Complete E2E test suite with Page Objects
```

### 8.5 Mock Generation Prompt

```
Generate comprehensive Jest mocks for authentication dependencies:
- Mock modules:
  1. `jsonwebtoken` (sign, verify with various scenarios)
  2. `bcryptjs` (genSalt, hash, compare)
  3. `User` Mongoose model (findOne, findById, create, findByIdAndUpdate)
  4. `TokenBlacklist` Mongoose model (findOne, create)
  5. `sendTemplatedEmail` utility
  6. `logger` utility
- Include mock data:
  - Vietnamese test users (verified, unverified, banned, admin)
  - Valid/expired/malformed tokens
  - Request/response objects
- Include helper functions:
  - `createMockUser(overrides)` - factory for test users
  - `createMockToken(payload, expiry)` - factory for tokens
  - `createMockReqRes(options)` - factory for req/res objects
- Output: Reusable mock utilities file (`__mocks__/auth-mocks.js`)
```

### 8.6 Test Coverage Report Prompt

```
Analyze test coverage for authentication module and generate improvement plan:
- Current coverage: [provide coverage report]
- Identify:
  1. Uncovered lines and branches
  2. Missing edge cases
  3. Untested error paths
  4. Integration test gaps
- Prioritize test cases by:
  - Security risk
  - Business impact
  - Code complexity
- Output: Test improvement roadmap with specific test cases to add
```

---

## Appendix: Additional Resources

### A. Environment Variables Required for Testing

```env
# JWT Secrets
JWT_SECRET=testSecretKeyForTesting
JWT_REFRESH_SECRET=testRefreshSecretKeyForTesting

# Token Expiration
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
JWT_VERIFY_EXPIRES_IN=1h
JWT_RESET_EXPIRES_IN=1h

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Database (Test DB)
MONGO_TEST_URI=mongodb://localhost:27017/kicks-shoes-test

# Email Service (Mock in tests)
EMAIL_SERVICE_API_KEY=test-api-key
```

### B. Common Test Utilities

```javascript
// Test helper to create mock req/res/next
export const createMockReqResNext = (options = {}) => {
  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    file: null,
    files: null,
    ...options.req,
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    redirect: jest.fn(),
    ...options.res,
  };

  const next = jest.fn();

  return { req, res, next };
};

// Test helper to create mock user
export const createMockUser = (overrides = {}) => ({
  _id: 'user123',
  fullName: 'Test User',
  username: 'testuser',
  email: 'test@test.com',
  password: 'hashedPassword',
  phone: '0987654321',
  address: '123 Test St',
  role: 'customer',
  isVerified: true,
  status: true,
  avatar: 'https://example.com/avatar.jpg',
  reward_point: 0,
  gender: 'other',
  matchPassword: jest.fn().mockResolvedValue(true),
  save: jest.fn().mockResolvedThis(),
  ...overrides,
});

// Test helper to verify ErrorResponse
export const expectErrorResponse = (mockNext, statusCode, message) => {
  expect(mockNext).toHaveBeenCalled();
  const errorArg = mockNext.mock.calls[0][0];
  expect(errorArg).toBeInstanceOf(ErrorResponse);
  expect(errorArg.statusCode).toBe(statusCode);
  expect(errorArg.message).toContain(message);
};
```

### C. Test Organization Recommendation

```
backend/tests/
├── unit/
│   ├── utils/
│   │   └── jwt.test.js
│   ├── middlewares/
│   │   ├── auth.middleware.test.js
│   │   └── role.middleware.test.js
│   ├── models/
│   │   └── User.test.js
│   └── controllers/
│       └── authController.test.js
├── integration/
│   ├── auth-routes.integration.test.js
│   └── user-routes-role-check.integration.test.js
├── security/
│   └── auth-security.test.js
├── __mocks__/
│   ├── auth-mocks.js
│   ├── jsonwebtoken.js
│   └── bcryptjs.js
└── __helpers__/
    └── test-utils.js
```

---

**END OF DOCUMENT**

_Generated: 2025-10-27 | Feature: Authentication & Authorization | Version: 1.0_
