/**
 * @fileoverview Mock Logger for Testing
 * @module __mocks__/utils/logger
 * @description Jest mock for logger utility
 */

import { jest } from '@jest/globals';

const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

export default logger;
