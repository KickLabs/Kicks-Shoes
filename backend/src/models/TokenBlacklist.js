/**
 * @fileoverview Token Blacklist Model
 * @created 2025-05-31
 * @file TokenBlacklist.js
 * @description This file defines the TokenBlacklist model schema for managing invalidated JWT tokens.
 * It tracks tokens that have been revoked or expired to prevent their reuse in the application.
 */

import mongoose from "mongoose";

const tokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create TTL index to automatically remove expired tokens
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TokenBlacklist = mongoose.model("TokenBlacklist", tokenBlacklistSchema);

export default TokenBlacklist;
