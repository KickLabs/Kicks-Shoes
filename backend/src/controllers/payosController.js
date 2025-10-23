/**
 * @fileoverview PayOS Controller
 * @created 2025-01-27
 * @file payosController.js
 * @description Controller for handling PayOS payment requests
 */

import { body, validationResult } from 'express-validator';
import PayOSService from '../services/payos.service.js';
import logger from '../utils/logger.js';

// Validation rules for PayOS operations
const payosValidationRules = {
  createPaymentLink: [
    body('orderCode').isInt({ min: 1 }).withMessage('Order code must be a positive integer'),
    body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
    body('description').isString().notEmpty().withMessage('Description is required'),
    body('returnUrl').isURL().withMessage('Return URL must be a valid URL'),
    body('cancelUrl').isURL().withMessage('Cancel URL must be a valid URL'),
    body('items').optional().isArray().withMessage('Items must be an array'),
    body('items.*.name').optional().isString().withMessage('Item name must be a string'),
    body('items.*.quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Item quantity must be a positive integer'),
    body('items.*.price')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Item price must be a positive integer'),
    body('buyerName').optional().isString().withMessage('Buyer name must be a string'),
    body('buyerEmail').optional().isEmail().withMessage('Buyer email must be a valid email'),
    body('buyerPhone').optional().isString().withMessage('Buyer phone must be a string'),
    body('buyerAddress').optional().isString().withMessage('Buyer address must be a string'),
  ],
  webhook: [
    body('orderCode').isInt().withMessage('Order code must be an integer'),
    body('amount').isInt().withMessage('Amount must be an integer'),
    body('description').isString().withMessage('Description must be a string'),
    body('accountNumber').isString().withMessage('Account number must be a string'),
    body('reference').isString().withMessage('Reference must be a string'),
    body('transactionDateTime').isString().withMessage('Transaction date time must be a string'),
    body('currency').isString().withMessage('Currency must be a string'),
    body('paymentLinkId').isString().withMessage('Payment link ID must be a string'),
    body('code').isString().withMessage('Code must be a string'),
    body('desc').isString().withMessage('Desc must be a string'),
    body('counterAccountBankId')
      .optional()
      .isString()
      .withMessage('Counter account bank ID must be a string'),
    body('counterAccountBankName')
      .optional()
      .isString()
      .withMessage('Counter account bank name must be a string'),
    body('counterAccountName')
      .optional()
      .isString()
      .withMessage('Counter account name must be a string'),
    body('counterAccountNumber')
      .optional()
      .isString()
      .withMessage('Counter account number must be a string'),
    body('virtualAccountName')
      .optional()
      .isString()
      .withMessage('Virtual account name must be a string'),
    body('virtualAccountNumber')
      .optional()
      .isString()
      .withMessage('Virtual account number must be a string'),
    body('signature').isString().withMessage('Signature must be a string'),
  ],
};

// Middleware to validate request data
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Create PayOS payment link
 * @route POST /api/payos/create-payment-link
 * @access Private
 */
export const createPaymentLink = [
  // Temporarily disable validation for debugging
  // payosValidationRules.createPaymentLink,
  // validateRequest,
  async (req, res, next) => {
    try {
      logger.info('Creating PayOS payment link - DEBUG', {
        userId: req.user?._id,
        body: req.body,
        headers: req.headers,
      });

      logger.info('Creating PayOS payment link', {
        userId: req.user?._id,
        orderCode: req.body.orderCode,
        amount: req.body.amount,
        description: req.body.description,
        returnUrl: req.body.returnUrl,
        cancelUrl: req.body.cancelUrl,
        items: req.body.items,
        buyerName: req.body.buyerName,
        buyerEmail: req.body.buyerEmail,
        buyerPhone: req.body.buyerPhone,
        fullBody: req.body,
      });

      const result = await PayOSService.createPaymentLink(req.body);

      if (result.success) {
        logger.info('PayOS payment link created successfully', {
          orderCode: result.data.orderCode,
          checkoutUrl: result.data.checkoutUrl,
        });

        res.status(201).json({
          success: true,
          data: result.data,
          message: 'Payment link created successfully',
        });
      } else {
        logger.error('Failed to create PayOS payment link:', result.message);
        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      logger.error('Error creating PayOS payment link:', error);
      next(error);
    }
  },
];

/**
 * Get PayOS payment link information
 * @route GET /api/payos/payment-link/:orderCode
 * @access Private
 */
export const getPaymentLinkInfo = async (req, res, next) => {
  try {
    const { orderCode } = req.params;

    if (!orderCode) {
      return res.status(400).json({
        success: false,
        message: 'Order code is required',
      });
    }

    logger.info('Getting PayOS payment link information', { orderCode });

    const result = await PayOSService.getPaymentLinkInformation(orderCode);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    logger.error('Error getting PayOS payment link information:', error);
    next(error);
  }
};

/**
 * Cancel PayOS payment link
 * @route PUT /api/payos/payment-link/:orderCode/cancel
 * @access Private
 */
export const cancelPaymentLink = async (req, res, next) => {
  try {
    const { orderCode } = req.params;
    const { cancellationReason } = req.body;

    if (!orderCode) {
      return res.status(400).json({
        success: false,
        message: 'Order code is required',
      });
    }

    logger.info('Cancelling PayOS payment link', { orderCode, cancellationReason });

    const result = await PayOSService.cancelPaymentLink(orderCode, cancellationReason);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: 'Payment link cancelled successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    logger.error('Error cancelling PayOS payment link:', error);
    next(error);
  }
};

/**
 * Handle PayOS webhook
 * @route POST /api/payos/webhook
 * @access Public (PayOS webhook)
 */
export const handleWebhook = [
  payosValidationRules.webhook,
  validateRequest,
  async (req, res, next) => {
    try {
      logger.info('Received PayOS webhook', {
        orderCode: req.body.orderCode,
        amount: req.body.amount,
        code: req.body.code,
        desc: req.body.desc,
      });

      const result = PayOSService.verifyPaymentWebhookData(req.body);

      if (result.success) {
        logger.info('PayOS webhook verified successfully', {
          orderCode: result.data.orderCode,
          code: result.data.code,
          desc: result.data.desc,
        });

        // Handle successful payment
        if (result.data.code === '00' && result.data.desc === 'success') {
          try {
            // Find order by PayOS order code (last 6 digits of order ID)
            const Order = (await import('../models/Order.js')).default;
            const orderCodeStr = result.data.orderCode.toString();

            // Find order by matching the last 6 digits of order ID
            const orders = await Order.find({}).lean();
            const matchingOrder = orders.find(order => {
              const orderIdStr = order._id.toString();
              return orderIdStr.slice(-6) === orderCodeStr;
            });

            if (matchingOrder) {
              // Update order status to paid
              await Order.findByIdAndUpdate(matchingOrder._id, {
                paymentStatus: 'paid',
                status: 'processing',
                paymentDate: new Date(),
                payosOrderCode: result.data.orderCode,
                payosPaymentLinkId: result.data.paymentLinkId,
                payosAccountNumber: result.data.accountNumber,
                payosReference: result.data.reference,
                payosTransactionDateTime: result.data.transactionDateTime,
                payosCurrency: result.data.currency,
                payosCode: result.data.code,
                payosDesc: result.data.desc,
                payosCounterAccountBankId: result.data.counterAccountBankId,
                payosCounterAccountBankName: result.data.counterAccountBankName,
                payosCounterAccountName: result.data.counterAccountName,
                payosCounterAccountNumber: result.data.counterAccountNumber,
                payosVirtualAccountName: result.data.virtualAccountName,
                payosVirtualAccountNumber: result.data.virtualAccountNumber,
              });

              logger.info('Order updated successfully after PayOS payment', {
                orderId: matchingOrder._id,
                payosOrderCode: result.data.orderCode,
              });
            } else {
              logger.warn('No matching order found for PayOS order code', {
                payosOrderCode: result.data.orderCode,
              });
            }
          } catch (updateError) {
            logger.error('Error updating order after PayOS payment:', updateError);
            // Don't fail the webhook response, just log the error
          }
        }

        // Handle cancelled/failed payment
        else if (result.data.code !== '00' || result.data.desc !== 'success') {
          try {
            // Find order by PayOS order code (last 6 digits of order ID)
            const Order = (await import('../models/Order.js')).default;
            const orderCodeStr = result.data.orderCode.toString();

            // Find order by matching the last 6 digits of order ID
            const orders = await Order.find({}).lean();
            const matchingOrder = orders.find(order => {
              const orderIdStr = order._id.toString();
              return orderIdStr.slice(-6) === orderCodeStr;
            });

            if (matchingOrder) {
              // Only cancel if order is still pending
              if (matchingOrder.status === 'pending' && matchingOrder.paymentStatus === 'pending') {
                await Order.findByIdAndUpdate(matchingOrder._id, {
                  status: 'cancelled',
                  paymentStatus: 'failed',
                  cancelledAt: new Date(),
                  cancellationReason: `PayOS payment cancelled: ${result.data.desc}`,
                  payosOrderCode: result.data.orderCode,
                  payosCode: result.data.code,
                  payosDesc: result.data.desc,
                });

                logger.info('Order cancelled after PayOS payment failure', {
                  orderId: matchingOrder._id,
                  payosOrderCode: result.data.orderCode,
                  code: result.data.code,
                  desc: result.data.desc,
                });
              } else {
                logger.info('Order already processed, skipping cancellation', {
                  orderId: matchingOrder._id,
                  currentStatus: matchingOrder.status,
                  currentPaymentStatus: matchingOrder.paymentStatus,
                });
              }
            } else {
              logger.warn('No matching order found for PayOS payment cancellation', {
                payosOrderCode: result.data.orderCode,
              });
            }
          } catch (updateError) {
            logger.error('Error cancelling order after PayOS payment failure:', updateError);
            // Don't fail the webhook response, just log the error
          }
        }

        res.status(200).json({
          error: 0,
          message: 'Ok',
          data: result.data,
        });
      } else {
        logger.error('PayOS webhook verification failed:', result.message);
        res.status(400).json({
          error: -1,
          message: result.message,
        });
      }
    } catch (error) {
      logger.error('Error handling PayOS webhook:', error);
      res.status(500).json({
        error: -1,
        message: 'Internal server error',
      });
    }
  },
];

/**
 * Confirm PayOS webhook URL
 * @route POST /api/payos/confirm-webhook
 * @access Private/Admin
 */
export const confirmWebhook = async (req, res, next) => {
  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'Webhook URL is required',
      });
    }

    logger.info('Confirming PayOS webhook', { webhookUrl });

    const result = await PayOSService.confirmWebhook(webhookUrl);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    logger.error('Error confirming PayOS webhook:', error);
    next(error);
  }
};

// Export all routes
export const payosRoutes = {
  createPaymentLink,
  getPaymentLinkInfo,
  cancelPaymentLink,
  handleWebhook,
  confirmWebhook,
};
