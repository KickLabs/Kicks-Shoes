/**
 * @fileoverview Mock bcryptjs for Password Testing
 * @module __mocks__/bcryptjs
 * @description Jest mock for bcryptjs library
 */

import { jest } from '@jest/globals';

// Mock bcrypt functions
const hash = jest.fn();
const compare = jest.fn();
const genSalt = jest.fn();

export default {
  hash,
  compare,
  genSalt,
};
