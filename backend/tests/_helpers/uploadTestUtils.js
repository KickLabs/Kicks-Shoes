/**
 * Test Utilities for Upload Tests
 * Provides helper functions and mock data for upload testing
 */

import { jest } from '@jest/globals';

/**
 * Create mock file object for testing
 */
export const createMockFile = (options = {}) => {
  const defaults = {
    originalname: 'test.jpg',
    mimetype: 'image/jpeg',
    size: 1024 * 1024, // 1MB
    fieldname: 'image',
    buffer: Buffer.from('fake-image-data'),
  };

  return { ...defaults, ...options };
};

/**
 * Create mock multer file with path (after upload)
 */
export const createMockUploadedFile = (options = {}) => {
  const defaults = {
    originalname: 'test.jpg',
    mimetype: 'image/jpeg',
    size: 1024 * 1024,
    fieldname: 'image',
    path: 'https://res.cloudinary.com/test/image/upload/test.jpg',
    filename: 'test.jpg',
  };

  return { ...defaults, ...options };
};

/**
 * Create mock Cloudinary response
 */
export const createMockCloudinaryResponse = (options = {}) => {
  const defaults = {
    secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    public_id: 'sample',
    format: 'jpg',
    width: 500,
    height: 500,
    bytes: 45678,
    created_at: new Date().toISOString(),
  };

  return { ...defaults, ...options };
};

/**
 * Create mock Express request with file
 */
export const createMockRequest = (options = {}) => {
  const defaults = {
    file: createMockFile(),
    files: undefined,
    body: {},
    params: {},
    query: {},
  };

  return { ...defaults, ...options };
};

/**
 * Create mock Express response
 */
export const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Create mock next function
 */
export const createMockNext = () => jest.fn();

/**
 * File validation test data
 */
export const fileValidationTestData = {
  validFiles: [
    { originalname: 'photo.jpg', mimetype: 'image/jpeg' },
    { originalname: 'image.png', mimetype: 'image/png' },
    { originalname: 'animation.gif', mimetype: 'image/gif' },
    { originalname: 'picture.jpeg', mimetype: 'image/jpeg' },
  ],
  invalidFiles: [
    { originalname: 'malware.exe', mimetype: 'application/x-msdownload' },
    { originalname: 'document.pdf', mimetype: 'application/pdf' },
    { originalname: 'file.txt', mimetype: 'text/plain' },
    { originalname: 'image.bmp', mimetype: 'image/bmp' },
    { originalname: 'file', mimetype: 'application/octet-stream' },
    { originalname: 'image.jpg.exe', mimetype: 'application/x-msdownload' },
  ],
  edgeCases: [
    { originalname: 'PHOTO.JPG', mimetype: 'image/jpeg' }, // uppercase
    { originalname: 'test@#$%.jpg', mimetype: 'image/jpeg' }, // special chars
    { originalname: 'a'.repeat(200) + '.jpg', mimetype: 'image/jpeg' }, // long name
  ],
};

/**
 * File size test data (in bytes)
 */
export const fileSizeTestData = {
  tiny: 10, // 10 bytes
  small: 500 * 1024, // 500KB
  medium: 5 * 1024 * 1024, // 5MB
  atLimit: 10 * 1024 * 1024, // 10MB
  overLimit: 11 * 1024 * 1024, // 11MB
  veryLarge: 50 * 1024 * 1024, // 50MB
};

/**
 * Mock logger
 */
export const createMockLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
});

/**
 * Mock Cloudinary SDK
 */
export const createMockCloudinary = () => ({
  config: jest.fn(),
  uploader: {
    upload: jest.fn().mockResolvedValue(createMockCloudinaryResponse()),
    destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
  },
});

/**
 * Create mock CloudinaryStorage
 */
export const createMockCloudinaryStorage = () => {
  class MockStorage {
    constructor(options) {
      this.options = options;
    }

    _handleFile(req, file, cb) {
      const uploadResult = {
        path: `https://res.cloudinary.com/test/${file.originalname}`,
        filename: file.originalname,
      };
      cb(null, uploadResult);
    }

    _removeFile(req, file, cb) {
      cb(null);
    }
  }

  return MockStorage;
};

/**
 * Assert valid Cloudinary URL format
 */
export const expectValidCloudinaryUrl = url => {
  expect(url).toMatch(/^https:\/\//);
  expect(url).toContain('cloudinary.com');
};

/**
 * Assert file in request
 */
export const expectFileInRequest = (req, fieldName = 'image') => {
  expect(req.file || req.files).toBeDefined();
  if (req.file) {
    expect(req.file.fieldname).toBe(fieldName);
  }
};

/**
 * Assert upload error response
 */
export const expectUploadError = (response, errorMessage) => {
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(response.body).toHaveProperty('error');
  if (errorMessage) {
    expect(response.body.error).toContain(errorMessage);
  }
};

/**
 * Create Buffer of specific size
 */
export const createBufferOfSize = sizeInBytes => {
  return Buffer.alloc(sizeInBytes);
};

/**
 * Simulate file upload progress
 */
export const simulateUploadProgress = (totalSize, callback) => {
  const chunks = 10;
  const chunkSize = totalSize / chunks;
  let loaded = 0;

  return new Promise(resolve => {
    const interval = setInterval(() => {
      loaded += chunkSize;
      callback({ loaded, total: totalSize, percent: (loaded / totalSize) * 100 });

      if (loaded >= totalSize) {
        clearInterval(interval);
        resolve();
      }
    }, 10);
  });
};

/**
 * Environment variable helpers
 */
export const setupCloudinaryEnv = () => {
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-api-key';
  process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
};

export const clearCloudinaryEnv = () => {
  delete process.env.CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_API_KEY;
  delete process.env.CLOUDINARY_API_SECRET;
};

export const getInvalidCloudinaryEnv = () => ({
  CLOUDINARY_CLOUD_NAME: 'invalid',
  CLOUDINARY_API_KEY: 'invalid',
  CLOUDINARY_API_SECRET: 'invalid',
});
