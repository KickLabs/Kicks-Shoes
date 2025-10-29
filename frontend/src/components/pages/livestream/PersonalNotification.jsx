/**
 * @fileoverview Personal Notification Component
 * @file PersonalNotification.jsx
 * @description Toast notification for personal bot replies
 */

import React, { useEffect } from 'react';
import { CloseOutlined, RobotOutlined, MessageOutlined } from '@ant-design/icons';
import './PersonalNotification.css';

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

const PersonalNotification = ({
  question,
  answer,
  onDismiss,
  onViewInChat,
  autoHideDuration = 10000,
}) => {
  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, onDismiss]);

  const formattedAnswer = formatBotAnswer(answer);

  return (
    <div className="personal-notification">
      <div className="notification-header">
        <div className="notification-icon">
          <RobotOutlined />
        </div>
        <strong>AI Assistant answered you</strong>
        <button className="notification-close" onClick={onDismiss}>
          <CloseOutlined />
        </button>
      </div>

      <div className="notification-body">
        <div className="notification-question">
          <MessageOutlined style={{ color: '#a855f7', fontSize: '12px' }} />
          <small>Your question:</small>
          <p>{question}</p>
        </div>

        <div className="notification-answer">
          <RobotOutlined style={{ color: '#667eea', fontSize: '12px' }} />
          <small>Answer:</small>
          <div dangerouslySetInnerHTML={{ __html: formattedAnswer }} />
        </div>
      </div>

      <button className="notification-action" onClick={onViewInChat}>
        View in chat →
      </button>
    </div>
  );
};

export default PersonalNotification;
