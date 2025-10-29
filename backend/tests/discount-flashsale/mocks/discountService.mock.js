/**
 * @fileoverview Discount Service Mock
 * @created 2025-01-27
 * @file discountService.mock.js
 * @description Mock module for discount service with in-memory operations
 */

// In-memory storage for mock data
let mockDiscounts = [];
let mockOrders = [];
let mockFlashSales = [];

// Mock discount service functions
export const validateDiscountCode = jest.fn();
export const applyDiscountToOrder = jest.fn();
export const getActiveDiscounts = jest.fn();

// Mock discount model
export const Discount = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  updateMany: jest.fn(),
};

// Mock flash sale model
export const FlashSale = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  updateMany: jest.fn(),
};

// Mock order model
export const Order = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  updateMany: jest.fn(),
};

// Mock product model
export const Product = {
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
};

// Mock logger
export const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Helper functions for test data management
export const __setMockDiscounts = discounts => {
  mockDiscounts = discounts;
};

export const __setMockOrders = orders => {
  mockOrders = orders;
};

export const __setMockFlashSales = flashSales => {
  mockFlashSales = flashSales;
};

export const __clear = () => {
  mockDiscounts = [];
  mockOrders = [];
  mockFlashSales = [];
  jest.clearAllMocks();
};

// Mock data generators
export const generateMockDiscount = (overrides = {}) => ({
  _id: 'discount123',
  code: 'SAVE20',
  type: 'percentage',
  value: 20,
  minPurchase: 0,
  maxDiscount: null,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  usageLimit: 100,
  usedCount: 0,
  perUserLimit: 1,
  status: 'active',
  description: '20% off discount',
  applicableProducts: [],
  applicableCategories: [],
  isValid: jest.fn().mockReturnValue(true),
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

export const generateMockFlashSale = (overrides = {}) => ({
  _id: 'flashsale123',
  title: 'Summer Sale',
  description: 'Summer flash sale',
  products: [
    {
      productId: 'prod123',
      discountPercent: 20,
      flashPrice: 800,
    },
  ],
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const generateMockOrder = (overrides = {}) => ({
  _id: 'order123',
  user: 'user123',
  items: [
    {
      product: 'prod123',
      quantity: 1,
      price: 1000,
    },
  ],
  subtotal: 1000,
  discount: 0,
  discountCode: null,
  shippingCost: 0,
  tax: 0,
  totalPrice: 1000,
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const generateMockProduct = (overrides = {}) => ({
  _id: 'prod123',
  name: 'Test Product',
  price: 1000,
  brand: 'Test Brand',
  category: 'category123',
  productType: 'shoes',
  status: true,
  stock: 10,
  images: ['image1.jpg'],
  mainImage: 'image1.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Default export
export default {
  validateDiscountCode,
  applyDiscountToOrder,
  getActiveDiscounts,
  Discount,
  FlashSale,
  Order,
  Product,
  logger,
  __setMockDiscounts,
  __setMockOrders,
  __setMockFlashSales,
  __clear,
  generateMockDiscount,
  generateMockFlashSale,
  generateMockOrder,
  generateMockProduct,
};
