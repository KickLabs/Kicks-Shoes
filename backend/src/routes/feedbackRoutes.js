import { Router } from 'express';
import {
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getAllFeedback,
} from '../controllers/feedbackController.js';
import { protect } from '../middlewares/auth.middleware.js';
import { checkFeedbackOwner } from '../middlewares/feedback.middleware.js'; // Middleware để kiểm tra feedback của chính người dùng

const router = Router();

/**
 * @route   POST /api/feedback
 * @desc    Create new feedback
 * @access  Private/Customer
 */
router.post('/', protect, createFeedback); // Tạo feedback mới

/**
 * @route   PUT /api/feedback/:id
 * @desc    Update feedback by ID
 * @access  Private/Customer
 */
router.put('/:id', protect, checkFeedbackOwner, updateFeedback); // Cập nhật feedback của chính người dùng

/**
 * @route   DELETE /api/feedback/:id
 * @desc    Delete feedback by ID
 * @access  Private/Customer
 */
router.delete('/:id', protect, checkFeedbackOwner, deleteFeedback); // Xóa feedback của chính người dùng

/**
 * @route   GET /api/feedback
 * @desc    Get all feedback with optional filters by order and product
 * @access  Public
 */
router.get('/', getAllFeedback);

export default router;
