/**
 * @fileoverview Category Model Unit Tests
 * @module tests/categories/category-model.test.js
 * @description Tests for Category model schema, validation, and slug generation
 */

import mongoose from 'mongoose';
import Category from '../../src/models/Category.js';

describe('Categories — Unit Tests: Category Model', () => {
  beforeAll(async () => {
    // Connect to in-memory MongoDB for testing
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test-categories', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  });

  afterEach(async () => {
    // Clean up database after each test
    await Category.deleteMany({});
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  // ============================================================================
  // CAT-001: Slug generation from simple category name
  // ============================================================================
  test('CAT-001 | should auto-generate slug from simple category name', async () => {
    // Given: A category with a simple name
    const categoryData = {
      name: 'Running',
      description: 'Running shoes',
    };

    // When: Category is created and saved
    const category = await Category.create(categoryData);

    // Then: Slug should be lowercase version of name
    expect(category.slug).toBe('running');
    expect(category.name).toBe('Running');
    expect(category.description).toBe('Running shoes');
  });

  // ============================================================================
  // CAT-002: Slug generation with multiple words
  // ============================================================================
  test('CAT-002 | should generate slug with hyphens for multiple words', async () => {
    // Given: A category name with multiple words
    const categoryData = {
      name: 'Basketball Shoes',
    };

    // When: Category is saved to database
    const category = await Category.create(categoryData);

    // Then: Slug should be lowercase and hyphenated
    expect(category.slug).toBe('basketball-shoes');
    expect(category.name).toBe('Basketball Shoes');
  });

  // ============================================================================
  // CAT-003: Slug handles special characters
  // ============================================================================
  test('CAT-003 | should convert special characters to hyphens in slug', async () => {
    // Given: A category name with special characters
    const categoryData = {
      name: "Men's Shoes & Boots",
    };

    // When: Pre-save hook generates slug
    const category = await Category.create(categoryData);

    // Then: Special characters should be converted to hyphens
    expect(category.slug).toBe('men-s-shoes-boots');
    expect(category.name).toBe("Men's Shoes & Boots");
  });

  // ============================================================================
  // CAT-004: Slug handles multiple spaces
  // ============================================================================
  test('CAT-004 | should convert multiple spaces to single hyphen', async () => {
    // Given: A category name with multiple consecutive spaces
    const categoryData = {
      name: 'Outdoor   Adventure',
    };

    // When: Slug generation is triggered
    const category = await Category.create(categoryData);

    // Then: Multiple spaces should become single hyphen
    expect(category.slug).toBe('outdoor-adventure');
  });

  // ============================================================================
  // CAT-005: Slug removes leading/trailing hyphens
  // ============================================================================
  test('CAT-005 | should remove leading and trailing hyphens from slug', async () => {
    // Given: A category name with leading/trailing hyphens
    const categoryData = {
      name: '-Hiking-',
    };

    // When: Category is created
    const category = await Category.create(categoryData);

    // Then: Leading and trailing hyphens should be removed
    expect(category.slug).toBe('hiking');
  });

  // ============================================================================
  // CAT-006: Default status value when not provided
  // ============================================================================
  test('CAT-006 | should default status to true when not provided', async () => {
    // Given: Category data without status field
    const categoryData = {
      name: 'Casual',
    };

    // When: Category is created without explicit status
    const category = await Category.create(categoryData);

    // Then: Status should default to true
    expect(category.status).toBe(true);
  });

  // ============================================================================
  // CAT-007: Default description as empty string
  // ============================================================================
  test('CAT-007 | should default description to empty string', async () => {
    // Given: Category data without description
    const categoryData = {
      name: 'Sports',
    };

    // When: Category is created
    const category = await Category.create(categoryData);

    // Then: Description should be empty string
    expect(category.description).toBe('');
  });

  // ============================================================================
  // CAT-008: Validation error when name is missing
  // ============================================================================
  test('CAT-008 | should throw validation error when name is missing', async () => {
    // Given: Category data without required name field
    const categoryData = {
      description: 'Test description',
    };

    // When/Then: Attempting to create category should throw validation error
    await expect(Category.create(categoryData)).rejects.toThrow();
  });

  // ============================================================================
  // Additional test: Slug regeneration on name update
  // ============================================================================
  test('should regenerate slug when name is updated', async () => {
    // Given: An existing category
    const category = await Category.create({ name: 'Original Name' });
    expect(category.slug).toBe('original-name');

    // When: Category name is updated
    category.name = 'Updated Name';
    await category.save();

    // Then: Slug should be regenerated
    expect(category.slug).toBe('updated-name');
  });

  // ============================================================================
  // Additional test: Slug NOT regenerated when name is NOT modified
  // ============================================================================
  test('should NOT regenerate slug when updating fields other than name', async () => {
    // Given: An existing category
    const category = await Category.create({
      name: 'Test Category',
      description: 'Original description',
      status: true,
    });

    const originalSlug = category.slug;
    expect(originalSlug).toBe('test-category');

    // When: Update description and status (NOT name)
    category.description = 'Updated description';
    category.status = false;
    await category.save();

    // Then: Slug should remain unchanged (isModified('name') = false branch)
    expect(category.slug).toBe(originalSlug);
    expect(category.slug).toBe('test-category');
    expect(category.description).toBe('Updated description');
    expect(category.status).toBe(false);
  });

  // ============================================================================
  // Additional test: Slug uniqueness constraint
  // ============================================================================
  test('should enforce unique slug constraint', async () => {
    // Given: A category with a specific name
    await Category.create({ name: 'Running' });

    // When/Then: Creating another category with same slug should fail
    // Note: This assumes unique index on slug field
    await expect(
      Category.create({ name: 'Running' }) // Would generate same slug
    ).rejects.toThrow();
  });

  // ============================================================================
  // Additional test: Timestamps are created
  // ============================================================================
  test('should automatically create timestamps', async () => {
    // Given: Category data
    const categoryData = { name: 'Test Category' };

    // When: Category is created
    const category = await Category.create(categoryData);

    // Then: Timestamps should exist
    expect(category.createdAt).toBeDefined();
    expect(category.updatedAt).toBeDefined();
    expect(category.createdAt).toBeInstanceOf(Date);
    expect(category.updatedAt).toBeInstanceOf(Date);
  });
});
