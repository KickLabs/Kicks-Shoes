/**
 * @fileoverview PotentialOrder Model
 * @created 2025-01-15
 * @file PotentialOrder.js
 * @description This model represents potential orders detected from livestream chat messages.
 * It stores customer information extracted from comments and allows hosts to convert them to actual orders.
 */

import mongoose from 'mongoose';

const potentialOrderSchema = new mongoose.Schema(
  {
    // Reference to the livestream where order was detected
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveStream',
      required: true,
      index: true,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
    },

    // Reference to the chat message that triggered the detection
    chatMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveStreamChat',
      required: true,
      index: true,
    },

    // Customer information extracted from the comment
    customerInfo: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      customerName: {
        type: String,
        required: true,
        trim: true,
      },
      phoneNumber: {
        type: String,
        required: true,
        trim: true,
        match: [/(0[3|5|7|8|9])+([0-9]{8})\b/, 'Invalid Vietnamese phone number format'],
      },
    },

    // Product information extracted from the comment
    productInfo: {
      originalMessage: {
        type: String,
        required: true,
        maxlength: 500,
      },
      // If specific product is mentioned/featured
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: null,
      },
      // Extracted information
      extractedSize: {
        type: String,
        trim: true,
      },
      extractedColor: {
        type: String,
        trim: true,
      },
      extractedQuantity: {
        type: Number,
        default: 1,
        min: 1,
      },
    },

    // Detection metadata
    detectionData: {
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5,
      },
      detectedKeywords: [String],
      phoneMatches: [String],
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },

    // Order status and management
    status: {
      type: String,
      enum: ['pending', 'contacted', 'confirmed', 'converted', 'ignored', 'spam'],
      default: 'pending',
      index: true,
    },

    // Host actions
    hostActions: {
      viewedAt: Date,
      contactedAt: Date,
      notes: {
        type: String,
        maxlength: 1000,
      },
      confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      confirmedAt: Date,
    },

    // If converted to actual order
    convertedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },

    // Priority scoring
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },

    // Auto-expire after 24 hours if not processed
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
potentialOrderSchema.index({ streamId: 1, createdAt: -1 });
potentialOrderSchema.index({ 'customerInfo.userId': 1, createdAt: -1 });
potentialOrderSchema.index({ status: 1, priority: 1, createdAt: -1 });
potentialOrderSchema.index({ roomId: 1, status: 1 });

// Virtual for formatted phone number
potentialOrderSchema.virtual('formattedPhone').get(function () {
  const phone = this.customerInfo.phoneNumber;
  if (phone && phone.length === 10) {
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  }
  return phone;
});

// Virtual for time since detection
potentialOrderSchema.virtual('timeSinceDetection').get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  }
  return `${minutes}m ago`;
});

// Static methods
potentialOrderSchema.statics.getPendingOrdersForStream = function (streamId) {
  return this.find({
    streamId,
    status: { $in: ['pending', 'contacted'] },
  })
    .populate('customerInfo.userId', 'username avatar')
    .populate('productInfo.productId', 'name mainImage price')
    .populate('chatMessageId', 'content timestamp')
    .sort({ priority: -1, createdAt: -1 });
};

potentialOrderSchema.statics.getOrdersByHost = function (hostId, limit = 50) {
  return this.find({})
    .populate({
      path: 'streamId',
      match: { hostId },
      select: 'title roomId',
    })
    .populate('customerInfo.userId', 'username avatar')
    .populate('productInfo.productId', 'name mainImage price')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Instance methods
potentialOrderSchema.methods.markAsViewed = function (hostId) {
  this.hostActions.viewedAt = new Date();
  if (this.status === 'pending') {
    this.status = 'contacted';
  }
  return this.save();
};

potentialOrderSchema.methods.addHostNote = function (note, hostId) {
  this.hostActions.notes = note;
  this.hostActions.confirmedBy = hostId;
  this.hostActions.confirmedAt = new Date();
  return this.save();
};

potentialOrderSchema.methods.convertToOrder = function (orderId) {
  this.convertedOrderId = orderId;
  this.status = 'converted';
  return this.save();
};

potentialOrderSchema.methods.markAsSpam = function () {
  this.status = 'spam';
  return this.save();
};

// Pre-save middleware to calculate priority
potentialOrderSchema.pre('save', function (next) {
  if (this.isNew) {
    // Calculate priority based on various factors
    let score = this.detectionData.confidence;

    // Boost priority if specific product mentioned
    if (this.productInfo.productId) {
      score += 0.2;
    }

    // Boost priority if size/color mentioned
    if (this.productInfo.extractedSize || this.productInfo.extractedColor) {
      score += 0.1;
    }

    // Boost priority for quantity > 1
    if (this.productInfo.extractedQuantity > 1) {
      score += 0.1;
    }

    // Set priority based on score
    if (score >= 0.8) {
      this.priority = 'urgent';
    } else if (score >= 0.6) {
      this.priority = 'high';
    } else if (score >= 0.4) {
      this.priority = 'medium';
    } else {
      this.priority = 'low';
    }
  }

  next();
});

const PotentialOrder = mongoose.model('PotentialOrder', potentialOrderSchema);

export default PotentialOrder;
