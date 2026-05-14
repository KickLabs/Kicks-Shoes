/**
 * Bedrock Chat Component
 * AI-powered chat using AWS Bedrock Knowledge Base
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import bedrockChatService from '../../services/bedrockChatService';
import ReactMarkdown from 'react-markdown';
import './BedrockChat.css';

const BedrockChat = ({ isWidget = false }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat
  useEffect(() => {
    const initChat = async () => {
      if (!user?._id) {
        setError('Please login to use chat');
        return;
      }

      try {
        // Set user ID
        bedrockChatService.setUserId(user._id);

        // Check health
        const health = await bedrockChatService.checkHealth();
        console.log('DynamoDB health:', health);
        setIsConnected(health.status === 'healthy');

        // Get or create conversation
        await bedrockChatService.getOrCreateConversation();

        // Load existing messages
        await loadMessages();

        // Start polling for new messages
        bedrockChatService.startPolling((newMessage) => {
          console.log('New message received:', newMessage);
          setMessages(prev => {
            // Check if message already exists
            const exists = prev.some(m => m.timestamp === newMessage.timestamp);
            if (exists) return prev;
            return [...prev, newMessage];
          });
        }, 3000);

      } catch (err) {
        console.error('Error initializing chat:', err);
        setError('Failed to initialize chat: ' + err.message);
        setIsConnected(false);
      }
    };

    initChat();

    // Cleanup
    return () => {
      bedrockChatService.stopPolling();
    };
  }, [user]);

  // Load messages from DynamoDB
  const loadMessages = async () => {
    try {
      const result = await bedrockChatService.getDynamoMessages(50);
      console.log('Loaded messages:', result);
      setMessages(result.messages || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Add user message to UI immediately
      const tempUserMessage = {
        conversationId: bedrockChatService.getConversationId(),
        timestamp: Date.now(),
        userId: user._id,
        content: userMessage,
        messageType: 'user',
        _temp: true
      };
      setMessages(prev => [...prev, tempUserMessage]);

      // Send to backend or API Gateway
      const bedrockUrl = import.meta.env.VITE_BEDROCK_API_URL;
      
      if (bedrockUrl) {
        console.log('Using Direct API Gateway (MH4)');
        const token = localStorage.getItem('accessToken');
        const aiResponse = await bedrockChatService.sendBedrockDirect(userMessage, token);
        setMessages(prev => [...prev.filter(m => !m._temp), tempUserMessage, aiResponse]);
        setIsLoading(false);
      } else {
        await bedrockChatService.sendMessage(userMessage);
        console.log('Message sent, waiting for AI response...');

        // Reload messages after 3 seconds to get AI response
        setTimeout(async () => {
          await loadMessages();
          setIsLoading(false);
        }, 3000);
      }

    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message: ' + err.message);
      setIsLoading(false);
      
      // Remove temp message on error
      setMessages(prev => prev.filter(m => !m._temp));
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Render message
  const renderMessage = (message, index) => {
    const isUser = message.messageType === 'user';
    const isAI = message.messageType === 'ai';

    return (
      <div 
        key={message.timestamp || index} 
        className={`message ${isUser ? 'user-message' : 'ai-message'}`}
      >
        <div className="message-header">
          <span className="message-sender">
            {isUser ? 'You' : '🤖 AI Assistant'}
          </span>
          <span className="message-time">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <div className="message-content markdown-content">
          <ReactMarkdown>{message.content || ''}</ReactMarkdown>
        </div>
        {isAI && message.metadata && (
          <div className="message-metadata">
            <small>
              Response time: {message.metadata.responseTime}ms
              {message.metadata.citationsCount > 0 && 
                ` • ${message.metadata.citationsCount} citations`
              }
            </small>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bedrock-chat-container ${isWidget ? 'widget-mode' : ''}`}>
      {!isWidget && (
        <div className="chat-header">
          <h2>🤖 AI Shopping Assistant</h2>
        <div className="chat-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '● Connected' : '○ Disconnected'}
          </span>
        </div>
      </div>
      )}

      {error && (
        <div className="chat-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="chat-messages" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>👋 Hi! I'm your AI shopping assistant.</p>
            <p>Ask me anything about our products!</p>
          </div>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
        
        {isLoading && (
          <div className="message ai-message loading">
            <div className="message-header">
              <span className="message-sender">🤖 AI Assistant</span>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder="Ask about shoes, sizes, recommendations..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isLoading || !isConnected}
        />
        <button 
          type="submit" 
          className="chat-send-button"
          disabled={isLoading || !inputMessage.trim() || !isConnected}
        >
          {isLoading ? '⏳' : '📤'}
        </button>
      </form>

      <div className="chat-footer">
        <small>
          Powered by AWS Bedrock • Knowledge Base ID: 3MR7O4U9IC
        </small>
      </div>
    </div>
  );
};

export default BedrockChat;

