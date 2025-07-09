import express from 'express';
import {
  createRewardPoint,
  getUserRewardPoints,
  getUserTotalPoints,
  redeemPoints,
  cleanupTestData,
} from '../controllers/rewardPointController.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Create new reward point
router.post('/', createRewardPoint);

// Get user's reward points
router.get('/user/:userId', getUserRewardPoints);

// Get user's total points
router.get('/user/:userId/total', getUserTotalPoints);

// Redeem points for discount
router.post('/redeem', redeemPoints);

// Clean up test data (Admin only)
router.delete('/cleanup-test-data', cleanupTestData);

export default router;
