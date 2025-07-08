/**
 * @fileoverview Order Controller
 * @created 2025-06-08
 * @file orderController.js
 * @description This controller handles all order-related HTTP requests for the Kicks Shoes application.
 */

import { body, validationResult } from 'express-validator';
import { OrderService } from '../services/order.service.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../middlewares/async.middleware.js';
import Order from '../models/Order.js';
import EmailService from '../services/email.service.js';
import User from '../models/User.js';

// Validation rules for order operations
const orderValidationRules = {
  create: [
    body('products').isArray().withMessage('Products must be an array'),
    body('products.*.id').isMongoId().withMessage('Invalid product ID'),
    body('products.*.quantity').isInt({ min: 1 }).withMessage('Invalid quantity'),
    body('totalAmount').optional().isFloat({ min: 0 }).withMessage('Invalid total amount'),
    body('totalPrice').optional().isFloat({ min: 0 }).withMessage('Invalid total price'),
    body('paymentMethod').isIn(['vnpay', 'cash_on_delivery']).withMessage('Invalid payment method'),
    body('shippingAddress').isString().notEmpty().withMessage('Shipping address is required'),
    body('shippingMethod')
      .optional()
      .isIn(['standard', 'express', 'next_day', 'store'])
      .withMessage('Invalid shipping method'),
    body('shippingCost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Shipping cost must be a non-negative number'),
    body('tax').optional().isFloat({ min: 0 }).withMessage('Tax must be a non-negative number'),
    body('discount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount must be a non-negative number'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
    // Order status and payment fields
    body('status')
      .optional()
      .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
      .withMessage('Invalid status'),
    body('paymentStatus')
      .optional()
      .isIn(['pending', 'paid', 'failed', 'refunded'])
      .withMessage('Invalid payment status'),
    body('paymentDate').optional().isISO8601().toDate().withMessage('Invalid payment date'),
    body('transactionId').optional().isString().withMessage('Invalid transaction ID'),
    // VNPay transaction fields
    body('vnpResponseCode').optional().isString().withMessage('Invalid VNPay response code'),
    body('vnpTxnRef').optional().isString().withMessage('Invalid VNPay transaction reference'),
    body('vnpAmount').optional().isFloat({ min: 0 }).withMessage('Invalid VNPay amount'),
    body('vnpBankCode').optional().isString().withMessage('Invalid VNPay bank code'),
    body('vnpPayDate').optional().isString().withMessage('Invalid VNPay payment date'),
  ],
  update: [
    body('status')
      .optional()
      .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    body('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded']),
    body('trackingNumber').optional().isString(),
    body('shippingAddress').optional().isString(),
    body('shippingMethod').optional().isIn(['standard', 'express', 'next_day', 'store']),
    body('shippingCost').optional().isFloat({ min: 0 }),
    body('tax').optional().isFloat({ min: 0 }),
    body('discount').optional().isFloat({ min: 0 }),
    body('notes').optional().isString().isLength({ max: 500 }),
    // VNPay transaction fields
    body('transactionId').optional().isString(),
    body('paymentDate').optional().isISO8601().toDate(),
    body('vnpResponseCode').optional().isString(),
    body('vnpTxnRef').optional().isString(),
    body('vnpAmount').optional().isFloat({ min: 0 }),
    body('vnpBankCode').optional().isString(),
    body('vnpPayDate').optional().isString(),
  ],
};

// Middleware to validate request data
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Create a new order
 * @route POST /api/orders
 * @access Private
 */
export const createOrder = [
  orderValidationRules.create,
  validateRequest,
  async (req, res, next) => {
    try {
      logger.info('Creating new order', {
        userId: req.user._id,
        productCount: req.body.products.length,
      });

      const {
        products,
        totalAmount,
        totalPrice,
        paymentMethod,
        shippingAddress,
        shippingMethod,
        shippingCost,
        tax,
        discount,
        notes,
        status,
        paymentStatus,
        paymentDate,
        transactionId,
        vnpResponseCode,
        vnpTxnRef,
        vnpAmount,
        vnpBankCode,
        vnpPayDate,
      } = req.body;

      const order = await OrderService.createOrder({
        user: req.user._id,
        products,
        totalAmount,
        totalPrice,
        paymentMethod,
        shippingAddress,
        shippingMethod,
        shippingCost,
        tax,
        discount,
        notes,
        status,
        paymentStatus,
        paymentDate,
        transactionId,
        vnpResponseCode,
        vnpTxnRef,
        vnpAmount,
        vnpBankCode,
        vnpPayDate,
      });

      logger.info('Order created successfully', { orderId: order._id });

      // Send email confirmation
      try {
        const user = await User.findById(req.user._id);

        // Order is already populated from OrderService
        await EmailService.sendOrderConfirmationEmail(user, order);
      } catch (emailError) {
        logger.error('Error sending order confirmation email:', emailError);
        // Don't fail the request if email fails
      }

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      logger.error('Error creating order:', error);
      next(error);
    }
  },
];

/**
 * Get all orders with pagination
 * @route GET /api/orders
 * @access Private/Admin
 */
export const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;

    const orders = await OrderService.getOrders({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      startDate,
      endDate,
    });

    if (!orders) {
      return res.status(404).json({
        success: false,
        message: 'No orders found',
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    logger.error('Error getting orders:', error);
    next(error);
  }
};

/**
 * Get order by ID
 * @route GET /api/orders/:id
 * @access Private
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    const order = await OrderService.getOrderByOrderId(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Error getting order by ID:', error);
    next(error);
  }
};

/**
 * Get orders by user ID
 * @route GET /api/orders/user/:userId
 * @access Private
 */
export const getOrdersByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    logger.info('Getting orders for user:', { userId, page, limit });

    const result = await OrderService.getOrderByUserId(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'No orders found for this user',
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting orders by user ID:', error);
    next(error);
  }
};

/**
 * Update order
 * @route PUT /api/orders/:id
 * @access Private/Admin
 */
export const updateOrder = [
  orderValidationRules.update,
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required',
        });
      }

      logger.info('Updating order', { orderId: id, updates: req.body });

      const order = await OrderService.updateOrder(id, req.body);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      logger.info('Order updated successfully', { orderId: id });

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      logger.error('Error updating order:', error);
      next(error);
    }
  },
];

/**
 * Cancel order
 * @route POST /api/orders/:id/cancel
 * @access Private
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }
    const orderToCancel = await OrderService.getOrderByOrderId(id);
    if (!orderToCancel) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    if (orderToCancel.status !== 'pending' && orderToCancel.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending or processing orders',
      });
    }

    logger.info('Cancelling order', { orderId: id, reason });

    const order = await OrderService.cancelOrder(id, reason);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Send email notification for order cancellation
    try {
      const populatedOrder = await order.populate('user', 'fullName email');
      await EmailService.sendOrderStatusUpdateEmail(
        populatedOrder.user,
        populatedOrder,
        'cancelled'
      );
    } catch (emailError) {
      logger.error('Error sending order cancellation email:', emailError);
      // Don't fail the request if email fails
    }

    logger.info('Order cancelled successfully', { orderId: id });

    res.status(200).json({
      success: true,
      message: 'Order with id ' + id + ' cancelled successfully',
      data: {
        orderId: order._id,
        status: order.status,
        cancellationReason: order.cancellationReason,
        cancelledAt: order.cancelledAt,
        // Include refund information if VNPay refund was processed
        refundInfo:
          order.paymentMethod === 'vnpay' && order.paymentStatus === 'refunded'
            ? {
                refundAmount: order.refundAmount,
                refundReason: order.refundReason,
                refundedAt: order.refundedAt,
                refundTransactionNo: order.refundTransactionNo,
                refundResponseCode: order.refundResponseCode,
              }
            : null,
      },
    });
  } catch (error) {
    logger.error('Error cancelling order:', error);
    next(error);
  }
};

/**
 * Refund order
 * @route POST /api/orders/:id/refund
 * @access Private
 */
export const refundOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, amount } = req.body;

    // Input validation
    if (!id?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Refund reason is required',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid refund amount is required',
      });
    }

    const orderToRefund = await OrderService.getOrderByOrderId(id);
    if (!orderToRefund) {
      logger.warn('Refund attempt for non-existent order', { orderId: id });
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order is eligible for refund
    const isEligibleForRefund =
      // Case 1: Paid and cancelled orders
      (orderToRefund.paymentStatus === 'paid' && orderToRefund.status === 'cancelled') ||
      // Case 2: Delivered orders (within 7 days of delivery)
      (orderToRefund.status === 'delivered' &&
        orderToRefund.updatedAt &&
        new Date() - new Date(orderToRefund.updatedAt) <= 7 * 24 * 60 * 60 * 1000) ||
      // Case 3: COD orders that have been paid
      (orderToRefund.paymentMethod === 'cash_on_delivery' &&
        orderToRefund.paymentStatus === 'paid');

    if (!isEligibleForRefund) {
      logger.warn('Refund attempt for ineligible order', {
        orderId: id,
        status: orderToRefund.status,
        paymentStatus: orderToRefund.paymentStatus,
        paymentMethod: orderToRefund.paymentMethod,
      });
      return res.status(400).json({
        success: false,
        message:
          'Order is not eligible for refund. Only cancelled orders, delivered orders within 7 days, or paid COD orders can be refunded.',
      });
    }

    // Validate refund amount
    if (amount > orderToRefund.totalAmount) {
      logger.warn('Refund amount exceeds order total', {
        orderId: id,
        refundAmount: amount,
        orderTotal: orderToRefund.totalAmount,
      });
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed order total',
      });
    }

    logger.info('Processing refund request', {
      orderId: id,
      refundAmount: amount,
      reason,
      orderStatus: orderToRefund.status,
      paymentStatus: orderToRefund.paymentStatus,
      paymentMethod: orderToRefund.paymentMethod,
    });

    // Process refund
    const orderRefunded = await OrderService.refundOrder(id, {
      reason,
      amount,
      originalStatus: orderToRefund.status,
      originalPaymentStatus: orderToRefund.paymentStatus,
    });

    if (!orderRefunded) {
      logger.error('Refund processing failed', { orderId: id });
      return res.status(500).json({
        success: false,
        message: 'Failed to process refund',
      });
    }

    logger.info('Refund processed successfully', {
      orderId: id,
      refundAmount: amount,
      orderStatus: orderRefunded.status,
      paymentStatus: orderRefunded.paymentStatus,
    });

    // Send email notification for order refund
    try {
      const populatedOrder = await orderRefunded.populate('user', 'fullName email');
      await EmailService.sendOrderStatusUpdateEmail(
        populatedOrder.user,
        populatedOrder,
        'refunded'
      );
    } catch (emailError) {
      logger.error('Error sending order refund email:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: orderRefunded._id,
        status: orderRefunded.status,
        paymentStatus: orderRefunded.paymentStatus,
        refundAmount: orderRefunded.refundAmount,
        refundReason: orderRefunded.refundReason,
        refundedAt: orderRefunded.refundedAt,
        // Include VNPay refund details if available
        refundTransactionNo: orderRefunded.refundTransactionNo,
        refundResponseCode: orderRefunded.refundResponseCode,
      },
      message: 'Refund processed successfully',
    });
  } catch (error) {
    logger.error('Error processing refund:', {
      error: error.message,
      stack: error.stack,
      orderId: req.params.id,
    });
    next(error);
  }
};

/**
 * Update order status
 * @route PATCH /api/orders/:id/status
 * @access Private/Admin
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    // Validate status
    const validStatuses = [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    logger.info('Updating order status', { orderId: id, newStatus: status });

    const order = await OrderService.updateOrder(id, {
      status: status.toLowerCase(),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Send email notification for status change
    try {
      const populatedOrder = await order.populate('user', 'fullName email');
      await EmailService.sendOrderStatusUpdateEmail(
        populatedOrder.user,
        populatedOrder,
        status.toLowerCase()
      );
    } catch (emailError) {
      logger.error('Error sending order status update email:', emailError);
      // Don't fail the request if email fails
    }

    logger.info('Order status updated successfully', { orderId: id });

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    logger.error('Error updating order status:', error);
    next(error);
  }
};

// Export all routes
export const orderRoutes = {
  createOrder,
  getOrders,
  getOrderById,
  getOrdersByUserId,
  updateOrder,
  cancelOrder,
  refundOrder,
  updateOrderStatus,
};
