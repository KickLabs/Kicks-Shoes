/**
 * @fileoverview Authentication Routes
 * @created 2025-05-31
 * @file authRoutes.js
 * @description This file defines all authentication-related routes for the Kicks Shoes application.
 * It maps HTTP endpoints to their corresponding controller functions and applies necessary middleware.
 * The routes are organized by functionality and access level (public/private).
 */

import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  verifyEmail,
  resendVerification,
  refreshToken,
  registerApp,
  verifyOtp,
  loginWithGoogle,
  loginWithFacebook,
  resendOtp,
  setPassword,
} from '../controllers/authController.js';
import { protect, optionalAuth } from '../middlewares/auth.middleware.js';
import { requireCustomer, requireShop, requireAdmin } from '../middlewares/role.middleware.js';

import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

// Public routes (no auth required)
/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/verify-email
 * @desc    Verify user email
 * @access  Public
 */
router.get('/verify-email', verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', resendVerification);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', resetPassword);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', refreshToken);

// Protected routes (require authentication)
/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   PUT /api/auth/update-profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/update-profile', protect, upload.single('avatar'), updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', protect, changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, logout);
router.post('/google-login', loginWithGoogle);
router.post('/facebook-login', loginWithFacebook);
router.post('/set-password', protect, setPassword);

router.post('/register-app', registerApp);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

export default router;
