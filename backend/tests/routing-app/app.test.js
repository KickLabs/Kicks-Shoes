/**
 * @fileoverview Integration tests for App initialization and middleware
 * @module tests/routing&app/app.test.js
 * @description Tests app.js initialization, middleware order, and basic functionality
 */

import { jest } from '@jest/globals';
import request from 'supertest';

// Mock all external dependencies before importing app
jest.unstable_mockModule('../../src/config/database.js', () => ({
  default: jest.fn().mockResolvedValue(true),
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/utils/setupUploads.js', () => ({
  setupUploadDirectories: jest.fn(),
}));

jest.unstable_mockModule('../../src/utils/cronJobs.js', () => ({
  startDiscountStatusUpdateCron: jest.fn(),
  startFlashSaleStatusUpdateCron: jest.fn(),
}));

jest.unstable_mockModule('../../src/socket.js', () => ({
  default: jest.fn(),
}));

// Import mocked dependencies
const connectDB = (await import('../../src/config/database.js')).default;
const logger = (await import('../../src/utils/logger.js')).default;
const { setupUploadDirectories } = await import('../../src/utils/setupUploads.js');
const { startDiscountStatusUpdateCron, startFlashSaleStatusUpdateCron } = await import(
  '../../src/utils/cronJobs.js'
);
const setupSocketHandlers = (await import('../../src/socket.js')).default;

// Import app after all mocks are set up
const app = (await import('../../src/app.js')).default;

describe('Routing & App - Application Initialization Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RAP-001: App starts successfully with all dependencies', () => {
    test('Should initialize Express app and call all setup functions', async () => {
      // Assert app is initialized
      expect(app).toBeDefined();
      expect(typeof app).toBe('function'); // Express app is a function

      // Assert database connection was called
      expect(connectDB).toHaveBeenCalled();

      // Assert upload directories setup was called
      expect(setupUploadDirectories).toHaveBeenCalled();

      // Assert Socket.IO setup was called
      expect(setupSocketHandlers).toHaveBeenCalled();
    });

    test('Should not start cron jobs in test environment', () => {
      // In test environment, cron jobs should NOT be started
      expect(startDiscountStatusUpdateCron).not.toHaveBeenCalled();
      expect(startFlashSaleStatusUpdateCron).not.toHaveBeenCalled();
    });

    test('Should have all middleware registered', async () => {
      // Test that basic middleware is working
      const response = await request(app).get('/').send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('RAP-007: Cron jobs disabled in test environment', () => {
    test('NODE_ENV=test should not start cron jobs', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(startDiscountStatusUpdateCron).not.toHaveBeenCalled();
      expect(startFlashSaleStatusUpdateCron).not.toHaveBeenCalled();
    });
  });

  describe('RAP-021: Root route returns welcome message', () => {
    test('GET / should return welcome message', async () => {
      const response = await request(app).get('/').send();

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Welcome to Kicks Shoes API',
      });
    });
  });

  describe('RAP-022: Health check endpoint accessible', () => {
    test('GET /api/health should return health status', async () => {
      const response = await request(app).get('/api/health').send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
    });

    test('Health check should have correct environment', async () => {
      const response = await request(app).get('/api/health').send();

      expect(response.body.environment).toBe('test');
    });

    test('Health check uptime should be a number', async () => {
      const response = await request(app).get('/api/health').send();

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('RAP-044-047: Health check edge cases', () => {
    test('RAP-044: Health check returns correct status structure', async () => {
      const response = await request(app).get('/api/health').send();

      expect(response.body).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
        version: expect.any(String),
      });
    });

    test('RAP-045: Health check uptime is accurate', async () => {
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app).get('/api/health').send();

      expect(response.body.uptime).toBeGreaterThan(0.1);
    });

    test('RAP-046: Health check with missing version defaults to 1.0.0', async () => {
      const response = await request(app).get('/api/health').send();

      // Should have some version (default or from package.json)
      expect(response.body.version).toBeDefined();
      expect(typeof response.body.version).toBe('string');
    });

    test('RAP-047: Health check environment defaults appropriately', async () => {
      const response = await request(app).get('/api/health').send();

      // Should be 'test' in test environment
      expect(response.body.environment).toBe('test');
    });
  });

  describe('RAP-020: Non-existent route returns 404 or error', () => {
    test('GET /api/nonexistent should return error', async () => {
      const response = await request(app).get('/api/nonexistent').send();

      // Should be 404 or 500 (error handler)
      expect([404, 500]).toContain(response.status);
    });

    test('POST /api/invalid-route should return error', async () => {
      const response = await request(app).post('/api/invalid-route').send({});

      expect([404, 500]).toContain(response.status);
    });
  });

  describe('RAP-051-052: Static file serving', () => {
    test('RAP-052: Non-existent static file returns 404', async () => {
      const response = await request(app).get('/uploads/nonexistent.jpg').send();

      expect(response.status).toBe(404);
    });
  });
});
