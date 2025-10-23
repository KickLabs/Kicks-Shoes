import axiosInstance from './axiosInstance';

const voucherService = {
  // Lấy danh sách voucher của user
  getUserVouchers: async () => {
    try {
      const response = await axiosInstance.get('/vouchers/user');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy voucher theo ID
  getVoucherById: async voucherId => {
    try {
      const response = await axiosInstance.get(`/vouchers/${voucherId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Sử dụng voucher
  useVoucher: async (voucherId, orderId) => {
    try {
      const response = await axiosInstance.post(`/vouchers/${voucherId}/use`, {
        orderId,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Kiểm tra voucher có hợp lệ không
  validateVoucher: async (voucherCode, orderAmount) => {
    try {
      const response = await axiosInstance.post('/vouchers/validate', {
        code: voucherCode,
        orderAmount,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách voucher có thể sử dụng
  getAvailableVouchers: async orderAmount => {
    try {
      const response = await axiosInstance.get('/vouchers/available', {
        params: { orderAmount },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Tạo voucher mới
  createVoucher: async voucherData => {
    try {
      const response = await axiosInstance.post('/vouchers', voucherData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Cập nhật voucher
  updateVoucher: async (voucherId, voucherData) => {
    try {
      const response = await axiosInstance.put(`/vouchers/${voucherId}`, voucherData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Xóa voucher
  deleteVoucher: async voucherId => {
    try {
      const response = await axiosInstance.delete(`/vouchers/${voucherId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Lấy tất cả voucher
  getAllVouchers: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/vouchers', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Phân phối voucher cho user
  distributeVoucher: async (voucherId, userIds) => {
    try {
      const response = await axiosInstance.post(`/vouchers/${voucherId}/distribute`, {
        userIds,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Lấy thống kê voucher
  getVoucherStats: async () => {
    try {
      const response = await axiosInstance.get('/vouchers/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default voucherService;
