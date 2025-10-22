/**
 * Mock cho sanitize service để tránh sử dụng jsdom trong test
 */

export const sanitizeText = text => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Simple XSS protection mock - remove script tags and dangerous content
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export default {
  sanitizeText,
};
