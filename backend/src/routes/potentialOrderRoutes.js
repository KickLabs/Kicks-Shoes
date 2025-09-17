/**
 * @fileoverview Potential Order Routes
 * @created 2025-01-15
 * @file potentialOrderRoutes.js
 * @description Routes for managing potential orders detected from livestream chats
 */

import express from 'express';
import {
  getPotentialOrdersForStream,
  getMyPotentialOrders,
  getPotentialOrder,
  updateOrderStatus,
  markAsViewed,
  addNote,
  getOrderStats,
  deletePotentialOrder,
  getMyPotentialOrdersGrouped,
  exportPotentialOrders,
  exportPotentialOrdersForStream,
} from '../controllers/potentialOrderController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all routes except stream route (for debugging)
router.use((req, res, next) => {
  if (req.path.startsWith('/stream/')) {
    return next(); // Skip auth for stream routes temporarily
  }
  return protect(req, res, next);
});

// Get order statistics for current host
router.get('/stats', authorize('shop', 'admin'), getOrderStats);

// Get all potential orders (for management dashboard)
router.get('/', authorize('shop', 'admin'), getMyPotentialOrders);

// Get potential orders for current user (host)
router.get('/my-orders', authorize('shop', 'admin'), getMyPotentialOrders);

// Get potential orders grouped by stream (host)
router.get('/grouped-by-stream', authorize('shop', 'admin'), getMyPotentialOrdersGrouped);

// Export potential orders to Excel (MUST be before /:id route)
router.get('/export', authorize('shop', 'admin'), exportPotentialOrders);

// Get potential orders for a specific stream (skip auth for debugging)
router.get('/stream/:streamId', getPotentialOrdersForStream);

// Export potential orders for a specific stream to Excel
router.get('/stream/:streamId/export', authorize('shop', 'admin'), exportPotentialOrdersForStream);

// Get single potential order
router.get('/:id', authorize('shop', 'admin'), getPotentialOrder);

// Update order status
router.put('/:id/status', authorize('shop', 'admin'), updateOrderStatus);

// Mark order as viewed
router.put('/:id/viewed', authorize('shop', 'admin'), markAsViewed);

// Add note to order
router.put('/:id/notes', authorize('shop', 'admin'), addNote);

// Delete order (mark as spam)
router.delete('/:id', authorize('shop', 'admin'), deletePotentialOrder);

export default router;
