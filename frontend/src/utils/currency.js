/**
 * @fileoverview Currency Utility Functions for Frontend
 * @created 2025-07-07
 * @file currency.js
 * @description Utility functions for currency formatting and calculations
 */

/**
 * Format number to VND currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted VND string
 */
export const formatVND = amount => {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format number to compact VND currency (K, M, B)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted compact VND string
 */
export const formatCompactVND = amount => {
  if (!amount && amount !== 0) return '0 ₫';
  const formatter = new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    compactDisplay: 'short',
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  return formatter.format(amount);
};

/**
 * Parse VND string to number
 * @param {string} vndString - VND string to parse
 * @returns {number} Parsed number
 */
export const parseVND = vndString => {
  if (!vndString) return 0;
  const cleanString = vndString.replace(/[^\d.]/g, '');
  const number = parseFloat(cleanString);
  return isNaN(number) ? 0 : number;
};

export default {
  formatVND,
  formatCompactVND,
  parseVND,
};
