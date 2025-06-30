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
      sortBy,
      order,
      page: Number(page),
      limit: Number(limit),
    };

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

/**
 * Remove violating product
 * @route DELETE /api/products/violation/:id
 * @access Private/Admin
 */
export const removeViolatingProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    logger.warn('Admin attempting to remove violating product', { productId });

    const deleted = await ProductService.deleteProduct(productId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or already deleted',
      });
    }

    logger.info('Violating product removed successfully', { productId });
    res.status(200).json({
      success: true,
      message: 'Violating product removed successfully',
      data: deleted,
    });
  } catch (error) {
    logger.error('Error removing violating product', { error: error.message });
    next(new ErrorResponse(error.message, 500));
  }
};
