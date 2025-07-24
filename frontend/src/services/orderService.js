import axiosInstance from './axiosInstance';

const orderService = {
  async createOrder(orderData) {
    try {
      console.log(
        'Creating order with token:',
        localStorage.getItem('accessToken') ? 'Token exists' : 'No token'
      );
      console.log('Order data being sent:', JSON.stringify(orderData, null, 2));

      const response = await axiosInstance.post(`/orders`, orderData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('OrderService createOrder error:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
        errors: error.response?.data?.errors,
        fullError: error,
      });

      // Return detailed error information
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map(e => e.msg || e.message || JSON.stringify(e))
          .join(', ');
        throw new Error(errorMessages);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (typeof error.response?.data === 'string') {
        throw new Error(error.response.data);
      } else if (error.response?.data) {
        throw new Error(JSON.stringify(error.response.data));
      } else {
        throw new Error(error.message || 'Failed to create order');
      }
    }
  },

  async updateOrder(orderId, updateData) {
    try {
      console.log(
        'Updating order with token:',
        localStorage.getItem('accessToken') ? 'Token exists' : 'No token'
      );
      console.log('Update data:', { orderId, updateData });

      const response = await axiosInstance.put(`/orders/${orderId}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('OrderService updateOrder error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });

      // Return detailed error information
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map(e => e.msg || e.message || e)
          .join(', ');
        throw new Error(errorMessages);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || 'Failed to update order');
      }
    }
  },
};

console.log('orderService loaded:', orderService);

export default orderService;
