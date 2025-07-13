import logger from './utils/logger.js';
import { saveMessage } from './services/chat.service.js';

export default function setupSocketHandlers(io) {
  io.on('connection', socket => {
    logger.info(`Socket connected: ${socket.id}`);

    // Tham gia vào một phòng chat (theo conversationId)
    socket.on('join_conversation', conversationId => {
      socket.join(conversationId);
      logger.info(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Nhận và phát tin nhắn mới
    socket.on('send_message', async message => {
      // message: { conversationId, sender, receiver, content }
      try {
        const saved = await saveMessage(message);
        io.to(message.conversationId).emit('receive_message', saved);
      } catch (err) {
        logger.error('Error saving message:', err);
        socket.emit('error_message', 'Could not save message');
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
}
