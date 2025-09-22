/**
 * @fileoverview Validation Utilities
 * @created 2025-05-31
 * @file validation.js
 * @description This file contains utility functions for data validation in the Kicks Shoes application.
 * It provides methods for validating email addresses, phone numbers, and other user input data.
 */

import { body, param, query } from 'express-validator';

// Email validation
export const validateEmail = email => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Phone validation
export const validatePhone = phone => {
  const re = /^[0-9]{10,11}$/;
  return re.test(phone);
};

// Password validation
export const validatePassword = password => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(password);
};

// Flash Sale validation
export const validateFlashSale = [
  body('title')
    .notEmpty()
    .withMessage('Flash sale title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be 1-100 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),

  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date is invalid'),

  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date is invalid')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.startDate);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('products').isArray({ min: 1 }).withMessage('Must have at least 1 product in flash sale'),

  body('products.*.productId').isMongoId().withMessage('Invalid product ID'),

  body('products.*.discountPercent')
    .optional()
    .isNumeric()
    .withMessage('Discount percent must be a number')
    .custom(value => {
      if (value < 0 || value > 100) {
        throw new Error('Discount percent must be between 0-100');
      }
      return true;
    }),

  body('products.*.flashPrice')
    .optional()
    .isNumeric()
    .withMessage('Flash sale price must be a number')
    .custom(value => {
      if (value < 0) {
        throw new Error('Flash sale price must be greater than or equal to 0');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['upcoming', 'active', 'ended', 'cancelled'])
    .withMessage('Invalid status'),
];

// Flash Sale status update validation
export const validateFlashSaleStatus = [
  body('status')
    .notEmpty()
    .withMessage('Trạng thái là bắt buộc')
    .isIn(['upcoming', 'active', 'ended', 'cancelled'])
    .withMessage('Invalid status'),
];

// Flash Sale query validation
export const validateFlashSaleQuery = [
  query('status')
    .optional()
    .isIn(['upcoming', 'active', 'ended', 'cancelled'])
    .withMessage('Invalid status'),

  query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),

  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Giới hạn phải từ 1-100'),

  query('sort')
    .optional()
    .matches(/^-?[a-zA-Z]+$/)
    .withMessage('Sắp xếp không hợp lệ'),
];

// Flash Sale ID validation
export const validateFlashSaleId = [
  param('id').isMongoId().withMessage('ID flash sale không hợp lệ'),
];

// Product ID validation for flash sale
export const validateProductId = [
  param('productId').isMongoId().withMessage('ID sản phẩm không hợp lệ'),
];
