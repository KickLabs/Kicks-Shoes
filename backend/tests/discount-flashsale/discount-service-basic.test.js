/**
 * @fileoverview Discount Service Basic Unit Tests
 * @module tests/discount-service-basic
 * @description Basic unit tests for discount.service.js - only validateDiscountCode
 * Test Suite: Unit Tests - Discount Service Basic (DSB-001 to DSB-010)
 * Coverage: validateDiscountCode function only
 */

import { jest } from '@jest/globals';

// Mock modules before importing the service
jest.unstable_mockModule('../../src/models/Discount.js', () => ({
  default: {
    findOne: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/models/Order.js', () => ({
  default: {
    countDocuments: jest.fn(),
  },
}));

// Import only validateDiscountCode function
const { validateDiscountCode } = await import('../../src/services/discount.service.js');
const MockDiscount = (await import('../../src/models/Discount.js')).default;
const MockOrder = (await import('../../src/models/Order.js')).default;

describe('Discount Service - Basic Tests (validateDiscountCode only)', () => {
  let mockDiscount;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock discount instance
    mockDiscount = {
      _id: 'discount-123',
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
      maxDiscount: 50000,
      minPurchase: 100000,
      usedCount: 5,
      usageLimit: 100,
      perUserLimit: 1,
      applicableProducts: ['product-1', 'product-2'],
      description: 'Save 10% up to 50,000 VND',
      isValid: jest.fn(),
    };
  });

  describe('validateDiscountCode', () => {
    test('DSB-001 | Should validate percentage discount successfully', async () => {
      // Given: Valid discount and cart data
      MockDiscount.findOne.mockResolvedValue(mockDiscount);
      mockDiscount.isValid.mockReturnValue(true);
      MockOrder.countDocuments.mockResolvedValue(0);

      // When: Validate discount code
      const result = await validateDiscountCode('SAVE10', 'user-123', 200000, [
        { product: 'product-1', quantity: 1 },
      ]);

      // Then: Should return valid result
      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(20000); // 10% of 200000
      expect(result.finalAmount).toBe(180000);
      expect(MockDiscount.findOne).toHaveBeenCalledWith({ code: 'SAVE10' });
    });

    test('DSB-002 | Should validate fixed discount successfully', async () => {
      // Given: Fixed discount
      mockDiscount.type = 'fixed';
      mockDiscount.value = 50000;
      MockDiscount.findOne.mockResolvedValue(mockDiscount);
      mockDiscount.isValid.mockReturnValue(true);
      MockOrder.countDocuments.mockResolvedValue(0);

      // When: Validate fixed discount
      const result = await validateDiscountCode('SAVE50K', 'user-123', 200000, [
        { product: 'product-1', quantity: 1 },
      ]);

      // Then: Should apply fixed amount
      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(50000);
      expect(result.finalAmount).toBe(150000);
    });

    test('DSB-003 | Should return error when discount not found', async () => {
      // Given: Discount not found
      MockDiscount.findOne.mockResolvedValue(null);

      // When: Validate non-existent discount code
      const result = await validateDiscountCode('INVALID', 'user-123', 200000);

      // Then: Should return invalid result
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Discount code not found');
    });

    test('DSB-004 | Should return error when discount is expired', async () => {
      // Given: Expired discount
      MockDiscount.findOne.mockResolvedValue(mockDiscount);
      mockDiscount.isValid.mockReturnValue(false);

      // When: Validate expired discount
      const result = await validateDiscountCode('SAVE10', 'user-123', 200000);

      // Then: Should return invalid result
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Discount code is expired or inactive');
    });

    test('DSB-005 | Should return error when cart total below minimum', async () => {
      // Given: Valid discount but low cart total
      MockDiscount.findOne.mockResolvedValue(mockDiscount);
      mockDiscount.isValid.mockReturnValue(true);

      // When: Validate with low cart total
      const result = await validateDiscountCode('SAVE10', 'user-123', 50000);

      // Then: Should return invalid result
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Minimum purchase amount');
    });

    test('DSB-006 | Should return error when user exceeded per-user limit', async () => {
      // Given: User already used discount
      MockDiscount.findOne.mockResolvedValue(mockDiscount);
      mockDiscount.isValid.mockReturnValue(true);
      MockOrder.countDocuments.mockResolvedValue(1); // User already used it

      // When: Validate discount for same user
      const result = await validateDiscountCode('SAVE10', 'user-123', 200000);

      // Then: Should return invalid result
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('You have already used this discount code');
    });

    test('DSB-007 | Should return error when discount usage limit reached', async () => {
      // Given: Discount at usage limit
      mockDiscount.usedCount = 100; // At limit
      MockDiscount.findOne.mockResolvedValue(mockDiscount);
      mockDiscount.isValid.mockReturnValue(true);
      MockOrder.countDocuments.mockResolvedValue(0);

      // When: Validate discount at limit
      const result = await validateDiscountCode('SAVE10', 'user-123', 200000);

      // Then: Should return invalid result
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Discount code usage limit reached');
    });

    test('DSB-008 | Should return error when cart items not applicable', async () => {
      // Given: Discount with specific products, cart has different products
      MockDiscount.findOne.mockResolvedValue(mockDiscount);
      mockDiscount.isValid.mockReturnValue(true);
      MockOrder.countDocuments.mockResolvedValue(0);

      // When: Validate with non-applicable products
      const result = await validateDiscountCode('SAVE10', 'user-123', 200000, [
        { product: 'product-3', quantity: 1 }, // Not in applicableProducts
      ]);

      // Then: Should return invalid result
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Discount code does not apply to items in your cart');
    });

    test('DSB-009 | Should apply max discount limit for percentage', async () => {
      // Given: Percentage discount with max limit
      MockDiscount.findOne.mockResolvedValue(mockDiscount);
      mockDiscount.isValid.mockReturnValue(true);
      MockOrder.countDocuments.mockResolvedValue(0);

      // When: Validate with high cart total
      const result = await validateDiscountCode('SAVE10', 'user-123', 1000000, [
        { product: 'product-1', quantity: 1 },
      ]);

      // Then: Should cap at max discount
      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(50000); // Capped at maxDiscount
      expect(result.finalAmount).toBe(950000);
    });

    test('DSB-010 | Should handle database error gracefully', async () => {
      // Given: Database error
      MockDiscount.findOne.mockRejectedValue(new Error('Database error'));

      // When: Validate discount with error
      const result = await validateDiscountCode('SAVE10', 'user-123', 200000);

      // Then: Should return error result
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Error validating discount code');
    });
  });
});
