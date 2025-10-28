/**
 * @fileoverview Favourites - Add to Favourites Tests
 * @module add-to-favourites.test
 * @description Unit tests for addToFavourites controller method
 * Covers Test Suite 2 (Happy Path) and Test Suite 3 (Negative) from test-cases-matrix-favourite.md
 */

import { jest, describe, test, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';
import { getMockReqRes, generateObjectId } from '../_helpers/testUtils.js';

// Mock dependencies BEFORE importing controller
const mockFavouriteFindOne = jest.fn();
const mockFavouriteCreate = jest.fn();
const mockFavouriteFindById = jest.fn();
const mockProductFindById = jest.fn();

// Mock modules
jest.unstable_mockModule('../../src/models/Favourite.js', () => ({
  default: {
    findOne: mockFavouriteFindOne,
    create: mockFavouriteCreate,
    findById: mockFavouriteFindById,
  },
}));

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
const { addToFavourites } = await import('../../src/controllers/favouriteController.js');

describe('Favourites — Add to Favourites Controller (Test Suite 2 & 3)', () => {
  let mockUser, mockProduct;

  // Helper to create chainable query mock
  const createChainableQuery = data => {
    const chain = {
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(data),
      then: jest.fn(resolve => Promise.resolve(data).then(resolve)),
      catch: jest.fn(reject => Promise.resolve(data).catch(reject)),
    };
    return chain;
  };

  beforeAll(() => {
    mockUser = {
      _id: generateObjectId(),
      fullName: 'Test User',
      email: 'test@example.com',
    };

    mockProduct = {
      _id: generateObjectId(),
      name: 'Nike Air Max',
      price: { regular: 1000000 },
      brand: 'Nike',
      status: true,
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks - return promises directly, not chainable queries
    mockProductFindById.mockResolvedValue(null);
    mockFavouriteFindOne.mockResolvedValue(null);
    mockFavouriteFindById.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================
  // TC-FAV-004: Happy Path
  // ==========================================
  test('TC-FAV-004 | User adds a new product to favourites successfully', async () => {
    // Given: User is authenticated, Product exists, User does not have product in favourites
    const productId = mockProduct._id;
    const mockFavourite = {
      _id: generateObjectId(),
      user: mockUser._id,
      products: [productId],
      save: jest.fn().mockResolvedValue(true),
    };

    // When: POST request with valid JWT token
    const { req, res, next } = getMockReqRes({
      req: {
        user: mockUser,
        body: { productId },
      },
    });

    // Mock: Product exists
    mockProductFindById.mockResolvedValue(mockProduct);

    // Mock: User has no existing favourite list (create new)
    mockFavouriteFindOne.mockResolvedValue(null);

    mockFavouriteCreate.mockResolvedValue(mockFavourite);

    // Mock: Favourite.findById().populate() chainable query
    mockFavouriteFindById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockFavourite),
    });

    await addToFavourites(req, res, next);

    // Then: HTTP 201 Created with populated product details
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
    const responseCall = res.json.mock.calls[0][0];
    expect(responseCall.success).toBe(true);
    expect(responseCall.data).toBeDefined();
    expect(mockProductFindById).toHaveBeenCalledWith(productId);
    expect(mockFavouriteFindOne).toHaveBeenCalledWith({ user: mockUser._id });
    expect(mockFavouriteCreate).toHaveBeenCalled();
  });

  // ==========================================
  // TC-FAV-007: Negative - Duplicate
  // ==========================================
  test('TC-FAV-007 | Attempt to add duplicate product to favourites', async () => {
    // Given: User already has product in favourites
    const productId = mockProduct._id;
    const mockFavourite = {
      _id: generateObjectId(),
      user: mockUser._id,
      products: [productId], // Already has this product
      save: jest.fn().mockResolvedValue(true),
    };

    // When: POST request with same productId
    const { req, res, next } = getMockReqRes({
      req: {
        user: mockUser,
        body: { productId },
      },
    });

    // Mock: Product exists
    mockProductFindById.mockResolvedValue(mockProduct);

    // Mock: User has existing favourite with product already
    mockFavouriteFindOne.mockResolvedValue(mockFavourite);

    await addToFavourites(req, res, next);

    // Then: HTTP 400 Bad Request
    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('already in favourites');
    expect(mockFavouriteCreate).not.toHaveBeenCalled();
  });

  // ==========================================
  // TC-FAV-008: Negative - Non-existent Product
  // ==========================================
  test('TC-FAV-008 | Attempt to add non-existent product', async () => {
    // Given: Product does not exist in database
    const invalidProductId = generateObjectId();

    // When: POST request with invalid productId
    const { req, res, next } = getMockReqRes({
      req: {
        user: mockUser,
        body: { productId: invalidProductId },
      },
    });

    // Mock: Product.findById returns null
    mockProductFindById.mockResolvedValue(null);

    await addToFavourites(req, res, next);

    // Then: HTTP 404 Not Found
    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(404);
    expect(error.message).toContain('not found');
    expect(mockFavouriteFindOne).not.toHaveBeenCalled();
  });

  // ==========================================
  // TC-FAV-009: Negative - Missing productId
  // ==========================================
  test('TC-FAV-009 | Attempt to add product with missing productId', async () => {
    // Given: productId field is missing in request body
    // When: POST request without productId field
    const { req, res, next } = getMockReqRes({
      req: {
        user: mockUser,
        body: {}, // Empty body, no productId
      },
    });

    // Mock: Product.findById with undefined
    mockProductFindById.mockResolvedValue(null);

    await addToFavourites(req, res, next);

    // Then: HTTP 404 Not Found (Product.findById is called with undefined)
    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(404);
    expect(mockProductFindById).toHaveBeenCalledWith(undefined);
  });

  // ==========================================
  // TC-FAV-011: Negative - Invalid productId Format
  // ==========================================
  test('TC-FAV-011 | Attempt to add product with invalid productId format', async () => {
    // Given: productId is not a valid ObjectId format
    const invalidProductId = 'not-a-valid-objectid';

    // When: POST request with invalid format
    const { req, res, next } = getMockReqRes({
      req: {
        user: mockUser,
        body: { productId: invalidProductId },
      },
    });

    // Mock: Product.findById returns null (invalid format)
    mockProductFindById.mockReturnValue(createChainableQuery(null));

    await addToFavourites(req, res, next);

    // Then: HTTP 404 Not Found (Product not found due to invalid ID)
    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(404);
    expect(error.message).toContain('not found');
  });

  // ==========================================
  // TC-FAV-022: Edge Case - Malformed JSON
  // ==========================================
  test('TC-FAV-022 | Malformed JSON in POST request', async () => {
    // Given: Request body contains malformed JSON
    // Note: This is handled by Express JSON parser middleware, not the controller
    // The controller will receive undefined productId

    // When: POST request with malformed JSON
    const { req, res, next } = getMockReqRes({
      req: {
        user: mockUser,
        body: { productId: undefined }, // Simulates malformed JSON
      },
    });

    // Mock: Product.findById with undefined
    mockProductFindById.mockResolvedValue(null);

    await addToFavourites(req, res, next);

    // Then: HTTP 404 Not Found (handled gracefully)
    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });

  // ==========================================
  // TC-FAV-023: Edge Case - Empty String
  // ==========================================
  test('TC-FAV-023 | Empty string productId', async () => {
    // Given: productId is empty string
    // When: POST request with empty string productId
    const { req, res, next } = getMockReqRes({
      req: {
        user: mockUser,
        body: { productId: '' },
      },
    });

    // Mock: Product.findById returns null
    mockProductFindById.mockResolvedValue(null);

    await addToFavourites(req, res, next);

    // Then: HTTP 404 Not Found (invalid productId)
    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });

  // ==========================================
  // TC-FAV-013: Edge Case - Maximum List Size
  // ==========================================
  test('TC-FAV-013 | Attempt to add beyond maximum list size (if implemented)', async () => {
    // Given: User has exactly MAX_ITEMS (50) favourites
    const productId = mockProduct._id;
    const maxItems = 50;

    // Create array of 50 product IDs
    const existingProducts = Array.from({ length: maxItems }, (_, i) => generateObjectId());

    const mockFavourite = {
      _id: generateObjectId(),
      user: mockUser._id,
      products: existingProducts, // Already has 50 items
      save: jest.fn().mockResolvedValue(true),
    };

    // When: POST request for new product
    const { req, res, next } = getMockReqRes({
      req: {
        user: mockUser,
        body: { productId },
      },
    });

    // Mock: Product exists
    mockProductFindById.mockResolvedValue(mockProduct);

    // Mock: User already has favourite list with 50 items and save method
    const mockFavouriteWithSave = {
      ...mockFavourite,
      save: jest.fn().mockResolvedValue({
        ...mockFavourite,
        products: [...existingProducts, productId],
      }),
    };
    mockFavouriteFindOne.mockResolvedValue(mockFavouriteWithSave);

    // Mock: populate result after save
    mockFavouriteFindById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        ...mockFavourite,
        products: [...existingProducts, productId],
      }),
    });

    await addToFavourites(req, res, next);

    // Then: Check that product was added (no max limit enforced in current implementation)
    // Note: To enforce max limit, controller logic needs to be updated
    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockFavouriteFindOne).toHaveBeenCalled();
  });

  // ==========================================
  // Test: Adding to Existing Favourites List
  // ==========================================
  test('TC-FAV-004-v2 | Add product to existing favourites list', async () => {
    // Given: User already has a favourites list with some products
    const productId = mockProduct._id;
    const existingProductId = generateObjectId();
    const finalFavourite = {
      _id: generateObjectId(),
      user: mockUser._id,
      products: [existingProductId, productId],
    };

    // When: POST request with new productId
    const { req, res, next } = getMockReqRes({
      req: {
        user: mockUser,
        body: { productId },
      },
    });

    // Mock: Product exists
    mockProductFindById.mockResolvedValue(mockProduct);

    // Mock: User has existing favourite list with save method
    const existingFavourite = {
      _id: finalFavourite._id,
      user: mockUser._id,
      products: [existingProductId],
      save: jest.fn().mockResolvedValue({
        ...finalFavourite,
        products: [existingProductId, productId],
      }),
    };
    mockFavouriteFindOne.mockResolvedValue(existingFavourite);

    // Mock: populate result after save
    mockFavouriteFindById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        ...finalFavourite,
        products: [existingProductId, productId],
      }),
    });

    await addToFavourites(req, res, next);

    // Then: HTTP 201 Created with updated favourites
    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockProductFindById).toHaveBeenCalledWith(productId);
  });

  // ==========================================
  // Test: Error Handling
  // ==========================================
  test('Error handling - Database error on Favourite.findOne', async () => {
    // Given: Database throws error
    const productId = mockProduct._id;

    // When: POST request
    const { req, res, next } = getMockReqRes({
      req: {
        user: mockUser,
        body: { productId },
      },
    });

    // Mock: Product exists
    mockProductFindById.mockResolvedValue(mockProduct);

    // Mock: Database error on Favourite.findOne
    const dbError = new Error('Database connection error');
    mockFavouriteFindOne.mockRejectedValue(dbError);

    await addToFavourites(req, res, next);

    // Then: Error is passed to next()
    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(Error);
  });
});
