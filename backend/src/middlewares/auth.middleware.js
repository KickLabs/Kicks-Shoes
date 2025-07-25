/**
 * @fileoverview Authentication Middleware
 * @created 2025-05-31
 * @file auth.js
 * @description This file contains middleware functions for handling authentication and authorization in the Kicks Shoes application.
 * It includes JWT token verification, role-based access control, and token blacklist checking.
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';
import { ROLES } from './role.middleware.js';

/**
 * Protect routes - Check if user is authenticated
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    const authHeader = req.headers.authorization;

    logger.info('RAW HEADER AUTHORIZATION:', authHeader);
    logger.info('HEADER TYPE:', typeof authHeader);

    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    logger.info('TOKEN RECEIVED:', token);

    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
      return next(new ErrorResponse('No valid token provided', 401));
    }

    try {
      // Check if token is blacklisted
      const blacklistedToken = await TokenBlacklist.findOne({ token });
      if (blacklistedToken) {
        return next(new ErrorResponse('Token has been invalidated', 401));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id || decoded.userId;
      // Get user from token
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new ErrorResponse('User not found', 404));
      }

      // Check if user is verified
      if (!user.isVerified) {
        return next(new ErrorResponse('Please verify your email before accessing this route', 401));
      }

      // Check if user is banned
      if (!user.status) {
        return next(
          new ErrorResponse(
            'Your account has been deactivated. Please contact support for assistance.',
            403
          )
        );
      }

      // Add user to request
      req.user = user;
      next();
    } catch (error) {
      logger.error('Token verification failed', {
        error: error.message,
        stack: error.stack,
        token,
      });
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
  } catch (error) {
    logger.error('Auth middleware error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Optional authentication - Check if user is authenticated but don't require it
 * Useful for routes that can be accessed by both guests and authenticated users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // No token provided, continue as guest
      req.user = null;
      return next();
    }

    try {
      const blacklistedToken = await TokenBlacklist.findOne({ token });
      if (blacklistedToken) {
        // Token is blacklisted, continue as guest
        req.user = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      // Trong protect
      console.log('Decoded token:', decoded);
      console.log('User found:', user);

      // Trong requireRoles hoặc authorize

      if (user && user.isVerified && user.status) {
        req.user = user;
      } else {
        req.user = null;
      }

      next();
    } catch (error) {
      // Token verification failed, continue as guest
      req.user = null;
      next();
    }
  } catch (error) {
    logger.error('Optional auth middleware error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Grant access to specific roles
 * @param  {...String} roles - Roles that can access the route
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403)
      );
    }
    console.log('User role:', req.user.role);

    next();
  };
};

/**
 * Middleware kiểm tra quyền admin
 */
export const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Admin access required' });
};
