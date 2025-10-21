/**
 * @fileoverview Product Model (Shoes EU only + Clothing + Accessories)
 * @created 2025-05-31
 * @updated  2025-09-10
 * @file Product.js
 * @description Backward compatible for existing shoes data (inventory.size as EU 30–50),
 *              while adding support for clothing sizes (Alpha XS-4XL) and accessories (OneSize).
 */

import mongoose from 'mongoose';
const { Schema } = mongoose;

/* -------------------------------------------------------------------------- */
/*                              INVENTORY SCHEMA                               */
/* -------------------------------------------------------------------------- */
/**
 * Backward compatible design:
 * - Shoes:     use `size` (Number, EU 30–50)
 * - Clothing:  use `clothingSize` (String: XS..4XL)
 * - Accessory: use `isOneSize` (Boolean)
 */
const InventoryItemSchema = new Schema(
  {
    // For Shoes (EU sizes only)
    size: {
      type: Number,
      min: [30, 'Shoe size must be at least 30'],
      max: [50, 'Shoe size cannot exceed 50'],
    },

    // For Clothing
    clothingSize: {
      type: String,
      trim: true,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
    },

    // For Accessories (e.g., caps, belts, bags)
    isOneSize: {
      type: Boolean,
      default: false,
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

    // Unique SKU per variant (auto-generated if not provided)
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Optional images for this variant
    images: [{ type: String, trim: true }],

    // Optional extra attributes for specific product types
    attrs: {
      material: { type: String, trim: true },
      fit: { type: String, trim: true }, // slim, regular, relaxed...
      length: { type: String, trim: true }, // short, regular, long, or numeric
      width: { type: String, trim: true }, // regular, wide (for shoes)
    },
  },
  { _id: false }
);

/* -------------------------------------------------------------------------- */
/*                               PRODUCT SCHEMA                               */
/* -------------------------------------------------------------------------- */
const productSchema = new Schema(
  {
    // Basic information
    name: { type: String, required: true, trim: true, index: true },
    summary: { type: String, trim: true },
    description: { type: String, trim: true },

    // Brand & category reference
    brand: { type: String, required: true, trim: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },

    /**
     * productType determines how inventory is handled:
     * - shoes      → EU numeric sizes
     * - clothing   → Alpha letter sizes
     * - accessory  → One size
     */
    productType: {
      type: String,
      enum: ['shoes', 'clothing', 'accessory', 'other'],
      required: true,
      index: true,
    },

    // Top-level SKU (unique product code)
    sku: { type: String, unique: true, index: true },

    // Product tags for search/filter
    tags: [{ type: String, trim: true }],

    // Active / inactive status
    status: { type: Boolean, default: true, index: true },

    /* ------------------------------ Pricing ------------------------------ */
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

    // Final calculated price based on regular + discounts or flash sale
    finalPrice: { type: Number, default: 0, index: true },

    /* ------------------------------ Inventory ---------------------------- */
    stock: { type: Number, default: 0, min: [0, 'Stock cannot be negative'] },
    sales: { type: Number, default: 0, min: [0, 'Sales cannot be negative'] },

    /**
     * Variants for filtering & UI
     * Always stored as strings for consistency.
     */
    variants: {
      sizes: [{ type: String, trim: true }], // e.g., "42", "M", "OneSize"
      colors: [{ type: String, trim: true }],
      extra: {
        materials: [{ type: String, trim: true }],
        fits: [{ type: String, trim: true }],
      },
    },

    // Inventory detail array
    inventory: [InventoryItemSchema],

    /* ------------------------------ Media -------------------------------- */
    mainImage: { type: String, trim: true },

    /* ------------------------------ Rating -------------------------------- */
    rating: { type: Number, min: 0, max: 5, default: 0 },
    isNew: { type: Boolean, default: false, index: true },

    /* ------------------------------ Attributes --------------------------- */
    attributes: {
      gender: {
        type: String,
        enum: ['male', 'female', 'unisex', 'kids', 'other'],
        default: 'unisex',
        index: true,
      },
      material: { type: String, trim: true },
      season: { type: String, trim: true },
      style: { type: String, trim: true },
      care: { type: String, trim: true },
    },

    /* ------------------------------ Flash Sale --------------------------- */
    flashSaleId: { type: Schema.Types.ObjectId, ref: 'FlashSale', default: null, index: true },
    flashSalePrice: {
      type: Number,
      default: null,
      min: [0, 'Flash sale price cannot be negative'],
    },
    flashSaleDiscountPercent: {
      type: Number,
      default: null,
      min: [0, 'Flash sale discount cannot be negative'],
      max: [100, 'Flash sale discount cannot exceed 100%'],
    },
    flashSaleStart: { type: Date, default: null, index: true },
    flashSaleEnd: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    suppressReservedKeysWarning: true,
  }
);

/* -------------------------------------------------------------------------- */
/*                                   INDEXES                                  */
/* -------------------------------------------------------------------------- */
productSchema.index({ name: 'text', brand: 'text', description: 'text' });
productSchema.index({ 'inventory.size': 1, 'inventory.color': 1 }); // for shoes
productSchema.index({ 'inventory.clothingSize': 1, 'inventory.color': 1 }); // for clothing
productSchema.index({ productType: 1, 'attributes.gender': 1, 'attributes.material': 1 });

/* -------------------------------------------------------------------------- */
/*                                  VIRTUALS                                  */
/* -------------------------------------------------------------------------- */
// Virtual field to calculate discounted price on the fly
productSchema.virtual('discountedPrice').get(function () {
  if (!this.price.isOnSale) return this.price.regular;
  return this.price.regular * (1 - this.price.discountPercent / 100);
});

// Virtual field to quickly check if product is in stock
productSchema.virtual('isInStock').get(function () {
  return this.stock > 0;
});

/* -------------------------------------------------------------------------- */
/*                                   METHODS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Sync variants based on product type:
 * - shoes → numeric sizes
 * - clothing → alpha sizes
 * - accessory → "OneSize"
 */
productSchema.methods.syncVariantsFromInventory = function () {
  if (!Array.isArray(this.inventory)) return;

  const colors = [...new Set(this.inventory.map(i => i.color))];

  let sizes = [];
  if (this.productType === 'shoes') {
    // Collect numeric sizes (EU 30–50)
    sizes = [...new Set(this.inventory.map(i => i.size))]
      .filter(v => v !== undefined && v !== null)
      .sort((a, b) => a - b)
      .map(String);
  } else if (this.productType === 'clothing') {
    // Collect clothing sizes in defined order
    const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
    sizes = [...new Set(this.inventory.map(i => i.clothingSize))]
      .filter(Boolean)
      .sort((a, b) => order.indexOf(a) - order.indexOf(b));
  } else if (this.productType === 'accessory') {
    sizes = ['OneSize'];
  } else {
    // Fallback for mixed or unknown product types
    sizes = [
      ...new Set(
        [
          ...this.inventory.map(i => (i.size != null ? String(i.size) : null)),
          ...this.inventory.map(i => i.clothingSize || null),
        ].filter(Boolean)
      ),
    ];
  }

  // Extra facets for filtering
  const materials = [...new Set(this.inventory.map(i => i.attrs?.material).filter(Boolean))];
  const fits = [...new Set(this.inventory.map(i => i.attrs?.fit).filter(Boolean))];

  this.variants = { sizes, colors, extra: { materials, fits } };
};

/**
 * Calculate final price:
 * Priority: Flash Sale → OnSale Discount → Regular Price
 */
productSchema.methods.calculateFinalPrice = function () {
  if (this.flashSalePrice != null) {
    this.finalPrice = this.flashSalePrice;
  } else if (this.price.isOnSale && this.price.discountPercent > 0) {
    this.finalPrice =
      Math.round(this.price.regular * (1 - this.price.discountPercent / 100) * 100) / 100;
  } else {
    this.finalPrice = this.price.regular;
  }
  return this.finalPrice;
};

/** Recalculate total stock based on inventory */
productSchema.methods.recalculateStock = function () {
  this.stock = (this.inventory || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
  return this.stock;
};

/**
 * Update stock globally (e.g., bulk restock or return)
 */
productSchema.methods.updateStock = async function (quantity) {
  if (this.stock + quantity < 0) throw new Error('Insufficient stock');
  this.stock += quantity;
  return this.save();
};

/** Increment sales count */
productSchema.methods.incrementSales = async function (quantity) {
  this.sales += quantity;
  return this.save();
};

/**
 * Update inventory for a specific variant
 * @param {Object} variant
 * @param {number} quantity
 */
productSchema.methods.updateInventory = async function (variant, quantity) {
  const { size, clothingSize, isOneSize, color } = variant || {};

  // Match based on productType
  const match = it =>
    String(it.color || '')
      .trim()
      .toLowerCase() ===
      String(color || '')
        .trim()
        .toLowerCase() &&
    (this.productType === 'shoes'
      ? String(it.size) === String(size)
      : this.productType === 'clothing'
        ? String(it.clothingSize) === String(clothingSize)
        : this.productType === 'accessory'
          ? Boolean(it.isOneSize) === Boolean(isOneSize)
          : // fallback for mixed productType
            (size != null ? String(it.size) === String(size) : true) &&
            (clothingSize ? it.clothingSize === clothingSize : true) &&
            (isOneSize != null ? Boolean(it.isOneSize) === Boolean(isOneSize) : true));

  const inventoryItem = (this.inventory || []).find(match);
  if (!inventoryItem) throw new Error('Variant not found');

  if (inventoryItem.quantity + quantity < 0) throw new Error('Insufficient stock for this variant');

  inventoryItem.quantity += quantity;
  inventoryItem.isAvailable = inventoryItem.quantity > 0;

  this.recalculateStock();
  return this.save();
};

/**
 * Check inventory availability for a specific variant
 */
productSchema.methods.checkInventory = function (variant) {
  const { size, clothingSize, isOneSize, color } = variant || {};

  const match = it =>
    String(it.color || '')
      .trim()
      .toLowerCase() ===
      String(color || '')
        .trim()
        .toLowerCase() &&
    (this.productType === 'shoes'
      ? String(it.size) === String(size)
      : this.productType === 'clothing'
        ? String(it.clothingSize) === String(clothingSize)
        : this.productType === 'accessory'
          ? Boolean(it.isOneSize) === Boolean(isOneSize)
          : true);

  const inventoryItem = (this.inventory || []).find(match);

  if (!inventoryItem) return { available: false, quantity: 0, images: [] };

  return {
    available: inventoryItem.isAvailable,
    quantity: inventoryItem.quantity,
    sku: inventoryItem.sku,
    images: inventoryItem.images,
  };
};

/* -------------------------------------------------------------------------- */
/*                                  STATICS                                   */
/* -------------------------------------------------------------------------- */
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
  const products = await this.find({});
  let updatedCount = 0;

  for (const p of products) {
    const old = p.finalPrice;
    p.calculateFinalPrice();
    if (old !== p.finalPrice) {
      await p.save();
      updatedCount++;
    }
  }

  return updatedCount;
};

productSchema.statics.updateProductFinalPrice = async function (productId) {
  const p = await this.findById(productId);
  if (!p) throw new Error('Product not found');
  p.calculateFinalPrice();
  await p.save();
  return p;
};

/* -------------------------------------------------------------------------- */
/*                                    HOOKS                                   */
/* -------------------------------------------------------------------------- */
/**
 * Pre-save hook:
 * - Auto-generate product SKU if not provided
 * - Generate variant SKUs
 * - Sync stock and variants
 * - Calculate finalPrice
 */
productSchema.pre('save', function (next) {
  // Auto-generate base SKU
  if (!this.sku) {
    const skuPrefix = this.brand.substring(0, 3).toUpperCase();
    const namePrefix = this.name.substring(0, 3).toUpperCase();
    const typePrefix =
      this.productType === 'shoes'
        ? 'SH'
        : this.productType === 'clothing'
          ? 'CL'
          : this.productType === 'accessory'
            ? 'AC'
            : 'OTR';
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    this.sku = `${skuPrefix}-${namePrefix}-${typePrefix}-${randomNum}`;
  }

  // Process inventory items
  if (Array.isArray(this.inventory)) {
    this.inventory.forEach(item => {
      // Generate SKU for each variant if missing
      if (!item.sku) {
        let sizeCode = 'OS';
        if (this.productType === 'shoes' && item.size != null) {
          sizeCode = `S${item.size}`;
        } else if (this.productType === 'clothing' && item.clothingSize) {
          sizeCode = `C${item.clothingSize}`;
        } else if (this.productType === 'accessory' && item.isOneSize) {
          sizeCode = 'OS';
        }

        const colorCode = (item.color || 'NA').replace(/[^a-zA-Z0-9]/g, '');
        item.sku = `${this.sku}-${sizeCode}-${colorCode}`;
      }

      // Update availability
      item.isAvailable = item.quantity > 0;
    });

    this.recalculateStock();
    this.syncVariantsFromInventory();
  }

  this.calculateFinalPrice();
  next();
});

export default mongoose.model('Product', productSchema);
