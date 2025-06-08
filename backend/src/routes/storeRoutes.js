/**
 * @fileoverview Shop Routes
 * @created 2025-06-04
 * @file storeRoutes.js
 * @description This file defines all shop-related routes for the Kicks Shoes application.
 * It maps HTTP endpoints to their corresponding controller functions and applies necessary middleware.
 */

import express from "express";
import {
  getStoreProducts,
  addStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
} from "../controllers/storeController.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireAdmin, requireShop } from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

// Public routes
router.get("/products", getStoreProducts);

// Admin routes
router.post(
  "/products",
  protect,
  requireAdmin,
  upload.array("images", 5),
  addStoreProduct
);
router.put(
  "/products/:productId",
  protect,
  requireAdmin,
  upload.array("images", 5),
  updateStoreProduct
);
router.delete("/products/:productId", protect, requireShop, deleteStoreProduct);

export default router;
