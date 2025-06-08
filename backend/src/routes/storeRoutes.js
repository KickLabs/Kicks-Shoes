/**
 * @fileoverview Store Routes
 * @created 2025-06-04
 * @file storeRoutes.js
 * @description This file defines all store-related routes for the Kicks Shoes application.
 * It maps HTTP endpoints to their corresponding controller functions and applies necessary middleware.
 */

import express from "express";
import {
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  getStoreProducts,
  addStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
} from "../controllers/storeController.js";
import { protect, optionalAuth } from "../middlewares/auth.js";
import { requireShop, requireAdmin } from "../middlewares/roleAuth.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Public routes (optional auth)
router.get("/", optionalAuth, getStores);
router.get("/:id", optionalAuth, getStoreById);
router.get("/:id/products", optionalAuth, getStoreProducts);

// Shop owner routes
router.post("/", protect, requireShop, upload.single("logo"), createStore);
router.put("/:id", protect, requireShop, upload.single("logo"), updateStore);
router.delete("/:id", protect, requireShop, deleteStore);

// Store product management (shop owner)
router.post(
  "/:id/products",
  protect,
  requireShop,
  upload.array("images", 5),
  addStoreProduct
);
router.put(
  "/:id/products/:productId",
  protect,
  requireShop,
  upload.array("images", 5),
  updateStoreProduct
);
router.delete(
  "/:id/products/:productId",
  protect,
  requireShop,
  deleteStoreProduct
);

// Admin routes
router.delete("/admin/:id", protect, requireAdmin, deleteStore);

export default router;
