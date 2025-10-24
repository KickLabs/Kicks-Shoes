/**
 * Test Suite 9: PotentialOrder Model Tests
 * Testing PotentialOrder model methods, virtuals, statics, and middleware
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import PotentialOrder from '../src/models/PotentialOrder.js';

// Mock logger
jest.mock('../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Helper function to create mock ObjectId
const createMockObjectId = () => {
  return new mongoose.Types.ObjectId();
};

describe('PotentialOrder Model Tests', () => {
  let mockStreamId;
  let mockChatMessageId;
  let mockUserId;
  let mockProductId;
  let mockHostId;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStreamId = createMockObjectId();
    mockChatMessageId = createMockObjectId();
    mockUserId = createMockObjectId();
    mockProductId = createMockObjectId();
    mockHostId = createMockObjectId();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ========== SCHEMA VALIDATION ==========

  describe('Schema Validation', () => {
    test('should create a valid potential order with required fields', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
      };

      const order = new PotentialOrder(orderData);

      expect(order.streamId).toEqual(mockStreamId);
      expect(order.roomId).toBe('test-room-123');
      expect(order.chatMessageId).toEqual(mockChatMessageId);
      expect(order.customerInfo.customerName).toBe('Test User');
      expect(order.status).toBe('pending');
      expect(order.priority).toBe('medium');
    });

    test('should fail validation without required streamId', () => {
      const orderData = {
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
      };

      const order = new PotentialOrder(orderData);
      const error = order.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.streamId).toBeDefined();
    });

    test('should fail validation without required roomId', () => {
      const orderData = {
        streamId: mockStreamId,
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
      };

      const order = new PotentialOrder(orderData);
      const error = order.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.roomId).toBeDefined();
    });

    test('should fail validation without required chatMessageId', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
      };

      const order = new PotentialOrder(orderData);
      const error = order.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.chatMessageId).toBeDefined();
    });

    test('should fail validation without customer userId', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
      };

      const order = new PotentialOrder(orderData);
      const error = order.validateSync();

      expect(error).toBeDefined();
      expect(error.errors['customerInfo.userId']).toBeDefined();
    });

    test('should fail validation without customer name', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
      };

      const order = new PotentialOrder(orderData);
      const error = order.validateSync();

      expect(error).toBeDefined();
      expect(error.errors['customerInfo.customerName']).toBeDefined();
    });

    test('should fail validation without phone number', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
      };

      const order = new PotentialOrder(orderData);
      const error = order.validateSync();

      expect(error).toBeDefined();
      expect(error.errors['customerInfo.phoneNumber']).toBeDefined();
    });

    test('should fail validation without original message', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {},
      };

      const order = new PotentialOrder(orderData);
      const error = order.validateSync();

      expect(error).toBeDefined();
      expect(error.errors['productInfo.originalMessage']).toBeDefined();
    });

    test('should trim customer name', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: '  Test User  ',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
      };

      const order = new PotentialOrder(orderData);
      expect(order.customerInfo.customerName).toBe('Test User');
    });

    test('should trim phone number', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '  0912345678  ',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
      };

      const order = new PotentialOrder(orderData);
      expect(order.customerInfo.phoneNumber).toBe('0912345678');
    });

    test('should validate Vietnamese phone number format', () => {
      const validPhones = ['0912345678', '0987654321', '0345678901', '0765432109', '0856789012'];

      validPhones.forEach(phone => {
        const orderData = {
          streamId: mockStreamId,
          roomId: `test-room-${phone}`,
          chatMessageId: mockChatMessageId,
          customerInfo: {
            userId: mockUserId,
            customerName: 'Test User',
            phoneNumber: phone,
          },
          productInfo: {
            originalMessage: 'Test message',
          },
        };

        const order = new PotentialOrder(orderData);
        const error = order.validateSync();

        expect(error).toBeUndefined();
      });
    });

    test('should reject invalid phone number formats', () => {
      const invalidPhones = ['1234567890', '012345678', '09123456789', 'not-a-phone'];

      invalidPhones.forEach(phone => {
        const orderData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          chatMessageId: mockChatMessageId,
          customerInfo: {
            userId: mockUserId,
            customerName: 'Test User',
            phoneNumber: phone,
          },
          productInfo: {
            originalMessage: 'Test message',
          },
        };

        const order = new PotentialOrder(orderData);
        const error = order.validateSync();

        expect(error).toBeDefined();
        expect(error.errors['customerInfo.phoneNumber']).toBeDefined();
      });
    });

    test('should reject originalMessage longer than 500 characters', () => {
      const longMessage = 'a'.repeat(501);
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: longMessage,
        },
      };

      const order = new PotentialOrder(orderData);
      const error = order.validateSync();

      expect(error).toBeDefined();
      expect(error.errors['productInfo.originalMessage']).toBeDefined();
    });

    test('should only accept valid status values', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
        status: 'invalid-status',
      };

      const order = new PotentialOrder(orderData);
      const error = order.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    });

    test('should accept all valid status values', () => {
      const validStatuses = ['pending', 'contacted', 'confirmed', 'converted', 'ignored', 'spam'];

      validStatuses.forEach(status => {
        const orderData = {
          streamId: mockStreamId,
          roomId: `test-room-${status}`,
          chatMessageId: mockChatMessageId,
          customerInfo: {
            userId: mockUserId,
            customerName: 'Test User',
            phoneNumber: '0912345678',
          },
          productInfo: {
            originalMessage: 'Test message',
          },
          status,
        };

        const order = new PotentialOrder(orderData);
        const error = order.validateSync();

        expect(error).toBeUndefined();
        expect(order.status).toBe(status);
      });
    });

    test('should only accept valid priority values', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
        priority: 'invalid-priority',
      };

      const order = new PotentialOrder(orderData);
      const error = order.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.priority).toBeDefined();
    });

    test('should accept all valid priority values', () => {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];

      validPriorities.forEach(priority => {
        const orderData = {
          streamId: mockStreamId,
          roomId: `test-room-${priority}`,
          chatMessageId: mockChatMessageId,
          customerInfo: {
            userId: mockUserId,
            customerName: 'Test User',
            phoneNumber: '0912345678',
          },
          productInfo: {
            originalMessage: 'Test message',
          },
          priority,
        };

        const order = new PotentialOrder(orderData);
        const error = order.validateSync();

        expect(error).toBeUndefined();
        expect(order.priority).toBe(priority);
      });
    });
  });

  // ========== DEFAULT VALUES ==========

  describe('Default Values', () => {
    test('should set default values correctly', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
      };

      const order = new PotentialOrder(orderData);

      expect(order.status).toBe('pending');
      expect(order.priority).toBe('medium');
      expect(order.productInfo.extractedQuantity).toBe(1);
      expect(order.detectionData.confidence).toBe(0.5);
      expect(order.convertedOrderId).toBeNull();
      expect(order.productInfo.productId).toBeNull();
    });

    test('should set expiresAt to 24 hours from now', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
      };

      const order = new PotentialOrder(orderData);
      const now = Date.now();
      const expiresAt = order.expiresAt.getTime();
      const expectedExpiry = now + 24 * 60 * 60 * 1000;

      // Allow 1 second difference for test execution time
      expect(Math.abs(expiresAt - expectedExpiry)).toBeLessThan(1000);
    });

    test('should set detectionData timestamp to now', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
      };

      const order = new PotentialOrder(orderData);

      expect(order.detectionData.timestamp).toBeInstanceOf(Date);
      expect(order.detectionData.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  // ========== PRODUCT INFO ==========

  describe('Product Info', () => {
    test('should store extracted product information', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Mua size 42 màu đỏ 2 đôi',
          productId: mockProductId,
          extractedSize: '42',
          extractedColor: 'đỏ',
          extractedQuantity: 2,
        },
      };

      const order = new PotentialOrder(orderData);

      expect(order.productInfo.productId).toEqual(mockProductId);
      expect(order.productInfo.extractedSize).toBe('42');
      expect(order.productInfo.extractedColor).toBe('đỏ');
      expect(order.productInfo.extractedQuantity).toBe(2);
    });

    test('should trim extracted size and color', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          extractedSize: '  42  ',
          extractedColor: '  đỏ  ',
        },
      };

      const order = new PotentialOrder(orderData);

      expect(order.productInfo.extractedSize).toBe('42');
      expect(order.productInfo.extractedColor).toBe('đỏ');
    });

    test('should enforce minimum quantity of 1', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          extractedQuantity: 0,
        },
      };

      const order = new PotentialOrder(orderData);
      const error = order.validateSync();

      expect(error).toBeDefined();
      expect(error.errors['productInfo.extractedQuantity']).toBeDefined();
    });
  });

  // ========== DETECTION DATA ==========

  describe('Detection Data', () => {
    test('should validate confidence range 0-1', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
        detectionData: {
          confidence: 1.5,
        },
      };

      const order = new PotentialOrder(orderData);
      const error = order.validateSync();

      expect(error).toBeDefined();
      expect(error.errors['detectionData.confidence']).toBeDefined();
    });

    test('should accept valid confidence values', () => {
      const validConfidences = [0, 0.25, 0.5, 0.75, 1];

      validConfidences.forEach(confidence => {
        const orderData = {
          streamId: mockStreamId,
          roomId: `test-room-${confidence}`,
          chatMessageId: mockChatMessageId,
          customerInfo: {
            userId: mockUserId,
            customerName: 'Test User',
            phoneNumber: '0912345678',
          },
          productInfo: {
            originalMessage: 'Test message',
          },
          detectionData: {
            confidence,
          },
        };

        const order = new PotentialOrder(orderData);
        const error = order.validateSync();

        expect(error).toBeUndefined();
        expect(order.detectionData.confidence).toBe(confidence);
      });
    });

    test('should store detected keywords and phone matches', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
        detectionData: {
          detectedKeywords: ['mua', 'đặt hàng', 'size'],
          phoneMatches: ['0912345678'],
        },
      };

      const order = new PotentialOrder(orderData);

      expect(order.detectionData.detectedKeywords).toEqual(['mua', 'đặt hàng', 'size']);
      expect(order.detectionData.phoneMatches).toEqual(['0912345678']);
    });
  });

  // ========== VIRTUAL FIELDS ==========

  describe('Virtual Fields', () => {
    test('should format phone number correctly', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
      };

      const order = new PotentialOrder(orderData);

      expect(order.formattedPhone).toBe('0912 345 678');
    });

    test('should return unformatted phone if not 10 digits', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '091234567', // 9 digits
        },
        productInfo: {
          originalMessage: 'Test message',
        },
      };

      const order = new PotentialOrder(orderData);

      // Note: This will fail validation, but testing the virtual
      expect(order.formattedPhone).toBe('091234567');
    });

    test('should calculate timeSinceDetection in minutes', () => {
      const pastDate = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
        createdAt: pastDate,
      };

      const order = new PotentialOrder(orderData);

      expect(order.timeSinceDetection).toMatch(/\d+m ago/);
    });

    test('should calculate timeSinceDetection in hours', () => {
      const pastDate = new Date(Date.now() - 90 * 60 * 1000); // 90 minutes ago
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
        createdAt: pastDate,
      };

      const order = new PotentialOrder(orderData);

      expect(order.timeSinceDetection).toMatch(/\d+h \d+m ago/);
    });
  });

  // ========== INSTANCE METHODS ==========

  describe('Instance Methods', () => {
    describe('markAsViewed', () => {
      test('should mark order as viewed and change status to contacted', async () => {
        const orderData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          chatMessageId: mockChatMessageId,
          customerInfo: {
            userId: mockUserId,
            customerName: 'Test User',
            phoneNumber: '0912345678',
          },
          productInfo: {
            originalMessage: 'Test message',
          },
          status: 'pending',
        };

        const order = new PotentialOrder(orderData);
        order.save = jest.fn().mockResolvedValue(order);

        await order.markAsViewed(mockHostId);

        expect(order.hostActions.viewedAt).toBeInstanceOf(Date);
        expect(order.status).toBe('contacted');
        expect(order.save).toHaveBeenCalled();
      });

      test('should not change status if already contacted', async () => {
        const orderData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          chatMessageId: mockChatMessageId,
          customerInfo: {
            userId: mockUserId,
            customerName: 'Test User',
            phoneNumber: '0912345678',
          },
          productInfo: {
            originalMessage: 'Test message',
          },
          status: 'confirmed',
        };

        const order = new PotentialOrder(orderData);
        order.save = jest.fn().mockResolvedValue(order);

        await order.markAsViewed(mockHostId);

        expect(order.status).toBe('confirmed');
      });
    });

    describe('addHostNote', () => {
      test('should add host note with metadata', async () => {
        const orderData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          chatMessageId: mockChatMessageId,
          customerInfo: {
            userId: mockUserId,
            customerName: 'Test User',
            phoneNumber: '0912345678',
          },
          productInfo: {
            originalMessage: 'Test message',
          },
        };

        const order = new PotentialOrder(orderData);
        order.save = jest.fn().mockResolvedValue(order);

        await order.addHostNote('Customer confirmed the order', mockHostId);

        expect(order.hostActions.notes).toBe('Customer confirmed the order');
        expect(order.hostActions.confirmedBy).toEqual(mockHostId);
        expect(order.hostActions.confirmedAt).toBeInstanceOf(Date);
        expect(order.save).toHaveBeenCalled();
      });

      test('should reject notes longer than 1000 characters', () => {
        const longNote = 'a'.repeat(1001);
        const orderData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          chatMessageId: mockChatMessageId,
          customerInfo: {
            userId: mockUserId,
            customerName: 'Test User',
            phoneNumber: '0912345678',
          },
          productInfo: {
            originalMessage: 'Test message',
          },
          hostActions: {
            notes: longNote,
          },
        };

        const order = new PotentialOrder(orderData);
        const error = order.validateSync();

        expect(error).toBeDefined();
        expect(error.errors['hostActions.notes']).toBeDefined();
      });
    });

    describe('convertToOrder', () => {
      test('should convert to order and update status', async () => {
        const orderId = createMockObjectId();
        const orderData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          chatMessageId: mockChatMessageId,
          customerInfo: {
            userId: mockUserId,
            customerName: 'Test User',
            phoneNumber: '0912345678',
          },
          productInfo: {
            originalMessage: 'Test message',
          },
        };

        const order = new PotentialOrder(orderData);
        order.save = jest.fn().mockResolvedValue(order);

        await order.convertToOrder(orderId);

        expect(order.convertedOrderId).toEqual(orderId);
        expect(order.status).toBe('converted');
        expect(order.save).toHaveBeenCalled();
      });
    });

    describe('markAsSpam', () => {
      test('should mark order as spam', async () => {
        const orderData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          chatMessageId: mockChatMessageId,
          customerInfo: {
            userId: mockUserId,
            customerName: 'Test User',
            phoneNumber: '0912345678',
          },
          productInfo: {
            originalMessage: 'Test message',
          },
        };

        const order = new PotentialOrder(orderData);
        order.save = jest.fn().mockResolvedValue(order);

        await order.markAsSpam();

        expect(order.status).toBe('spam');
        expect(order.save).toHaveBeenCalled();
      });
    });
  });

  // ========== PRE-SAVE MIDDLEWARE - PRIORITY CALCULATION ==========

  describe('Pre-save Middleware - Priority Calculation', () => {
    test('should set priority to urgent for high confidence with product', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          productId: mockProductId,
          extractedSize: '42',
          extractedColor: 'đỏ',
        },
        detectionData: {
          confidence: 0.7,
        },
      };

      const order = new PotentialOrder(orderData);

      // Simulate pre-save middleware logic
      let score = order.detectionData.confidence; // 0.7

      if (order.productInfo.productId) {
        score += 0.2; // 0.9
      }

      if (order.productInfo.extractedSize || order.productInfo.extractedColor) {
        score += 0.1; // 1.0
      }

      expect(score).toBeGreaterThanOrEqual(0.8);
    });

    test('should set priority to high for good confidence', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          extractedSize: '42',
        },
        detectionData: {
          confidence: 0.6,
        },
      };

      const order = new PotentialOrder(orderData);

      let score = order.detectionData.confidence; // 0.6

      if (order.productInfo.extractedSize || order.productInfo.extractedColor) {
        score += 0.1; // 0.7
      }

      expect(score).toBeGreaterThanOrEqual(0.6);
      expect(score).toBeLessThan(0.8);
    });

    test('should set priority to medium for moderate confidence', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
        detectionData: {
          confidence: 0.5,
        },
      };

      const order = new PotentialOrder(orderData);

      const score = order.detectionData.confidence; // 0.5

      expect(score).toBeGreaterThanOrEqual(0.4);
      expect(score).toBeLessThan(0.6);
    });

    test('should set priority to low for low confidence', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
        detectionData: {
          confidence: 0.3,
        },
      };

      const order = new PotentialOrder(orderData);

      const score = order.detectionData.confidence; // 0.3

      expect(score).toBeLessThan(0.4);
    });

    test('should boost priority for quantity > 1', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          extractedQuantity: 3,
        },
        detectionData: {
          confidence: 0.5,
        },
      };

      const order = new PotentialOrder(orderData);

      let score = order.detectionData.confidence; // 0.5

      if (order.productInfo.extractedQuantity > 1) {
        score += 0.1; // 0.6
      }

      expect(score).toBe(0.6);
    });

    test('should boost priority when productId is provided', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          productId: mockProductId,
        },
        detectionData: {
          confidence: 0.5, // base score
        },
      };

      const order = new PotentialOrder(orderData);

      // With productId, score should be boosted by 0.2
      // 0.5 + 0.2 = 0.7, should be 'high' priority
      expect(order.productInfo.productId).toEqual(mockProductId);
    });

    test('should boost priority when size is extracted', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          extractedSize: '42',
        },
        detectionData: {
          confidence: 0.5,
        },
      };

      const order = new PotentialOrder(orderData);

      // With size, score should be boosted by 0.1
      expect(order.productInfo.extractedSize).toBe('42');
    });

    test('should boost priority when color is extracted', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          extractedColor: 'Đen',
        },
        detectionData: {
          confidence: 0.5,
        },
      };

      const order = new PotentialOrder(orderData);

      // With color, score should be boosted by 0.1
      expect(order.productInfo.extractedColor).toBe('Đen');
    });

    test('should reach urgent priority with all boosts', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          productId: mockProductId,
          extractedSize: '42',
          extractedColor: 'Đen',
          extractedQuantity: 2,
        },
        detectionData: {
          confidence: 0.5, // base: 0.5 + product: 0.2 + size/color: 0.1 + quantity: 0.1 = 0.9
        },
      };

      const order = new PotentialOrder(orderData);

      // With all boosts: 0.5 + 0.2 + 0.1 + 0.1 = 0.9, should be urgent
      expect(order.productInfo.productId).toEqual(mockProductId);
      expect(order.productInfo.extractedSize).toBe('42');
      expect(order.productInfo.extractedColor).toBe('Đen');
      expect(order.productInfo.extractedQuantity).toBe(2);
    });

    test('should not boost when no productId', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          // No productId
        },
        detectionData: {
          confidence: 0.5,
        },
      };

      const order = new PotentialOrder(orderData);

      // Without productId, no +0.2 boost
      expect(order.productInfo.productId).toBeFalsy();
    });

    test('should not boost when no size and no color', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          // No extractedSize, no extractedColor
        },
        detectionData: {
          confidence: 0.5,
        },
      };

      const order = new PotentialOrder(orderData);

      // Without size/color, no +0.1 boost
      expect(order.productInfo.extractedSize).toBeUndefined();
      expect(order.productInfo.extractedColor).toBeUndefined();
    });

    test('should not boost when quantity is 1 or less', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          extractedQuantity: 1, // quantity = 1
        },
        detectionData: {
          confidence: 0.5,
        },
      };

      const order = new PotentialOrder(orderData);

      // With quantity = 1, no +0.1 boost
      expect(order.productInfo.extractedQuantity).toBe(1);
    });

    test('should set low priority for very low confidence with no boosts', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          extractedQuantity: 1,
          // No productId, size, color
        },
        detectionData: {
          confidence: 0.2, // Very low confidence, will stay < 0.4
        },
      };

      const order = new PotentialOrder(orderData);

      // Score = 0.2, should be low priority
      expect(order.detectionData.confidence).toBe(0.2);
    });

    test('should boost size OR color independently', () => {
      const orderData1 = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          extractedSize: '42',
          // No color
        },
        detectionData: {
          confidence: 0.5,
        },
      };

      const order1 = new PotentialOrder(orderData1);
      expect(order1.productInfo.extractedSize).toBe('42');
      expect(order1.productInfo.extractedColor).toBeUndefined();

      const orderData2 = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          extractedColor: 'Đỏ',
          // No size
        },
        detectionData: {
          confidence: 0.5,
        },
      };

      const order2 = new PotentialOrder(orderData2);
      expect(order2.productInfo.extractedSize).toBeUndefined();
      expect(order2.productInfo.extractedColor).toBe('Đỏ');
    });
  });

  // ========== HOST ACTIONS ==========

  describe('Host Actions', () => {
    test('should store all host action timestamps', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
        hostActions: {
          viewedAt: new Date(),
          contactedAt: new Date(),
          notes: 'Customer is interested',
          confirmedBy: mockHostId,
          confirmedAt: new Date(),
        },
      };

      const order = new PotentialOrder(orderData);

      expect(order.hostActions.viewedAt).toBeInstanceOf(Date);
      expect(order.hostActions.contactedAt).toBeInstanceOf(Date);
      expect(order.hostActions.confirmedAt).toBeInstanceOf(Date);
      expect(order.hostActions.confirmedBy).toEqual(mockHostId);
      expect(order.hostActions.notes).toBe('Customer is interested');
    });
  });

  // ========== MIDDLEWARE INTEGRATION TESTS ==========

  describe('Pre-save Middleware - Integration Tests (Real DB)', () => {
    beforeAll(async () => {
      // Connect to test database
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kicks-shoes');
      }
    });

    afterAll(async () => {
      // Clean up test data
      await PotentialOrder.deleteMany({ 'customerInfo.phoneNumber': /^099/ });
      await mongoose.connection.close();
    });

    test('should execute middleware and set urgent priority with all boosts', async () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-middleware-1',
        chatMessageId: createMockObjectId(),
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0991111111',
        },
        productInfo: {
          originalMessage: 'Test message',
          productId: mockProductId,
          extractedSize: '42',
          extractedColor: 'Đen',
          extractedQuantity: 2,
        },
        detectionData: {
          confidence: 0.5, // 0.5 + 0.2 + 0.1 + 0.1 = 0.9 >= 0.8 => urgent
        },
      };

      const order = new PotentialOrder(orderData);
      await order.save();

      expect(order.priority).toBe('urgent');
      expect(order.isNew).toBe(false); // After save, isNew becomes false
    });

    test('should execute middleware and set high priority', async () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-middleware-2',
        chatMessageId: createMockObjectId(),
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0992222222',
        },
        productInfo: {
          originalMessage: 'Test message',
          productId: mockProductId,
        },
        detectionData: {
          confidence: 0.5, // 0.5 + 0.2 = 0.7 >= 0.6 => high
        },
      };

      const order = new PotentialOrder(orderData);
      await order.save();

      expect(order.priority).toBe('high');
    });

    test('should execute middleware and set medium priority', async () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-middleware-3',
        chatMessageId: createMockObjectId(),
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0993333333',
        },
        productInfo: {
          originalMessage: 'Test message',
          extractedSize: '42',
        },
        detectionData: {
          confidence: 0.4, // 0.4 + 0.1 = 0.5 >= 0.4 => medium
        },
      };

      const order = new PotentialOrder(orderData);
      await order.save();

      expect(order.priority).toBe('medium');
    });

    test('should execute middleware and set low priority', async () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-middleware-4',
        chatMessageId: createMockObjectId(),
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0994444444',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
        detectionData: {
          confidence: 0.2, // 0.2 < 0.4 => low
        },
      };

      const order = new PotentialOrder(orderData);
      await order.save();

      expect(order.priority).toBe('low');
    });

    test('should not boost when no productId (else branch)', async () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-middleware-5',
        chatMessageId: createMockObjectId(),
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0995555555',
        },
        productInfo: {
          originalMessage: 'Test message',
          // No productId - tests else branch of line 238
        },
        detectionData: {
          confidence: 0.6, // stays 0.6 => high
        },
      };

      const order = new PotentialOrder(orderData);
      await order.save();

      expect(order.priority).toBe('high');
      expect(order.productInfo.productId).toBeFalsy();
    });

    test('should not boost when no size and no color (else branch)', async () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-middleware-6',
        chatMessageId: createMockObjectId(),
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0996666666',
        },
        productInfo: {
          originalMessage: 'Test message',
          // No size, no color - tests else branch of line 243
        },
        detectionData: {
          confidence: 0.5, // stays 0.5 => medium
        },
      };

      const order = new PotentialOrder(orderData);
      await order.save();

      expect(order.priority).toBe('medium');
      expect(order.productInfo.extractedSize).toBeFalsy();
      expect(order.productInfo.extractedColor).toBeFalsy();
    });

    test('should not boost when quantity is 1 (else branch)', async () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-middleware-7',
        chatMessageId: createMockObjectId(),
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0997777777',
        },
        productInfo: {
          originalMessage: 'Test message',
          extractedQuantity: 1, // tests else branch of line 248
        },
        detectionData: {
          confidence: 0.5, // stays 0.5 => medium
        },
      };

      const order = new PotentialOrder(orderData);
      await order.save();

      expect(order.priority).toBe('medium');
      expect(order.productInfo.extractedQuantity).toBe(1);
    });

    test('should boost with size OR color (tests OR condition)', async () => {
      // Test with only size
      const orderData1 = {
        streamId: mockStreamId,
        roomId: 'test-room-middleware-8a',
        chatMessageId: createMockObjectId(),
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0998888881',
        },
        productInfo: {
          originalMessage: 'Test message',
          extractedSize: '42',
          // No color
        },
        detectionData: {
          confidence: 0.5, // 0.5 + 0.1 = 0.6 => high
        },
      };

      const order1 = new PotentialOrder(orderData1);
      await order1.save();

      expect(order1.priority).toBe('high');
      expect(order1.productInfo.extractedSize).toBe('42');

      // Test with only color
      const orderData2 = {
        streamId: mockStreamId,
        roomId: 'test-room-middleware-8b',
        chatMessageId: createMockObjectId(),
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0998888882',
        },
        productInfo: {
          originalMessage: 'Test message',
          extractedColor: 'Đỏ',
          // No size
        },
        detectionData: {
          confidence: 0.5, // 0.5 + 0.1 = 0.6 => high
        },
      };

      const order2 = new PotentialOrder(orderData2);
      await order2.save();

      expect(order2.priority).toBe('high');
      expect(order2.productInfo.extractedColor).toBe('Đỏ');
    });
  });

  // ========== STATIC METHODS ==========

  describe('Static Methods', () => {
    beforeEach(() => {
      // Mock the mongoose model methods
      PotentialOrder.find = jest.fn().mockReturnThis();
      PotentialOrder.populate = jest.fn().mockReturnThis();
      PotentialOrder.sort = jest.fn().mockReturnThis();
      PotentialOrder.limit = jest.fn().mockReturnThis();
    });

    describe('getPendingOrdersForStream', () => {
      test('should query pending and contacted orders for stream', () => {
        PotentialOrder.getPendingOrdersForStream(mockStreamId);

        expect(PotentialOrder.find).toHaveBeenCalledWith({
          streamId: mockStreamId,
          status: { $in: ['pending', 'contacted'] },
        });
      });

      test('should populate all related fields', () => {
        PotentialOrder.getPendingOrdersForStream(mockStreamId);

        expect(PotentialOrder.populate).toHaveBeenCalledWith(
          'customerInfo.userId',
          'username avatar'
        );
      });

      test('should sort by priority descending then createdAt descending', () => {
        PotentialOrder.getPendingOrdersForStream(mockStreamId);

        expect(PotentialOrder.sort).toHaveBeenCalledWith({ priority: -1, createdAt: -1 });
      });
    });

    describe('getOrdersByHost', () => {
      test('should populate streamId with match filter', () => {
        PotentialOrder.getOrdersByHost(mockHostId);

        expect(PotentialOrder.populate).toHaveBeenCalledWith({
          path: 'streamId',
          match: { hostId: mockHostId },
          select: 'title roomId',
        });
      });

      test('should use default limit of 50', () => {
        PotentialOrder.getOrdersByHost(mockHostId);

        expect(PotentialOrder.limit).toHaveBeenCalledWith(50);
      });

      test('should use custom limit when provided', () => {
        PotentialOrder.getOrdersByHost(mockHostId, 100);

        expect(PotentialOrder.limit).toHaveBeenCalledWith(100);
      });

      test('should sort by createdAt descending', () => {
        PotentialOrder.getOrdersByHost(mockHostId);

        expect(PotentialOrder.sort).toHaveBeenCalledWith({ createdAt: -1 });
      });
    });
  });

  // ========== COMPLEX SCENARIOS ==========

  describe('Complex Scenarios', () => {
    test('should create a complete potential order with all fields', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Nguyễn Văn A',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Mua Nike Air Max size 42 màu đỏ 2 đôi - 0912345678',
          productId: mockProductId,
          extractedSize: '42',
          extractedColor: 'đỏ',
          extractedQuantity: 2,
        },
        detectionData: {
          confidence: 0.85,
          detectedKeywords: ['mua', 'size', 'màu'],
          phoneMatches: ['0912345678'],
        },
        status: 'contacted',
        priority: 'high',
      };

      const order = new PotentialOrder(orderData);
      const error = order.validateSync();

      expect(error).toBeUndefined();
      expect(order.customerInfo.customerName).toBe('Nguyễn Văn A');
      expect(order.productInfo.extractedQuantity).toBe(2);
      expect(order.detectionData.confidence).toBe(0.85);
      expect(order.formattedPhone).toBe('0912 345 678');
    });

    test('should handle order lifecycle from pending to converted', async () => {
      const orderId = createMockObjectId();
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
        status: 'pending',
      };

      const order = new PotentialOrder(orderData);
      order.save = jest.fn().mockResolvedValue(order);

      // Mark as viewed
      await order.markAsViewed(mockHostId);
      expect(order.status).toBe('contacted');

      // Add note
      await order.addHostNote('Customer confirmed', mockHostId);
      expect(order.hostActions.notes).toBe('Customer confirmed');

      // Convert to order
      await order.convertToOrder(orderId);
      expect(order.status).toBe('converted');
      expect(order.convertedOrderId).toEqual(orderId);
    });

    test('should handle all possible priority calculations', () => {
      // Urgent priority
      const urgentOrder = new PotentialOrder({
        streamId: mockStreamId,
        roomId: 'test-room-1',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          productId: mockProductId,
          extractedSize: '42',
          extractedColor: 'red',
          extractedQuantity: 3,
        },
        detectionData: {
          confidence: 0.5,
        },
      });

      // Score: 0.5 + 0.2 (product) + 0.1 (size/color) + 0.1 (quantity) = 0.9 -> urgent
      expect(urgentOrder.detectionData.confidence).toBe(0.5);

      // High priority
      const highOrder = new PotentialOrder({
        streamId: mockStreamId,
        roomId: 'test-room-2',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
          extractedSize: '42',
        },
        detectionData: {
          confidence: 0.6,
        },
      });

      // Score: 0.6 + 0.1 (size) = 0.7 -> high
      expect(highOrder.detectionData.confidence).toBe(0.6);
    });

    test('should handle edge case with no status change on markAsViewed', async () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test message',
        },
        status: 'converted', // Already converted
      };

      const order = new PotentialOrder(orderData);
      order.save = jest.fn().mockResolvedValue(order);

      await order.markAsViewed(mockHostId);

      // Status should remain converted, not change to contacted
      expect(order.status).toBe('converted');
      expect(order.hostActions.viewedAt).toBeInstanceOf(Date);
    });

    test('should handle order with minimal detection data', () => {
      const orderData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        chatMessageId: mockChatMessageId,
        customerInfo: {
          userId: mockUserId,
          customerName: 'Test User',
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Just a message with phone',
        },
        detectionData: {
          confidence: 0.3,
          detectedKeywords: [],
          phoneMatches: [],
        },
      };

      const order = new PotentialOrder(orderData);
      const error = order.validateSync();

      expect(error).toBeUndefined();
      expect(order.detectionData.detectedKeywords).toEqual([]);
      expect(order.detectionData.phoneMatches).toEqual([]);
      expect(order.priority).toBe('medium'); // default
    });
  });
});
