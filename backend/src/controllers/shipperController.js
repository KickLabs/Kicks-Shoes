/**
 * @fileoverview Shipper Controller
 * @created 2025-10-21
 * @file shipperController.js
 * @description This controller handles all shipper-related HTTP requests for the Kicks Shoes application.
 */

import Order from '../models/Order.js';
import Delivery from '../models/Delivery.js';
import User from '../models/User.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';
import EmailService from '../services/email.service.js';

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
  } else if (
    delivery.status !== 'assigned' &&
    delivery.status !== 'picked_up'
  ) {
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
      label: 'Giao hàng thất bại',
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
 * @desc    Get orders assigned to current shipper
 * @route   GET /api/shipper/orders
 * @access  Private/Shipper
 */
export const getAssignedOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const shipperId = req.user._id;

    // Build filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }

    // Get deliveries assigned to this shipper
    const deliveries = await Delivery.find({ shipper: shipperId, ...filter })
      .populate({
        path: 'order',
        populate: [
          {
            path: 'user',
            select: 'fullName email phone avatar',
          },
          {
            path: 'items',
            populate: {
              path: 'product',
              select: 'name mainImage price',
            },
          },
        ],
      })
      .sort({ assignedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Delivery.countDocuments({ shipper: shipperId, ...filter });

    res.status(200).json({
      success: true,
      data: deliveries,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Get assigned orders error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get delivery by order ID
 * @route   GET /api/shipper/delivery/:orderId
 * @access  Private/Shipper
 */
export const getDeliveryByOrderId = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const shipperId = req.user._id;

    const delivery = await Delivery.findOne({
      order: orderId,
      shipper: shipperId,
    })
      .populate({
        path: 'order',
        populate: [
          {
            path: 'user',
            select: 'fullName email phone avatar',
          },
          {
            path: 'items',
            populate: {
              path: 'product',
              select: 'name mainImage price',
            },
          },
        ],
      })
      .populate('shipper', 'fullName email phone avatar vehicleType');

    if (!delivery) {
      return next(new ErrorResponse('Delivery not found', 404));
    }

    res.status(200).json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    logger.error('Get delivery by order ID error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Update delivery status
 * @route   PUT /api/shipper/delivery/:orderId/status
 * @access  Private/Shipper
 */
export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, note, proofOfDelivery, recipientName, latitude, longitude, address } = req.body;
    const shipperId = req.user._id;

    // Validate status
    const validStatuses = ['picked_up', 'in_transit', 'delivered', 'failed'];
    if (!validStatuses.includes(status)) {
      return next(new ErrorResponse('Invalid delivery status', 400));
    }

    // Validate proof of delivery is required for delivered status
    if (status === 'delivered' && !proofOfDelivery) {
      return next(new ErrorResponse('Proof of delivery image is required for delivered status', 400));
    }

    // Find delivery
    const delivery = await Delivery.findOne({
      order: orderId,
      shipper: shipperId,
    });

    if (!delivery) {
      return next(new ErrorResponse('Delivery not found', 404));
    }

    // Find order
    const order = await Order.findById(orderId).populate('user', 'email fullName');

    if (!order) {
      return next(new ErrorResponse('Order not found', 404));
    }

    // Track previous status for handling delivery count
    const previousStatus = delivery.status;

    // Update delivery status
    await delivery.updateStatus(status, note);

    // Update additional fields if provided
    if (proofOfDelivery) {
      delivery.proofOfDelivery = proofOfDelivery;
    }

    if (recipientName) {
      delivery.recipientName = recipientName;
    }

    if (latitude && longitude) {
      delivery.location = {
        latitude,
        longitude,
        address: address || delivery.location?.address,
      };
    }

    await delivery.save();

    // Update order status based on delivery status
    if (status === 'picked_up' && order.status === 'processing') {
      order.status = 'shipped';
      await order.save();
      
      // Send email notification to customer
      await EmailService.sendOrderShippedEmail(order.user.email, {
        customerName: order.user.fullName,
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber || 'N/A',
      });
    } else if (status === 'delivered') {
      order.status = 'delivered_pending_confirmation';
      // Set auto-complete due date to 3 days from now
      order.autoCompleteDueAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      
      // Auto-update payment status to 'paid' for COD orders
      if (order.paymentMethod === 'cash_on_delivery' && order.paymentStatus === 'pending') {
        order.paymentStatus = 'paid';
        order.paymentDate = new Date();
        logger.info('Auto-updated COD order payment status to paid', {
          orderId: order._id,
          orderNumber: order.orderNumber,
        });
      }
      
      await order.save();

      // Decrement shipper's current delivery count
      await User.findByIdAndUpdate(shipperId, {
        $inc: { currentDeliveryCount: -1 },
      });

      // Send email notification to customer
      await EmailService.sendOrderDeliveredEmail(order.user.email, {
        customerName: order.user.fullName,
        orderNumber: order.orderNumber,
        autoCompleteDate: order.autoCompleteDueAt.toLocaleDateString('vi-VN'),
      });
    } else if (status === 'failed') {
      delivery.failureReason = note;
      await delivery.save();

      // Only decrement shipper's delivery count if transitioning TO failed
      // (not if already failed and updating again)
      if (previousStatus !== 'failed') {
        await User.findByIdAndUpdate(shipperId, {
          $inc: { currentDeliveryCount: -1 },
        });
        logger.info('Decremented delivery count due to failed delivery', {
          shipperId,
          orderId,
          previousStatus,
        });
      }
    }

    // If transitioning FROM failed to any other status, increment delivery count back
    if (previousStatus === 'failed' && status !== 'failed') {
      // Clear failed-related fields
      delivery.failedAt = null;
      delivery.failureReason = '';
      await delivery.save();

      // Increment shipper's current delivery count back
      await User.findByIdAndUpdate(shipperId, {
        $inc: { currentDeliveryCount: 1 },
      });
      
      logger.info('Incremented delivery count - retrying after failed delivery', {
        shipperId,
        orderId,
        newStatus: status,
      });
    }

    // Reload delivery with populated data
    const updatedDelivery = await Delivery.findById(delivery._id)
      .populate('shipper', 'fullName phone avatar vehicleType')
      .populate({
        path: 'order',
        select: 'orderNumber status totalPrice shippingAddress',
      })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...updatedDelivery,
        timeline: getDeliveryTimeline(updatedDelivery),
      },
      message: `Delivery status updated to ${status}`,
    });
  } catch (error) {
    logger.error('Update delivery status error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get delivery history for current shipper
 * @route   GET /api/shipper/history
 * @access  Private/Shipper
 */
export const getDeliveryHistory = async (req, res, next) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    const shipperId = req.user._id;

    // Build filter
    const filter = { shipper: shipperId };

    // Filter by delivered status
    filter.status = { $in: ['delivered', 'failed'] };

    // Date range filter
    if (startDate || endDate) {
      filter.deliveredAt = {};
      if (startDate) {
        filter.deliveredAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.deliveredAt.$lte = new Date(endDate);
      }
    }

    const deliveries = await Delivery.find(filter)
      .populate({
        path: 'order',
        select: 'orderNumber totalPrice shippingAddress status createdAt',
      })
      .sort({ deliveredAt: -1, failedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Delivery.countDocuments(filter);

    // Calculate statistics
    const stats = await Delivery.aggregate([
      { $match: { shipper: shipperId, status: 'delivered' } },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          avgDeliveryTime: { $avg: '$deliveryDuration' },
        },
      },
    ]);

    const failedCount = await Delivery.countDocuments({
      shipper: shipperId,
      status: 'failed',
    });

    res.status(200).json({
      success: true,
      data: deliveries,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
      statistics: {
        totalDeliveries: stats[0]?.totalDeliveries || 0,
        failedDeliveries: failedCount,
        avgDeliveryTime: stats[0]?.avgDeliveryTime || 0,
      },
    });
  } catch (error) {
    logger.error('Get delivery history error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Upload proof of delivery
 * @route   POST /api/shipper/delivery/:orderId/proof
 * @access  Private/Shipper
 */
export const uploadProof = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { proofOfDelivery, recipientName, recipientSignature } = req.body;
    const shipperId = req.user._id;

    if (!proofOfDelivery) {
      return next(new ErrorResponse('Proof of delivery image is required', 400));
    }

    const delivery = await Delivery.findOne({
      order: orderId,
      shipper: shipperId,
    });

    if (!delivery) {
      return next(new ErrorResponse('Delivery not found', 404));
    }

    delivery.proofOfDelivery = proofOfDelivery;
    if (recipientName) {
      delivery.recipientName = recipientName;
    }
    if (recipientSignature) {
      delivery.recipientSignature = recipientSignature;
    }

    await delivery.save();

    res.status(200).json({
      success: true,
      data: delivery,
      message: 'Proof of delivery uploaded successfully',
    });
  } catch (error) {
    logger.error('Upload proof error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get shipper dashboard statistics
 * @route   GET /api/shipper/stats
 * @access  Private/Shipper
 */
export const getShipperStats = async (req, res, next) => {
  try {
    const shipperId = req.user._id;

    // Get active deliveries count
    const activeDeliveries = await Delivery.countDocuments({
      shipper: shipperId,
      status: { $in: ['assigned', 'picked_up', 'in_transit'] },
    });

    // Get today's deliveries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDeliveries = await Delivery.countDocuments({
      shipper: shipperId,
      status: 'delivered',
      deliveredAt: { $gte: today, $lt: tomorrow },
    });

    // Get this month's deliveries
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthDeliveries = await Delivery.countDocuments({
      shipper: shipperId,
      status: 'delivered',
      deliveredAt: { $gte: firstDayOfMonth },
    });

    // Get total deliveries
    const totalDeliveries = await Delivery.countDocuments({
      shipper: shipperId,
      status: 'delivered',
    });

    // Get failed deliveries count
    const failedDeliveries = await Delivery.countDocuments({
      shipper: shipperId,
      status: 'failed',
    });

    // Get average delivery time
    const avgStats = await Delivery.aggregate([
      { $match: { shipper: shipperId, status: 'delivered' } },
      {
        $group: {
          _id: null,
          avgDeliveryTime: { $avg: '$deliveryDuration' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        activeDeliveries,
        todayDeliveries,
        monthDeliveries,
        totalDeliveries,
        failedDeliveries,
        avgDeliveryTime: avgStats[0]?.avgDeliveryTime || 0,
        successRate:
          totalDeliveries + failedDeliveries > 0
            ? ((totalDeliveries / (totalDeliveries + failedDeliveries)) * 100).toFixed(2)
            : 0,
      },
    });
  } catch (error) {
    logger.error('Get shipper stats error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};


