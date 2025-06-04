/**
 * @fileoverview JWT Utilities
 * @created 2025-05-31
 * @file jwt.js
 * @description This file contains utility functions for JWT token management in the Kicks Shoes application.
 * It provides methods for token generation, verification, and refresh token handling.
 */

import jwt from "jsonwebtoken";
import logger from "./logger.js";

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
export const generateToken = (payload, expiresIn) => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || "1d",
    });
  } catch (error) {
    logger.error("Error generating token", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error("Error verifying token", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });
  } catch (error) {
    logger.error("Error generating refresh token", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    logger.error("Error verifying refresh token", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
