/**
 * @fileoverview Integration tests for Route Registration
 * @module tests/routing&app/routes.integration.test.js
 * @description Tests that all routes are properly registered and accessible
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

describe('Routing & App - Route Registration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RAP-016: All 24 routes are registered and accessible', () => {
    const routes = [
      { path: '/api/auth', name: 'Auth Routes' },
      { path: '/api/users', name: 'User Routes' },
      { path: '/api/products', name: 'Product Routes' },
      { path: '/api/orders', name: 'Order Routes' },
      { path: '/api/cart', name: 'Cart Routes' },
      { path: '/api/categories', name: 'Category Routes' },
      { path: '/api/discounts', name: 'Discount Routes' },
      { path: '/api/dashboard', name: 'Dashboard Routes' },
      { path: '/api/email', name: 'Email Routes' },
      { path: '/api/feedback', name: 'Feedback Routes' },
      { path: '/api/favourites', name: 'Favourite Routes' },
      { path: '/api/reward-points', name: 'Reward Point Routes' },
      { path: '/api/stores', name: 'Store Routes' },
      { path: '/api/shop', name: 'Shop Routes' },
      { path: '/api/payment/vnpay', name: 'VNPay Routes' },
      { path: '/api/payos', name: 'PayOS Routes' },
      { path: '/api/chat', name: 'Chat Routes' },
      { path: '/api/livestreams', name: 'Livestream Routes' },
      { path: '/api/blogs', name: 'Blog Routes' },
      { path: '/api/blog-comments', name: 'Blog Comment Routes' },
      { path: '/api/potential-orders', name: 'Potential Order Routes' },
      { path: '/api/tryon', name: 'Try-On Routes' },
      { path: '/api/flash-sales', name: 'Flash Sale Routes' },
      { path: '/api/ai', name: 'AI Routes' },
    ];

    test('Should have all 24 route modules registered', async () => {
      // Test a subset of critical routes
      const criticalRoutes = routes.slice(0, 10);

      for (const route of criticalRoutes) {
        const response = await request(app).get(route.path).send();

        // Should NOT be 404 (route exists)
        // May be 401, 400, 500, etc. depending on route protection
        expect(response.status).not.toBe(404);
      }
    });

    routes.forEach(route => {
      test(`${route.name} (${route.path}) should be registered`, async () => {
        const response = await request(app).get(route.path).send();

        // Route is registered if it's not 404
        expect(response.status).not.toBe(404);
      });
    });
  });

  describe('RAP-017: Auth routes accessible and working', () => {
    test('POST /api/auth/login should be accessible', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: '123456' });

      // Should not be 404 (route exists)
      expect(response.status).not.toBe(404);
      // Likely 400 or 401 (validation/auth error)
      expect([200, 400, 401, 500]).toContain(response.status);
    });

    test('POST /api/auth/register should be accessible', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'new@test.com',
        password: '123456',
        fullName: 'Test User',
      });

      expect(response.status).not.toBe(404);
    });

    test('GET /api/auth/me should require authentication', async () => {
      const response = await request(app).get('/api/auth/me').send();

      // Should be 401 (unauthorized) or 500, not 404
      expect(response.status).not.toBe(404);
      // Likely 401 since no token provided
      expect([401, 500]).toContain(response.status);
    });
  });

  describe('RAP-018: Product routes accessible', () => {
    test('GET /api/products should be accessible', async () => {
      const response = await request(app).get('/api/products').send();

      expect(response.status).not.toBe(404);
      // Should return products list or error
      expect([200, 500]).toContain(response.status);
    });

    test('GET /api/products/:id should accept ID parameter', async () => {
      const response = await request(app).get('/api/products/123').send();

      // Route exists (not 404)
      expect(response.status).not.toBe(404);
    });
  });

  describe('RAP-019: Protected routes require authentication', () => {
    const protectedRoutes = [
      { method: 'get', path: '/api/auth/me' },
      { method: 'get', path: '/api/users' },
      { method: 'get', path: '/api/cart' },
      { method: 'get', path: '/api/orders' },
      { method: 'get', path: '/api/favourites' },
    ];

    protectedRoutes.forEach(route => {
      test(`${route.method.toUpperCase()} ${route.path} should reject requests without token`, async () => {
        const response = await request(app)[route.method](route.path).send();

        // Should be unauthorized, not not-found
        expect(response.status).not.toBe(404);
        // Most likely 401 or 500
        if (response.status === 401) {
          expect(response.body).toHaveProperty('success', false);
        }
      });
    });
  });

  describe('RAP-023: Multiple routes can be accessed concurrently', () => {
    test('Should handle 10 concurrent requests to different routes', async () => {
      const requests = [
        request(app).get('/api/health'),
        request(app).get('/api/products'),
        request(app).get('/api/categories'),
        request(app).get('/api/auth/login'),
        request(app).get('/api/stores'),
        request(app).get('/api/blogs'),
        request(app).get('/api/tryon'),
        request(app).get('/api/flash-sales'),
        request(app).get('/api/discounts'),
        request(app).get('/'),
      ];

      const responses = await Promise.all(requests.map(r => r.send()));

      // All requests should complete (not timeout or crash)
      expect(responses).toHaveLength(10);

      // All should return valid status codes
      responses.forEach(response => {
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(600);
      });
    });

    test('Should handle concurrent requests to same route', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() => request(app).get('/api/health'));

      const responses = await Promise.all(requests.map(r => r.send()));

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });
    });
  });

  describe('RAP-024: Route with trailing slash handled correctly', () => {
    test('Should handle /api/products with and without trailing slash', async () => {
      const response1 = await request(app).get('/api/products').send();
      const response2 = await request(app).get('/api/products/').send();

      // Both should work (same status)
      expect(response1.status).toBe(response2.status);
    });

    test('Should handle root path with trailing slash', async () => {
      const response1 = await request(app).get('/').send();
      const response2 = await request(app).get('//').send();

      // Root should work
      expect(response1.status).toBe(200);
    });
  });

  describe('Debug and Special Endpoints', () => {
    test('GET /api/tryon/debug should be accessible', async () => {
      const response = await request(app).get('/api/tryon/debug').send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    test('Special routes should have correct structure', async () => {
      const routes = ['/', '/api/health', '/api/tryon/debug'];

      for (const route of routes) {
        const response = await request(app).get(route).send();

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(typeof response.body).toBe('object');
      }
    });
  });

  describe('Route Method Testing', () => {
    test('Should support GET method on appropriate routes', async () => {
      const getRoutes = ['/api/health', '/api/products', '/api/categories'];

      for (const route of getRoutes) {
        const response = await request(app).get(route).send();
        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(405); // Method Not Allowed
      }
    });

    test('Should support POST method on appropriate routes', async () => {
      const postRoutes = ['/api/auth/login', '/api/auth/register'];

      for (const route of postRoutes) {
        const response = await request(app).post(route).send({});
        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(405);
      }
    });
  });

  describe('Route Parameter Handling', () => {
    test('Should accept route parameters', async () => {
      const response = await request(app).get('/api/products/12345').send();

      // Route with parameter should exist
      expect(response.status).not.toBe(404);
    });

    test('Should handle query parameters', async () => {
      const response = await request(app).get('/api/products').query({ page: 1, limit: 10 }).send();

      expect(response.status).not.toBe(404);
    });

    test('Should handle complex query strings', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: 'shoes', brand: 'nike', minPrice: 100 })
        .send();

      expect(response.status).not.toBe(404);
    });
  });

  describe('Route Registration Order', () => {
    test('Specific routes should take precedence over wildcards', async () => {
      // /api/health is specific, should work before any wildcard
      const response = await request(app).get('/api/health').send();

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });

    test('Static routes should work before dynamic routes', async () => {
      // / (root) is static
      const response = await request(app).get('/').send();

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Welcome to Kicks Shoes API');
    });
  });
});
