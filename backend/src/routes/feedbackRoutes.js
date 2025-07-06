import { Router } from 'express';
import {
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getAllFeedback,
  reportFeedback,
  adminApproveFeedback,
  getFeedback,
  getFeedbackById,
} from '../controllers/feedbackController.js';
import { protect } from '../middlewares/auth.middleware.js';
import { checkFeedbackOwner } from '../middlewares/feedback.middleware.js'; // Middleware để kiểm tra feedback của chính người dùng
import { requireRoles } from '../middlewares/role.middleware.js';
import upload from '../middlewares/upload.middleware.js';

const router = Router();
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // Multer + Cloudinary đã gán URL vào req.file.path
  res.json({ url: req.file.path });
});
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

/**
 * @route   POST /api/feedback
 * @desc    Other can report feedback
 * @access  Private/Customer
 */
router.post('/:id/report', protect, reportFeedback);
router.put('/:id/approve', protect, requireRoles('admin'), adminApproveFeedback); // Admin duyệt feedback
router.delete('/:id/delete', protect, requireRoles('admin'), adminApproveFeedback); // Admin xóa feedback
router.get('/feedback', getFeedback);
router.get('/:id', getFeedbackById);
export default router;
