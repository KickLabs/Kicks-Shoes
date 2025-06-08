/**
 * @fileoverview Role Middleware
 * @created 2025-06-08
 * @file role.middleware.js
 * @description This file contains middleware functions for role-based access control.
 */

import { ErrorResponse } from "../utils/errorResponse.js";
import logger from "../utils/logger.js";

// Role definitions
export const ROLES = {
  GUEST: "guest",
  CUSTOMER: "customer",
  SHOP: "shop",
  ADMIN: "admin",
};

// Role hierarchy (higher roles have access to lower role routes)
const ROLE_HIERARCHY = {
  [ROLES.GUEST]: 0,
  [ROLES.CUSTOMER]: 1,
  [ROLES.SHOP]: 2,
  [ROLES.ADMIN]: 3,
};

/**
 * Middleware to check if user has required role level
 * @param {number} requiredLevel - Minimum role level required to access the route
 */
export const checkRoleLevel = (requiredLevel) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ErrorResponse("Authentication required", 401));
      }

      const userRoleLevel = ROLE_HIERARCHY[req.user.role];

      if (userRoleLevel === undefined) {
        logger.error("Invalid user role", { role: req.user.role });
        return next(new ErrorResponse("Invalid user role", 403));
      }

      if (userRoleLevel < requiredLevel) {
        return next(
          new ErrorResponse(
            `Role ${req.user.role} is not authorized to access this route`,
            403
          )
        );
      }

      next();
    } catch (error) {
      logger.error("Role check error", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  };
};

// Predefined role middleware functions
export const requireCustomer = checkRoleLevel(ROLE_HIERARCHY[ROLES.CUSTOMER]);
export const requireShop = checkRoleLevel(ROLE_HIERARCHY[ROLES.SHOP]);
export const requireAdmin = checkRoleLevel(ROLE_HIERARCHY[ROLES.ADMIN]);

/**
 * Middleware to check for exact role match
 * @param {string} role - Exact role required to access the route
 */
export const requireExactRole = (role) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ErrorResponse("Authentication required", 401));
      }

      if (req.user.role !== role) {
        return next(
          new ErrorResponse(`Only ${role} can access this route`, 403)
        );
      }

      next();
    } catch (error) {
      logger.error("Exact role check error", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  };
};

/**
 * Middleware to check if user has any of the required roles
 * @param {...string} roles - The roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: `Role ${
          req.user.role
        } is not authorized to access this route. Required roles: ${roles.join(
          ", "
        )}`,
      });
    }
  };
};
