/**
 * @fileoverview Product Model
 * @created 2025-06-04
 * @file Product.js
 * @description This file defines the Product model schema for the Kicks Shoes shop.
 */

import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    salePrice: {
      type: Number,
      min: [0, "Sale price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    sizes: [
      {
        size: {
          type: String,
          required: true,
        },
        stock: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    colors: [
      {
        name: {
          type: String,
          required: true,
        },
        code: {
          type: String,
          required: true,
        },
        images: [
          {
            type: String,
            validate: {
              validator: function (v) {
                return /^https?:\/\/.+/.test(v);
              },
              message: "Image URL must be a valid URL",
            },
          },
        ],
      },
    ],
    mainImage: {
      type: String,
      required: [true, "Main image is required"],
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: "Image URL must be a valid URL",
      },
    },
    images: [
      {
        type: String,
        validate: {
          validator: function (v) {
            return /^https?:\/\/.+/.test(v);
          },
          message: "Image URL must be a valid URL",
        },
      },
    ],
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    specifications: {
      type: Map,
      of: String,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
    salePercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "out_of_stock"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
productSchema.index({ name: "text", description: "text" });
productSchema.index({ brand: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ isOnSale: 1 });
productSchema.index({ price: 1 });
productSchema.index({ "sizes.size": 1 });
productSchema.index({ "colors.name": 1 });

// Calculate sale price if sale percent is set
productSchema.pre("save", function (next) {
  if (this.isOnSale && this.salePercent > 0) {
    this.salePrice = this.price * (1 - this.salePercent / 100);
  }
  next();
});

// Update stock when sizes are modified
productSchema.pre("save", function (next) {
  if (this.isModified("sizes")) {
    this.stock = this.sizes.reduce((total, size) => total + size.stock, 0);
  }
  next();
});

const Product = mongoose.model("Product", productSchema);

export default Product;
