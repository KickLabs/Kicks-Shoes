/**
 * Jest Setup File
 * This file runs before all tests
 */

// ========================================
// ENVIRONMENT VARIABLES FOR TESTING
// ========================================
process.env.NODE_ENV = 'test';

// JWT Configuration
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRE = '1h';
process.env.JWT_EXPIRES_IN = '1d';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-testing';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.JWT_VERIFY_EXPIRES_IN = '1h';

// Database Configuration
process.env.MONGODB_URI = 'mongodb://localhost:27017/kicks-shoes-test';

// Frontend URL (for email verification, password reset)
process.env.FRONTEND_URL = 'http://localhost:3000';

// Email Configuration (mock in tests)
process.env.EMAIL_FROM = 'test@kicks-shoes.com';
process.env.EMAIL_HOST = 'smtp.test.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test-user';
process.env.EMAIL_PASSWORD = 'test-password';

// Cấu hình để xử lý ES modules
process.env.NODE_OPTIONS = '--experimental-vm-modules';

// ========================================
// GLOBAL TEST CONFIGURATION
// ========================================

// Set default timeout for all tests (can be overridden in individual tests)
// Note: jest.setTimeout() should be called inside test files for specific tests

// Suppress console logs during tests (optional - comment out if you need to debug)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// ========================================
// MOCK SETUP
// ========================================
// Import models to ensure they are registered with mongoose
import '../src/models/Category.js';
import '../src/models/LiveStream.js';
import '../src/models/PotentialOrder.js';
import '../src/models/Product.js';
import '../src/models/User.js';

// Mock mongoose to prevent database connection attempts
// This runs before jest is fully initialized, so we use global mocking
global.beforeEach = global.beforeEach || (() => {});
global.afterEach = global.afterEach || (() => {});

// Note: Model imports are handled in individual test files with jest.unstable_mockModule()
// This prevents actual database connections during tests
