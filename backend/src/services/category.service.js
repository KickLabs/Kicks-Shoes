/**
 * @fileoverview Category Service
 * @created 2025-06-08
 * @file category.service.js
 * @description This service handles all category-related business logic for the Kicks Shoes application.
 */

import Category from "../models/Category.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

export class CategoryService {
  /**
   * Get all categories
   * @returns {Promise<Array>} List of categories
   */
  static async getCategories() {
    try {
      logger.info("Getting all categories");
      const categories = await Category.find();
      return categories;
    } catch (error) {
      logger.error("Error getting categories", { error: error.message });
      throw error;
    }
  }

  /**
   * Get category by ID
   * @param {string} id - Category ID
   * @returns {Promise<Category>} Category data
   */
  static async getCategoryById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid category ID");
      }

      logger.info("Getting category by ID", { categoryId: id });
      const category = await Category.findById(id);

      if (!category) {
        throw new Error(`Category not found with id of ${id}`);
      }

      return category;
    } catch (error) {
      logger.error("Error getting category by ID", { error: error.message });
      throw error;
    }
  }

  /**
   * Create new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Category>} Created category
   */
  static async createCategory(categoryData) {
    try {
      logger.info("Creating new category", { categoryData });
      const category = await Category.create(categoryData);

      logger.info("Category created successfully", {
        categoryId: category._id,
      });

      return category;
    } catch (error) {
      logger.error("Error creating category", { error: error.message });
      throw error;
    }
  }

  /**
   * Update category
   * @param {string} id - Category ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Category>} Updated category
   */
  static async updateCategory(id, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid category ID");
      }

      logger.info("Updating category", { categoryId: id, updateData });

      const category = await Category.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!category) {
        throw new Error(`Category not found with id of ${id}`);
      }

      logger.info("Category updated successfully", { categoryId: id });

      return category;
    } catch (error) {
      logger.error("Error updating category", { error: error.message });
      throw error;
    }
  }

  /**
   * Delete category
   * @param {string} id - Category ID
   * @returns {Promise<void>}
   */
  static async deleteCategory(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid category ID");
      }

      logger.info("Deleting category", { categoryId: id });

      const category = await Category.findById(id);
      if (!category) {
        throw new Error(`Category not found with id of ${id}`);
      }

      await category.deleteOne();
      logger.info("Category deleted successfully", { categoryId: id });
    } catch (error) {
      logger.error("Error deleting category", { error: error.message });
      throw error;
    }
  }
}
