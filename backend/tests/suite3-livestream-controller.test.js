/**
 * Test Suite 3: Livestream Controller (UNIT TEST)
 *
 * This test suite covers all livestream controller endpoints and functionality:
 * - Create livestream with validation and authorization
 * - Get livestream details with room status
 * - Get active/upcoming livestreams with pagination
 * - Update livestream with proper authorization
 * - End livestream with status updates
 * - Delete livestream with cleanup
 * - Chat message management
 * - Featured product management
 * - Analytics and statistics
 *
 * NOTE: This is a PURE UNIT TEST - no real database connections, all dependencies mocked
 */

import { jest } from '@jest/globals';

// Create mock functions BEFORE any imports
const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockCountDocuments = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockGetUpcomingStreams = jest.fn();
const mockChatFind = jest.fn();
const mockCreateSystemMessage = jest.fn();
const mockDeleteMany = jest.fn();
const mockAggregate = jest.fn();
const mockUserFindById = jest.fn();
const mockProductFindById = jest.fn();
const mockCreateRoom = jest.fn();
const mockGetRoomStatus = jest.fn();
const mockValidationResult = jest.fn();

// Mock all dependencies BEFORE importing controller
jest.unstable_mockModule('../src/models/LiveStream.js', () => ({
  default: {
    findOne: mockFindOne,
    find: mockFind,
    countDocuments: mockCountDocuments,
    findByIdAndUpdate: mockFindByIdAndUpdate,
    findByIdAndDelete: mockFindByIdAndDelete,
    getUpcomingStreams: mockGetUpcomingStreams,
  },
}));

jest.unstable_mockModule('../src/models/LiveStreamChat.js', () => ({
  default: {
    find: mockChatFind,
    createSystemMessage: mockCreateSystemMessage,
    deleteMany: mockDeleteMany,
    aggregate: mockAggregate,
  },
}));

jest.unstable_mockModule('../src/models/User.js', () => ({
  default: {
    findById: mockUserFindById,
  },
}));

jest.unstable_mockModule('../src/models/Product.js', () => ({
  default: {
    findById: mockProductFindById,
  },
}));

jest.unstable_mockModule('../src/services/livestream.service.js', () => ({
  default: {
    createRoom: mockCreateRoom,
    getRoomStatus: mockGetRoomStatus,
  },
}));

jest.unstable_mockModule('../src/middlewares/async.middleware.js', () => ({
  asyncHandler: fn => fn,
}));

jest.unstable_mockModule('../src/utils/errorResponse.js', () => ({
  ErrorResponse: class ErrorResponse extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

jest.unstable_mockModule('../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.unstable_mockModule('express-validator', () => ({
  validationResult: mockValidationResult,
}));

// Import controller AFTER mocking
const controller = await import('../src/controllers/livestreamController.js');

describe('Livestream Controller Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user123', role: 'shop' },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createLiveStream', () => {
    it('should create a new livestream successfully', async () => {
      // Arrange
      mockReq.body = {
        title: 'Test Stream',
        description: 'Test Description',
        settings: { maxViewers: 100, allowChat: true },
      };

      const mockUser = { _id: 'user123', role: 'shop' };
      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        title: 'Test Stream',
        hostId: 'user123',
      };

      mockUserFindById.mockResolvedValue(mockUser);
      mockFindOne.mockResolvedValue(null); // No existing stream
      mockCreateRoom.mockResolvedValue(mockLiveStream);
      mockValidationResult.mockReturnValue({ isEmpty: () => true });

      // Act
      await controller.createLiveStream(mockReq, mockRes, mockNext);

      // Assert
      expect(mockUserFindById).toHaveBeenCalledWith('user123');
      expect(mockFindOne).toHaveBeenCalledWith({
        hostId: 'user123',
        isActive: true,
      });
      expect(mockCreateRoom).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Livestream created successfully',
        data: {
          liveStream: mockLiveStream,
          joinUrl: '/livestream/room123',
        },
      });
    });

    it('should create livestream with default settings', async () => {
      // Arrange
      mockReq.body = {
        title: 'Test Stream',
        scheduledAt: new Date(),
        settings: { allowChat: false, isPublic: false, recordStream: true },
      };

      const mockUser = { _id: 'user123', role: 'shop' };
      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        title: 'Test Stream',
        hostId: 'user123',
      };

      mockUserFindById.mockResolvedValue(mockUser);
      mockFindOne.mockResolvedValue(null);
      mockCreateRoom.mockResolvedValue(mockLiveStream);
      mockValidationResult.mockReturnValue({ isEmpty: () => true });

      // Act
      await controller.createLiveStream(mockReq, mockRes, mockNext);

      // Assert
      expect(mockCreateRoom).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should create livestream without settings object', async () => {
      // Arrange
      mockReq.body = {
        title: 'Test Stream',
      };

      const mockUser = { _id: 'user123', role: 'shop' };
      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        title: 'Test Stream',
        hostId: 'user123',
      };

      mockUserFindById.mockResolvedValue(mockUser);
      mockFindOne.mockResolvedValue(null);
      mockCreateRoom.mockResolvedValue(mockLiveStream);
      mockValidationResult.mockReturnValue({ isEmpty: () => true });

      // Act
      await controller.createLiveStream(mockReq, mockRes, mockNext);

      // Assert
      expect(mockCreateRoom).toHaveBeenCalled();
    });

    it('should reject non-shop users', async () => {
      // Arrange
      mockReq.user.role = 'customer';
      const mockUser = { _id: 'user123', role: 'customer' };

      mockUserFindById.mockResolvedValue(mockUser);
      mockValidationResult.mockReturnValue({ isEmpty: () => true });

      // Act & Assert
      await expect(controller.createLiveStream(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Only shop owners can create livestreams'
      );
    });

    it('should reject when user already has active stream', async () => {
      // Arrange
      mockReq.body = { title: 'Test Stream' };
      const mockUser = { _id: 'user123', role: 'shop' };
      const existingStream = { _id: 'existing123' };

      mockUserFindById.mockResolvedValue(mockUser);
      mockFindOne.mockResolvedValue(existingStream);
      mockValidationResult.mockReturnValue({ isEmpty: () => true });

      // Act & Assert
      await expect(controller.createLiveStream(mockReq, mockRes, mockNext)).rejects.toThrow(
        'User already has an active livestream'
      );
    });

    it('should handle validation errors', async () => {
      // Arrange
      const validationErrors = [{ field: 'title', message: 'Title is required' }];
      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => validationErrors,
      });

      // Act
      await controller.createLiveStream(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation errors',
        errors: validationErrors,
      });
    });
  });

  describe('getLiveStream', () => {
    it('should get livestream details successfully', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        title: 'Test Stream',
        isActive: true,
        status: 'live',
        stats: { currentViewers: 10 },
      };
      const mockRoomStatus = { isActive: true, viewerCount: 15 };

      mockFindOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLiveStream),
        }),
      });
      mockGetRoomStatus.mockReturnValue(mockRoomStatus);

      // Act
      await controller.getLiveStream(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          liveStream: mockLiveStream,
          roomStatus: mockRoomStatus,
          isLive: true,
          viewerCount: 15,
        },
      });
    });

    it('should throw error when livestream not found', async () => {
      // Arrange
      mockReq.params.roomId = 'nonexistent';
      mockFindOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      // Act & Assert
      await expect(controller.getLiveStream(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Livestream not found'
      );
    });
  });

  describe('getActiveLiveStreams', () => {
    it('should get active livestreams with pagination', async () => {
      // Arrange
      mockReq.query = { page: '1', limit: '5' };
      const mockStreams = [
        {
          _id: 'stream1',
          roomId: 'room1',
          title: 'Stream 1',
          toObject: jest
            .fn()
            .mockReturnValue({ _id: 'stream1', roomId: 'room1', title: 'Stream 1' }),
        },
        {
          _id: 'stream2',
          roomId: 'room2',
          title: 'Stream 2',
          toObject: jest
            .fn()
            .mockReturnValue({ _id: 'stream2', roomId: 'room2', title: 'Stream 2' }),
        },
      ];
      const mockRoomStatus = { viewerCount: 10 };

      mockFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockStreams),
            }),
          }),
        }),
      });
      mockCountDocuments.mockResolvedValue(2);
      mockGetRoomStatus.mockReturnValue(mockRoomStatus);

      // Act
      await controller.getActiveLiveStreams(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          streams: expect.arrayContaining([expect.objectContaining({ currentViewers: 10 })]),
          pagination: {
            page: 1,
            limit: 5,
            total: 2,
            pages: 1,
          },
        },
      });
    });
  });

  describe('updateLiveStream', () => {
    it('should update livestream successfully', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      mockReq.body = { title: 'Updated Title', description: 'Updated Description' };

      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
        title: 'Original Title',
      };
      const updatedStream = { ...mockLiveStream, title: 'Updated Title' };

      mockFindOne.mockResolvedValue(mockLiveStream);
      mockFindByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedStream),
      });

      // Act
      await controller.updateLiveStream(mockReq, mockRes, mockNext);

      // Assert
      expect(mockFindByIdAndUpdate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Livestream updated successfully',
        data: updatedStream,
      });
    });

    it('should reject unauthorized updates', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      mockReq.user.id = 'otheruser';
      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
      };

      mockFindOne.mockResolvedValue(mockLiveStream);

      // Act & Assert
      await expect(controller.updateLiveStream(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Not authorized to update this livestream'
      );
    });

    it('should prevent content updates while live', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      mockReq.body = { title: 'New Title' };
      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
        status: 'live',
      };

      mockFindOne.mockResolvedValue(mockLiveStream);

      // Act & Assert
      await expect(controller.updateLiveStream(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Cannot update livestream content while it is live'
      );
    });
  });

  describe('endLiveStream', () => {
    it('should end livestream successfully', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
        status: 'live',
        isActive: true,
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        stats: {}, // Initialize stats object
        save: jest.fn().mockResolvedValue(),
      };

      mockFindOne.mockResolvedValue(mockLiveStream);
      mockCreateSystemMessage.mockResolvedValue();

      // Act
      await controller.endLiveStream(mockReq, mockRes, mockNext);

      // Assert
      expect(mockLiveStream.status).toBe('ended');
      expect(mockLiveStream.isActive).toBe(false);
      expect(mockLiveStream.endedAt).toBeDefined();
      expect(mockLiveStream.save).toHaveBeenCalled();
      expect(mockCreateSystemMessage).toHaveBeenCalledWith(
        'stream123',
        'room123',
        'stream_ended',
        {}
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Livestream ended successfully',
        data: mockLiveStream,
      });
    });

    it('should reject ending non-live stream', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
        status: 'ended',
      };

      mockFindOne.mockResolvedValue(mockLiveStream);

      // Act & Assert
      await expect(controller.endLiveStream(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Livestream is not currently live'
      );
    });
  });

  describe('deleteLiveStream', () => {
    it('should delete livestream successfully', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
        status: 'ended',
      };

      mockFindOne.mockResolvedValue(mockLiveStream);
      mockDeleteMany.mockResolvedValue();
      mockFindByIdAndDelete.mockResolvedValue();

      // Act
      await controller.deleteLiveStream(mockReq, mockRes, mockNext);

      // Assert
      expect(mockDeleteMany).toHaveBeenCalledWith({ streamId: 'stream123' });
      expect(mockFindByIdAndDelete).toHaveBeenCalledWith('stream123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Livestream deleted successfully',
      });
    });

    it('should prevent deletion of live stream', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
        status: 'live',
      };

      mockFindOne.mockResolvedValue(mockLiveStream);

      // Act & Assert
      await expect(controller.deleteLiveStream(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Cannot delete livestream while it is live'
      );
    });
  });

  describe('getChatMessages', () => {
    it('should get chat messages with pagination', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      mockReq.query = { limit: '20', page: '1' };

      const mockLiveStream = { _id: 'stream123' };
      const mockMessages = [
        { _id: 'msg1', content: 'Hello', timestamp: new Date() },
        { _id: 'msg2', content: 'World', timestamp: new Date() },
      ];

      mockFindOne.mockResolvedValue(mockLiveStream);
      mockChatFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue(mockMessages),
            }),
          }),
        }),
      });

      // Act
      await controller.getChatMessages(mockReq, mockRes, mockNext);

      // Assert
      expect(mockChatFind).toHaveBeenCalledWith({
        streamId: 'stream123',
        'moderation.isDeleted': false,
        'moderation.isHidden': false,
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockMessages.reverse(),
      });
    });
  });

  describe('addFeaturedProduct', () => {
    it('should add featured product successfully', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      mockReq.body = { productId: 'product123' };

      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
        addFeaturedProduct: jest.fn(),
      };
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 100000,
        images: ['image1.jpg'],
      };

      mockFindOne.mockResolvedValue(mockLiveStream);
      mockProductFindById.mockResolvedValue(mockProduct);
      mockCreateSystemMessage.mockResolvedValue();

      // Act
      await controller.addFeaturedProduct(mockReq, mockRes, mockNext);

      // Assert
      expect(mockLiveStream.addFeaturedProduct).toHaveBeenCalledWith('product123');
      expect(mockCreateSystemMessage).toHaveBeenCalledWith(
        'stream123',
        'room123',
        'product_featured',
        {
          productName: 'Test Product',
          productId: 'product123',
        }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product featured successfully',
        data: {
          product: {
            _id: 'product123',
            name: 'Test Product',
            price: 100000,
            images: ['image1.jpg'],
          },
        },
      });
    });

    it('should reject when product not found', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      mockReq.body = { productId: 'nonexistent' };

      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
      };

      mockFindOne.mockResolvedValue(mockLiveStream);
      mockProductFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.addFeaturedProduct(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Product not found'
      );
    });
  });

  describe('getLiveStreamAnalytics', () => {
    it('should return comprehensive analytics', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';

      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
        stats: {
          duration: 3600,
          peakViewers: 50,
          totalViewers: 100,
          totalMessages: 200,
        },
        startedAt: new Date(Date.now() - 3600000),
        endedAt: new Date(),
        featuredProducts: [{ productId: 'product1', name: 'Product 1' }],
        formattedDuration: '1h 0m',
      };
      const mockChatStats = [
        { _id: 'host', count: 50 },
        { _id: 'viewer', count: 150 },
      ];
      const mockRoomStatus = { viewerCount: 25 };

      mockFindOne.mockResolvedValue(mockLiveStream);
      mockAggregate.mockResolvedValue(mockChatStats);
      mockGetRoomStatus.mockReturnValue(mockRoomStatus);

      // Act
      await controller.getLiveStreamAnalytics(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          stream: {
            duration: 3600,
            formattedDuration: '1h 0m',
            status: mockLiveStream.status,
            startedAt: mockLiveStream.startedAt,
            endedAt: mockLiveStream.endedAt,
          },
          viewers: {
            peakViewers: 50,
            totalViewers: 100,
            currentViewers: 25,
          },
          chat: {
            totalMessages: 200,
            messagesByRole: {
              host: 50,
              viewer: 150,
              system: 0,
            },
          },
          products: {
            featuredCount: 1,
            featuredProducts: mockLiveStream.featuredProducts,
          },
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      const dbError = new Error('Database connection failed');
      mockFindOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(dbError),
        }),
      });

      // Act & Assert
      await expect(controller.getLiveStream(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle service errors', async () => {
      // Arrange
      mockReq.body = { title: 'Test Stream' };
      const mockUser = { _id: 'user123', role: 'shop' };

      mockUserFindById.mockResolvedValue(mockUser);
      mockFindOne.mockResolvedValue(null);
      mockCreateRoom.mockRejectedValue(new Error('Service unavailable'));
      mockValidationResult.mockReturnValue({ isEmpty: () => true });

      // Act & Assert
      await expect(controller.createLiveStream(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Service unavailable'
      );
    });
  });

  describe('getMyLiveStreams', () => {
    it('should get user streams with pagination', async () => {
      // Arrange
      mockReq.query = { page: '1', limit: '5' };
      const mockStreams = [
        {
          _id: 'stream1',
          roomId: 'room1',
          title: 'My Stream 1',
          toObject: jest
            .fn()
            .mockReturnValue({ _id: 'stream1', roomId: 'room1', title: 'My Stream 1' }),
        },
      ];
      const mockRoomStatus = { viewerCount: 5, isActive: true };

      mockFind.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockStreams),
          }),
        }),
      });
      mockCountDocuments.mockResolvedValue(1);
      mockGetRoomStatus.mockReturnValue(mockRoomStatus);

      // Act
      await controller.getMyLiveStreams(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          streams: expect.arrayContaining([
            expect.objectContaining({
              currentViewers: 5,
              isCurrentlyLive: true,
            }),
          ]),
          pagination: expect.any(Object),
        },
      });
    });
  });

  describe('getUpcomingLiveStreams', () => {
    it('should get upcoming livestreams', async () => {
      // Arrange
      mockReq.query = { limit: '5' };
      const mockUpcomingStreams = [
        { _id: 'stream1', roomId: 'room1', title: 'Upcoming Stream 1', scheduledAt: new Date() },
        { _id: 'stream2', roomId: 'room2', title: 'Upcoming Stream 2', scheduledAt: new Date() },
      ];

      mockGetUpcomingStreams.mockReturnValue({
        limit: jest.fn().mockResolvedValue(mockUpcomingStreams),
      });

      // Act
      await controller.getUpcomingLiveStreams(mockReq, mockRes, mockNext);

      // Assert
      expect(mockGetUpcomingStreams).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpcomingStreams,
      });
    });

    it('should use default limit when not provided', async () => {
      // Arrange
      mockReq.query = {};
      mockGetUpcomingStreams.mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      });

      // Act
      await controller.getUpcomingLiveStreams(mockReq, mockRes, mockNext);

      // Assert
      expect(mockGetUpcomingStreams).toHaveBeenCalled();
    });
  });

  describe('getAllLiveStreams', () => {
    it('should get all livestreams with pagination', async () => {
      // Arrange
      mockReq.query = { page: '2', limit: '5' };
      const mockStreams = [
        { _id: 'stream1', roomId: 'room1', title: 'Stream 1' },
        { _id: 'stream2', roomId: 'room2', title: 'Stream 2' },
      ];

      mockFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockStreams),
            }),
          }),
        }),
      });
      mockCountDocuments.mockResolvedValue(15);

      // Act
      await controller.getAllLiveStreams(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          streams: mockStreams,
          pagination: {
            page: 2,
            limit: 5,
            total: 15,
            pages: 3,
          },
        },
      });
    });

    it('should use default pagination values', async () => {
      // Arrange
      mockReq.query = {};
      mockFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockCountDocuments.mockResolvedValue(0);

      // Act
      await controller.getAllLiveStreams(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          streams: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0,
          },
        },
      });
    });
  });

  describe('updateLiveStream - Additional Cases', () => {
    it('should update livestream with status change', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      mockReq.body = { status: 'live', isActive: true, startedAt: new Date() };

      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
        status: 'scheduled',
        settings: {},
      };
      const updatedStream = { ...mockLiveStream, status: 'live', isActive: true };

      mockFindOne.mockResolvedValue(mockLiveStream);
      mockFindByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedStream),
      });

      // Act
      await controller.updateLiveStream(mockReq, mockRes, mockNext);

      // Assert
      expect(mockFindByIdAndUpdate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Livestream updated successfully',
        data: updatedStream,
      });
    });

    it('should update livestream with settings', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      mockReq.body = {
        title: 'Updated',
        description: 'New desc',
        scheduledAt: new Date(),
        settings: { maxViewers: 200 },
      };

      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
        status: 'scheduled',
        settings: { maxViewers: 100 },
      };

      mockFindOne.mockResolvedValue(mockLiveStream);
      mockFindByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockLiveStream),
      });

      // Act
      await controller.updateLiveStream(mockReq, mockRes, mockNext);

      // Assert
      expect(mockFindByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw error when livestream not found for update', async () => {
      // Arrange
      mockReq.params.roomId = 'nonexistent';
      mockFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.updateLiveStream(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Livestream not found'
      );
    });
  });

  describe('endLiveStream - Additional Cases', () => {
    it('should throw error when livestream not found', async () => {
      // Arrange
      mockReq.params.roomId = 'nonexistent';
      mockFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.endLiveStream(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Livestream not found'
      );
    });

    it('should reject unauthorized user ending stream', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      mockReq.user.id = 'otheruser';
      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
        status: 'live',
      };

      mockFindOne.mockResolvedValue(mockLiveStream);

      // Act & Assert
      await expect(controller.endLiveStream(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Not authorized to end this livestream'
      );
    });
  });

  describe('deleteLiveStream - Additional Cases', () => {
    it('should throw error when livestream not found', async () => {
      // Arrange
      mockReq.params.roomId = 'nonexistent';
      mockFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.deleteLiveStream(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Livestream not found'
      );
    });

    it('should reject unauthorized deletion', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      mockReq.user.id = 'otheruser';
      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
        status: 'ended',
      };

      mockFindOne.mockResolvedValue(mockLiveStream);

      // Act & Assert
      await expect(controller.deleteLiveStream(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Not authorized to delete this livestream'
      );
    });
  });

  describe('getChatMessages - Additional Cases', () => {
    it('should throw error when livestream not found', async () => {
      // Arrange
      mockReq.params.roomId = 'nonexistent';
      mockFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.getChatMessages(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Livestream not found'
      );
    });
  });

  describe('addFeaturedProduct - Additional Cases', () => {
    it('should throw error when livestream not found', async () => {
      // Arrange
      mockReq.params.roomId = 'nonexistent';
      mockReq.body = { productId: 'product123' };
      mockFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.addFeaturedProduct(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Livestream not found'
      );
    });

    it('should reject unauthorized user', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      mockReq.body = { productId: 'product123' };
      mockReq.user.id = 'otheruser';

      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
      };

      mockFindOne.mockResolvedValue(mockLiveStream);

      // Act & Assert
      await expect(controller.addFeaturedProduct(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Not authorized to feature products in this livestream'
      );
    });
  });

  describe('removeFeaturedProduct', () => {
    it('should remove featured product successfully', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      mockReq.params.productId = 'product123';

      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
        removeFeaturedProduct: jest.fn(),
      };

      mockFindOne.mockResolvedValue(mockLiveStream);

      // Act
      await controller.removeFeaturedProduct(mockReq, mockRes, mockNext);

      // Assert
      expect(mockLiveStream.removeFeaturedProduct).toHaveBeenCalledWith('product123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product removed from featured list',
      });
    });

    it('should throw error when livestream not found', async () => {
      // Arrange
      mockReq.params.roomId = 'nonexistent';
      mockReq.params.productId = 'product123';
      mockFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.removeFeaturedProduct(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Livestream not found'
      );
    });

    it('should reject unauthorized user', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      mockReq.params.productId = 'product123';
      mockReq.user.id = 'otheruser';

      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
      };

      mockFindOne.mockResolvedValue(mockLiveStream);

      // Act & Assert
      await expect(controller.removeFeaturedProduct(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Not authorized to manage products in this livestream'
      );
    });
  });

  describe('getLiveStreamAnalytics - Additional Cases', () => {
    it('should throw error when livestream not found', async () => {
      // Arrange
      mockReq.params.roomId = 'nonexistent';
      mockFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.getLiveStreamAnalytics(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Livestream not found'
      );
    });

    it('should reject unauthorized user', async () => {
      // Arrange
      mockReq.params.roomId = 'room123';
      mockReq.user.id = 'otheruser';

      const mockLiveStream = {
        _id: 'stream123',
        roomId: 'room123',
        hostId: 'user123',
      };

      mockFindOne.mockResolvedValue(mockLiveStream);

      // Act & Assert
      await expect(controller.getLiveStreamAnalytics(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Not authorized to view analytics for this livestream'
      );
    });
  });
});
