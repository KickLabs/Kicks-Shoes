/**
 * @fileoverview LiveStream Service
 * @created 2025-01-02
 * @file livestreamService.js
 * @description Service for livestream API calls and WebRTC functionality
 */

import axiosInstance from './axiosInstance';

const API_BASE_URL = '/livestream';

class LiveStreamService {
  // Create a new livestream
  async createLiveStream(streamData) {
    const response = await axiosInstance.post(API_BASE_URL, streamData);
    return response.data;
  }

  // Get livestream details
  async getLiveStream(roomId) {
    const response = await axiosInstance.get(`${API_BASE_URL}/${roomId}`);
    return response.data;
  }

  // Get active livestreams
  async getActiveLiveStreams(page = 1, limit = 10) {
    const response = await axiosInstance.get(`${API_BASE_URL}/active`, {
      params: { page, limit },
    });
    return response.data;
  }

  // Get upcoming livestreams
  async getUpcomingLiveStreams(limit = 10) {
    const response = await axiosInstance.get(`${API_BASE_URL}/upcoming`, {
      params: { limit },
    });
    return response.data;
  }

  // Get all livestreams (for admin/shop dashboard)
  async getAllLiveStreams(page = 1, limit = 10) {
    const response = await axiosInstance.get(`${API_BASE_URL}/all`, {
      params: { page, limit },
    });
    return response.data;
  }

  // Get my livestreams
  async getMyLiveStreams(page = 1, limit = 10) {
    const response = await axiosInstance.get(`${API_BASE_URL}/my-streams`, {
      params: { page, limit },
    });
    return response.data;
  }

  // Update livestream
  async updateLiveStream(roomId, updateData) {
    const response = await axiosInstance.put(`${API_BASE_URL}/${roomId}`, updateData);
    return response.data;
  }

  // End livestream
  async endLiveStream(roomId) {
    const response = await axiosInstance.post(`${API_BASE_URL}/${roomId}/end`);
    return response.data;
  }

  // Delete livestream
  async deleteLiveStream(roomId) {
    const response = await axiosInstance.delete(`${API_BASE_URL}/${roomId}`);
    return response.data;
  }

  // Get chat messages
  async getChatMessages(roomId, page = 1, limit = 50) {
    const response = await axiosInstance.get(`${API_BASE_URL}/${roomId}/chat`, {
      params: { page, limit },
    });
    return response.data;
  }

  // Add featured product
  async addFeaturedProduct(roomId, productId) {
    const response = await axiosInstance.post(`${API_BASE_URL}/${roomId}/feature-product`, {
      productId,
    });
    return response.data;
  }

  // Remove featured product
  async removeFeaturedProduct(roomId, productId) {
    const response = await axiosInstance.delete(
      `${API_BASE_URL}/${roomId}/feature-product/${productId}`
    );
    return response.data;
  }

  // Toggle pin product
  async togglePinProduct(roomId, productId) {
    const response = await axiosInstance.put(`${API_BASE_URL}/${roomId}/pin-product/${productId}`);
    return response.data;
  }

  // Get livestream analytics
  async getLiveStreamAnalytics(roomId) {
    const response = await axiosInstance.get(`${API_BASE_URL}/${roomId}/analytics`);
    return response.data;
  }

  // Get store products (all products)
  async getStoreProducts() {
    const response = await axiosInstance.get('/products', {
      params: {
        limit: 100, // Get more products
        page: 1,
      },
    });
    return response.data;
  }

  // Pin/Unpin chat message
  async togglePinMessage(roomId, messageId) {
    const response = await axiosInstance.put(`${API_BASE_URL}/${roomId}/chat/${messageId}/pin`);
    return response.data;
  }

  // Get pinned message
  async getPinnedMessage(roomId) {
    const response = await axiosInstance.get(`${API_BASE_URL}/${roomId}/chat/pinned`);
    return response.data;
  }
}

export default new LiveStreamService();
