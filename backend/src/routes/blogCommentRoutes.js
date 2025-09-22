import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/role.middleware.js';
import {
  createComment,
  listComments,
  updateComment,
  deleteComment,
  setCommentLike,
} from '../controllers/blogCommentController.js';

const router = express.Router({ mergeParams: true });

// Public list
router.get('/:blogId', listComments);

// Authenticated actions
router.post('/', protect, createComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, setCommentLike);

export default router;
