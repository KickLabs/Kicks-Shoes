/**
 * @fileoverview Reward Point Controller
 * @created 2024-03-15
 * @file rewardPointController.js
 * @description This controller handles all reward point-related HTTP requests.
 */

import { body, validationResult } from 'express-validator';
import RewardPoint from '../models/RewardPoint.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import { getUserTotalPoints } from '../services/rewardPoint.service.js';
import Discount from '../models/Discount.js';
import EmailService from '../services/email.service.js';
import User from '../models/User.js';

// Validation rules
const rewardPointValidationRules = {
  create: [
    body('user').isMongoId().withMessage('Invalid user ID'),
    body('points').isInt({ min: 0 }).withMessage('Points must be a positive number'),
    body('type').isIn(['earn', 'redeem', 'expired', 'adjust']).withMessage('Invalid type'),
    body('order').optional().isMongoId().withMessage('Invalid order ID'),
    body('description').notEmpty().withMessage('Description is required'),
    body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date'),
  ],
  redeem: [
    body('points').isInt({ min: 10 }).withMessage('Minimum 10 points required'),
    body('discountAmount')
      .isInt({ min: 10000 })
      .withMessage('Minimum discount amount is 10,000 VND'),
    body('description').optional().isString().withMessage('Description must be a string'),
  ],
};

// Middleware to validate request data
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Create a new reward point record
 * @route POST /api/reward-points
 * @access Private
 */
const createRewardPoint = [
  rewardPointValidationRules.create,
  validateRequest,
  async (req, res, next) => {
    try {
      const { user, points, type, order, description, expiryDate } = req.body;

      logger.info('Creating new reward point record', {
        userId: user,
        points,
        type,
      });

      const rewardPoint = await RewardPoint.create({
        user,
        points,
        type,
        order,
        description,
        expiryDate,
      });

      logger.info('Reward point record created successfully', {
        rewardPointId: rewardPoint._id,
      });

      res.status(201).json({
        success: true,
        data: rewardPoint,
      });
    } catch (error) {
      logger.error('Error creating reward point record:', error);
      next(error);
    }
  },
];

/**
 * Get all reward points for a user
 * @route GET /api/reward-points/user/:userId
 * @access Private
 */
const getUserRewardPoints = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, type, status } = req.query;

    const query = { user: userId };
    if (type) query.type = type;
    if (status) query.status = status;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: { path: 'order', select: 'orderNumber totalAmount' },
    };

    const rewardPoints = await RewardPoint.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(options.populate)
      .sort(options.sort);

    const total = await RewardPoint.countDocuments(query);

    res.status(200).json({
      success: true,
      data: rewardPoints,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        totalRecords: total,
      },
    });
  } catch (error) {
    logger.error('Error getting user reward points:', error);
    next(error);
  }
};

/**
 * Get user's total active reward points
 * @route GET /api/reward-points/user/:userId/total
 * @access Private
 */
const getUserTotalPointsController = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const totalPoints = await getUserTotalPoints(userId);

    res.status(200).json({
      success: true,
      data: totalPoints,
    });
  } catch (error) {
    logger.error('Error calculating user total points:', error);
    next(error);
  }
};

/**
 * Redeem points for discount
 * @route POST /api/reward-points/redeem
 * @access Private
 */
const redeemPoints = [
  rewardPointValidationRules.redeem,
  validateRequest,
  async (req, res, next) => {
    try {
      const { points, discountAmount, description } = req.body;
      const userId = req.user._id;

      logger.info('Redeeming points for discount', {
        userId,
        points,
        discountAmount,
      });

      // Check if user has enough points
      const userTotalPoints = await getUserTotalPoints(userId);
      if (userTotalPoints.availablePoints < points) {
        return res.status(400).json({
          success: false,
          message: 'Not enough points available',
        });
      }

      // Generate unique discount code
      const discountCode = `REWARD${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Create discount
      const discount = await Discount.create({
        code: discountCode,
        type: 'fixed',
        value: discountAmount,
        description:
          description ||
          `Redeemed ${points} points for ${discountAmount.toLocaleString()} VND discount`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        minPurchase: 0,
        usageLimit: 1,
        perUserLimit: 1,
        status: 'active',
        source: 'redeem',
      });

      // Create reward point record for redemption
      const rewardPoint = await RewardPoint.create({
        user: userId,
        points: -points, // Negative points for redemption
        type: 'redeem',
        description:
          description ||
          `Redeemed ${points} points for ${discountAmount.toLocaleString()} VND discount`,
        status: 'redeemed',
      });

      // Send email with discount information
      try {
        const user = await User.findById(userId);
        if (user) {
          await EmailService.sendDiscountCodeEmail(user, {
            code: discountCode,
            value: discountAmount,
            description: discount.description,
            startDate: discount.startDate,
            endDate: discount.endDate,
            points: points,
          });
        }
      } catch (emailError) {
        logger.error('Error sending discount code email:', emailError);
        // Don't fail the request if email fails
      }

      logger.info('Points redeemed successfully', {
        rewardPointId: rewardPoint._id,
        discountId: discount._id,
        discountCode,
      });

      res.status(201).json({
        success: true,
        data: {
          rewardPoint,
          discount: {
            code: discountCode,
            value: discountAmount,
            description: discount.description,
            startDate: discount.startDate,
            endDate: discount.endDate,
          },
        },
        message: 'Points redeemed successfully',
      });
    } catch (error) {
      logger.error('Error redeeming points:', error);
      next(error);
    }
  },
];

/**
 * Clean up test data from database
 * @route DELETE /api/reward-points/cleanup-test-data
 * @access Private (Admin)
 */
const cleanupTestData = async (req, res, next) => {
  try {
    // Delete all reward points with test descriptions
    const result = await RewardPoint.deleteMany({
      description: {
        $in: [
          'Reward points earned from order #ORD001',
          'Reward points earned from order #ORD002',
          'Points redeemed for discount',
          'Points expired',
        ],
      },
    });

    logger.info('Test data cleaned up successfully', {
      deletedCount: result.deletedCount,
    });

    res.status(200).json({
      success: true,
      message: `Cleaned up ${result.deletedCount} test records`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    logger.error('Error cleaning up test data:', error);
    next(error);
  }
};

export {
  createRewardPoint,
  getUserRewardPoints,
  getUserTotalPointsController as getUserTotalPoints,
  redeemPoints,
  cleanupTestData,
};
