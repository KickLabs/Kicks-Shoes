/**
 * @fileoverview AI Inventory Controller
 * @created 2025-10-28
 * @file aiInventoryController.js
 * @description Handle AI inventory analysis and alerts
 */

import { asyncHandler } from '../middlewares/async.middleware.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import aiInventoryService from '../services/aiInventory.service.js';
import Product from '../models/Product.js';
import logger from '../utils/logger.js';
import { getSocketIO } from '../utils/socketIO.js';

/**
 * @desc    Run full inventory analysis
 * @route   POST /api/ai/inventory/analyze
 * @access  Private (Shop/Admin) - Primarily for shop owners
 */
export const runInventoryAnalysis = asyncHandler(async (req, res) => {
  logger.info(`Inventory analysis triggered by user ${req.user.id}`);

  const analysis = await aiInventoryService.analyzeAllInventory();

  // Send alerts if any critical issues
  const alerts = await aiInventoryService.sendInventoryAlerts(analysis);

  // Broadcast to admin dashboard via Socket.IO
  const io = getSocketIO();
  if (io) {
    io.to('admin-room').emit('inventory_analysis_complete', {
      analysis,
      alerts,
    });
  }

  res.json({
    success: true,
    message: 'Inventory analysis completed',
    data: {
      ...analysis,
      alertsSent: alerts.length,
    },
  });
});

/**
 * @desc    Analyze specific product
 * @route   GET /api/ai/inventory/product/:id
 * @access  Private (Shop/Admin) - Primarily for shop owners
 */
export const analyzeProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id).populate('category');

  if (!product) {
    throw new ErrorResponse('Product not found', 404);
  }

  const analysis = await aiInventoryService.analyzeProduct(product);

  res.json({
    success: true,
    data: analysis,
  });
});

/**
 * @desc    Get inventory dashboard data
 * @route   GET /api/ai/inventory/dashboard
 * @access  Private (Shop/Admin) - Primarily for shop owners
 */
export const getInventoryDashboard = asyncHandler(async (req, res) => {
  // Get summary stats
  const totalProducts = await Product.countDocuments({ status: true });

  const lowStock = await Product.countDocuments({
    status: true,
    stock: { $lte: 10, $gt: 0 },
  });

  const outOfStock = await Product.countDocuments({
    status: true,
    stock: 0,
  });

  const highStock = await Product.countDocuments({
    status: true,
    stock: { $gte: 50 },
  });

  // Get recent issues (from cache or last analysis)
  // In production, you'd store this in Redis or database

  res.json({
    success: true,
    data: {
      summary: {
        totalProducts,
        lowStock,
        outOfStock,
        highStock,
        needsAttention: lowStock + outOfStock,
      },
      timestamp: new Date(),
    },
  });
});

/**
 * @desc    Create auto flash sale for overstock product
 * @route   POST /api/ai/inventory/auto-sale/:productId
 * @access  Private (Shop/Admin) - Primarily for shop owners
 */
export const createAutoSale = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { discountPercent } = req.body;

  const flashSale = await aiInventoryService.createAutoFlashSale(productId, discountPercent || 30);

  if (!flashSale) {
    throw new ErrorResponse('Failed to create flash sale', 500);
  }

  res.json({
    success: true,
    message: 'Auto flash sale created',
    data: flashSale,
  });
});

/**
 * @desc    Get AI recommendations for product
 * @route   GET /api/ai/inventory/recommend/:productId
 * @access  Private (Shop/Admin) - Primarily for shop owners
 */
export const getRecommendation = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId).populate('category');

  if (!product) {
    throw new ErrorResponse('Product not found', 404);
  }

  const metrics = await aiInventoryService.calculateProductMetrics(product);
  const issue = aiInventoryService.detectInventoryIssue(metrics);

  if (!issue) {
    return res.json({
      success: true,
      data: {
        hasIssue: false,
        message: 'Product inventory is healthy',
        metrics,
      },
    });
  }

  const recommendation = await aiInventoryService.generateRecommendation(product, metrics, issue);

  res.json({
    success: true,
    data: {
      hasIssue: true,
      issue: issue.type,
      severity: issue.severity,
      metrics,
      recommendation,
    },
  });
});
