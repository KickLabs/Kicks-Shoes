/**
 * @fileoverview Voucher Controller
 * @created 2024-12-19
 * @file voucherController.js
 * @description This file contains the controller functions for managing vouchers and user voucher interactions.
 * It follows the same pattern as other controllers in the system.
 */

import Voucher from '../models/Voucher.js';
import UserVoucher from '../models/UserVoucher.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../middlewares/async.middleware.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';

// @desc    Get user's vouchers
// @route   GET /api/vouchers/user
// @access  Private
export const getUserVouchers = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const userVouchers = await UserVoucher.find({ user: userId })
    .populate('voucher')
    .populate('order', 'orderNumber totalPrice')
    .sort({ createdAt: -1 });

  // Transform data for frontend
  const vouchers = userVouchers.map(uv => ({
    id: uv.voucher._id,
    code: uv.voucher.code,
    title: uv.voucher.title,
    description: uv.voucher.description,
    discountType: uv.voucher.type,
    discountValue: uv.voucher.value,
    minOrderAmount: uv.voucher.minPurchase,
    maxDiscountAmount: uv.voucher.maxDiscount,
    validFrom: uv.voucher.startDate,
    validTo: uv.voucher.endDate,
    status: uv.status,
    isUsed: uv.status === 'used',
    usedAt: uv.usedAt,
    discountAmount: uv.discountAmount,
    orderAmount: uv.orderAmount,
    order: uv.order,
  }));

  res.status(200).json({
    success: true,
    count: vouchers.length,
    data: vouchers,
  });
});

// @desc    Get single voucher
// @route   GET /api/vouchers/:id
// @access  Private
export const getVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);

  if (!voucher) {
    throw new ErrorResponse('Voucher not found', 404);
  }

  res.status(200).json({
    success: true,
    voucher,
  });
});

// @desc    Use voucher
// @route   POST /api/vouchers/:id/use
// @access  Private
export const useVoucher = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user._id;
  const voucherId = req.params.id;

  // Find the voucher
  const voucher = await Voucher.findById(voucherId);
  if (!voucher) {
    throw new ErrorResponse('Voucher not found', 404);
  }

  // Find user voucher record
  const userVoucher = await UserVoucher.findOne({
    user: userId,
    voucher: voucherId,
    status: 'active',
  });

  if (!userVoucher) {
    throw new ErrorResponse('Voucher not available for this user', 400);
  }

  // Find the order
  const order = await Order.findById(orderId).populate('user');
  if (!order) {
    throw new ErrorResponse('Order not found', 404);
  }

  // Check if order belongs to user
  if (order.user._id.toString() !== userId.toString()) {
    throw new ErrorResponse('Unauthorized to use voucher for this order', 403);
  }

  // Check if voucher can be used
  const canUse = voucher.canBeUsedBy(req.user, order.totalPrice);
  if (!canUse.canUse) {
    throw new ErrorResponse(canUse.reason, 400);
  }

  // Calculate discount amount
  const discountAmount = voucher.calculateDiscount(order.totalPrice);

  // Mark voucher as used
  await userVoucher.markAsUsed(orderId, discountAmount, order.totalPrice);

  // Update voucher usage count
  voucher.usedCount += 1;
  await voucher.save();

  // Update order with discount
  order.discount = discountAmount;
  order.discountCode = voucher.code;
  order.totalPrice = Math.max(0, order.totalPrice - discountAmount);
  await order.save();

  logger.info(`Voucher ${voucher.code} used by user ${userId} for order ${orderId}`);

  res.status(200).json({
    success: true,
    message: 'Voucher used successfully',
    discountAmount,
    newTotalPrice: order.totalPrice,
  });
});

// @desc    Validate voucher
// @route   POST /api/vouchers/validate
// @access  Private
export const validateVoucher = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;
  const userId = req.user._id;

  // Find voucher by code
  const voucher = await Voucher.findOne({ code: code.toUpperCase() });
  if (!voucher) {
    throw new ErrorResponse('Voucher not found', 404);
  }

  // Check if user has this voucher
  const userVoucher = await UserVoucher.findOne({
    user: userId,
    voucher: voucher._id,
    status: 'active',
  });

  if (!userVoucher) {
    throw new ErrorResponse('Voucher not available for this user', 400);
  }

  // Check if voucher can be used
  const canUse = voucher.canBeUsedBy(req.user, orderAmount);
  if (!canUse.canUse) {
    throw new ErrorResponse(canUse.reason, 400);
  }

  // Calculate discount amount
  const discountAmount = voucher.calculateDiscount(orderAmount);

  res.status(200).json({
    success: true,
    voucher: {
      id: voucher._id,
      code: voucher.code,
      title: voucher.title,
      description: voucher.description,
      discountType: voucher.type,
      discountValue: voucher.value,
      discountAmount,
    },
  });
});

// @desc    Get available vouchers for order
// @route   GET /api/vouchers/available
// @access  Private
export const getAvailableVouchers = asyncHandler(async (req, res) => {
  const { orderAmount } = req.query;
  const userId = req.user._id;

  const userVouchers = await UserVoucher.find({
    user: userId,
    status: 'active',
  }).populate('voucher');

  const availableVouchers = userVouchers
    .filter(uv => {
      const canUse = uv.voucher.canBeUsedBy(req.user, parseFloat(orderAmount) || 0);
      return canUse.canUse;
    })
    .map(uv => ({
      id: uv.voucher._id,
      code: uv.voucher.code,
      title: uv.voucher.title,
      description: uv.voucher.description,
      discountType: uv.voucher.type,
      discountValue: uv.voucher.value,
      minOrderAmount: uv.voucher.minPurchase,
      maxDiscountAmount: uv.voucher.maxDiscount,
      discountAmount: uv.voucher.calculateDiscount(parseFloat(orderAmount) || 0),
    }));

  res.status(200).json({
    success: true,
    count: availableVouchers.length,
    vouchers: availableVouchers,
  });
});

// @desc    Create voucher (Admin only)
// @route   POST /api/vouchers
// @access  Private/Admin
export const createVoucher = asyncHandler(async (req, res) => {
  const voucherData = {
    ...req.body,
    createdBy: req.user._id,
  };

  const voucher = await Voucher.create(voucherData);

  logger.info(`Voucher ${voucher.code} created by admin ${req.user._id}`);

  res.status(201).json({
    success: true,
    voucher,
  });
});

// @desc    Update voucher (Admin only)
// @route   PUT /api/vouchers/:id
// @access  Private/Admin
export const updateVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!voucher) {
    throw new ErrorResponse('Voucher not found', 404);
  }

  logger.info(`Voucher ${voucher.code} updated by admin ${req.user._id}`);

  res.status(200).json({
    success: true,
    voucher,
  });
});

// @desc    Delete voucher (Admin only)
// @route   DELETE /api/vouchers/:id
// @access  Private/Admin
export const deleteVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);

  if (!voucher) {
    throw new ErrorResponse('Voucher not found', 404);
  }

  // Check if voucher has been used
  if (voucher.usedCount > 0) {
    throw new ErrorResponse('Cannot delete voucher that has been used', 400);
  }

  await voucher.deleteOne();

  logger.info(`Voucher ${voucher.code} deleted by admin ${req.user._id}`);

  res.status(200).json({
    success: true,
    message: 'Voucher deleted successfully',
  });
});

// @desc    Get all vouchers (Admin only)
// @route   GET /api/vouchers
// @access  Private/Admin
export const getAllVouchers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;

  let query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { code: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const vouchers = await Voucher.find(query)
    .populate('createdBy', 'fullName email')
    .populate('applicableCategories', 'name')
    .populate('applicableProducts', 'name price')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Voucher.countDocuments(query);

  res.status(200).json({
    success: true,
    count: vouchers.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    vouchers,
  });
});

// @desc    Distribute voucher to users (Admin only)
// @route   POST /api/vouchers/:id/distribute
// @access  Private/Admin
export const distributeVoucher = asyncHandler(async (req, res) => {
  const { userIds } = req.body;
  const voucherId = req.params.id;

  const voucher = await Voucher.findById(voucherId);
  if (!voucher) {
    throw new ErrorResponse('Voucher not found', 404);
  }

  // Create UserVoucher records for each user
  const userVoucherPromises = userIds.map(userId =>
    UserVoucher.distributeToUser(userId, voucherId)
  );

  await Promise.all(userVoucherPromises);

  logger.info(
    `Voucher ${voucher.code} distributed to ${userIds.length} users by admin ${req.user._id}`
  );

  res.status(200).json({
    success: true,
    message: `Voucher distributed to ${userIds.length} users successfully`,
  });
});

// @desc    Get voucher statistics (Admin only)
// @route   GET /api/vouchers/stats
// @access  Private/Admin
export const getVoucherStats = asyncHandler(async (req, res) => {
  const totalVouchers = await Voucher.countDocuments();
  const activeVouchers = await Voucher.countDocuments({ status: 'active' });
  const expiredVouchers = await Voucher.countDocuments({ status: 'expired' });

  const totalUserVouchers = await UserVoucher.countDocuments();
  const usedVouchers = await UserVoucher.countDocuments({ status: 'used' });
  const activeUserVouchers = await UserVoucher.countDocuments({ status: 'active' });

  const totalDiscountGiven = await UserVoucher.aggregate([
    { $match: { status: 'used' } },
    { $group: { _id: null, total: { $sum: '$discountAmount' } } },
  ]);

  res.status(200).json({
    success: true,
    stats: {
      vouchers: {
        total: totalVouchers,
        active: activeVouchers,
        expired: expiredVouchers,
      },
      userVouchers: {
        total: totalUserVouchers,
        used: usedVouchers,
        active: activeUserVouchers,
      },
      totalDiscountGiven: totalDiscountGiven[0]?.total || 0,
    },
  });
});
