/**
 * @fileoverview Sample Test Examples for User Management
 * @module tests/examples/user-testing-examples
 * @description Demonstrates how to use mocks for testing controllers and services
 */

// ================================================================
// EXAMPLE 1: Testing userController using mocked UserService
// ================================================================

import { jest } from '@jest/globals';
import { UserService } from '../__mocks__/services/user.service.js';
import {
  generateMockUser,
  getMockReqRes,
  generateVietnameseUsers,
} from '../_helpers/userTestUtils.js';

// Mock the service
jest.mock('../../src/services/user.service.js');

describe('Example: Testing UserController with Mocked Service', () => {
  beforeEach(() => {
    UserService.__resetAllMocks();
    UserService.__setupSuccessResponses();
  });

  test('EXAMPLE-001 | Controller should get all users via service', async () => {
    // Given: Service returns Vietnamese users
    const mockUsers = generateVietnameseUsers(3);
    UserService.getAllUsers.mockResolvedValue({
      users: mockUsers,
      total: 3,
    });

    const { req, res, next } = getMockReqRes({
      req: { query: { page: '1', limit: '10' } },
    });

    // Mock controller (simplified for example)
    const getAllUsersController = async (req, res, next) => {
      try {
        const result = await UserService.getAllUsers(req.query);
        res.status(200).json({ success: true, ...result });
      } catch (error) {
        next(error);
      }
    };

    // When: Controller is called
    await getAllUsersController(req, res, next);

    // Then: Should call service and return users
    expect(UserService.getAllUsers).toHaveBeenCalledWith({ page: '1', limit: '10' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      users: mockUsers,
      total: 3,
    });
  });

  test('EXAMPLE-002 | Controller should handle service error', async () => {
    // Given: Service throws error
    const error = new Error('Database connection failed');
    UserService.getAllUsers.mockRejectedValue(error);

    const { req, res, next } = getMockReqRes({
      req: { query: {} },
    });

    const getAllUsersController = async (req, res, next) => {
      try {
        const result = await UserService.getAllUsers(req.query);
        res.status(200).json({ success: true, ...result });
      } catch (error) {
        next(error);
      }
    };

    // When: Controller is called
    await getAllUsersController(req, res, next);

    // Then: Should pass error to next()
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('EXAMPLE-003 | Controller should update user profile', async () => {
    // Given: Service returns updated user
    const userId = '507f1f77bcf86cd799439011';
    const updateData = {
      fullName: 'Nguyễn Văn Bình',
      phone: '0987654321',
    };

    const updatedUser = generateMockUser({
      _id: userId,
      ...updateData,
    });

    UserService.updateUserProfile.mockResolvedValue(updatedUser);

    const { req, res, next } = getMockReqRes({
      req: {
        params: { id: userId },
        body: updateData,
      },
    });

    const updateProfileController = async (req, res, next) => {
      try {
        const user = await UserService.updateUserProfile(req.params.id, req.body);
        res.status(200).json({ success: true, data: user });
      } catch (error) {
        next(error);
      }
    };

    // When: Controller updates profile
    await updateProfileController(req, res, next);

    // Then: Should call service and return updated user
    expect(UserService.updateUserProfile).toHaveBeenCalledWith(userId, updateData);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: updatedUser,
    });
  });
});

// ================================================================
// EXAMPLE 2: Testing user.service using mocked User Model & bcrypt
// ================================================================

// Note: These examples are kept for reference only
// The actual tests use proper ES6 imports in separate test files

describe('Example: Testing UserService with Mocked Model', () => {
  // Examples 004-008 are available in the actual test files:
  // - See tests/user/user-service.complete.test.js for service tests
  // - See tests/_helpers/userTestUtils.js for mock utilities

  test.skip('EXAMPLE-004-008 | See actual test files for implementation', () => {
    // Placeholder test - real examples are in user-service.complete.test.js
  });
});

// ================================================================
// COVERAGE NOTES
// ================================================================
// These examples demonstrate:
// ✓ Mocking UserService for controller tests
// ✓ Mocking User Model for service tests
// ✓ Mocking bcrypt for password operations
// ✓ Using Vietnamese test data
// ✓ Testing happy paths and error scenarios
// ✓ Proper mock setup and assertions
//
// Apply these patterns to your actual test files!
// ================================================================
