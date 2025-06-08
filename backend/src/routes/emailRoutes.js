/**
 * @fileoverview Email Routes - Handles email-related routes
 * @created 2025-05-31
 * @file emailRoutes.js
 * @description This file defines the email routes for the application.
 */

import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { sendTemplatedEmail } from "../utils/sendEmail.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { ErrorResponse } from "../utils/errorResponse.js";
import logger from "../utils/logger.js";

const router = express.Router();

// @desc    Send test email
// @route   POST /api/email/test
// @access  Public
router.post(
  "/test",
  asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
      return next(new ErrorResponse("Please provide an email address", 400));
    }

    try {
      await sendTemplatedEmail({
        email,
        templateType: "VERIFICATION",
        templateData: {
          name: "Test User",
          verificationLink: "https://kicksshoes.com/verify?token=test123",
        },
      });

      logger.info("Test email sent successfully", { email });

      res.status(200).json({
        success: true,
        message: "Test email sent successfully",
      });
    } catch (error) {
      logger.error("Error sending test email", {
        error: error.message,
        stack: error.stack,
        email,
      });
      return next(new ErrorResponse("Email could not be sent", 500));
    }
  })
);

// @desc    Send templated email
// @route   POST /api/email/send
// @access  Private
router.post(
  "/send",
  protect,
  asyncHandler(async (req, res, next) => {
    const { email, templateType, templateData } = req.body;

    if (!email || !templateType) {
      return next(
        new ErrorResponse("Please provide email and template type", 400)
      );
    }

    try {
      await sendTemplatedEmail({
        email,
        templateType,
        templateData,
      });

      logger.info("Templated email sent successfully", {
        email,
        templateType,
      });

      res.status(200).json({
        success: true,
        message: "Email sent successfully",
      });
    } catch (error) {
      logger.error("Error sending templated email", {
        error: error.message,
        stack: error.stack,
        email,
        templateType,
      });
      return next(new ErrorResponse("Email could not be sent", 500));
    }
  })
);

export default router;
