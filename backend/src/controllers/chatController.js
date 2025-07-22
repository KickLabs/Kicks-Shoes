import {
  findOrCreateConversation,
  saveMessage,
  getConversationsByUser,
  getMessagesByConversation,
} from '../services/chat.service.js';
import User from '../models/User.js';

// GET /api/chat/conversations?userId=xxx
export const getConversations = async (req, res) => {
  let { userId } = req.query;
  if (!userId && req.user) userId = req.user._id || req.user.id;
  if (!userId) return res.status(400).json({ message: 'Missing userId' });
  const conversations = await getConversationsByUser(userId);
  res.json(conversations);
};

// GET /api/chat/messages/:conversationId
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const messages = await getMessagesByConversation(conversationId);
  res.json(messages);
};

// POST /api/chat/conversation
export const createOrFindConversation = async (req, res) => {
  let { userId, shopId } = req.body;
  if (!userId && req.user) userId = req.user._id || req.user.id;
  console.log('Creating conversation with:', { userId, shopId });

  if (!userId) return res.status(400).json({ message: 'Missing userId' });
  if (!shopId) {
    // Sử dụng shop ID cứng nếu không có shopId
    shopId = '6845be4f54a7582c1d2109b8';
  }

  try {
    const conversation = await findOrCreateConversation(userId, shopId);
    console.log('Created/found conversation:', conversation);
    res.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Error creating conversation', error: error.message });
  }
};

// POST /api/chat/message
export const postMessage = async (req, res) => {
  // Lấy conversationId từ params hoặc body
  const conversationId = req.params.conversationId || req.body.conversationId;
  let { sender, receiver, content, message } = req.body;
  
  // content có thể được gửi dưới tên 'message' từ FE
  if (!content && message) {
    content = message;
  }
  
  // Nếu không có sender, lấy từ req.user
  if (!sender && req.user) {
    sender = req.user._id || req.user.id;
  }
  
  // Nếu không có receiver, sử dụng shop ID mặc định
  if (!receiver) {
    receiver = '6845be4f54a7582c1d2109b8';
  }
  
  if (!conversationId || !sender || !receiver || !content) {
    return res.status(400).json({ message: 'Missing fields', received: { conversationId, sender, receiver, content } });
  }
  
  try {
    const savedMessage = await saveMessage({ conversationId, sender, receiver, content });
    res.json({
      success: true,
      data: savedMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ message: 'Error saving message', error: error.message });
  }
};
