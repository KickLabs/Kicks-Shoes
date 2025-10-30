/**
 * @fileoverview Test setup for Routing & App tests
 * @module tests/routing&app/setup.js
 * @description Setup and teardown for Routing & App test suite
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.MONGODB_URI = 'mongodb://localhost:27017/kicks-shoes-test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-routing-app-tests';

// Mock console methods to reduce noise in test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  // Suppress console.log in tests
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Global test utilities
global.testUtils = {
  // Helper to create mock request
  createMockRequest: (overrides = {}) => ({
    method: 'GET',
    path: '/',
    headers: {},
    body: {},
    params: {},
    query: {},
    ...overrides,
  }),

  // Helper to create mock response
  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
    return res;
  },

  // Helper to create mock next function
  createMockNext: () => jest.fn(),

  // Valid origins for CORS testing
  validOrigins: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://kicks-shoes-2025.web.app',
    'https://kicks-shoes-2025.firebaseapp.com',
  ],

  // Invalid origin for negative testing
  invalidOrigin: 'https://evil.com',
};
