/**
 * @fileoverview ShipperApplication Model
 * @created 2025-10-22
 * @file ShipperApplication.js
 * @description Model for customer applications to become shippers
 */

import mongoose from 'mongoose';

const shipperApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    identityCard: {
      type: String,
      required: [true, 'Identity card number is required'],
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ['motorcycle', 'bicycle', 'car', 'truck'],
      required: [true, 'Vehicle type is required'],
    },
    vehiclePlate: {
      type: String,
      trim: true,
    },
    experience: {
      type: String,
      trim: true,
      maxlength: [500, 'Experience cannot exceed 500 characters'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for application is required'],
      trim: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Shop or Admin
    },
    reviewedAt: {
      type: Date,
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Review note cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
shipperApplicationSchema.index({ user: 1 });
shipperApplicationSchema.index({ status: 1 });
shipperApplicationSchema.index({ createdAt: -1 });

// Prevent duplicate pending applications from same user
shipperApplicationSchema.index({ user: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

const ShipperApplication = mongoose.model('ShipperApplication', shipperApplicationSchema);

export default ShipperApplication;

