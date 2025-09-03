/**
 * @fileoverview LiveStream ChatBox Component
 * @created 2025-01-02
 * @file ChatBox.jsx
 * @description Chat component for livestream with real-time messaging
 */

import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Card, Avatar, Typography, Space, Tag } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import './ChatBox.css';

const { Text, Title } = Typography;

const ChatBox = ({ messages = [], onSendMessage, disabled = false, className = '' }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = timestamp => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getRoleColor = role => {
    switch (role) {
      case 'host':
        return '#ff4d4f';
      case 'moderator':
        return '#52c41a';
      case 'admin':
        return '#722ed1';
      case 'system':
        return '#1890ff';
      default:
        return '#8c8c8c';
    }
  };

  const getRoleText = role => {
    switch (role) {
      case 'host':
        return 'Host';
      case 'moderator':
        return 'Mod';
      case 'admin':
        return 'Admin';
      case 'system':
        return 'System';
      default:
        return 'Viewer';
    }
  };

  const renderMessage = message => {
    const isSystemMessage = message.senderRole === 'system' || message.messageType === 'system';

    if (isSystemMessage) {
      return (
        <div key={message._id} className="chat-message system-message">
          <div className="message-content">
            <Text type="secondary" italic>
              {message.content}
            </Text>
          </div>
          <div className="message-time">
            <Text type="secondary" className="time-text">
              {formatTime(message.timestamp)}
            </Text>
          </div>
        </div>
      );
    }

    return (
      <div key={message._id} className="chat-message user-message">
        <div className="message-header">
          <Space size="small">
            <Avatar
              size="small"
              src={message.senderId?.avatar}
              icon={<UserOutlined />}
              className="user-avatar"
            />
            <Text strong className="username">
              {message.senderId?.username || 'Anonymous'}
            </Text>
            <Tag color={getRoleColor(message.senderRole)} size="small">
              {getRoleText(message.senderRole)}
            </Tag>
          </Space>
          <Text type="secondary" className="message-time">
            {formatTime(message.timestamp)}
          </Text>
        </div>
        <div className="message-content">
          <Text>{message.content}</Text>
        </div>
        {message.productRef && (
          <div className="product-ref">
            <Card size="small" className="featured-product">
              <Space>
                {message.productRef.productImage && (
                  <img
                    src={message.productRef.productImage}
                    alt={message.productRef.productName}
                    className="product-image"
                  />
                )}
                <div>
                  <Text strong>{message.productRef.productName}</Text>
                  <br />
                  <Text type="secondary">${message.productRef.productPrice}</Text>
                </div>
              </Space>
            </Card>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`chat-box ${className}`} bodyStyle={{ padding: 0 }}>
      <div className="chat-header">
        <Title level={5} style={{ margin: 0, padding: '12px 16px' }}>
          Live Chat
        </Title>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <Text type="secondary">No messages yet. Start the conversation!</Text>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <Space.Compact style={{ width: '100%' }}>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? 'Chat is disabled' : 'Type your message...'}
            disabled={disabled}
            maxLength={500}
            className="message-input"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={disabled || !inputValue.trim()}
            className="send-button"
          >
            Send
          </Button>
        </Space.Compact>
      </div>
    </Card>
  );
};

export default ChatBox;
