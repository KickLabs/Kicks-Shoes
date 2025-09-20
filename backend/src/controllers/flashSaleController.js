/**
 * @fileoverview Flash Sale Controller
 * @created 2025-01-27
 * @file flashSaleController.js
 * @description Controller xử lý các request liên quan đến Flash Sale
 */

import FlashSale from '../models/FlashSale.js';
import Product from '../models/Product.js';
import { validationResult } from 'express-validator';
import { asyncHandler } from '../middlewares/async.middleware.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import { getFlashSaleProductsForDashboard } from '../services/flashSale.service.js';
import logger from '../utils/logger.js';

/**
 * @desc Lấy danh sách tất cả flash sale
 * @route GET /api/flash-sales
 * @access Public
 */
export const getAllFlashSales = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10, sort = '-createdAt' } = req.query;

  // Tạo filter object
  const filter = {};
  if (status) {
    filter.status = status;
  }

  // Tính toán pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Tạo query
  const query = FlashSale.find(filter)
    .populate('products.productId', 'name price images mainImage category')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const [flashSales, total] = await Promise.all([query.exec(), FlashSale.countDocuments(filter)]);

  res.status(200).json({
    success: true,
    data: flashSales,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
      limit: parseInt(limit),
    },
  });
});

/**
 * @desc Lấy flash sale theo ID
 * @route GET /api/flash-sales/:id
 * @access Public
 */
export const getFlashSaleById = asyncHandler(async (req, res) => {
  const flashSale = await FlashSale.findById(req.params.id).populate(
    'products.productId',
    'name price images mainImage category description'
  );

  if (!flashSale) {
    throw new ErrorResponse('Flash sale not found', 404);
  }

  res.status(200).json({
    success: true,
    data: flashSale,
  });
});

/**
 * @desc Lấy tất cả flash sale đang hoạt động
 * @route GET /api/flash-sales/active/current
 * @access Public
 */
export const getCurrentActiveFlashSale = asyncHandler(async (req, res) => {
  const now = new Date();

  console.log('Searching for active flash sales at:', now);

  const activeFlashSales = await FlashSale.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).populate(
    'products.productId',
    'name price images mainImage category description brand stock variants isNew status'
  );

  console.log('Found active flash sales:', activeFlashSales.length);

  if (!activeFlashSales || activeFlashSales.length === 0) {
    console.log('No active flash sales found');
    return res.status(200).json({
      success: true,
      data: [],
      message: 'No active flash sales',
    });
  }

  // Flatten the products from all active flash sales
  const flashSaleProducts = [];

  activeFlashSales.forEach(flashSale => {
    console.log(
      `Processing flash sale: ${flashSale.title} with ${flashSale.products.length} products`
    );

    flashSale.products.forEach(flashSaleProduct => {
      const product = flashSaleProduct.productId;

      // Skip if product is null or undefined
      if (!product) {
        console.log('Skipping null product in flash sale');
        return;
      }

      const originalPrice = product.price || 0;
      const flashPrice =
        flashSaleProduct.flashPrice ||
        originalPrice * (1 - (flashSaleProduct.discountPercent || 0) / 100);

      console.log(`Product: ${product.name}, Original: ${originalPrice}, Flash: ${flashPrice}`);

      // Create a product object that matches the expected structure for ProductCard
      const productWithFlashSale = {
        _id: product._id,
        name: product.name,
        price: {
          regular: originalPrice,
          sale: flashPrice,
          isOnSale: true,
          discountPercent: flashSaleProduct.discountPercent || 0,
        },
        finalPrice: flashPrice,
        images: product.images || [],
        mainImage: product.mainImage,
        category: product.category,
        brand: product.brand,
        stock: product.stock || 0,
        variants: product.variants || {},
        isFlashSale: true,
        flashSaleInfo: {
          flashSaleId: flashSale._id,
          flashSaleTitle: flashSale.title,
          endDate: flashSale.endDate,
          discountPercent: flashSaleProduct.discountPercent,
          flashPrice: flashSaleProduct.flashPrice,
        },
        // Add other required fields for ProductCard
        isNew: product.isNew || false,
        status: product.status !== undefined ? product.status : true,
      };

      flashSaleProducts.push(productWithFlashSale);
    });
  });

  console.log(`Total flash sale products: ${flashSaleProducts.length}`);

  res.status(200).json({
    success: true,
    data: flashSaleProducts,
  });
});

/**
 * @desc Tạo flash sale mới
 * @route POST /api/flash-sales
 * @access Private (Admin)
 */
export const createFlashSale = asyncHandler(async (req, res) => {
  // Kiểm tra validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    throw new ErrorResponse('Invalid data', 400, errors.array());
  }

  const { title, description, products, startDate, endDate } = req.body;

  // Kiểm tra thời gian
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (start <= now) {
    throw new ErrorResponse('Thời gian bắt đầu phải sau thời điểm hiện tại', 400);
  }

  if (end <= start) {
    throw new ErrorResponse('Thời gian kết thúc phải sau thời gian bắt đầu', 400);
  }

  // Kiểm tra sản phẩm có tồn tại không
  const productIds = products.map(p => p.productId);
  const existingProducts = await Product.find({ _id: { $in: productIds } });

  if (existingProducts.length !== productIds.length) {
    throw new ErrorResponse('Một số sản phẩm không tồn tại', 400);
  }

  // Kiểm tra sản phẩm trùng lặp
  const uniqueProductIds = [...new Set(productIds)];
  if (productIds.length !== uniqueProductIds.length) {
    throw new ErrorResponse('Không được có sản phẩm trùng lặp trong flash sale', 400);
  }

  // Tạo flash sale
  const flashSale = await FlashSale.create({
    title,
    description,
    products,
    startDate: start,
    endDate: end,
    status: 'upcoming',
  });

  await flashSale.populate('products.productId', 'name price images category');

  logger.info(`Flash sale mới được tạo: ${flashSale._id}`);

  res.status(201).json({
    success: true,
    data: flashSale,
    message: 'Tạo flash sale thành công',
  });
});

/**
 * @desc Cập nhật flash sale
 * @route PUT /api/flash-sales/:id
 * @access Private (Admin)
 */
export const updateFlashSale = asyncHandler(async (req, res) => {
  // Kiểm tra validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ErrorResponse('Invalid data', 400, errors.array());
  }

  const flashSale = await FlashSale.findById(req.params.id);

  if (!flashSale) {
    throw new ErrorResponse('Flash sale not found', 404);
  }

  // Không cho phép cập nhật flash sale đã kết thúc
  if (flashSale.status === 'ended') {
    throw new ErrorResponse('Không thể cập nhật flash sale đã kết thúc', 400);
  }

  const { title, description, products, startDate, endDate, status } = req.body;

  // Kiểm tra thời gian nếu có cập nhật
  if (startDate || endDate) {
    const start = new Date(startDate || flashSale.startDate);
    const end = new Date(endDate || flashSale.endDate);
    const now = new Date();

    if (start <= now && flashSale.status === 'upcoming') {
      throw new ErrorResponse('Thời gian bắt đầu phải sau thời điểm hiện tại', 400);
    }

    if (end <= start) {
      throw new ErrorResponse('Thời gian kết thúc phải sau thời gian bắt đầu', 400);
    }
  }

  // Kiểm tra sản phẩm nếu có cập nhật
  if (products) {
    const productIds = products.map(p => p.productId);
    const existingProducts = await Product.find({ _id: { $in: productIds } });

    if (existingProducts.length !== productIds.length) {
      throw new ErrorResponse('Một số sản phẩm không tồn tại', 400);
    }

    // Kiểm tra sản phẩm trùng lặp
    const uniqueProductIds = [...new Set(productIds)];
    if (productIds.length !== uniqueProductIds.length) {
      throw new ErrorResponse('Không được có sản phẩm trùng lặp trong flash sale', 400);
    }
  }

  // Cập nhật flash sale
  const updatedFlashSale = await FlashSale.findByIdAndUpdate(
    req.params.id,
    {
      ...(title && { title }),
      ...(description && { description }),
      ...(products && { products }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(status && { status }),
    },
    { new: true, runValidators: true }
  ).populate('products.productId', 'name price images mainImage category');

  logger.info(`Flash sale được cập nhật: ${updatedFlashSale._id}`);

  res.status(200).json({
    success: true,
    data: updatedFlashSale,
    message: 'Cập nhật flash sale thành công',
  });
});

/**
 * @desc Xóa flash sale
 * @route DELETE /api/flash-sales/:id
 * @access Private (Admin)
 */
export const deleteFlashSale = asyncHandler(async (req, res) => {
  const flashSale = await FlashSale.findById(req.params.id);

  if (!flashSale) {
    throw new ErrorResponse('Flash sale not found', 404);
  }

  // Không cho phép xóa flash sale đang hoạt động
  if (flashSale.status === 'active') {
    throw new ErrorResponse('Không thể xóa flash sale đang hoạt động', 400);
  }

  await FlashSale.findByIdAndDelete(req.params.id);

  logger.info(`Flash sale đã được xóa: ${req.params.id}`);

  res.status(200).json({
    success: true,
    message: 'Xóa flash sale thành công',
  });
});

/**
 * @desc Cập nhật trạng thái flash sale
 * @route PATCH /api/flash-sales/:id/status
 * @access Private (Admin)
 */
export const updateFlashSaleStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['upcoming', 'active', 'ended', 'cancelled'].includes(status)) {
    throw new ErrorResponse('Trạng thái không hợp lệ', 400);
  }

  const flashSale = await FlashSale.findById(req.params.id);

  if (!flashSale) {
    throw new ErrorResponse('Flash sale not found', 404);
  }

  // Kiểm tra logic chuyển trạng thái
  const now = new Date();

  if (status === 'active' && flashSale.startDate > now) {
    throw new ErrorResponse('Chưa đến thời gian bắt đầu flash sale', 400);
  }

  if (status === 'ended' && flashSale.endDate > now) {
    throw new ErrorResponse('Chưa đến thời gian kết thúc flash sale', 400);
  }

  const updatedFlashSale = await FlashSale.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate('products.productId', 'name price images category');

  logger.info(`Trạng thái flash sale được cập nhật: ${updatedFlashSale._id} -> ${status}`);

  res.status(200).json({
    success: true,
    data: updatedFlashSale,
    message: 'Cập nhật trạng thái flash sale thành công',
  });
});

/**
 * @desc Lấy sản phẩm flash sale theo ID sản phẩm
 * @route GET /api/flash-sales/product/:productId
 * @access Public
 */
export const getFlashSaleByProductId = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const now = new Date();

  const flashSale = await FlashSale.findOne({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
    'products.productId': productId,
  }).populate('products.productId', 'name price images category description');

  if (!flashSale) {
    return res.status(200).json({
      success: true,
      data: null,
      message: 'Sản phẩm không có trong flash sale hiện tại',
    });
  }

  // Tìm thông tin sản phẩm cụ thể trong flash sale
  const productInfo = flashSale.products.find(p => p.productId._id.toString() === productId);

  res.status(200).json({
    success: true,
    data: {
      flashSale: {
        _id: flashSale._id,
        title: flashSale.title,
        description: flashSale.description,
        startDate: flashSale.startDate,
        endDate: flashSale.endDate,
      },
      product: productInfo,
    },
  });
});

/**
 * @desc Lấy thống kê flash sale
 * @route GET /api/flash-sales/stats/overview
 * @access Private (Admin)
 */
export const getFlashSaleStats = asyncHandler(async (req, res) => {
  const now = new Date();

  const stats = await FlashSale.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const upcomingCount = stats.find(s => s._id === 'upcoming')?.count || 0;
  const activeCount = stats.find(s => s._id === 'active')?.count || 0;
  const endedCount = stats.find(s => s._id === 'ended')?.count || 0;
  const cancelledCount = stats.find(s => s._id === 'cancelled')?.count || 0;

  // Lấy flash sale sắp diễn ra
  const upcomingFlashSales = await FlashSale.find({
    status: 'upcoming',
    startDate: { $gte: now },
  })
    .sort({ startDate: 1 })
    .limit(5);

  // Lấy flash sale đang hoạt động
  const activeFlashSales = await FlashSale.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).populate('products.productId', 'name price');

  res.status(200).json({
    success: true,
    data: {
      overview: {
        total: upcomingCount + activeCount + endedCount + cancelledCount,
        upcoming: upcomingCount,
        active: activeCount,
        ended: endedCount,
        cancelled: cancelledCount,
      },
      upcomingFlashSales,
      activeFlashSales,
    },
  });
});

/**
 * @desc Lấy danh sách sản phẩm flash sale cho dashboard
 * @route GET /api/flash-sales/dashboard
 * @access Private (Admin)
 */
export const getFlashSaleProductsForDashboardController = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status = 'all',
    search = '',
    sortBy = 'createdAt',
    order = 'desc',
  } = req.query;

  const result = await getFlashSaleProductsForDashboard({
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    search,
    sortBy,
    order,
  });

  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    message: 'Lấy danh sách flash sale cho dashboard thành công',
  });
});
