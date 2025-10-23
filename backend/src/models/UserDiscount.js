/**
 * @fileoverview UserDiscount Model
 * @created 2024-12-19
 * @file UserDiscount.js
 * @description This file defines the UserDiscount model schema for managing user-collected discounts in the Kicks Shoes application.
 */

import mongoose from 'mongoose';

const userDiscountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    discount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discount',
      required: [true, 'Discount is required'],
    },
    status: {
      type: String,
      enum: ['saved', 'used', 'expired'],
      default: 'saved',
    },
    usedAt: {
      type: Date,
      default: null,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    discountAmount: {
      type: Number,
      default: null,
    },
    orderAmount: {
      type: Number,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Usage count cannot be negative'],
    },
    collectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userDiscountSchema.index({ user: 1 });
userDiscountSchema.index({ discount: 1 });
userDiscountSchema.index({ status: 1 });
userDiscountSchema.index({ user: 1, discount: 1 }, { unique: true });

// Virtual for checking if user discount is currently valid
userDiscountSchema.virtual('isValid').get(function () {
  const now = new Date();
  return (
    this.status === 'saved' &&
    this.discount &&
    this.discount.status === 'active' &&
    this.discount.startDate <= now &&
    this.discount.endDate >= now &&
    this.discount.usedCount < this.discount.usageLimit
  );
});

// Method to use the discount
userDiscountSchema.methods.useDiscount = function (orderId, discountAmount, orderAmount) {
  if (this.status !== 'saved') {
    throw new Error('Discount is not saved');
  }

  this.status = 'used';
  this.usedAt = new Date();
  this.order = orderId;
  this.discountAmount = discountAmount;
  this.orderAmount = orderAmount;
  this.usageCount += 1;

  return this.save();
};

// Static method to find user's saved discounts
userDiscountSchema.statics.findSavedByUser = function (userId) {
  return this.find({
    user: userId,
    status: 'saved',
  }).populate('discount');
};

// Static method to find user's used discounts
userDiscountSchema.statics.findUsedByUser = function (userId) {
  return this.find({
    user: userId,
    status: 'used',
  })
    .populate('discount')
    .populate('order', 'orderNumber totalPrice');
};

// Static method to collect a discount for user
userDiscountSchema.statics.collectDiscount = async function (userId, discountId) {
  // Check if user already has this discount
  const existing = await this.findOne({ user: userId, discount: discountId });
  if (existing) {
    throw new Error('User already has this discount');
  }

  // Create new user discount
  const userDiscount = new this({
    user: userId,
    discount: discountId,
    status: 'saved',
  });

  return userDiscount.save();
};

// Pre-save middleware to validate
userDiscountSchema.pre('save', function (next) {
  if (this.isNew) {
    // Check if user already has this discount
    this.constructor
      .findOne({
        user: this.user,
        discount: this.discount,
      })
      .then(existing => {
        if (existing) {
          next(new Error('User already has this discount'));
        } else {
          next();
        }
      })
      .catch(next);
  } else {
    next();
  }
});

const UserDiscount = mongoose.model('UserDiscount', userDiscountSchema);

export default UserDiscount;
