import express from 'express';
import {
  getConversations,
  getMessages,
  createOrFindConversation,
  postMessage,
} from '../controllers/chatController.js';

const router = express.Router();

// Lấy danh sách chat của user
router.get('/conversations', getConversations);
// Lấy lịch sử tin nhắn của conversation
router.get('/messages/:conversationId', getMessages);
// Tạo hoặc tìm conversation giữa user và shop
router.post('/conversation', createOrFindConversation);
// Gửi tin nhắn (lưu vào DB)
router.post('/message', postMessage);

export default router;
