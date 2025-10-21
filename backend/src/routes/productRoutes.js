/**
 * @fileoverview Updated Product Routes with Final Price Endpoint
 * @created 2025-06-08
 * @file productRoutes.js
 * @description Added route for manual final price recalculation
 */

import { Router } from 'express';
import multer from 'multer';
import {
  createManyProducts,
  createProduct,
  deleteProduct,
  getAllProducts,
  getMyReports,
  getNewDrops,
  getProductById,
  getRecommendProductsForProductDetails,
  recalculateFinalPrice,
  reportProduct,
  updateProduct,
  visualSearch,
} from '../controllers/productController.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/role.middleware.js';

const router = Router();

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

// Visual search route
router.post('/visual-search', upload.single('image'), visualSearch);

// Public routes
router.get('/', getAllProducts);
router.get('/new-drops', getNewDrops);
router.get('/recommend/:productId', getRecommendProductsForProductDetails);
// Note: /:id route moved after specific routes to avoid conflicts

// Private routes (admin/shop only)
router.post('/add', protect, requireRoles('admin', 'shop'), createProduct);
router.post('/create', protect, requireRoles('admin', 'shop'), createManyProducts);
router.post('/bulk', protect, requireRoles('admin', 'shop'), createManyProducts);
router.put('/:id', protect, requireRoles('admin', 'shop'), updateProduct);
router.delete('/:id/delete', protect, requireRoles('admin', 'shop'), deleteProduct);

// NEW: Route to manually recalculate final price
router.post(
  '/:id/recalculate-price',
  protect,
  requireRoles('admin', 'shop'),
  recalculateFinalPrice
);

// Other routes
router.get('/public/:id', getProductById);
router.get('/products', getAllProducts);
router.post('/:id/report', protect, reportProduct);
router.get('/reports/my', protect, getMyReports);

// Dynamic route for getting product by ID - must be last to avoid conflicts
router.get('/:id', getProductById);

export default router;
