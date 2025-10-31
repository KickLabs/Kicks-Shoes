/**
 * @file reward-point-service.test.js
 * @description Unit tests for rewardPoint.service.js
 * @target Coverage: >= 85% for service functions
 */

import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as rewardPointService from '../../src/services/rewardPoint.service.js';
import RewardPoint from '../../src/models/RewardPoint.js';
import User from '../../src/models/User.js';

let mongoServer;

// Setup in-memory MongoDB
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Service: createRewardPointsForOrder', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      fullName: 'Test User',
      username: `testuser${Date.now()}`,
      role: 'customer',
    });
  });

  test('RWD-UNIT-001 | Should create reward points for valid paid order', async () => {
    // Given: Order with totalPrice = 1,000,000 VND
    const order = {
      _id: new mongoose.Types.ObjectId(),
      user: testUser._id,
      totalPrice: 1000000,
      orderNumber: 'ORD001',
    };

    // When: Call createRewardPointsForOrder
    const rewardPoint = await rewardPointService.createRewardPointsForOrder(order);

    // Then: Verify points calculation
    expect(rewardPoint).toBeDefined();
    expect(rewardPoint.user.toString()).toBe(testUser._id.toString());
    expect(rewardPoint.points).toBe(100); // 1,000,000 / 10,000
    expect(rewardPoint.type).toBe('earn');
    expect(rewardPoint.status).toBe('active');
    expect(rewardPoint.order.toString()).toBe(order._id.toString());
    expect(rewardPoint.description).toContain('ORD001');
    expect(rewardPoint.expiryDate).toBeDefined();

    // Verify expiry date is approximately +1 year
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    const diff = Math.abs(rewardPoint.expiryDate.getTime() - oneYearLater.getTime());
    expect(diff).toBeLessThan(5000); // Within 5 seconds tolerance
  });

  test('RWD-UNIT-002 | Should calculate points for large order', async () => {
    // Given: Order with totalPrice = 5,000,000 VND
    const order = {
      _id: new mongoose.Types.ObjectId(),
      user: testUser._id,
      totalPrice: 5000000,
      orderNumber: 'ORD002',
    };

    // When: Call createRewardPointsForOrder
    const rewardPoint = await rewardPointService.createRewardPointsForOrder(order);

    // Then: Verify calculation
    expect(rewardPoint.points).toBe(500); // 5,000,000 / 10,000
  });

  test('RWD-UNIT-003 | Should return null for order below minimum threshold', async () => {
    // Given: Order with totalPrice = 9,999 VND
    const order = {
      _id: new mongoose.Types.ObjectId(),
      user: testUser._id,
      totalPrice: 9999,
      orderNumber: 'ORD003',
    };

    // When: Call createRewardPointsForOrder
    const rewardPoint = await rewardPointService.createRewardPointsForOrder(order);

    // Then: Verify no points created
    expect(rewardPoint).toBeNull();
  });

  test('RWD-UNIT-004 | Should earn 1 point for order at exact threshold', async () => {
    // Given: Order with totalPrice = 10,000 VND
    const order = {
      _id: new mongoose.Types.ObjectId(),
      user: testUser._id,
      totalPrice: 10000,
      orderNumber: 'ORD004',
    };

    // When: Call createRewardPointsForOrder
    const rewardPoint = await rewardPointService.createRewardPointsForOrder(order);

    // Then: Verify 1 point earned
    expect(rewardPoint.points).toBe(1);
  });

  test('RWD-UNIT-005 | Should return null for order with zero total price', async () => {
    // Given: Order with totalPrice = 0
    const order = {
      _id: new mongoose.Types.ObjectId(),
      user: testUser._id,
      totalPrice: 0,
      orderNumber: 'ORD005',
    };

    // When: Call createRewardPointsForOrder
    const rewardPoint = await rewardPointService.createRewardPointsForOrder(order);

    // Then: Verify no points created
    expect(rewardPoint).toBeNull();
  });

  test('RWD-UNIT-006 | Should return null for order with negative total price', async () => {
    // Given: Order with totalPrice = -1000
    const order = {
      _id: new mongoose.Types.ObjectId(),
      user: testUser._id,
      totalPrice: -1000,
      orderNumber: 'ORD006',
    };

    // When: Call createRewardPointsForOrder
    const rewardPoint = await rewardPointService.createRewardPointsForOrder(order);

    // Then: Verify no points created
    expect(rewardPoint).toBeNull();
  });

  test('RWD-UNIT-007 | Should calculate from fallback when totalPrice missing', async () => {
    // Given: Order without totalPrice field
    const order = {
      _id: new mongoose.Types.ObjectId(),
      user: testUser._id,
      subtotal: 950000,
      shippingCost: 50000,
      tax: 0,
      discount: 0,
      orderNumber: 'ORD007',
    };

    // When: Call createRewardPointsForOrder
    const rewardPoint = await rewardPointService.createRewardPointsForOrder(order);

    // Then: Calculate totalPrice = 1,000,000, points = 100
    expect(rewardPoint).toBeDefined();
    expect(rewardPoint.points).toBe(100);
  });

  test('RWD-UNIT-008 | Should return null when fallback calculation results in zero', async () => {
    // Given: Order with all amounts = 0
    const order = {
      _id: new mongoose.Types.ObjectId(),
      user: testUser._id,
      subtotal: 0,
      shippingCost: 0,
      orderNumber: 'ORD008',
    };

    // When: Call createRewardPointsForOrder
    const rewardPoint = await rewardPointService.createRewardPointsForOrder(order);

    // Then: Return null
    expect(rewardPoint).toBeNull();
  });

  test('RWD-UNIT-009 | Should throw error when database fails', async () => {
    // Given: Valid order, but mock RewardPoint.create to throw error
    const order = {
      _id: new mongoose.Types.ObjectId(),
      user: testUser._id,
      totalPrice: 1000000,
      orderNumber: 'ORD009',
    };

    // Mock RewardPoint.create to throw error
    const originalCreate = RewardPoint.create;
    RewardPoint.create = jest.fn().mockRejectedValue(new Error('Database error'));

    // When/Then: Expect error to be thrown
    await expect(rewardPointService.createRewardPointsForOrder(order)).rejects.toThrow(
      'Database error'
    );

    // Restore original
    RewardPoint.create = originalCreate;
  });

  test('RWD-UNIT-010 | Should handle decimal total price with Math.floor', async () => {
    // Given: Order with totalPrice = 1,234,567.89
    const order = {
      _id: new mongoose.Types.ObjectId(),
      user: testUser._id,
      totalPrice: 1234567.89,
      orderNumber: 'ORD010',
    };

    // When: Call createRewardPointsForOrder
    const rewardPoint = await rewardPointService.createRewardPointsForOrder(order);

    // Then: Points = Math.floor(1234567.89 / 10000) = 123
    expect(rewardPoint.points).toBe(123);
  });

  test('RWD-UNIT-011 | Should handle NaN totalPrice', async () => {
    // Given: Order with NaN totalPrice
    const order = {
      _id: new mongoose.Types.ObjectId(),
      user: testUser._id,
      totalPrice: NaN,
      subtotal: 1000000,
      orderNumber: 'ORD011',
    };

    // When: Call createRewardPointsForOrder (should use fallback)
    const rewardPoint = await rewardPointService.createRewardPointsForOrder(order);

    // Then: Use fallback calculation
    expect(rewardPoint).toBeDefined();
    expect(rewardPoint.points).toBe(100);
  });

  test('RWD-UNIT-012 | Should handle string totalPrice (invalid type)', async () => {
    // Given: Order with string totalPrice
    const order = {
      _id: new mongoose.Types.ObjectId(),
      user: testUser._id,
      totalPrice: 'invalid',
      subtotal: 1000000,
      orderNumber: 'ORD012',
    };

    // When: Call createRewardPointsForOrder (should use fallback)
    const rewardPoint = await rewardPointService.createRewardPointsForOrder(order);

    // Then: Use fallback calculation
    expect(rewardPoint).toBeDefined();
    expect(rewardPoint.points).toBe(100);
  });
});

describe('Service: getUserTotalPoints', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      fullName: 'Test User',
      username: `testuser${Date.now()}`,
      role: 'customer',
    });
  });

  test('RWD-UNIT-013 | Should calculate total for user with active points', async () => {
    // Given: User has earned 100 points
    await RewardPoint.create({
      user: testUser._id,
      points: 100,
      type: 'earn',
      status: 'active',
      description: 'Test earn',
    });

    // When: Call getUserTotalPoints
    const totals = await rewardPointService.getUserTotalPoints(testUser._id.toString());

    // Then: Return correct totals
    expect(totals.totalEarned).toBe(100);
    expect(totals.totalRedeemed).toBe(0);
    expect(totals.totalExpired).toBe(0);
    expect(totals.availablePoints).toBe(100);
  });

  test('RWD-UNIT-014 | Should calculate total with redemptions', async () => {
    // Given: User earned 100, redeemed 30
    await RewardPoint.create({
      user: testUser._id,
      points: 100,
      type: 'earn',
      status: 'active',
      description: 'Test earn',
    });
    await RewardPoint.create({
      user: testUser._id,
      points: -30,
      type: 'redeem',
      status: 'redeemed',
      description: 'Test redeem',
    });

    // When: Call getUserTotalPoints
    const totals = await rewardPointService.getUserTotalPoints(testUser._id.toString());

    // Then: Calculate available
    expect(totals.totalEarned).toBe(100);
    expect(totals.totalRedeemed).toBe(30);
    expect(totals.availablePoints).toBe(70);
  });

  test('RWD-UNIT-015 | Should calculate total with expired points', async () => {
    // Given: User earned 100, expired 20
    await RewardPoint.create({
      user: testUser._id,
      points: 100,
      type: 'earn',
      status: 'active',
      description: 'Test earn',
    });
    await RewardPoint.create({
      user: testUser._id,
      points: 20,
      type: 'expire',
      status: 'expired',
      description: 'Test expire',
    });

    // When: Call getUserTotalPoints
    const totals = await rewardPointService.getUserTotalPoints(testUser._id.toString());

    // Then: Deduct expired
    expect(totals.totalEarned).toBe(100);
    expect(totals.totalExpired).toBe(20);
    expect(totals.availablePoints).toBe(80);
  });

  test('RWD-UNIT-016 | Should calculate total with all types', async () => {
    // Given: earned 200, redeemed 50, expired 30
    await RewardPoint.create({
      user: testUser._id,
      points: 200,
      type: 'earn',
      status: 'active',
      description: 'Test earn',
    });
    await RewardPoint.create({
      user: testUser._id,
      points: -50,
      type: 'redeem',
      status: 'redeemed',
      description: 'Test redeem',
    });
    await RewardPoint.create({
      user: testUser._id,
      points: 30,
      type: 'expire',
      status: 'expired',
      description: 'Test expire',
    });

    // When: Calculate total
    const totals = await rewardPointService.getUserTotalPoints(testUser._id.toString());

    // Then: Available = earned - redeemed - expired
    expect(totals.totalEarned).toBe(200);
    expect(totals.totalRedeemed).toBe(50);
    expect(totals.totalExpired).toBe(30);
    expect(totals.availablePoints).toBe(120);
  });

  test('RWD-UNIT-017 | Should return zeros for user with no points', async () => {
    // Given: User never earned points
    // When: Call getUserTotalPoints
    const totals = await rewardPointService.getUserTotalPoints(testUser._id.toString());

    // Then: Return all zeros
    expect(totals.totalEarned).toBe(0);
    expect(totals.totalRedeemed).toBe(0);
    expect(totals.totalExpired).toBe(0);
    expect(totals.availablePoints).toBe(0);
  });

  test('RWD-UNIT-018 | Should prevent negative balance with Math.max', async () => {
    // Given: earned 10, redeemed 20 (via adjust - edge case)
    await RewardPoint.create({
      user: testUser._id,
      points: 10,
      type: 'earn',
      status: 'active',
      description: 'Test earn',
    });
    await RewardPoint.create({
      user: testUser._id,
      points: -20,
      type: 'redeem',
      status: 'redeemed',
      description: 'Test over-redeem',
    });

    // When: Calculate available
    const totals = await rewardPointService.getUserTotalPoints(testUser._id.toString());

    // Then: Return 0 (not negative)
    expect(totals.availablePoints).toBe(0);
  });

  test('RWD-UNIT-019 | Should throw error for invalid userId format', async () => {
    // Given: Invalid userId string
    const invalidUserId = 'invalid_string';

    // When/Then: Expect error to be thrown
    await expect(rewardPointService.getUserTotalPoints(invalidUserId)).rejects.toThrow();
  });

  test('RWD-UNIT-020 | Should return zeros for non-existent user', async () => {
    // Given: Valid ObjectId but user doesn't exist
    const nonExistentUserId = new mongoose.Types.ObjectId();

    // When: Call getUserTotalPoints
    const totals = await rewardPointService.getUserTotalPoints(nonExistentUserId.toString());

    // Then: Return all zeros (no error)
    expect(totals.totalEarned).toBe(0);
    expect(totals.totalRedeemed).toBe(0);
    expect(totals.totalExpired).toBe(0);
    expect(totals.availablePoints).toBe(0);
  });

  test('RWD-UNIT-021 | Should only count active earned points', async () => {
    // Given: earned points with mixed statuses
    await RewardPoint.create({
      user: testUser._id,
      points: 80,
      type: 'earn',
      status: 'active',
      description: 'Active earn',
    });
    await RewardPoint.create({
      user: testUser._id,
      points: 20,
      type: 'earn',
      status: 'expired',
      description: 'Expired earn',
    });

    // When: Calculate total
    const totals = await rewardPointService.getUserTotalPoints(testUser._id.toString());

    // Then: Only count active earned points
    expect(totals.totalEarned).toBe(80);
  });

  test('RWD-UNIT-022 | Should handle multiple earn transactions', async () => {
    // Given: Multiple earn records
    await RewardPoint.create({
      user: testUser._id,
      points: 50,
      type: 'earn',
      status: 'active',
      description: 'Earn 1',
    });
    await RewardPoint.create({
      user: testUser._id,
      points: 30,
      type: 'earn',
      status: 'active',
      description: 'Earn 2',
    });
    await RewardPoint.create({
      user: testUser._id,
      points: 20,
      type: 'earn',
      status: 'active',
      description: 'Earn 3',
    });

    // When: Calculate total
    const totals = await rewardPointService.getUserTotalPoints(testUser._id.toString());

    // Then: Sum all earn points
    expect(totals.totalEarned).toBe(100);
  });
});

describe('Service: hasOrderEarnedRewardPoints', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      fullName: 'Test User',
      username: `testuser${Date.now()}`,
      role: 'customer',
    });
  });

  test('RWD-UNIT-023 | Should return true for order that has earned points', async () => {
    // Given: Order already has reward points
    const orderId = new mongoose.Types.ObjectId();
    await RewardPoint.create({
      user: testUser._id,
      points: 100,
      type: 'earn',
      order: orderId,
      description: 'Test earn',
    });

    // When: Call hasOrderEarnedRewardPoints
    const result = await rewardPointService.hasOrderEarnedRewardPoints(orderId);

    // Then: Return true
    expect(result).toBe(true);
  });

  test('RWD-UNIT-024 | Should return false for order that has not earned points', async () => {
    // Given: New order without reward points
    const orderId = new mongoose.Types.ObjectId();

    // When: Call hasOrderEarnedRewardPoints
    const result = await rewardPointService.hasOrderEarnedRewardPoints(orderId);

    // Then: Return false
    expect(result).toBe(false);
  });

  test('RWD-UNIT-025 | Should return false for invalid orderId', async () => {
    // Given: Invalid orderId
    const invalidOrderId = 'invalid_string';

    // When: Call hasOrderEarnedRewardPoints
    const result = await rewardPointService.hasOrderEarnedRewardPoints(invalidOrderId);

    // Then: Return false (caught error)
    expect(result).toBe(false);
  });

  test('RWD-UNIT-026 | Should return true if duplicate earn records exist', async () => {
    // Given: Order has 2+ earn records (bug scenario)
    const orderId = new mongoose.Types.ObjectId();
    await RewardPoint.create({
      user: testUser._id,
      points: 100,
      type: 'earn',
      order: orderId,
      description: 'First earn',
    });
    await RewardPoint.create({
      user: testUser._id,
      points: 100,
      type: 'earn',
      order: orderId,
      description: 'Duplicate earn',
    });

    // When: Call hasOrderEarnedRewardPoints
    const result = await rewardPointService.hasOrderEarnedRewardPoints(orderId);

    // Then: Return true (found at least one)
    expect(result).toBe(true);
  });

  test('RWD-UNIT-027 | Should only check for earn type, not other types', async () => {
    // Given: Order has adjust record but no earn record
    const orderId = new mongoose.Types.ObjectId();
    await RewardPoint.create({
      user: testUser._id,
      points: -100,
      type: 'adjust',
      order: orderId,
      description: 'Adjustment',
    });

    // When: Call hasOrderEarnedRewardPoints
    const result = await rewardPointService.hasOrderEarnedRewardPoints(orderId);

    // Then: Return false (no earn type found)
    expect(result).toBe(false);
  });
});

describe('Service: deductRewardPointsForOrder', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      fullName: 'Test User',
      username: `testuser${Date.now()}`,
      role: 'customer',
    });
  });

  test('RWD-UNIT-028 | Should deduct points for refunded order', async () => {
    // Given: Order earned 50 points
    const orderId = new mongoose.Types.ObjectId();
    await RewardPoint.create({
      user: testUser._id,
      points: 50,
      type: 'earn',
      order: orderId,
      description: 'Original earn',
    });

    const order = {
      _id: orderId,
      user: testUser._id,
      orderNumber: 'ORD001',
    };

    // When: Call deductRewardPointsForOrder
    const adjustment = await rewardPointService.deductRewardPointsForOrder(order);

    // Then: Create adjustment record
    expect(adjustment).toBeDefined();
    expect(adjustment.type).toBe('adjust');
    expect(adjustment.points).toBe(-50);
    expect(adjustment.user.toString()).toBe(testUser._id.toString());
    expect(adjustment.order.toString()).toBe(orderId.toString());
    expect(adjustment.description).toContain('refund/cancel');
    expect(adjustment.status).toBe('active');
  });

  test('RWD-UNIT-029 | Should return null for order with no earned points', async () => {
    // Given: Order has no reward points
    const order = {
      _id: new mongoose.Types.ObjectId(),
      user: testUser._id,
      orderNumber: 'ORD002',
    };

    // When: Call deductRewardPointsForOrder
    const adjustment = await rewardPointService.deductRewardPointsForOrder(order);

    // Then: Return null (no action)
    expect(adjustment).toBeNull();
  });

  test('RWD-UNIT-030 | Should create duplicate adjustment if called twice (no idempotency)', async () => {
    // Given: Order already has adjustment
    const orderId = new mongoose.Types.ObjectId();
    await RewardPoint.create({
      user: testUser._id,
      points: 100,
      type: 'earn',
      order: orderId,
      description: 'Original earn',
    });

    const order = {
      _id: orderId,
      user: testUser._id,
      orderNumber: 'ORD003',
    };

    // When: Call deductRewardPointsForOrder twice
    const adjustment1 = await rewardPointService.deductRewardPointsForOrder(order);
    const adjustment2 = await rewardPointService.deductRewardPointsForOrder(order);

    // Then: Both succeed (current behavior - potential bug)
    expect(adjustment1).toBeDefined();
    expect(adjustment2).toBeDefined();
    expect(adjustment1._id.toString()).not.toBe(adjustment2._id.toString());
  });

  test('RWD-UNIT-031 | Should throw error when database fails', async () => {
    // Given: Valid order with earned points
    const orderId = new mongoose.Types.ObjectId();
    await RewardPoint.create({
      user: testUser._id,
      points: 50,
      type: 'earn',
      order: orderId,
      description: 'Original earn',
    });

    const order = {
      _id: orderId,
      user: testUser._id,
      orderNumber: 'ORD004',
    };

    // Mock RewardPoint.create to throw error
    const originalCreate = RewardPoint.create;
    RewardPoint.create = jest.fn().mockRejectedValue(new Error('Database error'));

    // When/Then: Expect error to be thrown
    await expect(rewardPointService.deductRewardPointsForOrder(order)).rejects.toThrow(
      'Database error'
    );

    // Restore original
    RewardPoint.create = originalCreate;
  });

  test('RWD-UNIT-032 | Should use Math.abs to ensure negative deduction', async () => {
    // Given: Order earned positive points
    const orderId = new mongoose.Types.ObjectId();
    await RewardPoint.create({
      user: testUser._id,
      points: 100,
      type: 'earn',
      order: orderId,
      description: 'Original earn',
    });

    const order = {
      _id: orderId,
      user: testUser._id,
      orderNumber: 'ORD005',
    };

    // When: Deduct points
    const adjustment = await rewardPointService.deductRewardPointsForOrder(order);

    // Then: Points should be negative
    expect(adjustment.points).toBe(-100);
    expect(adjustment.points).toBeLessThan(0);
  });
});
