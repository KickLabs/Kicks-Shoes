/**
 * @fileoverview Flash Sale Service
 * @created 2025-01-27
 * @file flashSale.service.js
 * @description Service xử lý logic nghiệp vụ cho Flash Sale
 */

import FlashSale from '../models/FlashSale.js';
import Product from '../models/Product.js';
import logger from '../utils/logger.js';

/**
 * @desc Tự động cập nhật trạng thái flash sale
 */
export const updateFlashSaleStatuses = async () => {
  try {
    const now = new Date();
    
    // Cập nhật flash sale từ upcoming -> active
    const upcomingToActive = await FlashSale.updateMany(
      {
        status: 'upcoming',
        startDate: { $lte: now }
      },
      { status: 'active' }
    );

    // Cập nhật flash sale từ active -> ended
    const activeToEnded = await FlashSale.updateMany(
      {
        status: 'active',
        endDate: { $lte: now }
      },
      { status: 'ended' }
    );

    if (upcomingToActive.modifiedCount > 0) {
      logger.info(`${upcomingToActive.modifiedCount} flash sale chuyển sang trạng thái active`);
    }

    if (activeToEnded.modifiedCount > 0) {
      logger.info(`${activeToEnded.modifiedCount} flash sale chuyển sang trạng thái ended`);
    }

    return {
      upcomingToActive: upcomingToActive.modifiedCount,
      activeToEnded: activeToEnded.modifiedCount
    };
  } catch (error) {
    logger.error('Lỗi khi cập nhật trạng thái flash sale:', error);
    throw error;
  }
};


/**
 * @desc Kiểm tra sản phẩm có trong flash sale đang hoạt động không
 */
export const isProductInActiveFlashSale = async (productId) => {
  try {
    const now = new Date();
    
    const flashSale = await FlashSale.findOne({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
      'products.productId': productId
    });

    if (!flashSale) {
      return { inFlashSale: false };
    }

    const productInfo = flashSale.products.find(
      p => p.productId.toString() === productId
    );

    return {
      inFlashSale: true,
      flashSale: {
        _id: flashSale._id,
        title: flashSale.title,
        endDate: flashSale.endDate
      },
      product: productInfo
    };
  } catch (error) {
    logger.error('Lỗi khi kiểm tra sản phẩm trong flash sale:', error);
    throw error;
  }
};

/**
 * @desc Tính giá flash sale cho sản phẩm
 */
export const calculateFlashSalePrice = (originalPrice, discountPercent, flashPrice) => {
  if (flashPrice !== undefined && flashPrice !== null) {
    return flashPrice;
  }
  
  if (discountPercent !== undefined && discountPercent !== null) {
    return originalPrice * (1 - discountPercent / 100);
  }
  
  return originalPrice;
};

/**
 * @desc Lấy danh sách sản phẩm flash sale với giá đã tính
 */
export const getFlashSaleProductsWithPricing = async (flashSaleId) => {
  try {
    const flashSale = await FlashSale.findById(flashSaleId)
      .populate('products.productId', 'name price images category description');

    if (!flashSale) {
      throw new Error('Flash sale không tồn tại');
    }

    const productsWithPricing = flashSale.products.map(product => {
      const originalPrice = product.productId.price;
      const flashPrice = calculateFlashSalePrice(
        originalPrice,
        product.discountPercent,
        product.flashPrice
      );

      return {
        ...product.toObject(),
        originalPrice,
        flashPrice,
        savings: originalPrice - flashPrice,
        savingsPercent: Math.round(((originalPrice - flashPrice) / originalPrice) * 100)
      };
    });

    return productsWithPricing;
  } catch (error) {
    logger.error('Lỗi khi lấy sản phẩm flash sale với giá:', error);
    throw error;
  }
};

/**
 * @desc Kiểm tra flash sale có thể được chỉnh sửa không
 */
export const canEditFlashSale = (flashSale) => {
  const now = new Date();
  
  // Không thể chỉnh sửa flash sale đã kết thúc hoặc đã hủy
  if (flashSale.status === 'ended' || flashSale.status === 'cancelled') {
    return false;
  }
  
  // Nếu đang active, chỉ có thể cập nhật một số thông tin nhất định
  if (flashSale.status === 'active') {
    return true; // Có thể cập nhật nhưng cần kiểm tra kỹ hơn
  }
  
  return true;
};

/**
 * @desc Lấy thống kê chi tiết flash sale
 */
export const getFlashSaleDetailedStats = async (flashSaleId) => {
  try {
    const flashSale = await FlashSale.findById(flashSaleId)
      .populate('products.productId', 'name price');

    if (!flashSale) {
      throw new Error('Flash sale không tồn tại');
    }

    const totalProducts = flashSale.products.length;
    
    // Tính tổng giá trị flash sale
    let totalOriginalValue = 0;
    let totalFlashValue = 0;
    
    flashSale.products.forEach(product => {
      const originalPrice = product.productId.price;
      const flashPrice = calculateFlashSalePrice(
        originalPrice,
        product.discountPercent,
        product.flashPrice
      );
      
      totalOriginalValue += originalPrice;
      totalFlashValue += flashPrice;
    });

    const totalSavings = totalOriginalValue - totalFlashValue;
    const averageDiscount = totalOriginalValue > 0 
      ? Math.round((totalSavings / totalOriginalValue) * 100) 
      : 0;

    return {
      flashSale: {
        _id: flashSale._id,
        title: flashSale.title,
        status: flashSale.status,
        startDate: flashSale.startDate,
        endDate: flashSale.endDate
      },
      stats: {
        totalProducts,
        totalOriginalValue,
        totalFlashValue,
        totalSavings,
        averageDiscount
      }
    };
  } catch (error) {
    logger.error('Lỗi khi lấy thống kê chi tiết flash sale:', error);
    throw error;
  }
};

/**
 * @desc Tạo flash sale từ danh sách sản phẩm
 */
export const createFlashSaleFromProducts = async (flashSaleData, productIds) => {
  try {
    // Lấy thông tin sản phẩm
    const products = await Product.find({ _id: { $in: productIds } });
    
    if (products.length !== productIds.length) {
      throw new Error('Một số sản phẩm không tồn tại');
    }

    // Tạo danh sách sản phẩm cho flash sale
    const flashSaleProducts = products.map(product => ({
      productId: product._id,
      discountPercent: 0, // Mặc định, admin sẽ cập nhật sau
      flashPrice: product.price, // Mặc định bằng giá gốc
    }));

    const flashSale = await FlashSale.create({
      ...flashSaleData,
      products: flashSaleProducts
    });

    await flashSale.populate('products.productId', 'name price images category');

    logger.info(`Tạo flash sale từ sản phẩm: ${flashSale._id}`);

    return flashSale;
  } catch (error) {
    logger.error('Lỗi khi tạo flash sale từ sản phẩm:', error);
    throw error;
  }
};

/**
 * @desc Lấy flash sale sắp diễn ra
 */
export const getUpcomingFlashSales = async (limit = 5) => {
  try {
    const now = new Date();
    
    const upcomingFlashSales = await FlashSale.find({
      status: 'upcoming',
      startDate: { $gte: now }
    })
    .populate('products.productId', 'name price images category')
    .sort({ startDate: 1 })
    .limit(limit);

    return upcomingFlashSales;
  } catch (error) {
    logger.error('Lỗi khi lấy flash sale sắp diễn ra:', error);
    throw error;
  }
};

/**
 * @desc Lấy flash sale đang hoạt động
 */
export const getActiveFlashSales = async () => {
  try {
    const now = new Date();
    
    const activeFlashSales = await FlashSale.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
    .populate('products.productId', 'name price images category description');

    return activeFlashSales;
  } catch (error) {
    logger.error('Lỗi khi lấy flash sale đang hoạt động:', error);
    throw error;
  }
};
