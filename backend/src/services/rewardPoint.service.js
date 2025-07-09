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
    // Lấy tổng tiền thực tế
    let totalPrice = order.totalPrice;
    if (typeof totalPrice !== 'number' || isNaN(totalPrice) || totalPrice <= 0) {
      // Fallback nếu thiếu
      totalPrice =
        (order.subtotal || 0) +
        (order.shippingCost || 0) +
        (order.tax || 0) -
        (order.discount || 0);
      if (totalPrice <= 0) {
        logger.error('[REWARD] Không thể xác định tổng tiền để cộng điểm cho order:', {
          orderId: order._id,
          user: order.user,
          totalPrice: order.totalPrice,
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          tax: order.tax,
          discount: order.discount,
        });
        console.error('[REWARD] Không thể xác định tổng tiền để cộng điểm cho order:', order._id);
        return null;
      }
    }
    console.log('[REWARD] createRewardPointsForOrder input:', {
      orderId: order._id,
      user: order.user,
      totalPrice,
    });
    // Calculate reward points (100 points per 1 million VND = 1 point per 10,000 VND)
    const pointsEarned = Math.floor(totalPrice / 10000);

    if (pointsEarned <= 0) {
      logger.info('No reward points earned for order', {
        orderId: order._id,
        totalPrice,
        pointsEarned: 0,
      });
      console.log('[REWARD] Không có điểm để cộng (pointsEarned <= 0) cho order:', order._id);
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
    console.log('[REWARD] Đã tạo rewardPoint:', rewardPoint);
    return rewardPoint;
  } catch (error) {
    logger.error('Error creating reward points for order:', {
      error: error.message,
      orderId: order._id,
      userId: order.user,
    });
    console.error('[REWARD] Lỗi khi tạo rewardPoint:', error);
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
    const mongoose = await import('mongoose');
    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Calculate total earned points (type: earn, status: active)
    const earnedPoints = await RewardPoint.aggregate([
      {
        $match: {
          user: userIdObj,
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

    // Calculate total redeemed points (type: redeem) - use absolute value since points are negative
    const redeemedPoints = await RewardPoint.aggregate([
      {
        $match: {
          user: userIdObj,
          type: 'redeem',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $abs: '$points' } },
        },
      },
    ]);

    // Calculate total expired points (type: expire OR status: expired)
    const expiredPoints = await RewardPoint.aggregate([
      {
        $match: {
          user: userIdObj,
          $or: [{ type: 'expire' }, { status: 'expired' }],
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

    logger.info('Calculated reward points totals:', {
      userId,
      earned,
      redeemed,
      expired,
      available,
    });

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
    console.log('[REWARD] hasOrderEarnedRewardPoints:', { orderId, found: !!existingRewardPoint });
    return !!existingRewardPoint;
  } catch (error) {
    logger.error('Error checking if order has earned reward points:', {
      error: error.message,
      orderId,
    });
    console.error('[REWARD] Lỗi khi kiểm tra hasOrderEarnedRewardPoints:', error);
    return false;
  }
};

/**
 * Deduct reward points for a refunded/cancelled order
 * @param {Object} order - The order object
 * @returns {Promise<Object|null>} Created negative reward point record or null
 */
export const deductRewardPointsForOrder = async order => {
  try {
    // Tìm các điểm đã cộng cho order này
    const earned = await RewardPoint.findOne({ order: order._id, type: 'earn' });
    if (!earned) return null;
    // Tạo bản ghi trừ điểm (adjust)
    const adjust = await RewardPoint.create({
      user: order.user,
      points: -Math.abs(earned.points),
      type: 'adjust',
      order: order._id,
      description: `Deduct reward points due to refund/cancel order #${order.orderNumber}`,
      status: 'active',
    });
    logger.info('Deducted reward points for order', {
      orderId: order._id,
      userId: order.user,
      points: adjust.points,
      rewardPointId: adjust._id,
    });
    return adjust;
  } catch (error) {
    logger.error('Error deducting reward points for order:', {
      error: error.message,
      orderId: order._id,
      userId: order.user,
    });
    throw error;
  }
};
