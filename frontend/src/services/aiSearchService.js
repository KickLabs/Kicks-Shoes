/**
 * @fileoverview AI Search Service for contextual product search
 * @created 2025-01-27
 * @file aiSearchService.js
 * @description Service to handle AI-powered contextual product search
 */

import axiosInstance from './axiosInstance.js';

export class AISearchService {
  /**
   * Search products using AI contextual understanding
   * @param {string} query - Natural language search query
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Object>} Search results with AI suggestions
   */
  static async searchWithAI(query, limit = 10) {
    try {
      const response = await axiosInstance.post('/ai/search', {
        query: query,
        limit: limit,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('AI Search error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Search failed',
      };
    }
  }

  /**
   * Get AI-powered search suggestions
   * @param {string} query - Partial search query
   * @returns {Promise<Array>} Array of search suggestions
   */
  static async getSearchSuggestions(query) {
    try {
      const response = await axiosInstance.post('/ai/search/suggestions', {
        query: query,
        limit: 5,
      });

      return response.data.suggestions || [];
    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }

  /**
   * Check if query is contextual (natural language)
   * @param {string} query - Search query
   * @returns {boolean} True if query is contextual
   */
  static isContextualQuery(query) {
    const contextualKeywords = [
      'tôi muốn',
      'tôi cần',
      'tìm',
      'mua',
      'cần',
      'cho',
      'để',
      'phù hợp',
      'thích hợp',
      'tốt',
      'đi',
      'mặc',
      'dùng',
      'chơi',
      'tập',
      'làm việc',
      'đám cưới',
      'đi chơi',
      'đi làm',
      'đi học',
      'mùa hè',
      'mùa đông',
      'mùa thu',
      'mùa xuân',
      'casual',
      'formal',
      'sport',
      'running',
      'basketball',
      'thể dục',
      'gym',
      'chạy bộ',
      'đi bộ',
      'leo núi',
      'bóng đá',
      'tennis',
      'giày',
      'sneaker',
      'boot',
      'sandal',
      'loafer',
      'oxford',
      'nam',
      'nữ',
      'unisex',
      'đen',
      'trắng',
      'xanh',
      'đỏ',
      'vàng',
      'hồng',
      'tím',
      'cam',
      'nâu',
      'xám',
      'giá rẻ',
      'chất lượng',
      'thương hiệu',
      'nổi tiếng',
    ];

    const lowerQuery = query.toLowerCase();
    return contextualKeywords.some(keyword => lowerQuery.includes(keyword));
  }
}
