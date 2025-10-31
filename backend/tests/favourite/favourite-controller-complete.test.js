/**
 * @fileoverview Complete Favourites Controller Tests
 * @module favourite-controller-complete.test
 * @description Unit tests for all favourite controller methods
 * Covers removeFromFavourites, getFavourites, checkFavourite, getFavouritesByUserId
 */

import { jest, describe, test, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';
import { getMockReqRes, generateObjectId } from '../_helpers/testUtils.js';

// Mock dependencies BEFORE importing controller
const mockFavouriteFindOne = jest.fn();
const mockFavouriteCreate = jest.fn();
const mockFavouriteFindById = jest.fn();

jest.unstable_mockModule('../../src/models/Favourite.js', () => ({
  default: {
    findOne: mockFavouriteFindOne,
    create: mockFavouriteCreate,
    findById: mockFavouriteFindById,
  },
}));

const mockProductFindById = jest.fn();
jest.unstable_mockModule('../../src/models/Product.js', () => ({
  default: {
    findById: mockProductFindById,
  },
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/utils/errorResponse.js', () => ({
  ErrorResponse: class ErrorResponse extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.message = message;
    }
  },
}));

// Import AFTER mocking
const { removeFromFavourites, getFavourites, checkFavourite, getFavouritesByUserId } = await import(
  '../../src/controllers/favouriteController.js'
);

describe('Favourites Controller - Complete Tests', () => {
  let mockUser, mockProduct, mockFavourite;

  beforeAll(() => {
    mockUser = {
      _id: generateObjectId(),
      fullName: 'Test User',
      email: 'test@example.com',
      role: 'customer',
    };

    mockProduct = {
      _id: generateObjectId(),
      name: 'Nike Air Max',
      price: { regular: 1000000 },
      brand: 'Nike',
      status: true,
    };

    mockFavourite = {
      _id: generateObjectId(),
      user: mockUser._id,
      products: [mockProduct._id],
      save: jest.fn().mockResolvedValue(true),
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockFavouriteFindOne.mockResolvedValue(null);
    mockFavouriteFindById.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================
  // removeFromFavourites Tests
  // ==========================================
  describe('removeFromFavourites', () => {
    test('Should remove product from favourites successfully', async () => {
      const productId = mockProduct._id;
      const { req, res, next } = getMockReqRes({
        req: {
          user: mockUser,
          params: { productId },
        },
      });

      // Mock: User has existing favourite list
      const existingFavourite = {
        ...mockFavourite,
        products: [productId, generateObjectId()],
        save: jest.fn().mockResolvedValue(true),
      };
      mockFavouriteFindOne.mockResolvedValue(existingFavourite);

      await removeFromFavourites(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product removed from favourites',
      });
      expect(existingFavourite.save).toHaveBeenCalled();
    });

    test('Should return 404 when favourite list not found', async () => {
      const productId = mockProduct._id;
      const { req, res, next } = getMockReqRes({
        req: {
          user: mockUser,
          params: { productId },
        },
      });

      // Mock: No favourite list found
      mockFavouriteFindOne.mockResolvedValue(null);

      await removeFromFavourites(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Favourite list not found');
    });

    test('Should handle database error', async () => {
      const productId = mockProduct._id;
      const { req, res, next } = getMockReqRes({
        req: {
          user: mockUser,
          params: { productId },
        },
      });

      // Mock: Database error
      const dbError = new Error('Database connection error');
      mockFavouriteFindOne.mockRejectedValue(dbError);

      await removeFromFavourites(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
    });
  });

  // ==========================================
  // getFavourites Tests
  // ==========================================
  describe('getFavourites', () => {
    test('Should get user favourites successfully', async () => {
      const { req, res, next } = getMockReqRes({
        req: { user: mockUser },
      });

      // Mock: User has favourite list with populated products
      const populatedFavourite = {
        ...mockFavourite,
        products: [mockProduct],
      };
      mockFavouriteFindOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedFavourite),
      });

      await getFavourites(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: [{ product: mockProduct }],
      });
    });

    test('Should return empty array when no favourites', async () => {
      const { req, res, next } = getMockReqRes({
        req: { user: mockUser },
      });

      // Mock: No favourite list found
      mockFavouriteFindOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getFavourites(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
        data: [],
      });
    });

    test('Should handle database error', async () => {
      const { req, res, next } = getMockReqRes({
        req: { user: mockUser },
      });

      // Mock: Database error
      const dbError = new Error('Database connection error');
      mockFavouriteFindOne.mockReturnValue({
        populate: jest.fn().mockRejectedValue(dbError),
      });

      await getFavourites(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
    });
  });

  // ==========================================
  // checkFavourite Tests
  // ==========================================
  describe('checkFavourite', () => {
    test('Should return true when product is in favourites', async () => {
      const productId = mockProduct._id;
      const { req, res, next } = getMockReqRes({
        req: {
          user: mockUser,
          params: { productId },
        },
      });

      // Mock: User has favourite list with product
      mockFavouriteFindOne.mockResolvedValue(mockFavourite);

      await checkFavourite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        isFavourite: true,
      });
    });

    test('Should return false when product is not in favourites', async () => {
      const productId = generateObjectId();
      const { req, res, next } = getMockReqRes({
        req: {
          user: mockUser,
          params: { productId },
        },
      });

      // Mock: User has favourite list without this product
      mockFavouriteFindOne.mockResolvedValue(mockFavourite);

      await checkFavourite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        isFavourite: false,
      });
    });

    test('Should return false when no favourite list exists', async () => {
      const productId = mockProduct._id;
      const { req, res, next } = getMockReqRes({
        req: {
          user: mockUser,
          params: { productId },
        },
      });

      // Mock: No favourite list found
      mockFavouriteFindOne.mockResolvedValue(null);

      await checkFavourite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        isFavourite: false,
      });
    });

    test('Should handle database error', async () => {
      const productId = mockProduct._id;
      const { req, res, next } = getMockReqRes({
        req: {
          user: mockUser,
          params: { productId },
        },
      });

      // Mock: Database error
      const dbError = new Error('Database connection error');
      mockFavouriteFindOne.mockRejectedValue(dbError);

      await checkFavourite(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
    });
  });

  // ==========================================
  // getFavouritesByUserId Tests
  // ==========================================
  describe('getFavouritesByUserId', () => {
    test('Should get favourites by user ID successfully', async () => {
      const userId = mockUser._id;
      const { req, res, next } = getMockReqRes({
        req: {
          user: { ...mockUser, role: 'admin' },
          params: { userId },
          query: { page: '1', limit: '10' },
        },
      });

      // Mock: User has favourite list with populated products
      const populatedFavourite = {
        ...mockFavourite,
        products: [mockProduct],
      };
      mockFavouriteFindOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedFavourite),
      });

      await getFavouritesByUserId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: [{ product: mockProduct }],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      });
    });

    test('Should return empty data when no favourites found', async () => {
      const userId = mockUser._id;
      const { req, res, next } = getMockReqRes({
        req: {
          user: { ...mockUser, role: 'admin' },
          params: { userId },
          query: { page: '1', limit: '10' },
        },
      });

      // Mock: No favourite list found
      mockFavouriteFindOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getFavouritesByUserId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      });
    });

    test('Should allow user to access own favourites', async () => {
      const userId = mockUser._id;
      const { req, res, next } = getMockReqRes({
        req: {
          user: mockUser, // Same user
          params: { userId },
          query: { page: '1', limit: '10' },
        },
      });

      // Mock: User has favourite list
      const populatedFavourite = {
        ...mockFavourite,
        products: [mockProduct],
      };
      mockFavouriteFindOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedFavourite),
      });

      await getFavouritesByUserId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Should reject non-admin accessing other user favourites', async () => {
      const otherUserId = generateObjectId();
      const { req, res, next } = getMockReqRes({
        req: {
          user: mockUser, // Regular user
          params: { userId: otherUserId },
          query: { page: '1', limit: '10' },
        },
      });

      await getFavouritesByUserId(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Not authorized to access other users favourites');
    });

    test('Should handle pagination correctly', async () => {
      const userId = mockUser._id;
      const { req, res, next } = getMockReqRes({
        req: {
          user: { ...mockUser, role: 'admin' },
          params: { userId },
          query: { page: '2', limit: '5' },
        },
      });

      // Mock: User has 12 products (to test pagination)
      const products = Array.from({ length: 12 }, (_, i) => ({
        ...mockProduct,
        _id: generateObjectId(),
        name: `Product ${i + 1}`,
      }));
      const populatedFavourite = {
        ...mockFavourite,
        products,
      };
      mockFavouriteFindOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedFavourite),
      });

      await getFavouritesByUserId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 12,
        pages: 3,
      });
      expect(response.data).toHaveLength(5); // Second page should have 5 items
    });

    test('Should handle database error', async () => {
      const userId = mockUser._id;
      const { req, res, next } = getMockReqRes({
        req: {
          user: { ...mockUser, role: 'admin' },
          params: { userId },
          query: { page: '1', limit: '10' },
        },
      });

      // Mock: Database error
      const dbError = new Error('Database connection error');
      mockFavouriteFindOne.mockReturnValue({
        populate: jest.fn().mockRejectedValue(dbError),
      });

      await getFavouritesByUserId(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
    });

    test('Should use default pagination when no query params provided', async () => {
      const userId = mockUser._id;
      const { req, res, next } = getMockReqRes({
        req: {
          user: { ...mockUser, role: 'admin' },
          params: { userId },
          query: {}, // No query parameters
        },
      });

      // Mock: User has favourite list
      const populatedFavourite = {
        ...mockFavourite,
        products: [mockProduct],
      };
      mockFavouriteFindOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedFavourite),
      });

      await getFavouritesByUserId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1,
      });
    });
  });
});
