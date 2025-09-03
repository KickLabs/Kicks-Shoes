/**
 * @fileoverview WebRTC Hook
 * @created 2025-01-02
 * @file useWebRTC.js
 * @description Custom hook for managing WebRTC peer connections
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Add TURN servers here if needed
  // { urls: 'turn:your.turn.server:3478', username: 'user', credential: 'pass' }
];

export const useWebRTC = (roomId, role, userId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peersRef = useRef(new Map()); // For host: viewerId -> RTCPeerConnection
  const peerConnectionRef = useRef(null); // For viewer: single connection to host

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!roomId || !role) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    socketRef.current = io(`${socketUrl}/livestream`, {
      transports: ['websocket'],
      forceNew: true,
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionState('connected');
      setError(null);

      // Join room based on role
      if (role === 'host') {
        socket.emit('join_as_host', { roomId, userId });
      } else {
        socket.emit('join_as_viewer', { roomId, userId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setConnectionState('disconnected');
    });

    socket.on('error', errorData => {
      setError(errorData.message);
      setConnectionState('error');
    });

    // Room events
    socket.on('joined', handleJoined);
    socket.on('viewer_joined', handleViewerJoined);
    socket.on('viewer_left', handleViewerLeft);
    socket.on('host_left', handleHostLeft);
    socket.on('viewer_count_update', data => {
      setViewerCount(data.count);
    });

    // WebRTC signaling events
    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice', handleIceCandidate);

    // Chat events
    socket.on('chat_message', handleChatMessage);

    return () => {
      socket.disconnect();
    };
  }, [roomId, role, userId]);

  // Handle joined confirmation
  const handleJoined = useCallback(
    data => {
      console.log('Joined room:', data);
      if (role === 'host' && data.viewers) {
        // Create peer connections for existing viewers
        data.viewers.forEach(viewerId => {
          createPeerConnection(viewerId);
        });
      }
    },
    [role]
  );

  // Handle new viewer joining (host only)
  const handleViewerJoined = useCallback(
    async data => {
      if (role === 'host') {
        await createOfferForViewer(data.viewerId);
      }
    },
    [role]
  );

  // Handle viewer leaving (host only)
  const handleViewerLeft = useCallback(
    data => {
      if (role === 'host') {
        const pc = peersRef.current.get(data.viewerId);
        if (pc) {
          pc.close();
          peersRef.current.delete(data.viewerId);
        }
      }
    },
    [role]
  );

  // Handle host leaving (viewer only)
  const handleHostLeft = useCallback(() => {
    if (role === 'viewer' && peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setConnectionState('host_disconnected');
    }
  }, [role]);

  // Handle WebRTC offer (viewer only)
  const handleOffer = useCallback(
    async data => {
      if (role === 'viewer' && data.fromHost) {
        await createAnswerForHost(data);
      }
    },
    [role]
  );

  // Handle WebRTC answer (host only)
  const handleAnswer = useCallback(
    async data => {
      if (role === 'host') {
        const pc = peersRef.current.get(data.viewerId);
        if (pc && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
        }
      }
    },
    [role]
  );

  // Handle ICE candidate
  const handleIceCandidate = useCallback(
    async data => {
      if (role === 'host') {
        const pc = peersRef.current.get(data.viewerId);
        if (pc && data.candidate) {
          try {
            await pc.addIceCandidate(data.candidate);
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        }
      } else if (role === 'viewer' && peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(data.candidate);
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    },
    [role]
  );

  // Handle chat message
  const handleChatMessage = useCallback(data => {
    setMessages(prev => [...prev, data.message]);
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(viewerId => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = event => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc_ice', {
          viewerId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        peersRef.current.delete(viewerId);
      }
    };

    peersRef.current.set(viewerId, pc);
    return pc;
  }, []);

  // Create offer for viewer (host only)
  const createOfferForViewer = useCallback(
    async viewerId => {
      if (role !== 'host' || !localStreamRef.current) return;

      const pc = createPeerConnection(viewerId);

      // Add local stream tracks
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });

      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });

      await pc.setLocalDescription(offer);

      socketRef.current?.emit('webrtc_offer', {
        viewerId,
        sdp: offer.sdp,
      });
    },
    [role, createPeerConnection]
  );

  // Create answer for host (viewer only)
  const createAnswerForHost = useCallback(
    async offerData => {
      if (role !== 'viewer') return;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerConnectionRef.current = pc;

      pc.ontrack = event => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteStreamRef.current = event.streams[0];
        }
      };

      pc.onicecandidate = event => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('webrtc_ice', {
            viewerId: offerData.viewerId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
      };

      await pc.setRemoteDescription({ type: 'offer', sdp: offerData.sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit('webrtc_answer', {
        viewerId: offerData.viewerId,
        sdp: answer.sdp,
      });
    },
    [role]
  );

  // Start camera (host only)
  const startCamera = useCallback(async () => {
    if (role !== 'host') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setConnectionState('camera_ready');
      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera and microphone');
      throw error;
    }
  }, [role]);

  // Stop camera (host only)
  const stopCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, []);

  // Send chat message
  const sendChatMessage = useCallback(text => {
    if (socketRef.current && text.trim()) {
      socketRef.current.emit('chat_message', { text: text.trim() });
    }
  }, []);

  // Feature product (host only)
  const featureProduct = useCallback(
    product => {
      if (role === 'host' && socketRef.current) {
        socketRef.current.emit('feature_product', {
          productId: product._id,
          product,
        });
      }
    },
    [role]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
      peersRef.current.forEach(pc => pc.close());
      peersRef.current.clear();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [stopCamera]);

  return {
    // Connection state
    isConnected,
    connectionState,
    error,

    // Stream refs
    localVideoRef,
    remoteVideoRef,

    // Data
    viewerCount,
    messages,

    // Actions
    startCamera,
    stopCamera,
    sendChatMessage,
    featureProduct,

    // Stream objects (for advanced usage)
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
  };
};
