import express from 'express';
import upload, { deliveryProofUpload } from '../middlewares/upload.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Test endpoint to verify upload routes are working
router.get('/upload/test', (req, res) => {
  res.json({
    success: true,
    message: 'Upload routes are active',
    endpoints: {
      general: 'POST /api/upload',
      deliveryProof: 'POST /api/upload/delivery-proof',
    },
  });
});

// General image upload (avatars, etc.)
router.post('/upload', protect, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      logger.warn('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    logger.info('File uploaded successfully', { path: req.file.path });
    // Multer + Cloudinary đã gán URL vào req.file.path
    res.json({ url: req.file.path });
  } catch (error) {
    logger.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

// Delivery proof upload (requires authentication)
router.post('/upload/delivery-proof', protect, (req, res, next) => {
  logger.info('Delivery proof upload initiated', {
    user: req.user?.fullName,
    userId: req.user?._id,
    headers: {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
    },
  });

  deliveryProofUpload.single('image')(req, res, err => {
    if (err) {
      logger.error('Multer error during delivery proof upload:', {
        error: err.message,
        code: err.code,
        field: err.field,
        user: req.user?.fullName,
      });

      // Handle specific Multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large',
          message: 'File size must be less than 10MB',
          maxSize: '10MB',
        });
      }

      return res.status(400).json({
        error: err.message || 'Upload failed',
        details: err.code || 'UPLOAD_ERROR',
      });
    }

    try {
      logger.info('Delivery proof upload request received', {
        user: req.user?.fullName,
        file: req.file?.originalname,
        fileSize: req.file?.size,
      });

      if (!req.file) {
        logger.warn('No file uploaded for delivery proof', {
          user: req.user?.fullName,
          body: req.body,
        });
        return res.status(400).json({
          error: 'No file uploaded',
          message: 'Please select an image file to upload',
        });
      }

      logger.info('Delivery proof uploaded successfully', {
        path: req.file.path,
        user: req.user?.fullName,
        size: req.file.size,
        format: req.file.mimetype,
      });

      // Multer + Cloudinary đã gán URL vào req.file.path
      res.json({
        url: req.file.path,
        success: true,
        size: req.file.size,
      });
    } catch (error) {
      logger.error('Delivery proof upload error:', {
        error: error.message,
        stack: error.stack,
        user: req.user?.fullName,
      });
      res.status(500).json({
        error: 'Upload failed',
        message: error.message,
        details: 'Internal server error during file processing',
      });
    }
  });
});

export default router;
