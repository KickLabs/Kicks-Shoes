import axiosInstance from './axiosInstance';

// Dashboard Statistics
export const getDashboardStats = async () => {
  try {
    const response = await axiosInstance.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Shop Dashboard Services
export const getShopStats = async () => {
  try {
    const response = await axiosInstance.get('/dashboard/shop/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching shop stats:', error);
    throw error;
  }
};

export const getShopOrders = async (page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get(`/dashboard/shop/orders?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching shop orders:', error);
    throw error;
  }
};

export const getShopFeedback = async (page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get(
      `/dashboard/shop/feedback?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching shop feedback:', error);
    throw error;
  }
};

export const getShopDiscounts = async () => {
  try {
    const response = await axiosInstance.get('/dashboard/shop/discounts');
    return response.data;
  } catch (error) {
    console.error('Error fetching shop discounts:', error);
    throw error;
  }
};

export const getShopSalesData = async (period = 'monthly') => {
  try {
    const response = await axiosInstance.get(`/dashboard/shop/sales?period=${period}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching shop sales data:', error);
    throw error;
  }
};

// Admin Dashboard Services
export const getAdminStats = async () => {
  try {
    const response = await axiosInstance.get('/dashboard/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error;
  }
};

export const getAdminUsers = async (page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get(`/dashboard/admin/users?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching admin users:', error);
    throw error;
  }
};

export const getAdminReportedProducts = async (page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get(
      `/dashboard/admin/reported-products?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching reported products:', error);
    throw error;
  }
};

export const getAdminFeedback = async (page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get(
      `/dashboard/admin/feedback?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching admin feedback:', error);
    throw error;
  }
};

export const getAdminRevenueData = async (period = 'monthly') => {
  try {
    const response = await axiosInstance.get(`/dashboard/admin/revenue?period=${period}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching admin revenue data:', error);
    throw error;
  }
};

export const getAdminUserGrowthData = async (period = 'monthly') => {
  try {
    const response = await axiosInstance.get(`/dashboard/admin/user-growth?period=${period}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching admin user growth data:', error);
    throw error;
  }
};

export const getAdminCategories = async (page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get(
      `/dashboard/admin/categories?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    throw error;
  }
};

// User Management Actions
export const banUser = async (userId, adminNote = '', banReason = '') => {
  try {
    const response = await axiosInstance.put(`/dashboard/admin/users/${userId}/ban`, {
      adminNote,
      banReason,
    });
    return response.data;
  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
};

export const unbanUser = async (userId, adminNote = '') => {
  try {
    const response = await axiosInstance.put(`/dashboard/admin/users/${userId}/unban`, {
      adminNote,
    });
    return response.data;
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw error;
  }
};

// Category Management Actions
export const createCategory = async categoryData => {
  try {
    const response = await axiosInstance.post('/dashboard/admin/categories', categoryData);
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (categoryId, categoryData) => {
  try {
    const response = await axiosInstance.put(
      `/dashboard/admin/categories/${categoryId}`,
      categoryData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async categoryId => {
  try {
    const response = await axiosInstance.delete(`/dashboard/admin/categories/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const activateCategory = async categoryId => {
  try {
    const response = await axiosInstance.put(`/dashboard/admin/categories/${categoryId}/activate`);
    return response.data;
  } catch (error) {
    console.error('Error activating category:', error);
    throw error;
  }
};

export const deactivateCategory = async categoryId => {
  try {
    const response = await axiosInstance.put(
      `/dashboard/admin/categories/${categoryId}/deactivate`
    );
    return response.data;
  } catch (error) {
    console.error('Error deactivating category:', error);
    throw error;
  }
};

// Product Moderation Actions
export const deleteReportedProduct = async productId => {
  try {
    const response = await axiosInstance.delete(`/dashboard/admin/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting reported product:', error);
    throw error;
  }
};

// Feedback Management Actions
export const deleteFeedback = async feedbackId => {
  try {
    const response = await axiosInstance.delete(`/dashboard/admin/feedback/${feedbackId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting feedback:', error);
    throw error;
  }
};

// Order Management Actions
export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await axiosInstance.put(`/dashboard/shop/orders/${orderId}/status`, {
      status,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Discount Management Actions
export const createDiscount = async discountData => {
  try {
    const response = await axiosInstance.post('/dashboard/shop/discounts', discountData);
    return response.data;
  } catch (error) {
    console.error('Error creating discount:', error);
    throw error;
  }
};

export const deleteDiscount = async discountId => {
  try {
    const response = await axiosInstance.delete(`/dashboard/shop/discounts/${discountId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting discount:', error);
    throw error;
  }
};
