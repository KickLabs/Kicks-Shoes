/**
 * @fileoverview Delivery Report Routes
 * @created 2025-10-21
 * @file deliveryReportRoutes.js
 * @description Routes for delivery report management
 */

import { Router } from 'express';
import {
  getAllReports,
  getReportById,
  getReportStats,
  updateReportStatus,
  resolveReport,
  rejectReport,
  updatePriority,
} from '../controllers/deliveryReportController.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/role.middleware.js';

const router = Router();

// All routes require authentication and shop/admin role
router.use(protect);
router.use(requireRoles('shop', 'admin'));

/**
 * @route   GET /api/delivery-reports/stats
 * @desc    Get delivery report statistics
 * @access  Private/Shop/Admin
 */
router.get('/stats', getReportStats);

/**
 * @route   GET /api/delivery-reports
 * @desc    Get all delivery reports with filtering
 * @access  Private/Shop/Admin
 */
router.get('/', getAllReports);

/**
 * @route   GET /api/delivery-reports/:id
 * @desc    Get delivery report by ID
 * @access  Private/Shop/Admin
 */
router.get('/:id', getReportById);

/**
 * @route   PATCH /api/delivery-reports/:id/status
 * @desc    Update report status
 * @access  Private/Shop/Admin
 */
router.patch('/:id/status', updateReportStatus);

/**
 * @route   PATCH /api/delivery-reports/:id/priority
 * @desc    Update report priority
 * @access  Private/Shop/Admin
 */
router.patch('/:id/priority', updatePriority);

/**
 * @route   POST /api/delivery-reports/:id/resolve
 * @desc    Resolve delivery report
 * @access  Private/Shop/Admin
 */
router.post('/:id/resolve', resolveReport);

/**
 * @route   POST /api/delivery-reports/:id/reject
 * @desc    Reject delivery report
 * @access  Private/Shop/Admin
 */
router.post('/:id/reject', rejectReport);

export default router;

