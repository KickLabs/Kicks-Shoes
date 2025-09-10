import mongoose from 'mongoose';
const { Schema } = mongoose;

const FlashSaleProductSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    discountPercent: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    flashPrice: { type: Number, min: [0, 'Flash price cannot be negative'] },
    stock: { type: Number, default: 0, min: [0, 'Stock cannot be negative'] },
  },
  { _id: false }
);

const FlashSaleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    products: [FlashSaleProductSchema],
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'ended', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    banner: { type: String, trim: true },
  },
  { timestamps: true }
);

FlashSaleSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model('FlashSale', FlashSaleSchema);
