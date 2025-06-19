import Favourite from "../models/Favourite.js";
import Product from "../models/Product.js";
import { ErrorResponse } from "../utils/errorResponse.js";
import logger from "../utils/logger.js";

/**
 * @desc    Add product to favourites
 * @route   POST /api/favourites
 * @access  Private
 */
export const addToFavourites = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;

    logger.info("Adding to favourites", {
      userId: userId,
      productId: productId,
    });

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      logger.warn("Product not found", { productId });
      return next(new ErrorResponse("Product not found", 404));
    }

    // Find or create user's favourite list
    let favourite = await Favourite.findOne({ user: userId });
    
    if (!favourite) {
      // Create new favourite list for user
      favourite = await Favourite.create({
        user: userId,
        products: [productId]
      });
    } else {
      // Check if product is already in favourites
      if (favourite.products.includes(productId)) {
        logger.info("Product already in favourites", {
          userId,
          productId,
        });
        return next(new ErrorResponse("Product already in favourites", 400));
      }

      // Add product to existing favourites
      favourite.products.push(productId);
      await favourite.save();
    }

    // Populate product details
    const populatedFavourite = await Favourite.findById(favourite._id)
      .populate({
        path: "products",
        select: "name price images description brand"
      });

    logger.info("Successfully added to favourites", {
      favouriteId: favourite._id,
      userId,
      productId,
    });

    res.status(201).json({
      success: true,
      data: populatedFavourite,
    });
  } catch (error) {
    logger.error("Error in addToFavourites", {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      productId: req.body?.productId,
    });
    next(error);
  }
};

/**
 * @desc    Remove product from favourites
 * @route   DELETE /api/favourites/:productId
 * @access  Private
 */
export const removeFromFavourites = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const favourite = await Favourite.findOne({ user: userId });

    if (!favourite) {
      return next(new ErrorResponse("Favourite list not found", 404));
    }

    // Remove product from array
    favourite.products = favourite.products.filter(
      (id) => id.toString() !== productId
    );
    
    await favourite.save();

    res.status(200).json({
      success: true,
      message: "Product removed from favourites",
    });
  } catch (error) {
    logger.error("Error in removeFromFavourites", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get user's favourites
 * @route   GET /api/favourites
 * @access  Private
 */
export const getFavourites = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const favourite = await Favourite.findOne({ user: userId })
      .populate({
        path: "products",
        select: "name price images description brand"
      });

    res.status(200).json({
      success: true,
      count: favourite ? favourite.products.length : 0,
      data: favourite ? favourite.products.map(product => ({
        product: product
      })) : [],
    });
  } catch (error) {
    logger.error("Error in getFavourites", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Check if product is in favourites
 * @route   GET /api/favourites/check/:productId
 * @access  Private
 */
export const checkFavourite = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const favourite = await Favourite.findOne({ user: userId });

    res.status(200).json({
      success: true,
      isFavourite: favourite ? favourite.products.includes(productId) : false,
    });
  } catch (error) {
    logger.error("Error in checkFavourite", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get favourites by user ID
 * @route   GET /api/favourites/user/:userId
 * @access  Private/Admin
 */
export const getFavouritesByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Check if user is admin or requesting their own favourites
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return next(new ErrorResponse('Not authorized to access other users favourites', 403));
    }

    const favourite = await Favourite.findOne({ user: userId })
      .populate({
        path: 'products',
        select: 'name price images description brand variants.sizes variants.colors'
      });

    res.status(200).json({
      success: true,
      count: favourite ? favourite.products.length : 0,
      data: favourite ? favourite.products.map(product => ({
        product: product
      })) : []
    });
  } catch (error) {
    logger.error("Error in getFavouritesByUserId", {
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
}; 