/**
 * @fileoverview File Upload Middleware
 * @created 2025-06-04
 * @file uploadMiddleware.js
 * @description This file contains middleware functions for handling file uploads in the Kicks Shoes application.
 */

import multer from "multer";
import { ErrorResponse } from "../utils/errorResponse.js";
import { storage } from "../config/cloudinary.js";

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new ErrorResponse("Only image files are allowed!", 400), false);
  }
  cb(null, true);
};

// Configure upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

export default upload;
