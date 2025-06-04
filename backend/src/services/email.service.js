/**
 * @fileoverview Email Service
 * @created 2025-06-04
 * @file email.service.js
 * @description This file defines the EmailService class for sending emails using OAuth2 and Nodemailer.
 * It provides methods for sending templated emails and custom emails.
 */

const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const { emailConfig } = require("../config/email.config");
const emailTemplates = require("../templates/email.templates");
const logger = require("../utils/logger");

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
        throw new Error("Recipient email address is required");
      }

      const template = emailTemplates[templateType];
      if (!template) {
        throw new Error(`Email template '${templateType}' not found`);
      }

      const subject = template.subject;
      const content = template.getContent(templateData);

      await this.sendEmail(to, subject, content);
    } catch (error) {
      logger.error("Error sending templated email:", error);
      throw error;
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
        throw new Error("Missing required email parameters");
      }

      // Get AccessToken from RefreshToken
      const myAccessTokenObject = await myOAuth2Client.getAccessToken();
      const myAccessToken = myAccessTokenObject?.token;

      // Create transporter
      const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
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
      logger.info("Email sent:", info.messageId);
    } catch (error) {
      logger.error("Error sending email:", error);
      throw error;
    }
  }
}

module.exports = EmailService;
