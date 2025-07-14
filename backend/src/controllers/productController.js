import { ProductService } from '../services/product.service.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';
import Report from '../models/Report.js';
import Product from '../models/Product.js';

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

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate value for field: ${duplicateField}`,
        field: duplicateField,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
        field: error.path,
        value: error.value,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }
};

/**
 * FIXED: Update product with proper finalPrice recalculation
 * @route PUT /api/products/:id
 * @access Private/Admin
 */
export const updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    console.log('Controller updating product:', productId, JSON.stringify(req.body, null, 2));

    logger.info('Updating product', { productId, updateData: req.body });

    // FIXED: Use direct MongoDB update to trigger middleware
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Update fields manually to ensure middleware is triggered
    if (req.body.name) product.name = req.body.name.trim();
    if (req.body.summary !== undefined) product.summary = req.body.summary?.trim() || '';
    if (req.body.description !== undefined)
      product.description = req.body.description?.trim() || '';
    if (req.body.brand) product.brand = req.body.brand;
    if (req.body.category) product.category = req.body.category;

    // IMPORTANT: Update price fields to trigger finalPrice recalculation
    if (req.body.price) {
      product.price = {
        regular: Number(req.body.price.regular) || 0,
        discountPercent: Number(req.body.price.discountPercent) || 0,
        isOnSale: Boolean(req.body.price.isOnSale),
      };
      console.log('Updated price:', product.price);
    }

    if (req.body.variants) {
      product.variants = {
        sizes: req.body.variants.sizes || [],
        colors: req.body.variants.colors || [],
      };
    }

    if (req.body.inventory !== undefined) {
      product.inventory = Array.isArray(req.body.inventory) ? req.body.inventory : [];
    }

    if (req.body.images !== undefined) {
      product.images = Array.isArray(req.body.images) ? req.body.images : [];
    }

    if (req.body.mainImage !== undefined) {
      product.mainImage = req.body.mainImage || '';
    }

    if (req.body.tags !== undefined) {
      product.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
    }

    if (req.body.status !== undefined) product.status = Boolean(req.body.status);
    if (req.body.stock !== undefined) product.stock = Number(req.body.stock) || 0;
    if (req.body.isNew !== undefined) product.isNew = Boolean(req.body.isNew);

    // Save the product (this will trigger pre-save middleware and recalculate finalPrice)
    const updatedProduct = await product.save();

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

// ADDED: New endpoint to manually recalculate finalPrice
export const recalculateFinalPrice = async (req, res, next) => {
  try {
    const productId = req.params.id;
    console.log('Recalculating final price for product:', productId);

    const updatedProduct = await Product.updateProductFinalPrice(productId);

    res.status(200).json({
      success: true,
      message: 'Final price recalculated successfully',
      data: {
        productId: updatedProduct._id,
        name: updatedProduct.name,
        price: updatedProduct.price,
        finalPrice: updatedProduct.finalPrice,
      },
    });
  } catch (error) {
    console.error('Error recalculating final price:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
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

    try {
      const User = (await import('../models/User.js')).default;
      const Product = (await import('../models/Product.js')).default;
      const { sendTemplatedEmail } = await import('../utils/sendEmail.js');

      const product = await Product.findById(productId);
      const shopUser = await User.findOne({ role: 'shop' });
      const reporterUser = await User.findById(req.user.id);

      if (shopUser && shopUser.email && product) {
        await sendTemplatedEmail({
          email: shopUser.email,
          templateType: 'PRODUCT_REPORTED',
          templateData: {
            shopName: shopUser.fullName || 'Shop',
            productName: product.name,
            reporterName: reporterUser?.fullName || reporterUser?.email || 'User',
            reason,
            description,
          },
        });
      }

      if (reporterUser && reporterUser.email && product) {
        await sendTemplatedEmail({
          email: reporterUser.email,
          templateType: 'REPORT_SUBMITTED',
          templateData: {
            userName: reporterUser.fullName || reporterUser.email,
            productName: product.name,
            reason,
            description,
          },
        });
      }
    } catch (emailError) {
      console.error('Error sending notification emails:', emailError);
    }

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
