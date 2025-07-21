import {
  findOrCreateConversation,
  saveMessage,
  getConversationsByUser,
  getMessagesByConversation,
} from '../services/chat.service.js';
import User from '../models/User.js';

// GET /api/chat/conversations?userId=xxx
export const getConversations = async (req, res) => {
  const { userId } = req.query;
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
  const { conversationId, sender, receiver, content } = req.body;
  if (!conversationId || !sender || !receiver || !content) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  const message = await saveMessage({ conversationId, sender, receiver, content });
  res.json(message);
};
