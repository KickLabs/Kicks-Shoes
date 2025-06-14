/**
 * @fileoverview Product Routes
 * @created 2025-06-08
 * @file productRoutes.js
 * @description This file defines the routes for the product-related endpoints in the Kicks Shoes application.
 * It uses the productController to handle the business logic for each route.
 */

import { Router } from "express";
import {
  createManyProducts,
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
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
router.get("/", protect, requireRoles("admin", "shop"), getAllProducts);
router.post("/add", protect, requireRoles("admin", "shop"), createProduct);
router.post(
  "/create",
  protect,
  requireRoles("admin", "shop"),
  createManyProducts
);
router.delete(
  "/:id/delete",
  protect,
  requireRoles("admin", "shop"),
  deleteProduct
);
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
/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get("/:id", protect, requireRoles("admin", "shop"), getProductById);
/**
 * @route   PUT /api/products/:id
 * @desc    Update product by ID
 * @access  Private
 */
router.put("/:id", protect, requireRoles("admin", "shop"), updateProduct);

export default router;
