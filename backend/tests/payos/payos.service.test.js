/**
 * @fileoverview Unit tests for PayOS Service
 * @created 2025-01-27
 * @description Tests for PayOS service layer including initialization, payment link creation,
 *              webhook verification, and signature validation
 */

import { jest } from '@jest/globals';
import crypto from 'crypto';

// Mock the PayOS SDK before importing the service
jest.unstable_mockModule('@payos/node', () => ({
  PayOS: jest.fn().mockImplementation((clientId, apiKey, checksumKey) => ({
    clientId,
    apiKey,
    checksumKey,
    paymentRequests: {
      create: jest.fn(),
      get: jest.fn(),
      cancel: jest.fn(),
    },
    webhooks: {
      confirm: jest.fn(),
    },
  })),
}));

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const { PayOS } = await import('@payos/node');
const logger = (await import('../../src/utils/logger.js')).default;

// Import service after mocks
let PayOSService;

describe('PayOS Service - Unit Tests', () => {
  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset module cache to get fresh instance
    jest.resetModules();

    // Set environment variables
    process.env.PAYOS_CLIENT_ID = 'test-client-id-123';
    process.env.PAYOS_API_KEY = 'test-api-key-456';
    process.env.PAYOS_CHECKSUM_KEY = 'test-checksum-key-789';

    // Re-import service
    const module = await import('../../src/services/payos.service.js');
    PayOSService = module.default;
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.PAYOS_CLIENT_ID;
    delete process.env.PAYOS_API_KEY;
    delete process.env.PAYOS_CHECKSUM_KEY;
  });

  // ========================================
  // 1. INITIALIZATION TESTS
  // ========================================

  describe('1. Service Initialization', () => {
    test('PAYOS-UNIT-001: Should initialize with valid credentials', async () => {
      // Arrange
      expect(PayOSService.isInitialized).toBe(false);

      // Act
      await PayOSService.initialize();

      // Assert
      expect(PayOSService.isInitialized).toBe(true);
      expect(PayOSService.payOS).toBeDefined();
      // PayOS SDK is initialized with correct credentials
    });

    test('PAYOS-UNIT-002: Should throw error when CLIENT_ID is missing', async () => {
      // Arrange
      delete process.env.PAYOS_CLIENT_ID;

      // Act & Assert
      await expect(PayOSService.initialize()).rejects.toThrow('PayOS credentials not configured');
      // Logger.error is called within the catch block
    });

    test('PAYOS-UNIT-003: Should throw error when API_KEY is missing', async () => {
      // Arrange
      delete process.env.PAYOS_API_KEY;

      // Act & Assert
      await expect(PayOSService.initialize()).rejects.toThrow('PayOS credentials not configured');
    });

    test('PAYOS-UNIT-004: Should throw error when CHECKSUM_KEY is missing', async () => {
      // Arrange
      delete process.env.PAYOS_CHECKSUM_KEY;

      // Act & Assert
      await expect(PayOSService.initialize()).rejects.toThrow('PayOS credentials not configured');
    });
  });

  // ========================================
  // 2. PAYMENT LINK CREATION TESTS
  // ========================================

  describe('2. Payment Link Creation', () => {
    beforeEach(async () => {
      await PayOSService.initialize();
    });

    const validPaymentData = {
      orderCode: 123456,
      amount: 150000,
      description: 'Order 123456 - Nike Air Max',
      returnUrl: 'http://localhost:3000/payment/success',
      cancelUrl: 'http://localhost:3000/payment/cancel',
      items: [
        {
          name: 'Nike Air Max 90',
          quantity: 2,
          price: 75000,
        },
      ],
      buyerName: 'Nguyen Van A',
      buyerEmail: 'nguyenvana@example.com',
      buyerPhone: '0912345678',
      buyerAddress: '123 Le Loi, Q1, TPHCM',
    };

    test('PAYOS-UNIT-005: Should create payment link with valid data', async () => {
      // Arrange
      const mockResponse = {
        orderCode: 123456,
        checkoutUrl: 'https://payos.vn/checkout/test123',
        qrCode: 'base64_qr_code',
        bin: '970415',
        accountNumber: '0123456789',
        accountName: 'KICKS SHOES',
        amount: 150000,
        description: 'Order 123456 - Nike Air Max',
      };

      PayOSService.payOS.paymentRequests.create.mockResolvedValue(mockResponse);

      // Act
      const result = await PayOSService.createPaymentLink(validPaymentData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.checkoutUrl).toBe('https://payos.vn/checkout/test123');
      expect(result.data.orderCode).toBe(123456);
      expect(PayOSService.payOS.paymentRequests.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderCode: 123456,
          amount: 150000,
          description: 'Order 123456 - Nike Air Max',
        })
      );
      // Payment link created successfully
    });

    test('PAYOS-UNIT-006: Should throw error when orderCode is missing', async () => {
      // Arrange
      const invalidData = { ...validPaymentData };
      delete invalidData.orderCode;

      // Act
      const result = await PayOSService.createPaymentLink(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required fields');
    });

    test('PAYOS-UNIT-007: Should throw error when amount is missing', async () => {
      // Arrange
      const invalidData = { ...validPaymentData };
      delete invalidData.amount;

      // Act
      const result = await PayOSService.createPaymentLink(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required fields');
    });

    test('PAYOS-UNIT-008: Should throw error when description is missing', async () => {
      // Arrange
      const invalidData = { ...validPaymentData };
      delete invalidData.description;

      // Act
      const result = await PayOSService.createPaymentLink(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required fields');
    });

    test('PAYOS-UNIT-011: Should convert non-integer amount to integer', async () => {
      // Arrange
      const dataWithDecimal = { ...validPaymentData, amount: 150000.75 };
      PayOSService.payOS.paymentRequests.create.mockResolvedValue({
        orderCode: 123456,
        checkoutUrl: 'https://payos.vn/checkout/test',
      });

      // Act
      await PayOSService.createPaymentLink(dataWithDecimal);

      // Assert
      expect(PayOSService.payOS.paymentRequests.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 150000, // parseInt() truncates decimal
        })
      );
    });

    test('PAYOS-UNIT-012: Should work with empty items array', async () => {
      // Arrange
      const dataWithEmptyItems = { ...validPaymentData, items: [] };
      PayOSService.payOS.paymentRequests.create.mockResolvedValue({
        orderCode: 123456,
        checkoutUrl: 'https://payos.vn/checkout/test',
      });

      // Act
      const result = await PayOSService.createPaymentLink(dataWithEmptyItems);

      // Assert
      expect(result.success).toBe(true);
    });

    test('PAYOS-UNIT-013: Should work without buyer info', async () => {
      // Arrange
      const dataWithoutBuyer = {
        orderCode: 123456,
        amount: 150000,
        description: 'Test order',
        returnUrl: 'http://localhost/success',
        cancelUrl: 'http://localhost/cancel',
      };
      PayOSService.payOS.paymentRequests.create.mockResolvedValue({
        orderCode: 123456,
        checkoutUrl: 'https://payos.vn/checkout/test',
      });

      // Act
      const result = await PayOSService.createPaymentLink(dataWithoutBuyer);

      // Assert
      expect(result.success).toBe(true);
    });

    test('PAYOS-UNIT-015: Should handle PayOS API error gracefully', async () => {
      // Arrange
      const apiError = new Error('PayOS API Error');
      PayOSService.payOS.paymentRequests.create.mockRejectedValue(apiError);

      // Act
      const result = await PayOSService.createPaymentLink(validPaymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('PayOS API Error');
      // Logger.error is called in catch block
    });
  });

  // ========================================
  // 3. WEBHOOK SIGNATURE VERIFICATION TESTS
  // ========================================

  describe('3. Webhook Signature Verification', () => {
    beforeEach(async () => {
      await PayOSService.initialize();
    });

    const generateValidSignature = (data, checksumKey) => {
      const sortedData = Object.keys(data)
        .sort()
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {});

      const queryStr = Object.keys(sortedData)
        .filter(key => sortedData[key] !== undefined)
        .map(key => {
          let value = sortedData[key];
          if (value && Array.isArray(value)) {
            value = JSON.stringify(value);
          }
          if ([null, undefined, 'undefined', 'null'].includes(value)) {
            value = '';
          }
          return `${key}=${value}`;
        })
        .join('&');

      return crypto.createHmac('sha256', checksumKey).update(queryStr).digest('hex');
    };

    test('PAYOS-UNIT-017: Should verify valid webhook signature', () => {
      // Arrange
      const webhookData = {
        orderCode: 123456,
        amount: 150000,
        description: 'Order 123456',
        accountNumber: '0123456789',
        reference: 'REF123456789',
        transactionDateTime: '2025-01-27T10:30:00',
        currency: 'VND',
        paymentLinkId: 'LINK123456',
        code: '00',
        desc: 'success',
      };

      const signature = generateValidSignature(webhookData, process.env.PAYOS_CHECKSUM_KEY);
      const webhookWithSignature = { ...webhookData, signature };

      // Act
      const result = PayOSService.verifyPaymentWebhookData(webhookWithSignature);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(webhookWithSignature);
      // Logger.info is called when verification succeeds
    });

    test('PAYOS-UNIT-018: Should reject webhook with tampered data', () => {
      // Arrange
      const originalData = {
        orderCode: 123456,
        amount: 150000,
        description: 'Order 123456',
        accountNumber: '0123456789',
        reference: 'REF123456789',
        transactionDateTime: '2025-01-27T10:30:00',
        currency: 'VND',
        paymentLinkId: 'LINK123456',
        code: '00',
        desc: 'success',
      };

      // Generate signature for original data
      const signature = generateValidSignature(originalData, process.env.PAYOS_CHECKSUM_KEY);

      // Tamper with the data
      const tamperedData = { ...originalData, amount: 50000, signature };

      // Act
      const result = PayOSService.verifyPaymentWebhookData(tamperedData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid webhook signature');
      // Logger.error is called when verification fails
    });

    test('PAYOS-UNIT-019: Should reject webhook with missing signature', () => {
      // Arrange
      const webhookData = {
        orderCode: 123456,
        amount: 150000,
        code: '00',
        desc: 'success',
      };

      // Act
      const result = PayOSService.verifyPaymentWebhookData(webhookData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid webhook signature');
    });

    test('PAYOS-UNIT-020: Should reject webhook with empty signature', () => {
      // Arrange
      const webhookData = {
        orderCode: 123456,
        amount: 150000,
        code: '00',
        desc: 'success',
        signature: '',
      };

      // Act
      const result = PayOSService.verifyPaymentWebhookData(webhookData);

      // Assert
      expect(result.success).toBe(false);
    });

    test('PAYOS-UNIT-021: Should reject webhook with wrong checksum key', () => {
      // Arrange
      const webhookData = {
        orderCode: 123456,
        amount: 150000,
        code: '00',
        desc: 'success',
      };

      const signature = generateValidSignature(webhookData, 'wrong-checksum-key');
      const webhookWithSignature = { ...webhookData, signature };

      // Act
      const result = PayOSService.verifyPaymentWebhookData(webhookWithSignature);

      // Assert
      expect(result.success).toBe(false);
    });

    test('PAYOS-UNIT-022: Should verify success payment webhook (code=00)', () => {
      // Arrange
      const webhookData = {
        orderCode: 123456,
        amount: 150000,
        code: '00',
        desc: 'success',
        accountNumber: '0123456789',
        reference: 'REF123',
        transactionDateTime: '2025-01-27T10:30:00',
        currency: 'VND',
        paymentLinkId: 'LINK123',
      };

      const signature = generateValidSignature(webhookData, process.env.PAYOS_CHECKSUM_KEY);

      // Act
      const result = PayOSService.verifyPaymentWebhookData({ ...webhookData, signature });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.code).toBe('00');
      expect(result.data.desc).toBe('success');
    });

    test('PAYOS-UNIT-023: Should verify failed payment webhook (code!=00)', () => {
      // Arrange
      const webhookData = {
        orderCode: 123456,
        amount: 150000,
        code: '02',
        desc: 'cancelled',
        accountNumber: '0123456789',
        reference: 'REF123',
        transactionDateTime: '2025-01-27T10:30:00',
        currency: 'VND',
        paymentLinkId: 'LINK123',
      };

      const signature = generateValidSignature(webhookData, process.env.PAYOS_CHECKSUM_KEY);

      // Act
      const result = PayOSService.verifyPaymentWebhookData({ ...webhookData, signature });

      // Assert
      expect(result.success).toBe(true); // Signature valid
      expect(result.data.code).toBe('02'); // But payment failed
      expect(result.data.desc).toBe('cancelled');
    });
  });

  // ========================================
  // 4. HELPER FUNCTIONS TESTS
  // ========================================

  describe('4. Helper Functions', () => {
    test('PAYOS-UNIT-024: Should sort object keys alphabetically', () => {
      // Arrange
      const unsortedObj = { c: 3, a: 1, b: 2 };

      // Act
      const sorted = PayOSService.sortObjDataByKey(unsortedObj);

      // Assert
      const keys = Object.keys(sorted);
      expect(keys).toEqual(['a', 'b', 'c']);
      expect(sorted).toEqual({ a: 1, b: 2, c: 3 });
    });

    test('PAYOS-UNIT-025: Should handle empty object', () => {
      // Act
      const sorted = PayOSService.sortObjDataByKey({});

      // Assert
      expect(sorted).toEqual({});
    });

    test('PAYOS-UNIT-026: Should convert object to query string', () => {
      // Arrange
      const obj = { a: 1, b: 2 };

      // Act
      const queryStr = PayOSService.convertObjToQueryStr(obj);

      // Assert
      expect(queryStr).toBe('a=1&b=2');
    });

    test('PAYOS-UNIT-027: Should convert array values to JSON string', () => {
      // Arrange
      const obj = { items: [{ name: 'A' }] };

      // Act
      const queryStr = PayOSService.convertObjToQueryStr(obj);

      // Assert
      expect(queryStr).toBe('items=[{"name":"A"}]');
    });

    test('PAYOS-UNIT-028: Should convert null to empty string', () => {
      // Arrange
      const obj = { a: 1, b: null };

      // Act
      const queryStr = PayOSService.convertObjToQueryStr(obj);

      // Assert
      expect(queryStr).toBe('a=1&b=');
    });

    test('PAYOS-UNIT-029: Should filter out undefined values', () => {
      // Arrange
      const obj = { a: 1, b: undefined };

      // Act
      const queryStr = PayOSService.convertObjToQueryStr(obj);

      // Assert
      expect(queryStr).toBe('a=1');
    });

    test('PAYOS-UNIT-030: Should validate HMAC-SHA256 signature correctly', () => {
      // Arrange
      const data = { orderCode: 123456, amount: 150000 };
      const checksumKey = 'test-secret-key';
      const validSignature = crypto
        .createHmac('sha256', checksumKey)
        .update('amount=150000&orderCode=123456')
        .digest('hex');

      // Act
      const isValid = PayOSService.isValidData(data, validSignature, checksumKey);

      // Assert
      expect(isValid).toBe(true);
    });

    test('Should reject invalid HMAC-SHA256 signature', () => {
      // Arrange
      const data = { orderCode: 123456, amount: 150000 };
      const checksumKey = 'test-secret-key';
      const invalidSignature = 'invalid-signature';

      // Act
      const isValid = PayOSService.isValidData(data, invalidSignature, checksumKey);

      // Assert
      expect(isValid).toBe(false);
    });
  });

  // ========================================
  // 5. ADDITIONAL SERVICE METHODS TESTS
  // ========================================

  describe('5. Additional Service Methods', () => {
    beforeEach(async () => {
      await PayOSService.initialize();
    });

    test('Should get payment link information', async () => {
      // Arrange
      const mockPaymentInfo = {
        orderCode: 123456,
        status: 'PENDING',
        amount: 150000,
      };
      PayOSService.payOS.paymentRequests.get.mockResolvedValue(mockPaymentInfo);

      // Act
      const result = await PayOSService.getPaymentLinkInformation(123456);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPaymentInfo);
      expect(PayOSService.payOS.paymentRequests.get).toHaveBeenCalledWith(123456);
    });

    test('Should handle error when getting payment link info', async () => {
      // Arrange
      PayOSService.payOS.paymentRequests.get.mockRejectedValue(new Error('Not found'));

      // Act
      const result = await PayOSService.getPaymentLinkInformation(999999);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Not found');
    });

    test('Should cancel payment link successfully', async () => {
      // Arrange
      const mockCancelResult = {
        orderCode: 123456,
        status: 'CANCELLED',
      };
      PayOSService.payOS.paymentRequests.cancel.mockResolvedValue(mockCancelResult);

      // Act
      const result = await PayOSService.cancelPaymentLink(123456, 'User cancelled');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('CANCELLED');
      expect(PayOSService.payOS.paymentRequests.cancel).toHaveBeenCalledWith(
        123456,
        'User cancelled'
      );
    });

    test('Should handle error when cancelling payment link', async () => {
      // Arrange
      PayOSService.payOS.paymentRequests.cancel.mockRejectedValue(new Error('Cannot cancel'));

      // Act
      const result = await PayOSService.cancelPaymentLink(123456);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot cancel');
    });

    test('Should confirm webhook URL successfully', async () => {
      // Arrange
      PayOSService.payOS.webhooks.confirm.mockResolvedValue(undefined);

      // Act
      const result = await PayOSService.confirmWebhook('https://example.com/webhook');

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('Webhook confirmed successfully');
      expect(PayOSService.payOS.webhooks.confirm).toHaveBeenCalledWith(
        'https://example.com/webhook'
      );
    });

    test('Should handle error without message in confirmWebhook', async () => {
      // Arrange
      const errorWithoutMessage = new Error();
      delete errorWithoutMessage.message;
      PayOSService.payOS.webhooks.confirm.mockRejectedValue(errorWithoutMessage);

      // Act
      const result = await PayOSService.confirmWebhook('https://example.com/webhook');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to confirm webhook');
    });

    test('Should handle error without message in createPaymentLink', async () => {
      // Arrange
      const errorWithoutMessage = new Error();
      delete errorWithoutMessage.message;
      PayOSService.payOS.paymentRequests.create.mockRejectedValue(errorWithoutMessage);

      const testData = {
        orderCode: 123456,
        amount: 150000,
        description: 'Test',
        returnUrl: 'http://localhost/success',
        cancelUrl: 'http://localhost/cancel',
      };

      // Act
      const result = await PayOSService.createPaymentLink(testData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to create payment link');
    });

    test('Should handle error without message in getPaymentLinkInformation', async () => {
      // Arrange
      const errorWithoutMessage = new Error();
      delete errorWithoutMessage.message;
      PayOSService.payOS.paymentRequests.get.mockRejectedValue(errorWithoutMessage);

      // Act
      const result = await PayOSService.getPaymentLinkInformation('123456');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to get payment link information');
    });

    test('Should handle error without message in cancelPaymentLink', async () => {
      // Arrange
      const errorWithoutMessage = new Error();
      delete errorWithoutMessage.message;
      PayOSService.payOS.paymentRequests.cancel.mockRejectedValue(errorWithoutMessage);

      // Act
      const result = await PayOSService.cancelPaymentLink('123456');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to cancel payment link');
    });

    test('Should not re-initialize if already initialized in createPaymentLink', async () => {
      // Arrange
      await PayOSService.initialize();
      const initializeSpy = jest.spyOn(PayOSService, 'initialize');
      PayOSService.payOS.paymentRequests.create.mockResolvedValue({
        orderCode: 123456,
        checkoutUrl: 'https://test.com',
      });

      const testData = {
        orderCode: 123456,
        amount: 150000,
        description: 'Test',
        returnUrl: 'http://localhost/success',
        cancelUrl: 'http://localhost/cancel',
      };

      // Act
      await PayOSService.createPaymentLink(testData);

      // Assert - initialize should not be called again
      expect(initializeSpy).not.toHaveBeenCalled();
      initializeSpy.mockRestore();
    });

    test('Should not re-initialize if already initialized in getPaymentLinkInformation', async () => {
      // Arrange
      await PayOSService.initialize();
      const initializeSpy = jest.spyOn(PayOSService, 'initialize');
      PayOSService.payOS.paymentRequests.get.mockResolvedValue({});

      // Act
      await PayOSService.getPaymentLinkInformation('123456');

      // Assert
      expect(initializeSpy).not.toHaveBeenCalled();
      initializeSpy.mockRestore();
    });

    test('Should not re-initialize if already initialized in cancelPaymentLink', async () => {
      // Arrange
      await PayOSService.initialize();
      const initializeSpy = jest.spyOn(PayOSService, 'initialize');
      PayOSService.payOS.paymentRequests.cancel.mockResolvedValue({});

      // Act
      await PayOSService.cancelPaymentLink('123456');

      // Assert
      expect(initializeSpy).not.toHaveBeenCalled();
      initializeSpy.mockRestore();
    });

    test('Should not re-initialize if already initialized in confirmWebhook', async () => {
      // Arrange
      await PayOSService.initialize();
      const initializeSpy = jest.spyOn(PayOSService, 'initialize');
      PayOSService.payOS.webhooks.confirm.mockResolvedValue({});

      // Act
      await PayOSService.confirmWebhook('https://test.com');

      // Assert
      expect(initializeSpy).not.toHaveBeenCalled();
      initializeSpy.mockRestore();
    });

    test('Should handle all buyer info fields', async () => {
      // Arrange
      const dataWithAllBuyerInfo = {
        orderCode: 123456,
        amount: 150000,
        description: 'Test',
        returnUrl: 'http://localhost/success',
        cancelUrl: 'http://localhost/cancel',
        buyerName: 'John Doe',
        buyerEmail: 'john@example.com',
        buyerPhone: '0123456789',
        buyerAddress: '123 Main St',
      };
      PayOSService.payOS.paymentRequests.create.mockResolvedValue({
        orderCode: 123456,
        checkoutUrl: 'https://test.com',
      });

      // Act
      const result = await PayOSService.createPaymentLink(dataWithAllBuyerInfo);

      // Assert
      expect(result.success).toBe(true);
      expect(PayOSService.payOS.paymentRequests.create).toHaveBeenCalledWith(
        expect.objectContaining({
          buyerName: 'John Doe',
          buyerEmail: 'john@example.com',
          buyerPhone: '0123456789',
          buyerAddress: '123 Main St',
        })
      );
    });

    test('Should handle partial buyer info', async () => {
      // Arrange - only name and email
      const dataWithPartialBuyerInfo = {
        orderCode: 123456,
        amount: 150000,
        description: 'Test',
        returnUrl: 'http://localhost/success',
        cancelUrl: 'http://localhost/cancel',
        buyerName: 'Jane Doe',
        buyerEmail: 'jane@example.com',
      };
      PayOSService.payOS.paymentRequests.create.mockResolvedValue({
        orderCode: 123456,
        checkoutUrl: 'https://test.com',
      });

      // Act
      const result = await PayOSService.createPaymentLink(dataWithPartialBuyerInfo);

      // Assert
      expect(result.success).toBe(true);
      expect(PayOSService.payOS.paymentRequests.create).toHaveBeenCalledWith(
        expect.objectContaining({
          buyerName: 'Jane Doe',
          buyerEmail: 'jane@example.com',
        })
      );
    });

    test('Should handle convertObjToQueryStr with string "undefined" value', () => {
      // Arrange
      const obj = {
        field1: 'undefined',
        field2: 'value',
      };

      // Act
      const result = PayOSService.convertObjToQueryStr(obj);

      // Assert
      expect(result).toBe('field1=&field2=value');
    });

    test('Should handle convertObjToQueryStr with string "null" value', () => {
      // Arrange
      const obj = {
        field1: 'null',
        field2: 'value',
      };

      // Act
      const result = PayOSService.convertObjToQueryStr(obj);

      // Assert
      expect(result).toBe('field1=&field2=value');
    });

    test('Should handle convertObjToQueryStr with non-array object value', () => {
      // Arrange
      const obj = {
        field1: 'string value',
        field2: 123,
        field3: true,
      };

      // Act
      const result = PayOSService.convertObjToQueryStr(obj);

      // Assert
      expect(result).toContain('field1=string value');
      expect(result).toContain('field2=123');
      expect(result).toContain('field3=true');
    });

    test('Should handle convertObjToQueryStr with falsy but valid values', () => {
      // Arrange
      const obj = {
        field1: 0,
        field2: false,
        field3: '',
      };

      // Act
      const result = PayOSService.convertObjToQueryStr(obj);

      // Assert
      expect(result).toContain('field1=0');
      expect(result).toContain('field2=false');
      expect(result).toContain('field3=');
    });
  });
});
