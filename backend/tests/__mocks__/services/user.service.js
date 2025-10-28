/**
 * @fileoverview Mock UserService for Controller Testing
 * @module __mocks__/services/user.service
 * @description Jest mock for UserService with configurable responses
 */

import { jest } from '@jest/globals';

// Create mock functions
const getAllUsers = jest.fn();
const updateUserProfile = jest.fn();
const changePassword = jest.fn();
const getProfileById = jest.fn();

// Helper: Reset all mocks
const __resetAllMocks = () => {
  getAllUsers.mockReset();
  updateUserProfile.mockReset();
  changePassword.mockReset();
  getProfileById.mockReset();
};

// Helper: Setup default success responses
const __setupSuccessResponses = () => {
  getAllUsers.mockResolvedValue({
    users: [
      {
        _id: '1',
        fullName: 'Nguyễn Văn A',
        username: 'nguyenvana',
        email: 'nguyenvana@gmail.com',
        phone: '0912345678',
        status: true,
      },
    ],
    total: 1,
  });

  updateUserProfile.mockImplementation(async (userId, updateData) => {
    return {
      _id: userId,
      fullName: updateData.fullName || 'Nguyễn Văn A',
      username: 'nguyenvana',
      email: updateData.email || 'nguyenvana@gmail.com',
      phone: updateData.phone || '0912345678',
      updatedAt: new Date(),
    };
  });

  changePassword.mockResolvedValue({
    success: true,
    message: 'Password changed successfully',
  });

  getProfileById.mockResolvedValue({
    _id: '1',
    fullName: 'Nguyễn Văn A',
    username: 'nguyenvana',
    email: 'nguyenvana@gmail.com',
    phone: '0912345678',
    role: 'customer',
    status: true,
  });
};

// Helper: Setup specific error scenarios
const __setupErrorScenarios = () => {
  // User not found error
  getProfileById.mockRejectedValue(new Error('User not found'));

  // Old password mismatch
  changePassword.mockRejectedValue(new Error('Old password does not match'));

  // Validation error (duplicate email)
  updateUserProfile.mockRejectedValue({
    code: 11000,
    message: 'Email already exists',
  });
};

// Export as UserService class mock
export const UserService = {
  getAllUsers,
  updateUserProfile,
  changePassword,
  getProfileById,
  __resetAllMocks,
  __setupSuccessResponses,
  __setupErrorScenarios,
};
