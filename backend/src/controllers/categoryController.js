/**
 * @fileoverview Category Controller
 * @created 2025-06-04
 * @file categoryController.js
 * @description This controller handles all category-related HTTP requests for the Kicks Shoes application.
 * It processes incoming requests, validates input data, and coordinates with the category service
 * to perform category operations. The controller is responsible for request/response handling
 * and error management.
 */

import Category from "../models/Category.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { ErrorResponse } from "../utils/errorResponse.js";

// Get all categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

// Get single category
export const getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(
      new ErrorResponse(`Category not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

// Create new category
export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    data: category,
  });
});

// Update category
export const updateCategory = asyncHandler(async (req, res, next) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    return next(
      new ErrorResponse(`Category not found with id of ${req.params.id}`, 404)
    );
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: category,
  });
});

// Delete category
export const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(
      new ErrorResponse(`Category not found with id of ${req.params.id}`, 404)
    );
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});
