/**
 * @fileoverview Test Helper Utilities for Authentication & Authorization
 * @module testUtils
 * @description Provides factory functions for creating mock objects,
 * request/response pairs, and test data for Jest tests
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';

/**
 * Factory to create mock req/res/next objects for middleware/controller testing
 * @param {Object} overrides - Custom values to override defaults
 * @param {Object} overrides.req - Request overrides
 * @param {Object} overrides.res - Response overrides
 * @returns {Object} { req, res, next }
 */
function getMockReqRes(overrides = {}) {
  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    file: null,
    files: null,
    get: jest.fn(header => {
      return req.headers[header.toLowerCase()];
    }),
    ...overrides.req,
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    ...overrides.res,
  };

  const next = jest.fn();

  return { req, res, next };
}

/**
 * Factory to generate a mock user object (POJO - Plain Old JavaScript Object)
 * @param {Object} overrides - Custom values to override defaults
 * @returns {Object} Mock user data object
 */
function generateMockUser(overrides = {}) {
  const defaultUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    fullName: 'Nguyễn Văn Test',
    username: 'testuser',
    email: 'test@example.com',
    password: '$2a$10$hashedPasswordHere',
    phone: '0987654321',
    address: '123 Đường Test, Quận 1, TP.HCM',
    role: 'customer',
    avatar: 'https://example.com/avatar.jpg',
    isVerified: true,
    status: true,
    reward_point: 0,
    gender: 'other',
    dateOfBirth: new Date('1990-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    // Instance methods (mocked)
    matchPassword: jest.fn().mockResolvedValue(true),
    save: jest.fn(async function () {
      return this;
    }),
    toObject: jest.fn(function () {
      const obj = { ...this };
      delete obj.password;
      delete obj.matchPassword;
      delete obj.save;
      delete obj.toObject;
      return obj;
    }),
  };

  return {
    ...defaultUser,
    ...overrides,
  };
}

/**
 * Generate Vietnamese test users with realistic data
 * @param {number} count - Number of users to generate
 * @returns {Array<Object>} Array of mock user objects
 */
function generateVietnameseUsers(count = 5) {
  const vietnameseNames = [
    { fullName: 'Trần Thị Hoa', username: 'tranthihoa', email: 'hoa.tran@example.com' },
    { fullName: 'Lê Văn Nam', username: 'levannam', email: 'nam.le@example.com' },
    { fullName: 'Phạm Minh Tuấn', username: 'phamminhtuan', email: 'tuan.pham@example.com' },
    { fullName: 'Nguyễn Thị Lan', username: 'nguyenthilan', email: 'lan.nguyen@example.com' },
    { fullName: 'Hoàng Văn Đức', username: 'hoangvanduc', email: 'duc.hoang@example.com' },
  ];

  return Array.from({ length: count }, (_, index) => {
    const userData = vietnameseNames[index % vietnameseNames.length];
    return generateMockUser({
      ...userData,
      _id: new mongoose.Types.ObjectId().toString(),
      phone: `098765${String(index).padStart(4, '0')}`,
    });
  });
}

/**
 * Generate a mock JWT token (for testing purposes - NOT cryptographically secure)
 * @param {Object} payload - Token payload
 * @param {string} secret - Secret key (optional, for test purposes)
 * @param {string} expiresIn - Expiration time (e.g., '1d', '1h')
 * @returns {string} Mock JWT token string
 */
function generateMockToken(payload = {}, secret = 'test-secret', expiresIn = '1d') {
  // This is a FAKE token for testing purposes only
  // In real tests, use jwt.sign from jsonwebtoken library or mock it
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 })
  ).toString('base64');
  const signature = 'mockSignature';
  return `${header}.${body}.${signature}`;
}

/**
 * Create a mock Error Response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} Error object with statusCode property
 */
function createMockErrorResponse(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.message = message;
  return error;
}

/**
 * Helper to verify ErrorResponse was called with specific args
 * @param {Function} mockNext - Mocked next function
 * @param {number} expectedStatusCode - Expected status code
 * @param {string|RegExp} expectedMessage - Expected message (string or regex)
 */
function expectErrorResponse(mockNext, expectedStatusCode, expectedMessage) {
  expect(mockNext).toHaveBeenCalled();
  const errorArg = mockNext.mock.calls[0][0];
  expect(errorArg).toBeInstanceOf(Error);
  expect(errorArg.statusCode).toBe(expectedStatusCode);

  if (expectedMessage instanceof RegExp) {
    expect(errorArg.message).toMatch(expectedMessage);
  } else {
    expect(errorArg.message).toContain(expectedMessage);
  }
}

/**
 * Generate a random ObjectId string
 * @returns {string} MongoDB ObjectId string
 */
function generateObjectId() {
  return new mongoose.Types.ObjectId().toString();
}

/**
 * Create a mock Mongoose model instance
 * @param {Object} data - Initial data for the instance
 * @returns {Object} Mock Mongoose model instance
 */
function createMockModelInstance(data = {}) {
  return {
    ...data,
    _id: data._id || generateObjectId(),
    save: jest.fn().mockResolvedValue(data),
    remove: jest.fn().mockResolvedValue(data),
    delete: jest.fn().mockResolvedValue(data),
    toObject: jest.fn(() => ({ ...data })),
    toJSON: jest.fn(() => ({ ...data })),
  };
}

/**
 * Factory to generate a mock product object (POJO)
 * @param {Object} overrides - Custom values to override defaults
 * @returns {Object} Mock product data object
 */
function generateMockProduct(overrides = {}) {
  const defaultProduct = {
    _id: generateObjectId(),
    name: 'Nike Air Max 90',
    summary: 'Classic running shoes',
    description: 'Comfortable and stylish running shoes',
    brand: 'Nike',
    category: generateObjectId(),
    productType: 'shoes',
    sku: 'NK-ARM-901',
    status: true,
    price: {
      regular: 2500000,
      discountPercent: 0,
      isOnSale: false,
    },
    finalPrice: 2500000,
    stock: 50,
    sales: 0,
    variants: {
      sizes: ['40', '41', '42', '43', '44'],
      colors: ['Black', 'White', 'Red'],
    },
    inventory: [
      { size: 40, color: 'Black', quantity: 10, isAvailable: true },
      { size: 41, color: 'Black', quantity: 15, isAvailable: true },
      { size: 42, color: 'Black', quantity: 20, isAvailable: true },
    ],
    mainImage: 'https://example.com/images/air-max-90.jpg',
    images: ['https://example.com/images/air-max-90-1.jpg'],
    rating: 4.5,
    isNew: false,
    attributes: {
      gender: 'unisex',
      material: 'Synthetic leather',
      season: 'All seasons',
      style: 'Casual',
      care: 'Machine washable',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    // Instance methods (mocked)
    save: jest.fn(async function () {
      return this;
    }),
    toObject: jest.fn(function () {
      const obj = { ...this };
      delete obj.save;
      delete obj.toObject;
      return obj;
    }),
  };

  return {
    ...defaultProduct,
    ...overrides,
  };
}

export {
  getMockReqRes,
  generateMockUser,
  generateVietnameseUsers,
  generateMockToken,
  createMockErrorResponse,
  expectErrorResponse,
  generateObjectId,
  createMockModelInstance,
  generateMockProduct,
};
