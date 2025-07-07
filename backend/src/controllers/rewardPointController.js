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

export {
  createRewardPoint,
  getUserRewardPoints,
  getUserTotalPointsController as getUserTotalPoints,
};
