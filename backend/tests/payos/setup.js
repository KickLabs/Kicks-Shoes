/**
 * Test setup file for PayOS tests
 * @created 2025-01-27
 * @description Global test setup and configuration
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PAYOS_CLIENT_ID = 'test-client-id-123';
process.env.PAYOS_API_KEY = 'test-api-key-456';
process.env.PAYOS_CHECKSUM_KEY = 'test-checksum-key-789';
process.env.JWT_SECRET = 'test-jwt-secret';

// Suppress console logs during tests (optional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Global test timeout
jest.setTimeout(30000);

// Clean up after all tests
afterAll(async () => {
  // Add any global cleanup here
  await new Promise(resolve => setTimeout(resolve, 500));
});
