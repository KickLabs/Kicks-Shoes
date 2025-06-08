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
import { protect, optionalAuth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/roleAuth.js";

const router = express.Router();

// Public routes (optional auth)
router.get("/", optionalAuth, getCategories);
router.get("/:id", optionalAuth, getCategory);

// Admin only routes
router.post("/", protect, requireAdmin, createCategory);
router.put("/:id", protect, requireAdmin, updateCategory);
router.delete("/:id", protect, requireAdmin, deleteCategory);

export default router;
