/**
 * @fileoverview Shop Routes
 * @created 2025-06-04
 * @file storeRoutes.js
 * @description This file defines all shop-related routes for the Kicks Shoes application.
 * It maps HTTP endpoints to their corresponding controller functions and applies necessary middleware.
 */

import express from "express";
import {
  getAllStores,
  getStoreById,
  updateStore,
  deleteStore,
  createStore,
  getStoreProducts,
  addStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
} from "../controllers/storeController.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireAdmin, requireShop, requireRoles } from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.route("/").get(getAllStores);// Get all stores

router.route("/:id").get(getStoreById).put(updateStore);// Get store by id and update store

router.route("/:id/delete").delete(deleteStore);// Delete store

router.post("/create", protect, requireRoles("admin", "shop") , createStore);// Create store
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
