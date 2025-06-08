/**
 * @fileoverview Product Model
 * @created 2025-05-31
 * @file Product.js
 * @description This file defines the Product model schema for the Kicks Shoes application.
 * It includes product details such as name, description, price, inventory, and category relationships.
 * The schema supports product variations, images, and store associations.
 */

import mongoose from "mongoose";
const { Schema } = mongoose;

// Schema cho inventory item
const InventoryItemSchema = new Schema(
  {
    size: {
      type: Number,
      required: true,
      min: [30, "Size must be at least 30"],
      max: [50, "Size cannot exceed 50"],
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    sku: {
      type: String,
      unique: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: Boolean,
      default: true,
      index: true,
    },

    price: {
      regular: {
        type: Number,
        required: true,
        min: [0, "Price cannot be negative"],
      },
      discountPercent: {
        type: Number,
        default: 0,
        min: [0, "Discount cannot be negative"],
        max: [100, "Discount cannot exceed 100%"],
      },
      isOnSale: {
        type: Boolean,
        default: false,
      },
    },

    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    sales: {
      type: Number,
      default: 0,
      min: [0, "Sales cannot be negative"],
    },

    variants: {
      sizes: [
        {
          type: Number,
          min: [30, "Size must be at least 30"],
          max: [50, "Size cannot exceed 50"],
        },
      ],
      colors: [
        {
          type: String,
          trim: true,
        },
      ],
    },

    inventory: [InventoryItemSchema],

    images: [
      {
        type: String,
        trim: true,
      },
    ],

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    isNew: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    suppressReservedKeysWarning: true,
  }
);

// Indexes
productSchema.index({ name: "text", brand: "text", description: "text" });
productSchema.index({ "inventory.size": 1, "inventory.color": 1 });
productSchema.index({ "inventory.sku": 1 }, { sparse: true });

// Virtuals
productSchema.virtual("discountedPrice").get(function () {
  if (!this.price.isOnSale) return this.price.regular;
  return this.price.regular * (1 - this.price.discountPercent / 100);
});

productSchema.virtual("isInStock").get(function () {
  return this.stock > 0;
});

// Pre-save middleware
productSchema.pre("save", function (next) {
  // Generate main SKU if not exists
  if (!this.sku) {
    const skuPrefix = this.brand.substring(0, 3).toUpperCase();
    const namePrefix = this.name.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    this.sku = `${skuPrefix}-${namePrefix}-${randomNum}`;
  }

  // Generate SKUs for inventory items and update availability
  if (this.inventory) {
    this.inventory.forEach((item) => {
      // Generate unique SKU for each inventory item if not exists
      if (!item.sku) {
        const sizeCode = item.size.toString().padStart(2, "0");
        const colorCode = item.color.replace("#", "");
        item.sku = `${this.sku}-${sizeCode}-${colorCode}`;
      }

      // Update availability
      item.isAvailable = item.quantity > 0;
    });

    // Update total stock
    this.stock = this.inventory.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }

  next();
});

// Methods
productSchema.methods.updateStock = async function (quantity) {
  if (this.stock + quantity < 0) {
    throw new Error("Insufficient stock");
  }
  this.stock += quantity;
  return this.save();
};

productSchema.methods.incrementSales = async function (quantity) {
  this.sales += quantity;
  return this.save();
};

productSchema.methods.updateInventory = async function (size, color, quantity) {
  const inventoryItem = this.inventory.find(
    (item) => item.size === size && item.color === color
  );

  if (!inventoryItem) {
    throw new Error("Size and color combination not found");
  }

  if (inventoryItem.quantity + quantity < 0) {
    throw new Error("Insufficient stock for this size and color");
  }

  inventoryItem.quantity += quantity;
  inventoryItem.isAvailable = inventoryItem.quantity > 0;

  // Update total stock
  this.stock = this.inventory.reduce((total, item) => total + item.quantity, 0);

  return this.save();
};

productSchema.methods.checkInventory = function (size, color) {
  const inventoryItem = this.inventory.find(
    (item) => item.size === size && item.color === color
  );

  if (!inventoryItem) {
    return { available: false, quantity: 0 };
  }

  return {
    available: inventoryItem.isAvailable,
    quantity: inventoryItem.quantity,
    sku: inventoryItem.sku,
  };
};

// Static methods
productSchema.statics.findByCategory = function (categoryId) {
  return this.find({ category: categoryId, status: true });
};

productSchema.statics.findOnSale = function () {
  return this.find({ "price.isOnSale": true, status: true });
};

productSchema.statics.findByInventorySku = function (sku) {
  return this.findOne({ "inventory.sku": sku });
};

export default mongoose.model("Product", productSchema);
