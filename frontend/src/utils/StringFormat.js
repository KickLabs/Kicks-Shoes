/**
 * Format price to Vietnamese Dong (VND)
 * @param {number} price - The price to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.showSymbol - Whether to show VND symbol (default: true)
 * @param {boolean} options.showDecimals - Whether to show decimal places (default: false)
 * @param {string} options.symbol - Currency symbol (default: '₫')
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, options = {}) => {
  const { showSymbol = true, showDecimals = false, symbol = '₫' } = options;

  // Handle invalid input
  if (price === null || price === undefined || isNaN(price)) {
    return showSymbol ? `0 ${symbol}` : '0';
  }

  // Convert to number
  const numPrice = Number(price);

  // Format number with thousands separator
  const formattedNumber = numPrice.toLocaleString('vi-VN', {
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
 * Format number with commas as thousand separators
 * @param {number} number - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = number => {
  if (typeof number !== 'number') {
    return '0';
  }

  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format date to readable string
 * @param {string|Date} date - The date to format
 * @param {string} format - The format string (default: 'MM/DD/YYYY')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'MM/DD/YYYY') => {
  if (!date) {
    return '';
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }

  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();

  return format.replace('MM', month).replace('DD', day).replace('YYYY', year);
};

/**
 * Format string to title case
 * @param {string} str - The string to format
 * @returns {string} Formatted string
 */
export const formatTitleCase = str => {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format string to slug
 * @param {string} str - The string to format
 * @returns {string} Formatted slug string
 */
export const formatSlug = str => {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};
