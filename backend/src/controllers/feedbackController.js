import { validationResult } from 'express-validator';
import { FeedbackService } from '../services/feedback.service.js';
import logger from '../utils/logger.js';

/**
 * Create a new feedback
 * @route POST /api/feedback
 * @access Private
 */
export const createFeedback = async (req, res, next) => {
  try {
    console.log('Received feedback data:', req.body); // Log dữ liệu gửi lên

    const feedbackData = {
      user: req.user.id, // Lấy thông tin người dùng từ token
      product: req.body.product,
      order: req.body.order,
      rating: req.body.rating,
      comment: req.body.comment,
      images: req.body.images || [],
    };

    const feedback = await FeedbackService.createFeedback(feedbackData);

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
    // Lấy các tham số từ query (order và product)
    const { order, product } = req.query;

    // Tạo đối tượng filter
    const filter = {};

    // Nếu có orderId trong query, thêm điều kiện lọc theo order
    if (order) {
      filter.order = order;
    }

    // Nếu có productId trong query, thêm điều kiện lọc theo product
    if (product) {
      filter.product = product;
    }

    console.log('Filter criteria:', filter); // Debug: Kiểm tra điều kiện lọc

    // Truy vấn dữ liệu feedback với điều kiện filter
    const feedbacks = await FeedbackService.getFeedbacks(filter);

    // Trả về kết quả
    res.status(200).json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
