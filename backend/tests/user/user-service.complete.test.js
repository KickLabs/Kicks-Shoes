/**
 * @fileoverview Complete UserService Tests - Full Coverage ≥90%
 * @module tests/user-service.complete
 * @description Comprehensive tests for all UserService methods
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Create mock functions
const mockFindById = jest.fn();
const mockFindOne = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockSelect = jest.fn();
const mockSave = jest.fn();

// Mock User model BEFORE importing UserService
jest.unstable_mockModule('../../src/models/User.js', () => ({
  default: {
    findById: mockFindById,
    findOne: mockFindOne,
    findByIdAndUpdate: mockFindByIdAndUpdate,
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock bcrypt
const mockCompare = jest.fn();
const mockHash = jest.fn();
const mockGenSalt = jest.fn();

jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    compare: mockCompare,
    hash: mockHash,
    genSalt: mockGenSalt,
  },
}));

// Import AFTER mocking
const { UserService } = await import('../../src/services/user.service.js');
const User = (await import('../../src/models/User.js')).default;
const logger = (await import('../../src/utils/logger.js')).default;
const bcrypt = (await import('bcryptjs')).default;

describe('UserService — Complete Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnThis();
  });

  // ================================================================
  // TEST SUITE 1: getProfileById
  // ================================================================
  describe('getProfileById', () => {
    test('US-PROFILE-001 | Should return user profile successfully', async () => {
      // Given: Valid user ID and user exists
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        fullName: 'Nguyễn Văn Test',
        email: 'test@example.com',
      };

      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindById.mockReturnValue({
        select: mockSelect.mockResolvedValue(mockUser),
      });

      // When: getProfileById is called
      const result = await UserService.getProfileById('507f1f77bcf86cd799439011');

      // Then: Should return user without password
      expect(result).toEqual(mockUser);
      expect(mockFindById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockSelect).toHaveBeenCalledWith('-password');
      expect(logger.info).toHaveBeenCalled();
    });

    test('US-PROFILE-002 | Should throw error if user not found', async () => {
      // Given: User does not exist
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindById.mockReturnValue({
        select: mockSelect.mockResolvedValue(null),
      });

      // When/Then: Should throw error
      await expect(UserService.getProfileById('507f1f77bcf86cd799439011')).rejects.toThrow(
        'User not found'
      );

      expect(logger.error).toHaveBeenCalled();
    });

    test('US-PROFILE-003 | Should throw error for invalid ObjectId format', async () => {
      // Given: Invalid ObjectId
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      // When/Then: Should throw validation error
      await expect(UserService.getProfileById('invalid-id')).rejects.toThrow(
        'Invalid user ID format'
      );

      expect(logger.error).toHaveBeenCalled();
    });

    test('US-PROFILE-004 | Should handle database errors gracefully', async () => {
      // Given: Database error
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      const dbError = new Error('Database connection failed');
      mockFindById.mockReturnValue({
        select: mockSelect.mockRejectedValue(dbError),
      });

      // When/Then: Should rethrow error
      await expect(UserService.getProfileById('507f1f77bcf86cd799439011')).rejects.toThrow(
        'Database connection failed'
      );

      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ================================================================
  // TEST SUITE 2: updateUserProfile
  // ================================================================
  describe('updateUserProfile', () => {
    test('US-UPDATE-001 | Should successfully update user profile', async () => {
      // Given: Valid update data
      const userId = '507f1f77bcf86cd799439011';
      const updateData = {
        fullName: 'Nguyễn Văn Cập Nhật',
        phone: '0987654321',
        address: '123 Đường ABC, Quận 1, TP.HCM',
      };

      const updatedUser = {
        _id: userId,
        ...updateData,
        email: 'test@example.com',
      };

      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindOne.mockResolvedValue(null); // No duplicate phone
      mockFindByIdAndUpdate.mockReturnValue({
        select: mockSelect.mockResolvedValue(updatedUser),
      });

      // When: updateUserProfile is called
      const result = await UserService.updateUserProfile(userId, updateData);

      // Then: Should return updated user
      expect(result).toEqual(updatedUser);
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: expect.objectContaining({ fullName: 'Nguyễn Văn Cập Nhật' }) },
        { new: true, runValidators: true }
      );
      expect(logger.info).toHaveBeenCalled();
    });

    test('US-UPDATE-002 | Should sanitize XSS payloads in fullName', async () => {
      // Given: Update data with XSS payload
      const userId = '507f1f77bcf86cd799439011';
      const updateData = {
        fullName: '<script>alert("XSS")</script>Nguyễn Văn An',
      };

      const updatedUser = {
        _id: userId,
        fullName: 'Nguyễn Văn An', // Sanitized
        email: 'test@example.com',
      };

      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindByIdAndUpdate.mockReturnValue({
        select: mockSelect.mockResolvedValue(updatedUser),
      });

      // When: updateUserProfile is called
      await UserService.updateUserProfile(userId, updateData);

      // Then: Should remove script tags
      const updateCall = mockFindByIdAndUpdate.mock.calls[0];
      expect(updateCall[1].$set.fullName).not.toContain('<script>');
      expect(updateCall[1].$set.fullName).toBe('Nguyễn Văn An');
    });

    test('US-UPDATE-003 | Should throw error if email already exists', async () => {
      // Given: Email already in use by another user
      const userId = '507f1f77bcf86cd799439011';
      const updateData = {
        email: 'duplicate@gmail.com',
      };

      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindOne.mockResolvedValue({
        _id: 'another-user-id',
        email: 'duplicate@gmail.com',
      });

      // When/Then: Should throw error
      await expect(UserService.updateUserProfile(userId, updateData)).rejects.toThrow(
        'Email already exists'
      );

      expect(logger.error).toHaveBeenCalled();
    });

    test('US-UPDATE-004 | Should throw error if phone already exists', async () => {
      // Given: Phone already in use by another user
      const userId = '507f1f77bcf86cd799439011';
      const updateData = {
        phone: '0987654321',
      };

      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindOne.mockResolvedValue({
        _id: 'another-user-id',
        phone: '0987654321',
      });

      // When/Then: Should throw error
      await expect(UserService.updateUserProfile(userId, updateData)).rejects.toThrow(
        'Phone number already exists'
      );

      expect(logger.error).toHaveBeenCalled();
    });

    test('US-UPDATE-005 | Should handle partial update (only fullName)', async () => {
      // Given: Update only one field
      const userId = '507f1f77bcf86cd799439011';
      const updateData = {
        fullName: 'Chỉ Đổi Tên',
      };

      const updatedUser = {
        _id: userId,
        fullName: 'Chỉ Đổi Tên',
        email: 'test@example.com',
        phone: '0987654321', // Unchanged
      };

      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindByIdAndUpdate.mockReturnValue({
        select: mockSelect.mockResolvedValue(updatedUser),
      });

      // When: Update single field
      const result = await UserService.updateUserProfile(userId, updateData);

      // Then: Should update only specified field
      expect(result.fullName).toBe('Chỉ Đổi Tên');
      const updateCall = mockFindByIdAndUpdate.mock.calls[0];
      expect(Object.keys(updateCall[1].$set)).toEqual(['fullName']);
    });

    test('US-UPDATE-006 | Should throw error if user not found', async () => {
      // Given: User does not exist
      const userId = '507f1f77bcf86cd799439011';
      const updateData = { fullName: 'Test' };

      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindByIdAndUpdate.mockReturnValue({
        select: mockSelect.mockResolvedValue(null),
      });

      // When/Then: Should throw error
      await expect(UserService.updateUserProfile(userId, updateData)).rejects.toThrow(
        'User not found'
      );

      expect(logger.error).toHaveBeenCalled();
    });

    test('US-UPDATE-007 | Should throw error for invalid ObjectId', async () => {
      // Given: Invalid ObjectId
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      // When/Then: Should throw validation error
      await expect(UserService.updateUserProfile('invalid', { fullName: 'Test' })).rejects.toThrow(
        'Invalid user ID format'
      );
    });

    test('US-UPDATE-008 | Should throw error if updateData is empty', async () => {
      // Given: Empty update data
      const userId = '507f1f77bcf86cd799439011';

      // When/Then: Should throw validation error
      await expect(UserService.updateUserProfile(userId, {})).rejects.toThrow(
        'Update data is required'
      );
    });

    test('US-UPDATE-009 | Should normalize email to lowercase', async () => {
      // Given: Email with uppercase letters
      const userId = '507f1f77bcf86cd799439011';
      const updateData = {
        email: 'TEST@EXAMPLE.COM',
      };

      const updatedUser = {
        _id: userId,
        email: 'test@example.com',
      };

      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindOne.mockResolvedValue(null); // No duplicate
      mockFindByIdAndUpdate.mockReturnValue({
        select: mockSelect.mockResolvedValue(updatedUser),
      });

      // When: Update with uppercase email
      await UserService.updateUserProfile(userId, updateData);

      // Then: Should convert to lowercase
      expect(mockFindOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        _id: { $ne: userId },
      });
    });

    test('US-UPDATE-010 | Should strip HTML tags from string fields', async () => {
      // Given: Address with HTML tags
      const userId = '507f1f77bcf86cd799439011';
      const updateData = {
        address: '<b>123 Street</b><p>City</p>',
      };

      const updatedUser = {
        _id: userId,
        address: '123 StreetCity',
      };

      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindByIdAndUpdate.mockReturnValue({
        select: mockSelect.mockResolvedValue(updatedUser),
      });

      // When: Update with HTML
      await UserService.updateUserProfile(userId, updateData);

      // Then: Should strip HTML tags
      const updateCall = mockFindByIdAndUpdate.mock.calls[0];
      expect(updateCall[1].$set.address).not.toContain('<b>');
      expect(updateCall[1].$set.address).not.toContain('<p>');
    });

    test('US-UPDATE-011 | Should handle non-string fields (dateOfBirth, gender)', async () => {
      // Given: Update data with non-string fields
      const userId = '507f1f77bcf86cd799439011';
      const dateOfBirth = new Date('1990-01-01');
      const updateData = {
        dateOfBirth: dateOfBirth,
        gender: 'male',
      };

      const updatedUser = {
        _id: userId,
        dateOfBirth: dateOfBirth,
        gender: 'male',
      };

      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindByIdAndUpdate.mockReturnValue({
        select: mockSelect.mockResolvedValue(updatedUser),
      });

      // When: Update with non-string fields
      await UserService.updateUserProfile(userId, updateData);

      // Then: Should preserve non-string values as-is
      const updateCall = mockFindByIdAndUpdate.mock.calls[0];
      expect(updateCall[1].$set.dateOfBirth).toEqual(dateOfBirth);
      expect(updateCall[1].$set.gender).toBe('male');
    });
  });

  // ================================================================
  // TEST SUITE 3: changePassword
  // ================================================================
  describe('changePassword', () => {
    test('US-PASSWORD-001 | Should successfully change password', async () => {
      // Given: Valid password change request
      const userId = '507f1f77bcf86cd799439011';
      const oldPassword = 'OldPass123!';
      const newPassword = 'NewPass456!';
      const confirmPassword = 'NewPass456!';

      const mockUser = {
        _id: userId,
        password: 'hashedOldPassword',
        save: mockSave.mockResolvedValue(true),
      };

      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindById.mockReturnValue({
        select: mockSelect.mockResolvedValue(mockUser),
      });
      mockCompare.mockResolvedValue(true); // Old password matches
      mockGenSalt.mockResolvedValue('salt');
      mockHash.mockResolvedValue('hashedNewPassword');

      // When: changePassword is called
      const result = await UserService.changePassword(
        userId,
        oldPassword,
        newPassword,
        confirmPassword
      );

      // Then: Should change password successfully
      expect(result.success).toBe(true);
      expect(mockCompare).toHaveBeenCalledWith(oldPassword, 'hashedOldPassword');
      expect(mockHash).toHaveBeenCalledWith(newPassword, 'salt');
      expect(mockUser.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });

    test('US-PASSWORD-002 | Should throw error if old password does not match', async () => {
      // Given: Wrong old password
      const userId = '507f1f77bcf86cd799439011';
      const oldPassword = 'WrongPassword';
      const newPassword = 'NewPass123!';
      const confirmPassword = 'NewPass123!';

      const mockUser = {
        _id: userId,
        password: 'hashedOldPassword',
      };

      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindById.mockReturnValue({
        select: mockSelect.mockResolvedValue(mockUser),
      });
      mockCompare.mockResolvedValue(false); // Password mismatch

      // When/Then: Should throw error
      await expect(
        UserService.changePassword(userId, oldPassword, newPassword, confirmPassword)
      ).rejects.toThrow('Old password does not match');

      expect(logger.error).toHaveBeenCalled();
    });

    test('US-PASSWORD-003 | Should throw error if newPassword and confirmPassword do not match', async () => {
      // Given: Passwords don't match
      const userId = '507f1f77bcf86cd799439011';

      // When/Then: Should throw error
      await expect(
        UserService.changePassword(userId, 'Old123!', 'New123!', 'Different456!')
      ).rejects.toThrow('New password and confirmation do not match');
    });

    test('US-PASSWORD-004 | Should throw error if password is too short', async () => {
      // Given: Password less than 6 characters
      const userId = '507f1f77bcf86cd799439011';

      // When/Then: Should throw validation error
      await expect(UserService.changePassword(userId, 'old', '12345', '12345')).rejects.toThrow(
        'New password must be at least 6 characters long'
      );
    });

    test('US-PASSWORD-005 | Should enforce password strength rules for 8+ char passwords', async () => {
      // Given: Password 8+ chars but weak
      const userId = '507f1f77bcf86cd799439011';

      // When/Then: Should throw strength error
      await expect(
        UserService.changePassword(userId, 'oldpass', 'weakpass', 'weakpass')
      ).rejects.toThrow('Password must contain at least one uppercase letter');
    });

    test('US-PASSWORD-006 | Should throw error if user not found', async () => {
      // Given: User does not exist
      const userId = '507f1f77bcf86cd799439011';

      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindById.mockReturnValue({
        select: mockSelect.mockResolvedValue(null),
      });

      // When/Then: Should throw error
      await expect(
        UserService.changePassword(userId, 'old', 'NewPass123!', 'NewPass123!')
      ).rejects.toThrow('User not found');
    });

    test('US-PASSWORD-007 | Should throw error for invalid ObjectId', async () => {
      // Given: Invalid ObjectId
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      // When/Then: Should throw validation error
      await expect(UserService.changePassword('invalid', 'old', 'new', 'new')).rejects.toThrow(
        'Invalid user ID format'
      );
    });

    test('US-PASSWORD-008 | Should throw error if any password field is missing', async () => {
      // Given: Missing fields
      const userId = '507f1f77bcf86cd799439011';

      // When/Then: Should throw validation errors
      await expect(UserService.changePassword(userId, '', 'new', 'new')).rejects.toThrow(
        'All password fields are required'
      );

      await expect(UserService.changePassword(userId, 'old', '', 'new')).rejects.toThrow(
        'All password fields are required'
      );

      await expect(UserService.changePassword(userId, 'old', 'new', '')).rejects.toThrow(
        'All password fields are required'
      );
    });

    test('US-PASSWORD-009 | Should accept password with valid strength (6-7 chars)', async () => {
      // Given: Valid 6-7 character password (no strength check for <8 chars)
      const userId = '507f1f77bcf86cd799439011';
      const oldPassword = 'OldPass';
      const newPassword = 'Pass12'; // 6 chars, no strength check
      const confirmPassword = 'Pass12';

      const mockUser = {
        _id: userId,
        password: 'hashedOldPassword',
        save: mockSave.mockResolvedValue(true),
      };

      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindById.mockReturnValue({
        select: mockSelect.mockResolvedValue(mockUser),
      });
      mockCompare.mockResolvedValue(true);
      mockGenSalt.mockResolvedValue('salt');
      mockHash.mockResolvedValue('hashedNewPassword');

      // When: changePassword with 6-char password
      const result = await UserService.changePassword(
        userId,
        oldPassword,
        newPassword,
        confirmPassword
      );

      // Then: Should succeed (no strength check for <8 chars)
      expect(result.success).toBe(true);
    });

    test('US-PASSWORD-010 | Should handle bcrypt errors gracefully', async () => {
      // Given: bcrypt.compare fails
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: userId,
        password: 'hashedOldPassword',
      };

      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      mockFindById.mockReturnValue({
        select: mockSelect.mockResolvedValue(mockUser),
      });
      mockCompare.mockRejectedValue(new Error('bcrypt error'));

      // When/Then: Should rethrow error
      await expect(
        UserService.changePassword(userId, 'old', 'NewPass123!', 'NewPass123!')
      ).rejects.toThrow('bcrypt error');

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
