/**
 * Bedrock Chat Service
 * Handles chat with AWS Bedrock AI via backend API
 * Integrates with DynamoDB + Lambda for AI responses
 *
 * Message flow:
 *   sendMessage()
 *     → POST /chat/message  (Express backend → MongoDB + DynamoDB)
 *     → DynamoDB Stream triggers Lambda bedrock-chat
 *     → Lambda calls Bedrock KB → saves AI response to DynamoDB
 *     → startPolling() picks up AI response via GET /dynamodb/messages/:id/latest
 *
 * W5 MH4: sendBedrockDirect()
 *     → POST <VITE_BEDROCK_API_URL>/chat  (API Gateway → Lambda bedrock-chat directly)
 *     → JWT Bearer token required (Lambda Authorizer)
 */

import api from '../config/api.config.js';

// W5 MH4: API Gateway URL — set VITE_BEDROCK_API_URL in .env after terraform apply
const BEDROCK_API_URL = import.meta.env.VITE_BEDROCK_API_URL || null;

class BedrockChatService {
  constructor() {
    this.conversationId = null;
    this.userId = null;
    this.shopId = '6845be4f54a7582c1d2109b8'; // Default shop ID
    this.pollingInterval = null;
  }

  /**
   * Set user ID
   * @param {string} userId - User ID
   */
  setUserId(userId) {
    this.userId = userId;
  }

  /**
   * Get or create conversation
   * @returns {Promise<Object>} Conversation object
   */
  async getOrCreateConversation() {
    try {
      if (this.conversationId) {
        return { _id: this.conversationId };
      }

      console.log('Creating conversation for user:', this.userId);
      
      const response = await api.post('/chat/conversation', {
        userId: this.userId,
        shopId: this.shopId
      });

      this.conversationId = response.data._id;
      console.log('Conversation created:', this.conversationId);
      
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Send message via Express backend (saves to MongoDB + DynamoDB → triggers Lambda async)
   * @param {string} content - Message content
   * @returns {Promise<Object>} Message object
   */
  async sendMessage(content) {
    try {
      await this.getOrCreateConversation();

      const response = await api.post('/chat/message', {
        conversationId: this.conversationId,
        sender: this.userId,
        receiver: this.shopId,
        content
      });

      console.log('Message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * W5 MH4 — Send message directly via API Gateway → Lambda bedrock-chat
   * Requires VITE_BEDROCK_API_URL to be set and a valid JWT token.
   * Returns AI response synchronously (Lambda invoked synchronously by API GW).
   *
   * @param {string} content - Message content
   * @param {string} token - JWT Bearer token (from localStorage)
   * @returns {Promise<Object>} AI response from Bedrock
   */
  async sendBedrockDirect(content, token) {
    if (!BEDROCK_API_URL) {
      throw new Error('VITE_BEDROCK_API_URL is not configured. Set it in .env after terraform apply.');
    }

    const response = await fetch(`${BEDROCK_API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: content,
        conversationId: this.conversationId,
        userId: this.userId,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Gateway error ${response.status}: ${text}`);
    }

    return response.json();
  }

  /**
   * Get messages from MongoDB (traditional chat)
   * @returns {Promise<Array>} Array of messages
   */
  async getMongoMessages() {
    try {
      if (!this.conversationId) return [];
      const response = await api.get(`/chat/messages/${this.conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching MongoDB messages:', error);
      return [];
    }
  }

  /**
   * Get messages from DynamoDB (includes AI responses)
   * @param {number} limit - Max number of messages
   * @returns {Promise<Object>} Messages object with array and metadata
   */
  async getDynamoMessages(limit = 50) {
    try {
      if (!this.conversationId) return { messages: [], count: 0 };

      const response = await api.get(`/dynamodb/messages/${this.conversationId}`, {
        params: { limit }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching DynamoDB messages:', error);
      return { messages: [], count: 0 };
    }
  }

  /**
   * Get only AI responses
   * @param {number} limit - Max number of messages
   * @returns {Promise<Object>} AI messages object
   */
  async getAIResponses(limit = 20) {
    try {
      if (!this.conversationId) return { messages: [], count: 0 };
      const response = await api.get(`/dynamodb/messages/${this.conversationId}/ai`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching AI responses:', error);
      return { messages: [], count: 0 };
    }
  }

  /**
   * Get latest message (for polling)
   * @returns {Promise<Object|null>} Latest message or null
   */
  async getLatestMessage() {
    try {
      if (!this.conversationId) return null;
      const response = await api.get(`/dynamodb/messages/${this.conversationId}/latest`);
      return response.data.message;
    } catch (error) {
      console.error('Error fetching latest message:', error);
      return null;
    }
  }

  /**
   * Start polling for new messages
   * @param {function} onNewMessage - Callback when new message arrives
   * @param {number} interval - Polling interval in ms (default: 3000)
   */
  startPolling(onNewMessage, interval = 3000) {
    if (this.pollingInterval) this.stopPolling();

    let lastTimestamp = Date.now();

    this.pollingInterval = setInterval(async () => {
      try {
        const latest = await this.getLatestMessage();
        if (latest && latest.timestamp > lastTimestamp) {
          lastTimestamp = latest.timestamp;
          onNewMessage(latest);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);

    console.log('Started polling for new messages');
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Stopped polling');
    }
  }

  /**
   * Check DynamoDB health
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      const response = await api.get('/dynamodb/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Reset conversation
   */
  resetConversation() {
    this.conversationId = null;
    this.stopPolling();
  }

  getConversationId() { return this.conversationId; }
  setConversationId(conversationId) { this.conversationId = conversationId; }
}

// Singleton instance
const bedrockChatService = new BedrockChatService();
export default bedrockChatService;

