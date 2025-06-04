/**
 * @fileoverview Email Service Utility
 * @created 2025-05-31
 * @file sendEmail.js
 * @description This file provides email sending functionality for the Kicks Shoes application.
 * It supports templated emails for various purposes such as verification, password reset, and notifications.
 */

import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { emailConfig } from "../config/email.config.js";
import { emailTemplates } from "../templates/email.templates.js";
import logger from "./logger.js";

// Initialize OAuth2Client
const oauth2Client = new OAuth2Client(
  emailConfig.googleMailerClientId,
  emailConfig.googleMailerClientSecret
);

// Set credentials
oauth2Client.setCredentials({
  refresh_token: emailConfig.googleMailerRefreshToken,
});

/**
 * Send an email using Gmail OAuth2
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email message (HTML content)
 * @returns {Promise<void>}
 */
export const sendEmail = async (options) => {
  try {
    // Get access token
    const { token: accessToken } = await oauth2Client.getAccessToken();

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: emailConfig.adminEmailAddress,
        clientId: emailConfig.googleMailerClientId,
        clientSecret: emailConfig.googleMailerClientSecret,
        refreshToken: emailConfig.googleMailerRefreshToken,
        accessToken,
      },
    });

    // Define email options
    const message = {
      from: `${emailConfig.fromName} <${emailConfig.adminEmailAddress}>`,
      to: options.email,
      subject: options.subject,
      html: options.message,
    };

    // Send email
    const info = await transporter.sendMail(message);
    logger.info("Email sent successfully:", { messageId: info.messageId });
  } catch (error) {
    logger.error("Error sending email:", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Send a templated email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.templateType - Type of email template to use
 * @param {Object} options.templateData - Data to be used in the template
 * @returns {Promise<void>}
 */
export const sendTemplatedEmail = async ({
  email,
  templateType,
  templateData,
}) => {
  try {
    // Get template
    const template = emailTemplates[templateType];
    if (!template) {
      throw new Error(`Email template '${templateType}' not found`);
    }

    // Get subject and content from template
    const subject = template.subject;
    const content = template.getContent(templateData);

    // Send email using template
    await sendEmail({
      email,
      subject,
      message: content,
    });

    logger.info("Templated email sent successfully:", {
      templateType,
      recipient: email,
    });
  } catch (error) {
    logger.error("Error sending templated email:", {
      error: error.message,
      stack: error.stack,
      templateType,
      recipient: email,
    });
    throw error;
  }
};
