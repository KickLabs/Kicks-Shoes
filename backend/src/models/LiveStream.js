/**
 * @fileoverview LiveStream Model
 * @created 2025-01-02
 * @file LiveStream.js
 * @description This model represents a livestream session in the Kicks Shoes application.
 * It tracks livestream metadata, status, and associated store information.
 */

import mongoose from 'mongoose';

const liveStreamSchema = new mongoose.Schema(
  {
    // Basic livestream information
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    // Host information
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Stream status and metadata
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Timing information
    scheduledAt: {
      type: Date,
      index: true,
    },
    startedAt: {
      type: Date,
      index: true,
    },
    endedAt: {
      type: Date,
      index: true,
    },

    // Active viewers
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Stream settings
    settings: {
      maxViewers: {
        type: Number,
        default: 50,
        min: 1,
        max: 100,
      },
      allowChat: {
        type: Boolean,
        default: true,
      },
      isPublic: {
        type: Boolean,
        default: true,
      },
      recordStream: {
        type: Boolean,
        default: false,
      },
    },

    // Statistics
    stats: {
      totalViewers: {
        type: Number,
        default: 0,
      },
      peakViewers: {
        type: Number,
        default: 0,
      },
      currentViewers: {
        type: Number,
        default: 0,
      },
      totalMessages: {
        type: Number,
        default: 0,
      },
      duration: {
        type: Number, // in seconds
        default: 0,
      },
    },

    // Featured products during stream
    featuredProducts: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Stream thumbnail/preview
    thumbnail: {
      type: String,
      default: null,
    },

    // Technical information
    streamConfig: {
      quality: {
        type: String,
        enum: ['480p', '720p', '1080p'],
        default: '720p',
      },
      bitrate: {
        type: Number,
        default: 2500, // kbps
      },
      frameRate: {
        type: Number,
        default: 30,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
liveStreamSchema.index({ hostId: 1, createdAt: -1 });
liveStreamSchema.index({ isActive: 1, createdAt: -1 });
liveStreamSchema.index({ status: 1, scheduledAt: 1 });

// Virtual for duration in human readable format
liveStreamSchema.virtual('formattedDuration').get(function () {
  if (!this.stats.duration) return '0m';

  const hours = Math.floor(this.stats.duration / 3600);
  const minutes = Math.floor((this.stats.duration % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual for stream URL
liveStreamSchema.virtual('streamUrl').get(function () {
  return `/livestream/${this.roomId}`;
});

// Pre-save middleware
liveStreamSchema.pre('save', function (next) {
  // Update duration if stream is ending
  if (this.isModified('status') && this.status === 'ended' && this.startedAt && !this.endedAt) {
    this.endedAt = new Date();
    this.stats.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
  }

  // Set started time when going live
  if (this.isModified('status') && this.status === 'live' && !this.startedAt) {
    this.startedAt = new Date();
    this.isActive = true;
  }

  // Set inactive when ending
  if (this.isModified('status') && ['ended', 'cancelled'].includes(this.status)) {
    this.isActive = false;
  }

  next();
});

// Static methods
liveStreamSchema.statics.getActiveStreams = function () {
  return this.find({ isActive: true, status: 'live' })
    .populate('hostId', 'username avatar')
    .sort({ createdAt: -1 });
};

liveStreamSchema.statics.getStreamsByHost = function (hostId, limit = 10) {
  return this.find({ hostId })
    .populate('hostId', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(limit);
};

liveStreamSchema.statics.getUpcomingStreams = function () {
  return this.find({
    status: 'scheduled',
    scheduledAt: { $gte: new Date() },
  })
    .populate('hostId', 'username avatar')
    .sort({ scheduledAt: 1 });
};

// Instance methods
liveStreamSchema.methods.updateViewerCount = function (count) {
  this.stats.currentViewers = count;
  if (count > this.stats.peakViewers) {
    this.stats.peakViewers = count;
  }
  if (count > this.stats.totalViewers) {
    this.stats.totalViewers = count;
  }
  return this.save();
};

liveStreamSchema.methods.addFeaturedProduct = function (productId) {
  const existingProduct = this.featuredProducts.find(
    p => p.productId.toString() === productId.toString()
  );

  if (!existingProduct) {
    this.featuredProducts.push({ productId });
    return this.save();
  }

  return Promise.resolve(this);
};

liveStreamSchema.methods.removeFeaturedProduct = function (productId) {
  this.featuredProducts = this.featuredProducts.filter(
    p => p.productId.toString() !== productId.toString()
  );
  return this.save();
};

const LiveStream = mongoose.model('LiveStream', liveStreamSchema);

export default LiveStream;
