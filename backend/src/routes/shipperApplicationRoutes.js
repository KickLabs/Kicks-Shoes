/**
 * @fileoverview Shipper Application Routes
 * @created 2025-10-22
 * @file shipperApplicationRoutes.js
 */

import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { requireRoles, requireExactRole } from '../middlewares/role.middleware.js';
import {
  createApplication,
  getAllApplications,
  getApplicationById,
  getMyApplications,
  approveApplication,
  rejectApplication,
  getApplicationStats,
} from '../controllers/shipperApplicationController.js';

const router = Router();

/**
 * @route   POST /api/shipper-applications
 * @desc    Create a new shipper application
 * @access  Private/Customer
 */
router.post('/', protect, requireExactRole('customer'), createApplication);

/**
 * @route   GET /api/shipper-applications/my-applications
 * @desc    Get current user's applications
 * @access  Private/Customer
 */
router.get('/my-applications', protect, getMyApplications);

/**
 * @route   GET /api/shipper-applications/stats
 * @desc    Get application statistics
 * @access  Private/Shop/Admin
 */
router.get('/stats', protect, requireRoles('shop', 'admin'), getApplicationStats);

/**
 * @route   GET /api/shipper-applications
 * @desc    Get all shipper applications
 * @access  Private/Shop/Admin
 */
router.get('/', protect, requireRoles('shop', 'admin'), getAllApplications);

/**
 * @route   GET /api/shipper-applications/:id
 * @desc    Get application by ID
 * @access  Private/Shop/Admin
 */
router.get('/:id', protect, requireRoles('shop', 'admin'), getApplicationById);

/**
 * @route   POST /api/shipper-applications/:id/approve
 * @desc    Approve shipper application
 * @access  Private/Shop/Admin
 */
router.post('/:id/approve', protect, requireRoles('shop', 'admin'), approveApplication);

/**
 * @route   POST /api/shipper-applications/:id/reject
 * @desc    Reject shipper application
 * @access  Private/Shop/Admin
 */
router.post('/:id/reject', protect, requireRoles('shop', 'admin'), rejectApplication);

export default router;

