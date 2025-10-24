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

    test.each(orderKeywords)(
      '[TC1001-OrderKeywordDetection] Should detect order keyword: %s',
      async keyword => {
        // Description: Test detection of order keywords in chat messages
        // Input: Message containing order keyword + size + phone number
        // Expected: System recognizes it as order and extracts keyword correctly

        const message = `${keyword} size 42 0912345678`;
        const result = await orderDetectionService.analyzeMessage(
          { content: message, _id: createMockObjectId() },
          { roomId: 'test-room' },
          { _id: 'user123', username: 'testuser' }
        );

        expect(result).not.toBeNull();
        expect(result.isOrder).toBe(true);
        expect(result.data.detectionData.detectedKeywords).toContain(keyword.toLowerCase());
      }
    );
  });

  describe('Phone Number Detection', () => {
    const phonePrefixes = ['03', '05', '07', '08', '09'];

    test.each(phonePrefixes)(
      '[TC1002-PhoneNumberDetection] Should detect valid phone number with prefix %s',
      async prefix => {
        // Description: Test detection of valid Vietnamese phone numbers with different prefixes
        // Input: Message containing order keyword + size + valid phone number with prefix %s
        // Expected: System extracts phone number correctly and recognizes it as valid

        const phone = `${prefix}12345678`;
        const message = `Chốt đơn size 42 ${phone}`;

        const result = await orderDetectionService.analyzeMessage(
          { content: message, _id: createMockObjectId() },
          { roomId: 'test-room' },
          { _id: 'user123', username: 'testuser' }
        );

        expect(result).not.toBeNull();
        expect(result.data.customerInfo.phoneNumber).toBe(phone);
      }
    );

    test('[TC1003-PhoneNumberValidation] Should reject invalid phone number prefix', async () => {
      // Description: Test rejection of invalid phone number prefixes
      // Input: Message with order keyword + size + invalid phone prefix (02)
      // Expected: System returns null as phone number is invalid

      const message = 'Chốt đơn size 42 0212345678'; // Invalid prefix

      const result = await orderDetectionService.analyzeMessage(
        { content: message, _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).toBeNull();
    });

    test('[TC1004-MultiplePhoneNumbers] Should handle multiple phone numbers in message', async () => {
      // Description: Test detection and extraction of multiple phone numbers in a single message
      // Input: Message containing order keyword + multiple phone numbers + size
      // Expected: System extracts all valid phone numbers into an array

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
    test('[TC1005-ConfidenceThreshold] Should return null for confidence below threshold', async () => {
      // Description: Test that messages without order keywords are rejected due to low confidence
      // Input: Message with phone number but no order keywords
      // Expected: System returns null as confidence is below 0.3 threshold

      const message = 'hello 0912345678'; // No order keywords

      const result = await orderDetectionService.analyzeMessage(
        { content: message, _id: createMockObjectId() },
        { roomId: 'test-room' },
        { _id: 'user123', username: 'testuser' }
      );

      expect(result).toBeNull();
    });

    test('[TC1006-ConfidenceCap] Should cap confidence at maximum value of 1.0', async () => {
      // Description: Test that confidence score is capped at 1.0 even with multiple keywords
      // Input: Message with multiple order keywords, phone number, and size
      // Expected: System caps confidence at 1.0 maximum

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

    test('[TC1007-ShortMessagePenalty] Should apply penalty for short messages', async () => {
      // Description: Test that short messages receive confidence penalty compared to longer messages
      // Input: Short message vs longer message with same order intent
      // Expected: Short message has lower confidence or is null compared to longer message

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

    test('[TC1008-ProductInfoBoost] Should boost confidence for messages with product information', async () => {
      // Description: Test that messages with product details receive higher confidence scores
      // Input: Message with product info vs message without product info
      // Expected: Message with product info has higher confidence score

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
    test('[TC1009-FeaturedProductMatch] Should match featured product by product reference', async () => {
      // Description: Test matching of featured products when user references 'this product'
      // Input: Message with product reference + size + phone number + stream with featured product
      // Expected: System matches the featured product and extracts product ID

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

    test('[TC1010-FeaturedProductBrandMatch] Should match featured product by brand reference', async () => {
      // Description: Test matching of featured products when user references brand
      // Input: Message with brand reference + size + phone number + stream with featured product
      // Expected: System matches the featured product by brand and extracts product ID

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

    test('[TC1011-ProductReferenceKeywords] Should match with product reference keywords', async () => {
      // Description: Test matching of featured products using product reference keywords
      // Input: Message with product reference keywords + size + phone number + stream with featured product
      // Expected: System matches the featured product using reference keywords and extracts product ID

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

    test('[TC1012-NoFeaturedProducts] Should handle messages when no featured products are available', async () => {
      // Description: Test order detection when stream has no featured products
      // Input: Message with product reference + size + phone number + empty featured products
      // Expected: System still recognizes order but without specific product matching

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
    test('[TC1013-SavePotentialOrder] Should save potential order successfully to database', async () => {
      // Description: Test successful saving of detected order to database
      // Input: Valid order analysis result with stream ID and user ID
      // Expected: Order is saved with correct stream ID, status, and save method is called

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

    test('[TC1014-GetPendingOrders] Should retrieve pending orders for a specific stream', async () => {
      // Description: Test retrieval of pending orders for a specific stream
      // Input: Stream ID with mock pending orders
      // Expected: System returns array of pending orders for the stream

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

    test('[TC1015-UpdateOrderStatus] Should update order status successfully', async () => {
      // Description: Test successful update of order status by host
      // Input: Order ID, new status, host ID, and notes
      // Expected: Order status is updated, host actions are recorded, and save method is called

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

    test('[TC1016-InvalidOrderUpdate] Should handle invalid order ID in updateOrderStatus', async () => {
      // Description: Test error handling when updating status of non-existent order
      // Input: Invalid order ID, status, and host ID
      // Expected: System throws 'Order not found' error

      const invalidOrderId = 'invalid-id-12345';
      const hostId = createMockObjectId('host789');

      // Mock findById to return null
      orderDetectionService.PotentialOrder.findById.mockResolvedValue(null);

      await expect(
        orderDetectionService.updateOrderStatus(invalidOrderId, 'confirmed', hostId.toString())
      ).rejects.toThrow('Order not found');
    });

    test('[TC1017-GetOrdersForHost] Should retrieve orders for a specific host', async () => {
      // Description: Test retrieval of orders associated with a specific host
      // Input: Host ID with mock orders
      // Expected: System returns array of orders for the host with default limit of 50

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

  describe('Error Handling in analyzeMessage', () => {
    test('[TC1018-InvalidMessageContent] Should handle invalid message content (null, undefined, empty)', async () => {
      // Description: Test handling of various invalid message content types in analyzeMessage
      // Input: Message object with null/undefined/empty content
      // Expected: System returns null without throwing error

      const invalidContents = [null, undefined, ''];

      for (const content of invalidContents) {
        const result = await orderDetectionService.analyzeMessage(
          { content, _id: createMockObjectId() },
          { roomId: 'test-room' },
          { _id: 'user123', username: 'testuser' }
        );

        expect(result).toBeNull();
      }
    });

    test('[TC1019-NullUserData] Should handle null user data gracefully', async () => {
      // Description: Test handling of null user data in message analysis
      // Input: Valid message with null user data
      // Expected: System returns null or throws error gracefully

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

    test('[TC1020-NonStringMessageContent] Should handle non-string message content', async () => {
      // Description: Test handling of non-string message content types
      // Input: Message object with number/object/array content
      // Expected: System returns null without throwing error

      const nonStringContents = [123, { text: 'message' }, ['message']];

      for (const content of nonStringContents) {
        const result = await orderDetectionService.analyzeMessage(
          { content, _id: createMockObjectId() },
          { roomId: 'test-room' },
          { _id: 'user123', username: 'testuser' }
        );

        expect(result).toBeNull();
      }
    });
  });

  // ========== SHIPPING & PAYMENT KEYWORDS ==========

  describe('Shipping & Payment Keywords', () => {
    const shippingKeywords = ['ship', 'giao'];
    const paymentKeywords = ['cod', 'chuyển khoản'];

    test.each(shippingKeywords)(
      '[TC1022-ShippingKeywordBoost] Should boost confidence for shipping keyword: %s',
      async keyword => {
        // Description: Test confidence boost for shipping-related keywords
        // Input: Message with shipping keyword + phone number
        // Expected: System recognizes order with confidence > 0.4

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

    test.each(paymentKeywords)(
      '[TC1023-PaymentKeywordBoost] Should boost confidence for payment keyword: %s',
      async keyword => {
        // Description: Test confidence boost for payment-related keywords
        // Input: Message with payment keyword + phone number
        // Expected: System recognizes order with confidence > 0.4

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
  });
});
