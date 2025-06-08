/**
 * @fileoverview Refund Model
 * @created 2025-06-04
 * @file Refund.js
 * @description This file defines the Refund model schema for the Kicks Shoes application.
 */

import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
      minlength: [10, "Reason must be at least 10 characters long"],
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    images: [
      {
        type: String,
        validate: {
          validator: function (v) {
            return /^https?:\/\/.+/.test(v);
          },
          message: "Image URL must be a valid URL",
        },
      },
    ],
    adminNote: {
      type: String,
      trim: true,
    },
    refundDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
refundSchema.index({ user: 1 });
refundSchema.index({ order: 1 });
refundSchema.index({ status: 1 });
refundSchema.index({ createdAt: 1 });

// Ensure one refund per order
refundSchema.index({ order: 1 }, { unique: true });

const Refund = mongoose.model("Refund", refundSchema);

export default Refund;
