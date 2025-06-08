/**
 * @fileoverview Order Routes
 * @created 2025-06-08
 * @file orderRoutes.js
 * @description This file defines the routes for the order-related endpoints in the Kicks Shoes application.
 * It uses the orderController to handle the business logic for each route.
 */

import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  getOrdersByUserId,
  updateOrder,
  cancelOrder,
  refundOrder,
} from "../controllers/orderController.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// Private routes
/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post("/", protect, createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get all orders
 * @access  Private
 */
router.get("/", protect, getOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get an order by ID
 * @access  Private
 */
router.get("/:id", protect, getOrderById);

/**
 * @route   GET /api/orders/user/:userId
 * @desc    Get orders by user ID
 * @access  Private
 */
router.get("/user/:userId", protect, getOrdersByUserId);

/**
 * @route   PUT /api/orders/:id
 * @desc    Update an order
 * @access  Private
 */
router.put("/:id", protect, updateOrder);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private
 */
router.post("/:id/cancel", protect, cancelOrder);

/**
 * @route   POST /api/orders/:id/refund
 * @desc    Refund an order
 * @access  Private
 */
router.post("/:id/refund", protect, refundOrder);

export default router;
