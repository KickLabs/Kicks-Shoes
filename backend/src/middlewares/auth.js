/**
 * @fileoverview Authentication Middleware
 * @created 2025-05-31
 * @file auth.js
 * @description This file contains middleware functions for handling authentication and authorization in the Kicks Shoes application.
 * It includes JWT token verification, role-based access control, and token blacklist checking.
 */

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import { ErrorResponse } from "../utils/errorResponse.js";
import logger from "../utils/logger.js";

/**
 * Protect routes - Check if user is authenticated
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new ErrorResponse("Not authorized to access this route", 401)
      );
    }

    try {
      // Check if token is blacklisted
      const blacklistedToken = await TokenBlacklist.findOne({ token });
      if (blacklistedToken) {
        return next(new ErrorResponse("Token has been invalidated", 401));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new ErrorResponse("User not found", 404));
      }

      // Check if user is verified
      if (!user.isVerified) {
        return next(
          new ErrorResponse(
            "Please verify your email before accessing this route",
            401
          )
        );
      }

      // Add user to request
      req.user = user;
      next();
    } catch (error) {
      logger.error("Token verification failed", {
        error: error.message,
        stack: error.stack,
      });
      return next(
        new ErrorResponse("Not authorized to access this route", 401)
      );
    }
  } catch (error) {
    logger.error("Auth middleware error", {
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
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
