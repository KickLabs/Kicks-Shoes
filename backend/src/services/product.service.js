/**
 * @fileoverview Fixed Product Service
 * @created 2025-06-08
 * @file product.service.js
 * @description Fixed service to match frontend data structure
 */

import Product from '../models/Product.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import Category from '../models/Category.js';

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
      console.log('ProductService.createProduct received:', JSON.stringify(productData, null, 2));

      const {
        name,
        summary, // Frontend sends 'summary', not 'description'
        description,
        price,
        category,
        brand,
        images,
        mainImage, // Add mainImage support
        variants,
        inventory, // Add inventory support
        tags,
        status,
        stock,
        sales,
        rating,
        isNew, // Add isNew support
      } = productData;

      // FIXED: Only validate truly required fields
      if (!name || !category || !brand) {
        throw new Error('Missing required fields: name, category, brand');
      }

      // FIXED: Validate price structure
      if (!price || typeof price !== 'object' || price.regular === undefined) {
        throw new Error('Invalid price structure');
      }

      // FIXED: Create product with all frontend fields
      const product = new Product({
        name: name.trim(),
        summary: summary?.trim() || '', // Use summary from frontend
        description: description?.trim() || '', // Optional description
        price: {
          regular: Number(price.regular) || 0,
          discountPercent: Number(price.discountPercent) || 0,
          isOnSale: Boolean(price.isOnSale),
        },
        category,
        brand,
        images: Array.isArray(images) ? images : [], // Handle empty arrays
        mainImage: mainImage || '', // Add mainImage
        variants: {
          sizes: variants?.sizes || [], // Handle auto-generated variants
          colors: variants?.colors || [],
        },
        inventory: Array.isArray(inventory) ? inventory : [], // Add inventory
        tags: Array.isArray(tags) ? tags : [],
        status: status !== undefined ? Boolean(status) : true,
        stock: Number(stock) || 0,
        sales: Number(sales) || 0,
        rating: Number(rating) || 0,
        isNew: Boolean(isNew), // Add isNew
      });

      const savedProduct = await product.save();

      logger.info('Product created successfully', { productId: savedProduct._id });
      return savedProduct;
    } catch (error) {
      logger.error('Error creating product', {
        error: error.message,
        stack: error.stack,
        productData: JSON.stringify(productData, null, 2),
      });
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
      console.log('ProductService.updateProduct received:', JSON.stringify(updateData, null, 2));

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error('Invalid product ID');
      }

      // Clean and validate update data
      const cleanUpdateData = {};

      if (updateData.name) cleanUpdateData.name = updateData.name.trim();
      if (updateData.summary !== undefined)
        cleanUpdateData.summary = updateData.summary?.trim() || '';
      if (updateData.description !== undefined)
        cleanUpdateData.description = updateData.description?.trim() || '';
      if (updateData.brand) cleanUpdateData.brand = updateData.brand;
      if (updateData.category) cleanUpdateData.category = updateData.category;

      if (updateData.price) {
        cleanUpdateData.price = {
          regular: Number(updateData.price.regular) || 0,
          discountPercent: Number(updateData.price.discountPercent) || 0,
          isOnSale: Boolean(updateData.price.isOnSale),
        };
      }

      if (updateData.variants) {
        cleanUpdateData.variants = {
          sizes: updateData.variants.sizes || [],
          colors: updateData.variants.colors || [],
        };
      }

      if (updateData.inventory !== undefined) {
        cleanUpdateData.inventory = Array.isArray(updateData.inventory) ? updateData.inventory : [];
      }

      if (updateData.images !== undefined) {
        cleanUpdateData.images = Array.isArray(updateData.images) ? updateData.images : [];
      }

      if (updateData.mainImage !== undefined) {
        cleanUpdateData.mainImage = updateData.mainImage || '';
      }

      if (updateData.tags !== undefined) {
        cleanUpdateData.tags = Array.isArray(updateData.tags) ? updateData.tags : [];
      }

      if (updateData.status !== undefined) cleanUpdateData.status = Boolean(updateData.status);
      if (updateData.stock !== undefined) cleanUpdateData.stock = Number(updateData.stock) || 0;
      if (updateData.isNew !== undefined) cleanUpdateData.isNew = Boolean(updateData.isNew);

      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $set: cleanUpdateData },
        { new: true, runValidators: true }
      );

      if (!updatedProduct) {
        throw new Error('Product not found');
      }

      logger.info('Product updated successfully', { productId });
      return updatedProduct;
    } catch (error) {
      logger.error('Error updating product', {
        productId,
        error: error.message,
        stack: error.stack,
        updateData: JSON.stringify(updateData, null, 2),
      });
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
          // Use the same validation as createProduct
          if (!productData.name || !productData.brand || !productData.category) {
            throw new Error('Missing required fields: name, brand, category');
          }

          if (!productData.price || typeof productData.price !== 'object') {
            throw new Error('Invalid price structure');
          }

          const newProduct = new Product({
            name: productData.name.trim(),
            summary: productData.summary?.trim() || '',
            description: productData.description?.trim() || '',
            price: {
              regular: Number(productData.price.regular) || 0,
              discountPercent: Number(productData.price.discountPercent) || 0,
              isOnSale: Boolean(productData.price.isOnSale),
            },
            category: productData.category,
            brand: productData.brand,
            images: Array.isArray(productData.images) ? productData.images : [],
            mainImage: productData.mainImage || '',
            variants: {
              sizes: productData.variants?.sizes || [],
              colors: productData.variants?.colors || [],
            },
            inventory: Array.isArray(productData.inventory) ? productData.inventory : [],
            tags: Array.isArray(productData.tags) ? productData.tags : [],
            status: productData.status !== undefined ? Boolean(productData.status) : true,
            stock: Number(productData.stock) || 0,
            sales: Number(productData.sales) || 0,
            rating: Number(productData.rating) || 0,
            isNew: Boolean(productData.isNew),
          });

          const savedProduct = await newProduct.save();
          results.success.push(savedProduct);
        } catch (error) {
          results.failed.push({
            data: productData,
            error: error.message,
          });
        }
      }

      logger.info('Bulk product creation completed', {
        successful: results.success.length,
        failed: results.failed.length,
      });

      return results;
    } catch (error) {
      logger.error('Error in bulk product creation', { error: error.message });
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
        throw new Error('Invalid product ID');
      }

      const deletedProduct = await Product.findByIdAndDelete(productId);
      if (!deletedProduct) {
        throw new Error('Product not found');
      }

      logger.info('Product deleted successfully', { productId });
      return deletedProduct;
    } catch (error) {
      logger.error('Error deleting product', { error: error.message });
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
        throw new Error('Invalid product ID');
      }

      const product = await Product.findById(productId).populate('category');
      return product;
    } catch (error) {
      logger.error('Error retrieving product by ID', {
        productId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all products with optional filters, sorting and pagination
   * @param {Object} query - Query parameters for filtering, sorting, and pagination
   * @returns {Promise<{products: Array<Product>, total: number}>} List of matching products and total count
   */
  static async getAllProducts({
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
    limit = 10,
  }) {
    const filter = {};
    if (brand) filter.brand = brand;
    if (category) filter.category = category;
    if (isNew) filter.isNew = true;
    if (size) {
      filter.$or = [
        { 'variants.sizes': { $in: [Number(size)] } },
        { 'inventory.size': Number(size) },
      ];
    }
    if (color) {
      if (filter.$or) {
        const existingOr = filter.$or;
        filter.$and = [
          { $or: existingOr },
          { $or: [{ 'variants.colors': { $in: [color] } }, { 'inventory.color': color }] },
        ];
        delete filter.$or;
      } else {
        filter.$or = [{ 'variants.colors': { $in: [color] } }, { 'inventory.color': color }];
      }
    }
    if (minPrice || maxPrice) {
      filter['price.regular'] = {};
      if (minPrice) filter['price.regular'].$gte = minPrice;
      if (maxPrice) filter['price.regular'].$lte = maxPrice;
    }
    const sortOptions = { [sortBy]: order === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;
    console.log('Product filter:', JSON.stringify(filter, null, 2));
    console.log('Filter parameters:', { size, color, brand, category, minPrice, maxPrice, isNew });
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    console.log(`Found ${products.length} products out of ${total} total`);
    return { products, total };
  }

  /**
   * Get new drops with optional filters and pagination
   * @param {Object} options - { page, limit, filters }
   * @returns {Promise<{data: Array<Product>, total: number, page: number, limit: number, totalPages: number}>}
   */
  static async getNewDrops({ page = 1, limit = 10, filters = {} }) {
    const filter = { isNew: true };
    if (filters.brand) filter.brand = filters.brand;
    if (filters.category) filter.category = filters.category;
    if (filters.minPrice)
      filter['price.regular'] = {
        ...(filter['price.regular'] || {}),
        $gte: Number(filters.minPrice),
      };
    if (filters.maxPrice)
      filter['price.regular'] = {
        ...(filter['price.regular'] || {}),
        $lte: Number(filters.maxPrice),
      };
    if (filters.size) filter['variants.sizes'] = { $in: [filters.size] };
    if (filters.color) filter['variants.colors'] = { $in: [filters.color] };

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(filter);
    const data = await Product.find(filter)
      .populate('category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalPages = Math.ceil(total / limit);
    return { data, total, page, limit, totalPages };
  }

  static async getRecommendProductsForProductDetails({ productId }) {
    const product = await Product.findById(productId);
    const filter = {
      category: product.category,
      brand: product.brand,
    };
    const products = await Product.find(filter).limit(4);
    return products;
  }
}
