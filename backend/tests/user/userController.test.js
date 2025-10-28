/**
 * @fileoverview Unit Tests for UserController
 * @module tests/userController
 * @description Comprehensive unit tests for all userController functions
 * Target: ≥90% coverage
 */

import { jest } from '@jest/globals';

// Create mock functions for User Model
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockSave = jest.fn();
const mockSelect = jest.fn();
const mockPopulate = jest.fn();

// Create User constructor class
class MockUser {
  constructor(data) {
    Object.assign(this, data);
  }
  save() {
    return mockSave(this);
  }
}

// Add static methods to MockUser
MockUser.findById = mockFindById;
MockUser.findByIdAndUpdate = mockFindByIdAndUpdate;
MockUser.findByIdAndDelete = mockFindByIdAndDelete;
MockUser.findOne = mockFindOne;
MockUser.find = mockFind;

// Mock User Model BEFORE importing controller
jest.unstable_mockModule('../../src/models/User.js', () => ({
  default: MockUser,
}));

// Mock UserService
const mockGetAllUsers = jest.fn();

jest.unstable_mockModule('../../src/services/user.service.js', () => ({
  UserService: {
    getAllUsers: mockGetAllUsers,
  },
}));

// Mock ErrorResponse
class MockErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

const mockErrorResponse = jest.fn((message, statusCode) => {
  return new MockErrorResponse(message, statusCode);
});

jest.unstable_mockModule('../../src/utils/errorResponse.js', () => ({
  ErrorResponse: MockErrorResponse,
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

// Import AFTER mocking
const userController = await import('../../src/controllers/userController.js');
const User = (await import('../../src/models/User.js')).default;
const { UserService } = await import('../../src/services/user.service.js');
const logger = (await import('../../src/utils/logger.js')).default;

// Helper to create mock req, res, next
const createMockReqRes = (overrides = {}) => {
  const req = {
    params: {},
    query: {},
    body: {},
    user: { _id: 'user123' },
    file: null,
    ...overrides.req,
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    ...overrides.res,
  };

  const next = jest.fn();

  return { req, res, next };
};

describe('UserController — Complete Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnThis();
    mockPopulate.mockReturnThis();
  });

  // ================================================================
  // TEST SUITE 1: getUsers
  // ================================================================
  describe('getUsers', () => {
    test('UC-GET-001 | Should return users list with pagination (200)', async () => {
      // Given
      const mockUsers = [
        { _id: '1', fullName: 'Nguyễn Văn A', email: 'a@gmail.com' },
        { _id: '2', fullName: 'Trần Thị B', email: 'b@gmail.com' },
      ];
      const { req, res } = createMockReqRes({
        req: { query: { page: 1, limit: 10 } },
      });

      mockGetAllUsers.mockResolvedValue({ users: mockUsers, total: 2 });

      // When
      await userController.getUsers(req, res);

      // Then
      expect(mockGetAllUsers).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
        total: 2,
      });
    });

    test('UC-GET-002 | Should return 500 on service error', async () => {
      // Given
      const { req, res } = createMockReqRes();
      mockGetAllUsers.mockRejectedValue(new Error('Database error'));

      // When
      await userController.getUsers(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  // ================================================================
  // TEST SUITE 2: getUsersIsActive
  // ================================================================
  describe('getUsersIsActive', () => {
    test('UC-ACTIVE-001 | Should return only active users (200)', async () => {
      // Given
      const mockActiveUsers = [
        { _id: '1', fullName: 'Active User 1', status: true },
        { _id: '2', fullName: 'Active User 2', status: true },
      ];
      const { req, res } = createMockReqRes();

      mockFind.mockReturnValue({
        select: mockSelect.mockResolvedValue(mockActiveUsers),
      });

      // When
      await userController.getUsersIsActive(req, res);

      // Then
      expect(mockFind).toHaveBeenCalledWith({ status: true });
      expect(mockSelect).toHaveBeenCalledWith('-password');
      expect(res.json).toHaveBeenCalledWith(mockActiveUsers);
    });

    test('UC-ACTIVE-002 | Should return 500 on database error', async () => {
      // Given
      const { req, res } = createMockReqRes();
      mockFind.mockReturnValue({
        select: mockSelect.mockRejectedValue(new Error('DB connection failed')),
      });

      // When
      await userController.getUsersIsActive(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB connection failed' });
    });
  });

  // ================================================================
  // TEST SUITE 3: getUser
  // ================================================================
  describe('getUser', () => {
    test('UC-GETONE-001 | Should return user by id (200)', async () => {
      // Given
      const mockUser = { _id: 'user123', fullName: 'Lê Văn C', email: 'c@gmail.com' };
      const { req, res } = createMockReqRes({
        req: { params: { id: 'user123' } },
      });

      mockFindById.mockReturnValue({
        select: mockSelect.mockResolvedValue(mockUser),
      });

      // When
      await userController.getUser(req, res);

      // Then
      expect(mockFindById).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    test('UC-GETONE-002 | Should return 404 if user not found', async () => {
      // Given
      const { req, res } = createMockReqRes({
        req: { params: { id: 'nonexistent' } },
      });

      mockFindById.mockReturnValue({
        select: mockSelect.mockResolvedValue(null),
      });

      // When
      await userController.getUser(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    test('UC-GETONE-003 | Should return 500 on database error', async () => {
      // Given
      const { req, res } = createMockReqRes({
        req: { params: { id: 'user123' } },
      });

      mockFindById.mockReturnValue({
        select: mockSelect.mockRejectedValue(new Error('Database error')),
      });

      // When
      await userController.getUser(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  // ================================================================
  // TEST SUITE 4: createUser
  // ================================================================
  describe('createUser', () => {
    test('UC-CREATE-001 | Should create new user (201)', async () => {
      // Given
      const newUserData = {
        fullName: 'Phạm Thị D',
        email: 'd@gmail.com',
        password: 'Password123!',
      };
      const savedUser = { _id: 'new123', ...newUserData };
      const { req, res } = createMockReqRes({
        req: { body: newUserData },
      });

      mockSave.mockResolvedValue(savedUser);

      // When
      await userController.createUser(req, res);

      // Then
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(savedUser);
    });

    test('UC-CREATE-002 | Should return 400 on validation error', async () => {
      // Given
      const { req, res } = createMockReqRes({
        req: { body: { email: 'invalid' } },
      });

      mockSave.mockRejectedValue(new Error('Validation failed'));

      // When
      await userController.createUser(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Validation failed' });
    });
  });

  // ================================================================
  // TEST SUITE 5: updateUser
  // ================================================================
  describe('updateUser', () => {
    test('UC-UPDATE-001 | Should update user (200)', async () => {
      // Given
      const updateData = { fullName: 'Updated Name' };
      const updatedUser = { _id: 'user123', ...updateData };
      const { req, res } = createMockReqRes({
        req: { params: { id: 'user123' }, body: updateData },
      });

      mockFindByIdAndUpdate.mockReturnValue({
        select: mockSelect.mockResolvedValue(updatedUser),
      });

      // When
      await userController.updateUser(req, res);

      // Then
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('user123', updateData, { new: true });
      expect(res.json).toHaveBeenCalledWith(updatedUser);
    });

    test('UC-UPDATE-002 | Should return 404 if user not found', async () => {
      // Given
      const { req, res } = createMockReqRes({
        req: { params: { id: 'nonexistent' }, body: { fullName: 'Test' } },
      });

      mockFindByIdAndUpdate.mockReturnValue({
        select: mockSelect.mockResolvedValue(null),
      });

      // When
      await userController.updateUser(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    test('UC-UPDATE-003 | Should return 400 on validation error', async () => {
      // Given
      const { req, res } = createMockReqRes({
        req: { params: { id: 'user123' }, body: { email: 'duplicate@test.com' } },
      });

      mockFindByIdAndUpdate.mockReturnValue({
        select: mockSelect.mockRejectedValue(new Error('Email already exists')),
      });

      // When
      await userController.updateUser(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already exists' });
    });
  });

  // ================================================================
  // TEST SUITE 6: deleteUser
  // ================================================================
  describe('deleteUser', () => {
    test('UC-DELETE-001 | Should delete user (200)', async () => {
      // Given
      const deletedUser = { _id: 'user123', fullName: 'Deleted User' };
      const { req, res } = createMockReqRes({
        req: { params: { id: 'user123' } },
      });

      mockFindByIdAndDelete.mockResolvedValue(deletedUser);

      // When
      await userController.deleteUser(req, res);

      // Then
      expect(mockFindByIdAndDelete).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
    });

    test('UC-DELETE-002 | Should return 404 if user not found', async () => {
      // Given
      const { req, res } = createMockReqRes({
        req: { params: { id: 'nonexistent' } },
      });

      mockFindByIdAndDelete.mockResolvedValue(null);

      // When
      await userController.deleteUser(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    test('UC-DELETE-003 | Should return 500 on database error', async () => {
      // Given
      const { req, res } = createMockReqRes({
        req: { params: { id: 'user123' } },
      });

      mockFindByIdAndDelete.mockRejectedValue(new Error('Database error'));

      // When
      await userController.deleteUser(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  // ================================================================
  // TEST SUITE 7: getUserProfile (by username)
  // ================================================================
  describe('getUserProfile', () => {
    test('UC-PROFILE-001 | Should return verified user profile (200)', async () => {
      // Given
      const mockUser = {
        _id: 'user123',
        username: 'nguyenvana',
        fullName: 'Nguyễn Văn A',
        isVerified: true,
        role: { name: 'customer' },
      };
      const { req, res, next } = createMockReqRes({
        req: { params: { username: 'nguyenvana' } },
      });

      mockFindOne.mockReturnValue({
        select: mockSelect.mockReturnValue({
          populate: mockPopulate.mockResolvedValue(mockUser),
        }),
      });

      // When
      await userController.getUserProfile(req, res, next);

      // Then
      expect(mockFindOne).toHaveBeenCalledWith({ username: 'nguyenvana' });
      expect(res.json).toHaveBeenCalledWith(mockUser);
      expect(next).not.toHaveBeenCalled();
    });

    test('UC-PROFILE-002 | Should return limited info for unverified user (200)', async () => {
      // Given
      const mockUser = {
        _id: 'user123',
        username: 'unverified',
        avatar: 'avatar.jpg',
        isVerified: false,
        role: { name: 'customer' },
      };
      const { req, res, next } = createMockReqRes({
        req: { params: { username: 'unverified' } },
      });

      mockFindOne.mockReturnValue({
        select: mockSelect.mockReturnValue({
          populate: mockPopulate.mockResolvedValue(mockUser),
        }),
      });

      // When
      await userController.getUserProfile(req, res, next);

      // Then
      expect(res.json).toHaveBeenCalledWith({
        username: 'unverified',
        avatar: 'avatar.jpg',
        role: { name: 'customer' },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('UC-PROFILE-003 | Should call next with ErrorResponse if user not found (404)', async () => {
      // Given
      const { req, res, next } = createMockReqRes({
        req: { params: { username: 'nonexistent' } },
      });

      mockFindOne.mockReturnValue({
        select: mockSelect.mockReturnValue({
          populate: mockPopulate.mockResolvedValue(null),
        }),
      });

      // When
      await userController.getUserProfile(req, res, next);

      // Then
      expect(next).toHaveBeenCalled();
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.message).toBe('User not found');
      expect(errorArg.statusCode).toBe(404);
      expect(logger.error).not.toHaveBeenCalled();
    });

    test('UC-PROFILE-004 | Should call next with error on database failure (500)', async () => {
      // Given
      const dbError = new Error('Database connection failed');
      const { req, res, next } = createMockReqRes({
        req: { params: { username: 'test' } },
      });

      mockFindOne.mockReturnValue({
        select: mockSelect.mockReturnValue({
          populate: mockPopulate.mockRejectedValue(dbError),
        }),
      });

      // When
      await userController.getUserProfile(req, res, next);

      // Then
      expect(logger.error).toHaveBeenCalledWith(
        'Error in getUserProfile',
        expect.objectContaining({
          error: 'Database connection failed',
          stack: expect.any(String),
        })
      );
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  // ================================================================
  // TEST SUITE 8: updateUserProfile
  // ================================================================
  describe('updateUserProfile', () => {
    test('UC-UPPROF-001 | Should update user profile without file (200)', async () => {
      // Given
      const updateData = {
        fullName: 'Nguyễn Văn Updated',
        phone: '0987654321',
        address: '123 Test Street',
      };
      const updatedUser = { _id: 'user123', ...updateData };
      const { req, res, next } = createMockReqRes({
        req: { body: updateData, user: { _id: 'user123' } },
      });

      mockFindByIdAndUpdate.mockReturnValue({
        select: mockSelect.mockResolvedValue(updatedUser),
      });

      // When
      await userController.updateUserProfile(req, res, next);

      // Then
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $set: updateData },
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedUser);
      expect(logger.info).toHaveBeenCalledWith('Profile updated successfully', expect.any(Object));
    });

    test('UC-UPPROF-002 | Should update profile with file upload (200)', async () => {
      // Given
      const mockFile = {
        fieldname: 'avatar',
        originalname: 'avatar.jpg',
        path: 'https://cloudinary.com/avatar.jpg',
        filename: 'avatar.jpg',
        mimetype: 'image/jpeg',
      };
      const updateData = { fullName: 'Test User' };
      const updatedUser = {
        _id: 'user123',
        fullName: 'Test User',
        avatar: mockFile.path,
      };
      const { req, res, next } = createMockReqRes({
        req: {
          body: updateData,
          user: { _id: 'user123' },
          file: mockFile,
        },
      });

      mockFindByIdAndUpdate.mockReturnValue({
        select: mockSelect.mockResolvedValue(updatedUser),
      });

      // When
      await userController.updateUserProfile(req, res, next);

      // Then
      expect(logger.info).toHaveBeenCalledWith('File uploaded to Cloudinary', {
        path: mockFile.path,
      });
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $set: { ...updateData, avatar: mockFile.path } },
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedUser);
    });

    test('UC-UPPROF-003 | Should filter out disallowed fields', async () => {
      // Given
      const updateData = {
        fullName: 'Allowed',
        email: 'notallowed@test.com', // Not in allowedUpdates
        role: 'admin', // Not in allowedUpdates
        password: 'hack123', // Not in allowedUpdates
      };
      const updatedUser = { _id: 'user123', fullName: 'Allowed' };
      const { req, res, next } = createMockReqRes({
        req: { body: updateData, user: { _id: 'user123' } },
      });

      mockFindByIdAndUpdate.mockReturnValue({
        select: mockSelect.mockResolvedValue(updatedUser),
      });

      // When
      await userController.updateUserProfile(req, res, next);

      // Then
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $set: { fullName: 'Allowed' } }, // Only allowed field
        { new: true, runValidators: true }
      );
    });

    test('UC-UPPROF-004 | Should call next with ErrorResponse if user not found (404)', async () => {
      // Given
      const { req, res, next } = createMockReqRes({
        req: { body: { fullName: 'Test' }, user: { _id: 'nonexistent' } },
      });

      mockFindByIdAndUpdate.mockReturnValue({
        select: mockSelect.mockResolvedValue(null),
      });

      // When
      await userController.updateUserProfile(req, res, next);

      // Then
      expect(next).toHaveBeenCalled();
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.message).toBe('User not found');
      expect(errorArg.statusCode).toBe(404);
    });

    test('UC-UPPROF-005 | Should call next with error on database failure (500)', async () => {
      // Given
      const dbError = new Error('Database update failed');
      const { req, res, next } = createMockReqRes({
        req: { body: { fullName: 'Test' }, user: { _id: 'user123' } },
      });

      mockFindByIdAndUpdate.mockReturnValue({
        select: mockSelect.mockRejectedValue(dbError),
      });

      // When
      await userController.updateUserProfile(req, res, next);

      // Then
      expect(logger.error).toHaveBeenCalledWith(
        'Error in updateUserProfile',
        expect.objectContaining({
          error: 'Database update failed',
          stack: expect.any(String),
        })
      );
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  // ================================================================
  // TEST SUITE 9: toggleUserStatus
  // ================================================================
  describe('toggleUserStatus', () => {
    test('UC-TOGGLE-001 | Should ban an active user (200)', async () => {
      // Given
      const mockUser = {
        _id: 'user123',
        status: true,
        save: mockSave,
      };
      const { req, res } = createMockReqRes({
        req: { params: { id: 'user123' } },
      });

      mockFindById.mockReturnValue({
        select: mockSelect.mockResolvedValue(mockUser),
      });
      mockSave.mockResolvedValue({ ...mockUser, status: false });

      // When
      await userController.toggleUserStatus(req, res);

      // Then
      expect(mockUser.status).toBe(false);
      expect(mockSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'User has been banned',
        status: false,
      });
    });

    test('UC-TOGGLE-002 | Should unban a banned user (200)', async () => {
      // Given
      const mockUser = {
        _id: 'user123',
        status: false,
        save: mockSave,
      };
      const { req, res } = createMockReqRes({
        req: { params: { id: 'user123' } },
      });

      mockFindById.mockReturnValue({
        select: mockSelect.mockResolvedValue(mockUser),
      });
      mockSave.mockResolvedValue({ ...mockUser, status: true });

      // When
      await userController.toggleUserStatus(req, res);

      // Then
      expect(mockUser.status).toBe(true);
      expect(mockSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'User has been unbanned',
        status: true,
      });
    });

    test('UC-TOGGLE-003 | Should return 404 if user not found', async () => {
      // Given
      const { req, res } = createMockReqRes({
        req: { params: { id: 'nonexistent' } },
      });

      mockFindById.mockReturnValue({
        select: mockSelect.mockResolvedValue(null),
      });

      // When
      await userController.toggleUserStatus(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    test('UC-TOGGLE-004 | Should return 500 on save error', async () => {
      // Given
      const mockUser = {
        _id: 'user123',
        status: true,
        save: mockSave,
      };
      const { req, res } = createMockReqRes({
        req: { params: { id: 'user123' } },
      });

      mockFindById.mockReturnValue({
        select: mockSelect.mockResolvedValue(mockUser),
      });
      mockSave.mockRejectedValue(new Error('Save failed'));

      // When
      await userController.toggleUserStatus(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Save failed' });
    });
  });

  // ================================================================
  // TEST SUITE 10: getShopUser
  // ================================================================
  describe('getShopUser', () => {
    test('UC-SHOP-001 | Should return shop user (200)', async () => {
      // Given
      const mockShopUser = {
        _id: 'shop123',
        fullName: 'Kicks Shoes Store',
        role: 'shop',
      };
      const { req, res } = createMockReqRes();

      mockFindOne.mockReturnValue({
        select: mockSelect.mockResolvedValue(mockShopUser),
      });

      // When
      await userController.getShopUser(req, res);

      // Then
      expect(mockFindOne).toHaveBeenCalledWith({ role: 'shop' });
      expect(res.json).toHaveBeenCalledWith(mockShopUser);
    });

    test('UC-SHOP-002 | Should return 404 if shop not found', async () => {
      // Given
      const { req, res } = createMockReqRes();

      mockFindOne.mockReturnValue({
        select: mockSelect.mockResolvedValue(null),
      });

      // When
      await userController.getShopUser(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Shop not found' });
    });

    test('UC-SHOP-003 | Should return 500 on database error', async () => {
      // Given
      const { req, res } = createMockReqRes();

      mockFindOne.mockReturnValue({
        select: mockSelect.mockRejectedValue(new Error('Database error')),
      });

      // When
      await userController.getShopUser(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });
});
