import axiosInstance from './axiosInstance';

const shipperService = {
  // Get assigned orders
  async getAssignedOrders(params = {}) {
    try {
      const response = await axiosInstance.get('/shipper/orders', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get delivery by order ID
  async getDeliveryByOrderId(orderId) {
    try {
      const response = await axiosInstance.get(`/shipper/delivery/${orderId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update delivery status
  async updateDeliveryStatus(orderId, data) {
    try {
      const response = await axiosInstance.put(`/shipper/delivery/${orderId}/status`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get delivery history
  async getDeliveryHistory(params = {}) {
    try {
      const response = await axiosInstance.get('/shipper/history', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload proof of delivery
  async uploadProof(orderId, data) {
    try {
      const response = await axiosInstance.post(`/shipper/delivery/${orderId}/proof`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get shipper statistics
  async getStats() {
    try {
      const response = await axiosInstance.get('/shipper/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Customer confirms order received
  async confirmOrderReceived(orderId) {
    try {
      const response = await axiosInstance.post(`/shipper/order/${orderId}/confirm`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default shipperService;

