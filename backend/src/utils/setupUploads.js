/**
 * @fileoverview Upload Directory Setup
 * @created 2025-06-04
 * @file setupUploads.js
 * @description This file contains utility functions for setting up upload directories.
 */

import fs from "fs";
import path from "path";

export const setupUploadDirectories = () => {
  const uploadsDir = path.join(process.cwd(), "uploads");
  const avatarsDir = path.join(uploadsDir, "avatars");

  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  // Create avatars directory if it doesn't exist
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir);
  }
};
