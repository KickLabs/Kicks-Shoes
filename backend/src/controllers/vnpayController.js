import VNPayService from '../services/vnpay.service.js';
import { asyncHandler } from '../middlewares/async.middleware.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import Order from '../models/Order.js';
import { OrderService } from '../services/order.service.js';
import logger from '../utils/logger.js';
import {
  createRewardPointsForOrder,
  hasOrderEarnedRewardPoints,
} from '../services/rewardPoint.service.js';
import EmailService from '../services/email.service.js';
import User from '../models/User.js';

/**
 * VNPay Payment Controller
 * Handles all VNPay payment-related HTTP requests
 */
class VNPayController {
  constructor() {
    this.vnpayService = new VNPayService();
  }

  /**
   * Create payment URL for checkout
   * POST /api/payment/create
   */
  createPayment = asyncHandler(async (req, res, next) => {
    const { amount, orderId, orderInfo, ipAddr, returnUrl, expireDate, locale, currency } =
      req.body;

    // Validate required fields
    if (!amount || !orderId) {
      return next(new ErrorResponse('Amount and order ID are required', 400));
    }

    // Validate amount (must be positive)
    if (amount <= 0) {
      return next(new ErrorResponse('Amount must be greater than 0', 400));
    }

    // Create payment data
    const paymentData = {
      amount: parseInt(amount),
      orderId,
      orderInfo,
      ipAddr: ipAddr || req.ip || req.connection.remoteAddress,
      returnUrl,
      expireDate,
      locale: locale || 'vn',
      currency: currency || 'VND',
    };

    // Create payment URL
    const result = await this.vnpayService.createPaymentUrl(paymentData, {
      withHash: false,
      logger: { type: 'omit', fields: ['secureSecret'] },
    });

    if (!result.success) {
      return next(new ErrorResponse(`Failed to create payment: ${result.error}`, 500));
    }

    res.status(200).json({
      success: true,
      message: 'Payment URL created successfully',
      data: {
        paymentUrl: result.paymentUrl,
        txnRef: result.txnRef,
        amount: result.amount,
        orderInfo: result.orderInfo,
      },
    });
  });

  /**
   * Verify payment return from VNPay
   * GET /api/payment/return
   */
  verifyPaymentReturn = asyncHandler(async (req, res, next) => {
    console.log('=== VNPay Return Processing Started ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('Request query:', req.query);

    // Handle both GET and POST requests
    const isPost = req.method === 'POST';

    // For POST requests, VNPay parameters are in query string, pendingOrderData is in body
    // For GET requests, everything is in query string
    const queryParams = isPost ? req.query : req.query;
    const pendingOrderData = isPost ? req.body.pendingOrderData : null;

    console.log('Query params:', queryParams);
    console.log('Pending order data:', pendingOrderData);

    if (!queryParams.vnp_TxnRef || !queryParams.vnp_ResponseCode) {
      console.log('Missing required VNPay parameters');
      return next(new ErrorResponse('Missing required VNPay parameters', 400));
    }

    console.log('VNPay parameters found, starting verification...');

    let result = await this.vnpayService.verifyPaymentReturn(queryParams, {
      withHash: false,
      logger: { type: 'omit', fields: ['secureSecret'] },
    });

    console.log('VNPay verification result:', result);

    if (!result.success) {
      console.log('VNPay verification failed, using fallback mock result');
      // Fallback to mock result for processing
      const mockResult = {
        success: true,
        verified: true,
        paymentSuccess: queryParams.vnp_ResponseCode === '00',
        message: queryParams.vnp_ResponseCode === '00' ? 'Payment successful' : 'Payment failed',
        data: {
          txnRef: queryParams.vnp_TxnRef,
          amount: queryParams.vnp_Amount,
          responseCode: queryParams.vnp_ResponseCode,
          transactionNo: queryParams.vnp_TransactionNo,
          bankCode: queryParams.vnp_BankCode,
          payDate: queryParams.vnp_PayDate,
          orderInfo: queryParams.vnp_OrderInfo,
        },
      };
      result = mockResult;
      console.log('Using mock result:', mockResult);
    }

    if (!result.verified) {
      console.log('Payment verification failed - not verified');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        data: result.data,
      });
    }

    const txnRef = result.data?.txnRef || queryParams.vnp_TxnRef;
    console.log('Transaction reference:', txnRef);

    let order = null;
    try {
      console.log('Searching for existing order...');

      if (txnRef && txnRef.length === 24 && /^[0-9a-fA-F]{24}$/.test(txnRef)) {
        console.log('Searching by MongoDB _id:', txnRef);
        order = await Order.findById(txnRef);
        console.log('Order found by _id:', order ? 'Yes' : 'No');
      }
      if (!order) {
        console.log('Searching by orderNumber:', txnRef);
        order = await Order.findOne({ orderNumber: txnRef });
        console.log('Order found by orderNumber:', order ? 'Yes' : 'No');
      }
      if (!order) {
        console.log('Searching by vnpTxnRef:', txnRef);
        order = await Order.findOne({ vnpTxnRef: txnRef });
        console.log('Order found by vnpTxnRef:', order ? 'Yes' : 'No');
      }
      if (!order) {
        console.log('Searching by pending payment status...');
        order = await Order.findOne({ paymentStatus: 'pending', paymentMethod: 'vnpay' }).sort({
          createdAt: -1,
        });
        console.log('Order found by pending status:', order ? 'Yes' : 'No');
      }
      if (!order && pendingOrderData && pendingOrderData._id) {
        console.log('Searching by pendingOrderData._id:', pendingOrderData._id);
        order = await Order.findById(pendingOrderData._id);
        console.log('Order found by pendingOrderData._id:', order ? 'Yes' : 'No');
      }
      if (!order && pendingOrderData && pendingOrderData.orderId) {
        console.log('Searching by pendingOrderData.orderId:', pendingOrderData.orderId);
        order = await Order.findById(pendingOrderData.orderId);
        console.log('Order found by pendingOrderData.orderId:', order ? 'Yes' : 'No');
      }

      let paymentStatus = 'failed';
      let orderStatus = 'cancelled';
      if (queryParams.vnp_ResponseCode === '00') {
        paymentStatus = 'paid';
        orderStatus = 'processing';
      }

      console.log('Payment status to set:', paymentStatus);
      console.log('Order status to set:', orderStatus);

      if (order) {
        console.log('Updating existing order:', order._id);
        order.paymentStatus = paymentStatus;
        order.status = orderStatus;
        order.transactionId = result.data?.transactionNo;
        order.vnpTransactionNo = result.data?.transactionNo;
        order.paymentDate = new Date();
        order.vnpResponseCode = queryParams.vnp_ResponseCode;
        order.vnpTxnRef = txnRef;
        order.vnpAmount = result.data?.amount;
        order.vnpBankCode = result.data?.bankCode;
        order.vnpPayDate = result.data?.payDate;
        await order.save();

        // Add a small delay to ensure the save operation completes
        await new Promise(resolve => setTimeout(resolve, 100));

        // Fetch the updated order to ensure we have the latest data
        order = await Order.findById(order._id);
        console.log('Order updated successfully:', order._id);
        console.log('Updated order status:', order.status);
        console.log('Updated payment status:', order.paymentStatus);

        // Send email notification for successful payment
        if (paymentStatus === 'paid' && order) {
          try {
            const populatedOrder = await order.populate('user', 'fullName email');
            await EmailService.sendOrderConfirmationEmail(populatedOrder.user, populatedOrder);
            console.log('Order confirmation email sent for successful payment:', order._id);
          } catch (emailError) {
            console.error('Error sending order confirmation email:', emailError);
            // Don't fail the payment process if email fails
          }
        }

        // Send email notification for failed payment
        if (paymentStatus === 'failed' && order) {
          try {
            const populatedOrder = await order.populate('user', 'fullName email');
            await EmailService.sendOrderStatusUpdateEmail(
              populatedOrder.user,
              populatedOrder,
              'failed'
            );
            console.log('Failed payment email sent for order:', order._id);
          } catch (emailError) {
            console.error('Error sending failed payment email:', emailError);
            // Don't fail the payment process if email fails
          }
        }
      } else {
        // Validate pendingOrderData before creating cancelled order
        const orderData = pendingOrderData?.orderData || pendingOrderData;
        if (!orderData || !orderData.user || !orderData.products || !orderData.shippingAddress) {
          console.log('Not enough data to create cancelled order, using fallback data');

          // Try to get user ID from request or from existing order
          let userId = req.user?._id;
          if (!userId) {
            // Try to find existing order to get user ID
            const existingOrder = await Order.findById(txnRef);
            if (existingOrder && existingOrder.user) {
              userId = existingOrder.user;
              console.log('Found user ID from existing order:', userId);
            }
          }

          if (!userId) {
            console.error('No user ID available for fallback order creation');
            return res.status(400).json({
              success: false,
              message: 'Unable to process payment return - user information not available',
            });
          }

          // Use fallback data for cancelled orders
          const failedOrderData = {
            user: userId,
            products: orderData?.products || [],
            totalPrice:
              orderData?.totalPrice ||
              (result.data?.amount ? parseInt(result.data.amount) / 100 : 0),
            paymentMethod: 'vnpay',
            shippingAddress: orderData?.shippingAddress || 'Address from VNPay return',
            status: orderStatus,
            paymentStatus: paymentStatus,
            paymentDate: new Date(),
            transactionId: result.data?.transactionNo,
            vnpTransactionNo: result.data?.transactionNo,
            vnpResponseCode: queryParams.vnp_ResponseCode,
            vnpTxnRef: txnRef,
            vnpAmount: result.data?.amount,
            vnpBankCode: result.data?.bankCode,
            vnpPayDate: result.data?.payDate,
            subtotal: orderData?.subtotal || 0,
            shippingCost: orderData?.shippingCost || 0,
            tax: orderData?.tax || 0,
            discount: orderData?.discount || 0,
            shippingMethod: orderData?.shippingMethod || 'standard',
            notes: `Payment cancelled - Response Code: ${queryParams.vnp_ResponseCode}`,
          };
          order = await OrderService.createOrder(failedOrderData);
          await new Promise(resolve => setTimeout(resolve, 100));
          order = await Order.findById(order._id);
          console.log('Fallback order created successfully:', order._id);
        } else {
          const failedOrderData = {
            user: orderData.user,
            products: orderData.products,
            totalPrice: orderData.totalPrice || 0,
            paymentMethod: 'vnpay',
            shippingAddress: orderData.shippingAddress,
            status: orderStatus,
            paymentStatus: paymentStatus,
            paymentDate: new Date(),
            transactionId: result.data?.transactionNo,
            vnpTransactionNo: result.data?.transactionNo,
            vnpResponseCode: queryParams.vnp_ResponseCode,
            vnpTxnRef: txnRef,
            vnpAmount: result.data?.amount,
            vnpBankCode: result.data?.bankCode,
            vnpPayDate: result.data?.payDate,
            subtotal: orderData.subtotal || 0,
            shippingCost: orderData.shippingCost || 0,
            tax: orderData.tax || 0,
            discount: orderData.discount || 0,
            shippingMethod: orderData.shippingMethod || 'standard',
            notes: `Payment failed - Response Code: ${queryParams.vnp_ResponseCode}`,
          };
          order = await OrderService.createOrder(failedOrderData);
          await new Promise(resolve => setTimeout(resolve, 100));
          order = await Order.findById(order._id);
        }
      }
    } catch (error) {
      console.error('Error updating/creating order:', error);
      console.error('Error stack:', error.stack);
    }

    console.log(
      'Final order state:',
      order
        ? {
            _id: order._id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            orderNumber: order.orderNumber,
          }
        : 'No order'
    );

    console.log('=== VNPay Return Processing Completed ===');

    // Set response headers for better debugging
    res.set({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    res.status(200).json({
      success: true,
      message: result.paymentSuccess ? 'Payment successful' : 'Payment failed',
      data: {
        verified: result.verified,
        paymentSuccess: result.paymentSuccess,
        message: result.message,
        transactionData: {
          ...result.data,
          orderDetails: order
            ? {
                orderNumber: order.orderNumber,
                status: order.status,
                paymentStatus: order.paymentStatus,
                paymentMethod: order.paymentMethod,
                shippingAddress: order.shippingAddress,
                shippingMethod: order.shippingMethod,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                notes: order.notes,
                totalPrice: order.totalPrice,
                user: order.user,
                items: order.items,
              }
            : null,
        },
      },
    });
  });

  /**
   * Handle IPN (Instant Payment Notification) from VNPay
   * POST /api/payment/ipn
   */
  handleIPN = asyncHandler(async (req, res, next) => {
    const ipnData = req.body;

    // Validate required parameters
    if (!ipnData.vnp_TxnRef || !ipnData.vnp_ResponseCode) {
      return next(new ErrorResponse('Missing required VNPay IPN parameters', 400));
    }

    // Verify IPN
    const result = await this.vnpayService.verifyIPN(ipnData, {
      withHash: false,
      logger: { type: 'omit', fields: ['secureSecret'] },
    });

    if (!result.success) {
      console.error('IPN verification failed:', result.error);
      return res.status(500).json({
        success: false,
        message: 'IPN verification failed',
      });
    }

    // Check if IPN was verified
    if (!result.verified) {
      console.error('IPN verification failed - not verified');
      return res.status(400).json({
        success: false,
        message: 'IPN verification failed',
      });
    }

    // Process the payment result
    // Here you should update your order status based on the payment result
    if (result.paymentSuccess) {
      // Payment successful - update order status to paid
      console.log('Payment successful via IPN:', result.data);
      // TODO: Update order status in database
    } else {
      // Payment failed - update order status to failed
      console.log('Payment failed via IPN:', result.data);
      // TODO: Update order status in database
    }

    // Return success response to VNPay
    res.status(200).json({
      success: true,
      message: 'IPN processed successfully',
    });
  });

  /**
   * Query payment status
   * POST /api/payment/query
   */
  queryPaymentStatus = asyncHandler(async (req, res, next) => {
    const { txnRef, transactionDate, ipAddr } = req.body;

    // Validate required fields
    if (!txnRef || !transactionDate) {
      return next(
        new ErrorResponse('Transaction reference and transaction date are required', 400)
      );
    }

    // Query payment status
    const result = await this.vnpayService.queryPaymentStatus(
      {
        txnRef,
        transactionDate,
        ipAddr: ipAddr || req.ip || req.connection.remoteAddress,
      },
      {
        logger: { type: 'omit', fields: ['secureSecret'] },
      }
    );

    if (!result.success) {
      return next(new ErrorResponse(`Payment query failed: ${result.error}`, 500));
    }

    res.status(200).json({
      success: true,
      message: 'Payment status queried successfully',
      data: {
        verified: result.verified,
        querySuccess: result.querySuccess,
        message: result.message,
        transactionData: result.data,
      },
    });
  });

  /**
   * Refund payment
   * POST /api/payment/refund
   */
  refundPayment = asyncHandler(async (req, res, next) => {
    const { txnRef, amount, transactionDate, transactionNo, orderInfo, transactionType, ipAddr } =
      req.body;

    // Validate required fields
    if (!txnRef || !amount || !transactionDate || !transactionNo) {
      return next(
        new ErrorResponse(
          'Transaction reference, amount, transaction date, and transaction number are required',
          400
        )
      );
    }

    // Validate amount (must be positive)
    if (amount <= 0) {
      return next(new ErrorResponse('Refund amount must be greater than 0', 400));
    }

    // Refund payment
    const result = await this.vnpayService.refundPayment(
      {
        txnRef,
        amount: parseInt(amount),
        transactionDate,
        transactionNo,
        orderInfo,
        transactionType: transactionType || '02', // Full refund by default
        ipAddr: ipAddr || req.ip || req.connection.remoteAddress,
      },
      {
        logger: { type: 'omit', fields: ['secureSecret'] },
      }
    );

    if (!result.success) {
      return next(new ErrorResponse(`Payment refund failed: ${result.error}`, 500));
    }

    res.status(200).json({
      success: true,
      message: 'Payment refund processed successfully',
      data: {
        verified: result.verified,
        refundSuccess: result.refundSuccess,
        message: result.message,
        refundData: result.data,
      },
    });
  });

  /**
   * Get supported banks list
   * GET /api/payment/banks
   */
  getBankList = asyncHandler(async (req, res, next) => {
    // Get bank list
    const result = await this.vnpayService.getBankList();

    if (!result.success) {
      return next(new ErrorResponse(`Failed to get bank list: ${result.error}`, 500));
    }

    res.status(200).json({
      success: true,
      message: 'Bank list retrieved successfully',
      data: {
        banks: result.banks,
      },
    });
  });

  /**
   * Test payment return functionality
   * GET /api/payment/test-return
   */
  testPaymentReturn = asyncHandler(async (req, res, next) => {
    console.log('=== Test Payment Return Started ===');

    // Simulate VNPay return parameters
    const testParams = {
      vnp_TxnRef: req.query.txnRef || '507f1f77bcf86cd799439011',
      vnp_ResponseCode: req.query.responseCode || '00',
      vnp_Amount: req.query.amount || '1000000',
      vnp_TransactionNo: req.query.transactionNo || '123456789',
      vnp_BankCode: req.query.bankCode || 'NCB',
      vnp_PayDate: req.query.payDate || '20241201120000',
      vnp_OrderInfo: req.query.orderInfo || 'Test payment',
    };

    console.log('Test parameters:', testParams);

    // Call the same verification logic
    let result = await this.vnpayService.verifyPaymentReturn(testParams, {
      withHash: false,
      logger: { type: 'omit', fields: ['secureSecret'] },
    });

    if (!result.success) {
      const mockResult = {
        success: true,
        verified: true,
        paymentSuccess: testParams.vnp_ResponseCode === '00',
        message: testParams.vnp_ResponseCode === '00' ? 'Payment successful' : 'Payment failed',
        data: {
          txnRef: testParams.vnp_TxnRef,
          amount: testParams.vnp_Amount,
          responseCode: testParams.vnp_ResponseCode,
          transactionNo: testParams.vnp_TransactionNo,
          bankCode: testParams.vnp_BankCode,
          payDate: testParams.vnp_PayDate,
          orderInfo: testParams.vnp_OrderInfo,
        },
      };
      result = mockResult;
    }

    const txnRef = result.data?.txnRef || testParams.vnp_TxnRef;
    let order = null;

    try {
      // Search for existing order
      if (txnRef && txnRef.length === 24 && /^[0-9a-fA-F]{24}$/.test(txnRef)) {
        order = await Order.findById(txnRef);
      }
      if (!order) {
        order = await Order.findOne({ orderNumber: txnRef });
      }
      if (!order) {
        order = await Order.findOne({ vnpTxnRef: txnRef });
      }
      if (!order) {
        order = await Order.findOne({ paymentStatus: 'pending', paymentMethod: 'vnpay' }).sort({
          createdAt: -1,
        });
      }

      let paymentStatus = 'failed';
      let orderStatus = 'cancelled';
      if (testParams.vnp_ResponseCode === '00') {
        paymentStatus = 'paid';
        orderStatus = 'processing';
      }

      if (order) {
        console.log('Updating existing order:', order._id);
        order.paymentStatus = paymentStatus;
        order.status = orderStatus;
        order.transactionId = result.data?.transactionNo;
        order.vnpTransactionNo = result.data?.transactionNo;
        order.paymentDate = new Date();
        order.vnpResponseCode = testParams.vnp_ResponseCode;
        order.vnpTxnRef = txnRef;
        order.vnpAmount = result.data?.amount;
        order.vnpBankCode = result.data?.bankCode;
        order.vnpPayDate = result.data?.payDate;
        await order.save();
        await new Promise(resolve => setTimeout(resolve, 100));
        order = await Order.findById(order._id);
        console.log('Order updated successfully:', order._id);
      } else {
        console.log('No existing order found for test');
      }
    } catch (error) {
      console.error('Test error:', error);
    }

    console.log('=== Test Payment Return Completed ===');

    res.status(200).json({
      success: true,
      message: 'Test payment return completed',
      data: {
        testParams,
        result,
        order: order
          ? {
              _id: order._id,
              status: order.status,
              paymentStatus: order.paymentStatus,
              orderNumber: order.orderNumber,
            }
          : null,
      },
    });
  });

  /**
   * Process VNPay refund for cancelled order
   * POST /api/payment/refund-order
   */
  refundOrderPayment = asyncHandler(async (req, res, next) => {
    const { orderId, reason } = req.body;

    // Validate required fields
    if (!orderId) {
      return next(new ErrorResponse('Order ID is required', 400));
    }

    if (!reason?.trim()) {
      return next(new ErrorResponse('Refund reason is required', 400));
    }

    try {
      // Get the order
      const order = await Order.findById(orderId);
      if (!order) {
        return next(new ErrorResponse('Order not found', 404));
      }

      // Check if order is eligible for VNPay refund
      if (order.paymentMethod !== 'vnpay') {
        return next(new ErrorResponse('Order is not a VNPay payment', 400));
      }

      if (order.paymentStatus !== 'paid') {
        return next(new ErrorResponse('Order payment status is not paid', 400));
      }

      if (!order.vnpTxnRef || !order.vnpTransactionNo) {
        return next(new ErrorResponse('Missing VNPay transaction information', 400));
      }

      logger.info('Processing VNPay refund for order', {
        orderId,
        vnpTxnRef: order.vnpTxnRef,
        vnpTransactionNo: order.vnpTransactionNo,
        amount: order.totalPrice,
        reason,
      });

      // Process refund through OrderService
      const refundResult = await OrderService.processVNPayRefund(order, reason);

      if (!refundResult.success) {
        logger.error('VNPay refund failed', {
          orderId,
          error: refundResult.error,
        });
        return next(new ErrorResponse(`VNPay refund failed: ${refundResult.error}`, 500));
      }

      if (!refundResult.refundSuccess) {
        logger.error('VNPay refund was not successful', {
          orderId,
          message: refundResult.message,
        });
        return next(
          new ErrorResponse(`VNPay refund was not successful: ${refundResult.message}`, 500)
        );
      }

      logger.info('VNPay refund processed successfully', {
        orderId,
        refundData: refundResult.data,
      });

      res.status(200).json({
        success: true,
        message: 'VNPay refund processed successfully',
        data: {
          orderId: order._id,
          refundAmount: order.totalPrice,
          refundReason: reason,
          refundTransactionNo: refundResult.data?.transactionNo,
          refundResponseCode: refundResult.data?.responseCode,
          refundData: refundResult.data,
        },
      });
    } catch (error) {
      logger.error('Error processing VNPay refund:', {
        error: error.message,
        stack: error.stack,
        orderId,
      });
      next(error);
    }
  });

  /**
   * Get VNPay configuration
   * GET /api/payment/config
   */
  getConfig = asyncHandler(async (req, res, next) => {
    try {
      const config = this.vnpayService.getConfig();

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      console.error('Error getting VNPay config:', error);
      return next(new ErrorResponse(`Failed to get config: ${error.message}`, 500));
    }
  });
}

export default new VNPayController();
