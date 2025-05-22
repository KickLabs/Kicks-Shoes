/**
 * Format price to currency string
 * @param {number} price - The price to format
 * @param {string} currency - The currency symbol (default: '$')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, currency = "$", decimals = 2) => {
  if (typeof price !== "number") {
    return `${currency}0.00`;
  }

  return `${currency}${price.toFixed(decimals)}`;
};

/**
 * Format number with commas as thousand separators
 * @param {number} number - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (number) => {
  if (typeof number !== "number") {
    return "0";
  }

  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Format date to readable string
 * @param {string|Date} date - The date to format
 * @param {string} format - The format string (default: 'MM/DD/YYYY')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = "MM/DD/YYYY") => {
  if (!date) {
    return "";
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return "";
  }

  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();

  return format.replace("MM", month).replace("DD", day).replace("YYYY", year);
};

/**
 * Format string to title case
 * @param {string} str - The string to format
 * @returns {string} Formatted string
 */
export const formatTitleCase = (str) => {
  if (typeof str !== "string") {
    return "";
  }

  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Format string to slug
 * @param {string} str - The string to format
 * @returns {string} Formatted slug string
 */
export const formatSlug = (str) => {
  if (typeof str !== "string") {
    return "";
  }

  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};
