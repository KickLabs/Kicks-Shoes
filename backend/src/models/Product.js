import mongoose from "mongoose";
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    summary: { type: String },
    description: { type: String },

    brand: { type: String, required: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    sku: { type: String, unique: true },
    tags: [{ type: String }],
    status: { type: Boolean, default: true },

    price: {
      regular: { type: Number, required: true },
      discountPercent: { type: Number, default: 0 },
      isOnSale: { type: Boolean, default: false },
    },

    stock: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },

    variants: {
      sizes: [{ type: String }],
      colors: [{ type: String }],
    },

    images: [{ type: String }],

    rating: { type: Number, min: 0, max: 5, default: 0 },
    isNew: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", productSchema);
