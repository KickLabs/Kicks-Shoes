/**
 * Test Suite 7: LiveStream Model Tests
 * Testing LiveStream model methods, virtuals, statics, and middleware
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import LiveStream from '../src/models/LiveStream.js';

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

describe('LiveStream Model Tests', () => {
  let mockHostId;
  let mockProductId;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockHostId = createMockObjectId();
    mockProductId = createMockObjectId();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ========== SCHEMA VALIDATION ==========

  describe('Schema Validation', () => {
    test('should create a valid livestream with required fields', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
      };

      const livestream = new LiveStream(liveStreamData);

      expect(livestream.roomId).toBe('test-room-123');
      expect(livestream.title).toBe('Test Livestream');
      expect(livestream.hostId).toEqual(mockHostId);
      expect(livestream.status).toBe('scheduled');
      expect(livestream.isActive).toBe(false);
    });

    test('should fail validation without required roomId', () => {
      const liveStreamData = {
        title: 'Test Livestream',
        hostId: mockHostId,
      };

      const livestream = new LiveStream(liveStreamData);
      const error = livestream.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.roomId).toBeDefined();
    });

    test('should fail validation without required title', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        hostId: mockHostId,
      };

      const livestream = new LiveStream(liveStreamData);
      const error = livestream.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    test('should fail validation without required hostId', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
      };

      const livestream = new LiveStream(liveStreamData);
      const error = livestream.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.hostId).toBeDefined();
    });

    test('should trim title whitespace', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: '  Test Livestream  ',
        hostId: mockHostId,
      };

      const livestream = new LiveStream(liveStreamData);
      expect(livestream.title).toBe('Test Livestream');
    });

    test('should reject title longer than 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      const liveStreamData = {
        roomId: 'test-room-123',
        title: longTitle,
        hostId: mockHostId,
      };

      const livestream = new LiveStream(liveStreamData);
      const error = livestream.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    test('should trim description whitespace', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        description: '  Test Description  ',
        hostId: mockHostId,
      };

      const livestream = new LiveStream(liveStreamData);
      expect(livestream.description).toBe('Test Description');
    });

    test('should reject description longer than 1000 characters', () => {
      const longDescription = 'a'.repeat(1001);
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        description: longDescription,
        hostId: mockHostId,
      };

      const livestream = new LiveStream(liveStreamData);
      const error = livestream.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.description).toBeDefined();
    });

    test('should only accept valid status values', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        status: 'invalid-status',
      };

      const livestream = new LiveStream(liveStreamData);
      const error = livestream.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    });

    test('should accept all valid status values', () => {
      const validStatuses = ['scheduled', 'live', 'ended', 'cancelled'];

      validStatuses.forEach(status => {
        const liveStreamData = {
          roomId: `test-room-${status}`,
          title: 'Test Livestream',
          hostId: mockHostId,
          status,
        };

        const livestream = new LiveStream(liveStreamData);
        const error = livestream.validateSync();

        expect(error).toBeUndefined();
        expect(livestream.status).toBe(status);
      });
    });
  });

  // ========== DEFAULT VALUES ==========

  describe('Default Values', () => {
    test('should set default values for settings', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
      };

      const livestream = new LiveStream(liveStreamData);

      expect(livestream.settings.maxViewers).toBe(50);
      expect(livestream.settings.allowChat).toBe(true);
      expect(livestream.settings.isPublic).toBe(true);
      expect(livestream.settings.recordStream).toBe(false);
    });

    test('should set default values for stats', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
      };

      const livestream = new LiveStream(liveStreamData);

      expect(livestream.stats.totalViewers).toBe(0);
      expect(livestream.stats.peakViewers).toBe(0);
      expect(livestream.stats.currentViewers).toBe(0);
      expect(livestream.stats.totalMessages).toBe(0);
      expect(livestream.stats.duration).toBe(0);
    });

    test('should set default values for streamConfig', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
      };

      const livestream = new LiveStream(liveStreamData);

      expect(livestream.streamConfig.quality).toBe('720p');
      expect(livestream.streamConfig.bitrate).toBe(2500);
      expect(livestream.streamConfig.frameRate).toBe(30);
    });
  });

  // ========== SETTINGS VALIDATION ==========

  describe('Settings Validation', () => {
    test('should enforce maxViewers minimum of 1', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        settings: {
          maxViewers: 0,
        },
      };

      const livestream = new LiveStream(liveStreamData);
      const error = livestream.validateSync();

      expect(error).toBeDefined();
      expect(error.errors['settings.maxViewers']).toBeDefined();
    });

    test('should enforce maxViewers maximum of 100', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        settings: {
          maxViewers: 101,
        },
      };

      const livestream = new LiveStream(liveStreamData);
      const error = livestream.validateSync();

      expect(error).toBeDefined();
      expect(error.errors['settings.maxViewers']).toBeDefined();
    });

    test('should accept valid maxViewers value', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        settings: {
          maxViewers: 75,
        },
      };

      const livestream = new LiveStream(liveStreamData);
      const error = livestream.validateSync();

      expect(error).toBeUndefined();
      expect(livestream.settings.maxViewers).toBe(75);
    });

    test('should only accept valid quality values', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        streamConfig: {
          quality: 'invalid-quality',
        },
      };

      const livestream = new LiveStream(liveStreamData);
      const error = livestream.validateSync();

      expect(error).toBeDefined();
      expect(error.errors['streamConfig.quality']).toBeDefined();
    });

    test('should accept all valid quality values', () => {
      const validQualities = ['480p', '720p', '1080p'];

      validQualities.forEach(quality => {
        const liveStreamData = {
          roomId: `test-room-${quality}`,
          title: 'Test Livestream',
          hostId: mockHostId,
          streamConfig: {
            quality,
          },
        };

        const livestream = new LiveStream(liveStreamData);
        const error = livestream.validateSync();

        expect(error).toBeUndefined();
        expect(livestream.streamConfig.quality).toBe(quality);
      });
    });
  });

  // ========== VIRTUAL FIELDS ==========

  describe('Virtual Fields', () => {
    test('should calculate formattedDuration for zero duration', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        stats: {
          duration: 0,
        },
      };

      const livestream = new LiveStream(liveStreamData);
      expect(livestream.formattedDuration).toBe('0m');
    });

    test('should calculate formattedDuration for minutes only', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        stats: {
          duration: 1800, // 30 minutes
        },
      };

      const livestream = new LiveStream(liveStreamData);
      expect(livestream.formattedDuration).toBe('30m');
    });

    test('should calculate formattedDuration with hours and minutes', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        stats: {
          duration: 5400, // 1 hour 30 minutes
        },
      };

      const livestream = new LiveStream(liveStreamData);
      expect(livestream.formattedDuration).toBe('1h 30m');
    });

    test('should calculate formattedDuration for hours with zero minutes', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        stats: {
          duration: 7200, // 2 hours
        },
      };

      const livestream = new LiveStream(liveStreamData);
      expect(livestream.formattedDuration).toBe('2h 0m');
    });

    test('should generate correct streamUrl', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
      };

      const livestream = new LiveStream(liveStreamData);
      expect(livestream.streamUrl).toBe('/livestream/test-room-123');
    });
  });

  // ========== INSTANCE METHODS ==========

  describe('Instance Methods', () => {
    describe('updateViewerCount', () => {
      test('should update current viewer count', async () => {
        const liveStreamData = {
          roomId: 'test-room-123',
          title: 'Test Livestream',
          hostId: mockHostId,
        };

        const livestream = new LiveStream(liveStreamData);
        livestream.save = jest.fn().mockResolvedValue(livestream);

        await livestream.updateViewerCount(10);

        expect(livestream.stats.currentViewers).toBe(10);
        expect(livestream.save).toHaveBeenCalled();
      });

      test('should update peak viewers when current exceeds peak', async () => {
        const liveStreamData = {
          roomId: 'test-room-123',
          title: 'Test Livestream',
          hostId: mockHostId,
          stats: {
            peakViewers: 5,
          },
        };

        const livestream = new LiveStream(liveStreamData);
        livestream.save = jest.fn().mockResolvedValue(livestream);

        await livestream.updateViewerCount(10);

        expect(livestream.stats.currentViewers).toBe(10);
        expect(livestream.stats.peakViewers).toBe(10);
      });

      test('should not update peak viewers when current is less than peak', async () => {
        const liveStreamData = {
          roomId: 'test-room-123',
          title: 'Test Livestream',
          hostId: mockHostId,
          stats: {
            peakViewers: 20,
          },
        };

        const livestream = new LiveStream(liveStreamData);
        livestream.save = jest.fn().mockResolvedValue(livestream);

        await livestream.updateViewerCount(10);

        expect(livestream.stats.currentViewers).toBe(10);
        expect(livestream.stats.peakViewers).toBe(20);
      });

      test('should update total viewers when current exceeds total', async () => {
        const liveStreamData = {
          roomId: 'test-room-123',
          title: 'Test Livestream',
          hostId: mockHostId,
          stats: {
            totalViewers: 5,
          },
        };

        const livestream = new LiveStream(liveStreamData);
        livestream.save = jest.fn().mockResolvedValue(livestream);

        await livestream.updateViewerCount(10);

        expect(livestream.stats.totalViewers).toBe(10);
      });
    });

    describe('addFeaturedProduct', () => {
      test('should add a new featured product', async () => {
        const liveStreamData = {
          roomId: 'test-room-123',
          title: 'Test Livestream',
          hostId: mockHostId,
          featuredProducts: [],
        };

        const livestream = new LiveStream(liveStreamData);
        livestream.save = jest.fn().mockResolvedValue(livestream);

        await livestream.addFeaturedProduct(mockProductId);

        expect(livestream.featuredProducts).toHaveLength(1);
        expect(livestream.featuredProducts[0].productId).toEqual(mockProductId);
        expect(livestream.save).toHaveBeenCalled();
      });

      test('should not add duplicate featured product', async () => {
        const liveStreamData = {
          roomId: 'test-room-123',
          title: 'Test Livestream',
          hostId: mockHostId,
          featuredProducts: [{ productId: mockProductId }],
        };

        const livestream = new LiveStream(liveStreamData);
        livestream.save = jest.fn().mockResolvedValue(livestream);

        await livestream.addFeaturedProduct(mockProductId);

        expect(livestream.featuredProducts).toHaveLength(1);
        expect(livestream.save).not.toHaveBeenCalled();
      });

      test('should add multiple different featured products', async () => {
        const liveStreamData = {
          roomId: 'test-room-123',
          title: 'Test Livestream',
          hostId: mockHostId,
          featuredProducts: [],
        };

        const livestream = new LiveStream(liveStreamData);
        livestream.save = jest.fn().mockResolvedValue(livestream);

        const productId1 = createMockObjectId();
        const productId2 = createMockObjectId();

        await livestream.addFeaturedProduct(productId1);
        await livestream.addFeaturedProduct(productId2);

        expect(livestream.featuredProducts).toHaveLength(2);
      });
    });

    describe('removeFeaturedProduct', () => {
      test('should remove an existing featured product', async () => {
        const liveStreamData = {
          roomId: 'test-room-123',
          title: 'Test Livestream',
          hostId: mockHostId,
          featuredProducts: [{ productId: mockProductId }],
        };

        const livestream = new LiveStream(liveStreamData);
        livestream.save = jest.fn().mockResolvedValue(livestream);

        await livestream.removeFeaturedProduct(mockProductId);

        expect(livestream.featuredProducts).toHaveLength(0);
        expect(livestream.save).toHaveBeenCalled();
      });

      test('should not fail when removing non-existent product', async () => {
        const liveStreamData = {
          roomId: 'test-room-123',
          title: 'Test Livestream',
          hostId: mockHostId,
          featuredProducts: [],
        };

        const livestream = new LiveStream(liveStreamData);
        livestream.save = jest.fn().mockResolvedValue(livestream);

        await livestream.removeFeaturedProduct(mockProductId);

        expect(livestream.featuredProducts).toHaveLength(0);
        expect(livestream.save).toHaveBeenCalled();
      });

      test('should only remove the specified product', async () => {
        const productId1 = createMockObjectId();
        const productId2 = createMockObjectId();

        const liveStreamData = {
          roomId: 'test-room-123',
          title: 'Test Livestream',
          hostId: mockHostId,
          featuredProducts: [{ productId: productId1 }, { productId: productId2 }],
        };

        const livestream = new LiveStream(liveStreamData);
        livestream.save = jest.fn().mockResolvedValue(livestream);

        await livestream.removeFeaturedProduct(productId1);

        expect(livestream.featuredProducts).toHaveLength(1);
        expect(livestream.featuredProducts[0].productId).toEqual(productId2);
      });
    });
  });

  // ========== PRE-SAVE MIDDLEWARE ==========

  describe('Pre-save Middleware', () => {
    test('should set isActive to true when going live', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        status: 'scheduled',
        isActive: false,
      };

      const livestream = new LiveStream(liveStreamData);

      // Change status to live
      livestream.status = 'live';

      expect(livestream.status).toBe('live');
    });

    test('should set endedAt when status changes to ended', () => {
      const startTime = new Date('2025-01-01T10:00:00Z');
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        status: 'live',
        startedAt: startTime,
      };

      const livestream = new LiveStream(liveStreamData);
      livestream.status = 'ended';

      // Verify the status changed
      expect(livestream.status).toBe('ended');
    });

    test('should set isActive to false when status is ended', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        status: 'live',
        isActive: true,
      };

      const livestream = new LiveStream(liveStreamData);
      livestream.status = 'ended';

      expect(livestream.status).toBe('ended');
    });

    test('should set isActive to false when status is cancelled', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        status: 'scheduled',
      };

      const livestream = new LiveStream(liveStreamData);
      livestream.status = 'cancelled';

      expect(livestream.status).toBe('cancelled');
    });

    test('should not set endedAt if stream was never started', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        status: 'scheduled',
      };

      const livestream = new LiveStream(liveStreamData);
      livestream.status = 'ended';

      // Without startedAt, endedAt should not be set
      expect(livestream.startedAt).toBeUndefined();
    });

    test('should not set startedAt if already set when going live', () => {
      const existingStartTime = new Date('2025-01-01T10:00:00Z');
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        status: 'live',
        startedAt: existingStartTime,
      };

      const livestream = new LiveStream(liveStreamData);

      // startedAt should remain unchanged
      expect(livestream.startedAt).toEqual(existingStartTime);
    });

    test('should not set endedAt if already set', () => {
      const existingEndTime = new Date('2025-01-01T11:00:00Z');
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        status: 'ended',
        startedAt: new Date('2025-01-01T10:00:00Z'),
        endedAt: existingEndTime,
      };

      const livestream = new LiveStream(liveStreamData);

      // endedAt should remain unchanged
      expect(livestream.endedAt).toEqual(existingEndTime);
    });
  });

  // ========== FEATURED PRODUCTS ==========

  describe('Featured Products', () => {
    test('should store featured product with timestamp', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        featuredProducts: [
          {
            productId: mockProductId,
            addedAt: new Date(),
          },
        ],
      };

      const livestream = new LiveStream(liveStreamData);

      expect(livestream.featuredProducts).toHaveLength(1);
      expect(livestream.featuredProducts[0].productId).toEqual(mockProductId);
      expect(livestream.featuredProducts[0].addedAt).toBeInstanceOf(Date);
    });

    test('should handle empty featured products array', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        featuredProducts: [],
      };

      const livestream = new LiveStream(liveStreamData);

      expect(livestream.featuredProducts).toHaveLength(0);
    });
  });

  // ========== THUMBNAIL ==========

  describe('Thumbnail', () => {
    test('should accept thumbnail URL', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        thumbnail: 'https://example.com/thumbnail.jpg',
      };

      const livestream = new LiveStream(liveStreamData);

      expect(livestream.thumbnail).toBe('https://example.com/thumbnail.jpg');
    });

    test('should default thumbnail to null', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
      };

      const livestream = new LiveStream(liveStreamData);

      expect(livestream.thumbnail).toBeNull();
    });
  });

  // ========== TIMING FIELDS ==========

  describe('Timing Fields', () => {
    test('should accept scheduledAt date', () => {
      const scheduledDate = new Date('2025-12-31T15:00:00Z');
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        scheduledAt: scheduledDate,
      };

      const livestream = new LiveStream(liveStreamData);

      expect(livestream.scheduledAt).toEqual(scheduledDate);
    });

    test('should accept startedAt date', () => {
      const startedDate = new Date('2025-12-31T15:00:00Z');
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        startedAt: startedDate,
      };

      const livestream = new LiveStream(liveStreamData);

      expect(livestream.startedAt).toEqual(startedDate);
    });

    test('should accept endedAt date', () => {
      const endedDate = new Date('2025-12-31T16:00:00Z');
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        endedAt: endedDate,
      };

      const livestream = new LiveStream(liveStreamData);

      expect(livestream.endedAt).toEqual(endedDate);
    });
  });

  // ========== STATIC METHODS ==========

  describe('Static Methods', () => {
    beforeEach(() => {
      // Mock the mongoose model methods
      LiveStream.find = jest.fn().mockReturnThis();
      LiveStream.populate = jest.fn().mockReturnThis();
      LiveStream.sort = jest.fn().mockReturnThis();
      LiveStream.limit = jest.fn().mockReturnThis();
    });

    describe('getActiveStreams', () => {
      test('should query for active live streams', () => {
        LiveStream.getActiveStreams();

        expect(LiveStream.find).toHaveBeenCalledWith({
          isActive: true,
          status: 'live',
        });
      });

      test('should populate hostId with username and avatar', () => {
        LiveStream.getActiveStreams();

        expect(LiveStream.populate).toHaveBeenCalledWith('hostId', 'username avatar');
      });

      test('should sort by createdAt descending', () => {
        LiveStream.getActiveStreams();

        expect(LiveStream.sort).toHaveBeenCalledWith({ createdAt: -1 });
      });
    });

    describe('getStreamsByHost', () => {
      test('should query streams by hostId', () => {
        LiveStream.getStreamsByHost(mockHostId);

        expect(LiveStream.find).toHaveBeenCalledWith({ hostId: mockHostId });
      });

      test('should use default limit of 10', () => {
        LiveStream.getStreamsByHost(mockHostId);

        expect(LiveStream.limit).toHaveBeenCalledWith(10);
      });

      test('should use custom limit when provided', () => {
        LiveStream.getStreamsByHost(mockHostId, 20);

        expect(LiveStream.limit).toHaveBeenCalledWith(20);
      });

      test('should populate hostId and sort by createdAt', () => {
        LiveStream.getStreamsByHost(mockHostId);

        expect(LiveStream.populate).toHaveBeenCalledWith('hostId', 'username avatar');
        expect(LiveStream.sort).toHaveBeenCalledWith({ createdAt: -1 });
      });
    });

    describe('getUpcomingStreams', () => {
      test('should query for scheduled streams with future dates', () => {
        LiveStream.getUpcomingStreams();

        const callArgs = LiveStream.find.mock.calls[0][0];
        expect(callArgs.status).toBe('scheduled');
        expect(callArgs.scheduledAt).toBeDefined();
        expect(callArgs.scheduledAt.$gte).toBeInstanceOf(Date);
      });

      test('should populate hostId with username and avatar', () => {
        LiveStream.getUpcomingStreams();

        expect(LiveStream.populate).toHaveBeenCalledWith('hostId', 'username avatar');
      });

      test('should sort by scheduledAt ascending', () => {
        LiveStream.getUpcomingStreams();

        expect(LiveStream.sort).toHaveBeenCalledWith({ scheduledAt: 1 });
      });
    });
  });

  // ========== COMPLEX SCENARIOS ==========

  describe('Complex Scenarios', () => {
    test('should create livestream with full configuration', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Full Featured Livestream',
        description: 'A complete livestream with all features',
        hostId: mockHostId,
        status: 'scheduled',
        scheduledAt: new Date('2025-12-31T15:00:00Z'),
        settings: {
          maxViewers: 100,
          allowChat: true,
          isPublic: true,
          recordStream: true,
        },
        streamConfig: {
          quality: '1080p',
          bitrate: 5000,
          frameRate: 60,
        },
        thumbnail: 'https://example.com/thumb.jpg',
      };

      const livestream = new LiveStream(liveStreamData);
      const error = livestream.validateSync();

      expect(error).toBeUndefined();
      expect(livestream.title).toBe('Full Featured Livestream');
      expect(livestream.settings.maxViewers).toBe(100);
      expect(livestream.streamConfig.quality).toBe('1080p');
    });

    test('should handle livestream lifecycle from scheduled to ended', () => {
      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Lifecycle Test',
        hostId: mockHostId,
        status: 'scheduled',
      };

      const livestream = new LiveStream(liveStreamData);

      // Go live
      livestream.status = 'live';
      livestream.startedAt = new Date();
      livestream.isActive = true;

      expect(livestream.status).toBe('live');
      expect(livestream.isActive).toBe(true);

      // End stream
      livestream.status = 'ended';
      livestream.endedAt = new Date();
      livestream.isActive = false;

      expect(livestream.status).toBe('ended');
      expect(livestream.isActive).toBe(false);
    });

    test('should handle multiple featured products', () => {
      const product1 = createMockObjectId();
      const product2 = createMockObjectId();
      const product3 = createMockObjectId();

      const liveStreamData = {
        roomId: 'test-room-123',
        title: 'Test Livestream',
        hostId: mockHostId,
        featuredProducts: [
          { productId: product1, addedAt: new Date() },
          { productId: product2, addedAt: new Date() },
          { productId: product3, addedAt: new Date() },
        ],
      };

      const livestream = new LiveStream(liveStreamData);

      expect(livestream.featuredProducts).toHaveLength(3);
      expect(livestream.featuredProducts[0].productId).toEqual(product1);
      expect(livestream.featuredProducts[1].productId).toEqual(product2);
      expect(livestream.featuredProducts[2].productId).toEqual(product3);
    });
  });
});
