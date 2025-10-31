/**
 * Email Test Utilities
 * Helper functions and mock factories for email testing
 */

import { jest } from '@jest/globals';

/**
 * Mock OAuth2Client
 */
export const createMockOAuth2Client = () => ({
  getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-access-token' }),
  setCredentials: jest.fn(),
});

/**
 * Mock Nodemailer Transport
 */
export const createMockTransport = () => ({
  sendMail: jest.fn().mockResolvedValue({
    messageId: '<mock-message-id@gmail.com>',
    accepted: ['recipient@test.com'],
    rejected: [],
  }),
});

/**
 * Mock Logger
 */
export const createMockLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
});

/**
 * Mock User Data
 */
export const createMockUser = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  email: 'user@test.com',
  fullName: 'Test User',
  phone: '0123456789',
  username: 'testuser',
  role: 'customer',
  ...overrides,
});

/**
 * Mock Product Data
 */
export const createMockProduct = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439013',
  name: 'Nike Air Max',
  mainImage: 'nike-air-max.jpg',
  price: 1000000,
  brand: 'Nike',
  stock: 100,
  ...overrides,
});

/**
 * Mock Order Data (Simple)
 */
export const createMockOrder = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439012',
  user: '507f1f77bcf86cd799439011',
  totalPrice: 1000000,
  subtotal: 900000,
  shippingCost: 50000,
  tax: 50000,
  discount: 0,
  status: 'pending',
  paymentMethod: 'COD',
  shippingAddress: '123 Test Street, Test City',
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Mock Order with Items
 */
export const createMockOrderWithItems = (itemCount = 2, overrides = {}) => ({
  ...createMockOrder(),
  items: Array.from({ length: itemCount }, (_, i) => ({
    _id: `item${i + 1}`,
    product: {
      _id: `product${i + 1}`,
      name: `Nike Shoe ${i + 1}`,
      mainImage: `image${i + 1}.jpg`,
      price: 500000,
    },
    quantity: 2,
    price: 500000,
    size: '42',
    color: 'Black',
  })),
  populate: jest.fn().mockResolvedValue(this),
  ...overrides,
});

/**
 * Mock Discount Data
 */
export const createMockDiscountData = (overrides = {}) => ({
  code: 'SAVE50',
  value: 50000,
  description: 'Reward points discount',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2026-01-01'),
  points: 50,
  ...overrides,
});

/**
 * Mock Email Template
 */
export const createMockTemplate = (overrides = {}) => ({
  subject: 'Test Email Subject',
  getContent: jest.fn().mockReturnValue('<html><body>Test Email Content</body></html>'),
  ...overrides,
});

/**
 * Create Mock Order with Populate Function
 */
export const createMockOrderWithPopulate = (items = [], overrides = {}) => {
  const order = {
    ...createMockOrder(),
    items: items.length > 0 ? items : ['itemId1', 'itemId2'],
    ...overrides,
  };

  order.populate = jest.fn().mockResolvedValue({
    ...order,
    items:
      items.length > 0
        ? items
        : [
            {
              _id: 'item1',
              product: {
                _id: 'product1',
                name: 'Nike Air Max',
                mainImage: 'image1.jpg',
                price: 500000,
              },
              quantity: 2,
              price: 500000,
            },
            {
              _id: 'item2',
              product: {
                _id: 'product2',
                name: 'Adidas Ultraboost',
                mainImage: 'image2.jpg',
                price: 600000,
              },
              quantity: 1,
              price: 600000,
            },
          ],
  });

  return order;
};

/**
 * Mock Request Object
 */
export const mockRequest = (params = {}, body = {}, query = {}, user = null) => ({
  params,
  body,
  query,
  user,
  headers: {
    authorization: user ? 'Bearer mock-token' : undefined,
    'content-type': 'application/json',
  },
});

/**
 * Mock Response Object
 */
export const mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Mock Next Function
 */
export const mockNext = jest.fn();

/**
 * Reset All Mocks
 */
export const resetAllMocks = (...mocks) => {
  mocks.forEach(mock => {
    if (mock && typeof mock.mockClear === 'function') {
      mock.mockClear();
    }
  });
};

/**
 * Verify Email Content Contains
 */
export const expectEmailContentContains = (content, expectedStrings) => {
  expectedStrings.forEach(str => {
    expect(content).toContain(str);
  });
};

/**
 * Create Mock Email Config
 */
export const createMockEmailConfig = (overrides = {}) => ({
  googleMailerClientId: 'mock-client-id',
  googleMailerClientSecret: 'mock-client-secret',
  googleMailerRefreshToken: 'mock-refresh-token',
  adminEmailAddress: 'admin@test.com',
  fromName: 'Kicks Shoes',
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'test@gmail.com',
      pass: 'testpassword',
    },
  },
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 5000,
  defaultLanguage: 'en',
  defaultTimezone: 'UTC',
  ...overrides,
});

export default {
  createMockOAuth2Client,
  createMockTransport,
  createMockLogger,
  createMockUser,
  createMockProduct,
  createMockOrder,
  createMockOrderWithItems,
  createMockDiscountData,
  createMockTemplate,
  createMockOrderWithPopulate,
  mockRequest,
  mockResponse,
  mockNext,
  resetAllMocks,
  expectEmailContentContains,
  createMockEmailConfig,
};
