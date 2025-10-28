import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Input,
  Button,
  List,
  Avatar,
  Typography,
  Badge,
  Popconfirm,
  Tooltip,
  Modal,
  notification,
} from 'antd';
import { toast } from 'react-toastify';
import {
  SendOutlined,
  UserOutlined,
  SearchOutlined,
  ShopOutlined,
  DeleteOutlined,
  ClearOutlined,
  VideoCameraOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import TabHeader from './TabHeader';
import { ActiveTabContext } from './ActiveTabContext';
import ReactMarkdown from 'react-markdown';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../../../contexts/AuthContext';
import aiChatService from '../../../services/aiChatService';
import api from '../../../config/api.config';
import {
  ICE_SERVERS,
  PEER_CONNECTION_CONFIG,
  OFFER_OPTIONS,
  SOCKET_CONFIG,
} from '../../../config/webrtc.config';
import './ChatPage.css';

const { Text } = Typography;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://kicks-shoes-backend.azurewebsites.net');

const ChatPage = props => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Ưu tiên prop, fallback sang context
  const role = props.role || (user?.role === 'shop' ? 'shop' : 'customer');
  const userId = props.userId || user?._id;
  const shopId = props.shopId || (user?.role === 'shop' ? user?._id : user?.shopId);
  const isWidget = props.isWidget || false;

  // Debug log để kiểm tra user info
  console.log('Current user:', user);
  console.log('Current userId:', userId);
  console.log('Current role:', role);
  console.log('Current shopId:', shopId);

  const [chatList, setChatList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const activeTabContext = useContext(ActiveTabContext);
  const setActiveTab = activeTabContext?.setActiveTab;
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const isDashboard = location?.pathname?.startsWith('/dashboard') || false;
  const socketRef = useRef(null);
  const [shopIdState, setShopIdState] = useState(shopId);
  const conversationCreatedRef = useRef(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [shopUserId, setShopUserId] = useState(null);
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Video call states
  const [isVideoCallModalOpen, setIsVideoCallModalOpen] = useState(false);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [localVideoStream, setLocalVideoStream] = useState(null);
  const [remoteVideoStream, setRemoteVideoStream] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [iceConnectionState, setIceConnectionState] = useState('new');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const notificationRef = useRef(null);
  const ringtoneRef = useRef(null);

  // Định nghĩa AI chat object
  const aiChat = {
    _id: 'ai',
    name: 'AI Product Consulting',
    lastMessage: 'Hello, I am AI Product Consulting. How can I help you?',
    lastUpdated: new Date(),
    pinned: true,
    isAI: true,
  };

  useEffect(() => {
    if (!isWidget && setActiveTab) {
      if (isDashboard) {
        setActiveTab('7');
      } else {
        setActiveTab('4');
      }
    }
  }, [setActiveTab, isWidget, isDashboard]);

  // Kết nối socket khi mount
  useEffect(() => {
    console.log('🚀 Initializing socket connection to:', SOCKET_URL);
    socketRef.current = io(SOCKET_URL, SOCKET_CONFIG);

    // Debug socket connection
    socketRef.current.on('connect', () => {
      console.log('🔌 Socket connected for video calls');
      console.log('🆔 Socket ID:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    socketRef.current.on('connect_error', error => {
      console.error('❌ Socket connection error:', error);
    });

    // Listen for global video call accept events
    const handleGlobalVideoCallAccepted = event => {
      console.log('🎯 Received global video call accepted event:', event.detail);
      const callData = event.detail;

      // Set incoming call data and immediately open modal
      setIncomingCallData(callData);
      setIsIncomingCall(false); // Clear incoming call state
      setIsVideoCallActive(true);
      setIsVideoCallModalOpen(true);

      console.log('✅ Global video call accepted - modal will open');
    };

    window.addEventListener('globalVideoCallAccepted', handleGlobalVideoCallAccepted);

    // Check for pending video call from redirect
    const checkPendingVideoCall = () => {
      const pendingCall = sessionStorage.getItem('pendingVideoCall');
      if (pendingCall) {
        try {
          const callData = JSON.parse(pendingCall);
          console.log('📞 Found pending video call from redirect:', callData);

          // Clear from sessionStorage
          sessionStorage.removeItem('pendingVideoCall');

          // Trigger the same logic as global accept
          setTimeout(() => {
            handleGlobalVideoCallAccepted({ detail: callData });
          }, 1000); // Small delay to ensure page is fully loaded
        } catch (error) {
          console.error('Error parsing pending video call:', error);
          sessionStorage.removeItem('pendingVideoCall');
        }
      }
    };

    // Check for pending call after socket is connected
    setTimeout(checkPendingVideoCall, 500);

    return () => {
      socketRef.current.disconnect();
      // Clean up video call resources
      stopRingtone();
      if (notificationRef.current) {
        toast.dismiss();
      }
      // Clean up global event listener
      window.removeEventListener('globalVideoCallAccepted', handleGlobalVideoCallAccepted);
    };
  }, []);

  // Lấy shopId cho customer và shopUserId cho video calls
  useEffect(() => {
    if (role === 'customer' && !shopIdState) {
      api
        .get('/users/shop')
        .then(res => {
          if (res.data && res.data._id) {
            setShopIdState(res.data._id);
            setShopUserId(res.data._id); // Lưu shop user ID cho video calls
            console.log('🏪 Shop user ID:', res.data._id);
          }
        })
        .catch(err => {
          console.error('Error fetching shop:', err);
        });
    } else if (!shopUserId) {
      // Lấy shop user ID cho tất cả cases
      api
        .get('/users/shop')
        .then(res => {
          if (res.data && res.data._id) {
            setShopUserId(res.data._id);
            console.log('🏪 Shop user ID:', res.data._id);
          }
        })
        .catch(err => {
          console.error('Error fetching shop:', err);
        });
    }
  }, [role, shopIdState, shopUserId]);

  // Lấy danh sách chat
  useEffect(() => {
    if (role === 'customer') {
      // Customer: AI + Shop chat với shop user cụ thể
      const shopChat = {
        _id: 'shop',
        name: 'Shop Support',
        lastMessage: 'Welcome! How can we help you?',
        lastUpdated: new Date(),
        pinned: false,
        isAI: false,
        isShop: true,
        shopUserId: shopUserId, // ID động của shop user
      };
      setChatList([aiChat, shopChat]);
      setSelectedChat(aiChat); // Mặc định chọn AI
    } else {
      // Shop: lấy danh sách chat thật từ API
      const fetchChats = async () => {
        setIsLoading(true);
        try {
          const res = await api.get(`/chat/conversations?userId=${shopId}`);
          const data = res.data;

          // Map data và format conversations
          const mappedConversations = data.map(conversation => ({
            _id: conversation._id,
            name: conversation.participants?.find(p => p._id !== shopId)?.fullName || 'Customer',
            lastMessage: conversation.lastMessage || 'No messages yet',
            lastUpdated: conversation.lastUpdated || new Date(),
            pinned: false,
            isAI: false,
            isShop: false,
            participants: conversation.participants,
            userId: conversation.participants?.find(p => p._id !== shopId)?._id,
          }));

          setChatList([aiChat, ...mappedConversations]);
        } catch (error) {
          console.error('Error fetching conversations:', error);
          setChatList([aiChat]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchChats();
    }
  }, [role, shopId]);

  // Set userId cho aiChatService để tạo localStorage riêng cho mỗi user
  useEffect(() => {
    if (userId) {
      aiChatService.setUserId(userId);
      console.log('Set userId for aiChatService:', userId);
    }
  }, [userId]);

  // Khi chọn chat, load messages từ localStorage cho AI
  useEffect(() => {
    if (!selectedChat) return;

    if (selectedChat.isAI) {
      // Load messages từ localStorage cho AI (đã được set userId)
      const savedMessages = aiChatService.loadMessages();
      console.log('Loaded AI messages for user:', userId, savedMessages);
      if (savedMessages && savedMessages.length > 0) {
        setMessages(savedMessages);
      } else {
        // Nếu không có messages, hiển thị welcome message
        let welcomeContent = 'Hello, I am AI Product Consulting. How can I help you?';

        if (role === 'shop' || role === 'admin') {
          welcomeContent = `Chào bạn! Tôi là AI trợ lý quản trị cửa hàng giày của bạn, sẵn sàng giúp bạn phân tích các dữ liệu quan trọng để bạn có cái nhìn toàn diện và đưa ra quyết định kinh doanh hiệu quả.

Để tôi có thể thực hiện các phân tích này một cách chính xác và hữu ích, bạn có thể hỏi về:

📊 **Báo cáo Doanh thu:**
• "Báo cáo doanh thu hôm nay"
• "Thống kê doanh thu tháng này"
• "Sản phẩm nào bán chạy nhất?"

📦 **Tình trạng Tồn kho:**
• "Tình trạng tồn kho"
• "Sản phẩm nào sắp hết hàng?"
• "Kiểm tra tồn kho Nike"

👥 **Thông tin Khách hàng:**
• "Thống kê khách hàng"
• "Khách hàng VIP"
• "Phân tích hành vi mua sắm"

📈 **Báo cáo Bán hàng:**
• "Báo cáo bán hàng tuần này"
• "Tỷ lệ chuyển đổi"
• "Hiệu suất nhân viên"

Hãy bắt đầu bằng cách hỏi về bất kỳ chủ đề nào bạn quan tâm!`;
        }

        setMessages([
          {
            content: welcomeContent,
            sender: 'ai',
            timestamp: new Date(),
            isAI: true,
            productSuggestions: [],
            analyticsData: null,
          },
        ]);
      }
      return;
    }

    if (selectedChat.isShop && !selectedChat._id) {
      setMessages([]); // Reset messages cho shop chat chưa có conversation
      return;
    }
  }, [selectedChat?.isAI, selectedChat?.isShop, selectedChat?._id, userId]);

  // Xử lý tạo conversation khi chọn shop chat
  useEffect(() => {
    if (
      selectedChat?.isShop &&
      role === 'customer' &&
      !selectedChat._id &&
      !conversationCreatedRef.current
    ) {
      const createConversation = async () => {
        try {
          conversationCreatedRef.current = true;
          const res = await api.post('/chat/conversation', {
            userId,
            shopId: selectedChat.shopUserId || shopUserId,
          });
          const conversation = res.data;

          // Cập nhật selectedChat với conversationId thật
          setSelectedChat(prev => ({ ...prev, _id: conversation._id }));
        } catch (error) {
          console.error('Error creating conversation:', error);
        }
      };

      createConversation();
    }
  }, [selectedChat?.isShop, selectedChat?._id, role, userId]);

  // Load messages khi conversation được tạo
  useEffect(() => {
    if (selectedChat?._id && selectedChat._id !== 'shop' && selectedChat._id !== 'ai') {
      const loadMessages = async () => {
        setIsLoading(true);
        try {
          const res = await api.get(`/chat/messages/${selectedChat._id}`);
          const data = res.data;
          setMessages(data);
          console.log('🏠 Joining conversation:', selectedChat._id);
          socketRef.current.emit('join_conversation', selectedChat._id);

          // Debug log
          console.log('Loaded messages:', data);
          console.log('Selected chat:', selectedChat);
        } catch (error) {
          console.error('Error loading messages:', error);
          setMessages([]);
        } finally {
          setIsLoading(false);
        }
      };

      loadMessages();
    } else if (selectedChat?.isShop && selectedChat._id === 'shop') {
      // Load messages cho shop chat với user cụ thể
      const loadShopMessages = async () => {
        setIsLoading(true);
        try {
          // Tìm conversation giữa user hiện tại và shop user
          const res = await api.post(`/chat/conversation`, {
            userId,
            shopId: shopUserId,
          });
          const conversation = res.data;
          console.log('Shop conversation:', conversation);

          if (conversation._id) {
            const messagesRes = await api.get(`/chat/messages/${conversation._id}`);
            const messagesData = messagesRes.data;
            setMessages(messagesData);
            socketRef.current.emit('join_conversation', conversation._id);

            // Cập nhật selectedChat với conversationId thật và participants
            setSelectedChat(prev => ({
              ...prev,
              _id: conversation._id,
              participants: conversation.participants || prev.participants,
            }));
          }
        } catch (error) {
          console.error('Error loading shop messages:', error);
          setMessages([]);
        } finally {
          setIsLoading(false);
        }
      };

      loadShopMessages();
    }
  }, [selectedChat?._id, selectedChat?.isShop, userId]);

  // Lắng nghe tin nhắn mới từ socket
  useEffect(() => {
    if (!socketRef.current) return;
    const handleReceive = msg => {
      setMessages(prev => [...prev, msg]);

      // Cập nhật last message trong chat list
      setChatList(prev =>
        prev.map(chat => {
          if (chat._id === msg.conversationId) {
            return {
              ...chat,
              lastMessage: msg.content,
              lastUpdated: new Date(),
            };
          }
          // Cập nhật cho shop chat nếu tin nhắn từ shop user
          if (chat.isShop && msg.sender === shopUserId) {
            return {
              ...chat,
              lastMessage: msg.content,
              lastUpdated: new Date(),
            };
          }
          return chat;
        })
      );
    };

    // Video call event handlers - Only handle local chat page events
    const handleIncomingCall = data => {
      console.log('🔔 Local incoming video call received in chat page:', data);

      // Only handle if user is the receiver and we're in chat page
      if (data.to !== userId) return;

      setIncomingCallData(data);
      setIsIncomingCall(true);

      // Note: Global notification is handled by VideoCallProvider
      console.log('📱 Local video call state updated');
    };

    const handleCallAccepted = data => {
      // Stop ringtone and close notification
      stopRingtone();
      if (notificationRef.current) {
        toast.dismiss();
        notificationRef.current = null;
      }

      setIsVideoCallActive(true);
      setIsVideoCallModalOpen(true);
    };

    const handleCallRejected = data => {
      // Stop ringtone and close notification
      stopRingtone();
      if (notificationRef.current) {
        toast.dismiss();
        notificationRef.current = null;
      }

      // Clean up and show notification
      setIsVideoCallModalOpen(false);
      setIsVideoCallActive(false);
      setIsIncomingCall(false);
      setIncomingCallData(null);

      // Show rejection message
      toast.info('Video call cancelled by the other party', {
        position: 'top-right',
        autoClose: 3000,
      });
    };

    const handleCallEnded = data => {
      // Stop ringtone and close notification
      stopRingtone();
      if (notificationRef.current) {
        toast.dismiss();
        notificationRef.current = null;
      }

      endVideoCall();
    };

    const handleWebRTCOffer = async data => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        socketRef.current.emit('video_call_answer', {
          from: userId || user?._id,
          to: data.from,
          answer: answer,
          conversationId: selectedChat?._id,
        });
      }
    };

    const handleWebRTCAnswer = async data => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
    };

    const handleWebRTCIceCandidate = async data => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };

    socketRef.current.on('receive_message', handleReceive);
    socketRef.current.on('video_call_request', handleIncomingCall);
    socketRef.current.on('video_call_accepted', handleCallAccepted);
    socketRef.current.on('video_call_rejected', handleCallRejected);
    socketRef.current.on('video_call_ended', handleCallEnded);
    socketRef.current.on('video_call_offer', handleWebRTCOffer);
    socketRef.current.on('video_call_answer', handleWebRTCAnswer);
    socketRef.current.on('video_call_ice_candidate', handleWebRTCIceCandidate);

    console.log('🎧 Video call event listeners registered');

    // Test if socket events are working
    socketRef.current.on('test_event', data => {
      console.log('🧪 Test event received:', data);
    });

    return () => {
      socketRef.current.off('receive_message', handleReceive);
      socketRef.current.off('video_call_request', handleIncomingCall);
      socketRef.current.off('video_call_accepted', handleCallAccepted);
      socketRef.current.off('video_call_rejected', handleCallRejected);
      socketRef.current.off('video_call_ended', handleCallEnded);
      socketRef.current.off('video_call_offer', handleWebRTCOffer);
      socketRef.current.off('video_call_answer', handleWebRTCAnswer);
      socketRef.current.off('video_call_ice_candidate', handleWebRTCIceCandidate);
    };
  }, [selectedChat]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  // Khi gửi tin nhắn
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    if (selectedChat.isAI) {
      // Gửi cho AI using FTES API
      const userMessage = {
        content: newMessage,
        sender: userId,
        timestamp: new Date(),
        isAI: false,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      aiChatService.saveMessages(updatedMessages); // Lưu vào localStorage

      // Cập nhật last message cho AI chat hoặc shop chat khi user gửi tin nhắn
      if (selectedChat.isAI || selectedChat.isShop) {
        setChatList(prev =>
          prev.map(chat => {
            if ((selectedChat.isAI && chat.isAI) || (selectedChat.isShop && chat.isShop)) {
              return {
                ...chat,
                lastMessage: newMessage,
                lastUpdated: new Date(),
              };
            }
            return chat;
          })
        );
      }

      setIsLoading(true);
      setNewMessage('');
      setStreamingMessage('');
      setIsLoadingAI(true);

      try {
        await aiChatService.sendMessage(
          newMessage,
          role, // Pass user role
          // onStream callback
          chunk => {
            setStreamingMessage(prev => prev + chunk);
          },
          // onComplete callback
          (finalResponse, fullData) => {
            const aiMessage = {
              content: finalResponse,
              sender: 'ai',
              timestamp: new Date(),
              isAI: true,
              productSuggestions: fullData.productSuggestions || [],
              analyticsData: fullData.analytics_data || null,
            };
            const finalMessages = [...updatedMessages, aiMessage];
            setMessages(finalMessages);
            aiChatService.saveMessages(finalMessages); // Lưu vào localStorage

            // Lưu product suggestions
            if (fullData.productSuggestions && fullData.productSuggestions.length > 0) {
              setProductSuggestions(fullData.productSuggestions);
            }
            setIsLoadingAI(false);

            // Cập nhật last message cho AI chat
            setChatList(prev =>
              prev.map(chat => {
                if (chat.isAI) {
                  return {
                    ...chat,
                    lastMessage: finalResponse,
                    lastUpdated: new Date(),
                  };
                }
                return chat;
              })
            );

            setStreamingMessage('');
            setIsLoading(false);
          },
          // onError callback
          error => {
            const errorMessage = {
              content: 'AI gặp sự cố, vui lòng thử lại sau.',
              sender: 'ai',
              timestamp: new Date(),
              isAI: true,
            };
            const errorMessages = [...updatedMessages, errorMessage];
            setMessages(errorMessages);
            aiChatService.saveMessages(errorMessages); // Lưu vào localStorage
            setStreamingMessage('');
            setIsLoading(false);
          }
        );
      } catch (error) {
        setMessages(prev => [
          ...prev,
          {
            content: 'AI gặp sự cố, vui lòng thử lại sau.',
            sender: 'ai',
            timestamp: new Date(),
            isAI: true,
          },
        ]);
        setStreamingMessage('');
        setIsLoading(false);
      }
      return;
    }

    // Xử lý shop chat với user cụ thể
    if (selectedChat.isShop && selectedChat._id === 'shop') {
      // Tạo conversation nếu chưa có
      const createShopConversation = async () => {
        try {
          const res = await api.post('/chat/conversation', {
            userId,
            shopId: '6845be4f54a7582c1d2109b8',
          });
          const conversation = res.data;

          if (conversation._id) {
            // Gửi tin nhắn sau khi tạo conversation
            const msg = {
              conversationId: conversation._id,
              sender: userId,
              receiver: shopUserId,
              content: newMessage,
            };
            socketRef.current.emit('send_message', msg);
            setNewMessage('');

            // Cập nhật selectedChat với conversationId thật
            setSelectedChat(prev => ({ ...prev, _id: conversation._id }));
          }
        } catch (error) {
          console.error('Error creating shop conversation:', error);
          alert('Failed to connect to shop. Please try again.');
        }
      };

      createShopConversation();
      return;
    }

    // Gửi chat thật
    let conversationId = selectedChat._id;
    let receiver;

    if (role === 'shop') {
      // Shop gửi cho user
      receiver = selectedChat.participants?.find(id => id !== shopId) || selectedChat.userId;
    } else {
      // Customer gửi cho shop
      receiver = selectedChat.shopUserId || shopUserId;
    }

    if (!receiver) {
      alert('Cannot find receiver');
      return;
    }

    const msg = {
      conversationId,
      sender: role === 'shop' ? shopId : userId,
      receiver,
      content: newMessage,
    };

    socketRef.current.emit('send_message', msg);
    setNewMessage('');
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setProductSuggestions([]);
    aiChatService.clearMessages();
    aiChatService.resetConversation();
  };

  // Handle click on product suggestion card
  const handleProductClick = productId => {
    console.log('Navigating to product:', productId);
    navigate(`/product/${productId}`);
  };

  // Video call functions - using configuration from webrtc.config.js

  // Create ringtone audio
  const createRingtone = () => {
    if (!ringtoneRef.current) {
      // Create a simple ringtone using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

      ringtoneRef.current = { oscillator, gainNode, audioContext };
    }
  };

  const playRingtone = () => {
    try {
      createRingtone();
      const { oscillator, audioContext } = ringtoneRef.current;

      // Play ringtone pattern
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

      // Ring pattern: high-low-high-low
      playTone(800, 0.3, 0);
      playTone(600, 0.3, 0.4);
      playTone(800, 0.3, 0.8);
      playTone(600, 0.3, 1.2);
    } catch (error) {
      console.warn('Could not play ringtone:', error);
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      try {
        const { audioContext } = ringtoneRef.current;
        audioContext.close();
        ringtoneRef.current = null;
      } catch (error) {
        console.warn('Error stopping ringtone:', error);
      }
    }
  };

  const initializePeerConnection = () => {
    const pc = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    pc.onicecandidate = event => {
      if (event.candidate && socketRef.current) {
        const fromId = userId || user?._id;
        const toId =
          role === 'customer'
            ? shopUserId
            : selectedChat?.userId || selectedChat?.participants?.find(p => p._id !== shopId)?._id;

        console.log('🧊 Sending ICE candidate:', {
          from: fromId,
          to: toId,
          candidate: event.candidate,
        });

        socketRef.current.emit('video_call_ice_candidate', {
          from: fromId,
          to: toId,
          candidate: event.candidate,
          conversationId: selectedChat?._id,
        });
      }
    };

    pc.ontrack = event => {
      console.log('📹 Received remote track:', event);
      if (remoteVideoRef.current && event.streams && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteVideoStream(event.streams[0]);
        console.log('✅ Remote video stream set');
      }
    };

    // Enhanced connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log('🔗 Peer connection state changed:', pc.connectionState);
      setConnectionStatus(pc.connectionState);
      if (pc.connectionState === 'failed') {
        console.error('❌ Peer connection failed, attempting to restart ICE');
        pc.restartIce();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', pc.iceConnectionState);
      setIceConnectionState(pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.error('❌ ICE connection failed, attempting to restart ICE');
        pc.restartIce();
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log('🧊 ICE gathering state:', pc.iceGatheringState);
    };

    return pc;
  };

  const startVideoCall = async () => {
    if (!selectedChat || selectedChat.isAI) return;

    // Check if user is logged in
    if (!userId) {
      toast.error('Please login to make a video call.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    // If this is a shop chat without real conversation ID, create one first
    if (selectedChat._id === 'shop' && role === 'customer') {
      try {
        const res = await api.post('/chat/conversation', {
          userId,
          shopId: shopUserId,
        });
        const conversation = res.data;

        // Update selectedChat with real conversation ID
        setSelectedChat(prev => ({ ...prev, _id: conversation._id }));

        // Wait a moment for the state to update
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log('✅ Created conversation for video call:', conversation._id);
      } catch (error) {
        console.error('Error creating conversation for video call:', error);
        toast.error('Can not create conversation.', {
          position: 'top-right',
          autoClose: 3000,
        });
        return;
      }
    }

    // Check if we have a valid conversation ID
    const conversationId =
      selectedChat._id === 'shop' ? 'temp-shop-conversation' : selectedChat._id;
    if (!conversationId || conversationId === 'ai') {
      toast.error('Please select a conversation to make a video call.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalVideoStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize peer connection
      const pc = initializePeerConnection();
      peerConnectionRef.current = pc;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Create offer with better configuration
      const offer = await pc.createOffer(OFFER_OPTIONS);
      await pc.setLocalDescription(offer);

      // Send call request
      let receiverId;
      if (role === 'customer') {
        // Customer gọi shop: lấy ID của user có role = 'shop'
        receiverId = shopUserId; // Shop user ID từ API
        if (!receiverId) {
          toast.error('Can not get shop information.', {
            position: 'top-right',
            autoClose: 3000,
          });
          return;
        }
      } else {
        // Shop gọi customer: lấy ID của customer từ conversation
        receiverId =
          selectedChat.userId || selectedChat.participants?.find(p => p._id !== shopId)?._id;
        if (!receiverId) {
          toast.error('Can not find receiver.', {
            position: 'top-right',
            autoClose: 3000,
          });
          return;
        }
      }

      const finalConversationId = selectedChat._id === 'shop' ? conversationId : selectedChat._id;
      const callData = {
        to: receiverId,
        from: userId || user?._id, // Đảm bảo có from ID
        fromName: user?.fullName || user?.username || (role === 'customer' ? 'Customer' : 'Shop'),
        offer: offer,
        conversationId: finalConversationId,
      };

      // Validation trước khi gửi
      if (!callData.from || !callData.to) {
        console.error('❌ Invalid call data:', callData);
        toast.error('Information error.', {
          position: 'top-right',
          autoClose: 3000,
        });
        return;
      }

      // Debug để kiểm tra data trước khi gửi
      console.log('🔍 Call data validation:', {
        to: receiverId,
        from: userId || user?._id,
        hasOffer: !!offer,
        conversationId: finalConversationId,
      });

      console.log('📞 Sending video call request:', callData);
      console.log('🔌 Socket connected?', socketRef.current.connected);
      console.log('🆔 Socket ID:', socketRef.current.id);

      // Join conversation room if not already joined
      if (finalConversationId && finalConversationId !== 'temp-shop-conversation') {
        console.log('🏠 Joining conversation for video call:', finalConversationId);
        socketRef.current.emit('join_conversation', finalConversationId);
      }

      socketRef.current.emit('video_call_request', callData);
      console.log('✅ Video call request emitted');

      setIsVideoCallModalOpen(true);

      // Show success notification
      toast.success('Connecting video call. Please wait for the other party to accept.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error starting video call:', error);
      toast.error('Can not access camera/microphone. Please check your access permissions.', {
        position: 'top-right',
        autoClose: 4000,
      });
    }
  };

  const acceptVideoCall = async () => {
    if (!incomingCallData) return;

    // Stop ringtone and close notification
    stopRingtone();
    if (notificationRef.current) {
      toast.dismiss();
      notificationRef.current = null;
    }

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalVideoStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize peer connection
      const pc = initializePeerConnection();
      peerConnectionRef.current = pc;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Accept the call
      socketRef.current.emit('video_call_accept', {
        from: userId || user?._id,
        to: incomingCallData.from,
        conversationId: incomingCallData.conversationId,
      });

      setIsIncomingCall(false);
      setIsVideoCallActive(true);
      setIsVideoCallModalOpen(true);
      setIncomingCallData(null);
    } catch (error) {
      console.error('Error accepting video call:', error);
      toast.error('Can not access camera/microphone. Please check your access permissions.', {
        position: 'top-right',
        autoClose: 4000,
      });
    }
  };

  // Auto start media when modal opens from global accept
  useEffect(() => {
    if (isVideoCallModalOpen && isVideoCallActive && incomingCallData && !localVideoStream) {
      console.log('🎬 Auto-starting media for global accepted call');

      // Get user media without calling acceptVideoCall again
      navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .then(stream => {
          setLocalVideoStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          // Initialize peer connection
          const pc = initializePeerConnection();
          peerConnectionRef.current = pc;

          // Add local stream to peer connection
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });

          console.log('✅ Auto-started media for global accepted call');
        })
        .catch(error => {
          console.error('Error accessing media for global accept:', error);
          toast.error('Can not access camera/microphone. Please check your access permissions.', {
            position: 'top-right',
            autoClose: 4000,
          });
        });
    }
  }, [isVideoCallModalOpen, isVideoCallActive, incomingCallData, localVideoStream]);

  const rejectVideoCall = () => {
    if (!incomingCallData) return;

    // Stop ringtone and close notification
    stopRingtone();
    if (notificationRef.current) {
      toast.dismiss();
      notificationRef.current = null;
    }

    socketRef.current.emit('video_call_reject', {
      from: userId || user?._id,
      to: incomingCallData.from,
      conversationId: incomingCallData.conversationId,
    });

    setIsIncomingCall(false);
    setIncomingCallData(null);
  };

  const endVideoCall = () => {
    // Stop ringtone and close notification
    stopRingtone();
    if (notificationRef.current) {
      toast.dismiss();
      notificationRef.current = null;
    }

    // Clean up local stream
    if (localVideoStream) {
      localVideoStream.getTracks().forEach(track => track.stop());
      setLocalVideoStream(null);
    }

    // Clean up remote stream
    setRemoteVideoStream(null);

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Emit end call event
    if (isVideoCallActive) {
      const receiverId = role === 'customer' ? shopUserId : selectedChat?.userId;
      socketRef.current.emit('video_call_end', {
        from: userId || user?._id,
        to: receiverId,
        conversationId: selectedChat?._id,
      });
    }

    // Reset states
    setIsVideoCallModalOpen(false);
    setIsVideoCallActive(false);
    setIsIncomingCall(false);
    setIncomingCallData(null);
    setConnectionStatus('disconnected');
    setIceConnectionState('new');

    // Show end call notification
    if (isVideoCallActive) {
      toast.info('Video call ended.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  // Function để truncate text
  const truncateText = (text, maxLength = 30) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Filter và sort chat list
  const filteredChatList = chatList
    .filter(chat => (chat.name || '').toLowerCase().includes(searchText.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className={`chat-page ${isWidget ? 'widget-mode' : ''}`}>
      {!isWidget && (
        <div className="chat-header">
          <TabHeader breadcrumb="Chat" />
        </div>
      )}
      <div className="chat-layout">
        {/* Chat List Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-search">
            <Input
              placeholder="Search chats..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>
          <List
            className="chat-list"
            itemLayout="horizontal"
            dataSource={filteredChatList}
            renderItem={chat => {
              const isCurrentUser = chat.sender === userId || chat.sender?._id === userId;
              const chatName = chat.isAI
                ? 'AI Product Consulting'
                : chat.isShop
                  ? 'Shop Support'
                  : role === 'customer'
                    ? 'Shop Support'
                    : chat.name || 'Customer';

              return (
                <List.Item
                  className={`chat-list-item ${selectedChat?._id === chat._id ? 'selected' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge count={0} offset={[-5, 5]}>
                        <Avatar
                          src={
                            chat.isAI
                              ? 'https://res.cloudinary.com/dumuhtrwr/image/upload/v1752928150/kicks-shoes/avatars/file_pdkyiy.png'
                              : chat.isShop
                                ? 'https://res.cloudinary.com/dumuhtrwr/image/upload/v1752928150/kicks-shoes/avatars/file_pdkyiy.png'
                                : chat.participants?.find(p => p._id !== shopId)?.avatar ||
                                  user?.avatar
                          }
                          icon={
                            chat.isAI ? (
                              <UserOutlined />
                            ) : chat.isShop ? (
                              <ShopOutlined />
                            ) : (
                              <UserOutlined />
                            )
                          }
                          className="chat-avatar"
                          onError={e => {
                            // Fallback to icon if image fails to load
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      </Badge>
                    }
                    title={
                      <div className="chat-list-item-header">
                        <Text strong>{chatName}</Text>
                        <Text className="chat-time">
                          {chat.lastUpdated ? new Date(chat.lastUpdated).toLocaleTimeString() : ''}
                        </Text>
                      </div>
                    }
                    description={
                      <div className="chat-list-item-content">
                        <Text className="chat-last-message" title={chat.lastMessage}>
                          {truncateText(chat.lastMessage, 35)}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </div>
        {/* Chat Content */}
        <div className="chat-main">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="chat-content-header">
                <div className="chat-title">
                  <Text strong>
                    {selectedChat.isAI ? 'AI Product Consulting' : selectedChat.name}
                  </Text>
                </div>
                <div className="chat-actions">
                  {/* Video Call Button - Only show for non-AI chats */}
                  {!selectedChat.isAI && (
                    <Tooltip title="Start video call">
                      <Button
                        type="text"
                        icon={<VideoCameraOutlined />}
                        size="small"
                        className="video-call-btn"
                        onClick={startVideoCall}
                        disabled={isVideoCallActive}
                      />
                    </Tooltip>
                  )}
                  {selectedChat.isAI && messages.length > 0 && (
                    <Tooltip title="Clear chat history">
                      <Popconfirm
                        title="Clear chat history"
                        description="Are you sure you want to clear the chat history?"
                        onConfirm={handleClearChat}
                        okText="Delete"
                        cancelText="Cancel"
                      >
                        <Button
                          type="text"
                          icon={<ClearOutlined />}
                          size="small"
                          className="clear-chat-btn"
                        />
                      </Popconfirm>
                    </Tooltip>
                  )}
                </div>
              </div>
              <div className="chat-messages" ref={messagesEndRef}>
                {isLoading && messages.length === 0 && (
                  <div className="loading-messages">
                    <Text>Loading messages...</Text>
                  </div>
                )}
                {/* AI Chat Suggestions */}
                {selectedChat.isAI && messages.length === 0 && !isLoading && (
                  <div className="ai-suggestions">
                    <div className="suggestions-header">
                      <Text strong>Gợi ý câu hỏi:</Text>
                    </div>
                    <div className="suggestions-list">
                      {[
                        'Tư vấn chọn giày sneaker phù hợp với phong cách casual',
                        'So sánh giày Nike và Adidas về chất lượng',
                        'Cách chọn size giày chính xác',
                        'Giày nào phù hợp cho chạy bộ?',
                        'Tư vấn giày công sở nam/nữ',
                        'Cách bảo quản giày da tốt nhất',
                      ].map((suggestion, index) => (
                        <div
                          key={index}
                          className="suggestion-item"
                          onClick={() => {
                            setNewMessage(suggestion);
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                        >
                          <Text>{suggestion}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {console.log('Messages to render:', messages)}
                {/* Quick suggestions for admin */}
                {selectedChat?.isAI &&
                  (role === 'shop' || role === 'admin') &&
                  messages.length <= 1 && (
                    <div className="quick-suggestions">
                      <div className="suggestions-header">
                        <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
                          💡 Quick Questions:
                        </Text>
                      </div>
                      <div className="suggestions-grid">
                        {[
                          'Báo cáo doanh thu hôm nay',
                          'Tình trạng tồn kho',
                          'Thống kê khách hàng',
                          'Sản phẩm nào sắp hết hàng?',
                        ].map((suggestion, index) => (
                          <div
                            key={index}
                            className="suggestion-card"
                            onClick={() => {
                              setNewMessage(suggestion);
                              // Trigger send message after a short delay
                              setTimeout(() => {
                                handleSendMessage();
                              }, 100);
                            }}
                          >
                            <span>{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                {/* Product suggestions for customers */}
                {selectedChat?.isAI && role === 'customer' && messages.length <= 1 && (
                  <div className="product-suggestions">
                    <div className="suggestions-header">
                      <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
                        🛍️ Gợi ý câu hỏi:
                      </Text>
                    </div>
                    <div className="suggestions-grid">
                      {[
                        'Tư vấn chọn giày sneaker phù hợp với phong cách casual',
                        'So sánh giày Nike và Adidas về chất lượng',
                        'Cách chọn size giày chính xác',
                        'Giày nào phù hợp cho chạy bộ?',
                        'Tư vấn giày công sở nam/nữ',
                        'Cách bảo quản giày da tốt nhất',
                      ].map((suggestion, index) => (
                        <div
                          key={index}
                          className="suggestion-card"
                          onClick={() => {
                            setNewMessage(suggestion);
                            // Trigger send message after a short delay
                            setTimeout(() => {
                              handleSendMessage();
                            }, 100);
                          }}
                        >
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((message, index) => {
                  console.log('Rendering message:', message);
                  // Debug log để kiểm tra
                  console.log('Message:', message);
                  console.log('Current userId:', userId);
                  console.log('Message sender:', message.sender);
                  console.log('Message sender._id:', message.sender?._id);

                  // Đơn giản hóa logic xác định user
                  const isAI = message.isAI === true || message.sender === 'ai';
                  const isFromShop =
                    message.sender === shopUserId || message.sender?._id === shopUserId;

                  // Xác định xem có phải tin nhắn của user hiện tại không
                  let finalIsCurrentUser = false;

                  if (isAI) {
                    finalIsCurrentUser = false; // AI messages luôn ở bên trái
                  } else if (isFromShop) {
                    finalIsCurrentUser = role === 'shop'; // Shop messages ở bên phải nếu user là shop
                  } else {
                    // Tin nhắn từ customer
                    finalIsCurrentUser = role === 'customer'; // Customer messages ở bên phải nếu user là customer
                  }

                  // Lấy thông tin user từ message hoặc participants
                  const getSenderName = () => {
                    if (isAI) return 'AI Product Consulting';
                    if (isFromShop) return 'Shop Support';
                    if (finalIsCurrentUser) {
                      return role === 'shop' ? 'Shop' : 'You';
                    }

                    // Tìm user trong participants của conversation
                    if (selectedChat?.participants) {
                      const senderUser = selectedChat.participants.find(
                        p => p._id === message.sender || p._id === message.sender?._id
                      );
                      if (senderUser) {
                        const name = senderUser.fullName || senderUser.username || 'Customer';
                        return name;
                      }
                    }

                    // Nếu không tìm thấy trong participants, thử lấy từ message.sender nếu có thông tin
                    if (message.sender && typeof message.sender === 'object') {
                      const name = message.sender.fullName || message.sender.username || 'Customer';
                      return name;
                    }

                    // Fallback
                    const fallbackName = role === 'shop' ? 'Customer' : 'Shop Support';
                    return fallbackName;
                  };

                  const senderName = getSenderName();

                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: finalIsCurrentUser ? 'flex-end' : 'flex-start',
                        marginBottom: 12,
                        padding: '0 16px',
                        alignItems: 'flex-end',
                      }}
                    >
                      {/* Avatar for non-current user messages */}
                      {!finalIsCurrentUser && (
                        <Avatar
                          src={
                            isAI
                              ? 'https://res.cloudinary.com/dumuhtrwr/image/upload/v1752928150/kicks-shoes/avatars/file_pdkyiy.png'
                              : isFromShop
                                ? 'https://res.cloudinary.com/dumuhtrwr/image/upload/v1752928150/kicks-shoes/avatars/file_pdkyiy.png'
                                : selectedChat?.participants?.find(
                                    p => p._id === message.sender || p._id === message.sender?._id
                                  )?.avatar || user?.avatar
                          }
                          size={32}
                          style={{ marginRight: 8, marginBottom: 4 }}
                          onError={e => {
                            if (e && e.target) {
                              e.target.style.display = 'none';
                            }
                          }}
                        />
                      )}

                      <div
                        className={`message-bubble ${
                          finalIsCurrentUser ? 'current-user' : isAI ? 'ai' : 'other'
                        }`}
                      >
                        <div className="message-sender">{senderName}</div>
                        <div className="message-content">
                          {message.content ? (
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          ) : (
                            <div>No content available</div>
                          )}
                          {/* Product Suggestions */}
                          {message.productSuggestions && message.productSuggestions.length > 0 && (
                            <div className="product-suggestions">
                              <div className="suggestions-header">
                                <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
                                  Recommend Products:
                                </Text>
                              </div>
                              <div className="suggestions-grid">
                                {message.productSuggestions.map((product, productIndex) => (
                                  <div
                                    key={productIndex}
                                    className="product-suggestion-card"
                                    onClick={() => handleProductClick(product.id)}
                                  >
                                    <div className="product-image">
                                      <img
                                        src={
                                          product.image ||
                                          'https://via.placeholder.com/180x120?text=No+Image'
                                        }
                                        alt={product.name}
                                        onError={e => {
                                          e.target.src =
                                            'https://via.placeholder.com/180x120?text=No+Image';
                                        }}
                                      />
                                    </div>
                                    <div className="product-info">
                                      <div className="product-name" title={product.name}>
                                        {product.name}
                                      </div>
                                      <div className="product-price">
                                        <span className="current-price">
                                          {product.price.toLocaleString('vi-VN')}đ
                                        </span>
                                        {product.discount > 0 && (
                                          <span className="original-price">
                                            {product.originalPrice.toLocaleString('vi-VN')}đ
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Analytics Data for Admin */}
                          {message.analyticsData && role === 'shop' && (
                            <div className="analytics-data">
                              <div className="analytics-header">
                                <Text strong style={{ fontSize: '14px', color: '#52c41a' }}>
                                  Analytics Report:
                                </Text>
                              </div>
                              <div className="analytics-content">
                                {message.analyticsData.totalRevenue !== undefined && (
                                  <div className="analytics-section">
                                    <h4>Revenue</h4>
                                    <p>
                                      Total Revenue:{' '}
                                      <strong>
                                        {(message.analyticsData.totalRevenue || 0).toLocaleString(
                                          'vi-VN'
                                        )}
                                        đ
                                      </strong>
                                    </p>
                                    <p>
                                      Total Orders:{' '}
                                      <strong>{message.analyticsData.totalOrders || 0}</strong>
                                    </p>
                                    <p>
                                      Average Order Value:{' '}
                                      <strong>
                                        {(
                                          message.analyticsData.averageOrderValue || 0
                                        ).toLocaleString('vi-VN')}
                                        đ
                                      </strong>
                                    </p>
                                  </div>
                                )}
                                {message.analyticsData.totalProducts !== undefined && (
                                  <div className="analytics-section">
                                    <h4>Inventory</h4>
                                    <p>
                                      Total Products:{' '}
                                      <strong>{message.analyticsData.totalProducts || 0}</strong>
                                    </p>
                                    <p>
                                      Total Stock:{' '}
                                      <strong>{message.analyticsData.totalStock || 0}</strong>
                                    </p>
                                    <p>
                                      Total Stock Value:{' '}
                                      <strong>
                                        {(message.analyticsData.totalValue || 0).toLocaleString(
                                          'vi-VN'
                                        )}
                                        đ
                                      </strong>
                                    </p>
                                    <p>
                                      Low Stock Products:{' '}
                                      <strong style={{ color: '#ff4d4f' }}>
                                        {(message.analyticsData.lowStockProducts || []).length}
                                      </strong>
                                    </p>
                                    <p>
                                      Out of Stock Products:{' '}
                                      <strong style={{ color: '#ff4d4f' }}>
                                        {(message.analyticsData.outOfStockProducts || []).length}
                                      </strong>
                                    </p>
                                  </div>
                                )}
                                {message.analyticsData.totalCustomers !== undefined && (
                                  <div className="analytics-section">
                                    <h4>Customers</h4>
                                    <p>
                                      Total Customers:{' '}
                                      <strong>{message.analyticsData.totalCustomers || 0}</strong>
                                    </p>
                                    <p>
                                      Total Orders:{' '}
                                      <strong>{message.analyticsData.totalOrders || 0}</strong>
                                    </p>
                                    <p>
                                      Average Orders Per Customer:{' '}
                                      <strong>
                                        {(
                                          message.analyticsData.averageOrdersPerCustomer || 0
                                        ).toFixed(1)}
                                      </strong>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="message-time">
                          {message.timestamp
                            ? new Date(message.timestamp).toLocaleTimeString()
                            : ''}
                        </div>
                      </div>

                      {/* Avatar for current user messages */}
                      {finalIsCurrentUser && (
                        <Avatar
                          src={user?.avatar}
                          size={32}
                          style={{ marginLeft: 8, marginBottom: 4 }}
                          onError={e => {
                            if (e && e.target) {
                              e.target.style.display = 'none';
                            }
                          }}
                        />
                      )}
                    </div>
                  );
                })}
                {/* Loading indicator */}
                {isLoadingAI && !streamingMessage && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        maxWidth: '80%',
                      }}
                    >
                      <Avatar
                        size={32}
                        style={{
                          backgroundColor: '#1890ff',
                          marginBottom: 4,
                        }}
                      >
                        AI
                      </Avatar>
                      <div className="message-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Đang phân tích dữ liệu...</span>
                          <div className="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Streaming message display */}
                {streamingMessage && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      marginBottom: 12,
                      padding: '0 16px',
                      alignItems: 'flex-end',
                    }}
                  >
                    <Avatar
                      src="https://res.cloudinary.com/dumuhtrwr/image/upload/v1752928150/kicks-shoes/avatars/file_pdkyiy.png"
                      size={32}
                      style={{ marginRight: 8, marginBottom: 4 }}
                      onError={e => {
                        if (e && e.target) {
                          e.target.style.display = 'none';
                        }
                      }}
                    />
                    <div className="message-bubble ai">
                      <div className="message-sender">
                        {selectedChat?.isAI ? 'AI Product Consulting' : 'Shop Support'}
                      </div>
                      <div className="message-content">
                        <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                        <span className="streaming-indicator">▋</span>
                      </div>
                      <div className="message-time">{new Date().toLocaleTimeString()}</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="chat-input">
                {console.log('Rendering chat input, selectedChat:', selectedChat)}
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  suffix={
                    <Button
                      type="text"
                      icon={<SendOutlined />}
                      onClick={handleSendMessage}
                      loading={isLoading}
                      disabled={isLoading}
                    />
                  }
                  style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    height: '50px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                  }}
                />
              </div>
            </>
          ) : (
            <div className="chat-placeholder">
              <Text>Select a chat to start messaging</Text>
              {/* Fallback input for widget mode */}
              {isWidget && (
                <div className="chat-input" style={{ marginTop: '20px' }}>
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    suffix={
                      <Button
                        type="text"
                        icon={<SendOutlined />}
                        onClick={handleSendMessage}
                        loading={isLoading}
                        disabled={isLoading}
                      />
                    }
                    style={{
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      height: '50px',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Video Call Modal */}
      <Modal
        title="Video Call"
        open={isVideoCallModalOpen}
        onCancel={endVideoCall}
        footer={[
          <Button key="end" danger onClick={endVideoCall}>
            End Call
          </Button>,
        ]}
        width={800}
        style={{ top: 20 }}
      >
        <div style={{ display: 'flex', gap: '16px', minHeight: '400px' }}>
          {/* Remote video (larger) */}
          <div
            style={{ flex: 1, position: 'relative', backgroundColor: '#000', borderRadius: '8px' }}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '400px',
                objectFit: 'cover',
                borderRadius: '8px',
              }}
            />
            {!remoteVideoStream && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  textAlign: 'center',
                }}
              >
                <VideoCameraOutlined style={{ fontSize: '48px', marginBottom: '8px' }} />
                <div>Đang chờ kết nối...</div>
                <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                  Connection: {connectionStatus} | ICE: {iceConnectionState}
                </div>
              </div>
            )}
          </div>

          {/* Local video (smaller, overlay) */}
          <div style={{ width: '200px', position: 'relative' }}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '150px',
                objectFit: 'cover',
                borderRadius: '8px',
                backgroundColor: '#000',
              }}
            />
            <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
              You
            </div>
          </div>
        </div>
      </Modal>

      {/* Incoming Call Modal */}
      <Modal
        title="Incoming Video Call"
        open={isIncomingCall}
        onCancel={rejectVideoCall}
        footer={[
          <Button key="reject" onClick={rejectVideoCall}>
            <PhoneOutlined /> Reject
          </Button>,
          <Button key="accept" type="primary" onClick={acceptVideoCall}>
            <VideoCameraOutlined /> Accept
          </Button>,
        ]}
        closable={false}
        maskClosable={false}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Avatar size={64} icon={<UserOutlined />} style={{ marginBottom: '16px' }} />
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>
            {incomingCallData?.fromName || (role === 'customer' ? 'Shop Support' : 'Customer')}
          </div>
          <div style={{ color: '#666' }}>is calling you...</div>
        </div>
      </Modal>
    </div>
  );
};

export default ChatPage;
