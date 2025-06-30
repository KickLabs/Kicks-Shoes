/**
 * @fileoverview User Routes
 * @created 2025-06-04
 * @file userRoutes.js
 * @description This file defines all user-related routes for the Kicks Shoes application.
 * It maps HTTP endpoints to their corresponding controller functions and applies necessary middleware.
 */

import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserProfile,
  updateUserProfile,
  getUsersIsActive,
  toggleUserStatus,
} from '../controllers/userController.js';
import { protect, optionalAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin, requireShop } from '../middlewares/role.middleware.js';
import upload from '../middlewares/upload.middleware.js';
import { handleUpload } from '../config/cloudinary.js';

const router = express.Router();

// Public routes (optional auth)
router.get('/profile/:username', optionalAuth, getUserProfile);

// Protected routes
router.put('/profile', protect, upload.single('avatar'), handleUpload, updateUserProfile);

// Admin only routes
router.route('/').get(protect, requireAdmin, getUsers).post(protect, requireAdmin, createUser);

router.get('/active', protect, requireShop, getUsersIsActive);

router
  .route('/:id')
  .get(protect, requireAdmin, getUser)
  .put(protect, requireAdmin, updateUser)
  .delete(protect, requireAdmin, deleteUser);

// User status management (ban/unban)
router.patch('/:id/status', protect, requireAdmin, toggleUserStatus);

export default router;
