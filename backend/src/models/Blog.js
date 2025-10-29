import mongoose from 'mongoose';
const { Schema } = mongoose;

const BlogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    summary: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
    banner: { type: String, trim: true },
    category: { type: String, trim: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tags: [{ type: String, trim: true, index: true }],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    views: { type: Number, default: 0, min: [0, 'Views cannot be negative'] },
    likes: { type: Number, default: 0, min: [0, 'Likes cannot be negative'] },
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    commentsCount: { type: Number, default: 0, min: [0, 'Comments count cannot be negative'] },
    publishedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

BlogSchema.index({ title: 'text', content: 'text', tags: 'text' });

export default mongoose.model('Blog', BlogSchema);
