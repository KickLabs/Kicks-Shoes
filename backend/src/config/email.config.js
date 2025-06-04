/**
 * @fileoverview Email Configuration
 * @created 2025-05-31
 * @file email.config.js
 * @description This file contains email configuration settings for the Kicks Shoes application.
 * It includes Gmail OAuth2 credentials, email templates, and email service settings.
 */

export const emailConfig = {
  // Google OAuth2 Configuration
  googleMailerClientId: process.env.GOOGLE_MAILER_CLIENT_ID,
  googleMailerClientSecret: process.env.GOOGLE_MAILER_CLIENT_SECRET,
  googleMailerRefreshToken: process.env.GOOGLE_MAILER_REFRESH_TOKEN,

  // Email Addresses
  adminEmailAddress: process.env.ADMIN_EMAIL_ADDRESS || "admin@kicksshoes.com",
  fromName: process.env.FROM_NAME || "Kicks Shoes",

  // SMTP Configuration (Fallback)
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  },

  // Email Settings
  maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || "3"),
  retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || "1000"),
  timeout: parseInt(process.env.EMAIL_TIMEOUT || "5000"),

  // Email Templates
  defaultLanguage: process.env.EMAIL_DEFAULT_LANGUAGE || "en",
  defaultTimezone: process.env.EMAIL_DEFAULT_TIMEZONE || "UTC",
};

// Validate required configuration
if (
  !emailConfig.googleMailerClientId ||
  !emailConfig.googleMailerClientSecret ||
  !emailConfig.googleMailerRefreshToken ||
  !emailConfig.adminEmailAddress
) {
  throw new Error("Missing required email configuration");
}
