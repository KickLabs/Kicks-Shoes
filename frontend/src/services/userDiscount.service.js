import axiosInstance from './axiosInstance';

const userDiscountService = {
  // Lấy danh sách discount đã thu thập của user
  getUserDiscounts: async () => {
    try {
      const response = await axiosInstance.get('/user-discounts');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Thu thập discount
  collectDiscount: async discountCode => {
    try {
      const response = await axiosInstance.post('/user-discounts/collect', {
        discountCode,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Sử dụng discount
  useDiscount: async (userDiscountId, orderId, discountAmount, orderAmount) => {
    try {
      const response = await axiosInstance.post(`/user-discounts/${userDiscountId}/use`, {
        orderId,
        discountAmount,
        orderAmount,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách discount có thể thu thập
  getAvailableDiscounts: async () => {
    try {
      const response = await axiosInstance.get('/user-discounts/available');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Kiểm tra discount có hợp lệ không
  validateDiscount: async (discountCode, orderAmount) => {
    try {
      const response = await axiosInstance.post('/user-discounts/validate', {
        discountCode,
        orderAmount,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default userDiscountService;
