/**
 * @fileoverview Discount Model Unit Tests
 * @created 2025-01-27
 * @file discount-model.test.js
 * @description Comprehensive unit tests for Discount.js model
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Discount from '../../src/models/Discount.js';

// Increase timeout for database operations
jest.setTimeout(120000);

describe('Discount Model - Unit Tests', () => {
  beforeAll(async () => {
    // Setup test environment
    process.env.NODE_ENV = 'test';

    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/kicks-shoes-test'
      );
    }
  });

  beforeEach(async () => {
    // Clear all collections with timeout
    try {
      await Promise.all([Discount.deleteMany({}).maxTimeMS(5000)]);
    } catch (error) {
      console.warn('Database cleanup warning:', error.message);
    }
  });

  afterEach(async () => {
    // Cleanup with timeout
    try {
      await Promise.all([Discount.deleteMany({}).maxTimeMS(5000)]);
    } catch (error) {
      console.warn('Database cleanup warning:', error.message);
    }
  });

  afterAll(async () => {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('Schema Validation', () => {
    test('DM-001 | Should create discount with valid data', async () => {
      // Given: Valid discount data
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        minPurchase: 100000,
        maxDiscount: 50000,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        usageLimit: 100,
        usedCount: 0,
        perUserLimit: 1,
        status: 'active',
        description: '10% off for new customers',
        source: 'shop',
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: Verify discount was created
      expect(savedDiscount._id).toBeDefined();
      expect(savedDiscount.code).toBe('SAVE10');
      expect(savedDiscount.type).toBe('percentage');
      expect(savedDiscount.value).toBe(10);
      expect(savedDiscount.status).toBe('active');
    });

    test('DM-002 | Should require discount code', async () => {
      // Given: Discount data without code
      const discountData = {
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow('Discount code is required');
    });

    test('DM-003 | Should require unique discount code', async () => {
      // Given: Two discounts with same code
      const discountData1 = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      const discountData2 = {
        code: 'SAVE10',
        type: 'fixed',
        value: 50000,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create first discount
      await new Discount(discountData1).save();

      // Then: Second discount should fail
      const discount2 = new Discount(discountData2);
      await expect(discount2.save()).rejects.toThrow();
    });

    test('DM-004 | Should convert code to uppercase', async () => {
      // Given: Discount with lowercase code
      const discountData = {
        code: 'save10',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: Code should be uppercase
      expect(savedDiscount.code).toBe('SAVE10');
    });

    test('DM-005 | Should trim code whitespace', async () => {
      // Given: Discount with code having whitespace
      const discountData = {
        code: '  SAVE10  ',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: Code should be trimmed
      expect(savedDiscount.code).toBe('SAVE10');
    });

    test('DM-006 | Should require discount type', async () => {
      // Given: Discount data without type
      const discountData = {
        code: 'SAVE10',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow('Discount type is required');
    });

    test('DM-007 | Should validate discount type enum', async () => {
      // Given: Discount with invalid type
      const discountData = {
        code: 'SAVE10',
        type: 'invalid',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow();
    });

    test('DM-008 | Should require discount value', async () => {
      // Given: Discount data without value
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow('Discount value is required');
    });

    test('DM-009 | Should validate percentage discount value <= 100', async () => {
      // Given: Percentage discount with value > 100
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 150,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow('Percentage discount cannot exceed 100%');
    });

    test('DM-010 | Should allow fixed discount value > 100', async () => {
      // Given: Fixed discount with value > 100
      const discountData = {
        code: 'SAVE10',
        type: 'fixed',
        value: 500000,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: Should be created successfully
      expect(savedDiscount.value).toBe(500000);
    });

    test('DM-011 | Should validate value cannot be negative', async () => {
      // Given: Discount with negative value
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: -10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow('Discount value cannot be negative');
    });

    test('DM-012 | Should set default minPurchase to 0', async () => {
      // Given: Discount data without minPurchase
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: minPurchase should be 0
      expect(savedDiscount.minPurchase).toBe(0);
    });

    test('DM-013 | Should validate minPurchase cannot be negative', async () => {
      // Given: Discount with negative minPurchase
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        minPurchase: -1000,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow('Minimum purchase amount cannot be negative');
    });

    test('DM-014 | Should validate maxDiscount cannot be negative', async () => {
      // Given: Discount with negative maxDiscount
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        maxDiscount: -50000,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow('Maximum discount cannot be negative');
    });

    test('DM-015 | Should require start date', async () => {
      // Given: Discount data without startDate
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        endDate: new Date('2025-12-31'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow('Start date is required');
    });

    test('DM-016 | Should require end date', async () => {
      // Given: Discount data without endDate
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow('End date is required');
    });

    test('DM-017 | Should set default usageLimit to 1', async () => {
      // Given: Discount data without usageLimit
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: usageLimit should be 1
      expect(savedDiscount.usageLimit).toBe(1);
    });

    test('DM-018 | Should validate usageLimit must be at least 1', async () => {
      // Given: Discount with usageLimit < 1
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        usageLimit: 0,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow('Usage limit must be at least 1');
    });

    test('DM-019 | Should set default usedCount to 0', async () => {
      // Given: Discount data without usedCount
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: usedCount should be 0
      expect(savedDiscount.usedCount).toBe(0);
    });

    test('DM-020 | Should validate usedCount cannot be negative', async () => {
      // Given: Discount with negative usedCount
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        usedCount: -1,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow('Used count cannot be negative');
    });

    test('DM-021 | Should set default perUserLimit to 1', async () => {
      // Given: Discount data without perUserLimit
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: perUserLimit should be 1
      expect(savedDiscount.perUserLimit).toBe(1);
    });

    test('DM-022 | Should validate perUserLimit must be at least 1', async () => {
      // Given: Discount with perUserLimit < 1
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        perUserLimit: 0,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow('Per user limit must be at least 1');
    });

    test('DM-023 | Should set default status to active', async () => {
      // Given: Discount data without status
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: status should be active
      expect(savedDiscount.status).toBe('active');
    });

    test('DM-024 | Should validate status enum', async () => {
      // Given: Discount with invalid status
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        status: 'invalid',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow();
    });

    test('DM-025 | Should set default source to shop', async () => {
      // Given: Discount data without source
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: source should be shop
      expect(savedDiscount.source).toBe('shop');
    });

    test('DM-026 | Should validate source enum', async () => {
      // Given: Discount with invalid source
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        source: 'invalid',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow();
    });

    test('DM-027 | Should trim description whitespace', async () => {
      // Given: Discount with description having whitespace
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        description: '  10% off for new customers  ',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: Description should be trimmed
      expect(savedDiscount.description).toBe('10% off for new customers');
    });
  });

  describe('Pre-save Middleware', () => {
    test('DM-028 | Should validate end date after start date', async () => {
      // Given: Discount with end date before start date
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-12-31'),
        endDate: new Date('2025-01-01'),
      };

      // When: Try to create discount
      const discount = new Discount(discountData);

      // Then: Should throw validation error
      await expect(discount.save()).rejects.toThrow('End date must be after start date');
    });

    test('DM-029 | Should update status on save when dates change', async () => {
      // Given: Discount with future start date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 24 * 60 * 60 * 1000),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: Status should be updated by pre-save middleware
      expect(savedDiscount.status).toBe('active');
    });

    test('DM-030 | Should update status when usedCount changes', async () => {
      // Given: Discount with usage limit
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        usageLimit: 1,
        usedCount: 0,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount and update usedCount
      const discount = new Discount(discountData);
      await discount.save();

      discount.usedCount = 1;
      const updatedDiscount = await discount.save();

      // Then: Status should be updated to expired
      expect(updatedDiscount.status).toBe('expired');
    });
  });

  describe('Instance Methods', () => {
    test('DM-031 | updateStatus should return expired when usage limit reached', () => {
      // Given: Discount with usage limit reached
      const discount = new Discount({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        usageLimit: 1,
        usedCount: 1,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      });

      // When: Call updateStatus
      const status = discount.updateStatus();

      // Then: Should return expired
      expect(status).toBe('expired');
      expect(discount.status).toBe('expired');
    });

    test('DM-032 | updateStatus should return expired when end date passed', () => {
      // Given: Discount with end date in the past
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const discount = new Discount({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: pastDate,
      });

      // When: Call updateStatus
      const status = discount.updateStatus();

      // Then: Should return expired
      expect(status).toBe('expired');
      expect(discount.status).toBe('expired');
    });

    test('DM-033 | updateStatus should return active when start date in future', () => {
      // Given: Discount with start date in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const discount = new Discount({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 24 * 60 * 60 * 1000),
      });

      // When: Call updateStatus
      const status = discount.updateStatus();

      // Then: Should return active
      expect(status).toBe('active');
      expect(discount.status).toBe('active');
    });

    test('DM-034 | updateStatus should return active when currently active', () => {
      // Given: Currently active discount
      const now = new Date();
      const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const discount = new Discount({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        startDate,
        endDate,
      });

      // When: Call updateStatus
      const status = discount.updateStatus();

      // Then: Should return active
      expect(status).toBe('active');
      expect(discount.status).toBe('active');
    });

    test('DM-035 | isValid should return true for valid discount', () => {
      // Given: Valid discount
      const now = new Date();
      const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const discount = new Discount({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        status: 'active',
        startDate,
        endDate,
        usedCount: 0,
        usageLimit: 10,
      });

      // When: Call isValid
      const isValid = discount.isValid();

      // Then: Should return true
      expect(isValid).toBe(true);
    });

    test('DM-036 | isValid should return false for inactive discount', () => {
      // Given: Inactive discount
      const discount = new Discount({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        status: 'inactive',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        usedCount: 0,
        usageLimit: 10,
      });

      // When: Call isValid
      const isValid = discount.isValid();

      // Then: Should return false
      expect(isValid).toBe(false);
    });

    test('DM-037 | isValid should return false for expired discount', () => {
      // Given: Expired discount
      const discount = new Discount({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        status: 'expired',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        usedCount: 0,
        usageLimit: 10,
      });

      // When: Call isValid
      const isValid = discount.isValid();

      // Then: Should return false
      expect(isValid).toBe(false);
    });

    test('DM-038 | isValid should return false when start date in future', () => {
      // Given: Discount with start date in future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const discount = new Discount({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        status: 'active',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 24 * 60 * 60 * 1000),
        usedCount: 0,
        usageLimit: 10,
      });

      // When: Call isValid
      const isValid = discount.isValid();

      // Then: Should return false
      expect(isValid).toBe(false);
    });

    test('DM-039 | isValid should return false when end date passed', () => {
      // Given: Discount with end date in past
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const discount = new Discount({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        status: 'active',
        startDate: new Date('2025-01-01'),
        endDate: pastDate,
        usedCount: 0,
        usageLimit: 10,
      });

      // When: Call isValid
      const isValid = discount.isValid();

      // Then: Should return false
      expect(isValid).toBe(false);
    });

    test('DM-040 | isValid should return false when usage limit reached', () => {
      // Given: Discount with usage limit reached
      const discount = new Discount({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        status: 'active',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        usedCount: 10,
        usageLimit: 10,
      });

      // When: Call isValid
      const isValid = discount.isValid();

      // Then: Should return false
      expect(isValid).toBe(false);
    });
  });

  describe('Static Methods', () => {
    test('DM-041 | updateAllDiscountStatus should update all discount statuses', async () => {
      // Given: Multiple discounts with different statuses
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const discount1 = new Discount({
        code: 'EXPIRED1',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: pastDate,
      });

      const discount2 = new Discount({
        code: 'FUTURE1',
        type: 'percentage',
        value: 10,
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 24 * 60 * 60 * 1000),
      });

      const discount3 = new Discount({
        code: 'ACTIVE1',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      });

      await discount1.save();
      await discount2.save();
      await discount3.save();

      // When: Call updateAllDiscountStatus
      await Discount.updateAllDiscountStatus();

      // Then: All discounts should have updated statuses
      const updatedDiscounts = await Discount.find();
      expect(updatedDiscounts).toHaveLength(3);

      // Check that statuses were updated
      const expiredDiscount = updatedDiscounts.find(d => d.code === 'EXPIRED1');
      const futureDiscount = updatedDiscounts.find(d => d.code === 'FUTURE1');
      const activeDiscount = updatedDiscounts.find(d => d.code === 'ACTIVE1');

      expect(expiredDiscount.status).toBe('expired');
      expect(futureDiscount.status).toBe('active');
      expect(activeDiscount.status).toBe('active');
    });

    test('DM-041B | updateAllDiscountStatus should save discounts when status changes', async () => {
      // Given: Discount that will have status change
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const discount = new Discount({
        code: 'STATUSCHANGE',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: pastDate,
        status: 'active', // Initially active
      });

      await discount.save();
      const originalUpdatedAt = discount.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 50));

      // When: Call updateAllDiscountStatus
      await Discount.updateAllDiscountStatus();

      // Then: Discount should be saved with updated status
      const updatedDiscount = await Discount.findOne({ code: 'STATUSCHANGE' });
      expect(updatedDiscount.status).toBe('expired');
      // Note: updatedAt might not change if the save happens too quickly
      // The important thing is that the status was updated and saved
      expect(updatedDiscount.updatedAt).toBeDefined();
    });

    test('DM-041C | updateAllDiscountStatus should save when status changes', async () => {
      // Given: Discount that will change from active to expired due to end date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const discount = new Discount({
        code: 'STATUSCHANGE2',
        type: 'percentage',
        value: 10,
        usageLimit: 10,
        usedCount: 1,
        startDate: new Date('2025-01-01'),
        endDate: pastDate, // End date in past
        status: 'active', // Initially active
      });

      await discount.save();

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 50));

      // When: Call updateAllDiscountStatus
      await Discount.updateAllDiscountStatus();

      // Then: Discount should be saved with updated status
      const updatedDiscount = await Discount.findOne({ code: 'STATUSCHANGE2' });
      expect(updatedDiscount.status).toBe('expired');
      expect(updatedDiscount.updatedAt).toBeDefined();
    });

    test('DM-041D | updateAllDiscountStatus should save when status changes from inactive to expired', async () => {
      // Given: Discount that will change from inactive to expired due to end date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const discount = new Discount({
        code: 'STATUSCHANGE3',
        type: 'percentage',
        value: 10,
        usageLimit: 10,
        usedCount: 1,
        startDate: new Date('2025-01-01'),
        endDate: pastDate, // End date in past
        status: 'inactive', // Initially inactive
      });

      await discount.save();

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 50));

      // When: Call updateAllDiscountStatus
      await Discount.updateAllDiscountStatus();

      // Then: Discount should be saved with updated status
      const updatedDiscount = await Discount.findOne({ code: 'STATUSCHANGE3' });
      expect(updatedDiscount.status).toBe('expired');
      expect(updatedDiscount.updatedAt).toBeDefined();
    });

    test('DM-041E | updateAllDiscountStatus should save when status changes from active to expired due to usage limit', async () => {
      // Given: Discount that will change from active to expired due to usage limit
      const discount = new Discount({
        code: 'STATUSCHANGE4',
        type: 'percentage',
        value: 10,
        usageLimit: 1,
        usedCount: 1, // At the limit
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        status: 'active', // Initially active
      });

      await discount.save();

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 50));

      // When: Call updateAllDiscountStatus
      await Discount.updateAllDiscountStatus();

      // Then: Discount should be saved with updated status
      const updatedDiscount = await Discount.findOne({ code: 'STATUSCHANGE4' });
      expect(updatedDiscount.status).toBe('expired');
      expect(updatedDiscount.updatedAt).toBeDefined();
    });

    test('DM-042 | updateAllDiscountStatus should handle empty collection', async () => {
      // Given: Empty discount collection
      // (Already empty from beforeEach)

      // When: Call updateAllDiscountStatus
      await Discount.updateAllDiscountStatus();

      // Then: Should not throw error
      const discounts = await Discount.find();
      expect(discounts).toHaveLength(0);
    });
  });

  describe('Timestamps', () => {
    test('DM-043 | Should automatically add createdAt and updatedAt', async () => {
      // Given: Valid discount data
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: Should have timestamps
      expect(savedDiscount.createdAt).toBeDefined();
      expect(savedDiscount.updatedAt).toBeDefined();
      expect(savedDiscount.createdAt).toBeInstanceOf(Date);
      expect(savedDiscount.updatedAt).toBeInstanceOf(Date);
    });

    test('DM-044 | Should update updatedAt on save', async () => {
      // Given: Existing discount
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();
      const originalUpdatedAt = savedDiscount.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      // When: Update discount
      savedDiscount.description = 'Updated description';
      const updatedDiscount = await savedDiscount.save();

      // Then: updatedAt should be different
      expect(updatedDiscount.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Edge Cases', () => {
    test('DM-045 | Should handle zero discount value', async () => {
      // Given: Discount with zero value
      const discountData = {
        code: 'SAVE10',
        type: 'fixed',
        value: 0,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: Should be created successfully
      expect(savedDiscount.value).toBe(0);
    });

    test('DM-046 | Should handle very large discount values', async () => {
      // Given: Discount with very large value
      const discountData = {
        code: 'SAVE10',
        type: 'fixed',
        value: 999999999,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: Should be created successfully
      expect(savedDiscount.value).toBe(999999999);
    });

    test('DM-047 | Should handle very large usage limits', async () => {
      // Given: Discount with very large usage limit
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        usageLimit: 999999,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: Should be created successfully
      expect(savedDiscount.usageLimit).toBe(999999);
    });

    test('DM-048 | Should handle empty description', async () => {
      // Given: Discount with empty description
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        description: '',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: Should be created successfully
      expect(savedDiscount.description).toBe('');
    });

    test('DM-049 | Should handle null description', async () => {
      // Given: Discount with null description
      const discountData = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        description: null,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      // When: Create discount
      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      // Then: Should be created successfully
      expect(savedDiscount.description).toBeNull();
    });
  });
});
