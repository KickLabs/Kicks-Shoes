/**
 * @fileoverview PayOS Service
 * @created 2025-01-27
 * @file payos.service.js
 * @description Service for handling PayOS payment integration
 */

import { PayOS } from '@payos/node';
import { createHmac } from 'crypto';
import logger from '../utils/logger.js';

class PayOSService {
  constructor() {
    this.payOS = null;
    this.isInitialized = false;
  }

  // Helper function to sort object data by key
  sortObjDataByKey(object) {
    const orderedObject = Object.keys(object)
      .sort()
      .reduce((obj, key) => {
        obj[key] = object[key];
        return obj;
      }, {});
    return orderedObject;
  }

  // Helper function to convert object to query string
  convertObjToQueryStr(object) {
    return Object.keys(object)
      .filter(key => object[key] !== undefined)
      .map(key => {
        let value = object[key];
        // Sort nested object
        if (value && Array.isArray(value)) {
          value = JSON.stringify(value.map(val => this.sortObjDataByKey(val)));
        }
        // Set empty string if null
        if ([null, undefined, 'undefined', 'null'].includes(value)) {
          value = '';
        }

        return `${key}=${value}`;
      })
      .join('&');
  }

  // Helper function to validate webhook data signature
  isValidData(data, currentSignature, checksumKey) {
    const sortedDataByKey = this.sortObjDataByKey(data);
    const dataQueryStr = this.convertObjToQueryStr(sortedDataByKey);
    const dataToSignature = createHmac('sha256', checksumKey).update(dataQueryStr).digest('hex');
    return dataToSignature === currentSignature;
  }

  async initialize() {
    try {
      if (
        !process.env.PAYOS_CLIENT_ID ||
        !process.env.PAYOS_API_KEY ||
        !process.env.PAYOS_CHECKSUM_KEY
      ) {
        throw new Error(
          'PayOS credentials not configured. Please set PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY in environment variables.'
        );
      }

      this.payOS = new PayOS(
        process.env.PAYOS_CLIENT_ID,
        process.env.PAYOS_API_KEY,
        process.env.PAYOS_CHECKSUM_KEY
      );

      this.isInitialized = true;
      logger.info('PayOS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize PayOS service:', error);
      throw error;
    }
  }

  async createPaymentLink(paymentData) {
    try {
      logger.info('PayOS createPaymentLink called with data:', paymentData);

      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        orderCode,
        amount,
        description,
        returnUrl,
        cancelUrl,
        items = [],
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerAddress,
      } = paymentData;

      // Validate required fields
      if (!orderCode || !amount || !description || !returnUrl || !cancelUrl) {
        throw new Error(
          'Missing required fields: orderCode, amount, description, returnUrl, cancelUrl'
        );
      }

      const paymentLinkData = {
        orderCode: parseInt(orderCode),
        amount: parseInt(amount),
        description,
        returnUrl,
        cancelUrl,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      // Add optional buyer information if provided
      if (buyerName) paymentLinkData.buyerName = buyerName;
      if (buyerEmail) paymentLinkData.buyerEmail = buyerEmail;
      if (buyerPhone) paymentLinkData.buyerPhone = buyerPhone;
      if (buyerAddress) paymentLinkData.buyerAddress = buyerAddress;

      logger.info('Creating PayOS payment link', { orderCode, amount, description });

      const paymentLinkResponse = await this.payOS.paymentRequests.create(paymentLinkData);

      logger.info('PayOS payment link created successfully', {
        orderCode: paymentLinkResponse.orderCode,
        checkoutUrl: paymentLinkResponse.checkoutUrl,
      });

      return {
        success: true,
        data: {
          orderCode: paymentLinkResponse.orderCode,
          checkoutUrl: paymentLinkResponse.checkoutUrl,
          qrCode: paymentLinkResponse.qrCode,
          bin: paymentLinkResponse.bin,
          accountNumber: paymentLinkResponse.accountNumber,
          accountName: paymentLinkResponse.accountName,
          amount: paymentLinkResponse.amount,
          description: paymentLinkResponse.description,
        },
      };
    } catch (error) {
      logger.error('Error creating PayOS payment link:', error);
      return {
        success: false,
        message: error.message || 'Failed to create payment link',
        error: error,
      };
    }
  }

  async getPaymentLinkInformation(orderCode) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info('Getting PayOS payment link information', { orderCode });

      const paymentInfo = await this.payOS.paymentRequests.get(orderCode);

      logger.info('PayOS payment link information retrieved', { orderCode });

      return {
        success: true,
        data: paymentInfo,
      };
    } catch (error) {
      logger.error('Error getting PayOS payment link information:', error);
      return {
        success: false,
        message: error.message || 'Failed to get payment link information',
        error: error,
      };
    }
  }

  async cancelPaymentLink(orderCode, cancellationReason = 'Order cancelled') {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info('Cancelling PayOS payment link', { orderCode, cancellationReason });

      const cancelResult = await this.payOS.paymentRequests.cancel(orderCode, cancellationReason);

      logger.info('PayOS payment link cancelled successfully', { orderCode });

      return {
        success: true,
        data: cancelResult,
      };
    } catch (error) {
      logger.error('Error cancelling PayOS payment link:', error);
      return {
        success: false,
        message: error.message || 'Failed to cancel payment link',
        error: error,
      };
    }
  }

  verifyPaymentWebhookData(webhookData) {
    try {
      if (!this.isInitialized) {
        throw new Error('PayOS service not initialized');
      }

      logger.info('Verifying PayOS webhook data', {
        orderCode: webhookData.orderCode,
        signature: webhookData.signature,
      });

      // Extract signature and data from webhook
      const { signature, ...data } = webhookData;

      // Validate signature using our custom logic
      const isValid = this.isValidData(data, signature, process.env.PAYOS_CHECKSUM_KEY);

      if (!isValid) {
        logger.error('PayOS webhook signature verification failed', {
          orderCode: webhookData.orderCode,
          receivedSignature: signature,
          checksumKey: process.env.PAYOS_CHECKSUM_KEY ? 'Set' : 'Not set',
        });
        throw new Error('Invalid webhook signature');
      }

      logger.info('PayOS webhook data verified successfully', {
        orderCode: webhookData.orderCode,
        code: webhookData.code,
        desc: webhookData.desc,
      });

      return {
        success: true,
        data: webhookData,
      };
    } catch (error) {
      logger.error('Error verifying PayOS webhook data:', error);
      return {
        success: false,
        message: error.message || 'Failed to verify webhook data',
        error: error,
      };
    }
  }

  async confirmWebhook(webhookUrl) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info('Confirming PayOS webhook', { webhookUrl });

      await this.payOS.webhooks.confirm(webhookUrl);

      logger.info('PayOS webhook confirmed successfully', { webhookUrl });

      return {
        success: true,
        message: 'Webhook confirmed successfully',
      };
    } catch (error) {
      logger.error('Error confirming PayOS webhook:', error);
      return {
        success: false,
        message: error.message || 'Failed to confirm webhook',
        error: error,
      };
    }
  }
}

export default new PayOSService();
