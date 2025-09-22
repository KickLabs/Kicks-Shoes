import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

// Create a window object for DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Configuration for DOMPurify
const purifyConfig = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'div',
    'span',
    'pre',
    'code',
  ],
  ALLOWED_ATTR: [
    'href',
    'src',
    'alt',
    'title',
    'class',
    'id',
    'style',
    'width',
    'height',
    'colspan',
    'rowspan',
    'target',
    'rel',
  ],
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - The HTML content to sanitize
 * @returns {string} - Sanitized HTML content
 */
export const sanitizeHtml = html => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    return purify.sanitize(html, purifyConfig);
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    return '';
  }
};

/**
 * Sanitize plain text content
 * @param {string} text - The text content to sanitize
 * @returns {string} - Sanitized text content
 */
export const sanitizeText = text => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

export default {
  sanitizeHtml,
  sanitizeText,
};
