import express from 'express';
import vnpayController from '../controllers/vnpayController.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

/**
 * VNPay Payment Routes
 * All payment-related endpoints
 */

// Public routes (no authentication required)
router.post('/create', vnpayController.createPayment);
router.get('/return', vnpayController.verifyPaymentReturn);
router.post('/return', vnpayController.verifyPaymentReturn);
router.get('/test-return', vnpayController.testPaymentReturn);
router.post('/ipn', vnpayController.handleIPN);
router.get('/banks', vnpayController.getBankList);
router.get('/config', vnpayController.getConfig);

// Protected routes (authentication required)
router.post('/query', protect, vnpayController.queryPaymentStatus);
router.post('/refund', protect, authorize('admin'), vnpayController.refundPayment);

export default router;
