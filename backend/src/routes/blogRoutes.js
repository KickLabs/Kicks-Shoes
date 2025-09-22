import express from 'express';
import {
  createBlog,
  getBlog,
  listBlogs,
  updateBlog,
  deleteBlog,
  setPublishStatus,
  toggleFeatured,
  incrementViews,
  setLike,
} from '../controllers/blogController.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

// Public
router.get('/', listBlogs);
router.get('/:idOrSlug', getBlog);
router.post('/:id/views', incrementViews);
router.post('/:id/like', protect, setLike);

// Admin/Shop
router.post('/', protect, requireRoles('admin', 'shop'), createBlog);
router.put('/:id', protect, requireRoles('admin', 'shop'), updateBlog);
router.delete('/:id', protect, requireRoles('admin', 'shop'), deleteBlog);
router.post('/:id/publish', protect, requireRoles('admin', 'shop'), setPublishStatus);
router.post('/:id/feature', protect, requireRoles('admin', 'shop'), toggleFeatured);

export default router;
