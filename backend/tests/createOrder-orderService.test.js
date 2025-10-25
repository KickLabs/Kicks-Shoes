/**
 * @fileoverview Unit tests for OrderService.createOrder
 * @file order-service.test.js
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// --- MOCK SETUP ---

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockValidateDiscountCode = jest.fn();

const mockSession = {
  startTransaction: jest.fn().mockResolvedValue(undefined),
  commitTransaction: jest.fn().mockResolvedValue(undefined),
  abortTransaction: jest.fn().mockResolvedValue(undefined),
  endSession: jest.fn(),
};

mongoose.startSession = jest.fn(() => Promise.resolve(mockSession));
mongoose.Types.ObjectId.isValid = jest.fn(() => true);

// Mock Order
function MockOrder(data) {
  this._id = 'order_123';
  this.items = [];
  Object.assign(this, data);
}

MockOrder.prototype.save = function () {
  return Promise.resolve(this);
};

MockOrder.prototype.populate = function () {
  return Promise.resolve({ ...this, items: [] });
};

// Mock OrderItem
function MockOrderItem(data) {
  this._id = `item_${Math.random()}`;
  Object.assign(this, data);
}

MockOrderItem.prototype.save = function () {
  return Promise.resolve(this);
};

// Mock Product
const MockProduct = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn().mockResolvedValue(true),
};

// Mock FlashSale
const MockFlashSale = {
  find: jest.fn().mockResolvedValue([]),
};

// Mock Discount
const mockDiscountDoc = {
  _id: 'discount_id',
  code: 'TESTCODE',
  usedCount: 0,
  save: jest.fn().mockResolvedValue(undefined),
};

const MockDiscount = {
  findOne: jest.fn().mockResolvedValue(mockDiscountDoc),
};

// Apply mocks
jest.unstable_mockModule('../src/utils/logger.js', () => ({ default: mockLogger }));
jest.unstable_mockModule('../src/services/discount.service.js', () => ({
  validateDiscountCode: mockValidateDiscountCode,
}));
jest.unstable_mockModule('../src/models/Order.js', () => ({ default: MockOrder }));
jest.unstable_mockModule('../src/models/OrderItem.js', () => ({ default: MockOrderItem }));
jest.unstable_mockModule('../src/models/Product.js', () => ({ default: MockProduct }));
jest.unstable_mockModule('../src/models/FlashSale.js', () => ({ default: MockFlashSale }));
jest.unstable_mockModule('../src/models/Discount.js', () => ({ default: MockDiscount }));

// Import service
const { OrderService } = await import('../src/services/order.service.js');

// --- TEST DATA ---

const mockProduct = {
  _id: 'product_123',
  name: 'Nike Air Max',
  productType: 'shoes',
  inventory: [
    { color: 'Black', size: 42, quantity: 10 },
    { color: 'White', size: 41, quantity: 5 },
  ],
};

const baseOrderData = {
  user: 'user_123',
  products: [{ id: 'product_123', quantity: 1, price: 100, color: 'Black', size: '42' }],
  totalAmount: 100,
  paymentMethod: 'COD',
  shippingAddress: { name: 'Test User', phone: '0905123456', address: '123 Test St' },
  shippingCost: 0,
  tax: 0,
  discount: 0,
};

// --- TESTS ---

describe('OrderService.createOrder', () => {
  let flashSaleSpy;

  beforeAll(() => {
    flashSaleSpy = jest.spyOn(OrderService, 'getProductFlashSale').mockResolvedValue(null);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    flashSaleSpy.mockResolvedValue(null);
    process.env.USE_TRANSACTIONS = 'false';
    MockProduct.findById.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: resolve => resolve(null),
    }));
  });

  afterAll(() => {
    flashSaleSpy.mockRestore();
  });

  test('should create order successfully', async () => {
    MockProduct.findById.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: resolve => resolve(mockProduct),
    }));

    const order = await OrderService.createOrder(baseOrderData);

    expect(order).toBeDefined();
    expect(mockLogger.info).toHaveBeenCalledWith('Order created successfully', expect.anything());
  });

  test('should throw error if user is missing', async () => {
    await expect(OrderService.createOrder({ ...baseOrderData, user: null })).rejects.toThrow(
      'Missing required fields'
    );
  });

  test('should throw error if products is empty', async () => {
    await expect(OrderService.createOrder({ ...baseOrderData, products: [] })).rejects.toThrow(
      'Products must be a non-empty array'
    );
  });

  test('should throw error if product not found', async () => {
    MockProduct.findById.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: resolve => resolve(null),
    }));

    await expect(OrderService.createOrder(baseOrderData)).rejects.toThrow(
      'Product with ID product_123 not found'
    );
  });

  test('should throw error if variant not found', async () => {
    MockProduct.findById.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: resolve => resolve(mockProduct),
    }));

    const orderData = {
      ...baseOrderData,
      products: [{ id: 'product_123', quantity: 1, price: 100, color: 'Red', size: '42' }],
    };

    await expect(OrderService.createOrder(orderData)).rejects.toThrow('Variant for product');
  });

  test('should throw error if not enough stock', async () => {
    MockProduct.findById.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: resolve => resolve(mockProduct),
    }));

    const orderData = {
      ...baseOrderData,
      products: [{ id: 'product_123', quantity: 20, price: 100, color: 'Black', size: '42' }],
    };

    await expect(OrderService.createOrder(orderData)).rejects.toThrow('Not enough stock');
  });

  test('should throw error if total price does not match', async () => {
    MockProduct.findById.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: resolve => resolve(mockProduct),
    }));

    const orderData = { ...baseOrderData, totalAmount: 50 };

    await expect(OrderService.createOrder(orderData)).rejects.toThrow('Total price does not match');
  });

  test('should apply discount code if valid', async () => {
    MockProduct.findById.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: resolve => resolve(mockProduct),
    }));

    mockValidateDiscountCode.mockResolvedValue({
      isValid: true,
      discountAmount: 10,
    });

    const orderData = {
      ...baseOrderData,
      totalAmount: 90,
      discountCode: 'SAVE10',
    };

    const order = await OrderService.createOrder(orderData);

    expect(order).toBeDefined();
    expect(mockValidateDiscountCode).toHaveBeenCalled();
  });

  test('should throw error if discount code is invalid', async () => {
    MockProduct.findById.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: resolve => resolve(mockProduct),
    }));

    mockValidateDiscountCode.mockResolvedValue({
      isValid: false,
      message: 'Code expired',
    });

    const orderData = { ...baseOrderData, discountCode: 'EXPIRED' };

    await expect(OrderService.createOrder(orderData)).rejects.toThrow('Invalid discount code');
  });

  test('should handle transaction when USE_TRANSACTIONS=true', async () => {
    process.env.USE_TRANSACTIONS = 'true';

    MockProduct.findById.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: resolve => resolve(mockProduct),
    }));

    const order = await OrderService.createOrder(baseOrderData);

    expect(order).toBeDefined();
  });

  test('should handle transaction failure gracefully', async () => {
    process.env.USE_TRANSACTIONS = 'true';

    MockProduct.findById.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: resolve => resolve(mockProduct),
    }));

    MockProduct.findByIdAndUpdate.mockRejectedValueOnce(new Error('DB error'));

    await expect(OrderService.createOrder(baseOrderData)).rejects.toThrow('Failed to create order');
  });

  test('should update product inventory', async () => {
    MockProduct.findById.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: resolve => resolve(mockProduct),
    }));

    await OrderService.createOrder(baseOrderData);

    expect(MockProduct.findByIdAndUpdate).toHaveBeenCalledWith(
      'product_123',
      expect.objectContaining({
        $inc: expect.objectContaining({
          'inventory.$[elem].quantity': -1,
          stock: -1,
        }),
      }),
      expect.anything()
    );
  });

  test('should handle multiple products', async () => {
    MockProduct.findById.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: resolve => resolve(mockProduct),
    }));

    const orderData = {
      ...baseOrderData,
      products: [
        { id: 'product_123', quantity: 1, price: 100, color: 'Black', size: '42' },
        { id: 'product_123', quantity: 1, price: 100, color: 'White', size: '41' },
      ],
      totalAmount: 200,
    };

    const order = await OrderService.createOrder(orderData);

    expect(order).toBeDefined();
    expect(MockProduct.findById).toHaveBeenCalledTimes(4); // 2 products x 2 calls each
  });

  test('should handle order with shipping cost and tax', async () => {
    MockProduct.findById.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: resolve => resolve(mockProduct),
    }));

    const orderData = {
      ...baseOrderData,
      shippingCost: 20,
      tax: 5,
      totalAmount: 125,
    };

    const order = await OrderService.createOrder(orderData);

    expect(order).toBeDefined();
  });

  test('should handle order with notes', async () => {
    MockProduct.findById.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: resolve => resolve(mockProduct),
    }));

    const orderData = {
      ...baseOrderData,
      notes: 'Please deliver after 5 PM',
    };

    const order = await OrderService.createOrder(orderData);

    expect(order).toBeDefined();
  });

  test('should use totalPrice when totalAmount not provided', async () => {
    MockProduct.findById.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: resolve => resolve(mockProduct),
    }));

    const orderData = {
      ...baseOrderData,
      totalAmount: undefined,
      totalPrice: 100,
    };

    const order = await OrderService.createOrder(orderData);

    expect(order).toBeDefined();
  });
});
