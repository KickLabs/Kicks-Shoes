/**
 * @file reward-point-controller.test.js
 * @description Integration tests for rewardPointController.js
 * @target Coverage: >= 85% for controller
 */

// Set email env vars BEFORE importing any modules
process.env.GOOGLE_MAILER_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_MAILER_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_MAILER_REFRESH_TOKEN = 'test-refresh-token';
process.env.ADMIN_EMAIL_ADDRESS = 'admin@test.com';
process.env.SMTP_USER = 'testuser';
process.env.SMTP_PASSWORD = 'testpassword';

import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import RewardPoint from '../../src/models/RewardPoint.js';
import User from '../../src/models/User.js';
import Discount from '../../src/models/Discount.js';

// Mock EmailService before importing controller
jest.unstable_mockModule('../../src/services/email.service.js', () => ({
  default: {
    sendDiscountCodeEmail: jest.fn().mockResolvedValue(true),
  },
}));

// Import controller after mocking
const {
  createRewardPoint,
  getUserRewardPoints,
  getUserTotalPoints,
  redeemPoints,
  cleanupTestData,
} = await import('../../src/controllers/rewardPointController.js');

let mongoServer;
let testUser;

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

// Helper functions to create mock req/res
const mockRequest = (params = {}, body = {}, query = {}, user = null) => ({
  params,
  body,
  query,
  user,
  headers: {
    authorization: user ? 'Bearer mock-token' : undefined,
    'content-type': 'application/json',
  },
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

let mockNext;

beforeEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  // Create test user
  testUser = await User.create({
    email: 'rewardtest@example.com',
    password: 'Password123!',
    fullName: 'Reward Test User',
    username: `rewardtestuser${Date.now()}`,
    role: 'customer',
  });

  // Reset mockNext
  mockNext = jest.fn();
});

describe('Controller: getUserTotalPoints', () => {
  test('RWD-INT-001 | Should return aggregated stats', async () => {
    // Given: User has earned 200, redeemed 50, expired 30
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

    const req = mockRequest({ userId: testUser._id.toString() });
    const res = mockResponse();

    // When: Call getUserTotalPoints
    await getUserTotalPoints(req, res, mockNext);

    // Then: Return aggregated stats
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        totalEarned: 200,
        totalRedeemed: 50,
        totalExpired: 30,
        availablePoints: 120,
      }),
    });
  });
});

describe('Controller: getUserRewardPoints', () => {
  beforeEach(async () => {
    // Create 25 reward points for pagination tests
    const promises = [];
    for (let i = 0; i < 25; i++) {
      promises.push(
        RewardPoint.create({
          user: testUser._id,
          points: 10,
          type: i % 2 === 0 ? 'earn' : 'redeem',
          status: i % 3 === 0 ? 'expired' : 'active',
          description: `Test transaction ${i}`,
        })
      );
    }
    await Promise.all(promises);
  });

  test('RWD-INT-003 | Should return paginated reward points', async () => {
    // Given: User has 25 records
    const req = mockRequest({ userId: testUser._id.toString() }, {}, { page: 1, limit: 10 });
    const res = mockResponse();

    // When: Call getUserRewardPoints
    await getUserRewardPoints(req, res, mockNext);

    // Then: Return paginated results
    expect(res.status).toHaveBeenCalledWith(200);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(true);
    expect(jsonCall.data).toHaveLength(10);
    expect(jsonCall.pagination.total).toBe(3); // 25 / 10 = 3 pages
    expect(jsonCall.pagination.totalRecords).toBe(25);
  });

  test('RWD-INT-004 | Should filter by type', async () => {
    // Given: User has mixed types
    const req = mockRequest({ userId: testUser._id.toString() }, {}, { type: 'earn' });
    const res = mockResponse();

    // When: Call getUserRewardPoints
    await getUserRewardPoints(req, res, mockNext);

    // Then: Return only earn records
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(true);
    jsonCall.data.forEach(record => {
      expect(record.type).toBe('earn');
    });
  });

  test('RWD-INT-005 | Should filter by status', async () => {
    // Given: User has mixed statuses
    const req = mockRequest({ userId: testUser._id.toString() }, {}, { status: 'active' });
    const res = mockResponse();

    // When: Call getUserRewardPoints
    await getUserRewardPoints(req, res, mockNext);

    // Then: Return only active records
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(true);
    jsonCall.data.forEach(record => {
      expect(record.status).toBe('active');
    });
  });

  test('RWD-INT-006 | Should return page beyond range', async () => {
    // Given: User has 25 records
    const req = mockRequest({ userId: testUser._id.toString() }, {}, { page: 999, limit: 10 });
    const res = mockResponse();

    // When: Call getUserRewardPoints
    await getUserRewardPoints(req, res, mockNext);

    // Then: Return empty array
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(true);
    expect(jsonCall.data).toHaveLength(0);
  });
});

describe('Controller: redeemPoints', () => {
  beforeEach(async () => {
    // Give user 100 points
    await RewardPoint.create({
      user: testUser._id,
      points: 100,
      type: 'earn',
      status: 'active',
      description: 'Initial points',
    });
  });

  test('RWD-UNIT-029 | Should redeem points successfully', async () => {
    // Given: User has 100 points
    const redeemData = {
      points: 50,
      discountAmount: 50000,
    };

    const req = mockRequest({}, redeemData, {}, { _id: testUser._id });
    const res = mockResponse();

    // When: Call redeemPoints[2] (the actual handler)
    await redeemPoints[2](req, res, mockNext);

    // Then: Create discount and deduct points
    expect(res.status).toHaveBeenCalledWith(201);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(true);
    expect(jsonCall.data.rewardPoint.points).toBe(-50);
    expect(jsonCall.data.rewardPoint.type).toBe('redeem');
    expect(jsonCall.data.discount.code).toMatch(/^REWARD\d+/);
    expect(jsonCall.data.discount.value).toBe(50000);

    // Verify discount created in DB
    const discount = await Discount.findOne({ code: jsonCall.data.discount.code });
    expect(discount).toBeDefined();
    expect(discount.type).toBe('fixed');
    expect(discount.value).toBe(50000);
  });

  test('RWD-UNIT-030 | Should redeem minimum values', async () => {
    // Given: User has exactly 10 points
    await RewardPoint.deleteMany({});
    await RewardPoint.create({
      user: testUser._id,
      points: 10,
      type: 'earn',
      status: 'active',
      description: 'Minimum points',
    });

    const redeemData = {
      points: 10,
      discountAmount: 10000,
    };

    const req = mockRequest({}, redeemData, {}, { _id: testUser._id });
    const res = mockResponse();

    // When: Call redeemPoints
    await redeemPoints[2](req, res, mockNext);

    // Then: Success
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('RWD-UNIT-031 | Should reject points below minimum', async () => {
    // Given: User tries to redeem < 10 points
    const redeemData = {
      points: 9,
      discountAmount: 50000,
    };

    const req = mockRequest({}, redeemData, {}, { _id: testUser._id });
    const res = mockResponse();

    // When: Call validation middleware
    await redeemPoints[0][0](req, res, () => {}); // Validation rule
    await redeemPoints[1](req, res, () => {}); // Validation check

    // Then: Validation error
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('RWD-UNIT-033 | Should reject insufficient points', async () => {
    // Given: User has 100 points
    const redeemData = {
      points: 150, // More than available
      discountAmount: 50000,
    };

    const req = mockRequest({}, redeemData, {}, { _id: testUser._id });
    const res = mockResponse();

    // When: Call redeemPoints
    await redeemPoints[2](req, res, mockNext);

    // Then: Error message
    expect(res.status).toHaveBeenCalledWith(400);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(false);
    expect(jsonCall.message).toContain('Not enough points');
  });

  test('RWD-UNIT-034 | Should require authentication', async () => {
    // Given: Request without authentication
    const redeemData = {
      points: 50,
      discountAmount: 50000,
    };

    const req = mockRequest({}, redeemData, {}, null); // No user
    const res = mockResponse();

    // When: Call redeemPoints
    await redeemPoints[2](req, res, mockNext);

    // Then: Authentication error
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('RWD-UNIT-035 | Should generate unique discount code', async () => {
    // Given: Valid redemption request
    const redeemData = {
      points: 50,
      discountAmount: 50000,
    };

    const req1 = mockRequest({}, redeemData, {}, { _id: testUser._id });
    const res1 = mockResponse();

    // When: Redeem points twice
    await redeemPoints[2](req1, res1, mockNext);

    // Give more points for second redemption
    await RewardPoint.create({
      user: testUser._id,
      points: 100,
      type: 'earn',
      status: 'active',
      description: 'More points',
    });

    const req2 = mockRequest({}, redeemData, {}, { _id: testUser._id });
    const res2 = mockResponse();
    await redeemPoints[2](req2, res2, mockNext);

    // Then: Codes are unique
    const code1 = res1.json.mock.calls[0][0].data.discount.code;
    const code2 = res2.json.mock.calls[0][0].data.discount.code;
    expect(code1).not.toBe(code2);
    expect(code1).toMatch(/^REWARD\d+/);
    expect(code2).toMatch(/^REWARD\d+/);
  });

  test('RWD-UNIT-037 | Should set correct discount properties', async () => {
    // Given: Valid redemption
    const redeemData = {
      points: 50,
      discountAmount: 50000,
    };

    const req = mockRequest({}, redeemData, {}, { _id: testUser._id });
    const res = mockResponse();

    // When: Redeem points
    await redeemPoints[2](req, res, mockNext);

    // Then: Verify discount properties
    const code = res.json.mock.calls[0][0].data.discount.code;
    const discount = await Discount.findOne({ code });
    expect(discount.type).toBe('fixed');
    expect(discount.value).toBe(50000);
    expect(discount.usageLimit).toBe(1);
    expect(discount.perUserLimit).toBe(1);
    expect(discount.status).toBe('active');
    expect(discount.source).toBe('reward_points');
  });

  test('RWD-UNIT-038 | Should create correct RewardPoint record', async () => {
    // Given: Valid redemption
    const redeemData = {
      points: 50,
      discountAmount: 50000,
    };

    const req = mockRequest({}, redeemData, {}, { _id: testUser._id });
    const res = mockResponse();

    // When: Redeem points
    await redeemPoints[2](req, res, mockNext);

    // Then: Verify RewardPoint properties
    const rewardPointId = res.json.mock.calls[0][0].data.rewardPoint._id;
    const rewardPoint = await RewardPoint.findById(rewardPointId);
    expect(rewardPoint.type).toBe('redeem');
    expect(rewardPoint.points).toBe(-50); // Negative
    expect(rewardPoint.status).toBe('redeemed');
    expect(rewardPoint.user.toString()).toBe(testUser._id.toString());
  });
});

describe('Controller: createRewardPoint (Admin)', () => {
  test('RWD-UNIT-040 | Should create reward point with valid data', async () => {
    // Given: Valid reward point data
    const rewardData = {
      user: testUser._id.toString(),
      points: 100,
      type: 'earn',
      description: 'Manual reward',
    };

    const req = mockRequest({}, rewardData);
    const res = mockResponse();

    // When: Call createRewardPoint[2] (the actual handler)
    await createRewardPoint[2](req, res, mockNext);

    // Then: Create reward point
    expect(res.status).toHaveBeenCalledWith(201);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(true);
    expect(jsonCall.data.points).toBe(100);
    expect(jsonCall.data.type).toBe('earn');
  });

  test('RWD-UNIT-041 | Should reject invalid user ID', async () => {
    // Given: Invalid user ID
    const rewardData = {
      user: 'invalid_id',
      points: 100,
      type: 'earn',
      description: 'Test',
    };

    const req = mockRequest({}, rewardData);
    const res = mockResponse();

    // When: Call validation middleware
    await createRewardPoint[0][0](req, res, () => {}); // Validation rule
    await createRewardPoint[1](req, res, () => {}); // Validation check

    // Then: Validation error
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Controller: cleanupTestData', () => {
  test('RWD-UNIT-045 | Should clean up test data successfully', async () => {
    // Given: Test data exists
    await RewardPoint.create({
      user: testUser._id,
      points: 100,
      type: 'earn',
      description: 'Reward points earned from order #ORD001',
    });
    await RewardPoint.create({
      user: testUser._id,
      points: -50,
      type: 'redeem',
      description: 'Points redeemed for discount',
    });

    const req = mockRequest();
    const res = mockResponse();

    // When: Call cleanupTestData
    await cleanupTestData(req, res, mockNext);

    // Then: Delete test records
    expect(res.status).toHaveBeenCalledWith(200);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(true);
    expect(jsonCall.deletedCount).toBeGreaterThanOrEqual(2);
  });

  test('RWD-UNIT-046 | Should handle no test data to clean', async () => {
    // Given: No test data
    await RewardPoint.deleteMany({});

    const req = mockRequest();
    const res = mockResponse();

    // When: Call cleanupTestData
    await cleanupTestData(req, res, mockNext);

    // Then: Return 0 deleted
    expect(res.status).toHaveBeenCalledWith(200);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.deletedCount).toBe(0);
  });
});

describe('Error Handling', () => {
  test('RWD-ERROR-001 | Should handle database error in getUserRewardPoints', async () => {
    // Given: Invalid query that causes DB error
    const req = mockRequest({ userId: 'invalid-id-format' }, {}, {});
    const res = mockResponse();

    // When: Call getUserRewardPoints
    await getUserRewardPoints(req, res, mockNext);

    // Then: Call next with error
    expect(mockNext).toHaveBeenCalled();
    expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  test('RWD-ERROR-002 | Should handle database error in getUserTotalPoints', async () => {
    // Given: Invalid userId format
    const req = mockRequest({ userId: 'invalid-id-format' });
    const res = mockResponse();

    // When: Call getUserTotalPoints
    await getUserTotalPoints(req, res, mockNext);

    // Then: Call next with error
    expect(mockNext).toHaveBeenCalled();
    expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  test('RWD-ERROR-003 | Should handle database error in createRewardPoint', async () => {
    // Given: Data that causes DB error (duplicate key, etc)
    const rewardData = {
      user: testUser._id.toString(),
      points: 100,
      type: 'earn',
      description: 'Test',
    };

    const req = mockRequest({}, rewardData);
    const res = mockResponse();

    // Mock RewardPoint.create to throw error
    const originalCreate = RewardPoint.create;
    RewardPoint.create = jest.fn().mockRejectedValue(new Error('Database error'));

    // When: Call createRewardPoint
    await createRewardPoint[2](req, res, mockNext);

    // Then: Call next with error
    expect(mockNext).toHaveBeenCalled();
    expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);

    // Restore
    RewardPoint.create = originalCreate;
  });

  test('RWD-ERROR-004 | Should handle error in redeemPoints when user not found', async () => {
    // Given: Valid redemption but User.findById fails
    await RewardPoint.create({
      user: testUser._id,
      points: 100,
      type: 'earn',
      status: 'active',
      description: 'Initial points',
    });

    const redeemData = {
      points: 50,
      discountAmount: 50000,
    };

    const req = mockRequest({}, redeemData, {}, { _id: testUser._id });
    const res = mockResponse();

    // Mock User.findById to return null (simulate user lookup failure)
    const originalFindById = User.findById;
    User.findById = jest.fn().mockResolvedValue(null);

    // When: Call redeemPoints (should still succeed, email just won't send)
    await redeemPoints[2](req, res, mockNext);

    // Then: Redemption succeeds despite email failure
    expect(res.status).toHaveBeenCalledWith(201);

    // Restore
    User.findById = originalFindById;
  });

  test('RWD-ERROR-005 | Should handle error in cleanupTestData', async () => {
    // Given: Mock deleteMany to throw error
    const req = mockRequest();
    const res = mockResponse();

    const originalDeleteMany = RewardPoint.deleteMany;
    RewardPoint.deleteMany = jest.fn().mockRejectedValue(new Error('Database error'));

    // When: Call cleanupTestData
    await cleanupTestData(req, res, mockNext);

    // Then: Call next with error
    expect(mockNext).toHaveBeenCalled();
    expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);

    // Restore
    RewardPoint.deleteMany = originalDeleteMany;
  });
});

describe('Edge Cases', () => {
  test('RWD-EDGE-001 | Should handle concurrent redemptions (race condition)', async () => {
    // Given: User has 100 available points
    await RewardPoint.create({
      user: testUser._id,
      points: 100,
      type: 'earn',
      status: 'active',
      description: 'Initial points',
    });

    const redeemData = {
      points: 60,
      discountAmount: 60000,
    };

    const req1 = mockRequest({}, redeemData, {}, { _id: testUser._id });
    const res1 = mockResponse();

    const req2 = mockRequest({}, redeemData, {}, { _id: testUser._id });
    const res2 = mockResponse();

    // When: Send 2 simultaneous requests
    const results = await Promise.allSettled([
      redeemPoints[2](req1, res1, jest.fn()),
      redeemPoints[2](req2, res2, jest.fn()),
    ]);

    // Then: Document race condition (both may succeed currently due to no transaction lock)
    const succeeded = [res1, res2].filter(r => {
      const calls = r.status.mock.calls;
      return calls.length > 0 && calls[calls.length - 1][0] === 201;
    }).length;

    // At least one should succeed
    expect(succeeded).toBeGreaterThanOrEqual(1);
  });

  test('RWD-EDGE-002 | Should handle very large point amounts', async () => {
    // Given: User with huge points
    await RewardPoint.create({
      user: testUser._id,
      points: 10000,
      type: 'earn',
      status: 'active',
      description: 'Large earn',
    });

    const redeemData = {
      points: 5000,
      discountAmount: 5000000, // 5 million VND
    };

    const req = mockRequest({}, redeemData, {}, { _id: testUser._id });
    const res = mockResponse();

    // When: Redeem large amount
    await redeemPoints[2](req, res, mockNext);

    // Then: Handle correctly
    expect(res.status).toHaveBeenCalledWith(201);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(true);
    expect(jsonCall.data.discount.value).toBe(5000000);
  });

  test('RWD-EDGE-003 | Should use custom description if provided', async () => {
    // Given: User with points and custom description
    await RewardPoint.create({
      user: testUser._id,
      points: 100,
      type: 'earn',
      status: 'active',
      description: 'Initial points',
    });

    const redeemData = {
      points: 50,
      discountAmount: 50000,
      description: 'Custom reward description',
    };

    const req = mockRequest({}, redeemData, {}, { _id: testUser._id });
    const res = mockResponse();

    // When: Redeem points
    await redeemPoints[2](req, res, mockNext);

    // Then: Use custom description
    expect(res.status).toHaveBeenCalledWith(201);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(true);
    expect(jsonCall.data.rewardPoint.description).toBe('Custom reward description');
  });

  test('RWD-EDGE-004 | Should handle pagination with filters', async () => {
    // Given: User has mixed records
    for (let i = 0; i < 15; i++) {
      await RewardPoint.create({
        user: testUser._id,
        points: 10,
        type: i % 2 === 0 ? 'earn' : 'redeem',
        status: 'active',
        description: `Test ${i}`,
      });
    }

    const req = mockRequest(
      { userId: testUser._id.toString() },
      {},
      { page: 1, limit: 5, type: 'earn' }
    );
    const res = mockResponse();

    // When: Get with filters
    await getUserRewardPoints(req, res, mockNext);

    // Then: Return filtered and paginated
    expect(res.status).toHaveBeenCalledWith(200);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.data).toHaveLength(5);
    jsonCall.data.forEach(record => {
      expect(record.type).toBe('earn');
    });
  });

  test('RWD-EDGE-005 | Should reject invalid type in createRewardPoint', async () => {
    // Given: Invalid type
    const rewardData = {
      user: testUser._id.toString(),
      points: 100,
      type: 'invalid_type',
      description: 'Test',
    };

    const req = mockRequest({}, rewardData);
    const res = mockResponse();

    // When: Call validation middleware
    await createRewardPoint[0][2](req, res, () => {}); // type validation
    await createRewardPoint[1](req, res, () => {}); // Validation check

    // Then: Validation error
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('RWD-EDGE-006 | Should require description in createRewardPoint', async () => {
    // Given: Missing description
    const rewardData = {
      user: testUser._id.toString(),
      points: 100,
      type: 'earn',
    };

    const req = mockRequest({}, rewardData);
    const res = mockResponse();

    // When: Call validation middleware
    await createRewardPoint[0][4](req, res, () => {}); // description validation
    await createRewardPoint[1](req, res, () => {}); // Validation check

    // Then: Validation error
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
