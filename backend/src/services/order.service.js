/**
 * @fileoverview Order Service
 * @created 2025-06-08
 * @file order.service.js
 * @description This service handles all order-related business logic for the Kicks Shoes application.
 * It provides methods for creating, updating, and deleting orders.
 */

import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { validateDiscountCode } from './discount.service.js';

/**
 * Service class for handling order operations
 */
export class OrderService {
  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @returns {Promise<Order>} The created order
   */
  static async createOrder(orderData) {
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

      // Use totalAmount or totalPrice, whichever is provided
      const finalTotalAmount = totalAmount || totalPrice;

      if (typeof finalTotalAmount !== 'number' || finalTotalAmount <= 0) {
        throw new Error('Invalid total amount');
      }

      const calculatedSubtotal = products.reduce((sum, product) => {
        return sum + product.price * product.quantity;
      }, 0);

      // Validate and apply discount code if provided
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

          // Update discount usage count
          const Discount = (await import('../models/Discount.js')).default;
          const discountDoc = await Discount.findOne({ code: discountCode.toUpperCase() });
          if (discountDoc) {
            discountDoc.usedCount += 1;
            await discountDoc.save();
          }
        } else {
          throw new Error(`Invalid discount code: ${validation.message}`);
        }
      }

      // Calculate final total including shipping, tax and discount
      const calculatedTotal = calculatedSubtotal + shippingCost + tax - finalDiscount;

      if (Math.abs(calculatedTotal - finalTotalAmount) > 0.01) {
        throw new Error('Total amount does not match sum of items');
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

      await order.save();

      const orderItems = await Promise.all(
        products.map(async product => {
          const subtotal = product.price * product.quantity;
          const orderItem = new OrderItem({
            order: order._id,
            product: product.id,
            quantity: product.quantity,
            price: product.price,
            size: product.size,
            color: product.color,
            subtotal: subtotal,
          });
          await orderItem.save();
          return orderItem._id;
        })
      );

      order.items = orderItems;
      await order.save();

      // Populate the order with items and products before returning
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
      logger.error('Error creating order:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to create order: ${error.message}`);
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

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
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

        await session.commitTransaction();

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
        await session.abortTransaction();
        logger.error('Error getting orders:', {
          error: error.message,
          stack: error.stack,
        });
        throw new Error(`Failed to get orders: ${error.message}`);
      } finally {
        session.endSession();
      }
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

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
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

        await session.commitTransaction();
        return order;
      } catch (error) {
        await session.abortTransaction();
        logger.error('Error getting order by order ID:', {
          error: error.message,
          stack: error.stack,
        });
        throw new Error(`Failed to get order by order ID: ${error.message}`);
      } finally {
        session.endSession();
      }
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

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
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

        await session.commitTransaction();

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
        await session.abortTransaction();
        logger.error('Error getting orders by user ID:', {
          error: error.message,
          stack: error.stack,
        });
        throw new Error(`Failed to get orders by user ID: ${error.message}`);
      } finally {
        session.endSession();
      }
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

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Get current order
        const currentOrder = await Order.findById(orderId);
        if (!currentOrder) {
          throw new Error('Order not found');
        }

        // If financial fields are being updated, recalculate total
        const financialFields = ['shippingCost', 'tax', 'discount'];
        const hasFinancialUpdates = financialFields.some(field => field in updateData);

        if (hasFinancialUpdates) {
          const OrderItem = mongoose.model('OrderItem');
          const items = await OrderItem.find({
            _id: { $in: currentOrder.items },
          });
          const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

          const newShippingCost = updateData.shippingCost ?? currentOrder.shippingCost;
          const newTax = updateData.tax ?? currentOrder.tax;
          const newDiscount = updateData.discount ?? currentOrder.discount;

          updateData.subtotal = subtotal;
          updateData.totalPrice = subtotal + newShippingCost + newTax - newDiscount;
        }

        const order = await Order.findByIdAndUpdate(
          orderId,
          { $set: updateData },
          { new: true, runValidators: true }
        );

        await session.commitTransaction();
        return order;
      } catch (error) {
        await session.abortTransaction();
        logger.error('Error updating order:', {
          error: error.message,
          stack: error.stack,
        });
        throw new Error(`Failed to update order: ${error.message}`);
      } finally {
        session.endSession();
      }
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
    try {
      logger.info('Cancelling order:', { orderId, reason });
      if (!orderId) {
        logger.error('Order ID is required');
        throw new Error('Order ID is required');
      }

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        logger.error('Invalid order ID');
        throw new Error('Invalid order ID');
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const updateData = {
          status: 'cancelled',
          cancelledAt: new Date(),
        };

        if (reason) {
          updateData.cancellationReason = reason;
        }

        const order = await Order.findByIdAndUpdate(
          orderId,
          { $set: updateData },
          { new: true, runValidators: true }
        );

        if (!order) {
          throw new Error('Order not found');
        }

        await session.commitTransaction();
        return order;
      } catch (error) {
        await session.abortTransaction();
        logger.error('Error cancelling order:', {
          error: error.message,
          stack: error.stack,
        });
        throw new Error(`Failed to cancel order: ${error.message}`);
      } finally {
        session.endSession();
      }
    } catch (error) {
      logger.error('Error cancelling order:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to cancel order: ${error.message}`);
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

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
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

        await session.commitTransaction();
        return order;
      } catch (error) {
        await session.abortTransaction();
        logger.error('Error refunding order:', {
          error: error.message,
          stack: error.stack,
        });
        throw new Error(`Failed to refund order: ${error.message}`);
      } finally {
        session.endSession();
      }
    } catch (error) {
      logger.error('Error refunding order:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to refund order: ${error.message}`);
    }
  }
}
