import { createVNPayInstance, validateVNPayConfig } from '../config/vnpay.config.js';
import { generateRandomString } from '../vnpay/utils/common.js';

/**
 * VNPay Payment Service
 * Handles all VNPay payment operations
 */
class VNPayService {
  constructor() {
    this.vnpay = null;
    this.initialized = false;
  }

  /**
   * Initialize VNPay instance
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Validate configuration on service initialization
      validateVNPayConfig();
      this.vnpay = await createVNPayInstance(process.env.NODE_ENV || 'development');
      this.initialized = true;
    } catch (error) {
      console.error('VNPay configuration error:', error.message);
      throw error;
    }
  }

  /**
   * Ensure VNPay is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Create payment URL for checkout
   * @param {Object} paymentData - Payment information
   * @param {number} paymentData.amount - Amount in VND (without multiplication)
   * @param {string} paymentData.orderId - Order ID
   * @param {string} paymentData.orderInfo - Order description
   * @param {string} paymentData.ipAddr - Customer IP address
   * @param {string} paymentData.returnUrl - Return URL after payment
   * @param {Object} options - Additional options
   * @returns {string} Payment URL
   */
  async createPaymentUrl(paymentData, options = {}) {
    try {
      await this.ensureInitialized();

      const {
        amount,
        orderId,
        orderInfo,
        ipAddr,
        returnUrl,
        expireDate,
        locale = 'vn',
        currency = 'VND',
      } = paymentData;

      // Generate transaction reference if not provided
      const txnRef =
        orderId || `TXN_${Date.now()}_${generateRandomString(6, { onlyNumber: true })}`;

      const paymentParams = {
        vnp_Amount: amount, // Will be multiplied by 100 in VNPay service
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: orderInfo || `Payment for order ${txnRef}`,
        vnp_IpAddr: ipAddr || '127.0.0.1',
        vnp_ReturnUrl: returnUrl || process.env.VNPAY_RETURN_URL,
        vnp_Locale: locale,
        vnp_CurrCode: currency,
      };

      // Add expire date if provided
      if (expireDate) {
        paymentParams.vnp_ExpireDate = expireDate;
      }

      // Create payment URL
      const paymentUrl = this.vnpay.buildPaymentUrl(paymentParams, {
        withHash: options.withHash || false,
        logger: options.logger || { type: 'omit', fields: ['secureSecret'] },
      });

      return {
        success: true,
        paymentUrl,
        txnRef,
        amount: amount,
        orderInfo: paymentParams.vnp_OrderInfo,
      };
    } catch (error) {
      console.error('Error creating payment URL:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify payment return from VNPay
   * @param {Object} queryParams - Query parameters from VNPay return
   * @param {Object} options - Verification options
   * @returns {Object} Verification result
   */
  async verifyPaymentReturn(queryParams, options = {}) {
    try {
      await this.ensureInitialized();

      const result = this.vnpay.verifyReturnUrl(queryParams, {
        withHash: options.withHash || false,
        logger: options.logger || { type: 'omit', fields: ['secureSecret'] },
      });

      return {
        success: true,
        verified: result.isVerified,
        paymentSuccess: result.isSuccess,
        message: result.message,
        data: {
          txnRef: result.vnp_TxnRef,
          amount: result.vnp_Amount,
          responseCode: result.vnp_ResponseCode,
          transactionNo: result.vnp_TransactionNo,
          bankCode: result.vnp_BankCode,
          payDate: result.vnp_PayDate,
          orderInfo: result.vnp_OrderInfo,
        },
      };
    } catch (error) {
      console.error('Error verifying payment return:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify IPN (Instant Payment Notification) from VNPay
   * @param {Object} ipnData - IPN data from VNPay
   * @param {Object} options - Verification options
   * @returns {Object} Verification result
   */
  async verifyIPN(ipnData, options = {}) {
    try {
      await this.ensureInitialized();

      const result = this.vnpay.verifyIpnCall(ipnData, {
        withHash: options.withHash || false,
        logger: options.logger || { type: 'omit', fields: ['secureSecret'] },
      });

      return {
        success: true,
        verified: result.isVerified,
        paymentSuccess: result.isSuccess,
        message: result.message,
        data: {
          txnRef: result.vnp_TxnRef,
          amount: result.vnp_Amount,
          responseCode: result.vnp_ResponseCode,
          transactionNo: result.vnp_TransactionNo,
          bankCode: result.vnp_BankCode,
          payDate: result.vnp_PayDate,
          orderInfo: result.vnp_OrderInfo,
        },
      };
    } catch (error) {
      console.error('Error verifying IPN:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Query payment status
   * @param {Object} queryData - Query data
   * @param {string} queryData.txnRef - Transaction reference
   * @param {string} queryData.transactionDate - Transaction date (YYYYMMDDHHMMSS)
   * @param {string} queryData.ipAddr - IP address
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query result
   */
  async queryPaymentStatus(queryData, options = {}) {
    try {
      await this.ensureInitialized();

      const { txnRef, transactionDate, ipAddr = '127.0.0.1' } = queryData;

      const queryParams = {
        vnp_RequestId: `REQ_${Date.now()}_${generateRandomString(6, { onlyNumber: true })}`,
        vnp_TxnRef: txnRef,
        vnp_TransactionDate: transactionDate,
        vnp_IpAddr: ipAddr,
        vnp_OrderInfo: `Query payment status for transaction ${txnRef}`,
        vnp_CreateDate: new Date().toISOString().replace(/[-:]/g, '').slice(0, 14),
      };

      const result = await this.vnpay.queryDr(queryParams, {
        logger: options.logger || { type: 'omit', fields: ['secureSecret'] },
      });

      return {
        success: true,
        verified: result.isVerified,
        querySuccess: result.isSuccess,
        message: result.message,
        data: {
          txnRef: result.vnp_TxnRef,
          amount: result.vnp_Amount,
          responseCode: result.vnp_ResponseCode,
          transactionNo: result.vnp_TransactionNo,
          bankCode: result.vnp_BankCode,
          payDate: result.vnp_PayDate,
          orderInfo: result.vnp_OrderInfo,
          transactionStatus: result.vnp_TransactionStatus,
        },
      };
    } catch (error) {
      console.error('Error querying payment status:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refund payment
   * @param {Object} refundData - Refund data
   * @param {string} refundData.txnRef - Original transaction reference
   * @param {number} refundData.amount - Refund amount
   * @param {string} refundData.transactionDate - Original transaction date
   * @param {string} refundData.transactionNo - Original transaction number
   * @param {string} refundData.orderInfo - Refund description
   * @param {string} refundData.transactionType - 02 for full refund, 03 for partial refund
   * @param {Object} options - Refund options
   * @returns {Promise<Object>} Refund result
   */
  async refundPayment(refundData, options = {}) {
    try {
      await this.ensureInitialized();

      const {
        txnRef,
        amount,
        transactionDate,
        transactionNo,
        orderInfo,
        transactionType = '02', // Full refund by default
        ipAddr = '127.0.0.1',
      } = refundData;

      const refundParams = {
        vnp_RequestId: `REF_${Date.now()}_${generateRandomString(6, { onlyNumber: true })}`,
        vnp_TxnRef: txnRef,
        vnp_Amount: amount,
        vnp_TransactionDate: transactionDate,
        vnp_TransactionNo: transactionNo,
        vnp_OrderInfo: orderInfo || `Refund for transaction ${txnRef}`,
        vnp_TransactionType: transactionType,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: new Date().toISOString().replace(/[-:]/g, '').slice(0, 14),
      };

      const result = await this.vnpay.refund(refundParams, {
        logger: options.logger || { type: 'omit', fields: ['secureSecret'] },
      });

      return {
        success: true,
        verified: result.isVerified,
        refundSuccess: result.isSuccess,
        message: result.message,
        data: {
          txnRef: result.vnp_TxnRef,
          amount: result.vnp_Amount,
          responseCode: result.vnp_ResponseCode,
          transactionDate: result.vnp_TransactionDate,
          transactionNo: result.vnp_TransactionNo,
          orderInfo: result.vnp_OrderInfo,
        },
      };
    } catch (error) {
      console.error('Error refunding payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get supported banks list
   * @returns {Promise<Array>} List of supported banks
   */
  async getBankList() {
    try {
      await this.ensureInitialized();

      const banks = await this.vnpay.getBankList();
      return {
        success: true,
        banks,
      };
    } catch (error) {
      console.error('Error getting bank list:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get VNPay configuration
   * @returns {Object} VNPay configuration
   */
  getConfig() {
    if (!this.vnpay) {
      return {
        tmnCode: process.env.VNPAY_TMN_CODE || 'TMNCODE',
        vnpayHost: process.env.VNPAY_HOST || 'https://sandbox.vnpayment.vn',
        testMode: process.env.VNPAY_TEST_MODE === 'true',
        hashAlgorithm: process.env.VNPAY_HASH_ALGORITHM || 'SHA512',
        locale: process.env.VNPAY_LOCALE || 'vn',
        currencyCode: process.env.VNPAY_CURRENCY_CODE || 'VND',
      };
    }

    return {
      tmnCode: this.vnpay.globalConfig.tmnCode,
      vnpayHost: this.vnpay.globalConfig.vnpayHost,
      testMode: this.vnpay.globalConfig.testMode,
      hashAlgorithm: this.hashAlgorithm,
      locale: this.vnpay.globalConfig.vnp_Locale,
      currencyCode: this.vnpay.globalConfig.vnp_CurrCode,
    };
  }
}

export default VNPayService;
