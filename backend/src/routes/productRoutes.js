/**
 * @fileoverview Product Routes
 * @created 2025-06-08
 * @file productRoutes.js
 * @description This file defines the routes for the product-related endpoints in the Kicks Shoes application.
 * It uses the productController to handle the business logic for each route.
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
} from '../controllers/productController.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/role.middleware.js';

const router = Router();

// Public routes
/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', getAllProducts);

/**
 * @route   GET /api/products/new-drops
 * @desc    Get new drops
 * @access  Public
 */
router.get('/new-drops', getNewDrops);

/**
 * @route   GET /api/products/recommend
 * @desc    Get recommend products
 * @access  Public
 */
router.get('/recommend/:productId', getRecommendProductsForProductDetails);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', getProductById);

// Private routes (admin/shop only)
/**
 * @route   POST /api/products/add
 * @desc    Create a new product
 * @access  Private
 */
router.post('/add', protect, requireRoles('admin', 'shop'), createProduct);

/**
 * @route   POST /api/products/create
 * @desc    Create multiple products
 * @access  Private
 */
router.post('/create', protect, requireRoles('admin', 'shop'), createManyProducts);

/**
 * @route   POST /api/products/bulk
 * @desc    Create multiple products
 * @access  Private
 */
router.post('/bulk', protect, requireRoles('admin', 'shop'), createManyProducts);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product by ID
 * @access  Private
 */
router.put('/:id', protect, requireRoles('admin', 'shop'), updateProduct);

/**
 * @route   DELETE /api/products/:id/delete
 * @desc    Delete product by ID
 * @access  Private
 */
router.delete('/:id/delete', protect, requireRoles('admin', 'shop'), deleteProduct);

/**
 * @route   GET /api/products/public/:id
 * @desc    Get product by ID (public alias)
 * @access  Public
 */
router.get('/public/:id', getProductById);
router.get('/products', getAllProducts);

/**
 * @route   POST /api/products/:id/report
 * @desc    Report a product
 * @access  Private (user)
 */
router.post('/:id/report', protect, reportProduct);

/**
 * @route   GET /api/reports/my
 * @desc    Get user's reports
 * @access  Private
 */
router.get('/reports/my', protect, getMyReports);

export default router;
