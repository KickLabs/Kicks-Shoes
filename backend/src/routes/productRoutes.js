/**
 * @fileoverview Updated Product Routes with Final Price Endpoint
 * @created 2025-06-08
 * @file productRoutes.js
 * @description Added route for manual final price recalculation
 */

import { Router } from 'express';
import {
  createManyProducts,
  createProduct,
  deleteProduct,
  getAllProducts,
  getNewDrops,
  getProductById,
  getRecommendProductsForProductDetails,
  updateProduct,
  reportProduct,
  getMyReports,
  recalculateFinalPrice, // NEW: Import the new function
} from '../controllers/productController.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/role.middleware.js';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/new-drops', getNewDrops);
router.get('/recommend/:productId', getRecommendProductsForProductDetails);
router.get('/:id', getProductById);

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

export default router;
