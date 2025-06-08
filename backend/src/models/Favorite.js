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
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product is required"],
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
favoriteSchema.index({ user: 1 });
favoriteSchema.index({ "items.product": 1 });

// Ensure unique products per user
favoriteSchema.index({ user: 1, "items.product": 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", favoriteSchema);

export default Favorite;
