/**
 * @fileoverview Test data and fixtures for PayOS tests
 * @created 2025-01-27
 * @description Reusable test data for PayOS testing
 */

import crypto from 'crypto';

/**
 * Generate valid HMAC-SHA256 signature for webhook data
 */
export const generateValidSignature = (data, checksumKey) => {
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

/**
 * Valid payment data fixture
 */
export const validPaymentData = {
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

/**
 * Valid webhook data (success payment)
 */
export const validWebhookSuccess = {
  orderCode: 123456,
  amount: 150000,
  description: 'Order 123456 - Nike Air Max',
  accountNumber: '0123456789',
  reference: 'REF123456789',
  transactionDateTime: '2025-01-27T10:30:00',
  currency: 'VND',
  paymentLinkId: 'LINK123456',
  code: '00',
  desc: 'success',
  counterAccountBankId: '970415',
  counterAccountBankName: 'Vietinbank',
  counterAccountName: 'NGUYEN VAN A',
  counterAccountNumber: '987654321',
  virtualAccountName: 'KICKS SHOES',
  virtualAccountNumber: '0123456789',
};

/**
 * Valid webhook data (failed payment)
 */
export const validWebhookFailed = {
  orderCode: 123456,
  amount: 150000,
  description: 'Order 123456',
  accountNumber: '0123456789',
  reference: 'REF123456789',
  transactionDateTime: '2025-01-27T10:30:00',
  currency: 'VND',
  paymentLinkId: 'LINK123456',
  code: '02',
  desc: 'cancelled',
};

/**
 * Mock order document
 */
export const mockOrder = {
  _id: '507f1f77bcf86cd799439011',
  user: '507f191e810c19729de860ea',
  items: ['507f1f77bcf86cd799439012'],
  status: 'pending',
  paymentStatus: 'pending',
  paymentMethod: 'payos',
  totalPrice: 150000,
  subtotal: 150000,
  shippingAddress: '123 Le Loi, Q1, TPHCM',
  createdAt: new Date('2025-01-27T10:00:00'),
  updatedAt: new Date('2025-01-27T10:00:00'),
};

/**
 * Mock order for webhook testing (ID matches orderCode)
 */
export const mockOrderForWebhook = {
  ...mockOrder,
  _id: '507f1f77bcf86cd799123456', // Last 6 chars: 123456
};

/**
 * Mock user document
 */
export const mockUser = {
  _id: '507f191e810c19729de860ea',
  email: 'user@example.com',
  fullName: 'Test User',
  phone: '0912345678',
  role: 'user',
};

/**
 * Mock PayOS API responses
 */
export const mockPayOSResponses = {
  createPaymentLinkSuccess: {
    orderCode: 123456,
    checkoutUrl: 'https://payos.vn/checkout/test123',
    qrCode: 'base64_qr_code',
    bin: '970415',
    accountNumber: '0123456789',
    accountName: 'KICKS SHOES',
    amount: 150000,
    description: 'Order 123456',
  },

  getPaymentLinkSuccess: {
    orderCode: 123456,
    status: 'PENDING',
    amount: 150000,
    description: 'Order 123456',
  },

  cancelPaymentLinkSuccess: {
    orderCode: 123456,
    status: 'CANCELLED',
  },
};

/**
 * Environment variables for testing
 */
export const testEnvVars = {
  PAYOS_CLIENT_ID: 'test-client-id-12345',
  PAYOS_API_KEY: 'test-api-key-abcdef',
  PAYOS_CHECKSUM_KEY: 'test-checksum-key-secret',
  JWT_SECRET: 'test-jwt-secret',
};

/**
 * Create webhook with valid signature
 */
export const createWebhookWithSignature = (webhookData, checksumKey) => {
  const signature = generateValidSignature(webhookData, checksumKey);
  return { ...webhookData, signature };
};

/**
 * Create tampered webhook (data modified after signing)
 */
export const createTamperedWebhook = (webhookData, checksumKey) => {
  const signature = generateValidSignature(webhookData, checksumKey);
  return {
    ...webhookData,
    amount: webhookData.amount / 2, // Tamper with amount
    signature, // Old signature
  };
};

export default {
  generateValidSignature,
  validPaymentData,
  validWebhookSuccess,
  validWebhookFailed,
  mockOrder,
  mockOrderForWebhook,
  mockUser,
  mockPayOSResponses,
  testEnvVars,
  createWebhookWithSignature,
  createTamperedWebhook,
};
