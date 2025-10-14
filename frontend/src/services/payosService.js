/**
 * @fileoverview PayOS Service for Frontend
 * @created 2025-01-27
 * @file payosService.js
 * @description Service for handling PayOS payment integration in frontend
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class PayOSService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/payos`;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('accessToken');
  }

  // Get auth headers
  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Create PayOS payment link
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment link response
   */
  async createPaymentLink(paymentData) {
    try {
      console.log('Creating PayOS payment link:', paymentData);

      const response = await axios.post(`${this.baseURL}/create-payment-link`, paymentData, {
        headers: this.getAuthHeaders(),
      });

      console.log('PayOS payment link created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating PayOS payment link:', error);
      throw error;
    }
  }

  /**
   * Get PayOS payment link information
   * @param {string} orderCode - Order code
   * @returns {Promise<Object>} Payment link information
   */
  async getPaymentLinkInfo(orderCode) {
    try {
      console.log('Getting PayOS payment link info:', orderCode);

      const response = await axios.get(`${this.baseURL}/payment-link/${orderCode}`, {
        headers: this.getAuthHeaders(),
      });

      console.log('PayOS payment link info:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting PayOS payment link info:', error);
      throw error;
    }
  }

  /**
   * Cancel PayOS payment link
   * @param {string} orderCode - Order code
   * @param {string} cancellationReason - Cancellation reason
   * @returns {Promise<Object>} Cancel response
   */
  async cancelPaymentLink(orderCode, cancellationReason = 'Order cancelled') {
    try {
      console.log('Cancelling PayOS payment link:', orderCode);

      const response = await axios.put(
        `${this.baseURL}/payment-link/${orderCode}/cancel`,
        { cancellationReason },
        {
          headers: this.getAuthHeaders(),
        }
      );

      console.log('PayOS payment link cancelled:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error cancelling PayOS payment link:', error);
      throw error;
    }
  }

  /**
   * Redirect to PayOS payment page
   * @param {string} checkoutUrl - PayOS checkout URL
   */
  redirectToPayment(checkoutUrl) {
    console.log('Redirecting to PayOS payment:', checkoutUrl);
    window.location.href = checkoutUrl;
  }

  /**
   * Handle PayOS payment return
   * @param {Object} returnData - Return data from PayOS
   * @returns {Promise<Object>} Payment result
   */
  async handlePaymentReturn(returnData) {
    try {
      console.log('Handling PayOS payment return:', returnData);

      // You can add additional processing here if needed
      // For example, verify payment status with your backend

      return {
        success: true,
        data: returnData,
      };
    } catch (error) {
      console.error('Error handling PayOS payment return:', error);
      throw error;
    }
  }

  /**
   * Generate unique order code for PayOS
   * @returns {number} Unique order code
   */
  generateOrderCode() {
    // Generate a unique order code using timestamp + random
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return parseInt(String(timestamp).slice(-6)) + random;
  }

  /**
   * Prepare payment data for PayOS
   * @param {Object} orderData - Order data
   * @returns {Object} PayOS payment data
   */
  preparePaymentData(orderData) {
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
    } = orderData;

    return {
      orderCode: orderCode || this.generateOrderCode(),
      amount: Math.round(amount), // PayOS requires integer amount
      description: (description || 'Payment for order').substring(0, 25),
      returnUrl: returnUrl || `${window.location.origin}/payment/success`,
      cancelUrl: cancelUrl || `${window.location.origin}/payment/cancel`,
      items: items.map(item => ({
        name: item.name || 'Product',
        quantity: item.quantity || 1,
        price: Math.round(item.price || 0),
      })),
      ...(buyerName && { buyerName }),
      ...(buyerEmail && { buyerEmail }),
      ...(buyerPhone && { buyerPhone }),
      ...(buyerAddress && { buyerAddress }),
    };
  }
}

export default new PayOSService();
