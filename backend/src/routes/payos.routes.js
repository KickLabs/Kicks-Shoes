/**
 * @fileoverview PayOS Routes
 * @created 2025-01-27
 * @file payos.routes.js
 * @description Routes for PayOS payment integration
 */

import express from 'express';
import { payosRoutes } from '../controllers/payosController.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// Test route for debugging
router.post('/test', (req, res) => {
  console.log('Test endpoint called with:', req.body);
  res.json({ success: true, data: req.body });
});

// Public routes (for webhooks)
router.post('/webhook', payosRoutes.handleWebhook);

// Protected routes (require authentication)
router.post('/create-payment-link', protect, payosRoutes.createPaymentLink);
router.get('/payment-link/:orderCode', protect, payosRoutes.getPaymentLinkInfo);
router.put('/payment-link/:orderCode/cancel', protect, payosRoutes.cancelPaymentLink);

// Admin routes
router.post('/confirm-webhook', protect, authorize(['admin']), payosRoutes.confirmWebhook);

export default router;
