import React, { useState, useEffect, useContext, useRef } from 'react';
import { Input, Button, List, Avatar, Typography, Badge } from 'antd';
import { SendOutlined, UserOutlined, SearchOutlined, ShopOutlined } from '@ant-design/icons';
import TabHeader from './TabHeader';
import { ActiveTabContext } from './ActiveTabContext';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../../../contexts/AuthContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './ChatPage.css';

const { Text } = Typography;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

const ChatPage = props => {
  const { user } = useAuth();
  // Ưu tiên prop, fallback sang context
  const role = props.role || (user?.role === 'shop' ? 'shop' : 'customer');
  const userId = props.userId || (user?.role === 'customer' ? user?._id : undefined);
  const shopId = props.shopId || (user?.role === 'shop' ? user?._id : user?.shopId);

  const [chatList, setChatList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setActiveTab } = useContext(ActiveTabContext);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const socketRef = useRef(null);
  const [shopIdState, setShopIdState] = useState(shopId);
  const conversationCreatedRef = useRef(false);

  // Định nghĩa AI chat object
  const aiChat = {
    _id: 'ai',
    name: 'AI Assistant',
    lastMessage: 'How can I help you today?',
    lastUpdated: new Date(),
    pinned: true,
    isAI: true,
  };

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  useEffect(() => {
    if (isDashboard) {
      setActiveTab('7');
    } else {
      setActiveTab('4');
    }
  }, [setActiveTab]);

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
      // Customer: AI + Shop chat
      const shopChat = {
        _id: 'shop',
        name: 'Shop Support',
        lastMessage: 'Welcome! How can we help you?',
        lastUpdated: new Date(),
        pinned: false,
        isAI: false,
        isShop: true,
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
          // Thêm AI chat cho shop nếu muốn
          setChatList([aiChat, ...data]);
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

  // Khi chọn chat, reset messages
  useEffect(() => {
    if (!selectedChat) return;

    if (selectedChat.isAI) {
      setMessages([]); // Reset messages cho AI
      return;
    }

    if (selectedChat.isShop && !selectedChat._id) {
      setMessages([]); // Reset messages cho shop chat chưa có conversation
      return;
    }
  }, [selectedChat?.isAI, selectedChat?.isShop, selectedChat?._id]);

  // Xử lý tạo conversation khi chọn shop chat
  useEffect(() => {
    if (
      selectedChat?.isShop &&
      role === 'customer' &&
      !selectedChat._id &&
      !conversationCreatedRef.current &&
      shopIdState
    ) {
      const createConversation = async () => {
        try {
          conversationCreatedRef.current = true;
          const res = await fetch('/api/chat/conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, shopId: shopIdState }),
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
  }, [selectedChat?.isShop, selectedChat?._id, role, userId, shopIdState]);

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
        } catch (error) {
          console.error('Error loading messages:', error);
          setMessages([]);
        } finally {
          setIsLoading(false);
        }
      };

      loadMessages();
    }
  }, [selectedChat?._id]);

  // Lắng nghe tin nhắn mới từ socket
  useEffect(() => {
    if (!socketRef.current) return;
    const handleReceive = msg => {
      setMessages(prev => [...prev, msg]);
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
      // Gửi cho AI Gemini
      setMessages(prev => [
        ...prev,
        { content: newMessage, sender: userId, timestamp: new Date(), isAI: false },
      ]);
      setIsLoading(true);
      setNewMessage('');
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent({
          contents: [
            {
              parts: [{ text: newMessage }],
            },
          ],
        });
        const response = await result.response;
        setMessages(prev => [
          ...prev,
          { content: response.text(), sender: 'ai', timestamp: new Date(), isAI: true },
        ]);
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
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Chỉ gửi khi đã có conversationId thật
    if (!selectedChat._id || selectedChat._id === 'shop' || selectedChat._id === 'ai') {
      alert('Waiting for connection to shop...');
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
      receiver = shopIdState;
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

  // Filter và sort chat list
  const filteredChatList = chatList
    .filter(chat => (chat.name || '').toLowerCase().includes(searchText.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="chat-page">
      <div className="chat-header">
        <TabHeader breadcrumb="Chat" />
      </div>
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
                ? 'AI Assistant'
                : chat.isShop
                  ? 'Shop Support'
                  : role === 'customer'
                    ? 'Shop Support'
                    : chat.participants?.find(p => p._id !== shopId)?.name || 'Customer';

              return (
                <List.Item
                  className={`chat-list-item ${selectedChat?._id === chat._id ? 'selected' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge count={0} offset={[-5, 5]}>
                        <Avatar
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
                        <Text className="chat-last-message">{chat.lastMessage}</Text>
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
              <div className="chat-messages" ref={messagesEndRef}>
                {isLoading && messages.length === 0 && (
                  <div className="loading-messages">
                    <Text>Loading messages...</Text>
                  </div>
                )}
                <List
                  itemLayout="horizontal"
                  dataSource={messages}
                  renderItem={message => {
                    const isCurrentUser =
                      message.sender === userId || message.sender?._id === userId;
                    const isAI = message.isAI === true || message.sender === 'ai';

                    return (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                          marginBottom: 12,
                          padding: '0 16px',
                        }}
                      >
                        <div
                          className={`message-bubble ${
                            isCurrentUser ? 'current-user' : isAI ? 'ai' : 'other'
                          }`}
                        >
                          <div className="message-sender">
                            {isAI
                              ? 'AI Assistant'
                              : isCurrentUser
                                ? role === 'shop'
                                  ? 'Shop'
                                  : 'You'
                                : role === 'shop'
                                  ? 'Customer'
                                  : 'Shop Support'}
                          </div>
                          <div className="message-content">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                          <div className="message-time">
                            {message.timestamp
                              ? new Date(message.timestamp).toLocaleTimeString()
                              : ''}
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
              <div className="chat-input">
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
                />
              </div>
            </>
          ) : (
            <div className="chat-placeholder">
              <Text>Select a chat to start messaging</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
