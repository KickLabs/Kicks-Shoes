import Feedback from '../models/Feedback.js';
import Product from '../models/Product.js';

/**
 * Create a new feedback
 * @param {Object} feedbackData - Feedback data
 * @returns {Promise<Feedback>} Created feedback
 */
export class FeedbackService {
  static async createFeedback(feedbackData) {
    try {
      const feedback = new Feedback(feedbackData);
      await feedback.save();

      // Optionally update product rating based on feedback
      const product = await Product.findById(feedbackData.product);
      if (product) {
        product.rating = await Feedback.aggregate([
          { $match: { product: feedbackData.product, status: 'approved' } },
          { $group: { _id: '$product', avgRating: { $avg: '$rating' } } },
        ]);
        await product.save();
      }

      return feedback;
    } catch (error) {
      throw new Error(error);
    }
  }

  static async updateFeedback(feedbackId, updateData) {
    try {
      const feedback = await Feedback.findByIdAndUpdate(feedbackId, updateData, { new: true });
      return feedback;
    } catch (error) {
      throw new Error(error);
    }
  }

  static async deleteFeedback(feedbackId) {
    try {
      const feedback = await Feedback.findByIdAndDelete(feedbackId);
      return feedback;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Get feedbacks with optional filters
   * @param {Object} filter - The filter object to apply
   * @returns {Promise<Array>} - A list of feedbacks matching the filter
   */
  static async getFeedbacks(filter = {}) {
    try {
      // Truy vấn tất cả feedbacks với điều kiện lọc
      const feedbacks = await Feedback.find(filter).populate('user', 'name');
      return feedbacks;
    } catch (error) {
      throw new Error(error);
    }
  }
}
