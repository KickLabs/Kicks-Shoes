/**
 * @fileoverview Order Service
 * @created 2025-06-08
 * @file order.service.js
 * @description This service handles all order-related business logic for the Kicks Shoes application.
 * It provides methods for creating, updating, and deleting orders.
 */

import mongoose from 'mongoose';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Product from '../models/Product.js';
import FlashSale from '../models/FlashSale.js';
import logger from '../utils/logger.js';
import { validateDiscountCode } from './discount.service.js';

/**
 * Service class for handling order operations
 */
export class OrderService {
  /**
   * Check if a product is in an active flash sale
   * @param {string} productId - Product ID
   * @returns {Promise<Object|null>} Flash sale info with best price or null
   */
  static async getProductFlashSale(productId) {
    try {
      const now = new Date();
      const flashSales = await FlashSale.find({
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now },
        'products.productId': productId,
      });

      if (flashSales.length === 0) {
        return null;
      }

      const productFlashSales = [];
      for (const flashSale of flashSales) {
        const flashSaleProduct = flashSale.products.find(
          p => p.productId.toString() === productId.toString()
        );
        if (flashSaleProduct) {
          productFlashSales.push({
            flashPrice: flashSaleProduct.flashPrice,
            discountPercent: flashSaleProduct.discountPercent,
            flashSaleId: flashSale._id,
            flashSaleTitle: flashSale.title,
          });
        }
      }

      if (productFlashSales.length === 0) {
        return null;
      }

      if (productFlashSales.length > 1) {
        logger.info('Multiple flash sales found for product:', {
          productId,
          flashSales: productFlashSales.map(fs => ({
            flashSaleId: fs.flashSaleId,
            flashSaleTitle: fs.flashSaleTitle,
            flashPrice: fs.flashPrice,
          })),
        });

        const bestDeal = productFlashSales.reduce((best, current) => {
          return current.flashPrice < best.flashPrice ? current : best;
        });

        logger.info('Selected best deal for product:', {
          productId,
          bestDeal: {
            flashSaleId: bestDeal.flashSaleId,
            flashSaleTitle: bestDeal.flashSaleTitle,
            flashPrice: bestDeal.flashPrice,
          },
        });

        return bestDeal;
      }

      return productFlashSales[0];
    } catch (error) {
      logger.error('Error checking flash sale:', error);
      return null;
    }
  }
  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @returns {Promise<Order>} The created order
   */
  static async createOrder(orderData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      logger.info('Creating order:', { orderData });
      const {
        user,
        products,
        totalAmount,
        totalPrice,
        paymentMethod,
        shippingAddress,
        shippingMethod = 'standard',
        shippingCost = 0,
        tax = 0,
        discount = 0,
        discountCode,
        notes,
      } = orderData;

      if (!user || !products || !paymentMethod || !shippingAddress) {
        throw new Error('Missing required fields');
      }

      if (!Array.isArray(products) || products.length === 0) {
        throw new Error('Products must be a non-empty array');
      }

      // Check stock for each variant before creating order
      for (const item of products) {
        const product = await Product.findById(item.id).session(session);
        if (!product) {
          throw new Error(`Product with ID ${item.id} not found.`);
        }

        const variantInStock = product.inventory.find(inv => {
          const colorMatch =
            inv.color &&
            item.color &&
            inv.color.toLowerCase().trim() === item.color.toLowerCase().trim();
          if (!colorMatch) return false;

          switch (product.productType) {
            case 'shoes':
              return inv.size && item.size && inv.size === parseInt(item.size);
            case 'clothing':
              return inv.clothingSize && item.size && inv.clothingSize === item.size;
            case 'accessory':
              return inv.isOneSize === true;
            default:
              return false;
          }
        });

        if (!variantInStock) {
          // Log available variants for debugging
          logger.error('Variant not found for product:', {
            productId: item.id,
            productName: product.name,
            requestedColor: item.color,
            requestedSize: item.size,
            productType: product.productType,
            availableVariants: product.inventory.map(inv => ({
              color: inv.color,
              size: inv.size,
              clothingSize: inv.clothingSize,
              isOneSize: inv.isOneSize,
              quantity: inv.quantity,
            })),
          });

          throw new Error(
            `Variant for product ${product.name} (Color: ${item.color}, Size: ${item.size}) not found.`
          );
        }

        if (variantInStock.quantity < item.quantity) {
          throw new Error(
            `Not enough stock for ${product.name} (Color: ${item.color}, Size: ${item.size}). Available: ${variantInStock.quantity}, Required: ${item.quantity}`
          );
        }
      }

      // Deduct inventory and total stock
      for (const item of products) {
        const product = await Product.findById(item.id).session(session);

        const filterCondition = {
          'elem.color': { $regex: new RegExp(`^${item.color}$`, 'i') },
        };
        switch (product.productType) {
          case 'shoes':
            filterCondition['elem.size'] = parseInt(item.size);
            break;
          case 'clothing':
            filterCondition['elem.clothingSize'] = item.size;
            break;
          case 'accessory':
            filterCondition['elem.isOneSize'] = true;
            break;
        }

        await Product.findByIdAndUpdate(
          item.id,
          {
            $inc: {
              'inventory.$[elem].quantity': -item.quantity,
              stock: -item.quantity,
            },
          },
          {
            arrayFilters: [filterCondition],
            session,
          }
        );
      }

      const providedTotal =
        typeof totalAmount === 'number' && totalAmount > 0
          ? totalAmount
          : typeof totalPrice === 'number' && totalPrice > 0
            ? totalPrice
            : null;

      const calculatedSubtotal = products.reduce((sum, product) => {
        return sum + product.price * product.quantity;
      }, 0);

      let finalDiscount = discount;
      let finalDiscountCode = null;

      if (discountCode) {
        const validation = await validateDiscountCode(
          discountCode,
          user,
          calculatedSubtotal,
          products
        );

        if (validation.isValid) {
          finalDiscount = validation.discountAmount;
          finalDiscountCode = discountCode.toUpperCase();

          const Discount = (await import('../models/Discount.js')).default;
          const discountDoc = await Discount.findOne({ code: discountCode.toUpperCase() });
          if (discountDoc) {
            discountDoc.usedCount += 1;
            await discountDoc.save({ session });
          }
        } else {
          throw new Error(`Invalid discount code: ${validation.message}`);
        }
      }

      const calculatedTotal = calculatedSubtotal + shippingCost + tax - finalDiscount;

      if (providedTotal != null && Math.abs(calculatedTotal - providedTotal) > 0.01) {
        throw new Error('Total price does not match sum of items');
      }

      const order = new Order({
        user,
        items: [],
        totalPrice: calculatedTotal,
        subtotal: calculatedSubtotal,
        paymentMethod,
        shippingAddress,
        shippingMethod,
        shippingCost,
        tax,
        discount: finalDiscount,
        discountCode: finalDiscountCode,
        notes,
        status: orderData.status || 'pending',
        paymentStatus: orderData.paymentStatus || 'pending',
        paymentDate: orderData.paymentDate,
        transactionId: orderData.transactionId,
        vnpResponseCode: orderData.vnpResponseCode,
        vnpTxnRef: orderData.vnpTxnRef,
        vnpAmount: orderData.vnpAmount,
        vnpBankCode: orderData.vnpBankCode,
        vnpPayDate: orderData.vnpPayDate,
      });

      await order.save({ session });

      let itemsSubtotalAccurate = 0;
      const orderItems = await Promise.all(
        products.map(async product => {
          const flashSaleInfo = await this.getProductFlashSale(product.id);
          let finalPrice = product.price;
          let isFlashSale = false;

          if (flashSaleInfo) {
            finalPrice = flashSaleInfo.flashPrice;
            isFlashSale = true;
            logger.info('Flash sale applied to product in order:', {
              productId: product.id,
              originalPrice: product.price,
              flashPrice: finalPrice,
            });
          }

          const subtotal = finalPrice * product.quantity;
          itemsSubtotalAccurate += subtotal;
          const orderItem = new OrderItem({
            order: order._id,
            product: product.id,
            quantity: product.quantity,
            price: finalPrice,
            originalPrice: isFlashSale ? product.price : null,
            isFlashSale: isFlashSale,
            size: product.size,
            color: product.color,
            subtotal: subtotal,
          });
          await orderItem.save({ session });
          return orderItem._id;
        })
      );

      order.items = orderItems;
      order.subtotal = itemsSubtotalAccurate;
      order.totalPrice = itemsSubtotalAccurate + order.shippingCost + order.tax - order.discount;
      await order.save({ session });

      await session.commitTransaction();

      const populatedOrder = await order.populate({
        path: 'items',
        populate: {
          path: 'product',
          select: 'name mainImage price',
        },
      });

      logger.info('Order created successfully', { orderId: order._id });
      return populatedOrder;
    } catch (error) {
      await session.abortTransaction();

      logger.error('Error creating order:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to create order: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Get all orders with pagination
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Object>} The orders with pagination info
   */
  static async getOrders(options = {}) {
    try {
      logger.info('Getting all orders with pagination:', { options });
      const { page = 1, limit = 10, status, startDate, endDate } = options;
      const skip = (page - 1) * limit;

      const query = {};
      if (status) {
        query.status = status;
      }
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const [orders, total] = await Promise.all([
        Order.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate({
            path: 'user',
            select: 'fullName email phone avatar',
          })
          .populate({
            path: 'items',
            populate: {
              path: 'product',
              select: 'name mainImage price inventory',
            },
          }),
        Order.countDocuments(query),
      ]);

      return {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting orders:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to get orders: ${error.message}`);
    }
  }

  /**
   * Get all orders by order ID
   * @param {string} orderId - The ID of the order
   * @returns {Promise<Order>} The order
   */
  static async getOrderByOrderId(orderId) {
    try {
      logger.info('Getting order by order ID:', { orderId });
      if (!orderId) {
        logger.error('Order ID is required');
        throw new Error('Order ID is required');
      }

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        logger.error('Invalid order ID');
        throw new Error('Invalid order ID');
      }

      const order = await Order.findById(orderId)
        .populate({
          path: 'user',
          select: 'fullName email phone avatar',
        })
        .populate({
          path: 'items',
          populate: {
            path: 'product',
            select: 'name mainImage price inventory',
          },
        });

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      logger.error('Error getting order by order ID:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to get order by order ID: ${error.message}`);
    }
  }

  /**
   * Get all order by user ID
   * @param {string} userId - The ID of the user
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} The orders with pagination info
   */
  static async getOrderByUserId(userId, options = {}) {
    try {
      logger.info('Getting all orders by user ID:', { userId });
      if (!userId) {
        logger.error('User ID is required');
        throw new Error('User ID is required');
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        logger.error('Invalid user ID');
        throw new Error('Invalid user ID');
      }

      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        Order.find({ user: userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate({
            path: 'user',
            select: 'fullName email phone avatar',
          })
          .populate({
            path: 'items',
            populate: {
              path: 'product',
              select: 'name mainImage price inventory',
            },
          }),
        Order.countDocuments({ user: userId }),
      ]);

      return {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting orders by user ID:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to get orders by user ID: ${error.message}`);
    }
  }

  /**
   * Update an order
   * @param {string} orderId - The ID of the order
   * @param {Object} updateData - The data to update
   * @returns {Promise<Order>} The updated order
   */
  static async updateOrder(orderId, updateData) {
    try {
      logger.info('Updating order:', { orderId, updateData });
      if (!orderId) {
        logger.error('Order ID is required');
        throw new Error('Order ID is required');
      }

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        logger.error('Invalid order ID');
        throw new Error('Invalid order ID');
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      if (!order) {
        throw new Error('Order not found');
      }
      return order;
    } catch (error) {
      logger.error('Error updating order:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to update order: ${error.message}`);
    }
  }

  /**
   * Cancel an order
   * @param {string} orderId - The ID of the order
   * @param {string} reason - The reason for cancellation
   * @returns {Promise<Order>} The cancelled order
   */
  static async cancelOrder(orderId, reason) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      logger.info('Cancelling order:', { orderId, reason });
      const order = await Order.findById(orderId).session(session).populate('items');
      if (!order) {
        throw new Error('Order not found');
      }

      // Hoàn lại số lượng sản phẩm vào kho cho từng variant
      for (const item of order.items) {
        const product = await Product.findById(item.product).session(session);
        if (product) {
          const filterCondition = {
            'elem.color': { $regex: new RegExp(`^${item.color}$`, 'i') },
          };
          switch (product.productType) {
            case 'shoes':
              filterCondition['elem.size'] = parseInt(item.size);
              break;
            case 'clothing':
              filterCondition['elem.clothingSize'] = item.size;
              break;
            case 'accessory':
              filterCondition['elem.isOneSize'] = true;
              break;
          }

          await Product.findByIdAndUpdate(
            item.product,
            {
              $inc: {
                'inventory.$[elem].quantity': item.quantity,
                stock: item.quantity,
              },
            },
            {
              arrayFilters: [filterCondition],
              session,
            }
          );
        }
      }

      const updateData = {
        status: 'cancelled',
        cancelledAt: new Date(),
      };
      if (reason) {
        updateData.cancellationReason = reason;
      }

      const cancelledOrder = await Order.findByIdAndUpdate(
        orderId,
        { $set: updateData },
        { new: true, runValidators: true, session }
      );

      await session.commitTransaction();
      return cancelledOrder;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error cancelling order:', { error: error.message, stack: error.stack });
      throw new Error(`Failed to cancel order: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Refund an order
   * @param {string} orderId - The ID of the order
   * @param {Object} refundData - The refund data
   * @returns {Promise<Order>} The refunded order
   */
  static async refundOrder(orderId, refundData) {
    try {
      logger.info('Refunding order:', { orderId, refundData });
      if (!orderId) {
        logger.error('Order ID is required');
        throw new Error('Order ID is required');
      }
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        logger.error('Invalid order ID');
        throw new Error('Invalid order ID');
      }

      const updateData = {
        status: 'refunded',
        refundedAt: new Date(),
      };

      if (refundData.reason) {
        updateData.refundReason = refundData.reason;
      }
      if (refundData.amount) {
        updateData.refundAmount = refundData.amount;
      }
      if (refundData.refundTransactionNo) {
        updateData.refundTransactionNo = refundData.refundTransactionNo;
      }
      if (refundData.refundResponseCode) {
        updateData.refundResponseCode = refundData.refundResponseCode;
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      logger.error('Error refunding order:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to refund order: ${error.message}`);
    }
  }
}
