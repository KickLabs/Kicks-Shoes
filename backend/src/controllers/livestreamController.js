/**
 * @fileoverview LiveStream Controller
 * @created 2025-01-02
 * @file livestreamController.js
 * @description Controller for managing livestream operations and API endpoints
 */

import { validationResult } from 'express-validator';
import LiveStream from '../models/LiveStream.js';
import LiveStreamChat from '../models/LiveStreamChat.js';
import liveStreamService from '../services/livestream.service.js';
import { asyncHandler } from '../middlewares/async.middleware.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';
import { getSocketIO } from '../utils/socketIO.js';
import { broadcastPinnedMessage } from '../services/livestreamSocket.service.js';

/**
 * @desc    Create a new livestream
 * @route   POST /api/livestream
 * @access  Private (Shop owners only)
 */
export const createLiveStream = asyncHandler(async (req, res) => {
  console.log('Create livestream request received:', {
    body: req.body,
    user: req.user?.id,
    userRole: req.user?.role,
  });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array(),
    });
  }

  const { title, description, scheduledAt, settings } = req.body;
  const hostId = req.user.id;

  // Verify user has shop role
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(hostId);

  if (!user || user.role !== 'shop') {
    throw new ErrorResponse('Only shop owners can create livestreams', 403);
  }

  // Check if user already has an active stream
  const existingStream = await LiveStream.findOne({
    hostId,
    isActive: true,
  });

  if (existingStream) {
    throw new ErrorResponse('User already has an active livestream', 400);
  }

  const streamData = {
    title,
    description,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
    settings: {
      maxViewers: settings?.maxViewers || 50,
      allowChat: settings?.allowChat !== false,
      isPublic: settings?.isPublic !== false,
      recordStream: settings?.recordStream || false,
    },
  };

  console.log('Creating livestream room with data:', streamData);
  const liveStream = await liveStreamService.createRoom(hostId, streamData);
  console.log('Livestream created successfully:', liveStream.roomId);

  res.status(201).json({
    success: true,
    message: 'Livestream created successfully',
    data: {
      liveStream,
      joinUrl: `/livestream/${liveStream.roomId}`,
    },
  });
});

/**
 * @desc    Get livestream details
 * @route   GET /api/livestream/:roomId
 * @access  Public
 */
export const getLiveStream = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const liveStream = await LiveStream.findOne({ roomId })
    .populate('hostId', 'username avatar')
    .populate(
      'featuredProducts.productId',
      'name price images mainImage colorVariants inventory variants description'
    );

  if (!liveStream) {
    throw new ErrorResponse('Livestream not found', 404);
  }

  // Get room status from service
  const roomStatus = liveStreamService.getRoomStatus(roomId);

  // Check if stream is live based on database status and room status
  const isLive =
    liveStream.isActive && liveStream.status === 'live' && (roomStatus?.isActive || false);

  res.json({
    success: true,
    data: {
      liveStream,
      roomStatus,
      isLive,
      viewerCount: roomStatus?.viewerCount || liveStream.stats?.currentViewers || 0,
    },
  });
});

/**
 * @desc    Get all active livestreams
 * @route   GET /api/livestream/active
 * @access  Public
 */
export const getActiveLiveStreams = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const activeStreams = await LiveStream.find({
    isActive: true,
    status: 'live',
    'settings.isPublic': true,
  })
    .populate('hostId', 'username avatar')
    .sort({ startedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await LiveStream.countDocuments({
    isActive: true,
    status: 'live',
    'settings.isPublic': true,
  });

  // Add real-time viewer counts
  const streamsWithViewerCount = activeStreams.map(stream => {
    const roomStatus = liveStreamService.getRoomStatus(stream.roomId);
    return {
      ...stream.toObject(),
      currentViewers: roomStatus?.viewerCount || 0,
    };
  });

  res.json({
    success: true,
    data: {
      streams: streamsWithViewerCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @desc    Get upcoming livestreams
 * @route   GET /api/livestream/upcoming
 * @access  Public
 */
export const getUpcomingLiveStreams = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const upcomingStreams = await LiveStream.getUpcomingStreams().limit(limit);

  res.json({
    success: true,
    data: upcomingStreams,
  });
});

/**
 * @desc    Get all livestreams (for shop dashboard)
 * @route   GET /api/livestream/all
 * @access  Private (Shop/Admin only)
 */
export const getAllLiveStreams = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const streams = await LiveStream.find({})
    .populate('hostId', 'username avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await LiveStream.countDocuments({});

  res.json({
    success: true,
    data: {
      streams,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @desc    Get user's livestreams
 * @route   GET /api/livestream/my-streams
 * @access  Private
 */
export const getMyLiveStreams = asyncHandler(async (req, res) => {
  const hostId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const streams = await LiveStream.find({ hostId }).sort({ createdAt: -1 }).skip(skip).limit(limit);

  const total = await LiveStream.countDocuments({ hostId });

  // Add real-time status for active streams
  const streamsWithStatus = streams.map(stream => {
    const roomStatus = liveStreamService.getRoomStatus(stream.roomId);
    return {
      ...stream.toObject(),
      currentViewers: roomStatus?.viewerCount || 0,
      isCurrentlyLive: roomStatus?.isActive || false,
    };
  });

  res.json({
    success: true,
    data: {
      streams: streamsWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @desc    Update livestream
 * @route   PUT /api/livestream/:roomId
 * @access  Private (Host only)
 */
export const updateLiveStream = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const hostId = req.user.id;

  const liveStream = await LiveStream.findOne({ roomId });

  if (!liveStream) {
    throw new ErrorResponse('Livestream not found', 404);
  }

  if (liveStream.hostId.toString() !== hostId) {
    throw new ErrorResponse('Not authorized to update this livestream', 403);
  }

  const { title, description, scheduledAt, settings, status, isActive, startedAt } = req.body;

  // Allow status updates for starting/ending stream
  if (liveStream.status === 'live' && !status && !isActive && !startedAt) {
    throw new ErrorResponse('Cannot update livestream content while it is live', 400);
  }

  const updateData = {};
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
  if (settings) {
    updateData.settings = {
      ...liveStream.settings,
      ...settings,
    };
  }

  // Handle status updates for starting/ending stream
  if (status !== undefined) updateData.status = status;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (startedAt) updateData.startedAt = new Date(startedAt);

  const updatedStream = await LiveStream.findByIdAndUpdate(liveStream._id, updateData, {
    new: true,
    runValidators: true,
  }).populate('hostId', 'username avatar');

  res.json({
    success: true,
    message: 'Livestream updated successfully',
    data: updatedStream,
  });
});

/**
 * @desc    End livestream
 * @route   POST /api/livestream/:roomId/end
 * @access  Private (Host only)
 */
export const endLiveStream = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const hostId = req.user.id;

  const liveStream = await LiveStream.findOne({ roomId });

  if (!liveStream) {
    throw new ErrorResponse('Livestream not found', 404);
  }

  if (liveStream.hostId.toString() !== hostId) {
    throw new ErrorResponse('Not authorized to end this livestream', 403);
  }

  if (liveStream.status !== 'live') {
    throw new ErrorResponse('Livestream is not currently live', 400);
  }

  // End the stream
  liveStream.status = 'ended';
  liveStream.isActive = false;
  liveStream.endedAt = new Date();

  if (liveStream.startedAt) {
    liveStream.stats.duration = Math.floor((liveStream.endedAt - liveStream.startedAt) / 1000);
  }

  await liveStream.save();

  // Create system message
  await LiveStreamChat.createSystemMessage(liveStream._id, roomId, 'stream_ended', {});

  logger.info(`Livestream ${roomId} ended by host ${hostId}`);

  res.json({
    success: true,
    message: 'Livestream ended successfully',
    data: liveStream,
  });
});

/**
 * @desc    Delete livestream
 * @route   DELETE /api/livestream/:roomId
 * @access  Private (Host only)
 */
export const deleteLiveStream = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const hostId = req.user.id;

  const liveStream = await LiveStream.findOne({ roomId });

  if (!liveStream) {
    throw new ErrorResponse('Livestream not found', 404);
  }

  if (liveStream.hostId.toString() !== hostId) {
    throw new ErrorResponse('Not authorized to delete this livestream', 403);
  }

  if (liveStream.status === 'live') {
    throw new ErrorResponse('Cannot delete livestream while it is live', 400);
  }

  // Delete associated chat messages
  await LiveStreamChat.deleteMany({ streamId: liveStream._id });

  // Delete the livestream
  await LiveStream.findByIdAndDelete(liveStream._id);

  res.json({
    success: true,
    message: 'Livestream deleted successfully',
  });
});

/**
 * @desc    Get livestream chat messages
 * @route   GET /api/livestream/:roomId/chat
 * @access  Public
 */
export const getChatMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const limit = parseInt(req.query.limit) || 50;
  const page = parseInt(req.query.page) || 1;

  const liveStream = await LiveStream.findOne({ roomId });
  if (!liveStream) {
    throw new ErrorResponse('Livestream not found', 404);
  }

  const messages = await LiveStreamChat.find({
    streamId: liveStream._id,
    'moderation.isDeleted': false,
    'moderation.isHidden': false,
  })
    .populate('senderId', 'username avatar')
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  res.json({
    success: true,
    data: messages.reverse(), // Reverse to show oldest first
  });
});

/**
 * @desc    Add featured product to livestream
 * @route   POST /api/livestream/:roomId/feature-product
 * @access  Private (Host only)
 */
export const addFeaturedProduct = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { productId } = req.body;
  const hostId = req.user.id;

  const liveStream = await LiveStream.findOne({ roomId });

  if (!liveStream) {
    throw new ErrorResponse('Livestream not found', 404);
  }

  if (liveStream.hostId.toString() !== hostId) {
    throw new ErrorResponse('Not authorized to feature products in this livestream', 403);
  }

  // Verify product exists and belongs to the same store
  const Product = (await import('../models/Product.js')).default;
  const product = await Product.findById(productId);

  if (!product) {
    throw new ErrorResponse('Product not found', 404);
  }

  // Since we only have one shop, any product can be featured
  // No need to check store ownership

  await liveStream.addFeaturedProduct(productId);

  // Create system chat message
  await LiveStreamChat.createSystemMessage(liveStream._id, roomId, 'product_featured', {
    productName: product.name,
    productId: product._id,
  });

  res.json({
    success: true,
    message: 'Product featured successfully',
    data: {
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        images: product.images,
      },
    },
  });
});

/**
 * @desc    Remove featured product from livestream
 * @route   DELETE /api/livestream/:roomId/feature-product/:productId
 * @access  Private (Host only)
 */
export const removeFeaturedProduct = asyncHandler(async (req, res) => {
  const { roomId, productId } = req.params;
  const hostId = req.user.id;

  const liveStream = await LiveStream.findOne({ roomId });

  if (!liveStream) {
    throw new ErrorResponse('Livestream not found', 404);
  }

  if (liveStream.hostId.toString() !== hostId) {
    throw new ErrorResponse('Not authorized to manage products in this livestream', 403);
  }

  await liveStream.removeFeaturedProduct(productId);

  res.json({
    success: true,
    message: 'Product removed from featured list',
  });
});

/**
 * @desc    Pin/Unpin featured product
 * @route   PUT /api/livestream/:roomId/pin-product/:productId
 * @access  Private (Host only)
 */
export const togglePinProduct = asyncHandler(async (req, res) => {
  const { roomId, productId } = req.params;
  const hostId = req.user.id;

  const liveStream = await LiveStream.findOne({ roomId });

  if (!liveStream) {
    throw new ErrorResponse('Livestream not found', 404);
  }

  if (liveStream.hostId.toString() !== hostId) {
    throw new ErrorResponse('Not authorized to manage products in this livestream', 403);
  }

  await liveStream.togglePinProduct(productId);

  // Get updated stream with populated products
  const updatedStream = await LiveStream.findOne({ roomId }).populate(
    'featuredProducts.productId',
    'name price images mainImage colorVariants inventory variants description'
  );

  res.json({
    success: true,
    message: 'Product pin status updated',
    data: {
      featuredProducts: updatedStream.featuredProducts,
    },
  });
});

/**
 * @desc    Get livestream analytics
 * @route   GET /api/livestream/:roomId/analytics
 * @access  Private (Host only)
 */
export const getLiveStreamAnalytics = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const hostId = req.user.id;

  const liveStream = await LiveStream.findOne({ roomId });

  if (!liveStream) {
    throw new ErrorResponse('Livestream not found', 404);
  }

  if (liveStream.hostId.toString() !== hostId) {
    throw new ErrorResponse('Not authorized to view analytics for this livestream', 403);
  }

  // Get chat statistics
  const chatStats = await LiveStreamChat.aggregate([
    { $match: { streamId: liveStream._id } },
    {
      $group: {
        _id: '$senderRole',
        count: { $sum: 1 },
      },
    },
  ]);

  // Get hourly viewer data (if stream is long enough)
  const viewerData = {
    peakViewers: liveStream.stats.peakViewers,
    totalViewers: liveStream.stats.totalViewers,
    currentViewers: liveStreamService.getRoomStatus(roomId)?.viewerCount || 0,
  };

  const analytics = {
    stream: {
      duration: liveStream.stats.duration,
      formattedDuration: liveStream.formattedDuration,
      status: liveStream.status,
      startedAt: liveStream.startedAt,
      endedAt: liveStream.endedAt,
    },
    viewers: viewerData,
    chat: {
      totalMessages: liveStream.stats.totalMessages,
      messagesByRole: chatStats.reduce(
        (acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        },
        { host: 0, viewer: 0, system: 0 }
      ),
    },
    products: {
      featuredCount: liveStream.featuredProducts.length,
      featuredProducts: liveStream.featuredProducts,
    },
  };

  res.json({
    success: true,
    data: analytics,
  });
});

/**
 * @desc    Pin/Unpin a chat message
 * @route   PUT /api/livestream/:roomId/chat/:messageId/pin
 * @access  Private (Host only)
 */
export const togglePinMessage = asyncHandler(async (req, res) => {
  const { roomId, messageId } = req.params;
  const hostId = req.user.id;

  const liveStream = await LiveStream.findOne({ roomId });

  if (!liveStream) {
    throw new ErrorResponse('Livestream not found', 404);
  }

  if (liveStream.hostId.toString() !== hostId) {
    throw new ErrorResponse('Not authorized to pin messages in this livestream', 403);
  }

  const message = await LiveStreamChat.findById(messageId);

  if (!message) {
    throw new ErrorResponse('Message not found', 404);
  }

  if (message.roomId !== roomId) {
    throw new ErrorResponse('Message does not belong to this livestream', 400);
  }

  // If pinning a new message, unpin all other messages first
  if (!message.isPinned) {
    await LiveStreamChat.updateMany(
      { roomId, isPinned: true },
      { $set: { isPinned: false, pinnedAt: null, pinnedBy: null } }
    );
  }

  await message.togglePin(hostId);

  // Populate sender info for response
  await message.populate('senderId', 'username avatar');
  await message.populate('pinnedBy', 'username');

  // Broadcast pinned message update via Socket.IO
  const io = getSocketIO();
  if (io) {
    // Always send the message object, the broadcast function checks isPinned status
    broadcastPinnedMessage(io, roomId, message);
  }

  res.json({
    success: true,
    message: message.isPinned ? 'Message pinned successfully' : 'Message unpinned successfully',
    data: {
      message,
      isPinned: message.isPinned,
    },
  });
});

/**
 * @desc    Get pinned message for a livestream
 * @route   GET /api/livestream/:roomId/chat/pinned
 * @access  Public
 */
export const getPinnedMessage = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const liveStream = await LiveStream.findOne({ roomId });

  if (!liveStream) {
    throw new ErrorResponse('Livestream not found', 404);
  }

  const pinnedMessage = await LiveStreamChat.getPinnedMessage(roomId);

  res.json({
    success: true,
    data: pinnedMessage,
  });
});
