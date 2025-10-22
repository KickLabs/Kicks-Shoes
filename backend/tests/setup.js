/**
 * Jest Setup File
 * This file runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRE = '1h';
process.env.MONGODB_URI = 'mongodb://localhost:27017/kicks-shoes';

// Cấu hình để xử lý ES modules
process.env.NODE_OPTIONS = '--experimental-vm-modules';

// Note: jest.setTimeout() should be called inside test files, not in setup
// Individual tests can set their own timeout if needed

// Import models to ensure they are registered with mongoose
import '../src/models/LiveStream.js';
import '../src/models/PotentialOrder.js';
import '../src/models/Product.js';
import '../src/models/User.js';

// Mock mongoose to prevent database connection attempts
// This runs before jest is fully initialized, so we use global mocking
global.beforeEach = global.beforeEach || (() => {});
global.afterEach = global.afterEach || (() => {});
