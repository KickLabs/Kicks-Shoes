import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../services/axiosInstance';

export const getCart = createAsyncThunk('cart/get', async (_, thunkAPI) => {
  try {
    const res = await axiosInstance.get('/cart');
    return res.data;
  } catch (error) {
    console.log('looi', error.response?.data?.message || error.message);
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addOrUpdateCartItem = createAsyncThunk('cart/addOrUpdate', async (item, thunkAPI) => {
  try {
    const res = await axiosInstance.post('/cart/items', item);
    return res.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateCartItem = createAsyncThunk(
  'cart/updateItem',
  async ({ itemId, updateData }, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/cart/items/${itemId}`, updateData);
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const removeCartItem = createAsyncThunk('cart/removeItem', async (itemId, thunkAPI) => {
  try {
    const res = await axiosInstance.delete(`/cart/items/${itemId}`);
    return res.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});
