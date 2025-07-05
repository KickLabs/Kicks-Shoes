import axiosInstance from './axiosInstance.js';

export const favouriteService = {
  // Add product to favourites
  addToFavourites: async productId => {
    try {
      const response = await axiosInstance.post('/favourites', { productId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Remove product from favourites
  removeFromFavourites: async productId => {
    try {
      const response = await axiosInstance.delete(`/favourites/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user's favourites
  getFavourites: async () => {
    try {
      const response = await axiosInstance.get('/favourites');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Check if product is in favourites
  checkFavourite: async productId => {
    try {
      const response = await axiosInstance.get(`/favourites/check/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get favourites by user ID (for admin)
  getFavouritesByUserId: async userId => {
    try {
      const response = await axiosInstance.get(`/favourites/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
