/**
 * @fileoverview Dashboard Controller Category Tests
 * @module tests/categories/dashboard-controller.test.js
 * @description Tests for admin category operations in dashboardController
 */

import { jest } from '@jest/globals';

// Mock email config FIRST to prevent import errors
jest.mock('../../src/config/email.config.js', () => ({
  emailConfig: {
    host: 'smtp.test.com',
    port: 587,
    user: 'test@test.com',
    password: 'test',
    fromAddress: 'test@test.com',
    fromName: 'Test',
    adminEmailAddress: 'admin@test.com',
    googleMailerClientId: 'test-client-id',
    googleMailerClientSecret: 'test-client-secret',
    googleMailerRefreshToken: 'test-refresh-token',
  },
}));

import {
  createCategory,
  updateCategory,
  deleteCategory,
  activateCategory,
  deactivateCategory,
} from '../../src/controllers/dashboardController.js';
import Category from '../../src/models/Category.js';
import Product from '../../src/models/Product.js';
import { ErrorResponse } from '../../src/utils/errorResponse.js';

// Mock dependencies
jest.mock('../../src/models/Category.js');
jest.mock('../../src/models/Product.js');

describe('Categories — Unit Tests: Dashboard Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {},
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    // Mock Category methods
    Category.findByIdAndDelete = jest.fn();
  });

  // ============================================================================
  // CAT-036: Create category with unique name
  // ============================================================================
  test('CAT-036 | should create category when name is unique', async () => {
    // Given: No duplicate category exists
    req.body = {
      name: 'Unique Name',
      description: 'Test description',
    };

    Category.findOne = jest.fn().mockResolvedValue(null); // No duplicate
    Category.create = jest.fn().mockResolvedValue({
      _id: 'newId',
      name: 'Unique Name',
      slug: 'unique-name',
      description: 'Test description',
      status: true,
    });

    // When: createCategory is called
    await createCategory(req, res);

    // Then: Should return HTTP 201 with created category
    expect(Category.findOne).toHaveBeenCalledWith({
      name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
    });
    expect(Category.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ name: 'Unique Name' }),
    });
  });

  // ============================================================================
  // CAT-037: Create category with duplicate name (exact match)
  // ============================================================================
  test('CAT-037 | should reject duplicate category name (exact match)', async () => {
    // Given: Category "Running" already exists
    req.body = { name: 'Running' };

    Category.findOne = jest.fn().mockResolvedValue({
      _id: 'existingId',
      name: 'Running',
    });

    // When/Then: Should throw error for duplicate
    await expect(createCategory(req, res)).rejects.toThrow(
      'Category with this name already exists'
    );
    expect(Category.create).not.toHaveBeenCalled();
  });

  // ============================================================================
  // CAT-038: Create category with duplicate name (case-insensitive)
  // ============================================================================
  test('CAT-038 | should reject duplicate category name (case-insensitive)', async () => {
    // Given: Category "Running" exists, user tries "RUNNING"
    req.body = { name: 'RUNNING' };

    Category.findOne = jest.fn().mockResolvedValue({
      _id: 'existingId',
      name: 'Running', // Lowercase version exists
    });

    // When/Then: Should detect case-insensitive duplicate
    await expect(createCategory(req, res)).rejects.toThrow(
      'Category with this name already exists'
    );
  });

  // ============================================================================
  // CAT-039: Update category to unique name
  // ============================================================================
  test('CAT-039 | should update category when new name is unique', async () => {
    // Given: Existing category to update
    req.params.categoryId = '507f1f77bcf86cd799439011';
    req.body = { name: 'UniqueNewName' };

    const existingCategory = {
      _id: req.params.categoryId,
      name: 'OldName',
    };

    Category.findById = jest.fn().mockResolvedValue(existingCategory);
    Category.findOne = jest.fn().mockResolvedValue(null); // No conflict
    Category.findByIdAndUpdate = jest.fn().mockResolvedValue({
      _id: req.params.categoryId,
      name: 'UniqueNewName',
      slug: 'uniquenewname',
    });

    // When: updateCategory is called
    await updateCategory(req, res);

    // Then: Should update successfully
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ name: 'UniqueNewName' }),
    });
  });

  // ============================================================================
  // CAT-040: Update category to duplicate name
  // ============================================================================
  test('CAT-040 | should reject update when name conflicts with another category', async () => {
    // Given: Two categories exist, trying to rename one to other's name
    req.params.categoryId = 'category1Id';
    req.body = { name: 'ExistingCategory' };

    const categoryToUpdate = {
      _id: 'category1Id',
      name: 'Category1',
    };

    const conflictingCategory = {
      _id: 'category2Id',
      name: 'ExistingCategory',
    };

    Category.findById = jest.fn().mockResolvedValue(categoryToUpdate);
    Category.findOne = jest.fn().mockResolvedValue(conflictingCategory);

    // When/Then: Should throw duplicate error
    await expect(updateCategory(req, res)).rejects.toThrow(
      'Category with this name already exists'
    );
    expect(Category.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  // ============================================================================
  // CAT-041: Delete category with associated products
  // ============================================================================
  test('CAT-041 | should reject deletion when category has associated products', async () => {
    // Given: Category has 5 products
    req.params.categoryId = '507f1f77bcf86cd799439011';

    Category.findById = jest.fn().mockResolvedValue({
      _id: req.params.categoryId,
      name: 'Running',
    });

    Product.countDocuments = jest.fn().mockResolvedValue(5); // 5 products linked

    // When/Then: Should throw error about products
    await expect(deleteCategory(req, res)).rejects.toThrow(
      'Cannot delete category. It has 5 products associated with it.'
    );
    expect(Category.findByIdAndDelete).not.toHaveBeenCalled();
  });

  // ============================================================================
  // CAT-042: Delete category without products
  // ============================================================================
  test('CAT-042 | should delete category when no products associated', async () => {
    // Given: Category exists with 0 products
    req.params.categoryId = '507f1f77bcf86cd799439011';

    Category.findById = jest.fn().mockResolvedValue({
      _id: req.params.categoryId,
      name: 'EmptyCategory',
    });

    Product.countDocuments = jest.fn().mockResolvedValue(0); // No products
    Category.findByIdAndDelete = jest.fn().mockResolvedValue({});

    // When: deleteCategory is called
    await deleteCategory(req, res);

    // Then: Should delete successfully
    expect(Product.countDocuments).toHaveBeenCalledWith({ category: req.params.categoryId });
    expect(Category.findByIdAndDelete).toHaveBeenCalledWith(req.params.categoryId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Category deleted successfully',
    });
  });

  // ============================================================================
  // CAT-043: Activate inactive category
  // ============================================================================
  test('CAT-043 | should change status to true when activating category', async () => {
    // Given: Category with status=false
    req.params.categoryId = '507f1f77bcf86cd799439011';

    const activatedCategory = {
      _id: req.params.categoryId,
      name: 'Test',
      status: true,
    };

    Category.findByIdAndUpdate = jest.fn().mockResolvedValue(activatedCategory);

    // When: activateCategory is called
    await activateCategory(req, res);

    // Then: Status should be changed to true
    expect(Category.findByIdAndUpdate).toHaveBeenCalledWith(
      req.params.categoryId,
      { status: true },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: activatedCategory,
    });
  });

  // ============================================================================
  // CAT-044: Deactivate active category
  // ============================================================================
  test('CAT-044 | should change status to false when deactivating category', async () => {
    // Given: Category with status=true
    req.params.categoryId = '507f1f77bcf86cd799439011';

    const deactivatedCategory = {
      _id: req.params.categoryId,
      name: 'Test',
      status: false,
    };

    Category.findByIdAndUpdate = jest.fn().mockResolvedValue(deactivatedCategory);

    // When: deactivateCategory is called
    await deactivateCategory(req, res);

    // Then: Status should be changed to false
    expect(Category.findByIdAndUpdate).toHaveBeenCalledWith(
      req.params.categoryId,
      { status: false },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: deactivatedCategory,
    });
  });

  // ============================================================================
  // Additional test: Delete non-existent category
  // ============================================================================
  test('should throw 404 when deleting non-existent category', async () => {
    // Given: Category doesn't exist
    req.params.categoryId = 'nonExistentId';
    Category.findById = jest.fn().mockResolvedValue(null);

    // When/Then: Should throw not found error
    await expect(deleteCategory(req, res)).rejects.toThrow('Category not found');
  });

  // ============================================================================
  // Additional test: Update non-existent category
  // ============================================================================
  test('should throw 404 when updating non-existent category', async () => {
    // Given: Category doesn't exist
    req.params.categoryId = 'nonExistentId';
    req.body = { name: 'NewName' };
    Category.findById = jest.fn().mockResolvedValue(null);

    // When/Then: Should throw not found error
    await expect(updateCategory(req, res)).rejects.toThrow('Category not found');
  });
});
