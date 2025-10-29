/**
 * Mock for @google/genai (Google Gemini AI)
 * Provides in-memory mock for testing try-on functionality
 */

class MockGeminiAPI {
  constructor() {
    this.reset();
  }

  reset() {
    this._responses = {};
    this._callHistory = [];
    this._shouldThrow = null;
  }

  /**
   * Set a mock response for generateContent
   * @param {Object} response - Mock Gemini API response
   */
  setResponse(response) {
    this._mockResponse = response;
  }

  /**
   * Set mock to throw an error
   * @param {Error} error - Error to throw
   */
  setShouldThrow(error) {
    this._shouldThrow = error;
  }

  /**
   * Get call history for assertions
   * @returns {Array} Array of call arguments
   */
  getCallHistory() {
    return this._callHistory;
  }

  /**
   * Mock generateContent method
   */
  async generateContent(params) {
    this._callHistory.push(params);

    if (this._shouldThrow) {
      throw this._shouldThrow;
    }

    if (this._mockResponse) {
      return this._mockResponse;
    }

    // Default success response
    return {
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                  mimeType: 'image/png',
                },
              },
              {
                text: 'Successfully generated virtual try-on image.',
              },
            ],
          },
        },
      ],
    };
  }
}

/**
 * Create mock responses for different scenarios
 */
export const mockResponses = {
  /**
   * Successful generation with image and text
   */
  success: {
    candidates: [
      {
        content: {
          parts: [
            {
              inlineData: {
                data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                mimeType: 'image/png',
              },
            },
            {
              text: 'Generated photorealistic try-on image with person wearing the garment.',
            },
          ],
        },
      },
    ],
  },

  /**
   * Blocked by safety filters
   */
  blocked: {
    promptFeedback: {
      blockReason: 'SAFETY',
    },
    candidates: [],
  },

  /**
   * Empty response
   */
  empty: {
    candidates: [],
  },

  /**
   * Text only, no image
   */
  textOnly: {
    candidates: [
      {
        content: {
          parts: [
            {
              text: 'Unable to generate image, only description available.',
            },
          ],
        },
      },
    ],
  },

  /**
   * Image only, no text
   */
  imageOnly: {
    candidates: [
      {
        content: {
          parts: [
            {
              inlineData: {
                data: 'base64-image-data-here',
                mimeType: 'image/png',
              },
            },
          ],
        },
      },
    ],
  },

  /**
   * Different image mime type (JPEG)
   */
  jpegResponse: {
    candidates: [
      {
        content: {
          parts: [
            {
              inlineData: {
                data: 'jpeg-base64-data',
                mimeType: 'image/jpeg',
              },
            },
          ],
        },
      },
    ],
  },
};

/**
 * Mock errors for different failure scenarios
 */
export const mockErrors = {
  rateLimit: new Error('429 Too Many Requests - Rate limit exceeded'),
  networkError: new Error('Network error: Unable to reach Gemini API'),
  timeout: new Error('Request timeout'),
  invalidKey: new Error('401 Unauthorized: Invalid API key'),
  serverError: new Error('500 Internal Server Error'),
};

// Export singleton instance
const mockGeminiAPI = new MockGeminiAPI();

export default mockGeminiAPI;

/**
 * Factory function for creating mock GoogleGenAI instances
 */
export class MockGoogleGenAI {
  constructor(config) {
    this.config = config;
    this.models = {
      generateContent: mockGeminiAPI.generateContent.bind(mockGeminiAPI),
    };
  }
}
