/**
 * @fileoverview Store Controller
 * @created 2025-06-04
 * @file storeController.js
 * @description This controller handles all store-related HTTP requests for the Kicks Shoes application.
 * It processes incoming requests, validates input data, and coordinates with the store service
 * to perform store operations. The controller is responsible for request/response handling
 * and error management.
 */

import Store from "../models/Store.js";

// Get all stores
export const getStores = async (req, res) => {
  try {
    const stores = await Store.find();
    res.status(200).json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get store by id
export const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    res.status(200).json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update store
export const updateStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    res.status(200).json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
