import Discount from '../models/Discount.js';
import Order from '../models/Order.js';

/**
 * Validate discount code for a user
 * @param {string} code - Discount code
 * @param {string} userId - User ID
 * @param {number} cartTotal - Cart total amount
 * @param {Array} cartItems - Cart items
 * @returns {Object} Validation result
 */
export const validateDiscountCode = async (code, userId, cartTotal, cartItems = []) => {
  try {
    const discount = await Discount.findOne({ code: code.toUpperCase() });

    if (!discount) {
      return {
        isValid: false,
        message: 'Discount code not found',
      };
    }

    // Check if discount is valid
    if (!discount.isValid()) {
      return {
        isValid: false,
        message: 'Discount code is expired or inactive',
      };
    }

    // Check minimum purchase amount
    if (cartTotal < discount.minPurchase) {
      return {
        isValid: false,
        message: `Minimum purchase amount of ${discount.minPurchase.toLocaleString()} VND required`,
      };
    }

    // Check if user has already used this discount
    const userUsageCount = await Order.countDocuments({
      user: userId,
      discountCode: discount.code,
      status: { $in: ['delivered', 'processing', 'shipped'] },
    });

    if (userUsageCount >= discount.perUserLimit) {
      return {
        isValid: false,
        message: 'You have already used this discount code',
      };
    }

    // Check if discount has reached usage limit
    if (discount.usedCount >= discount.usageLimit) {
      return {
        isValid: false,
        message: 'Discount code usage limit reached',
      };
    }

    // Check if discount applies to cart items
    if (discount.applicableProducts && discount.applicableProducts.length > 0) {
      const cartProductIds = cartItems.map(item => item.product.toString());
      const hasApplicableProduct = discount.applicableProducts.some(productId =>
        cartProductIds.includes(productId.toString())
      );

      if (!hasApplicableProduct) {
        return {
          isValid: false,
          message: 'Discount code does not apply to items in your cart',
        };
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (cartTotal * discount.value) / 100;
      if (discount.maxDiscount) {
        discountAmount = Math.min(discountAmount, discount.maxDiscount);
      }
    } else {
      discountAmount = discount.value;
    }

    return {
      isValid: true,
      discount: {
        id: discount._id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        maxDiscount: discount.maxDiscount,
        description: discount.description,
      },
      discountAmount: Math.round(discountAmount),
      finalAmount: Math.round(cartTotal - discountAmount),
    };
  } catch (error) {
    console.error('Error validating discount:', error);
    return {
      isValid: false,
      message: 'Error validating discount code',
    };
  }
};

/**
 * Apply discount to order
 * @param {string} orderId - Order ID
 * @param {string} discountCode - Discount code
 * @returns {Object} Application result
 */
export const applyDiscountToOrder = async (orderId, discountCode) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    const discount = await Discount.findOne({ code: discountCode.toUpperCase() });
    if (!discount) {
      return {
        success: false,
        message: 'Discount code not found',
      };
    }

    // Validate discount
    const validation = await validateDiscountCode(
      discountCode,
      order.user,
      order.subtotal,
      order.items
    );

    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message,
      };
    }

    // Apply discount to order
    order.discount = validation.discountAmount;
    order.discountCode = discountCode.toUpperCase();
    order.totalPrice = order.subtotal + order.shippingCost + order.tax - order.discount;

    await order.save();

    // Increment discount usage count
    discount.usedCount += 1;
    await discount.save();

    return {
      success: true,
      message: 'Discount applied successfully',
      data: {
        discountAmount: order.discount,
        totalPrice: order.totalPrice,
      },
    };
  } catch (error) {
    console.error('Error applying discount:', error);
    return {
      success: false,
      message: 'Error applying discount',
    };
  }
};

/**
 * Get all active discounts
 * @returns {Array} Active discounts
 */
export const getActiveDiscounts = async () => {
  try {
    const now = new Date();
    const discounts = await Discount.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
      $expr: { $lt: ['$usedCount', '$usageLimit'] },
    })
      .populate('applicableProducts', 'name price')
      .populate('applicableCategories', 'name');

    return discounts;
  } catch (error) {
    console.error('Error fetching active discounts:', error);
    return [];
  }
};

export default {
  validateDiscountCode,
  applyDiscountToOrder,
  getActiveDiscounts,
};
