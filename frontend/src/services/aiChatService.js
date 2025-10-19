/**
 * AI Chat Service for integrating with Gemini AI
 * Handles streaming responses and conversation management
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class AIChatService {
  constructor() {
    this.conversationId = null;
    this.storageKey = 'ai_chat_messages';
    this.userId = null;
  }

  /**
   * Set user ID để tạo storage key riêng cho mỗi user
   * @param {string} userId - User ID
   */
  setUserId(userId) {
    this.userId = userId;
    this.storageKey = `ai_chat_messages_${userId}`;
  }

  /**
   * Get current user ID
   * @returns {string|null} Current user ID
   */
  getUserId() {
    return this.userId;
  }

  /**
   * Lưu tin nhắn vào localStorage
   */
  saveMessages(messages) {
    try {
      console.log('Saving messages to localStorage with key:', this.storageKey);
      console.log('Messages to save:', messages);
      localStorage.setItem(this.storageKey, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  }

  /**
   * Lấy tin nhắn từ localStorage
   */
  loadMessages() {
    try {
      console.log('Loading messages from localStorage with key:', this.storageKey);
      const messages = localStorage.getItem(this.storageKey);
      const parsedMessages = messages ? JSON.parse(messages) : [];
      console.log('Loaded messages:', parsedMessages);
      return parsedMessages;
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
      return [];
    }
  }

  /**
   * Xóa tin nhắn từ localStorage
   */
  clearMessages() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing messages from localStorage:', error);
    }
  }

  /**
   * Send a message to the AI and handle streaming response
   * @param {string} message - User message
   * @param {function} onStream - Callback for streaming chunks
   * @param {function} onComplete - Callback when response is complete
   * @param {function} onError - Callback for errors
   */
  async sendMessage(message, onStream, onComplete, onError) {
    try {
      // Check if API base URL is configured
      if (!API_BASE_URL) {
        throw new Error('API_BASE_URL is not configured');
      }

      console.log('Sending AI message:', {
        message: message,
        conversation_id: this.conversationId || null,
      });

      // Call the simplified Gemini AI backend
      const response = await fetch(`${API_BASE_URL}/ai/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversationId: this.conversationId || null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let fullResponse = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.type === 'message') {
              // Handle streaming message
              fullResponse += data.content;
              onStream(data.content);
            } else if (data.type === 'final') {
              // Handle final response
              const finalResponse = data.content.final_response;
              this.conversationId = data.content.conversation_id || this.conversationId;
              console.log('AI response completed:', finalResponse);
              onComplete(finalResponse, data.content);
              return;
            } else if (data.type === 'error') {
              // Handle error response
              throw new Error(data.content || 'AI encountered an error');
            }
          } catch (parseError) {
            console.warn('Failed to parse JSON line:', line, parseError);
          }
        }
      }
    } catch (error) {
      console.error('AI Chat API Error:', error);
      onError(error);
    }
  }

  /**
   * Set conversation ID for context continuity
   * @param {string} conversationId - Conversation ID
   */
  setConversationId(conversationId) {
    this.conversationId = conversationId;
  }

  /**
   * Get current conversation ID
   * @returns {string|null} Current conversation ID
   */
  getConversationId() {
    return this.conversationId;
  }

  /**
   * Reset conversation (clear conversation ID)
   */
  resetConversation() {
    this.conversationId = null;
  }
}

// Create singleton instance
const aiChatService = new AIChatService();
export default aiChatService;
