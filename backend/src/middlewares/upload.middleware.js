/**
 * @fileoverview File Upload Middleware
 * @created 2025-06-04
 * @file uploadMiddleware.js
 * @description This file contains middleware functions for handling file uploads in the Kicks Shoes application.
 */

import multer from 'multer';
import { ErrorResponse } from '../utils/errorResponse.js';
import { storage, deliveryProofStorage } from '../config/cloudinary.js';
import logger from '../utils/logger.js';

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only - check both MIME type and extension
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const allowedExtensions = /\.(jpg|jpeg|png|gif)$/i;

  const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype);
  const isExtensionValid = file.originalname.match(allowedExtensions);

  logger.info('File filter validation', {
    filename: file.originalname,
    mimetype: file.mimetype,
    isMimeTypeValid,
    isExtensionValid,
  });

  if (!isMimeTypeValid && !isExtensionValid) {
    logger.warn('File rejected by filter', {
      filename: file.originalname,
      mimetype: file.mimetype,
    });
    return cb(
      new ErrorResponse('Only JPG, JPEG, PNG, and GIF image files are allowed!', 400),
      false
    );
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

export default upload;
export { deliveryProofUpload };
