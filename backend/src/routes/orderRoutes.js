/**
 * @fileoverview Order Routes
 * @created 2025-06-08
 * @file orderRoutes.js
 * @description This file defines the routes for the order-related endpoints in the Kicks Shoes application.
 * It uses the orderController to handle the business logic for each route.
 */

import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  getOrdersByUserId,
  updateOrder,
  cancelOrder,
  refundOrder,
  updateOrderStatus,
  assignShipper,
  autoAssignShipper,
  getAvailableShippers,
  confirmOrderReceived,
  reportDeliveryIssue,
  getOrderTracking,
} from '../controllers/orderController.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requireRoles, requireExactRole } from '../middlewares/role.middleware.js';

const router = Router();

// Private routes
/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post('/', protect, createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get all orders
 * @access  Private
 */
router.get('/', protect, getOrders);

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get orders for current user
 * @access  Private
 */
router.get('/my-orders', protect, getMyOrders);

/**
 * @route   GET /api/orders/shippers/available
 * @desc    Get available shippers
 * @access  Private/Shop
 */
router.get('/shippers/available', protect, requireRoles('shop', 'admin'), getAvailableShippers);

/**
 * @route   GET /api/orders/:id/tracking
 * @desc    Get delivery tracking for an order
 * @access  Private
 */
router.get('/:id/tracking', protect, getOrderTracking);

/**
 * @route   GET /api/orders/:id
 * @desc    Get an order by ID
 * @access  Private
 */
router.get('/:id', protect, getOrderById);

/**
 * @route   GET /api/orders/user/:userId
 * @desc    Get orders by user ID
 * @access  Private
 */
router.get('/user/:userId', protect, getOrdersByUserId);

/**
 * @route   PUT /api/orders/:id
 * @desc    Update an order
 * @access  Private
 */
router.put('/:id', protect, updateOrder);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private/Admin
 */
router.patch('/:id/status', protect, requireRoles('admin', 'shop'), updateOrderStatus);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private
 */
router.post('/:id/cancel', protect, cancelOrder);

/**
 * @route   POST /api/orders/:id/refund
 * @desc    Refund an order
 * @access  Private
 */
router.post('/:id/refund', protect, refundOrder);

/**
 * @route   POST /api/orders/:id/assign-shipper
 * @desc    Assign shipper to order (manual)
 * @access  Private/Shop
 */
router.post('/:id/assign-shipper', protect, requireRoles('shop', 'admin'), assignShipper);

/**
 * @route   POST /api/orders/:id/auto-assign-shipper
 * @desc    Auto-assign shipper to order
 * @access  Private/Shop
 */
router.post('/:id/auto-assign-shipper', protect, requireRoles('shop', 'admin'), autoAssignShipper);

/**
 * @route   POST /api/orders/:id/confirm
 * @desc    Order owner confirms order received
 * @access  Private/Order Owner
 */
router.post('/:id/confirm', protect, confirmOrderReceived);

/**
 * @route   POST /api/orders/:id/report-issue
 * @desc    Report delivery issue (only order owner can report)
 * @access  Private
 */
router.post('/:id/report-issue', protect, reportDeliveryIssue);

export default router;
