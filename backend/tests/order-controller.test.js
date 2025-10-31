/**
 * @fileoverview Unit tests for Order Controller
 * @file orderController.test.js
 */

import { jest } from '@jest/globals';

// Mock dependencies
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockOrderService = {
  createOrder: jest.fn(),
  getOrders: jest.fn(),
  getOrderByOrderId: jest.fn(),
  getOrderByUserId: jest.fn(),
  updateOrder: jest.fn(),
  cancelOrder: jest.fn(),
  refundOrder: jest.fn(),
};

const mockEmailService = {
  sendOrderConfirmationEmail: jest.fn(),
  sendOrderStatusUpdateEmail: jest.fn(),
};

const mockRewardPointService = {
  createRewardPointsForOrder: jest.fn(),
  deductRewardPointsForOrder: jest.fn(),
  hasOrderEarnedRewardPoints: jest.fn(),
  create: jest.fn(),
};

// Mock VNPayService instance - tạo riêng để reuse
const mockVNPayInstance = {
  initialize: jest.fn().mockResolvedValue(undefined),
  refundPayment: jest.fn().mockResolvedValue({
    success: true,
    refundSuccess: true,
    data: { transactionNo: 'REFUND123', responseCode: '00' },
  }),
};

// Mock VNPayService constructor - return cùng 1 instance
const MockVNPayService = jest.fn(() => mockVNPayInstance);

const mockUser = {
  findById: jest.fn(),
};

const mockOrder = {
  findById: jest.fn(),
};

const mockProduct = {
  findByIdAndUpdate: jest.fn(),
};

// Mock modules
jest.unstable_mockModule('../src/utils/logger.js', () => ({ default: mockLogger }));
jest.unstable_mockModule('../src/services/order.service.js', () => ({
  OrderService: mockOrderService,
}));
jest.unstable_mockModule('../src/services/email.service.js', () => ({
  default: mockEmailService,
}));
jest.unstable_mockModule('../src/services/rewardPoint.service.js', () => mockRewardPointService);
jest.unstable_mockModule('../src/services/vnpay.service.js', () => ({
  default: MockVNPayService,
}));
jest.unstable_mockModule('../src/models/User.js', () => ({ default: mockUser }));
jest.unstable_mockModule('../src/models/Order.js', () => ({ default: mockOrder }));
jest.unstable_mockModule('../src/models/Product.js', () => ({ default: mockProduct }));

// Import controller
const {
  createOrder,
  getOrders,
  getOrderById,
  getMyOrders,
  getOrdersByUserId,
  updateOrder,
  cancelOrder,
  refundOrder,
  updateOrderStatus,
} = await import('../src/controllers/orderController.js');

describe('Order Controller - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { _id: 'user123', id: 'user123' },
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    // Reset mock implementations
    mockVNPayInstance.initialize.mockResolvedValue(undefined);
    mockVNPayInstance.refundPayment.mockResolvedValue({
      success: true,
      refundSuccess: true,
      data: { transactionNo: 'REFUND123', responseCode: '00' },
    });
  });

  describe('OC-001 | createOrder', () => {
    test('should create order successfully', async () => {
      const orderData = {
        products: [{ id: 'prod123', quantity: 2, price: 100 }],
        totalAmount: 200,
        paymentMethod: 'vnpay',
        shippingAddress: '123 Test Street, Test City',
      };

      const createdOrder = {
        _id: 'order123',
        ...orderData,
        user: 'user123',
      };

      req.body = orderData;
      mockOrderService.createOrder.mockResolvedValue(createdOrder);
      mockUser.findById.mockResolvedValue({
        _id: 'user123',
        email: 'test@example.com',
      });

      const createOrderHandler = Array.isArray(createOrder)
        ? createOrder[createOrder.length - 1]
        : createOrder;
      await createOrderHandler(req, res, next);

      expect(mockOrderService.createOrder).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: createdOrder,
      });
    });

    test('should handle discount validation error', async () => {
      req.body = {
        products: [{ id: 'prod123', quantity: 1, price: 100 }],
        totalAmount: 100,
        paymentMethod: 'vnpay',
        shippingAddress: '123 Test St',
        discountCode: 'INVALID',
      };

      mockOrderService.createOrder.mockRejectedValue(new Error('Invalid discount code: INVALID'));

      const createOrderHandler = Array.isArray(createOrder)
        ? createOrder[createOrder.length - 1]
        : createOrder;
      await createOrderHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid discount code: INVALID',
      });
    });

    test('should handle email service error gracefully', async () => {
      const orderData = {
        products: [{ id: 'prod123', quantity: 2, price: 100 }],
        totalAmount: 200,
        paymentMethod: 'vnpay',
        shippingAddress: '123 Test Street, Test City',
      };

      const createdOrder = {
        _id: 'order123',
        ...orderData,
        user: 'user123',
      };

      req.body = orderData;
      mockOrderService.createOrder.mockResolvedValue(createdOrder);
      mockUser.findById.mockRejectedValue(new Error('User not found'));

      const createOrderHandler = Array.isArray(createOrder)
        ? createOrder[createOrder.length - 1]
        : createOrder;
      await createOrderHandler(req, res, next);

      expect(mockOrderService.createOrder).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error sending order confirmation email'),
        expect.any(Error)
      );
    });

    test('should handle general createOrder errors', async () => {
      req.body = {
        products: [{ id: 'prod123', quantity: 1, price: 100 }],
        totalAmount: 100,
        paymentMethod: 'vnpay',
        shippingAddress: '123 Test St',
      };

      mockOrderService.createOrder.mockRejectedValue(new Error('Stock insufficient'));

      const createOrderHandler = Array.isArray(createOrder)
        ? createOrder[createOrder.length - 1]
        : createOrder;
      await createOrderHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Stock insufficient',
      });
    });
  });

  describe('OC-002 | getOrders', () => {
    test('should get paginated orders', async () => {
      const orders = {
        orders: [{ _id: 'order1' }, { _id: 'order2' }],
        pagination: { page: 1, limit: 10, total: 2, pages: 1 },
      };

      req.query = { page: '1', limit: '10' };
      mockOrderService.getOrders.mockResolvedValue(orders);

      await getOrders(req, res, next);

      expect(mockOrderService.getOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: undefined,
        startDate: undefined,
        endDate: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: orders,
      });
    });

    test('should get orders with filters', async () => {
      const orders = {
        orders: [{ _id: 'order1', status: 'pending' }],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      };

      req.query = {
        page: '1',
        limit: '10',
        status: 'pending',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      mockOrderService.getOrders.mockResolvedValue(orders);

      await getOrders(req, res, next);

      expect(mockOrderService.getOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: 'pending',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle no orders found', async () => {
      mockOrderService.getOrders.mockResolvedValue(null);

      await getOrders(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No orders found',
      });
    });

    test('should handle getOrders errors', async () => {
      req.query = { page: '1', limit: '10' };
      mockOrderService.getOrders.mockRejectedValue(new Error('Database error'));

      await getOrders(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('OC-003 | getOrderById', () => {
    test('should get order by ID successfully', async () => {
      const order = { _id: 'order123', totalPrice: 200 };
      req.params.id = 'order123';
      mockOrderService.getOrderByOrderId.mockResolvedValue(order);

      await getOrderById(req, res, next);

      expect(mockOrderService.getOrderByOrderId).toHaveBeenCalledWith('order123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: order,
      });
    });

    test('should handle missing order ID', async () => {
      req.params.id = '';

      await getOrderById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Order ID is required',
      });
    });

    test('should handle order not found', async () => {
      req.params.id = 'nonexistent';
      mockOrderService.getOrderByOrderId.mockResolvedValue(null);

      await getOrderById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Order not found',
      });
    });
  });

  describe('OC-004 | getMyOrders', () => {
    test('should get current user orders', async () => {
      const result = {
        orders: [{ _id: 'order1' }],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      };

      mockOrderService.getOrderByUserId.mockResolvedValue(result);

      await getMyOrders(req, res, next);

      expect(mockOrderService.getOrderByUserId).toHaveBeenCalledWith('user123', {
        page: 1,
        limit: 10,
        status: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
      });
    });

    test('should get current user orders with status filter', async () => {
      const result = {
        orders: [{ _id: 'order1', status: 'pending' }],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      };

      req.query = { page: '2', limit: '5', status: 'pending' };
      mockOrderService.getOrderByUserId.mockResolvedValue(result);

      await getMyOrders(req, res, next);

      expect(mockOrderService.getOrderByUserId).toHaveBeenCalledWith('user123', {
        page: 2,
        limit: 5,
        status: 'pending',
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle no orders found for current user', async () => {
      mockOrderService.getOrderByUserId.mockResolvedValue(null);

      await getMyOrders(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No orders found',
      });
    });

    test('should handle getMyOrders errors', async () => {
      mockOrderService.getOrderByUserId.mockRejectedValue(new Error('Database error'));

      await getMyOrders(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('OC-005 | cancelOrder', () => {
    test('should cancel pending order successfully', async () => {
      const order = {
        _id: 'order123',
        status: 'pending',
        paymentMethod: 'cash_on_delivery',
        totalPrice: 200,
        user: 'user123',
      };

      req.params.id = 'order123';
      req.body.reason = 'Customer request';

      mockOrderService.getOrderByOrderId.mockResolvedValue(order);
      mockOrderService.cancelOrder.mockResolvedValue({
        ...order,
        status: 'cancelled',
        populate: jest.fn().mockResolvedValue({
          ...order,
          user: { fullName: 'Test User', email: 'test@example.com' },
        }),
      });
      mockRewardPointService.deductRewardPointsForOrder.mockResolvedValue(undefined);

      await cancelOrder(req, res, next);

      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith('order123', 'Customer request');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('cancelled successfully'),
        })
      );
    });

    test('should cancel VNPay paid order with refund', async () => {
      const order = {
        _id: 'order123',
        status: 'pending',
        paymentMethod: 'vnpay',
        paymentStatus: 'paid',
        totalPrice: 200,
        vnpTxnRef: 'TXN123',
        vnpPayDate: '20240101120000',
        vnpTransactionNo: 'TRANS123',
        user: 'user123',
      };

      req.params.id = 'order123';
      req.body.reason = 'Customer request';
      req.ip = '127.0.0.1';

      mockOrderService.getOrderByOrderId.mockResolvedValue(order);
      mockOrderService.updateOrder.mockResolvedValue({
        ...order,
        paymentStatus: 'refunded',
        status: 'refunded',
      });
      mockOrderService.cancelOrder.mockResolvedValue({
        ...order,
        status: 'cancelled',
        populate: jest.fn().mockResolvedValue({
          ...order,
          user: { fullName: 'Test User', email: 'test@example.com' },
        }),
      });
      mockRewardPointService.deductRewardPointsForOrder.mockResolvedValue(undefined);

      await cancelOrder(req, res, next);

      expect(mockVNPayInstance.initialize).toHaveBeenCalled();
      expect(mockVNPayInstance.refundPayment).toHaveBeenCalled();
      expect(mockOrderService.updateOrder).toHaveBeenCalled();
      expect(mockOrderService.cancelOrder).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle VNPay refund failure', async () => {
      const order = {
        _id: 'order123',
        status: 'pending',
        paymentMethod: 'vnpay',
        paymentStatus: 'paid',
        totalPrice: 200,
        vnpTxnRef: 'TXN123',
        vnpPayDate: '20240101120000',
        vnpTransactionNo: 'TRANS123',
      };

      req.params.id = 'order123';
      req.body.reason = 'Customer request';

      mockOrderService.getOrderByOrderId.mockResolvedValue(order);
      mockVNPayInstance.refundPayment.mockResolvedValue({
        success: false,
        refundSuccess: false,
        message: 'Refund failed',
      });

      await cancelOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('VNPay refund failed'),
      });
    });

    test('should reject cancel for delivered order', async () => {
      const order = {
        _id: 'order123',
        status: 'delivered',
        paymentMethod: 'vnpay',
      };

      req.params.id = 'order123';
      mockOrderService.getOrderByOrderId.mockResolvedValue(order);

      await cancelOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Can only cancel pending or processing orders',
      });
    });

    test('should handle missing order ID', async () => {
      req.params.id = '';

      await cancelOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Order ID is required',
      });
    });

    test('should handle order not found', async () => {
      req.params.id = 'nonexistent';
      mockOrderService.getOrderByOrderId.mockResolvedValue(null);

      await cancelOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Order not found',
      });
    });

    test('should handle cancelOrder service errors', async () => {
      const order = {
        _id: 'order123',
        status: 'pending',
        paymentMethod: 'cash_on_delivery',
      };

      req.params.id = 'order123';
      req.body.reason = 'Test';
      mockOrderService.getOrderByOrderId.mockResolvedValue(order);
      mockOrderService.cancelOrder.mockRejectedValue(new Error('Cancel failed'));

      await cancelOrder(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('should handle email service error gracefully', async () => {
      const order = {
        _id: 'order123',
        status: 'pending',
        paymentMethod: 'cash_on_delivery',
        totalPrice: 200,
        user: 'user123',
        populate: jest.fn().mockRejectedValue(new Error('Email error')),
      };

      req.params.id = 'order123';
      req.body.reason = 'Customer request';

      mockOrderService.getOrderByOrderId.mockResolvedValue(order);
      mockOrderService.cancelOrder.mockResolvedValue(order);
      mockRewardPointService.deductRewardPointsForOrder.mockResolvedValue(undefined);

      await cancelOrder(req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error sending order cancellation email'),
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('OC-006 | refundOrder', () => {
    test('should reject refund for ineligible order', async () => {
      const order = {
        _id: 'order123',
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'cash_on_delivery',
      };

      req.params.id = 'order123';
      req.body = { reason: 'Test', amount: 100 };

      mockOrderService.getOrderByOrderId.mockResolvedValue(order);

      await refundOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not eligible for refund'),
        })
      );
    });

    test('should validate refund amount', async () => {
      const order = {
        _id: 'order123',
        status: 'delivered',
        paymentStatus: 'paid',
        totalPrice: 200,
        updatedAt: new Date(),
      };

      req.params.id = 'order123';
      req.body = { reason: 'Test', amount: 300 }; // Exceeds total

      mockOrderService.getOrderByOrderId.mockResolvedValue(order);

      await refundOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Refund amount cannot exceed order total',
      });
    });
  });

  describe('OC-007 | updateOrderStatus', () => {
    test('should update order status successfully', async () => {
      const order = {
        _id: 'order123',
        status: 'pending',
        populate: jest.fn().mockResolvedValue({
          _id: 'order123',
          status: 'processing',
          user: { fullName: 'Test User', email: 'test@example.com' },
        }),
      };

      req.params.id = 'order123';
      req.body.status = 'processing';

      mockOrderService.updateOrder.mockResolvedValue(order);
      mockRewardPointService.hasOrderEarnedRewardPoints.mockResolvedValue(false);

      await updateOrderStatus(req, res, next);

      expect(mockOrderService.updateOrder).toHaveBeenCalledWith('order123', {
        status: 'processing',
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should create reward points when status is delivered', async () => {
      const order = {
        _id: 'order123',
        user: 'user123',
        status: 'delivered',
        totalPrice: 200,
        items: [{ product: 'prod123', quantity: 2 }],
        populate: jest.fn().mockResolvedValue({
          _id: 'order123',
          user: { fullName: 'Test User', email: 'test@example.com' },
        }),
      };

      req.params.id = 'order123';
      req.body.status = 'delivered';

      mockOrderService.updateOrder.mockResolvedValue(order);
      mockRewardPointService.hasOrderEarnedRewardPoints.mockResolvedValue(false);
      mockOrder.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(order),
        }),
      });
      mockRewardPointService.createRewardPointsForOrder.mockResolvedValue({
        points: 20,
      });
      mockProduct.findByIdAndUpdate.mockResolvedValue(true);

      await updateOrderStatus(req, res, next);

      expect(mockRewardPointService.createRewardPointsForOrder).toHaveBeenCalled();
      expect(mockProduct.findByIdAndUpdate).toHaveBeenCalled();
    });

    test('should reject invalid status', async () => {
      req.params.id = 'order123';
      req.body.status = 'invalid_status';

      await updateOrderStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid status value',
      });
    });
  });

  describe('OC-008 | updateOrder', () => {
    test('should update order successfully', async () => {
      const updatedOrder = {
        _id: 'order123',
        trackingNumber: 'TRACK123',
      };

      req.params.id = 'order123';
      req.body = { trackingNumber: 'TRACK123' };

      mockOrderService.updateOrder.mockResolvedValue(updatedOrder);

      const updateOrderHandler = Array.isArray(updateOrder)
        ? updateOrder[updateOrder.length - 1]
        : updateOrder;
      await updateOrderHandler(req, res, next);

      expect(mockOrderService.updateOrder).toHaveBeenCalledWith('order123', {
        trackingNumber: 'TRACK123',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedOrder,
      });
    });

    test('should handle order not found in updateOrder', async () => {
      req.params.id = 'order123';
      req.body = { trackingNumber: 'TRACK123' };

      mockOrderService.updateOrder.mockResolvedValue(null);

      const updateOrderHandler = Array.isArray(updateOrder)
        ? updateOrder[updateOrder.length - 1]
        : updateOrder;
      await updateOrderHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Order not found',
      });
    });

    test('should handle missing order ID in updateOrder', async () => {
      req.params.id = '';
      req.body = { trackingNumber: 'TRACK123' };

      const updateOrderHandler = Array.isArray(updateOrder)
        ? updateOrder[updateOrder.length - 1]
        : updateOrder;
      await updateOrderHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Order ID is required',
      });
    });

    test('should handle updateOrder errors', async () => {
      req.params.id = 'order123';
      req.body = { trackingNumber: 'TRACK123' };

      mockOrderService.updateOrder.mockRejectedValue(new Error('Update failed'));

      const updateOrderHandler = Array.isArray(updateOrder)
        ? updateOrder[updateOrder.length - 1]
        : updateOrder;
      await updateOrderHandler(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('OC-009 | getOrdersByUserId', () => {
    test('should get orders by user ID', async () => {
      const result = {
        orders: [{ _id: 'order1' }],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      };

      req.params.userId = 'user456';
      mockOrderService.getOrderByUserId.mockResolvedValue(result);

      await getOrdersByUserId(req, res, next);

      expect(mockOrderService.getOrderByUserId).toHaveBeenCalledWith('user456', {
        page: 1,
        limit: 10,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
      });
    });

    test('should handle missing userId', async () => {
      req.params.userId = '';

      await getOrdersByUserId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User ID is required',
      });
    });

    test('should handle no orders found', async () => {
      req.params.userId = 'user456';
      mockOrderService.getOrderByUserId.mockResolvedValue(null);

      await getOrdersByUserId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No orders found for this user',
      });
    });

    test('should handle getOrdersByUserId errors', async () => {
      req.params.userId = 'user456';
      mockOrderService.getOrderByUserId.mockRejectedValue(new Error('Database error'));

      await getOrdersByUserId(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('OC-006 | refundOrder - Extended Tests', () => {
    test('should handle missing order ID', async () => {
      req.params.id = '';
      req.body = { reason: 'Test', amount: 100 };

      await refundOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Order ID is required',
      });
    });

    test('should handle missing refund reason', async () => {
      req.params.id = 'order123';
      req.body = { amount: 100 };

      const order = {
        _id: 'order123',
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'vnpay',
        totalPrice: 200,
        updatedAt: new Date(),
      };

      mockOrderService.getOrderByOrderId.mockResolvedValue(order);

      await refundOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Refund reason is required',
      });
    });

    test('should handle invalid refund amount', async () => {
      req.params.id = 'order123';
      req.body = { reason: 'Test', amount: 0 };

      const order = {
        _id: 'order123',
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'vnpay',
        totalPrice: 200,
        updatedAt: new Date(),
      };

      mockOrderService.getOrderByOrderId.mockResolvedValue(order);

      await refundOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Valid refund amount is required',
      });
    });

    test('should process VNPay refund successfully', async () => {
      const order = {
        _id: 'order123',
        status: 'cancelled',
        paymentMethod: 'vnpay',
        paymentStatus: 'paid',
        totalPrice: 200,
        vnpTxnRef: 'TXN123',
        vnpPayDate: '20240101120000',
        vnpTransactionNo: 'TRANS123',
        user: 'user123',
        populate: jest.fn().mockResolvedValue({
          _id: 'order123',
          user: { fullName: 'Test User', email: 'test@example.com' },
        }),
      };

      req.params.id = 'order123';
      req.body = { reason: 'Customer request', amount: 200 };
      req.ip = '127.0.0.1';

      mockOrderService.getOrderByOrderId.mockResolvedValue(order);
      mockOrderService.updateOrder.mockResolvedValue({
        ...order,
        status: 'refunded',
        paymentStatus: 'refunded',
      });
      mockRewardPointService.deductRewardPointsForOrder.mockResolvedValue(undefined);

      await refundOrder(req, res, next);

      expect(mockVNPayInstance.initialize).toHaveBeenCalled();
      expect(mockVNPayInstance.refundPayment).toHaveBeenCalled();
      expect(mockOrderService.updateOrder).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should process COD refund with reward points', async () => {
      const order = {
        _id: 'order123',
        status: 'delivered',
        paymentMethod: 'cash_on_delivery',
        paymentStatus: 'paid',
        totalPrice: 200,
        user: 'user123',
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        populate: jest.fn().mockResolvedValue({
          _id: 'order123',
          user: { fullName: 'Test User', email: 'test@example.com' },
        }),
      };

      req.params.id = 'order123';
      req.body = { reason: 'Customer request', amount: 100 };

      mockOrderService.getOrderByOrderId.mockResolvedValue(order);
      mockOrderService.updateOrder.mockResolvedValue({
        ...order,
        status: 'refunded',
      });
      mockRewardPointService.create.mockResolvedValue({
        points: 100,
      });
      mockRewardPointService.deductRewardPointsForOrder.mockResolvedValue(undefined);

      await refundOrder(req, res, next);

      expect(mockRewardPointService.create).toHaveBeenCalled();
      expect(mockOrderService.updateOrder).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle refundOrder errors', async () => {
      const order = {
        _id: 'order123',
        status: 'delivered',
        paymentMethod: 'vnpay',
        paymentStatus: 'paid',
        totalPrice: 200,
        updatedAt: new Date(),
      };

      req.params.id = 'order123';
      req.body = { reason: 'Test', amount: 100 };

      mockOrderService.getOrderByOrderId.mockResolvedValue(order);
      mockVNPayInstance.refundPayment.mockRejectedValue(new Error('Refund error'));

      await refundOrder(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('OC-007 | updateOrderStatus - Extended Tests', () => {
    test('should handle missing order ID', async () => {
      req.params.id = '';
      req.body.status = 'processing';

      await updateOrderStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Order ID is required',
      });
    });

    test('should handle missing status', async () => {
      req.params.id = 'order123';
      req.body = {};

      await updateOrderStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Status is required',
      });
    });

    test('should handle order not found', async () => {
      req.params.id = 'order123';
      req.body.status = 'processing';

      mockOrderService.updateOrder.mockResolvedValue(null);

      await updateOrderStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Order not found',
      });
    });

    test('should handle email error gracefully when updating status', async () => {
      const order = {
        _id: 'order123',
        status: 'pending',
        populate: jest.fn().mockRejectedValue(new Error('Email error')),
      };

      req.params.id = 'order123';
      req.body.status = 'processing';

      mockOrderService.updateOrder.mockResolvedValue(order);
      mockRewardPointService.hasOrderEarnedRewardPoints.mockResolvedValue(false);

      await updateOrderStatus(req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error sending order status update email'),
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle updateOrderStatus errors', async () => {
      req.params.id = 'order123';
      req.body.status = 'processing';

      mockOrderService.updateOrder.mockRejectedValue(new Error('Update failed'));

      await updateOrderStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('should skip reward points if already earned', async () => {
      const order = {
        _id: 'order123',
        user: 'user123',
        status: 'delivered',
        populate: jest.fn().mockResolvedValue({
          _id: 'order123',
          user: { fullName: 'Test User', email: 'test@example.com' },
        }),
      };

      req.params.id = 'order123';
      req.body.status = 'delivered';

      mockOrderService.updateOrder.mockResolvedValue(order);
      mockRewardPointService.hasOrderEarnedRewardPoints.mockResolvedValue(true);

      await updateOrderStatus(req, res, next);

      expect(mockRewardPointService.createRewardPointsForOrder).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
