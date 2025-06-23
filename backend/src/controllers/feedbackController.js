/**
 * @fileoverview Feedback Controller
 * @created 2025-06-22
 * @file feedbackController.js
 * @description This controller handles admin operations on feedback, such as approving or rejecting user feedback on products.
 */

import Feedback from '../models/Feedback.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';

/**
 * Resolve feedback by updating its status
 * @route PATCH /api/feedbacks/:id/status
 * @access Admin
 */
export const resolveFeedbackStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const feedbackId = req.params.id;

    // Validate input status
    const validStatuses = ['approved', 'rejected', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const feedback = await Feedback.findById(feedbackId);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.status = status;
    feedback.isVerified = status === 'approved'; // sync with status

    await feedback.save();

    res.json({
      message: `Feedback has been marked as ${status}`,
      status: feedback.status,
      isVerified: feedback.isVerified,
    });
  } catch (error) {
    logger.error('Error in resolveFeedbackStatus', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Get all feedbacks (with optional filtering and pagination)
 * @route GET /api/feedbacks
 * @access Admin
 */
export const getAllFeedbacks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status && ['approved', 'pending', 'rejected'].includes(status)) {
      query.status = status;
    }

    const total = await Feedback.countDocuments(query);

    const feedbacks = await Feedback.find(query)
      .populate('user', 'username email')
      .populate('product', 'name price')
      .populate('order', 'orderCode createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: feedbacks,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error('Error in getAllFeedbacks', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};
