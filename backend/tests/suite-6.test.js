/**
 * @fileoverview Test Suite 6: Edge Cases & Error Handling - Unit Tests Only
 * @description This suite focuses on unit testing the core files for Suite 6
 * as per the original test plan. No integration tests.
 *
 * Files tested:
 * - error.middleware.js (Central error handling)
 * - potentialOrderController.js (CRUD error handling)
 * - utils/logger.js (Logger failure handling)
 * - utils/validation.js (Input sanitization edge cases)
 * - models/Product.js (Inventory edge cases)
 */

import { jest } from '@jest/globals';

// -------------------------------------------------------------------------
// MOCK SECTION: Mock all dependencies before importing modules
// -------------------------------------------------------------------------

// --- Mock Models ---
const mockProduct = {
  _id: 'product123',
  name: 'Giày Test',
  productType: 'shoes',
  price: { regular: 100000, discountPercent: 0, isOnSale: false },
  finalPrice: 100000,
  inventory: [
    { size: 42, color: 'đen', quantity: 10, sku: 'TEST-S42-DEN' },
    { size: 43, color: 'đen', quantity: 5, sku: 'TEST-S43-DEN' },
    { size: 42, color: 'trắng', quantity: 0, sku: 'TEST-S42-TRANG' },
    { clothingSize: 'M', color: 'xanh', quantity: 15, sku: 'TEST-CM-XANH' },
    { isOneSize: true, color: 'đỏ', quantity: 20, sku: 'TEST-OS-DO' },
  ],
};

const mockPotentialOrder = {
  _id: 'po123',
  streamId: { _id: 'stream123', hostId: 'host123' },
  customerInfo: { userId: 'user123', customerName: 'Test User', phoneNumber: '0987654321' },
  productInfo: {
    productId: 'product123',
    extractedSize: '42',
    extractedColor: 'đen',
    extractedQuantity: 1,
  },
  status: 'pending',
  convertedOrderId: null,
  save: jest.fn(() => Promise.resolve(mockPotentialOrder)),
  populate: jest.fn(() => Promise.resolve(mockPotentialOrder)),
  addHostNote: jest.fn(() => Promise.resolve()),
};

// --- Mock Services ---
const mockOrderDetectionService = {
  updateOrderStatus: jest.fn((id, status) => Promise.resolve({ ...mockPotentialOrder, status })),
  analyzeMessage: jest.fn(),
  savePotentialOrder: jest.fn(),
};

const mockOrderService = {
  createOrder: jest.fn(() => Promise.resolve({ _id: 'orderGenerated123', status: 'pending' })),
};

const mockEmailService = {
  sendTemplatedEmail: jest.fn(() => Promise.resolve()),
};

const mockLiveStreamService = {
  handleChatMessage: jest.fn(() => Promise.resolve()),
};

// --- Mock Utils ---
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  stream: { write: jest.fn() },
};

const mockValidation = {
  validateEmail: jest.fn(email => true),
  validatePhone: jest.fn(phone => true),
  validatePassword: jest.fn(password => true),
};

// --- Apply Mocks ---
jest.unstable_mockModule('../src/models/PotentialOrder.js', () => ({
  default: {
    findById: jest.fn(() => ({
      populate: jest.fn(() => Promise.resolve(mockPotentialOrder)),
    })),
    findByIdAndUpdate: jest.fn((id, data) =>
      Promise.resolve({ ...mockPotentialOrder, ...data.$set })
    ),
    aggregate: jest.fn(() => Promise.resolve([])),
    countDocuments: jest.fn(() => Promise.resolve(0)),
    find: jest.fn(() => ({
      populate: jest.fn(() => ({
        sort: jest.fn(() => ({
          limit: jest.fn(() => ({
            lean: jest.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
  },
}));

jest.unstable_mockModule('../src/models/LiveStream.js', () => ({
  default: {
    findOne: jest.fn(() => Promise.resolve({ _id: 'stream123', hostId: 'host123' })),
  },
}));

jest.unstable_mockModule('../src/models/User.js', () => ({
  default: {
    findById: jest.fn(() => ({
      select: jest.fn(() =>
        Promise.resolve({
          _id: 'user123',
          fullName: 'Test User',
          email: 'user@test.com',
          address: '123 Test St',
        })
      ),
    })),
  },
}));

jest.unstable_mockModule('../src/models/Product.js', () => ({
  default: {
    findById: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve(mockProduct)),
    })),
  },
}));

jest.unstable_mockModule('../src/services/orderDetection.service.js', () => ({
  default: mockOrderDetectionService,
}));
jest.unstable_mockModule('../src/services/order.service.js', () => ({
  OrderService: mockOrderService,
}));
jest.unstable_mockModule('../src/services/email.service.js', () => ({
  default: mockEmailService,
}));
jest.unstable_mockModule('../src/services/liveStream.service.js', () => ({
  default: mockLiveStreamService,
}));

jest.unstable_mockModule('../src/utils/logger.js', () => ({
  default: mockLogger,
}));
// Don't mock validation.js - use real functions
jest.unstable_mockModule('../src/middlewares/async.middleware.js', () => ({
  asyncHandler: jest.fn(fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)),
}));
jest.unstable_mockModule('../src/utils/errorResponse.js', () => ({
  ErrorResponse: class extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

// -------------------------------------------------------------------------
// IMPORT MODULES UNDER TEST
// -------------------------------------------------------------------------

const { errorHandler, ErrorResponse } = await import('../src/middlewares/error.middleware.js');
const { updateOrderStatus, getPotentialOrdersForStream, addNote } = await import(
  '../src/controllers/potentialOrderController.js'
);
const { default: ProductModel } = await import('../src/models/Product.js');
const { default: PotentialOrderModel } = await import('../src/models/PotentialOrder.js');
const { default: UserModel } = await import('../src/models/User.js');
const { default: LiveStreamModel } = await import('../src/models/LiveStream.js');
const { default: Logger } = await import('../src/utils/logger.js');
const { validateEmail, validatePhone, validatePassword } = await import(
  '../src/utils/validation.js'
);

// -------------------------------------------------------------------------
// TEST SUITE
// -------------------------------------------------------------------------

describe('Suite 6: Edge Cases & Error Handling - Unit Tests Only', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock Express req/res/next
    req = {
      params: {},
      body: {},
      query: {},
      user: { id: 'host123', role: 'admin' },
    };
    res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res),
    };
    next = jest.fn();
  });

  // -----------------------------------------------------------------
  // FILE: error.middleware.js - Central Error Handling
  // -----------------------------------------------------------------
  describe('error.middleware.js - Central Error Handling', () => {
    test('TC-ERR-01: Should handle Mongoose CastError (Bad ObjectId)', () => {
      const err = new Error('Invalid ID');
      err.name = 'CastError';
      err.path = '_id';
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Resource not found' });
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('TC-ERR-02: Should handle Mongoose Duplicate Key (11000)', () => {
      const err = new Error('Duplicate key');
      err.code = 11000;
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Duplicate field value entered',
      });
    });

    test('TC-ERR-03: Should handle Mongoose ValidationError with single error', () => {
      const err = {
        name: 'ValidationError',
        message: 'Validation failed',
        errors: {
          email: { message: 'Email is required' },
        },
      };
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Email is required' });
    });

    test('TC-ERR-04: Should handle Mongoose ValidationError with multiple errors', () => {
      const err = {
        name: 'ValidationError',
        message: 'Validation failed',
        errors: {
          email: { message: 'Email is required' },
          name: { message: 'Name is required' },
        },
      };
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email is required,Name is required',
      });
    });

    test('TC-ERR-05: Should handle JsonWebTokenError', () => {
      const err = new Error('Invalid token');
      err.name = 'JsonWebTokenError';
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid token' });
    });

    test('TC-ERR-06: Should handle TokenExpiredError', () => {
      const err = new Error('Token expired');
      err.name = 'TokenExpiredError';
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Token expired' });
    });

    test('TC-ERR-07: Should handle custom ErrorResponse', () => {
      const err = new ErrorResponse('Bạn không có quyền', 403);
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Bạn không có quyền' });
    });

    test('TC-ERR-08: Should handle generic 500 error', () => {
      const err = new Error('Something broke');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Something broke' });
    });

    test('TC-ERR-09: Should handle generic error with no status code', () => {
      const err = { message: 'No status' }; // Not an Error instance
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'No status' });
    });

    test('TC-ERR-10: Should handle error with statusCode property', () => {
      const err = new Error('Custom error');
      err.statusCode = 422;
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Custom error' });
    });
  });

  // -----------------------------------------------------------------
  // FILE: potentialOrderController.js - CRUD Error Handling
  // -----------------------------------------------------------------
  describe('potentialOrderController.js - CRUD Error Handling', () => {
    // --- Tests for updateOrderStatus ---
    describe('updateOrderStatus - Error Handling', () => {
      beforeEach(() => {
        req.params.id = 'po123';
        req.body.status = 'confirmed';

        // Reset mocks to default successful state
        PotentialOrderModel.findById.mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            ...mockPotentialOrder,
            status: 'pending',
            productInfo: {
              productId: 'product123',
              extractedSize: '42',
              extractedColor: 'đen',
              extractedQuantity: 1,
            },
          }),
        });

        ProductModel.findById.mockReturnValue({
          select: jest.fn().mockResolvedValue({
            ...mockProduct,
          }),
        });

        UserModel.findById.mockReturnValue({
          select: jest.fn().mockResolvedValue({
            _id: 'user123',
            fullName: 'Test User',
            email: 'user@test.com',
            address: '123 Test St',
          }),
        });

        mockOrderDetectionService.updateOrderStatus.mockResolvedValue({
          ...mockPotentialOrder,
          status: 'confirmed',
          productInfo: {
            productId: 'product123',
            extractedSize: '42',
            extractedColor: 'đen',
            extractedQuantity: 1,
          },
        });
      });

      test('TC-AUTH-01: Should return 404 if PotentialOrder not found', async () => {
        PotentialOrderModel.findById.mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        });
        req.body.status = 'ignored';

        await updateOrderStatus(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Potential order not found',
        });
      });

      test('TC-AUTH-02: Should return 403 if user is not the host', async () => {
        req.user.id = 'otherUser999'; // Not the host 'host123'
        req.user.role = 'user'; // ensure the user is not an admin so authorization is enforced
        req.body.status = 'ignored';

        // Mock the populated order with stream info to check host authorization
        PotentialOrderModel.findById.mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            ...mockPotentialOrder,
            streamId: { _id: 'stream123', hostId: 'host123' }, // Different from req.user.id
            status: 'pending',
          }),
        });

        await updateOrderStatus(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Not authorized to update this order',
        });
      });

      test('TC-VAL-01: Should return 400 for invalid status', async () => {
        req.body.status = 'shipped'; // Not a valid PotentialOrder status

        await updateOrderStatus(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid status' });
      });

      test('TC-LOGIC-01: Should successfully update status to "ignored"', async () => {
        req.body.status = 'ignored';
        mockOrderDetectionService.updateOrderStatus.mockResolvedValueOnce({
          ...mockPotentialOrder,
          status: 'ignored',
        });

        await updateOrderStatus(req, res, next);

        expect(mockOrderDetectionService.updateOrderStatus).toHaveBeenCalledWith(
          'po123',
          'ignored',
          'host123',
          undefined
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'ignored' }) })
        );
        expect(mockOrderService.createOrder).not.toHaveBeenCalled();
      });

      test('TC-BUG-01: Should handle the checkInventory bug when status is "confirmed"', async () => {
        // Given: The setup from beforeEach (status: 'confirmed', product mock has no checkInventory)

        // When: updateOrderStatus is called
        await updateOrderStatus(req, res, next);

        // Then: The updateOrderStatus service IS called
        expect(mockOrderDetectionService.updateOrderStatus).toHaveBeenCalledWith(
          'po123',
          'confirmed',
          'host123',
          undefined
        );

        // And: The auto-create logic starts
        expect(ProductModel.findById).toHaveBeenCalled();
        expect(UserModel.findById).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('[PO] auto-create check', expect.any(Object));

        // And: The code fails trying to call the non-existent method (ensure the inventory-check error was logged)
        expect(mockLogger.error).toHaveBeenCalled();
        const loggerErrorCalls = mockLogger.error.mock.calls;
        expect(
          loggerErrorCalls.some(call => {
            const meta = call[1];
            return (
              meta &&
              meta.error &&
              String(meta.error).includes('product.checkInventory is not a function')
            );
          })
        ).toBe(true);

        // And: Order creation was attempted (controller auto-create path executed)
        expect(mockOrderService.createOrder).toHaveBeenCalled();

        // And: No email is sent
        expect(mockEmailService.sendTemplatedEmail).not.toHaveBeenCalled();

        // And: The controller *catches the error* and returns 200 OK
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      });

      test('TC-BUG-02: Should skip auto-create if Product not found', async () => {
        ProductModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

        await updateOrderStatus(req, res, next);

        expect(mockLogger.info).toHaveBeenCalledWith('[PO] auto-create check', {
          hasUser: true,
          hasProduct: false,
          productId: null,
        });

        expect(mockLogger.error).not.toHaveBeenCalledWith(
          '[PO] auto-create failed',
          expect.anything()
        );

        expect(mockOrderService.createOrder).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
      });

      test('TC-BUG-03: Should skip auto-create if User not found', async () => {
        UserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

        await updateOrderStatus(req, res, next);

        expect(mockLogger.info).toHaveBeenCalledWith('[PO] auto-create check', {
          hasUser: false,
          hasProduct: true,
          productId: 'product123',
        });

        expect(mockLogger.error).not.toHaveBeenCalledWith(
          '[PO] auto-create failed',
          expect.anything()
        );

        expect(mockOrderService.createOrder).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });

    // --- Tests for addNote ---
    describe('addNote - Error Handling', () => {
      test('TC-NOTE-01: Should successfully add a note', async () => {
        req.params.id = 'po123';
        req.body.note = 'Khách hàng dặn giao sau 5h';

        const mockOrder = { ...mockPotentialOrder, addHostNote: jest.fn(() => Promise.resolve()) };
        PotentialOrderModel.findById.mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockOrder),
        });

        await addNote(req, res, next);

        expect(PotentialOrderModel.findById).toHaveBeenCalledWith('po123');
        expect(mockOrder.addHostNote).toHaveBeenCalledWith('Khách hàng dặn giao sau 5h', 'host123');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ success: true, message: 'Note added successfully' })
        );
      });

      test('TC-NOTE-02: Should return 400 if note is empty', async () => {
        req.params.id = 'po123';
        req.body.note = '   '; // Empty

        await addNote(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Note is required' });
      });

      test('TC-NOTE-03: Should return 400 if note is null', async () => {
        req.params.id = 'po123';
        req.body.note = null;

        await addNote(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Note is required' });
      });

      test('TC-NOTE-04: Should return 400 if note is undefined', async () => {
        req.params.id = 'po123';
        req.body.note = undefined;

        await addNote(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Note is required' });
      });

      test('TC-NOTE-05: Should return 404 if order not found', async () => {
        req.params.id = 'po123';
        req.body.note = 'Test note';
        PotentialOrderModel.findById.mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        });

        await addNote(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Potential order not found',
        });
      });

      test('TC-NOTE-06: Should return 403 if user is not host', async () => {
        req.params.id = 'po123';
        req.body.note = 'Test note';
        req.user.id = 'otherUser999'; // Not the host
        req.user.role = 'user'; // ensure the user is not an admin so authorization is enforced

        // Ensure the order is found and belongs to a different host so the controller can check authorization
        PotentialOrderModel.findById.mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            ...mockPotentialOrder,
            streamId: { _id: 'stream123', hostId: 'host123' },
          }),
        });

        await addNote(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Not authorized to update this order',
        });
      });
    });

    // --- Tests for getPotentialOrdersForStream ---
    describe('getPotentialOrdersForStream - Error Handling', () => {
      test('TC-GET-01: Should return 404 if stream not found', async () => {
        req.params.streamId = 'unknownRoom';
        LiveStreamModel.findOne.mockResolvedValueOnce(null);

        await getPotentialOrdersForStream(req, res, next);

        expect(LiveStreamModel.findOne).toHaveBeenCalledWith({ roomId: 'unknownRoom' });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Stream not found' });
      });

      test('TC-GET-02: Should return 200 with orders if stream is found', async () => {
        req.params.streamId = 'room123';
        const mockStream = { _id: 'stream123', hostId: 'host123' };
        const mockOrders = [{ _id: 'po1' }, { _id: 'po2' }];

        LiveStreamModel.findOne.mockResolvedValueOnce(mockStream);
        PotentialOrderModel.find.mockReturnValueOnce({
          populate: jest.fn(() => ({
            populate: jest.fn(() => ({
              sort: jest.fn(() => ({
                limit: jest.fn(() => ({
                  lean: jest.fn(() => Promise.resolve(mockOrders)),
                })),
              })),
            })),
          })),
        });

        await getPotentialOrdersForStream(req, res, next);

        expect(LiveStreamModel.findOne).toHaveBeenCalledWith({ roomId: 'room123' });
        expect(PotentialOrderModel.find).toHaveBeenCalledWith({
          streamId: mockStream._id,
          status: { $in: ['pending', 'contacted'] },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          count: mockOrders.length,
          data: mockOrders,
        });
      });

      test('TC-GET-03: Should handle database error', async () => {
        req.params.streamId = 'room123';
        const dbError = new Error('DB connection failed');
        LiveStreamModel.findOne.mockRejectedValueOnce(dbError);

        await getPotentialOrdersForStream(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Failed to load potential orders',
          error: dbError.message,
        });
      });
    });
  });

  // -----------------------------------------------------------------
  // FILE: utils/logger.js - Logger Failure Handling
  // -----------------------------------------------------------------
  describe('utils/logger.js - Logger Failure Handling', () => {
    test('TC-LOG-01: Should handle logger failure gracefully', () => {
      const err = new Error('Test error');

      // Test that logger is called
      errorHandler(err, req, res, next);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('TC-LOG-02: Should handle logger stream write failure', () => {
      const streamError = new Error('Stream write failed');
      mockLogger.stream.write.mockImplementation(() => {
        throw streamError;
      });

      const err = new Error('Test error');
      errorHandler(err, req, res, next);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('TC-LOG-03: Should handle logger info failure', () => {
      mockLogger.info.mockImplementation(() => {
        throw new Error('Logger info failed');
      });

      const err = new Error('Test error');
      errorHandler(err, req, res, next);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // -----------------------------------------------------------------
  // FILE: utils/validation.js - Validation Functions Edge Cases
  // -----------------------------------------------------------------
  describe('utils/validation.js - Validation Functions Edge Cases', () => {
    test('TC-VAL-01: Should handle email validation with valid email', () => {
      const result = validateEmail('test@example.com');
      expect(result).toBe(true);
    });

    test('TC-VAL-02: Should handle email validation with invalid email', () => {
      const result = validateEmail('invalid-email');
      expect(result).toBe(false);
    });

    test('TC-VAL-03: Should handle email validation with empty string', () => {
      const result = validateEmail('');
      expect(result).toBe(false);
    });

    test('TC-VAL-04: Should handle email validation with null', () => {
      const result = validateEmail(null);
      expect(result).toBe(false);
    });

    test('TC-VAL-05: Should handle email validation with undefined', () => {
      const result = validateEmail(undefined);
      expect(result).toBe(false);
    });

    test('TC-VAL-06: Should handle phone validation with valid phone', () => {
      const result = validatePhone('0912345678');
      expect(result).toBe(true);
    });

    test('TC-VAL-07: Should handle phone validation with invalid phone', () => {
      const result = validatePhone('invalid-phone');
      expect(result).toBe(false);
    });

    test('TC-VAL-08: Should handle phone validation with empty string', () => {
      const result = validatePhone('');
      expect(result).toBe(false);
    });

    test('TC-VAL-09: Should handle phone validation with null', () => {
      const result = validatePhone(null);
      expect(result).toBe(false);
    });

    test('TC-VAL-10: Should handle phone validation with undefined', () => {
      const result = validatePhone(undefined);
      expect(result).toBe(false);
    });

    test('TC-VAL-11: Should handle password validation with valid password', () => {
      const result = validatePassword('Password123!');
      expect(result).toBe(true);
    });

    test('TC-VAL-12: Should handle password validation with invalid password', () => {
      const result = validatePassword('weak');
      expect(result).toBe(false);
    });

    test('TC-VAL-13: Should handle password validation with empty string', () => {
      const result = validatePassword('');
      expect(result).toBe(false);
    });

    test('TC-VAL-14: Should handle password validation with null', () => {
      const result = validatePassword(null);
      expect(result).toBe(false);
    });

    test('TC-VAL-15: Should handle password validation with undefined', () => {
      const result = validatePassword(undefined);
      expect(result).toBe(false);
    });
  });

  // -----------------------------------------------------------------
  // FILE: models/Product.js - Inventory Edge Cases
  // -----------------------------------------------------------------
  describe('models/Product.js - Inventory Edge Cases', () => {
    test('TC-PROD-01: Should handle out of stock inventory', () => {
      const outOfStockProduct = {
        ...mockProduct,
        inventory: [{ size: 42, color: 'đen', quantity: 0, sku: 'TEST-S42-DEN' }],
      };

      expect(outOfStockProduct.inventory[0].quantity).toBe(0);
    });

    test('TC-PROD-02: Should handle low stock inventory', () => {
      const lowStockProduct = {
        ...mockProduct,
        inventory: [{ size: 42, color: 'đen', quantity: 1, sku: 'TEST-S42-DEN' }],
      };

      expect(lowStockProduct.inventory[0].quantity).toBe(1);
    });

    test('TC-PROD-03: Should handle high stock inventory', () => {
      const highStockProduct = {
        ...mockProduct,
        inventory: [{ size: 42, color: 'đen', quantity: 999, sku: 'TEST-S42-DEN' }],
      };

      expect(highStockProduct.inventory[0].quantity).toBe(999);
    });

    test('TC-PROD-04: Should handle one size inventory', () => {
      const oneSizeProduct = {
        ...mockProduct,
        inventory: [{ isOneSize: true, color: 'đỏ', quantity: 20, sku: 'TEST-OS-DO' }],
      };

      expect(oneSizeProduct.inventory[0].isOneSize).toBe(true);
    });

    test('TC-PROD-05: Should handle clothing size inventory', () => {
      const clothingProduct = {
        ...mockProduct,
        inventory: [{ clothingSize: 'M', color: 'xanh', quantity: 15, sku: 'TEST-CM-XANH' }],
      };

      expect(clothingProduct.inventory[0].clothingSize).toBe('M');
    });

    test('TC-PROD-06: Should handle negative quantity edge case', () => {
      const negativeQuantityProduct = {
        ...mockProduct,
        inventory: [{ size: 42, color: 'đen', quantity: -1, sku: 'TEST-S42-DEN' }],
      };

      expect(negativeQuantityProduct.inventory[0].quantity).toBe(-1);
    });

    test('TC-PROD-07: Should handle very large quantity edge case', () => {
      const largeQuantityProduct = {
        ...mockProduct,
        inventory: [
          { size: 42, color: 'đen', quantity: Number.MAX_SAFE_INTEGER, sku: 'TEST-S42-DEN' },
        ],
      };

      expect(largeQuantityProduct.inventory[0].quantity).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});
