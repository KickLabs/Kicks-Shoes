/**
 * @fileoverview LiveStreamChat Model
 * @created 2025-01-02
 * @file LiveStreamChat.js
 * @description This model represents chat messages in a livestream session.
 * It stores messages, reactions, and moderation information.
 */

import mongoose from 'mongoose';

const liveStreamChatSchema = new mongoose.Schema(
  {
    // Reference to the livestream
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

    // Message sender information
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      enum: ['host', 'viewer', 'moderator', 'admin'],
      default: 'viewer',
      index: true,
    },

    // Message content
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    messageType: {
      type: String,
      enum: ['text', 'emoji', 'system', 'product', 'announcement'],
      default: 'text',
      index: true,
    },

    // Message metadata
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    edited: {
      isEdited: {
        type: Boolean,
        default: false,
      },
      editedAt: Date,
      originalContent: String,
    },

    // Moderation
    moderation: {
      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },
      deletedAt: Date,
      deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      deleteReason: String,
      isHidden: {
        type: Boolean,
        default: false,
      },
      hiddenAt: Date,
      hiddenBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },

    // Reactions and interactions
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        emoji: {
          type: String,
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Product reference (for product showcase messages)
    productRef: {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      productName: String,
      productImage: String,
      productPrice: Number,
    },

    // Message visibility
    visibility: {
      type: String,
      enum: ['public', 'host_only', 'moderator_only'],
      default: 'public',
      index: true,
    },

    // Reply information
    replyTo: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LiveStreamChat',
      },
      username: String,
      content: String,
    },

    // System message data
    systemData: {
      type: {
        type: String,
        enum: [
          'join',
          'leave',
          'product_featured',
          'stream_started',
          'stream_ended',
          'viewer_milestone',
        ],
      },
      data: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
liveStreamChatSchema.index({ streamId: 1, timestamp: -1 });
liveStreamChatSchema.index({ roomId: 1, timestamp: -1 });
liveStreamChatSchema.index({ senderId: 1, timestamp: -1 });
liveStreamChatSchema.index({ messageType: 1, timestamp: -1 });
liveStreamChatSchema.index({ 'moderation.isDeleted': 1, timestamp: -1 });

// Virtual for reaction counts
liveStreamChatSchema.virtual('reactionCounts').get(function () {
  const counts = {};
  this.reactions.forEach(reaction => {
    counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
  });
  return counts;
});

// Virtual for formatted timestamp
liveStreamChatSchema.virtual('formattedTime').get(function () {
  return this.timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
});

// Pre-save middleware
liveStreamChatSchema.pre('save', function (next) {
  // Set edited timestamp if content is modified
  if (this.isModified('content') && !this.isNew) {
    this.edited.isEdited = true;
    this.edited.editedAt = new Date();
  }

  next();
});

// Static methods
liveStreamChatSchema.statics.getRecentMessages = function (roomId, limit = 50) {
  return this.find({
    roomId,
    'moderation.isDeleted': false,
    'moderation.isHidden': false,
  })
    .populate('senderId', 'username avatar')
    .populate('replyTo.messageId', 'content senderId')
    .sort({ timestamp: -1 })
    .limit(limit);
};

liveStreamChatSchema.statics.getMessagesByUser = function (streamId, userId) {
  return this.find({
    streamId,
    senderId: userId,
    'moderation.isDeleted': false,
  }).sort({ timestamp: -1 });
};

liveStreamChatSchema.statics.createSystemMessage = function (streamId, roomId, type, data) {
  return this.create({
    streamId,
    roomId,
    senderId: null,
    senderRole: 'system',
    content: this.getSystemMessageContent(type, data),
    messageType: 'system',
    systemData: { type, data },
  });
};

liveStreamChatSchema.statics.getSystemMessageContent = function (type, data) {
  switch (type) {
    case 'join':
      return `${data.username} joined the stream`;
    case 'leave':
      return `${data.username} left the stream`;
    case 'product_featured':
      return `Host featured: ${data.productName}`;
    case 'stream_started':
      return 'Stream has started!';
    case 'stream_ended':
      return 'Stream has ended. Thank you for watching!';
    case 'viewer_milestone':
      return `🎉 ${data.count} viewers watching!`;
    default:
      return 'System message';
  }
};

// Instance methods
liveStreamChatSchema.methods.addReaction = function (userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.userId.toString() !== userId.toString());

  // Add new reaction
  this.reactions.push({ userId, emoji });
  return this.save();
};

liveStreamChatSchema.methods.removeReaction = function (userId) {
  this.reactions = this.reactions.filter(r => r.userId.toString() !== userId.toString());
  return this.save();
};

liveStreamChatSchema.methods.softDelete = function (deletedBy, reason) {
  this.moderation.isDeleted = true;
  this.moderation.deletedAt = new Date();
  this.moderation.deletedBy = deletedBy;
  this.moderation.deleteReason = reason;
  return this.save();
};

liveStreamChatSchema.methods.hide = function (hiddenBy) {
  this.moderation.isHidden = true;
  this.moderation.hiddenAt = new Date();
  this.moderation.hiddenBy = hiddenBy;
  return this.save();
};

liveStreamChatSchema.methods.editMessage = function (newContent) {
  if (!this.edited.isEdited) {
    this.edited.originalContent = this.content;
  }
  this.content = newContent;
  return this.save();
};

const LiveStreamChat = mongoose.model('LiveStreamChat', liveStreamChatSchema);

export default LiveStreamChat;
