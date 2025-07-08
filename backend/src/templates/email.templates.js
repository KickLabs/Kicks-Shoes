/**
 * @fileoverview Email Templates
 * @created 2025-05-31
 * @file email.templates.js
 * @description This file contains HTML email templates for the Kicks Shoes application.
 * It includes templates for user verification, password reset, order notifications, and other system emails.
 */

export const emailTemplates = {
  REGISTRATION: {
    subject: 'Welcome to Kicks Shoes - Verify Your Email',
    getContent: ({ name, verificationLink }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin: 0;">Welcome to Kicks Shoes!</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Hi ${name},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Thank you for registering with Kicks Shoes. To complete your registration and access all features, please verify your email address by clicking the button below:</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">If you didn't request this, please ignore this email.</p>
          <p style="margin: 10px 0 0 0;">This verification link will expire in 1 hour.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },

  VERIFICATION: {
    subject: 'Verify Your Email - Kicks Shoes',
    getContent: ({ name, verificationLink }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin: 0;">Verify Your Email Address</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Hi ${name},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Please verify your email address by clicking the button below to access your Kicks Shoes account:</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">If you didn't request this, please ignore this email.</p>
          <p style="margin: 10px 0 0 0;">This verification link will expire in 1 hour.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },

  PASSWORD_RESET: {
    subject: 'Reset Your Password - Kicks Shoes',
    getContent: ({ name, resetLink }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin: 0;">Password Reset Request</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Hi ${name},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">We received a request to reset your password for your Kicks Shoes account.</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Click the button below to reset your password:</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">If you didn't request this, please ignore this email.</p>
          <p style="margin: 10px 0 0 0;">This link will expire in 1 hour.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },

  ORDER_CONFIRMATION: {
    subject: 'Order Confirmation - Kicks Shoes',
    getContent: ({ name, orderNumber, orderDetails }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin: 0;">Order Confirmation</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Hi ${name},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Thank you for your order! Your order number is: <strong>${orderNumber}</strong></p>
          <h2 style="color: #2c3e50; margin: 20px 0 10px 0;">Order Details:</h2>
          ${orderDetails}
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">We'll notify you when your order ships.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },

  ORDER_SHIPPED: {
    subject: 'Your Order Has Shipped - Kicks Shoes',
    getContent: ({ name, orderNumber, trackingNumber }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin: 0;">Order Shipped</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Hi ${name},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Great news! Your order #${orderNumber} has been shipped.</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Tracking Number: ${trackingNumber}</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">You can track your package using the tracking number above.</p>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },

  OTP: {
    subject: 'Your OTP Code - Kicks Shoes',
    getContent: ({ name, otp }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2c3e50; margin: 0;">Verify Your Identity</h1>
      </div>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
        <p style="color: #34495e; margin: 0;">Hi ${name},</p>
        <p style="color: #34495e; margin: 15px 0 0 0;">Your One-Time Password (OTP) for verifying your Kicks Shoes account is:</p>
        <p style="font-size: 28px; font-weight: bold; color: #e74c3c; text-align: center; margin: 20px 0;">${otp}</p>
        <p style="color: #34495e;">Please enter this code in the app to complete your verification.</p>
      </div>
      <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
        <p style="margin: 0;">If you didn't request this code, you can safely ignore this email.</p>
        <p style="margin: 10px 0 0 0;">This OTP will expire in 5 minutes.</p>
        <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
      </div>
    </div>
  `,
  },

  PRODUCT_WARNING: {
    subject: 'Product Warning Notice - Kicks Shoes',
    getContent: ({ shopName, productName, adminNote, resolution }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e67e22; margin: 0;">Product Warning</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Dear ${shopName || 'Shop'},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Your product <b>${productName}</b> has received a warning due to a violation of our policies.</p>
          <p style="color: #34495e; margin: 15px 0 0 0;"><b>Resolution:</b> ${resolution}</p>
          <p style="color: #34495e; margin: 15px 0 0 0;"><b>Admin Note:</b> ${adminNote || 'No additional notes.'}</p>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">Please review your product and ensure it complies with our guidelines.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Moderation Team</p>
        </div>
      </div>
    `,
  },

  PRODUCT_DELETED: {
    subject: 'Product Deletion Notice - Kicks Shoes',
    getContent: ({ shopName, productName, adminNote, resolution }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e74c3c; margin: 0;">Product Deleted</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Dear ${shopName || 'Shop'},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Your product <b>${productName}</b> has been deleted due to a serious violation of our policies.</p>
          <p style="color: #34495e; margin: 15px 0 0 0;"><b>Resolution:</b> ${resolution}</p>
          <p style="color: #34495e; margin: 15px 0 0 0;"><b>Admin Note:</b> ${adminNote || 'No additional notes.'}</p>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">If you have any questions, please contact our support team.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Moderation Team</p>
        </div>
      </div>
    `,
  },

  REVIEW_DELETED: {
    subject: 'Review Deletion Notice - Kicks Shoes',
    getContent: ({ userName, productName, adminNote, resolution }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e74c3c; margin: 0;">Review Deleted</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Dear ${userName || 'User'},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Your review for product <b>${productName}</b> has been deleted due to a violation of our policies.</p>
          <p style="color: #34495e; margin: 15px 0 0 0;"><b>Resolution:</b> ${resolution}</p>
          <p style="color: #34495e; margin: 15px 0 0 0;"><b>Admin Note:</b> ${adminNote || 'No additional notes.'}</p>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">If you have any questions, please contact our support team.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Moderation Team</p>
        </div>
      </div>
    `,
  },

  REPORT_RESOLVED: {
    subject: 'Your Report Has Been Resolved - Kicks Shoes',
    getContent: ({
      userName,
      productName,
      targetName,
      adminNote,
      resolution,
      reportReason,
      reportDescription,
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #27ae60; margin: 0;">Report Resolved</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Dear ${userName || 'User'},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Thank you for your report. We have reviewed and taken action on your report regarding ${productName ? `product <b>${productName}</b>` : `user <b>${targetName}</b>`}.</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #3498db;">
            <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Your Report Details:</h3>
            <p style="color: #34495e; margin: 5px 0;"><b>Reason:</b> ${reportReason}</p>
            <p style="color: #34495e; margin: 5px 0;"><b>Description:</b> ${reportDescription}</p>
          </div>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #e67e22;">
            <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Admin Resolution:</h3>
            <p style="color: #34495e; margin: 5px 0;"><b>Action Taken:</b> ${resolution}</p>
            <p style="color: #34495e; margin: 5px 0;"><b>Admin Note:</b> ${adminNote || 'No additional notes.'}</p>
          </div>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">Thank you for helping us maintain a safe and quality marketplace.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Moderation Team</p>
        </div>
      </div>
    `,
  },

  USER_DELETED: {
    subject: 'User Deletion Notice - Kicks Shoes',
    getContent: ({ shopName, userName, adminNote, resolution }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e74c3c; margin: 0;">User Deleted</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Dear ${shopName || 'Shop'},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">A user account <b>${userName}</b> has been deleted due to a violation of our policies.</p>
          <p style="color: #34495e; margin: 15px 0 0 0;"><b>Resolution:</b> ${resolution}</p>
          <p style="color: #34495e; margin: 15px 0 0 0;"><b>Admin Note:</b> ${adminNote || 'No additional notes.'}</p>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">If you have any questions, please contact our support team.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Moderation Team</p>
        </div>
      </div>
    `,
  },

  ORDER_PROCESSING: {
    subject: 'Your Order is Being Processed - Kicks Shoes',
    getContent: ({ name, orderNumber, estimatedDelivery }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f39c12; margin: 0;">Order Processing</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Hi ${name},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Great news! Your order #${orderNumber} is now being processed.</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Our team is preparing your items for shipment. You'll receive another notification once your order ships.</p>
          ${estimatedDelivery ? `<p style="color: #34495e; margin: 15px 0 0 0;"><b>Estimated Delivery:</b> ${new Date(estimatedDelivery).toLocaleDateString()}</p>` : ''}
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">Thank you for choosing Kicks Shoes!</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },

  ORDER_DELIVERED: {
    subject: 'Your Order Has Been Delivered - Kicks Shoes',
    getContent: ({ name, orderNumber, deliveryDate }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #27ae60; margin: 0;">Order Delivered</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Hi ${name},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Your order #${orderNumber} has been successfully delivered!</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">We hope you love your new shoes. Please take a moment to review your purchase and share your experience with other customers.</p>
          ${deliveryDate ? `<p style="color: #34495e; margin: 15px 0 0 0;"><b>Delivery Date:</b> ${new Date(deliveryDate).toLocaleDateString()}</p>` : ''}
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">Thank you for choosing Kicks Shoes!</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },

  ORDER_CANCELLED: {
    subject: 'Order Cancellation Confirmation - Kicks Shoes',
    getContent: ({ name, orderNumber, cancellationReason, refundAmount }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e74c3c; margin: 0;">Order Cancelled</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Hi ${name},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Your order #${orderNumber} has been cancelled.</p>
          ${cancellationReason ? `<p style="color: #34495e; margin: 15px 0 0 0;"><b>Reason:</b> ${cancellationReason}</p>` : ''}
          ${
            refundAmount
              ? `<p style="color: #34495e; margin: 15px 0 0 0;"><b>Refund Amount:</b> ${refundAmount.toLocaleString('vi-VN')} ₫</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Your refund will be processed within 3-5 business days.</p>`
              : ''
          }
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">If you have any questions, please contact our support team.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },

  ORDER_REFUNDED: {
    subject: 'Order Refund Confirmation - Kicks Shoes',
    getContent: ({ name, orderNumber, refundAmount, refundReason, refundDate }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #27ae60; margin: 0;">Refund Processed</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Hi ${name},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Your refund for order #${orderNumber} has been processed successfully.</p>
          <p style="color: #34495e; margin: 15px 0 0 0;"><b>Refund Amount:</b> ${refundAmount.toLocaleString('vi-VN')} ₫</p>
          ${refundReason ? `<p style="color: #34495e; margin: 15px 0 0 0;"><b>Reason:</b> ${refundReason}</p>` : ''}
          ${refundDate ? `<p style="color: #34495e; margin: 15px 0 0 0;"><b>Refund Date:</b> ${new Date(refundDate).toLocaleDateString()}</p>` : ''}
          <p style="color: #34495e; margin: 15px 0 0 0;">The refund will appear in your account within 3-5 business days, depending on your bank's processing time.</p>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">Thank you for your patience.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },

  ORDER_FAILED: {
    subject: 'Payment Failed - Kicks Shoes',
    getContent: ({ name, orderNumber, paymentMethod, totalAmount }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e74c3c; margin: 0;">Payment Failed</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Hi ${name},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">We're sorry, but the payment for your order #${orderNumber} has failed.</p>
          <p style="color: #34495e; margin: 15px 0 0 0;"><b>Order Details:</b></p>
          <p style="color: #34495e; margin: 5px 0 0 0;">- Payment Method: ${paymentMethod}</p>
          <p style="color: #34495e; margin: 5px 0 0 0;">- Total Amount: ${totalAmount.toLocaleString('vi-VN')} ₫</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Please try placing your order again or contact our support team if you continue to experience issues.</p>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">If you have any questions, please contact our support team.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },

  ORDER_REFUND_PENDING: {
    subject: 'Refund Processing - Kicks Shoes',
    getContent: ({ name, orderNumber, refundAmount, refundReason }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f39c12; margin: 0;">Refund Processing</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Hi ${name},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Your refund request for order #${orderNumber} is being processed.</p>
          <p style="color: #34495e; margin: 15px 0 0 0;"><b>Refund Amount:</b> ${refundAmount.toLocaleString('vi-VN')} ₫</p>
          ${refundReason ? `<p style="color: #34495e; margin: 15px 0 0 0;"><b>Reason:</b> ${refundReason}</p>` : ''}
          <p style="color: #34495e; margin: 15px 0 0 0;">We're working on processing your refund. You'll receive another notification once the refund is completed.</p>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">Thank you for your patience.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },

  PRODUCT_REPORTED: {
    subject: 'Product Reported - Kicks Shoes',
    getContent: ({ shopName, productName, reporterName, reason, description }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e67e22; margin: 0;">Product Reported</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Dear ${shopName || 'Shop'},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Your product <b>${productName}</b> has been reported by a user.</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #e67e22;">
            <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Report Details:</h3>
            <p style="color: #34495e; margin: 5px 0;"><b>Reporter:</b> ${reporterName}</p>
            <p style="color: #34495e; margin: 5px 0;"><b>Reason:</b> ${reason}</p>
            <p style="color: #34495e; margin: 5px 0;"><b>Description:</b> ${description}</p>
          </div>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">Our admin team will review this report and take appropriate action.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },

  REPORT_SUBMITTED: {
    subject: 'Report Submitted - Kicks Shoes',
    getContent: ({ userName, productName, reason, description }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #27ae60; margin: 0;">Report Submitted</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Dear ${userName || 'User'},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Thank you for your report. We have received your report regarding product <b>${productName}</b>.</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #3498db;">
            <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Your Report Details:</h3>
            <p style="color: #34495e; margin: 5px 0;"><b>Product:</b> ${productName}</p>
            <p style="color: #34495e; margin: 5px 0;"><b>Reason:</b> ${reason}</p>
            <p style="color: #34495e; margin: 5px 0;"><b>Description:</b> ${description}</p>
          </div>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">Our admin team will review your report and take appropriate action.</p>
          <p style="margin: 10px 0 0 0;">We'll notify you once the report has been resolved.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },

  REVIEW_DELETED_SHOP: {
    subject: 'Review Deletion Notice - Kicks Shoes',
    getContent: ({ shopName, productName, userName, adminNote, resolution }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e74c3c; margin: 0;">Review Deleted</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Dear ${shopName || 'Shop'},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">A review for your product <b>${productName}</b> by user <b>${userName}</b> has been deleted due to a violation of our policies.</p>
          <p style="color: #34495e; margin: 15px 0 0 0;"><b>Resolution:</b> ${resolution}</p>
          <p style="color: #34495e; margin: 15px 0 0 0;"><b>Admin Note:</b> ${adminNote || 'No additional notes.'}</p>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">If you have any questions, please contact our support team.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Moderation Team</p>
        </div>
      </div>
    `,
  },

  REVIEW_WARNING: {
    subject: 'Review Warning Notice - Kicks Shoes',
    getContent: ({ userName, productName, adminNote, resolution }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e67e22; margin: 0;">Review Warning</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Dear ${userName || 'User'},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Your review for product <b>${productName}</b> has received a warning due to a violation of our policies.</p>
          <p style="color: #34495e; margin: 15px 0 0 0;"><b>Resolution:</b> ${resolution}</p>
          <p style="color: #34495e; margin: 15px 0 0 0;"><b>Admin Note:</b> ${adminNote || 'No additional notes.'}</p>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">Please review your review and ensure it complies with our guidelines.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Moderation Team</p>
        </div>
      </div>
    `,
  },

  REVIEW_REPORTED: {
    subject: 'Review Reported - Kicks Shoes',
    getContent: ({ shopName, productName, userName, reporterName, reason, description }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e67e22; margin: 0;">Review Reported</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Dear ${shopName || 'Shop'},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">A review for your product <b>${productName}</b> by user <b>${userName}</b> has been reported by a user.</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #e67e22;">
            <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Report Details:</h3>
            <p style="color: #34495e; margin: 5px 0;"><b>Reporter:</b> ${reporterName}</p>
            <p style="color: #34495e; margin: 5px 0;"><b>Reason:</b> ${reason}</p>
            <p style="color: #34495e; margin: 5px 0;"><b>Description:</b> ${description}</p>
          </div>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">Our admin team will review this report and take appropriate action.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },

  REVIEW_REPORT_SUBMITTED: {
    subject: 'Review Report Submitted - Kicks Shoes',
    getContent: ({ userName, productName, reason, description }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #27ae60; margin: 0;">Review Report Submitted</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Dear ${userName || 'User'},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Thank you for your report. We have received your report regarding a review for product <b>${productName}</b>.</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #3498db;">
            <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Your Report Details:</h3>
            <p style="color: #34495e; margin: 5px 0;"><b>Product:</b> ${productName}</p>
            <p style="color: #34495e; margin: 5px 0;"><b>Reason:</b> ${reason}</p>
            <p style="color: #34495e; margin: 5px 0;"><b>Description:</b> ${description}</p>
          </div>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">Our admin team will review your report and take appropriate action.</p>
          <p style="margin: 10px 0 0 0;">We'll notify you once the report has been resolved.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },

  USER_BANNED: {
    subject: 'Account Suspended - Kicks Shoes',
    getContent: ({ userName, adminNote, banReason }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e74c3c; margin: 0;">Account Suspended</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Dear ${userName || 'User'},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Your account has been suspended due to a violation of our community guidelines.</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #e74c3c;">
            <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Suspension Details:</h3>
            ${banReason ? `<p style="color: #34495e; margin: 5px 0;"><b>Reason:</b> ${banReason}</p>` : ''}
            <p style="color: #34495e; margin: 5px 0;"><b>Admin Note:</b> ${adminNote || 'No additional notes.'}</p>
          </div>
          
          <p style="color: #34495e; margin: 15px 0 0 0;">During this suspension, you will not be able to:</p>
          <ul style="color: #34495e; margin: 15px 0 0 0; padding-left: 20px;">
            <li>Place new orders</li>
            <li>Write reviews or comments</li>
            <li>Access certain features of the platform</li>
          </ul>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">If you believe this suspension was made in error, please contact our support team.</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Moderation Team</p>
        </div>
      </div>
    `,
  },

  USER_UNBANNED: {
    subject: 'Account Restored - Kicks Shoes',
    getContent: ({ userName, adminNote }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #27ae60; margin: 0;">Account Restored</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #34495e; margin: 0;">Dear ${userName || 'User'},</p>
          <p style="color: #34495e; margin: 15px 0 0 0;">Good news! Your account has been restored and you now have full access to all features of our platform.</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #27ae60;">
            <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Account Status:</h3>
            <p style="color: #34495e; margin: 5px 0;"><b>Status:</b> Active</p>
            <p style="color: #34495e; margin: 5px 0;"><b>Admin Note:</b> ${adminNote || 'No additional notes.'}</p>
          </div>
          
          <p style="color: #34495e; margin: 15px 0 0 0;">You can now:</p>
          <ul style="color: #34495e; margin: 15px 0 0 0; padding-left: 20px;">
            <li>Place new orders</li>
            <li>Write reviews and comments</li>
            <li>Access all platform features</li>
          </ul>
        </div>
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin: 0;">Thank you for your patience. We look forward to serving you again!</p>
          <p style="margin: 10px 0 0 0;">Best regards,<br>Kicks Shoes Team</p>
        </div>
      </div>
    `,
  },
};
