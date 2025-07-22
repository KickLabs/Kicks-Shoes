import express from 'express';
import {
  getConversations,
  getMessages,
  createOrFindConversation,
  postMessage,
} from '../controllers/chatController.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Lấy danh sách chat của user
router.get('/conversations', protect, getConversations);
// Lấy lịch sử tin nhắn của conversation
router.get('/messages/:conversationId', getMessages);
// Lấy lịch sử tin nhắn của conversation (route khác cho FE)
router.get('/conversations/:conversationId/messages', getMessages);
// Tạo hoặc tìm conversation giữa user và shop
router.post('/conversation', protect, createOrFindConversation);
// Gửi tin nhắn (lưu vào DB)
router.post('/message', protect, postMessage);
// Gửi tin nhắn (route khác cho FE)
router.post('/conversations/:conversationId/messages', protect, postMessage);

export default router;
