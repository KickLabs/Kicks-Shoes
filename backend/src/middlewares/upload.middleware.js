/**
 * @fileoverview File Upload Middleware
 * @created 2025-06-04
 * @file uploadMiddleware.js
 * @description This file contains middleware functions for handling file uploads in the Kicks Shoes application.
 */

import multer from 'multer';
import { ErrorResponse } from '../utils/errorResponse.js';
import { storage, deliveryProofStorage } from '../config/cloudinary.js';

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new ErrorResponse('Only image files are allowed!', 400), false);
  }
  cb(null, true);
};

// Configure upload for avatars
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size (increased from 5MB)
  },
});

// Configure upload for delivery proofs
const deliveryProofUpload = multer({
  storage: deliveryProofStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Error handling wrapper for multer middleware
const handleMulterError = uploadMiddleware => {
  return (req, res, next) => {
    uploadMiddleware(req, res, err => {
      if (err) {
        // Handle Multer errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: 'File too large',
              message: 'File size must be less than 10MB',
            });
          }
          return res.status(400).json({
            success: false,
            error: 'Upload error',
            message: err.message,
          });
        }

        // Handle other errors (like file filter errors)
        if (err instanceof ErrorResponse) {
          return res.status(err.statusCode || 400).json({
            success: false,
            error: err.message,
          });
        }

        // Handle unknown errors
        return res.status(500).json({
          success: false,
          error: 'Upload failed',
          message: err.message || 'Unknown error occurred',
        });
      }
      next();
    });
  };
};

export default upload;
export { deliveryProofUpload, handleMulterError };
