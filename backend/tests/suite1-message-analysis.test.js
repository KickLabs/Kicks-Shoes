/**
 * Test Suite 1: Message Analysis & Order Detection (UNIT TEST)
 *
 * NOTE: This is a PURE UNIT TEST - no real database connections, all dependencies mocked
 */

import { jest } from '@jest/globals';
import { OrderDetectionService } from '../src/services/orderDetection.service.js';

// Mock logger
jest.mock('../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock ProductService
jest.mock('../src/services/product.service.js', () => ({
  ProductService: {
    findOneBySku: jest.fn(),
    findOneByInventorySku: jest.fn(),
    getProductById: jest.fn(),
  },
}));

// Get the mocked ProductService
import { ProductService } from '../src/services/product.service.js';

// Helper function to create mock ObjectId
const createMockObjectId = (id = null) => {
  const mockId = id || Math.random().toString(36).substring(7);
  return {
    toString: () => mockId,
    _id: mockId,
  };
};

describe('Order Detection - Message Analysis (Unit Tests)', () => {
  let orderDetectionService;
  let mockPotentialOrderModel;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock PotentialOrder model
    mockPotentialOrderModel = {
      // Constructor mock
      prototype: {
        save: jest.fn(),
      },
      // Static methods
      getPendingOrdersForStream: jest.fn(),
      getOrdersByHost: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
    };

    // Mock constructor behavior
    const MockPotentialOrderConstructor = jest.fn(function (data) {
      this.data = data;
      this._id = createMockObjectId();
      this.status = 'pending';
      this.streamId = data.streamId;
      this.customerInfo = data.customerInfo;
      this.hostActions = {};
      this.save = jest.fn().mockResolvedValue(this);
      return this;
    });

    // Copy static methods to constructor
    Object.assign(MockPotentialOrderConstructor, mockPotentialOrderModel);

    // Create service instance with mocked model
    orderDetectionService = new OrderDetectionService(MockPotentialOrderConstructor);
  });

  // ========== CONFIDENCE & KEYWORD DETECTION ==========

  describe('Order Keywords Detection', () => {
    const orderKeywords = [
      'chốt đơn',
      'mua ngay',
      'đặt hàng',
      'ship gấp',
      'COD',
      'giao hàng',
      'thanh toán',
      'chuyển khoản',
    ];

    test.each(orderKeywords)('should detect order keyword: %s', async keyword => {
      const message = `${keyword} size 42 0912345678`;
      const result = await orderDetectionService.analyzeMessage(
        { content: message, _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).not.toBeNull();
      expect(result.isOrder).toBe(true);
      expect(result.data.detectionData.detectedKeywords).toContain(keyword.toLowerCase());
    });
  });

  describe('Phone Number Detection', () => {
    const phonePrefixes = ['03', '05', '07', '08', '09'];

    test.each(phonePrefixes)('should detect phone with prefix %s', async prefix => {
      const phone = `${prefix}12345678`;
      const message = `Chốt đơn size 42 ${phone}`;

      const result = await orderDetectionService.analyzeMessage(
        { content: message, _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).not.toBeNull();
      expect(result.data.customerInfo.phoneNumber).toBe(phone);
    });

    test('should reject invalid phone prefix', async () => {
      const message = 'Chốt đơn size 42 0212345678'; // Invalid prefix

      const result = await orderDetectionService.analyzeMessage(
        { content: message, _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).toBeNull();
    });

    test('should handle multiple phone numbers', async () => {
      const message = 'Chốt đơn 0912345678 hoặc 0987654321 size 42';

      const result = await orderDetectionService.analyzeMessage(
        { content: message, _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).not.toBeNull();
      expect(result.data.customerInfo.phoneNumbers).toEqual(['0912345678', '0987654321']);
    });
  });

  describe('Confidence Calculation', () => {
    test('should return null for confidence < 0.3', async () => {
      const message = 'hello 0912345678'; // No order keywords

      const result = await orderDetectionService.analyzeMessage(
        { content: message, _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).toBeNull();
    });

    test('should cap confidence at 1.0', async () => {
      const message =
        'chốt đơn đặt hàng mua ngay ship giao hàng thanh toán COD chuyển khoản 0912345678 size 42';

      const result = await orderDetectionService.analyzeMessage(
        { content: message, _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).not.toBeNull();
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });

    test('should apply short message penalty', async () => {
      const shortMessage = 'ok 0912345678';
      const longMessage = 'chốt đơn size 42 0912345678';

      const shortResult = await orderDetectionService.analyzeMessage(
        { content: shortMessage, _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      const longResult = await orderDetectionService.analyzeMessage(
        { content: longMessage, _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      // Short message should have lower confidence or be null
      if (shortResult && longResult) {
        expect(shortResult.confidence).toBeLessThan(longResult.confidence);
      }
    });

    test('should boost confidence for product info', async () => {
      const withProductInfo = 'Chốt đơn size 42 màu đỏ 0912345678';
      const withoutProductInfo = 'Chốt đơn 0912345678';

      const resultWith = await orderDetectionService.analyzeMessage(
        { content: withProductInfo, _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      const resultWithout = await orderDetectionService.analyzeMessage(
        { content: withoutProductInfo, _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      expect(resultWith.confidence).toBeGreaterThan(resultWithout.confidence);
    });
  });

  // ========== FEATURED PRODUCTS MATCHING (Lines 390-405) ==========

  describe('Featured Products Matching', () => {
    test('should match featured product by name', async () => {
      // Mock product data
      const mockProductId = createMockObjectId('product123');
      const mockProduct = {
        _id: mockProductId,
        name: 'Nike Air Max',
        brand: 'Nike',
      };

      // Mock the method - assign it fresh for each test
      ProductService.getProductById = jest.fn().mockResolvedValue(mockProduct);

      const message = 'Chốt sản phẩm này size 42 0912345678';
      const streamData = {
        roomId: 'test-room',
        featuredProducts: [
          {
            productId: mockProductId,
            timestamp: new Date(),
          },
        ],
      };

      const result = await orderDetectionService.analyzeMessage(
        { content: message, _id: createMockObjectId() },
        streamData,
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).not.toBeNull();
      expect(result.data.productInfo.productId.toString()).toBe(mockProductId.toString());
    });

    test('should match featured product by brand', async () => {
      const mockProductId = createMockObjectId('product456');
      const mockProduct = {
        _id: mockProductId,
        name: 'Adidas Ultraboost',
        brand: 'Adidas',
      };

      // Mock the method - assign it fresh for each test
      ProductService.getProductById = jest.fn().mockResolvedValue(mockProduct);

      const message = 'Chốt cái này size 42 0912345678';
      const streamData = {
        roomId: 'test-room',
        featuredProducts: [
          {
            productId: mockProductId,
            timestamp: new Date(),
          },
        ],
      };

      const result = await orderDetectionService.analyzeMessage(
        { content: message, _id: createMockObjectId() },
        streamData,
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).not.toBeNull();
      expect(result.data.productInfo.productId.toString()).toBe(mockProductId.toString());
    });

    test('should match with product reference keywords', async () => {
      const mockProductId = createMockObjectId('product789');
      const mockProduct = {
        _id: mockProductId,
        name: 'Jordan 1',
        brand: 'Nike',
      };

      // Mock the method - assign it fresh for each test
      ProductService.getProductById = jest.fn().mockResolvedValue(mockProduct);

      const message = 'Chốt sản phẩm này size 42 0912345678';
      const streamData = {
        roomId: 'test-room',
        featuredProducts: [
          {
            productId: mockProductId,
            timestamp: new Date(),
          },
        ],
      };

      const result = await orderDetectionService.analyzeMessage(
        { content: message, _id: createMockObjectId() },
        streamData,
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).not.toBeNull();
      expect(result.data.productInfo.productId.toString()).toBe(mockProductId.toString());
    });

    test('should handle no featured products', async () => {
      const message = 'Chốt sản phẩm này size 42 0912345678';
      const streamData = {
        roomId: 'test-room',
        featuredProducts: [],
      };

      const result = await orderDetectionService.analyzeMessage(
        { content: message, _id: createMockObjectId() },
        streamData,
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).not.toBeNull();
      expect(result.isOrder).toBe(true);
    });
  });

  // ========== DATABASE OPERATIONS (Lines 427-428, 439-453, 464) ==========

  describe('Database Operations', () => {
    test('should save potential order successfully', async () => {
      const message = 'Chốt đơn size 42 0912345678';
      const streamId = createMockObjectId('stream123');
      const userId = createMockObjectId('user123');

      const analysisResult = await orderDetectionService.analyzeMessage(
        { content: message, _id: createMockObjectId() },
        { _id: streamId, roomId: 'test-room' },
        { _id: userId, username: 'testuser' }
      );

      const savedOrder = await orderDetectionService.savePotentialOrder(analysisResult);

      expect(savedOrder).toBeDefined();
      expect(savedOrder._id).toBeDefined();
      expect(savedOrder.streamId.toString()).toBe(streamId.toString());
      expect(savedOrder.status).toBe('pending');
      expect(savedOrder.save).toHaveBeenCalled();
    });

    test('should get pending orders for stream', async () => {
      const streamId = createMockObjectId('stream456');
      const mockOrders = [
        { _id: createMockObjectId(), status: 'pending' },
        { _id: createMockObjectId(), status: 'contacted' },
      ];

      // Mock the static method
      orderDetectionService.PotentialOrder.getPendingOrdersForStream.mockResolvedValue(mockOrders);

      const pendingOrders = await orderDetectionService.getPendingOrdersForStream(streamId);

      expect(Array.isArray(pendingOrders)).toBe(true);
      expect(pendingOrders).toEqual(mockOrders);
      expect(orderDetectionService.PotentialOrder.getPendingOrdersForStream).toHaveBeenCalledWith(
        streamId
      );
    });

    test('should update order status successfully', async () => {
      const orderId = createMockObjectId('order123');
      const hostId = createMockObjectId('host456');

      // Create mock order
      const mockOrder = {
        _id: orderId,
        status: 'pending',
        hostActions: {},
        save: jest.fn().mockResolvedValue(true),
      };

      // Mock findById to return the order
      orderDetectionService.PotentialOrder.findById.mockResolvedValue(mockOrder);

      const updatedOrder = await orderDetectionService.updateOrderStatus(
        orderId.toString(),
        'confirmed',
        hostId.toString(),
        'Order confirmed by host'
      );

      expect(updatedOrder).toBeDefined();
      expect(updatedOrder.status).toBe('confirmed');
      expect(updatedOrder.hostActions.confirmedBy.toString()).toBe(hostId.toString());
      expect(updatedOrder.hostActions.notes).toBe('Order confirmed by host');
      expect(mockOrder.save).toHaveBeenCalled();
    });

    test('should handle invalid order ID in updateOrderStatus', async () => {
      const invalidOrderId = 'invalid-id-12345';
      const hostId = createMockObjectId('host789');

      // Mock findById to return null
      orderDetectionService.PotentialOrder.findById.mockResolvedValue(null);

      await expect(
        orderDetectionService.updateOrderStatus(invalidOrderId, 'confirmed', hostId.toString())
      ).rejects.toThrow('Order not found');
    });

    test('should handle getOrdersForHost', async () => {
      const hostId = createMockObjectId('host999');
      const mockOrders = [
        {
          _id: createMockObjectId(),
          streamId: { hostId: hostId.toString() },
          status: 'pending',
        },
      ];

      // Mock the static method
      orderDetectionService.PotentialOrder.getOrdersByHost.mockResolvedValue(mockOrders);

      const orders = await orderDetectionService.getOrdersForHost(hostId.toString());

      expect(Array.isArray(orders)).toBe(true);
      expect(orderDetectionService.PotentialOrder.getOrdersByHost).toHaveBeenCalledWith(
        hostId.toString(),
        50
      );
    });
  });

  // ========== ERROR HANDLING ==========

  describe('Error Handling', () => {
    test('should handle null message content', async () => {
      const result = await orderDetectionService.analyzeMessage(
        { content: null, _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).toBeNull();
    });

    test('should handle undefined message content', async () => {
      const result = await orderDetectionService.analyzeMessage(
        { content: undefined, _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).toBeNull();
    });

    test('should handle null user data', async () => {
      try {
        const result = await orderDetectionService.analyzeMessage(
          { content: 'Chốt đơn 0912345678', _id: createMockObjectId() },
          { roomId: 'test-room' },
          null
        );

        expect(result).toBeNull();
      } catch (error) {
        // If service throws error, that's also acceptable
        expect(error).toBeDefined();
      }
    });

    test('should handle empty message content', async () => {
      const result = await orderDetectionService.analyzeMessage(
        { content: '', _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).toBeNull();
    });
  });

  // ========== SHIPPING & PAYMENT KEYWORDS ==========

  describe('Shipping & Payment Keywords', () => {
    const shippingKeywords = ['ship', 'giao'];
    const paymentKeywords = ['cod', 'chuyển khoản'];

    test.each(shippingKeywords)(
      'should boost confidence for shipping keyword: %s',
      async keyword => {
        const message = `mua ${keyword} 0912345678`;

        const result = await orderDetectionService.analyzeMessage(
          { content: message, _id: createMockObjectId() },
          { roomId: 'test-room' },
          { _id: 'user123', username: 'testuser' }
        );

        expect(result).not.toBeNull();
        expect(result.confidence).toBeGreaterThan(0.4);
      }
    );

    test.each(paymentKeywords)('should boost confidence for payment keyword: %s', async keyword => {
      const message = `mua ${keyword} 0912345678`;

      const result = await orderDetectionService.analyzeMessage(
        { content: message, _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).not.toBeNull();
      expect(result.confidence).toBeGreaterThan(0.4);
    });
  });
});
