import Feedback from '../models/Feedback.js';
import Product from '../models/Product.js';
import Report from '../models/Report.js';
import mongoose from 'mongoose';
/**
 * Create a new feedback
 * @param {Object} feedbackData - Feedback data
 * @returns {Promise<Feedback>} Created feedback
 */
export class FeedbackService {
  static async findOne(query) {
    return Feedback.findOne(query);
  }

  static async createFeedback(feedbackData) {
    try {
      const feedback = new Feedback(feedbackData);
      await feedback.save();

      // Optionally update product rating based on feedback
      const product = await Product.findById(feedbackData.product);
      if (product) {
        const stats = await Feedback.aggregate([
          {
            $match: {
              product: new mongoose.Types.ObjectId(feedbackData.product),
              status: 'approved',
            },
          },
          {
            $group: {
              _id: '$product',
              avgRating: { $avg: '$rating' },
            },
          },
        ]);
        product.rating = stats.length ? stats[0].avgRating : feedbackData.rating;
        await product.save();
      }

      return feedback;
    } catch (error) {
      throw error;
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

  static async deleteFeedback(feedbackId, deletedBy = 'user') {
    try {
      if (deletedBy === 'user') {
        // Hard delete for user self-deletion to avoid duplicate review issues
        const feedback = await Feedback.findByIdAndDelete(feedbackId);
        return feedback;
      } else {
        // Soft delete for admin deletion
        const feedback = await Feedback.findByIdAndUpdate(
          feedbackId,
          { status: false, deletedBy },
          { new: true }
        );
        return feedback;
      }
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
      if (filter) filter.status = true;
      const feedbacks = await Feedback.find(filter).populate('user', 'name');
      return feedbacks;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Report a feedback
   * @param {Object} reportData - Thông tin báo cáo
   * @returns {Promise<Report>} - Đối tượng báo cáo được lưu
   */
  static async reportFeedback(reportData) {
    try {
      const report = new Report(reportData);
      await report.save();
      return report;
    } catch (error) {
      throw new Error(error);
    }
  }

  static async getFeedbackById(feedbackId) {
    try {
      const feedback = await Feedback.findById(feedbackId)
        .populate('user', 'name')
        .populate('product', 'name');
      return feedback;
    } catch (error) {
      throw new Error(error);
    }
  }
}
