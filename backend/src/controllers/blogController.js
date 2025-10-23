import Blog from '../models/Blog.js';
import logger from '../utils/logger.js';
import { sanitizeHtml, sanitizeText } from '../utils/sanitize.js';

const slugify = text => {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 96);
};

// Create blog
export const createBlog = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.author && req.user?._id) data.author = req.user._id;

    // Sanitize content
    if (data.title) data.title = sanitizeText(data.title);
    if (data.content) data.content = sanitizeHtml(data.content);
    if (data.summary) data.summary = sanitizeText(data.summary);
    if (data.category) data.category = sanitizeText(data.category);
    if (data.tags && Array.isArray(data.tags)) {
      data.tags = data.tags.map(tag => sanitizeText(tag)).filter(Boolean);
    }

    // Ensure slug
    if (!data.slug) {
      if (!data.title) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ field: 'title', message: 'Title is required' }],
        });
      }
      let base = slugify(data.title);
      if (!base) base = Math.random().toString(36).slice(2, 8);
      let candidate = base;
      let counter = 1;
      // Ensure uniqueness
      // eslint-disable-next-line no-constant-condition
      while (await Blog.exists({ slug: candidate })) {
        candidate = `${base}-${counter++}`;
        if (counter > 50) break; // avoid infinite loop
      }
      data.slug = candidate;
    }

    // Set publishedAt if creating as published
    if (data.status === 'published' && !data.publishedAt) {
      data.publishedAt = new Date();
    }

    const blog = await Blog.create(data);
    logger.info('Blog created', { blogId: blog._id });
    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    logger.error('Error creating blog', { error: error.message });
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => ({ field: e.path, message: e.message })),
      });
    }
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return res
        .status(400)
        .json({ success: false, message: `Duplicate value for field: ${duplicateField}` });
    }
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Get blog by id or slug
export const getBlog = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? { _id: idOrSlug } : { slug: idOrSlug };

    const blog = await Blog.findOne(query).populate('author', '-password');
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, data: blog });
  } catch (error) {
    logger.error('Error getting blog', { error: error.message });
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// List blogs with filters and pagination
export const listBlogs = async (req, res) => {
  try {
    const {
      q,
      category,
      author,
      tags,
      status,
      isFeatured,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};
    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (author) filter.author = author;
    if (status) filter.status = status;
    if (typeof isFeatured !== 'undefined')
      filter.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (tags)
      filter.tags = {
        $in: Array.isArray(tags)
          ? tags
          : String(tags)
              .split(',')
              .map(t => t.trim())
              .filter(Boolean),
      };

    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Blog.find(filter).sort(sort).skip(skip).limit(Number(limit)).populate('author', '-password'),
      Blog.countDocuments(filter),
    ]);

    res.json({ success: true, data: items, total });
  } catch (error) {
    logger.error('Error listing blogs', { error: error.message });
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Update blog
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Sanitize content
    if (updates.title) updates.title = sanitizeText(updates.title);
    if (updates.content) updates.content = sanitizeHtml(updates.content);
    if (updates.summary) updates.summary = sanitizeText(updates.summary);
    if (updates.category) updates.category = sanitizeText(updates.category);
    if (updates.tags && Array.isArray(updates.tags)) {
      updates.tags = updates.tags.map(tag => sanitizeText(tag)).filter(Boolean);
    }

    // If title updated and slug not explicitly provided, regenerate slug
    if (updates.title && !updates.slug) {
      let base = slugify(updates.title);
      if (!base) base = Math.random().toString(36).slice(2, 8);
      let candidate = base;
      let counter = 1;
      while (await Blog.exists({ slug: candidate, _id: { $ne: id } })) {
        candidate = `${base}-${counter++}`;
        if (counter > 50) break;
      }
      updates.slug = candidate;
    }

    if (
      typeof updates.status !== 'undefined' &&
      updates.status === 'published' &&
      !updates.publishedAt
    ) {
      updates.publishedAt = new Date();
    }

    const blog = await Blog.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, data: blog });
  } catch (error) {
    logger.error('Error updating blog', { error: error.message });
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation failed' });
    }
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return res
        .status(400)
        .json({ success: false, message: `Duplicate value for field: ${duplicateField}` });
    }
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Delete blog
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    logger.error('Error deleting blog', { error: error.message });
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Publish/unpublish blog
export const setPublishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { publish } = req.body; // boolean
    const updates = { status: publish ? 'published' : 'draft' };
    if (publish) updates.publishedAt = new Date();
    const blog = await Blog.findByIdAndUpdate(id, updates, { new: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, data: blog });
  } catch (error) {
    logger.error('Error setting publish status', { error: error.message });
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Feature toggle
export const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    blog.isFeatured = !blog.isFeatured;
    await blog.save();
    res.json({ success: true, data: blog });
  } catch (error) {
    logger.error('Error toggling featured', { error: error.message });
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Increment views
export const incrementViews = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, data: blog });
  } catch (error) {
    logger.error('Error incrementing views', { error: error.message });
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Like/unlike
export const setLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { like } = req.body; // boolean
    const userId = req.user?._id;

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const hasLiked = blog.likedBy?.some(u => String(u) === String(userId));

    if (like) {
      // Idempotent: if already liked, just return current state
      if (hasLiked) {
        return res.json({ success: true, data: blog });
      }
      blog.likes += 1;
      blog.likedBy = [...(blog.likedBy || []), userId];
    } else {
      // Unlike only if previously liked; otherwise no-op (idempotent)
      if (hasLiked) {
        blog.likes = Math.max(0, blog.likes - 1);
        blog.likedBy = blog.likedBy.filter(u => String(u) !== String(userId));
      } else {
        return res.json({ success: true, data: blog });
      }
    }

    await blog.save();
    res.json({ success: true, data: blog });
  } catch (error) {
    logger.error('Error setting like', { error: error.message });
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
