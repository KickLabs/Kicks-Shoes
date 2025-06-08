/**
 * @fileoverview Store Controller
 * @created 2025-06-04
 * @file storeController.js
 * @description This controller handles all sneaker store-related HTTP requests for the Kicks Shoes application.
 * It processes incoming requests, validates input data, and coordinates with the store service
 * to perform store operations. The controller is responsible for request/response handling
 * and error management.
 */

import Store from "../models/Store.js";
import { ErrorResponse } from "../utils/errorResponse.js";
import logger from "../utils/logger.js";

// Get all stores
export const getStores = async (req, res, next) => {
  try {
    const stores = await Store.find()
      .populate("owner", "username fullName avatar")
      .populate({
        path: "sneakers",
        populate: {
          path: "brand category",
          select: "name",
        },
      });
    res.status(200).json(stores);
  } catch (error) {
    logger.error("Error in getStores", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

// Get store by id
export const getStoreById = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate("owner", "username fullName avatar")
      .populate({
        path: "sneakers",
        populate: {
          path: "brand category",
          select: "name",
        },
      });

    if (!store) {
      return next(new ErrorResponse("Store not found", 404));
    }
    res.status(200).json(store);
  } catch (error) {
    logger.error("Error in getStoreById", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

// Create store
export const createStore = async (req, res, next) => {
  try {
    const storeData = {
      ...req.body,
      owner: req.user._id,
      logo: req.file ? req.file.path : undefined,
      storeType: "sneaker", // Enforce sneaker store type
      specialties: req.body.specialties || [], // e.g., ['Nike', 'Adidas', 'Limited Edition']
    };

    const store = await Store.create(storeData);
    await store.populate("owner", "username fullName avatar");

    res.status(201).json(store);
  } catch (error) {
    logger.error("Error in createStore", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

// Update store
export const updateStore = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return next(new ErrorResponse("Store not found", 404));
    }

    // Check if user is store owner
    if (store.owner.toString() !== req.user._id.toString()) {
      return next(
        new ErrorResponse("Not authorized to update this store", 403)
      );
    }

    const updates = { ...req.body };
    if (req.file) {
      updates.logo = req.file.path;
    }

    // Prevent changing store type
    delete updates.storeType;

    const updatedStore = await Store.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("owner", "username fullName avatar");

    res.status(200).json(updatedStore);
  } catch (error) {
    logger.error("Error in updateStore", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

// Delete store
export const deleteStore = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return next(new ErrorResponse("Store not found", 404));
    }

    // Check if user is store owner or admin
    if (
      store.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return next(
        new ErrorResponse("Not authorized to delete this store", 403)
      );
    }

    await store.remove();
    res.status(200).json({ message: "Store deleted successfully" });
  } catch (error) {
    logger.error("Error in deleteStore", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

// Get store sneakers
export const getStoreProducts = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id).populate({
      path: "sneakers",
      populate: {
        path: "brand category",
        select: "name",
      },
    });

    if (!store) {
      return next(new ErrorResponse("Store not found", 404));
    }

    res.status(200).json(store.sneakers);
  } catch (error) {
    logger.error("Error in getStoreProducts", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

// Add store sneaker
export const addStoreProduct = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return next(new ErrorResponse("Store not found", 404));
    }

    // Check if user is store owner
    if (store.owner.toString() !== req.user._id.toString()) {
      return next(
        new ErrorResponse("Not authorized to add sneakers to this store", 403)
      );
    }

    const sneakerData = {
      ...req.body,
      images: req.files ? req.files.map((file) => file.path) : [],
      // Sneaker specific fields
      brand: req.body.brand,
      model: req.body.model,
      releaseDate: req.body.releaseDate,
      colorway: req.body.colorway,
      size: req.body.size,
      condition: req.body.condition, // New, Used, Deadstock
      authenticity: req.body.authenticity, // Verified, Pending
      price: req.body.price,
      stock: req.body.stock,
      description: req.body.description,
      features: req.body.features || [], // e.g., ['Air Cushion', 'Flyknit']
      limitedEdition: req.body.limitedEdition || false,
    };

    store.sneakers.push(sneakerData);
    await store.save();

    const updatedStore = await Store.findById(req.params.id).populate({
      path: "sneakers",
      populate: {
        path: "brand category",
        select: "name",
      },
    });

    res.status(201).json(updatedStore.sneakers);
  } catch (error) {
    logger.error("Error in addStoreProduct", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

// Update store sneaker
export const updateStoreProduct = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return next(new ErrorResponse("Store not found", 404));
    }

    // Check if user is store owner
    if (store.owner.toString() !== req.user._id.toString()) {
      return next(
        new ErrorResponse(
          "Not authorized to update sneakers in this store",
          403
        )
      );
    }

    const sneaker = store.sneakers.id(req.params.productId);
    if (!sneaker) {
      return next(new ErrorResponse("Sneaker not found", 404));
    }

    const updates = { ...req.body };
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map((file) => file.path);
    }

    Object.assign(sneaker, updates);
    await store.save();

    const updatedStore = await Store.findById(req.params.id).populate({
      path: "sneakers",
      populate: {
        path: "brand category",
        select: "name",
      },
    });

    res.status(200).json(updatedStore.sneakers);
  } catch (error) {
    logger.error("Error in updateStoreProduct", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

// Delete store sneaker
export const deleteStoreProduct = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return next(new ErrorResponse("Store not found", 404));
    }

    // Check if user is store owner
    if (store.owner.toString() !== req.user._id.toString()) {
      return next(
        new ErrorResponse(
          "Not authorized to delete sneakers from this store",
          403
        )
      );
    }

    const sneaker = store.sneakers.id(req.params.productId);
    if (!sneaker) {
      return next(new ErrorResponse("Sneaker not found", 404));
    }

    sneaker.remove();
    await store.save();

    res.status(200).json({ message: "Sneaker deleted successfully" });
  } catch (error) {
    logger.error("Error in deleteStoreProduct", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};
