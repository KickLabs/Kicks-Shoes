/**
 * @fileoverview Currency Utility Functions for Frontend
 * @created 2025-07-07
 * @file currency.js
 * @description Utility functions for currency formatting and calculations
 */

/**
 * Format number to Vietnamese Dong (VND)
 * @param {number} amount - Amount to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.showSymbol - Whether to show VND symbol (default: true)
 * @param {boolean} options.showDecimals - Whether to show decimal places (default: false)
 * @param {string} options.symbol - Currency symbol (default: '₫')
 * @returns {string} Formatted currency string
 */
export const formatVND = (amount, options = {}) => {
  const { showSymbol = true, showDecimals = false, symbol = '₫' } = options;

  // Handle invalid input
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? `0 ${symbol}` : '0';
  }

  // Convert to number
  const numAmount = Number(amount);

  // Format number with thousands separator
  const formattedNumber = numAmount.toLocaleString('vi-VN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
    useGrouping: true,
  });

  // Add currency symbol if requested
  if (showSymbol) {
    return `${formattedNumber} ${symbol}`;
  }

  return formattedNumber;
};

/**
 * Format number to Vietnamese Dong with compact notation (K, M, B)
 * @param {number} amount - Amount to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.showSymbol - Whether to show VND symbol (default: true)
 * @param {string} options.symbol - Currency symbol (default: '₫')
 * @returns {string} Formatted currency string with compact notation
 */
export const formatVNDCompact = (amount, options = {}) => {
  const { showSymbol = true, symbol = '₫' } = options;

  // Handle invalid input
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? `0 ${symbol}` : '0';
  }

  const numAmount = Number(amount);
  const absAmount = Math.abs(numAmount);

  let formattedAmount;
  let suffix = '';

  if (absAmount >= 1000000000) {
    formattedAmount = (numAmount / 1000000000).toFixed(1);
    suffix = 'B';
  } else if (absAmount >= 1000000) {
    formattedAmount = (numAmount / 1000000).toFixed(1);
    suffix = 'M';
  } else if (absAmount >= 1000) {
    formattedAmount = (numAmount / 1000).toFixed(1);
    suffix = 'K';
  } else {
    formattedAmount = numAmount.toString();
  }

  // Remove .0 if it's a whole number
  if (formattedAmount.endsWith('.0')) {
    formattedAmount = formattedAmount.slice(0, -2);
  }

  const result = `${formattedAmount}${suffix}`;

  if (showSymbol) {
    return `${result} ${symbol}`;
  }

  return result;
};

/**
 * Parse VND string back to number
 * @param {string} vndString - Formatted VND string
 * @returns {number} Parsed number
 */
export const parseVND = vndString => {
  if (!vndString || typeof vndString !== 'string') {
    return 0;
  }

  // Remove currency symbol and spaces
  const cleaned = vndString.replace(/[₫\s]/g, '');

  // Remove thousands separators
  const withoutSeparators = cleaned.replace(/,/g, '');

  // Parse to number
  const parsed = parseFloat(withoutSeparators);

  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Calculate percentage of amount
 * @param {number} amount - Base amount
 * @param {number} percentage - Percentage to calculate
 * @returns {number} Calculated amount
 */
export const calculatePercentage = (amount, percentage) => {
  if (!amount || !percentage || isNaN(amount) || isNaN(percentage)) {
    return 0;
  }

  return (amount * percentage) / 100;
};

/**
 * Calculate discount amount
 * @param {number} originalPrice - Original price
 * @param {number} discountPercentage - Discount percentage
 * @returns {Object} Discount calculation result
 */
export const calculateDiscount = (originalPrice, discountPercentage) => {
  if (!originalPrice || !discountPercentage || isNaN(originalPrice) || isNaN(discountPercentage)) {
    return {
      discountAmount: 0,
      finalPrice: originalPrice || 0,
    };
  }

  const discountAmount = calculatePercentage(originalPrice, discountPercentage);
  const finalPrice = originalPrice - discountAmount;

  return {
    discountAmount: Math.round(discountAmount),
    finalPrice: Math.round(finalPrice),
  };
};

/**
 * Format price range
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @param {Object} options - Formatting options
 * @returns {string} Formatted price range
 */
export const formatPriceRange = (minPrice, maxPrice, options = {}) => {
  const { showSymbol = true, symbol = '₫' } = options;

  if (!minPrice && !maxPrice) {
    return showSymbol ? `0 ${symbol}` : '0';
  }

  if (!maxPrice || minPrice === maxPrice) {
    return formatVND(minPrice, { showSymbol, symbol });
  }

  const minFormatted = formatVND(minPrice, { showSymbol: false });
  const maxFormatted = formatVND(maxPrice, { showSymbol: false });

  if (showSymbol) {
    return `${minFormatted} - ${maxFormatted} ${symbol}`;
  }

  return `${minFormatted} - ${maxFormatted}`;
};

/**
 * Validate if amount is a valid VND amount
 * @param {number} amount - Amount to validate
 * @returns {boolean} True if valid VND amount
 */
export const isValidVNDAmount = amount => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return false;
  }

  const numAmount = Number(amount);

  // VND amounts should be positive and reasonable
  return numAmount >= 0 && numAmount <= 999999999999;
};

/**
 * Round amount to nearest VND (no decimals in VND)
 * @param {number} amount - Amount to round
 * @returns {number} Rounded amount
 */
export const roundVND = amount => {
  if (!amount || isNaN(amount)) {
    return 0;
  }

  return Math.round(Number(amount));
};

// Export all functions
export default {
  formatVND,
  formatVNDCompact,
  parseVND,
  calculatePercentage,
  calculateDiscount,
  formatPriceRange,
  isValidVNDAmount,
  roundVND,
};
