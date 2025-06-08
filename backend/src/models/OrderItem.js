/**
 * @fileoverview OrderItem Model
 * @created 2025-06-04
 * @file OrderItem.js
 * @description This file defines the OrderItem model schema for the Kicks Shoes application.
 */

import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    size: {
      type: String,
      required: [true, "Size is required"],
    },
    color: {
      type: String,
      required: [true, "Color is required"],
    },
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
orderItemSchema.index({ order: 1 });
orderItemSchema.index({ product: 1 });

// Calculate subtotal before saving
orderItemSchema.pre("save", function (next) {
  this.subtotal = this.price * this.quantity;
  next();
});

const OrderItem = mongoose.model("OrderItem", orderItemSchema);

export default OrderItem;
