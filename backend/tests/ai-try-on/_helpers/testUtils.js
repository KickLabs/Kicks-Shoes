/**
 * Test Utilities for AI & Try-on Tests
 * Provides helper functions for creating test data and assertions
 */

/**
 * Create a mock Express request object with file uploads
 * @param {Object} options - Request options
 * @returns {Object} Mock request object
 */
export function createMockRequest({
  userImage,
  clothingImage,
  body = {},
  query = {},
  params = {},
} = {}) {
  return {
    files: {
      ...(userImage ? { userImage: [userImage] } : {}),
      ...(clothingImage ? { clothingImage: [clothingImage] } : {}),
    },
    body,
    query,
    params,
    headers: {},
  };
}

/**
 * Create a mock Express response object
 * @returns {Object} Mock response object with spy functions
 */
export function createMockResponse() {
  const res = {
    statusCode: 200,
    _data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this._data = data;
      return this;
    },
    send(data) {
      this._data = data;
      return this;
    },
  };
  return res;
}

/**
 * Create a mock file object (as created by multer)
 * @param {Object} options - File options
 * @returns {Object} Mock file object
 */
export function createMockFile({
  fieldname = 'file',
  originalname = 'test.jpg',
  encoding = '7bit',
  mimetype = 'image/jpeg',
  buffer = Buffer.from('fake-image-data'),
  size = buffer.length,
} = {}) {
  return {
    fieldname,
    originalname,
    encoding,
    mimetype,
    buffer,
    size,
  };
}

/**
 * Create mock image buffer for testing
 * @param {string} format - Image format (jpeg, png, webp)
 * @param {number} sizeKB - Approximate size in KB
 * @returns {Buffer} Mock image buffer
 */
export function createMockImageBuffer(format = 'jpeg', sizeKB = 100) {
  const sizeBytes = sizeKB * 1024;
  let header;

  switch (format.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      header = 'FFD8FFE0'; // JPEG magic number
      break;
    case 'png':
      header = '89504E47'; // PNG magic number
      break;
    case 'webp':
      header = '52494646'; // RIFF (WebP container)
      break;
    default:
      header = '00000000';
  }

  const headerBuffer = Buffer.from(header, 'hex');
  const paddingSize = sizeBytes - headerBuffer.length;
  const paddingBuffer = Buffer.alloc(Math.max(0, paddingSize), 0);

  return Buffer.concat([headerBuffer, paddingBuffer]);
}

/**
 * Create a mock user object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock user object
 */
export function createMockUser(overrides = {}) {
  return {
    _id: 'user-test-123',
    email: 'testuser@example.com',
    name: 'Test User',
    profileImage: 'https://example.com/profile/test-user.jpg',
    avatar: 'https://example.com/avatar/test-user.jpg',
    ...overrides,
  };
}

/**
 * Create a mock product object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock product object
 */
export function createMockProduct(overrides = {}) {
  return {
    _id: 'product-abc-456',
    name: 'Nike Air Max 2024',
    mainImage: 'https://example.com/products/nike-air-max.png',
    price: { regular: 150, finalPrice: 150 },
    category: 'Running Shoes',
    brand: 'Nike',
    ...overrides,
  };
}

/**
 * Create a mock Gemini API response
 * @param {Object} options - Response options
 * @returns {Object} Mock Gemini response
 */
export function createMockGeminiResponse({
  hasImage = true,
  hasText = true,
  imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  imageMimeType = 'image/png',
  text = 'Generated virtual try-on image successfully.',
  blocked = false,
  blockReason = null,
} = {}) {
  if (blocked) {
    return {
      promptFeedback: {
        blockReason: blockReason || 'SAFETY',
      },
      candidates: [],
    };
  }

  const parts = [];

  if (hasImage) {
    parts.push({
      inlineData: {
        data: imageData,
        mimeType: imageMimeType,
      },
    });
  }

  if (hasText) {
    parts.push({
      text,
    });
  }

  return {
    candidates: [
      {
        content: {
          parts,
        },
      },
    ],
  };
}

/**
 * Validate base64 image data URL format
 * @param {string} dataUrl - Data URL to validate
 * @returns {boolean} True if valid data URL
 */
export function isValidImageDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return false;

  const dataUrlPattern = /^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)$/;
  return dataUrlPattern.test(dataUrl);
}

/**
 * Extract base64 data from data URL
 * @param {string} dataUrl - Data URL
 * @returns {string} Base64 data
 */
export function extractBase64FromDataUrl(dataUrl) {
  if (!isValidImageDataUrl(dataUrl)) return null;
  return dataUrl.split(',')[1];
}

/**
 * Performance measurement wrapper
 * @param {Function} fn - Function to measure
 * @returns {Promise<{ result: any, duration: number }>}
 */
export async function measurePerformance(fn) {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  return { result, duration };
}

/**
 * Wait for a specified duration
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert that a value is within a range
 * @param {number} value - Value to check
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} message - Error message
 */
export function assertInRange(value, min, max, message = '') {
  if (value < min || value > max) {
    throw new Error(message || `Expected ${value} to be between ${min} and ${max}`);
  }
}

/**
 * Create a spy function that tracks calls
 * @returns {Function} Spy function with call tracking
 */
export function createSpy() {
  const calls = [];
  const spy = function (...args) {
    calls.push({ args, timestamp: Date.now() });
    return spy._returnValue;
  };
  spy.calls = calls;
  spy._returnValue = undefined;
  spy.mockReturnValue = value => {
    spy._returnValue = value;
    return spy;
  };
  spy.callCount = () => calls.length;
  spy.calledWith = (...expectedArgs) => {
    return calls.some(call => JSON.stringify(call.args) === JSON.stringify(expectedArgs));
  };
  spy.reset = () => {
    calls.length = 0;
  };
  return spy;
}
