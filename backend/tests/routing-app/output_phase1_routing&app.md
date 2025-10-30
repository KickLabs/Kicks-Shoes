# Routing & App - Feature Analysis & Test Planning

## 1. Feature Overview

### Business Purpose

The **Routing & App** module serves as the backbone of the Kicks Shoes backend application. It establishes the Express.js server infrastructure, configures critical middleware, registers all API routes, manages error handling, and provides application initialization logic including database connection, Socket.IO setup, and cron job scheduling.

### Key System Flows

1. **Application Initialization**: Load env vars → Connect DB → Setup directories → Initialize Express → Configure middleware
2. **Request Processing**: Incoming request → CORS check → Request parsing → Route matching → Controller execution → Response/Error handling
3. **Route Registration**: 24 feature routes registered under `/api/*` prefixes
4. **Error Handling**: Centralized error middleware catching all errors and providing consistent responses
5. **Health Monitoring**: `/api/health` endpoint for deployment monitoring and uptime tracking

### Main Business Rules & Success Criteria

- ✅ **Middleware Order**: CORS → Body parsers → Logging → Routes → Error handler
- ✅ **CORS Policy**: Only allow whitelisted origins (localhost dev + production Firebase domains)
- ✅ **Request Limits**: JSON/URL-encoded body max 10MB
- ✅ **Error Handling**: All errors caught, logged, and returned with appropriate HTTP status codes
- ✅ **Route Availability**: All 24 feature routes must be accessible and properly mounted
- ✅ **Health Check**: System health endpoint must return uptime and environment info
- ✅ **404 Handling**: Unmapped routes fall through to error handler

### Why This Feature Is Critical for Testing

- **Single Point of Failure**: App initialization issues break the entire system
- **Security Gateway**: CORS and authentication middleware are the first line of defense
- **Integration Hub**: All features depend on proper route registration
- **Error Recovery**: Error handling affects user experience across all features
- **Performance**: Middleware order impacts every request's latency
- **Deployment**: Health checks ensure proper deployment and monitoring

---

## 2. UI/UX Flow Mapping

**N/A** - This is a backend infrastructure module with no direct UI. However, it affects all API interactions:

| Step | Client Action             | System Behavior                     | Error Handling            |
| ---- | ------------------------- | ----------------------------------- | ------------------------- |
| 1    | Client sends HTTP request | CORS preflight check (OPTIONS)      | 403 if origin not allowed |
| 2    | Request passes CORS       | Parse JSON body (max 10MB)          | 413 if body too large     |
| 3    | Route matching            | Match against registered routes     | 404 if no route found     |
| 4    | Controller execution      | Execute business logic              | 500 if unhandled error    |
| 5    | Response sent             | Return JSON with appropriate status | Error logged to Winston   |

---

## 3. Related Files, Components & Modules

### Core Application Files

| File/Path                              | Layer          | Responsibility                                                | Key Methods/Props/States                                              |
| -------------------------------------- | -------------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/app.js`                           | **App Entry**  | Main Express app setup, middleware config, route registration | `app`, `server`, `io`, `PORT`, `HOST`                                 |
| `startup.js`                           | **Process**    | Azure App Service startup wrapper                             | `spawn()`, process signal handlers                                    |
| `src/config/database.js`               | **Config**     | MongoDB connection setup                                      | `connectDB()`                                                         |
| `src/config/cors.config.js`            | **Middleware** | CORS policy configuration                                     | `corsMiddleware`, `corsOptions`                                       |
| `src/middlewares/error.middleware.js`  | **Middleware** | Centralized error handling                                    | `errorHandler()`, `ErrorResponse` class                               |
| `src/middlewares/auth.middleware.js`   | **Middleware** | JWT authentication                                            | `protect()`, `optionalAuth()`                                         |
| `src/middlewares/role.middleware.js`   | **Middleware** | Role-based access control                                     | `requireCustomer()`, `requireShop()`, `requireAdmin()`                |
| `src/middlewares/upload.middleware.js` | **Middleware** | File upload handling (Multer)                                 | `upload.single()`, `upload.fields()`                                  |
| `src/utils/logger.js`                  | **Util**       | Winston logging configuration                                 | `logger.info()`, `logger.error()`                                     |
| `src/utils/setupUploads.js`            | **Util**       | Create upload directories                                     | `setupUploadDirectories()`                                            |
| `src/utils/cronJobs.js`                | **Util**       | Background job scheduling                                     | `startDiscountStatusUpdateCron()`, `startFlashSaleStatusUpdateCron()` |
| `src/socket.js`                        | **Websocket**  | Socket.IO handler setup                                       | `setupSocketHandlers(io)`                                             |

### Route Files (24 Total)

| Route File                | Base Path                   | Primary Endpoints                                      | Auth Required |
| ------------------------- | --------------------------- | ------------------------------------------------------ | ------------- |
| `authRoutes.js`           | `/api/auth`                 | register, login, logout, verify-email, forgot-password | Mixed         |
| `userRoutes.js`           | `/api/users`                | GET/PUT/DELETE users, admin operations                 | Yes           |
| `productRoutes.js`        | `/api/products`             | CRUD products, search, filter                          | Mixed         |
| `orderRoutes.js`          | `/api/orders`               | Create/view/update orders                              | Yes           |
| `cartRoutes.js`           | `/api/cart`                 | Add/remove/update cart items                           | Yes           |
| `categoryRoutes.js`       | `/api/categories`           | CRUD categories                                        | Mixed         |
| `discountRoutes.js`       | `/api/discounts`            | Manage discount codes                                  | Mixed         |
| `dashboardRoutes.js`      | `/api/dashboard`            | Analytics and reports                                  | Admin         |
| `emailRoutes.js`          | `/api/email`                | Send emails (OTP, verification)                        | Public        |
| `feedbackRoutes.js`       | `/api/feedback`             | Product reviews and ratings                            | Yes           |
| `favouriteRoutes.js`      | `/api/favourites`           | Wishlist management                                    | Yes           |
| `rewardPointRoutes.js`    | `/api/reward-points`        | Loyalty points system                                  | Yes           |
| `storeRoutes.js`          | `/api/stores` (`/api/shop`) | Store/shop management                                  | Mixed         |
| `uploadRoutes.js`         | `/api/*`                    | File uploads (images, etc.)                            | Yes           |
| `vnpayRoutes.js`          | `/api/payment/vnpay`        | VNPay payment integration                              | Mixed         |
| `payosRoutes.js`          | `/api/payos`                | PayOS payment integration                              | Mixed         |
| `chatRoutes.js`           | `/api/chat`                 | Chat messaging                                         | Yes           |
| `livestreamRoutes.js`     | `/api/livestreams`          | Livestream features                                    | Mixed         |
| `tryonRoutes.js`          | `/api/tryon`                | Virtual try-on AI                                      | Public        |
| `blogRoutes.js`           | `/api/blogs`                | Blog posts CRUD                                        | Mixed         |
| `blogCommentRoutes.js`    | `/api/blog-comments`        | Blog comments                                          | Yes           |
| `potentialOrderRoutes.js` | `/api/potential-orders`     | Livestream potential orders                            | Mixed         |
| `flashSaleRoutes.js`      | `/api/flash-sales`          | Flash sale management                                  | Mixed         |
| `aiRoutes.js`             | `/api/ai`                   | AI proxy endpoints                                     | Public        |

---

## 4. Core Functions / Methods to Test

### 4.1 Application Initialization (`app.js`)

#### **Function: App Setup & Middleware Configuration**

- **Purpose:** Initialize Express app with all required middleware in correct order
- **Inputs + Types:** Environment variables (`process.env`)
- **Outputs / Return:** Configured Express `app` object
- **State Change / Side Effects:**
  - Database connection established
  - Upload directories created
  - Cron jobs started (non-test env)
  - Socket.IO server initialized
- **Edge Cases:**
  - Missing environment variables (DB connection fails)
  - Upload directory creation fails (permission issues)
  - Port already in use
  - Database connection timeout
- **Dependencies (mock needed?):**
  - ✅ `connectDB()` - Mock mongoose connection
  - ✅ `setupUploadDirectories()` - Mock fs operations
  - ✅ `startDiscountStatusUpdateCron()` - Mock or disable in tests
  - ✅ `setupSocketHandlers()` - Mock Socket.IO

#### **Function: Route Registration**

- **Purpose:** Mount all feature routes under `/api/*` prefixes
- **Inputs + Types:** Route handler modules (Express Router)
- **Outputs / Return:** Express app with registered routes
- **State Change / Side Effects:** Routes become accessible via HTTP
- **Edge Cases:**
  - Duplicate route paths (last one wins)
  - Route handler throws during import
  - Missing route module
- **Dependencies (mock needed?):**
  - ✅ Each route module import - Can test with supertest

#### **Function: CORS Handling (Primary + Fallback)**

- **Purpose:** Allow cross-origin requests from whitelisted origins only
- **Inputs + Types:**
  - `req.headers.origin` (string)
  - `req.method` (string)
- **Outputs / Return:**
  - 200 OK for valid OPTIONS preflight
  - Headers: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, etc.
  - 403 for blocked origins
- **State Change / Side Effects:** Sets CORS headers on response
- **Edge Cases:**
  - No origin header (mobile apps, curl)
  - Non-whitelisted origin
  - OPTIONS preflight request
  - Wildcard `*` not used (explicit origins only)
- **Dependencies (mock needed?):**
  - ✅ `cors` npm package - Test with real package

### 4.2 Error Handling (`error.middleware.js`)

#### **Function: `errorHandler(err, req, res, next)`**

- **Purpose:** Catch all errors and return consistent JSON error responses
- **Inputs + Types:**
  - `err` (Error object or custom ErrorResponse)
  - `req` (Express request)
  - `res` (Express response)
  - `next` (Express next function)
- **Outputs / Return:** JSON response with `{ success: false, error: string }`
- **State Change / Side Effects:**
  - Logs error details to Winston logger
  - Sets appropriate HTTP status code
- **Edge Cases:**
  - Mongoose CastError (invalid ObjectId) → 404
  - Mongoose duplicate key (code 11000) → 400
  - Mongoose ValidationError → 400
  - JsonWebTokenError → 401
  - TokenExpiredError → 401
  - Generic Error → 500
  - Error without message → "Server Error"
- **Dependencies (mock needed?):**
  - ✅ `logger.error()` - Mock Winston logger

#### **Class: `ErrorResponse extends Error`**

- **Purpose:** Custom error class with status code
- **Inputs + Types:**
  - `message` (string)
  - `statusCode` (number)
- **Outputs / Return:** Error object with statusCode property
- **State Change / Side Effects:** None
- **Edge Cases:** None
- **Dependencies:** None

### 4.3 Health Check Endpoint

#### **Function: `GET /api/health`**

- **Purpose:** Provide system health status for monitoring tools
- **Inputs + Types:** None
- **Outputs / Return:**

```json
{
  "status": "healthy",
  "timestamp": "ISO string",
  "uptime": "number (seconds)",
  "environment": "development|production|test",
  "version": "string"
}
```

- **State Change / Side Effects:** None (read-only)
- **Edge Cases:**
  - Environment variable missing (falls back to 'development')
  - Version not available (falls back to '1.0.0')
- **Dependencies:** None

### 4.4 404 Handling

#### **Function: Unmatched Route Handler**

- **Purpose:** Catch requests to non-existent endpoints
- **Inputs + Types:** Any unmatched HTTP request
- **Outputs / Return:** 500 or 404 response (falls through to error handler)
- **State Change / Side Effects:** Error logged
- **Edge Cases:**
  - `/api/nonexistent`
  - `/random/path`
  - Root `/` returns welcome message (not 404)
- **Dependencies:** Error middleware

---

## 5. Test Case Matrix

### Category: Application Initialization

| Category  | Scenario                        | Pre-condition                 | Input             | Expected Output/Behavior                                                |
| --------- | ------------------------------- | ----------------------------- | ----------------- | ----------------------------------------------------------------------- |
| **Happy** | App starts successfully         | Valid env vars, DB accessible | `node src/app.js` | Server listens on PORT, logs "Server is running", all routes registered |
| **Happy** | Health check responds           | Server running                | `GET /api/health` | 200 OK with uptime, env, version                                        |
| **Happy** | Root endpoint responds          | Server running                | `GET /`           | 200 OK `{ message: "Welcome to Kicks Shoes API" }`                      |
| **Edge**  | Missing DB connection string    | No `MONGODB_URI`              | Start app         | DB connection fails, app may crash or log error                         |
| **Edge**  | Port already in use             | Another process on PORT       | Start app         | Error logged: "Port in use" or starts on alternate port                 |
| **Edge**  | Upload directory creation fails | No write permissions          | Start app         | Error logged, app may continue or fail                                  |
| **Error** | Invalid environment             | Corrupted `.env` file         | Start app         | Parsing errors, missing variables                                       |

### Category: CORS Handling

| Category  | Scenario                                    | Pre-condition  | Input                                      | Expected Output/Behavior                                 |
| --------- | ------------------------------------------- | -------------- | ------------------------------------------ | -------------------------------------------------------- |
| **Happy** | Request from whitelisted origin (localhost) | Server running | Origin: `http://localhost:5173`            | Headers set, request proceeds                            |
| **Happy** | Request from production domain              | Server running | Origin: `https://kicks-shoes-2025.web.app` | Headers set, request proceeds                            |
| **Happy** | OPTIONS preflight from valid origin         | Server running | `OPTIONS /api/products`, Origin: localhost | 200 OK, CORS headers, `Access-Control-Max-Age: 86400`    |
| **Edge**  | Request with no origin header               | Server running | No `Origin` header (curl, mobile)          | Request proceeds (CORS callback allows)                  |
| **Edge**  | Request from non-whitelisted origin         | Server running | Origin: `https://evil.com`                 | Socket.IO blocked, HTTP may proceed with no CORS headers |
| **Error** | CORS preflight fails                        | Server running | `OPTIONS` from `https://evil.com`          | No `Access-Control-Allow-Origin` header returned         |

### Category: Route Registration & Routing

| Category  | Scenario                                | Pre-condition        | Input                                   | Expected Output/Behavior                    |
| --------- | --------------------------------------- | -------------------- | --------------------------------------- | ------------------------------------------- |
| **Happy** | Access auth route                       | Server running       | `POST /api/auth/login` with credentials | 200 OK with token or 401 Unauthorized       |
| **Happy** | Access product route                    | Server running       | `GET /api/products`                     | 200 OK with product list                    |
| **Happy** | Access protected route with valid token | User authenticated   | `GET /api/auth/me` + Bearer token       | 200 OK with user data                       |
| **Happy** | All 24 routes are accessible            | Server running       | Test each `/api/*` base path            | Each returns appropriate response (not 404) |
| **Edge**  | Route not found                         | Server running       | `GET /api/nonexistent`                  | 404 or error handler response               |
| **Edge**  | Duplicate route registration            | Two routes same path | Last registered route wins              | Last handler is called                      |
| **Error** | Route handler throws error              | Server running       | Route that throws error                 | 500 Internal Server Error, error logged     |

### Category: Middleware Order & Execution

| Category  | Scenario                     | Pre-condition  | Input                               | Expected Output/Behavior              |
| --------- | ---------------------------- | -------------- | ----------------------------------- | ------------------------------------- |
| **Happy** | JSON body parsed correctly   | Server running | `POST /api/*` with JSON body        | `req.body` populated                  |
| **Happy** | URL-encoded body parsed      | Server running | `POST /api/*` with URL-encoded body | `req.body` populated                  |
| **Happy** | Request logging works        | Server running | Any request                         | Console logs request details          |
| **Edge**  | JSON body exceeds 10MB limit | Server running | `POST` with >10MB JSON              | 413 Payload Too Large                 |
| **Edge**  | Invalid JSON body            | Server running | `POST` with malformed JSON          | 400 Bad Request                       |
| **Edge**  | Missing Content-Type header  | Server running | `POST` without `Content-Type`       | Body not parsed, `req.body` undefined |
| **Error** | Middleware throws error      | Server running | Request triggers middleware error   | Caught by error handler, 500 response |

### Category: Error Handling

| Category  | Scenario                              | Pre-condition  | Input                                          | Expected Output/Behavior                                         |
| --------- | ------------------------------------- | -------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| **Happy** | Generic error caught                  | Server running | Route throws `Error("Test")`                   | 500 `{ success: false, error: "Test" }`                          |
| **Happy** | ErrorResponse with custom status      | Server running | Route throws `ErrorResponse("Forbidden", 403)` | 403 `{ success: false, error: "Forbidden" }`                     |
| **Edge**  | Mongoose CastError (invalid ObjectId) | Server running | `GET /api/products/invalid-id`                 | 404 `{ success: false, error: "Resource not found" }`            |
| **Edge**  | Mongoose duplicate key error          | Server running | Create duplicate unique field                  | 400 `{ success: false, error: "Duplicate field value entered" }` |
| **Edge**  | Mongoose ValidationError              | Server running | Missing required field                         | 400 with validation messages                                     |
| **Edge**  | JWT token invalid                     | Server running | Protected route with invalid token             | 401 `{ success: false, error: "Invalid token" }`                 |
| **Edge**  | JWT token expired                     | Server running | Protected route with expired token             | 401 `{ success: false, error: "Token expired" }`                 |
| **Error** | Error without message                 | Server running | Route throws `new Error()`                     | 500 `{ success: false, error: "Server Error" }`                  |

### Category: Socket.IO Integration

| Category  | Scenario                              | Pre-condition  | Input                          | Expected Output/Behavior               |
| --------- | ------------------------------------- | -------------- | ------------------------------ | -------------------------------------- |
| **Happy** | Socket.IO server initialized          | Server running | Connect to socket              | Connection established                 |
| **Happy** | Socket connection from valid origin   | Server running | Connect with Origin: localhost | Connection accepted                    |
| **Edge**  | Socket connection from invalid origin | Server running | Connect with Origin: evil.com  | Connection rejected, CORS error logged |
| **Error** | Socket handler setup fails            | Server running | `setupSocketHandlers` throws   | Error logged, app may crash            |

### Category: Cron Jobs

| Category  | Scenario                       | Pre-condition         | Input                | Expected Output/Behavior            |
| --------- | ------------------------------ | --------------------- | -------------------- | ----------------------------------- |
| **Happy** | Cron jobs start in production  | `NODE_ENV=production` | Start app            | Discount & Flash Sale crons running |
| **Edge**  | Cron jobs disabled in test env | `NODE_ENV=test`       | Start app            | No cron jobs started                |
| **Error** | Cron job throws error          | Server running        | Cron execution fails | Error logged, app continues         |

---

## 6. Test Priority Recommendation

### **HIGH Priority** 🔴

| Module/Function         | Justification                                                       |
| ----------------------- | ------------------------------------------------------------------- |
| **App Initialization**  | Single point of failure - if app doesn't start, nothing works       |
| **Route Registration**  | Core functionality - all features depend on routes being registered |
| **CORS Middleware**     | Security - protects against unauthorized origins                    |
| **Error Handler**       | User experience - all errors flow through here                      |
| **Auth Middleware**     | Security - protects all authenticated routes                        |
| **Database Connection** | Data access - no DB = no functionality                              |

### **MEDIUM Priority** 🟡

| Module/Function           | Justification                                                 |
| ------------------------- | ------------------------------------------------------------- |
| **Body Parser Limits**    | Performance & security - prevents abuse                       |
| **Health Check Endpoint** | Operations - needed for monitoring but not core functionality |
| **Socket.IO Setup**       | Real-time features - important but not all features use it    |
| **Request Logging**       | Debugging - helpful but not user-facing                       |
| **Static File Serving**   | `/uploads` - needed for images but has fallbacks              |
| **Cron Job Scheduling**   | Background tasks - failure doesn't immediately impact users   |

### **LOW Priority** 🟢

| Module/Function             | Justification                                                        |
| --------------------------- | -------------------------------------------------------------------- |
| **Debug Endpoints**         | `/api/tryon/debug` - only for development                            |
| **Welcome Message**         | Root `/` - minimal impact                                            |
| **Helmet Security Headers** | Defense in depth - important but application still functions without |
| **Compression Middleware**  | Performance optimization - not core functionality                    |
| **Morgan Logging**          | Development convenience - not critical                               |

---

## 7. Mocking & Test Data Preparation

### Mocking Strategy for Integration Tests

| Dependency             | What to Mock                      | Mocking Strategy                                 | Sample Mock Data                                       |
| ---------------------- | --------------------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| **MongoDB Connection** | `connectDB()`                     | Mock mongoose `connect()` to resolve immediately | `mongoose.connect = jest.fn().mockResolvedValue(true)` |
| **Logger**             | `logger.info()`, `logger.error()` | Mock Winston logger methods to silent logging    | `logger.info = jest.fn()`                              |
| **Socket.IO**          | `setupSocketHandlers()`           | Mock to prevent actual websocket setup           | `setupSocketHandlers = jest.fn()`                      |
| **Cron Jobs**          | `startDiscountStatusUpdateCron()` | Mock to prevent background jobs in tests         | `jest.fn()` or set `NODE_ENV=test`                     |
| **File System**        | `setupUploadDirectories()`        | Mock `fs.mkdir` operations                       | `fs.mkdir = jest.fn().mockResolvedValue()`             |
| **External SDKs**      | PayOS, VNPay                      | Mock payment gateway calls                       | See payment test mocks                                 |
| **Email Service**      | `sendEmail()`                     | Mock nodemailer transport                        | `transporter.sendMail = jest.fn()`                     |

### Sample Test Data Factories

```javascript
// factories/app.factory.js
export const createMockRequest = (overrides = {}) => ({
  method: 'GET',
  path: '/',
  headers: {
    origin: 'http://localhost:5173',
    'content-type': 'application/json',
  },
  body: {},
  params: {},
  query: {},
  ...overrides,
});

export const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res;
};

export const createMockNext = () => jest.fn();

// Test environment setup
export const setupTestEnv = () => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001'; // Different port for tests
  process.env.MONGODB_URI = 'mongodb://localhost:27017/kicks-shoes-test';
  process.env.JWT_SECRET = 'test-secret-key';
};

// Common mock implementations
export const mockDependencies = () => ({
  mongoose: {
    connect: jest.fn().mockResolvedValue(true),
    connection: { readyState: 1 },
  },
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  socketIO: jest.fn().mockReturnValue({
    on: jest.fn(),
    emit: jest.fn(),
  }),
});
```

### Sample Mock Data for Routes

```javascript
// Mock route responses
export const mockRouteResponses = {
  health: {
    status: 'healthy',
    timestamp: '2025-10-30T00:00:00.000Z',
    uptime: 3600,
    environment: 'test',
    version: '1.0.0',
  },
  welcome: {
    message: 'Welcome to Kicks Shoes API',
  },
  notFound: {
    success: false,
    error: 'Route not found',
  },
};

// Mock error scenarios
export const mockErrors = {
  mongooseCast: {
    name: 'CastError',
    message: 'Cast to ObjectId failed',
  },
  mongooseDuplicate: {
    code: 11000,
    keyPattern: { email: 1 },
  },
  mongooseValidation: {
    name: 'ValidationError',
    errors: {
      email: { message: 'Email is required' },
      password: { message: 'Password must be at least 6 characters' },
    },
  },
  jwtInvalid: {
    name: 'JsonWebTokenError',
    message: 'invalid signature',
  },
  jwtExpired: {
    name: 'TokenExpiredError',
    message: 'jwt expired',
  },
};
```

---

## 8. Suggested Next Prompts

### 🔹 Prompt 1: Generate Detailed Test Cases

```
Based on the test case matrix in the Routing & App analysis, generate detailed test specifications for:
1. Application initialization tests (startup, middleware order, route registration)
2. CORS handling tests (preflight, origin validation, headers)
3. Error handling tests (all error types: Mongoose, JWT, custom errors)
4. Route accessibility tests (all 24 routes)

Include:
- Test description
- Setup/teardown steps
- Assertions
- Expected behavior
```

### 🔹 Prompt 2: Generate Unit Test Code (Jest + Supertest)

```
Generate Jest unit tests for the Routing & App module:

1. **app.test.js**: Test Express app initialization
   - Middleware registration order
   - Route mounting
   - CORS configuration
   - Health check endpoint

2. **error.middleware.test.js**: Test error handler
   - Mongoose errors (CastError, ValidationError, duplicate key)
   - JWT errors (invalid token, expired token)
   - Custom ErrorResponse class
   - Generic error handling

3. **routes.integration.test.js**: Test route accessibility
   - All 24 routes return appropriate responses (not 404)
   - Protected routes require authentication
   - Public routes are accessible

Use supertest for HTTP testing and mock all external dependencies (DB, logger, Socket.IO).
```

### 🔹 Prompt 3: Generate Integration Tests

```
Create integration tests for the complete request lifecycle:

1. **cors.integration.test.js**:
   - Test CORS with different origins (allowed, blocked, no origin)
   - Test preflight OPTIONS requests
   - Verify CORS headers in responses

2. **middleware-order.integration.test.js**:
   - Test body parsing (JSON, URL-encoded, large payloads)
   - Test authentication flow through middleware
   - Test error propagation through middleware chain

3. **health-monitoring.integration.test.js**:
   - Test health check endpoint under load
   - Test health check during DB connection issues
   - Test uptime accuracy
```

### 🔹 Prompt 4: Generate E2E Flow Tests

```
Create end-to-end tests for complete user flows:

1. **auth-flow.e2e.test.js**: Register → Verify Email → Login → Access Protected Route
2. **shopping-flow.e2e.test.js**: Browse Products → Add to Cart → Checkout → Payment
3. **error-recovery.e2e.test.js**: Test error scenarios and recovery
   - Invalid credentials
   - Expired token refresh
   - Network failures

Test from external client perspective using real HTTP requests.
```

### 🔹 Prompt 5: Generate Load & Performance Tests

```
Create performance tests for app initialization and routing:

1. Test concurrent request handling (100+ simultaneous requests)
2. Test route resolution performance (measure p95, p99 latency)
3. Test memory usage during sustained load
4. Test middleware overhead
5. Test error handler performance

Use tools like Artillery or k6 for load testing.
```

### 🔹 Prompt 6: Generate Mocking Utilities & Test Helpers

```
Create comprehensive test utilities for the Routing & App module:

1. **mocks/app.mocks.js**: Mock Express app, req, res, next
2. **mocks/database.mocks.js**: Mock mongoose connection
3. **mocks/logger.mocks.js**: Mock Winston logger
4. **helpers/test-server.js**: Helper to start/stop test server
5. **factories/request.factory.js**: Factory to generate test requests
6. **fixtures/routes.fixtures.js**: Sample data for all routes

Include TypeScript types if applicable.
```

### 🔹 Prompt 7: Generate Security Tests

```
Create security-focused tests for the app infrastructure:

1. Test CORS security (origin validation, credential handling)
2. Test request size limits (DoS prevention)
3. Test error information leakage (don't expose stack traces in production)
4. Test Helmet security headers
5. Test authentication bypass attempts
6. Test route injection attacks

Focus on OWASP Top 10 vulnerabilities.
```

---

## 9. Additional Testing Considerations

### Testing Environment Setup

```javascript
// tests/setup.js
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Disable cron jobs
  jest.mock('../src/utils/cronJobs.js');

  // Mock database
  jest.mock('../src/config/database.js');

  // Silence logger
  jest.mock('../src/utils/logger.js');

  // Start test server
  const app = require('../src/app.js').default;
  global.testApp = app;
});

afterAll(async () => {
  // Cleanup
  await global.testServer?.close();
});
```

### Test Coverage Goals

- **Statements**: ≥ 85%
- **Branches**: ≥ 85%
- **Functions**: ≥ 85%
- **Lines**: ≥ 85%

### Critical Paths to Test

1. ✅ App starts successfully with all dependencies
2. ✅ All routes are accessible
3. ✅ CORS blocks unauthorized origins
4. ✅ Error handler catches all error types
5. ✅ Middleware executes in correct order
6. ✅ Health check returns accurate status

---

**End of Routing & App Feature Analysis**

_Generated: 2025-10-30_  
_Project: Kicks Shoes Backend_  
_Version: 1.0.0_
