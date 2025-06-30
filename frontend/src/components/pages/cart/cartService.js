import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../services/axiosInstance';

export const getCart = createAsyncThunk('cart/get', async (_, thunkAPI) => {
  try {
    const res = await axiosInstance.get('/cart');
    console.log('Cart response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error getting cart:', error.response?.data || error.message);
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addOrUpdateCartItem = createAsyncThunk('cart/addOrUpdate', async (item, thunkAPI) => {
  try {
    console.log('Adding/updating cart item:', item);
    const res = await axiosInstance.post('/cart/items', item);
    console.log('Add/update cart response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error adding/updating cart item:', error.response?.data || error.message);
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateCartItem = createAsyncThunk(
  'cart/updateItem',
  async ({ itemId, updateData }, thunkAPI) => {
    try {
      console.log('Updating cart item:', { itemId, updateData });
      const res = await axiosInstance.put(`/cart/items/${itemId}`, updateData);
      console.log('Update cart response:', res.data);
      return res.data;
    } catch (error) {
      console.error('Error updating cart item:', error.response?.data || error.message);
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const removeCartItem = createAsyncThunk('cart/removeItem', async (itemId, thunkAPI) => {
  try {
    console.log('Removing cart item:', itemId);
    const res = await axiosInstance.delete(`/cart/items/${itemId}`);
    console.log('Remove cart response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error removing cart item:', error.response?.data || error.message);
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});
