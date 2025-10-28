/**
 * Integration Tests for Upload Routes
 * Tests POST /upload endpoint with multipart form data
 */

import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';

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
const mockCloudinaryUpload = jest.fn();
const mockCloudinary = {
  config: jest.fn(),
  uploader: {
    upload: mockCloudinaryUpload,
  },
};

await jest.unstable_mockModule('cloudinary', () => ({
  v2: mockCloudinary,
}));

// Mock CloudinaryStorage
class MockCloudinaryStorage {
  constructor(options) {
    this.options = options;
  }

  _handleFile(req, file, cb) {
    // Simulate successful upload
    const uploadResult = {
      path: `https://res.cloudinary.com/test/${file.originalname}`,
      filename: file.originalname,
      originalname: file.originalname,
    };
    cb(null, uploadResult);
  }

  _removeFile(req, file, cb) {
    cb(null);
  }
}

await jest.unstable_mockModule('multer-storage-cloudinary', () => ({
  CloudinaryStorage: MockCloudinaryStorage,
}));

describe('Upload Routes Integration Tests', () => {
  let app;
  let uploadRoutes;

  beforeAll(async () => {
    // Set test environment variables
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';

    // Create Express app
    app = express();
    app.use(express.json());

    // Import routes after mocks are set up
    const routesModule = await import('../../src/routes/uploadRoutes.js');
    uploadRoutes = routesModule.default;

    app.use('/api', uploadRoutes);

    // Error handler
    app.use((error, req, res, next) => {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Internal server error',
      });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UM-I-001 to UM-I-004: POST /upload Endpoint', () => {
    test('UM-I-001: Should upload valid image successfully', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('image', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url');
      expect(response.body.url).toContain('https://');
    });

    test('UM-I-002: Should return 400 when no file uploaded', async () => {
      const response = await request(app).post('/api/upload').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('No file uploaded');
    });

    test('UM-I-003: Should reject invalid file type', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('image', Buffer.from('fake-exe-data'), {
          filename: 'malware.exe',
          contentType: 'application/x-msdownload',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('UM-I-004: Should reject oversized file (>10MB)', async () => {
      // Create a buffer larger than 10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

      const response = await request(app).post('/api/upload').attach('image', largeBuffer, {
        filename: 'large.jpg',
        contentType: 'image/jpeg',
      });

      // Should return error for file too large
      expect([400, 413]).toContain(response.status);
    });
  });

  describe('UM-I-005 to UM-I-007: Additional Upload Tests', () => {
    test('UM-I-005: Should upload PNG file', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('image', Buffer.from('fake-png-data'), {
          filename: 'test.png',
          contentType: 'image/png',
        });

      expect(response.status).toBe(200);
      expect(response.body.url).toBeDefined();
    });

    test('UM-I-006: Should upload GIF file', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('image', Buffer.from('fake-gif-data'), {
          filename: 'animation.gif',
          contentType: 'image/gif',
        });

      expect(response.status).toBe(200);
      expect(response.body.url).toBeDefined();
    });

    test('UM-I-007: Should return Cloudinary URL format', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('image', Buffer.from('fake-image'), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(200);
      expect(response.body.url).toMatch(/^https:\/\//);
      expect(response.body.url).toContain('res.cloudinary.com');
    });
  });

  describe('UM-I-008: Wrong Field Name', () => {
    test('Should fail when using wrong field name', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('photo', Buffer.from('fake-image'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No file uploaded');
    });
  });

  describe('Edge Cases', () => {
    test('Should handle file at size limit (10MB)', async () => {
      // Create exactly 10MB buffer
      const bufferSize = 10 * 1024 * 1024;
      const buffer = Buffer.alloc(bufferSize);

      const response = await request(app).post('/api/upload').attach('image', buffer, {
        filename: 'exact-limit.jpg',
        contentType: 'image/jpeg',
      });

      // Should accept file at exact limit
      expect(response.status).toBe(200);
    });

    test('Should handle JPEG extension', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('image', Buffer.from('fake-jpeg'), {
          filename: 'photo.jpeg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(200);
      expect(response.body.url).toBeDefined();
    });

    test('Should reject PDF file', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('image', Buffer.from('fake-pdf'), {
          filename: 'document.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(400);
    });

    test('Should reject file without extension', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('image', Buffer.from('fake-data'), {
          filename: 'noextension',
          contentType: 'application/octet-stream',
        });

      expect(response.status).toBe(400);
    });

    test('Should reject double extension file', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('image', Buffer.from('fake-data'), {
          filename: 'image.jpg.exe',
          contentType: 'application/x-msdownload',
        });

      expect(response.status).toBe(400);
    });

    test('Should handle uppercase extension', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('image', Buffer.from('fake-image'), {
          filename: 'PHOTO.JPG',
          contentType: 'image/jpeg',
        });

      // May accept or reject depending on case sensitivity
      expect([200, 400]).toContain(response.status);
    });

    test('Should handle special characters in filename', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('image', Buffer.from('fake-image'), {
          filename: 'test@#$%.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(200);
    });

    test('Should handle very small file', async () => {
      const response = await request(app).post('/api/upload').attach('image', Buffer.from('tiny'), {
        filename: 'tiny.jpg',
        contentType: 'image/jpeg',
      });

      expect(response.status).toBe(200);
    });

    test('Should handle file with long filename', async () => {
      const longName = 'a'.repeat(200) + '.jpg';
      const response = await request(app)
        .post('/api/upload')
        .attach('image', Buffer.from('fake-image'), {
          filename: longName,
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    test('Should handle malformed multipart request', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Content-Type', 'multipart/form-data')
        .send('invalid-multipart-data');

      expect([400, 500]).toContain(response.status);
    });

    test('Should handle empty request body', async () => {
      const response = await request(app).post('/api/upload');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No file uploaded');
    });

    test('Should provide error message for rejected files', async () => {
      const response = await request(app).post('/api/upload').attach('image', Buffer.from('fake'), {
        filename: 'bad.txt',
        contentType: 'text/plain',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });

  describe('Response Format', () => {
    test('Should return JSON response', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('image', Buffer.from('fake-image'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.headers['content-type']).toMatch(/json/);
    });

    test('Should return only URL property on success', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('image', Buffer.from('fake-image'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(200);
      expect(Object.keys(response.body)).toEqual(['url']);
    });

    test('Should return error property on failure', async () => {
      const response = await request(app).post('/api/upload').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
