/**
 * Socket.IO Service for WebSocket connections
 * Handles both global socket and livestream namespace connections
 */

import { io } from 'socket.io-client';
import { SOCKET_CONFIG } from '../config/webrtc.config.js';

const getSocketURL = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }

  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace('/api', '');
  }

  return '';
};

class SocketService {
  constructor() {
    this.globalSocket = null;
    this.livestreamSocket = null;
    this.socketURL = getSocketURL();
  }

  // Initialize global socket for video calls and general communication
  initializeGlobalSocket() {
    if (this.globalSocket) {
      return this.globalSocket;
    }

    console.log(
      '🌐 Initializing global video call socket for user:',
      localStorage.getItem('userId')
    );

    this.globalSocket = io(this.socketURL, {
      ...SOCKET_CONFIG,
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    });

    this.globalSocket.on('connect', () => {
      console.log('🌐 Global video call socket connected:', this.globalSocket.id);

      // Join user-specific room
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.globalSocket.emit('join_user_room', userId);
        console.log('🏠 Global socket joining user room:', userId);
      }
    });

    this.globalSocket.on('connect_error', error => {
      console.error('🌐 Global video call socket connection error:', error);
    });

    this.globalSocket.on('disconnect', () => {
      console.log('🌐 Global video call socket disconnected');
    });

    return this.globalSocket;
  }

  // Initialize livestream namespace socket
  initializeLivestreamSocket() {
    if (this.livestreamSocket) {
      return this.livestreamSocket;
    }

    const livestreamURL = `${this.socketURL}/livestream`;
    console.log('Connecting to livestream namespace:', livestreamURL);

    this.livestreamSocket = io(livestreamURL, {
      ...SOCKET_CONFIG,
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    });

    this.livestreamSocket.on('connect', () => {
      console.log('📺 Livestream socket connected:', this.livestreamSocket.id);
    });

    this.livestreamSocket.on('connect_error', error => {
      console.error('📺 Livestream socket connect_error:', error.message);
      console.log('Socket connection options:', {
        url: livestreamURL,
        path: '/socket.io',
        transports: ['websocket', 'polling'],
      });
    });

    this.livestreamSocket.on('disconnect', () => {
      console.log('📺 Livestream socket disconnected');
    });

    return this.livestreamSocket;
  }

  // Get global socket instance
  getGlobalSocket() {
    if (!this.globalSocket) {
      return this.initializeGlobalSocket();
    }
    return this.globalSocket;
  }

  // Get livestream socket instance
  getLivestreamSocket() {
    if (!this.livestreamSocket) {
      return this.initializeLivestreamSocket();
    }
    return this.livestreamSocket;
  }

  // Disconnect all sockets
  disconnect() {
    if (this.globalSocket) {
      this.globalSocket.disconnect();
      this.globalSocket = null;
    }
    if (this.livestreamSocket) {
      this.livestreamSocket.disconnect();
      this.livestreamSocket = null;
    }
  }

  // Test socket connection
  testConnection() {
    const globalSocket = this.getGlobalSocket();

    globalSocket.emit('test_event', {
      message: 'Test from frontend',
      timestamp: new Date().toISOString(),
    });

    globalSocket.on('test_event', data => {
      console.log('✅ Socket test response:', data);
    });
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
