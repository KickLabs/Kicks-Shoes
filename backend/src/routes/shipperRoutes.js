/**
 * @fileoverview Shipper Routes
 * @created 2025-10-21
 * @file shipperRoutes.js
 * @description This file defines the routes for shipper-related endpoints.
 */

import { Router } from 'express';
import {
  getAssignedOrders,
  getDeliveryByOrderId,
  updateDeliveryStatus,
  getDeliveryHistory,
  uploadProof,
  getShipperStats,
} from '../controllers/shipperController.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requireExactRole } from '../middlewares/role.middleware.js';

const router = Router();

// Shipper routes
/**
 * @route   GET /api/shipper/orders
 * @desc    Get orders assigned to current shipper
 * @access  Private/Shipper
 */
router.get('/orders', protect, requireExactRole('shipper'), getAssignedOrders);

/**
 * @route   GET /api/shipper/delivery/:orderId
 * @desc    Get delivery details by order ID
 * @access  Private/Shipper
 */
router.get('/delivery/:orderId', protect, requireExactRole('shipper'), getDeliveryByOrderId);

/**
 * @route   PUT /api/shipper/delivery/:orderId/status
 * @desc    Update delivery status
 * @access  Private/Shipper
 */
router.put('/delivery/:orderId/status', protect, requireExactRole('shipper'), updateDeliveryStatus);

/**
 * @route   GET /api/shipper/history
 * @desc    Get delivery history for current shipper
 * @access  Private/Shipper
 */
router.get('/history', protect, requireExactRole('shipper'), getDeliveryHistory);

/**
 * @route   POST /api/shipper/delivery/:orderId/proof
 * @desc    Upload proof of delivery
 * @access  Private/Shipper
 */
router.post('/delivery/:orderId/proof', protect, requireExactRole('shipper'), uploadProof);

/**
 * @route   GET /api/shipper/stats
 * @desc    Get shipper dashboard statistics
 * @access  Private/Shipper
 */
router.get('/stats', protect, requireExactRole('shipper'), getShipperStats);

export default router;

