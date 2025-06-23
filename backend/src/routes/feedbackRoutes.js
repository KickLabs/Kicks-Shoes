import express from 'express';
import { getAllFeedbacks, resolveFeedbackStatus } from '../controllers/feedbackController.js';

import { protect } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

router.get('/', protect, requireAdmin, getAllFeedbacks);

router.patch('/:id/status', protect, requireAdmin, resolveFeedbackStatus);

export default router;
