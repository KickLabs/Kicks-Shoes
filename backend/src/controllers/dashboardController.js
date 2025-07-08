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
import Report from '../models/Report.js';
import { sendTemplatedEmail } from '../utils/sendEmail.js';
import { emailTemplates } from '../templates/email.templates.js';

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

  // Average rating & total reviews
  const ratingAgg = await Feedback.aggregate([
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const averageRating = ratingAgg[0]?.avg || 0;
  const totalReviews = ratingAgg[0]?.count || 0;

  // Order status distribution
  const statusAgg = await Order.aggregate([{ $group: { _id: '$status', value: { $sum: 1 } } }]);
  const orderStatusDistribution = statusAgg.map(s => ({
    status: s._id,
    value: s.value,
  }));

  // Top selling products
  const topProductsAgg = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.product', sales: { $sum: '$items.quantity' } } },
    { $sort: { sales: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $project: {
        _id: 0,
        name: '$product.name',
        mainImage: '$product.mainImage',
        category: '$product.category',
        price: '$product.price',
        sales: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalOrders,
      totalRevenue,
      totalProducts,
      averageRating,
      totalReviews,
      orderStatusDistribution,
      topProducts: topProductsAgg,
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
    .populate('user', 'fullName email')
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
    .populate('user', 'fullName email')
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
    .populate('user', 'fullName email');

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

  // Fetch all reports with reporter populated
  let reports = await Report.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('reporter', 'fullName email')
    .lean();

  // Populate targetId for each report
  reports = await Promise.all(
    reports.map(async report => {
      let populatedTarget = null;
      if (report.targetType === 'product') {
        populatedTarget = await Product.findById(report.targetId).select('name mainImage').lean();
      } else if (report.targetType === 'feedback') {
        populatedTarget = await Feedback.findById(report.targetId)
          .select('comment user')
          .populate('user', 'fullName email')
          .lean();
      } else if (report.targetType === 'comment') {
        populatedTarget = await Comment.findById(report.targetId)
          .select('comment user product')
          .populate('user', 'fullName email')
          .populate('product', 'name mainImage')
          .lean();
      } else if (report.targetType === 'user') {
        populatedTarget = await User.findById(report.targetId)
          .select('fullName email avatar')
          .lean();
      }
      return {
        ...report,
        target: populatedTarget,
      };
    })
  );

  const total = await Report.countDocuments({});

  res.status(200).json({
    success: true,
    data: {
      reports,
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
    .populate('user', 'fullName email')
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
  const { adminNote, banReason } = req.body;

  const user = await User.findByIdAndUpdate(userId, { status: false }, { new: true }).select(
    '-password'
  );

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  // Send email notification to banned user
  try {
    const { sendTemplatedEmail } = await import('../utils/sendEmail.js');

    if (user.email) {
      console.log('Sending ban notification email to user:', user.email);
      await sendTemplatedEmail({
        email: user.email,
        templateType: 'USER_BANNED',
        templateData: {
          userName: user.fullName || user.email,
          adminNote: adminNote || 'Account suspended by admin',
          banReason: banReason || 'Violation of community guidelines',
        },
      });
      console.log('Ban notification email sent successfully');
    } else {
      console.log('User has no email address, skipping email notification');
    }
  } catch (emailError) {
    console.error('Error sending ban notification email:', emailError);
    // Don't fail the request if email fails
  }

  res.status(200).json({
    success: true,
    data: user,
    message: 'User banned successfully',
  });
});

/**
 * Unban user
 * @route PUT /api/dashboard/admin/users/:userId/unban
 * @access Private (Admin)
 */
export const unbanUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { adminNote } = req.body;

  const user = await User.findByIdAndUpdate(userId, { status: true }, { new: true }).select(
    '-password'
  );

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  // Send email notification to unbanned user
  try {
    const { sendTemplatedEmail } = await import('../utils/sendEmail.js');

    if (user.email) {
      console.log('Sending unban notification email to user:', user.email);
      await sendTemplatedEmail({
        email: user.email,
        templateType: 'USER_UNBANNED',
        templateData: {
          userName: user.fullName || user.email,
          adminNote: adminNote || 'Account restored by admin',
        },
      });
      console.log('Unban notification email sent successfully');
    } else {
      console.log('User has no email address, skipping email notification');
    }
  } catch (emailError) {
    console.error('Error sending unban notification email:', emailError);
    // Don't fail the request if email fails
  }

  res.status(200).json({
    success: true,
    data: user,
    message: 'User unbanned successfully',
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

  const feedback = await Feedback.findById(feedbackId).populate('user').populate('product');
  if (!feedback) {
    throw new ErrorResponse('Feedback not found', 404);
  }

  // Soft delete: set status to false
  await Feedback.findByIdAndUpdate(feedbackId, { status: false });

  // Send notification emails
  try {
    const User = (await import('../models/User.js')).default;
    const { sendTemplatedEmail } = await import('../utils/sendEmail.js');

    const shopUser = await User.findOne({ role: 'shop' });

    // Check if there's a pending report for this feedback
    const Report = (await import('../models/Report.js')).default;
    const pendingReport = await Report.findOne({
      targetType: 'review',
      targetId: feedbackId,
      status: 'pending',
    });

    // Email to review author about deletion
    if (feedback.user && feedback.user.email) {
      await sendTemplatedEmail({
        email: feedback.user.email,
        templateType: 'REVIEW_DELETED',
        templateData: {
          userName: feedback.user.fullName || feedback.user.email,
          productName: feedback.product?.name || 'Product',
          adminNote: 'Review deleted by admin',
          resolution: 'Review Deleted',
        },
      });
    }

    // Email to shop about review deletion
    if (shopUser && shopUser.email && feedback.product) {
      await sendTemplatedEmail({
        email: shopUser.email,
        templateType: 'REVIEW_DELETED_SHOP',
        templateData: {
          shopName: shopUser.fullName || 'Shop',
          productName: feedback.product.name,
          userName: feedback.user?.fullName || feedback.user?.email || 'User',
          adminNote: 'Review deleted by admin',
          resolution: 'Review Deleted',
        },
      });
    }

    // Email to reporter if there's a pending report
    if (pendingReport) {
      const reporterUser = await User.findById(pendingReport.reporter);
      if (reporterUser && reporterUser.email) {
        await sendTemplatedEmail({
          email: reporterUser.email,
          templateType: 'REPORT_RESOLVED',
          templateData: {
            userName: reporterUser.fullName || reporterUser.email,
            targetName: feedback?.product?.name || 'Product Review',
            adminNote: 'Review deleted by admin',
            resolution: 'Review Deleted',
            reportReason: pendingReport.reason,
            reportDescription: pendingReport.description,
          },
        });
      }

      // Update report status
      pendingReport.status = 'resolved';
      pendingReport.resolution = 'delete_comment';
      pendingReport.resolvedBy = req.user.id;
      pendingReport.resolvedAt = new Date();
      await pendingReport.save();
    }
  } catch (emailError) {
    console.error('Error sending notification emails:', emailError);
    // Don't fail the request if email fails
  }

  res.status(200).json({
    success: true,
    message: 'Feedback deleted successfully',
  });
});

/**
 * Admin ignore a product report
 * @route PUT /api/dashboard/admin/reports/:id/ignore
 * @access Private (Admin)
 */
export const ignoreProductReport = asyncHandler(async (req, res) => {
  const reportId = req.params.id;
  const report = await Report.findById(reportId);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }
  report.status = 'resolved';
  report.resolution = 'no_action';
  report.resolvedBy = req.user.id;
  report.resolvedAt = new Date();
  await report.save();
  res.status(200).json({ success: true, message: 'Report ignored' });
});

/**
 * Admin resolve a product report (reply)
 * @route PUT /api/dashboard/admin/reports/:id/resolve
 * @access Private (Admin)
 */
export const resolveProductReport = asyncHandler(async (req, res) => {
  const reportId = req.params.id;
  const { resolution, adminNote } = req.body;
  const report = await Report.findById(reportId);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }
  report.status = 'resolved';
  report.resolution = resolution;
  report.adminNote = adminNote;
  report.resolvedBy = req.user.id;
  report.resolvedAt = new Date();
  await report.save();

  if (report.targetType === 'product') {
    const Product = (await import('../models/Product.js')).default;
    const User = (await import('../models/User.js')).default;

    const product = await Product.findById(report.targetId);

    // Find the shop user (role: shop)
    const shopUser = await User.findOne({ role: 'shop' });

    // Find the reporter user
    const reporterUser = await User.findById(report.reporter);

    if (resolution === 'delete_product') {
      await Product.findByIdAndDelete(report.targetId);
      if (shopUser && shopUser.email) {
        try {
          console.log('Sending delete_product email to shop:', shopUser.email);
          await sendTemplatedEmail({
            email: shopUser.email,
            templateType: 'PRODUCT_DELETED',
            templateData: {
              shopName: shopUser.fullName || 'Shop',
              productName: product?.name || 'Product',
              adminNote,
              resolution: 'Product Deleted',
            },
          });
          console.log('Delete product email sent to shop successfully');
        } catch (error) {
          console.error('Error sending delete_product email to shop:', error);
        }
      }

      // CC to reporter
      if (reporterUser && reporterUser.email) {
        try {
          console.log('Sending delete_product email to reporter:', reporterUser.email);
          await sendTemplatedEmail({
            email: reporterUser.email,
            templateType: 'REPORT_RESOLVED',
            templateData: {
              userName: reporterUser.fullName || reporterUser.email,
              productName: product?.name || 'Product',
              adminNote,
              resolution: 'Product Deleted',
              reportReason: report.reason,
              reportDescription: report.description,
            },
          });
          console.log('Delete product email sent to reporter successfully');
        } catch (error) {
          console.error('Error sending delete_product email to reporter:', error);
        }
      }
    } else if (resolution === 'warning' && product) {
      // Send product warning email to shop
      if (shopUser && shopUser.email) {
        try {
          console.log('Sending warning email to shop:', shopUser.email);
          await sendTemplatedEmail({
            email: shopUser.email,
            templateType: 'PRODUCT_WARNING',
            templateData: {
              shopName: shopUser.fullName || 'Shop',
              productName: product.name,
              adminNote,
              resolution: 'Warning',
            },
          });
          console.log('Warning email sent to shop successfully');
        } catch (error) {
          console.error('Error sending warning email to shop:', error);
        }
      }

      // CC to reporter
      if (reporterUser && reporterUser.email) {
        try {
          console.log('Sending warning email to reporter:', reporterUser.email);
          await sendTemplatedEmail({
            email: reporterUser.email,
            templateType: 'REPORT_RESOLVED',
            templateData: {
              userName: reporterUser.fullName || reporterUser.email,
              productName: product.name,
              adminNote,
              resolution: 'Warning',
              reportReason: report.reason,
              reportDescription: report.description,
            },
          });
          console.log('Warning email sent to reporter successfully');
        } catch (error) {
          console.error('Error sending warning email to reporter:', error);
        }
      }
    }
    // no_action: không làm gì, chỉ cập nhật status
  } else if (report.targetType === 'review') {
    const Feedback = (await import('../models/Feedback.js')).default;
    const User = (await import('../models/User.js')).default;

    const feedback = await Feedback.findById(report.targetId).populate('user').populate('product');
    const reporterUser = await User.findById(report.reporter);
    const shopUser = await User.findOne({ role: 'shop' });

    if (resolution === 'delete_comment') {
      // Soft delete: cập nhật status = false
      await Feedback.findByIdAndUpdate(report.targetId, { status: false });

      console.log('Processing delete_comment resolution:', {
        shopUser: shopUser ? { email: shopUser.email, fullName: shopUser.fullName } : null,
        reporterUser: reporterUser
          ? { email: reporterUser.email, fullName: reporterUser.fullName }
          : null,
        feedback: feedback
          ? { product: feedback.product?.name, user: feedback.user?.fullName }
          : null,
      });

      // Notify shop about review deletion
      if (shopUser && shopUser.email && feedback?.product) {
        try {
          console.log('Sending email to shop:', shopUser.email);
          await sendTemplatedEmail({
            email: shopUser.email,
            templateType: 'REVIEW_DELETED_SHOP',
            templateData: {
              shopName: shopUser.fullName || 'Shop',
              productName: feedback.product.name,
              userName: feedback.user?.fullName || feedback.user?.email || 'User',
              adminNote,
              resolution: 'Review Deleted',
            },
          });
          console.log('Email sent to shop successfully');
        } catch (error) {
          console.error('Error sending email to shop:', error);
        }
      } else {
        console.log('Skipping shop email - conditions not met:', {
          hasShopUser: !!shopUser,
          hasShopEmail: shopUser?.email,
          hasFeedbackProduct: !!feedback?.product,
        });
      }

      // CC to reporter
      if (reporterUser && reporterUser.email) {
        try {
          console.log('Sending email to reporter:', reporterUser.email);
          await sendTemplatedEmail({
            email: reporterUser.email,
            templateType: 'REPORT_RESOLVED',
            templateData: {
              userName: reporterUser.fullName || reporterUser.email,
              targetName: feedback?.product?.name || 'Product Review',
              adminNote,
              resolution: 'Review Deleted',
              reportReason: report.reason,
              reportDescription: report.description,
            },
          });
          console.log('Email sent to reporter successfully');
        } catch (error) {
          console.error('Error sending email to reporter:', error);
        }
      } else {
        console.log('Skipping reporter email - conditions not met:', {
          hasReporterUser: !!reporterUser,
          hasReporterEmail: reporterUser?.email,
        });
      }
    } else if (resolution === 'warning' && feedback) {
      // Send warning email to review author
      if (feedback.user && feedback.user.email) {
        try {
          console.log('Sending warning email to review author:', feedback.user.email);
          await sendTemplatedEmail({
            email: feedback.user.email,
            templateType: 'REVIEW_WARNING',
            templateData: {
              userName: feedback.user.fullName || feedback.user.email,
              productName: feedback.product?.name || 'Product',
              adminNote,
              resolution: 'Warning',
            },
          });
          console.log('Warning email sent to review author successfully');
        } catch (error) {
          console.error('Error sending warning email to review author:', error);
        }
      }

      // CC to reporter
      if (reporterUser && reporterUser.email) {
        try {
          console.log('Sending warning email to reporter:', reporterUser.email);
          await sendTemplatedEmail({
            email: reporterUser.email,
            templateType: 'REPORT_RESOLVED',
            templateData: {
              userName: reporterUser.fullName || reporterUser.email,
              targetName: feedback?.product?.name || 'Product Review',
              adminNote,
              resolution: 'Warning',
              reportReason: report.reason,
              reportDescription: report.description,
            },
          });
          console.log('Warning email sent to reporter successfully');
        } catch (error) {
          console.error('Error sending warning email to reporter:', error);
        }
      }
    }
    // no_action: không làm gì, chỉ cập nhật status
  }

  res.status(200).json({ success: true, message: 'Report resolved', data: report });
});

// API: Get all reports about feedback written by the current user
export const getMyFeedbackReports = asyncHandler(async (req, res) => {
  // Find all feedbacks written by this user
  const feedbacks = await Feedback.find({ user: req.user.id }).select('_id');
  const feedbackIds = feedbacks.map(fb => fb._id);

  // Find all reports where targetType is 'review' and targetId in feedbackIds
  let reports = await Report.find({
    targetType: 'review',
    targetId: { $in: feedbackIds },
  })
    .sort({ createdAt: -1 })
    .populate('reporter', 'fullName email')
    .lean();

  // Populate feedback details for each report
  reports = await Promise.all(
    reports.map(async report => {
      const feedback = await Feedback.findById(report.targetId)
        .select('comment product rating createdAt')
        .populate('product', 'name mainImage')
        .lean();
      return {
        ...report,
        feedback,
        targetType: 'feedback', // for frontend compatibility
      };
    })
  );

  res.status(200).json({
    success: true,
    data: reports,
  });
});
