# test-cases-matrix-routing-&-app.md

## Test Cases Matrix: Routing & App Module

**Feature**: Routing & App Infrastructure  
**Module**: `src/app.js`, `src/routes/*`, Middleware Configuration  
**Total Test Cases**: 52  
**Coverage Target**: ≥85% for statements, branches, functions, lines

---

## Table Format

| Test ID | Category | Test Scenario | Pre-conditions | Test Steps | Test Data | Expected Result | Priority | Dependencies |

---

## 1. Application Initialization Tests

| Test ID | Category       | Test Scenario                                 | Pre-conditions                                     | Test Steps                                                                                            | Test Data                                                                         | Expected Result                                                                                     | Priority | Dependencies                                                         |
| ------- | -------------- | --------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------- |
| RAP-001 | Integration    | App starts successfully with all dependencies | Valid env vars, MongoDB accessible, Port available | 1. Set NODE_ENV=test<br>2. Mock connectDB()<br>3. Import app.js<br>4. Verify server starts            | `PORT=3001`<br>`MONGODB_URI=mongodb://localhost/test`<br>`JWT_SECRET=test-secret` | Server listens on PORT, connectDB called, all routes registered, logger outputs "Server is running" | HIGH     | Mock: connectDB, setupUploadDirectories, setupSocketHandlers, logger |
| RAP-002 | Error Handling | App fails gracefully when DB connection fails | Invalid MONGODB_URI                                | 1. Set invalid DB URI<br>2. Mock connectDB to throw error<br>3. Start app<br>4. Verify error handling | `MONGODB_URI=invalid-uri`                                                         | connectDB throws error, logger.error called, app handles gracefully                                 | HIGH     | Mock: connectDB, logger                                              |
| RAP-003 | Edge Case      | App handles missing environment variables     | Missing required env vars                          | 1. Delete JWT_SECRET<br>2. Start app<br>3. Check behavior                                             | No JWT_SECRET env var                                                             | App may log warning or fail at first auth attempt (depends on implementation)                       | MEDIUM   | Mock: logger                                                         |
| RAP-004 | Edge Case      | App handles PORT already in use               | Another process using same PORT                    | 1. Start server on PORT 3001<br>2. Try starting another instance<br>3. Verify error                   | `PORT=3001` (already used)                                                        | Error: "EADDRINUSE", logger.error called                                                            | MEDIUM   | Mock: server.listen                                                  |
| RAP-005 | Integration    | Upload directories created on startup         | No existing upload directories                     | 1. Delete uploads/ folder<br>2. Start app<br>3. Verify setupUploadDirectories called                  | N/A                                                                               | `uploads/avatars/`, `uploads/products/` directories created                                         | MEDIUM   | Mock: fs.mkdir, setupUploadDirectories                               |
| RAP-006 | Integration    | Cron jobs start in production environment     | NODE_ENV=production                                | 1. Set NODE_ENV=production<br>2. Start app<br>3. Verify cron jobs started                             | `NODE_ENV=production`                                                             | `startDiscountStatusUpdateCron()` and `startFlashSaleStatusUpdateCron()` called                     | MEDIUM   | Mock: cron job functions                                             |
| RAP-007 | Integration    | Cron jobs disabled in test environment        | NODE_ENV=test                                      | 1. Set NODE_ENV=test<br>2. Start app<br>3. Verify cron jobs NOT started                               | `NODE_ENV=test`                                                                   | Cron functions NOT called, no background jobs running                                               | HIGH     | Mock: cron job functions                                             |

---

## 2. CORS Handling Tests

| Test ID | Category    | Test Scenario                                     | Pre-conditions | Test Steps                                                                                | Test Data                                                                                                                  | Expected Result                                                                                                  | Priority | Dependencies    |
| ------- | ----------- | ------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------- | --------------- |
| RAP-008 | Security    | Request from whitelisted localhost origin allowed | Server running | 1. Send GET request with Origin header<br>2. Check response headers                       | `Origin: http://localhost:5173`                                                                                            | Response includes `Access-Control-Allow-Origin: http://localhost:5173`, `Access-Control-Allow-Credentials: true` | HIGH     | None            |
| RAP-009 | Security    | Request from production Firebase domain allowed   | Server running | 1. Send GET request with Origin header<br>2. Check response headers                       | `Origin: https://kicks-shoes-2025.web.app`                                                                                 | Response includes `Access-Control-Allow-Origin` with exact origin, credentials=true                              | HIGH     | None            |
| RAP-010 | Security    | Request from non-whitelisted origin blocked       | Server running | 1. Send GET request with unauthorized origin<br>2. Check response headers                 | `Origin: https://evil.com`                                                                                                 | No `Access-Control-Allow-Origin` header in response OR origin not echoed back                                    | HIGH     | None            |
| RAP-011 | Integration | OPTIONS preflight request from valid origin       | Server running | 1. Send OPTIONS request to /api/products<br>2. Include Origin header<br>3. Check response | `Origin: http://localhost:5173`<br>`Access-Control-Request-Method: POST`<br>`Access-Control-Request-Headers: Content-Type` | 200 OK, CORS headers set, `Access-Control-Max-Age: 86400`                                                        | HIGH     | None            |
| RAP-012 | Edge Case   | Request with no Origin header (mobile/curl)       | Server running | 1. Send GET request without Origin header<br>2. Verify request proceeds                   | No Origin header                                                                                                           | Request processed normally, no CORS errors                                                                       | MEDIUM   | None            |
| RAP-013 | Edge Case   | CORS preflight with multiple headers              | Server running | 1. Send OPTIONS with multiple headers<br>2. Check response allows all                     | `Access-Control-Request-Headers: Content-Type,Authorization,X-Requested-With`                                              | Response includes all requested headers in `Access-Control-Allow-Headers`                                        | MEDIUM   | None            |
| RAP-014 | Security    | CORS blocks Socket.IO from unauthorized origin    | Server running | 1. Attempt Socket.IO connection from evil.com<br>2. Check connection rejected             | Socket connection from `https://evil.com`                                                                                  | Connection rejected, error logged "Socket CORS blocked origin: https://evil.com"                                 | HIGH     | Mock: Socket.IO |
| RAP-015 | Integration | CORS allows all HTTP methods                      | Server running | 1. Send OPTIONS with different methods<br>2. Verify all allowed                           | Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS                                                                            | `Access-Control-Allow-Methods` includes all methods                                                              | MEDIUM   | None            |

---

## 3. Route Registration & Routing Tests

| Test ID | Category       | Test Scenario                                | Pre-conditions | Test Steps                                                                  | Test Data                                                                                                                                                                                                                                                                                                                                                                                                        | Expected Result                                                              | Priority | Dependencies                     |
| ------- | -------------- | -------------------------------------------- | -------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------- | -------------------------------- |
| RAP-016 | Integration    | All 24 routes are registered and accessible  | Server running | 1. Test each route base path<br>2. Verify not 404                           | `/api/auth`, `/api/users`, `/api/products`, `/api/orders`, `/api/cart`, `/api/categories`, `/api/discounts`, `/api/dashboard`, `/api/email`, `/api/feedback`, `/api/favourites`, `/api/reward-points`, `/api/stores`, `/api/shop`, `/api/payment/vnpay`, `/api/payos`, `/api/chat`, `/api/livestreams`, `/api/blogs`, `/api/blog-comments`, `/api/potential-orders`, `/api/tryon`, `/api/flash-sales`, `/api/ai` | Each route returns appropriate response (not 404)                            | HIGH     | Mock: DB, controllers            |
| RAP-017 | Functional     | Auth routes accessible and working           | Server running | 1. POST to /api/auth/login<br>2. Verify controller called                   | `{ email: "test@test.com", password: "123456" }`                                                                                                                                                                                                                                                                                                                                                                 | 200 OK or 401 (controller executed, not 404)                                 | HIGH     | Mock: User model, authController |
| RAP-018 | Functional     | Product routes accessible                    | Server running | 1. GET /api/products<br>2. Verify response                                  | N/A                                                                                                                                                                                                                                                                                                                                                                                                              | 200 OK with product list or empty array                                      | HIGH     | Mock: Product model              |
| RAP-019 | Functional     | Protected routes require authentication      | Server running | 1. GET /api/auth/me without token<br>2. Verify rejected                     | No Authorization header                                                                                                                                                                                                                                                                                                                                                                                          | 401 Unauthorized, error: "Not authorized"                                    | HIGH     | Mock: auth middleware            |
| RAP-020 | Error Handling | Non-existent route returns 404 or error      | Server running | 1. GET /api/nonexistent<br>2. Check response                                | `/api/nonexistent`                                                                                                                                                                                                                                                                                                                                                                                               | 404 Not Found OR error handler response                                      | MEDIUM   | Error middleware                 |
| RAP-021 | Functional     | Root route returns welcome message           | Server running | 1. GET /<br>2. Check response body                                          | `/`                                                                                                                                                                                                                                                                                                                                                                                                              | 200 OK, `{ message: "Welcome to Kicks Shoes API" }`                          | LOW      | None                             |
| RAP-022 | Functional     | Health check endpoint accessible             | Server running | 1. GET /api/health<br>2. Verify response                                    | N/A                                                                                                                                                                                                                                                                                                                                                                                                              | 200 OK with `{ status: "healthy", timestamp, uptime, environment, version }` | HIGH     | None                             |
| RAP-023 | Integration    | Multiple routes can be accessed concurrently | Server running | 1. Send 10 concurrent requests to different routes<br>2. Verify all succeed | Concurrent requests to /api/health, /api/products, /api/categories, etc.                                                                                                                                                                                                                                                                                                                                         | All requests return 200 OK                                                   | MEDIUM   | None                             |
| RAP-024 | Edge Case      | Route with trailing slash handled correctly  | Server running | 1. GET /api/products/<br>2. Compare with /api/products                      | `/api/products/` vs `/api/products`                                                                                                                                                                                                                                                                                                                                                                              | Both return same response                                                    | LOW      | None                             |

---

## 4. Middleware Order & Execution Tests

| Test ID | Category       | Test Scenario                        | Pre-conditions | Test Steps                                                              | Test Data                                                                                    | Expected Result                                                        | Priority | Dependencies           |
| ------- | -------------- | ------------------------------------ | -------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------- | ---------------------- |
| RAP-025 | Integration    | Middleware executes in correct order | Server running | 1. Add logging to each middleware<br>2. Send request<br>3. Verify order | Any request                                                                                  | Order: CORS → Body Parser → Request Logger → Route → Error Handler     | HIGH     | Mock: logger           |
| RAP-026 | Functional     | JSON body parsed correctly           | Server running | 1. POST with JSON body<br>2. Check req.body in controller               | `POST /api/auth/login`<br>`Content-Type: application/json`<br>`{ "email": "test@test.com" }` | req.body populated with parsed JSON                                    | HIGH     | None                   |
| RAP-027 | Functional     | URL-encoded body parsed correctly    | Server running | 1. POST with URL-encoded body<br>2. Check req.body                      | `POST /api/*`<br>`Content-Type: application/x-www-form-urlencoded`<br>`email=test@test.com`  | req.body populated with parsed data                                    | MEDIUM   | None                   |
| RAP-028 | Edge Case      | Large JSON body rejected (>10MB)     | Server running | 1. POST with 11MB JSON body<br>2. Check response                        | JSON payload size: 11MB                                                                      | 413 Payload Too Large                                                  | HIGH     | None                   |
| RAP-029 | Edge Case      | Request without Content-Type header  | Server running | 1. POST without Content-Type<br>2. Check req.body                       | `POST /api/*` (no Content-Type)                                                              | req.body is undefined or empty object                                  | MEDIUM   | None                   |
| RAP-030 | Error Handling | Invalid JSON body returns 400        | Server running | 1. POST with malformed JSON<br>2. Check error response                  | `POST /api/*`<br>`Body: { invalid json }`                                                    | 400 Bad Request                                                        | MEDIUM   | Error middleware       |
| RAP-031 | Functional     | Request logging middleware works     | Server running | 1. Send any request<br>2. Verify console logs                           | `GET /api/health`                                                                            | Console logs request details: method, path, origin, headers            | LOW      | Console mock           |
| RAP-032 | Integration    | Compression middleware active        | Server running | 1. GET endpoint with large response<br>2. Check Content-Encoding header | `GET /api/products` (large list)                                                             | Response includes `Content-Encoding: gzip` (if response > threshold)   | LOW      | compression middleware |
| RAP-033 | Security       | Helmet security headers set          | Server running | 1. GET any endpoint<br>2. Check response headers                        | `GET /api/health`                                                                            | Headers include Helmet security headers (X-DNS-Prefetch-Control, etc.) | MEDIUM   | None                   |

---

## 5. Error Handling Tests

| Test ID | Category       | Test Scenario                                 | Pre-conditions                     | Test Steps                                                                      | Test Data                                          | Expected Result                                                                                             | Priority | Dependencies                   |
| ------- | -------------- | --------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------- | ------------------------------ |
| RAP-034 | Error Handling | Generic Error caught and handled              | Server running, route throws error | 1. Trigger route that throws Error<br>2. Check response                         | Route throws `new Error("Test error")`             | 500 Internal Server Error, `{ success: false, error: "Test error" }`, error logged                          | HIGH     | Mock: logger, route            |
| RAP-035 | Error Handling | ErrorResponse with custom status code         | Server running                     | 1. Trigger ErrorResponse(403)<br>2. Check response                              | Route throws `new ErrorResponse("Forbidden", 403)` | 403 Forbidden, `{ success: false, error: "Forbidden" }`                                                     | HIGH     | Error middleware               |
| RAP-036 | Error Handling | Mongoose CastError returns 404                | Server running                     | 1. GET /api/products/invalid-id<br>2. Check response                            | `GET /api/products/invalid-object-id`              | 404 Not Found, `{ success: false, error: "Resource not found" }`, error logged                              | HIGH     | Mock: Mongoose error           |
| RAP-037 | Error Handling | Mongoose duplicate key error (11000)          | Server running                     | 1. Create user with duplicate email<br>2. Check response                        | Duplicate unique field (e.g., email)               | 400 Bad Request, `{ success: false, error: "Duplicate field value entered" }`                               | MEDIUM   | Mock: Mongoose error           |
| RAP-038 | Error Handling | Mongoose ValidationError returns 400          | Server running                     | 1. POST without required fields<br>2. Check response                            | Missing required fields in request body            | 400 Bad Request, `{ success: false, error: [validation messages] }`                                         | MEDIUM   | Mock: Mongoose ValidationError |
| RAP-039 | Error Handling | Invalid JWT token returns 401                 | Server running, protected route    | 1. GET /api/auth/me with invalid token<br>2. Check response                     | `Authorization: Bearer invalid-token`              | 401 Unauthorized, `{ success: false, error: "Invalid token" }`                                              | HIGH     | Mock: JWT error                |
| RAP-040 | Error Handling | Expired JWT token returns 401                 | Server running, protected route    | 1. GET /api/auth/me with expired token<br>2. Check response                     | `Authorization: Bearer expired-token`              | 401 Unauthorized, `{ success: false, error: "Token expired" }`                                              | HIGH     | Mock: JWT TokenExpiredError    |
| RAP-041 | Error Handling | Error without message returns generic message | Server running                     | 1. Trigger error without message property<br>2. Check response                  | Route throws `new Error()` (no message)            | 500 Internal Server Error, `{ success: false, error: "Server Error" }`                                      | MEDIUM   | Error middleware               |
| RAP-042 | Error Handling | Error details logged correctly                | Server running                     | 1. Trigger any error<br>2. Verify logger.error called                           | Any error                                          | logger.error called with: error message, stack trace, req.path, req.method, req.body, req.params, req.query | HIGH     | Mock: logger                   |
| RAP-043 | Error Handling | Error handler doesn't expose sensitive info   | Server running, production env     | 1. Trigger error in production<br>2. Check response doesn't include stack trace | `NODE_ENV=production`                              | Error response does NOT include stack trace or sensitive details                                            | HIGH     | None                           |

---

## 6. Health Check & Monitoring Tests

| Test ID | Category   | Test Scenario                             | Pre-conditions                         | Test Steps                                                                    | Test Data                | Expected Result                                                                                              | Priority | Dependencies |
| ------- | ---------- | ----------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ | -------- | ------------ |
| RAP-044 | Functional | Health check returns correct status       | Server running                         | 1. GET /api/health<br>2. Verify response structure                            | N/A                      | 200 OK, `{ status: "healthy", timestamp: ISO_string, uptime: number, environment: "test", version: string }` | HIGH     | None         |
| RAP-045 | Functional | Health check uptime is accurate           | Server running for 10 seconds          | 1. Wait 10 seconds after start<br>2. GET /api/health<br>3. Check uptime value | N/A                      | uptime ≥ 10 seconds                                                                                          | MEDIUM   | None         |
| RAP-046 | Edge Case  | Health check with missing version env var | Server running, no npm_package_version | 1. Delete version env var<br>2. GET /api/health<br>3. Check response          | No `npm_package_version` | version field defaults to "1.0.0"                                                                            | LOW      | None         |
| RAP-047 | Edge Case  | Health check with missing NODE_ENV        | Server running, no NODE_ENV            | 1. Delete NODE_ENV<br>2. GET /api/health<br>3. Check response                 | No `NODE_ENV`            | environment field defaults to "development"                                                                  | LOW      | None         |

---

## 7. Socket.IO Integration Tests

| Test ID | Category    | Test Scenario                              | Pre-conditions | Test Steps                                                           | Test Data                                      | Expected Result                                                          | Priority | Dependencies              |
| ------- | ----------- | ------------------------------------------ | -------------- | -------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ | -------- | ------------------------- |
| RAP-048 | Integration | Socket.IO server initialized               | Server running | 1. Check `io` object exists<br>2. Verify setupSocketHandlers called  | N/A                                            | `io` is instance of SocketIOServer, setupSocketHandlers called with `io` | HIGH     | Mock: setupSocketHandlers |
| RAP-049 | Security    | Socket.IO CORS allows whitelisted origins  | Server running | 1. Connect to socket from localhost<br>2. Verify connection accepted | Socket connection from `http://localhost:5173` | Connection established successfully                                      | MEDIUM   | Socket.IO client          |
| RAP-050 | Security    | Socket.IO CORS blocks unauthorized origins | Server running | 1. Connect to socket from evil.com<br>2. Verify connection rejected  | Socket connection from `https://evil.com`      | Connection rejected, error logged "Socket CORS blocked origin"           | MEDIUM   | Socket.IO client          |

---

## 8. Static File Serving Tests

| Test ID | Category       | Test Scenario                        | Pre-conditions              | Test Steps                                                                                     | Test Data                        | Expected Result                                     | Priority | Dependencies  |
| ------- | -------------- | ------------------------------------ | --------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------- | -------- | ------------- |
| RAP-051 | Functional     | Static files served from /uploads    | Server running, file exists | 1. PUT file in uploads/avatars/<br>2. GET /uploads/avatars/file.jpg<br>3. Verify file returned | File: `uploads/avatars/test.jpg` | 200 OK, image file served with correct Content-Type | MEDIUM   | fs operations |
| RAP-052 | Error Handling | Non-existent static file returns 404 | Server running              | 1. GET /uploads/nonexistent.jpg<br>2. Check response                                           | `/uploads/nonexistent.jpg`       | 404 Not Found                                       | LOW      | None          |

---

## Test Execution Summary

### By Priority

- **HIGH**: 30 test cases (RAP-001, 002, 007, 008, 009, 010, 011, 014, 016, 017, 018, 019, 022, 025, 026, 028, 034, 035, 036, 039, 040, 042, 043, 044, 048)
- **MEDIUM**: 17 test cases (RAP-003, 004, 005, 006, 012, 013, 015, 020, 023, 027, 029, 030, 033, 037, 038, 041, 045, 049, 050, 051)
- **LOW**: 5 test cases (RAP-021, 024, 031, 032, 046, 047, 052)

### By Category

- **Integration**: 12 test cases
- **Functional**: 11 test cases
- **Error Handling**: 11 test cases
- **Security**: 7 test cases
- **Edge Case**: 11 test cases

### Coverage Areas

- ✅ Application Initialization (7 cases)
- ✅ CORS Handling (8 cases)
- ✅ Route Registration (9 cases)
- ✅ Middleware Order (9 cases)
- ✅ Error Handling (10 cases)
- ✅ Health Check (4 cases)
- ✅ Socket.IO (3 cases)
- ✅ Static Files (2 cases)

---

## Test Data Requirements

### Mock Objects Needed

```javascript
// Database Mock
const mockConnectDB = jest.fn().mockResolvedValue(true);

// Logger Mock
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Socket.IO Mock
const mockSetupSocketHandlers = jest.fn();

// Cron Job Mocks
const mockStartDiscountCron = jest.fn();
const mockStartFlashSaleCron = jest.fn();

// File System Mock
const mockSetupUploadDirectories = jest.fn();
```

### Test Environment Variables

```bash
NODE_ENV=test
PORT=3001
MONGODB_URI=mongodb://localhost:27017/kicks-shoes-test
JWT_SECRET=test-jwt-secret-key-12345
PAYOS_CLIENT_ID=test-payos-client
PAYOS_API_KEY=test-api-key
PAYOS_CHECKSUM_KEY=test-checksum-key
```

### Sample Request Factories

```javascript
// Valid Origin Headers
const validOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://kicks-shoes-2025.web.app',
];

// Invalid Origin
const invalidOrigin = 'https://evil.com';

// Large JSON Body (>10MB)
const largeBody = JSON.stringify({ data: 'x'.repeat(11 * 1024 * 1024) });

// Valid Auth Token
const validToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Invalid Auth Token
const invalidToken = 'Bearer invalid-token-string';
```

---

## Dependencies & Prerequisites

### Required Mocks

1. **mongoose** - Database connection and models
2. **logger** - Winston logging (silence in tests)
3. **Socket.IO** - Websocket setup
4. **fs** - File system operations for uploads
5. **cron** - Background job scheduling
6. **Payment SDKs** - PayOS, VNPay
7. **Email Transport** - Nodemailer

### Test Utilities

1. **supertest** - HTTP assertion library for Express
2. **jest** - Test framework
3. **@jest/globals** - ESM support for Jest
4. **nock** - HTTP mocking (if testing external APIs)

### Setup Script Example

```javascript
// tests/setup.js
beforeAll(async () => {
  process.env.NODE_ENV = 'test';

  // Mock all external dependencies
  jest.mock('../src/config/database.js');
  jest.mock('../src/utils/logger.js');
  jest.mock('../src/socket.js');
  jest.mock('../src/utils/cronJobs.js');
  jest.mock('../src/utils/setupUploads.js');
});

afterAll(async () => {
  // Cleanup
  jest.restoreAllMocks();
});
```

---

## Test Execution Commands

```bash
# Run all Routing & App tests
npm test -- tests/routing-app

# Run with coverage
npm test -- tests/routing-app --coverage

# Run specific category
npm test -- tests/routing-app/error-handling.test.js

# Run in watch mode
npm test -- tests/routing-app --watch

# Run with verbose output
npm test -- tests/routing-app --verbose
```

---

## Success Criteria

### Coverage Targets

- ✅ Statements: ≥85%
- ✅ Branches: ≥85%
- ✅ Functions: ≥85%
- ✅ Lines: ≥85%

### Test Pass Rate

- ✅ All 52 test cases must pass
- ✅ No test timeouts (default 30s per test)
- ✅ No memory leaks during test execution

### Performance Benchmarks

- ✅ Test suite completes in <60 seconds
- ✅ Individual tests complete in <5 seconds
- ✅ App startup time in tests <2 seconds

---

**End of Test Cases Matrix**

_Generated: 2025-10-30_  
_Feature: Routing & App_  
_Total Test Cases: 52_  
_Version: 1.0.0_
