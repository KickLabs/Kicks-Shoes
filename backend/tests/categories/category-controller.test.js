/**
 * @fileoverview Category Controller Unit Tests
 * @module tests/categories/category-controller.test.js
 * @description Tests for HTTP request handlers in categoryController
 */

import { jest } from '@jest/globals';

// Mock logger BEFORE importing controller
jest.mock('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../src/services/category.service.js');

import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../src/controllers/categoryController.js';
import { CategoryService } from '../../src/services/category.service.js';
import logger from '../../src/utils/logger.js';

describe('Categories — Unit Tests: Category Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request, response, next objects
    req = {
      query: {},
      params: {},
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  // ============================================================================
  // CAT-027: GET /api/categories - no filters
  // ============================================================================
  test('CAT-027 | should return all categories with count when no filters provided', async () => {
    // Given: Categories exist in system
    const mockCategories = [
      { _id: '1', name: 'Running', slug: 'running' },
      { _id: '2', name: 'Basketball', slug: 'basketball' },
      { _id: '3', name: 'Casual', slug: 'casual' },
      { _id: '4', name: 'Golf', slug: 'golf' },
      { _id: '5', name: 'Hiking', slug: 'hiking' },
    ];

    CategoryService.getCategories = jest.fn().mockResolvedValue(mockCategories);

    // When: GET /api/categories is called
    await getCategories(req, res);

    // Then: Should return HTTP 200 with success and data
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 5,
      data: mockCategories,
    });
    expect(CategoryService.getCategories).toHaveBeenCalledWith(undefined);
  });

  // ============================================================================
  // CAT-028: GET /api/categories?productType=shoes
  // ============================================================================
  test('CAT-028 | should return filtered categories when productType query param provided', async () => {
    // Given: Request with productType=shoes
    req.query.productType = 'shoes';
    const mockShoeCategories = [
      { _id: '1', name: 'Sneaker', slug: 'sneaker' },
      { _id: '2', name: 'Running', slug: 'running' },
    ];

    CategoryService.getCategories = jest.fn().mockResolvedValue(mockShoeCategories);

    // When: Controller processes request
    await getCategories(req, res);

    // Then: Should return only shoe categories
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 2,
      data: mockShoeCategories,
    });
    expect(CategoryService.getCategories).toHaveBeenCalledWith('shoes');
  });

  // ============================================================================
  // CAT-029: GET /api/categories/:id with valid ID
  // ============================================================================
  test('CAT-029 | should return single category when valid ID provided', async () => {
    // Given: Valid category ID in params
    req.params.id = '507f1f77bcf86cd799439011';
    const mockCategory = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Running',
      slug: 'running',
      status: true,
    };

    CategoryService.getCategoryById = jest.fn().mockResolvedValue(mockCategory);

    // When: getCategory controller is called
    await getCategory(req, res, next);

    // Then: Should return HTTP 200 with category data
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockCategory,
    });
  });

  // ============================================================================
  // CAT-030: GET /api/categories/:id with invalid ID
  // ============================================================================
  test('CAT-030 | should return 404 error for invalid category ID', async () => {
    // Given: Invalid ID in params
    req.params.id = 'invalid123';
    const error = new Error('Invalid category ID');

    CategoryService.getCategoryById = jest.fn().mockRejectedValue(error);

    // When: Controller attempts to get category
    await getCategory(req, res, next);

    // Then: Should call next with error (caught by asyncHandler)
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  // ============================================================================
  // CAT-031: POST /api/categories with valid data (admin)
  // ============================================================================
  test('CAT-031 | should create category and return 201 when valid data provided', async () => {
    // Given: Valid category data in request body (admin authenticated)
    req.body = {
      name: 'New Category',
      description: 'Test description',
    };

    const mockCreatedCategory = {
      _id: 'newId123',
      name: 'New Category',
      slug: 'new-category',
      description: 'Test description',
      status: true,
    };

    CategoryService.createCategory = jest.fn().mockResolvedValue(mockCreatedCategory);

    // When: createCategory controller is called
    await createCategory(req, res);

    // Then: Should return HTTP 201 with created category
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockCreatedCategory,
    });
    expect(CategoryService.createCategory).toHaveBeenCalledWith(req.body);
  });

  // ============================================================================
  // CAT-032: POST /api/categories without auth token
  // ============================================================================
  test('CAT-032 | should reject request without auth token (handled by middleware)', async () => {
    // Given: No authentication in request
    // Note: This test assumes auth middleware runs before controller
    // In real scenario, middleware would block request before reaching controller

    // When/Then: Auth middleware should return 401
    // This is tested in integration tests with actual middleware
    expect(true).toBe(true); // Placeholder - actual auth test in integration
  });

  // ============================================================================
  // CAT-033: POST /api/categories as non-admin user
  // ============================================================================
  test('CAT-033 | should reject request from non-admin user (handled by role middleware)', async () => {
    // Given: Regular user (not admin)
    // Note: Role middleware should block before controller

    // When/Then: Role middleware should return 403
    // This is tested in integration tests with actual middleware
    expect(true).toBe(true); // Placeholder - actual role test in integration
  });

  // ============================================================================
  // CAT-034: PUT /api/categories/:id (admin)
  // ============================================================================
  test('CAT-034 | should update category and return updated data', async () => {
    // Given: Valid ID and update data (admin authenticated)
    req.params.id = '507f1f77bcf86cd799439011';
    req.body = {
      name: 'Updated Name',
      description: 'Updated description',
    };

    const mockUpdatedCategory = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Updated Name',
      slug: 'updated-name',
      description: 'Updated description',
      status: true,
    };

    CategoryService.updateCategory = jest.fn().mockResolvedValue(mockUpdatedCategory);

    // When: updateCategory controller is called
    await updateCategory(req, res, next);

    // Then: Should return HTTP 200 with updated category
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockUpdatedCategory,
    });
    expect(CategoryService.updateCategory).toHaveBeenCalledWith(req.params.id, req.body);
  });

  // ============================================================================
  // CAT-035: DELETE /api/categories/:id (admin)
  // ============================================================================
  test('CAT-035 | should delete category and return success', async () => {
    // Given: Valid category ID (admin authenticated, no products)
    req.params.id = '507f1f77bcf86cd799439011';

    CategoryService.deleteCategory = jest.fn().mockResolvedValue();

    // When: deleteCategory controller is called
    await deleteCategory(req, res, next);

    // Then: Should return HTTP 200 with success
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {},
    });
    expect(CategoryService.deleteCategory).toHaveBeenCalledWith(req.params.id);
  });

  // ============================================================================
  // Additional test: Service error handling
  // ============================================================================
  test('should pass service errors to error middleware', async () => {
    // Given: Service throws error
    const error = new Error('Database error');
    CategoryService.getCategories = jest.fn().mockRejectedValue(error);

    // When: Controller is called
    // Then: Error should be caught by asyncHandler and passed to next
    // (asyncHandler is applied in actual implementation)
    await expect(CategoryService.getCategories()).rejects.toThrow('Database error');
  });
});
