import axiosInstance from './axiosInstance';

/**
 * VNPay Payment Service for Frontend
 * Handles all VNPay payment API calls from frontend
 */
class VNPayService {
  /**
   * Create payment URL for checkout
   * @param {Object} paymentData - Payment information
   * @param {number} paymentData.amount - Amount in VND
   * @param {string} paymentData.orderId - Order ID
   * @param {string} paymentData.orderInfo - Order description
   * @param {string} paymentData.returnUrl - Return URL after payment
   * @returns {Promise<Object>} Payment URL response
   */
  static async createPayment(paymentData) {
    try {
      const response = await axiosInstance.post('/payment/vnpay/create', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Verify payment return from VNPay
   * @param {Object} queryParams - Query parameters from VNPay return
   * @param {Object} pendingOrderData - Pending order data from localStorage
   * @returns {Promise<Object>} Verification result
   */
  static async verifyPaymentReturn(queryParams, pendingOrderData = null) {
    try {
      console.log('=== Frontend VNPay Verification Started ===');
      console.log('Query params:', queryParams);
      console.log('Pending order data:', pendingOrderData);
      console.log('Response code:', queryParams.vnp_ResponseCode);
      console.log('Axios instance baseURL:', axiosInstance.defaults.baseURL);

      // If payment failed and we have pending order data, use POST to send data
      if (queryParams.vnp_ResponseCode !== '00') {
        if (pendingOrderData) {
          console.log('Payment failed, sending pendingOrderData via POST');
          console.log('Pending order data structure:', {
            hasOrderId: !!pendingOrderData.orderId,
            hasOrderData: !!pendingOrderData.orderData,
            keys: Object.keys(pendingOrderData),
          });

          const requestData = { pendingOrderData };
          const requestParams = queryParams;
          console.log('POST request data:', requestData);
          console.log('POST request params:', requestParams);
          console.log('Making POST request to /payment/vnpay/return');

          const response = await axiosInstance.post('/payment/vnpay/return', requestData, {
            params: requestParams,
          });
          console.log('POST response received:', response.data);
          return response.data;
        } else {
          throw new Error('No pending order data found for cancelled payment');
        }
      } else {
        // Use GET for successful payments or when no pending data
        console.log('Payment successful or no pending data, using GET');
        console.log('Making GET request to /payment/vnpay/return with params:', queryParams);

        const response = await axiosInstance.get('/payment/vnpay/return', {
          params: queryParams,
        });
        console.log('GET response received:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('=== Frontend VNPay Verification Error ===');
      console.error('Error details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      console.error('Error config:', error.config);
      throw error;
    }
  }

  /**
   * Query payment status
   * @param {Object} queryData - Query data
   * @param {string} queryData.txnRef - Transaction reference
   * @param {string} queryData.transactionDate - Transaction date
   * @returns {Promise<Object>} Query result
   */
  static async queryPaymentStatus(queryData) {
    try {
      const response = await axiosInstance.post('/payment/vnpay/query', queryData);
      return response.data;
    } catch (error) {
      console.error('Error querying payment status:', error);
      throw error;
    }
  }

  /**
   * Refund payment (admin only)
   * @param {Object} refundData - Refund data
   * @param {string} refundData.txnRef - Transaction reference
   * @param {number} refundData.amount - Refund amount
   * @param {string} refundData.transactionDate - Transaction date
   * @param {string} refundData.transactionNo - Transaction number
   * @returns {Promise<Object>} Refund result
   */
  static async refundPayment(refundData) {
    try {
      const response = await axiosInstance.post('/payment/vnpay/refund', refundData);
      return response.data;
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }

  /**
   * Get supported banks list
   * @returns {Promise<Object>} Bank list
   */
  static async getBankList() {
    try {
      const response = await axiosInstance.get('/payment/vnpay/banks');
      return response.data;
    } catch (error) {
      console.error('Error getting bank list:', error);
      throw error;
    }
  }

  /**
   * Get VNPay configuration
   * @returns {Promise<Object>} VNPay configuration
   */
  static async getConfig() {
    try {
      const response = await axiosInstance.get('/payment/vnpay/config');
      return response.data;
    } catch (error) {
      console.error('Error getting VNPay config:', error);
      throw error;
    }
  }

  /**
   * Redirect to VNPay payment page
   * @param {string} paymentUrl - VNPay payment URL
   */
  static redirectToPayment(paymentUrl) {
    if (paymentUrl) {
      window.location.href = paymentUrl;
    } else {
      console.error('Payment URL is required');
    }
  }

  /**
   * Format amount for display
   * @param {number} amount - Amount in VND
   * @returns {string} Formatted amount
   */
  static formatAmount(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  /**
   * Get payment status message
   * @param {string} responseCode - VNPay response code
   * @returns {string} Status message
   */
  static getPaymentStatusMessage(responseCode) {
    const statusMessages = {
      '00': 'Payment successful',
      '01': 'Order not found',
      '02': 'Order already paid',
      '04': 'Invalid amount',
      '05': 'Invalid currency',
      '06': 'Invalid transaction',
      '07': 'Invalid signature',
      '08': 'Invalid card number',
      '09': 'Invalid card holder name',
      10: 'Invalid card expiry date',
      11: 'Invalid card security code',
      12: 'Card expired',
      13: 'Card blocked',
      14: 'Insufficient funds',
      15: 'Transaction timeout',
      16: 'Bank system error',
      17: 'Merchant not found',
      18: 'Invalid merchant',
      19: 'Invalid merchant status',
      20: 'Invalid merchant configuration',
      21: 'Invalid merchant signature',
      22: 'Invalid merchant hash',
      23: 'Invalid merchant IP',
      24: 'Invalid merchant URL',
      25: 'Invalid merchant return URL',
      26: 'Invalid merchant IPN URL',
      27: 'Invalid merchant locale',
      28: 'Invalid merchant currency',
      29: 'Invalid merchant amount',
      30: 'Invalid merchant order info',
      31: 'Invalid merchant order ID',
      32: 'Invalid merchant transaction reference',
      33: 'Invalid merchant transaction date',
      34: 'Invalid merchant transaction time',
      35: 'Invalid merchant transaction type',
      36: 'Invalid merchant transaction status',
      37: 'Invalid merchant transaction amount',
      38: 'Invalid merchant transaction currency',
      39: 'Invalid merchant transaction order info',
      40: 'Invalid merchant transaction order ID',
      41: 'Invalid merchant transaction reference',
      42: 'Invalid merchant transaction date',
      43: 'Invalid merchant transaction time',
      44: 'Invalid merchant transaction type',
      45: 'Invalid merchant transaction status',
      46: 'Invalid merchant transaction amount',
      47: 'Invalid merchant transaction currency',
      48: 'Invalid merchant transaction order info',
      49: 'Invalid merchant transaction order ID',
      50: 'Invalid merchant transaction reference',
      51: 'Invalid merchant transaction date',
      52: 'Invalid merchant transaction time',
      53: 'Invalid merchant transaction type',
      54: 'Invalid merchant transaction status',
      55: 'Invalid merchant transaction amount',
      56: 'Invalid merchant transaction currency',
      57: 'Invalid merchant transaction order info',
      58: 'Invalid merchant order ID',
      59: 'Invalid merchant transaction reference',
      60: 'Invalid merchant transaction date',
      61: 'Invalid merchant transaction time',
      62: 'Invalid merchant transaction type',
      63: 'Invalid merchant transaction status',
      64: 'Invalid merchant transaction amount',
      65: 'Invalid merchant transaction currency',
      66: 'Invalid merchant transaction order info',
      67: 'Invalid merchant transaction order ID',
      68: 'Invalid merchant transaction reference',
      69: 'Invalid merchant transaction date',
      70: 'Invalid merchant transaction time',
      71: 'Invalid merchant transaction type',
      72: 'Invalid merchant transaction status',
      73: 'Invalid merchant transaction amount',
      74: 'Invalid merchant transaction currency',
      75: 'Invalid merchant transaction order info',
      76: 'Invalid merchant transaction order ID',
      77: 'Invalid merchant transaction reference',
      78: 'Invalid merchant transaction date',
      79: 'Invalid merchant transaction time',
      80: 'Invalid merchant transaction type',
      81: 'Invalid merchant transaction status',
      82: 'Invalid merchant transaction amount',
      83: 'Invalid merchant transaction currency',
      84: 'Invalid merchant transaction order info',
      85: 'Invalid merchant transaction order ID',
      86: 'Invalid merchant transaction reference',
      87: 'Invalid merchant transaction date',
      88: 'Invalid merchant transaction time',
      89: 'Invalid merchant transaction type',
      90: 'Invalid merchant transaction status',
      91: 'Invalid merchant transaction amount',
      92: 'Invalid merchant transaction currency',
      93: 'Invalid merchant transaction order info',
      94: 'Invalid merchant transaction order ID',
      95: 'Invalid merchant transaction reference',
      96: 'Invalid merchant transaction date',
      97: 'Invalid merchant transaction time',
      98: 'Invalid merchant transaction type',
      99: 'Unknown error',
    };

    return statusMessages[responseCode] || 'Unknown error';
  }
}

export default VNPayService;
