/**
 * Unit Tests for EmailService
 * Tests core email sending functionality with mocked dependencies
 */

import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from '@jest/globals';
import mongoose from 'mongoose';
import {
  createMockOAuth2Client,
  createMockTransport,
  createMockLogger,
  createMockUser,
  createMockProduct,
  createMockOrder,
  createMockOrderWithItems,
  createMockDiscountData,
  createMockTemplate,
  createMockOrderWithPopulate,
} from '../_helpers/emailTestUtils.js';

// Set test environment BEFORE importing EmailService
process.env.NODE_ENV = 'test';
process.env.GOOGLE_MAILER_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_MAILER_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_MAILER_REFRESH_TOKEN = 'test-refresh-token';
process.env.ADMIN_EMAIL_ADDRESS = 'admin@test.com';

// Mock nodemailer
const mockTransport = createMockTransport();
const mockCreateTransport = jest.fn().mockReturnValue(mockTransport);

await jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}));

// Mock google-auth-library
const mockOAuth2Client = createMockOAuth2Client();
const MockOAuth2ClientClass = jest.fn().mockImplementation(() => mockOAuth2Client);

await jest.unstable_mockModule('google-auth-library', () => ({
  OAuth2Client: MockOAuth2ClientClass,
}));

// Mock logger
const mockLogger = createMockLogger();
await jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: mockLogger,
}));

// Mock formatVND
await jest.unstable_mockModule('../../src/utils/currency.js', () => ({
  formatVND: jest.fn(amount => `${amount.toLocaleString('vi-VN')} ₫`),
}));

// Import EmailService AFTER mocking
const EmailService = (await import('../../src/services/email.service.js')).default;
const { emailTemplates } = await import('../../src/templates/email.templates.js');

describe('EmailService Unit Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockTransport.sendMail.mockClear();
    mockOAuth2Client.getAccessToken.mockClear();
    mockCreateTransport.mockClear();
  });

  describe('EMAIL-030: sendEmail() - Skip in test environment', () => {
    test('Should skip email sending in test environment', async () => {
      // Given: Test environment (NODE_ENV='test')
      process.env.NODE_ENV = 'test';
      const to = 'user@test.com';
      const subject = 'Test Subject';
      const content = '<p>Test content</p>';

      // When: Call sendEmail
      await EmailService.sendEmail(to, subject, content);

      // Then: Email should be skipped
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Email skipped (test environment):',
        expect.objectContaining({ to, subject })
      );
      expect(mockOAuth2Client.getAccessToken).not.toHaveBeenCalled();
      expect(mockCreateTransport).not.toHaveBeenCalled();
      expect(mockTransport.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('EMAIL-031-033: sendEmail() - Validation', () => {
    test('EMAIL-031: Should reject missing "to" parameter', async () => {
      // Given: Missing recipient email
      const to = null;
      const subject = 'Test Subject';
      const content = '<p>Test content</p>';

      // When/Then: Should throw error
      await expect(EmailService.sendEmail(to, subject, content)).rejects.toThrow(
        'Missing required email parameters'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('EMAIL-032: Should reject missing "subject" parameter', async () => {
      // Given: Missing subject
      const to = 'user@test.com';
      const subject = null;
      const content = '<p>Test content</p>';

      // When/Then: Should throw error
      await expect(EmailService.sendEmail(to, subject, content)).rejects.toThrow(
        'Missing required email parameters'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('EMAIL-033: Should reject missing "content" parameter', async () => {
      // Given: Missing content
      const to = 'user@test.com';
      const subject = 'Test Subject';
      const content = null;

      // When/Then: Should throw error
      await expect(EmailService.sendEmail(to, subject, content)).rejects.toThrow(
        'Missing required email parameters'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('EMAIL-029: sendEmail() - Production environment', () => {
    test('Should send email in production environment', async () => {
      // Given: Production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const to = 'user@test.com';
      const subject = 'Test Email';
      const content = '<p>Test content</p>';

      // Reset mocks
      mockCreateTransport.mockReturnValue(mockTransport);
      mockOAuth2Client.getAccessToken.mockResolvedValue({ token: 'mock-access-token' });
      mockTransport.sendMail.mockResolvedValue({ messageId: '<test@gmail.com>' });

      // When: Call sendEmail
      await EmailService.sendEmail(to, subject, content);

      // Then: OAuth2 and nodemailer should be called
      expect(mockOAuth2Client.getAccessToken).toHaveBeenCalled();
      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'gmail',
          auth: expect.objectContaining({
            type: 'OAuth2',
            accessToken: 'mock-access-token',
          }),
        })
      );
      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to,
          subject,
          html: content,
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Email sent:', expect.any(String));

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('EMAIL-034: sendEmail() - OAuth2 error', () => {
    test('Should handle OAuth2 token fetch failure', async () => {
      // Given: Production env, OAuth2 error
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const oauthError = new Error('OAuth2 token fetch failed');

      // Reset and setup mock
      mockOAuth2Client.getAccessToken.mockRejectedValueOnce(oauthError);

      // When/Then: Should throw error
      await expect(EmailService.sendEmail('user@test.com', 'Test', '<p>Test</p>')).rejects.toThrow(
        'OAuth2 token fetch failed'
      );

      expect(mockLogger.error).toHaveBeenCalledWith('Error sending email:', oauthError);

      // Restore
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('EMAIL-035: sendEmail() - Nodemailer error', () => {
    test('Should handle nodemailer sendMail failure', async () => {
      // Given: Production env, sendMail error
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const sendError = new Error('Email send failed');

      // Reset mocks
      mockOAuth2Client.getAccessToken.mockResolvedValueOnce({ token: 'mock-token' });
      mockCreateTransport.mockReturnValue(mockTransport);
      mockTransport.sendMail.mockRejectedValueOnce(sendError);

      // When/Then: Should throw error
      await expect(EmailService.sendEmail('user@test.com', 'Test', '<p>Test</p>')).rejects.toThrow(
        'Email send failed'
      );

      expect(mockLogger.error).toHaveBeenCalledWith('Error sending email:', sendError);

      // Restore
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('EMAIL-001: sendTemplatedEmail() - Happy path', () => {
    test('Should send email with valid template', async () => {
      // Given: Valid email and template
      const to = 'user@test.com';
      const templateType = 'VERIFICATION';
      const templateData = {
        name: 'Test User',
        verificationLink: 'http://test.com/verify?token=123',
      };

      // When: Call sendTemplatedEmail (will skip in test env)
      await expect(
        EmailService.sendTemplatedEmail(to, templateType, templateData)
      ).resolves.not.toThrow();

      // Then: Should log email skipped (in test environment)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Email skipped (test environment):',
        expect.objectContaining({ to })
      );
    });
  });

  describe('EMAIL-002: sendTemplatedEmail() - Missing recipient', () => {
    test('Should reject missing recipient email', async () => {
      // Given: Missing recipient
      const to = null;
      const templateType = 'VERIFICATION';
      const templateData = {};

      // When/Then: Should throw error
      await expect(EmailService.sendTemplatedEmail(to, templateType, templateData)).rejects.toThrow(
        'Recipient email address is required'
      );

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('EMAIL-003: sendTemplatedEmail() - Invalid template', () => {
    test('Should reject invalid template type', async () => {
      // Given: Invalid template type
      const to = 'user@test.com';
      const templateType = 'INVALID_TEMPLATE';
      const templateData = {};

      // When/Then: Should throw error
      await expect(EmailService.sendTemplatedEmail(to, templateType, templateData)).rejects.toThrow(
        "Email template 'INVALID_TEMPLATE' not found"
      );

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('EMAIL-004: sendTemplatedEmail() - sendEmail failure', () => {
    test('Should handle sendEmail failure', async () => {
      // Given: sendEmail throws error
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const sendError = new Error('Send email failed');
      mockTransport.sendMail.mockRejectedValueOnce(sendError);

      // When/Then: Should throw error
      await expect(
        EmailService.sendTemplatedEmail('user@test.com', 'VERIFICATION', { name: 'Test' })
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();

      // Restore
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('EMAIL-005: sendTemplatedEmail() - Empty templateData', () => {
    test('Should send email with empty templateData', async () => {
      // Given: Empty template data
      const to = 'user@test.com';
      const templateType = 'VERIFICATION';
      const templateData = {};

      // When: Call sendTemplatedEmail (will skip in test env)
      await expect(
        EmailService.sendTemplatedEmail(to, templateType, templateData)
      ).resolves.not.toThrow();

      // Then: Should handle empty data without error
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('EMAIL-006: sendOrderConfirmationEmail() - Happy path', () => {
    test('Should send order confirmation with valid data', async () => {
      // Given: Valid user and order
      const user = createMockUser();
      const order = createMockOrderWithItems(2);

      // Spy on methods
      const sendTemplatedEmailSpy = jest.spyOn(EmailService, 'sendTemplatedEmail');
      const generateOrderDetailsSpy = jest.spyOn(EmailService, 'generateOrderDetails');

      // When: Call sendOrderConfirmationEmail
      await EmailService.sendOrderConfirmationEmail(user, order);

      // Then: generateOrderDetails should be called
      expect(generateOrderDetailsSpy).toHaveBeenCalledWith(order);

      // And sendTemplatedEmail should be called with ORDER_CONFIRMATION
      expect(sendTemplatedEmailSpy).toHaveBeenCalledWith(
        user.email,
        'ORDER_CONFIRMATION',
        expect.objectContaining({
          name: user.fullName,
          orderNumber: order._id.toString(),
          orderDetails: expect.any(String),
        })
      );

      // And success should be logged
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Order confirmation email sent',
        expect.objectContaining({
          orderId: order._id,
          userEmail: user.email,
        })
      );

      sendTemplatedEmailSpy.mockRestore();
      generateOrderDetailsSpy.mockRestore();
    });
  });

  describe('EMAIL-007: sendOrderConfirmationEmail() - Fallback on error', () => {
    test('Should use fallback template when generateOrderDetails fails', async () => {
      // Given: generateOrderDetails throws error
      const user = createMockUser();
      const order = createMockOrder();

      const generateOrderDetailsSpy = jest
        .spyOn(EmailService, 'generateOrderDetails')
        .mockRejectedValueOnce(new Error('Generate details failed'));

      const sendTemplatedEmailSpy = jest.spyOn(EmailService, 'sendTemplatedEmail');

      // When: Call sendOrderConfirmationEmail
      await EmailService.sendOrderConfirmationEmail(user, order);

      // Then: Error should be logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error generating order details, using fallback:',
        expect.any(Error)
      );

      // And sendTemplatedEmail should still be called with fallback
      expect(sendTemplatedEmailSpy).toHaveBeenCalledWith(
        user.email,
        'ORDER_CONFIRMATION',
        expect.objectContaining({
          name: user.fullName,
          orderNumber: order._id.toString(),
          orderDetails: expect.stringContaining('Your order has been successfully placed!'),
        })
      );

      generateOrderDetailsSpy.mockRestore();
      sendTemplatedEmailSpy.mockRestore();
    });
  });

  describe('EMAIL-010: sendDiscountCodeEmail() - Happy path', () => {
    test('Should send discount code email', async () => {
      // Given: Valid user and discount data
      const user = createMockUser();
      const discountData = createMockDiscountData();

      // Spy on sendTemplatedEmail
      const sendTemplatedEmailSpy = jest.spyOn(EmailService, 'sendTemplatedEmail');

      // When: Call sendDiscountCodeEmail
      await EmailService.sendDiscountCodeEmail(user, discountData);

      // Then: sendTemplatedEmail should be called with DISCOUNT_CODE template
      expect(sendTemplatedEmailSpy).toHaveBeenCalledWith(
        user.email,
        'DISCOUNT_CODE',
        expect.objectContaining({
          name: user.fullName,
          code: discountData.code,
          value: discountData.value,
          description: discountData.description,
          points: discountData.points,
        })
      );

      // And success should be logged
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Discount code email sent',
        expect.objectContaining({
          userEmail: user.email,
          discountCode: discountData.code,
        })
      );

      sendTemplatedEmailSpy.mockRestore();
    });
  });

  describe('EMAIL-011: sendDiscountCodeEmail() - Missing fullName', () => {
    test('Should use email as fallback when fullName missing', async () => {
      // Given: User without fullName
      const user = { email: 'user@test.com' };
      const discountData = createMockDiscountData();

      // Spy on sendTemplatedEmail
      const sendTemplatedEmailSpy = jest.spyOn(EmailService, 'sendTemplatedEmail');

      // When: Call sendDiscountCodeEmail
      await EmailService.sendDiscountCodeEmail(user, discountData);

      // Then: Should use email as name
      expect(sendTemplatedEmailSpy).toHaveBeenCalledWith(
        user.email,
        'DISCOUNT_CODE',
        expect.objectContaining({
          name: user.email, // Fallback to email
        })
      );

      sendTemplatedEmailSpy.mockRestore();
    });
  });

  describe('EMAIL-013-020: sendOrderStatusUpdateEmail() - Status mapping', () => {
    const user = createMockUser();

    test('EMAIL-013: Should send processing status email', async () => {
      // Given: Order with processing status
      const order = { ...createMockOrder(), estimatedDelivery: '2025-12-01' };
      const newStatus = 'processing';

      const sendTemplatedEmailSpy = jest.spyOn(EmailService, 'sendTemplatedEmail');

      // When: Call sendOrderStatusUpdateEmail
      await EmailService.sendOrderStatusUpdateEmail(user, order, newStatus);

      // Then: Should use ORDER_PROCESSING template
      expect(sendTemplatedEmailSpy).toHaveBeenCalledWith(
        user.email,
        'ORDER_PROCESSING',
        expect.objectContaining({
          name: user.fullName,
          orderNumber: order._id.toString(),
          estimatedDelivery: order.estimatedDelivery,
        })
      );

      sendTemplatedEmailSpy.mockRestore();
    });

    test('EMAIL-014: Should send shipped status email', async () => {
      // Given: Order with shipped status
      const order = { ...createMockOrder(), trackingNumber: 'TRK123456' };
      const newStatus = 'shipped';

      const sendTemplatedEmailSpy = jest.spyOn(EmailService, 'sendTemplatedEmail');

      // When: Call sendOrderStatusUpdateEmail
      await EmailService.sendOrderStatusUpdateEmail(user, order, newStatus);

      // Then: Should use ORDER_SHIPPED template
      expect(sendTemplatedEmailSpy).toHaveBeenCalledWith(
        user.email,
        'ORDER_SHIPPED',
        expect.objectContaining({
          trackingNumber: order.trackingNumber,
        })
      );

      sendTemplatedEmailSpy.mockRestore();
    });

    test('EMAIL-015: Should send delivered status email', async () => {
      // Given: Order with delivered status
      const order = { ...createMockOrder(), updatedAt: new Date('2025-11-28') };
      const newStatus = 'delivered';

      const sendTemplatedEmailSpy = jest.spyOn(EmailService, 'sendTemplatedEmail');

      // When: Call sendOrderStatusUpdateEmail
      await EmailService.sendOrderStatusUpdateEmail(user, order, newStatus);

      // Then: Should use ORDER_DELIVERED template
      expect(sendTemplatedEmailSpy).toHaveBeenCalledWith(
        user.email,
        'ORDER_DELIVERED',
        expect.objectContaining({
          deliveryDate: order.updatedAt,
        })
      );

      sendTemplatedEmailSpy.mockRestore();
    });

    test('EMAIL-016: Should send cancelled status email', async () => {
      // Given: Order with cancelled status
      const order = {
        ...createMockOrder(),
        cancellationReason: 'User request',
        refundAmount: 100000,
      };
      const newStatus = 'cancelled';

      const sendTemplatedEmailSpy = jest.spyOn(EmailService, 'sendTemplatedEmail');

      // When: Call sendOrderStatusUpdateEmail
      await EmailService.sendOrderStatusUpdateEmail(user, order, newStatus);

      // Then: Should use ORDER_CANCELLED template
      expect(sendTemplatedEmailSpy).toHaveBeenCalledWith(
        user.email,
        'ORDER_CANCELLED',
        expect.objectContaining({
          cancellationReason: order.cancellationReason,
          refundAmount: order.refundAmount,
        })
      );

      sendTemplatedEmailSpy.mockRestore();
    });

    test('EMAIL-017: Should send refunded status email', async () => {
      // Given: Order with refunded status
      const order = {
        ...createMockOrder(),
        refundAmount: 100000,
        refundReason: 'Product defect',
        refundedAt: new Date(),
      };
      const newStatus = 'refunded';

      const sendTemplatedEmailSpy = jest.spyOn(EmailService, 'sendTemplatedEmail');

      // When: Call sendOrderStatusUpdateEmail
      await EmailService.sendOrderStatusUpdateEmail(user, order, newStatus);

      // Then: Should use ORDER_REFUNDED template
      expect(sendTemplatedEmailSpy).toHaveBeenCalledWith(
        user.email,
        'ORDER_REFUNDED',
        expect.objectContaining({
          refundAmount: order.refundAmount,
          refundReason: order.refundReason,
          refundDate: order.refundedAt,
        })
      );

      sendTemplatedEmailSpy.mockRestore();
    });

    test('EMAIL-018: Should send refund_pending status email', async () => {
      // Given: Order with refund_pending status
      const order = {
        ...createMockOrder(),
        refundAmount: 100000,
        refundReason: 'Processing refund',
      };
      const newStatus = 'refund_pending';

      const sendTemplatedEmailSpy = jest.spyOn(EmailService, 'sendTemplatedEmail');

      // When: Call sendOrderStatusUpdateEmail
      await EmailService.sendOrderStatusUpdateEmail(user, order, newStatus);

      // Then: Should use ORDER_REFUND_PENDING template
      expect(sendTemplatedEmailSpy).toHaveBeenCalledWith(
        user.email,
        'ORDER_REFUND_PENDING',
        expect.objectContaining({
          refundAmount: order.refundAmount,
          refundReason: order.refundReason,
        })
      );

      sendTemplatedEmailSpy.mockRestore();
    });

    test('EMAIL-019: Should send failed status email', async () => {
      // Given: Order with failed status
      const order = { ...createMockOrder(), paymentMethod: 'VNPay', totalPrice: 100000 };
      const newStatus = 'failed';

      const sendTemplatedEmailSpy = jest.spyOn(EmailService, 'sendTemplatedEmail');

      // When: Call sendOrderStatusUpdateEmail
      await EmailService.sendOrderStatusUpdateEmail(user, order, newStatus);

      // Then: Should use ORDER_FAILED template
      expect(sendTemplatedEmailSpy).toHaveBeenCalledWith(
        user.email,
        'ORDER_FAILED',
        expect.objectContaining({
          paymentMethod: order.paymentMethod,
          totalAmount: order.totalPrice,
        })
      );

      sendTemplatedEmailSpy.mockRestore();
    });

    test('EMAIL-020: Should handle unknown status', async () => {
      // Given: Unknown status
      const order = createMockOrder();
      const newStatus = 'unknown_status';

      const sendTemplatedEmailSpy = jest.spyOn(EmailService, 'sendTemplatedEmail');

      // When: Call sendOrderStatusUpdateEmail
      await EmailService.sendOrderStatusUpdateEmail(user, order, newStatus);

      // Then: Should log warning and return early (no email sent)
      expect(mockLogger.warn).toHaveBeenCalledWith('No email template for status:', newStatus);
      expect(sendTemplatedEmailSpy).not.toHaveBeenCalled();

      sendTemplatedEmailSpy.mockRestore();
    });
  });

  describe('EMAIL-022: generateOrderDetails() - Happy path', () => {
    test('Should generate HTML with order details', async () => {
      // Given: Order with populated items
      const order = createMockOrderWithItems(2, {
        subtotal: 1100000,
        shippingCost: 50000,
        tax: 50000,
        discount: 100000,
        totalPrice: 1100000,
        shippingAddress: '123 Test Street, Test City',
        paymentMethod: 'COD',
        status: 'pending',
      });

      // When: Call generateOrderDetails
      const html = await EmailService.generateOrderDetails(order);

      // Then: HTML should contain order details
      expect(html).toContain('Nike Shoe 1');
      expect(html).toContain('Nike Shoe 2');
      expect(html).toContain('123 Test Street, Test City');
      expect(html).toContain('COD');
      expect(html).toContain('pending');

      // Should contain pricing breakdown
      expect(html).toContain('Subtotal');
      expect(html).toContain('Shipping');
      expect(html).toContain('Tax');
      expect(html).toContain('Discount');
      expect(html).toContain('Total');

      // Should log info
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Generating order details for email',
        expect.any(Object)
      );
    });
  });

  describe('EMAIL-025: generateOrderDetails() - Empty items', () => {
    test('Should return fallback message for empty items', async () => {
      // Given: Order with no items
      const order = createMockOrder({ items: [] });

      // When: Call generateOrderDetails
      const html = await EmailService.generateOrderDetails(order);

      // Then: Should contain fallback message
      expect(html).toContain('Order details are being processed...');
      // Logger may or may not be called depending on code path
    });
  });

  describe('EMAIL-024: generateOrderDetails() - Null product', () => {
    test('Should handle item with null product', async () => {
      // Given: Order with item that has null product
      const order = {
        ...createMockOrder(),
        items: [
          {
            _id: 'item1',
            product: null,
            quantity: 1,
            price: 100000,
          },
        ],
        populate: jest.fn().mockResolvedValue(this),
      };

      // When: Call generateOrderDetails
      const html = await EmailService.generateOrderDetails(order);

      // Then: Should show fallback for missing product
      expect(html).toContain('Product (ID: Unknown)');
      expect(html).toContain('Quantity: 1');
    });
  });

  describe('EMAIL-028: generateOrderDetails() - Population error', () => {
    test('Should return fallback HTML when population fails', async () => {
      // Given: Order that throws on populate
      const order = createMockOrderWithPopulate();
      order.populate.mockRejectedValueOnce(new Error('Population failed'));

      // When: Call generateOrderDetails
      const html = await EmailService.generateOrderDetails(order);

      // Then: Should return fallback HTML
      expect(html).toContain('Order details are being processed...');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error generating order details:',
        expect.any(Error)
      );
    });
  });

  describe('Additional error coverage', () => {
    test('Should handle error in sendOrderConfirmationEmail when sendTemplatedEmail fails', async () => {
      // Given: Valid user and order, but sendTemplatedEmail throws
      const user = createMockUser();
      const order = createMockOrderWithItems(1);

      // Mock sendTemplatedEmail to throw after generateOrderDetails succeeds
      const sendTemplatedEmailSpy = jest
        .spyOn(EmailService, 'sendTemplatedEmail')
        .mockRejectedValueOnce(new Error('Email send failed'));

      // When/Then: Should throw error and log it
      await expect(EmailService.sendOrderConfirmationEmail(user, order)).rejects.toThrow(
        'Email send failed'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error sending order confirmation email:',
        expect.any(Error)
      );

      sendTemplatedEmailSpy.mockRestore();
    });

    test('Should handle error in sendDiscountCodeEmail', async () => {
      // Given: Valid user and discount, but sendTemplatedEmail throws
      const user = createMockUser();
      const discountData = createMockDiscountData();

      const sendTemplatedEmailSpy = jest
        .spyOn(EmailService, 'sendTemplatedEmail')
        .mockRejectedValueOnce(new Error('Discount email failed'));

      // When/Then: Should throw error and log it
      await expect(EmailService.sendDiscountCodeEmail(user, discountData)).rejects.toThrow(
        'Discount email failed'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error sending discount code email:',
        expect.any(Error)
      );

      sendTemplatedEmailSpy.mockRestore();
    });

    test('Should handle error in sendOrderStatusUpdateEmail', async () => {
      // Given: Valid user, order, status but sendTemplatedEmail throws
      const user = createMockUser();
      const order = createMockOrder();

      const sendTemplatedEmailSpy = jest
        .spyOn(EmailService, 'sendTemplatedEmail')
        .mockRejectedValueOnce(new Error('Status email failed'));

      // When/Then: Should throw error and log it
      await expect(EmailService.sendOrderStatusUpdateEmail(user, order, 'shipped')).rejects.toThrow(
        'Status email failed'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error sending order status update email:',
        expect.any(Error)
      );

      sendTemplatedEmailSpy.mockRestore();
    });
  });

  describe('Branch coverage for generateOrderDetails', () => {
    test('Should handle order with no shippingCost, tax, discount', async () => {
      // Given: Order with all optional costs = 0, already populated
      const order = {
        _id: new mongoose.Types.ObjectId(),
        items: [
          {
            _id: new mongoose.Types.ObjectId(),
            product: {
              _id: new mongoose.Types.ObjectId(),
              name: 'Nike Shoe',
              mainImage: 'image.jpg',
              price: 500000,
            },
            quantity: 1,
            price: 500000,
          },
        ],
        subtotal: 500000,
        shippingCost: 0,
        tax: 0,
        discount: 0,
        totalPrice: 500000,
        shippingAddress: '123 Test St',
        paymentMethod: 'COD',
        status: 'pending',
        populate: jest.fn().mockReturnThis(),
      };

      // When: Generate order details
      const html = await EmailService.generateOrderDetails(order);

      // Then: Should not include shipping, tax, discount lines (they're rendered with value 0)
      expect(html).toContain('Subtotal:');
      expect(html).toContain('Total:');
      // Note: With shippingCost/tax/discount = 0, the conditional doesn't render them
      expect(html).not.toMatch(/Shipping:[\s\S]*undefined VND/); // Check it's properly handled
    });

    test('Should handle order with all costs present', async () => {
      // Given: Order with all costs > 0, already populated
      const order = {
        _id: new mongoose.Types.ObjectId(),
        items: [
          {
            _id: new mongoose.Types.ObjectId(),
            product: {
              _id: new mongoose.Types.ObjectId(),
              name: 'Nike Shoe',
              mainImage: 'image.jpg',
              price: 500000,
            },
            quantity: 1,
            price: 500000,
          },
        ],
        subtotal: 500000,
        shippingCost: 50000,
        tax: 100000,
        discount: 200000,
        totalPrice: 450000,
        shippingAddress: '123 Test St',
        paymentMethod: 'COD',
        status: 'pending',
        populate: jest.fn().mockReturnThis(),
      };

      // When: Generate order details
      const html = await EmailService.generateOrderDetails(order);

      // Then: Should include all cost lines
      expect(html).toContain('Shipping:');
      expect(html).toContain('Tax:');
      expect(html).toContain('Discount:');
    });

    test('Should handle order with null shippingAddress, paymentMethod, status', async () => {
      // Given: Order with null optional fields, already populated
      const order = {
        _id: new mongoose.Types.ObjectId(),
        items: [
          {
            _id: new mongoose.Types.ObjectId(),
            product: {
              _id: new mongoose.Types.ObjectId(),
              name: 'Nike Shoe',
              mainImage: 'image.jpg',
              price: 500000,
            },
            quantity: 1,
            price: 500000,
          },
        ],
        subtotal: 500000,
        shippingCost: 0,
        tax: 0,
        discount: 0,
        totalPrice: 500000,
        shippingAddress: null,
        paymentMethod: null,
        status: null,
        populate: jest.fn().mockReturnThis(),
      };

      // When: Generate order details
      const html = await EmailService.generateOrderDetails(order);

      // Then: Should use fallback values
      expect(html).toContain('Address not available');
      expect(html).toContain('Not specified');
      expect(html).toContain('Pending');
    });

    test('Should handle product with no name', async () => {
      // Given: Order with product missing name, already populated
      const order = {
        _id: new mongoose.Types.ObjectId(),
        items: [
          {
            _id: new mongoose.Types.ObjectId(),
            product: {
              _id: new mongoose.Types.ObjectId(),
              name: null, // No name
              mainImage: 'image.jpg',
              price: 500000,
            },
            quantity: 1,
            price: 500000,
          },
        ],
        subtotal: 500000,
        shippingCost: 0,
        tax: 0,
        discount: 0,
        totalPrice: 500000,
        shippingAddress: '123 Test St',
        paymentMethod: 'COD',
        status: 'pending',
        populate: jest.fn().mockReturnThis(),
      };

      // When: Generate order details
      const html = await EmailService.generateOrderDetails(order);

      // Then: Should use 'Unknown Product'
      expect(html).toContain('Unknown Product');
    });

    test('Should handle already populated order (no string items)', async () => {
      // Given: Order with items already populated (not strings)
      const product1 = createMockProduct({
        _id: new mongoose.Types.ObjectId(),
        name: 'Pre-populated Product',
      });
      const product2 = createMockProduct({
        _id: new mongoose.Types.ObjectId(),
        name: 'Another Product',
      });

      const order = {
        _id: new mongoose.Types.ObjectId(),
        items: [
          {
            _id: new mongoose.Types.ObjectId(),
            product: product1,
            quantity: 2,
            price: 500000,
          },
          {
            _id: new mongoose.Types.ObjectId(),
            product: product2,
            quantity: 1,
            price: 800000,
          },
        ],
        subtotal: 1800000,
        shippingCost: 50000,
        tax: 0,
        discount: 0,
        totalPrice: 1850000,
        shippingAddress: '123 Test St',
        paymentMethod: 'COD',
        status: 'pending',
        populate: jest.fn().mockReturnThis(),
      };

      // When: Generate order details (should NOT call populate)
      const html = await EmailService.generateOrderDetails(order);

      // Then: Should use existing items without calling populate
      expect(order.populate).not.toHaveBeenCalled();
      expect(html).toContain('Pre-populated Product');
      expect(html).toContain('Another Product');
      expect(html).toContain('Quantity: 2');
      expect(html).toContain('Quantity: 1');
    });

    test('Should populate order when items are string IDs', async () => {
      // Given: Order with items as string IDs (not populated)
      const productId = new mongoose.Types.ObjectId();
      const populatedOrder = {
        _id: new mongoose.Types.ObjectId(),
        items: [
          {
            _id: new mongoose.Types.ObjectId(),
            product: {
              _id: productId,
              name: 'Populated Product',
              mainImage: 'image.jpg',
              price: 500000,
            },
            quantity: 1,
            price: 500000,
          },
        ],
        subtotal: 500000,
        shippingCost: 0,
        tax: 0,
        discount: 0,
        totalPrice: 500000,
        shippingAddress: '123 Test St',
        paymentMethod: 'COD',
        status: 'pending',
      };

      const order = {
        _id: populatedOrder._id,
        items: [productId.toString()], // String ID - needs population
        subtotal: 500000,
        shippingCost: 0,
        tax: 0,
        discount: 0,
        totalPrice: 500000,
        shippingAddress: '123 Test St',
        paymentMethod: 'COD',
        status: 'pending',
        populate: jest.fn().mockResolvedValue(populatedOrder),
      };

      // When: Generate order details
      const html = await EmailService.generateOrderDetails(order);

      // Then: Should call populate
      expect(order.populate).toHaveBeenCalledWith({
        path: 'items',
        populate: {
          path: 'product',
          select: 'name mainImage price',
        },
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Populating order items for email');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Order populated successfully',
        expect.objectContaining({
          itemsCount: 1,
        })
      );
      expect(html).toContain('Populated Product');
    });

    test('Should handle order with empty items array and show fallback', async () => {
      // Given: Order with empty items array
      const order = {
        _id: new mongoose.Types.ObjectId(),
        items: [],
        subtotal: 0,
        shippingCost: 0,
        tax: 0,
        discount: 0,
        totalPrice: 0,
        shippingAddress: '123 Test St',
        paymentMethod: 'COD',
        status: 'pending',
        populate: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          items: [], // Still empty after populate
          subtotal: 0,
          shippingCost: 0,
          tax: 0,
          discount: 0,
          totalPrice: 0,
          shippingAddress: '123 Test St',
          paymentMethod: 'COD',
          status: 'pending',
        }),
      };

      // When: Generate order details
      const html = await EmailService.generateOrderDetails(order);

      // Then: Should show fallback message
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No items HTML generated, showing fallback message'
      );
      expect(html).toContain('Order items are being processed...');
    });

    test('Should handle undefined items and show fallback', async () => {
      // Given: Order with undefined items
      const order = {
        _id: new mongoose.Types.ObjectId(),
        items: undefined,
        subtotal: 0,
        shippingCost: 0,
        tax: 0,
        discount: 0,
        totalPrice: 0,
        shippingAddress: '123 Test St',
        paymentMethod: 'COD',
        status: 'pending',
        populate: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          items: [],
          subtotal: 0,
          shippingCost: 0,
          tax: 0,
          discount: 0,
          totalPrice: 0,
          shippingAddress: '123 Test St',
          paymentMethod: 'COD',
          status: 'pending',
        }),
      };

      // When: Generate order details
      const html = await EmailService.generateOrderDetails(order);

      // Then: Should populate and show fallback if still empty
      expect(order.populate).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No items HTML generated, showing fallback message'
      );
      expect(html).toContain('Order items are being processed...');
    });
  });
});
