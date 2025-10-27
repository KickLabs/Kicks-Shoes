/**
 * Product Test Utilities
 * Helper functions for product catalog testing
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock Express request object
 */
export function mockRequest(data = {}) {
  return {
    body: data.body || {},
    params: data.params || {},
    query: data.query || {},
    user: data.user || { _id: 'user123', role: 'admin' },
    headers: data.headers || {},
    ...data,
  };
}

/**
 * Creates a mock Express response object
 */
export function mockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Creates a mock Express next function
 */
export function mockNext() {
  return jest.fn();
}

/**
 * Returns valid product data for testing
 */
export function getValidProductData(overrides = {}) {
  return {
    name: 'Nike Air Max 90',
    summary: 'Classic Nike sneaker with visible Air cushioning technology',
    description:
      'The Nike Air Max 90 stays true to its OG running roots with the iconic Waffle sole, stitched overlays and classic TPU accents.',
    brand: 'Nike',
    category: '507f1f77bcf86cd799439012',
    productType: 'shoes',
    price: {
      regular: 1500000,
      discountPercent: 0,
      isOnSale: false,
    },
    inventory: [
      { size: 42, color: 'Black', quantity: 50, sku: 'NIK-AIR-SH-1234-S42-Black' },
      { size: 43, color: 'White', quantity: 30, sku: 'NIK-AIR-SH-1234-S43-White' },
    ],
    images: [
      'https://res.cloudinary.com/demo/image/upload/v1234567890/product1.jpg',
      'https://res.cloudinary.com/demo/image/upload/v1234567890/product2.jpg',
    ],
    mainImage: 'https://res.cloudinary.com/demo/image/upload/v1234567890/product1.jpg',
    tags: ['running', 'classic'],
    sku: 'NIK-AIR-SH-1234',
    stock: 80,
    variants: {
      sizes: ['42', '43'],
      colors: ['Black', 'White'],
    },
    finalPrice: 1500000,
    isAvailable: true,
    isNew: false,
    ...overrides,
  };
}

/**
 * Returns product data with discount
 */
export function getProductWithDiscount(overrides = {}) {
  return getValidProductData({
    price: {
      regular: 1000000,
      discountPercent: 20,
      isOnSale: true,
    },
    finalPrice: 800000,
    ...overrides,
  });
}

/**
 * Returns accessory product data (OneSize)
 */
export function getAccessoryProduct(overrides = {}) {
  return getValidProductData({
    name: 'Nike Cap',
    productType: 'accessory',
    category: '507f1f77bcf86cd799439013',
    price: {
      regular: 500000,
      discountPercent: 0,
      isOnSale: false,
    },
    inventory: [
      { isOneSize: true, color: 'Red', quantity: 100, sku: 'NIK-CAP-AC-5678-OneSize-Red' },
    ],
    sku: 'NIK-CAP-AC-5678',
    stock: 100,
    variants: {
      sizes: ['OneSize'],
      colors: ['Red'],
    },
    finalPrice: 500000,
    ...overrides,
  });
}

/**
 * Returns clothing product data
 */
export function getClothingProduct(overrides = {}) {
  return getValidProductData({
    name: 'Nike T-Shirt',
    productType: 'clothing',
    category: '507f1f77bcf86cd799439014',
    price: {
      regular: 300000,
      discountPercent: 0,
      isOnSale: false,
    },
    inventory: [
      { clothingSize: 'M', color: 'Blue', quantity: 50, sku: 'NIK-TSH-CL-9012-M-Blue' },
      { clothingSize: 'L', color: 'Blue', quantity: 30, sku: 'NIK-TSH-CL-9012-L-Blue' },
    ],
    sku: 'NIK-TSH-CL-9012',
    stock: 80,
    variants: {
      sizes: ['M', 'L'],
      colors: ['Blue'],
    },
    finalPrice: 300000,
    ...overrides,
  });
}

/**
 * Generates a mock MongoDB ObjectId
 */
export function mockObjectId() {
  return '507f1f77bcf86cd799439011';
}

/**
 * Delays execution for testing async operations
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
