/**
 * @fileoverview Mock User Model for Service Testing
 * @module __mocks__/models/User
 * @description Jest mock for User Mongoose model
 */

import { jest } from '@jest/globals';

// Create mock static methods
const findById = jest.fn();
const findOne = jest.fn();
const find = jest.fn();
const findByIdAndUpdate = jest.fn();
const findByIdAndDelete = jest.fn();
const create = jest.fn();
const countDocuments = jest.fn();
const deleteMany = jest.fn();

// Export as default (Mongoose model)
const User = {
  findById,
  findOne,
  find,
  findByIdAndUpdate,
  findByIdAndDelete,
  create,
  countDocuments,
  deleteMany,
};

export default User;
