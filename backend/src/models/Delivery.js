/**
 * @fileoverview Delivery Model
 * @created 2025-10-21
 * @file Delivery.js
 * @description This file defines the Delivery model schema for tracking order deliveries.
 */

import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
      unique: true,
    },
    shipper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Shipper is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'],
        message: '{VALUE} is not a valid delivery status',
      },
      default: 'assigned',
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    pickedUpAt: {
      type: Date,
    },
    inTransitAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    proofOfDelivery: {
      type: String,
      trim: true,
    },
    recipientName: {
      type: String,
      trim: true,
    },
    recipientSignature: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    failureReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Failure reason cannot exceed 500 characters'],
    },
    estimatedPickupTime: {
      type: Date,
    },
    estimatedDeliveryTime: {
      type: Date,
    },
    actualPickupTime: {
      type: Date,
    },
    actualDeliveryTime: {
      type: Date,
    },
    location: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      address: {
        type: String,
        trim: true,
      },
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
deliverySchema.index({ order: 1 });
deliverySchema.index({ shipper: 1 });
deliverySchema.index({ status: 1 });
deliverySchema.index({ assignedAt: 1 });
deliverySchema.index({ deliveredAt: 1 });

// Virtual for delivery duration
deliverySchema.virtual('deliveryDuration').get(function () {
  if (this.deliveredAt && this.assignedAt) {
    return Math.floor((this.deliveredAt - this.assignedAt) / 1000 / 60); // in minutes
  }
  return null;
});

// Virtual for formatted timeline
deliverySchema.virtual('timeline').get(function () {
  const timeline = [];

  // Always include assigned
  if (this.assignedAt) {
    timeline.push({
      status: 'assigned',
      label: 'Shipper Assigned',
      timestamp: this.assignedAt,
      completed: true,
    });
  }

  // Picked up
  if (this.pickedUpAt) {
    timeline.push({
      status: 'picked_up',
      label: 'Picked Up',
      timestamp: this.pickedUpAt,
      completed: true,
    });
  } else if (this.status !== 'assigned') {
    timeline.push({
      status: 'picked_up',
      label: 'Picked Up',
      timestamp: null,
      completed: false,
    });
  }

  // In transit
  if (this.inTransitAt) {
    timeline.push({
      status: 'in_transit',
      label: 'In Transit',
      timestamp: this.inTransitAt,
      completed: true,
    });
  } else if (
    this.status !== 'assigned' &&
    this.status !== 'picked_up'
  ) {
    timeline.push({
      status: 'in_transit',
      label: 'In Transit',
      timestamp: null,
      completed: false,
    });
  }

  // Delivered or Failed
  if (this.deliveredAt) {
    timeline.push({
      status: 'delivered',
      label: 'Delivered',
      timestamp: this.deliveredAt,
      completed: true,
      recipientName: this.recipientName,
      proofOfDelivery: this.proofOfDelivery,
    });
  } else if (this.failedAt && this.status === 'failed') {
    // Only show failed if current status is failed
    timeline.push({
      status: 'failed',
      label: 'Delivery Failed',
      timestamp: this.failedAt,
      completed: true,
      failureReason: this.failureReason,
    });
  } else if (
    this.status !== 'assigned' &&
    this.status !== 'picked_up' &&
    this.status !== 'in_transit' &&
    this.status !== 'failed'
  ) {
    timeline.push({
      status: 'delivered',
      label: 'Delivered',
      timestamp: null,
      completed: false,
    });
  }

  return timeline;
});

// Method to update status
deliverySchema.methods.updateStatus = async function (newStatus, note = '') {
  const previousStatus = this.status;
  this.status = newStatus;
  
  const statusTimestampMap = {
    picked_up: 'pickedUpAt',
    in_transit: 'inTransitAt',
    delivered: 'deliveredAt',
    failed: 'failedAt',
  };

  // Update timestamp for new status
  if (statusTimestampMap[newStatus]) {
    // Only update if not already set OR if retrying after failed
    if (!this[statusTimestampMap[newStatus]] || previousStatus === 'failed') {
      this[statusTimestampMap[newStatus]] = new Date();
    }
    
    // Set actual times
    if (newStatus === 'picked_up') {
      this.actualPickupTime = new Date();
    } else if (newStatus === 'delivered') {
      this.actualDeliveryTime = new Date();
    }
  }

  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note: note || (previousStatus === 'failed' && newStatus !== 'failed' ? 'Retrying delivery after failure' : ''),
  });

  await this.save();
};

const Delivery = mongoose.model('Delivery', deliverySchema);

export default Delivery;

