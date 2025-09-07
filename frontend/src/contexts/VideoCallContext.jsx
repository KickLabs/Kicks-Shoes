import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Button } from 'antd';
import { VideoCameraOutlined, PhoneOutlined } from '@ant-design/icons';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../config/api.config';

const VideoCallContext = createContext();

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://kicks-shoes-backend-2025-509fffbae16a.herokuapp.com');

export const VideoCallProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const notificationRef = useRef(null);
  const ringtoneRef = useRef(null);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [shopUserId, setShopUserId] = useState(null);

  // Fetch shop user ID
  useEffect(() => {
    const fetchShopUserId = async () => {
      try {
        const res = await api.get('/users/shop');
        if (res.data && res.data._id) {
          setShopUserId(res.data._id);
          console.log('🏪 Global Shop user ID:', res.data._id);
          console.log('🏪 Global Shop user name:', res.data.fullName);
        }
      } catch (err) {
        console.error('Error fetching global shop user ID:', err);
      }
    };
    fetchShopUserId();
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (user?._id) {
      console.log('🌐 Initializing global video call socket for user:', user._id);
      socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });

      socketRef.current.on('connect', () => {
        console.log('🌐 Global video call socket connected:', socketRef.current.id);

        // Join user-specific room để nhận video call events
        console.log('🏠 Global socket joining user room:', user._id);
        socketRef.current.emit('join_user_room', user._id);
      });

      socketRef.current.on('disconnect', () => {
        console.log('🌐 Global video call socket disconnected');
      });

      socketRef.current.on('connect_error', error => {
        console.error('❌ Global socket connection error:', error);
      });

      // Listen for incoming video calls
      socketRef.current.on('video_call_request', handleIncomingCall);

      return () => {
        if (socketRef.current) {
          console.log('🌐 Disconnecting global video call socket');
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        stopRingtone();
      };
    }
  }, [user?._id]);

  // Create ringtone
  const createRingtone = () => {
    if (!ringtoneRef.current) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        ringtoneRef.current = { audioContext };
      } catch (error) {
        console.warn('Could not create audio context:', error);
      }
    }
  };

  const playRingtone = () => {
    try {
      createRingtone();
      if (!ringtoneRef.current?.audioContext) return;

      const { audioContext } = ringtoneRef.current;

      const playTone = (frequency, duration, delay = 0) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);
        gain.gain.setValueAtTime(0.3, audioContext.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);

        osc.start(audioContext.currentTime + delay);
        osc.stop(audioContext.currentTime + delay + duration);
      };

      // Ring pattern
      playTone(800, 0.3, 0);
      playTone(600, 0.3, 0.4);
      playTone(800, 0.3, 0.8);
      playTone(600, 0.3, 1.2);
    } catch (error) {
      console.warn('Could not play ringtone:', error);
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current?.audioContext) {
      try {
        ringtoneRef.current.audioContext.close();
        ringtoneRef.current = null;
      } catch (error) {
        console.warn('Error stopping ringtone:', error);
      }
    }
  };

  const handleIncomingCall = data => {
    console.log('🌐 Global incoming video call received:', data);

    // Only show notification if user is the receiver
    if (data.to !== user?._id) return;

    setIncomingCallData(data);
    setIsIncomingCall(true);

    // Play ringtone
    playRingtone();

    const callerName = data.fromName || (data.from === shopUserId ? 'Shop Support' : 'Customer');

    // Create custom toast content
    const ToastContent = () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <VideoCameraOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Video Call</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>{callerName} call to you</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            onClick={() => {
              toast.dismiss();
              rejectVideoCall();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <PhoneOutlined /> Reject
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              toast.dismiss();
              acceptVideoCall();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <VideoCameraOutlined /> Accept
          </Button>
        </div>
      </div>
    );

    // Show global toast notification
    notificationRef.current = toast(<ToastContent />, {
      position: 'top-right',
      autoClose: false,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false,
      closeButton: false,
      className: 'video-call-toast',
      onClose: () => {
        stopRingtone();
      },
    });

    // Auto reject after 30 seconds
    setTimeout(() => {
      if (isIncomingCall) {
        toast.dismiss();
        rejectVideoCall();
      }
    }, 30000);
  };

  const acceptVideoCall = () => {
    console.log('🌐 Accepting video call globally');
    stopRingtone();

    const callData = incomingCallData;

    if (socketRef.current && callData) {
      socketRef.current.emit('video_call_accept', {
        from: user?._id,
        to: callData.from,
        conversationId: callData.conversationId,
      });
      console.log('✅ Global accept event emitted to backend');
    }

    // Check if already on chat page
    const currentPath = window.location.pathname;
    const chatPaths = ['/account/chat', '/shop/chat'];
    const isOnChatPage = chatPaths.some(path => currentPath.includes(path));

    if (!isOnChatPage) {
      // Store call data in sessionStorage to persist through redirect
      sessionStorage.setItem('pendingVideoCall', JSON.stringify(callData));

      // Only redirect if not already on chat page
      const chatUrl = user?.role === 'shop' ? '/shop/chat' : '/account/chat';
      console.log('🔄 Redirecting to chat page:', chatUrl);
      window.location.href = chatUrl;
    } else {
      // If already on chat page, trigger modal opening via custom event
      console.log('🎯 Already on chat page, triggering modal via event');
      window.dispatchEvent(
        new CustomEvent('globalVideoCallAccepted', {
          detail: callData,
        })
      );
    }

    setIsIncomingCall(false);
    setIncomingCallData(null);
  };

  const rejectVideoCall = () => {
    console.log('🌐 Rejecting video call globally');
    stopRingtone();

    if (socketRef.current && incomingCallData) {
      socketRef.current.emit('video_call_reject', {
        from: user?._id,
        to: incomingCallData.from,
        conversationId: incomingCallData.conversationId,
      });
    }

    setIsIncomingCall(false);
    setIncomingCallData(null);

    if (notificationRef.current) {
      toast.dismiss();
      notificationRef.current = null;
    }
  };

  const value = {
    socketRef: socketRef.current,
    isIncomingCall,
    incomingCallData,
  };

  return <VideoCallContext.Provider value={value}>{children}</VideoCallContext.Provider>;
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
};
