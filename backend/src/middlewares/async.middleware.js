/**
 * @fileoverview Async Handler Middleware
 * @created 2025-05-31
 * @file asyncHandler.js
 * @description This file provides a utility middleware for handling asynchronous route handlers in the Kicks Shoes application.
 * It automatically catches and forwards errors to the error handling middleware.
 */

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
