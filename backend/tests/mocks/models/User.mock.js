/**
 * @fileoverview Mock for User Mongoose Model
 * @module User.mock
 * @description Provides mocked User model for testing controllers and services
 * Supports both static methods (findById, findOne, create) and instance methods (save, matchPassword)
 */

import { jest } from '@jest/globals';
import { generateMockUser, createMockModelInstance } from '../../_helpers/testUtils.js';

// Internal state for mock data
let mockUserData = null;
let mockUsers = [];

// Static method mocks
const findById = jest.fn();
const findOne = jest.fn();
const find = jest.fn();
const create = jest.fn();
const findByIdAndUpdate = jest.fn();
const findByIdAndDelete = jest.fn();
const countDocuments = jest.fn();
const deleteMany = jest.fn();
const findOneAndUpdate = jest.fn();
const exists = jest.fn();

// Instance method mocks (for user documents)
const save = jest.fn();
const matchPassword = jest.fn();
const remove = jest.fn();

/**
 * Helper: Set mock data for findById/findOne to return
 * @param {Object} userData - User data object
 */
function __setMockUser(userData) {
  mockUserData = userData ? generateMockUser(userData) : null;

  // Configure findById to return the mock user
  findById.mockResolvedValue(mockUserData);

  // Configure findOne to return the mock user
  findOne.mockResolvedValue(mockUserData);

  return mockUserData;
}

/**
 * Helper: Set mock data for find() to return array of users
 * @param {Array<Object>} usersArray - Array of user data objects
 */
function __setMockUsers(usersArray) {
  mockUsers = usersArray.map(userData => generateMockUser(userData));
  find.mockResolvedValue(mockUsers);
  return mockUsers;
}

/**
 * Helper: Clear all mocks and reset state
 */
function __clearMocks() {
  jest.clearAllMocks();
  mockUserData = null;
  mockUsers = [];

  // Reset all mock implementations
  findById.mockReset();
  findOne.mockReset();
  find.mockReset();
  create.mockReset();
  findByIdAndUpdate.mockReset();
  findByIdAndDelete.mockReset();
  countDocuments.mockReset();
  deleteMany.mockReset();
  findOneAndUpdate.mockReset();
  exists.mockReset();
  save.mockReset();
  matchPassword.mockReset();
  remove.mockReset();
}

/**
 * Helper: Setup default success scenarios
 */
function __setupDefaultMocks() {
  // Default: findById returns a user
  findById.mockImplementation(id => {
    return Promise.resolve(mockUserData || generateMockUser({ _id: id }));
  });

  // Default: findOne returns a user
  findOne.mockImplementation(query => {
    return Promise.resolve(mockUserData || generateMockUser(query));
  });

  // Default: create returns the created user
  create.mockImplementation(userData => {
    const newUser = generateMockUser(userData);
    return Promise.resolve(newUser);
  });

  // Default: save returns the saved user
  save.mockImplementation(function () {
    return Promise.resolve(this);
  });

  // Default: matchPassword returns true
  matchPassword.mockResolvedValue(true);

  // Default: countDocuments returns 0
  countDocuments.mockResolvedValue(0);

  // Default: find returns empty array
  find.mockResolvedValue([]);
}

/**
 * Create a mock User constructor
 * @param {Object} data - Initial user data
 * @returns {Object} Mock user instance
 */
function MockUserConstructor(data = {}) {
  const instance = createMockModelInstance(data);
  instance.save = save;
  instance.matchPassword = matchPassword;
  instance.remove = remove;
  return instance;
}

// Attach static methods to constructor
MockUserConstructor.findById = findById;
MockUserConstructor.findOne = findOne;
MockUserConstructor.find = find;
MockUserConstructor.create = create;
MockUserConstructor.findByIdAndUpdate = findByIdAndUpdate;
MockUserConstructor.findByIdAndDelete = findByIdAndDelete;
MockUserConstructor.countDocuments = countDocuments;
MockUserConstructor.deleteMany = deleteMany;
MockUserConstructor.findOneAndUpdate = findOneAndUpdate;
MockUserConstructor.exists = exists;

// Attach helper methods
MockUserConstructor.__setMockUser = __setMockUser;
MockUserConstructor.__setMockUsers = __setMockUsers;
MockUserConstructor.__clearMocks = __clearMocks;
MockUserConstructor.__setupDefaultMocks = __setupDefaultMocks;

// Export the mock constructor as default
export default MockUserConstructor;

/**
 * Usage Example:
 *
 * const User = require('./User.mock');
 *
 * // Setup before test
 * User.__setupDefaultMocks();
 *
 * // Set specific mock data
 * User.__setMockUser({
 *   _id: 'user123',
 *   email: 'test@example.com',
 *   isVerified: true
 * });
 *
 * // In test
 * const user = await User.findById('user123');
 * expect(user.email).toBe('test@example.com');
 *
 * // Clean up after test
 * User.__clearMocks();
 */
