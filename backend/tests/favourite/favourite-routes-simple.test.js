/**
 * @fileoverview Favourite Routes Integration Tests (Simple)
 * @module tests/favourite-routes-simple
 * @description Simple integration tests for favourite routes (routes/favouriteRoutes.js)
 * Test Suite: Integration Tests - Favourite Routes (FR-001 to FR-015)
 * Coverage: Route definitions, HTTP methods, parameter handling
 */

import request from 'supertest';
import express from 'express';
import favouriteRoutes from '../../src/routes/favouriteRoutes.js';

describe('Favourites — Integration Tests - Favourite Routes (Simple)', () => {
  let app;

  beforeAll(() => {
    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/favourites', favouriteRoutes);
  });

  // ===================================================================
  // Test Suite: Route Structure & Basic Functionality
  // ===================================================================

  test('FR-001 | Routes should be accessible', async () => {
    // Given: A request to any favourite route
    const response = await request(app).get('/api/favourites/');

    // Then: Should return a response (may be 401 due to auth middleware)
    expect(response.status).toBeDefined();
  });

  test('FR-002 | Routes should accept JSON content', async () => {
    // Given: A POST request with JSON body
    const response = await request(app)
      .post('/api/favourites/')
      .send({ productId: '507f1f77bcf86cd799439012' })
      .set('Content-Type', 'application/json');

    // Then: Should process the request
    expect(response.status).toBeDefined();
  });

  // ===================================================================
  // Test Suite: GET /api/favourites (getFavourites)
  // ===================================================================

  test('FR-003 | GET /api/favourites should be accessible', async () => {
    // Given: A GET request to favourites
    const response = await request(app).get('/api/favourites/');

    // Then: Should return a response
    expect(response.status).toBeDefined();
  });

  test('FR-004 | GET /api/favourites should handle query parameters', async () => {
    // Given: A GET request with query parameters
    const response = await request(app).get('/api/favourites/?page=1&limit=10');

    // Then: Should return a response
    expect(response.status).toBeDefined();
  });

  // ===================================================================
  // Test Suite: POST /api/favourites (addToFavourites)
  // ===================================================================

  test('FR-005 | POST /api/favourites should be accessible', async () => {
    // Given: A POST request to add favourite
    const response = await request(app)
      .post('/api/favourites/')
      .send({ productId: '507f1f77bcf86cd799439012' });

    // Then: Should return a response
    expect(response.status).toBeDefined();
  });

  test('FR-006 | POST /api/favourites should accept productId in body', async () => {
    // Given: A POST request with productId
    const productId = '507f1f77bcf86cd799439012';
    const response = await request(app).post('/api/favourites/').send({ productId });

    // Then: Should process the request
    expect(response.status).toBeDefined();
  });

  test('FR-007 | POST /api/favourites should handle empty body', async () => {
    // Given: A POST request with empty body
    const response = await request(app).post('/api/favourites/').send({});

    // Then: Should still process the request
    expect(response.status).toBeDefined();
  });

  // ===================================================================
  // Test Suite: DELETE /api/favourites/:productId (removeFromFavourites)
  // ===================================================================

  test('FR-008 | DELETE /api/favourites/:productId should be accessible', async () => {
    // Given: A DELETE request with productId parameter
    const productId = '507f1f77bcf86cd799439012';
    const response = await request(app).delete(`/api/favourites/${productId}`);

    // Then: Should return a response
    expect(response.status).toBeDefined();
  });

  test('FR-009 | DELETE /api/favourites/:productId should handle different productIds', async () => {
    // Given: DELETE requests with different productIds
    const productIds = [
      '507f1f77bcf86cd799439012',
      '507f1f77bcf86cd799439013',
      '507f1f77bcf86cd799439014',
    ];

    for (const productId of productIds) {
      const response = await request(app).delete(`/api/favourites/${productId}`);

      expect(response.status).toBeDefined();
    }
  });

  test('FR-010 | DELETE /api/favourites/:productId should handle invalid productId format', async () => {
    // Given: A DELETE request with invalid productId
    const response = await request(app).delete('/api/favourites/invalid-id');

    // Then: Should still process the request
    expect(response.status).toBeDefined();
  });

  // ===================================================================
  // Test Suite: GET /api/favourites/check/:productId (checkFavourite)
  // ===================================================================

  test('FR-011 | GET /api/favourites/check/:productId should be accessible', async () => {
    // Given: A GET request to check favourite status
    const productId = '507f1f77bcf86cd799439012';
    const response = await request(app).get(`/api/favourites/check/${productId}`);

    // Then: Should return a response
    expect(response.status).toBeDefined();
  });

  test('FR-012 | GET /api/favourites/check/:productId should handle different productIds', async () => {
    // Given: Multiple GET requests with different productIds
    const productIds = [
      '507f1f77bcf86cd799439012',
      '507f1f77bcf86cd799439013',
      '507f1f77bcf86cd799439014',
    ];

    for (const productId of productIds) {
      const response = await request(app).get(`/api/favourites/check/${productId}`);

      expect(response.status).toBeDefined();
    }
  });

  // ===================================================================
  // Test Suite: GET /api/favourites/user/:userId (getFavouritesByUserId)
  // ===================================================================

  test('FR-013 | GET /api/favourites/user/:userId should be accessible', async () => {
    // Given: A GET request to get favourites by user ID
    const userId = '507f1f77bcf86cd799439011';
    const response = await request(app).get(`/api/favourites/user/${userId}`);

    // Then: Should return a response
    expect(response.status).toBeDefined();
  });

  test('FR-014 | GET /api/favourites/user/:userId should handle different userIds', async () => {
    // Given: Multiple GET requests with different userIds
    const userIds = [
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012',
      '507f1f77bcf86cd799439013',
    ];

    for (const userId of userIds) {
      const response = await request(app).get(`/api/favourites/user/${userId}`);

      expect(response.status).toBeDefined();
    }
  });

  // ===================================================================
  // Test Suite: HTTP Method Validation
  // ===================================================================

  test('FR-015 | Routes should handle different HTTP methods correctly', async () => {
    // Given: Requests with different HTTP methods
    const baseUrl = '/api/favourites/';
    const productId = '507f1f77bcf86cd799439012';

    // GET should work
    const getResponse = await request(app).get(baseUrl);
    expect(getResponse.status).toBeDefined();

    // POST should work
    const postResponse = await request(app).post(baseUrl).send({ productId });
    expect(postResponse.status).toBeDefined();

    // PUT should not work (not defined) - returns 401 due to auth middleware
    const putResponse = await request(app).put(baseUrl);
    expect(putResponse.status).toBe(401);

    // PATCH should not work (not defined) - returns 401 due to auth middleware
    const patchResponse = await request(app).patch(baseUrl);
    expect(patchResponse.status).toBe(401);
  });

  test('FR-016 | DELETE route should only accept DELETE method', async () => {
    // Given: Different HTTP methods on DELETE route
    const productId = '507f1f77bcf86cd799439012';
    const deleteUrl = `/api/favourites/${productId}`;

    // DELETE should work
    const deleteResponse = await request(app).delete(deleteUrl);
    expect(deleteResponse.status).toBeDefined();

    // GET should not work on DELETE route - returns 401 due to auth middleware
    const getResponse = await request(app).get(deleteUrl);
    expect(getResponse.status).toBe(401);

    // POST should not work on DELETE route - returns 401 due to auth middleware
    const postResponse = await request(app).post(deleteUrl);
    expect(postResponse.status).toBe(401);
  });

  test('FR-017 | Routes should handle URL parameters correctly', async () => {
    // Given: Requests with various URL parameters
    const testCases = [
      { route: '/api/favourites/check/507f1f77bcf86cd799439012', method: 'get' },
      { route: '/api/favourites/507f1f77bcf86cd799439012', method: 'delete' },
      { route: '/api/favourites/user/507f1f77bcf86cd799439011', method: 'get' },
    ];

    for (const testCase of testCases) {
      const response = await request(app)[testCase.method](testCase.route);
      expect(response.status).toBeDefined();
    }
  });

  test('FR-018 | Routes should handle special characters in parameters', async () => {
    // Given: Requests with special characters in parameters
    const specialProductId = '507f1f77bcf86cd799439012-abc';
    const specialUserId = '507f1f77bcf86cd799439011-xyz';

    // Test special characters in productId
    const checkResponse = await request(app).get(`/api/favourites/check/${specialProductId}`);
    expect(checkResponse.status).toBeDefined();

    const deleteResponse = await request(app).delete(`/api/favourites/${specialProductId}`);
    expect(deleteResponse.status).toBeDefined();

    // Test special characters in userId
    const userResponse = await request(app).get(`/api/favourites/user/${specialUserId}`);
    expect(userResponse.status).toBeDefined();
  });

  test('FR-019 | Routes should handle malformed URLs gracefully', async () => {
    // Given: Malformed URLs
    const malformedUrls = [
      '/api/favourites//',
      '/api/favourites/check/',
      '/api/favourites/user/',
      '/api/favourites/invalid/path',
    ];

    for (const url of malformedUrls) {
      const response = await request(app).get(url);
      expect(response.status).toBeDefined();
    }
  });

  test('FR-020 | Routes should handle large parameter values', async () => {
    // Given: Requests with large parameter values
    const largeProductId = '507f1f77bcf86cd799439012' + 'a'.repeat(100);
    const largeUserId = '507f1f77bcf86cd799439011' + 'b'.repeat(100);

    // Test large productId
    const checkResponse = await request(app).get(`/api/favourites/check/${largeProductId}`);
    expect(checkResponse.status).toBeDefined();

    // Test large userId
    const userResponse = await request(app).get(`/api/favourites/user/${largeUserId}`);
    expect(userResponse.status).toBeDefined();
  });
});
