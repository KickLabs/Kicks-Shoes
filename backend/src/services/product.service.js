/**
 * @fileoverview Product Service
 * @created 2025-06-08
 * @file product.service.js
 * @description This service handles all product-related business logic for the Kicks Shoes application.
 * It provides methods for creating, updating, and deleting products.
 */

import Product from "../models/Product.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

/**
 * Service class for handling product operations
 */
export class ProductService {
  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Product>} The created product
   */
  static async createProduct(productData) {
    try {
      const {
        name,
        description,
        price,
        category,
        brand,
        images,
        variants,
        tags,
        status,
        stock,
        sales,
        rating,
      } = productData;

      // Validate required fields
      if (
        !name ||
        !description ||
        !price?.regular ||
        !category ||
        !brand ||
        !images ||
        !variants
      ) {
        throw new Error("Missing required fields");
      }

      const isNew = true;
      const product = new Product({
        name,
        description,
        price: {
          regular: price.regular,
          discountPercent: price.discountPercent || 0,
          isOnSale: price.isOnSale || false,
        },
        category,
        brand,
        images,
        variants,
        tags: tags || [],
        status: status ?? true,
        stock: stock || 0,
        sales: sales || 0,
        rating: rating || 0,
        isNew,
      });

      await product.save();

      logger.info("Product created successfully", { productId: product._id });
      return product;
    } catch (error) {
      logger.error("Error creating product", { error: error.message });
      throw error;
    }
  }

  /**
   * Create multiple products at once
   * @param {Array<Object>} productsData - Array of product data
   * @returns {Promise<{success: Array<Product>, failed: Array<{data: Object, error: string}>}>} Created products and failed products
   */
  static async createManyProducts(productsData) {
    try {
      const results = {
        success: [],
        failed: [],
      };

      for (const productData of productsData) {
        try {
          // Validate required fields
          if (
            !productData.name ||
            !productData.brand ||
            !productData.category ||
            !productData.price
          ) {
            throw new Error("Missing required fields");
          }
          if (
            !productData.inventory ||
            !Array.isArray(productData.inventory) ||
            productData.inventory.length === 0
          ) {
            throw new Error("Invalid inventory data");
          }
          if (
            !productData.variants ||
            !productData.variants.sizes ||
            !productData.variants.colors
          ) {
            throw new Error("Invalid variants data");
          }

          const newProduct = new Product(productData);
          const savedProduct = await newProduct.save();
          results.success.push(savedProduct);
        } catch (error) {
          results.failed.push({
            data: productData,
            error: error.message,
          });
        }
      }

      logger.info("Bulk product creation completed", {
        successful: results.success.length,
        failed: results.failed.length,
      });

      return results;
    } catch (error) {
      logger.error("Error in bulk product creation", { error: error.message });
      throw error;
    }
  }
  /**
 * Delete a product by ID
 * @param {String} productId - The ID of the product to delete
 * @returns {Promise<Product|null>} The deleted product or null if not found
 */
static async deleteProduct(productId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      throw new Error("Product not found");
    }

    logger.info("Product deleted successfully", { productId });
    return deletedProduct;
  } catch (error) {
    logger.error("Error deleting product", { error: error.message });
    throw error;
  }
}
/**
 * Get a product by ID
 * @param {String} productId - The ID of the product to retrieve
 * @returns {Promise<Product|null>} The product or null if not found
 */
static async getProductById(productId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    const product = await Product.findById(productId);
    return product;
  } catch (error) {
    logger.error("Error retrieving product by ID", {
      productId,
      error: error.message,
    });
    throw error;
  }
}
  /**
 * Get all products with optional filters, sorting and pagination
 * @param {Object} query - Query parameters for filtering, sorting, and pagination
 * @returns {Promise<Array<Product>>} List of matching products
 */
static async getAllProducts(query = {}) {
  try {
    const {
      keyword = '',
      category,
      brand,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const filter = {};

    if (keyword) {
      filter.name = { $regex: keyword, $options: 'i' };
    }

    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Lấy tổng số sản phẩm
    const total = await Product.countDocuments(filter);

    // Lấy danh sách sản phẩm phân trang
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    return { products, total };
  } catch (error) {
    logger.error("Error retrieving filtered products", { error: error.message });
    throw error;
  }
}
/**
 * Update a product by ID
 * @param {String} productId - The ID of the product to update
 * @param {Object} updateData - The product fields to update
 * @returns {Promise<Product|null>} The updated product or null if not found
 */
static async updateProduct(productId, updateData) {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      throw new Error("Product not found");
    }

    logger.info("Product updated successfully", { productId });
    return updatedProduct;
  } catch (error) {
    logger.error("Error updating product", {
      productId,
      error: error.message,
    });
    throw error;
  }
}
}
