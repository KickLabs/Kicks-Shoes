/**
 * @fileoverview RewardPoint Model
 * @created 2025-06-04
 * @file RewardPoint.js
 * @description This file defines the RewardPoint model schema for the Kicks Shoes application.
 */

import mongoose from "mongoose";

const rewardPointSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    points: {
      type: Number,
      required: [true, "Points are required"],
      min: [0, "Points cannot be negative"],
    },
    type: {
      type: String,
      enum: ["earn", "redeem", "expire", "adjust"],
      required: [true, "Type is required"],
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "expired", "redeemed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
rewardPointSchema.index({ user: 1 });
rewardPointSchema.index({ order: 1 });
rewardPointSchema.index({ type: 1 });
rewardPointSchema.index({ status: 1 });
rewardPointSchema.index({ expiryDate: 1 });

// Calculate expiry date before saving (if not provided)
rewardPointSchema.pre("save", function (next) {
  if (!this.expiryDate && this.type === "earn") {
    // Set expiry date to 1 year from now for earned points
    this.expiryDate = new Date();
    this.expiryDate.setFullYear(this.expiryDate.getFullYear() + 1);
  }
  next();
});

const RewardPoint = mongoose.model("RewardPoint", rewardPointSchema);

export default RewardPoint;
