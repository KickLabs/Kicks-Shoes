/**
 * @file reward-point-model.test.js
 * @description Unit tests for RewardPoint model
 * @target Coverage: 100% for RewardPoint model
 */

import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
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

describe('RewardPoint Model - Schema Validations', () => {
  let testUser;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      fullName: 'Test User',
      username: `testuser${Date.now()}`,
      role: 'customer',
    });
  });

  test('RWD-MODEL-001 | Should create reward point with valid data', async () => {
    // Given: Valid reward point data
    const rewardData = {
      user: testUser._id,
      points: 100,
      type: 'earn',
      description: 'Test reward points',
    };

    // When: Create reward point
    const rewardPoint = await RewardPoint.create(rewardData);

    // Then: Verify creation
    expect(rewardPoint).toBeDefined();
    expect(rewardPoint.user.toString()).toBe(testUser._id.toString());
    expect(rewardPoint.points).toBe(100);
    expect(rewardPoint.type).toBe('earn');
    expect(rewardPoint.status).toBe('active'); // Default status
  });

  test('RWD-MODEL-002 | Should require user field', async () => {
    // Given: Reward point without user
    const rewardData = {
      points: 100,
      type: 'earn',
      description: 'Test points',
    };

    // When/Then: Expect validation error
    await expect(RewardPoint.create(rewardData)).rejects.toThrow(/User is required/);
  });

  test('RWD-MODEL-003 | Should require points field', async () => {
    // Given: Reward point without points
    const rewardData = {
      user: testUser._id,
      type: 'earn',
      description: 'Test points',
    };

    // When/Then: Expect validation error
    await expect(RewardPoint.create(rewardData)).rejects.toThrow(/Points are required/);
  });

  test('RWD-MODEL-004 | Should require type field', async () => {
    // Given: Reward point without type
    const rewardData = {
      user: testUser._id,
      points: 100,
      description: 'Test points',
    };

    // When/Then: Expect validation error
    await expect(RewardPoint.create(rewardData)).rejects.toThrow(/Type is required/);
  });

  test('RWD-MODEL-005 | Should validate type enum', async () => {
    // Given: Reward point with invalid type
    const rewardData = {
      user: testUser._id,
      points: 100,
      type: 'invalid_type',
      description: 'Test points',
    };

    // When/Then: Expect validation error
    await expect(RewardPoint.create(rewardData)).rejects.toThrow(/is not a valid enum value/);
  });

  test('RWD-MODEL-006 | Should accept all valid type values', async () => {
    // Given: All valid type values
    const types = ['earn', 'redeem', 'expire', 'adjust'];

    // When: Create reward points with each type
    for (const type of types) {
      const rewardPoint = await RewardPoint.create({
        user: testUser._id,
        points: type === 'redeem' ? -50 : 50,
        type,
        description: `Test ${type}`,
      });

      // Then: Verify creation
      expect(rewardPoint.type).toBe(type);
    }
  });

  test('RWD-MODEL-007 | Should require description field', async () => {
    // Given: Reward point without description
    const rewardData = {
      user: testUser._id,
      points: 100,
      type: 'earn',
    };

    // When/Then: Expect validation error
    await expect(RewardPoint.create(rewardData)).rejects.toThrow(/Description is required/);
  });

  test('RWD-MODEL-008 | Should validate status enum', async () => {
    // Given: Reward point with invalid status
    const rewardData = {
      user: testUser._id,
      points: 100,
      type: 'earn',
      description: 'Test points',
      status: 'invalid_status',
    };

    // When/Then: Expect validation error
    await expect(RewardPoint.create(rewardData)).rejects.toThrow(/is not a valid enum value/);
  });

  test('RWD-MODEL-009 | Should accept all valid status values', async () => {
    // Given: All valid status values
    const statuses = ['active', 'expired', 'redeemed'];

    // When: Create reward points with each status
    for (const status of statuses) {
      const rewardPoint = await RewardPoint.create({
        user: testUser._id,
        points: 50,
        type: 'earn',
        description: `Test ${status}`,
        status,
      });

      // Then: Verify creation
      expect(rewardPoint.status).toBe(status);
    }
  });

  test('RWD-MODEL-010 | Should default status to active', async () => {
    // Given: Reward point without status
    const rewardData = {
      user: testUser._id,
      points: 100,
      type: 'earn',
      description: 'Test points',
    };

    // When: Create reward point
    const rewardPoint = await RewardPoint.create(rewardData);

    // Then: Verify default status
    expect(rewardPoint.status).toBe('active');
  });

  test('RWD-MODEL-011 | Should allow optional order field', async () => {
    // Given: Reward point with order reference
    // Using ObjectId directly since Order schema has complex validation
    const orderId = new mongoose.Types.ObjectId();

    const rewardData = {
      user: testUser._id,
      points: 100,
      type: 'earn',
      description: 'Test points',
      order: orderId,
    };

    // When: Create reward point
    const rewardPoint = await RewardPoint.create(rewardData);

    // Then: Verify order reference
    expect(rewardPoint.order.toString()).toBe(orderId.toString());
  });

  test('RWD-MODEL-012 | Should allow optional expiryDate field', async () => {
    // Given: Reward point with expiry date
    const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // +1 year
    const rewardData = {
      user: testUser._id,
      points: 100,
      type: 'earn',
      description: 'Test points',
      expiryDate,
    };

    // When: Create reward point
    const rewardPoint = await RewardPoint.create(rewardData);

    // Then: Verify expiry date
    expect(rewardPoint.expiryDate).toEqual(expiryDate);
  });

  test('RWD-MODEL-013 | Should allow negative points for redeem/adjust', async () => {
    // Given: Reward point with negative points
    const rewardData = {
      user: testUser._id,
      points: -50,
      type: 'redeem',
      description: 'Points redeemed',
      status: 'redeemed',
    };

    // When: Create reward point
    const rewardPoint = await RewardPoint.create(rewardData);

    // Then: Verify negative points
    expect(rewardPoint.points).toBe(-50);
  });

  test('RWD-MODEL-014 | Should accept zero points', async () => {
    // Given: Reward point with zero points
    const rewardData = {
      user: testUser._id,
      points: 0,
      type: 'adjust',
      description: 'Zero adjustment',
    };

    // When: Create reward point
    const rewardPoint = await RewardPoint.create(rewardData);

    // Then: Verify zero points
    expect(rewardPoint.points).toBe(0);
  });

  test('RWD-MODEL-015 | Should create timestamps automatically', async () => {
    // Given: Reward point data
    const rewardData = {
      user: testUser._id,
      points: 100,
      type: 'earn',
      description: 'Test points',
    };

    // When: Create reward point
    const rewardPoint = await RewardPoint.create(rewardData);

    // Then: Verify timestamps
    expect(rewardPoint.createdAt).toBeDefined();
    expect(rewardPoint.updatedAt).toBeDefined();
    expect(rewardPoint.createdAt instanceof Date).toBe(true);
    expect(rewardPoint.updatedAt instanceof Date).toBe(true);
  });
});

describe('RewardPoint Model - Pre-save Hook', () => {
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

  test('RWD-MODEL-016 | Should auto-set expiryDate for earn type (+1 year)', async () => {
    // Given: Earn type reward without expiryDate
    const beforeCreate = new Date();
    const rewardData = {
      user: testUser._id,
      points: 100,
      type: 'earn',
      description: 'Test points',
      // No expiryDate provided
    };

    // When: Create reward point
    const rewardPoint = await RewardPoint.create(rewardData);
    const afterCreate = new Date();

    // Then: Verify expiryDate is set to +1 year
    expect(rewardPoint.expiryDate).toBeDefined();

    const expectedMinExpiry = new Date(beforeCreate);
    expectedMinExpiry.setFullYear(expectedMinExpiry.getFullYear() + 1);

    const expectedMaxExpiry = new Date(afterCreate);
    expectedMaxExpiry.setFullYear(expectedMaxExpiry.getFullYear() + 1);

    expect(rewardPoint.expiryDate.getTime()).toBeGreaterThanOrEqual(
      expectedMinExpiry.getTime() - 1000
    ); // Allow 1s tolerance
    expect(rewardPoint.expiryDate.getTime()).toBeLessThanOrEqual(
      expectedMaxExpiry.getTime() + 1000
    );
  });

  test('RWD-MODEL-017 | Should NOT auto-set expiryDate if already provided', async () => {
    // Given: Earn type with custom expiryDate
    const customExpiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // +6 months
    const rewardData = {
      user: testUser._id,
      points: 100,
      type: 'earn',
      description: 'Test points',
      expiryDate: customExpiry,
    };

    // When: Create reward point
    const rewardPoint = await RewardPoint.create(rewardData);

    // Then: Verify custom expiryDate is preserved
    expect(rewardPoint.expiryDate.getTime()).toBe(customExpiry.getTime());
  });

  test('RWD-MODEL-018 | Should NOT set expiryDate for redeem type', async () => {
    // Given: Redeem type without expiryDate
    const rewardData = {
      user: testUser._id,
      points: -50,
      type: 'redeem',
      description: 'Points redeemed',
      status: 'redeemed',
    };

    // When: Create reward point
    const rewardPoint = await RewardPoint.create(rewardData);

    // Then: Verify expiryDate is not set
    expect(rewardPoint.expiryDate).toBeUndefined();
  });

  test('RWD-MODEL-019 | Should NOT set expiryDate for expire type', async () => {
    // Given: Expire type without expiryDate
    const rewardData = {
      user: testUser._id,
      points: 0,
      type: 'expire',
      description: 'Points expired',
      status: 'expired',
    };

    // When: Create reward point
    const rewardPoint = await RewardPoint.create(rewardData);

    // Then: Verify expiryDate is not set
    expect(rewardPoint.expiryDate).toBeUndefined();
  });

  test('RWD-MODEL-020 | Should NOT set expiryDate for adjust type', async () => {
    // Given: Adjust type without expiryDate
    const rewardData = {
      user: testUser._id,
      points: -100,
      type: 'adjust',
      description: 'Points adjustment',
    };

    // When: Create reward point
    const rewardPoint = await RewardPoint.create(rewardData);

    // Then: Verify expiryDate is not set
    expect(rewardPoint.expiryDate).toBeUndefined();
  });
});

describe('RewardPoint Model - Indexes', () => {
  test('RWD-MODEL-021 | Should have user index', async () => {
    // Given: RewardPoint model
    const indexes = RewardPoint.schema.indexes();

    // Then: Verify user index exists
    const userIndex = indexes.find(idx => idx[0].user === 1);
    expect(userIndex).toBeDefined();
  });

  test('RWD-MODEL-022 | Should have order index', async () => {
    // Given: RewardPoint model
    const indexes = RewardPoint.schema.indexes();

    // Then: Verify order index exists
    const orderIndex = indexes.find(idx => idx[0].order === 1);
    expect(orderIndex).toBeDefined();
  });

  test('RWD-MODEL-023 | Should have type index', async () => {
    // Given: RewardPoint model
    const indexes = RewardPoint.schema.indexes();

    // Then: Verify type index exists
    const typeIndex = indexes.find(idx => idx[0].type === 1);
    expect(typeIndex).toBeDefined();
  });

  test('RWD-MODEL-024 | Should have status index', async () => {
    // Given: RewardPoint model
    const indexes = RewardPoint.schema.indexes();

    // Then: Verify status index exists
    const statusIndex = indexes.find(idx => idx[0].status === 1);
    expect(statusIndex).toBeDefined();
  });

  test('RWD-MODEL-025 | Should have expiryDate index', async () => {
    // Given: RewardPoint model
    const indexes = RewardPoint.schema.indexes();

    // Then: Verify expiryDate index exists
    const expiryIndex = indexes.find(idx => idx[0].expiryDate === 1);
    expect(expiryIndex).toBeDefined();
  });
});
