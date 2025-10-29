/**
 * @fileoverview DeliveryReport Model
 * @created 2025-10-21
 * @file DeliveryReport.js
 * @description Model for tracking delivery disputes and issues reported by customers
 */

import mongoose from 'mongoose';

const deliveryReportSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
    },
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
    },
    shipper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reportType: {
      type: String,
      enum: ['not_received', 'damaged', 'wrong_item', 'incomplete', 'other'],
      required: [true, 'Report type is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'rejected'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: [1000, 'Resolution cannot exceed 1000 characters'],
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    internalNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Internal notes cannot exceed 2000 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
deliveryReportSchema.index({ order: 1 });
deliveryReportSchema.index({ customer: 1 });
deliveryReportSchema.index({ status: 1 });
deliveryReportSchema.index({ createdAt: -1 });

// Virtual for report age in days
deliveryReportSchema.virtual('ageInDays').get(function () {
  if (!this.createdAt) return 0;
  const now = new Date();
  const diff = now - this.createdAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Method to resolve report
deliveryReportSchema.methods.resolve = async function (userId, resolution) {
  this.status = 'resolved';
  this.resolution = resolution;
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
  return this.save();
};

// Method to reject report
deliveryReportSchema.methods.reject = async function (userId, reason) {
  this.status = 'rejected';
  this.resolution = reason;
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
  return this.save();
};

// Static method to get pending reports count
deliveryReportSchema.statics.getPendingCount = async function () {
  return this.countDocuments({ status: 'pending', isActive: true });
};

// Static method to get reports by priority
deliveryReportSchema.statics.getByPriority = async function (priority) {
  return this.find({ priority, status: { $in: ['pending', 'investigating'] }, isActive: true })
    .populate('order', 'orderNumber status')
    .populate('customer', 'name email phone')
    .populate('shipper', 'name email phone')
    .sort({ createdAt: -1 });
};

const DeliveryReport = mongoose.model('DeliveryReport', deliveryReportSchema);

export default DeliveryReport;

