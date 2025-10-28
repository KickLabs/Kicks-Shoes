/**
 * @fileoverview Bot Message Component
 * @file BotMessage.jsx
 * @description Component for displaying AI bot replies in livestream chat
 */

import React from 'react';
import { Avatar, Tag } from 'antd';
import { RobotOutlined, UserOutlined } from '@ant-design/icons';
import './BotMessage.css';

/**
 * Format bot answer text with basic markdown-like syntax
 */
const formatBotAnswer = text => {
  if (!text) return '';

  // Convert **bold** to <strong>
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Convert *italic* to <em>
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Convert line breaks to <br>
  text = text.replace(/\n/g, '<br/>');

  // Convert bullet points (• or - at start of line)
  text = text.replace(/^[•\-]\s+(.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  text = text.replace(/(<li>.*?<\/li>)(<br\/>)?/g, (match, li) => {
    return li;
  });
  text = text.replace(/(<li>.*?<\/li>\s*)+/g, match => {
    return `<ul>${match}</ul>`;
  });

  return text;
};

const BotMessage = ({ originalMessage, answer, timestamp }) => {
  const formattedAnswer = formatBotAnswer(answer);

  return (
    <div className="bot-message-container">
      {/* Reference to original question */}
      {originalMessage && (
        <div className="replied-message">
          <Avatar src={originalMessage.senderId?.avatar} icon={<UserOutlined />} size="small" />
          <span className="replied-username">
            {originalMessage.senderId?.username || 'Anonymous'}
          </span>
          <span className="replied-content">{originalMessage.content}</span>
        </div>
      )}

      {/* Bot answer */}
      <div className="bot-message">
        <div className="bot-header">
          <div className="bot-avatar">
            <RobotOutlined />
          </div>
          <Tag color="purple" className="bot-badge">
            AI Assistant
          </Tag>
          <span className="bot-time">
            {new Date(timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="bot-content" dangerouslySetInnerHTML={{ __html: formattedAnswer }} />
      </div>
    </div>
  );
};

export default BotMessage;
