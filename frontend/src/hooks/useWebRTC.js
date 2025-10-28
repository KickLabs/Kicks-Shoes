/**
 * @fileoverview WebRTC Hook
 * @created 2025-01-02
 * @file useWebRTC.js
 * @description Custom hook for managing WebRTC peer connections
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { ICE_SERVERS, PEER_CONNECTION_CONFIG, SOCKET_CONFIG } from '../config/webrtc.config';

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
            console.log('📡 Host adding ICE candidate:', data.candidate.type);
            await pc.addIceCandidate(data.candidate);
          } catch (error) {
            console.error('❌ Host error adding ICE candidate:', error);
            // Don't fail the connection for ICE candidate errors
          }
        }
      } else if (role === 'viewer' && peerConnectionRef.current && data.candidate) {
        try {
          console.log('📡 Viewer adding ICE candidate:', data.candidate.type);
          await peerConnectionRef.current.addIceCandidate(data.candidate);
        } catch (error) {
          console.error('❌ Viewer error adding ICE candidate:', error);
          // Don't fail the connection for ICE candidate errors
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
    const pc = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    pc.onicecandidate = event => {
      if (event.candidate && socketRef.current) {
        console.log('📡 Sending ICE candidate:', event.candidate.type);
        socketRef.current.emit('webrtc_ice', {
          viewerId,
          candidate: event.candidate,
        });
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
      console.log('📡 Connection state:', pc.connectionState);
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
          console.log('📡 Sending ICE candidate from viewer:', event.candidate.type);
          socketRef.current.emit('webrtc_ice', {
            viewerId: offerData.viewerId,
            candidate: event.candidate,
          });
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

    // Actions
    startCamera,
    stopCamera,
    sendChatMessage,
    featureProduct,
    retryConnection,

    // Stream objects (for advanced usage)
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
  };
};
