import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Mock setup
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

// Mock data
const mockProduct = {
  _id: 'product_123',
  name: 'Nike Air Max',
  productType: 'shoes',
  inventory: [
    { color: 'Black', size: 42, quantity: 10 },
    { color: 'White', size: 41, quantity: 5 },
  ],
  save: jest.fn(),
};

const mockOrderItem = {
  _id: 'item_1',
  product: 'product_123',
  order: 'order_123',
  quantity: 1,
  price: 100,
  color: 'Black',
  size: '42',
  subtotal: 100,
};

const mockFullOrder = {
  _id: 'order_123',
  user: 'user_123',
  items: [
    {
      ...mockOrderItem,
      product: {
        _id: 'product_123',
        name: 'Nike Air Max',
        mainImage: 'image.jpg',
        price: 100,
        inventory: mockProduct.inventory,
      },
    },
  ],
  totalPrice: 100,
  subtotal: 100,
  status: 'pending',
  save: jest.fn(),
};

// Mock query helper
const mockQuery = result => {
  const query = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    session: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
    then: onFulfilled => Promise.resolve(result).then(onFulfilled),
    catch: onRejected => Promise.resolve(result).catch(onRejected),
  };
  return query;
};

// Mock Order
function MockOrder(data) {
  this._id = data?._id || 'order_123';
  this.items = data?.items || [];
  this.user = data?.user || 'user_123';
  this.totalPrice = data?.totalPrice || 100;
  this.subtotal = data?.subtotal || 100;
  this.status = data?.status || 'pending';
  Object.assign(this, data);
}
MockOrder.prototype.save = jest.fn().mockImplementation(function () {
  return Promise.resolve(this);
});
MockOrder.prototype.populate = jest.fn().mockImplementation(function () {
  return Promise.resolve(this);
});
MockOrder.find = jest.fn(() => mockQuery([mockFullOrder]));
MockOrder.findById = jest.fn(() => mockQuery(mockFullOrder));
MockOrder.countDocuments = jest.fn().mockResolvedValue(1);
MockOrder.findByIdAndUpdate = jest.fn().mockResolvedValue(mockFullOrder);

// Mock OrderItem
function MockOrderItem(data) {
  this._id = data?._id || `item_${Math.random()}`;
  Object.assign(this, data || mockOrderItem);
}
MockOrderItem.prototype.save = jest.fn().mockImplementation(function () {
  return Promise.resolve(this);
});

// Mock Product
const MockProduct = {
  findById: jest.fn(() => mockQuery(mockProduct)),
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

describe('OrderService.cancelOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.USE_TRANSACTIONS = 'false';

    MockProduct.findById.mockImplementation(() => mockQuery(mockProduct));
    MockProduct.findByIdAndUpdate.mockResolvedValue(true);
    MockOrder.findById.mockImplementation(() => mockQuery(mockFullOrder));

    mongoose.startSession.mockClear();
    mockSession.startTransaction.mockClear();
    mockSession.commitTransaction.mockClear();
    mockSession.abortTransaction.mockClear();
    mockSession.endSession.mockClear();
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
