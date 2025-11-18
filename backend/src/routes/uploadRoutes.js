import express from 'express';
import upload, { deliveryProofUpload } from '../middlewares/upload.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';
import { handleUpload } from '../config/cloudinary.js';
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
router.post('/upload', protect, upload.single('image'), handleUpload, (req, res) => {
  try {
    if (!req.file) {
      logger.warn('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    logger.info('File uploaded successfully', { path: req.file.path });
    res.json({ url: req.file.path });
  } catch (error) {
    logger.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

// Delivery proof upload (requires authentication)
// Using same pattern as avatar upload with handleUpload middleware
router.post(
  '/upload/delivery-proof',
  protect,
  deliveryProofUpload.single('image'),
  handleUpload,
  (req, res) => {
    try {
      logger.info('Delivery proof upload request received', {
        user: req.user?.fullName,
        userId: req.user?._id,
        file: req.file?.originalname,
        fileSize: req.file?.size,
      });

      if (!req.file) {
        logger.warn('No file uploaded for delivery proof', {
          user: req.user?.fullName,
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

      // URL already handled by handleUpload middleware (HTTPS ensured)
      res.json({
        url: req.file.path,
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
      });
    }
  }
);

export default router;
