/**
 * @fileoverview Category Service Unit Tests
 * @module tests/categories/category-service.test.js
 * @description Tests for CategoryService business logic
 */

import { jest } from '@jest/globals';
import { CategoryService } from '../../src/services/category.service.js';
import Category from '../../src/models/Category.js';
import mongoose from 'mongoose';

// Mock logger BEFORE importing
jest.mock('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock models
jest.mock('../../src/models/Category.js');

// Import logger after mock
import logger from '../../src/utils/logger.js';

describe('Categories — Unit Tests: Category Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // CAT-009: Get all categories without filter
  // ============================================================================
  test('CAT-009 | should return all categories sorted by name when no filter provided', async () => {
    // Given: Categories exist in database
    const mockCategories = [
      { _id: '1', name: 'Basketball', slug: 'basketball', status: true },
      { _id: '2', name: 'Running', slug: 'running', status: true },
      { _id: '3', name: 'Casual', slug: 'casual', status: true },
      { _id: '4', name: 'Golf', slug: 'golf', status: true },
      { _id: '5', name: 'Hiking', slug: 'hiking', status: true },
    ];

    Category.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockCategories),
    });

    // When: getCategories is called with null
    const result = await CategoryService.getCategories(null);

    // Then: Should return all 5 categories sorted by name
    expect(result).toEqual(mockCategories);
    expect(result.length).toBe(5);
    expect(Category.find).toHaveBeenCalledWith({});
    // Logger is called but we don't assert it in unit tests
  });

  // ============================================================================
  // CAT-010: Filter categories by productType='shoes'
  // ============================================================================
  test('CAT-010 | should return only shoe-related categories when productType is shoes', async () => {
    // Given: Mixed categories exist, filter for shoes
    const mockShoeCategories = [
      { _id: '1', name: 'Sneaker', slug: 'sneaker', status: true },
      { _id: '2', name: 'Basketball', slug: 'basketball', status: true },
      { _id: '3', name: 'Running', slug: 'running', status: true },
    ];

    Category.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockShoeCategories),
    });

    // When: getCategories called with productType='shoes'
    const result = await CategoryService.getCategories('shoes');

    // Then: Should return only shoe categories
    expect(result).toEqual(mockShoeCategories);
    expect(Category.find).toHaveBeenCalledWith({
      name: { $in: expect.arrayContaining(['Sneaker', 'Basketball', 'Running']) },
    });
  });

  // ============================================================================
  // CAT-011: Filter categories by productType='clothing'
  // ============================================================================
  test('CAT-011 | should return only clothing categories when productType is clothing', async () => {
    // Given: Mixed categories, filter for clothing
    const mockClothingCategories = [
      { _id: '1', name: 'Tops', slug: 'tops', status: true },
      { _id: '2', name: 'Bottoms', slug: 'bottoms', status: true },
    ];

    Category.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockClothingCategories),
    });

    // When: getCategories with productType='clothing'
    const result = await CategoryService.getCategories('clothing');

    // Then: Should return clothing categories only
    expect(result).toEqual(mockClothingCategories);
    expect(Category.find).toHaveBeenCalledWith({
      name: { $in: expect.arrayContaining(['Tops', 'Bottoms', 'T-Shirts']) },
    });
  });

  // ============================================================================
  // CAT-012: Filter categories by productType='accessory'
  // ============================================================================
  test('CAT-012 | should return accessory categories when productType is accessory', async () => {
    // Given: Accessory categories exist
    const mockAccessoryCategories = [
      { _id: '1', name: 'Backpacks', slug: 'backpacks', status: true },
      { _id: '2', name: 'Beanies', slug: 'beanies', status: true },
    ];

    Category.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockAccessoryCategories),
    });

    // When: Filter by accessory type
    const result = await CategoryService.getCategories('accessory');

    // Then: Should return accessory categories
    expect(result).toEqual(mockAccessoryCategories);
    expect(Category.find).toHaveBeenCalledWith({
      name: { $in: expect.arrayContaining(['Accessories', 'Backpacks', 'Beanies']) },
    });
  });

  // ============================================================================
  // CAT-013: ProductType='all' returns all categories
  // ============================================================================
  test('CAT-013 | should return all categories when productType is all', async () => {
    // Given: Categories exist
    const mockCategories = [
      { _id: '1', name: 'Running', slug: 'running', status: true },
      { _id: '2', name: 'Tops', slug: 'tops', status: true },
      { _id: '3', name: 'Backpacks', slug: 'backpacks', status: true },
      { _id: '4', name: 'Other', slug: 'other', status: true },
      { _id: '5', name: 'Golf', slug: 'golf', status: true },
    ];

    Category.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockCategories),
    });

    // When: productType is 'all'
    const result = await CategoryService.getCategories('all');

    // Then: Should return all categories (same as null)
    expect(result).toEqual(mockCategories);
    expect(Category.find).toHaveBeenCalledWith({});
  });

  // ============================================================================
  // CAT-014: Invalid productType returns all categories (no filter)
  // ============================================================================
  test('CAT-014 | should return all categories for invalid productType', async () => {
    // Given: Invalid product type provided
    const mockCategories = [
      { _id: '1', name: 'Running', slug: 'running' },
      { _id: '2', name: 'Basketball', slug: 'basketball' },
    ];
    Category.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockCategories),
    });

    // When: getCategories with invalid type
    const result = await CategoryService.getCategories('invalidType');

    // Then: Should return all categories (no filter applied because allowedCategories.length === 0)
    expect(result).toEqual(mockCategories);
    expect(Category.find).toHaveBeenCalledWith({});
  });

  // ============================================================================
  // CAT-015: Get category by valid ID - exists
  // ============================================================================
  test('CAT-015 | should return category when valid ID exists', async () => {
    // Given: Valid category ID that exists
    const validId = '507f1f77bcf86cd799439011';
    const mockCategory = {
      _id: validId,
      name: 'Running',
      slug: 'running',
      description: 'Running shoes',
      status: true,
    };

    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
    Category.findById = jest.fn().mockResolvedValue(mockCategory);

    // When: getCategoryById is called
    const result = await CategoryService.getCategoryById(validId);

    // Then: Should return category object
    expect(result).toEqual(mockCategory);
    expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(validId);
    expect(Category.findById).toHaveBeenCalledWith(validId);
  });

  // ============================================================================
  // CAT-016: Get category by invalid ObjectId format
  // ============================================================================
  test('CAT-016 | should throw error for invalid ObjectId format', async () => {
    // Given: Invalid ObjectId format
    const invalidId = 'invalid123';
    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(false);

    // When/Then: Should throw "Invalid category ID"
    await expect(CategoryService.getCategoryById(invalidId)).rejects.toThrow('Invalid category ID');
    // Logger is called but we don't assert it in unit tests
  });

  // ============================================================================
  // CAT-017: Get category by valid ID - not exists
  // ============================================================================
  test('CAT-017 | should throw error when category not found', async () => {
    // Given: Valid ObjectId but no matching category
    const nonExistentId = '507f1f77bcf86cd799439099';
    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
    Category.findById = jest.fn().mockResolvedValue(null);

    // When/Then: Should throw "Category not found"
    await expect(CategoryService.getCategoryById(nonExistentId)).rejects.toThrow(
      `Category not found with id of ${nonExistentId}`
    );
  });

  // ============================================================================
  // CAT-018: Create category with valid data
  // ============================================================================
  test('CAT-018 | should create category successfully with valid data', async () => {
    // Given: Valid category data
    const categoryData = {
      name: 'Golf',
      description: 'Golf shoes',
    };

    const mockCreatedCategory = {
      _id: 'newId123',
      name: 'Golf',
      slug: 'golf',
      description: 'Golf shoes',
      status: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    Category.create = jest.fn().mockResolvedValue(mockCreatedCategory);

    // When: createCategory is called
    const result = await CategoryService.createCategory(categoryData);

    // Then: Should return created category with slug
    expect(result).toEqual(mockCreatedCategory);
    expect(result.slug).toBe('golf');
    expect(Category.create).toHaveBeenCalledWith(categoryData);
    // Logger is called but we don't assert it in unit tests
  });

  // ============================================================================
  // CAT-019: Create category without description
  // ============================================================================
  test('CAT-019 | should create category with empty description when not provided', async () => {
    // Given: Category data without description
    const categoryData = { name: 'Test' };
    const mockCategory = {
      _id: 'id1',
      name: 'Test',
      slug: 'test',
      description: '',
      status: true,
    };

    Category.create = jest.fn().mockResolvedValue(mockCategory);

    // When: Category is created
    const result = await CategoryService.createCategory(categoryData);

    // Then: Should have empty description
    expect(result.description).toBe('');
  });

  // ============================================================================
  // CAT-020: Create category without status
  // ============================================================================
  test('CAT-020 | should default status to true when not provided', async () => {
    // Given: No status in input
    const categoryData = { name: 'Default Status' };
    const mockCategory = {
      _id: 'id1',
      name: 'Default Status',
      slug: 'default-status',
      status: true,
    };

    Category.create = jest.fn().mockResolvedValue(mockCategory);

    // When: Category created without status
    const result = await CategoryService.createCategory(categoryData);

    // Then: Status should be true
    expect(result.status).toBe(true);
  });

  // ============================================================================
  // CAT-021: Update category name - slug regenerates
  // ============================================================================
  test('CAT-021 | should regenerate slug when name is updated', async () => {
    // Given: Existing category to update
    const categoryId = '507f1f77bcf86cd799439011';
    const updateData = { name: 'Golf Shoes' };
    const mockUpdatedCategory = {
      _id: categoryId,
      name: 'Golf Shoes',
      slug: 'golf-shoes',
      status: true,
    };

    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
    Category.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedCategory);

    // When: updateCategory is called
    const result = await CategoryService.updateCategory(categoryId, updateData);

    // Then: Slug should be regenerated
    expect(result.slug).toBe('golf-shoes');
    expect(Category.findByIdAndUpdate).toHaveBeenCalledWith(categoryId, updateData, {
      new: true,
      runValidators: true,
    });
  });

  // ============================================================================
  // CAT-022: Update category with invalid ID
  // ============================================================================
  test('CAT-022 | should throw error when updating with invalid ID', async () => {
    // Given: Invalid category ID
    const invalidId = 'invalid';
    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(false);

    // When/Then: Should throw "Invalid category ID"
    await expect(CategoryService.updateCategory(invalidId, {})).rejects.toThrow(
      'Invalid category ID'
    );
  });

  // ============================================================================
  // CAT-023: Update non-existent category
  // ============================================================================
  test('CAT-023 | should throw error when updating non-existent category', async () => {
    // Given: Valid ID but category doesn't exist
    const nonExistentId = '507f1f77bcf86cd799439099';
    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
    Category.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

    // When/Then: Should throw "Category not found"
    await expect(CategoryService.updateCategory(nonExistentId, { name: 'Test' })).rejects.toThrow(
      `Category not found with id of ${nonExistentId}`
    );
  });

  // ============================================================================
  // CAT-024: Delete category with valid ID
  // ============================================================================
  test('CAT-024 | should delete category successfully with valid ID', async () => {
    // Given: Valid category ID, no products
    const validId = '507f1f77bcf86cd799439011';
    const mockCategory = {
      _id: validId,
      name: 'Test',
      deleteOne: jest.fn().mockResolvedValue({}),
    };

    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
    Category.findById = jest.fn().mockResolvedValue(mockCategory);

    // When: deleteCategory is called
    await CategoryService.deleteCategory(validId);

    // Then: Category should be deleted
    expect(mockCategory.deleteOne).toHaveBeenCalled();
    // Logger is called but we don't assert it in unit tests
  });

  // ============================================================================
  // CAT-025: Delete category with invalid ID
  // ============================================================================
  test('CAT-025 | should throw error when deleting with invalid ID', async () => {
    // Given: Invalid category ID
    const invalidId = 'invalid';
    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(false);

    // When/Then: Should throw error
    await expect(CategoryService.deleteCategory(invalidId)).rejects.toThrow('Invalid category ID');
  });

  // ============================================================================
  // CAT-026: Delete non-existent category
  // ============================================================================
  test('CAT-026 | should throw error when deleting non-existent category', async () => {
    // Given: Valid ID but category doesn't exist
    const nonExistentId = '507f1f77bcf86cd799439099';
    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
    Category.findById = jest.fn().mockResolvedValue(null);

    // When/Then: Should throw "Category not found"
    await expect(CategoryService.deleteCategory(nonExistentId)).rejects.toThrow(
      `Category not found with id of ${nonExistentId}`
    );
  });
});
