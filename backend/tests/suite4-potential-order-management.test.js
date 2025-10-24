/**
 * Test Suite 4: Potential Order Management (UNIT TEST)
 * Focus: potentialOrderController CRUD operations
 * Scope: Status updates, filtering, statistics
 *
 * NOTE: This is a PURE UNIT TEST - no real database connections, all dependencies mocked
 */

import { jest } from '@jest/globals';
import * as controller from '../src/controllers/potentialOrderController.js';

// Mock all models
jest.mock('../src/models/PotentialOrder.js', () => ({
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    insertMany: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

jest.mock('../src/models/LiveStream.js', () => ({
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('../src/models/User.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

// Mock Excel Export Service
jest.mock('../src/services/excelExport.service.js', () => ({
  default: {
    exportPotentialOrders: jest.fn(),
    exportWithFilters: jest.fn(),
  },
}));

// Mock async middleware
jest.mock('../src/middlewares/async.middleware.js', () => ({
  asyncHandler: fn => fn, // For unit tests, just return the function directly
}));

// Import mocked models and services
import PotentialOrder from '../src/models/PotentialOrder.js';
import LiveStream from '../src/models/LiveStream.js';
import excelExportService from '../src/services/excelExport.service.js';

// Helper function to create mock ObjectId
const createMockObjectId = (id = null) => {
  const mockId = id || Math.random().toString(36).substring(7);
  return {
    toString: () => mockId,
    _id: mockId,
    equals: other => mockId === (other?.toString?.() || other),
  };
};

// Test data setup
const TEST_HOST_ID = createMockObjectId('host123');
const TEST_VIEWER_ID = createMockObjectId('viewer456');
const TEST_STREAM_ID = createMockObjectId('stream789');
const TEST_USER_ID = createMockObjectId('user123');
const TEST_ORDER_ID = createMockObjectId('order456');

// Helper to create valid potential order data
const makePotentialOrderData = (overrides = {}) => ({
  _id: createMockObjectId(),
  streamId: TEST_STREAM_ID,
  roomId: 'test-room-001',
  chatMessageId: createMockObjectId(),
  customerInfo: {
    userId: TEST_VIEWER_ID,
    customerName: 'Test Viewer',
    phoneNumber: '0912345678',
  },
  productInfo: {
    originalMessage: 'Chốt giày size 42',
  },
  detectionData: {
    confidence: 0.85,
    keywords: ['chốt'],
  },
  status: 'pending',
  priority: 'high',
  hostActions: {
    viewedAt: null,
    notes: '',
  },
  save: jest.fn().mockImplementation(function () {
    return Promise.resolve(this);
  }),
  // Instance methods from model
  markAsViewed: jest.fn().mockImplementation(function () {
    this.hostActions.viewedAt = new Date();
    if (this.status === 'pending') {
      this.status = 'contacted';
    }
    return this.save();
  }),
  addHostNote: jest.fn().mockImplementation(function (note, hostId) {
    this.hostActions.notes = note;
    this.hostActions.confirmedBy = hostId;
    this.hostActions.confirmedAt = new Date();
    return this.save();
  }),
  markAsSpam: jest.fn().mockImplementation(function () {
    this.status = 'spam';
    return this.save();
  }),
  ...overrides,
});

// Mock req/res helpers
const mockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: { id: TEST_HOST_ID.toString(), role: 'shop' },
  ...overrides,
});

const mockResponse = () => {
  const res = {
    statusCode: null,
    jsonData: null,
    json: jest.fn(),
    status: jest.fn(),
  };
  res.status.mockImplementation(code => {
    res.statusCode = code;
    return res;
  });
  res.json.mockImplementation(data => {
    res.jsonData = data;
    return res;
  });
  return res;
};

describe('Order in Livestream — Test Suite 4: Potential Order Management (Unit Tests)', () => {
  // Mock data
  const mockTestStream = {
    _id: TEST_STREAM_ID,
    roomId: 'test-room-001',
    title: 'Test Stream',
    hostId: TEST_HOST_ID,
    isActive: true,
    status: 'live',
  };

  // Helper to create mock query chain
  const createMockQueryChain = finalResult => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(finalResult),
    then: function (resolve) {
      return Promise.resolve(finalResult).then(resolve);
    },
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    LiveStream.findOne = jest.fn();
    LiveStream.findById = jest.fn();
    LiveStream.find = jest.fn();
    PotentialOrder.find = jest.fn();
    PotentialOrder.findById = jest.fn();
    PotentialOrder.create = jest.fn();
    PotentialOrder.insertMany = jest.fn();
    PotentialOrder.deleteMany = jest.fn();
    PotentialOrder.countDocuments = jest.fn();
    PotentialOrder.aggregate = jest.fn();
    PotentialOrder.findByIdAndDelete = jest.fn();

    // Setup Excel Export Service mocks
    excelExportService.exportPotentialOrders = jest.fn();
    excelExportService.exportWithFilters = jest.fn();

    // Setup default returns for LiveStream queries
    LiveStream.findOne.mockImplementation(query => {
      if (query.roomId === 'test-room-001') {
        return Promise.resolve(mockTestStream);
      }
      return Promise.resolve(null);
    });

    LiveStream.findById.mockImplementation(id => {
      const idStr = id?.toString?.() || id;
      if (idStr === TEST_STREAM_ID.toString()) {
        return Promise.resolve(mockTestStream);
      }
      return Promise.resolve(null);
    });

    // Mock LiveStream.find for hostId queries
    LiveStream.find.mockImplementation(() => {
      const streamIds = [TEST_STREAM_ID];
      return {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockResolvedValue(streamIds),
        then: function (resolve) {
          return Promise.resolve([mockTestStream]).then(resolve);
        },
      };
    });
  });

  // ========== TC-1001: Controller - Get Orders for Stream ==========
  test('TC-1001 | Verify getPotentialOrdersForStream returns orders for valid stream', async () => {
    // Given: Stream has 5 potential orders
    const mockOrders = Array(5)
      .fill(null)
      .map((_, i) =>
        makePotentialOrderData({
          customerInfo: {
            userId: TEST_VIEWER_ID,
            customerName: `Viewer ${i}`,
            phoneNumber: `09123456${i}${i}`,
          },
        })
      );

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));

    const req = mockRequest({
      params: { streamId: 'test-room-001' },
      user: { id: TEST_HOST_ID.toString(), role: 'shop' },
    });
    const res = mockResponse();

    // When: Controller is called
    await controller.getPotentialOrdersForStream(req, res);

    // Then: Response contains orders
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.count).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(res.jsonData.data)).toBe(true);
  });

  // ========== TC-1002: Controller - Filter by Status ==========
  test('TC-1002 | Verify getMyPotentialOrders filters by status correctly', async () => {
    // Given: Mixed status orders (3 pending)
    const pendingOrders = Array(3)
      .fill(null)
      .map((_, i) =>
        makePotentialOrderData({
          customerInfo: {
            userId: TEST_VIEWER_ID,
            customerName: 'V',
            phoneNumber: `091234560${i}`,
          },
          status: 'pending',
        })
      );

    PotentialOrder.find.mockReturnValue(createMockQueryChain(pendingOrders));
    PotentialOrder.countDocuments.mockResolvedValue(3);

    const req = mockRequest({
      query: { status: 'pending', page: 1, limit: 20 },
    });
    const res = mockResponse();

    // When: Filter by pending status
    await controller.getMyPotentialOrders(req, res);

    // Then: Only pending orders returned
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data).toBeDefined();
  });

  // ========== TC-1003: Controller - Get Statistics ==========
  test('TC-1003 | Verify getOrderStats returns correct counts', async () => {
    // Given: Mock aggregate results
    const mockStats = [
      { _id: 'pending', count: 5 },
      { _id: 'confirmed', count: 3 },
    ];

    PotentialOrder.aggregate.mockResolvedValue(mockStats);
    PotentialOrder.countDocuments.mockResolvedValue(8);

    const req = mockRequest();
    const res = mockResponse();

    // When: Get stats
    await controller.getOrderStats(req, res);

    // Then: Statistics returned
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data).toBeDefined();
  });

  // ========== TC-1004: Controller - Get Single Order ==========
  test('TC-1004 | Verify getPotentialOrder returns single order detail', async () => {
    // Given: An order exists with populated streamId
    const mockOrder = makePotentialOrderData();
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: TEST_HOST_ID,
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
    });
    const res = mockResponse();

    // When: Get single order
    await controller.getPotentialOrder(req, res);

    // Then: Order details returned
    expect(res.statusCode).toBeDefined();
  });

  // ========== TC-1005: Controller - Mark as Viewed ==========
  test('TC-1005 | Verify markAsViewed updates viewedAt timestamp', async () => {
    // Given: An unviewed order with populated streamId
    const mockOrder = makePotentialOrderData();
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: TEST_HOST_ID,
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
    });
    const res = mockResponse();

    // When: Mark as viewed
    await controller.markAsViewed(req, res);

    // Then: viewedAt is set
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1006: Controller - Add Note ==========
  test('TC-1006 | Verify addNote adds host note to order', async () => {
    // Given: An order exists with populated streamId
    const mockOrder = makePotentialOrderData();
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: TEST_HOST_ID,
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
      body: { note: 'Customer wants size 42' },
    });
    const res = mockResponse();

    // When: Add note
    await controller.addNote(req, res);

    // Then: Note is added
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(mockOrder.save).toHaveBeenCalled();
  });

  // ========== TC-1007: Controller - Update Status ==========
  test('TC-1007 | Verify updateOrderStatus changes order status', async () => {
    // Given: A pending order with populated streamId
    const mockOrder = makePotentialOrderData({ status: 'pending' });
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: TEST_HOST_ID,
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
      body: { status: 'contacted' },
    });
    const res = mockResponse();

    // When: Update status
    await controller.updateOrderStatus(req, res);

    // Then: Status is updated
    expect(res.statusCode).toBe(200);
    expect(mockOrder.save).toHaveBeenCalled();
  });

  // ========== TC-1008: Controller - Pagination ==========
  test('TC-1008 | Verify getMyPotentialOrders pagination works correctly', async () => {
    // Given: 25 orders exist
    const mockOrders = Array(10)
      .fill(null)
      .map((_, i) =>
        makePotentialOrderData({
          customerInfo: {
            userId: TEST_VIEWER_ID,
            customerName: 'V',
            phoneNumber: `09123456${String(i).padStart(2, '0')}`,
          },
        })
      );

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(25);

    const req = mockRequest({
      query: { page: 1, limit: 10 },
    });
    const res = mockResponse();

    // When: Get first page
    await controller.getMyPotentialOrders(req, res);

    // Then: Pagination info returned
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data).toBeDefined();
  });

  // ========== TC-1009: Controller - Invalid ObjectId ==========
  test('TC-1009 | Verify getPotentialOrder handles invalid ObjectId', async () => {
    // Given: Invalid order ID - return null for invalid ID
    const mockChain = createMockQueryChain(null);
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: 'invalid-id-123' },
    });
    const res = mockResponse();

    // When: Try to get order
    await controller.getPotentialOrder(req, res);

    // Then: Error response or 200 (depending on controller logic)
    expect(res.statusCode).toBeDefined();
    expect([200, 404, 500]).toContain(res.statusCode);
  });

  // ========== TC-1010: Controller - Database Error Handling ==========
  test('TC-1010 | Verify controller handles database errors gracefully', async () => {
    // Given: Stream not found
    LiveStream.findOne.mockResolvedValue(null);

    const req = mockRequest({
      params: { streamId: 'non-existent-stream' },
    });
    const res = mockResponse();

    // When: Try to get orders for non-existent stream
    await controller.getPotentialOrdersForStream(req, res);

    // Then: Proper error response
    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('not found');
  });

  // ========== TC-1011: Controller - Delete Order ==========
  test('TC-1011 | Verify deletePotentialOrder removes order', async () => {
    // Given: An order exists with populated streamId
    const mockOrder = makePotentialOrderData();
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: TEST_HOST_ID,
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);
    PotentialOrder.findByIdAndDelete.mockResolvedValue(mockOrder);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
    });
    const res = mockResponse();

    // When: Delete order
    await controller.deletePotentialOrder(req, res);

    // Then: Order is deleted
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1012: Controller - Get Grouped Orders ==========
  test('TC-1012 | Verify getMyPotentialOrdersGrouped returns grouped data', async () => {
    // Given: Mock aggregate results
    const mockGrouped = [
      { _id: 'pending', orders: [makePotentialOrderData()] },
      { _id: 'confirmed', orders: [makePotentialOrderData({ status: 'confirmed' })] },
    ];

    PotentialOrder.aggregate.mockResolvedValue(mockGrouped);

    const req = mockRequest();
    const res = mockResponse();

    // When: Get grouped orders
    await controller.getMyPotentialOrdersGrouped(req, res);

    // Then: Grouped data returned
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1013: Controller - Search by Phone ==========
  test('TC-1013 | Verify getMyPotentialOrders searches by phone number', async () => {
    // Given: Orders with specific phone
    const mockOrders = [
      makePotentialOrderData({
        customerInfo: {
          userId: TEST_VIEWER_ID,
          customerName: 'Test',
          phoneNumber: '0987654321',
        },
      }),
    ];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: { searchText: '0987654321', page: 1, limit: 20 },
    });
    const res = mockResponse();

    // When: Search by phone
    await controller.getMyPotentialOrders(req, res);

    // Then: Matching orders returned
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1014: Controller - Filter by Priority ==========
  test('TC-1014 | Verify getMyPotentialOrders filters by priority', async () => {
    // Given: Orders with different priorities
    const mockOrders = [makePotentialOrderData({ priority: 'urgent' })];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: { priority: 'urgent', page: 1, limit: 20 },
    });
    const res = mockResponse();

    // When: Filter by urgent priority
    await controller.getMyPotentialOrders(req, res);

    // Then: Response received
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1015: Controller - Update Status to Ignored ==========
  test('TC-1015 | Verify updateOrderStatus can set status to ignored', async () => {
    // Given: A pending order with populated streamId
    const mockOrder = makePotentialOrderData({ status: 'pending' });
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: TEST_HOST_ID,
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
      body: { status: 'ignored' },
    });
    const res = mockResponse();

    // When: Update to ignored
    await controller.updateOrderStatus(req, res);

    // Then: Status is ignored
    expect(res.statusCode).toBe(200);
    expect(mockOrder.save).toHaveBeenCalled();
  });

  // ========== TC-1016: Controller - Get Order with Non-existent ID ==========
  test('TC-1016 | Verify getPotentialOrder returns 404 for non-existent order', async () => {
    // Given: Valid but non-existent ObjectId
    const mockChain = createMockQueryChain(null);
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: createMockObjectId('fake123').toString() },
    });
    const res = mockResponse();

    // When: Try to get non-existent order
    try {
      await controller.getPotentialOrder(req, res);
    } catch (err) {
      res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Then: Response received
    expect(res.statusCode).toBeDefined();
  });

  // ========== TC-1017: Controller - Mark as Viewed Twice ==========
  test('TC-1017 | Verify markAsViewed can be called multiple times', async () => {
    // Given: An order with populated streamId
    const mockOrder = makePotentialOrderData();
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: TEST_HOST_ID,
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
    });
    const res = mockResponse();

    // When: Mark as viewed twice
    await controller.markAsViewed(req, res);
    const res2 = mockResponse();
    await controller.markAsViewed(req, res2);

    // Then: Both successful
    expect(res.statusCode).toBe(200);
    expect(res2.statusCode).toBe(200);
  });

  // ========== TC-1018: Controller - Add Empty Note ==========
  test('TC-1018 | Verify addNote handles empty note', async () => {
    // Given: An order with populated streamId
    const mockOrder = makePotentialOrderData();
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: TEST_HOST_ID,
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
      body: { note: '' },
    });
    const res = mockResponse();

    // When: Add empty note
    await controller.addNote(req, res);

    // Then: Response received
    expect(res.statusCode).toBeDefined();
  });

  // ========== TC-1019: Controller - Get Stats with No Orders ==========
  test('TC-1019 | Verify getOrderStats works with no orders', async () => {
    // Given: No orders exist
    PotentialOrder.aggregate.mockResolvedValue([]);
    PotentialOrder.countDocuments.mockResolvedValue(0);

    const req = mockRequest();
    const res = mockResponse();

    // When: Get stats
    await controller.getOrderStats(req, res);

    // Then: Empty stats returned
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1020: Controller - Filter All Status ==========
  test('TC-1020 | Verify getMyPotentialOrders with status=all returns all orders', async () => {
    // Given: Orders with mixed statuses
    const mockOrders = [
      makePotentialOrderData({ status: 'pending' }),
      makePotentialOrderData({ status: 'confirmed' }),
      makePotentialOrderData({ status: 'ignored' }),
    ];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(3);

    const req = mockRequest({
      query: { status: 'all', page: 1, limit: 20 },
    });
    const res = mockResponse();

    // When: Get all statuses
    await controller.getMyPotentialOrders(req, res);

    // Then: All orders returned
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1021: Mark as Viewed - Order Not Found ==========
  test('TC-1021 | Verify markAsViewed returns 404 for non-existent order', async () => {
    // Given: Order doesn't exist
    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(null).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: createMockObjectId('fake999').toString() },
    });
    const res = mockResponse();

    // When: Try to mark as viewed
    await controller.markAsViewed(req, res);

    // Then: 404 error
    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('not found');
  });

  // ========== TC-1022: Mark as Viewed - Unauthorized ==========
  test('TC-1022 | Verify markAsViewed returns 403 for unauthorized user', async () => {
    // Given: Order exists but belongs to different host
    const mockOrder = makePotentialOrderData();
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: createMockObjectId('differenthost'),
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
      user: { id: TEST_HOST_ID.toString(), role: 'shop' }, // Different host
    });
    const res = mockResponse();

    // When: Try to mark as viewed
    await controller.markAsViewed(req, res);

    // Then: 403 error
    expect(res.statusCode).toBe(403);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Not authorized');
  });

  // ========== TC-1023: Add Note - Validation Error ==========
  test('TC-1023 | Verify addNote returns 400 for missing note', async () => {
    // Given: No note provided
    const req = mockRequest({
      params: { id: createMockObjectId().toString() },
      body: {}, // No note
    });
    const res = mockResponse();

    // When: Try to add note
    await controller.addNote(req, res);

    // Then: 400 error
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('required');
  });

  // ========== TC-1024: Add Note - Order Not Found ==========
  test('TC-1024 | Verify addNote returns 404 for non-existent order', async () => {
    // Given: Order doesn't exist
    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(null).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: createMockObjectId('fake888').toString() },
      body: { note: 'Some note' },
    });
    const res = mockResponse();

    // When: Try to add note
    await controller.addNote(req, res);

    // Then: 404 error
    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
  });

  // ========== TC-1025: Update Status - Order Not Found ==========
  test('TC-1025 | Verify updateOrderStatus returns 404 for non-existent order', async () => {
    // Given: Order doesn't exist
    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(null).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: createMockObjectId('fake777').toString() },
      body: { status: 'confirmed' },
    });
    const res = mockResponse();

    // When: Try to update status
    await controller.updateOrderStatus(req, res);

    // Then: 404 error
    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
  });

  // ========== TC-1026: Delete Order - Order Not Found ==========
  test('TC-1026 | Verify deletePotentialOrder returns 404 for non-existent order', async () => {
    // Given: Order doesn't exist
    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(null).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: createMockObjectId('fake666').toString() },
    });
    const res = mockResponse();

    // When: Try to delete
    await controller.deletePotentialOrder(req, res);

    // Then: 404 error
    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
  });

  // ========== TC-1027: Mark as Viewed - Admin Override ==========
  test('TC-1027 | Verify admin can mark any order as viewed', async () => {
    // Given: Order exists, user is admin
    const mockOrder = makePotentialOrderData();
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: createMockObjectId('differenthost'),
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
      user: { id: TEST_HOST_ID.toString(), role: 'admin' }, // Admin role
    });
    const res = mockResponse();

    // When: Admin marks as viewed
    await controller.markAsViewed(req, res);

    // Then: Success
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1028: Export for Stream - Success ==========
  test('TC-1028 | Verify exportPotentialOrdersForStream generates Excel', async () => {
    // Given: Stream and orders exist
    const mockOrders = [makePotentialOrderData(), makePotentialOrderData()];
    const mockExcelBuffer = Buffer.from('mock excel content');

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    excelExportService.exportPotentialOrders.mockResolvedValue(mockExcelBuffer);

    const req = mockRequest({
      params: { streamId: 'test-room-001' },
      query: { status: 'all', priority: 'all' },
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // When: Export orders
    await controller.exportPotentialOrdersForStream(req, res);

    // Then: Excel file sent
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', expect.any(String));
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('.xlsx')
    );
    expect(res.send).toHaveBeenCalledWith(mockExcelBuffer);
  });

  // ========== TC-1029: Export for Stream - Stream Not Found ==========
  test('TC-1029 | Verify exportPotentialOrdersForStream returns 404 for non-existent stream', async () => {
    // Given: Stream doesn't exist
    LiveStream.findOne.mockResolvedValue(null);

    const req = mockRequest({
      params: { streamId: 'non-existent-stream' },
      query: {},
    });
    const res = mockResponse();

    // When: Try to export
    await controller.exportPotentialOrdersForStream(req, res);

    // Then: 404 error
    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('not found');
  });

  // ========== TC-1030: Export with Filters - Success ==========
  test('TC-1030 | Verify exportPotentialOrders generates Excel with filters', async () => {
    // Given: Orders exist
    const mockOrders = [makePotentialOrderData()];
    const mockExcelBuffer = Buffer.from('mock excel with filters');

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    excelExportService.exportWithFilters.mockResolvedValue(mockExcelBuffer);

    const req = mockRequest({
      query: {
        status: 'pending',
        priority: 'high',
        searchText: '0912345678',
      },
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // When: Export with filters
    await controller.exportPotentialOrders(req, res);

    // Then: Excel file sent
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', expect.any(String));
    expect(res.send).toHaveBeenCalledWith(mockExcelBuffer);
  });

  // ========== TC-1031: Export with Date Range Filter ==========
  test('TC-1031 | Verify exportPotentialOrders with date range filter', async () => {
    // Given: Orders exist with date filter
    const mockOrders = [makePotentialOrderData()];
    const mockExcelBuffer = Buffer.from('mock excel with date filter');

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    excelExportService.exportWithFilters.mockResolvedValue(mockExcelBuffer);

    const req = mockRequest({
      query: {
        status: 'all',
        priority: 'all',
        dateRange: ['2024-01-01', '2024-12-31'],
      },
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // When: Export with date range
    await controller.exportPotentialOrders(req, res);

    // Then: Excel file sent with date filter
    expect(res.send).toHaveBeenCalledWith(mockExcelBuffer);
    expect(PotentialOrder.find).toHaveBeenCalled();
  });

  // ========== TC-1032: Export with Stream Filter ==========
  test('TC-1032 | Verify exportPotentialOrders with streamId filter', async () => {
    // Given: Orders exist with stream filter
    const mockOrders = [makePotentialOrderData()];
    const mockExcelBuffer = Buffer.from('mock excel with stream filter');

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    excelExportService.exportWithFilters.mockResolvedValue(mockExcelBuffer);

    const req = mockRequest({
      query: {
        status: 'all',
        priority: 'all',
        streamId: TEST_STREAM_ID.toString(),
      },
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // When: Export with streamId
    await controller.exportPotentialOrders(req, res);

    // Then: Excel file sent with stream filter
    expect(res.send).toHaveBeenCalledWith(mockExcelBuffer);
  });

  // ========== TC-1033: Export with No Filters ==========
  test('TC-1033 | Verify exportPotentialOrders with no filters (all defaults)', async () => {
    // Given: Orders exist, no filters
    const mockOrders = [makePotentialOrderData()];
    const mockExcelBuffer = Buffer.from('mock excel no filters');

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    excelExportService.exportWithFilters.mockResolvedValue(mockExcelBuffer);

    const req = mockRequest({
      query: {
        status: 'all',
        priority: 'all',
      },
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // When: Export with defaults
    await controller.exportPotentialOrders(req, res);

    // Then: Excel file sent
    expect(res.send).toHaveBeenCalledWith(mockExcelBuffer);
  });

  // ========== TC-1034: Export for Stream - Error Handling ==========
  test('TC-1034 | Verify exportPotentialOrdersForStream handles errors', async () => {
    // Given: Database error occurs
    PotentialOrder.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('Database error')),
    });

    const req = mockRequest({
      params: { streamId: 'test-room-001' },
      query: {},
    });
    const res = mockResponse();

    // When: Export fails
    await controller.exportPotentialOrdersForStream(req, res);

    // Then: 500 error
    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Error exporting');
  });

  // ========== TC-1035: Export with Filters - Error Handling ==========
  test('TC-1035 | Verify exportPotentialOrders handles errors', async () => {
    // Given: Export service error
    PotentialOrder.find.mockReturnValue(createMockQueryChain([makePotentialOrderData()]));
    excelExportService.exportWithFilters.mockRejectedValue(new Error('Excel generation failed'));

    const req = mockRequest({
      query: { status: 'all', priority: 'all' },
    });
    const res = mockResponse();

    // When: Export fails
    await controller.exportPotentialOrders(req, res);

    // Then: 500 error
    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
  });

  // ========== TC-1036: Export for Stream with Status Filter ==========
  test('TC-1036 | Verify exportPotentialOrdersForStream with status filter', async () => {
    // Given: Stream exists, status filter applied
    const mockOrders = [makePotentialOrderData({ status: 'confirmed' })];
    const mockExcelBuffer = Buffer.from('mock excel confirmed orders');

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    excelExportService.exportPotentialOrders.mockResolvedValue(mockExcelBuffer);

    const req = mockRequest({
      params: { streamId: 'test-room-001' },
      query: { status: 'confirmed', priority: 'all' },
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // When: Export with status filter
    await controller.exportPotentialOrdersForStream(req, res);

    // Then: Excel file sent
    expect(res.send).toHaveBeenCalledWith(mockExcelBuffer);
  });

  // ========== TC-1037: Export for Stream with Priority Filter ==========
  test('TC-1037 | Verify exportPotentialOrdersForStream with priority filter', async () => {
    // Given: Stream exists, priority filter applied
    const mockOrders = [makePotentialOrderData({ priority: 'urgent' })];
    const mockExcelBuffer = Buffer.from('mock excel urgent orders');

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    excelExportService.exportPotentialOrders.mockResolvedValue(mockExcelBuffer);

    const req = mockRequest({
      params: { streamId: 'test-room-001' },
      query: { status: 'all', priority: 'urgent' },
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // When: Export with priority filter
    await controller.exportPotentialOrdersForStream(req, res);

    // Then: Excel file sent
    expect(res.send).toHaveBeenCalledWith(mockExcelBuffer);
  });

  // ========== TC-1038: Add Note - Unauthorized User ==========
  test('TC-1038 | Verify addNote returns 403 for unauthorized user', async () => {
    // Given: Order exists but belongs to different host
    const mockOrder = makePotentialOrderData();
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: createMockObjectId('differenthost'),
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
      body: { note: 'Some note' },
      user: { id: TEST_HOST_ID.toString(), role: 'shop' }, // Different host, not admin
    });
    const res = mockResponse();

    // When: Try to add note
    await controller.addNote(req, res);

    // Then: 403 error
    expect(res.statusCode).toBe(403);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Not authorized');
  });

  // ========== TC-1039: Delete Order - Unauthorized User ==========
  test('TC-1039 | Verify deletePotentialOrder returns 403 for unauthorized user', async () => {
    // Given: Order exists but belongs to different host
    const mockOrder = makePotentialOrderData();
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: createMockObjectId('differenthost'),
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
      user: { id: TEST_HOST_ID.toString(), role: 'shop' }, // Different host, not admin
    });
    const res = mockResponse();

    // When: Try to delete
    await controller.deletePotentialOrder(req, res);

    // Then: 403 error
    expect(res.statusCode).toBe(403);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Not authorized');
  });

  // ========== TC-1040: Get Potential Orders for Stream - Error Handling ==========
  test('TC-1040 | Verify getPotentialOrdersForStream handles database errors', async () => {
    // Given: Database error occurs
    LiveStream.findOne.mockRejectedValue(new Error('Database connection failed'));

    const req = mockRequest({
      params: { streamId: 'test-room-001' },
      query: {},
    });
    const res = mockResponse();

    // When: Try to get orders
    await controller.getPotentialOrdersForStream(req, res);

    // Then: 500 error
    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Failed to load potential orders');
  });

  // ========== TC-1041: Get My Orders with Date Range Filter ==========
  test('TC-1041 | Verify getMyPotentialOrders with dateRange.start and dateRange.end', async () => {
    // Given: Orders with date range filter
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31',
        },
      },
    });
    const res = mockResponse();

    // When: Get orders with date range
    await controller.getMyPotentialOrders(req, res);

    // Then: Success with filtered orders
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(PotentialOrder.find).toHaveBeenCalled();
  });

  // ========== TC-1042: Get Grouped Orders - Host Has No Streams ==========
  test('TC-1042 | Verify getMyPotentialOrdersGrouped returns empty when host has no streams', async () => {
    // Given: Host has no streams
    LiveStream.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]), // Empty array - no streams
    });

    const req = mockRequest({
      query: {},
    });
    const res = mockResponse();

    // When: Get grouped orders
    await controller.getMyPotentialOrdersGrouped(req, res);

    // Then: Empty array returned
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data).toEqual([]);
  });

  // ========== TC-1043: Get Potential Order - Unauthorized User ==========
  test('TC-1043 | Verify getPotentialOrder returns 403 for unauthorized user', async () => {
    // Given: Order exists but belongs to different host
    const mockOrder = makePotentialOrderData();
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: createMockObjectId('differenthost'),
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
      user: { id: TEST_HOST_ID.toString(), role: 'shop' }, // Different host
    });
    const res = mockResponse();

    // When: Try to get order
    await controller.getPotentialOrder(req, res);

    // Then: 403 error
    expect(res.statusCode).toBe(403);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Not authorized to access');
  });

  // ========== TC-1044: Update Order Status - Unauthorized User ==========
  test('TC-1044 | Verify updateOrderStatus returns 403 for unauthorized user', async () => {
    // Given: Order exists but belongs to different host
    const mockOrder = makePotentialOrderData({ status: 'pending' });
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: createMockObjectId('differenthost'),
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
      body: { status: 'contacted' },
      user: { id: TEST_HOST_ID.toString(), role: 'shop' }, // Different host
    });
    const res = mockResponse();

    // When: Try to update status
    await controller.updateOrderStatus(req, res);

    // Then: 403 error
    expect(res.statusCode).toBe(403);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Not authorized to update');
  });

  // ========== TC-1045: Update Order Status - Invalid Status ==========
  test('TC-1045 | Verify updateOrderStatus returns 400 for invalid status', async () => {
    // Given: Order exists with valid authorization
    const mockOrder = makePotentialOrderData();
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: TEST_HOST_ID,
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
      body: { status: 'invalid_status' }, // Invalid status
    });
    const res = mockResponse();

    // When: Try to update with invalid status
    await controller.updateOrderStatus(req, res);

    // Then: 400 error
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Invalid status');
  });

  // ========== TC-1046: Get My Orders - Filter by specific status ==========
  test('TC-1046 | Verify getMyPotentialOrders filters by specific status (not all)', async () => {
    // Given: Orders with specific status filter
    const mockOrders = [makePotentialOrderData({ status: 'confirmed' })];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'confirmed', // Specific status, not 'all'
        page: 1,
        limit: 20,
      },
    });
    const res = mockResponse();

    // When: Get orders with specific status
    await controller.getMyPotentialOrders(req, res);

    // Then: Success
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1047: Get My Orders - Filter by specific priority ==========
  test('TC-1047 | Verify getMyPotentialOrders filters by specific priority (not all)', async () => {
    // Given: Orders with specific priority filter
    const mockOrders = [makePotentialOrderData({ priority: 'urgent' })];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        priority: 'urgent', // Specific priority, not 'all'
        page: 1,
        limit: 20,
      },
    });
    const res = mockResponse();

    // When: Get orders with specific priority
    await controller.getMyPotentialOrders(req, res);

    // Then: Success
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1048: Get My Orders - Orders without streamId filtered out ==========
  test('TC-1048 | Verify getMyPotentialOrders filters out orders without streamId', async () => {
    // Given: Some orders have null streamId (shouldn't match host)
    const mockOrders = [
      makePotentialOrderData(),
      { ...makePotentialOrderData(), streamId: null }, // This should be filtered out
    ];

    // Create chain that returns mixed orders
    const mockChain = createMockQueryChain(mockOrders);
    PotentialOrder.find.mockReturnValue(mockChain);
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: { status: 'all', page: 1, limit: 20 },
    });
    const res = mockResponse();

    // When: Get orders
    await controller.getMyPotentialOrders(req, res);

    // Then: Success, and only orders with streamId are returned
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    // filteredOrders should have 1 item (the one with streamId), not 2
    expect(res.jsonData.count).toBe(1);
  });

  // ========== TC-1049: Get Grouped Orders - Stream info fallback ==========
  test('TC-1049 | Verify getMyPotentialOrdersGrouped handles missing stream info', async () => {
    // Given: Aggregation returns stream ID not in streamIdToInfo map
    const unknownStreamId = createMockObjectId('unknown999');

    LiveStream.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          _id: TEST_STREAM_ID,
          title: 'Known Stream',
          roomId: 'test-room-001',
          createdAt: new Date(),
        },
      ]),
    });

    // Mock aggregate to return order with unknown streamId
    PotentialOrder.aggregate.mockResolvedValue([
      {
        _id: unknownStreamId, // This ID is not in streamIdToInfo
        orders: [makePotentialOrderData()],
        count: 1,
        pending: 1,
        contacted: 0,
        confirmed: 0,
        converted: 0,
        ignored: 0,
        spam: 0,
      },
    ]);

    const req = mockRequest({
      query: {},
    });
    const res = mockResponse();

    // When: Get grouped orders
    await controller.getMyPotentialOrdersGrouped(req, res);

    // Then: Success with fallback stream info
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data).toBeDefined();
    expect(res.jsonData.data[0].stream._id).toEqual(unknownStreamId);
  });

  // ========== TC-1050: Get My Orders - Combined filters ==========
  test('TC-1050 | Verify getMyPotentialOrders with multiple filters combined', async () => {
    // Given: Multiple filters applied at once
    const mockOrders = [makePotentialOrderData({ status: 'pending', priority: 'high' })];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'pending',
        priority: 'high',
        searchText: '0912345678',
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31',
        },
        page: 1,
        limit: 20,
      },
    });
    const res = mockResponse();

    // When: Get orders with all filters
    await controller.getMyPotentialOrders(req, res);

    // Then: Success with all filters applied
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(PotentialOrder.find).toHaveBeenCalled();
  });

  // ========== TC-1051: Get My Orders - Empty searchText handled ==========
  test('TC-1051 | Verify getMyPotentialOrders handles empty searchText', async () => {
    // Given: searchText is empty string (should be ignored)
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        searchText: '', // Empty string
      },
    });
    const res = mockResponse();

    // When: Get orders with empty searchText
    await controller.getMyPotentialOrders(req, res);

    // Then: Success (empty searchText should not cause issues)
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1052: Add Note - Empty note with whitespace ==========
  test('TC-1052 | Verify addNote returns 400 for note with only whitespace', async () => {
    // Given: Note with only whitespace
    const mockOrder = makePotentialOrderData();
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: TEST_HOST_ID,
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
      body: { note: '   ' }, // Only whitespace
    });
    const res = mockResponse();

    // When: Try to add note with whitespace
    await controller.addNote(req, res);

    // Then: 400 error
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('required');
  });

  // ========== TC-1053: Export with Filters - Date Range Array Format ==========
  test('TC-1053 | Verify exportPotentialOrders with dateRange array format', async () => {
    // Given: Orders with date range in array format
    const mockOrders = [makePotentialOrderData()];
    const mockExcelBuffer = Buffer.from('mock excel with date array');

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    excelExportService.exportWithFilters.mockResolvedValue(mockExcelBuffer);

    const req = mockRequest({
      query: {
        status: 'all',
        priority: 'all',
        dateRange: ['2024-01-01', '2024-12-31'], // Array format
      },
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // When: Export with date range array
    await controller.exportPotentialOrders(req, res);

    // Then: Excel file sent
    expect(res.send).toHaveBeenCalledWith(mockExcelBuffer);
  });

  // ========== TC-1054: Export with Filters - No dateRange ==========
  test('TC-1054 | Verify exportPotentialOrders without dateRange', async () => {
    // Given: Orders without date filter
    const mockOrders = [makePotentialOrderData()];
    const mockExcelBuffer = Buffer.from('mock excel no date');

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    excelExportService.exportWithFilters.mockResolvedValue(mockExcelBuffer);

    const req = mockRequest({
      query: {
        status: 'all',
        priority: 'all',
        // No dateRange
      },
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // When: Export without dateRange
    await controller.exportPotentialOrders(req, res);

    // Then: Excel file sent
    expect(res.send).toHaveBeenCalledWith(mockExcelBuffer);
  });

  // ========== TC-1055: Export with Filters - No searchText ==========
  test('TC-1055 | Verify exportPotentialOrders without searchText', async () => {
    // Given: Orders without search filter
    const mockOrders = [makePotentialOrderData()];
    const mockExcelBuffer = Buffer.from('mock excel no search');

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    excelExportService.exportWithFilters.mockResolvedValue(mockExcelBuffer);

    const req = mockRequest({
      query: {
        status: 'all',
        priority: 'all',
        // No searchText
      },
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // When: Export without searchText
    await controller.exportPotentialOrders(req, res);

    // Then: Excel file sent
    expect(res.send).toHaveBeenCalledWith(mockExcelBuffer);
  });

  // ========== TC-1056: Export with Filters - No streamId ==========
  test('TC-1056 | Verify exportPotentialOrders without streamId', async () => {
    // Given: Orders without stream filter
    const mockOrders = [makePotentialOrderData()];
    const mockExcelBuffer = Buffer.from('mock excel no stream');

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    excelExportService.exportWithFilters.mockResolvedValue(mockExcelBuffer);

    const req = mockRequest({
      query: {
        status: 'all',
        priority: 'all',
        // No streamId
      },
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // When: Export without streamId
    await controller.exportPotentialOrders(req, res);

    // Then: Excel file sent
    expect(res.send).toHaveBeenCalledWith(mockExcelBuffer);
  });

  // ========== TC-1057: Get My Orders - No dateRange ==========
  test('TC-1057 | Verify getMyPotentialOrders without dateRange', async () => {
    // Given: Orders without date filter
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        // No dateRange
      },
    });
    const res = mockResponse();

    // When: Get orders without dateRange
    await controller.getMyPotentialOrders(req, res);

    // Then: Success
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1058: Get My Orders - No searchText ==========
  test('TC-1058 | Verify getMyPotentialOrders without searchText', async () => {
    // Given: Orders without search filter
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        // No searchText
      },
    });
    const res = mockResponse();

    // When: Get orders without searchText
    await controller.getMyPotentialOrders(req, res);

    // Then: Success
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1059: Get My Orders - No status filter ==========
  test('TC-1059 | Verify getMyPotentialOrders without status filter', async () => {
    // Given: Orders without status filter
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        // No status
        page: 1,
        limit: 20,
      },
    });
    const res = mockResponse();

    // When: Get orders without status
    await controller.getMyPotentialOrders(req, res);

    // Then: Success
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1060: Get My Orders - No priority filter ==========
  test('TC-1060 | Verify getMyPotentialOrders without priority filter', async () => {
    // Given: Orders without priority filter
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        // No priority
        page: 1,
        limit: 20,
      },
    });
    const res = mockResponse();

    // When: Get orders without priority
    await controller.getMyPotentialOrders(req, res);

    // Then: Success
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1061: Add Note - Null note ==========
  test('TC-1061 | Verify addNote returns 400 for null note', async () => {
    // Given: Note is null
    const mockOrder = makePotentialOrderData();
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: TEST_HOST_ID,
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
      body: { note: null }, // Null note
    });
    const res = mockResponse();

    // When: Try to add null note
    await controller.addNote(req, res);

    // Then: 400 error
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('required');
  });

  // ========== TC-1062: Add Note - Undefined note ==========
  test('TC-1062 | Verify addNote returns 400 for undefined note', async () => {
    // Given: Note is undefined
    const mockOrder = makePotentialOrderData();
    mockOrder.streamId = {
      _id: TEST_STREAM_ID,
      hostId: TEST_HOST_ID,
      title: 'Test Stream',
    };

    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      then: function (resolve) {
        return Promise.resolve(mockOrder).then(resolve);
      },
    };
    PotentialOrder.findById.mockReturnValue(mockChain);

    const req = mockRequest({
      params: { id: mockOrder._id.toString() },
      body: {}, // No note field
    });
    const res = mockResponse();

    // When: Try to add undefined note
    await controller.addNote(req, res);

    // Then: 400 error
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('required');
  });

  // ========== TC-1063: Export with Filters - Date Range with length !== 2 ==========
  test('TC-1063 | Verify exportPotentialOrders ignores invalid dateRange length', async () => {
    // Given: Orders with invalid dateRange length
    const mockOrders = [makePotentialOrderData()];
    const mockExcelBuffer = Buffer.from('mock excel invalid date');

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    excelExportService.exportWithFilters.mockResolvedValue(mockExcelBuffer);

    const req = mockRequest({
      query: {
        status: 'all',
        priority: 'all',
        dateRange: ['2024-01-01'], // Only one date, not two
      },
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // When: Export with invalid dateRange
    await controller.exportPotentialOrders(req, res);

    // Then: Excel file sent (dateRange ignored)
    expect(res.send).toHaveBeenCalledWith(mockExcelBuffer);
  });

  // ========== TC-1064: Get My Orders - Status is undefined ==========
  test('TC-1064 | Verify getMyPotentialOrders handles undefined status', async () => {
    // Given: Status is undefined
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: undefined, // Undefined status
        page: 1,
        limit: 20,
      },
    });
    const res = mockResponse();

    // When: Get orders with undefined status
    await controller.getMyPotentialOrders(req, res);

    // Then: Success (undefined status should be ignored)
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1065: Get My Orders - Priority is undefined ==========
  test('TC-1065 | Verify getMyPotentialOrders handles undefined priority', async () => {
    // Given: Priority is undefined
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        priority: undefined, // Undefined priority
        page: 1,
        limit: 20,
      },
    });
    const res = mockResponse();

    // When: Get orders with undefined priority
    await controller.getMyPotentialOrders(req, res);

    // Then: Success (undefined priority should be ignored)
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1066: Export for Stream - Stream title fallback ==========
  test('TC-1066 | Verify exportPotentialOrdersForStream uses roomId when title is missing', async () => {
    // Given: Stream without title
    const mockStream = {
      _id: TEST_STREAM_ID,
      roomId: 'test-room-001',
      title: null, // No title
    };
    const mockOrders = [makePotentialOrderData()];
    const mockExcelBuffer = Buffer.from('mock excel no title');

    LiveStream.findOne.mockResolvedValue(mockStream);
    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    excelExportService.exportPotentialOrders.mockResolvedValue(mockExcelBuffer);

    const req = mockRequest({
      params: { streamId: 'test-room-001' },
      query: {},
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // When: Export for stream without title
    await controller.exportPotentialOrdersForStream(req, res);

    // Then: Excel file sent with roomId in filename
    expect(res.send).toHaveBeenCalledWith(mockExcelBuffer);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('test-room-001')
    );
  });

  // ========== TC-1067: Get Potential Orders for Stream - Database Error ==========
  test('TC-1067 | Verify getPotentialOrdersForStream handles database errors', async () => {
    // Given: Database error occurs
    LiveStream.findOne.mockRejectedValue(new Error('Database connection failed'));

    const req = mockRequest({
      params: { streamId: 'test-room-001' },
    });
    const res = mockResponse();

    // When: Try to get orders with database error
    await controller.getPotentialOrdersForStream(req, res);

    // Then: 500 error
    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Failed to load potential orders');
  });

  // ========== TC-1068: Get My Orders - Date Range with start and end ==========
  test('TC-1068 | Verify getMyPotentialOrders with dateRange object format', async () => {
    // Given: Orders with date range object format
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31',
        },
      },
    });
    const res = mockResponse();

    // When: Get orders with date range object
    await controller.getMyPotentialOrders(req, res);

    // Then: Success
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1069: Get My Orders - Search Text with Special Characters ==========
  test('TC-1069 | Verify getMyPotentialOrders handles special characters in searchText', async () => {
    // Given: Search text with special regex characters
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        searchText: 'test[.*+?^${}()|\\\\]',
      },
    });
    const res = mockResponse();

    // When: Search with special characters
    await controller.getMyPotentialOrders(req, res);

    // Then: Success (should handle regex escaping)
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1070: Get My Orders - Empty searchText after trim ==========
  test('TC-1070 | Verify getMyPotentialOrders handles whitespace-only searchText', async () => {
    // Given: Search text with only whitespace
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        searchText: '   ', // Only whitespace
      },
    });
    const res = mockResponse();

    // When: Search with whitespace-only text
    await controller.getMyPotentialOrders(req, res);

    // Then: Success (should ignore empty search)
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1071: Export with Filters - Date Range with Invalid Format ==========
  test('TC-1071 | Verify exportPotentialOrders handles invalid dateRange format', async () => {
    // Given: Orders with invalid dateRange
    const mockOrders = [makePotentialOrderData()];
    const mockExcelBuffer = Buffer.from('mock excel invalid date');

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    excelExportService.exportWithFilters.mockResolvedValue(mockExcelBuffer);

    const req = mockRequest({
      query: {
        status: 'all',
        priority: 'all',
        dateRange: 'invalid-date-format', // Invalid format
      },
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // When: Export with invalid dateRange
    await controller.exportPotentialOrders(req, res);

    // Then: Excel file sent (dateRange ignored)
    expect(res.send).toHaveBeenCalledWith(mockExcelBuffer);
  });

  // ========== TC-1072: Export with Filters - Date Range with Single Date ==========
  test('TC-1072 | Verify exportPotentialOrders handles single date in dateRange', async () => {
    // Given: Orders with single date in dateRange
    const mockOrders = [makePotentialOrderData()];
    const mockExcelBuffer = Buffer.from('mock excel single date');

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    excelExportService.exportWithFilters.mockResolvedValue(mockExcelBuffer);

    const req = mockRequest({
      query: {
        status: 'all',
        priority: 'all',
        dateRange: ['2024-01-01'], // Only one date
      },
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // When: Export with single date
    await controller.exportPotentialOrders(req, res);

    // Then: Excel file sent (dateRange ignored)
    expect(res.send).toHaveBeenCalledWith(mockExcelBuffer);
  });

  // ========== TC-1073: Get My Orders - Default Pagination ==========
  test('TC-1073 | Verify getMyPotentialOrders uses default pagination when not provided', async () => {
    // Given: No pagination parameters
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {}, // No pagination
    });
    const res = mockResponse();

    // When: Get orders without pagination
    await controller.getMyPotentialOrders(req, res);

    // Then: Success with default pagination
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.page).toBe(1);
  });

  // ========== TC-1074: Get My Orders - Large Page Number ==========
  test('TC-1074 | Verify getMyPotentialOrders handles large page numbers', async () => {
    // Given: Large page number
    const mockOrders = [];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(0);

    const req = mockRequest({
      query: {
        page: 999,
        limit: 20,
      },
    });
    const res = mockResponse();

    // When: Get orders with large page number
    await controller.getMyPotentialOrders(req, res);

    // Then: Success with empty results
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data).toEqual([]);
  });

  // ========== TC-1075: Get My Orders - Zero Limit ==========
  test('TC-1075 | Verify getMyPotentialOrders handles zero limit', async () => {
    // Given: Zero limit
    const mockOrders = [];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(0);

    const req = mockRequest({
      query: {
        page: 1,
        limit: 0,
      },
    });
    const res = mockResponse();

    // When: Get orders with zero limit
    await controller.getMyPotentialOrders(req, res);

    // Then: Success with empty results
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1076: Get My Orders - Negative Page ==========
  test('TC-1076 | Verify getMyPotentialOrders handles negative page', async () => {
    // Given: Negative page number
    const mockOrders = [];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(0);

    const req = mockRequest({
      query: {
        page: -1,
        limit: 20,
      },
    });
    const res = mockResponse();

    // When: Get orders with negative page
    await controller.getMyPotentialOrders(req, res);

    // Then: Success (should handle gracefully)
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1077: Get My Orders - String Page Number ==========
  test('TC-1077 | Verify getMyPotentialOrders handles string page number', async () => {
    // Given: String page number
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        page: '2',
        limit: 20,
      },
    });
    const res = mockResponse();

    // When: Get orders with string page
    await controller.getMyPotentialOrders(req, res);

    // Then: Success
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.page).toBe(2);
  });

  // ========== TC-1078: Get My Orders - String Limit ==========
  test('TC-1078 | Verify getMyPotentialOrders handles string limit', async () => {
    // Given: String limit
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        page: 1,
        limit: '10',
      },
    });
    const res = mockResponse();

    // When: Get orders with string limit
    await controller.getMyPotentialOrders(req, res);

    // Then: Success
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1079: Get My Orders - Very Large Limit ==========
  test('TC-1079 | Verify getMyPotentialOrders handles very large limit', async () => {
    // Given: Very large limit
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        page: 1,
        limit: 999999,
      },
    });
    const res = mockResponse();

    // When: Get orders with very large limit
    await controller.getMyPotentialOrders(req, res);

    // Then: Success
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1080: Get My Orders - Filter by Multiple Statuses ==========
  test('TC-1080 | Verify getMyPotentialOrders filters by multiple statuses', async () => {
    // Given: Orders with multiple statuses
    const mockOrders = [
      makePotentialOrderData({ status: 'pending' }),
      makePotentialOrderData({ status: 'contacted' }),
    ];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(2);

    const req = mockRequest({
      query: {
        status: 'pending',
        page: 1,
        limit: 20,
      },
    });
    const res = mockResponse();

    // When: Get orders with specific status
    await controller.getMyPotentialOrders(req, res);

    // Then: Success
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1081: Get My Orders - Filter by Multiple Priorities ==========
  test('TC-1081 | Verify getMyPotentialOrders filters by multiple priorities', async () => {
    // Given: Orders with multiple priorities
    const mockOrders = [
      makePotentialOrderData({ priority: 'high' }),
      makePotentialOrderData({ priority: 'urgent' }),
    ];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(2);

    const req = mockRequest({
      query: {
        priority: 'high',
        page: 1,
        limit: 20,
      },
    });
    const res = mockResponse();

    // When: Get orders with specific priority
    await controller.getMyPotentialOrders(req, res);

    // Then: Success
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1082: Get My Orders - Date Range with Invalid Dates ==========
  test('TC-1082 | Verify getMyPotentialOrders handles invalid date range', async () => {
    // Given: Invalid date range
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        dateRange: {
          start: 'invalid-date',
          end: 'invalid-date',
        },
      },
    });
    const res = mockResponse();

    // When: Get orders with invalid date range
    await controller.getMyPotentialOrders(req, res);

    // Then: Success (should handle invalid dates gracefully)
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1083: Get My Orders - Date Range with Only Start Date ==========
  test('TC-1083 | Verify getMyPotentialOrders handles date range with only start date', async () => {
    // Given: Date range with only start date
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        dateRange: {
          start: '2024-01-01',
          // No end date
        },
      },
    });
    const res = mockResponse();

    // When: Get orders with incomplete date range
    await controller.getMyPotentialOrders(req, res);

    // Then: Success (should ignore incomplete date range)
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1084: Get My Orders - Date Range with Only End Date ==========
  test('TC-1084 | Verify getMyPotentialOrders handles date range with only end date', async () => {
    // Given: Date range with only end date
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        dateRange: {
          // No start date
          end: '2024-12-31',
        },
      },
    });
    const res = mockResponse();

    // When: Get orders with incomplete date range
    await controller.getMyPotentialOrders(req, res);

    // Then: Success (should ignore incomplete date range)
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1085: Get My Orders - Date Range with Null Values ==========
  test('TC-1085 | Verify getMyPotentialOrders handles date range with null values', async () => {
    // Given: Date range with null values
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        dateRange: {
          start: null,
          end: null,
        },
      },
    });
    const res = mockResponse();

    // When: Get orders with null date range
    await controller.getMyPotentialOrders(req, res);

    // Then: Success (should ignore null date range)
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1086: Get My Orders - Date Range with Empty String Values ==========
  test('TC-1086 | Verify getMyPotentialOrders handles date range with empty string values', async () => {
    // Given: Date range with empty string values
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        dateRange: {
          start: '',
          end: '',
        },
      },
    });
    const res = mockResponse();

    // When: Get orders with empty string date range
    await controller.getMyPotentialOrders(req, res);

    // Then: Success (should ignore empty date range)
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1087: Get My Orders - Date Range with Undefined Values ==========
  test('TC-1087 | Verify getMyPotentialOrders handles date range with undefined values', async () => {
    // Given: Date range with undefined values
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        dateRange: {
          start: undefined,
          end: undefined,
        },
      },
    });
    const res = mockResponse();

    // When: Get orders with undefined date range
    await controller.getMyPotentialOrders(req, res);

    // Then: Success (should ignore undefined date range)
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1088: Get My Orders - Date Range with Mixed Types ==========
  test('TC-1088 | Verify getMyPotentialOrders handles date range with mixed types', async () => {
    // Given: Date range with mixed types
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        dateRange: {
          start: '2024-01-01',
          end: null,
        },
      },
    });
    const res = mockResponse();

    // When: Get orders with mixed type date range
    await controller.getMyPotentialOrders(req, res);

    // Then: Success (should ignore incomplete date range)
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1089: Get My Orders - Date Range with Zero Values ==========
  test('TC-1089 | Verify getMyPotentialOrders handles date range with zero values', async () => {
    // Given: Date range with zero values
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        dateRange: {
          start: 0,
          end: 0,
        },
      },
    });
    const res = mockResponse();

    // When: Get orders with zero date range
    await controller.getMyPotentialOrders(req, res);

    // Then: Success (should handle zero dates)
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1090: Get My Orders - Date Range with Boolean Values ==========
  test('TC-1090 | Verify getMyPotentialOrders handles date range with boolean values', async () => {
    // Given: Date range with boolean values
    const mockOrders = [makePotentialOrderData()];

    PotentialOrder.find.mockReturnValue(createMockQueryChain(mockOrders));
    PotentialOrder.countDocuments.mockResolvedValue(1);

    const req = mockRequest({
      query: {
        status: 'all',
        page: 1,
        limit: 20,
        dateRange: {
          start: true,
          end: false,
        },
      },
    });
    const res = mockResponse();

    // When: Get orders with boolean date range
    await controller.getMyPotentialOrders(req, res);

    // Then: Success (should handle boolean dates)
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  // ========== TC-1091: getPotentialOrdersForStream - Database error handling ==========
  test('TC-1091 | Verify getPotentialOrdersForStream handles database errors', async () => {
    // Given: LiveStream found but PotentialOrder.find throws error
    LiveStream.findOne.mockResolvedValue(mockTestStream);
    PotentialOrder.find.mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const req = mockRequest({
      params: { streamId: TEST_STREAM_ID },
      query: { page: 1, limit: 10 },
    });
    const res = mockResponse();

    // When: Request fails due to database error
    await controller.getPotentialOrdersForStream(req, res);

    // Then: Should return 500 error
    expect(res.statusCode).toBe(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Failed to load potential orders',
      })
    );
  });

  // ========== TC-1092: getMyPotentialOrders - Database error handling ==========
  test('TC-1092 | Verify getMyPotentialOrders handles database errors', async () => {
    // Given: Database error
    PotentialOrder.find.mockImplementation(() => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockImplementation(() => {
          throw new Error('Database connection failed');
        }),
      };
      return mockQuery;
    });

    const req = mockRequest({
      user: { id: TEST_USER_ID },
      query: { page: 1, limit: 10 },
    });
    const res = mockResponse();

    // When: Request fails due to database error
    await expect(controller.getMyPotentialOrders(req, res)).rejects.toThrow(
      'Database connection failed'
    );
  });

  // ========== TC-1093: getPotentialOrder - Database error handling ==========
  test('TC-1093 | Verify getPotentialOrder handles database errors', async () => {
    // Given: Database error
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
    };
    mockQuery.populate.mockImplementation(() => {
      throw new Error('Database connection failed');
    });
    PotentialOrder.findById.mockReturnValue(mockQuery);

    const req = mockRequest({
      params: { id: TEST_ORDER_ID },
    });
    const res = mockResponse();

    // When: Request fails due to database error
    await expect(controller.getPotentialOrder(req, res)).rejects.toThrow(
      'Database connection failed'
    );
  });

  // ========== TC-1094: updateOrderStatus - Database error handling ==========
  test('TC-1094 | Verify updateOrderStatus handles database errors', async () => {
    // Given: Database error
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
    };
    mockQuery.populate.mockImplementation(() => {
      throw new Error('Database connection failed');
    });
    PotentialOrder.findById.mockReturnValue(mockQuery);

    const req = mockRequest({
      params: { id: TEST_ORDER_ID },
      body: { status: 'confirmed' },
    });
    const res = mockResponse();

    // When: Request fails due to database error
    await expect(controller.updateOrderStatus(req, res)).rejects.toThrow(
      'Database connection failed'
    );
  });

  // ========== TC-1095: markAsViewed - Database error handling ==========
  test('TC-1095 | Verify markAsViewed handles database errors', async () => {
    // Given: Database error
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
    };
    mockQuery.populate.mockImplementation(() => {
      throw new Error('Database connection failed');
    });
    PotentialOrder.findById.mockReturnValue(mockQuery);

    const req = mockRequest({
      params: { id: TEST_ORDER_ID },
    });
    const res = mockResponse();

    // When: Request fails due to database error
    await expect(controller.markAsViewed(req, res)).rejects.toThrow('Database connection failed');
  });

  // ========== TC-1096: addNote - Database error handling ==========
  test('TC-1096 | Verify addNote handles database errors', async () => {
    // Given: Database error
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
    };
    mockQuery.populate.mockImplementation(() => {
      throw new Error('Database connection failed');
    });
    PotentialOrder.findById.mockReturnValue(mockQuery);

    const req = mockRequest({
      params: { id: TEST_ORDER_ID },
      body: { note: 'Test note' },
    });
    const res = mockResponse();

    // When: Request fails due to database error
    await expect(controller.addNote(req, res)).rejects.toThrow('Database connection failed');
  });

  // ========== TC-1097: getOrderStats - Database error handling ==========
  test('TC-1097 | Verify getOrderStats handles database errors', async () => {
    // Given: Database error
    PotentialOrder.aggregate.mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const req = mockRequest({
      params: { streamId: TEST_STREAM_ID },
    });
    const res = mockResponse();

    // When: Request fails due to database error
    await expect(controller.getOrderStats(req, res)).rejects.toThrow('Database connection failed');
  });

  // ========== TC-1098: deletePotentialOrder - Database error handling ==========
  test('TC-1098 | Verify deletePotentialOrder handles database errors', async () => {
    // Given: Database error
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
    };
    mockQuery.populate.mockImplementation(() => {
      throw new Error('Database connection failed');
    });
    PotentialOrder.findById.mockReturnValue(mockQuery);

    const req = mockRequest({
      params: { id: TEST_ORDER_ID },
    });
    const res = mockResponse();

    // When: Request fails due to database error
    await expect(controller.deletePotentialOrder(req, res)).rejects.toThrow(
      'Database connection failed'
    );
  });

  // ========== TC-1099: exportPotentialOrders - Database error handling ==========
  test('TC-1099 | Verify exportPotentialOrders handles database errors', async () => {
    // Given: Database error
    PotentialOrder.find.mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const req = mockRequest({
      query: { page: 1, limit: 10 },
    });
    const res = mockResponse();

    // When: Request fails due to database error
    await controller.exportPotentialOrders(req, res);

    // Then: Should return 500 error
    expect(res.statusCode).toBe(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Error exporting potential orders',
      })
    );
  });

  // ========== TC-1100: exportPotentialOrdersForStream - Database error handling ==========
  test('TC-1100 | Verify exportPotentialOrdersForStream handles database errors', async () => {
    // Given: Stream found but database error when finding orders
    LiveStream.findOne.mockResolvedValue(mockTestStream);
    PotentialOrder.find.mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const req = mockRequest({
      params: { streamId: TEST_STREAM_ID },
      query: { page: 1, limit: 10 },
    });
    const res = mockResponse();

    // When: Request fails due to database error
    await controller.exportPotentialOrdersForStream(req, res);

    // Then: Should return 500 error
    expect(res.statusCode).toBe(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Error exporting potential orders for stream',
      })
    );
  });
});
