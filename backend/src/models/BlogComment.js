import mongoose from 'mongoose';
const { Schema } = mongoose;

const BlogCommentSchema = new Schema(
  {
    blog: { type: Schema.Types.ObjectId, ref: 'Blog', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true },
    parentComment: { type: Schema.Types.ObjectId, ref: 'BlogComment', default: null, index: true },
    likes: { type: Number, default: 0, min: [0, 'Likes cannot be negative'] },
    status: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

BlogCommentSchema.index({ blog: 1, parentComment: 1, createdAt: -1 });

export default mongoose.model('BlogComment', BlogCommentSchema);
