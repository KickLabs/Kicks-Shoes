/**
 * @fileoverview Upload Strategy Middleware
 * @created 2025-01-17
 * @file upload.strategy.middleware.js
 * @description Smart middleware that switches between Cloudinary and S3 based on config
 */

import upload from './upload.middleware.js';
import {
  uploadSingleToS3,
  uploadMultipleToS3,
  uploadFieldsToS3,
} from './upload.s3.middleware.js';
import { S3_FOLDERS } from '../config/s3.js';
import { handleUpload } from '../config/cloudinary.js';
import logger from '../utils/logger.js';

const UPLOAD_STRATEGY = process.env.UPLOAD_STRATEGY || 'cloudinary'; // 'cloudinary' or 's3'

logger.info(`Upload strategy: ${UPLOAD_STRATEGY}`);

/**
 * Smart upload middleware that uses configured strategy
 */

// Single file upload
export const uploadSingle = (fieldName, folder = 'temp') => {
  if (UPLOAD_STRATEGY === 's3') {
    const s3Folder = folder === 'avatars' ? S3_FOLDERS.AVATARS : S3_FOLDERS[folder.toUpperCase()];
    return uploadSingleToS3(fieldName, s3Folder || S3_FOLDERS.TEMP);
  }

  // Cloudinary (default)
  return [upload.single(fieldName), handleUpload];
};

// Multiple files upload
export const uploadMultiple = (fieldName, maxCount = 10, folder = 'temp') => {
  if (UPLOAD_STRATEGY === 's3') {
    const s3Folder = folder === 'products' ? S3_FOLDERS.PRODUCTS : S3_FOLDERS[folder.toUpperCase()];
    return uploadMultipleToS3(fieldName, maxCount, s3Folder || S3_FOLDERS.TEMP);
  }

  // Cloudinary (default)
  return [upload.array(fieldName, maxCount), handleUpload];
};

// Multiple fields upload
export const uploadFields = (fields, folder = 'temp') => {
  if (UPLOAD_STRATEGY === 's3') {
    const s3Folder = S3_FOLDERS[folder.toUpperCase()] || S3_FOLDERS.TEMP;
    return uploadFieldsToS3(fields, s3Folder);
  }

  // Cloudinary (default)
  return [upload.fields(fields), handleUpload];
};

// Specific use cases
export const uploadAvatar = uploadSingle('avatar', 'avatars');
export const uploadProductImages = uploadMultiple('images', 10, 'products');
export const uploadDeliveryProof = uploadSingle('proofImage', 'delivery-proofs');

export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadAvatar,
  uploadProductImages,
  uploadDeliveryProof,
};
