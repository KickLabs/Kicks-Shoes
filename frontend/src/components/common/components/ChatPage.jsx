import React, { useState, useEffect, useContext, useRef } from "react";
import { Input, Button, List, Avatar, Typography, Badge } from "antd";
import { SendOutlined, UserOutlined, SearchOutlined } from "@ant-design/icons";
import TabHeader from "./TabHeader";
import { ActiveTabContext } from "./ActiveTabContext";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import { useLocation } from "react-router-dom";

const { Text } = Typography;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setActiveTab } = useContext(ActiveTabContext);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  // Mock data for chat list
  const chatList = [
    {
      id: 1,
      name: "AI Assistant",
      lastMessage: "How can I help you today?",
      time: "Just now",
      unread: 0,
      avatar: null
    }
  ];

  useEffect(() => {
    if (isDashboard) {
      setActiveTab("6");
    } else {
      setActiveTab("4");
    }

    // Set default chat to AI Assistant
    setSelectedChat(chatList[0]);
  }, [setActiveTab]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const generateAIResponse = async (userMessage) => {
    try {
      setIsLoading(true);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent({
        contents: [
          {
            parts: [
              {
                text: userMessage
              }
            ]
          }
        ]
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating AI response:", error);
      return "I apologize, but I'm having trouble processing your request right now.";
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      // Add user message
      const userMessage = {
        id: Date.now(),
        content: newMessage,
        sender: "user",
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, userMessage]);
      setNewMessage("");

      // Generate and add AI response
      const aiResponse = await generateAIResponse(newMessage);
      const aiMessage = {
        id: Date.now() + 1,
        content: aiResponse,
        sender: "ai",
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, aiMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      handleSendMessage();
    }
  };

  const filteredChatList = chatList.filter((chat) =>
    chat.name.toLowerCase().includes(searchText.toLowerCase())
  );

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
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <List
            className="chat-list"
            itemLayout="horizontal"
            dataSource={filteredChatList}
            renderItem={(chat) => (
              <List.Item
                className={`chat-list-item ${
                  selectedChat?.id === chat.id ? "selected" : ""
                }`}
                onClick={() => setSelectedChat(chat)}
              >
                <List.Item.Meta
                  avatar={
                    <Badge count={chat.unread} offset={[-5, 5]}>
                      <Avatar icon={<UserOutlined />} className="chat-avatar" />
                    </Badge>
                  }
                  title={
                    <div className="chat-list-item-header">
                      <Text strong>{chat.name}</Text>
                      <Text className="chat-time">{chat.time}</Text>
                    </div>
                  }
                  description={
                    <div className="chat-list-item-content">
                      <Text className="chat-last-message">
                        {chat.lastMessage}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>

        {/* Chat Content */}
        <div className="chat-main">
          {selectedChat ? (
            <>
              <div className="chat-messages">
                <List
                  itemLayout="horizontal"
                  dataSource={messages}
                  renderItem={(message) => (
                    <List.Item
                      className={`message-item ${
                        message.sender === "user"
                          ? "user-message"
                          : "admin-message"
                      }`}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={<UserOutlined />}
                            className={
                              message.sender === "user"
                                ? "user-avatar"
                                : "admin-avatar"
                            }
                          />
                        }
                        title={
                          <Text strong>
                            {message.sender === "user" ? "You" : "AI Assistant"}
                          </Text>
                        }
                        description={
                          <div className="message-content">
                            <div className="message-text">
                              {message.sender === "ai" ? (
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              ) : (
                                message.content
                              )}
                            </div>
                            <div className="message-time">
                              {message.timestamp}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
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
