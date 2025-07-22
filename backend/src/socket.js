import logger from './utils/logger.js';
import { saveMessage } from './services/chat.service.js';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace('Bearer ', '');
    
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    logger.info(`Socket authenticated for user: ${user.fullName} (${user._id})`);
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

export default function setupSocketHandlers(io) {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', socket => {
    logger.info(`Socket connected: ${socket.id} for user: ${socket.user.fullName}`);

    // Join user to their personal room for notifications
    socket.join(`user_${socket.user._id}`);
    logger.info(`User ${socket.user._id} joined personal room`);

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      if (!conversationId) {
        socket.emit('error', { message: 'Conversation ID is required' });
        return;
      }
      
      socket.join(conversationId);
      logger.info(`User ${socket.user._id} joined conversation ${conversationId}`);
      
      // Notify others in the conversation that user joined
      socket.to(conversationId).emit('user_joined', {
        userId: socket.user._id,
        userName: socket.user.fullName,
        timestamp: new Date().toISOString()
      });
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      if (!conversationId) return;
      
      socket.leave(conversationId);
      logger.info(`User ${socket.user._id} left conversation ${conversationId}`);
      
      // Notify others that user left
      socket.to(conversationId).emit('user_left', {
        userId: socket.user._id,
        userName: socket.user.fullName,
        timestamp: new Date().toISOString()
      });
    });

    // Send message through socket (alternative to HTTP API)
    socket.on('send_message', async (messageData) => {
      try {
        const { conversationId, content, receiver } = messageData;
        
        if (!conversationId || !content) {
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }

        // Save message to database
        const savedMessage = await saveMessage({
          conversationId,
          sender: socket.user._id,
          receiver: receiver || '6845be4f54a7582c1d2109b8', // Default shop ID
          content
        });

        // Emit to all users in the conversation
        io.to(conversationId).emit('newMessage', {
          id: savedMessage._id,
          conversationId: savedMessage.conversationId,
          senderId: savedMessage.sender,
          senderType: savedMessage.sender.toString() === socket.user._id.toString() ? 'user' : 'admin',
          message: savedMessage.content,
          messageType: 'text',
          attachments: [],
          isRead: false,
          createdAt: savedMessage.timestamp || savedMessage.createdAt,
          updatedAt: savedMessage.timestamp || savedMessage.updatedAt || savedMessage.createdAt,
        });

        logger.info(`Message sent in conversation ${conversationId} by user ${socket.user._id}`);
        
      } catch (error) {
        logger.error('Error sending message via socket:', error);
        socket.emit('error', { message: 'Failed to send message', error: error.message });
      }
    });

    // Typing indicators
    socket.on('typing_start', ({ conversationId }) => {
      if (!conversationId) return;
      
      socket.to(conversationId).emit('userTyping', {
        conversationId,
        userId: socket.user._id,
        userName: socket.user.fullName,
        isTyping: true
      });
      
      logger.debug(`User ${socket.user._id} started typing in ${conversationId}`);
    });

    socket.on('typing_stop', ({ conversationId }) => {
      if (!conversationId) return;
      
      socket.to(conversationId).emit('userTyping', {
        conversationId,
        userId: socket.user._id,
        userName: socket.user.fullName,
        isTyping: false
      });
      
      logger.debug(`User ${socket.user._id} stopped typing in ${conversationId}`);
    });

    // Mark messages as read
    socket.on('mark_as_read', ({ conversationId, messageIds }) => {
      if (!conversationId || !Array.isArray(messageIds)) return;
      
      // Emit to other users in conversation
      socket.to(conversationId).emit('messageRead', {
        conversationId,
        messageIds,
        readBy: socket.user._id,
        readAt: new Date().toISOString()
      });
      
      logger.debug(`User ${socket.user._id} marked ${messageIds.length} messages as read`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error from user ${socket.user._id}:`, error);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id} for user: ${socket.user.fullName}`);
    });
  });
}
