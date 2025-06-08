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
    let session;
    try {
      session = await mongoose.startSession();
      session.startTransaction();

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

      await product.save({ session });
      await session.commitTransaction();

      logger.info("Product created successfully", { productId: product._id });
      return product;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      logger.error("Error creating product", { error: error.message });
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
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
}
