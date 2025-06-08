/**
 * @fileoverview Product Routes
 * @created 2025-06-08
 * @file productRoutes.js
 * @description This file defines the routes for the product-related endpoints in the Kicks Shoes application.
 * It uses the productController to handle the business logic for each route.
 */

import { Router } from "express";
import {
  createProduct,
  createManyProducts,
} from "../controllers/productController.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Private routes
/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private
 */
router.post("/", protect, requireRoles("admin", "shop"), createProduct);

/**
 * @route   POST /api/products/bulk
 * @desc    Create multiple products
 * @access  Private
 */
router.post(
  "/bulk",
  protect,
  requireRoles("admin", "shop"),
  createManyProducts
);

export default router;
