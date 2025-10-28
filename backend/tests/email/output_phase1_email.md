# Email – Technical & Testing Analysis

## 1. Feature Overview

### Business Purpose

The Email feature provides a centralized service for sending transactional emails throughout the Kicks Shoes e-commerce platform. It handles user communications including order confirmations, account verifications, discount codes, status updates, and moderation notifications.

### Key Flows Involved

1. **User Authentication Flow**: Email verification, password reset, OTP codes
2. **Order Management Flow**: Order confirmation, status updates (processing, shipped, delivered, cancelled, refunded)
3. **Reward Points Flow**: Discount code delivery after redemption
4. **Moderation Flow**: Product/review warnings, deletions, report resolutions
5. **Livestream Flow**: Order success notifications, out-of-stock alerts
6. **Report Management Flow**: Report submission confirmations, resolution notifications

### Main Business Rules & Success Criteria

- **Email Delivery**: All transactional emails must be sent reliably using OAuth2 authentication
- **Template System**: Support for 30+ predefined templates with dynamic data
- **Test Environment**: Skip actual email sending in test environment to prevent spam
- **Error Handling**: Log errors but don't fail business operations if email fails
- **Fallback Mechanism**: Provide fallback content if order details generation fails
- **Security**: Use Google OAuth2 for secure email transmission

### Why This Feature is Important for Testing

- **Critical Business Communication**: Failed emails = poor user experience
- **Integration Point**: Email service integrates with 10+ other features
- **External Dependency**: Relies on Google OAuth2 and Nodemailer
- **Template Complexity**: 30+ templates with conditional logic and formatting
- **Error Resilience**: Must handle failures gracefully without breaking parent operations

---

## 2. UI/UX Flow Mapping

### Email is primarily a backend service with no direct UI. However, users interact with emails in their inbox:

| Step | UI Screen/Component      | User Action                    | System Behavior                                                 |
| ---- | ------------------------ | ------------------------------ | --------------------------------------------------------------- |
| 1    | User Registration        | User submits registration form | System sends OTP verification email                             |
| 2    | Email Inbox              | User opens verification email  | System displays verification link/OTP                           |
| 3    | Verification Page        | User clicks link or enters OTP | System verifies and activates account                           |
| 4    | Checkout Page            | User completes order           | System sends order confirmation email                           |
| 5    | Email Inbox              | User opens order email         | System displays order details with items, totals, shipping info |
| 6    | Order Status Change      | Admin updates order status     | System sends status update email (shipped, delivered, etc.)     |
| 7    | Reward Points Redemption | User redeems points            | System sends discount code email                                |
| 8    | Report Submission        | User reports product/review    | System sends confirmation and later resolution emails           |

---

## 3. Related Files, Components & Modules

| File/Path                                 | Layer         | Responsibility                               | Key Methods/Props/States                                                                                                                                    |
| ----------------------------------------- | ------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core Email Service**                    |
| `services/email.service.js`               | Service/Logic | Main email service class with OAuth2 setup   | `sendTemplatedEmail()`, `sendOrderConfirmationEmail()`, `sendDiscountCodeEmail()`, `sendOrderStatusUpdateEmail()`, `generateOrderDetails()`, `sendEmail()`  |
| `config/email.config.js`                  | Config        | Email configuration and OAuth2 credentials   | `googleMailerClientId`, `googleMailerClientSecret`, `googleMailerRefreshToken`, `adminEmailAddress`, `smtp`, `maxRetries`, `retryDelay`                     |
| `templates/email.templates.js`            | Template      | 30+ HTML email templates                     | `REGISTRATION`, `VERIFICATION`, `PASSWORD_RESET`, `ORDER_CONFIRMATION`, `ORDER_SHIPPED`, `DISCOUNT_CODE`, `OTP`, `PRODUCT_WARNING`, `REPORT_RESOLVED`, etc. |
| **Utility Layer**                         |
| `utils/sendEmail.js`                      | Utility       | Email utility wrapper functions              | `sendEmail()`, `sendTemplatedEmail()`                                                                                                                       |
| **API Layer**                             |
| `routes/emailRoutes.js`                   | API           | Email testing endpoints                      | `POST /api/email/test`, `POST /api/email/send`                                                                                                              |
| **Integration Points**                    |
| `controllers/orderController.js`          | Controller    | Calls EmailService for order emails          | `createOrder()` - sends confirmation                                                                                                                        |
| `controllers/rewardPointController.js`    | Controller    | Calls EmailService for discount codes        | `redeemPoints()` - sends discount code                                                                                                                      |
| `services/otp.service.js`                 | Service       | Calls EmailService for OTP                   | `registerApp()` - sends OTP email                                                                                                                           |
| `services/auth.service.js`                | Service       | Calls EmailService for auth emails           | Verification, password reset                                                                                                                                |
| `controllers/potentialOrderController.js` | Controller    | Calls EmailService for livestream orders     | Success/out-of-stock notifications                                                                                                                          |
| `controllers/vnpayController.js`          | Controller    | Calls EmailService for payment notifications | Payment success/failure                                                                                                                                     |
| **Frontend**                              |
| N/A                                       | N/A           | No direct frontend components                | Emails rendered in user's email client                                                                                                                      |

---

## 4. Core Functions / Methods to Test

### 4.1 `EmailService.sendTemplatedEmail(to, templateType, templateData)`

- **Purpose:** Send an email using a predefined template
- **Inputs + Types:**
  - `to` (string): Recipient email address
  - `templateType` (string): Template key (e.g., 'ORDER_CONFIRMATION')
  - `templateData` (object): Dynamic data for template placeholders
- **Outputs / Return:** `Promise<void>`
- **State Change / Side Effects:**
  - Fetches OAuth2 access token
  - Creates nodemailer transport
  - Sends email via Gmail
  - Logs success/error
- **Edge Cases:**
  - Missing `to` parameter
  - Invalid/non-existent `templateType`
  - Template rendering error with invalid data
  - OAuth2 token refresh failure
  - Network failure during send
- **Dependencies (mock needed?):**
  - ✅ `nodemailer.createTransport()` - MUST MOCK
  - ✅ `OAuth2Client.getAccessToken()` - MUST MOCK
  - ✅ `emailTemplates[templateType]` - Can test real or mock
  - ✅ `logger` - Should mock to test logging

---

### 4.2 `EmailService.sendOrderConfirmationEmail(user, order)`

- **Purpose:** Send order confirmation email with full order details
- **Inputs + Types:**
  - `user` (object): User object with `{ email, fullName }`
  - `order` (object): Order object with items, prices, address
- **Outputs / Return:** `Promise<void>`
- **State Change / Side Effects:**
  - Calls `generateOrderDetails()` to build HTML
  - Falls back to simple template if details generation fails
  - Calls `sendTemplatedEmail()`
  - Logs success/error
- **Edge Cases:**
  - Order items not populated (need to populate)
  - Missing product data (product deleted)
  - Order with zero items
  - Extremely large orders (100+ items)
  - Order details generation throws error
- **Dependencies (mock needed?):**
  - ✅ `generateOrderDetails()` - Can test real or mock
  - ✅ `sendTemplatedEmail()` - Should mock
  - ✅ `order.populate()` - May need to mock or use real DB

---

### 4.3 `EmailService.sendDiscountCodeEmail(user, discountData)`

- **Purpose:** Send discount code email after reward points redemption
- **Inputs + Types:**
  - `user` (object): User object with `{ email, fullName }`
  - `discountData` (object): `{ code, value, description, startDate, endDate, points }`
- **Outputs / Return:** `Promise<void>`
- **State Change / Side Effects:**
  - Calls `sendTemplatedEmail()` with DISCOUNT_CODE template
  - Logs success/error
- **Edge Cases:**
  - Missing `fullName` (fallback to email)
  - Invalid date formats
  - Very large discount values
- **Dependencies (mock needed?):**
  - ✅ `sendTemplatedEmail()` - Should mock
  - ✅ `logger` - Should mock

---

### 4.4 `EmailService.sendOrderStatusUpdateEmail(user, order, newStatus)`

- **Purpose:** Send email when order status changes
- **Inputs + Types:**
  - `user` (object): User object with `{ email, fullName }`
  - `order` (object): Order object with status-specific data
  - `newStatus` (string): One of: 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'refund_pending', 'failed'
- **Outputs / Return:** `Promise<void>`
- **State Change / Side Effects:**
  - Maps status to corresponding template
  - Calls `sendTemplatedEmail()` with appropriate template and data
  - Logs warning if no template for status
  - Logs success/error
- **Edge Cases:**
  - Unknown/unsupported status
  - Missing status-specific data (trackingNumber, refundAmount, etc.)
  - Status without corresponding template
- **Dependencies (mock needed?):**
  - ✅ `sendTemplatedEmail()` - Should mock
  - ✅ `logger` - Should mock

---

### 4.5 `EmailService.generateOrderDetails(order)`

- **Purpose:** Generate HTML for order items, pricing, and shipping info
- **Inputs + Types:**
  - `order` (object): Order with items (may need population)
- **Outputs / Return:** `Promise<string>` - HTML string
- **State Change / Side Effects:**
  - Populates order items if not already populated
  - Iterates through items to build HTML
  - Returns fallback HTML on error
  - Logs detailed info during generation
- **Edge Cases:**
  - Order items unpopulated (need to populate)
  - Items with deleted/missing products
  - Order with 0 items
  - Missing price/quantity data
  - Population fails
- **Dependencies (mock needed?):**
  - ✅ `order.populate()` - May mock or use real DB
  - ✅ `formatVND()` - Can test real utility
  - ✅ `logger` - Should mock

---

### 4.6 `EmailService.sendEmail(to, subject, content)`

- **Purpose:** Low-level method to send custom email
- **Inputs + Types:**
  - `to` (string): Recipient email
  - `subject` (string): Email subject
  - `content` (string): HTML content
- **Outputs / Return:** `Promise<void>`
- **State Change / Side Effects:**
  - Validates all parameters present
  - Skips sending in test environment
  - Gets OAuth2 access token
  - Creates nodemailer transport
  - Sends email
  - Logs success/error
- **Edge Cases:**
  - Missing `to`, `subject`, or `content`
  - Running in test environment (should skip)
  - OAuth2 token fetch failure
  - Invalid email address format
  - Email server rejection
- **Dependencies (mock needed?):**
  - ✅ `process.env.NODE_ENV` - Can set in tests
  - ✅ `OAuth2Client.getAccessToken()` - MUST MOCK
  - ✅ `nodemailer.createTransport()` - MUST MOCK
  - ✅ `transport.sendMail()` - MUST MOCK
  - ✅ `logger` - Should mock

---

### 4.7 `emailTemplates[templateType].getContent(templateData)`

- **Purpose:** Render HTML email template with dynamic data
- **Inputs + Types:**
  - `templateData` (object): Data specific to each template
- **Outputs / Return:** `string` - HTML email content
- **State Change / Side Effects:**
  - String interpolation with template literals
  - Conditional rendering based on data presence
  - Date formatting (for dates)
  - Currency formatting (for amounts)
- **Edge Cases:**
  - Missing required template data
  - `undefined` or `null` values in template
  - Very long strings breaking HTML layout
  - Special HTML characters in data (XSS risk)
  - Invalid date/number formats
- **Dependencies (mock needed?):**
  - ✅ `formatVND()` - Can test real utility
  - ✅ Date formatting functions - Can test real

---

### 4.8 Email Configuration (`email.config.js`)

- **Purpose:** Provide email configuration and validate required settings
- **Inputs + Types:** Environment variables
- **Outputs / Return:** Configuration object
- **State Change / Side Effects:**
  - Reads from `process.env`
  - Throws error if required config missing
- **Edge Cases:**
  - Missing OAuth2 credentials
  - Missing admin email
  - Invalid port/timeout values
- **Dependencies (mock needed?):**
  - ✅ `process.env` - Set in tests

---

### 4.9 Email Routes (`emailRoutes.js`)

- **Purpose:** Expose API endpoints for email testing
- **Inputs + Types:**
  - `POST /api/email/test`: `{ email }`
  - `POST /api/email/send`: `{ email, templateType, templateData }` (protected)
- **Outputs / Return:** JSON response with success/error
- **State Change / Side Effects:**
  - Validates input
  - Calls `sendTemplatedEmail()` utility
  - Returns appropriate status codes
- **Edge Cases:**
  - Missing required fields
  - Invalid email address
  - Invalid template type
  - Email sending failure
- **Dependencies (mock needed?):**
  - ✅ `sendTemplatedEmail()` - Should mock
  - ✅ `protect` middleware - May need to mock/bypass
  - ✅ `logger` - Should mock

---

### 4.10 Utility Wrapper (`utils/sendEmail.js`)

- **Purpose:** Alternative email utility with similar functionality
- **Inputs + Types:**
  - `sendEmail({ email, subject, message })`
  - `sendTemplatedEmail({ email, templateType, templateData })`
- **Outputs / Return:** `Promise<void>`
- **State Change / Side Effects:**
  - Creates separate OAuth2Client
  - Creates nodemailer transport
  - Sends email
  - Logs success/error
- **Edge Cases:**
  - Similar to `EmailService.sendEmail()`
- **Dependencies (mock needed?):**
  - ✅ Same as `EmailService.sendEmail()`
- **Note:** This appears to be a duplicate/alternative implementation to `EmailService`. Tests should clarify which is the canonical implementation.

---

## 5. Test Case Matrix

### 5.1 Unit Tests - Email Service

| Category                         | Scenario                               | Pre-condition                              | Input                                                                                                                          | Expected Output/Behavior                                              |
| -------------------------------- | -------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **sendTemplatedEmail()**         |
| Happy                            | Send email with valid template         | Valid email, template exists               | `to='user@test.com', templateType='VERIFICATION', templateData={name:'Test', verificationLink:'http://...'}`                   | Email sent successfully, `sendEmail()` called with correct params     |
| Validation                       | Reject missing recipient               | Valid template                             | `to=null, templateType='VERIFICATION', templateData={}`                                                                        | Throws error: "Recipient email address is required"                   |
| Validation                       | Reject invalid template                | Valid email                                | `to='user@test.com', templateType='INVALID_TEMPLATE', templateData={}`                                                         | Throws error: "Email template 'INVALID_TEMPLATE' not found"           |
| Error                            | Handle sendEmail failure               | Valid email, template                      | `to='user@test.com', templateType='VERIFICATION'` (sendEmail throws error)                                                     | Throws error, logs error message                                      |
| Edge                             | Empty templateData                     | Valid email, template                      | `to='user@test.com', templateType='VERIFICATION', templateData={}`                                                             | Email sent, template uses default/undefined values                    |
| **sendOrderConfirmationEmail()** |
| Happy                            | Send order confirmation                | Valid user, valid order                    | `user={email:'u@test.com', fullName:'Test'}, order={_id:'123', totalPrice:100000}`                                             | Email sent with order details HTML                                    |
| Edge                             | Fallback on generateOrderDetails error | Valid user, order causes error             | `user=..., order=...` (generateOrderDetails throws)                                                                            | Email sent with fallback template, logs error                         |
| Edge                             | Order with no items                    | Valid user, order with empty items         | `user=..., order={items: []}`                                                                                                  | Email sent with fallback message "Order items are being processed..." |
| Integration                      | Order with unpopulated items           | Valid user, order with item IDs            | `user=..., order={items: ['id1', 'id2']}`                                                                                      | Calls `order.populate()`, generates details with populated items      |
| **sendDiscountCodeEmail()**      |
| Happy                            | Send discount code                     | Valid user, valid discount                 | `user={email:'u@test.com', fullName:'Test'}, discountData={code:'SAVE10', value:50000, points:50, startDate:..., endDate:...}` | Email sent with discount code details                                 |
| Edge                             | Missing fullName                       | User without fullName                      | `user={email:'u@test.com'}, discountData={...}`                                                                                | Uses email as name fallback                                           |
| Validation                       | Missing discount code                  | User, incomplete discount data             | `user=..., discountData={value:50000}` (no code)                                                                               | Template uses `undefined` for code (template error)                   |
| **sendOrderStatusUpdateEmail()** |
| Happy                            | Send processing email                  | Valid user, order, status='processing'     | `user=..., order={_id:'123', estimatedDelivery:'2025-12-01'}, newStatus='processing'`                                          | Email sent with ORDER_PROCESSING template                             |
| Happy                            | Send shipped email                     | Valid user, order, status='shipped'        | `user=..., order={trackingNumber:'TRK123'}, newStatus='shipped'`                                                               | Email sent with ORDER_SHIPPED template                                |
| Happy                            | Send delivered email                   | Valid user, order, status='delivered'      | `user=..., order={updatedAt:'2025-11-28'}, newStatus='delivered'`                                                              | Email sent with ORDER_DELIVERED template                              |
| Happy                            | Send cancelled email                   | Valid user, order, status='cancelled'      | `user=..., order={cancellationReason:'User request', refundAmount:100000}, newStatus='cancelled'`                              | Email sent with ORDER_CANCELLED template                              |
| Happy                            | Send refunded email                    | Valid user, order, status='refunded'       | `user=..., order={refundAmount:100000, refundReason:'...', refundedAt:'...'}, newStatus='refunded'`                            | Email sent with ORDER_REFUNDED template                               |
| Happy                            | Send refund_pending email              | Valid user, order, status='refund_pending' | `user=..., order={refundAmount:100000, refundReason:'...'}, newStatus='refund_pending'`                                        | Email sent with ORDER_REFUND_PENDING template                         |
| Happy                            | Send failed email                      | Valid user, order, status='failed'         | `user=..., order={paymentMethod:'VNPay', totalPrice:100000}, newStatus='failed'`                                               | Email sent with ORDER_FAILED template                                 |
| Edge                             | Unknown status                         | Valid user, order, unsupported status      | `user=..., order=..., newStatus='unknown_status'`                                                                              | Logs warning, returns early without sending email                     |
| Edge                             | Missing status-specific data           | Valid user, order with missing data        | `user=..., order={}, newStatus='shipped'` (no trackingNumber)                                                                  | Email sent with `undefined` for missing fields                        |
| **generateOrderDetails()**       |
| Happy                            | Generate details for populated order   | Order with populated items                 | `order={items:[{product:{name:'Shoe', ...}, quantity:2, price:500000}], totalPrice:1000000, ...}`                              | Returns HTML string with item details, totals, address                |
| Edge                             | Order with unpopulated items           | Order with item IDs                        | `order={items:['id1', 'id2']}`                                                                                                 | Calls `order.populate()`, returns HTML with populated data            |
| Edge                             | Item with null product                 | Order with deleted product                 | `order={items:[{product:null, quantity:1, price:100000}]}`                                                                     | Returns HTML with "Product (ID: Unknown)" fallback                    |
| Edge                             | Order with 0 items                     | Order with empty items array               | `order={items:[]}`                                                                                                             | Returns HTML with "Order items are being processed..." fallback       |
| Edge                             | Order with optional fees               | Order with shipping, tax, discount         | `order={subtotal:900000, shippingCost:50000, tax:50000, discount:100000, totalPrice:900000}`                                   | HTML includes shipping, tax, discount rows                            |
| Edge                             | Order without optional fees            | Order without shipping, tax, discount      | `order={subtotal:1000000, totalPrice:1000000, shippingCost:0, tax:0, discount:0}`                                              | HTML excludes shipping, tax, discount rows                            |
| Error                            | Population fails                       | Order that throws on populate              | `order.populate()` throws error                                                                                                | Catches error, returns fallback HTML, logs error                      |
| **sendEmail()**                  |
| Happy                            | Send email in production               | Valid params, NODE_ENV='production'        | `to='u@test.com', subject='Test', content='<p>Test</p>'`                                                                       | Email sent via nodemailer, logs success                               |
| Skip                             | Skip email in test environment         | Valid params, NODE_ENV='test'              | `to='u@test.com', subject='Test', content='<p>Test</p>'`                                                                       | Logs "Email skipped", returns without sending                         |
| Validation                       | Reject missing to                      | No recipient                               | `to=null, subject='Test', content='<p>Test</p>'`                                                                               | Throws error: "Missing required email parameters"                     |
| Validation                       | Reject missing subject                 | No subject                                 | `to='u@test.com', subject=null, content='<p>Test</p>'`                                                                         | Throws error: "Missing required email parameters"                     |
| Validation                       | Reject missing content                 | No content                                 | `to='u@test.com', subject='Test', content=null`                                                                                | Throws error: "Missing required email parameters"                     |
| Error                            | OAuth2 token fetch fails               | Valid params, getAccessToken throws        | `to='u@test.com', subject='Test', content='...'`                                                                               | Throws error, logs error message                                      |
| Error                            | Nodemailer sendMail fails              | Valid params, sendMail throws              | `to='u@test.com', subject='Test', content='...'`                                                                               | Throws error, logs error message                                      |

---

### 5.2 Unit Tests - Email Templates

| Category               | Scenario                           | Pre-condition              | Input                                                                              | Expected Output/Behavior                                     |
| ---------------------- | ---------------------------------- | -------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Template Rendering** |
| Happy                  | Render REGISTRATION template       | Template exists            | `{name:'John', verificationLink:'http://...'}`                                     | Returns HTML with name and link                              |
| Happy                  | Render VERIFICATION template       | Template exists            | `{name:'John', verificationLink:'http://...'}`                                     | Returns HTML with name and link                              |
| Happy                  | Render PASSWORD_RESET template     | Template exists            | `{name:'John', resetLink:'http://...'}`                                            | Returns HTML with name and reset link                        |
| Happy                  | Render ORDER_CONFIRMATION template | Template exists            | `{name:'John', orderNumber:'123', orderDetails:'<div>...</div>'}`                  | Returns HTML with order details                              |
| Happy                  | Render OTP template                | Template exists            | `{name:'John', otp:'123456'}`                                                      | Returns HTML with OTP code                                   |
| Happy                  | Render DISCOUNT_CODE template      | Template exists            | `{name:'John', code:'SAVE10', value:50000, points:50, startDate:..., endDate:...}` | Returns HTML with formatted currency and dates               |
| Edge                   | Missing optional data              | Template with conditionals | `{name:'John'}` (missing optional fields)                                          | Returns HTML with `undefined` or conditional sections hidden |
| Edge                   | Special HTML characters            | Template with user input   | `{name:'<script>alert("XSS")</script>'}`                                           | Returns HTML (no escaping, potential XSS - should document)  |
| Edge                   | Very long strings                  | Template with long data    | `{name:'A'.repeat(1000)}`                                                          | Returns HTML with very long name (layout may break)          |
| Validation             | Invalid date format                | DISCOUNT_CODE template     | `{..., startDate:'invalid'}`                                                       | `new Date('invalid')` returns "Invalid Date" string          |
| **All Templates**      |
| Coverage               | Verify all 30+ templates exist     | Templates object           | Access each template key                                                           | Each template has `subject` and `getContent()`               |
| Coverage               | Verify template subjects           | Each template              | Check `template.subject`                                                           | Subject is non-empty string                                  |

---

### 5.3 Integration Tests - Email Routes

| Category                 | Scenario                             | Pre-condition                         | Input                                                                                                     | Expected Output/Behavior                                         |
| ------------------------ | ------------------------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **POST /api/email/test** |
| Happy                    | Send test email                      | Valid request                         | `POST /api/email/test` with `{email:'test@test.com'}`                                                     | 200 OK, `{success:true, message:'Test email sent successfully'}` |
| Validation               | Reject missing email                 | Invalid request                       | `POST /api/email/test` with `{}`                                                                          | 400 Bad Request, error message                                   |
| Error                    | Handle send failure                  | sendTemplatedEmail throws             | `POST /api/email/test` with `{email:'test@test.com'}`                                                     | 500 Internal Server Error, error message                         |
| **POST /api/email/send** |
| Happy                    | Send templated email (authenticated) | User authenticated                    | `POST /api/email/send` with auth header, `{email:'...', templateType:'VERIFICATION', templateData:{...}}` | 200 OK, `{success:true, message:'Email sent successfully'}`      |
| Auth                     | Reject unauthenticated request       | No auth token                         | `POST /api/email/send` without auth header                                                                | 401 Unauthorized                                                 |
| Validation               | Reject missing email                 | Valid auth, missing email             | `POST /api/email/send` with `{templateType:'VERIFICATION'}`                                               | 400 Bad Request                                                  |
| Validation               | Reject missing templateType          | Valid auth, missing template          | `POST /api/email/send` with `{email:'...'}`                                                               | 400 Bad Request                                                  |
| Error                    | Handle send failure                  | Valid auth, sendTemplatedEmail throws | `POST /api/email/send` with valid data                                                                    | 500 Internal Server Error                                        |

---

### 5.4 Integration Tests - Email in Context

| Category               | Scenario                                | Pre-condition                           | Input                                    | Expected Output/Behavior                                                   |
| ---------------------- | --------------------------------------- | --------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| **Order Flow**         |
| Happy                  | Send email on order creation            | User places order                       | Create order via API                     | Order created, confirmation email sent (don't fail request if email fails) |
| Resilience             | Order succeeds even if email fails      | User places order, email service down   | Create order via API                     | Order created successfully, email error logged but not thrown              |
| **Reward Points Flow** |
| Happy                  | Send discount code on redemption        | User redeems points                     | Redeem points via API                    | Discount created, email sent with code                                     |
| Resilience             | Redemption succeeds even if email fails | User redeems points, email service down | Redeem points via API                    | Discount created, email error logged                                       |
| **Auth Flow**          |
| Happy                  | Send OTP on registration                | User registers                          | Register via API                         | User created, OTP email sent                                               |
| **Livestream Flow**    |
| Happy                  | Send order success email                | Potential order converted               | Convert potential order                  | Order created, livestream order email sent                                 |
| Happy                  | Send out-of-stock email                 | Product unavailable                     | Attempt to convert, product out of stock | No order created, out-of-stock email sent                                  |

---

### 5.5 Error Handling & Edge Cases

| Category                 | Scenario                   | Pre-condition                   | Input                                            | Expected Output/Behavior                                 |
| ------------------------ | -------------------------- | ------------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| **Configuration Errors** |
| Error                    | Missing OAuth2 credentials | No env vars set                 | Import `email.config.js`                         | Throws error: "Missing required email configuration"     |
| Error                    | Invalid OAuth2 credentials | Wrong credentials               | Call `sendEmail()`                               | OAuth2 error thrown, logged                              |
| **Network Errors**       |
| Error                    | Gmail service unavailable  | Valid config, service down      | Call `sendEmail()`                               | Network error thrown, logged                             |
| Error                    | Access token refresh fails | OAuth2 token expired            | Call `sendEmail()`                               | Token refresh error thrown, logged                       |
| **Template Errors**      |
| Error                    | Template getContent throws | Broken template                 | Call `sendTemplatedEmail()` with broken template | Error thrown, logged                                     |
| Edge                     | Template with missing data | Template expects data           | Call template with incomplete data               | Template renders with `undefined` values                 |
| **Rate Limits**          |
| Edge                     | High volume email sending  | Send 100+ emails rapidly        | Call `sendEmail()` 100 times                     | May hit Gmail rate limits (should document)              |
| **Attachments**          |
| Edge                     | Email with attachments     | Nodemailer supports attachments | N/A - not implemented                            | Feature not currently supported                          |
| **Large Emails**         |
| Edge                     | Very large HTML content    | Order with 100+ items           | Call `generateOrderDetails()` with huge order    | Generates very large HTML (may exceed email size limits) |

---

## 6. Test Priority Recommendation

### HIGH Priority (Must Test)

**Module:** `EmailService.sendEmail()`

- **Justification:** Core email sending logic, all other methods depend on it
- **Business Risk:** If broken, NO emails are sent
- **Complexity:** Moderate - OAuth2, nodemailer, error handling

**Module:** `EmailService.sendTemplatedEmail()`

- **Justification:** Primary API for sending all transactional emails
- **Business Risk:** If broken, all templated emails fail
- **Complexity:** Moderate - template lookup, validation

**Module:** `emailConfig` validation

- **Justification:** Config validation prevents runtime errors
- **Business Risk:** Missing config = no emails
- **Complexity:** Low - simple validation

**Module:** Email Templates (top 10 most used)

- **Templates:** `ORDER_CONFIRMATION`, `ORDER_SHIPPED`, `DISCOUNT_CODE`, `OTP`, `VERIFICATION`, `PASSWORD_RESET`, `ORDER_CANCELLED`, `ORDER_DELIVERED`, `LIVESTREAM_ORDER_SUCCESS`, `LIVESTREAM_OUT_OF_STOCK`
- **Justification:** These are the most frequently sent emails
- **Business Risk:** Broken template = poor user experience
- **Complexity:** Low - template rendering

---

### MEDIUM Priority (Should Test)

**Module:** `EmailService.sendOrderConfirmationEmail()`

- **Justification:** Complex logic with fallback handling
- **Business Risk:** Important but has fallback mechanism
- **Complexity:** High - order population, HTML generation

**Module:** `EmailService.generateOrderDetails()`

- **Justification:** Complex HTML generation with multiple edge cases
- **Business Risk:** Can fallback to simple template
- **Complexity:** High - order population, item iteration, conditionals

**Module:** `EmailService.sendOrderStatusUpdateEmail()`

- **Justification:** Handles multiple status types with conditional logic
- **Business Risk:** Important but not critical
- **Complexity:** Moderate - status mapping

**Module:** Email Routes (`/api/email/test`, `/api/email/send`)

- **Justification:** Useful for testing/debugging
- **Business Risk:** Not used in production flow
- **Complexity:** Low - simple wrappers

**Module:** Remaining Email Templates

- **Templates:** All moderation, report, review-related templates
- **Justification:** Less frequently used
- **Business Risk:** Lower user impact
- **Complexity:** Low

---

### LOW Priority (Nice to Have)

**Module:** `utils/sendEmail.js`

- **Justification:** Appears to be duplicate of `EmailService`, clarify which is canonical
- **Business Risk:** May not be actively used
- **Complexity:** Similar to `EmailService`

**Module:** `EmailService.sendDiscountCodeEmail()`

- **Justification:** Simple wrapper around `sendTemplatedEmail()`
- **Business Risk:** Low - straightforward logic
- **Complexity:** Low

**Module:** Error handling in integrations (orderController, rewardPointController, etc.)

- **Justification:** Email failures should not break parent operations
- **Business Risk:** Already tested in integration tests
- **Complexity:** Low - simple try/catch

---

## 7. Mocking & Test Data Preparation

| Dependency               | What to Mock                      | Mocking Strategy                                         | Sample Mock Data                                                                            |
| ------------------------ | --------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **nodemailer**           | `nodemailer.createTransport()`    | Mock to return fake transporter with `sendMail()` method | `{ sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }) }`                       |
| **OAuth2Client**         | `OAuth2Client.getAccessToken()`   | Mock to return fake access token                         | `{ token: 'fake-access-token' }`                                                            |
| **OAuth2Client**         | `OAuth2Client` constructor        | Mock entire OAuth2Client class                           | `jest.mock('google-auth-library')`                                                          |
| **logger**               | `logger.info()`, `logger.error()` | Mock to silence logs and verify calls                    | `{ info: jest.fn(), error: jest.fn() }`                                                     |
| **emailTemplates**       | Template objects                  | Can test real templates or mock specific ones            | `{ VERIFICATION: { subject: 'Test', getContent: jest.fn().mockReturnValue('<html>...') } }` |
| **formatVND**            | Currency formatting               | Can test real utility or mock                            | `jest.fn(val => val.toLocaleString('vi-VN'))`                                               |
| **process.env.NODE_ENV** | Environment variable              | Set in test setup                                        | `process.env.NODE_ENV = 'test'` or `'production'`                                           |
| **Order.populate()**     | Mongoose populate                 | Mock to return populated order or use real DB            | `order.populate = jest.fn().mockResolvedValue(populatedOrder)`                              |
| **User.findById()**      | Mongoose query                    | Mock to return user or use real DB                       | `User.findById = jest.fn().mockResolvedValue(mockUser)`                                     |
| **EmailService methods** | For integration tests             | Mock `sendEmail()`, `sendTemplatedEmail()`, etc.         | `EmailService.sendEmail = jest.fn().mockResolvedValue()`                                    |

### Sample Test Data

```javascript
// Mock User
const mockUser = {
  _id: 'user123',
  email: 'user@test.com',
  fullName: 'Test User',
  phone: '0123456789',
};

// Mock Order (simple)
const mockOrder = {
  _id: 'order123',
  user: 'user123',
  totalPrice: 1000000,
  subtotal: 900000,
  shippingCost: 50000,
  tax: 50000,
  discount: 0,
  status: 'pending',
  paymentMethod: 'COD',
  shippingAddress: '123 Test St, Test City',
  items: [],
};

// Mock Order (with populated items)
const mockOrderWithItems = {
  ...mockOrder,
  items: [
    {
      _id: 'item1',
      product: {
        _id: 'product1',
        name: 'Nike Air Max',
        mainImage: 'image.jpg',
        price: 500000,
      },
      quantity: 2,
      price: 500000,
    },
  ],
};

// Mock Discount Data
const mockDiscountData = {
  code: 'SAVE50',
  value: 50000,
  description: 'Reward points discount',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2026-01-01'),
  points: 50,
};

// Mock OAuth2 Token Response
const mockTokenResponse = {
  token: 'ya29.fake-access-token',
};

// Mock Nodemailer Transport
const mockTransport = {
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
};

// Mock sendMail Response
const mockSendMailResponse = {
  messageId: '<test@gmail.com>',
  accepted: ['user@test.com'],
  rejected: [],
};
```

---

## 8. Suggested Next Prompts

### Prompt 1: Generate Test Cases Matrix

```
"Generate a comprehensive **Test Cases Matrix** (Markdown) for the feature **Email**, based on `output_email.md`.

The system sends transactional emails for authentication, orders, rewards, moderation, and livestream events using OAuth2 and Nodemailer.

**Output**
Return exactly ONE Markdown file named:
`# test-cases-matrix-email.md`

Each test case must be a row with **8 columns** in this order:
`Test ID | Category | Test Scenario | Pre-conditions | Test Steps | Test Data | Expected Result | Priority | Dependencies`

## 18) Email
Modules: services/email.service.js, config/email.config.js, templates/email.templates.js, routes/emailRoutes.js

- Unit
  - Transport creation; invalid credentials error; template rendering with placeholders.
- Integration
  - Send templated email endpoint; input validation.
- Edge
  - Missing template data; attachments; rate limits.
"
```

---

### Prompt 2: Generate Jest Unit Tests

```
"Read the Test Case Matrix file and generate runnable Jest test code for **Email** feature.

## Inputs
- **Test matrix file path:** `backend/tests/email/test-cases-matrix-email.md`
- **Suite heading:** `Test Suite 1: EmailService Core Methods`

## Your Task
- Parse the suite section from the Test Case Matrix
- For **each test case**, create **one** corresponding `test()` block in Jest
- Test name must keep the **Test ID prefix**: `EMAIL-xxx | <scenario>`
- Use **Given–When–Then** structure as comments
- Map the correct Subject Under Test

## Output Requirements (code only)
Generate the following files:

1. `tests/email/email-service-unit.test.js`
   - Use ES Modules (`import/export`)
   - Mock: `nodemailer`, `google-auth-library`, `logger`
   - One `test()` per test case
   - Include Given / When / Then comments

2. `tests/email/email-templates-unit.test.js`
   - Test all 30+ templates
   - Verify template structure and rendering

3. `tests/_helpers/emailTestUtils.js`
   - Mock factories for: `mockTransport`, `mockOAuth2Client`, `mockUser`, `mockOrder`, `mockDiscountData`

4. `prompts/log.md`
   - Append generation entry

5. `README.md` (update if needed)
   - Add test execution guide

## Requirements
- Use **Jest** with ES Modules
- Mock all external I/O (nodemailer, OAuth2, email server)
- Tests must be **deterministic** and CI-friendly
- Target ≥ 85% coverage for email.service.js
"
```

---

### Prompt 3: Generate Integration Tests

```
"Generate Jest integration tests for the **Email** feature's API endpoints and integration with other features.

## Test Files to Generate

1. `tests/email/email-routes-integration.test.js`
   - Test `POST /api/email/test`
   - Test `POST /api/email/send` (with auth)
   - Mock EmailService

2. `tests/email/email-order-integration.test.js`
   - Test order creation triggers confirmation email
   - Test order status update triggers status email
   - Use real MongoDB (in-memory)
   - Mock nodemailer

3. `tests/email/email-rewards-integration.test.js`
   - Test point redemption triggers discount code email
   - Mock nodemailer

## Requirements
- Use `supertest` for HTTP tests
- Use `mongodb-memory-server` for DB tests
- Mock email sending (don't send real emails)
- Verify email service called with correct params
- Target ≥ 85% coverage
"
```

---

### Prompt 4: Generate Edge Case & Error Handling Tests

```
"Generate Jest tests specifically for edge cases and error handling in the **Email** feature.

## Focus Areas

1. **Configuration Errors**
   - Missing OAuth2 credentials
   - Invalid credentials

2. **Network Errors**
   - Gmail service unavailable
   - Access token refresh fails

3. **Template Errors**
   - Missing template data
   - Invalid template type
   - Template rendering errors

4. **Email Content Edge Cases**
   - Very large HTML content (100+ items order)
   - Special HTML characters (XSS)
   - Missing optional data (fallback handling)

5. **Resilience**
   - Verify parent operations don't fail when email fails
   - Test email skipped in test environment

## Output
`tests/email/email-edge-cases.test.js`

Target 100% coverage of error paths and edge cases.
"
```

---

**END OF DOCUMENT**
