/**
 * @fileoverview Unit tests for Error Middleware
 * @module tests/routing&app/error-middleware.test.js
 * @description Tests error handling middleware and ErrorResponse class
 */

import { jest } from '@jest/globals';

// Mock logger before importing error middleware
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const logger = (await import('../../src/utils/logger.js')).default;
const { errorHandler, ErrorResponse } = await import('../../src/middlewares/error.middleware.js');

describe('Routing & App - Error Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request object
    req = {
      path: '/api/test',
      method: 'GET',
      body: {},
      params: {},
      query: {},
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock next function
    next = jest.fn();
  });

  describe('ErrorResponse Class', () => {
    test('Should create ErrorResponse with message and status code', () => {
      const error = new ErrorResponse('Test error', 400);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
    });

    test('Should create ErrorResponse with 403 status', () => {
      const error = new ErrorResponse('Forbidden', 403);

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
    });
  });

  describe('RAP-034: Generic Error caught and handled', () => {
    test('Should handle generic Error with default 500 status', () => {
      const error = new Error('Test error');

      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
      });
    });
  });

  describe('RAP-035: ErrorResponse with custom status code', () => {
    test('Should handle ErrorResponse with 403 status', () => {
      const error = new ErrorResponse('Forbidden', 403);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
      });
    });

    test('Should handle ErrorResponse with 401 status', () => {
      const error = new ErrorResponse('Unauthorized', 401);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
      });
    });
  });

  describe('RAP-036: Mongoose CastError returns 404', () => {
    test('Should convert CastError to 404 Not Found', () => {
      const error = new Error('Cast to ObjectId failed');
      error.name = 'CastError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Resource not found',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('RAP-037: Mongoose duplicate key error (11000)', () => {
    test('Should convert duplicate key error to 400', () => {
      const error = new Error('Duplicate key');
      error.code = 11000;
      error.keyPattern = { email: 1 };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Duplicate field value entered',
      });
    });
  });

  describe('RAP-038: Mongoose ValidationError returns 400', () => {
    test('Should convert ValidationError to 400 with messages', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      error.errors = {
        email: { message: 'Email is required' },
        password: { message: 'Password must be at least 6 characters' },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.success).toBe(false);
      expect(Array.isArray(jsonCall.error) || typeof jsonCall.error === 'string').toBe(true);
    });
  });

  describe('RAP-039: Invalid JWT token returns 401', () => {
    test('Should convert JsonWebTokenError to 401', () => {
      const error = new Error('invalid signature');
      error.name = 'JsonWebTokenError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
      });
    });
  });

  describe('RAP-040: Expired JWT token returns 401', () => {
    test('Should convert TokenExpiredError to 401', () => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired',
      });
    });
  });

  describe('RAP-041: Error without message returns generic message', () => {
    test('Should return "Server Error" when error has no message', () => {
      const error = new Error();
      error.message = '';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server Error',
      });
    });

    test('Should return "Server Error" when error message is undefined', () => {
      const error = new Error();
      delete error.message;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server Error',
      });
    });
  });

  describe('RAP-042: Error details logged correctly', () => {
    test('Should log error with full request details', () => {
      const error = new Error('Test logging error');
      req.body = { test: 'data' };
      req.params = { id: '123' };
      req.query = { filter: 'active' };

      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledWith('Error occurred:', {
        error: 'Test logging error',
        stack: expect.any(String),
        path: '/api/test',
        method: 'GET',
        body: { test: 'data' },
        params: { id: '123' },
        query: { filter: 'active' },
      });
    });

    test('Should log error stack trace', () => {
      const error = new Error('Error with stack');

      errorHandler(error, req, res, next);

      const logCall = logger.error.mock.calls[0][1];
      expect(logCall.stack).toBeDefined();
      expect(typeof logCall.stack).toBe('string');
    });
  });

  describe("RAP-043: Error handler doesn't expose sensitive info", () => {
    test('Should not include stack trace in response', () => {
      const error = new Error('Sensitive error');
      error.stack = 'Full stack trace with sensitive paths...';

      errorHandler(error, req, res, next);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall).not.toHaveProperty('stack');
      expect(jsonCall.error).toBe('Sensitive error');
    });

    test('Should not expose internal error details', () => {
      const error = new Error('Database connection failed');
      error.details = 'mongodb://username:password@host/db';

      errorHandler(error, req, res, next);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall).not.toHaveProperty('details');
      expect(jsonCall.success).toBe(false);
    });
  });

  describe('Additional Error Scenarios', () => {
    test('Should handle multiple errors in sequence', () => {
      const error1 = new ErrorResponse('First error', 400);
      const error2 = new ErrorResponse('Second error', 403);

      errorHandler(error1, req, res, next);
      errorHandler(error2, req, res, next);

      expect(res.status).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenNthCalledWith(1, 400);
      expect(res.status).toHaveBeenNthCalledWith(2, 403);
    });

    test('Should handle error with statusCode property', () => {
      const error = new Error('Custom status error');
      error.statusCode = 418; // I'm a teapot

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(418);
    });

    test('Should preserve error message in response', () => {
      const customMessage = 'Very specific error message';
      const error = new Error(customMessage);

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: customMessage,
      });
    });
  });
});
