/**
 * @fileoverview User Test Utilities - Vietnamese Data & Factories
 * @module tests/_helpers/userTestUtils
 * @description Utilities for testing user management with realistic Vietnamese data
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';

/**
 * Generate realistic Vietnamese user data (POJO)
 * @param {Object} overrides - Fields to override
 * @returns {Object} User data object
 */
function generateMockUser(overrides = {}) {
  const vietnameseUsers = [
    {
      fullName: 'Nguyễn Văn Anh',
      username: 'nguyenvananh',
      email: 'nguyenvananh@gmail.com',
      phone: '0912345678',
    },
    {
      fullName: 'Trần Thị Bình',
      username: 'tranthib',
      email: 'tranthib@yahoo.com.vn',
      phone: '0987654321',
    },
    {
      fullName: 'Lê Hoàng Cường',
      username: 'lehoangcuong',
      email: 'lehoangcuong@fpt.vn',
      phone: '0901234567',
    },
    {
      fullName: 'Phạm Thu Hà',
      username: 'phamthuha',
      email: 'phamthuha@vnpt.vn',
      phone: '0976543210',
    },
    {
      fullName: 'Vũ Minh Đức',
      username: 'vuminhduc',
      email: 'vuminhduc@gmail.com',
      phone: '0965432109',
    },
  ];

  const randomUser = vietnameseUsers[Math.floor(Math.random() * vietnameseUsers.length)];

  return {
    _id: new mongoose.Types.ObjectId().toString(),
    fullName: randomUser.fullName,
    username: randomUser.username,
    email: randomUser.email,
    password: 'MatKhau123!@#', // Vietnamese for "Password"
    phone: randomUser.phone,
    address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    dateOfBirth: new Date('1995-01-15'),
    gender: 'male',
    role: 'customer',
    status: true,
    isVerified: true,
    reward_point: 100,
    avatar: 'https://res.cloudinary.com/demo/avatar-1.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Generate mock Mongoose User document (with methods)
 * @param {Object} overrides - Fields to override
 * @returns {Object} Mock User document with Mongoose methods
 */
function generateMockUserModel(overrides = {}) {
  const userData = generateMockUser(overrides);

  return {
    ...userData,
    // Mongoose document methods
    save: jest.fn().mockResolvedValue(userData),
    remove: jest.fn().mockResolvedValue(userData),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),

    // User model instance methods
    matchPassword: jest.fn().mockResolvedValue(true),

    // Mongoose metadata
    _doc: userData,
    $isNew: false,
    $isEmpty: false,

    // toObject/toJSON
    toObject: jest.fn().mockReturnValue(userData),
    toJSON: jest.fn().mockReturnValue({ ...userData, password: undefined }),

    // isModified check (for password hashing)
    isModified: jest.fn().mockReturnValue(false),
  };
}

/**
 * Generate mock Express req/res/next objects
 * @param {Object} overrides - Override defaults
 * @returns {Object} { req, res, next }
 */
function getMockReqRes(overrides = {}) {
  const req = {
    params: {},
    query: {},
    body: {},
    headers: {},
    user: null,
    file: null,
    ...overrides.req,
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    ...overrides.res,
  };

  const next = jest.fn();

  return { req, res, next };
}

/**
 * Create array of Vietnamese test users
 * @param {number} count - Number of users to generate
 * @returns {Array} Array of user objects
 */
function generateVietnameseUsers(count = 5) {
  const users = [];
  const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
  const middleNames = ['Văn', 'Thị', 'Minh', 'Thu', 'Hoàng', 'Anh', 'Tuấn', 'Hà'];
  const firstNames = [
    'Anh',
    'Bình',
    'Cường',
    'Dũng',
    'Linh',
    'Mai',
    'Nam',
    'Phương',
    'Quân',
    'Tâm',
  ];

  for (let i = 0; i < count; i++) {
    const lastName = lastNames[i % lastNames.length];
    const middleName = middleNames[i % middleNames.length];
    const firstName = firstNames[i % firstNames.length];
    const fullName = `${lastName} ${middleName} ${firstName}`;
    const username = fullName
      .toLowerCase()
      .replace(/\s+/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    users.push(
      generateMockUser({
        fullName,
        username: `${username}${i + 1}`,
        email: `${username}${i + 1}@gmail.com`,
        phone: `09${String(i).padStart(8, '0')}`,
      })
    );
  }

  return users;
}

/**
 * Create mock validation error (Mongoose)
 * @param {string} field - Field that failed validation
 * @param {string} message - Error message
 * @returns {Error} Mock ValidationError
 */
function createValidationError(field, message) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.errors = {
    [field]: {
      message,
      kind: 'required',
      path: field,
    },
  };
  return error;
}

/**
 * Create mock duplicate key error (MongoDB E11000)
 * @param {string} field - Field with duplicate value
 * @returns {Error} Mock duplicate key error
 */
function createDuplicateKeyError(field = 'email') {
  const error = new Error(`E11000 duplicate key error`);
  error.name = 'MongoError';
  error.code = 11000;
  error.keyPattern = { [field]: 1 };
  error.keyValue = { [field]: 'duplicate@example.com' };
  return error;
}

/**
 * Mock User Model static methods for testing
 * @returns {Object} Mocked User model
 */
function getMockUserModel() {
  return {
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    deleteMany: jest.fn(),

    // Helper to setup common responses
    __setupSuccess() {
      this.findById.mockImplementation(id => ({
        exec: jest.fn().mockResolvedValue(generateMockUserModel({ _id: id })),
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      }));

      this.findOne.mockImplementation(filter => ({
        exec: jest.fn().mockResolvedValue(generateMockUserModel(filter)),
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      }));

      this.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(generateVietnameseUsers(3)),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
      });

      this.create.mockImplementation(data => Promise.resolve(generateMockUserModel(data)));

      this.countDocuments.mockResolvedValue(10);
    },

    __setupNotFound() {
      this.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
        select: jest.fn().mockReturnThis(),
      });

      this.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
        select: jest.fn().mockReturnThis(),
      });
    },

    __setupValidationError(field, message) {
      this.create.mockRejectedValue(createValidationError(field, message));
      this.findByIdAndUpdate.mockRejectedValue(createValidationError(field, message));
    },

    __setupDuplicateKeyError(field) {
      this.create.mockRejectedValue(createDuplicateKeyError(field));
      this.findByIdAndUpdate.mockRejectedValue(createDuplicateKeyError(field));
    },

    __resetAllMocks() {
      Object.keys(this).forEach(key => {
        if (typeof this[key] === 'function' && this[key].mockReset) {
          this[key].mockReset();
        }
      });
    },
  };
}

export {
  generateMockUser,
  generateMockUserModel,
  getMockReqRes,
  generateVietnameseUsers,
  createValidationError,
  createDuplicateKeyError,
  getMockUserModel,
};
