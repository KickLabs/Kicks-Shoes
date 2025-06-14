/**
 * @fileoverview Store Service
 * @created 2025-06-09
 * @file store.service.js
 * @description This service handles all store-related business logic for the Kicks Shoes application.
 * It provides methods for creating, updating, and deleting stores.
 */

import mongoose from "mongoose";
import Store from "../models/Store.js";
import logger from "../utils/logger.js";

export class StoreService {
static async createStore(storeData) {
  try {
    const {
      name,
      description,
      logo,
      banner,
      address,
      phone,
      email,
      social_media,
      isOpen
    } = storeData;

    // Validate required fields
    if (!name || !description || !logo || !banner || !address || !phone || !email) {
      throw new Error("Missing required fields");
    }

    const store = new Store({
      name,
      description,
      logo,
      banner,
      address,
      phone,
      email,
      social_media,
      isOpen,
    });

    await store.save();

    logger.info("Store created successfully", { storeId: store._id });
    return store;
  } catch (error) {
    logger.error("Error creating store", { error: error.message });
    throw error;
  }
}


static async getAllStores() {
  try {
    logger.info("Retrieving all stores");
    const stores = await Store.find();
    if (stores.length === 0) {
      logger.warn("No stores found");
      return [];
    }
    logger.info("Stores retrieved successfully", { count: stores.length });
    return stores;
  } catch (error) {
    logger.error("Error retrieving stores", { error: error.message });
    throw error;
  }
}

static async getStoreById(storeId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      throw new Error("Invalid store ID");
    }

    const store = await Store.findById(storeId);
    if (!store) {
      throw new Error(`Store not found with id of ${storeId}`);
    }

    logger.info("Store retrieved successfully", { storeId: store._id });
    return store;
  } catch (error) {
    logger.error("Error retrieving store by ID", { error: error.message });
    throw error;
  }
}

static async updateStore(storeId, storeData) {
  try {
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      throw new Error("Invalid store ID");
    }

    const store = await Store.findById(storeId);
    if (!store) {
      throw new Error(`Store not found with id of ${storeId}`);
    }

    Object.assign(store, storeData);
    await store.save();

    logger.info("Store updated successfully", { storeId: store._id });
    return store;
  } catch (error) {
    logger.error("Error updating store", { error: error.message });
    throw error;
  }
}


static async deleteStore(storeId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      throw new Error("Invalid store ID");
    }

    const store = await Store.findByIdAndDelete(storeId);
    if (!store) {
      throw new Error(`Store not found with id of ${storeId}`);
    }

    logger.info("Store deleted successfully", { storeId: store._id });
    return store;
  } catch (error) {
    logger.error("Error deleting store", { error: error.message });
    throw error;
  }
}
}