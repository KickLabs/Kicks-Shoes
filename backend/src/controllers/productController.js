/**
 * @fileoverview Improved Product Controller
 * @created 2025-06-08
 * @file productController.js
 * @description Improved controller with better error handling
 */

import { validationResult } from 'express-validator';
import { ProductService } from '../services/product.service.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';
import Report from '../models/Report.js';

/**
 * Create a new product
 * @route POST /api/products/add
 * @access Private/Admin
 */
export const createProduct = async (req, res, next) => {
  try {
    console.log('Controller received product data:', JSON.stringify(req.body, null, 2));

    logger.info('Creating new product', { productData: req.body });
    const product = await ProductService.createProduct(req.body);

    logger.info('Product created successfully', { productId: product._id });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Controller error creating product:', error);
    logger.error('Error creating product', {
      error: error.message,
      stack: error.stack,
    });

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message,
          value: err.value,
        })),
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate value for field: ${duplicateField}`,
        field: duplicateField,
      });
    }

    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
        field: error.path,
        value: error.value,
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }
};

/**
 * Update product
 * @route PUT /api/products/:id
 * @access Private/Admin
 */
export const updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    console.log('Controller updating product:', productId, JSON.stringify(req.body, null, 2));

    logger.info('Updating product', { productId, updateData: req.body });

    const updatedProduct = await ProductService.updateProduct(productId, req.body);
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    logger.info('Product updated successfully', { productId });
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    console.error('Controller error updating product:', error);
    logger.error('Error updating product', {
      error: error.message,
      stack: error.stack,
    });

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message,
          value: err.value,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }
};

// Keep other methods the same...
export const createManyProducts = async (req, res, next) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required and must not be empty',
      });
    }

    logger.info('Creating multiple products', { count: products.length });
    const results = await ProductService.createManyProducts(products);

    logger.info('Bulk product creation completed', {
      successful: results.success.length,
      failed: results.failed.length,
    });

    res.status(201).json({
      success: true,
      data: {
        successful: results.success,
        failed: results.failed,
        summary: {
          total: products.length,
          successful: results.success.length,
          failed: results.failed.length,
        },
      },
    });
  } catch (error) {
    logger.error('Error in bulk product creation', { error: error.message });
    next(new ErrorResponse(error.message, 500));
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    logger.info('Deleting product', { productId });

    const deletedProduct = await ProductService.deleteProduct(productId);
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    logger.info('Product deleted successfully', { productId });
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: deletedProduct,
    });
  } catch (error) {
    logger.error('Error deleting product', { error: error.message });
    next(new ErrorResponse(error.message, 500));
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const productId = req.params.id;
    logger.info('Fetching product details', { productId });

    const product = await ProductService.getProductById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    logger.info('Product details fetched successfully', { productId });
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    logger.error('Error fetching product details', { error: error.message });
    next(new ErrorResponse(error.message, 500));
  }
};

export const getAllProducts = async (req, res) => {
  try {
    // Destructure all possible filters from query
    const {
      size,
      color,
      brand,
      category,
      minPrice,
      maxPrice,
      isNew,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 9,
    } = req.query;

    // Build a single query object for the service
    const query = {
      size: size ? Number(size) : undefined,
      color: color || undefined,
      brand: brand || undefined,
      category: category || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      isNew: isNew === 'true' ? true : undefined,
      sortBy,
      order,
      page: Number(page),
      limit: Number(limit),
    };

    console.log('Controller sending query to service:', query);

    const { products, total } = await ProductService.getAllProducts(query);

    res.status(200).json({
      success: true,
      data: { products, total },
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getNewDrops = async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const result = await ProductService.getNewDrops({
      page: Number(page),
      limit: Number(limit),
      filters,
    });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('Error fetching new drops:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getRecommendProductsForProductDetails = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await ProductService.getRecommendProductsForProductDetails({
      productId,
    });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('Error fetching recommend products:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Report a product
 * @route POST /api/products/:id/report
 * @access Private (user)
 */
export const reportProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { reason, description, evidence } = req.body;
    if (!reason || !description) {
      return res
        .status(400)
        .json({ success: false, message: 'Reason and description are required' });
    }
    const report = new Report({
      reporter: req.user.id,
      targetType: 'product',
      targetId: productId,
      reason,
      description,
      evidence,
    });
    await report.save();
    res.status(201).json({ success: true, message: 'Product reported successfully', data: report });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: 'You have already reported this product.' });
    }
    next(error);
  }
};

/**
 * Get all reports of current user
 * @route GET /api/reports/my
 * @access Private (user)
 */
export const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user.id })
      .sort({ createdAt: -1 })
      .populate({ path: 'targetId', model: 'Product', select: 'name mainImage' });
    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
