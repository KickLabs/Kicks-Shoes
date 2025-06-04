/**
 * @fileoverview Error Response Utility
 * @created 2025-05-31
 * @file errorResponse.js
 * @description This file defines a custom error response class for the Kicks Shoes application.
 * It extends the Error class to include HTTP status codes and standardized error formatting.
 */

class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export { ErrorResponse };
