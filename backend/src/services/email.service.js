/**
 * @fileoverview Email Service
 * @created 2025-06-04
 * @file email.service.js
 * @description This file defines the EmailService class for sending emails using OAuth2 and Nodemailer.
 * It provides methods for sending templated emails and custom emails.
 */

import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { emailConfig } from '../config/email.config.js';
import { emailTemplates } from '../templates/email.templates.js';
import logger from '../utils/logger.js';
import { formatVND } from '../utils/currency.js';

// Initialize OAuth2Client with Client ID and Client Secret
const myOAuth2Client = new OAuth2Client(
  emailConfig.googleMailerClientId,
  emailConfig.googleMailerClientSecret
);

// Set Refresh Token in OAuth2Client Credentials
myOAuth2Client.setCredentials({
  refresh_token: emailConfig.googleMailerRefreshToken,
});

/**
 * Service for sending emails using OAuth2 and Nodemailer
 */
class EmailService {
  /**
   * Send an email using a template
   * @param {string} to - Recipient's email address
   * @param {string} templateType - Type of email template to use
   * @param {Object} templateData - Data to be used in the template
   * @returns {Promise<void>}
   */
  static async sendTemplatedEmail(to, templateType, templateData = {}) {
    try {
      if (!to) {
        throw new Error('Recipient email address is required');
      }

      const template = emailTemplates[templateType];
      if (!template) {
        throw new Error(`Email template '${templateType}' not found`);
      }

      const subject = template.subject;
      const content = template.getContent(templateData);

      await this.sendEmail(to, subject, content);
    } catch (error) {
      logger.error('Error sending templated email:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation email
   * @param {Object} user - User object
   * @param {Object} order - Order object
   * @returns {Promise<void>}
   */
  static async sendOrderConfirmationEmail(user, order) {
    try {
      let orderDetails;
      try {
        orderDetails = await this.generateOrderDetails(order);
      } catch (detailsError) {
        logger.error('Error generating order details, using fallback:', detailsError);
        // Use a simple fallback if order details generation fails
        orderDetails = `
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 10px 0;">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Order Summary:</h3>
            <div style="border-bottom: 1px solid #e0e0e0; padding: 10px 0;">
              <p style="margin: 0; color: #7f8c8d; font-style: italic;">Your order has been successfully placed!</p>
            </div>
            <div style="border-top: 2px solid #e0e0e0; margin-top: 15px; padding-top: 15px;">
              <div style="display: flex; justify-content: space-between; margin: 10px 0; font-weight: bold; font-size: 16px;">
                <span>Total:</span>
                <span>${formatVND(order.totalPrice || 0)}</span>
              </div>
            </div>
            <div style="margin-top: 15px;">
              <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ${order.status || 'Pending'}</p>
              <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod || 'Not specified'}</p>
            </div>
          </div>
        `;
      }

      await this.sendTemplatedEmail(user.email, 'ORDER_CONFIRMATION', {
        name: user.fullName,
        orderNumber: order._id.toString(),
        orderDetails: orderDetails,
      });

      logger.info('Order confirmation email sent', {
        orderId: order._id,
        userEmail: user.email,
      });
    } catch (error) {
      logger.error('Error sending order confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send discount code email
   * @param {Object} user - User object
   * @param {Object} discountData - Discount data
   * @returns {Promise<void>}
   */
  static async sendDiscountCodeEmail(user, discountData) {
    try {
      await this.sendTemplatedEmail(user.email, 'DISCOUNT_CODE', {
        name: user.fullName || user.email,
        code: discountData.code,
        value: discountData.value,
        description: discountData.description,
        startDate: discountData.startDate,
        endDate: discountData.endDate,
        points: discountData.points,
      });

      logger.info('Discount code email sent', {
        userEmail: user.email,
        discountCode: discountData.code,
      });
    } catch (error) {
      logger.error('Error sending discount code email:', error);
      throw error;
    }
  }

  /**
   * Send order status update email
   * @param {Object} user - User object
   * @param {Object} order - Order object
   * @param {string} newStatus - New order status
   * @returns {Promise<void>}
   */
  static async sendOrderStatusUpdateEmail(user, order, newStatus) {
    try {
      let templateType = '';
      let templateData = {
        name: user.fullName,
        orderNumber: order._id.toString(),
      };

      switch (newStatus) {
        case 'processing':
          templateType = 'ORDER_PROCESSING';
          templateData.estimatedDelivery = order.estimatedDelivery;
          break;
        case 'shipped':
          templateType = 'ORDER_SHIPPED';
          templateData.trackingNumber = order.trackingNumber;
          break;
        case 'delivered':
          templateType = 'ORDER_DELIVERED';
          templateData.deliveryDate = order.updatedAt;
          break;
        case 'cancelled':
          templateType = 'ORDER_CANCELLED';
          templateData.cancellationReason = order.cancellationReason;
          templateData.refundAmount = order.refundAmount;
          break;
        case 'refunded':
          templateType = 'ORDER_REFUNDED';
          templateData.refundAmount = order.refundAmount;
          templateData.refundReason = order.refundReason;
          templateData.refundDate = order.refundedAt;
          break;
        case 'refund_pending':
          templateType = 'ORDER_REFUND_PENDING';
          templateData.refundAmount = order.refundAmount;
          templateData.refundReason = order.refundReason;
          break;
        case 'failed':
          templateType = 'ORDER_FAILED';
          templateData.paymentMethod = order.paymentMethod;
          templateData.totalAmount = order.totalPrice;
          break;
        default:
          logger.warn('No email template for status:', newStatus);
          return;
      }

      await this.sendTemplatedEmail(user.email, templateType, templateData);

      logger.info('Order status update email sent', {
        orderId: order._id,
        userEmail: user.email,
        newStatus: newStatus,
      });
    } catch (error) {
      logger.error('Error sending order status update email:', error);
      throw error;
    }
  }

  /**
   * Generate order details HTML for email
   * @param {Object} order - Order object
   * @returns {Promise<string>} HTML string of order details
   */
  static async generateOrderDetails(order) {
    try {
      logger.info('Generating order details for email', {
        orderId: order._id,
        hasItems: !!order.items,
        itemsLength: order.items ? order.items.length : 0,
        itemsType: order.items ? typeof order.items[0] : 'undefined',
      });

      // Populate order items if not already populated
      let populatedOrder = order;
      if (!order.items || order.items.length === 0 || typeof order.items[0] === 'string') {
        logger.info('Populating order items for email');
        populatedOrder = await order.populate({
          path: 'items',
          populate: {
            path: 'product',
            select: 'name mainImage price',
          },
        });
        logger.info('Order populated successfully', {
          itemsCount: populatedOrder.items ? populatedOrder.items.length : 0,
        });
      }

      let itemsHtml = '';
      if (populatedOrder.items && populatedOrder.items.length > 0) {
        logger.info('Processing order items for email', {
          itemsCount: populatedOrder.items.length,
        });

        itemsHtml = populatedOrder.items
          .map((item, index) => {
            // Handle cases where product might be null or undefined
            const product = item.product;
            logger.info(`Processing item ${index}`, {
              itemId: item._id,
              hasProduct: !!product,
              productId: product ? product._id : 'null',
              productName: product ? product.name : 'null',
            });

            if (!product) {
              return `
              <div style="border-bottom: 1px solid #e0e0e0; padding: 10px 0;">
                <div style="display: flex; align-items: center;">
                  <div style="flex: 1;">
                    <p style="margin: 0; font-weight: bold;">Product (ID: ${item.product || 'Unknown'})</p>
                    <p style="margin: 5px 0; color: #7f8c8d;">Quantity: ${item.quantity}</p>
                    <p style="margin: 5px 0; color: #7f8c8d;">Price: ${formatVND(item.price || 0)}</p>
                  </div>
                  <div style="text-align: right;">
                    <p style="margin: 0; font-weight: bold;">${formatVND((item.price || 0) * (item.quantity || 0))}</p>
                  </div>
                </div>
              </div>
            `;
            }

            return `
            <div style="border-bottom: 1px solid #e0e0e0; padding: 10px 0;">
              <div style="display: flex; align-items: center;">
                <div style="flex: 1;">
                  <p style="margin: 0; font-weight: bold;">${product.name || 'Unknown Product'}</p>
                  <p style="margin: 5px 0; color: #7f8c8d;">Quantity: ${item.quantity}</p>
                  <p style="margin: 5px 0; color: #7f8c8d;">Price: ${formatVND(item.price || 0)}</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0; font-weight: bold;">${formatVND((item.price || 0) * (item.quantity || 0))}</p>
                </div>
              </div>
            </div>
          `;
          })
          .join('');
      }

      // If no items or items couldn't be loaded, show a fallback message
      if (!itemsHtml) {
        logger.warn('No items HTML generated, showing fallback message');
        itemsHtml = `
          <div style="border-bottom: 1px solid #e0e0e0; padding: 10px 0;">
            <p style="margin: 0; color: #7f8c8d; font-style: italic;">Order items are being processed...</p>
          </div>
        `;
      }

      logger.info('Order details HTML generated successfully');
      return `
        <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 10px 0;">
          <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Order Items:</h3>
          ${itemsHtml}
          <div style="border-top: 2px solid #e0e0e0; margin-top: 15px; padding-top: 15px;">
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
              <span>Subtotal:</span>
              <span>${formatVND(populatedOrder.subtotal || 0)}</span>
            </div>
            ${
              populatedOrder.shippingCost > 0
                ? `
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
              <span>Shipping:</span>
              <span>${formatVND(populatedOrder.shippingCost)}</span>
            </div>
            `
                : ''
            }
            ${
              populatedOrder.tax > 0
                ? `
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
              <span>Tax:</span>
              <span>${formatVND(populatedOrder.tax)}</span>
            </div>
            `
                : ''
            }
            ${
              populatedOrder.discount > 0
                ? `
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
              <span>Discount:</span>
              <span>-${formatVND(populatedOrder.discount)}</span>
            </div>
            `
                : ''
            }
            <div style="display: flex; justify-content: space-between; margin: 10px 0; font-weight: bold; font-size: 16px;">
              <span>Total:</span>
              <span>${formatVND(populatedOrder.totalPrice || 0)}</span>
            </div>
          </div>
          <div style="margin-top: 15px;">
            <p style="margin: 5px 0;"><strong>Shipping Address:</strong></p>
            <p style="margin: 5px 0; color: #7f8c8d;">${populatedOrder.shippingAddress || 'Address not available'}</p>
            <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${populatedOrder.paymentMethod || 'Not specified'}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${populatedOrder.status || 'Pending'}</p>
          </div>
        </div>
      `;
    } catch (error) {
      logger.error('Error generating order details:', error);
      // Return a fallback HTML if there's an error
      return `
        <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 10px 0;">
          <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Order Summary:</h3>
          <div style="border-bottom: 1px solid #e0e0e0; padding: 10px 0;">
            <p style="margin: 0; color: #7f8c8d; font-style: italic;">Order details are being processed...</p>
          </div>
          <div style="border-top: 2px solid #e0e0e0; margin-top: 15px; padding-top: 15px;">
            <div style="display: flex; justify-content: space-between; margin: 10px 0; font-weight: bold; font-size: 16px;">
              <span>Total:</span>
              <span>${formatVND(order.totalPrice || 0)}</span>
            </div>
          </div>
          <div style="margin-top: 15px;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${order.status || 'Pending'}</p>
          </div>
        </div>
      `;
    }
  }

  /**
   * Send a custom email
   * @param {string} to - Recipient's email address
   * @param {string} subject - Email subject
   * @param {string} content - Email content
   * @returns {Promise<void>}
   */
  static async sendEmail(to, subject, content) {
    try {
      if (!to || !subject || !content) {
        throw new Error('Missing required email parameters');
      }

      // Get AccessToken from RefreshToken
      const myAccessTokenObject = await myOAuth2Client.getAccessToken();
      const myAccessToken = myAccessTokenObject?.token;

      // Create transporter
      const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: emailConfig.adminEmailAddress,
          clientId: emailConfig.googleMailerClientId,
          clientSecret: emailConfig.googleMailerClientSecret,
          refresh_token: emailConfig.googleMailerRefreshToken,
          accessToken: myAccessToken,
        },
      });

      // Configure email
      const mailOptions = {
        from: emailConfig.adminEmailAddress,
        to,
        subject,
        html: content,
      };

      // Send email
      const info = await transport.sendMail(mailOptions);
      logger.info('Email sent:', info.messageId);
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }
}

export default EmailService;
