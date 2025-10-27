/**
 * @fileoverview Mock bcrypt for Testing
 * @module __mocks__/bcrypt
 * @description Jest mock for bcryptjs with configurable hash/compare
 */

const bcryptMock = {
  // Mock hash function
  hash: jest.fn(),

  // Mock compare function
  compare: jest.fn(),

  // Mock genSalt function
  genSalt: jest.fn(),

  // Helper: Setup default successful responses
  __setupSuccess() {
    // hash returns a deterministic hash
    this.hash.mockResolvedValue('$2a$10$mockHashedPassword1234567890');

    // compare returns true for correct password
    this.compare.mockResolvedValue(true);

    // genSalt returns a mock salt
    this.genSalt.mockResolvedValue('$2a$10$mockSalt');
  },

  // Helper: Setup password mismatch scenario
  __setupPasswordMismatch() {
    this.compare.mockResolvedValue(false);
  },

  // Helper: Setup hash error scenario
  __setupHashError() {
    this.hash.mockRejectedValue(new Error('Hashing failed'));
  },

  // Helper: Setup compare error scenario
  __setupCompareError() {
    this.compare.mockRejectedValue(new Error('Compare failed'));
  },

  // Helper: Reset all mocks
  __resetAllMocks() {
    this.hash.mockReset();
    this.compare.mockReset();
    this.genSalt.mockReset();
  },

  // Helper: Setup specific hash for testing
  __mockHash(plainPassword, hashedResult) {
    this.hash.mockImplementation(async (password, salt) => {
      if (password === plainPassword) {
        return hashedResult;
      }
      return '$2a$10$defaultMockHash';
    });
  },

  // Helper: Setup specific compare for testing
  __mockCompare(plainPassword, hashedPassword, result) {
    this.compare.mockImplementation(async (password, hash) => {
      if (password === plainPassword && hash === hashedPassword) {
        return result;
      }
      return false;
    });
  },
};

module.exports = bcryptMock;
