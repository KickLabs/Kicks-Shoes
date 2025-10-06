/**
 * @fileoverview Potential Order Controller
 * @created 2025-01-15
 * @file potentialOrderController.js
 * @description Controller for managing potential orders detected from livestream chats
 */

import PotentialOrder from '../models/PotentialOrder.js';
import LiveStream from '../models/LiveStream.js';
import orderDetectionService from '../services/orderDetection.service.js';
import excelExportService from '../services/excelExport.service.js';
import { asyncHandler } from '../middlewares/async.middleware.js';
import { ErrorResponse } from '../utils/errorResponse.js';

/**
 * @desc    Get potential orders for a specific stream
 * @route   GET /api/potential-orders/stream/:streamId
 * @access  Private (Host only)
 */
export const getPotentialOrdersForStream = asyncHandler(async (req, res) => {
  const { streamId } = req.params;

  try {
    // streamId is actually roomId in this case, find by roomId instead of _id
    const stream = await LiveStream.findOne({ roomId: streamId });
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found',
      });
    }

    // Check authorization - skip for now to debug
    // if (stream.hostId.toString() !== req.user.id && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Not authorized to access this stream's orders",
    //   });
    // }

    // Try direct database query instead of service
    const orders = await PotentialOrder.find({
      streamId: stream._id, // Use the actual stream ObjectId
      status: { $in: ['pending', 'contacted'] },
    })
      .populate('customerInfo.userId', 'username avatar')
      .populate('chatMessageId', 'content timestamp')
      .sort({ priority: -1, createdAt: -1 })
      .limit(50)
      .lean(); // Use lean() for better performance

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('Error in getPotentialOrdersForStream:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load potential orders',
      error: error.message,
    });
  }
});

/**
 * @desc    Get potential orders for current user (host)
 * @route   GET /api/potential-orders/my-orders
 * @access  Private (Host only)
 */
export const getMyPotentialOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, priority, searchText, dateRange } = req.query;

  // Build filter
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (priority && priority !== 'all') filter.priority = priority;
  if (searchText) {
    const search = new RegExp(String(searchText).trim(), 'i');
    filter.$or = [
      { 'customerInfo.customerName': search },
      { 'customerInfo.phoneNumber': search },
      { 'productInfo.originalMessage': search },
    ];
  }
  if (dateRange && dateRange.start && dateRange.end) {
    filter.createdAt = { $gte: new Date(dateRange.start), $lte: new Date(dateRange.end) };
  }

  const orders = await PotentialOrder.find(filter)
    .populate({
      path: 'streamId',
      match: { hostId: req.user.id },
      select: 'title roomId createdAt',
    })
    .populate('customerInfo.userId', 'username avatar fullName')
    .populate('productInfo.productId', 'name mainImage finalPrice brand sku')
    .populate('chatMessageId', 'content timestamp')
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // Filter out orders where stream doesn't match the host
  const filteredOrders = orders.filter(order => order.streamId);

  const total = await PotentialOrder.countDocuments({
    ...filter,
    streamId: { $in: await LiveStream.find({ hostId: req.user.id }).distinct('_id') },
  });

  res.status(200).json({
    success: true,
    count: filteredOrders.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: filteredOrders,
  });
});

/**
 * @desc    Get potential orders grouped by stream for current host
 * @route   GET /api/potential-orders/grouped-by-stream
 * @access  Private (Host only)
 */
export const getMyPotentialOrdersGrouped = asyncHandler(async (req, res) => {
  // Find streams owned by this host
  const hostStreams = await LiveStream.find({ hostId: req.user.id })
    .select('_id title roomId createdAt')
    .lean();

  const streamIdToInfo = hostStreams.reduce((acc, s) => {
    acc[String(s._id)] = s;
    return acc;
  }, {});

  const streamIds = hostStreams.map(s => s._id);

  if (streamIds.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  // Aggregate orders by stream with avatar populated
  const grouped = await PotentialOrder.aggregate([
    { $match: { streamId: { $in: streamIds } } },
    // Populate customer avatar and username
    {
      $lookup: {
        from: 'users',
        localField: 'customerInfo.userId',
        foreignField: '_id',
        as: 'customerUser',
      },
    },
    { $unwind: { path: '$customerUser', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        'customerInfo.userId': {
          _id: '$customerUser._id',
          username: '$customerUser.username',
          avatar: '$customerUser.avatar',
        },
      },
    },
    // Populate product basic info
    {
      $lookup: {
        from: 'products',
        localField: 'productInfo.productId',
        foreignField: '_id',
        as: 'productDoc',
      },
    },
    { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        'productInfo.productId': {
          _id: '$productDoc._id',
          name: '$productDoc.name',
          sku: '$productDoc.sku',
          brand: '$productDoc.brand',
          finalPrice: '$productDoc.finalPrice',
        },
      },
    },
    {
      $group: {
        _id: '$streamId',
        orders: { $push: '$$ROOT' },
        count: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        contacted: { $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] } },
        confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
        ignored: { $sum: { $cond: [{ $eq: ['$status', 'ignored'] }, 1, 0] } },
        spam: { $sum: { $cond: [{ $eq: ['$status', 'spam'] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const data = grouped.map(g => ({
    stream: streamIdToInfo[String(g._id)] || { _id: g._id },
    stats: {
      total: g.count,
      pending: g.pending,
      contacted: g.contacted,
      confirmed: g.confirmed,
      converted: g.converted,
      ignored: g.ignored,
      spam: g.spam,
    },
    orders: g.orders,
  }));

  res.status(200).json({ success: true, data });
});

/**
 * @desc    Get single potential order
 * @route   GET /api/potential-orders/:id
 * @access  Private (Host/Admin only)
 */
export const getPotentialOrder = asyncHandler(async (req, res) => {
  const order = await PotentialOrder.findById(req.params.id)
    .populate('streamId', 'title roomId hostId')
    .populate('customerInfo.userId', 'username avatar fullName email phone')
    .populate('productInfo.productId', 'name mainImage price brand inventory')
    .populate('chatMessageId', 'content timestamp')
    .populate('convertedOrderId', 'orderNumber status totalPrice');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Potential order not found',
    });
  }

  // Check authorization
  if (order.streamId.hostId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this order',
    });
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

/**
 * @desc    Update potential order status
 * @route   PUT /api/potential-orders/:id/status
 * @access  Private (Host/Admin only)
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const logger = (await import('../utils/logger.js')).default;
  logger.info('[PO] updateOrderStatus called', {
    potentialOrderId: req.params.id,
    requestedStatus: status,
    actorUserId: req.user?.id,
  });

  const order = await PotentialOrder.findById(req.params.id).populate('streamId', 'hostId');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Potential order not found',
    });
  }

  // Check authorization
  if (order.streamId.hostId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this order',
    });
  }

  // Validate status
  const validStatuses = ['pending', 'contacted', 'confirmed', 'converted', 'ignored', 'spam'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status',
    });
  }

  const updatedOrder = await orderDetectionService.updateOrderStatus(
    req.params.id,
    status,
    req.user.id,
    notes
  );
  logger.info('[PO] updateOrderStatus updated', {
    id: String(updatedOrder._id),
    newStatus: updatedOrder.status,
  });

  // Auto create real order when confirmed
  if (status === 'confirmed') {
    try {
      const User = (await import('../models/User.js')).default;
      const Product = (await import('../models/Product.js')).default;
      const { OrderService } = await import('../services/order.service.js');

      const user = await User.findById(updatedOrder.customerInfo.userId).select(
        'fullName email phone address'
      );
      const product = await Product.findById(updatedOrder.productInfo.productId).select(
        'finalPrice price.regular'
      );

      logger.info('[PO] auto-create check', {
        hasUser: Boolean(user),
        hasProduct: Boolean(product),
        productId: product ? String(product._id) : null,
      });

      if (user && product) {
        const quantity = updatedOrder.productInfo.extractedQuantity || 1;
        const price =
          (typeof product.finalPrice === 'number' && product.finalPrice > 0
            ? product.finalPrice
            : product.price?.regular) || 0;
        const size = updatedOrder.productInfo.extractedSize || undefined;
        const color = updatedOrder.productInfo.extractedColor || undefined;

        if (price <= 0) {
          logger.warn('[PO] skip auto-create: invalid price', {
            productId: String(product._id),
            finalPrice: product.finalPrice,
            regular: product.price?.regular,
          });
        } else {
          logger.info('[PO] creating real order', {
            userId: String(user._id),
            productId: String(product._id),
            quantity,
            price,
            size,
            color,
          });
          const created = await OrderService.createOrder({
            user: user._id,
            products: [{ id: product._id, quantity, price, size, color }],
            totalAmount: price * quantity,
            paymentMethod: 'cash_on_delivery',
            shippingAddress: user.address || 'COD - address from profile',
            notes: `Auto-created from potential order ${updatedOrder._id}, Order in livestream chat`,
            status: 'pending',
            paymentStatus: 'pending',
          });

          // Link back to potential order
          await PotentialOrder.findByIdAndUpdate(updatedOrder._id, {
            $set: { convertedOrderId: created._id },
          });
          logger.info('[PO] real order created and linked', {
            potentialOrderId: String(updatedOrder._id),
            orderId: String(created._id),
          });
        }
      }
    } catch (e) {
      logger.error('[PO] auto-create failed', { error: e.message, stack: e.stack });
    }
  }

  res.status(200).json({
    success: true,
    data: updatedOrder,
  });
});

/**
 * @desc    Mark order as viewed
 * @route   PUT /api/potential-orders/:id/viewed
 * @access  Private (Host/Admin only)
 */
export const markAsViewed = asyncHandler(async (req, res) => {
  const order = await PotentialOrder.findById(req.params.id).populate('streamId', 'hostId');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Potential order not found',
    });
  }

  // Check authorization
  if (order.streamId.hostId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this order',
    });
  }

  await order.markAsViewed(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Order marked as viewed',
  });
});

/**
 * @desc    Add note to potential order
 * @route   PUT /api/potential-orders/:id/notes
 * @access  Private (Host/Admin only)
 */
export const addNote = asyncHandler(async (req, res) => {
  const { note } = req.body;

  if (!note || note.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Note is required',
    });
  }

  const order = await PotentialOrder.findById(req.params.id).populate('streamId', 'hostId');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Potential order not found',
    });
  }

  // Check authorization
  if (order.streamId.hostId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this order',
    });
  }

  await order.addHostNote(note, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Note added successfully',
    data: order,
  });
});

/**
 * @desc    Get order statistics for host
 * @route   GET /api/potential-orders/stats
 * @access  Private (Host only)
 */
export const getOrderStats = asyncHandler(async (req, res) => {
  const hostStreams = await LiveStream.find({ hostId: req.user.id }).distinct('_id');

  const stats = await PotentialOrder.aggregate([
    {
      $match: {
        streamId: { $in: hostStreams },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const priorityStats = await PotentialOrder.aggregate([
    {
      $match: {
        streamId: { $in: hostStreams },
        status: { $in: ['pending', 'contacted'] },
      },
    },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 },
      },
    },
  ]);

  // Get recent orders (last 24 hours)
  const recentCount = await PotentialOrder.countDocuments({
    streamId: { $in: hostStreams },
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  // Format stats
  const statusStats = {};
  stats.forEach(stat => {
    statusStats[stat._id] = stat.count;
  });

  const priorityStatsFormatted = {};
  priorityStats.forEach(stat => {
    priorityStatsFormatted[stat._id] = stat.count;
  });

  res.status(200).json({
    success: true,
    data: {
      statusStats,
      priorityStats: priorityStatsFormatted,
      recentCount,
      totalActive: (statusStats.pending || 0) + (statusStats.contacted || 0),
    },
  });
});

/**
 * @desc    Delete potential order (mark as spam)
 * @route   DELETE /api/potential-orders/:id
 * @access  Private (Host/Admin only)
 */
export const deletePotentialOrder = asyncHandler(async (req, res) => {
  const order = await PotentialOrder.findById(req.params.id).populate('streamId', 'hostId');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Potential order not found',
    });
  }

  // Check authorization
  if (order.streamId.hostId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this order',
    });
  }

  await order.markAsSpam();

  res.status(200).json({
    success: true,
    message: 'Order marked as spam',
  });
});

/**
 * @desc    Export potential orders to Excel
 * @route   GET /api/potential-orders/export
 * @access  Private (Shop/Admin only)
 */
export const exportPotentialOrders = asyncHandler(async (req, res) => {
  const {
    status = 'all',
    priority = 'all',
    searchText = '',
    dateRange = [],
    streamId = null,
  } = req.query;

  try {
    // Build query
    const query = {};

    // Apply status filter
    if (status !== 'all') {
      query.status = status;
    }

    // Apply priority filter
    if (priority !== 'all') {
      query.priority = priority;
    }

    // Apply search filter
    if (searchText) {
      query.$or = [
        { 'customerInfo.customerName': { $regex: searchText, $options: 'i' } },
        { 'customerInfo.phoneNumber': { $regex: searchText, $options: 'i' } },
        { 'productInfo.originalMessage': { $regex: searchText, $options: 'i' } },
        { 'productInfo.extractedSize': { $regex: searchText, $options: 'i' } },
        { 'productInfo.extractedColor': { $regex: searchText, $options: 'i' } },
      ];
    }

    // Apply date range filter
    if (dateRange && dateRange.length === 2) {
      const startDate = new Date(dateRange[0]);
      const endDate = new Date(dateRange[1]);
      endDate.setHours(23, 59, 59, 999); // End of day
      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // Apply stream filter
    if (streamId) {
      query.streamId = streamId;
    }

    // Fetch orders with populated data
    const orders = await PotentialOrder.find(query)
      .populate('customerInfo.userId', 'username avatar')
      .populate('productInfo.productId', 'name sku brand price finalPrice')
      .populate('streamId', 'title roomId')
      .populate('hostActions.confirmedBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    // Generate Excel file
    const excelBuffer = await excelExportService.exportWithFilters(orders, {
      status,
      priority,
      searchText,
      dateRange,
      streamId,
    });

    // Set response headers for file download
    const filename = `potential-orders-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting potential orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting potential orders',
      error: error.message,
    });
  }
});

/**
 * @desc    Export potential orders for a specific stream to Excel
 * @route   GET /api/potential-orders/stream/:streamId/export
 * @access  Private (Host/Admin only)
 */
export const exportPotentialOrdersForStream = asyncHandler(async (req, res) => {
  const { streamId } = req.params;
  const { status = 'all', priority = 'all' } = req.query;

  try {
    // Find stream by roomId
    const stream = await LiveStream.findOne({ roomId: streamId });
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found',
      });
    }

    // Build query
    const query = { streamId: stream._id };

    // Apply status filter
    if (status !== 'all') {
      query.status = status;
    }

    // Apply priority filter
    if (priority !== 'all') {
      query.priority = priority;
    }

    // Fetch orders with populated data
    const orders = await PotentialOrder.find(query)
      .populate('customerInfo.userId', 'username avatar')
      .populate('productInfo.productId', 'name sku brand price finalPrice')
      .populate('hostActions.confirmedBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    // Generate Excel file
    const excelBuffer = await excelExportService.exportPotentialOrders(orders);

    // Set response headers for file download
    const filename = `potential-orders-${stream.title || stream.roomId}-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting potential orders for stream:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting potential orders for stream',
      error: error.message,
    });
  }
});
