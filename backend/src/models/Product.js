/**
 * @fileoverview Product Model with Final Price Calculation
 * @created 2025-05-31
 * @file Product.js
 * @description Updated Product model with automatic finalPrice calculation
 */

import mongoose from 'mongoose';
const { Schema } = mongoose;

const InventoryItemSchema = new Schema(
  {
    size: {
      type: Number,
      required: true,
      min: [30, 'Size must be at least 30'],
      max: [50, 'Size cannot exceed 50'],
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
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
    images: [
      {
        type: String,
        trim: true,
      },
    ],
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
      ref: 'Category',
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
        min: [0, 'Price cannot be negative'],
      },
      discountPercent: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%'],
      },
      isOnSale: {
        type: Boolean,
        default: false,
      },
    },

    finalPrice: {
      type: Number,
      default: 0,
      index: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    sales: {
      type: Number,
      default: 0,
      min: [0, 'Sales cannot be negative'],
    },

    variants: {
      sizes: [
        {
          type: Number,
          min: [30, 'Size must be at least 30'],
          max: [50, 'Size cannot exceed 50'],
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

    mainImage: {
      type: String,
      trim: true,
    },

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

productSchema.index({ name: 'text', brand: 'text', description: 'text' });
productSchema.index({ 'inventory.size': 1, 'inventory.color': 1 });
// finalPrice index is already defined in the schema, so we don't need to add it again

productSchema.virtual('discountedPrice').get(function () {
  if (!this.price.isOnSale) return this.price.regular;
  return this.price.regular * (1 - this.price.discountPercent / 100);
});

productSchema.virtual('isInStock').get(function () {
  return this.stock > 0;
});

productSchema.methods.syncVariantsFromInventory = function () {
  if (!Array.isArray(this.inventory)) return;
  const sizes = [...new Set(this.inventory.map(item => item.size))];
  const colors = [...new Set(this.inventory.map(item => item.color))];
  this.variants = { sizes, colors };
};

productSchema.methods.calculateFinalPrice = function () {
  console.log('Calculating finalPrice for product:', this.name);
  console.log('Price data:', {
    regular: this.price.regular,
    isOnSale: this.price.isOnSale,
    discountPercent: this.price.discountPercent,
  });

  if (this.price.isOnSale && this.price.discountPercent > 0) {
    this.finalPrice =
      Math.round(this.price.regular * (1 - this.price.discountPercent / 100) * 100) / 100;
    console.log('Product is on sale, finalPrice:', this.finalPrice);
  } else {
    this.finalPrice = this.price.regular;
    console.log('Product is NOT on sale, finalPrice:', this.finalPrice);
  }

  return this.finalPrice;
};

productSchema.pre('save', function (next) {
  console.log('Pre-save middleware triggered for product:', this.name);

  if (!this.sku) {
    const skuPrefix = this.brand.substring(0, 3).toUpperCase();
    const namePrefix = this.name.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    this.sku = `${skuPrefix}-${namePrefix}-${randomNum}`;
  }

  if (this.inventory) {
    this.inventory.forEach(item => {
      if (!item.sku) {
        const sizeCode = item.size.toString().padStart(2, '0');
        const colorCode = item.color.replace(/[^a-zA-Z0-9]/g, '');
        item.sku = `${this.sku}-${sizeCode}-${colorCode}`;
      }

      item.isAvailable = item.quantity > 0;
    });

    this.stock = this.inventory.reduce((total, item) => total + item.quantity, 0);
    this.syncVariantsFromInventory();
  }

  const oldFinalPrice = this.finalPrice;
  this.calculateFinalPrice();
  console.log('Final price changed from', oldFinalPrice, 'to', this.finalPrice);

  next();
});

productSchema.pre(['updateOne', 'findOneAndUpdate', 'findByIdAndUpdate'], async function (next) {
  console.log('Pre-update middleware triggered');

  const update = this.getUpdate();
  console.log('Update data:', JSON.stringify(update, null, 2));

  // Handle both $set and direct field updates
  const updateData = update.$set || update;

  if (
    updateData &&
    (updateData.price ||
      updateData['price.regular'] ||
      updateData['price.isOnSale'] ||
      updateData['price.discountPercent'])
  ) {
    console.log('Price fields detected in update, calculating finalPrice...');

    const docToUpdate = await this.model.findOne(this.getQuery());

    if (docToUpdate) {
      const currentPrice = docToUpdate.price || {};
      const updatedPrice = updateData.price || {
        regular: updateData['price.regular'] ?? currentPrice.regular,
        isOnSale: updateData['price.isOnSale'] ?? currentPrice.isOnSale,
        discountPercent: updateData['price.discountPercent'] ?? currentPrice.discountPercent,
      };

      console.log('Current price:', currentPrice);
      console.log('Updated price:', updatedPrice);

      let finalPrice;
      if (updatedPrice.isOnSale && updatedPrice.discountPercent > 0) {
        finalPrice =
          Math.round(updatedPrice.regular * (1 - updatedPrice.discountPercent / 100) * 100) / 100;
      } else {
        finalPrice = updatedPrice.regular;
      }

      console.log('Calculated finalPrice:', finalPrice);

      // Update the finalPrice in the update operation
      if (update.$set) {
        update.$set.finalPrice = finalPrice;
      } else {
        update.finalPrice = finalPrice;
      }
    }
  }

  next();
});

productSchema.methods.updateStock = async function (quantity) {
  if (this.stock + quantity < 0) {
    throw new Error('Insufficient stock');
  }
  this.stock += quantity;
  return this.save();
};

productSchema.methods.incrementSales = async function (quantity) {
  this.sales += quantity;
  return this.save();
};

productSchema.methods.updateInventory = async function (size, color, quantity) {
  const inventoryItem = this.inventory.find(item => item.size === size && item.color === color);

  if (!inventoryItem) {
    throw new Error('Size and color combination not found');
  }

  if (inventoryItem.quantity + quantity < 0) {
    throw new Error('Insufficient stock for this size and color');
  }

  inventoryItem.quantity += quantity;
  inventoryItem.isAvailable = inventoryItem.quantity > 0;

  this.stock = this.inventory.reduce((total, item) => total + item.quantity, 0);

  return this.save();
};

productSchema.methods.checkInventory = function (size, color) {
  const inventoryItem = this.inventory.find(item => item.size === size && item.color === color);

  if (!inventoryItem) {
    return { available: false, quantity: 0, images: [] };
  }

  return {
    available: inventoryItem.isAvailable,
    quantity: inventoryItem.quantity,
    sku: inventoryItem.sku,
    images: inventoryItem.images,
  };
};

productSchema.statics.findByCategory = function (categoryId) {
  return this.find({ category: categoryId, status: true });
};

productSchema.statics.findOnSale = function () {
  return this.find({ 'price.isOnSale': true, status: true });
};

productSchema.statics.findByInventorySku = function (sku) {
  return this.findOne({ 'inventory.sku': sku });
};

productSchema.statics.updateAllFinalPrices = async function () {
  console.log('Starting to update all final prices...');

  const products = await this.find({});
  let updatedCount = 0;

  for (const product of products) {
    const oldFinalPrice = product.finalPrice;
    product.calculateFinalPrice();

    if (oldFinalPrice !== product.finalPrice) {
      await product.save();
      updatedCount++;
      console.log(`Updated ${product.name}: ${oldFinalPrice} -> ${product.finalPrice}`);
    }
  }

  console.log(`Updated finalPrice for ${updatedCount} out of ${products.length} products`);
  return updatedCount;
};

productSchema.statics.updateProductFinalPrice = async function (productId) {
  const product = await this.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const oldFinalPrice = product.finalPrice;
  product.calculateFinalPrice();
  await product.save();

  console.log(`Updated ${product.name}: ${oldFinalPrice} -> ${product.finalPrice}`);
  return product;
};

export default mongoose.model('Product', productSchema);
