/**
 * @fileoverview Flash Sale Routes
 * @created 2025-01-27
 * @file flashSaleRoutes.js
 * @description Định nghĩa các routes cho Flash Sale API
 */

import express from 'express';
import {
  getAllFlashSales,
  getFlashSaleById,
  getCurrentActiveFlashSale,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  updateFlashSaleStatus,
  getFlashSaleByProductId,
  getFlashSaleStats,
} from '../controllers/flashSaleController.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/role.middleware.js';
import {
  validateFlashSale,
  validateFlashSaleStatus,
  validateFlashSaleQuery,
  validateFlashSaleId,
  validateProductId,
} from '../utils/validation.js';

const router = express.Router();

// Public routes
router.get('/', validateFlashSaleQuery, getAllFlashSales);
router.get('/active/current', getCurrentActiveFlashSale);
router.get('/product/:productId', validateProductId, getFlashSaleByProductId);
router.get('/:id', validateFlashSaleId, getFlashSaleById);

// Admin routes (yêu cầu authentication và role admin)
router.use(protect);
router.use(requireRoles('admin'));

router.post('/', validateFlashSale, createFlashSale);
router.put('/:id', validateFlashSaleId, validateFlashSale, updateFlashSale);
router.delete('/:id', validateFlashSaleId, deleteFlashSale);
router.patch('/:id/status', validateFlashSaleId, validateFlashSaleStatus, updateFlashSaleStatus);
router.get('/stats/overview', getFlashSaleStats);

export default router;
