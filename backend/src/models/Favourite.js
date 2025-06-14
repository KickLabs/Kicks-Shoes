/**
 * @fileoverview Favorite Model
 * @created 2025-06-04
 * @file Favorite.js
 * @description This file defines the Favorite model schema for the Kicks Shoes application.
 */

import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      unique: true
    },
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }],
    addedAt: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true,
  }
);

// Index for user lookup
favoriteSchema.index({ user: 1 }, { background: true });

// Remove old indexes first to prevent duplicates
favoriteSchema.index({ product: 1 }, { background: true });

// Ensure unique combination of user and product with a compound index
favoriteSchema.index(
  { user: 1, product: 1 }, 
  { 
    unique: true,
    background: true,
    name: "user_product_unique"
  }
);

// Pre-save middleware to convert IDs to ObjectId
favoriteSchema.pre('save', function(next) {
  if (this.user && typeof this.user === 'string') {
    this.user = mongoose.Types.ObjectId(this.user);
  }
  if (this.product && typeof this.product === 'string') {
    this.product = mongoose.Types.ObjectId(this.product);
  }
  next();
});

const Favorite = mongoose.model("Favorite", favoriteSchema);

export default Favorite;
