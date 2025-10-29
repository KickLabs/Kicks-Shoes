import logger from './utils/logger.js';
import { saveMessage } from './services/chat.service.js';
import { setupLiveStreamHandlers } from './services/livestreamSocket.service.js';
import liveStreamService from './services/livestream.service.js';

export default function setupSocketHandlers(io) {
  // Setup LiveStream handlers
  setupLiveStreamHandlers(io);

  // User-socket mapping để gửi events trực tiếp đến user
  const userSocketMap = new Map();

  io.on('connection', socket => {
    logger.info(`Socket connected: ${socket.id}`);
    // Fallback handlers on default namespace to support clients not using /livestream
    socket.on('join_as_viewer', async data => {
      try {
        const { roomId, userId } = data || {};
        const result = await liveStreamService.joinAsViewer(socket.id, roomId, userId);
        socket.join(roomId);
        socket.emit('joined', {
          type: 'joined',
          role: 'viewer',
          clientId: socket.id,
          viewerId: result.viewerId,
          streamData: result.streamData,
        });
        logger.info(`(default ns) Viewer ${userId || 'anonymous'} joined room ${roomId}`);
      } catch (error) {
        logger.error('(default ns) Error joining as viewer:', error);
        socket.emit('error', { type: 'join_error', message: error.message });
      }
    });

    socket.on('join_as_host', async data => {
      try {
        const { roomId, userId } = data || {};
        await liveStreamService.joinAsHost(socket.id, roomId, userId);
        socket.join(roomId);
        socket.emit('joined', { type: 'joined', role: 'host', clientId: socket.id });
        logger.info(`(default ns) Host ${userId} joined room ${roomId}`);
      } catch (error) {
        logger.error('(default ns) Error joining as host:', error);
        socket.emit('error', { type: 'join_error', message: error.message });
      }
    });

    socket.on('chat_message', async data => {
      try {
        const result = await liveStreamService.handleChatMessage(socket.id, data || {});
        if (result) {
          // Broadcast to both namespaces for safety
          io.to(result.roomId).emit('chat_message', {
            type: 'chat',
            message: result.message,
            from: result.message.senderRole,
            clientId: socket.id,
            timestamp: result.message.timestamp,
          });
          io.of('/livestream').to(result.roomId).emit('chat_message', {
            type: 'chat',
            message: result.message,
            from: result.message.senderRole,
            clientId: socket.id,
            timestamp: result.message.timestamp,
          });

          if (result.aiResponse) {
            io.to(result.roomId).emit('ai_bot_reply', {
              type: 'ai_bot_reply',
              originalMessage: result.message,
              answer: result.aiResponse.answer,
              confidence: result.aiResponse.confidence,
              timestamp: result.aiResponse.respondedAt,
            });
            io.of('/livestream').to(result.roomId).emit('ai_bot_reply', {
              type: 'ai_bot_reply',
              originalMessage: result.message,
              answer: result.aiResponse.answer,
              confidence: result.aiResponse.confidence,
              timestamp: result.aiResponse.respondedAt,
            });
          }
        }
      } catch (error) {
        logger.error('(default ns) Error handling chat_message:', error);
        socket.emit('error', { type: 'chat_error', message: error.message });
      }
    });

    // Join user-specific room for video call notifications
    socket.on('join_user_room', userId => {
      socket.join(`user_${userId}`);
      userSocketMap.set(userId, socket.id);
      logger.info(`Socket ${socket.id} joined user room: user_${userId}`);
    });

    // Tham gia vào một phòng chat (theo conversationId)
    socket.on('join_conversation', conversationId => {
      socket.join(conversationId);
      logger.info(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Join admin room for AI Inventory alerts
    socket.on('join_admin_room', () => {
      socket.join('admin-room');
      socket.join('shop-dashboard');
      logger.info(`Socket ${socket.id} joined admin room for inventory alerts`);
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

    // Video Call Events
    socket.on('video_call_request', data => {
      logger.info(`Video call request from ${data.from} to ${data.to}:`, data);

      // Gửi đến user room trước (cho global notifications)
      if (data.to) {
        io.to(`user_${data.to}`).emit('video_call_request', data);
        logger.info(`Sent video call request to user room: user_${data.to}`);
      }

      // Gửi đến conversation room (cho chat page)
      if (data.conversationId) {
        socket.to(data.conversationId).emit('video_call_request', data);
        logger.info(`Sent video call request to conversation: ${data.conversationId}`);
      }
    });

    socket.on('video_call_accept', data => {
      logger.info(`Video call accepted by ${data.from} to ${data.to}`);

      // Gửi đến user room
      if (data.to) {
        io.to(`user_${data.to}`).emit('video_call_accepted', data);
      }

      // Gửi đến conversation room
      if (data.conversationId) {
        socket.to(data.conversationId).emit('video_call_accepted', data);
      }
    });

    socket.on('video_call_reject', data => {
      logger.info(`Video call rejected by ${data.from} to ${data.to}`);

      // Gửi đến user room
      if (data.to) {
        io.to(`user_${data.to}`).emit('video_call_rejected', data);
      }

      // Gửi đến conversation room
      if (data.conversationId) {
        socket.to(data.conversationId).emit('video_call_rejected', data);
      }
    });

    socket.on('video_call_end', data => {
      logger.info(`Video call ended by ${data.from} to ${data.to}`);

      // Gửi đến user room
      if (data.to) {
        io.to(`user_${data.to}`).emit('video_call_ended', data);
      }

      // Gửi đến conversation room
      if (data.conversationId) {
        socket.to(data.conversationId).emit('video_call_ended', data);
      }
    });

    // WebRTC Signaling for Video Calls
    socket.on('video_call_offer', data => {
      logger.info(`Video call offer from ${data.from} to ${data.to}`);

      // Gửi đến user room
      if (data.to) {
        io.to(`user_${data.to}`).emit('video_call_offer', data);
      }

      // Gửi đến conversation room
      if (data.conversationId) {
        socket.to(data.conversationId).emit('video_call_offer', data);
      }
    });

    socket.on('video_call_answer', data => {
      logger.info(`Video call answer from ${data.from} to ${data.to}`);

      // Gửi đến user room
      if (data.to) {
        io.to(`user_${data.to}`).emit('video_call_answer', data);
      }

      // Gửi đến conversation room
      if (data.conversationId) {
        socket.to(data.conversationId).emit('video_call_answer', data);
      }
    });

    socket.on('video_call_ice_candidate', data => {
      logger.info(`Video call ICE candidate from ${data.from} to ${data.to}`);

      // Gửi đến user room
      if (data.to) {
        io.to(`user_${data.to}`).emit('video_call_ice_candidate', data);
      }

      // Gửi đến conversation room
      if (data.conversationId) {
        socket.to(data.conversationId).emit('video_call_ice_candidate', data);
      }
    });

    // Test event for debugging
    socket.on('test_event', data => {
      logger.info(`Test event received from ${socket.id}:`, data);
      socket.emit('test_event', {
        message: 'Test response from backend',
        originalData: data,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);

      // Clean up user-socket mapping
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          logger.info(`Removed user ${userId} from socket mapping`);
          break;
        }
      }
    });
  });
}
