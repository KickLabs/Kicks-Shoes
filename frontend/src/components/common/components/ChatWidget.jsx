import React, { useState, useEffect, useRef } from 'react';
import { Button, Badge, Drawer, List, Avatar, Input, Spin } from 'antd';
import { MessageOutlined, CloseOutlined, SendOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import ChatPage from './ChatPage';
import io from 'socket.io-client';
import './ChatWidget.css';

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const socketRef = useRef(null);

  // Kết nối socket khi component mount
  useEffect(() => {
    if (user) {
      socketRef.current = io(
        import.meta.env.VITE_SOCKET_URL ||
          (window.location.hostname === 'localhost'
            ? 'http://localhost:3000'
            : 'https://kicks-shoes-backend-2025-509fffbae16a.herokuapp.com')
      );

      // Lắng nghe tin nhắn mới để cập nhật unread count
      socketRef.current.on('receive_message', message => {
        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
        }
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user, isOpen]);

  // Chỉ hiển thị widget khi user đã login
  if (!user) {
    return null;
  }

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Reset unread count khi mở chat
      setUnreadCount(0);
    }
    if (isOpen) {
      setIsMinimized(false);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const expandChat = () => {
    setIsMinimized(false);
  };

  return (
    <div className="chat-widget-container">
      {/* Chat Button - Floating */}
      {!isOpen && (
        <div className="chat-widget-button" onClick={toggleChat}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<MessageOutlined />}
            className="chat-widget-toggle"
          />
          {unreadCount > 0 && <Badge count={unreadCount} className="chat-widget-badge" />}
        </div>
      )}

      {/* Chat Drawer */}
      {isOpen && (
        <div className={`chat-widget-drawer ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="chat-widget-header">
            <div className="chat-widget-title">
              <MessageOutlined />
              <span>Chat Support</span>
            </div>
            <div className="chat-widget-actions">
              {!isMinimized && (
                <Button
                  type="text"
                  size="small"
                  onClick={minimizeChat}
                  className="chat-widget-minimize"
                >
                  −
                </Button>
              )}
              {isMinimized && (
                <Button
                  type="text"
                  size="small"
                  onClick={expandChat}
                  className="chat-widget-expand"
                >
                  +
                </Button>
              )}
              <Button
                type="text"
                size="small"
                onClick={toggleChat}
                className="chat-widget-close"
                icon={<CloseOutlined />}
              />
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <div className="chat-widget-content">
              <ChatPage
                role={user?.role}
                userId={user?.role === 'customer' ? user?._id : undefined}
                shopId={user?.role === 'shop' ? user?._id : user?.shopId}
                isWidget={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
