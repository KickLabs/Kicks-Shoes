/**
 * @fileoverview LiveStream Service
 * @created 2025-01-02
 * @file livestream.service.js
 * @description Service for managing WebRTC livestream signaling and room management
 */

import { nanoid } from 'nanoid';
import LiveStream from '../models/LiveStream.js';
import LiveStreamChat from '../models/LiveStreamChat.js';
import User from '../models/User.js';
import orderDetectionService from './orderDetection.service.js';
import logger from '../utils/logger.js';

class LiveStreamService {
  constructor() {
    // roomId -> { host: { socketId, userId, streamData }, viewers: Map<viewerId, {socketId, userId}> }
    this.rooms = new Map();
    this.socketToRoom = new Map(); // socketId -> { roomId, role, userId }
  }

  /**
   * Create a new livestream room
   */
  async createRoom(hostUserId, streamData) {
    try {
      const roomId = nanoid(12);

      // Create database record
      const liveStream = new LiveStream({
        roomId,
        title: streamData.title,
        description: streamData.description,
        hostId: hostUserId,
        scheduledAt: streamData.scheduledAt,
        settings: streamData.settings || {},
      });

      await liveStream.save();

      // Initialize room in memory
      this.rooms.set(roomId, {
        host: null,
        viewers: new Map(),
        streamData: liveStream,
      });

      logger.info(`Created livestream room: ${roomId} for user: ${hostUserId}`);
      return liveStream;
    } catch (error) {
      logger.error('Error creating livestream room:', error);
      throw error;
    }
  }

  /**
   * Host joins the room
   */
  async joinAsHost(socketId, roomId, userId) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Verify user is the host
      if (room.streamData.hostId.toString() !== userId.toString()) {
        throw new Error('Unauthorized: User is not the host');
      }

      // Remove old host if exists
      if (room.host?.socketId) {
        this.socketToRoom.delete(room.host.socketId);
      }

      // Set new host
      room.host = { socketId, userId, joinedAt: new Date() };
      this.socketToRoom.set(socketId, { roomId, role: 'host', userId });

      // Update stream status to live
      const updatedStream = await LiveStream.findByIdAndUpdate(
        room.streamData._id,
        {
          status: 'live',
          isActive: true,
          startedAt: new Date(),
        },
        { new: true }
      );

      // Update in-memory room data
      room.streamData = updatedStream;

      // Create system message
      await LiveStreamChat.createSystemMessage(room.streamData._id, roomId, 'stream_started', {
        hostName: 'Host',
      });

      logger.info(`Host ${userId} joined room ${roomId}`);

      return {
        roomId,
        role: 'host',
        viewers: Array.from(room.viewers.keys()),
        streamData: room.streamData,
      };
    } catch (error) {
      logger.error('Error joining as host:', error);
      throw error;
    }
  }

  /**
   * Viewer joins the room
   */
  async joinAsViewer(socketId, roomId, userId) {
    try {
      let room = this.rooms.get(roomId);

      // If room doesn't exist in memory, try to load from database
      if (!room) {
        const streamData = await LiveStream.findOne({ roomId, isActive: true });
        if (!streamData) {
          throw new Error('Stream not found or not active');
        }

        this.rooms.set(roomId, {
          host: null,
          viewers: new Map(),
          streamData,
        });
        room = this.rooms.get(roomId);
      } else {
        // Refresh stream data from database to get latest status
        const freshStreamData = await LiveStream.findOne({ roomId });
        if (freshStreamData) {
          room.streamData = freshStreamData;
        }
      }

      // Check if stream is active
      if (!room.streamData.isActive) {
        throw new Error('Stream is not active');
      }

      // Check viewer limit
      if (room.viewers.size >= room.streamData.settings.maxViewers) {
        throw new Error('Stream has reached maximum viewer capacity');
      }

      const viewerId = nanoid(10);
      room.viewers.set(viewerId, {
        socketId,
        userId,
        viewerId,
        joinedAt: new Date(),
      });

      this.socketToRoom.set(socketId, { roomId, role: 'viewer', userId, viewerId });

      // Update viewer count in database
      // Note: streamData might be a plain object in tests, so use direct DB update
      if (room.streamData._id) {
        await LiveStream.findByIdAndUpdate(room.streamData._id, {
          viewerCount: room.viewers.size,
        });
      }

      // Create join system message if user is authenticated
      if (userId) {
        const user = await import('../models/User.js').then(m => m.default.findById(userId));
        if (user) {
          await LiveStreamChat.createSystemMessage(room.streamData._id, roomId, 'join', {
            username: user.username,
          });
        }
      }

      logger.info(`Viewer ${userId || 'anonymous'} joined room ${roomId} as ${viewerId}`);

      return {
        roomId,
        role: 'viewer',
        viewerId,
        streamData: room.streamData,
      };
    } catch (error) {
      logger.error('Error joining as viewer:', error);
      throw error;
    }
  }

  /**
   * Handle WebRTC signaling
   */
  handleSignaling(socketId, message) {
    const socketInfo = this.socketToRoom.get(socketId);
    if (!socketInfo) {
      logger.warn(`Socket ${socketId} not found in any room`);
      return null;
    }

    const room = this.rooms.get(socketInfo.roomId);
    if (!room) {
      logger.warn(`Room ${socketInfo.roomId} not found`);
      return null;
    }

    return {
      room,
      socketInfo,
      targetSocket: this.getTargetSocket(room, message, socketInfo),
    };
  }

  /**
   * Get target socket for signaling
   */
  getTargetSocket(room, message, senderInfo) {
    if (senderInfo.role === 'host') {
      // Host sending to specific viewer
      const viewer = room.viewers.get(message.viewerId);
      return viewer?.socketId;
    } else if (senderInfo.role === 'viewer') {
      // Viewer sending to host
      return room.host?.socketId;
    }
    return null;
  }

  /**
   * Handle chat message
   */
  async handleChatMessage(socketId, messageData) {
    try {
      const socketInfo = this.socketToRoom.get(socketId);
      if (!socketInfo) {
        throw new Error('Socket not found in any room');
      }

      const room = this.rooms.get(socketInfo.roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Create chat message in database
      const chatMessage = new LiveStreamChat({
        streamId: room.streamData._id,
        roomId: socketInfo.roomId,
        senderId: socketInfo.userId,
        senderRole: socketInfo.role,
        content: messageData.text,
        messageType: messageData.type || 'text',
      });

      await chatMessage.save();
      await chatMessage.populate('senderId', 'username avatar');

      // Update message count
      await LiveStream.findByIdAndUpdate(room.streamData._id, {
        $inc: { 'stats.totalMessages': 1 },
      });

      // Analyze message for potential orders (only for viewer messages)
      let potentialOrder = null;
      if (socketInfo.role === 'viewer' && messageData.type !== 'system') {
        try {
          const userData = await User.findById(socketInfo.userId);
          if (userData) {
            const detectionResult = await orderDetectionService.analyzeMessage(
              chatMessage,
              room.streamData,
              userData
            );

            // Mark message as analyzed
            await chatMessage.markAsAnalyzed(detectionResult);

            // If potential order detected, save it
            if (detectionResult && detectionResult.isOrder) {
              potentialOrder = await orderDetectionService.savePotentialOrder(detectionResult);

              // Link chat message to potential order
              await chatMessage.linkToPotentialOrder(potentialOrder._id);

              logger.info(`Potential order detected in room ${socketInfo.roomId}:`, {
                orderId: potentialOrder._id,
                customer: potentialOrder.customerInfo.customerName,
                confidence: potentialOrder.detectionData.confidence,
              });
            }
          }
        } catch (orderDetectionError) {
          // Don't fail the chat message if order detection fails
          logger.error('Error in order detection:', orderDetectionError);
        }
      }

      logger.info(`Chat message saved for room ${socketInfo.roomId}`);

      return {
        roomId: socketInfo.roomId,
        message: chatMessage,
        potentialOrder, // Include potential order in response
      };
    } catch (error) {
      logger.error('Error handling chat message:', error);
      throw error;
    }
  }

  /**
   * Handle socket disconnect
   */
  async handleDisconnect(socketId) {
    try {
      const socketInfo = this.socketToRoom.get(socketId);
      if (!socketInfo) {
        return null;
      }

      const room = this.rooms.get(socketInfo.roomId);
      if (!room) {
        this.socketToRoom.delete(socketId);
        return null;
      }

      if (socketInfo.role === 'host') {
        // Host disconnected - end stream
        room.host = null;

        // Update stream status
        await LiveStream.findByIdAndUpdate(room.streamData._id, {
          status: 'ended',
          isActive: false,
          endedAt: new Date(),
        });

        // Create system message
        await LiveStreamChat.createSystemMessage(
          room.streamData._id,
          socketInfo.roomId,
          'stream_ended',
          {}
        );

        logger.info(`Host disconnected from room ${socketInfo.roomId} - stream ended`);

        return {
          roomId: socketInfo.roomId,
          event: 'host-left',
          viewers: Array.from(room.viewers.values()).map(v => v.socketId),
        };
      } else if (socketInfo.role === 'viewer') {
        // Viewer disconnected
        room.viewers.delete(socketInfo.viewerId);

        // Update viewer count in database
        // Note: streamData might be a plain object in tests, so use direct DB update
        if (room.streamData._id) {
          await LiveStream.findByIdAndUpdate(room.streamData._id, {
            viewerCount: room.viewers.size,
          });
        }

        // Create leave system message if user was authenticated
        if (socketInfo.userId) {
          const user = await import('../models/User.js').then(m =>
            m.default.findById(socketInfo.userId)
          );
          if (user) {
            await LiveStreamChat.createSystemMessage(
              room.streamData._id,
              socketInfo.roomId,
              'leave',
              { username: user.username }
            );
          }
        }

        logger.info(`Viewer ${socketInfo.viewerId} disconnected from room ${socketInfo.roomId}`);

        return {
          roomId: socketInfo.roomId,
          event: 'viewer-left',
          viewerId: socketInfo.viewerId,
          hostSocket: room.host?.socketId,
        };
      }

      this.socketToRoom.delete(socketId);
      return null;
    } catch (error) {
      logger.error('Error handling disconnect:', error);
      return null;
    }
  }

  /**
   * Get room status
   */
  getRoomStatus(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    return {
      roomId,
      isActive: !!room.host,
      viewerCount: room.viewers.size,
      streamData: room.streamData,
    };
  }

  /**
   * Get all active rooms
   */
  getActiveRooms() {
    const activeRooms = [];
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.host) {
        activeRooms.push({
          roomId,
          viewerCount: room.viewers.size,
          streamData: room.streamData,
        });
      }
    }
    return activeRooms;
  }

  /**
   * Clean up inactive rooms
   */
  cleanupInactiveRooms() {
    const now = new Date();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [roomId, room] of this.rooms.entries()) {
      if (!room.host && room.viewers.size === 0) {
        const lastActivity = room.lastActivity || room.streamData.updatedAt;
        if (now - lastActivity > inactiveThreshold) {
          this.rooms.delete(roomId);
          logger.info(`Cleaned up inactive room: ${roomId}`);
        }
      }
    }
  }
}

// Export singleton instance
const liveStreamService = new LiveStreamService();

// Clean up inactive rooms every 5 minutes
setInterval(
  () => {
    liveStreamService.cleanupInactiveRooms();
  },
  5 * 60 * 1000
);

export default liveStreamService;
