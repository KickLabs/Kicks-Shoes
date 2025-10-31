/**
 * @fileoverview Discount Controller Unit Tests
 * @created 2025-01-27
 * @file discount-controller.test.js
 * @description Comprehensive unit tests for discountController.js
 */

import { jest } from '@jest/globals';

// Mock modules
jest.unstable_mockModule('../../src/models/Discount.js', () => ({
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/models/Order.js', () => ({
  default: {
    countDocuments: jest.fn(),
  },
}));

// Import after mocking
const {
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscount,
  getActiveDiscounts,
  validateDiscountCode,
} = await import('../../src/controllers/discountController.js');

const Discount = (await import('../../src/models/Discount.js')).default;
const Order = (await import('../../src/models/Order.js')).default;

describe('Discount Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      user: { id: 'user-123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('getAllDiscounts', () => {
    test('DC-001 | Should get all discounts with default pagination', async () => {
      // Given: Mock discount data
      const mockDiscounts = [
        {
          _id: 'discount-1',
          code: 'SAVE10',
          type: 'percentage',
          value: 10,
          updateStatus: jest.fn().mockReturnValue('active'),
          save: jest.fn().mockResolvedValue(),
        },
        {
          _id: 'discount-2',
          code: 'SAVE20',
          type: 'fixed',
          value: 50000,
          updateStatus: jest.fn().mockReturnValue('active'),
          save: jest.fn().mockResolvedValue(),
        },
      ];

      // Create a proper chainable mock
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      };

      // Mock the second populate call to return the data
      mockQuery.populate.mockImplementationOnce(() => mockQuery);
      mockQuery.populate.mockResolvedValueOnce(mockDiscounts);

      Discount.find.mockReturnValue(mockQuery);
      Discount.countDocuments.mockResolvedValue(2);

      // When: Call getAllDiscounts
      await getAllDiscounts(req, res);

      // Then: Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockDiscounts,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 2,
        },
      });
    });

    test('DC-002 | Should filter discounts by category', async () => {
      // Given: Request with category filter
      req.query = { category: 'shoes', page: 1, limit: 10 };

      const mockDiscounts = [
        {
          _id: 'discount-1',
          code: 'SHOES10',
          updateStatus: jest.fn().mockReturnValue('active'),
          save: jest.fn().mockResolvedValue(),
        },
      ];

      // Create a proper chainable mock
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      };

      // Mock the second populate call to return the data
      mockQuery.populate.mockImplementationOnce(() => mockQuery);
      mockQuery.populate.mockResolvedValueOnce(mockDiscounts);

      Discount.find.mockReturnValue(mockQuery);
      Discount.countDocuments.mockResolvedValue(1);

      // When: Call getAllDiscounts
      await getAllDiscounts(req, res);

      // Then: Verify query was called with category filter
      expect(Discount.find).toHaveBeenCalledWith({
        applicableCategories: 'shoes',
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('DC-003 | Should filter discounts by product', async () => {
      // Given: Request with product filter
      req.query = { product: 'product-123' };

      const mockDiscounts = [];
      // Create a proper chainable mock
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      };

      // Mock the second populate call to return the data
      mockQuery.populate.mockImplementationOnce(() => mockQuery);
      mockQuery.populate.mockResolvedValueOnce(mockDiscounts);

      Discount.find.mockReturnValue(mockQuery);
      Discount.countDocuments.mockResolvedValue(0);

      // When: Call getAllDiscounts
      await getAllDiscounts(req, res);

      // Then: Verify query was called with product filter
      expect(Discount.find).toHaveBeenCalledWith({
        applicableProducts: 'product-123',
      });
    });

    test('DC-004 | Should handle database error', async () => {
      // Given: Database error
      Discount.find.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // When: Call getAllDiscounts
      await getAllDiscounts(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching discounts',
        error: 'Database connection failed',
      });
    });

    test('DC-005 | Should update discount status when changed', async () => {
      // Given: Discount with status change
      const mockDiscount = {
        _id: 'discount-1',
        code: 'SAVE10',
        updateStatus: jest.fn().mockReturnValue('expired'),
        save: jest.fn().mockResolvedValue(),
      };

      // Create a proper chainable mock
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      };

      // Mock the second populate call to return the data
      mockQuery.populate.mockImplementationOnce(() => mockQuery);
      mockQuery.populate.mockResolvedValueOnce([mockDiscount]);

      Discount.find.mockReturnValue(mockQuery);
      Discount.countDocuments.mockResolvedValue(1);

      // When: Call getAllDiscounts
      await getAllDiscounts(req, res);

      // Then: Verify status was updated and saved
      expect(mockDiscount.updateStatus).toHaveBeenCalled();
      expect(mockDiscount.save).toHaveBeenCalled();
    });
  });

  describe('getDiscountById', () => {
    test('DC-006 | Should get discount by valid ID', async () => {
      // Given: Valid discount ID
      req.params.id = 'discount-123';
      const mockDiscount = {
        _id: 'discount-123',
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      // Mock the second populate call to return the data
      mockQuery.populate.mockImplementationOnce(() => mockQuery);
      mockQuery.populate.mockResolvedValueOnce(mockDiscount);
      Discount.findById.mockReturnValue(mockQuery);

      // When: Call getDiscountById
      await getDiscountById(req, res);

      // Then: Verify response
      expect(Discount.findById).toHaveBeenCalledWith('discount-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockDiscount,
      });
    });

    test('DC-007 | Should return 404 for non-existent discount', async () => {
      // Given: Non-existent discount ID
      req.params.id = 'non-existent';

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      // Mock the second populate call to return null
      mockQuery.populate.mockImplementationOnce(() => mockQuery);
      mockQuery.populate.mockResolvedValueOnce(null);
      Discount.findById.mockReturnValue(mockQuery);

      // When: Call getDiscountById
      await getDiscountById(req, res);

      // Then: Verify 404 response
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Discount not found',
      });
    });

    test('DC-008 | Should handle database error', async () => {
      // Given: Database error
      req.params.id = 'discount-123';
      Discount.findById.mockImplementation(() => {
        throw new Error('Database error');
      });

      // When: Call getDiscountById
      await getDiscountById(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching discount',
        error: 'Database error',
      });
    });
  });

  describe('createDiscount', () => {
    test('DC-009 | Should create discount successfully', async () => {
      // Given: Valid discount data
      req.body = {
        code: 'SAVE10',
        description: '10% off',
        type: 'percentage',
        value: 10,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        minPurchase: 100000,
        usageLimit: 100,
      };

      const mockDiscount = {
        _id: 'discount-123',
        code: 'SAVE10',
        populate: jest.fn().mockReturnThis(),
      };

      Discount.findOne.mockResolvedValue(null);
      Discount.create.mockResolvedValue(mockDiscount);
      mockDiscount.populate.mockResolvedValue(mockDiscount);

      // When: Call createDiscount
      await createDiscount(req, res);

      // Then: Verify response
      expect(Discount.create).toHaveBeenCalledWith({
        code: 'SAVE10',
        description: '10% off',
        type: 'percentage',
        value: 10,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        minPurchase: 100000,
        usageLimit: 100,
        usedCount: 0,
        status: 'active',
        applicableProducts: undefined,
        applicableCategories: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockDiscount,
        message: 'Discount created successfully',
      });
    });

    test('DC-010 | Should return 400 for duplicate discount code', async () => {
      // Given: Duplicate discount code
      req.body = { code: 'SAVE10' };
      const existingDiscount = { _id: 'existing-123', code: 'SAVE10' };

      Discount.findOne.mockResolvedValue(existingDiscount);

      // When: Call createDiscount
      await createDiscount(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Discount code already exists',
      });
    });

    test('DC-011 | Should return 400 for invalid date range', async () => {
      // Given: Invalid date range
      req.body = {
        code: 'SAVE10',
        startDate: '2025-12-31',
        endDate: '2025-01-01',
      };

      Discount.findOne.mockResolvedValue(null);

      // When: Call createDiscount
      await createDiscount(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'End date must be after start date',
      });
    });

    test('DC-012 | Should handle database error', async () => {
      // Given: Database error
      req.body = { code: 'SAVE10' };
      Discount.findOne.mockImplementation(() => {
        throw new Error('Database error');
      });

      // When: Call createDiscount
      await createDiscount(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating discount',
        error: 'Database error',
      });
    });
  });

  describe('updateDiscount', () => {
    test('DC-013 | Should update discount successfully', async () => {
      // Given: Valid discount and update data
      req.params.id = 'discount-123';
      req.body = {
        description: 'Updated description',
        value: 15,
        minPurchase: 200000,
      };

      const mockDiscount = {
        _id: 'discount-123',
        code: 'SAVE10',
        type: 'percentage',
        description: 'Old description',
        value: 10,
        minPurchase: 100000,
        save: jest.fn().mockResolvedValue(),
        populate: jest.fn().mockReturnThis(),
      };

      Discount.findById.mockResolvedValue(mockDiscount);
      mockDiscount.save.mockResolvedValue(mockDiscount);
      mockDiscount.populate.mockResolvedValue(mockDiscount);

      // When: Call updateDiscount
      await updateDiscount(req, res);

      // Then: Verify update
      expect(mockDiscount.description).toBe('Updated description');
      expect(mockDiscount.value).toBe(15);
      expect(mockDiscount.minPurchase).toBe(200000);
      expect(mockDiscount.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('DC-014 | Should return 404 for non-existent discount', async () => {
      // Given: Non-existent discount ID
      req.params.id = 'non-existent';
      Discount.findById.mockResolvedValue(null);

      // When: Call updateDiscount
      await updateDiscount(req, res);

      // Then: Verify 404 response
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Discount not found',
      });
    });

    test('DC-015 | Should return 400 for type modification attempt', async () => {
      // Given: Attempt to modify discount type
      req.params.id = 'discount-123';
      req.body = { type: 'fixed' };

      const mockDiscount = {
        _id: 'discount-123',
        type: 'percentage',
        save: jest.fn(),
      };

      Discount.findById.mockResolvedValue(mockDiscount);

      // When: Call updateDiscount
      await updateDiscount(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Discount type cannot be modified after creation',
      });
    });

    test('DC-016 | Should handle database error', async () => {
      // Given: Database error
      req.params.id = 'discount-123';
      Discount.findById.mockImplementation(() => {
        throw new Error('Database error');
      });

      // When: Call updateDiscount
      await updateDiscount(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error updating discount',
        error: 'Database error',
      });
    });
  });

  describe('deleteDiscount', () => {
    test('DC-017 | Should delete discount successfully', async () => {
      // Given: Valid discount ID
      req.params.id = 'discount-123';
      const mockDiscount = {
        _id: 'discount-123',
        code: 'SAVE10',
        deleteOne: jest.fn().mockResolvedValue(),
      };

      Discount.findById.mockResolvedValue(mockDiscount);

      // When: Call deleteDiscount
      await deleteDiscount(req, res);

      // Then: Verify deletion
      expect(mockDiscount.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Discount deleted successfully',
      });
    });

    test('DC-018 | Should return 404 for non-existent discount', async () => {
      // Given: Non-existent discount ID
      req.params.id = 'non-existent';
      Discount.findById.mockResolvedValue(null);

      // When: Call deleteDiscount
      await deleteDiscount(req, res);

      // Then: Verify 404 response
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Discount not found',
      });
    });

    test('DC-019 | Should handle database error', async () => {
      // Given: Database error
      req.params.id = 'discount-123';
      Discount.findById.mockImplementation(() => {
        throw new Error('Database error');
      });

      // When: Call deleteDiscount
      await deleteDiscount(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error deleting discount',
        error: 'Database error',
      });
    });
  });

  describe('getActiveDiscounts', () => {
    test('DC-020 | Should get active discounts successfully', async () => {
      // Given: Active discounts
      const mockDiscounts = [
        { _id: 'discount-1', code: 'SAVE10', type: 'percentage', value: 10 },
        { _id: 'discount-2', code: 'SAVE20', type: 'fixed', value: 50000 },
      ];

      Discount.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockDiscounts),
      });

      // When: Call getActiveDiscounts
      await getActiveDiscounts(req, res);

      // Then: Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockDiscounts,
      });
    });

    test('DC-021 | Should handle database error', async () => {
      // Given: Database error
      Discount.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      // When: Call getActiveDiscounts
      await getActiveDiscounts(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching active discounts',
        error: 'Database error',
      });
    });
  });

  describe('validateDiscountCode', () => {
    test('DC-022 | Should validate discount code successfully', async () => {
      // Given: Valid discount code and cart
      req.body = {
        code: 'SAVE10',
        cartTotal: 200000,
        cartItems: [{ productId: 'product-1', quantity: 1 }],
      };

      const mockDiscount = {
        _id: 'discount-123',
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        minPurchase: 100000,
        maxDiscount: 50000,
        usedCount: 5,
        usageLimit: 100,
        perUserLimit: 1,
        isValid: jest.fn().mockReturnValue(true),
      };

      Discount.findOne.mockResolvedValue(mockDiscount);
      Order.countDocuments.mockResolvedValue(0);

      // When: Call validateDiscountCode
      await validateDiscountCode(req, res);

      // Then: Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          isValid: true,
          discountAmount: 20000, // 10% of 200000
          discount: {
            code: 'SAVE10',
            type: 'percentage',
            value: 10,
            description: undefined,
          },
        },
      });
    });

    test('DC-023 | Should return 400 for missing discount code', async () => {
      // Given: Missing discount code
      req.body = { cartTotal: 200000 };

      // When: Call validateDiscountCode
      await validateDiscountCode(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Discount code is required',
      });
    });

    test('DC-024 | Should return 400 for non-existent discount code', async () => {
      // Given: Non-existent discount code
      req.body = { code: 'INVALID', cartTotal: 200000 };
      Discount.findOne.mockResolvedValue(null);

      // When: Call validateDiscountCode
      await validateDiscountCode(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Discount code not found',
      });
    });

    test('DC-025 | Should return 400 for expired discount', async () => {
      // Given: Expired discount
      req.body = { code: 'EXPIRED', cartTotal: 200000 };
      const mockDiscount = {
        code: 'EXPIRED',
        isValid: jest.fn().mockReturnValue(false),
      };

      Discount.findOne.mockResolvedValue(mockDiscount);

      // When: Call validateDiscountCode
      await validateDiscountCode(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Discount code is expired or inactive',
      });
    });

    test('DC-026 | Should return 400 for insufficient cart total', async () => {
      // Given: Cart total below minimum purchase
      req.body = { code: 'SAVE10', cartTotal: 50000 };
      const mockDiscount = {
        code: 'SAVE10',
        minPurchase: 100000,
        isValid: jest.fn().mockReturnValue(true),
      };

      Discount.findOne.mockResolvedValue(mockDiscount);

      // When: Call validateDiscountCode
      await validateDiscountCode(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Minimum purchase amount of 100,000 VND required',
      });
    });

    test('DC-027 | Should return 400 for user exceeding usage limit', async () => {
      // Given: User has already used the discount
      req.body = { code: 'SAVE10', cartTotal: 200000 };
      req.user = { id: 'user-123' };

      const mockDiscount = {
        code: 'SAVE10',
        minPurchase: 100000,
        perUserLimit: 1,
        usedCount: 5,
        usageLimit: 100,
        isValid: jest.fn().mockReturnValue(true),
      };

      Discount.findOne.mockResolvedValue(mockDiscount);
      Order.countDocuments.mockResolvedValue(1); // User has used it once

      // When: Call validateDiscountCode
      await validateDiscountCode(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You have already used this discount code',
      });
    });

    test('DC-028 | Should return 400 for usage limit reached', async () => {
      // Given: Discount usage limit reached
      req.body = { code: 'SAVE10', cartTotal: 200000 };
      const mockDiscount = {
        code: 'SAVE10',
        minPurchase: 100000,
        usedCount: 100,
        usageLimit: 100,
        isValid: jest.fn().mockReturnValue(true),
      };

      Discount.findOne.mockResolvedValue(mockDiscount);

      // When: Call validateDiscountCode
      await validateDiscountCode(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Discount code usage limit reached',
      });
    });

    test('DC-029 | Should calculate fixed discount correctly', async () => {
      // Given: Fixed discount type
      req.body = { code: 'FIXED50', cartTotal: 200000 };
      const mockDiscount = {
        code: 'FIXED50',
        type: 'fixed',
        value: 50000,
        minPurchase: 100000,
        usedCount: 5,
        usageLimit: 100,
        isValid: jest.fn().mockReturnValue(true),
      };

      Discount.findOne.mockResolvedValue(mockDiscount);

      // When: Call validateDiscountCode
      await validateDiscountCode(req, res);

      // Then: Verify fixed discount calculation
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          isValid: true,
          discountAmount: 50000, // Fixed amount
          discount: {
            code: 'FIXED50',
            type: 'fixed',
            value: 50000,
            description: undefined,
          },
        },
      });
    });

    test('DC-030 | Should apply max discount limit for percentage', async () => {
      // Given: Percentage discount with max limit
      req.body = { code: 'SAVE10', cartTotal: 1000000 };
      const mockDiscount = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        maxDiscount: 50000,
        minPurchase: 100000,
        usedCount: 5,
        usageLimit: 100,
        isValid: jest.fn().mockReturnValue(true),
      };

      Discount.findOne.mockResolvedValue(mockDiscount);

      // When: Call validateDiscountCode
      await validateDiscountCode(req, res);

      // Then: Verify max discount applied
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          isValid: true,
          discountAmount: 50000, // Max discount limit, not 10% of 1000000
          discount: {
            code: 'SAVE10',
            type: 'percentage',
            value: 10,
            description: undefined,
          },
        },
      });
    });

    test('DC-031 | Should handle database error', async () => {
      // Given: Database error
      req.body = { code: 'SAVE10', cartTotal: 200000 };
      Discount.findOne.mockImplementation(() => {
        throw new Error('Database error');
      });

      // When: Call validateDiscountCode
      await validateDiscountCode(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error validating discount code',
        error: 'Database error',
      });
    });
  });

  describe('validateDiscount', () => {
    test('DC-032 | Should validate discount by code successfully', async () => {
      // Given: Valid discount code
      req.params.code = 'SAVE10';
      const mockDiscount = {
        _id: 'discount-123',
        code: 'SAVE10',
        isValid: jest.fn().mockReturnValue(true),
      };

      Discount.findOne.mockResolvedValue(mockDiscount);

      // When: Call validateDiscount
      await validateDiscount(req, res);

      // Then: Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          isValid: true,
          discount: mockDiscount,
        },
      });
    });

    test('DC-033 | Should return 404 for non-existent discount', async () => {
      // Given: Non-existent discount code
      req.params.code = 'INVALID';
      Discount.findOne.mockResolvedValue(null);

      // When: Call validateDiscount
      await validateDiscount(req, res);

      // Then: Verify 404 response
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Discount not found',
      });
    });

    test('DC-034 | Should return invalid discount when expired', async () => {
      // Given: Expired discount
      req.params.code = 'EXPIRED';
      const mockDiscount = {
        _id: 'discount-123',
        code: 'EXPIRED',
        isValid: jest.fn().mockReturnValue(false),
      };

      Discount.findOne.mockResolvedValue(mockDiscount);

      // When: Call validateDiscount
      await validateDiscount(req, res);

      // Then: Verify response with null discount
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          isValid: false,
          discount: null,
        },
      });
    });

    test('DC-035 | Should handle database error', async () => {
      // Given: Database error
      req.params.code = 'SAVE10';
      Discount.findOne.mockImplementation(() => {
        throw new Error('Database error');
      });

      // When: Call validateDiscount
      await validateDiscount(req, res);

      // Then: Verify error response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error validating discount',
        error: 'Database error',
      });
    });
  });
});
