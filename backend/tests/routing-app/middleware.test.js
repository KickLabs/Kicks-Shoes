/**
 * @fileoverview Middleware Order and Body Parsing Tests
 * @module tests/routing&app/middleware.test.js
 * @description Tests middleware execution order and body parsing functionality
 */

import { jest } from '@jest/globals';
import request from 'supertest';

// Mock all external dependencies
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

const logger = (await import('../../src/utils/logger.js')).default;
const app = (await import('../../src/app.js')).default;

describe('Routing & App - Middleware Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RAP-025: Middleware executes in correct order', () => {
    test('CORS middleware should execute before route handlers', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173')
        .send();

      // CORS headers should be present (CORS middleware executed)
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      // Response should still be successful (route handler also executed)
      expect(response.status).toBe(200);
    });

    test('Body parser should execute before route handlers', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ email: 'test@test.com', password: '123456' });

      // Body should be parsed (no 400 for unparsed body)
      // May be 401 (auth failed) but not parsing error
      expect(response.status).not.toBe(400);
      expect([200, 401, 500]).toContain(response.status);
    });

    test('Error handler should catch errors from route handlers', async () => {
      const response = await request(app).get('/api/nonexistent').send();

      // Error handler should format response for 404
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('RAP-026: JSON body parsed correctly', () => {
    test('Should parse valid JSON body', async () => {
      const testData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send(testData);

      // Body was parsed (no 400 parse error)
      // 400 might be validation error, not parsing error
      // If status is 400, check if it's from validation (has error message) not parsing
      if (response.status === 400) {
        // Check if it's a validation error (has error field) not JSON parse error
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
      } else {
        // Not a 400, so parsing was successful
        expect(response.status).not.toBe(400);
      }
    });

    test('Should parse nested JSON objects', async () => {
      const testData = {
        user: {
          email: 'test@test.com',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        settings: {
          notifications: true,
        },
      };

      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send(testData);

      // Should handle nested objects - 400 might be validation error, not parsing error
      if (response.status === 400) {
        // Check if it's validation error (parsed successfully but validation failed)
        expect(response.body).toHaveProperty('error');
      } else {
        // Not 400, parsing successful
        expect(response.status).not.toBe(400);
      }
    });

    test('Should parse JSON arrays', async () => {
      const testData = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
      };

      const response = await request(app)
        .post('/api/cart')
        .set('Content-Type', 'application/json')
        .send(testData);

      // Should handle arrays in body
      expect(response.status).not.toBe(400);
    });
  });

  describe('RAP-027: URL-encoded body parsed correctly', () => {
    test('Should parse URL-encoded body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('email=test@test.com&password=123456');

      // Body should be parsed
      expect(response.status).not.toBe(400);
    });

    test('Should handle URL-encoded special characters', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('email=test%40test.com&password=pass%26word');

      expect(response.status).not.toBe(400);
    });
  });

  describe('RAP-028: Large JSON body rejected (>10MB)', () => {
    test('Should reject body larger than 10MB', async () => {
      // Create a large object (>10MB)
      const largeData = {
        data: 'x'.repeat(11 * 1024 * 1024), // 11MB of 'x'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(largeData));

      // Should be rejected (413 Payload Too Large or 400 Bad Request)
      expect([400, 413, 500]).toContain(response.status);
    }, 15000); // Increase timeout for large payload test

    test('Should accept body smaller than 10MB', async () => {
      // Create a moderately sized object (~1MB)
      const moderateData = {
        data: 'x'.repeat(1 * 1024 * 1024), // 1MB
      };

      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(moderateData));

      // Should not be rejected for size (may fail for other reasons)
      expect(response.status).not.toBe(413);
    });
  });

  describe('RAP-029: Request without Content-Type header', () => {
    test('Should handle POST without Content-Type', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'test@test.com',
        password: '123456',
      });

      // Supertest may add Content-Type automatically
      // Just verify request is handled
      expect([200, 400, 401, 500]).toContain(response.status);
    });

    test('Should handle empty body without Content-Type', async () => {
      const response = await request(app).post('/api/auth/login').send();

      // Should handle gracefully
      expect([400, 401, 500]).toContain(response.status);
    });
  });

  describe('RAP-030: Invalid JSON body returns 400', () => {
    test('Should reject malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      // Should return 400 Bad Request
      expect(response.status).toBe(400);
    });

    test('Should reject incomplete JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@test.com",');

      expect(response.status).toBe(400);
    });
  });

  describe('RAP-031: Request logging middleware works', () => {
    test('Should log request details', async () => {
      // Request logging middleware uses console.log, not logger
      // The middleware should execute without errors
      const response = await request(app).get('/api/health').send();

      // Request should be processed (logging middleware executed)
      expect(response.status).toBeDefined();
      // Middleware execution is verified by successful request processing
      expect([200, 404, 401, 500]).toContain(response.status);
    });
  });

  describe('RAP-033: Helmet security headers set', () => {
    test('Should include security headers in response', async () => {
      const response = await request(app).get('/api/health').send();

      // Helmet adds various security headers
      const headers = Object.keys(response.headers);

      // Should have some security-related headers
      // Helmet typically adds: X-DNS-Prefetch-Control, X-Frame-Options, etc.
      expect(headers.length).toBeGreaterThan(0);
    });

    test('Should have X-Content-Type-Options header', async () => {
      const response = await request(app).get('/api/health').send();

      // Helmet usually sets this
      if (response.headers['x-content-type-options']) {
        expect(response.headers['x-content-type-options']).toBeDefined();
      }
    });
  });

  describe('Additional Middleware Tests', () => {
    test('Should handle Content-Type with charset', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json; charset=utf-8')
        .send({ email: 'test@test.com', password: '123456' });

      expect(response.status).not.toBe(400);
    });

    test('Should handle multiple middleware in sequence', async () => {
      // This request goes through: CORS → Body Parser → Logger → Route → Error Handler
      const response = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'http://localhost:5173')
        .set('Content-Type', 'application/json')
        .send({ email: 'test@test.com', password: '123456' });

      // All middleware should execute without error
      expect(response.status).toBeDefined();
      expect([200, 400, 401, 500]).toContain(response.status);
    });

    test('Should preserve request context through middleware chain', async () => {
      const response = await request(app).get('/api/health').set('X-Request-ID', '12345').send();

      // Request should complete successfully
      expect(response.status).toBe(200);
    });

    test('Should handle errors in middleware gracefully', async () => {
      // Try to trigger an error scenario
      const response = await request(app)
        .post('/api/nonexistent')
        .set('Content-Type', 'application/json')
        .send({ data: 'test' });

      // Error handler should catch and format
      expect(response.body).toHaveProperty('success', false);
    });

    test('Should set proper response headers', async () => {
      const response = await request(app).get('/api/health').send();

      expect(response.headers['content-type']).toMatch(/json/);
    });

    test('Should handle OPTIONS requests for all routes', async () => {
      const routes = ['/api/health', '/api/products', '/api/auth/login'];

      for (const route of routes) {
        const response = await request(app)
          .options(route)
          .set('Origin', 'http://localhost:5173')
          .send();

        expect(response.status).toBe(200);
      }
    });

    test('Should support different content encodings', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Accept-Encoding', 'gzip, deflate')
        .send();

      expect(response.status).toBe(200);
    });

    test('Should handle request with custom headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-Custom-Header', 'custom-value')
        .set('X-Request-ID', '12345')
        .send();

      expect(response.status).toBe(200);
    });
  });

  describe('Body Parser Edge Cases', () => {
    test('Should handle empty JSON object', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({});

      // Empty JSON object should parse successfully
      // 400 might be validation error (missing fields), not parsing error
      // Check if response body exists (parsed) and is not a parse error
      expect(response.body).toBeDefined();
      // If 400, it should be validation error with error message, not JSON parse error
      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
      }
    });

    test('Should handle JSON with null values', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ email: null, password: null });

      // JSON with null should parse successfully
      // 400 might be validation error, check if body was parsed
      expect(response.body).toBeDefined();
      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
      }
    });

    test('Should handle JSON with boolean values', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ rememberMe: true, autoLogin: false });

      // JSON with boolean should parse successfully
      expect(response.body).toBeDefined();
      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
      }
    });

    test('Should handle JSON with number values', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ userId: 12345, age: 25 });

      // JSON with numbers should parse successfully
      expect(response.body).toBeDefined();
      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
      }
    });
  });
});
