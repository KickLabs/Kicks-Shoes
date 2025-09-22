import Blog from '../models/Blog.js';
import BlogComment from '../models/BlogComment.js';
import logger from '../utils/logger.js';
import { sanitizeText } from '../utils/sanitize.js';

// Helper to safely adjust commentsCount
const adjustCommentsCount = async (blogId, delta) => {
  try {
    const updated = await Blog.findByIdAndUpdate(
      blogId,
      { $inc: { commentsCount: delta } },
      { new: true }
    );
    if (updated && updated.commentsCount < 0) {
      updated.commentsCount = 0;
      await updated.save();
    }
  } catch (e) {
    logger.error('Failed adjusting commentsCount', { blogId, delta, error: e.message });
  }
};

// Create a comment
export const createComment = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.user && req.user?._id) data.user = req.user._id;

    // Sanitize comment content
    if (data.content) data.content = sanitizeText(data.content);

    const comment = await BlogComment.create(data);
    await adjustCommentsCount(comment.blog, 1);
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    logger.error('Error creating comment', { error: error.message });
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation failed' });
    }
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// List comments for a blog with threading support
export const listComments = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { parentComment = null, page = 1, limit = 10 } = req.query;
    const filter = { blog: blogId, parentComment: parentComment || null, status: true };
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      BlogComment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('user', '-password'),
      BlogComment.countDocuments(filter),
    ]);
    res.json({ success: true, data: items, total });
  } catch (error) {
    logger.error('Error listing comments', { error: error.message });
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Update comment
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Sanitize comment content
    if (updates.content) updates.content = sanitizeText(updates.content);

    const comment = await BlogComment.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    res.json({ success: true, data: comment });
  } catch (error) {
    logger.error('Error updating comment', { error: error.message });
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Delete comment (soft by status=false or hard delete based on query)
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard = 'false' } = req.query;
    const existing = await BlogComment.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (hard === 'true') {
      await BlogComment.findByIdAndDelete(id);
    } else {
      existing.status = false;
      await existing.save();
    }

    await adjustCommentsCount(existing.blog, -1);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    logger.error('Error deleting comment', { error: error.message });
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Like/unlike a comment
export const setCommentLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { like } = req.body; // boolean
    const comment = await BlogComment.findByIdAndUpdate(
      id,
      { $inc: { likes: like ? 1 : -1 } },
      { new: true }
    );
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.likes < 0) {
      comment.likes = 0;
      await comment.save();
    }
    res.json({ success: true, data: comment });
  } catch (error) {
    logger.error('Error liking comment', { error: error.message });
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
