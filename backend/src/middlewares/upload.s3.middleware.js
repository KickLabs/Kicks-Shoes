/**
 * @fileoverview S3 File Upload Middleware
 * @created 2025-01-17
 * @file upload.s3.middleware.js
 * @description Middleware for handling file uploads to AWS S3
 */

import multer from 'multer';
import { ErrorResponse } from '../utils/errorResponse.js';
import { uploadToS3, S3_FOLDERS } from '../config/s3.js';
import logger from '../utils/logger.js';

// Use memory storage to get buffer
const storage = multer.memoryStorage();

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;

  const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype);
  const isExtensionValid = file.originalname.match(allowedExtensions);

  logger.info('S3 File filter validation', {
    filename: file.originalname,
    mimetype: file.mimetype,
    isMimeTypeValid,
    isExtensionValid,
  });

  if (!isMimeTypeValid && !isExtensionValid) {
    logger.warn('File rejected by S3 filter', {
      filename: file.originalname,
      mimetype: file.mimetype,
    });
    return cb(
      new ErrorResponse('Only JPG, JPEG, PNG, GIF, and WEBP image files are allowed!', 400),
      false
    );
  }

  cb(null, true);
};

// Base multer config
const multerConfig = {
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};

// Create multer upload instances
const uploadS3 = multer(multerConfig);

/**
 * Middleware to upload single file to S3
 * @param {string} fieldName - Form field name
 * @param {string} folder - S3 folder (optional)
 */
export const uploadSingleToS3 = (fieldName, folder = S3_FOLDERS.TEMP) => {
  return [
    uploadS3.single(fieldName),
    async (req, res, next) => {
      try {
        if (!req.file) {
          return next();
        }

        logger.info('Uploading file to S3', {
          originalname: req.file.originalname,
          size: req.file.size,
          folder,
        });

        const result = await uploadToS3(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          folder
        );

        // Attach S3 info to request
        req.file.s3Url = result.url;
        req.file.s3Key = result.key;
        req.file.path = result.url; // For compatibility with existing code

        logger.info('File uploaded to S3 successfully', {
          url: result.url,
          key: result.key,
        });

        next();
      } catch (error) {
        logger.error('S3 upload error', { error: error.message });
        next(new ErrorResponse(`Failed to upload file: ${error.message}`, 500));
      }
    },
  ];
};

/**
 * Middleware to upload multiple files to S3
 * @param {string} fieldName - Form field name
 * @param {number} maxCount - Maximum number of files
 * @param {string} folder - S3 folder (optional)
 */
export const uploadMultipleToS3 = (fieldName, maxCount = 10, folder = S3_FOLDERS.TEMP) => {
  return [
    uploadS3.array(fieldName, maxCount),
    async (req, res, next) => {
      try {
        if (!req.files || req.files.length === 0) {
          return next();
        }

        logger.info('Uploading multiple files to S3', {
          count: req.files.length,
          folder,
        });

        const uploadPromises = req.files.map(async file => {
          const result = await uploadToS3(file.buffer, file.originalname, file.mimetype, folder);

          file.s3Url = result.url;
          file.s3Key = result.key;
          file.path = result.url; // For compatibility

          return result;
        });

        await Promise.all(uploadPromises);

        logger.info('Multiple files uploaded to S3 successfully', {
          count: req.files.length,
        });

        next();
      } catch (error) {
        logger.error('S3 multiple upload error', { error: error.message });
        next(new ErrorResponse(`Failed to upload files: ${error.message}`, 500));
      }
    },
  ];
};

/**
 * Middleware to upload multiple fields to S3
 * @param {Array} fields - Array of {name, maxCount} objects
 * @param {string} folder - S3 folder (optional)
 */
export const uploadFieldsToS3 = (fields, folder = S3_FOLDERS.TEMP) => {
  return [
    uploadS3.fields(fields),
    async (req, res, next) => {
      try {
        if (!req.files || Object.keys(req.files).length === 0) {
          return next();
        }

        logger.info('Uploading fields to S3', {
          fields: Object.keys(req.files),
          folder,
        });

        const uploadPromises = [];

        for (const fieldName in req.files) {
          const files = req.files[fieldName];

          for (const file of files) {
            uploadPromises.push(
              uploadToS3(file.buffer, file.originalname, file.mimetype, folder).then(result => {
                file.s3Url = result.url;
                file.s3Key = result.key;
                file.path = result.url;
                return result;
              })
            );
          }
        }

        await Promise.all(uploadPromises);

        logger.info('Fields uploaded to S3 successfully');

        next();
      } catch (error) {
        logger.error('S3 fields upload error', { error: error.message });
        next(new ErrorResponse(`Failed to upload files: ${error.message}`, 500));
      }
    },
  ];
};

// Export for avatar uploads
export const uploadAvatarToS3 = uploadSingleToS3('avatar', S3_FOLDERS.AVATARS);

// Export for product images
export const uploadProductImagesToS3 = uploadMultipleToS3('images', 10, S3_FOLDERS.PRODUCTS);

// Export for delivery proofs
export const uploadDeliveryProofToS3 = uploadSingleToS3('proofImage', S3_FOLDERS.DELIVERY_PROOFS);

export default uploadS3;
