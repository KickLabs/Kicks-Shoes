/**
 * @fileoverview Category Mock Data Factory
 * @module tests/mocks/category.mock.js
 * @description Mock data and factory functions for category testing
 */

import mongoose from 'mongoose';

/**
 * Generate a mock ObjectId
 * @param {string} seed - Optional seed for consistent IDs
 * @returns {string} Mock MongoDB ObjectId
 */
const mockObjectId = (seed = null) => {
  if (seed) {
    // Generate deterministic ID from seed
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash.toString(16).padStart(24, '0').substring(0, 24);
  }
  return new mongoose.Types.ObjectId().toString();
};

/**
 * Create a single mock category
 * @param {Object} overrides - Fields to override defaults
 * @returns {Object} Mock category object
 */
const createMockCategory = (overrides = {}) => {
  const defaults = {
    _id: mockObjectId(),
    name: 'Running',
    slug: 'running',
    description: 'Running shoes and gear',
    status: true,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  return { ...defaults, ...overrides };
};

/**
 * Create multiple mock categories
 * @param {number} count - Number of categories to generate
 * @returns {Array} Array of mock categories
 */
const createMockCategories = (count = 5) => {
  const categories = [
    createMockCategory({
      _id: '507f1f77bcf86cd799439011',
      name: 'Running',
      slug: 'running',
      description: 'Running shoes and gear',
    }),
    createMockCategory({
      _id: '507f1f77bcf86cd799439012',
      name: 'Basketball',
      slug: 'basketball',
      description: 'Basketball shoes',
    }),
    createMockCategory({
      _id: '507f1f77bcf86cd799439013',
      name: 'Casual Shoes',
      slug: 'casual-shoes',
      description: 'Everyday casual footwear',
      status: false,
    }),
    createMockCategory({
      _id: '507f1f77bcf86cd799439014',
      name: 'Golf',
      slug: 'golf',
      description: 'Golf shoes and accessories',
    }),
    createMockCategory({
      _id: '507f1f77bcf86cd799439015',
      name: 'Hiking',
      slug: 'hiking',
      description: 'Outdoor hiking footwear',
    }),
  ];

  return categories.slice(0, count);
};

/**
 * Get mock categories filtered by product type
 * @param {string} productType - Product type filter
 * @returns {Array} Filtered categories
 */
const getMockCategoriesByProductType = productType => {
  const shoesCategories = [
    createMockCategory({ name: 'Sneaker', slug: 'sneaker' }),
    createMockCategory({ name: 'Basketball', slug: 'basketball' }),
    createMockCategory({ name: 'Running', slug: 'running' }),
  ];

  const clothingCategories = [
    createMockCategory({ name: 'Tops', slug: 'tops' }),
    createMockCategory({ name: 'Bottoms', slug: 'bottoms' }),
    createMockCategory({ name: 'T-Shirts', slug: 't-shirts' }),
  ];

  const accessoryCategories = [
    createMockCategory({ name: 'Backpacks', slug: 'backpacks' }),
    createMockCategory({ name: 'Beanies', slug: 'beanies' }),
    createMockCategory({ name: 'Socks', slug: 'socks' }),
  ];

  const typeMap = {
    shoes: shoesCategories,
    clothing: clothingCategories,
    accessory: accessoryCategories,
  };

  return typeMap[productType] || [];
};

/**
 * Create mock category input data
 * @param {boolean} valid - Whether to generate valid or invalid data
 * @returns {Object} Category input data
 */
const createMockCategoryInput = (valid = true) => {
  if (valid) {
    return {
      name: 'Golf Shoes',
      description: 'Professional golf footwear',
      status: true,
    };
  }

  // Invalid: missing required name field
  return {
    description: 'Missing name field',
  };
};

/**
 * Create mock admin user
 * @returns {Object} Mock admin user with token
 */
const createMockAdminUser = () => {
  return {
    _id: 'admin123',
    email: 'admin@test.com',
    fullName: 'Admin User',
    role: 'admin',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.admin.token',
  };
};

/**
 * Create mock regular user
 * @returns {Object} Mock regular user
 */
const createMockRegularUser = () => {
  return {
    _id: 'user123',
    email: 'user@test.com',
    fullName: 'Regular User',
    role: 'user',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.user.token',
  };
};

/**
 * Create mock products with category references
 * @param {string} categoryId - Category ID to link products to
 * @param {number} count - Number of products
 * @returns {Array} Mock products
 */
const createMockProductsWithCategory = (categoryId, count = 2) => {
  const products = [];

  for (let i = 0; i < count; i++) {
    products.push({
      _id: `607f1f77bcf86cd79943902${i}`,
      name: `Product ${i + 1}`,
      category: categoryId,
      brand: i % 2 === 0 ? 'Nike' : 'Adidas',
      price: {
        regular: 100 + i * 20,
        finalPrice: 100 + i * 20,
      },
    });
  }

  return products;
};

/**
 * Edge case: Category with special characters in name
 */
const categoryWithSpecialChars = () => {
  return createMockCategory({
    name: "Men's Shoes & Boots",
    slug: 'men-s-shoes-boots',
  });
};

/**
 * Edge case: Category with very long description
 */
const categoryWithLongDescription = () => {
  return createMockCategory({
    name: 'Test Category',
    description: 'A'.repeat(1000),
  });
};

/**
 * Edge case: Category with whitespace name
 */
const categoryWithWhitespaceName = () => {
  return {
    name: '   ',
    description: 'Invalid whitespace name',
  };
};

/**
 * Edge case: Duplicate category names (case variations)
 */
const duplicateCategoryNames = () => {
  return [
    createMockCategory({ name: 'Running' }),
    createMockCategory({ name: 'RUNNING' }),
    createMockCategory({ name: 'running' }),
    createMockCategory({ name: 'RuNnInG' }),
  ];
};

export {
  mockObjectId,
  createMockCategory,
  createMockCategories,
  getMockCategoriesByProductType,
  createMockCategoryInput,
  createMockAdminUser,
  createMockRegularUser,
  createMockProductsWithCategory,
  categoryWithSpecialChars,
  categoryWithLongDescription,
  categoryWithWhitespaceName,
  duplicateCategoryNames,
};
