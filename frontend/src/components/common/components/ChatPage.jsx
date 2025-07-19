import React, { useState, useEffect, useContext, useRef } from 'react';
import { Input, Button, List, Avatar, Typography, Badge, Popconfirm, Tooltip } from 'antd';
import {
  SendOutlined,
  UserOutlined,
  SearchOutlined,
  ShopOutlined,
  DeleteOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import TabHeader from './TabHeader';
import { ActiveTabContext } from './ActiveTabContext';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../../../contexts/AuthContext';
import aiChatService from '../../../services/aiChatService';
import './ChatPage.css';

const { Text } = Typography;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

const ChatPage = props => {
  const { user } = useAuth();
  // Ưu tiên prop, fallback sang context
  const role = props.role || (user?.role === 'shop' ? 'shop' : 'customer');
  const userId = props.userId || (user?.role === 'customer' ? user?._id : undefined);
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
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // Lấy shopId cho customer
  useEffect(() => {
    if (role === 'customer' && !shopIdState) {
      fetch('/api/users/shop')
        .then(res => res.json())
        .then(data => {
          if (data && data._id) {
            setShopIdState(data._id);
          }
        })
        .catch(err => {
          console.error('Error fetching shop:', err);
        });
    }
  }, [role, shopIdState]);

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
        shopUserId: '6845be4f54a7582c1d2109b8', // ID cụ thể của shop user
      };
      setChatList([aiChat, shopChat]);
      setSelectedChat(aiChat); // Mặc định chọn AI
    } else {
      // Shop: lấy danh sách chat thật từ API
      const fetchChats = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/chat/conversations?userId=${shopId}`);
          const data = await res.json();

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
      setMessages(savedMessages);
      console.log('Loaded AI messages for user:', userId, savedMessages);
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
          const res = await fetch('/api/chat/conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              shopId: selectedChat.shopUserId || '6845be4f54a7582c1d2109b8',
            }),
          });
          const conversation = await res.json();

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
          const res = await fetch(`/api/chat/messages/${selectedChat._id}`);
          const data = await res.json();
          setMessages(data);
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
          const res = await fetch(`/api/chat/conversation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              shopId: '6845be4f54a7582c1d2109b8',
            }),
          });
          const conversation = await res.json();
          console.log('Shop conversation:', conversation);

          if (conversation._id) {
            const messagesRes = await fetch(`/api/chat/messages/${conversation._id}`);
            const messagesData = await messagesRes.json();
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
          if (chat.isShop && msg.sender === '6845be4f54a7582c1d2109b8') {
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
    socketRef.current.on('receive_message', handleReceive);
    return () => {
      socketRef.current.off('receive_message', handleReceive);
    };
  }, []);

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

      try {
        await aiChatService.sendMessage(
          newMessage,
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
            };
            const finalMessages = [...updatedMessages, aiMessage];
            setMessages(finalMessages);
            aiChatService.saveMessages(finalMessages); // Lưu vào localStorage

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
          const res = await fetch('/api/chat/conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              shopId: '6845be4f54a7582c1d2109b8',
            }),
          });
          const conversation = await res.json();

          if (conversation._id) {
            // Gửi tin nhắn sau khi tạo conversation
            const msg = {
              conversationId: conversation._id,
              sender: userId,
              receiver: '6845be4f54a7582c1d2109b8',
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
      receiver = selectedChat.shopUserId || '6845be4f54a7582c1d2109b8';
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
    aiChatService.clearMessages();
    aiChatService.resetConversation();
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
                              ? '/src/assets/images/logoavt.png'
                              : chat.isShop
                                ? '/src/assets/images/logoavt.png'
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
                <List
                  itemLayout="horizontal"
                  dataSource={messages}
                  renderItem={message => {
                    // Debug log để kiểm tra
                    console.log('Message:', message);
                    console.log('Current userId:', userId);
                    console.log('Message sender:', message.sender);
                    console.log('Message sender._id:', message.sender?._id);

                    const isCurrentUser =
                      message.sender === userId ||
                      message.sender?._id === userId ||
                      (typeof message.sender === 'string' && message.sender === userId) ||
                      (typeof message.sender === 'object' && message.sender._id === userId) ||
                      (typeof userId === 'string' && message.sender === userId) ||
                      (typeof userId === 'string' && message.sender?._id === userId);
                    const isAI = message.isAI === true || message.sender === 'ai';
                    const isFromShop =
                      message.sender === '6845be4f54a7582c1d2109b8' ||
                      message.sender?._id === '6845be4f54a7582c1d2109b8';

                    console.log('isCurrentUser:', isCurrentUser);
                    console.log('isFromShop:', isFromShop);

                    // Fallback: nếu không xác định được user hiện tại, dựa vào role
                    let finalIsCurrentUser = isCurrentUser;
                    if (!finalIsCurrentUser && role === 'customer') {
                      // Nếu là customer và tin nhắn không phải từ shop, thì là tin nhắn của customer
                      finalIsCurrentUser = !isFromShop && !isAI;
                    } else if (!finalIsCurrentUser && role === 'shop') {
                      // Nếu là shop và tin nhắn từ shop user, thì là tin nhắn của shop
                      finalIsCurrentUser = isFromShop;
                    }

                    console.log('finalIsCurrentUser:', finalIsCurrentUser);

                    // Lấy thông tin user từ message hoặc participants
                    const getSenderName = () => {
                      if (isAI) return 'AI Product Consulting';
                      if (isFromShop) return 'Shop Support';
                      if (isCurrentUser) {
                        return role === 'shop' ? 'Shop' : 'You';
                      }

                      // Debug log
                      console.log('Message sender:', message.sender);
                      console.log('Selected chat participants:', selectedChat?.participants);
                      console.log('Role:', role);

                      // Tìm user trong participants của conversation
                      if (selectedChat?.participants) {
                        const senderUser = selectedChat.participants.find(
                          p => p._id === message.sender || p._id === message.sender?._id
                        );
                        console.log('Found sender user:', senderUser);
                        if (senderUser) {
                          const name = senderUser.fullName || senderUser.username || 'Customer';
                          console.log('Using name:', name);
                          return name;
                        }
                      }

                      // Nếu không tìm thấy trong participants, thử lấy từ message.sender nếu có thông tin
                      if (message.sender && typeof message.sender === 'object') {
                        const name =
                          message.sender.fullName || message.sender.username || 'Customer';
                        console.log('Using name from message.sender:', name);
                        return name;
                      }

                      // Fallback
                      const fallbackName = role === 'shop' ? 'Customer' : 'Shop Support';
                      console.log('Using fallback name:', fallbackName);
                      return fallbackName;
                    };

                    const senderName = getSenderName();

                    return (
                      <div
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
                                ? '/src/assets/images/logoavt.png'
                                : isFromShop
                                  ? '/src/assets/images/logoavt.png'
                                  : selectedChat?.participants?.find(
                                      p => p._id === message.sender || p._id === message.sender?._id
                                    )?.avatar || user?.avatar
                            }
                            size={32}
                            style={{ marginRight: 8, marginBottom: 4 }}
                            onError={e => {
                              e.target.style.display = 'none';
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
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                          <div className="message-time">
                            {message.timestamp
                              ? new Date(message.timestamp).toLocaleTimeString()
                              : ''}
                          </div>
                        </div>

                        {/* Avatar for current user messages */}
                        {isCurrentUser && (
                          <Avatar
                            src={user?.avatar}
                            size={32}
                            style={{ marginLeft: 8, marginBottom: 4 }}
                            onError={e => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    );
                  }}
                />
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
                      src="/src/assets/images/logoavt.png"
                      size={32}
                      style={{ marginRight: 8, marginBottom: 4 }}
                      onError={e => {
                        e.target.style.display = 'none';
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
                    height: '40px',
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
    </div>
  );
};

export default ChatPage;
