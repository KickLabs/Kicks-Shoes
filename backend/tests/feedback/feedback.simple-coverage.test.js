/**
 * @fileoverview Simple Email Logic Coverage Tests for Feedback Controller
 * @description Tests to cover uncovered lines 316-357, 395-481 in feedbackController.js
 * @created 2025-10-28
 */

import { jest } from '@jest/globals';
import * as feedbackController from '../../src/controllers/feedbackController.js';
import Feedback from '../../src/models/Feedback.js';
import Report from '../../src/models/Report.js';
import User from '../../src/models/User.js';

// Mock sendTemplatedEmail để tránh lỗi email
jest.mock('../../src/utils/sendEmail.js', () => ({
  sendTemplatedEmail: jest.fn().mockResolvedValue(true),
  sendEmail: jest.fn().mockResolvedValue(true),
}));

describe('Feedback Controller - Simple Email Logic Coverage', () => {
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

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('adminApproveFeedback - PUT/DELETE Logic Coverage (Lines 395-481)', () => {
    test('Should handle PUT (Approve) request successfully (Branch - Lines 395-411)', async () => {
      // Bao phủ dòng 395-411 - PUT method logic
      const mockFeedback = {
        _id: '123',
        save: jest.fn().mockResolvedValue(true),
        status: 'pending',
        isVerified: false,
      };
      const mockReport = {
        _id: 'report1',
        save: jest.fn().mockResolvedValue(true),
        status: 'pending',
        resolution: null,
      };

      mockReq.method = 'PUT';
      mockReq.params.id = '123';
      mockReq.user = { id: 'admin1' };

      // Mock Feedback.findById và Report.findOne
      jest.spyOn(Feedback, 'findById').mockResolvedValue(mockFeedback);
      jest.spyOn(Report, 'findOne').mockResolvedValue(mockReport);

      await feedbackController.adminApproveFeedback(mockReq, mockRes, mockNext);

      expect(mockFeedback.save).toHaveBeenCalled();
      expect(mockReport.save).toHaveBeenCalled();
      expect(mockFeedback.status).toBe(true);
      expect(mockFeedback.isVerified).toBe(true);
      expect(mockReport.status).toBe('resolved');
      expect(mockReport.resolution).toBe('no_action');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('Should handle DELETE (Reject) request and send emails (Branch - Lines 413-481)', async () => {
      // Bao phủ dòng 413-481 - DELETE method logic
      const mockFeedback = {
        _id: '123',
        user: { email: 'user@test.com', fullName: 'Test User' },
        product: { name: 'Test Product' },
      };
      const mockReport = {
        _id: 'report1',
        save: jest.fn().mockResolvedValue(true),
        status: 'pending',
        reporter: 'reporter1',
      };

      mockReq.method = 'DELETE';
      mockReq.params.id = '123';
      mockReq.user = { id: 'admin1' };

      // Mock Feedback.findById với populate chain
      jest.spyOn(Feedback, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockFeedback),
      });
      jest.spyOn(Report, 'findOne').mockResolvedValue(mockReport);

      // Mock User.findOne và User.findById
      const mockShopUser = { email: 'shop@test.com', fullName: 'Test Shop' };
      const mockReporterUser = { email: 'reporter@test.com', fullName: 'Reporter' };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockShopUser);
      jest.spyOn(User, 'findById').mockResolvedValue(mockReporterUser);

      // Mock Feedback.findByIdAndUpdate
      jest.spyOn(Feedback, 'findByIdAndUpdate').mockResolvedValue(mockFeedback);

      await feedbackController.adminApproveFeedback(mockReq, mockRes, mockNext);

      expect(Feedback.findByIdAndUpdate).toHaveBeenCalledWith('123', {
        status: false,
        deletedBy: 'admin',
      });
      expect(mockReport.save).toHaveBeenCalled();
      expect(mockReport.status).toBe('resolved');
      expect(mockReport.resolution).toBe('delete_comment');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('Should handle email sending error in DELETE request (Branch - Lines 476-479)', async () => {
      // Bao phủ dòng 476-479 - email error handling in DELETE
      const mockFeedback = {
        _id: '123',
        user: { email: 'user@test.com' },
        product: { name: 'Test Product' },
      };
      const mockReport = {
        _id: 'report1',
        save: jest.fn().mockResolvedValue(true),
        status: 'pending',
        reporter: 'reporter1',
      };

      mockReq.method = 'DELETE';
      mockReq.params.id = '123';
      mockReq.user = { id: 'admin1' };

      jest.spyOn(Feedback, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockFeedback),
      });
      jest.spyOn(Report, 'findOne').mockResolvedValue(mockReport);

      // Mock User.findOne để throw error
      jest.spyOn(User, 'findOne').mockRejectedValue(new Error('Email service down'));

      // Mock Feedback.findByIdAndUpdate
      jest.spyOn(Feedback, 'findByIdAndUpdate').mockResolvedValue(mockFeedback);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await feedbackController.adminApproveFeedback(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200); // Vẫn thành công
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error sending notification emails:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
