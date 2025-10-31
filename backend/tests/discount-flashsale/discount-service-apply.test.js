/**
 * @fileoverview Discount Service Apply Unit Tests
 * @module tests/discount-service-apply
 * @description Unit tests for applyDiscountToOrder function
 * Test Suite: Unit Tests - Discount Service Apply (DSA-001 to DSA-010)
 * Coverage: applyDiscountToOrder function
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
    findById: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

// Import only applyDiscountToOrder function
const { applyDiscountToOrder } = await import('../../src/services/discount.service.js');
const MockDiscount = (await import('../../src/models/Discount.js')).default;
const MockOrder = (await import('../../src/models/Order.js')).default;

describe('Discount Service - Apply Tests (applyDiscountToOrder only)', () => {
  let mockDiscount;
  let mockOrder;

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

    // Mock order instance
    mockOrder = {
      _id: 'order-123',
      user: 'user-123',
      subtotal: 200000,
      shippingCost: 30000,
      tax: 20000,
      discount: 0,
      discountCode: '',
      totalPrice: 250000,
      items: [{ product: 'product-1', quantity: 1, price: 200000 }],
      save: jest.fn(),
    };
  });

  describe('applyDiscountToOrder', () => {
    test('DSA-001 | Should apply discount to order successfully', async () => {
      // Given: Valid order and discount
      MockOrder.findById.mockResolvedValue(mockOrder);
      MockDiscount.findOne.mockResolvedValue(mockDiscount);
      mockDiscount.isValid.mockReturnValue(true);
      MockOrder.countDocuments.mockResolvedValue(0);
      mockOrder.save.mockResolvedValue();
      mockDiscount.save = jest.fn().mockResolvedValue();

      // When: Apply discount to order
      const result = await applyDiscountToOrder('order-123', 'SAVE10');

      // Then: Should apply discount successfully
      expect(result.success).toBe(true);
      expect(result.message).toBe('Discount applied successfully');
      expect(mockOrder.discount).toBe(20000);
      expect(mockOrder.discountCode).toBe('SAVE10');
      expect(mockOrder.totalPrice).toBe(230000); // 250000 - 20000
      expect(mockDiscount.usedCount).toBe(6); // Incremented from 5
    });

    test('DSA-002 | Should return error when order not found', async () => {
      // Given: Order not found
      MockOrder.findById.mockResolvedValue(null);

      // When: Apply discount to non-existent order
      const result = await applyDiscountToOrder('invalid-order', 'SAVE10');

      // Then: Should return error
      expect(result.success).toBe(false);
      expect(result.message).toBe('Order not found');
    });

    test('DSA-003 | Should return error when discount not found', async () => {
      // Given: Order exists but discount not found
      MockOrder.findById.mockResolvedValue(mockOrder);
      MockDiscount.findOne.mockResolvedValue(null);

      // When: Apply non-existent discount
      const result = await applyDiscountToOrder('order-123', 'INVALID');

      // Then: Should return error
      expect(result.success).toBe(false);
      expect(result.message).toBe('Discount code not found');
    });

    test('DSA-004 | Should return error when discount validation fails', async () => {
      // Given: Order and discount exist but validation fails
      MockOrder.findById.mockResolvedValue(mockOrder);
      MockDiscount.findOne.mockResolvedValue(mockDiscount);
      mockDiscount.isValid.mockReturnValue(false);

      // When: Apply invalid discount
      const result = await applyDiscountToOrder('order-123', 'SAVE10');

      // Then: Should return validation error
      expect(result.success).toBe(false);
      expect(result.message).toBe('Discount code is expired or inactive');
    });

    test('DSA-005 | Should handle database error during application', async () => {
      // Given: Database error during save
      MockOrder.findById.mockResolvedValue(mockOrder);
      MockDiscount.findOne.mockResolvedValue(mockDiscount);
      mockDiscount.isValid.mockReturnValue(true);
      MockOrder.countDocuments.mockResolvedValue(0);
      mockOrder.save.mockRejectedValue(new Error('Save error'));

      // When: Apply discount with save error
      const result = await applyDiscountToOrder('order-123', 'SAVE10');

      // Then: Should return error
      expect(result.success).toBe(false);
      expect(result.message).toBe('Error applying discount');
    });

    test('DSA-006 | Should handle discount save error', async () => {
      // Given: Order save succeeds but discount save fails
      MockOrder.findById.mockResolvedValue(mockOrder);
      MockDiscount.findOne.mockResolvedValue(mockDiscount);
      mockDiscount.isValid.mockReturnValue(true);
      MockOrder.countDocuments.mockResolvedValue(0);
      mockOrder.save.mockResolvedValue();
      mockDiscount.save = jest.fn().mockRejectedValue(new Error('Discount save error'));

      // When: Apply discount with discount save error
      const result = await applyDiscountToOrder('order-123', 'SAVE10');

      // Then: Should return error
      expect(result.success).toBe(false);
      expect(result.message).toBe('Error applying discount');
    });

    test('DSA-007 | Should handle order findById error', async () => {
      // Given: Database error during order find
      MockOrder.findById.mockRejectedValue(new Error('Database error'));

      // When: Apply discount with order find error
      const result = await applyDiscountToOrder('order-123', 'SAVE10');

      // Then: Should return error
      expect(result.success).toBe(false);
      expect(result.message).toBe('Error applying discount');
    });

    test('DSA-008 | Should handle discount findOne error', async () => {
      // Given: Order found but discount find fails
      MockOrder.findById.mockResolvedValue(mockOrder);
      MockDiscount.findOne.mockRejectedValue(new Error('Database error'));

      // When: Apply discount with discount find error
      const result = await applyDiscountToOrder('order-123', 'SAVE10');

      // Then: Should return error
      expect(result.success).toBe(false);
      expect(result.message).toBe('Error applying discount');
    });

    test('DSA-009 | Should apply fixed discount correctly', async () => {
      // Given: Fixed discount
      mockDiscount.type = 'fixed';
      mockDiscount.value = 50000;
      MockOrder.findById.mockResolvedValue(mockOrder);
      MockDiscount.findOne.mockResolvedValue(mockDiscount);
      mockDiscount.isValid.mockReturnValue(true);
      MockOrder.countDocuments.mockResolvedValue(0);
      mockOrder.save.mockResolvedValue();
      mockDiscount.save = jest.fn().mockResolvedValue();

      // When: Apply fixed discount
      const result = await applyDiscountToOrder('order-123', 'SAVE50K');

      // Then: Should apply fixed amount
      expect(result.success).toBe(true);
      expect(mockOrder.discount).toBe(50000);
      expect(mockOrder.totalPrice).toBe(200000); // 250000 - 50000
    });

    test('DSA-010 | Should handle validation error during apply', async () => {
      // Given: Order and discount exist but validation fails with specific message
      MockOrder.findById.mockResolvedValue(mockOrder);
      MockDiscount.findOne.mockResolvedValue(mockDiscount);
      mockDiscount.isValid.mockReturnValue(true);
      MockOrder.countDocuments.mockResolvedValue(1); // User already used it

      // When: Apply discount with validation failure
      const result = await applyDiscountToOrder('order-123', 'SAVE10');

      // Then: Should return validation error
      expect(result.success).toBe(false);
      expect(result.message).toBe('You have already used this discount code');
    });
  });
});
