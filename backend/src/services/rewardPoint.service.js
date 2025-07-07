/**
 * @fileoverview Reward Point Service
 * @created 2025-07-07
 * @file rewardPoint.service.js
 * @description This service handles reward point operations including automatic creation when orders are paid.
 */

import RewardPoint from '../models/RewardPoint.js';
import logger from '../utils/logger.js';

/**
 * Create reward points for a paid order
 * @param {Object} order - The order object
 * @returns {Promise<Object>} Created reward point record
 */
export const createRewardPointsForOrder = async order => {
  try {
    // Calculate reward points (1 point per 100 VND)
    const pointsEarned = Math.floor(order.totalPrice / 100);

    if (pointsEarned <= 0) {
      logger.info('No reward points earned for order', {
        orderId: order._id,
        totalPrice: order.totalPrice,
        pointsEarned: 0,
      });
      return null;
    }

    // Calculate expiry date (1 year from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const rewardPoint = await RewardPoint.create({
      user: order.user,
      points: pointsEarned,
      type: 'earn',
      order: order._id,
      description: `Reward points earned from order #${order.orderNumber}`,
      expiryDate: expiryDate,
      status: 'active',
    });

    logger.info('Reward points created successfully for order', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: order.user,
      pointsEarned: pointsEarned,
      rewardPointId: rewardPoint._id,
    });

    return rewardPoint;
  } catch (error) {
    logger.error('Error creating reward points for order:', {
      error: error.message,
      orderId: order._id,
      userId: order.user,
    });
    throw error;
  }
};

/**
 * Get user's total reward points
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Total points information
 */
export const getUserTotalPoints = async userId => {
  try {
    // Calculate total earned points
    const earnedPoints = await RewardPoint.aggregate([
      {
        $match: {
          user: userId,
          type: 'earn',
          status: 'active',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$points' },
        },
      },
    ]);

    // Calculate total redeemed points
    const redeemedPoints = await RewardPoint.aggregate([
      {
        $match: {
          user: userId,
          type: 'redeem',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$points' },
        },
      },
    ]);

    // Calculate total expired points
    const expiredPoints = await RewardPoint.aggregate([
      {
        $match: {
          user: userId,
          status: 'expired',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$points' },
        },
      },
    ]);

    const earned = earnedPoints[0]?.total || 0;
    const redeemed = redeemedPoints[0]?.total || 0;
    const expired = expiredPoints[0]?.total || 0;
    const available = earned - redeemed - expired;

    return {
      totalEarned: earned,
      totalRedeemed: redeemed,
      totalExpired: expired,
      availablePoints: Math.max(0, available),
    };
  } catch (error) {
    logger.error('Error calculating user total points:', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Check if order has already earned reward points
 * @param {string} orderId - Order ID
 * @returns {Promise<boolean>} True if reward points already exist
 */
export const hasOrderEarnedRewardPoints = async orderId => {
  try {
    const existingRewardPoint = await RewardPoint.findOne({
      order: orderId,
      type: 'earn',
    });

    return !!existingRewardPoint;
  } catch (error) {
    logger.error('Error checking if order has earned reward points:', {
      error: error.message,
      orderId,
    });
    return false;
  }
};
