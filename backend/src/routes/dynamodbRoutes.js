/**
 * DynamoDB Routes
 * Routes for querying chat messages from DynamoDB
 */

import express from 'express';
import {
  getConversationMessages,
  getAIResponses,
  getLatestMessage,
  healthCheck
} from '../controllers/dynamodbController.js';

const router = express.Router();

// Health check
router.get('/health', healthCheck);

// Get all messages for a conversation
router.get('/messages/:conversationId', getConversationMessages);

// Get only AI responses
router.get('/messages/:conversationId/ai', getAIResponses);

// Get latest message (for polling)
router.get('/messages/:conversationId/latest', getLatestMessage);

export default router;

