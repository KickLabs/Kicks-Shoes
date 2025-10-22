/**
 * @fileoverview Delivery Report Controller
 * @created 2025-10-21
 * @file deliveryReportController.js
 * @description Controller for managing delivery issue reports
 */

import DeliveryReport from '../models/DeliveryReport.js';
import Order from '../models/Order.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';
import EmailService from '../services/email.service.js';

/**
 * @desc    Get all delivery reports (for shop/admin)
 * @route   GET /api/delivery-reports
 * @access  Private/Shop/Admin
 */
export const getAllReports = async (req, res, next) => {
  try {
    const { status, priority, reportType, page = 1, limit = 10 } = req.query;

    const query = { isActive: true };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Filter by report type
    if (reportType) {
      query.reportType = reportType;
    }

    const skip = (page - 1) * limit;

    const reports = await DeliveryReport.find(query)
      .populate('customer', 'fullName email phone')
      .populate('shipper', 'fullName email phone')
      .populate('order', 'orderNumber status totalPrice')
      .populate('delivery', 'status proofOfDelivery')
      .populate('resolvedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await DeliveryReport.countDocuments(query);

    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get all reports error:', error);
    next(error);
  }
};

/**
 * @desc    Get report by ID
 * @route   GET /api/delivery-reports/:id
 * @access  Private/Shop/Admin
 */
export const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await DeliveryReport.findById(id)
      .populate('customer', 'fullName email phone')
      .populate('shipper', 'fullName email phone vehicleType')
      .populate('order', 'orderNumber status totalPrice paymentMethod')
      .populate('delivery', 'status proofOfDelivery statusHistory')
      .populate('resolvedBy', 'fullName email');

    if (!report) {
      return next(new ErrorResponse('Report not found', 404));
    }

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Get report by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Get report statistics
 * @route   GET /api/delivery-reports/stats
 * @access  Private/Shop/Admin
 */
export const getReportStats = async (req, res, next) => {
  try {
    const stats = await DeliveryReport.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await DeliveryReport.aggregate([
      {
        $match: { isActive: true, status: { $in: ['pending', 'investigating'] } },
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    const typeStats = await DeliveryReport.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: '$reportType',
          count: { $sum: 1 },
        },
      },
    ]);

    const pendingCount = await DeliveryReport.getPendingCount();

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        byPriority: priorityStats,
        byType: typeStats,
        pendingCount,
      },
    });
  } catch (error) {
    logger.error('Get report stats error:', error);
    next(error);
  }
};

/**
 * @desc    Update report status (start investigation)
 * @route   PATCH /api/delivery-reports/:id/status
 * @access  Private/Shop/Admin
 */
export const updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, internalNotes } = req.body;
    const userId = req.user._id;

    const validStatuses = ['pending', 'investigating', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return next(new ErrorResponse('Invalid status', 400));
    }

    const report = await DeliveryReport.findById(id);

    if (!report) {
      return next(new ErrorResponse('Report not found', 404));
    }

    report.status = status;
    if (internalNotes) {
      report.internalNotes = internalNotes;
    }

    // If starting investigation, assign to current user
    if (status === 'investigating' && !report.assignedTo) {
      report.assignedTo = userId;
    }

    await report.save();

    // Reload with populated data
    await report.populate([
      { path: 'customer', select: 'fullName email' },
      { path: 'order', select: 'orderNumber' },
    ]);

    logger.info('Report status updated', {
      reportId: id,
      newStatus: status,
      updatedBy: userId,
    });

    res.status(200).json({
      success: true,
      data: report,
      message: `Report status updated to ${status}`,
    });
  } catch (error) {
    logger.error('Update report status error:', error);
    next(error);
  }
};

/**
 * @desc    Resolve delivery report
 * @route   POST /api/delivery-reports/:id/resolve
 * @access  Private/Shop/Admin
 */
export const resolveReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution, updateOrderStatus } = req.body;
    const userId = req.user._id;

    if (!resolution || resolution.trim().length === 0) {
      return next(new ErrorResponse('Resolution is required', 400));
    }

    const report = await DeliveryReport.findById(id)
      .populate('order', 'orderNumber status')
      .populate('customer', 'fullName email');

    if (!report) {
      return next(new ErrorResponse('Report not found', 404));
    }

    if (report.status === 'resolved') {
      return next(new ErrorResponse('Report is already resolved', 400));
    }

    // Resolve the report
    await report.resolve(userId, resolution);

    // Optionally update order status
    if (updateOrderStatus && report.order) {
      const order = await Order.findById(report.order._id);
      if (order) {
        // Change from under_investigation back to delivered_pending_confirmation or completed
        if (updateOrderStatus === 'completed') {
          order.status = 'completed';
          order.completedAt = new Date();
        } else if (updateOrderStatus === 'delivered_pending_confirmation') {
          order.status = 'delivered_pending_confirmation';
        }
        await order.save();
      }
    }

    // Send notification email to customer
    if (report.customer && report.customer.email) {
      const emailContent = `
        <h2>Your Delivery Issue Has Been Resolved</h2>
        <p>Dear ${report.customer.fullName},</p>
        <p>Your delivery issue for order #${report.order.orderNumber} has been resolved.</p>
        <p><strong>Resolution:</strong></p>
        <p>${resolution}</p>
        <p>Thank you for your patience.</p>
        <p>Best regards,<br>Kicks Shoes Support Team</p>
      `;
      await EmailService.sendEmail(
        report.customer.email,
        'Delivery Issue Resolved - Kicks Shoes',
        emailContent
      );
    }

    logger.info('Report resolved', {
      reportId: id,
      resolvedBy: userId,
    });

    res.status(200).json({
      success: true,
      data: report,
      message: 'Report resolved successfully',
    });
  } catch (error) {
    logger.error('Resolve report error:', error);
    next(error);
  }
};

/**
 * @desc    Reject delivery report
 * @route   POST /api/delivery-reports/:id/reject
 * @access  Private/Shop/Admin
 */
export const rejectReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    if (!reason || reason.trim().length === 0) {
      return next(new ErrorResponse('Rejection reason is required', 400));
    }

    const report = await DeliveryReport.findById(id)
      .populate('order', 'orderNumber')
      .populate('customer', 'fullName email');

    if (!report) {
      return next(new ErrorResponse('Report not found', 404));
    }

    if (report.status === 'rejected') {
      return next(new ErrorResponse('Report is already rejected', 400));
    }

    // Reject the report
    await report.reject(userId, reason);

    // Update order status back to delivered_pending_confirmation
    if (report.order) {
      const order = await Order.findById(report.order._id);
      if (order && order.status === 'under_investigation') {
        order.status = 'delivered_pending_confirmation';
        await order.save();
      }
    }

    // Send notification email to customer
    if (report.customer && report.customer.email) {
      const emailContent = `
        <h2>Delivery Issue Report Update</h2>
        <p>Dear ${report.customer.fullName},</p>
        <p>After careful review, your delivery issue report for order #${report.order.orderNumber} could not be validated.</p>
        <p><strong>Reason:</strong></p>
        <p>${reason}</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>Kicks Shoes Support Team</p>
      `;
      await EmailService.sendEmail(
        report.customer.email,
        'Delivery Issue Report Update - Kicks Shoes',
        emailContent
      );
    }

    logger.info('Report rejected', {
      reportId: id,
      rejectedBy: userId,
    });

    res.status(200).json({
      success: true,
      data: report,
      message: 'Report rejected',
    });
  } catch (error) {
    logger.error('Reject report error:', error);
    next(error);
  }
};

/**
 * @desc    Update report priority
 * @route   PATCH /api/delivery-reports/:id/priority
 * @access  Private/Shop/Admin
 */
export const updatePriority = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return next(new ErrorResponse('Invalid priority', 400));
    }

    const report = await DeliveryReport.findByIdAndUpdate(
      id,
      { priority },
      { new: true, runValidators: true }
    );

    if (!report) {
      return next(new ErrorResponse('Report not found', 404));
    }

    res.status(200).json({
      success: true,
      data: report,
      message: 'Priority updated',
    });
  } catch (error) {
    logger.error('Update priority error:', error);
    next(error);
  }
};

