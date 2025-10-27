/**
 * @fileoverview UserDiscount Controller
 * @created 2024-12-19
 * @file userDiscountController.js
 * @description This file contains the controller functions for managing user discount collections.
 */

import UserDiscount from '../models/UserDiscount.js';
import Discount from '../models/Discount.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../middlewares/async.middleware.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';

// @desc    Get user's collected discounts
// @route   GET /api/user-discounts
// @access  Private
export const getUserDiscounts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const userDiscounts = await UserDiscount.find({ user: userId })
    .populate('discount')
    .populate('order', 'orderNumber totalPrice')
    .sort({ createdAt: -1 });

  const now = new Date();

  // Auto-update expired status and filter out reward_points discounts
  const discounts = await Promise.all(
    userDiscounts
      .filter(ud => ud.discount && ud.discount.source !== 'reward_points') // ❌ Loại bỏ reward_points
      .map(async ud => {
        // ✅ Auto-check and update expired status
        if (ud.status === 'saved' && ud.discount.endDate < now) {
          ud.status = 'expired';
          await ud.save();
        }

        return {
          id: ud._id,
          code: ud.discount.code,
          title: ud.discount.description || `Discount ${ud.discount.code}`,
          description:
            ud.discount.description ||
            `Get ${ud.discount.type === 'percentage' ? ud.discount.value + '%' : ud.discount.value + ' VND'} off`,
          discountType: ud.discount.type,
          discountValue: ud.discount.value,
          minOrderAmount: ud.discount.minPurchase,
          maxDiscountAmount: ud.discount.maxDiscount,
          validFrom: ud.discount.startDate,
          validTo: ud.discount.endDate,
          status: ud.status, // Status đã được update nếu expired
          isUsed: ud.status === 'used',
          usedAt: ud.usedAt,
          discountAmount: ud.discountAmount,
          orderAmount: ud.orderAmount,
          order: ud.order,
          usageCount: ud.usageCount,
          collectedAt: ud.collectedAt,
          // Additional fields from discount
          usageLimit: ud.discount.usageLimit,
          perUserLimit: ud.discount.perUserLimit,
          source: ud.discount.source,
        };
      })
  );

  res.status(200).json({
    success: true,
    count: discounts.length,
    data: discounts,
  });
});

// @desc    Collect a discount for user
// @route   POST /api/user-discounts/collect
// @access  Private
export const collectDiscount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { discountCode } = req.body;

  if (!discountCode) {
    throw new ErrorResponse('Discount code is required', 400);
  }

  // Find discount by code
  const discount = await Discount.findOne({
    code: discountCode.toUpperCase(),
    status: 'active',
  });

  if (!discount) {
    throw new ErrorResponse('Discount not found or not active', 404);
  }

  // ❌ Prevent collecting reward_points discounts
  if (discount.source === 'reward_points') {
    throw new ErrorResponse(
      'Cannot collect reward points discount. Please use the code directly.',
      400
    );
  }

  // Check if discount is still valid
  if (!discount.isValid()) {
    throw new ErrorResponse('Discount is no longer valid', 400);
  }

  try {
    // Collect the discount
    const userDiscount = await UserDiscount.collectDiscount(userId, discount._id);

    await userDiscount.populate('discount');

    res.status(201).json({
      success: true,
      message: 'Discount collected successfully',
      data: {
        id: userDiscount._id,
        code: userDiscount.discount.code,
        title: userDiscount.discount.description || `Discount ${userDiscount.discount.code}`,
        description:
          userDiscount.discount.description ||
          `Get ${userDiscount.discount.type === 'percentage' ? userDiscount.discount.value + '%' : userDiscount.discount.value + ' VND'} off`,
        discountType: userDiscount.discount.type,
        discountValue: userDiscount.discount.value,
        minOrderAmount: userDiscount.discount.minPurchase,
        maxDiscountAmount: userDiscount.discount.maxDiscount,
        validFrom: userDiscount.discount.startDate,
        validTo: userDiscount.discount.endDate,
        status: userDiscount.status,
        collectedAt: userDiscount.collectedAt,
      },
    });
  } catch (error) {
    if (error.message === 'User already has this discount') {
      throw new ErrorResponse('You already have this discount', 400);
    }
    throw error;
  }
});

// @desc    Use a discount
// @route   POST /api/user-discounts/:id/use
// @access  Private
export const useDiscount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { orderId, discountAmount, orderAmount } = req.body;

  if (!orderId || !discountAmount || !orderAmount) {
    throw new ErrorResponse('Order ID, discount amount, and order amount are required', 400);
  }

  const userDiscount = await UserDiscount.findOne({
    _id: id,
    user: userId,
  }).populate('discount');

  if (!userDiscount) {
    throw new ErrorResponse('User discount not found', 404);
  }

  if (userDiscount.status !== 'saved') {
    throw new ErrorResponse('Discount is not saved', 400);
  }

  try {
    // Use the discount
    await userDiscount.useDiscount(orderId, discountAmount, orderAmount);

    // Update discount usage count
    await Discount.findByIdAndUpdate(userDiscount.discount._id, {
      $inc: { usedCount: 1 },
    });

    res.status(200).json({
      success: true,
      message: 'Discount used successfully',
      data: {
        id: userDiscount._id,
        code: userDiscount.discount.code,
        discountAmount: userDiscount.discountAmount,
        orderAmount: userDiscount.orderAmount,
        usedAt: userDiscount.usedAt,
      },
    });
  } catch (error) {
    throw new ErrorResponse(error.message, 400);
  }
});

// @desc    Get available discounts for collection
// @route   GET /api/user-discounts/available
// @access  Private
export const getAvailableDiscounts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get all active discounts (exclude reward_points)
  const activeDiscounts = await Discount.find({
    status: 'active',
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
    $expr: { $lt: ['$usedCount', '$usageLimit'] },
    source: { $ne: 'reward_points' }, // ❌ Loại bỏ discount từ reward points
  }).sort({ createdAt: -1 });

  // Get user's collected discount IDs
  const userDiscountIds = await UserDiscount.find({
    user: userId,
  }).distinct('discount');

  // Filter out already collected discounts
  const availableDiscounts = activeDiscounts.filter(
    discount => !userDiscountIds.includes(discount._id)
  );

  // Transform data for frontend
  const discounts = availableDiscounts.map(discount => ({
    id: discount._id,
    _id: discount._id,
    code: discount.code,
    title: discount.description || `Discount ${discount.code}`,
    description:
      discount.description ||
      `Get ${discount.type === 'percentage' ? discount.value + '%' : discount.value + ' VND'} off`,
    type: discount.type,
    discountType: discount.type,
    value: discount.value,
    discountValue: discount.value,
    minPurchase: discount.minPurchase,
    minOrderAmount: discount.minPurchase,
    maxDiscount: discount.maxDiscount,
    maxDiscountAmount: discount.maxDiscount,
    startDate: discount.startDate,
    validFrom: discount.startDate,
    endDate: discount.endDate,
    validTo: discount.endDate,
    status: discount.status,
    usageLimit: discount.usageLimit,
    usedCount: discount.usedCount || 0,
    perUserLimit: discount.perUserLimit,
    source: discount.source,
  }));

  res.status(200).json({
    success: true,
    count: discounts.length,
    data: discounts,
  });
});

// @desc    Validate discount for order
// @route   POST /api/user-discounts/validate
// @access  Private
export const validateDiscount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { discountCode, orderAmount } = req.body;

  if (!discountCode || !orderAmount) {
    throw new ErrorResponse('Discount code and order amount are required', 400);
  }

  // Find user's discount by code
  const userDiscount = await UserDiscount.findOne({
    user: userId,
    status: 'saved',
  }).populate('discount');

  if (!userDiscount) {
    throw new ErrorResponse('No saved discount found', 404);
  }

  // Find the specific discount by code
  const targetDiscount = await Discount.findOne({
    code: discountCode.toUpperCase(),
    status: 'active',
  });

  if (!targetDiscount) {
    throw new ErrorResponse('Discount not found or not active', 404);
  }

  // Check if user has this specific discount
  const userHasDiscount = await UserDiscount.findOne({
    user: userId,
    discount: targetDiscount._id,
    status: 'saved',
  }).populate('discount');

  if (!userHasDiscount) {
    throw new ErrorResponse('You do not have this discount', 404);
  }

  // Check if discount is valid
  if (!userHasDiscount.isValid) {
    throw new ErrorResponse('Discount is not valid', 400);
  }

  // Check minimum purchase amount
  if (orderAmount < userHasDiscount.discount.minPurchase) {
    throw new ErrorResponse(
      `Minimum order amount is ${userHasDiscount.discount.minPurchase.toLocaleString('vi-VN')} VND`,
      400
    );
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (userHasDiscount.discount.type === 'percentage') {
    discountAmount = (orderAmount * userHasDiscount.discount.value) / 100;
    if (userHasDiscount.discount.maxDiscount) {
      discountAmount = Math.min(discountAmount, userHasDiscount.discount.maxDiscount);
    }
  } else {
    discountAmount = Math.min(userHasDiscount.discount.value, orderAmount);
  }

  res.status(200).json({
    success: true,
    data: {
      id: userHasDiscount._id,
      code: userHasDiscount.discount.code,
      title: userHasDiscount.discount.description || `Discount ${userHasDiscount.discount.code}`,
      description:
        userHasDiscount.discount.description ||
        `Get ${userHasDiscount.discount.type === 'percentage' ? userHasDiscount.discount.value + '%' : userHasDiscount.discount.value + ' VND'} off`,
      discountType: userHasDiscount.discount.type,
      discountValue: userHasDiscount.discount.value,
      discountAmount: Math.round(discountAmount),
      minOrderAmount: userHasDiscount.discount.minPurchase,
      maxDiscountAmount: userHasDiscount.discount.maxDiscount,
      isValid: true,
    },
  });
});
