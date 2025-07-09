import axiosInstance from './axiosInstance';

/**
 * Get all discounts (Admin only)
 */
export const getAllDiscounts = async (page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get(`/discounts?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching discounts:', error);
    throw error;
  }
};

/**
 * Get discount by ID (Admin only)
 */
export const getDiscountById = async id => {
  try {
    const response = await axiosInstance.get(`/discounts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching discount:', error);
    throw error;
  }
};

/**
 * Create new discount (Admin only)
 */
export const createDiscount = async discountData => {
  try {
    const response = await axiosInstance.post('/discounts', discountData);
    return response.data;
  } catch (error) {
    console.error('Error creating discount:', error);
    throw error;
  }
};

/**
 * Update discount (Admin only)
 */
export const updateDiscount = async (id, discountData) => {
  try {
    const response = await axiosInstance.put(`/discounts/${id}`, discountData);
    return response.data;
  } catch (error) {
    console.error('Error updating discount:', error);
    throw error;
  }
};

/**
 * Delete discount (Admin only)
 */
export const deleteDiscount = async id => {
  try {
    const response = await axiosInstance.delete(`/discounts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting discount:', error);
    throw error;
  }
};

/**
 * Get active discounts (Public)
 */
export const getActiveDiscounts = async () => {
  try {
    const response = await axiosInstance.get('/discounts/active');
    return response.data;
  } catch (error) {
    console.error('Error fetching active discounts:', error);
    throw error;
  }
};

/**
 * Validate discount code
 */
export const validateDiscountCode = async (code, cartTotal, cartItems = []) => {
  try {
    const response = await axiosInstance.post('/discounts/validate', {
      code,
      cartTotal,
      cartItems,
    });
    return response.data;
  } catch (error) {
    console.error('Error validating discount code:', error);
    throw error;
  }
};

export default {
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getActiveDiscounts,
  validateDiscountCode,
};
