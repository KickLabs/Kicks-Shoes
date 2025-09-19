import axiosInstance from './axiosInstance';

// Flash Sale Services
export const getFlashSales = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sort) queryParams.append('sort', params.sort);

    const response = await axiosInstance.get(`/flash-sales?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching flash sales:', error);
    throw error;
  }
};

export const getFlashSaleById = async (id) => {
  try {
    const response = await axiosInstance.get(`/flash-sales/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching flash sale:', error);
    throw error;
  }
};

export const getCurrentActiveFlashSale = async () => {
  try {
    const response = await axiosInstance.get('/flash-sales/active/current');
    return response.data;
  } catch (error) {
    console.error('Error fetching current active flash sale:', error);
    throw error;
  }
};

export const getFlashSaleByProductId = async (productId) => {
  try {
    const response = await axiosInstance.get(`/flash-sales/product/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching flash sale by product:', error);
    throw error;
  }
};

export const createFlashSale = async (flashSaleData) => {
  try {
    const response = await axiosInstance.post('/flash-sales', flashSaleData);
    return response.data;
  } catch (error) {
    console.error('Error creating flash sale:', error);
    throw error;
  }
};

export const updateFlashSale = async (id, flashSaleData) => {
  try {
    const response = await axiosInstance.put(`/flash-sales/${id}`, flashSaleData);
    return response.data;
  } catch (error) {
    console.error('Error updating flash sale:', error);
    throw error;
  }
};

export const deleteFlashSale = async (id) => {
  try {
    const response = await axiosInstance.delete(`/flash-sales/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting flash sale:', error);
    throw error;
  }
};

export const updateFlashSaleStatus = async (id, status) => {
  try {
    const response = await axiosInstance.patch(`/flash-sales/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating flash sale status:', error);
    throw error;
  }
};

export const getFlashSaleStats = async () => {
  try {
    const response = await axiosInstance.get('/flash-sales/stats/overview');
    return response.data;
  } catch (error) {
    console.error('Error fetching flash sale stats:', error);
    throw error;
  }
};

// Product services for flash sale
export const getProductsForFlashSale = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await axiosInstance.get(`/products?${queryParams.toString()}`);
    return {
      success: response.data.success,
      data: response.data.data?.products || []
    };
  } catch (error) {
    console.error('Error fetching products for flash sale:', error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const response = await axiosInstance.get('/categories');
    return {
      success: response.data.success,
      data: response.data.data || []
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};
