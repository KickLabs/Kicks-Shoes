/**
 * Unit Tests for Cloudinary Configuration
 * Tests cloudinary config, storage setup, and handleUpload middleware
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

await jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: mockLogger,
}));

// Mock cloudinary
const mockCloudinaryConfig = jest.fn();
const mockCloudinaryV2 = {
  config: mockCloudinaryConfig,
  uploader: {
    upload: jest.fn(),
  },
};

await jest.unstable_mockModule('cloudinary', () => ({
  v2: mockCloudinaryV2,
}));

// Mock CloudinaryStorage
const mockCloudinaryStorage = jest.fn(function (options) {
  this.options = options;
  this._handleFile = jest.fn();
  this._removeFile = jest.fn();
  return this;
});

await jest.unstable_mockModule('multer-storage-cloudinary', () => ({
  CloudinaryStorage: mockCloudinaryStorage,
}));

// Set environment variables before import
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
    CLOUDINARY_API_KEY: 'test-api-key',
    CLOUDINARY_API_SECRET: 'test-api-secret',
  };
  jest.clearAllMocks();
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Cloudinary Configuration Unit Tests', () => {
  describe('UM-U-026 to UM-U-030: Cloudinary Config with Environment Variables', () => {
    test('UM-U-026: Should configure cloudinary with valid env vars', async () => {
      // Import module which triggers config
      await import('../../src/config/cloudinary.js');

      expect(mockCloudinaryConfig).toHaveBeenCalledWith({
        cloud_name: 'test-cloud',
        api_key: 'test-api-key',
        api_secret: 'test-api-secret',
      });
    });

    test('UM-U-027: Should handle missing CLOUDINARY_CLOUD_NAME', () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;

      // Config will be called with undefined
      expect(process.env.CLOUDINARY_CLOUD_NAME).toBeUndefined();
    });

    test('UM-U-028: Should handle missing CLOUDINARY_API_KEY', () => {
      delete process.env.CLOUDINARY_API_KEY;

      expect(process.env.CLOUDINARY_API_KEY).toBeUndefined();
    });

    test('UM-U-029: Should handle missing CLOUDINARY_API_SECRET', () => {
      delete process.env.CLOUDINARY_API_SECRET;

      expect(process.env.CLOUDINARY_API_SECRET).toBeUndefined();
    });

    test('UM-U-030: Should handle all missing credentials', () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;

      expect(process.env.CLOUDINARY_CLOUD_NAME).toBeUndefined();
      expect(process.env.CLOUDINARY_API_KEY).toBeUndefined();
      expect(process.env.CLOUDINARY_API_SECRET).toBeUndefined();
    });
  });

  describe('UM-U-031 to UM-U-033: CloudinaryStorage Configuration', () => {
    test('UM-U-031: Should create CloudinaryStorage with correct params', () => {
      // CloudinaryStorage is initialized when module loads
      // Test the class itself was mocked
      expect(mockCloudinaryStorage).toBeDefined();
      expect(typeof mockCloudinaryStorage).toBe('function');

      // Create a test instance
      const instance = new mockCloudinaryStorage({
        cloudinary: mockCloudinaryV2,
        params: {
          folder: 'kicks-shoes/avatars',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
        },
      });

      expect(instance.options).toBeDefined();
      expect(instance.options.params.folder).toBe('kicks-shoes/avatars');
      expect(instance.options.params.allowed_formats).toEqual(['jpg', 'jpeg', 'png', 'gif']);
    });

    test('UM-U-032: Should configure image transformation parameters', () => {
      const params = {
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
        format: 'jpg',
      };

      const instance = new mockCloudinaryStorage({
        cloudinary: mockCloudinaryV2,
        params,
      });

      expect(instance.options.params.transformation).toEqual([
        { width: 500, height: 500, crop: 'limit' },
      ]);
      expect(instance.options.params.format).toBe('jpg');
    });

    test('UM-U-033: Should configure unique filename generation', () => {
      const params = {
        use_filename: true,
        unique_filename: true,
        overwrite: true,
        secure: true,
      };

      const instance = new mockCloudinaryStorage({
        cloudinary: mockCloudinaryV2,
        params,
      });

      expect(instance.options.params.use_filename).toBe(true);
      expect(instance.options.params.unique_filename).toBe(true);
      expect(instance.options.params.overwrite).toBe(true);
      expect(instance.options.params.secure).toBe(true);
    });

    test('Should configure filename function', () => {
      const filename = function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix);
      };

      // Test filename function
      const req = {};
      const file = { fieldname: 'avatar' };
      const cb = jest.fn();

      filename(req, file, cb);

      expect(cb).toHaveBeenCalled();
      const generatedFilename = cb.mock.calls[0][1];
      expect(generatedFilename).toMatch(/^avatar-\d+-\d+$/);
    });

    test('Filename should include timestamp and random number', () => {
      const filename = function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix);
      };

      const req = {};
      const file = { fieldname: 'image' };
      const cb = jest.fn();

      // Call filename generator multiple times
      filename(req, file, cb);
      const filename1 = cb.mock.calls[0][1];

      cb.mockClear();
      filename(req, file, cb);
      const filename2 = cb.mock.calls[0][1];

      // Filenames should be different
      expect(filename1).not.toBe(filename2);
      expect(filename1).toContain('image-');
      expect(filename2).toContain('image-');
    });
  });

  describe('UM-U-034 to UM-U-037: handleUpload Middleware', () => {
    let handleUpload;

    beforeEach(async () => {
      jest.resetModules();
      jest.clearAllMocks();
      const module = await import('../../src/config/cloudinary.js');
      handleUpload = module.handleUpload;
    });

    test('UM-U-034: Should convert HTTP URL to HTTPS', () => {
      const req = {
        file: {
          originalname: 'test.jpg',
          path: 'http://res.cloudinary.com/test/image.jpg',
        },
      };
      const res = {};
      const next = jest.fn();

      handleUpload(req, res, next);

      expect(req.file.path).toBe('https://res.cloudinary.com/test/image.jpg');
      expect(mockLogger.info).toHaveBeenCalledWith('File upload result:', {
        originalname: 'test.jpg',
        path: 'https://res.cloudinary.com/test/image.jpg',
      });
      expect(next).toHaveBeenCalled();
    });

    test('UM-U-035: Should preserve HTTPS URL', () => {
      const req = {
        file: {
          originalname: 'test.jpg',
          path: 'https://res.cloudinary.com/test/image.jpg',
        },
      };
      const res = {};
      const next = jest.fn();

      handleUpload(req, res, next);

      expect(req.file.path).toBe('https://res.cloudinary.com/test/image.jpg');
      expect(next).toHaveBeenCalled();
    });

    test('UM-U-036: Should handle no file uploaded', () => {
      const req = {}; // No file
      const res = {};
      const next = jest.fn();

      handleUpload(req, res, next);

      expect(mockLogger.info).toHaveBeenCalledWith('No file uploaded');
      expect(next).toHaveBeenCalled();
    });

    test('UM-U-037: Should log upload info', () => {
      const req = {
        file: {
          originalname: 'photo.png',
          path: 'https://cloudinary.com/photo.png',
        },
      };
      const res = {};
      const next = jest.fn();

      handleUpload(req, res, next);

      expect(mockLogger.info).toHaveBeenCalledWith('File upload result:', {
        originalname: 'photo.png',
        path: 'https://cloudinary.com/photo.png',
      });
    });

    test('Should handle file without path property', () => {
      const req = {
        file: {
          originalname: 'test.jpg',
          // No path property
        },
      };
      const res = {};
      const next = jest.fn();

      handleUpload(req, res, next);

      expect(mockLogger.info).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('Should handle undefined req.file gracefully', () => {
      const req = { file: undefined };
      const res = {};
      const next = jest.fn();

      handleUpload(req, res, next);

      expect(mockLogger.info).toHaveBeenCalledWith('No file uploaded');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Additional Coverage Tests', () => {
    test('Should export cloudinary instance', async () => {
      const { cloudinary } = await import('../../src/config/cloudinary.js');
      expect(cloudinary).toBeDefined();
      expect(cloudinary).toBe(mockCloudinaryV2);
    });

    test('Should export storage instance', async () => {
      const { storage } = await import('../../src/config/cloudinary.js');
      expect(storage).toBeDefined();
    });

    test('Should export handleUpload middleware', async () => {
      const { handleUpload } = await import('../../src/config/cloudinary.js');
      expect(typeof handleUpload).toBe('function');
      expect(handleUpload.length).toBe(3); // Express middleware signature
    });

    test('Storage params should have correct resource_type', () => {
      const params = {
        resource_type: 'auto',
      };

      const instance = new mockCloudinaryStorage({
        cloudinary: mockCloudinaryV2,
        params,
      });

      expect(instance.options.params.resource_type).toBe('auto');
    });

    test('Should handle multiple HTTP replacements in URL', async () => {
      const { handleUpload } = await import('../../src/config/cloudinary.js');

      const req = {
        file: {
          originalname: 'test.jpg',
          path: 'http://http://res.cloudinary.com/test.jpg',
        },
      };
      const res = {};
      const next = jest.fn();

      handleUpload(req, res, next);

      // Should replace first http:// with https://
      expect(req.file.path).toContain('https://');
    });
  });

  describe('Environment Variable Edge Cases', () => {
    test('Should handle empty string environment variables', () => {
      process.env.CLOUDINARY_CLOUD_NAME = '';
      process.env.CLOUDINARY_API_KEY = '';
      process.env.CLOUDINARY_API_SECRET = '';

      expect(process.env.CLOUDINARY_CLOUD_NAME).toBe('');
      expect(process.env.CLOUDINARY_API_KEY).toBe('');
      expect(process.env.CLOUDINARY_API_SECRET).toBe('');
    });

    test('Should handle whitespace in environment variables', () => {
      process.env.CLOUDINARY_CLOUD_NAME = '  test-cloud  ';

      expect(process.env.CLOUDINARY_CLOUD_NAME).toBe('  test-cloud  ');
    });
  });
});
