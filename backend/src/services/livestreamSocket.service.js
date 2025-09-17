/**
 * @fileoverview LiveStream Socket Service
 * @created 2025-01-02
 * @file livestreamSocket.service.js
 * @description WebRTC signaling handlers for Socket.IO integration
 */

import liveStreamService from './livestream.service.js';
import logger from '../utils/logger.js';

/**
 * Setup WebRTC livestream handlers for Socket.IO
 * @param {SocketIOServer} io - Socket.IO server instance
 */
export function setupLiveStreamHandlers(io) {
  const livestreamNamespace = io.of('/livestream');

  livestreamNamespace.on('connection', socket => {
    logger.info(`LiveStream socket connected: ${socket.id}`);

    // Join room as host
    socket.on('join_as_host', async data => {
      try {
        const { roomId, userId } = data;
        const result = await liveStreamService.joinAsHost(socket.id, roomId, userId);

        socket.join(roomId);
        socket.emit('joined', {
          type: 'joined',
          role: 'host',
          clientId: socket.id,
          viewers: result.viewers,
          streamData: result.streamData,
        });

        // Notify existing viewers that host joined
        socket.to(roomId).emit('host_joined', {
          type: 'host_joined',
          hostId: userId,
        });

        logger.info(`Host ${userId} joined room ${roomId}`);
      } catch (error) {
        logger.error('Error joining as host:', error);
        socket.emit('error', {
          type: 'join_error',
          message: error.message,
        });
      }
    });

    // Join room as viewer
    socket.on('join_as_viewer', async data => {
      try {
        const { roomId, userId } = data;
        const result = await liveStreamService.joinAsViewer(socket.id, roomId, userId);

        socket.join(roomId);
        socket.emit('joined', {
          type: 'joined',
          role: 'viewer',
          clientId: socket.id,
          viewerId: result.viewerId,
          streamData: result.streamData,
        });

        // Notify host that new viewer joined
        socket.to(roomId).emit('viewer_joined', {
          type: 'viewer_joined',
          viewerId: result.viewerId,
          userId: userId,
        });

        // Update viewer count for all clients
        livestreamNamespace.to(roomId).emit('viewer_count_update', {
          type: 'viewer_count_update',
          count: await getRoomViewerCount(roomId),
        });

        logger.info(`Viewer ${userId || 'anonymous'} joined room ${roomId}`);
      } catch (error) {
        logger.error('Error joining as viewer:', error);
        socket.emit('error', {
          type: 'join_error',
          message: error.message,
        });
      }
    });

    // WebRTC Offer (Host -> Viewer)
    socket.on('webrtc_offer', data => {
      try {
        const signaling = liveStreamService.handleSignaling(socket.id, data);
        if (signaling?.targetSocket) {
          livestreamNamespace.to(signaling.targetSocket).emit('webrtc_offer', {
            type: 'offer',
            sdp: data.sdp,
            fromHost: true,
            viewerId: data.viewerId,
          });
        }
      } catch (error) {
        logger.error('Error handling WebRTC offer:', error);
      }
    });

    // WebRTC Answer (Viewer -> Host)
    socket.on('webrtc_answer', data => {
      try {
        const signaling = liveStreamService.handleSignaling(socket.id, data);
        if (signaling?.targetSocket) {
          livestreamNamespace.to(signaling.targetSocket).emit('webrtc_answer', {
            type: 'answer',
            sdp: data.sdp,
            viewerId: data.viewerId,
          });
        }
      } catch (error) {
        logger.error('Error handling WebRTC answer:', error);
      }
    });

    // ICE Candidate
    socket.on('webrtc_ice', data => {
      try {
        const signaling = liveStreamService.handleSignaling(socket.id, data);
        if (signaling?.targetSocket) {
          livestreamNamespace.to(signaling.targetSocket).emit('webrtc_ice', {
            type: 'ice',
            candidate: data.candidate,
            viewerId: data.viewerId,
          });
        }
      } catch (error) {
        logger.error('Error handling ICE candidate:', error);
      }
    });

    // Chat message
    socket.on('chat_message', async data => {
      try {
        const result = await liveStreamService.handleChatMessage(socket.id, data);
        if (result) {
          // Broadcast message to all clients in the room
          livestreamNamespace.to(result.roomId).emit('chat_message', {
            type: 'chat',
            message: result.message,
            from: result.message.senderRole,
            clientId: socket.id,
            timestamp: result.message.timestamp,
          });

          // If potential order detected, notify host
          if (result.potentialOrder) {
            const room = liveStreamService.rooms.get(result.roomId);
            if (room && room.host) {
              livestreamNamespace.to(room.host.socketId).emit('potential_order_detected', {
                type: 'potential_order',
                order: {
                  _id: result.potentialOrder._id,
                  customerInfo: result.potentialOrder.customerInfo,
                  productInfo: result.potentialOrder.productInfo,
                  detectionData: result.potentialOrder.detectionData,
                  priority: result.potentialOrder.priority,
                  status: result.potentialOrder.status,
                  createdAt: result.potentialOrder.createdAt,
                },
                message: result.message,
                roomId: result.roomId,
              });

              logger.info(`Potential order notification sent to host in room ${result.roomId}`);
            }
          }
        }
      } catch (error) {
        logger.error('Error handling chat message:', error);
        socket.emit('error', {
          type: 'chat_error',
          message: error.message,
        });
      }
    });

    // Pin a chat message (Host only)
    socket.on('pin_message', async data => {
      try {
        const { messageId, roomId } = data;
        const socketInfo = liveStreamService.socketToRoom.get(socket.id);
        if (!socketInfo || socketInfo.role !== 'host') {
          throw new Error('Only hosts can pin messages');
        }

        // Persist pin in room state
        const room = liveStreamService.rooms.get(roomId || socketInfo.roomId);
        if (!room) throw new Error('Room not found');
        room.pinnedMessageId = messageId;

        // Broadcast to all clients in room
        livestreamNamespace.to(roomId || socketInfo.roomId).emit('message_pinned', {
          type: 'message_pinned',
          messageId,
        });
      } catch (error) {
        logger.error('Error pinning message:', error);
        socket.emit('error', { type: 'pin_error', message: error.message });
      }
    });

    // Unpin message (Host only)
    socket.on('unpin_message', async data => {
      try {
        const { roomId } = data;
        const socketInfo = liveStreamService.socketToRoom.get(socket.id);
        if (!socketInfo || socketInfo.role !== 'host') {
          throw new Error('Only hosts can unpin messages');
        }

        const room = liveStreamService.rooms.get(roomId || socketInfo.roomId);
        if (!room) throw new Error('Room not found');
        room.pinnedMessageId = null;

        livestreamNamespace.to(roomId || socketInfo.roomId).emit('message_unpinned', {
          type: 'message_unpinned',
        });
      } catch (error) {
        logger.error('Error unpinning message:', error);
        socket.emit('error', { type: 'pin_error', message: error.message });
      }
    });

    // Feature product (Host only)
    socket.on('feature_product', async data => {
      try {
        const socketInfo = liveStreamService.socketToRoom.get(socket.id);
        if (!socketInfo || socketInfo.role !== 'host') {
          throw new Error('Only hosts can feature products');
        }

        const room = liveStreamService.rooms.get(socketInfo.roomId);
        if (room) {
          await room.streamData.addFeaturedProduct(data.productId);

          // Broadcast to all viewers
          socket.to(socketInfo.roomId).emit('product_featured', {
            type: 'product_featured',
            product: data.product,
          });

          // Create system chat message
          await liveStreamService.handleChatMessage(socket.id, {
            text: `Featured product: ${data.product.name}`,
            type: 'product',
          });
        }
      } catch (error) {
        logger.error('Error featuring product:', error);
        socket.emit('error', {
          type: 'feature_error',
          message: error.message,
        });
      }
    });

    // Get room status
    socket.on('get_room_status', data => {
      try {
        const status = liveStreamService.getRoomStatus(data.roomId);
        socket.emit('room_status', status);
      } catch (error) {
        logger.error('Error getting room status:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      try {
        const result = await liveStreamService.handleDisconnect(socket.id);
        if (result) {
          if (result.event === 'host-left') {
            // Notify all viewers that host left
            result.viewers.forEach(viewerSocketId => {
              livestreamNamespace.to(viewerSocketId).emit('host_left', {
                type: 'host_left',
                message: 'Host has ended the stream',
              });
            });
          } else if (result.event === 'viewer-left' && result.hostSocket) {
            // Notify host that viewer left
            livestreamNamespace.to(result.hostSocket).emit('viewer_left', {
              type: 'viewer_left',
              viewerId: result.viewerId,
            });

            // Update viewer count
            livestreamNamespace.to(result.roomId).emit('viewer_count_update', {
              type: 'viewer_count_update',
              count: await getRoomViewerCount(result.roomId),
            });
          }
        }

        logger.info(`LiveStream socket disconnected: ${socket.id}`);
      } catch (error) {
        logger.error('Error handling livestream disconnect:', error);
      }
    });
  });

  // Helper function to get room viewer count
  async function getRoomViewerCount(roomId) {
    const status = liveStreamService.getRoomStatus(roomId);
    return status?.viewerCount || 0;
  }
}

/**
 * Broadcast system message to room
 * @param {SocketIOServer} io - Socket.IO server instance
 * @param {string} roomId - Room ID
 * @param {string} message - System message
 */
export function broadcastSystemMessage(io, roomId, message) {
  const livestreamNamespace = io.of('/livestream');
  livestreamNamespace.to(roomId).emit('system_message', {
    type: 'system',
    message,
    timestamp: new Date(),
  });
}

/**
 * Broadcast viewer count update
 * @param {SocketIOServer} io - Socket.IO server instance
 * @param {string} roomId - Room ID
 * @param {number} count - New viewer count
 */
export function broadcastViewerCount(io, roomId, count) {
  const livestreamNamespace = io.of('/livestream');
  livestreamNamespace.to(roomId).emit('viewer_count_update', {
    type: 'viewer_count_update',
    count,
  });
}
