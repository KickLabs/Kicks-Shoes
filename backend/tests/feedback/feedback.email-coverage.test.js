/**
 * @fileoverview Feedback Controller Coverage Tests (Email Functionality Removed)
 * @description Tests to cover feedback controller functionality without email sending
 * @created 2025-10-28
 * @updated 2025-10-28 - Removed email functionality as requested
 */

import { jest } from '@jest/globals';

// Mock BEFORE imports
jest.unstable_mockModule('../../src/utils/sendEmail.js', () => ({
  sendTemplatedEmail: jest.fn().mockResolvedValue(true),
  sendEmail: jest.fn().mockResolvedValue(true),
}));

jest.unstable_mockModule('../../src/models/User.js', () => ({
  default: {
    findById: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/models/Report.js', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const MockReport = function (data) {
    this.save = mockSave;
    this.status = data.status || 'pending';
    this.reporter = data.reporter;
    this.resolution = null;
  };
  MockReport.findOne = jest.fn();

  return { default: MockReport };
});

// Import after mocking
const feedbackController = await import('../../src/controllers/feedbackController.js');
const Feedback = (await import('../../src/models/Feedback.js')).default;
const Report = (await import('../../src/models/Report.js')).default;
const User = (await import('../../src/models/User.js')).default;
const { sendTemplatedEmail } = await import('../../src/utils/sendEmail.js');

describe('Feedback Controller - Coverage Tests (No Email)', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      user: {},
      method: 'GET',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('reportFeedback - Basic Functionality Coverage', () => {
    test('Should create report successfully without emails', async () => {
      const mockFeedback = {
        _id: '123',
        user: { _id: 'user1', email: 'user@test.com', fullName: 'Test User' },
        product: { _id: 'prod1', name: 'Test Product' },
      };

      mockReq.params.id = '123';
      mockReq.body = { reason: 'spam', description: 'test description' };
      mockReq.user = { id: 'user1' };

      jest.spyOn(Feedback, 'findById').mockImplementation(() => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockFeedback),
      }));

      User.findOne.mockResolvedValue({ email: 'shop@test.com', fullName: 'Shop' });
      User.findById.mockResolvedValue({ email: 'reporter@test.com', fullName: 'Reporter' });

      // Mock Report constructor
      const mockReportInstance = { save: jest.fn().mockResolvedValue(true) };
      Report.mockImplementation = jest.fn(() => mockReportInstance);

      await feedbackController.reportFeedback(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Feedback reported successfully',
        })
      );
      // No email functionality to test since it has been removed
    });
  });

  test('Should handle errors gracefully without email functionality', async () => {
    const mockFeedback = {
      _id: '123',
      user: { _id: 'user1', email: 'user@test.com' },
      product: { _id: 'prod1', name: 'Test Product' },
    };

    mockReq.params.id = '123';
    mockReq.body = { reason: 'spam', description: 'test description' };
    mockReq.user = { id: 'user1' };

    jest.spyOn(Feedback, 'findById').mockImplementation(() => ({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockFeedback),
    }));

    User.findOne.mockRejectedValue(new Error('Email service down'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await feedbackController.reportFeedback(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    // No email error handling needed since email functionality has been removed

    consoleSpy.mockRestore();
  });
});
