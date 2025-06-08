/**
 * @fileoverview Category Controller
 * @created 2025-06-04
 * @file categoryController.js
 * @description This controller handles all category-related HTTP requests for the Kicks Shoes application.
 * It processes incoming requests, validates input data, and coordinates with the category service
 * to perform category operations. The controller is responsible for request/response handling
 * and error management.
 */

import { CategoryService } from "../services/category.service.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { ErrorResponse } from "../utils/errorResponse.js";
import logger from "../utils/logger.js";

// Get all categories
export const getCategories = asyncHandler(async (req, res) => {
  logger.info("Getting all categories");
  const categories = await CategoryService.getCategories();

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

// Get single category
export const getCategory = asyncHandler(async (req, res, next) => {
  try {
    const category = await CategoryService.getCategoryById(req.params.id);

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 404));
  }
});

// Create new category
export const createCategory = asyncHandler(async (req, res) => {
  logger.info("Creating new category", { categoryData: req.body });
  const category = await CategoryService.createCategory(req.body);

  res.status(201).json({
    success: true,
    data: category,
  });
});

// Update category
export const updateCategory = asyncHandler(async (req, res, next) => {
  try {
    logger.info("Updating category", {
      categoryId: req.params.id,
      updateData: req.body,
    });
    const category = await CategoryService.updateCategory(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 404));
  }
});

// Delete category
export const deleteCategory = asyncHandler(async (req, res, next) => {
  try {
    logger.info("Deleting category", { categoryId: req.params.id });
    await CategoryService.deleteCategory(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 404));
  }
});
