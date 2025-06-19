/**
 * @fileoverview Order Model
 * @created 2025-06-04
 * @file Order.js
 * @description This file defines the Order model schema for the Kicks Shoes application.
 */

import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem',
        required: [true, 'Order items are required'],
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Price cannot be negative'],
    },
    shippingAddress: {
      type: String,
      required: [true, 'Shipping address is required'],
      trim: true,
      minlength: [10, 'Shipping address must be at least 10 characters long'],
      maxlength: [200, 'Shipping address cannot exceed 200 characters'],
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
      required: [true, 'Payment method is required'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    trackingNumber: {
      type: String,
      trim: true,
      match: [/^[A-Z0-9]{8,}$/, 'Invalid tracking number format'],
    },
    estimatedDelivery: {
      type: Date,
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: 'Estimated delivery date must be in the future',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    shippingMethod: {
      type: String,
      enum: ['standard', 'express', 'next_day'],
      default: 'standard',
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cost cannot be negative'],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative'],
    },
    // paymentDetails: {
    //   cardNumber: {
    //     type: String,
    //     trim: true,
    //     match: [/^\d{4}$/, "Invalid card number format"],
    //   },
    //   cardHolderName: {
    //     type: String,
    //     trim: true,
    //   },
    //   expiryDate: {
    //     type: String,
    //     trim: true,
    //   },
    // },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: 1 });
orderSchema.index({ orderNumber: 1 });

// Virtual for formatted order number
orderSchema.virtual('formattedOrderNumber').get(function () {
  return `#${this.orderNumber}`;
});

// Virtual for formatted total price
orderSchema.virtual('formattedTotalPrice').get(function () {
  return this.totalPrice ? this.totalPrice.toFixed(2) : '0.00';
});

// Virtual for formatted shipping cost
orderSchema.virtual('formattedShippingCost').get(function () {
  return this.shippingCost ? this.shippingCost.toFixed(2) : '0.00';
});

// Virtual for formatted tax
orderSchema.virtual('formattedTax').get(function () {
  return this.tax ? this.tax.toFixed(2) : '0.00';
});

// Virtual for formatted discount
orderSchema.virtual('formattedDiscount').get(function () {
  return this.discount ? this.discount.toFixed(2) : '0.00';
});

// Virtual for formatted subtotal
orderSchema.virtual('formattedSubtotal').get(function () {
  return this.subtotal ? this.subtotal.toFixed(2) : '0.00';
});

// Virtual for order summary
orderSchema.virtual('orderSummary').get(function () {
  return {
    subtotal: this.formattedSubtotal,
    shipping: this.formattedShippingCost,
    tax: this.formattedTax,
    discount: this.formattedDiscount,
    total: this.formattedTotalPrice,
  };
});

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      // Get current date components
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');

      // Get count of orders for today
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await this.constructor.countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

      // Generate order number format: YYMMDD-XXXX
      // YY: Year (last 2 digits)
      // MM: Month (2 digits)
      // DD: Day (2 digits)
      // XXXX: Sequential number for the day (4 digits)
      const sequence = (count + 1).toString().padStart(4, '0');
      this.orderNumber = `${year}${month}${day}-${sequence}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Validate that items array is not empty only when updating
orderSchema.pre('save', function (next) {
  // Skip validation for new documents
  if (this.isNew) {
    return next();
  }

  // Only validate when items are modified
  if (this.isModified('items') && this.items.length === 0) {
    return next(new Error('Order must have at least one item'));
  }
  next();
});

// Validate that totalPrice matches sum of items
orderSchema.pre('save', async function (next) {
  try {
    // Skip validation for new documents
    if (this.isNew) {
      return next();
    }

    if (!this.isModified('totalPrice') && !this.isModified('items')) {
      return next();
    }

    const OrderItem = mongoose.model('OrderItem');
    const items = await OrderItem.find({ _id: { $in: this.items } });

    if (items.length === 0) {
      return next();
    }

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const calculatedTotal = subtotal + this.shippingCost + this.tax - this.discount;

    if (Math.abs(calculatedTotal - this.totalPrice) > 0.01) {
      return next(new Error('Total price does not match sum of items'));
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to get order details for frontend
orderSchema.methods.getOrderDetails = async function () {
  await this.populate([
    {
      path: 'user',
      select: 'fullName email phone avatar',
    },
    {
      path: 'items',
      populate: {
        path: 'product',
        select: 'name image price',
      },
    },
  ]);

  return {
    _id: this._id,
    orderNumber: this.formattedOrderNumber,
    status: this.status,
    paymentStatus: this.paymentStatus,
    paymentMethod: this.paymentMethod,
    shippingAddress: this.shippingAddress,
    shippingMethod: this.shippingMethod,
    trackingNumber: this.trackingNumber,
    estimatedDelivery: this.estimatedDelivery,
    notes: this.notes,
    user: this.user,
    items: this.items,
    orderSummary: this.orderSummary,
    paymentDetails: this.paymentDetails,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
