/**
 * @fileoverview AI Inventory Routes
 * @created 2025-10-28
 * @file aiInventoryRoutes.js
 */

import express from 'express';
import {
  runInventoryAnalysis,
  analyzeProduct,
  getInventoryDashboard,
  createAutoSale,
  getRecommendation,
} from '../controllers/aiInventoryController.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

// Protect all routes - primarily for shop role (admin also has access)
router.use(protect);
router.use(requireRoles('shop', 'admin')); // Shop first - this is mainly for shop owners

// Dashboard overview
router.get('/dashboard', getInventoryDashboard);

// Run full analysis
router.post('/analyze', runInventoryAnalysis);

// Analyze specific product
router.get('/product/:id', analyzeProduct);

// Get AI recommendation for product
router.get('/recommend/:productId', getRecommendation);

// Create auto flash sale
router.post('/auto-sale/:productId', createAutoSale);

export default router;
