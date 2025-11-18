/**
 * @fileoverview Order Controller
 * @created 2025-06-08
 * @file orderController.js
 * @description This controller handles all order-related HTTP requests for the Kicks Shoes application.
 */

import { body, validationResult } from 'express-validator';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Delivery from '../models/Delivery.js';
import DeliveryReport from '../models/DeliveryReport.js';
import EmailService from '../services/email.service.js';
import { OrderService } from '../services/order.service.js';
import * as RewardPointService from '../services/rewardPoint.service.js';
import {
  createRewardPointsForOrder,
  deductRewardPointsForOrder,
  hasOrderEarnedRewardPoints,
} from '../services/rewardPoint.service.js';
import RewardPoint from '../models/RewardPoint.js';
import VNPayService from '../services/vnpay.service.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';

// Validation rules for order operations
const orderValidationRules = {
  create: [
    body('products').isArray().withMessage('Products must be an array'),
    body('products.*.id').isMongoId().withMessage('Invalid product ID'),
    body('products.*.quantity').isInt({ min: 1 }).withMessage('Invalid quantity'),
    body('totalAmount').optional().isFloat({ min: 0 }).withMessage('Invalid total amount'),
    body('totalPrice').optional().isFloat({ min: 0 }).withMessage('Invalid total price'),
    body('paymentMethod')
      .isIn(['vnpay', 'cash_on_delivery', 'payos'])
      .withMessage('Invalid payment method'),
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
    body('discountCode').optional().isString().withMessage('Discount code must be a string'),
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

// Tiện ích gọi refund VNPAY
async function handleVNPayRefund(order, amount, reason, req) {
  const vnpayService = new VNPayService();
  await vnpayService.initialize();
  const refundResult = await vnpayService.refundPayment({
    txnRef: order.vnpTxnRef,
    amount: parseInt(amount),
    transactionDate: order.vnpPayDate,
    transactionNo: order.vnpTransactionNo,
    orderInfo: reason || `Refund for order ${order._id}`,
    transactionType: '02',
    ipAddr: req?.ip || req?.connection?.remoteAddress || '127.0.0.1',
  });
  return refundResult;
}

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
        discountCode,
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
        discountCode,
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

      // Return specific error message for discount validation
      if (error.message && error.message.includes('Invalid discount code')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      // Return generic error for other cases
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create order',
      });
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

    // Get delivery info if exists
    let delivery = null;
    if (order.shipper) {
      delivery = await Delivery.findOne({ order: id })
        .populate('shipper', 'fullName phone avatar vehicleType')
        .lean();
    }

    res.status(200).json({
      success: true,
      data: {
        ...order.toObject(),
        delivery: delivery
          ? {
              ...delivery,
              timeline: getDeliveryTimeline(delivery),
              statusHistory: delivery.statusHistory,
            }
          : null,
      },
    });
  } catch (error) {
    logger.error('Error getting order by ID:', error);
    next(error);
  }
};

/**
 * Get delivery tracking for an order
 * @route GET /api/orders/:id/tracking
 * @access Private
 */
export const getOrderTracking = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find order
    const order = await Order.findById(id)
      .select('orderNumber status shipper assignedAt')
      .populate('shipper', 'fullName phone avatar vehicleType');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Get delivery info
    const delivery = await Delivery.findOne({ order: id })
      .populate('shipper', 'fullName phone avatar vehicleType email')
      .lean();

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery information not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        orderStatus: order.status,
        shipper: delivery.shipper,
        currentStatus: delivery.status,
        timeline: getDeliveryTimeline(delivery),
        statusHistory: delivery.statusHistory,
        location: delivery.location,
        estimatedDeliveryTime: delivery.estimatedDeliveryTime,
        actualDeliveryTime: delivery.actualDeliveryTime,
        proofOfDelivery: delivery.proofOfDelivery,
        recipientName: delivery.recipientName,
        deliveryDuration:
          delivery.deliveredAt && delivery.assignedAt
            ? Math.floor(
                (new Date(delivery.deliveredAt) - new Date(delivery.assignedAt)) / 1000 / 60
              )
            : null,
      },
    });
  } catch (error) {
    logger.error('Get order tracking error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Helper function to generate delivery timeline
 */
function getDeliveryTimeline(delivery) {
  const timeline = [];

  // Always include assigned
  if (delivery.assignedAt) {
    timeline.push({
      status: 'assigned',
      label: 'Shipper Assigned',
      timestamp: delivery.assignedAt,
      completed: true,
    });
  }

  // Picked up
  if (delivery.pickedUpAt) {
    timeline.push({
      status: 'picked_up',
      label: 'Picked Up',
      timestamp: delivery.pickedUpAt,
      completed: true,
    });
  } else if (delivery.status !== 'assigned') {
    timeline.push({
      status: 'picked_up',
      label: 'Picked Up',
      timestamp: null,
      completed: false,
    });
  }

  // In transit
  if (delivery.inTransitAt) {
    timeline.push({
      status: 'in_transit',
      label: 'In Transit',
      timestamp: delivery.inTransitAt,
      completed: true,
    });
  } else if (delivery.status !== 'assigned' && delivery.status !== 'picked_up') {
    timeline.push({
      status: 'in_transit',
      label: 'In Transit',
      timestamp: null,
      completed: false,
    });
  }

  // Delivered or Failed
  if (delivery.deliveredAt) {
    timeline.push({
      status: 'delivered',
      label: 'Delivered',
      timestamp: delivery.deliveredAt,
      completed: true,
      recipientName: delivery.recipientName,
      proofOfDelivery: delivery.proofOfDelivery,
    });
  } else if (delivery.failedAt && delivery.status === 'failed') {
    // Only show failed status if current status is still failed
    timeline.push({
      status: 'failed',
      label: 'Delivery Failed',
      timestamp: delivery.failedAt,
      completed: true,
      failureReason: delivery.failureReason,
    });
  } else if (
    delivery.status !== 'assigned' &&
    delivery.status !== 'picked_up' &&
    delivery.status !== 'in_transit' &&
    delivery.status !== 'failed'
  ) {
    timeline.push({
      status: 'delivered',
      label: 'Delivered',
      timestamp: null,
      completed: false,
    });
  }

  return timeline;
}

/**
 * Get orders for current user
 * @route GET /api/orders/my-orders
 * @access Private
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user.id; // Get current user ID from token

    logger.info('Getting orders for current user:', { userId, page, limit, status });

    const result = await OrderService.getOrderByUserId(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'No orders found',
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting current user orders:', error);
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

    // Nếu là VNPAY và đã thanh toán thì refund VNPAY trước khi cancel
    let refundInfo = null;
    if (orderToCancel.paymentMethod === 'vnpay' && orderToCancel.paymentStatus === 'paid') {
      const refundResult = await handleVNPayRefund(
        orderToCancel,
        orderToCancel.totalPrice,
        reason,
        req
      );
      if (!refundResult.success || !refundResult.refundSuccess) {
        return res.status(500).json({
          success: false,
          message: 'VNPay refund failed: ' + (refundResult.message || refundResult.error),
        });
      }
      // Lưu thông tin refund vào order
      await OrderService.updateOrder(id, {
        paymentStatus: 'refunded',
        status: 'refunded',
        refundAmount: orderToCancel.totalPrice,
        refundReason: reason,
        refundedAt: new Date(),
        refundTransactionNo: refundResult.data?.transactionNo,
        refundResponseCode: refundResult.data?.responseCode,
      });
      refundInfo = refundResult.data;
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
    }

    // Trừ điểm nếu đã từng cộng cho order này
    try {
      await deductRewardPointsForOrder(orderToCancel);
    } catch (e) {
      logger.error('Error deducting reward points after cancel:', e);
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
        refundInfo: refundInfo || null,
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
    let { reason, amount } = req.body;

    // Ensure amount is always positive
    amount = Math.abs(parseFloat(amount));

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
      // Case 1: Paid and cancelled orders (VNPAY)
      (orderToRefund.paymentMethod === 'vnpay' &&
        orderToRefund.paymentStatus === 'paid' &&
        orderToRefund.status === 'cancelled') ||
      // Case 2: Delivered orders (within 3 days of delivery)
      (orderToRefund.status === 'delivered' &&
        orderToRefund.deliveredAt &&
        new Date() - new Date(orderToRefund.deliveredAt) <= 3 * 24 * 60 * 60 * 1000 &&
        orderToRefund.paymentStatus === 'paid') ||
      // Case 3: Completed orders (within 3 days of completion)
      (orderToRefund.status === 'completed' &&
        orderToRefund.completedAt &&
        new Date() - new Date(orderToRefund.completedAt) <= 3 * 24 * 60 * 60 * 1000 &&
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
          'Order is not eligible for refund. Only cancelled VNPAY orders, delivered paid orders within 7 days, or paid & delivered COD orders can be refunded.',
      });
    }
    // Validate refund amount
    if (amount > orderToRefund.totalPrice) {
      logger.warn('Refund amount exceeds order total', {
        orderId: id,
        refundAmount: amount,
        orderTotal: orderToRefund.totalPrice,
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
    let refundInfo = null;

    // REFUND ALL PAYMENT METHODS AS REWARD POINTS
    // This is simpler and more reliable than dealing with payment gateway APIs
    logger.info('Processing refund as reward points', {
      amount,
      paymentMethod: orderToRefund.paymentMethod,
    });

    // Cộng điểm thưởng tương ứng số tiền refund
    // IMPORTANT: 1000 VND = 1 point (divide by 1000)
    const refundPoints = Math.floor(Math.abs(Number(amount)) / 1000);

    logger.info('Refund points to be added', {
      originalAmount: amount,
      refundPoints: refundPoints,
      conversionRate: '1000 VND = 1 point',
    });

    const rewardPoint = await RewardPoint.create({
      user: orderToRefund.user,
      points: refundPoints, // 1000 VND = 1 point
      type: 'adjust', // Use 'adjust' for refund points
      description: `Refund for order #${orderToRefund.orderNumber || orderToRefund._id}`,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      status: 'active',
    });

    logger.info('Reward points created successfully for refund', {
      rewardPointId: rewardPoint._id,
      points: rewardPoint.points,
      user: orderToRefund.user,
      orderId: id,
    });

    await OrderService.updateOrder(id, {
      status: 'refunded',
      paymentStatus: 'refunded',
      refundAmount: amount,
      refundReason: reason,
      refundedAt: new Date(),
    });

    refundInfo = {
      refundAmountVND: amount,
      pointsRefunded: refundPoints,
      conversionRate: '1000 VND = 1 point',
      message: `Refund processed as ${refundPoints} reward points`,
      paymentMethod: orderToRefund.paymentMethod,
    };
    // Trừ điểm nếu đã từng cộng cho order này
    try {
      await deductRewardPointsForOrder(orderToRefund);
    } catch (e) {
      logger.error('Error deducting reward points after refund:', e);
    }
    logger.info('Refund processed successfully', {
      orderId: id,
      refundAmount: amount,
    });
    // Send email notification for order refund
    try {
      const populatedOrder = await orderToRefund.populate('user', 'fullName email');
      await EmailService.sendOrderStatusUpdateEmail(
        populatedOrder.user,
        populatedOrder,
        'refunded'
      );
    } catch (emailError) {
      logger.error('Error sending order refund email:', emailError);
    }
    return res.status(200).json({
      success: true,
      data: {
        orderId: orderToRefund._id,
        status: 'refunded',
        refundAmount: amount,
        refundReason: reason,
        refundedAt: new Date(),
        refundInfo,
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
 * Update order status (Shop only: pending → processing)
 * @route PATCH /api/orders/:id/status
 * @access Private/Shop
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

    // Get current order
    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Shop can only transition from pending to processing
    if (currentOrder.status !== 'pending' || status.toLowerCase() !== 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Shop can only update orders from pending to processing status',
      });
    }

    logger.info('Updating order status', { orderId: id, newStatus: status });

    const order = await OrderService.updateOrder(id, {
      status: 'processing',
    });

    // Send email notification for status change
    try {
      const populatedOrder = await order.populate('user', 'fullName email');
      await EmailService.sendOrderStatusUpdateEmail(
        populatedOrder.user,
        populatedOrder,
        'processing'
      );
    } catch (emailError) {
      logger.error('Error sending order status update email:', emailError);
      // Don't fail the request if email fails
    }

    logger.info('Order status updated successfully', { orderId: id });

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order status updated to processing successfully',
    });
  } catch (error) {
    logger.error('Error updating order status:', error);
    next(error);
  }
};

/**
 * Assign shipper to order (manual)
 * @route POST /api/orders/:id/assign-shipper
 * @access Private/Shop
 */
export const assignShipper = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { shipperId } = req.body;

    if (!shipperId) {
      return res.status(400).json({
        success: false,
        message: 'Shipper ID is required',
      });
    }

    // Find order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order status is processing
    if (order.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Can only assign shipper to processing orders',
      });
    }

    // Find shipper
    const shipper = await User.findById(shipperId);
    if (!shipper || shipper.role !== 'shipper') {
      return res.status(404).json({
        success: false,
        message: 'Shipper not found',
      });
    }

    // Check if shipper is active
    if (!shipper.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Shipper is not active',
      });
    }

    // Check if delivery already exists
    const existingDelivery = await Delivery.findOne({ order: id });
    if (existingDelivery) {
      return res.status(400).json({
        success: false,
        message: 'Delivery already assigned to this order',
      });
    }

    // Create delivery
    const delivery = await Delivery.create({
      order: id,
      shipper: shipperId,
      status: 'assigned',
      assignedAt: new Date(),
      estimatedDeliveryTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    });

    // Update order
    order.shipper = shipperId;
    order.assignedAt = new Date();
    await order.save();

    // Increment shipper's current delivery count
    await User.findByIdAndUpdate(shipperId, {
      $inc: { currentDeliveryCount: 1 },
    });

    logger.info('Shipper assigned to order', {
      orderId: id,
      shipperId,
    });

    res.status(200).json({
      success: true,
      data: {
        order,
        delivery,
      },
      message: 'Shipper assigned successfully',
    });
  } catch (error) {
    logger.error('Assign shipper error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Auto-assign shipper to order
 * @route POST /api/orders/:id/auto-assign-shipper
 * @access Private/Shop
 */
export const autoAssignShipper = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order status is processing
    if (order.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Can only assign shipper to processing orders',
      });
    }

    // Check if delivery already exists
    const existingDelivery = await Delivery.findOne({ order: id });
    if (existingDelivery) {
      return res.status(400).json({
        success: false,
        message: 'Delivery already assigned to this order',
      });
    }

    // Find available shipper with minimum current deliveries
    const shipper = await User.findOne({
      role: 'shipper',
      status: true,
      isVerified: true,
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    }).sort({ currentDeliveryCount: 1 });

    if (!shipper) {
      return res.status(404).json({
        success: false,
        message: 'No available shipper found',
      });
    }

    // Create delivery
    const delivery = await Delivery.create({
      order: id,
      shipper: shipper._id,
      status: 'assigned',
      assignedAt: new Date(),
      estimatedDeliveryTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    });

    // Update order
    order.shipper = shipper._id;
    order.assignedAt = new Date();
    await order.save();

    // Increment shipper's current delivery count
    await User.findByIdAndUpdate(shipper._id, {
      $inc: { currentDeliveryCount: 1 },
    });

    logger.info('Shipper auto-assigned to order', {
      orderId: id,
      shipperId: shipper._id,
    });

    res.status(200).json({
      success: true,
      data: {
        order,
        delivery,
        shipper: {
          _id: shipper._id,
          fullName: shipper.fullName,
          phone: shipper.phone,
          vehicleType: shipper.vehicleType,
        },
      },
      message: 'Shipper auto-assigned successfully',
    });
  } catch (error) {
    logger.error('Auto-assign shipper error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Get available shippers
 * @route GET /api/orders/shippers/available
 * @access Private/Shop
 */
export const getAvailableShippers = async (req, res, next) => {
  try {
    const shippers = await User.find({
      role: 'shipper',
      status: true,
      isVerified: true,
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    })
      .select('fullName email phone avatar vehicleType currentDeliveryCount isActive')
      .sort({ currentDeliveryCount: 1 });

    logger.info('Available shippers found', {
      count: shippers.length,
      shippers: shippers.map(s => ({ id: s._id, name: s.fullName, isActive: s.isActive })),
    });

    res.status(200).json({
      success: true,
      data: shippers,
      count: shippers.length,
    });
  } catch (error) {
    logger.error('Get available shippers error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Customer confirms order received
 * @route POST /api/orders/:id/confirm
 * @access Private/Customer
 */
export const confirmOrderReceived = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const order = await Order.findById(id);

    if (!order) {
      return next(new ErrorResponse('Order not found', 404));
    }

    // Check if order belongs to this user
    if (order.user.toString() !== userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You can only confirm your own orders',
      });
    }

    // Check if order is delivered or pending confirmation
    if (order.status !== 'delivered' && order.status !== 'delivered_pending_confirmation') {
      return res.status(400).json({
        success: false,
        message: 'Order must be delivered before confirmation',
      });
    }

    // Update order status to completed
    order.status = 'completed';
    order.completedAt = new Date();
    order.customerConfirmedAt = new Date();
    await order.save();

    // Award reward points if not already awarded
    try {
      const hasRewardPoints = await hasOrderEarnedRewardPoints(order._id);
      if (!hasRewardPoints) {
        const fullOrder = await Order.findById(order._id)
          .populate({
            path: 'items',
            populate: { path: 'product' },
          })
          .lean();

        // Increment sales for each product
        if (fullOrder && Array.isArray(fullOrder.items)) {
          for (const item of fullOrder.items) {
            if (item.product && item.quantity) {
              await Product.findByIdAndUpdate(item.product._id || item.product, {
                $inc: { sales: item.quantity },
              });
            }
          }
        }

        const reward = await createRewardPointsForOrder(fullOrder);
        if (reward) {
          logger.info('[REWARD] Points awarded for order:', {
            orderId: order._id,
            userId: order.user,
            points: reward.points,
          });
        }
      }
    } catch (err) {
      logger.error('[REWARD] Error awarding points for order:', order._id, err);
    }

    logger.info('Order confirmed by customer', { orderId: id });

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order confirmed successfully',
    });
  } catch (error) {
    logger.error('Confirm order received error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Report delivery issue (customer didn't receive order)
 * @route   POST /api/orders/:id/report-issue
 * @access  Private (Customer only)
 */
export const reportDeliveryIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reportType, reason, description, images } = req.body;
    const userId = req.user._id;

    // Validate report type
    const validReportTypes = ['not_received', 'damaged', 'wrong_item', 'incomplete', 'other'];
    if (!validReportTypes.includes(reportType)) {
      return next(new ErrorResponse('Invalid report type', 400));
    }

    // Validate reason
    if (!reason || reason.trim().length === 0) {
      return next(new ErrorResponse('Reason is required', 400));
    }

    const order = await Order.findById(id).populate('user', 'email fullName');

    if (!order) {
      return next(new ErrorResponse('Order not found', 404));
    }

    // Check if order belongs to this user
    if (order.user._id.toString() !== userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You can only report issues for your own orders',
      });
    }

    // Check if order is in delivered_pending_confirmation status
    if (order.status !== 'delivered_pending_confirmation' && order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only report issues for delivered orders',
      });
    }

    // Check if there's already an active report for this order
    const existingReport = await DeliveryReport.findOne({
      order: id,
      status: { $in: ['pending', 'investigating'] },
      isActive: true,
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'There is already an active report for this order',
      });
    }

    // Find delivery
    const delivery = await Delivery.findOne({ order: id });

    // Create delivery report
    const report = await DeliveryReport.create({
      order: id,
      delivery: delivery?._id,
      customer: userId,
      shipper: delivery?.shipper,
      reportType,
      reason: reason.trim(),
      description: description?.trim(),
      images: images || [],
      status: 'pending',
      priority: reportType === 'not_received' ? 'high' : 'medium',
    });

    // Update order status to under_investigation
    order.status = 'under_investigation';
    await order.save();

    // Populate report for response
    await report.populate([
      { path: 'customer', select: 'fullName email phone' },
      { path: 'shipper', select: 'fullName email phone' },
      { path: 'order', select: 'orderNumber status' },
    ]);

    // Send email notification to admin/shop
    await EmailService.sendDeliveryIssueReportEmail({
      customerName: order.user.fullName,
      orderNumber: order.orderNumber,
      reportType,
      reason,
      description,
    });

    logger.info('Delivery issue reported', {
      orderId: id,
      reportId: report._id,
      reportType,
    });

    res.status(201).json({
      success: true,
      data: report,
      message:
        'Delivery issue reported successfully. Our team will investigate and contact you soon.',
    });
  } catch (error) {
    logger.error('Report delivery issue error', {
      error: error.message,
      stack: error.stack,
    });
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
  getMyOrders,
  confirmOrderReceived,
  reportDeliveryIssue,
  getOrderTracking,
};
