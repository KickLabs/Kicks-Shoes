/**
 * @fileoverview Order Controller
 * @created 2025-06-08
 * @file orderController.js
 * @description This controller handles all order-related HTTP requests for the Kicks Shoes application.
 */

import { body, validationResult } from 'express-validator';
import { OrderService } from '../services/order.service.js';
import logger from '../utils/logger.js';
import Order from '../models/Order.js';
import EmailService from '../services/email.service.js';
import User from '../models/User.js';
import {
  deductRewardPointsForOrder,
  createRewardPointsForOrder,
  hasOrderEarnedRewardPoints,
} from '../services/rewardPoint.service.js';
import VNPayService from '../services/vnpay.service.js';
import * as RewardPointService from '../services/rewardPoint.service.js';
import Product from '../models/Product.js';

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
    const { reason, amount } = req.body;
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
      // Case 2: Delivered orders (within 7 days of delivery)
      (orderToRefund.status === 'delivered' &&
        orderToRefund.updatedAt &&
        new Date() - new Date(orderToRefund.updatedAt) <= 7 * 24 * 60 * 60 * 1000 &&
        orderToRefund.paymentStatus === 'paid') ||
      // Case 3: COD orders that have been paid and delivered
      (orderToRefund.paymentMethod === 'cash_on_delivery' &&
        orderToRefund.paymentStatus === 'paid' &&
        orderToRefund.status === 'delivered');
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
    // Nếu là VNPAY đã thanh toán thì gọi refund VNPAY
    if (orderToRefund.paymentMethod === 'vnpay' && orderToRefund.paymentStatus === 'paid') {
      const refundResult = await handleVNPayRefund(orderToRefund, amount, reason, req);
      if (!refundResult.success || !refundResult.refundSuccess) {
        return res.status(500).json({
          success: false,
          message: 'VNPay refund failed: ' + (refundResult.message || refundResult.error),
        });
      }
      await OrderService.updateOrder(id, {
        paymentStatus: 'refunded',
        status: 'refunded',
        refundAmount: amount,
        refundReason: reason,
        refundedAt: new Date(),
        refundTransactionNo: refundResult.data?.transactionNo,
        refundResponseCode: refundResult.data?.responseCode,
      });
      refundInfo = refundResult.data;
    }
    // Nếu là COD đã giao hàng và đã thanh toán thì refund bằng điểm thưởng
    if (
      orderToRefund.paymentMethod === 'cash_on_delivery' &&
      orderToRefund.paymentStatus === 'paid' &&
      orderToRefund.status === 'delivered'
    ) {
      // Cộng điểm thưởng tương ứng số tiền refund
      await RewardPointService.create({
        user: orderToRefund.user,
        order: orderToRefund._id,
        points: amount, // 1 point = 1 VND
        type: 'refund',
        description: `Refund for order ${orderToRefund._id}`,
      });
      await OrderService.updateOrder(id, {
        status: 'refunded',
        refundAmount: amount,
        refundReason: reason,
        refundedAt: new Date(),
      });
      refundInfo = { pointsRefunded: amount };
    }
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

    // Nếu chuyển sang delivered thì cộng điểm thưởng (nếu chưa cộng)
    if (status.toLowerCase() === 'delivered') {
      try {
        const hasRewardPoints = await hasOrderEarnedRewardPoints(order._id);
        if (!hasRewardPoints) {
          // Truy vấn lại order với đầy đủ trường
          const fullOrder = await Order.findById(order._id)
            .populate({
              path: 'items',
              populate: { path: 'product' },
            })
            .lean();
          // Cộng sales cho từng sản phẩm trong order items
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
            console.log(
              '[REWARD] Cộng điểm thành công cho order:',
              order._id,
              'user:',
              order.user,
              'points:',
              reward.points
            );
          } else {
            console.log('[REWARD] Không có điểm để cộng cho order:', order._id);
          }
        } else {
          console.log('[REWARD] Đã từng cộng điểm cho order:', order._id);
        }
      } catch (err) {
        console.error('[REWARD] Lỗi khi cộng điểm cho order:', order._id, err);
      }
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
  getMyOrders,
};
