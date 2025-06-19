import Cart from "../models/Cart.js";
import mongoose from "mongoose";

/**
 * Tính lại totalPrice dựa trên items trong cart
 */
const recalculateTotalPrice = (cart) => {
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
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * Add or update item in cart
 */
export const addOrUpdateItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity, size, color, price } = req.body;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Kiểm tra item đã tồn tại (cùng product, size, color)
    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.size === size &&
        item.color === color
    );

    if (existingItem) {
      // Nếu đã có, cập nhật quantity
      existingItem.quantity += quantity;
    } else {
      // Nếu chưa có, thêm mới
      cart.items.push({ product: productId, quantity, size, color, price });
    }

    recalculateTotalPrice(cart);
    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
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
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (quantity !== undefined) item.quantity = quantity;
    if (size !== undefined) item.size = size;
    if (color !== undefined) item.color = color;
    if (price !== undefined) item.price = price;

    recalculateTotalPrice(cart);
    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
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
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    recalculateTotalPrice(cart);
    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
