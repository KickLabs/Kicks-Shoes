/**
 * @fileoverview Shop Controller
 * @created 2025-06-04
 * @file storeController.js
 * @description This controller handles all shop-related HTTP requests for the Kicks Shoes application.
 * It processes incoming requests, validates input data, and coordinates with the shop service
 * to perform shop operations. The controller is responsible for request/response handling
 * and error management.
 */
import { query, validationResult } from "express-validator";
import e from "express";
import Product from "../models/Product.js";
import { ErrorResponse } from "../utils/errorResponse.js";
import logger from "../utils/logger.js";
import Store from "../models/Store.js";
import { StoreService } from "../services/store.service.js";

const storeQueryValidationRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("Invalid page number"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Invalid limit"),
  query("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Store name must be between 1-50 characters"),
  query("address")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Address must be between 1-200 characters"),
  query("phone")
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone must be a valid 10-digit number"),
  query("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email format"),
  query("isOpen")
    .optional()
    .isBoolean()
    .withMessage("Invalid store status filter"),
  query("city")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Invalid city filter"),
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1-100 characters"),
  query("sort")
    .optional()
    .isIn([
      "name", "-name", 
      "createdAt", "-createdAt", 
      "address", "-address",
      "isOpen", "-isOpen"
    ])
    .withMessage("Invalid sort field"),
];

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

// Get shop products
export const getStoreProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate("category", "name")
      .populate("brand", "name");

    res.status(200).json(products);
  } catch (error) {
    logger.error("Error in getStoreProducts", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

// Add shop product
export const addStoreProduct = async (req, res, next) => {
  try {
    const productData = {
      ...req.body,
      images: req.files ? req.files.map((file) => file.path) : [],
    };

    const product = await Product.create(productData);
    await product.populate("category", "name");
    await product.populate("brand", "name");

    res.status(201).json(product);
  } catch (error) {
    logger.error("Error in addStoreProduct", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

// Update shop product
export const updateStoreProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return next(new ErrorResponse("Product not found", 404));
    }

    const updates = { ...req.body };
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map((file) => file.path);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.productId,
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("category", "name")
      .populate("brand", "name");

    res.status(200).json(updatedProduct);
  } catch (error) {
    logger.error("Error in updateStoreProduct", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

// Delete shop product
export const deleteStoreProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return next(new ErrorResponse("Product not found", 404));
    }

    await product.remove();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    logger.error("Error in deleteStoreProduct", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

// Delete store
export const deleteStore = async (req, res, next) => {
  try {
    const storeId = req.params.id;
    logger.info("Deleting store", { storeId });

    const deletedStore = await StoreService.deleteStore(storeId);
    if (!deletedStore) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    logger.info("Store deleted successfully", { storeId });
    res.status(200).json({
      success: true,
      data: deletedStore,
    });
  } catch (error) {
    logger.error("Error deleting store", { error: error.message });
    next(new ErrorResponse(error.message, 500));
  }
};

// Create new store
export const createStore = async (req, res, next) => {
  try {
    logger.info("Creating new store", { storeData: req.body });
    const store = await StoreService.createStore(req.body);

    logger.info("Store created successfully", { storeId: store._id });

    res.status(201).json({
      success: true,
      data: store,
    });
  } catch (error) {
    logger.error("Error creating store", { error: error.message });
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

export const getStoreById = async (req, res, next) => {
  try {
    const storeId = req.params.id;
    logger.info("Fetching store details", { storeId });

    const store = await StoreService.getStoreById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    logger.info("Store details fetched successfully", { storeId });
    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    logger.error("Error fetching store details", { error: error.message });
    next(new ErrorResponse(error.message, 500));
  }
}

export const getAllStores = async (req, res, next) => {
  try {
    logger.info("Fetching all stores", { query: req.query });

    // Validate query parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const stores = await StoreService.getAllStores(req.query);

    logger.info("Stores fetched successfully", { count: stores.length });
    res.status(200).json({
      success: true,
      data: stores,
    });
  } catch (error) {
    logger.error("Error fetching stores", { error: error.message });
    next(new ErrorResponse(error.message, 500));
  }
};

export const updateStore = async (req, res, next) => {
  try {
    const storeId = req.params.id;
    logger.info("Updating store", { storeId, updateData: req.body });

    const updatedStore = await StoreService.updateStore(storeId, req.body);
    if (!updatedStore) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    logger.info("Store updated successfully", { storeId });
    res.status(200).json({
      success: true,
      data: updatedStore,
    });
  } catch (error) {
    logger.error("Error updating store", { error: error.message });
    next(new ErrorResponse(error.message, 500));
  }
};