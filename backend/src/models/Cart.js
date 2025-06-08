/**
 * @fileoverview Cart Model
 * @created 2025-06-04
 * @file Cart.js
 * @description This file defines the Cart model schema for the Kicks Shoes application.
 */

import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    items: [
      {
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
        size: {
          type: String,
          required: [true, "Size is required"],
        },
        color: {
          type: String,
          required: [true, "Color is required"],
        },
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: [0, "Price cannot be negative"],
        },
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
      min: [0, "Total price cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
cartSchema.index({ user: 1 });

// Calculate total price before saving
cartSchema.pre("save", function (next) {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
  next();
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
