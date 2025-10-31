// services/user.service.js

import User from '../models/User.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import bcrypt from 'bcryptjs';

export class UserService {
  /**
   * Get all users with pagination and optional keyword search
   * @param {Object} query - Query params (page, limit, keyword, status)
   * @returns {Promise<{ users: Array, total: number }>}
   */
  static async getAllUsers(query = {}) {
    try {
      const { page = 1, limit = 10, keyword = '', status } = query;

      const filter = {};

      if (keyword) {
        filter.$or = [
          { fullName: { $regex: keyword, $options: 'i' } },
          { email: { $regex: keyword, $options: 'i' } },
          { username: { $regex: keyword, $options: 'i' } },
        ];
      }

      if (status === 'true') {
        filter.status = true;
      } else if (status === 'false') {
        filter.status = false;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const total = await User.countDocuments(filter);
      const users = await User.find(filter)
        .select('-password')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      return { users, total };
    } catch (error) {
      logger.error('Error fetching users', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  static async getProfileById(userId) {
    try {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      const user = await User.findById(userId).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      logger.info('User profile retrieved', { userId });
      return user;
    } catch (error) {
      logger.error('Error getting user profile', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user object
   */
  static async updateUserProfile(userId, updateData) {
    try {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      // Validate updateData
      if (!updateData || Object.keys(updateData).length === 0) {
        throw new Error('Update data is required');
      }

      // Allowed fields to update
      const allowedFields = ['fullName', 'phone', 'address', 'dateOfBirth', 'gender', 'aboutMe'];
      const updates = {};

      // Filter and sanitize updates
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          // Sanitize string fields (remove potential XSS)
          if (typeof updateData[field] === 'string') {
            updates[field] = updateData[field]
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/<[^>]*>/g, '')
              .trim();
          } else {
            updates[field] = updateData[field];
          }
        }
      }

      // Check for email uniqueness if email is being updated
      if (updateData.email) {
        const existingUser = await User.findOne({
          email: updateData.email.toLowerCase(),
          _id: { $ne: userId },
        });

        if (existingUser) {
          throw new Error('Email already exists');
        }

        updates.email = updateData.email.toLowerCase();
      }

      // Check for phone uniqueness if phone is being updated
      if (updateData.phone && updates.phone) {
        const existingUser = await User.findOne({
          phone: updates.phone,
          _id: { $ne: userId },
        });

        if (existingUser) {
          throw new Error('Phone number already exists');
        }
      }

      // Find and update user
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      logger.info('User profile updated', { userId, updates: Object.keys(updates) });
      return user;
    } catch (error) {
      logger.error('Error updating user profile', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @param {string} confirmPassword - Confirm new password
   * @returns {Promise<Object>} Success message
   */
  static async changePassword(userId, oldPassword, newPassword, confirmPassword) {
    try {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      // Validate inputs
      if (!oldPassword || !newPassword || !confirmPassword) {
        throw new Error('All password fields are required');
      }

      // Check password confirmation
      if (newPassword !== confirmPassword) {
        throw new Error('New password and confirmation do not match');
      }

      // Validate password strength
      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }

      // Password strength validation (optional enhanced rules)
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (newPassword.length >= 8 && !passwordRegex.test(newPassword)) {
        throw new Error(
          'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        );
      }

      // Find user with password field
      const user = await User.findById(userId).select('+password');

      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);

      if (!isPasswordMatch) {
        throw new Error('Old password does not match');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      user.password = hashedPassword;
      await user.save();

      logger.info('User password changed successfully', { userId });
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Error changing password', { error: error.message, userId });
      throw error;
    }
  }
}
