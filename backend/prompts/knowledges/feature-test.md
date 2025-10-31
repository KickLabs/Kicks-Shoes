# Kicks Shoes Backend - Test Plan By Feature

This plan lists test items grouped by feature. Each section includes unit and integration scopes, edge cases, and error handling. Target coverage: ≥85% statements, ≥80% branches, ≥85% functions/lines.

Conventions:

- Unit: mock dependencies, test pure logic and error paths.
- Integration: supertest for routes, socket client for socket events, in-memory/mocked DB when needed.
- Security: authZ/authN checks, input validation, leakage prevention.
- Env flags: LOG_LEVEL, USE_TRANSACTIONS, payment sandbox flags.

## 1) Authentication & Authorization

Modules: controllers/authController.js, middlewares/auth.middleware.js, role.middleware.js, utils/jwt.js, models/User.js, models/TokenBlacklist.js

- Unit
  - jwt.sign/verify: valid/expired/malformed tokens; audience/issuer if used.
  - auth.middleware: missing/invalid/expired tokens; sets req.user; forwards errors.
  - role.middleware: allowed/denied roles; multiple roles; missing req.user.
  - Password flows (in controller/service): bad credentials, locked user, password hashing comparisons.
  - Token blacklist: blacklisted token rejection.
- Integration (routes/authRoutes.js, userRoutes.js with protected endpoints)
  - Login success/failure; refresh token if applicable.
  - Protected endpoints require auth; role checks (admin vs user).
- Edge/Security
  - JWT from different env/secret; header variations: "Bearer", lowercase, extra spaces.
  - Brute-force handling if present; error messages avoid leaking which field is wrong.

## 2) Users

Modules: controllers/userController.js, services/user.service.js, models/User.js

- Unit
  - Create/update profile: validation, normalization, uniqueness (email/phone).
  - Password updates: strength, confirmation mismatch, old password verify.
  - Avatar/fields sanitization.
- Integration (routes/userRoutes.js)
  - GET/PUT profile; permissions: user updates self only.
- Edge
  - Not found user; invalid IDs; partial updates; large payloads; XSS in names.

## 3) Product Catalog

Modules: controllers/productController.js, services/product.service.js, models/Product.js, utils/currency.js

- Unit
  - CRUD product: required fields, price rules, variants/inventory operations.
  - currency: format edge cases (null, negative, big numbers, precision).
- Integration (routes/productRoutes.js)
  - List with pagination, sort, filter by category/price/rating.
  - Detail fetch by ID; 404.
- Edge
  - Inventory constraints; SKU uniqueness; image arrays; invalid category.

## 4) Categories

Modules: controllers/categoryController.js, services/category.service.js, models/Category.js, routes/categoryRoutes.js

- Unit
  - Create/update: slug generation, parent-child relations, unique name.
- Integration
  - List tree/flat; delete category with/without children.
- Edge
  - Cycles prevention; orphaned products handling.

## 5) Cart

Modules: controllers/cartController.js, services (if any), models/Cart.js, routes/cartRoutes.js

- Unit
  - Add/update/remove item; quantity bounds; stock checks.
  - Merge cart on login; guest vs user carts.
- Integration
  - Cart retrieval per user; invalid product IDs; concurrent modifications.
- Edge
  - Items referencing deleted product; price recalculation with discounts.

## 6) Orders

Modules: controllers/orderController.js, services/order.service.js, models/Order.js, OrderItem.js, Refund.js, routes/orderRoutes.js

- Unit (services/order.service.js)
  - createOrder: success; model error; validation; USE_TRANSACTIONS=false/true (mock session lifecycle).
  - getOrders: defaults, pagination, filters, empty result.
  - getOrderByOrderId: found/not found/invalid id.
  - getOrderByUserId: pagination, user filter.
  - updateOrder: valid update/not found/invalid transitions.
  - cancelOrder: success; already-cancelled; transaction on/off; reason required.
  - refundOrder: success; invalid state; downstream errors.
- Integration
  - POST /orders: validates body; returns created order; 400 on invalid.
  - GET /orders: pagination params; auth/role required.
- Edge
  - Race conditions with stock; idempotency on create (client retries).

## 7) Payments - VNPAY

Modules: controllers/vnpayController.js, services/vnpay.service.js, config/vnpay.config.js, routes/vnpayRoutes.js

- Unit
  - Config loads required keys; missing env errors.
  - Signature generation/verification; amount and orderId matching.
  - Build payment URL; parse callback payload.
- Integration
  - Return URL/IPN handlers: success, failure, tampered signature, replay attempts.
- Edge
  - Time tolerance; currency/locale differences; partial payment states.

## 8) Payments - PayOS

Modules: controllers/payosController.js, services/payos.service.js, routes/payos.routes.js

- Unit
  - Signature verify; event parsing; idempotency keys if present.
- Integration
  - Webhook handler: success/failure/tampered/replay; response codes.
- Edge
  - Out-of-order events; duplicate notifications.

## 9) Discounts & Flash Sales

Modules: controllers/discountController.js, services/discount.service.js, models/Discount.js, controllers/flashSaleController.js, services/flashSale.service.js, models/FlashSale.js

- Unit
  - Discount validation: percent/range/active windows; stackability with other promos.
  - Flash sale timing: active window detection; per-product overrides; get best price.
- Integration
  - Apply discount in cart/order flows; flash sale price on product detail/list.
- Edge
  - Overlapping discounts; expired promos; inventory reserved for sale.

## 10) Favourites

Modules: controllers/favouriteController.js, models/Favourite.js, routes/favouriteRoutes.js

- Unit
  - Add/remove favourite; duplicate prevention; max list size.
- Integration
  - GET/POST/DELETE endpoints; auth required.
- Edge
  - Product deleted; user deleted.

## 11) Feedback

Modules: controllers/feedbackController.js, middlewares/feedback.middleware.js, models/Feedback.js, routes/feedbackRoutes.js

- Unit
  - Validation middleware for ratings/comments; profanity filters if any.
  - Controller create/list per product/user.
- Integration
  - Submit feedback; aggregate stats; permissions to delete/update.
- Edge
  - Massive text; HTML/script inputs; duplicate reviews.

## 12) Reward Points

Modules: controllers/rewardPointController.js, services/rewardPoint.service.js, models/RewardPoint.js

- Unit
  - Accrual rules on orders; redemption rules and caps.
  - Balance calculation; expiration handling.
- Integration
  - Earn on order create; deduct on redemption.
- Edge
  - Negative balances; concurrent redemptions.

## 13) Store

Modules: controllers/storeController.js, services/store.service.js, models/Store.js

- Unit
  - Store CRUD; address/geo fields; opening hours validation.
- Integration
  - List/search; filter by location/availability.
- Edge
  - Invalid coordinates; duplicate store codes.

## 14) Blog & Comments

Modules: controllers/blogController.js, blogCommentController.js, models/Blog.js, BlogComment.js, routes/blogRoutes.js, blogCommentRoutes.js

- Unit
  - Blog CRUD; slug uniqueness; publish/unpublish.
  - Comment create/moderate; nesting (if any).
- Integration
  - Public list/detail; auth needed to post; moderation flags.
- Edge
  - Spam limits; very long posts/comments.

## 15) Livestream & Chat

Modules: controllers/livestreamController.js, services/livestream.service.js, services/livestreamSocket.service.js, controllers/chatController.js, models/LiveStream.js, LiveStreamChat.js, socket.js, routes/livestreamRoutes.js, chatRoutes.js

- Unit
  - livestream.service: handleChatMessage parsing; invalid payload; service error propagation.
  - livestreamSocket.service: room join/leave; emit events; guard invalid states.
- Integration
  - Socket connection lifecycle; message broadcast; auth room restrictions.
  - REST endpoints for streams and chats.
- Edge
  - High-frequency messages; large payloads; disconnect/reconnect handling.

## 16) Potential Orders & Detection

Modules: controllers/potentialOrderController.js, services/orderDetection.service.js, models/PotentialOrder.js, routes/potentialOrderRoutes.js

- Unit
  - analyzeMessage: extract size/color/quantity; ambiguous inputs; language variants.
  - savePotentialOrder; updateOrderStatus transitions.
- Integration
  - POST chat → potential order created; update flows.
- Edge
  - Duplicate detection; conflicting extractions; malformed messages.

## 17) Uploads & Media

Modules: middlewares/upload.middleware.js, config/cloudinary.js, routes/uploadRoutes.js

- Unit
  - File type/size limits; single vs multiple uploads; error forwarding.
  - Cloudinary config from env; missing keys handling.
- Integration
  - Upload endpoint with multipart; unauthorized access.
- Edge
  - Large files; fake mime types; network failures to provider.

## 18) Email

Modules: services/email.service.js, config/email.config.js, templates/email.templates.js, routes/emailRoutes.js

- Unit
  - Transport creation; invalid credentials error; template rendering with placeholders.
- Integration
  - Send templated email endpoint; input validation.
- Edge
  - Missing template data; attachments; rate limits.

## 19) AI & Try-on

Modules: routes/aiRoutes.js, routes/tryonRoutes.js, services/gemini.service.js

- Unit
  - Prompt building; API client stubs; error paths/timeouts.
- Integration
  - Route validation; auth where required.
- Edge
  - Oversized inputs; unsupported formats.

## 20) Dashboard & Reports

Modules: controllers/dashboardController.js, models/Report.js

- Unit
  - Metrics aggregation logic; date range filters; empty data handling.
- Integration
  - Authz: admin-only; query param validation.
- Edge
  - Large ranges; performance of aggregations (smoke).

## 21) Cross-cutting: Error Handling, Logger, Config

Modules: middlewares/error.middleware.js, utils/logger.js, utils/errorResponse.js, config/\*, utils/cronJobs.js

- Error middleware
  - Mongoose errors (CastError, ValidationError multiple/single), code=11000, JWT errors, custom ErrorResponse, fallback 500. Ensure logger.error called.
- Logger
  - Level defaults and LOG_LEVEL; winston formats; transports (Console, error.log, combined.log).
  - stream.write trim behavior; null/undefined/non-string handling.
- Config
  - database.js: connection success/fail; graceful shutdown.
  - cors.config.js: allowed origins/methods tested via supertest with Origin headers.
- Cron
  - Registration; handler invocation with fake timers; error logging.

## 22) Routing & App

Modules: app.js, routes/\*

- Integration
  - Route registration (sample endpoint per feature); 404 handler; middleware order (CORS → parsers → routes → error handler).
- Edge
  - Large JSON body; CORS preflight; invalid content-type.

## Test Data, Fixtures, and Utilities

- Factories for User, Product, Order, PotentialOrder.
- Common mocks: logger, mongoose models, payment SDKs, email transport.
- Helpers for auth token creation in tests.

## Execution

- Run unit with coverage:
  - PowerShell: npm run test -- --coverage
- Focused runs:
  - npx jest backend/tests/controllers/product.controller.test.js --coverage
- Socket tests
  - Use socket.io-client and Jest fake timers for lifecycle events.
