/**
 * @fileoverview Dashboard Routes
 * @created 2025-01-29
 * @file dashboardRoutes.js
 * @description This file defines all dashboard-related routes for the Kicks Shoes application.
 * It maps HTTP endpoints to their corresponding controller functions and applies necessary middleware.
 */

import express from 'express';
import {
  // Shop Dashboard
  getShopStats,
  getShopOrders,
  getShopFeedback,
  getShopDiscounts,
  getShopSalesData,
  updateOrderStatus,
  createDiscount,
  deleteDiscount,

  // Admin Dashboard
  getAdminStats,
  getAdminUsers,
  getAdminReportedProducts,
  getAdminFeedback,
  getAdminRevenueData,
  getAdminUserGrowthData,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  activateCategory,
  deactivateCategory,
  banUser,
  unbanUser,
  deleteReportedProduct,
  deleteFeedback,
} from '../controllers/dashboardController.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requireAdmin, requireShop, requireRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

// Shop Dashboard Routes
router.get('/shop/stats', protect, requireShop, getShopStats);
router.get('/shop/orders', protect, requireShop, getShopOrders);
router.get('/shop/feedback', protect, requireShop, getShopFeedback);
router.get('/shop/discounts', protect, requireShop, getShopDiscounts);
router.get('/shop/sales', protect, requireShop, getShopSalesData);
router.put('/shop/orders/:orderId/status', protect, requireShop, updateOrderStatus);
router.post('/shop/discounts', protect, requireShop, createDiscount);
router.delete('/shop/discounts/:discountId', protect, requireShop, deleteDiscount);

// Admin Dashboard Routes
router.get('/admin/stats', protect, requireAdmin, getAdminStats);
router.get('/admin/users', protect, requireAdmin, getAdminUsers);
router.get('/admin/reported-products', protect, requireAdmin, getAdminReportedProducts);
router.get('/admin/feedback', protect, requireAdmin, getAdminFeedback);
router.get('/admin/revenue', protect, requireAdmin, getAdminRevenueData);
router.get('/admin/user-growth', protect, requireAdmin, getAdminUserGrowthData);
router.get('/admin/categories', protect, requireAdmin, getAdminCategories);
router.post('/admin/categories', protect, requireAdmin, createCategory);
router.put('/admin/categories/:categoryId', protect, requireAdmin, updateCategory);
router.delete('/admin/categories/:categoryId', protect, requireAdmin, deleteCategory);
router.put('/admin/categories/:categoryId/activate', protect, requireAdmin, activateCategory);
router.put('/admin/categories/:categoryId/deactivate', protect, requireAdmin, deactivateCategory);
router.put('/admin/users/:userId/ban', protect, requireAdmin, banUser);
router.put('/admin/users/:userId/unban', protect, requireAdmin, unbanUser);
router.delete('/admin/products/:productId', protect, requireAdmin, deleteReportedProduct);
router.delete('/admin/feedback/:feedbackId', protect, requireAdmin, deleteFeedback);

export default router;
