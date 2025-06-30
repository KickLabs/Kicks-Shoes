/**
 * @fileoverview Dashboard Controller
 * @created 2025-01-29
 * @file dashboardController.js
 * @description This file contains all dashboard-related controller functions for the Kicks Shoes application.
 * It handles both shop and admin dashboard operations including statistics, orders, feedback, and user management.
 */

import { asyncHandler } from '../middlewares/async.middleware.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Feedback from '../models/Feedback.js';
import Discount from '../models/Discount.js';
import Store from '../models/Store.js';
import Category from '../models/Category.js';

// ==================== SHOP DASHBOARD CONTROLLERS ====================

/**
 * Get shop statistics
 * @route GET /api/dashboard/shop/stats
 * @access Private (Shop)
 */
export const getShopStats = asyncHandler(async (req, res) => {
  const shopId = req.user.storeId || req.user.id;

  // For now, return all orders since Order model doesn't have store field
  // This would need to be updated when store relationship is implemented
  const totalOrders = await Order.countDocuments();

  // Get total revenue
  const revenueData = await Order.aggregate([
    { $match: { status: { $in: ['delivered'] } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

  // Get total products (all products for now)
  const totalProducts = await Product.countDocuments();

  // Get recent orders
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email');

  // Get monthly sales data
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthlySales = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfMonth },
        status: { $in: ['delivered'] },
      },
    },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const monthlyRevenue = monthlySales.length > 0 ? monthlySales[0].total : 0;

  res.status(200).json({
    success: true,
    data: {
      totalOrders,
      totalRevenue,
      totalProducts,
      monthlyRevenue,
      recentOrders,
    },
  });
});

/**
 * Get shop orders with pagination
 * @route GET /api/dashboard/shop/orders
 * @access Private (Shop)
 */
export const getShopOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email')
    .populate('items');

  const total = await Order.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * Get shop feedback with pagination
 * @route GET /api/dashboard/shop/feedback
 * @access Private (Shop)
 */
export const getShopFeedback = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const feedback = await Feedback.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email')
    .populate('product', 'name images');

  const total = await Feedback.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      feedback,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * Get shop discounts
 * @route GET /api/dashboard/shop/discounts
 * @access Private (Shop)
 */
export const getShopDiscounts = asyncHandler(async (req, res) => {
  const discounts = await Discount.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: discounts,
  });
});

/**
 * Get shop sales data
 * @route GET /api/dashboard/shop/sales
 * @access Private (Shop)
 */
export const getShopSalesData = asyncHandler(async (req, res) => {
  const period = req.query.period || 'monthly';

  let groupBy;
  if (period === 'daily') {
    groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  } else if (period === 'weekly') {
    groupBy = { $dateToString: { format: '%Y-%U', date: '$createdAt' } };
  } else {
    groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  }

  const salesData = await Order.aggregate([
    {
      $match: {
        status: { $in: ['delivered'] },
      },
    },
    {
      $group: {
        _id: groupBy,
        totalSales: { $sum: '$totalPrice' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: salesData,
  });
});

/**
 * Update order status
 * @route PUT /api/dashboard/shop/orders/:orderId/status
 * @access Private (Shop)
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ErrorResponse('Order not found', 404);
  }

  order.status = status;
  await order.save();

  res.status(200).json({
    success: true,
    data: order,
  });
});

/**
 * Create discount
 * @route POST /api/dashboard/shop/discounts
 * @access Private (Shop)
 */
export const createDiscount = asyncHandler(async (req, res) => {
  const discount = await Discount.create(req.body);

  res.status(201).json({
    success: true,
    data: discount,
  });
});

/**
 * Delete discount
 * @route DELETE /api/dashboard/shop/discounts/:discountId
 * @access Private (Shop)
 */
export const deleteDiscount = asyncHandler(async (req, res) => {
  const { discountId } = req.params;

  const discount = await Discount.findByIdAndDelete(discountId);
  if (!discount) {
    throw new ErrorResponse('Discount not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Discount deleted successfully',
  });
});

// ==================== ADMIN DASHBOARD CONTROLLERS ====================

/**
 * Get admin statistics
 * @route GET /api/dashboard/admin/stats
 * @access Private (Admin)
 */
export const getAdminStats = asyncHandler(async (req, res) => {
  // Get total users
  const totalUsers = await User.countDocuments();

  // Get total orders
  const totalOrders = await Order.countDocuments();

  // Get total revenue
  const revenueData = await Order.aggregate([
    { $match: { status: { $in: ['delivered'] } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

  // Get total products
  const totalProducts = await Product.countDocuments();

  // Get total stores
  const totalStores = await Store.countDocuments();

  // Get recent orders
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email');

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalOrders,
      totalRevenue,
      totalProducts,
      totalStores,
      recentOrders,
    },
  });
});

/**
 * Get admin users with pagination
 * @route GET /api/dashboard/admin/users
 * @access Private (Admin)
 */
export const getAdminUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * Get reported products with pagination
 * @route GET /api/dashboard/admin/reported-products
 * @access Private (Admin)
 */
export const getAdminReportedProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // This would need a Report model or field in Product model
  // For now, returning all products
  const products = await Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

  const total = await Product.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * Get admin feedback with pagination
 * @route GET /api/dashboard/admin/feedback
 * @access Private (Admin)
 */
export const getAdminFeedback = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const feedback = await Feedback.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email')
    .populate('product', 'name images')
    .populate('store', 'name');

  const total = await Feedback.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      feedback,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * Get admin revenue data
 * @route GET /api/dashboard/admin/revenue
 * @access Private (Admin)
 */
export const getAdminRevenueData = asyncHandler(async (req, res) => {
  const period = req.query.period || 'monthly';

  let groupBy;
  if (period === 'daily') {
    groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  } else if (period === 'weekly') {
    groupBy = { $dateToString: { format: '%Y-%U', date: '$createdAt' } };
  } else {
    groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  }

  const revenueData = await Order.aggregate([
    {
      $match: {
        status: { $in: ['delivered'] },
      },
    },
    {
      $group: {
        _id: groupBy,
        totalRevenue: { $sum: '$totalPrice' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: revenueData,
  });
});

/**
 * Get admin user growth data
 * @route GET /api/dashboard/admin/user-growth
 * @access Private (Admin)
 */
export const getAdminUserGrowthData = asyncHandler(async (req, res) => {
  const period = req.query.period || 'monthly';

  let groupBy;
  if (period === 'daily') {
    groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  } else if (period === 'weekly') {
    groupBy = { $dateToString: { format: '%Y-%U', date: '$createdAt' } };
  } else {
    groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  }

  const userGrowthData = await User.aggregate([
    {
      $group: {
        _id: groupBy,
        customers: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: userGrowthData,
  });
});

/**
 * Get admin categories
 * @route GET /api/dashboard/admin/categories
 * @access Private (Admin)
 */
export const getAdminCategories = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const categories = await Category.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

  const total = await Category.countDocuments();

  // Get products count for each category
  const categoriesWithCount = await Promise.all(
    categories.map(async category => {
      const productsCount = await Product.countDocuments({ category: category._id });
      return {
        ...category.toObject(),
        productsCount,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      categories: categoriesWithCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * Activate category
 * @route PUT /api/dashboard/admin/categories/:categoryId/activate
 * @access Private (Admin)
 */
export const activateCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const category = await Category.findByIdAndUpdate(categoryId, { status: true }, { new: true });

  if (!category) {
    throw new ErrorResponse('Category not found', 404);
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

/**
 * Deactivate category
 * @route PUT /api/dashboard/admin/categories/:categoryId/deactivate
 * @access Private (Admin)
 */
export const deactivateCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const category = await Category.findByIdAndUpdate(categoryId, { status: false }, { new: true });

  if (!category) {
    throw new ErrorResponse('Category not found', 404);
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

/**
 * Create category
 * @route POST /api/dashboard/admin/categories
 * @access Private (Admin)
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, status } = req.body;

  // Check if category with same name already exists
  const existingCategory = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') },
  });
  if (existingCategory) {
    throw new ErrorResponse('Category with this name already exists', 400);
  }

  const category = await Category.create({
    name,
    description,
    image,
    status: status !== undefined ? status : true,
  });

  res.status(201).json({
    success: true,
    data: category,
  });
});

/**
 * Update category
 * @route PUT /api/dashboard/admin/categories/:categoryId
 * @access Private (Admin)
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { name, description, image, status } = req.body;

  // Check if category exists
  const existingCategory = await Category.findById(categoryId);
  if (!existingCategory) {
    throw new ErrorResponse('Category not found', 404);
  }

  // Check if name is being changed and if it conflicts with another category
  if (name && name !== existingCategory.name) {
    const nameConflict = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: categoryId },
    });
    if (nameConflict) {
      throw new ErrorResponse('Category with this name already exists', 400);
    }
  }

  const category = await Category.findByIdAndUpdate(
    categoryId,
    {
      name,
      description,
      image,
      status,
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: category,
  });
});

/**
 * Delete category
 * @route DELETE /api/dashboard/admin/categories/:categoryId
 * @access Private (Admin)
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  // Check if category exists
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ErrorResponse('Category not found', 404);
  }

  // Check if category has products
  const productsCount = await Product.countDocuments({ category: categoryId });
  if (productsCount > 0) {
    throw new ErrorResponse(
      `Cannot delete category. It has ${productsCount} products associated with it.`,
      400
    );
  }

  await Category.findByIdAndDelete(categoryId);

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
  });
});

/**
 * Ban user
 * @route PUT /api/dashboard/admin/users/:userId/ban
 * @access Private (Admin)
 */
export const banUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(userId, { status: false }, { new: true }).select(
    '-password'
  );

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * Unban user
 * @route PUT /api/dashboard/admin/users/:userId/unban
 * @access Private (Admin)
 */
export const unbanUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(userId, { status: true }, { new: true }).select(
    '-password'
  );

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * Delete reported product
 * @route DELETE /api/dashboard/admin/products/:productId/delete
 * @access Private (Admin)
 */
export const deleteReportedProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findByIdAndDelete(productId);
  if (!product) {
    throw new ErrorResponse('Product not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});

/**
 * Delete feedback
 * @route DELETE /api/dashboard/admin/feedback/:feedbackId
 * @access Private (Admin)
 */
export const deleteFeedback = asyncHandler(async (req, res) => {
  const { feedbackId } = req.params;

  const feedback = await Feedback.findByIdAndDelete(feedbackId);
  if (!feedback) {
    throw new ErrorResponse('Feedback not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Feedback deleted successfully',
  });
});
