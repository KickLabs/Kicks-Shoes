/**
 * Unit Tests for Email Templates
 * Tests email template rendering and structure
 */

import { jest, describe, test, expect } from '@jest/globals';
import { emailTemplates } from '../../src/templates/email.templates.js';

describe('Email Templates Unit Tests', () => {
  describe('EMAIL-051: Verify all templates exist', () => {
    const requiredTemplates = [
      'REGISTRATION',
      'VERIFICATION',
      'PASSWORD_RESET',
      'ORDER_CONFIRMATION',
      'ORDER_SHIPPED',
      'OTP',
      'DISCOUNT_CODE',
      'PRODUCT_WARNING',
      'PRODUCT_DELETED',
      'REVIEW_DELETED',
      'REPORT_RESOLVED',
      'USER_DELETED',
      'ORDER_PROCESSING',
      'ORDER_DELIVERED',
      'ORDER_CANCELLED',
      'ORDER_REFUNDED',
      'ORDER_FAILED',
      'ORDER_REFUND_PENDING',
      'PRODUCT_REPORTED',
      'REPORT_SUBMITTED',
      'REVIEW_DELETED_SHOP',
      'REVIEW_WARNING',
      'REVIEW_REPORTED',
      'REVIEW_REPORT_SUBMITTED',
      'USER_BANNED',
      'USER_UNBANNED',
      'LIVESTREAM_ORDER_SUCCESS',
      'LIVESTREAM_OUT_OF_STOCK',
    ];

    test('Should have all required templates', () => {
      requiredTemplates.forEach(templateKey => {
        expect(emailTemplates[templateKey]).toBeDefined();
        expect(emailTemplates[templateKey]).toHaveProperty('subject');
        expect(emailTemplates[templateKey]).toHaveProperty('getContent');
        expect(typeof emailTemplates[templateKey].getContent).toBe('function');
      });
    });
  });

  describe('EMAIL-052: Verify template subjects', () => {
    test('Should have non-empty subjects for all templates', () => {
      Object.keys(emailTemplates).forEach(key => {
        const template = emailTemplates[key];
        expect(template.subject).toBeDefined();
        expect(typeof template.subject).toBe('string');
        expect(template.subject.length).toBeGreaterThan(0);
      });
    });
  });

  describe('EMAIL-036: REGISTRATION template', () => {
    test('Should render with user data', () => {
      const data = {
        name: 'John Doe',
        verificationLink: 'http://test.com/verify?token=123',
      };

      const html = emailTemplates.REGISTRATION.getContent(data);

      expect(html).toContain('John Doe');
      expect(html).toContain('http://test.com/verify?token=123');
      expect(html).toContain('Welcome to Kicks Shoes!');
      expect(emailTemplates.REGISTRATION.subject).toContain('Welcome');
    });
  });

  describe('EMAIL-037: VERIFICATION template', () => {
    test('Should render with user data', () => {
      const data = {
        name: 'Jane Smith',
        verificationLink: 'http://test.com/verify?token=456',
      };

      const html = emailTemplates.VERIFICATION.getContent(data);

      expect(html).toContain('Jane Smith');
      expect(html).toContain('http://test.com/verify?token=456');
      expect(emailTemplates.VERIFICATION.subject).toContain('Verify Your Email');
    });
  });

  describe('EMAIL-038: PASSWORD_RESET template', () => {
    test('Should render with reset link', () => {
      const data = {
        name: 'Bob Johnson',
        resetLink: 'http://test.com/reset?token=789',
      };

      const html = emailTemplates.PASSWORD_RESET.getContent(data);

      expect(html).toContain('Bob Johnson');
      expect(html).toContain('http://test.com/reset?token=789');
      expect(emailTemplates.PASSWORD_RESET.subject).toContain('Reset Your Password');
    });
  });

  describe('EMAIL-039: ORDER_CONFIRMATION template', () => {
    test('Should render with order details', () => {
      const data = {
        name: 'Alice Williams',
        orderNumber: 'ORD123456',
        orderDetails: '<div>Order item 1</div><div>Order item 2</div>',
      };

      const html = emailTemplates.ORDER_CONFIRMATION.getContent(data);

      expect(html).toContain('Alice Williams');
      expect(html).toContain('ORD123456');
      expect(html).toContain('Order item 1');
      expect(emailTemplates.ORDER_CONFIRMATION.subject).toContain('Order Confirmation');
    });
  });

  describe('EMAIL-040: OTP template', () => {
    test('Should render with OTP code', () => {
      const data = {
        name: 'Test User',
        otp: '123456',
      };

      const html = emailTemplates.OTP.getContent(data);

      expect(html).toContain('Test User');
      expect(html).toContain('123456');
      expect(html).toContain('5 minutes'); // Expiry notice
      expect(emailTemplates.OTP.subject).toContain('OTP');
    });
  });

  describe('EMAIL-041: DISCOUNT_CODE template', () => {
    test('Should render with formatted currency and dates', () => {
      const data = {
        name: 'Customer',
        code: 'SAVE50',
        value: 50000,
        description: 'Reward discount',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-01-01'),
        points: 50,
      };

      const html = emailTemplates.DISCOUNT_CODE.getContent(data);

      expect(html).toContain('Customer');
      expect(html).toContain('SAVE50');
      expect(html).toContain('50'); // points
      expect(html).toContain('₫'); // VND currency
      expect(emailTemplates.DISCOUNT_CODE.subject).toContain('Discount Code');
    });
  });

  describe('EMAIL-042: ORDER_SHIPPED template', () => {
    test('Should render with tracking info', () => {
      const data = {
        name: 'User',
        orderNumber: 'ORD789',
        trackingNumber: 'TRK456789',
      };

      const html = emailTemplates.ORDER_SHIPPED.getContent(data);

      expect(html).toContain('User');
      expect(html).toContain('ORD789');
      expect(html).toContain('TRK456789');
      expect(emailTemplates.ORDER_SHIPPED.subject).toContain('Shipped');
    });
  });

  describe('EMAIL-043: ORDER_DELIVERED template', () => {
    test('Should render with delivery date', () => {
      const data = {
        name: 'User',
        orderNumber: 'ORD999',
        deliveryDate: new Date('2025-11-28'),
      };

      const html = emailTemplates.ORDER_DELIVERED.getContent(data);

      expect(html).toContain('User');
      expect(html).toContain('ORD999');
      expect(emailTemplates.ORDER_DELIVERED.subject).toContain('Delivered');
    });
  });

  describe('EMAIL-044: ORDER_CANCELLED template', () => {
    test('Should render with cancellation details', () => {
      const data = {
        name: 'User',
        orderNumber: 'ORD111',
        cancellationReason: 'User request',
        refundAmount: 100000,
      };

      const html = emailTemplates.ORDER_CANCELLED.getContent(data);

      expect(html).toContain('User');
      expect(html).toContain('ORD111');
      expect(html).toContain('User request');
      expect(html).toContain('₫');
      expect(emailTemplates.ORDER_CANCELLED.subject).toContain('Cancellation');
    });
  });

  describe('EMAIL-045: LIVESTREAM_ORDER_SUCCESS template', () => {
    test('Should render livestream order success', () => {
      const data = {
        name: 'User',
        orderNumber: 'ORD555',
        paymentMethod: 'COD',
      };

      const html = emailTemplates.LIVESTREAM_ORDER_SUCCESS.getContent(data);

      expect(html).toContain('User');
      expect(html).toContain('ORD555');
      expect(html).toContain('COD');
      expect(emailTemplates.LIVESTREAM_ORDER_SUCCESS.subject).toContain('Livestream Order');
    });
  });

  describe('EMAIL-046: LIVESTREAM_OUT_OF_STOCK template', () => {
    test('Should render out of stock message', () => {
      const data = {
        name: 'User',
        productName: 'Nike Air Max',
        size: '42',
        color: 'Red',
      };

      const html = emailTemplates.LIVESTREAM_OUT_OF_STOCK.getContent(data);

      expect(html).toContain('User');
      expect(html).toContain('Nike Air Max');
      expect(html).toContain('42');
      expect(html).toContain('Red');
      expect(emailTemplates.LIVESTREAM_OUT_OF_STOCK.subject).toContain('out of stock');
    });
  });

  describe('EMAIL-047: Template with missing optional data', () => {
    test('Should render with undefined values for missing data', () => {
      const data = {
        name: 'User',
        orderNumber: 'ORD123',
        // Missing optional fields like cancellationReason, refundAmount
      };

      const html = emailTemplates.ORDER_CANCELLED.getContent(data);

      expect(html).toContain('User');
      expect(html).toContain('ORD123');
      // Template should handle undefined gracefully
    });
  });

  describe('EMAIL-048: Template with special HTML characters', () => {
    test('Should render HTML characters without escaping (XSS risk)', () => {
      const data = {
        name: '<script>alert("XSS")</script>',
        verificationLink: 'http://test.com/verify',
      };

      const html = emailTemplates.VERIFICATION.getContent(data);

      // Template does NOT escape HTML (this is a security concern that should be documented)
      expect(html).toContain('<script>alert("XSS")</script>');
    });
  });

  describe('EMAIL-049: Template with very long strings', () => {
    test('Should handle very long strings', () => {
      const data = {
        name: 'A'.repeat(1000),
        verificationLink: 'http://test.com/verify',
      };

      const html = emailTemplates.VERIFICATION.getContent(data);

      expect(html).toContain('A'.repeat(1000));
      expect(html.length).toBeGreaterThan(1000);
    });
  });

  describe('EMAIL-050: Template with invalid date format', () => {
    test('Should display "Invalid Date" for invalid date', () => {
      const data = {
        name: 'User',
        orderNumber: 'ORD123',
        deliveryDate: 'invalid-date',
      };

      const html = emailTemplates.ORDER_DELIVERED.getContent(data);

      // new Date('invalid-date') returns Invalid Date
      expect(html).toContain('Invalid Date');
    });
  });

  describe('Additional template coverage', () => {
    test('ORDER_PROCESSING template', () => {
      const data = {
        name: 'User',
        orderNumber: 'ORD123',
        estimatedDelivery: '2025-12-01',
      };

      const html = emailTemplates.ORDER_PROCESSING.getContent(data);

      expect(html).toContain('User');
      expect(html).toContain('ORD123');
      expect(emailTemplates.ORDER_PROCESSING.subject).toContain('Processed');
    });

    test('ORDER_REFUNDED template', () => {
      const data = {
        name: 'User',
        orderNumber: 'ORD123',
        refundAmount: 100000,
        refundReason: 'Product defect',
        refundDate: new Date(),
      };

      const html = emailTemplates.ORDER_REFUNDED.getContent(data);

      expect(html).toContain('User');
      expect(html).toContain('ORD123');
      expect(html).toContain('Product defect');
      expect(emailTemplates.ORDER_REFUNDED.subject).toContain('Refund');
    });

    test('ORDER_FAILED template', () => {
      const data = {
        name: 'User',
        orderNumber: 'ORD123',
        paymentMethod: 'VNPay',
        totalAmount: 100000,
      };

      const html = emailTemplates.ORDER_FAILED.getContent(data);

      expect(html).toContain('User');
      expect(html).toContain('ORD123');
      expect(html).toContain('VNPay');
      expect(emailTemplates.ORDER_FAILED.subject).toContain('Failed');
    });

    test('PRODUCT_WARNING template', () => {
      const data = {
        shopName: 'Test Shop',
        productName: 'Test Product',
        adminNote: 'Policy violation',
        resolution: 'Warning issued',
      };

      const html = emailTemplates.PRODUCT_WARNING.getContent(data);

      expect(html).toContain('Test Shop');
      expect(html).toContain('Test Product');
      expect(html).toContain('Policy violation');
      expect(emailTemplates.PRODUCT_WARNING.subject).toContain('Warning');
    });

    test('REPORT_RESOLVED template', () => {
      const data = {
        userName: 'User',
        productName: 'Product',
        adminNote: 'Action taken',
        resolution: 'Resolved',
        reportReason: 'Spam',
        reportDescription: 'Description',
      };

      const html = emailTemplates.REPORT_RESOLVED.getContent(data);

      expect(html).toContain('User');
      expect(html).toContain('Product');
      expect(html).toContain('Resolved');
      expect(emailTemplates.REPORT_RESOLVED.subject).toContain('Report');
    });
  });

  describe('Additional templates coverage (12 more templates)', () => {
    test('PRODUCT_DELETED template', () => {
      expect(emailTemplates.PRODUCT_DELETED.subject).toContain('Product Deletion');
      const html = emailTemplates.PRODUCT_DELETED.getContent({
        shopName: 'Test Shop',
        productName: 'Test Product',
        adminNote: 'Violation',
        resolution: 'Permanent deletion',
      });
      expect(html).toContain('Test Shop');
      expect(html).toContain('Test Product');
      expect(html).toContain('Violation');
      expect(html).toContain('Permanent deletion');
    });

    test('REVIEW_DELETED template', () => {
      expect(emailTemplates.REVIEW_DELETED.subject).toContain('Review Deletion');
      const html = emailTemplates.REVIEW_DELETED.getContent({
        userName: 'Test User',
        productName: 'Test Product',
        adminNote: 'Spam content',
        resolution: 'Deleted',
      });
      expect(html).toContain('Test User');
      expect(html).toContain('Test Product');
      expect(html).toContain('Spam content');
    });

    test('USER_DELETED template', () => {
      expect(emailTemplates.USER_DELETED.subject).toContain('User Deletion');
      const html = emailTemplates.USER_DELETED.getContent({
        userName: 'Test User',
        adminNote: 'Multiple violations',
        resolution: 'Account terminated',
      });
      expect(html).toContain('Test User');
      expect(html).toContain('Multiple violations');
      expect(html).toContain('Account terminated');
    });

    test('ORDER_REFUND_PENDING template', () => {
      expect(emailTemplates.ORDER_REFUND_PENDING.subject).toContain('Refund Processing');
      const html = emailTemplates.ORDER_REFUND_PENDING.getContent({
        name: 'Test User',
        orderNumber: 'ORD-123',
        refundAmount: 1000000,
        refundReason: 'Changed mind',
      });
      expect(html).toContain('Test User');
      expect(html).toContain('ORD-123');
      expect(html).toContain('1.000.000');
    });

    test('PRODUCT_REPORTED template', () => {
      expect(emailTemplates.PRODUCT_REPORTED.subject).toContain('Product Reported');
      const html = emailTemplates.PRODUCT_REPORTED.getContent({
        shopName: 'Test Shop',
        productName: 'Test Product',
        reporterName: 'Reporter User',
        reason: 'Counterfeit',
        description: 'This product is fake',
      });
      expect(html).toContain('Test Shop');
      expect(html).toContain('Test Product');
      expect(html).toContain('Reporter User');
      expect(html).toContain('Counterfeit');
    });

    test('REPORT_SUBMITTED template', () => {
      expect(emailTemplates.REPORT_SUBMITTED.subject).toContain('Report Submitted');
      const html = emailTemplates.REPORT_SUBMITTED.getContent({
        userName: 'Test User',
        productName: 'Test Product',
        reason: 'Counterfeit',
        description: 'This is fake',
      });
      expect(html).toContain('Test User');
      expect(html).toContain('Test Product');
      expect(html).toContain('Counterfeit');
    });

    test('REVIEW_DELETED_SHOP template', () => {
      expect(emailTemplates.REVIEW_DELETED_SHOP.subject).toContain('Review Deletion');
      const html = emailTemplates.REVIEW_DELETED_SHOP.getContent({
        shopName: 'Test Shop',
        productName: 'Test Product',
        userName: 'Test Reviewer',
        adminNote: 'Inappropriate',
        resolution: 'Deleted',
      });
      expect(html).toContain('Test Shop');
      expect(html).toContain('Test Product');
      expect(html).toContain('Test Reviewer');
      expect(html).toContain('Inappropriate');
    });

    test('REVIEW_WARNING template', () => {
      expect(emailTemplates.REVIEW_WARNING.subject).toContain('Review Warning');
      const html = emailTemplates.REVIEW_WARNING.getContent({
        userName: 'Test User',
        productName: 'Test Product',
        adminNote: 'Please revise',
      });
      expect(html).toContain('Test User');
      expect(html).toContain('Test Product');
      expect(html).toContain('Please revise');
    });

    test('REVIEW_REPORTED template', () => {
      expect(emailTemplates.REVIEW_REPORTED.subject).toContain('Review Reported');
      const html = emailTemplates.REVIEW_REPORTED.getContent({
        shopName: 'Test Shop',
        userName: 'Test User',
        productName: 'Test Product',
        reporterName: 'Reporter User',
        reason: 'Spam',
        description: 'This review is spam',
      });
      expect(html).toContain('Test Shop');
      expect(html).toContain('Test User');
      expect(html).toContain('Test Product');
      expect(html).toContain('Spam');
    });

    test('REVIEW_REPORT_SUBMITTED template', () => {
      expect(emailTemplates.REVIEW_REPORT_SUBMITTED.subject).toContain('Review Report');
      const html = emailTemplates.REVIEW_REPORT_SUBMITTED.getContent({
        userName: 'Test User',
        productName: 'Test Product',
      });
      expect(html).toContain('Test User');
      expect(html).toContain('Test Product');
    });

    test('USER_BANNED template', () => {
      expect(emailTemplates.USER_BANNED.subject).toContain('Account Suspended');
      const html = emailTemplates.USER_BANNED.getContent({
        userName: 'Test User',
        adminNote: 'Policy violation',
        banReason: 'Temporary ban',
      });
      expect(html).toContain('Test User');
      expect(html).toContain('Policy violation');
      expect(html).toContain('Temporary ban');
    });

    test('USER_UNBANNED template', () => {
      expect(emailTemplates.USER_UNBANNED.subject).toContain('Account Restored');
      const html = emailTemplates.USER_UNBANNED.getContent({
        userName: 'Test User',
        adminNote: 'Ban lifted',
      });
      expect(html).toContain('Test User');
      expect(html).toContain('Ban lifted');
    });
  });

  describe('All 28 templates coverage verification', () => {
    test('Should have all 28 templates defined and working', () => {
      const allTemplates = [
        'REGISTRATION',
        'VERIFICATION',
        'PASSWORD_RESET',
        'ORDER_CONFIRMATION',
        'OTP',
        'DISCOUNT_CODE',
        'ORDER_SHIPPED',
        'ORDER_DELIVERED',
        'ORDER_CANCELLED',
        'LIVESTREAM_ORDER_SUCCESS',
        'LIVESTREAM_OUT_OF_STOCK',
        'ORDER_PROCESSING',
        'ORDER_REFUNDED',
        'ORDER_FAILED',
        'ORDER_REFUND_PENDING',
        'PRODUCT_WARNING',
        'PRODUCT_DELETED',
        'PRODUCT_REPORTED',
        'REVIEW_DELETED',
        'REVIEW_DELETED_SHOP',
        'REVIEW_WARNING',
        'REVIEW_REPORTED',
        'REVIEW_REPORT_SUBMITTED',
        'REPORT_RESOLVED',
        'REPORT_SUBMITTED',
        'USER_DELETED',
        'USER_BANNED',
        'USER_UNBANNED',
      ];

      allTemplates.forEach(template => {
        expect(emailTemplates[template]).toBeDefined();
        expect(emailTemplates[template].subject).toBeDefined();
        expect(emailTemplates[template].getContent).toBeInstanceOf(Function);
      });

      // Verify count
      expect(allTemplates.length).toBe(28);
    });
  });

  describe('Branch coverage - Optional fields in templates', () => {
    test('ORDER_CANCELLED - with cancellationReason', () => {
      const html = emailTemplates.ORDER_CANCELLED.getContent({
        name: 'Test User',
        orderNumber: 'ORD-123',
        cancellationReason: 'Out of stock',
        refundAmount: 1000000,
      });
      expect(html).toContain('Out of stock');
    });

    test('ORDER_CANCELLED - without cancellationReason', () => {
      const html = emailTemplates.ORDER_CANCELLED.getContent({
        name: 'Test User',
        orderNumber: 'ORD-123',
        refundAmount: 1000000,
      });
      expect(html).toContain('ORD-123');
      expect(html).not.toContain('undefined');
    });

    test('ORDER_SHIPPED - with trackingNumber and estimatedDelivery', () => {
      const html = emailTemplates.ORDER_SHIPPED.getContent({
        name: 'Test User',
        orderNumber: 'ORD-123',
        trackingNumber: 'TRACK123',
        estimatedDelivery: new Date('2025-12-31'),
      });
      expect(html).toContain('TRACK123');
    });

    test('ORDER_SHIPPED - without trackingNumber', () => {
      const html = emailTemplates.ORDER_SHIPPED.getContent({
        name: 'Test User',
        orderNumber: 'ORD-123',
      });
      expect(html).toContain('ORD-123');
    });

    test('ORDER_REFUND_PENDING - with refundReason', () => {
      const html = emailTemplates.ORDER_REFUND_PENDING.getContent({
        name: 'Test User',
        orderNumber: 'ORD-123',
        refundAmount: 500000,
        refundReason: 'Defective product',
      });
      expect(html).toContain('Defective product');
    });

    test('ORDER_REFUND_PENDING - without refundReason', () => {
      const html = emailTemplates.ORDER_REFUND_PENDING.getContent({
        name: 'Test User',
        orderNumber: 'ORD-123',
        refundAmount: 500000,
      });
      expect(html).toContain('ORD-123');
    });

    test('PRODUCT_WARNING - with adminNote', () => {
      const html = emailTemplates.PRODUCT_WARNING.getContent({
        shopName: 'Test Shop',
        productName: 'Test Product',
        adminNote: 'Please update images',
        resolution: 'Warning issued',
      });
      expect(html).toContain('Please update images');
    });

    test('PRODUCT_WARNING - without adminNote', () => {
      const html = emailTemplates.PRODUCT_WARNING.getContent({
        shopName: 'Test Shop',
        productName: 'Test Product',
        resolution: 'Warning issued',
      });
      expect(html).toContain('Test Shop');
    });

    test('PRODUCT_DELETED - with adminNote', () => {
      const html = emailTemplates.PRODUCT_DELETED.getContent({
        shopName: 'Test Shop',
        productName: 'Test Product',
        adminNote: 'Counterfeit',
        resolution: 'Deleted',
      });
      expect(html).toContain('Counterfeit');
    });

    test('PRODUCT_DELETED - without adminNote', () => {
      const html = emailTemplates.PRODUCT_DELETED.getContent({
        shopName: 'Test Shop',
        productName: 'Test Product',
        resolution: 'Deleted',
      });
      expect(html).toContain('No additional notes');
    });

    test('REVIEW_DELETED - with adminNote', () => {
      const html = emailTemplates.REVIEW_DELETED.getContent({
        userName: 'Test User',
        productName: 'Test Product',
        adminNote: 'Inappropriate content',
        resolution: 'Deleted',
      });
      expect(html).toContain('Inappropriate content');
    });

    test('REVIEW_DELETED - without adminNote', () => {
      const html = emailTemplates.REVIEW_DELETED.getContent({
        userName: 'Test User',
        productName: 'Test Product',
        resolution: 'Deleted',
      });
      expect(html).toContain('No additional notes');
    });

    test('USER_BANNED - with banReason', () => {
      const html = emailTemplates.USER_BANNED.getContent({
        userName: 'Test User',
        banReason: 'Multiple violations',
        adminNote: 'Banned for 30 days',
      });
      expect(html).toContain('Multiple violations');
    });

    test('USER_BANNED - without banReason', () => {
      const html = emailTemplates.USER_BANNED.getContent({
        userName: 'Test User',
        adminNote: 'Banned for 30 days',
      });
      expect(html).toContain('Test User');
      expect(html).not.toContain('undefined');
    });

    test('REPORT_RESOLVED - with all optional fields', () => {
      const html = emailTemplates.REPORT_RESOLVED.getContent({
        userName: 'Test User',
        reportType: 'Product',
        reportedItem: 'Test Product',
        resolution: 'Resolved',
        reportReason: 'Spam',
        reportDescription: 'This is spam content',
      });
      expect(html).toContain('Resolved');
      expect(html).toContain('Spam');
    });

    test('PRODUCT_REPORTED - with undefined reporter', () => {
      const html = emailTemplates.PRODUCT_REPORTED.getContent({
        shopName: 'Test Shop',
        productName: 'Test Product',
      });
      expect(html).toContain('Test Shop');
      expect(html).toContain('Test Product');
    });

    test('REVIEW_DELETED_SHOP - without adminNote', () => {
      const html = emailTemplates.REVIEW_DELETED_SHOP.getContent({
        shopName: 'Test Shop',
        productName: 'Test Product',
        userName: 'Test User',
        resolution: 'Deleted',
      });
      expect(html).toContain('No additional notes');
    });

    test('REVIEW_WARNING - without adminNote', () => {
      const html = emailTemplates.REVIEW_WARNING.getContent({
        userName: 'Test User',
        productName: 'Test Product',
        resolution: 'Warning',
      });
      expect(html).toContain('Test User');
    });

    test('LIVESTREAM_OUT_OF_STOCK - with productName', () => {
      const html = emailTemplates.LIVESTREAM_OUT_OF_STOCK.getContent({
        name: 'Test User',
        productName: 'Nike Shoes',
      });
      expect(html).toContain('Nike Shoes');
    });

    test('USER_UNBANNED - with adminNote', () => {
      const html = emailTemplates.USER_UNBANNED.getContent({
        userName: 'Test User',
        adminNote: 'Ban lifted after review',
      });
      expect(html).toContain('Ban lifted after review');
    });

    test('USER_UNBANNED - without adminNote', () => {
      const html = emailTemplates.USER_UNBANNED.getContent({
        userName: 'Test User',
      });
      expect(html).toContain('Test User');
    });
  });
});
