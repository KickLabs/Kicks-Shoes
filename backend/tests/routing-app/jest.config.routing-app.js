/**
 * Jest configuration for Routing & App tests
 * @created 2025-10-30
 */

export default {
  // Root directory
  rootDir: '../../',

  // Use node environment
  testEnvironment: 'node',

  // Use ESM
  preset: null,
  transform: {},

  // Test match patterns - only Routing & App tests
  testMatch: ['**/tests/routing-app/**/*.test.js'],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage/routing-app',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Collect coverage from app.js, middleware, and config files
  collectCoverageFrom: [
    'src/app.js',
    'src/middlewares/error.middleware.js',
    'src/config/cors.config.js',
    'src/routes/**/*.js',
  ],

  // Coverage thresholds - must meet 85% minimum
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
    },
  },

  // Module paths
  moduleDirectories: ['node_modules', 'src'],

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/coverage/', '/dist/'],

  // Verbose output
  verbose: true,

  // Timeout for tests (30 seconds for integration tests)
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Module name mapper for ESM
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Globals
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/routing-app/setup.js'],
};
