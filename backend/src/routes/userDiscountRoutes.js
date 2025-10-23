/**
 * @fileoverview UserDiscount Routes
 * @created 2024-12-19
 * @file userDiscountRoutes.js
 * @description This file defines the routes for user discount collection and management.
 */

import express from 'express';
import {
  getUserDiscounts,
  collectDiscount,
  useDiscount,
  getAvailableDiscounts,
  validateDiscount,
} from '../controllers/userDiscountController.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/user-discounts
// @desc    Get user's collected discounts
// @access  Private
router.get('/', getUserDiscounts);

// @route   POST /api/user-discounts/collect
// @desc    Collect a discount for user
// @access  Private
router.post('/collect', collectDiscount);

// @route   POST /api/user-discounts/:id/use
// @desc    Use a discount
// @access  Private
router.post('/:id/use', useDiscount);

// @route   GET /api/user-discounts/available
// @desc    Get available discounts for collection
// @access  Private
router.get('/available', getAvailableDiscounts);

// @route   POST /api/user-discounts/validate
// @desc    Validate discount for order
// @access  Private
router.post('/validate', validateDiscount);

export default router;
