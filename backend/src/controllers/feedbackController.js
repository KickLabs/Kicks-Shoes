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
    res.status(500).json({ success: false, message: error.message });
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
    const { order, product } = req.query;
    const filter = {};

    if (order) {
      filter.order = order;
    }

    if (product) {
      filter.product = product;
    }

    console.log('Filter criteria:', filter); // Debug: Kiểm tra điều kiện lọc

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
 * Report a feedback
 * @route POST /api/feedback/:id/report
 * @desc Report a feedback
 * @access Private
 */
export const reportFeedback = async (req, res, next) => {
  try {
    const feedbackId = req.params.id;
    const { reason, description, evidence } = req.body; // Nhận lý do báo cáo và mô tả từ request body

    const feedback = await Feedback.findById(feedbackId);
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
      await feedback.deleteOne();

      report.status = 'resolved';
      report.resolution = 'ban';
      report.resolvedBy = req.user.id;
      report.resolvedAt = new Date();
      await report.save();

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
