/**
 * @fileoverview Middleware to check if the user is the owner of the feedback
 * @created 2025-06-28
 * @file feedback.middleware.js
 * @description This file checks if the feedback belongs to the logged-in user.
 */

import Feedback from '../models/Feedback.js';

export const checkFeedbackOwner = async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) {
    return res.status(404).json({ success: false, message: 'Feedback not found' });
  }
  if (feedback.user.toString() !== req.user.id) {
    return res
      .status(403)
      .json({ success: false, message: 'You are not authorized to modify this feedback' });
  }
  next();
};
