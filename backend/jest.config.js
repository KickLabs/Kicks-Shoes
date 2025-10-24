/**
 * Jest Configuration for ESM
 * @see https://jestjs.io/docs/configuration
 */
export default {
  // Use node environment for testing
  testEnvironment: 'node',

  // Coverage configuration - chỉ collect coverage từ Order in Livestream feature
  collectCoverageFrom: [
    'src/services/orderDetection.service.js', // Order detection service
    'src/services/livestream.service.js', // Livestream service
    'src/services/livestreamSocket.service.js', // Livestream socket service
    'src/models/PotentialOrder.js', // Potential order model
    'src/models/LiveStream.js', // LiveStream model
    'src/models/LiveStreamChat.js', // LiveStream chat model
    'src/controllers/livestreamController.js', // Livestream controller
    'src/controllers/potentialOrderController.js', // Potential order controller
    '!src/app.js', // Exclude main app file
    '!src/socket.js', // Exclude socket file
    '!src/config/**', // Exclude config files
    '!src/templates/**', // Exclude email templates
    '!src/vnpay/**', // Exclude vnpay
    '!src/controllers/authController.js', // Exclude auth
    '!src/controllers/userController.js', // Exclude user
    '!src/controllers/productController.js', // Exclude product
    '!src/controllers/orderController.js', // Exclude order
    '!src/controllers/cartController.js', // Exclude cart
    '!src/controllers/categoryController.js', // Exclude category
    '!src/controllers/discountController.js', // Exclude discount
    '!src/controllers/flashSaleController.js', // Exclude flash sale
    '!src/controllers/favouriteController.js', // Exclude favourite
    '!src/controllers/feedbackController.js', // Exclude feedback
    '!src/controllers/rewardPointController.js', // Exclude reward point
    '!src/controllers/storeController.js', // Exclude store
    '!src/controllers/blogController.js', // Exclude blog
    '!src/controllers/blogCommentController.js', // Exclude blog comment
    '!src/controllers/chatController.js', // Exclude chat
    '!src/controllers/dashboardController.js', // Exclude dashboard
    '!src/controllers/payosController.js', // Exclude payos
    '!src/controllers/vnpayController.js', // Exclude vnpay
    '!src/services/auth.service.js', // Exclude auth service
    '!src/services/user.service.js', // Exclude user service
    '!src/services/product.service.js', // Exclude product service
    '!src/services/order.service.js', // Exclude order service
    '!src/services/cart.service.js', // Exclude cart service
    '!src/services/category.service.js', // Exclude category service
    '!src/services/discount.service.js', // Exclude discount service
    '!src/services/flashSale.service.js', // Exclude flash sale service
    '!src/services/favourite.service.js', // Exclude favourite service
    '!src/services/feedback.service.js', // Exclude feedback service
    '!src/services/rewardPoint.service.js', // Exclude reward point service
    '!src/services/store.service.js', // Exclude store service
    '!src/services/blog.service.js', // Exclude blog service
    '!src/services/blogComment.service.js', // Exclude blog comment service
    '!src/services/chat.service.js', // Exclude chat service
    '!src/services/email.service.js', // Exclude email service
    '!src/services/otp.service.js', // Exclude otp service
    '!src/services/payos.service.js', // Exclude payos service
    '!src/services/vnpay.service.js', // Exclude vnpay service
    '!src/models/User.js', // Exclude user model
    '!src/models/Product.js', // Exclude product model
    '!src/models/Order.js', // Exclude order model
    '!src/models/Cart.js', // Exclude cart model
    '!src/models/Category.js', // Exclude category model
    '!src/models/Discount.js', // Exclude discount model
    '!src/models/FlashSale.js', // Exclude flash sale model
    '!src/models/Favourite.js', // Exclude favourite model
    '!src/models/Feedback.js', // Exclude feedback model
    '!src/models/RewardPoint.js', // Exclude reward point model
    '!src/models/Store.js', // Exclude store model
    '!src/models/Blog.js', // Exclude blog model
    '!src/models/BlogComment.js', // Exclude blog comment model
    '!src/models/Message.js', // Exclude message model
    '!src/models/Conversation.js', // Exclude conversation model
    '!src/models/Refund.js', // Exclude refund model
    '!src/models/Report.js', // Exclude report model
    '!src/models/TokenBlacklist.js', // Exclude token blacklist model
    '!src/models/OrderItem.js', // Exclude order item model
    '!src/utils/**', // Exclude utils
  ],

  // Coverage thresholds (optional - uncomment to enforce)
  // coverageThreshold: {
  //   global: {
  //     branches: 70,
  //     functions: 70,
  //     lines: 70,
  //     statements: 70,
  //   },
  // },

  // Test match patterns - Tìm tất cả file test trong thư mục tests/
  testMatch: ['<rootDir>/tests/**/*.test.js', '<rootDir>/tests/**/*.spec.js'],

  // Transform ESM modules
  transform: {},

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Module name mapping for ES modules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    // Map email config to a safe mock to avoid real env requirements in unit tests
    '^../config/email.config.js$': '<rootDir>/tests/mocks/email.config.mock.js',
    '^@/config/email.config.js$': '<rootDir>/tests/mocks/email.config.mock.js',
    // Map middleware and utils to mocks
    '^../middlewares/async.middleware.js$': '<rootDir>/tests/mocks/asyncHandler.mock.js',
    '^../utils/errorResponse.js$': '<rootDir>/tests/mocks/errorResponse.mock.js',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Maximum number of concurrent workers
  maxWorkers: '50%',

  // Test timeout (ms)
  testTimeout: 30000,

  // ESM support - removed extensionsToTreatAsEsm as it conflicts with package.json type: "module"

  // Bổ sung cấu hình để chạy tất cả test suites
  testPathIgnorePatterns: ['/node_modules/', '/coverage/', '/logs/', '/uploads/'],

  // Chạy tất cả test files, không bỏ qua file nào
  onlyChanged: false,

  // Hiển thị thông tin chi tiết về test suites
  displayName: 'Kicks Shoes Backend Tests',

  // Cấu hình để chạy test theo thứ tự
  testSequencer: '@jest/test-sequencer',

  // Cấu hình để xử lý ES modules từ node_modules
  transformIgnorePatterns: ['node_modules/(?!(parse5|jsdom|@testing-library)/)'],

  // Cấu hình globals cho Jest
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};
