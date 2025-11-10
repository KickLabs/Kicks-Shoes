/**
 * @fileoverview WebRTC Hook
 * @created 2025-01-02
 * @file useWebRTC.js
 * @description Custom hook for managing WebRTC peer connections
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { ICE_SERVERS, PEER_CONNECTION_CONFIG, SOCKET_CONFIG } from '../config/webrtc.config';
import axiosInstance from '../services/axiosInstance';

export const useWebRTC = (roomId, role, userId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [botReplies, setBotReplies] = useState([]);
  const [personalNotification, setPersonalNotification] = useState(null);
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

    // Prefer env, else derive from current origin (dev vite: 5173 -> 3000)
    const derivedDefault = window.location.origin.replace(':5173', ':3000');
    const rawBaseUrl = import.meta.env.VITE_SOCKET_URL || derivedDefault || 'http://localhost:3000';
    // Normalize base URL and namespace to avoid Invalid namespace errors
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    const namespaceUrl = baseUrl.endsWith('/livestream') ? baseUrl : `${baseUrl}/livestream`;
    console.log('Connecting to livestream namespace:', namespaceUrl);
    socketRef.current = io(namespaceUrl, {
      ...SOCKET_CONFIG,
      withCredentials: true,
      reconnectionAttempts: 10,
      timeout: 10000,
      forceNew: true,
      path: '/socket.io',
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

    socket.on('connect_error', err => {
      console.error('Livestream socket connect_error:', err?.message || err);
      console.error('Socket connection options:', {
        url: socket.io.uri,
        path: socket.io.opts?.path,
        transports: socket.io.opts?.transports,
      });
      setConnectionState('error');
      setError(err?.message || 'Socket connection error');
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
    socket.on('message_pinned', handleMessagePinned);
    socket.on('message_unpinned', handleMessageUnpinned);
    socket.on('ai_bot_reply', handleBotReply);
    socket.on('personal_bot_notification', handlePersonalNotification);

    return () => {
      socket.disconnect();
    };
  }, [roomId, role, userId]);

  // Load initial chat data (history and pinned message)
  useEffect(() => {
    const loadInitialChatData = async () => {
      if (!roomId || !isConnected) return;

      try {
        console.log('Loading initial chat data for room:', roomId);

        // Load chat history
        const chatResponse = await axiosInstance.get(`/livestream/${roomId}/chat`, {
          params: { limit: 50, page: 1 },
        });

        if (chatResponse.data.success && chatResponse.data.data) {
          console.log('Loaded chat history:', chatResponse.data.data.length, 'messages');
          setMessages(chatResponse.data.data);
        }

        // Load pinned message
        const pinnedResponse = await axiosInstance.get(`/livestream/${roomId}/chat/pinned`);

        if (pinnedResponse.data.success && pinnedResponse.data.data) {
          console.log('Loaded pinned message:', pinnedResponse.data.data);
          setPinnedMessage(pinnedResponse.data.data);
        }
      } catch (error) {
        console.error('Error loading initial chat data:', error);
        // Don't throw error, just log it
      }
    };

    loadInitialChatData();
  }, [roomId, isConnected]);

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
      console.log('📡 Received ICE candidate event:', {
        role,
        hasCandidate: !!data.candidate,
        candidateType: data.candidate?.type,
      });

      if (role === 'host') {
        const pc = peersRef.current.get(data.viewerId);
        if (pc && data.candidate) {
          try {
            console.log(
              '📡 Host adding ICE candidate from viewer:',
              data.viewerId,
              'type:',
              data.candidate.type
            );
            await pc.addIceCandidate(data.candidate);
            console.log('✅ Host successfully added ICE candidate');
          } catch (error) {
            console.error('❌ Host error adding ICE candidate:', error);
            // Don't fail the connection for ICE candidate errors
          }
        } else {
          console.warn('⚠️ Host cannot add ICE candidate:', {
            hasPc: !!pc,
            hasCandidate: !!data.candidate,
            viewerId: data.viewerId,
          });
        }
      } else if (role === 'viewer' && peerConnectionRef.current && data.candidate) {
        try {
          console.log('📡 Viewer adding ICE candidate from host, type:', data.candidate.type);
          await peerConnectionRef.current.addIceCandidate(data.candidate);
          console.log('✅ Viewer successfully added ICE candidate');
        } catch (error) {
          console.error('❌ Viewer error adding ICE candidate:', error);
          // Don't fail the connection for ICE candidate errors
        }
      } else if (role === 'viewer' && !data.candidate) {
        console.log('📡 Viewer received end of ICE candidates signal from host');
      }
    },
    [role]
  );

  // Handle chat message
  const handleChatMessage = useCallback(data => {
    setMessages(prev => {
      // Check if message already exists to avoid duplicates
      const exists = prev.some(msg => msg._id === data.message._id);
      if (exists) return prev;
      return [...prev, data.message];
    });
  }, []);

  // Handle message pinned
  const handleMessagePinned = useCallback(data => {
    console.log('Message pinned:', data);
    setPinnedMessage(data.message);

    // Remove the pinned message from regular messages list to avoid duplication
    setMessages(prev => prev.filter(msg => msg._id !== data.message._id));
  }, []);

  // Handle message unpinned
  const handleMessageUnpinned = useCallback(data => {
    console.log('Message unpinned', data);
    setPinnedMessage(null);

    // Add the unpinned message back to messages list
    if (data.message) {
      setMessages(prev => {
        // Check if already exists
        const exists = prev.some(msg => msg._id === data.message._id);
        if (exists) return prev;
        // Add it back in chronological order
        return [...prev, data.message].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
      });
    }
  }, []);

  // Handle bot reply
  const handleBotReply = useCallback(data => {
    console.log('Bot reply received:', data);
    setBotReplies(prev => [
      ...prev,
      {
        id: `bot_${Date.now()}`,
        originalMessage: data.originalMessage,
        answer: data.answer,
        confidence: data.confidence,
        timestamp: data.timestamp,
      },
    ]);
  }, []);

  // Handle personal bot notification
  const handlePersonalNotification = useCallback(data => {
    console.log('Personal notification received:', data);
    setPersonalNotification({
      question: data.question,
      answer: data.answer,
      timestamp: data.timestamp,
      messageId: data.messageId,
    });
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(viewerId => {
    const pc = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    pc.onicecandidate = event => {
      if (event.candidate && socketRef.current) {
        console.log(
          '📡 Host sending ICE candidate to viewer:',
          viewerId,
          'type:',
          event.candidate.type
        );
        socketRef.current.emit('webrtc_ice', {
          viewerId,
          candidate: event.candidate,
        });
      } else if (!event.candidate) {
        console.log('📡 Host ICE gathering complete for viewer:', viewerId);
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log('📡 ICE gathering state:', pc.iceGatheringState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('📡 Host ICE connection state:', pc.iceConnectionState, 'for viewer:', viewerId);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.warn('⚠️ Host ICE connection failed/disconnected, attempting restart...');
        // Try to restart ICE after a delay
        setTimeout(() => {
          if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
            console.log('🔄 Host restarting ICE connection for viewer:', viewerId);
            pc.restartIce();
          }
        }, 2000);
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log('📡 ICE gathering state:', pc.iceGatheringState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('📡 ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.warn('⚠️ ICE connection failed, attempting restart...');
        // Try to restart ICE
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('📡 Host connection state:', pc.connectionState, 'for viewer:', viewerId);
      if (['failed', 'disconnected'].includes(pc.connectionState)) {
        console.warn('⚠️ Host connection failed/disconnected for viewer:', viewerId);
        // Don't immediately delete - try to recover first
        setTimeout(() => {
          if (pc.connectionState === 'closed' || pc.connectionState === 'failed') {
            console.log('🗑️ Removing failed peer connection for viewer:', viewerId);
            peersRef.current.delete(viewerId);
          }
        }, 5000);
      } else if (pc.connectionState === 'closed') {
        peersRef.current.delete(viewerId);
      }
    };

    peersRef.current.set(viewerId, pc);
    return pc;
  }, []);

  // Create offer for viewer (host only)
  const createOfferForViewer = useCallback(
    async viewerId => {
      if (role !== 'host' || !localStreamRef.current) {
        console.warn('⚠️ Cannot create offer: role or stream not ready');
        return;
      }

      console.log('📡 Host creating offer for viewer:', viewerId);
      const pc = createPeerConnection(viewerId);

      // Add local stream tracks
      localStreamRef.current.getTracks().forEach(track => {
        console.log('📹 Adding track to peer connection:', track.kind, track.label);
        pc.addTrack(track, localStreamRef.current);
      });

      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: false,
          offerToReceiveVideo: false,
        });

        console.log('📡 Setting local description (offer)');
        await pc.setLocalDescription(offer);

        console.log('📡 Sending offer to viewer:', viewerId);
        socketRef.current?.emit('webrtc_offer', {
          viewerId,
          sdp: offer.sdp,
        });
      } catch (error) {
        console.error('❌ Error creating offer for viewer:', viewerId, error);
      }
    },
    [role, createPeerConnection]
  );

  // Create answer for host (viewer only)
  const createAnswerForHost = useCallback(
    async offerData => {
      if (role !== 'viewer') return;

      console.log('📡 Creating peer connection for viewer');
      const pc = new RTCPeerConnection(PEER_CONNECTION_CONFIG);
      peerConnectionRef.current = pc;

      pc.ontrack = event => {
        if (remoteVideoRef.current && event.streams && event.streams[0]) {
          console.log('📹 Received remote track, setting video stream');
          const video = remoteVideoRef.current;

          // Stop any current playback first
          video.pause();
          video.load();

          // Set the stream
          video.srcObject = event.streams[0];
          remoteStreamRef.current = event.streams[0];

          // Ensure muted for autoplay policy compliance
          video.muted = true;

          // Wait for metadata to load, then play
          const handleLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            console.log('📹 Video metadata loaded, attempting play');

            video
              .play()
              .then(() => {
                console.log('✅ Remote video started playing successfully');
              })
              .catch(err => {
                console.warn('⚠️ Remote video autoplay blocked:', err?.message || err);
                // Try again after a short delay
                setTimeout(() => {
                  video.play().catch(e => {
                    console.warn('⚠️ Second play attempt failed:', e?.message || e);
                  });
                }, 1000);
              });
          };

          video.addEventListener('loadedmetadata', handleLoadedMetadata);

          // Fallback: try to play immediately if metadata is already loaded
          if (video.readyState >= 1) {
            handleLoadedMetadata();
          }
        }
      };

      pc.onicecandidate = event => {
        if (event.candidate && socketRef.current) {
          console.log('📡 Viewer sending ICE candidate to host, type:', event.candidate.type);
          socketRef.current.emit('webrtc_ice', {
            viewerId: offerData.viewerId,
            candidate: event.candidate,
          });
        } else if (!event.candidate) {
          console.log('📡 Viewer ICE gathering complete');
        }
      };

      pc.onicegatheringstatechange = () => {
        console.log('📡 Viewer ICE gathering state:', pc.iceGatheringState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('📡 Viewer ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          console.warn('⚠️ Viewer ICE connection failed/disconnected, attempting restart...');
          // Try to restart ICE
          setTimeout(() => {
            if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
              console.log('🔄 Restarting ICE connection...');
              pc.restartIce();
            }
          }, 2000);
        }
      };

      pc.onicegatheringstatechange = () => {
        console.log('📡 Viewer ICE gathering state:', pc.iceGatheringState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('📡 Viewer ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          console.warn('⚠️ Viewer ICE connection failed, attempting restart...');
          pc.restartIce();
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('📡 Viewer connection state:', pc.connectionState);
        setConnectionState(pc.connectionState);

        // Auto-retry on failure
        if (pc.connectionState === 'failed') {
          console.error('❌ Connection failed, will retry...');
          setError('Connection failed. Retrying...');
          setTimeout(() => {
            if (pc.connectionState === 'failed') {
              console.log('🔄 Attempting to restart ICE after connection failure');
              pc.restartIce();
            }
          }, 3000);
        }
      };

      try {
        console.log('📡 Setting remote description');
        await pc.setRemoteDescription({ type: 'offer', sdp: offerData.sdp });

        console.log('📡 Creating answer');
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log('📡 Sending answer to host');
        socketRef.current?.emit('webrtc_answer', {
          viewerId: offerData.viewerId,
          sdp: answer.sdp,
        });
      } catch (error) {
        console.error('❌ Error creating answer:', error);
        setError(`Failed to create WebRTC answer: ${error.message}`);
      }
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

  // Connection retry mechanism for cross-network issues
  const retryConnection = useCallback(() => {
    if (role === 'viewer' && peerConnectionRef.current) {
      console.log('🔄 Retrying WebRTC connection...');
      const pc = peerConnectionRef.current;

      // Try to restart ICE
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        try {
          pc.restartIce();
          console.log('🔄 ICE restart initiated');
        } catch (error) {
          console.error('❌ Failed to restart ICE:', error);
        }
      }
    }
  }, [role]);

  // Auto-retry connection on failure
  useEffect(() => {
    if (connectionState === 'failed' || connectionState === 'disconnected') {
      const retryTimeout = setTimeout(() => {
        console.log('🔄 Auto-retrying connection...');
        retryConnection();
      }, 5000); // Retry after 5 seconds

      return () => clearTimeout(retryTimeout);
    }
  }, [connectionState, retryConnection]);

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
    pinnedMessage,
    botReplies,
    personalNotification,

    // Actions
    startCamera,
    stopCamera,
    sendChatMessage,
    featureProduct,
    retryConnection,
    dismissNotification: () => setPersonalNotification(null),

    // Stream objects (for advanced usage)
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,

    // Socket instance (for custom event listeners)
    socket: socketRef.current,
  };
};
