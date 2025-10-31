/**
 * Cart Test Utilities
 * Helper functions and utilities for Cart feature testing
 */

import mongoose from 'mongoose';

/**
 * Create mock request object
 * @param {Object} user - User object with id
 * @param {Object} body - Request body
 * @param {Object} params - Request params
 * @returns {Object} Mock request
 */
const createMockRequest = (user = null, body = {}, params = {}) => ({
  user: user || { id: '507f1f77bcf86cd799439011' },
  body,
  params,
  headers: {
    authorization: user ? `Bearer valid_token_${user.id}` : 'Bearer valid_token',
  },
});

/**
 * Create mock response object
 * @returns {Object} Mock response with jest functions
 */
const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Create mock user
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock user object
 */
const createMockUser = (overrides = {}) => ({
  _id: overrides._id || '507f1f77bcf86cd799439011',
  email: overrides.email || 'testuser@example.com',
  name: overrides.name || 'Test User',
  role: overrides.role || 'user',
  isVerified: overrides.isVerified !== undefined ? overrides.isVerified : true,
  status: overrides.status !== undefined ? overrides.status : true,
  ...overrides,
});

/**
 * Create mock product
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock product object
 */
const createMockProduct = (overrides = {}) => ({
  _id: overrides._id || '507f1f77bcf86cd799439012',
  name: overrides.name || 'Nike Air Max 90',
  brand: overrides.brand || 'Nike',
  price: overrides.price || {
    regular: 2000000,
    isOnSale: false,
    discountPercent: 0,
  },
  variants: overrides.variants || {
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Black', 'White', 'Red', 'Blue'],
  },
  images: overrides.images || ['https://example.com/image1.jpg'],
  mainImage: overrides.mainImage || 'https://example.com/main.jpg',
  stock: overrides.stock !== undefined ? overrides.stock : 100,
  productType: overrides.productType || 'shoes',
  status: overrides.status !== undefined ? overrides.status : true,
  ...overrides,
});

/**
 * Create mock cart item
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock cart item
 */
const createMockCartItem = (overrides = {}) => ({
  _id: overrides._id || new mongoose.Types.ObjectId().toString(),
  product: overrides.product || '507f1f77bcf86cd799439012',
  quantity: overrides.quantity || 1,
  size: overrides.size || '42',
  color: overrides.color || 'Black',
  price: overrides.price !== undefined ? overrides.price : 2000000,
  image: overrides.image || 'https://example.com/black.jpg',
  ...overrides,
});

/**
 * Create mock cart
 * @param {Object} overrides - Override default values
 * @param {Number} itemCount - Number of items to add
 * @returns {Object} Mock cart object
 */
const createMockCart = (overrides = {}, itemCount = 0) => {
  const items = [];

  if (itemCount > 0) {
    for (let i = 0; i < itemCount; i++) {
      items.push(
        createMockCartItem({
          _id: new mongoose.Types.ObjectId().toString(),
          size: `${40 + i}`,
          color: ['Black', 'White', 'Red', 'Blue'][i % 4],
        })
      );
    }
  }

  const cart = {
    _id: overrides._id || '507f1f77bcf86cd799439013',
    user: overrides.user || '507f1f77bcf86cd799439011',
    items: overrides.items || items,
    totalPrice: 0,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };

  // Calculate totalPrice
  cart.totalPrice = cart.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  return cart;
};

/**
 * Create mock cart with populated products
 * @param {Object} overrides - Override default values
 * @param {Number} itemCount - Number of items
 * @returns {Object} Mock cart with populated items
 */
const createMockCartWithPopulatedProducts = (overrides = {}, itemCount = 1) => {
  const items = [];

  for (let i = 0; i < itemCount; i++) {
    items.push({
      ...createMockCartItem({
        size: `${40 + i}`,
        color: ['Black', 'White', 'Red'][i % 3],
      }),
      product: createMockProduct({
        name: `Product ${i + 1}`,
      }),
    });
  }

  return createMockCart({ ...overrides, items });
};

/**
 * Calculate expected totalPrice for cart
 * @param {Array} items - Cart items
 * @returns {Number} Total price
 */
const calculateExpectedTotal = items => {
  return items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};

/**
 * Assert cart structure is valid
 * @param {Object} cart - Cart object to validate
 */
const assertValidCart = cart => {
  expect(cart).toBeDefined();
  expect(cart._id).toBeDefined();
  expect(cart.user).toBeDefined();
  expect(cart.items).toBeDefined();
  expect(Array.isArray(cart.items)).toBe(true);
  expect(typeof cart.totalPrice).toBe('number');
  expect(cart.totalPrice).toBeGreaterThanOrEqual(0);
};

/**
 * Assert cart item structure is valid
 * @param {Object} item - Cart item to validate
 */
const assertValidCartItem = item => {
  expect(item).toBeDefined();
  expect(item.product).toBeDefined();
  expect(item.quantity).toBeDefined();
  expect(item.quantity).toBeGreaterThan(0);
  expect(item.size).toBeDefined();
  expect(item.color).toBeDefined();
  expect(item.price).toBeDefined();
  expect(item.price).toBeGreaterThanOrEqual(0);
};

/**
 * Assert totalPrice is calculated correctly
 * @param {Object} cart - Cart object
 */
const assertTotalPriceCorrect = cart => {
  const expectedTotal = calculateExpectedTotal(cart.items);
  expect(cart.totalPrice).toBe(expectedTotal);
};

/**
 * Create mock ordered items for removeOrderedItems
 * @param {Array} itemIds - Array of item IDs to mark as ordered
 * @returns {Array} Ordered items array
 */
const createMockOrderedItems = itemIds => {
  return itemIds.map(id => ({ _id: id }));
};

/**
 * Reset all mocks
 */
const resetAllMocks = () => {
  jest.clearAllMocks();
};

/**
 * Generate random ObjectId
 * @returns {String} Random ObjectId
 */
const randomObjectId = () => {
  return new mongoose.Types.ObjectId().toString();
};

/**
 * Wait for async operations
 * @param {Number} ms - Milliseconds to wait
 */
const wait = (ms = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Performance measurement helper
 * @param {Function} fn - Function to measure
 * @returns {Promise<Object>} Result and duration
 */
const measurePerformance = async fn => {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
};

export {
  // Mock creators
  createMockRequest,
  createMockResponse,
  createMockUser,
  createMockProduct,
  createMockCartItem,
  createMockCart,
  createMockCartWithPopulatedProducts,
  createMockOrderedItems,

  // Calculators
  calculateExpectedTotal,

  // Validators/Assertions
  assertValidCart,
  assertValidCartItem,
  assertTotalPriceCorrect,

  // Utilities
  resetAllMocks,
  randomObjectId,
  wait,
  measurePerformance,
};
