/**
 * @fileoverview Password Middleware
 * @created 2025-06-04
 * @file passwordMiddleware.js
 * @description This file contains middleware functions for password hashing and comparison in the Kicks Shoes application.
 */

import bcrypt from "bcryptjs";

/**
 * Hash the password before saving it to the database
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 */
export const hashPassword = async (req, res, next) => {
  try {
    if (!req.body.password) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
    next();
  } catch (error) {
    next(error);
  }
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
