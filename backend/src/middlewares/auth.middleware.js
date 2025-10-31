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
  let token;

  // Get token from header
  const authHeader = req.headers.authorization;

  console.log('Auth middleware - Headers:', {
    authHeader: authHeader ? 'exists' : 'missing',
    contentType: req.headers['content-type'],
    path: req.path,
    method: req.method,
  });

  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    console.log(
      'Token extracted from header:',
      token ? `${token.substring(0, 15)}...` : 'invalid token'
    );
  }

  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    console.log('No valid token provided');
    return next(new ErrorResponse('No valid token provided', 401));
  }

  try {
    // Check if token is blacklisted
    const blacklistedToken = await TokenBlacklist.findOne({ token });
    if (blacklistedToken) {
      console.log('Token is blacklisted');
      return next(new ErrorResponse('Token has been invalidated', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', { id: decoded.id, userId: decoded.userId });

    // Get user from token
    const user = await User.findById(decoded.id);

    console.log('User found from token:', user ? `${user._id} (${user.email})` : 'No user found');

    if (!user) {
      console.log('User not found with ID:', decoded.id);
      return next(new ErrorResponse('User not found', 404));
    }

    // Check if user is verified
    if (!user.isVerified) {
      console.log('User not verified:', user._id);
      return next(new ErrorResponse('Please verify your email before accessing this route', 401));
    }

    // Check if user is banned
    if (!user.status) {
      console.log('User is banned:', user._id);
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
      token: `${token.substring(0, 15)}...`,
    });
    console.error('Token verification failed:', error.message);
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

/**
 * Optional authentication - Check if user is authenticated but don't require it
 * Useful for routes that can be accessed by both guests and authenticated users
 */
/**
 * Tối ưu: Gộp tất cả logic vào một khối try-catch.
 * Mục đích: Bất kỳ lỗi nào xảy ra trong quá trình xác thực
 * (từ việc đọc header, kiểm tra blacklist, hay verify token)
 * đều sẽ được xử lý nhẹ nhàng bằng cách set req.user = null
 * và cho qua (next()) thay vì ném lỗi 500.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // 1. Lấy token từ header (logic này đã được đưa vào trong try)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 2. Nếu không có token, là guest
    if (!token) {
      req.user = null;
      return next();
    }

    // 3. Kiểm tra blacklist
    const blacklistedToken = await TokenBlacklist.findOne({ token });
    if (blacklistedToken) {
      req.user = null;
      return next();
    }

    // 4. Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    // 5. Gán user nếu hợp lệ
    if (user && user.isVerified && user.status) {
      // Ghi log user nếu cần
      // console.log('Decoded token:', decoded);
      // console.log('User found:', user);
      req.user = user;
    } else {
      req.user = null;
    }

    // 6. Cho qua (với user đã xác thực hoặc null)
    next();
  } catch (error) {
    // 7. BẮT TẤT CẢ LỖI:
    // Lỗi .split() (nếu header bị sai)
    // Lỗi TokenBlacklist.findOne (DB hỏng)
    // Lỗi jwt.verify (token hết hạn/sai)
    // Lỗi User.findById (DB hỏng)
    // ...Tất cả đều được xử lý bằng cách coi user là guest.
    req.user = null;
    next();
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
