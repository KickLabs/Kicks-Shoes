/**
 * @fileoverview Additional User Service Tests for Coverage Improvement
 * @module tests/user-service.additional
 * @description Tests to increase UserService coverage to ≥90%
 * Focuses on: getAllUsers edge cases, error handling, branch coverage
 */

import { jest } from '@jest/globals';

// Create mock functions
const mockCountDocuments = jest.fn();
const mockFind = jest.fn();
const mockSelect = jest.fn();
const mockSkip = jest.fn();
const mockLimit = jest.fn();
const mockSort = jest.fn();

// Mock User model BEFORE importing UserService
jest.unstable_mockModule('../../src/models/User.js', () => ({
  default: {
    countDocuments: mockCountDocuments,
    find: mockFind,
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
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

// Import AFTER mocking
const { UserService } = await import('../../src/services/user.service.js');
const User = (await import('../../src/models/User.js')).default;
const logger = (await import('../../src/utils/logger.js')).default;

describe('UserService — Additional Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset chain methods
    mockSelect.mockReturnThis();
    mockSkip.mockReturnThis();
    mockLimit.mockReturnThis();
  });

  describe('getAllUsers - Branch Coverage', () => {
    test('US-ADD-001 | Should use default page=1 and limit=10 when not provided', async () => {
      // Given: No page/limit in query
      const mockUsers = [
        { _id: '1', fullName: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com' },
        { _id: '2', fullName: 'Trần Thị B', email: 'tranthib@gmail.com' },
      ];

      mockCountDocuments.mockResolvedValue(2);
      mockSort.mockResolvedValue(mockUsers);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: getAllUsers called with no parameters
      const result = await UserService.getAllUsers({});

      // Then: Should use defaults
      expect(mockCountDocuments).toHaveBeenCalledWith({});
      expect(mockSkip).toHaveBeenCalledWith(0); // (1-1) * 10
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(2);
    });

    test('US-ADD-002 | Should handle keyword search with special regex characters', async () => {
      // Given: Keyword with special regex chars
      const mockUsers = [{ _id: '1', fullName: 'Test User', email: 'test@example.com' }];

      mockCountDocuments.mockResolvedValue(1);
      mockSort.mockResolvedValue(mockUsers);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: Search with keyword containing special characters
      await UserService.getAllUsers({ keyword: 'test+user' });

      // Then: Should apply regex filter
      const expectedFilter = {
        $or: [
          { fullName: { $regex: 'test+user', $options: 'i' } },
          { email: { $regex: 'test+user', $options: 'i' } },
          { username: { $regex: 'test+user', $options: 'i' } },
        ],
      };
      expect(mockCountDocuments).toHaveBeenCalledWith(expectedFilter);
    });

    test('US-ADD-003 | Should filter by status=true (active users only)', async () => {
      // Given: status = 'true' query param
      const mockUsers = [
        { _id: '1', fullName: 'Active User 1', status: true },
        { _id: '2', fullName: 'Active User 2', status: true },
      ];

      mockCountDocuments.mockResolvedValue(2);
      mockSort.mockResolvedValue(mockUsers);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: getAllUsers with status='true'
      await UserService.getAllUsers({ status: 'true' });

      // Then: Should filter by status: true
      expect(mockCountDocuments).toHaveBeenCalledWith({ status: true });
    });

    test('US-ADD-004 | Should filter by status=false (banned users only)', async () => {
      // Given: status = 'false' query param
      const mockUsers = [{ _id: '3', fullName: 'Banned User', status: false }];

      mockCountDocuments.mockResolvedValue(1);
      mockSort.mockResolvedValue(mockUsers);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: getAllUsers with status='false'
      await UserService.getAllUsers({ status: 'false' });

      // Then: Should filter by status: false
      expect(mockCountDocuments).toHaveBeenCalledWith({ status: false });
    });

    test('US-ADD-005 | Should not apply status filter when status is undefined', async () => {
      // Given: No status filter
      const mockUsers = [{ _id: '1', fullName: 'User' }];

      mockCountDocuments.mockResolvedValue(1);
      mockSort.mockResolvedValue(mockUsers);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: getAllUsers with no status param
      await UserService.getAllUsers({});

      // Then: Should not include status in filter
      expect(mockCountDocuments).toHaveBeenCalledWith({});
    });

    test('US-ADD-006 | Should combine keyword and status filters', async () => {
      // Given: Both keyword and status filters
      const mockUsers = [{ _id: '1', fullName: 'Nguyễn Văn Active', status: true }];

      mockCountDocuments.mockResolvedValue(1);
      mockSort.mockResolvedValue(mockUsers);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: Search with keyword and status='true'
      await UserService.getAllUsers({ keyword: 'Nguyễn', status: 'true' });

      // Then: Should combine both filters
      const expectedFilter = {
        $or: [
          { fullName: { $regex: 'Nguyễn', $options: 'i' } },
          { email: { $regex: 'Nguyễn', $options: 'i' } },
          { username: { $regex: 'Nguyễn', $options: 'i' } },
        ],
        status: true,
      };
      expect(mockCountDocuments).toHaveBeenCalledWith(expectedFilter);
    });

    test('US-ADD-007 | Should calculate skip correctly for page 3', async () => {
      // Given: Page 3, limit 5
      const mockUsers = [];

      mockCountDocuments.mockResolvedValue(15);
      mockSort.mockResolvedValue(mockUsers);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: Request page 3
      await UserService.getAllUsers({ page: 3, limit: 5 });

      // Then: Should skip 10 records (2 * 5)
      expect(mockSkip).toHaveBeenCalledWith(10);
      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    test('US-ADD-008 | Should handle page and limit as strings (query params)', async () => {
      // Given: String parameters (from URL query)
      const mockUsers = [{ _id: '1', fullName: 'Test User' }];

      mockCountDocuments.mockResolvedValue(1);
      mockSort.mockResolvedValue(mockUsers);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: page and limit are strings
      await UserService.getAllUsers({ page: '2', limit: '20' });

      // Then: Should convert to numbers
      expect(mockSkip).toHaveBeenCalledWith(20); // (2-1) * 20
      expect(mockLimit).toHaveBeenCalledWith(20);
    });

    test('US-ADD-009 | Should return empty array when no users match', async () => {
      // Given: No users match the filter
      mockCountDocuments.mockResolvedValue(0);
      mockSort.mockResolvedValue([]);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: Search with non-matching keyword
      const result = await UserService.getAllUsers({ keyword: 'nonexistent' });

      // Then: Should return empty array
      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
    });

    test('US-ADD-010 | Should exclude password field from results', async () => {
      // Given: Users exist in database
      const mockUsers = [{ _id: '1', fullName: 'User Without Password', email: 'user@test.com' }];

      mockCountDocuments.mockResolvedValue(1);
      mockSort.mockResolvedValue(mockUsers);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: getAllUsers is called
      await UserService.getAllUsers({});

      // Then: Should select without password
      expect(mockSelect).toHaveBeenCalledWith('-password');
    });

    test('US-ADD-011 | Should sort by createdAt descending (newest first)', async () => {
      // Given: Multiple users
      const mockUsers = [
        { _id: '2', fullName: 'Newer User', createdAt: '2024-01-02' },
        { _id: '1', fullName: 'Older User', createdAt: '2024-01-01' },
      ];

      mockCountDocuments.mockResolvedValue(2);
      mockSort.mockResolvedValue(mockUsers);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: getAllUsers is called
      await UserService.getAllUsers({});

      // Then: Should sort by createdAt descending
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    test('US-ADD-012 | Should handle empty keyword (whitespace only)', async () => {
      // Given: Whitespace keyword
      const mockUsers = [{ _id: '1', fullName: 'Test' }];

      mockCountDocuments.mockResolvedValue(1);
      mockSort.mockResolvedValue(mockUsers);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: keyword is whitespace
      await UserService.getAllUsers({ keyword: '   ' });

      // Then: Should still apply filter (whitespace is truthy)
      const call = mockCountDocuments.mock.calls[0][0];
      expect(call).toHaveProperty('$or');
    });
  });

  describe('getAllUsers - Error Handling', () => {
    test('US-ADD-013 | Should log error and rethrow when User.countDocuments fails', async () => {
      // Given: Database error on countDocuments
      const dbError = new Error('Database connection failed');
      mockCountDocuments.mockRejectedValue(dbError);

      // When: getAllUsers is called
      // Then: Should log error and rethrow
      await expect(UserService.getAllUsers({})).rejects.toThrow('Database connection failed');

      expect(logger.error).toHaveBeenCalled();
    });

    test('US-ADD-014 | Should log error and rethrow when User.find fails', async () => {
      // Given: Database error on find
      const dbError = new Error('Query timeout');
      mockCountDocuments.mockResolvedValue(10);
      mockSort.mockRejectedValue(dbError);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: getAllUsers is called
      // Then: Should rethrow
      await expect(UserService.getAllUsers({})).rejects.toThrow('Query timeout');
      expect(logger.error).toHaveBeenCalled();
    });

    test('US-ADD-015 | Should handle invalid page number gracefully', async () => {
      // Given: Negative page number
      const mockUsers = [{ _id: '1', fullName: 'Test' }];

      mockCountDocuments.mockResolvedValue(1);
      mockSort.mockResolvedValue(mockUsers);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: page is negative
      await UserService.getAllUsers({ page: -1 });

      // Then: Should handle gracefully (skip will be negative * limit)
      expect(mockSkip).toHaveBeenCalledWith(-20); // (-1-1) * 10
    });

    test('US-ADD-016 | Should handle non-numeric page/limit values', async () => {
      // Given: Non-numeric values
      const mockUsers = [{ _id: '1', fullName: 'Test' }];

      mockCountDocuments.mockResolvedValue(1);
      mockSort.mockResolvedValue(mockUsers);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: page/limit are NaN
      await UserService.getAllUsers({ page: 'abc', limit: 'xyz' });

      // Then: Should fallback to NaN calculations
      expect(mockSkip).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalled();
    });
  });

  describe('getAllUsers - Vietnamese Data Integration', () => {
    test('US-ADD-017 | Should search Vietnamese names correctly', async () => {
      // Given: Vietnamese search keyword
      const mockUsers = [
        { _id: '1', fullName: 'Nguyễn Văn Hùng', email: 'hungnv@gmail.com' },
        { _id: '2', fullName: 'Trần Thị Hương', email: 'huongtt@gmail.com' },
      ];

      mockCountDocuments.mockResolvedValue(2);
      mockSort.mockResolvedValue(mockUsers);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: Search with Vietnamese keyword
      const result = await UserService.getAllUsers({ keyword: 'Hư' });

      // Then: Should find matching Vietnamese names
      expect(result.users).toEqual(mockUsers);
      expect(mockCountDocuments).toHaveBeenCalledWith({
        $or: [
          { fullName: { $regex: 'Hư', $options: 'i' } },
          { email: { $regex: 'Hư', $options: 'i' } },
          { username: { $regex: 'Hư', $options: 'i' } },
        ],
      });
    });

    test('US-ADD-018 | Should handle Vietnamese email domains', async () => {
      // Given: Vietnamese email addresses
      const mockUsers = [
        { _id: '1', fullName: 'Lê Minh Tuấn', email: 'tuan.le@fpt.vn' },
        { _id: '2', fullName: 'Phạm Thu Hà', email: 'ha.pham@viettel.vn' },
      ];

      mockCountDocuments.mockResolvedValue(2);
      mockSort.mockResolvedValue(mockUsers);
      mockFind.mockReturnValue({
        select: mockSelect,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
      });

      // When: Search for .vn domain
      await UserService.getAllUsers({ keyword: '.vn' });

      // Then: Should search in email field
      expect(mockCountDocuments).toHaveBeenCalledWith({
        $or: [
          { fullName: { $regex: '.vn', $options: 'i' } },
          { email: { $regex: '.vn', $options: 'i' } },
          { username: { $regex: '.vn', $options: 'i' } },
        ],
      });
    });
  });
});
