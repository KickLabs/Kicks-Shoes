/**
 * AI Chat Service for integrating with the FTES AI API
 * Handles streaming responses and conversation management
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // backend base url
const DIRECT_AI_API_URL = import.meta.env.VITE_AI_API_URL; // external FTES URL
const USE_PROXY = (import.meta.env.VITE_AI_USE_PROXY || 'true').toLowerCase() === 'true';
const AI_TOKEN = import.meta.env.VITE_AI_TOKEN;
const BOT_ID = import.meta.env.VITE_BOT_ID;
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Validate required environment variables (non-fatal; detailed errors thrown at call time)
if (!BOT_ID || !API_KEY) {
  console.error('Missing required environment variables for AI Chat Service:');
  console.error('VITE_BOT_ID:', !!BOT_ID);
  console.error('VITE_GEMINI_API_KEY:', !!API_KEY);
  console.error('Please check your .env file configuration.');
}

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
      // Kiểm tra environment variables
      if (!BOT_ID || !API_KEY) {
        throw new Error(
          'Missing required environment variables for AI Chat Service. Please check your .env file.'
        );
      }

      // Tạo context cho AI tư vấn sản phẩm giày
      const productContext = `Bạn là AI tư vấn sản phẩm giày chuyên nghiệp. Bạn có kiến thức sâu rộng về:
      - Các loại giày: sneaker, boot, sandal, loafer, oxford, etc.
      - Các thương hiệu nổi tiếng: Nike, Adidas, Puma, Converse, Vans, etc.
      - Chất liệu giày: da, vải, cao su, mesh, etc.
      - Kích thước và cách chọn giày phù hợp
      - Phong cách thời trang và cách phối đồ với giày
      - Giá cả và chất lượng sản phẩm
      
      Hãy tư vấn một cách thân thiện, chuyên nghiệp và hữu ích. Nếu không biết thông tin cụ thể, hãy đề xuất cách tìm hiểu thêm.
      
      Câu hỏi của khách hàng: ${message}`;

      // Không gửi attachs nếu không có file

      console.log('Sending AI message:', {
        query: message,
        bot_id: BOT_ID,
        conversation_id: this.conversationId || '',
        model_name: 'gemini-2.5-flash-preview-05-20',
      });

      // Decide mode: proxy or direct, with auto-fallback to proxy on failure
      let response;
      const callProxy = async () => {
        if (!API_BASE_URL) {
          throw new Error('VITE_API_BASE_URL is required when VITE_AI_USE_PROXY=true');
        }
        const proxyUrl = `${API_BASE_URL}/ai/stream`;
        const payload = {
          query: productContext,
          bot_id: BOT_ID,
          conversation_id: this.conversationId || '',
          model_name: 'gemini-2.5-flash-preview-05-20',
          api_key: API_KEY,
        };
        return fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      };

      if (USE_PROXY || !DIRECT_AI_API_URL) {
        response = await callProxy();
      } else {
        const formData = new FormData();
        formData.append('query', productContext);
        formData.append('bot_id', BOT_ID);
        formData.append('conversation_id', this.conversationId || '');
        formData.append('model_name', 'gemini-2.5-flash-preview-05-20');
        formData.append('api_key', API_KEY);

        try {
          response = await fetch(DIRECT_AI_API_URL, {
            method: 'POST',
            headers: {
              ...(AI_TOKEN ? { Authorization: `Bearer ${AI_TOKEN}` } : {}),
            },
            body: formData,
          });
        } catch (directError) {
          // Network/CORS failure: fallback to proxy if available
          console.warn('Direct AI call failed, falling back to proxy:', directError);
          response = await callProxy();
        }
      }

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
