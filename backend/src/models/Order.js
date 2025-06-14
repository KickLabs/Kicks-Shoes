/**
 * @fileoverview Order Model
 * @created 2025-06-04
 * @file Order.js
 * @description This file defines the Order model schema for the Kicks Shoes application.
 */

import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderItem",
        required: [true, "Order items are required"],
      },
    ],
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Price cannot be negative"],
    },
    shippingAddress: {
      type: String,
      required: [true, "Shipping address is required"],
      trim: true,
      minlength: [10, "Shipping address must be at least 10 characters long"],
      maxlength: [200, "Shipping address cannot exceed 200 characters"],
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "paypal", "bank_transfer", "cash_on_delivery"],
      required: [true, "Payment method is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    trackingNumber: {
      type: String,
      trim: true,
      match: [/^[A-Z0-9]{8,}$/, "Invalid tracking number format"],
    },
    estimatedDelivery: {
      type: Date,
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: "Estimated delivery date must be in the future",
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: 1 });

// Validate that items array is not empty only when updating
orderSchema.pre("save", function (next) {
  // Skip validation for new documents
  if (this.isNew) {
    return next();
  }

  // Only validate when items are modified
  if (this.isModified("items") && this.items.length === 0) {
    return next(new Error("Order must have at least one item"));
  }
  next();
});

// Validate that totalPrice matches sum of items
orderSchema.pre("save", async function (next) {
  try {
    // Skip validation for new documents
    if (this.isNew) {
      return next();
    }

    if (!this.isModified("totalPrice") && !this.isModified("items")) {
      return next();
    }

    const OrderItem = mongoose.model("OrderItem");
    const items = await OrderItem.find({ _id: { $in: this.items } });

    if (items.length === 0) {
      return next();
    }

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    if (Math.abs(total - this.totalPrice) > 0.01) {
      return next(new Error("Total price does not match sum of items"));
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
