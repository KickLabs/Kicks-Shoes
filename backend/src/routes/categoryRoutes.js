/**
 * @fileoverview Category Routes
 * @created 2025-06-04
 * @file categoryRoutes.js
 * @description This file defines all category-related routes for the Kicks Shoes application.
 * It maps HTTP endpoints to their corresponding controller functions and applies necessary middleware.
 */

import express from 'express';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategory,
} from '../controllers/categoryController.js';
import { protect, optionalAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin, requireShop } from '../middlewares/role.middleware.js';
import Category from '../models/Category.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);

// Admin only routes
router.route('/').post(protect, requireAdmin, createCategory);

router
  .route('/:id')
  .put(protect, requireAdmin, updateCategory)
  .delete(protect, requireAdmin, deleteCategory);

// Category status management (activate/deactivate)
router.patch('/:id/status', protect, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.status = status;
    await category.save();

    res.json({
      message: `Category has been ${status === 'active' ? 'activated' : 'deactivated'}`,
      status: category.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
