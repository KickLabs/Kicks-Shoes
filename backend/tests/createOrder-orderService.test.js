/**
 * @fileoverview Unit tests for OrderService
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

mongoose.startSession = jest.fn(() => mockSession);
mongoose.Types.ObjectId.isValid = jest.fn(() => true);

// --- MOCK DATA ---

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

const mockFullOrder = {
  _id: 'order_123',
  user: 'user_123',
  items: [
    {
      _id: 'item_1',
      product: 'product_123',
      quantity: 1,
      price: 100,
      color: 'Black',
      size: '42',
    },
  ],
  totalPrice: 100,
  status: 'pending',
  // ... other fields
};

const mockFlashSaleActive = {
  _id: 'fs_1',
  title: 'Active Sale',
  products: [
    {
      productId: 'product_123',
      flashPrice: 80,
      discountPercent: 20,
    },
  ],
};

const mockFlashSaleBest = {
  _id: 'fs_2',
  title: 'Best Sale',
  products: [
    {
      productId: 'product_123',
      flashPrice: 70, // Rẻ hơn
      discountPercent: 30,
    },
  ],
};

// --- MOCK MODELS ---

// Helper for chained Mongoose queries (find, findById)
const mockQuery = result => {
  let _session;
  const query = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    session: jest.fn(function (session) {
      _session = session;
      if (session && session.startTransaction) {
        session.startTransaction(); // Simulate transaction start
      }
      return query;
    }),
    exec: jest.fn().mockResolvedValue(result),
    // Hỗ trợ trực tiếp `await` trên query
    then: onFulfilled => Promise.resolve(result).then(onFulfilled),
    catch: onRejected => Promise.resolve(result).catch(onRejected),
  };
  return query;
};

// Mock Order
function MockOrder(data) {
  this._id = 'order_123';
  this.items = [];
  Object.assign(this, data);
}
MockOrder.prototype.save = function () {
  return Promise.resolve(this);
};
MockOrder.prototype.populate = function (path) {
  // Giả lập populate đơn giản
  if (path && path.path === 'items') {
    return Promise.resolve({
      ...this,
      items: [{ _id: 'item_1', product: { name: 'Mock Product' } }],
    });
  }
  return Promise.resolve(this);
};
// Static methods for Order
MockOrder.find = jest.fn(() => mockQuery([mockFullOrder]));
MockOrder.findById = jest.fn(() => mockQuery(mockFullOrder));
MockOrder.countDocuments = jest.fn().mockResolvedValue(1);
MockOrder.findByIdAndUpdate = jest.fn().mockResolvedValue(mockFullOrder);

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
  findById: jest.fn(() => mockQuery(mockProduct)), // Sử dụng mockQuery
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

// --- APPLY MOCKS ---
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

// --- GLOBAL HOOKS ---
beforeEach(() => {
  // Reset tất cả mock static và spy
  jest.clearAllMocks();
  process.env.USE_TRANSACTIONS = 'false';

  // Reset mocks
  MockFlashSale.find.mockResolvedValue([]);
  MockProduct.findById.mockImplementation(() => mockQuery(mockProduct));
  MockProduct.findByIdAndUpdate.mockResolvedValue(true);
  MockOrder.find.mockImplementation(() => mockQuery([mockFullOrder]));
  MockOrder.findById.mockImplementation(() => mockQuery(mockFullOrder));
  MockOrder.countDocuments.mockResolvedValue(1);
  MockOrder.findByIdAndUpdate.mockResolvedValue(mockFullOrder);
  MockDiscount.findOne.mockResolvedValue(mockDiscountDoc);
  mockValidateDiscountCode.mockReset();
  mongoose.Types.ObjectId.isValid.mockReturnValue(true);
  mongoose.startSession.mockClear();
  mockSession.startTransaction.mockClear();
  mockSession.commitTransaction.mockClear();
  mockSession.abortTransaction.mockClear();
  mockSession.endSession.mockClear();
});

// --- TESTS ---

// Test suite cho createOrder (Giữ nguyên của bạn)
describe('OrderService.createOrder', () => {
  let flashSaleSpy;

  beforeAll(() => {
    // Spy này chỉ mock getProductFlashSale cho block createOrder
    flashSaleSpy = jest.spyOn(OrderService, 'getProductFlashSale').mockResolvedValue(null);
  });

  beforeEach(() => {
    // Đảm bảo spy được reset về `null` cho mỗi test trong block này
    flashSaleSpy.mockResolvedValue(null);
    // Reset mock implement cho Product.findById về cái local của block này
    MockProduct.findById.mockImplementation(() => mockQuery(mockProduct));
  });

  afterAll(() => {
    // Phục hồi implementation thật sau khi block này chạy xong
    flashSaleSpy.mockRestore();
  });

  test('should create order successfully', async () => {
    const order = await OrderService.createOrder(baseOrderData);
    expect(order).toBeDefined();
    expect(order.totalPrice).toBe(100);
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
    MockProduct.findById.mockImplementation(() => mockQuery(null)); // Product not found
    await expect(OrderService.createOrder(baseOrderData)).rejects.toThrow(
      'Product with ID product_123 not found'
    );
  });

  test('should throw error if variant not found', async () => {
    const orderData = {
      ...baseOrderData,
      products: [{ id: 'product_123', quantity: 1, price: 100, color: 'Red', size: '42' }], // Red color doesn't exist
    };
    await expect(OrderService.createOrder(orderData)).rejects.toThrow('Variant for product');
  });

  test('should throw error if not enough stock', async () => {
    const orderData = {
      ...baseOrderData,
      products: [{ id: 'product_123', quantity: 20, price: 100, color: 'Black', size: '42' }], // Need 20, have 10
    };
    await expect(OrderService.createOrder(orderData)).rejects.toThrow('Not enough stock');
  });

  test('should throw error if total price does not match', async () => {
    const orderData = { ...baseOrderData, totalAmount: 50 }; // Provided 50, calculated 100
    await expect(OrderService.createOrder(orderData)).rejects.toThrow('Total price does not match');
  });

  test('should apply discount code if valid', async () => {
    mockValidateDiscountCode.mockResolvedValue({
      isValid: true,
      discountAmount: 10,
    });
    const orderData = {
      ...baseOrderData,
      totalAmount: 90, // 100 - 10
      discountCode: 'SAVE10',
    };
    const order = await OrderService.createOrder(orderData);
    expect(order).toBeDefined();
    expect(mockValidateDiscountCode).toHaveBeenCalled();
    expect(order.discount).toBe(10);
    expect(order.totalPrice).toBe(90);
    expect(mockDiscountDoc.save).toHaveBeenCalled();
  });

  test('should throw error if discount code is invalid', async () => {
    mockValidateDiscountCode.mockResolvedValue({
      isValid: false,
      message: 'Code expired',
    });
    const orderData = { ...baseOrderData, discountCode: 'EXPIRED' };
    await expect(OrderService.createOrder(orderData)).rejects.toThrow(
      'Invalid discount code: Code expired'
    );
  });

  test('should handle transaction when USE_TRANSACTIONS=true', async () => {
    process.env.USE_TRANSACTIONS = 'true';

    // Mock session để đảm bảo query gọi session.startTransaction
    const testSession = {
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      abortTransaction: jest.fn().mockResolvedValue(undefined),
      endSession: jest.fn(),
    };
    mongoose.startSession.mockResolvedValue(testSession);

    // Override mockQuery để trigger startTransaction khi session được truyền
    const testMockQuery = result => {
      const query = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        session: jest.fn(function (session) {
          if (session && session.startTransaction) {
            session.startTransaction();
          }
          return query;
        }),
        exec: jest.fn().mockResolvedValue(result),
        then: onFulfilled => Promise.resolve(result).then(onFulfilled),
        catch: onRejected => Promise.resolve(result).catch(onRejected),
      };
      return query;
    };

    MockProduct.findById.mockImplementation(() => testMockQuery(mockProduct));

    await OrderService.createOrder(baseOrderData);

    expect(mongoose.startSession).toHaveBeenCalled();
    expect(testSession.startTransaction).toHaveBeenCalled();
    expect(testSession.commitTransaction).toHaveBeenCalled();
    expect(testSession.endSession).toHaveBeenCalled();
  });

  test('should handle transaction failure gracefully', async () => {
    process.env.USE_TRANSACTIONS = 'true';

    const testSession = {
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      abortTransaction: jest.fn().mockResolvedValue(undefined),
      endSession: jest.fn(),
    };
    mongoose.startSession.mockResolvedValue(testSession);

    const testMockQuery = result => {
      const query = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        session: jest.fn(function (session) {
          if (session && session.startTransaction) {
            session.startTransaction();
          }
          return query;
        }),
        exec: jest.fn().mockResolvedValue(result),
        then: onFulfilled => Promise.resolve(result).then(onFulfilled),
        catch: onRejected => Promise.resolve(result).catch(onRejected),
      };
      return query;
    };

    MockProduct.findById.mockImplementation(() => testMockQuery(mockProduct));
    MockProduct.findByIdAndUpdate.mockRejectedValueOnce(new Error('DB error'));

    await expect(OrderService.createOrder(baseOrderData)).rejects.toThrow(
      'Failed to create order: DB error'
    );
    expect(mongoose.startSession).toHaveBeenCalled();
    expect(testSession.startTransaction).toHaveBeenCalled();
    expect(testSession.abortTransaction).toHaveBeenCalled();
    expect(testSession.commitTransaction).not.toHaveBeenCalled();
    expect(testSession.endSession).toHaveBeenCalled();
  });

  test('should update product inventory', async () => {
    await OrderService.createOrder(baseOrderData);
    expect(MockProduct.findByIdAndUpdate).toHaveBeenCalledWith(
      'product_123',
      expect.objectContaining({
        $inc: {
          'inventory.$[elem].quantity': -1,
          stock: -1,
        },
      }),
      expect.anything()
    );
  });
});

// --- BỔ SUNG CÁC TEST SUITE MỚI ---

describe('OrderService.getProductFlashSale', () => {
  test('should return null if no active flash sales found', async () => {
    MockFlashSale.find.mockResolvedValue([]);
    const result = await OrderService.getProductFlashSale('product_123');
    expect(result).toBeNull();
  });

  test('should return the flash sale if one is found', async () => {
    MockFlashSale.find.mockResolvedValue([mockFlashSaleActive]);
    const result = await OrderService.getProductFlashSale('product_123');
    expect(result).toBeDefined();
    expect(result.flashPrice).toBe(80);
    expect(result.flashSaleId).toBe('fs_1');
  });

  test('should return the best deal (lowest price) if multiple found', async () => {
    MockFlashSale.find.mockResolvedValue([mockFlashSaleActive, mockFlashSaleBest]);
    const result = await OrderService.getProductFlashSale('product_123');
    expect(result).toBeDefined();
    expect(result.flashPrice).toBe(70); // Giá tốt nhất
    expect(result.flashSaleId).toBe('fs_2');
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Multiple flash sales found for product:',
      expect.anything()
    );
  });

  test('should return null if flash sale logic fails', async () => {
    MockFlashSale.find.mockRejectedValue(new Error('DB Error'));
    const result = await OrderService.getProductFlashSale('product_123');
    expect(result).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith('Error checking flash sale:', expect.any(Error));
  });
});

describe('OrderService.getOrders', () => {
  test('should return paginated orders', async () => {
    const result = await OrderService.getOrders({ page: 1, limit: 10 });
    expect(result.orders).toHaveLength(1);
    expect(result.orders[0]._id).toBe('order_123');
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.page).toBe(1);
  });

  test('should apply status filter', async () => {
    await OrderService.getOrders({ status: 'completed' });
    expect(MockOrder.find).toHaveBeenCalledWith({ status: 'completed' });
  });

  test('should apply date filter', async () => {
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';
    await OrderService.getOrders({ startDate, endDate });
    expect(MockOrder.find).toHaveBeenCalledWith({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });
  });

  test('should throw error if DB query fails', async () => {
    MockOrder.find.mockImplementation(() => ({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(new Error('DB Error')),
      // THÊM PHẦN NÀY ĐỂ XỬ LÝ `await`
      then: (onFulfilled, onRejected) => {
        return Promise.reject(new Error('DB Error')).then(onFulfilled, onRejected);
      },
    }));
    await expect(OrderService.getOrders({})).rejects.toThrow('Failed to get orders: DB Error');
  });
});

describe('OrderService.getOrderByOrderId', () => {
  test('should throw error if orderId is missing', async () => {
    await expect(OrderService.getOrderByOrderId(null)).rejects.toThrow('Order ID is required');
  });

  test('should throw error if orderId is invalid', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);
    await expect(OrderService.getOrderByOrderId('invalid_id')).rejects.toThrow('Invalid order ID');
  });

  test('should throw error if order not found', async () => {
    MockOrder.findById.mockImplementation(() => mockQuery(null));
    await expect(OrderService.getOrderByOrderId('not_found_id')).rejects.toThrow('Order not found');
  });

  test('should return the order if found', async () => {
    const result = await OrderService.getOrderByOrderId('order_123');
    expect(result).toBeDefined();
    expect(result._id).toBe('order_123');
  });
});

describe('OrderService.getOrderByUserId', () => {
  test('should throw error if userId is missing', async () => {
    await expect(OrderService.getOrderByUserId(null)).rejects.toThrow('User ID is required');
  });

  test('should throw error if userId is invalid', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);
    await expect(OrderService.getOrderByUserId('invalid_id')).rejects.toThrow('Invalid user ID');
  });

  test('should return orders for the user', async () => {
    const result = await OrderService.getOrderByUserId('user_123', { page: 1, limit: 5 });
    expect(MockOrder.find).toHaveBeenCalledWith({ user: 'user_123' });
    expect(result.orders).toHaveLength(1);
    expect(result.pagination.limit).toBe(5);
  });
});

describe('OrderService.updateOrder', () => {
  test('should throw error if orderId is missing', async () => {
    await expect(OrderService.updateOrder(null, {})).rejects.toThrow('Order ID is required');
  });

  test('should throw error if order not found', async () => {
    MockOrder.findByIdAndUpdate.mockResolvedValue(null);
    await expect(OrderService.updateOrder('not_found_id', {})).rejects.toThrow('Order not found');
  });

  test('should update and return the order', async () => {
    const updateData = { status: 'shipped' };
    const updatedOrder = { ...mockFullOrder, status: 'shipped' };
    MockOrder.findByIdAndUpdate.mockResolvedValue(updatedOrder);

    const result = await OrderService.updateOrder('order_123', updateData);

    expect(MockOrder.findByIdAndUpdate).toHaveBeenCalledWith(
      'order_123',
      { $set: updateData },
      { new: true, runValidators: true }
    );
    expect(result.status).toBe('shipped');
  });
});

describe('OrderService.cancelOrder', () => {
  test('should throw error if order not found', async () => {
    MockOrder.findById.mockImplementation(() => mockQuery(null));
    await expect(OrderService.cancelOrder('not_found_id')).rejects.toThrow('Order not found');
  });

  test('should cancel order and restore stock', async () => {
    // Trả về order có items để test hoàn kho
    const orderWithItems = {
      ...mockFullOrder,
      items: [{ product: 'product_123', quantity: 2, color: 'Black', size: '42' }],
    };
    MockOrder.findById.mockImplementation(() => mockQuery(orderWithItems));

    // Mock product để hoàn kho
    const productForStock = { ...mockProduct, productType: 'shoes' };
    MockProduct.findById.mockImplementation(() => mockQuery(productForStock));

    // Mock order sau khi update
    const cancelledOrder = { ...orderWithItems, status: 'cancelled' };
    MockOrder.findByIdAndUpdate.mockResolvedValue(cancelledOrder);

    const result = await OrderService.cancelOrder('order_123', 'Test reason');

    // 1. Kiểm tra hoàn kho
    expect(MockProduct.findByIdAndUpdate).toHaveBeenCalledWith(
      'product_123',
      expect.objectContaining({
        $inc: {
          'inventory.$[elem].quantity': 2, // Hoàn lại 2
          stock: 2,
        },
      }),
      expect.anything()
    );

    // 2. Kiểm tra update order
    expect(MockOrder.findByIdAndUpdate).toHaveBeenCalledWith(
      'order_123',
      expect.objectContaining({
        $set: expect.objectContaining({
          status: 'cancelled',
          cancellationReason: 'Test reason',
        }),
      }),
      expect.anything()
    );
    expect(result.status).toBe('cancelled');
  });

  test('should handle transaction on cancel', async () => {
    process.env.USE_TRANSACTIONS = 'true';

    // Tạo session riêng cho test này
    const testSession = {
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      abortTransaction: jest.fn().mockResolvedValue(undefined),
      endSession: jest.fn(),
    };
    mongoose.startSession.mockResolvedValue(testSession);

    // Mock query với session trigger
    const testMockQuery = result => {
      const query = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        session: jest.fn(function (session) {
          if (session && session.startTransaction) {
            session.startTransaction();
          }
          return query;
        }),
        exec: jest.fn().mockResolvedValue(result),
        then: onFulfilled => Promise.resolve(result).then(onFulfilled),
        catch: onRejected => Promise.resolve(result).catch(onRejected),
      };
      return query;
    };

    MockOrder.findById.mockImplementation(() => testMockQuery(mockFullOrder));
    MockProduct.findById.mockImplementation(() => testMockQuery(mockProduct));

    await OrderService.cancelOrder('order_123');

    expect(mongoose.startSession).toHaveBeenCalled();
    expect(testSession.startTransaction).toHaveBeenCalled();
    expect(testSession.commitTransaction).toHaveBeenCalled();
    expect(testSession.endSession).toHaveBeenCalled();
  });

  test('should abort transaction on cancel failure', async () => {
    process.env.USE_TRANSACTIONS = 'true';

    // Tạo session riêng cho test này
    const testSession = {
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      abortTransaction: jest.fn().mockResolvedValue(undefined),
      endSession: jest.fn(),
    };
    mongoose.startSession.mockResolvedValue(testSession);

    // Mock query với session trigger
    const testMockQuery = result => {
      const query = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        session: jest.fn(function (session) {
          if (session && session.startTransaction) {
            session.startTransaction();
          }
          return query;
        }),
        exec: jest.fn().mockResolvedValue(result),
        then: onFulfilled => Promise.resolve(result).then(onFulfilled),
        catch: onRejected => Promise.resolve(result).catch(onRejected),
      };
      return query;
    };

    MockOrder.findById.mockImplementation(() => testMockQuery(mockFullOrder));
    MockProduct.findById.mockImplementation(() => testMockQuery(mockProduct));
    MockProduct.findByIdAndUpdate.mockRejectedValue(new Error('Stock restore error'));

    await expect(OrderService.cancelOrder('order_123')).rejects.toThrow('Stock restore error');

    expect(mongoose.startSession).toHaveBeenCalled();
    expect(testSession.startTransaction).toHaveBeenCalled();
    expect(testSession.abortTransaction).toHaveBeenCalled();
    expect(testSession.commitTransaction).not.toHaveBeenCalled();
    expect(testSession.endSession).toHaveBeenCalled();
  });
});

describe('OrderService.refundOrder', () => {
  test('should throw error if order not found', async () => {
    MockOrder.findByIdAndUpdate.mockResolvedValue(null);
    await expect(OrderService.refundOrder('not_found_id', {})).rejects.toThrow('Order not found');
  });

  test('should update order to refunded status', async () => {
    const refundData = {
      reason: 'Item damaged',
      amount: 100,
      refundTransactionNo: 'REF123',
    };
    const refundedOrder = { ...mockFullOrder, status: 'refunded', refundAmount: 100 };
    MockOrder.findByIdAndUpdate.mockResolvedValue(refundedOrder);

    const result = await OrderService.refundOrder('order_123', refundData);

    expect(MockOrder.findByIdAndUpdate).toHaveBeenCalledWith(
      'order_123',
      {
        $set: expect.objectContaining({
          status: 'refunded',
          refundReason: 'Item damaged',
          refundAmount: 100,
          refundTransactionNo: 'REF123',
        }),
      },
      { new: true, runValidators: true }
    );
    expect(result.status).toBe('refunded');
    expect(result.refundAmount).toBe(100);
  });
});
