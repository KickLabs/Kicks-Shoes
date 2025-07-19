import { validationResult } from 'express-validator';
import { FeedbackService } from '../services/feedback.service.js';
import logger from '../utils/logger.js';
import Feedback from '../models/Feedback.js';
import Report from '../models/Report.js';
/**
 * Create a new feedback
 * @route POST /api/feedback
 * @access Private
 */
export const createFeedback = async (req, res, next) => {
  try {
    const { order, product, rating, comment, images = [] } = req.body;
    const user = req.user.id;

    const feedback = await FeedbackService.createFeedback({
      user,
      order,
      product,
      rating,
      comment,
      images,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      data: feedback,
    });
  } catch (error) {
    console.log('Error creating feedback:', error); // Log lỗi nếu có

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(field => {
        errors[field] = {
          message: error.errors[field].message,
          value: error.errors[field].value,
        };
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Handle other specific errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product for this order',
        errors: {
          duplicate: {
            message: 'Duplicate review detected',
          },
        },
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create feedback',
    });
  }
};

/**
 * Update feedback by ID
 * @route PUT /api/feedback/:id
 * @access Private
 */
export const updateFeedback = async (req, res, next) => {
  try {
    const feedbackId = req.params.id;
    const updatedFeedback = await FeedbackService.updateFeedback(feedbackId, req.body);
    if (!updatedFeedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      data: updatedFeedback,
    });
  } catch (error) {
    logger.error('Error updating feedback', { error: error.message });

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(field => {
        errors[field] = {
          message: error.errors[field].message,
          value: error.errors[field].value,
        };
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete feedback by ID
 * @route DELETE /api/feedback/:id
 * @access Private
 */
export const deleteFeedback = async (req, res, next) => {
  try {
    const feedbackId = req.params.id;
    const deletedFeedback = await FeedbackService.deleteFeedback(feedbackId);
    if (!deletedFeedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    // Send notification emails
    try {
      const User = (await import('../models/User.js')).default;
      const { sendTemplatedEmail } = await import('../utils/sendEmail.js');

      // Populate the feedback with user and product details
      const feedback = await Feedback.findById(feedbackId).populate('user').populate('product');
      const shopUser = await User.findOne({ role: 'shop' });

      // Check if there's a pending report for this feedback
      const Report = (await import('../models/Report.js')).default;
      const pendingReport = await Report.findOne({
        targetType: 'review',
        targetId: feedbackId,
        status: 'pending',
      });

      // Email to shop about review deletion
      if (shopUser && shopUser.email && feedback?.product) {
        await sendTemplatedEmail({
          email: shopUser.email,
          templateType: 'REVIEW_DELETED_SHOP',
          templateData: {
            shopName: shopUser.fullName || 'Shop',
            productName: feedback.product.name,
            userName: feedback.user?.fullName || feedback.user?.email || 'User',
            adminNote: 'Review deleted by user',
            resolution: 'Review Deleted',
          },
        });
      }

      // Email to user about their review deletion
      if (feedback?.user?.email) {
        await sendTemplatedEmail({
          email: feedback.user.email,
          templateType: 'REVIEW_DELETED',
          templateData: {
            userName: feedback.user.fullName || feedback.user.email,
            productName: feedback.product?.name || 'Product',
            adminNote: 'Review deleted by user',
            resolution: 'Review Deleted',
          },
        });
      }

      // Email to reporter if there's a pending report
      if (pendingReport) {
        const reporterUser = await User.findById(pendingReport.reporter);
        if (reporterUser && reporterUser.email) {
          await sendTemplatedEmail({
            email: reporterUser.email,
            templateType: 'REPORT_RESOLVED',
            templateData: {
              userName: reporterUser.fullName || reporterUser.email,
              targetName: feedback?.product?.name || 'Product Review',
              adminNote: 'Review deleted by user',
              resolution: 'Review Deleted',
              reportReason: pendingReport.reason,
              reportDescription: pendingReport.description,
            },
          });
        }

        // Update report status
        pendingReport.status = 'resolved';
        pendingReport.resolution = 'delete_comment';
        pendingReport.resolvedBy = req.user.id;
        pendingReport.resolvedAt = new Date();
        await pendingReport.save();
      }
    } catch (emailError) {
      console.error('Error sending notification emails:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting feedback', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all feedbacks with optional filtering by order and product
 * @route GET /api/feedback
 * @access Public
 */
export const getAllFeedback = async (req, res) => {
  try {
    const { order, product, user } = req.query;
    const filter = {};

    if (order) {
      filter.order = order;
    }

    if (product) {
      filter.product = product;
    }

    if (user) {
      filter.user = user;
    }

    // Only show active feedbacks (status = true) for shop dashboard
    filter.status = true;

    logger.info('Filter criteria applied', { filter }); // Log filter criteria for debugging

    const feedbacks = await Feedback.find(filter).populate('user', 'fullName avatar').exec();

    res.status(200).json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all feedbacks including deleted ones (for order details)
 * @route GET /api/feedback/all-including-deleted
 * @desc Get all feedbacks including deleted ones for order details display
 * @access Private
 */
export const getAllFeedbackIncludingDeleted = async (req, res) => {
  try {
    const { order, product } = req.query;
    const filter = {};

    if (order) {
      filter.order = order;
    }

    if (product) {
      filter.product = product;
    }

    // Include all feedbacks (both active and deleted) for order details
    // No status filter to show deleted feedbacks for UI display

    logger.info('Filter criteria applied (including deleted)', { filter });

    const feedbacks = await Feedback.find(filter).populate('user', 'fullName avatar').exec();

    res.status(200).json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    console.error('Error fetching feedbacks (including deleted):', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Report a feedback
 * @route POST /api/feedback/:id/report
 * @desc Report a feedback
 * @access Private
 */
export const reportFeedback = async (req, res, next) => {
  try {
    const feedbackId = req.params.id;
    const { reason, description, evidence } = req.body; // Nhận lý do báo cáo và mô tả từ request body

    const feedback = await Feedback.findById(feedbackId).populate('user').populate('product');
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    const report = new Report({
      reporter: req.user.id,
      targetType: 'review',
      targetId: feedbackId,
      reason,
      description,
      evidence,
    });

    await report.save();

    // Send notification emails
    try {
      const User = (await import('../models/User.js')).default;
      const { sendTemplatedEmail } = await import('../utils/sendEmail.js');

      const shopUser = await User.findOne({ role: 'shop' });
      const reporterUser = await User.findById(req.user.id);

      // Email to shop about review report
      if (shopUser && shopUser.email && feedback.product) {
        await sendTemplatedEmail({
          email: shopUser.email,
          templateType: 'REVIEW_REPORTED',
          templateData: {
            shopName: shopUser.fullName || 'Shop',
            productName: feedback.product.name,
            userName: feedback.user?.fullName || feedback.user?.email || 'User',
            reporterName: reporterUser?.fullName || reporterUser?.email || 'User',
            reason,
            description,
          },
        });
      }

      // Email to reporter confirming report
      if (reporterUser && reporterUser.email && feedback.product) {
        await sendTemplatedEmail({
          email: reporterUser.email,
          templateType: 'REVIEW_REPORT_SUBMITTED',
          templateData: {
            userName: reporterUser.fullName || reporterUser.email,
            productName: feedback.product.name,
            reason,
            description,
          },
        });
      }
    } catch (emailError) {
      console.error('Error sending notification emails:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Feedback reported successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Approve or Delete Reported Feedback
 * @route PUT /api/feedback/:id/approve
 * @route DELETE /api/feedback/:id/delete
 * @desc Admin approve or delete the reported feedback
 * @access Private/Admin
 */
export const adminApproveFeedback = async (req, res, next) => {
  try {
    const feedbackId = req.params.id;
    const feedback = await Feedback.findById(feedbackId);

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    const report = await Report.findOne({
      targetId: feedbackId,
      targetType: 'review',
      status: 'pending',
    });

    if (!report) {
      return res
        .status(400)
        .json({ success: false, message: 'No pending report found for this feedback' });
    }

    if (req.method === 'PUT') {
      feedback.status = 'approved';
      feedback.isVerified = true;
      await feedback.save();

      report.status = 'resolved';
      report.resolution = 'no_action';
      report.resolvedBy = req.user.id;
      report.resolvedAt = new Date();
      await report.save();

      return res.status(200).json({
        success: true,
        message: 'Feedback approved and report resolved',
        data: feedback,
      });
    }

    if (req.method === 'DELETE') {
      // Soft delete: set status to false
      await Feedback.findByIdAndUpdate(feedbackId, { status: false });

      report.status = 'resolved';
      report.resolution = 'ban';
      report.resolvedBy = req.user.id;
      report.resolvedAt = new Date();
      await report.save();

      // Send notification emails
      try {
        const User = (await import('../models/User.js')).default;
        const { sendTemplatedEmail } = await import('../utils/sendEmail.js');

        const feedback = await Feedback.findById(feedbackId).populate('user').populate('product');
        const shopUser = await User.findOne({ role: 'shop' });

        // Email to review author about deletion
        if (feedback?.user?.email) {
          await sendTemplatedEmail({
            email: feedback.user.email,
            templateType: 'REVIEW_DELETED',
            templateData: {
              userName: feedback.user.fullName || feedback.user.email,
              productName: feedback.product?.name || 'Product',
              adminNote: 'Review deleted by admin due to policy violation',
              resolution: 'Review Deleted',
            },
          });
        }

        // Email to shop about review deletion
        if (shopUser && shopUser.email && feedback?.product) {
          await sendTemplatedEmail({
            email: shopUser.email,
            templateType: 'REVIEW_DELETED_SHOP',
            templateData: {
              shopName: shopUser.fullName || 'Shop',
              productName: feedback.product.name,
              userName: feedback.user?.fullName || feedback.user?.email || 'User',
              adminNote: 'Review deleted by admin due to policy violation',
              resolution: 'Review Deleted',
            },
          });
        }

        // Email to reporter about report resolution
        const reporterUser = await User.findById(report.reporter);
        if (reporterUser && reporterUser.email) {
          await sendTemplatedEmail({
            email: reporterUser.email,
            templateType: 'REPORT_RESOLVED',
            templateData: {
              userName: reporterUser.fullName || reporterUser.email,
              targetName: feedback?.product?.name || 'Product Review',
              adminNote: 'Review deleted by admin due to policy violation',
              resolution: 'Review Deleted',
              reportReason: report.reason,
              reportDescription: report.description,
            },
          });
        }
      } catch (emailError) {
        console.error('Error sending notification emails:', emailError);
        // Don't fail the request if email fails
      }

      return res.status(200).json({
        success: true,
        message: 'Feedback deleted and report resolved',
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getFeedback = async (req, res, next) => {
  try {
    const user = req.user.id;
    const { order, product } = req.query;
    let fb = await FeedbackService.findOne({ user, order, product });
    if (fb) {
      fb = await fb.populate('user', 'fullName avatar');
    }
    return res.json({ success: true, data: fb || null });
  } catch (err) {
    return next(err);
  }
};

export const getFeedbackById = async (req, res, next) => {
  try {
    const feedbackId = req.params.id;
    const feedback = await Feedback.findById(feedbackId).populate('user', 'fullName avatar');
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error('Error fetching feedback by ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
