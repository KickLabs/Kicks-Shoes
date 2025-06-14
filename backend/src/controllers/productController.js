/**
 * @fileoverview Product Controller
 * @created 2025-06-08
 * @file productController.js
 * @description This controller handles all product-related HTTP requests for the Kicks Shoes application.
 */

import { query, validationResult } from "express-validator";
import { ProductService } from "../services/product.service.js";
import { ErrorResponse } from "../utils/errorResponse.js";
import logger from "../utils/logger.js";
import { get } from "mongoose";

// Validation rules for query parameters only
const queryValidationRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("Invalid page number"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Invalid limit"),
  query("category").optional().isMongoId().withMessage("Invalid category ID"),
  query("brand").optional().trim().notEmpty().withMessage("Invalid brand"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Invalid minimum price"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Invalid maximum price"),
  query("inStock").optional().isBoolean().withMessage("Invalid stock filter"),
  query("onSale").optional().isBoolean().withMessage("Invalid sale filter"),
  query("sort")
    .optional()
    .isIn(["price", "-price", "createdAt", "-createdAt", "rating", "-rating"])
    .withMessage("Invalid sort field"),
];

// Middleware to validate request data
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Create a new product
 * @route POST /api/products
 * @access Private/Admin
 */
export const createProduct = async (req, res, next) => {
  try {
    logger.info("Creating new product", { productData: req.body });
    const product = await ProductService.createProduct(req.body);

    logger.info("Product created successfully", { productId: product._id });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    logger.error("Error creating product", { error: error.message });
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        errors: Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }
    next(new ErrorResponse(error.message, 500));
  }
};

/**
 * Create multiple products at once
 * @route POST /api/products/bulk
 * @access Private/Admin
 */
export const createManyProducts = async (req, res, next) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Products array is required and must not be empty",
      });
    }

    logger.info("Creating multiple products", { count: products.length });
    const results = await ProductService.createManyProducts(products);

    logger.info("Bulk product creation completed", {
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
    logger.error("Error in bulk product creation", { error: error.message });
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        errors: Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }
    next(new ErrorResponse(error.message, 500));
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    logger.info("Deleting product", { productId });

    const deletedProduct = await ProductService.deleteProduct(productId);
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    logger.info("Product deleted successfully", { productId });
    res.status(200).json({
      success: true,
      data: deletedProduct,
    });
  } catch (error) {
    logger.error("Error deleting product", { error: error.message });
    next(new ErrorResponse(error.message, 500));
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const productId = req.params.id;
    logger.info("Fetching product details", { productId });

    const product = await ProductService.getProductById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    logger.info("Product details fetched successfully", { productId });
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    logger.error("Error fetching product details", { error: error.message });
    next(new ErrorResponse(error.message, 500));
  }
}
export const getAllProducts = async (req, res, next) => {
  try {
    logger.info("Fetching all products", { query: req.query });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Nhận về { products, total }
    const { products, total } = await ProductService.getAllProducts(req.query);

    logger.info("Products fetched successfully", { count: products.length });
    res.status(200).json({
      success: true,
      data: {
        products,
        total,
      },
    });
  } catch (error) {
    logger.error("Error fetching products", { error: error.message });
    next(new ErrorResponse(error.message, 500));
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    logger.info("Updating product", { productId, updateData: req.body });

    const updatedProduct = await ProductService.updateProduct(productId, req.body);
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    logger.info("Product updated successfully", { productId });
    res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    logger.error("Error updating product", { error: error.message });
    next(new ErrorResponse(error.message, 500));
  }
};

// Export all routes
export const productRoutes = {
  createProduct,
  createManyProducts,
  deleteProduct,
  getProductById,
  getAllProducts,
  updateProduct
};
