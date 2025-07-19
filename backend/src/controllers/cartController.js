import Cart from '../models/Cart.js';
import mongoose from 'mongoose';

/**
 * Tính lại totalPrice dựa trên items trong cart
 */
const recalculateTotalPrice = cart => {
  cart.totalPrice = cart.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};

/**
 * Get cart of a user
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name brand price variants images mainImage stock',
    });

    if (!cart) {
      // Create empty cart if none exists
      const newCart = new Cart({ user: userId, items: [] });
      await newCart.save();
      return res.json(newCart);
    }

    // Clean up invalid items (items without product)
    const validItems = cart.items.filter(item => item.product && item.product._id);
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      recalculateTotalPrice(cart);
      await cart.save();
    }

    res.json(cart);
  } catch (err) {
    console.error('Error getting cart:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Add or update item in cart
 */
export const addOrUpdateItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product, quantity, size, color, price, image } = req.body;

    // Validate required fields
    if (!product) {
      return res.status(400).json({ message: 'Product is required' });
    }
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }
    if (!size) {
      return res.status(400).json({ message: 'Size is required' });
    }
    if (!color) {
      return res.status(400).json({ message: 'Color is required' });
    }
    if (!price || price < 0) {
      return res.status(400).json({ message: 'Valid price is required' });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Clean up any invalid items first
    cart.items = cart.items.filter(item => item.product && item.product.toString());

    // Kiểm tra item đã tồn tại (cùng product, size, color)
    const existingItem = cart.items.find(
      item => item.product.toString() === product && item.size === size && item.color === color
    );

    if (existingItem) {
      // Nếu đã có, cập nhật quantity và image
      existingItem.quantity += quantity;
      if (image) {
        existingItem.image = image;
      }
    } else {
      // Nếu chưa có, thêm mới
      cart.items.push({ product, quantity, size, color, price, image });
    }

    recalculateTotalPrice(cart);
    await cart.save();

    // Return populated cart data
    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name brand price variants images mainImage stock',
    });

    res.status(200).json(populatedCart);
  } catch (err) {
    console.error('Error adding/updating cart item:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update a specific item in cart (e.g. change quantity, size, color)
 */
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.itemId;
    const { quantity, size, color, price } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (quantity !== undefined) item.quantity = quantity;
    if (size !== undefined) item.size = size;
    if (color !== undefined) item.color = color;
    if (price !== undefined) item.price = price;

    recalculateTotalPrice(cart);
    await cart.save();

    // Return populated cart data
    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name brand price variants images mainImage stock',
    });

    res.status(200).json(populatedCart);
  } catch (err) {
    console.error('Error updating cart item:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Remove item from cart
 */
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.itemId;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);

    recalculateTotalPrice(cart);
    await cart.save();

    // Return populated cart data
    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name brand price variants images mainImage stock',
    });

    res.status(200).json(populatedCart);
  } catch (err) {
    console.error('Error removing cart item:', err);
    res.status(500).json({ message: err.message });
  }
};
