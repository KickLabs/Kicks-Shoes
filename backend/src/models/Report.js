/**
 * @fileoverview Report Model
 * @created 2025-06-04
 * @file Report.js
 * @description This file defines the Report model schema for the Kicks Shoes application.
 */

import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter is required"],
    },
    targetType: {
      type: String,
      enum: ["product", "store", "user", "review"],
      required: [true, "Target type is required"],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Target ID is required"],
    },
    reason: {
      type: String,
      enum: [
        "fake_product",
        "inappropriate_content",
        "scam",
        "counterfeit",
        "harassment",
        "spam",
        "other",
      ],
      required: [true, "Reason is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    evidence: [
      {
        type: String,
        validate: {
          validator: function (v) {
            return /^https?:\/\/.+/.test(v);
          },
          message: "Evidence URL must be a valid URL",
        },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "investigating", "resolved", "dismissed"],
      default: "pending",
    },
    adminNote: {
      type: String,
      trim: true,
    },
    resolution: {
      type: String,
      enum: ["warning", "suspension", "ban", "no_action"],
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reportSchema.index({ reporter: 1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ reason: 1 });
reportSchema.index({ createdAt: 1 });

// Compound index for unique reports
reportSchema.index(
  { reporter: 1, targetType: 1, targetId: 1 },
  { unique: true }
);

const Report = mongoose.model("Report", reportSchema);

export default Report;
