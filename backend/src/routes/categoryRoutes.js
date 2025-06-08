/**
 * @fileoverview Category Routes
 * @created 2025-06-04
 * @file categoryRoutes.js
 * @description This file defines all category-related routes for the Kicks Shoes application.
 * It maps HTTP endpoints to their corresponding controller functions and applies necessary middleware.
 */

import express from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect, optionalAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin, requireShop } from "../middlewares/role.middleware.js";

const router = express.Router();

// Public routes (optional auth)
router.get("/", optionalAuth, getCategories);
router.get("/:id", optionalAuth, getCategory);

// Admin only routes
router.post("/", protect, requireShop, createCategory);
router.put("/:id", protect, requireShop, updateCategory);
router.delete("/:id", protect, requireShop, deleteCategory);

export default router;
