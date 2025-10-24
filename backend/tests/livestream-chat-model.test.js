/**
 * Test Suite 8: LiveStreamChat Model Tests
 * Testing LiveStreamChat model methods, virtuals, statics, and middleware
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import LiveStreamChat from '../src/models/LiveStreamChat.js';

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

describe('LiveStreamChat Model Tests', () => {
  let mockStreamId;
  let mockSenderId;
  let mockProductId;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStreamId = createMockObjectId();
    mockSenderId = createMockObjectId();
    mockProductId = createMockObjectId();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ========== SCHEMA VALIDATION ==========

  describe('Schema Validation', () => {
    test('should create a valid chat message with required fields', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Test message',
      };

      const chat = new LiveStreamChat(chatData);

      expect(chat.streamId).toEqual(mockStreamId);
      expect(chat.roomId).toBe('test-room-123');
      expect(chat.senderId).toEqual(mockSenderId);
      expect(chat.content).toBe('Test message');
      expect(chat.messageType).toBe('text');
      expect(chat.senderRole).toBe('viewer');
    });

    test('should fail validation without required streamId', () => {
      const chatData = {
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Test message',
      };

      const chat = new LiveStreamChat(chatData);
      const error = chat.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.streamId).toBeDefined();
    });

    test('should fail validation without required roomId', () => {
      const chatData = {
        streamId: mockStreamId,
        senderId: mockSenderId,
        content: 'Test message',
      };

      const chat = new LiveStreamChat(chatData);
      const error = chat.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.roomId).toBeDefined();
    });

    test('should fail validation without required content', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
      };

      const chat = new LiveStreamChat(chatData);
      const error = chat.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.content).toBeDefined();
    });

    test('should trim content whitespace', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: '  Test message  ',
      };

      const chat = new LiveStreamChat(chatData);
      expect(chat.content).toBe('Test message');
    });

    test('should reject content longer than 500 characters', () => {
      const longContent = 'a'.repeat(501);
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: longContent,
      };

      const chat = new LiveStreamChat(chatData);
      const error = chat.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.content).toBeDefined();
    });

    test('should allow system messages without senderId', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderRole: 'system',
        content: 'System message',
      };

      const chat = new LiveStreamChat(chatData);
      const error = chat.validateSync();

      expect(error).toBeUndefined();
      expect(chat.senderRole).toBe('system');
    });

    test('should require senderId for non-system messages', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderRole: 'viewer',
        content: 'Test message',
      };

      const chat = new LiveStreamChat(chatData);
      const error = chat.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.senderId).toBeDefined();
    });

    test('should only accept valid senderRole values', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Test message',
        senderRole: 'invalid-role',
      };

      const chat = new LiveStreamChat(chatData);
      const error = chat.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.senderRole).toBeDefined();
    });

    test('should accept all valid senderRole values', () => {
      const validRoles = ['host', 'viewer', 'moderator', 'admin', 'system'];

      validRoles.forEach(role => {
        const chatData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: role === 'system' ? undefined : mockSenderId,
          content: 'Test message',
          senderRole: role,
        };

        const chat = new LiveStreamChat(chatData);
        const error = chat.validateSync();

        expect(error).toBeUndefined();
        expect(chat.senderRole).toBe(role);
      });
    });

    test('should only accept valid messageType values', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Test message',
        messageType: 'invalid-type',
      };

      const chat = new LiveStreamChat(chatData);
      const error = chat.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.messageType).toBeDefined();
    });

    test('should accept all valid messageType values', () => {
      const validTypes = ['text', 'emoji', 'system', 'product', 'announcement'];

      validTypes.forEach(type => {
        const chatData = {
          streamId: mockStreamId,
          roomId: `test-room-${type}`,
          senderId: mockSenderId,
          content: 'Test message',
          messageType: type,
        };

        const chat = new LiveStreamChat(chatData);
        const error = chat.validateSync();

        expect(error).toBeUndefined();
        expect(chat.messageType).toBe(type);
      });
    });

    test('should only accept valid visibility values', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Test message',
        visibility: 'invalid-visibility',
      };

      const chat = new LiveStreamChat(chatData);
      const error = chat.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.visibility).toBeDefined();
    });

    test('should accept all valid visibility values', () => {
      const validVisibilities = ['public', 'host_only', 'moderator_only'];

      validVisibilities.forEach(visibility => {
        const chatData = {
          streamId: mockStreamId,
          roomId: `test-room-${visibility}`,
          senderId: mockSenderId,
          content: 'Test message',
          visibility,
        };

        const chat = new LiveStreamChat(chatData);
        const error = chat.validateSync();

        expect(error).toBeUndefined();
        expect(chat.visibility).toBe(visibility);
      });
    });
  });

  // ========== DEFAULT VALUES ==========

  describe('Default Values', () => {
    test('should set default values correctly', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Test message',
      };

      const chat = new LiveStreamChat(chatData);

      expect(chat.messageType).toBe('text');
      expect(chat.senderRole).toBe('viewer');
      expect(chat.visibility).toBe('public');
      expect(chat.edited.isEdited).toBe(false);
      expect(chat.moderation.isDeleted).toBe(false);
      expect(chat.moderation.isHidden).toBe(false);
      expect(chat.orderDetection.isAnalyzed).toBe(false);
      expect(chat.orderDetection.isPotentialOrder).toBe(false);
      expect(chat.orderDetection.confidence).toBe(0);
    });

    test('should set timestamp to current date by default', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Test message',
      };

      const chat = new LiveStreamChat(chatData);

      expect(chat.timestamp).toBeInstanceOf(Date);
      expect(chat.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  // ========== VIRTUAL FIELDS ==========

  describe('Virtual Fields', () => {
    test('should calculate reactionCounts correctly', () => {
      const userId1 = createMockObjectId();
      const userId2 = createMockObjectId();
      const userId3 = createMockObjectId();

      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Test message',
        reactions: [
          { userId: userId1, emoji: '❤️' },
          { userId: userId2, emoji: '❤️' },
          { userId: userId3, emoji: '👍' },
        ],
      };

      const chat = new LiveStreamChat(chatData);
      const counts = chat.reactionCounts;

      expect(counts['❤️']).toBe(2);
      expect(counts['👍']).toBe(1);
    });

    test('should return empty object for reactionCounts when no reactions', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Test message',
        reactions: [],
      };

      const chat = new LiveStreamChat(chatData);
      const counts = chat.reactionCounts;

      expect(counts).toEqual({});
    });

    test('should format timestamp correctly', () => {
      const testDate = new Date('2025-01-01T14:30:00Z');
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Test message',
        timestamp: testDate,
      };

      const chat = new LiveStreamChat(chatData);

      expect(chat.formattedTime).toBeDefined();
      expect(typeof chat.formattedTime).toBe('string');
    });
  });

  // ========== INSTANCE METHODS ==========

  describe('Instance Methods', () => {
    describe('addReaction', () => {
      test('should add a new reaction', async () => {
        const chatData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: mockSenderId,
          content: 'Test message',
          reactions: [],
        };

        const chat = new LiveStreamChat(chatData);
        chat.save = jest.fn().mockResolvedValue(chat);

        const userId = createMockObjectId();
        await chat.addReaction(userId, '❤️');

        expect(chat.reactions).toHaveLength(1);
        expect(chat.reactions[0].emoji).toBe('❤️');
        expect(chat.save).toHaveBeenCalled();
      });

      test('should replace existing reaction from same user', async () => {
        const userId = createMockObjectId();
        const chatData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: mockSenderId,
          content: 'Test message',
          reactions: [{ userId, emoji: '👍' }],
        };

        const chat = new LiveStreamChat(chatData);
        chat.save = jest.fn().mockResolvedValue(chat);

        await chat.addReaction(userId, '❤️');

        expect(chat.reactions).toHaveLength(1);
        expect(chat.reactions[0].emoji).toBe('❤️');
      });

      test('should not affect reactions from other users', async () => {
        const userId1 = createMockObjectId();
        const userId2 = createMockObjectId();

        const chatData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: mockSenderId,
          content: 'Test message',
          reactions: [{ userId: userId1, emoji: '👍' }],
        };

        const chat = new LiveStreamChat(chatData);
        chat.save = jest.fn().mockResolvedValue(chat);

        await chat.addReaction(userId2, '❤️');

        expect(chat.reactions).toHaveLength(2);
      });
    });

    describe('removeReaction', () => {
      test('should remove reaction from user', async () => {
        const userId = createMockObjectId();
        const chatData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: mockSenderId,
          content: 'Test message',
          reactions: [{ userId, emoji: '❤️' }],
        };

        const chat = new LiveStreamChat(chatData);
        chat.save = jest.fn().mockResolvedValue(chat);

        await chat.removeReaction(userId);

        expect(chat.reactions).toHaveLength(0);
        expect(chat.save).toHaveBeenCalled();
      });

      test('should not fail when removing non-existent reaction', async () => {
        const userId = createMockObjectId();
        const chatData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: mockSenderId,
          content: 'Test message',
          reactions: [],
        };

        const chat = new LiveStreamChat(chatData);
        chat.save = jest.fn().mockResolvedValue(chat);

        await chat.removeReaction(userId);

        expect(chat.reactions).toHaveLength(0);
        expect(chat.save).toHaveBeenCalled();
      });

      test('should only remove reaction from specified user', async () => {
        const userId1 = createMockObjectId();
        const userId2 = createMockObjectId();

        const chatData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: mockSenderId,
          content: 'Test message',
          reactions: [
            { userId: userId1, emoji: '❤️' },
            { userId: userId2, emoji: '👍' },
          ],
        };

        const chat = new LiveStreamChat(chatData);
        chat.save = jest.fn().mockResolvedValue(chat);

        await chat.removeReaction(userId1);

        expect(chat.reactions).toHaveLength(1);
        expect(chat.reactions[0].userId).toEqual(userId2);
      });
    });

    describe('softDelete', () => {
      test('should mark message as deleted with metadata', async () => {
        const deletedBy = createMockObjectId();
        const chatData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: mockSenderId,
          content: 'Test message',
        };

        const chat = new LiveStreamChat(chatData);
        chat.save = jest.fn().mockResolvedValue(chat);

        await chat.softDelete(deletedBy, 'Spam message');

        expect(chat.moderation.isDeleted).toBe(true);
        expect(chat.moderation.deletedBy).toEqual(deletedBy);
        expect(chat.moderation.deleteReason).toBe('Spam message');
        expect(chat.moderation.deletedAt).toBeInstanceOf(Date);
        expect(chat.save).toHaveBeenCalled();
      });

      test('should soft delete without reason', async () => {
        const deletedBy = createMockObjectId();
        const chatData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: mockSenderId,
          content: 'Test message',
        };

        const chat = new LiveStreamChat(chatData);
        chat.save = jest.fn().mockResolvedValue(chat);

        await chat.softDelete(deletedBy);

        expect(chat.moderation.isDeleted).toBe(true);
        expect(chat.moderation.deletedBy).toEqual(deletedBy);
      });
    });

    describe('hide', () => {
      test('should mark message as hidden with metadata', async () => {
        const hiddenBy = createMockObjectId();
        const chatData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: mockSenderId,
          content: 'Test message',
        };

        const chat = new LiveStreamChat(chatData);
        chat.save = jest.fn().mockResolvedValue(chat);

        await chat.hide(hiddenBy);

        expect(chat.moderation.isHidden).toBe(true);
        expect(chat.moderation.hiddenBy).toEqual(hiddenBy);
        expect(chat.moderation.hiddenAt).toBeInstanceOf(Date);
        expect(chat.save).toHaveBeenCalled();
      });
    });

    describe('editMessage', () => {
      test('should update message content and mark as edited', async () => {
        const chatData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: mockSenderId,
          content: 'Original message',
        };

        const chat = new LiveStreamChat(chatData);
        chat.save = jest.fn().mockResolvedValue(chat);

        await chat.editMessage('Updated message');

        expect(chat.content).toBe('Updated message');
        expect(chat.edited.originalContent).toBe('Original message');
        expect(chat.save).toHaveBeenCalled();
      });

      test('should preserve original content on first edit', async () => {
        const chatData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: mockSenderId,
          content: 'Original message',
        };

        const chat = new LiveStreamChat(chatData);
        chat.save = jest.fn().mockResolvedValue(chat);

        await chat.editMessage('First edit');

        expect(chat.content).toBe('First edit');
        expect(chat.edited.originalContent).toBe('Original message');
      });
    });

    describe('markAsAnalyzed', () => {
      test('should mark message as analyzed without detection', async () => {
        const chatData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: mockSenderId,
          content: 'Test message',
        };

        const chat = new LiveStreamChat(chatData);
        chat.save = jest.fn().mockResolvedValue(chat);

        await chat.markAsAnalyzed(null);

        expect(chat.orderDetection.isAnalyzed).toBe(true);
        expect(chat.orderDetection.analyzedAt).toBeInstanceOf(Date);
        expect(chat.orderDetection.isPotentialOrder).toBe(false);
        expect(chat.save).toHaveBeenCalled();
      });

      test('should mark message as potential order with detection data', async () => {
        const chatData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: mockSenderId,
          content: 'Test message',
        };

        const chat = new LiveStreamChat(chatData);
        chat.save = jest.fn().mockResolvedValue(chat);

        const detectionResult = {
          isOrder: true,
          confidence: 0.85,
          data: {
            detectionData: {
              detectedKeywords: ['mua', 'size'],
              phoneMatches: ['0912345678'],
            },
          },
        };

        await chat.markAsAnalyzed(detectionResult);

        expect(chat.orderDetection.isAnalyzed).toBe(true);
        expect(chat.orderDetection.isPotentialOrder).toBe(true);
        expect(chat.orderDetection.confidence).toBe(0.85);
        expect(chat.orderDetection.detectedKeywords).toEqual(['mua', 'size']);
        expect(chat.orderDetection.phoneNumbers).toEqual(['0912345678']);
      });
    });

    describe('linkToPotentialOrder', () => {
      test('should link message to potential order', async () => {
        const potentialOrderId = createMockObjectId();
        const chatData = {
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: mockSenderId,
          content: 'Test message',
        };

        const chat = new LiveStreamChat(chatData);
        chat.save = jest.fn().mockResolvedValue(chat);

        await chat.linkToPotentialOrder(potentialOrderId);

        expect(chat.orderDetection.potentialOrderId).toEqual(potentialOrderId);
        expect(chat.save).toHaveBeenCalled();
      });
    });
  });

  // ========== STATIC METHODS ==========

  describe('Static Methods', () => {
    beforeEach(() => {
      // Mock the mongoose model methods
      LiveStreamChat.find = jest.fn().mockReturnThis();
      LiveStreamChat.create = jest.fn().mockResolvedValue({});
      LiveStreamChat.populate = jest.fn().mockReturnThis();
      LiveStreamChat.sort = jest.fn().mockReturnThis();
      LiveStreamChat.limit = jest.fn().mockReturnThis();
    });

    describe('getRecentMessages', () => {
      test('should query messages for room with filters', () => {
        LiveStreamChat.getRecentMessages('test-room-123');

        expect(LiveStreamChat.find).toHaveBeenCalledWith({
          roomId: 'test-room-123',
          'moderation.isDeleted': false,
          'moderation.isHidden': false,
        });
      });

      test('should use default limit of 50', () => {
        LiveStreamChat.getRecentMessages('test-room-123');

        expect(LiveStreamChat.limit).toHaveBeenCalledWith(50);
      });

      test('should use custom limit when provided', () => {
        LiveStreamChat.getRecentMessages('test-room-123', 100);

        expect(LiveStreamChat.limit).toHaveBeenCalledWith(100);
      });

      test('should populate sender and sort by timestamp', () => {
        LiveStreamChat.getRecentMessages('test-room-123');

        expect(LiveStreamChat.populate).toHaveBeenCalledWith('senderId', 'username avatar');
        expect(LiveStreamChat.sort).toHaveBeenCalledWith({ timestamp: -1 });
      });
    });

    describe('getMessagesByUser', () => {
      test('should query messages by streamId and userId', () => {
        LiveStreamChat.getMessagesByUser(mockStreamId, mockSenderId);

        expect(LiveStreamChat.find).toHaveBeenCalledWith({
          streamId: mockStreamId,
          senderId: mockSenderId,
          'moderation.isDeleted': false,
        });
      });

      test('should sort by timestamp descending', () => {
        LiveStreamChat.getMessagesByUser(mockStreamId, mockSenderId);

        expect(LiveStreamChat.sort).toHaveBeenCalledWith({ timestamp: -1 });
      });
    });

    describe('createSystemMessage', () => {
      test('should create system message with generated content', async () => {
        const data = { username: 'TestUser' };

        await LiveStreamChat.createSystemMessage(mockStreamId, 'test-room-123', 'join', data);

        expect(LiveStreamChat.create).toHaveBeenCalledWith({
          streamId: mockStreamId,
          roomId: 'test-room-123',
          senderId: null,
          senderRole: 'system',
          content: 'TestUser joined the stream',
          messageType: 'system',
          systemData: { type: 'join', data },
        });
      });
    });
  });

  // ========== STATIC METHOD - getSystemMessageContent ==========

  describe('Static Method - getSystemMessageContent', () => {
    test('should generate join message', () => {
      const content = LiveStreamChat.getSystemMessageContent('join', { username: 'TestUser' });
      expect(content).toBe('TestUser joined the stream');
    });

    test('should generate leave message', () => {
      const content = LiveStreamChat.getSystemMessageContent('leave', { username: 'TestUser' });
      expect(content).toBe('TestUser left the stream');
    });

    test('should generate product featured message', () => {
      const content = LiveStreamChat.getSystemMessageContent('product_featured', {
        productName: 'Nike Air Max',
      });
      expect(content).toBe('Host featured: Nike Air Max');
    });

    test('should generate stream started message', () => {
      const content = LiveStreamChat.getSystemMessageContent('stream_started', {});
      expect(content).toBe('Stream has started!');
    });

    test('should generate stream ended message', () => {
      const content = LiveStreamChat.getSystemMessageContent('stream_ended', {});
      expect(content).toBe('Stream has ended. Thank you for watching!');
    });

    test('should generate viewer milestone message', () => {
      const content = LiveStreamChat.getSystemMessageContent('viewer_milestone', { count: 100 });
      expect(content).toBe('🎉 100 viewers watching!');
    });

    test('should return default message for unknown type', () => {
      const content = LiveStreamChat.getSystemMessageContent('unknown', {});
      expect(content).toBe('System message');
    });
  });

  // ========== PRODUCT REFERENCE ==========

  describe('Product Reference', () => {
    test('should store product reference data', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Check out this product!',
        messageType: 'product',
        productRef: {
          productId: mockProductId,
          productName: 'Nike Air Max',
          productImage: 'https://example.com/image.jpg',
          productPrice: 1500000,
        },
      };

      const chat = new LiveStreamChat(chatData);

      expect(chat.productRef.productId).toEqual(mockProductId);
      expect(chat.productRef.productName).toBe('Nike Air Max');
      expect(chat.productRef.productPrice).toBe(1500000);
    });

    test('should accept message without product reference', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Regular message',
      };

      const chat = new LiveStreamChat(chatData);
      const error = chat.validateSync();

      expect(error).toBeUndefined();
      expect(chat.productRef).toBeDefined();
      expect(chat.productRef.productId).toBeUndefined();
    });
  });

  // ========== REPLY FUNCTIONALITY ==========

  describe('Reply Functionality', () => {
    test('should store reply information', () => {
      const replyMessageId = createMockObjectId();
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'This is a reply',
        replyTo: {
          messageId: replyMessageId,
          username: 'OriginalUser',
          content: 'Original message',
        },
      };

      const chat = new LiveStreamChat(chatData);

      expect(chat.replyTo.messageId).toEqual(replyMessageId);
      expect(chat.replyTo.username).toBe('OriginalUser');
      expect(chat.replyTo.content).toBe('Original message');
    });

    test('should accept message without reply', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Regular message',
      };

      const chat = new LiveStreamChat(chatData);
      const error = chat.validateSync();

      expect(error).toBeUndefined();
      expect(chat.replyTo).toBeDefined();
      expect(chat.replyTo.messageId).toBeUndefined();
    });
  });

  // ========== SYSTEM MESSAGE DATA ==========

  describe('System Message Data', () => {
    test('should store system data for join message', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderRole: 'system',
        content: 'User joined',
        messageType: 'system',
        systemData: {
          type: 'join',
          data: { username: 'TestUser', userId: mockSenderId },
        },
      };

      const chat = new LiveStreamChat(chatData);

      expect(chat.systemData.type).toBe('join');
      expect(chat.systemData.data.username).toBe('TestUser');
    });

    test('should only accept valid system data types', () => {
      const validTypes = [
        'join',
        'leave',
        'product_featured',
        'stream_started',
        'stream_ended',
        'viewer_milestone',
      ];

      validTypes.forEach(type => {
        const chatData = {
          streamId: mockStreamId,
          roomId: `test-room-${type}`,
          senderRole: 'system',
          content: 'System message',
          messageType: 'system',
          systemData: {
            type,
            data: {},
          },
        };

        const chat = new LiveStreamChat(chatData);
        const error = chat.validateSync();

        expect(error).toBeUndefined();
        expect(chat.systemData.type).toBe(type);
      });
    });
  });

  // ========== ORDER DETECTION METADATA ==========

  describe('Order Detection Metadata', () => {
    test('should validate confidence range', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Test message',
        orderDetection: {
          confidence: 1.5, // Invalid: > 1
        },
      };

      const chat = new LiveStreamChat(chatData);
      const error = chat.validateSync();

      expect(error).toBeDefined();
      expect(error.errors['orderDetection.confidence']).toBeDefined();
    });

    test('should accept valid confidence values', () => {
      const validConfidences = [0, 0.5, 1];

      validConfidences.forEach(confidence => {
        const chatData = {
          streamId: mockStreamId,
          roomId: `test-room-${confidence}`,
          senderId: mockSenderId,
          content: 'Test message',
          orderDetection: {
            confidence,
          },
        };

        const chat = new LiveStreamChat(chatData);
        const error = chat.validateSync();

        expect(error).toBeUndefined();
        expect(chat.orderDetection.confidence).toBe(confidence);
      });
    });

    test('should store detected keywords array', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Test message',
        orderDetection: {
          detectedKeywords: ['mua', 'đặt hàng', 'size'],
        },
      };

      const chat = new LiveStreamChat(chatData);

      expect(chat.orderDetection.detectedKeywords).toEqual(['mua', 'đặt hàng', 'size']);
    });

    test('should store phone numbers array', () => {
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Test message',
        orderDetection: {
          phoneNumbers: ['0912345678', '0987654321'],
        },
      };

      const chat = new LiveStreamChat(chatData);

      expect(chat.orderDetection.phoneNumbers).toEqual(['0912345678', '0987654321']);
    });
  });

  // ========== COMPLEX SCENARIOS ==========

  describe('Complex Scenarios', () => {
    test('should create a complete chat message with all features', () => {
      const replyMessageId = createMockObjectId();
      const userId1 = createMockObjectId();
      const userId2 = createMockObjectId();

      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        senderRole: 'host',
        content: 'Complete test message',
        messageType: 'product',
        visibility: 'public',
        reactions: [
          { userId: userId1, emoji: '❤️' },
          { userId: userId2, emoji: '👍' },
        ],
        productRef: {
          productId: mockProductId,
          productName: 'Test Product',
          productPrice: 1000000,
        },
        replyTo: {
          messageId: replyMessageId,
          username: 'TestUser',
          content: 'Original message',
        },
      };

      const chat = new LiveStreamChat(chatData);
      const error = chat.validateSync();

      expect(error).toBeUndefined();
      expect(chat.reactions).toHaveLength(2);
      expect(chat.productRef.productName).toBe('Test Product');
      expect(chat.replyTo.messageId).toEqual(replyMessageId);
    });

    test('should handle message lifecycle - create, edit, delete', async () => {
      const deletedBy = createMockObjectId();
      const chatData = {
        streamId: mockStreamId,
        roomId: 'test-room-123',
        senderId: mockSenderId,
        content: 'Original message',
      };

      const chat = new LiveStreamChat(chatData);
      chat.save = jest.fn().mockResolvedValue(chat);

      // Edit message
      await chat.editMessage('Edited message');
      expect(chat.content).toBe('Edited message');
      expect(chat.edited.originalContent).toBe('Original message');

      // Soft delete
      await chat.softDelete(deletedBy, 'Inappropriate');
      expect(chat.moderation.isDeleted).toBe(true);
      expect(chat.moderation.deleteReason).toBe('Inappropriate');
    });
  });
});
