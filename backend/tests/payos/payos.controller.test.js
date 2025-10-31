/**
 * @fileoverview Unit tests for PayOS Controller
 * @created 2025-01-27
 * @description Tests for PayOS controller HTTP handlers
 */

import { jest } from '@jest/globals';

// Mock PayOSService
const mockPayOSService = {
  createPaymentLink: jest.fn(),
  getPaymentLinkInformation: jest.fn(),
  cancelPaymentLink: jest.fn(),
  verifyPaymentWebhookData: jest.fn(),
  confirmWebhook: jest.fn(),
};

jest.unstable_mockModule('../../src/services/payos.service.js', () => ({
  default: mockPayOSService,
}));

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: mockLogger,
}));

// Mock Order model
const mockOrder = {
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

jest.unstable_mockModule('../../src/models/Order.js', () => ({
  default: mockOrder,
}));

// Import controller after mocks
const { createPaymentLink, getPaymentLinkInfo, cancelPaymentLink, handleWebhook, confirmWebhook } =
  await import('../../src/controllers/payosController.js');

describe('PayOS Controller - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request object
    req = {
      body: {},
      params: {},
      user: { _id: 'user123' },
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock next function
    next = jest.fn();
  });

  // ========================================
  // 1. CREATE PAYMENT LINK TESTS
  // ========================================

  describe('1. createPaymentLink Controller', () => {
    test('PAYOS-UNIT-031: Should create payment link with valid request', async () => {
      // Arrange
      req.body = {
        orderCode: 123456,
        amount: 150000,
        description: 'Test order',
        returnUrl: 'http://localhost/success',
        cancelUrl: 'http://localhost/cancel',
      };

      const mockResponse = {
        success: true,
        data: {
          orderCode: 123456,
          checkoutUrl: 'https://payos.vn/checkout/test123',
          qrCode: 'base64_qr_code',
        },
      };

      mockPayOSService.createPaymentLink.mockResolvedValue(mockResponse);

      // Act
      await createPaymentLink[createPaymentLink.length - 1](req, res, next);

      // Assert
      expect(mockPayOSService.createPaymentLink).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResponse.data,
        message: 'Payment link created successfully',
      });
      expect(mockLogger.info).toHaveBeenCalled();
    });

    test('PAYOS-UNIT-034: Should handle service error', async () => {
      // Arrange
      req.body = {
        orderCode: 123456,
        amount: 150000,
        description: 'Test order',
        returnUrl: 'http://localhost/success',
        cancelUrl: 'http://localhost/cancel',
      };

      mockPayOSService.createPaymentLink.mockResolvedValue({
        success: false,
        message: 'PayOS API error',
      });

      // Act
      await createPaymentLink[createPaymentLink.length - 1](req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'PayOS API error',
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('Should handle exceptions in createPaymentLink', async () => {
      // Arrange
      req.body = { orderCode: 123456 };
      mockPayOSService.createPaymentLink.mockRejectedValue(new Error('Unexpected error'));

      // Act
      await createPaymentLink[createPaymentLink.length - 1](req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  // ========================================
  // 2. GET PAYMENT LINK INFO TESTS
  // ========================================

  describe('2. getPaymentLinkInfo Controller', () => {
    test('Should get payment link info successfully', async () => {
      // Arrange
      req.params = { orderCode: '123456' };
      mockPayOSService.getPaymentLinkInformation.mockResolvedValue({
        success: true,
        data: { orderCode: 123456, status: 'PENDING', amount: 150000 },
      });

      // Act
      await getPaymentLinkInfo(req, res, next);

      // Assert
      expect(mockPayOSService.getPaymentLinkInformation).toHaveBeenCalledWith('123456');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object),
      });
    });

    test('Should return 404 when payment link not found', async () => {
      // Arrange
      req.params = { orderCode: '999999' };
      mockPayOSService.getPaymentLinkInformation.mockResolvedValue({
        success: false,
        message: 'Payment link not found',
      });

      // Act
      await getPaymentLinkInfo(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Payment link not found',
      });
    });

    test('Should return 400 when orderCode is missing', async () => {
      // Arrange
      req.params = {};

      // Act
      await getPaymentLinkInfo(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Order code is required',
      });
    });
  });

  // ========================================
  // 3. CANCEL PAYMENT LINK TESTS
  // ========================================

  describe('3. cancelPaymentLink Controller', () => {
    test('Should cancel payment link successfully', async () => {
      // Arrange
      req.params = { orderCode: '123456' };
      req.body = { cancellationReason: 'User cancelled' };
      mockPayOSService.cancelPaymentLink.mockResolvedValue({
        success: true,
        data: { orderCode: 123456, status: 'CANCELLED' },
      });

      // Act
      await cancelPaymentLink(req, res, next);

      // Assert
      expect(mockPayOSService.cancelPaymentLink).toHaveBeenCalledWith('123456', 'User cancelled');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object),
        message: 'Payment link cancelled successfully',
      });
    });

    test('Should return 400 when cancellation fails', async () => {
      // Arrange
      req.params = { orderCode: '123456' };
      req.body = {};
      mockPayOSService.cancelPaymentLink.mockResolvedValue({
        success: false,
        message: 'Cannot cancel payment',
      });

      // Act
      await cancelPaymentLink(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ========================================
  // 4. HANDLE WEBHOOK TESTS
  // ========================================

  describe('4. handleWebhook Controller', () => {
    test('PAYOS-UNIT-035: Should handle valid webhook with success payment', async () => {
      // Arrange
      const webhookData = {
        orderCode: 123456,
        amount: 150000,
        description: 'Order 123456',
        accountNumber: '0123456789',
        reference: 'REF123',
        transactionDateTime: '2025-01-27T10:30:00',
        currency: 'VND',
        paymentLinkId: 'LINK123',
        code: '00',
        desc: 'success',
        signature: 'valid_signature',
      };

      req.body = webhookData;

      mockPayOSService.verifyPaymentWebhookData.mockReturnValue({
        success: true,
        data: webhookData,
      });

      // Mock Order.find().lean() to return matching order
      mockOrder.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: '507f1f77bcf86cd799123456', // Last 6 digits: 123456
            status: 'pending',
            paymentStatus: 'pending',
          },
        ]),
      });

      mockOrder.findByIdAndUpdate.mockResolvedValue({
        _id: '507f1f77bcf86cd799123456',
        status: 'processing',
        paymentStatus: 'paid',
      });

      // Act
      await handleWebhook[handleWebhook.length - 1](req, res, next);

      // Assert
      expect(mockPayOSService.verifyPaymentWebhookData).toHaveBeenCalledWith(webhookData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        error: 0,
        message: 'Ok',
        data: webhookData,
      });
    });

    test('PAYOS-UNIT-036: Should reject webhook with invalid signature', async () => {
      // Arrange
      const webhookData = {
        orderCode: 123456,
        signature: 'invalid_signature',
      };

      req.body = webhookData;

      mockPayOSService.verifyPaymentWebhookData.mockReturnValue({
        success: false,
        message: 'Invalid webhook signature',
      });

      // Act
      await handleWebhook[handleWebhook.length - 1](req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: -1,
        message: 'Invalid webhook signature',
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('Should handle webhook when order not found', async () => {
      // Arrange
      const webhookData = {
        orderCode: 999999,
        code: '00',
        desc: 'success',
        amount: 150000,
        accountNumber: '0123456789',
        reference: 'REF123',
        transactionDateTime: '2025-01-27T10:30:00',
        currency: 'VND',
        paymentLinkId: 'LINK123',
        signature: 'valid',
      };

      req.body = webhookData;

      mockPayOSService.verifyPaymentWebhookData.mockReturnValue({
        success: true,
        data: webhookData,
      });

      // Mock Order.find().lean() to return no matching orders
      mockOrder.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      // Act
      await handleWebhook[handleWebhook.length - 1](req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      // Logger warning is logged internally when no order found
    });

    test('PAYOS-UNIT-038: Should handle internal error gracefully', async () => {
      // Arrange
      const webhookData = {
        orderCode: 123456,
        code: '00',
        desc: 'success',
        signature: 'valid',
      };

      req.body = webhookData;

      // Mock verifyPaymentWebhookData to throw error (outer catch)
      mockPayOSService.verifyPaymentWebhookData.mockImplementation(() => {
        throw new Error('Internal error');
      });

      // Act
      await handleWebhook[handleWebhook.length - 1](req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: -1,
        message: 'Internal server error',
      });
    });

    test('Should NOT update order when payment failed (code!=00)', async () => {
      // Arrange
      const webhookData = {
        orderCode: 123456,
        code: '02',
        desc: 'cancelled',
        amount: 150000,
        accountNumber: '0123456789',
        reference: 'REF123',
        transactionDateTime: '2025-01-27T10:30:00',
        currency: 'VND',
        paymentLinkId: 'LINK123',
        signature: 'valid',
      };

      req.body = webhookData;

      mockPayOSService.verifyPaymentWebhookData.mockReturnValue({
        success: true,
        data: webhookData,
      });

      // Act
      await handleWebhook[handleWebhook.length - 1](req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockOrder.find).not.toHaveBeenCalled(); // Should not try to update order
    });

    test('Should handle Order.find error gracefully in webhook', async () => {
      // Arrange
      const webhookData = {
        orderCode: 123456,
        code: '00',
        desc: 'success',
        amount: 150000,
        accountNumber: '0123456789',
        reference: 'REF123',
        transactionDateTime: '2025-01-27T10:30:00',
        currency: 'VND',
        paymentLinkId: 'LINK123',
        signature: 'valid',
      };

      req.body = webhookData;

      mockPayOSService.verifyPaymentWebhookData.mockReturnValue({
        success: true,
        data: webhookData,
      });

      // Mock Order.find().lean() to throw error
      mockOrder.find.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      // Act
      await handleWebhook[handleWebhook.length - 1](req, res, next);

      // Assert - should still return success (error is logged but not failed)
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        error: 0,
        message: 'Ok',
        data: webhookData,
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error updating order after PayOS payment:',
        expect.any(Error)
      );
    });
  });

  // ========================================
  // 5. CONFIRM WEBHOOK TESTS
  // ========================================

  describe('5. confirmWebhook Controller', () => {
    test('Should confirm webhook URL successfully', async () => {
      // Arrange
      req.body = { webhookUrl: 'https://example.com/webhook' };
      mockPayOSService.confirmWebhook.mockResolvedValue({
        success: true,
        message: 'Webhook confirmed successfully',
      });

      // Act
      await confirmWebhook(req, res, next);

      // Assert
      expect(mockPayOSService.confirmWebhook).toHaveBeenCalledWith('https://example.com/webhook');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Webhook confirmed successfully',
      });
    });

    test('Should return 400 when webhookUrl is missing', async () => {
      // Arrange
      req.body = {};

      // Act
      await confirmWebhook(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Webhook URL is required',
      });
    });

    test('Should handle confirmation error', async () => {
      // Arrange
      req.body = { webhookUrl: 'https://example.com/webhook' };
      mockPayOSService.confirmWebhook.mockResolvedValue({
        success: false,
        message: 'Invalid webhook URL',
      });

      // Act
      await confirmWebhook(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
