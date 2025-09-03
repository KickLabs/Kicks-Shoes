/**
 * @fileoverview LiveStream Routes
 * @created 2025-01-02
 * @file livestreamRoutes.js
 * @description Routes for livestream functionality
 */

import express from 'express';
import { body } from 'express-validator';
import {
  createLiveStream,
  getLiveStream,
  getActiveLiveStreams,
  getUpcomingLiveStreams,
  getAllLiveStreams,
  getMyLiveStreams,
  updateLiveStream,
  endLiveStream,
  deleteLiveStream,
  getChatMessages,
  addFeaturedProduct,
  removeFeaturedProduct,
  getLiveStreamAnalytics,
} from '../controllers/livestreamController.js';
import { authorize } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

// Validation rules
const createLiveStreamValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('scheduledAt').optional().isISO8601().withMessage('Scheduled time must be a valid date'),
  body('settings.maxViewers')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max viewers must be between 1 and 100'),
  body('settings.allowChat').optional().isBoolean().withMessage('Allow chat must be a boolean'),
  body('settings.isPublic').optional().isBoolean().withMessage('Is public must be a boolean'),
  body('settings.recordStream')
    .optional()
    .isBoolean()
    .withMessage('Record stream must be a boolean'),
];

const updateLiveStreamValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('scheduledAt').optional().isISO8601().withMessage('Scheduled time must be a valid date'),
  body('settings.maxViewers')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max viewers must be between 1 and 100'),
];

const addFeaturedProductValidation = [
  body('productId').isMongoId().withMessage('Product ID must be a valid MongoDB ObjectId'),
];

// Public routes (specific routes first)
router.get('/active', getActiveLiveStreams);
router.get('/upcoming', getUpcomingLiveStreams);

// Protected routes - require authentication (specific routes before parameterized)
router.get('/my-streams', authorize, requireRoles('shop', 'admin'), getMyLiveStreams);
router.get('/all', authorize, requireRoles('shop', 'admin'), getAllLiveStreams);

// Public parameterized routes (must come after specific routes)
router.get('/:roomId', getLiveStream);
router.get('/:roomId/chat', getChatMessages);
router.post(
  '/',
  authorize,
  requireRoles('shop', 'admin'),
  createLiveStreamValidation,
  createLiveStream
);

router.put(
  '/:roomId',
  authorize,
  requireRoles('shop', 'admin'),
  updateLiveStreamValidation,
  updateLiveStream
);

router.post('/:roomId/end', authorize, requireRoles('shop', 'admin'), endLiveStream);

router.delete('/:roomId', authorize, requireRoles('shop', 'admin'), deleteLiveStream);

router.post(
  '/:roomId/feature-product',
  authorize,
  requireRoles('shop', 'admin'),
  addFeaturedProductValidation,
  addFeaturedProduct
);

router.delete(
  '/:roomId/feature-product/:productId',
  authorize,
  requireRoles('shop', 'admin'),
  removeFeaturedProduct
);

router.get('/:roomId/analytics', authorize, requireRoles('shop', 'admin'), getLiveStreamAnalytics);

export default router;
