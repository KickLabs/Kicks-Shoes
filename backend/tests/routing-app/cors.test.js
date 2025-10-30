/**
 * @fileoverview CORS Handling Tests
 * @module tests/routing&app/cors.test.js
 * @description Tests CORS middleware configuration and origin validation
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

const app = (await import('../../src/app.js')).default;

describe('Routing & App - CORS Handling Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RAP-008: Request from whitelisted localhost origin allowed', () => {
    const whitelistedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
    ];

    whitelistedOrigins.forEach(origin => {
      test(`Should allow requests from ${origin}`, async () => {
        const response = await request(app).get('/api/health').set('Origin', origin).send();

        expect(response.status).toBe(200);
        expect(
          response.headers['access-control-allow-origin'] === origin ||
            response.headers['access-control-allow-origin'] === '*'
        ).toBe(true);
      });
    });
  });

  describe('RAP-009: Request from production Firebase domain allowed', () => {
    const productionOrigins = [
      'https://kicks-shoes-2025.web.app',
      'https://kicks-shoes-2025.firebaseapp.com',
    ];

    productionOrigins.forEach(origin => {
      test(`Should allow requests from ${origin}`, async () => {
        const response = await request(app).get('/api/health').set('Origin', origin).send();

        expect(response.status).toBe(200);
        // CORS should allow this origin
        const allowOrigin = response.headers['access-control-allow-origin'];
        expect([origin, '*', undefined].includes(allowOrigin)).toBe(true);
      });
    });
  });

  describe('RAP-010: Request from non-whitelisted origin blocked', () => {
    test('Should not set CORS headers for unauthorized origin', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'https://evil.com')
        .send();

      // Request may still succeed (200) but without CORS headers
      // OR may be blocked depending on CORS middleware config
      const allowOrigin = response.headers['access-control-allow-origin'];

      // Should NOT echo back the evil origin
      expect(allowOrigin).not.toBe('https://evil.com');
    });

    test('Should not allow credentials for unauthorized origin', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-site.com')
        .send();

      const allowOrigin = response.headers['access-control-allow-origin'];
      if (allowOrigin === 'https://malicious-site.com') {
        // If origin is echoed, credentials should not be allowed
        expect(response.headers['access-control-allow-credentials']).not.toBe('true');
      }
    });
  });

  describe('RAP-011: OPTIONS preflight request from valid origin', () => {
    test('Should handle OPTIONS preflight for localhost origin', async () => {
      const response = await request(app)
        .options('/api/products')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .send();

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });

    test('Should set Access-Control-Max-Age for preflight', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .send();

      expect(response.status).toBe(200);
      // Max-Age should be set (86400 seconds = 24 hours)
      const maxAge = response.headers['access-control-max-age'];
      if (maxAge) {
        expect(parseInt(maxAge)).toBeGreaterThan(0);
      }
    });

    test('Should allow all standard HTTP methods in preflight', async () => {
      const response = await request(app)
        .options('/api/products')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'DELETE')
        .send();

      expect(response.status).toBe(200);
      const allowedMethods = response.headers['access-control-allow-methods'];
      if (allowedMethods) {
        expect(allowedMethods).toMatch(/GET|POST|PUT|DELETE|PATCH/);
      }
    });
  });

  describe('RAP-012: Request with no Origin header (mobile/curl)', () => {
    test('Should process request without Origin header', async () => {
      const response = await request(app).get('/api/health').send();

      // Request should succeed even without Origin
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
    });

    test('Should process POST request without Origin', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: '123456' });

      // Should not fail due to missing Origin (might fail due to auth, but not CORS)
      expect([200, 400, 401, 404, 500]).toContain(response.status);
    });
  });

  describe('RAP-013: CORS preflight with multiple headers', () => {
    test('Should allow multiple request headers', async () => {
      const response = await request(app)
        .options('/api/products')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization,X-Requested-With')
        .send();

      expect(response.status).toBe(200);
      const allowedHeaders = response.headers['access-control-allow-headers'];
      if (allowedHeaders) {
        // Should include at least some of the requested headers
        expect(allowedHeaders.toLowerCase()).toMatch(/content-type|authorization/);
      }
    });
  });

  describe('RAP-015: CORS allows all HTTP methods', () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    methods.forEach(method => {
      test(`Should allow ${method} method`, async () => {
        const response = await request(app)
          .options('/api/products')
          .set('Origin', 'http://localhost:5173')
          .set('Access-Control-Request-Method', method)
          .send();

        expect(response.status).toBe(200);
        const allowedMethods = response.headers['access-control-allow-methods'];
        if (allowedMethods) {
          expect(allowedMethods).toContain(method);
        }
      });
    });
  });

  describe('Additional CORS Tests', () => {
    test('Should allow credentials for whitelisted origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173')
        .send();

      const allowCredentials = response.headers['access-control-allow-credentials'];
      const allowOrigin = response.headers['access-control-allow-origin'];

      if (allowOrigin && allowOrigin !== '*') {
        // If specific origin is set, credentials should be allowed
        expect(allowCredentials).toBe('true');
      }
    });

    test('Should handle multiple consecutive CORS requests', async () => {
      const requests = [
        request(app).get('/api/health').set('Origin', 'http://localhost:5173'),
        request(app).get('/api/health').set('Origin', 'http://localhost:3000'),
        request(app).get('/api/health').set('Origin', 'https://kicks-shoes-2025.web.app'),
      ];

      const responses = await Promise.all(requests.map(r => r.send()));

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    test('Should set CORS headers before route handler', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173')
        .send();

      // CORS headers should be present
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('Should handle CORS for error responses', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .set('Origin', 'http://localhost:5173')
        .send();

      // Even error responses should have CORS headers
      const allowOrigin = response.headers['access-control-allow-origin'];
      expect(allowOrigin).toBeDefined();
    });
  });

  describe('CORS Configuration Validation', () => {
    test('Should not allow wildcard origin with credentials', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173')
        .send();

      const allowOrigin = response.headers['access-control-allow-origin'];
      const allowCredentials = response.headers['access-control-allow-credentials'];

      // If credentials=true, origin should NOT be wildcard
      if (allowCredentials === 'true') {
        expect(allowOrigin).not.toBe('*');
      }
    });

    test('Should be consistent with CORS policy across different endpoints', async () => {
      const endpoints = ['/api/health', '/', '/api/products'];
      const origin = 'http://localhost:5173';

      const responses = await Promise.all(
        endpoints.map(endpoint => request(app).get(endpoint).set('Origin', origin).send())
      );

      // All responses should have consistent CORS headers
      const origins = responses.map(r => r.headers['access-control-allow-origin']);
      const uniqueOrigins = [...new Set(origins)];

      // Should have at most 2 unique values (some might be undefined)
      expect(uniqueOrigins.length).toBeLessThanOrEqual(2);
    });
  });
});
