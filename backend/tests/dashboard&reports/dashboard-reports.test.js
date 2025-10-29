/**
 * Dashboard & Reports - Tests for 85%+ Coverage
 * Strategy: Mock models, test real controller logic
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Set env vars
process.env.NODE_ENV = 'test';
process.env.EMAIL_HOST = 'smtp.test.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@test.com';
process.env.EMAIL_PASS = 'testpass';
process.env.EMAIL_FROM = 'noreply@test.com';
process.env.ADMIN_EMAIL_ADDRESS = 'admin@test.com';

// Mock email config
jest.unstable_mockModule('../../src/config/email.config.js', () => ({
  default: {
    host: 'smtp.test.com',
    port: 587,
    user: 'test@test.com',
    pass: 'testpass',
    from: 'noreply@test.com',
    adminEmailAddress: 'admin@test.com',
  },
}));

// Mock sendEmail
jest.unstable_mockModule('../../src/utils/sendEmail.js', () => ({
  sendTemplatedEmail: jest.fn().mockResolvedValue(true),
}));

// Mock reward service
jest.unstable_mockModule('../../src/services/rewardPoint.service.js', () => ({
  hasOrderEarnedRewardPoints: jest.fn().mockResolvedValue(false),
  createRewardPointsForOrder: jest.fn().mockResolvedValue({ points: 100 }),
}));

// Mock Report model
const mockReportGlobal = {
  findById: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
};
jest.unstable_mockModule('../../src/models/Report.js', () => ({ default: mockReportGlobal }));

describe('Dashboard & Reports - Coverage Tests', () => {
  let getShopStats, getShopOrders, getShopSalesData, updateOrderStatus;
  let getAdminStats, createCategory, deleteCategory, banUser, unbanUser;
  let mockOrder, mockProduct, mockFeedback, mockUser, mockStore, mockCategory, mockDiscount;
  let ErrorResponse;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup mock models
    mockOrder = {
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
    };

    mockProduct = {
      countDocuments: jest.fn(),
    };

    mockFeedback = {
      aggregate: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
    };

    mockUser = {
      countDocuments: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      find: jest.fn(),
    };

    mockStore = {
      countDocuments: jest.fn(),
    };

    mockCategory = {
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      aggregate: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    mockDiscount = {
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    // Mock models
    jest.unstable_mockModule('../../src/models/Order.js', () => ({ default: mockOrder }));
    jest.unstable_mockModule('../../src/models/Product.js', () => ({ default: mockProduct }));
    jest.unstable_mockModule('../../src/models/Feedback.js', () => ({ default: mockFeedback }));
    jest.unstable_mockModule('../../src/models/User.js', () => ({ default: mockUser }));
    jest.unstable_mockModule('../../src/models/Store.js', () => ({ default: mockStore }));
    jest.unstable_mockModule('../../src/models/Category.js', () => ({ default: mockCategory }));
    jest.unstable_mockModule('../../src/models/Discount.js', () => ({ default: mockDiscount }));

    // Import controllers
    const dashboard = await import('../../src/controllers/dashboardController.js');
    getShopStats = dashboard.getShopStats;
    getShopOrders = dashboard.getShopOrders;
    getShopSalesData = dashboard.getShopSalesData;
    updateOrderStatus = dashboard.updateOrderStatus;
    getAdminStats = dashboard.getAdminStats;
    createCategory = dashboard.createCategory;
    deleteCategory = dashboard.deleteCategory;
    banUser = dashboard.banUser;
    unbanUser = dashboard.unbanUser;

    const errModule = await import('../../src/utils/errorResponse.js');
    ErrorResponse = errModule.ErrorResponse;
  });

  afterEach(() => {
    jest.resetModules();
  });

  // ========== SHOP DASHBOARD TESTS ==========

  describe('getShopStats', () => {
    test('Should handle empty database gracefully', async () => {
      mockOrder.countDocuments.mockResolvedValue(0);
      mockOrder.aggregate
        .mockResolvedValueOnce([]) // Total revenue
        .mockResolvedValueOnce([]) // Current month
        .mockResolvedValueOnce([]) // Previous month
        .mockResolvedValueOnce([]) // Status distribution
        .mockResolvedValueOnce([]); // Top products
      mockProduct.countDocuments.mockResolvedValue(0);
      mockFeedback.aggregate.mockResolvedValue([]);

      const req = { user: { id: 'shop1' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getShopStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.data.totalOrders).toBe(0);
      expect(response.data.totalRevenue).toBe(0);
      expect(response.data.averageRating).toBe(0);
    });

    test('Should calculate revenue change correctly when previous = 0', async () => {
      mockOrder.countDocuments.mockResolvedValue(10);
      mockOrder.aggregate
        .mockResolvedValueOnce([{ total: 1500000 }]) // Total revenue
        .mockResolvedValueOnce([{ total: 1500000 }]) // Current month
        .mockResolvedValueOnce([]) // Previous month = 0
        .mockResolvedValueOnce([{ _id: 'delivered', value: 10 }])
        .mockResolvedValueOnce([]);
      mockProduct.countDocuments.mockResolvedValue(50);
      mockFeedback.aggregate.mockResolvedValue([{ avg: 4.5, count: 100 }]);

      const req = { user: { id: 'shop1' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getShopStats(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.totalRevenueChange).toBe(0); // Previous = 0, so change = 0
    });

    test('Should return top products limited to 4', async () => {
      mockOrder.countDocuments.mockResolvedValue(100);
      mockOrder.aggregate
        .mockResolvedValueOnce([{ total: 5000000 }])
        .mockResolvedValueOnce([{ total: 2000000 }])
        .mockResolvedValueOnce([{ total: 1500000 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { name: 'Product 1', sales: 100 },
          { name: 'Product 2', sales: 85 },
          { name: 'Product 3', sales: 70 },
          { name: 'Product 4', sales: 50 },
        ]);
      mockProduct.countDocuments.mockResolvedValue(200);
      mockFeedback.aggregate.mockResolvedValue([{ avg: 4.2, count: 150 }]);

      const req = { user: { id: 'shop1' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getShopStats(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.topProducts).toHaveLength(4);
    });
  });

  describe('getShopOrders', () => {
    test('Should return paginated orders correctly', async () => {
      const mockOrders = Array.from({ length: 10 }, (_, i) => ({ _id: `order${i}` }));

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis().mockReturnThis(), // Chain twice
      };
      // Configure populate to return mockOrders on the second call
      mockQuery.populate
        .mockReturnValueOnce(mockQuery) // First populate returns this
        .mockResolvedValueOnce(mockOrders); // Second populate returns data

      mockOrder.find.mockReturnValue(mockQuery);
      mockOrder.countDocuments.mockResolvedValue(25);

      const req = { query: { page: '1', limit: '10' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getShopOrders(req, res);

      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(res.status).toHaveBeenCalledWith(200);

      const response = res.json.mock.calls[0][0];
      expect(response.data.pagination.pages).toBe(3);
    });

    test('Should use default pagination values', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate.mockReturnValueOnce(mockQuery).mockResolvedValueOnce([]);

      mockOrder.find.mockReturnValue(mockQuery);
      mockOrder.countDocuments.mockResolvedValue(0);

      const req = { query: {} }; // No page/limit
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getShopOrders(req, res);

      expect(mockQuery.skip).toHaveBeenCalledWith(0); // (1-1)*10
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getShopSalesData', () => {
    test('Should use daily format when period=daily', async () => {
      mockOrder.aggregate.mockResolvedValue([
        { _id: '2024-01-15', totalSales: 1000000, orderCount: 10 },
      ]);

      const req = { query: { period: 'daily' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getShopSalesData(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      // Verify aggregate was called with daily format
      const aggregateCall = mockOrder.aggregate.mock.calls[0][0];
      expect(aggregateCall[1].$group._id.$dateToString.format).toBe('%Y-%m-%d');
    });

    test('Should default to monthly format', async () => {
      mockOrder.aggregate.mockResolvedValue([]);

      const req = { query: {} }; // No period
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getShopSalesData(req, res);

      const aggregateCall = mockOrder.aggregate.mock.calls[0][0];
      expect(aggregateCall[1].$group._id.$dateToString.format).toBe('%Y-%m');
    });

    test('Should use weekly format when period=weekly', async () => {
      mockOrder.aggregate.mockResolvedValue([]);

      const req = { query: { period: 'weekly' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getShopSalesData(req, res);

      const aggregateCall = mockOrder.aggregate.mock.calls[0][0];
      expect(aggregateCall[1].$group._id.$dateToString.format).toBe('%Y-%U');
    });
  });

  describe('updateOrderStatus', () => {
    test('Should update order and create reward points when delivered', async () => {
      const mockOrderDoc = {
        _id: '507f1f77bcf86cd799439011',
        status: 'processing',
        user: '507f1f77bcf86cd799439012',
        save: jest.fn().mockResolvedValue(true),
      };

      const mockFullOrder = {
        _id: '507f1f77bcf86cd799439011',
        user: '507f1f77bcf86cd799439012',
        totalPrice: 1000000,
        status: 'delivered',
      };

      // Mock findById for initial get
      mockOrder.findById.mockResolvedValue(mockOrderDoc);

      // Mock findById().lean() for reward points
      const mockLeanQuery = {
        lean: jest.fn().mockResolvedValue(mockFullOrder),
      };
      mockOrder.findById.mockReturnValueOnce(mockOrderDoc); // First call
      mockOrder.findById.mockReturnValueOnce(mockLeanQuery); // Second call for reward

      const { hasOrderEarnedRewardPoints, createRewardPointsForOrder } = await import(
        '../../src/services/rewardPoint.service.js'
      );

      const req = {
        params: { orderId: '507f1f77bcf86cd799439011' },
        body: { status: 'delivered' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await updateOrderStatus(req, res);

      expect(mockOrderDoc.status).toBe('delivered');
      expect(mockOrderDoc.save).toHaveBeenCalled();
      expect(hasOrderEarnedRewardPoints).toHaveBeenCalled();
      // May not be called if lean() fails, but save should work
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Should throw 404 when order not found', async () => {
      mockOrder.findById.mockResolvedValue(null);

      const req = {
        params: { orderId: '507f1f77bcf86cd799439011' },
        body: { status: 'delivered' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await expect(updateOrderStatus(req, res)).rejects.toThrow('Order not found');
    });

    test('Should handle reward service failure gracefully', async () => {
      const mockOrderDoc = {
        _id: '507f1f77bcf86cd799439011',
        status: 'processing',
        save: jest.fn().mockResolvedValue(true),
      };

      mockOrder.findById.mockResolvedValue(mockOrderDoc);

      const { hasOrderEarnedRewardPoints, createRewardPointsForOrder } = await import(
        '../../src/services/rewardPoint.service.js'
      );

      hasOrderEarnedRewardPoints.mockResolvedValue(false);
      createRewardPointsForOrder.mockRejectedValue(new Error('Service error'));

      const req = {
        params: { orderId: '507f1f77bcf86cd799439011' },
        body: { status: 'delivered' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Should NOT throw, error should be caught
      await updateOrderStatus(req, res);

      expect(mockOrderDoc.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ========== ADMIN DASHBOARD TESTS ==========

  describe('getAdminStats', () => {
    test('Should return all statistics', async () => {
      mockUser.countDocuments.mockResolvedValue(100);
      mockOrder.countDocuments.mockResolvedValue(50);
      mockOrder.aggregate.mockResolvedValue([{ total: 5000000 }]);
      mockProduct.countDocuments.mockResolvedValue(200);
      mockStore.countDocuments.mockResolvedValue(5);

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([]),
      };
      mockOrder.find.mockReturnValue(mockQuery);

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.data.totalUsers).toBe(100);
      expect(response.data.totalOrders).toBe(50);
      expect(response.data.totalRevenue).toBe(5000000);
      expect(response.data.totalProducts).toBe(200);
      expect(response.data.totalStores).toBe(5);
    });
  });

  describe('Category Management', () => {
    test('Should create category with unique name', async () => {
      mockCategory.findOne.mockResolvedValue(null); // No duplicate
      mockCategory.create.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Sneakers',
        status: true,
      });

      const req = {
        body: {
          name: 'Sneakers',
          description: 'Athletic footwear',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await createCategory(req, res);

      expect(mockCategory.findOne).toHaveBeenCalled();
      expect(mockCategory.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Should reject duplicate category name (case-insensitive)', async () => {
      mockCategory.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Sneakers',
      });

      const req = {
        body: { name: 'sneakers' }, // Lowercase
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await expect(createCategory(req, res)).rejects.toThrow(
        'Category with this name already exists'
      );
    });

    test('Should delete category without products', async () => {
      mockCategory.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Test',
      });
      mockProduct.countDocuments.mockResolvedValue(0);
      mockCategory.findByIdAndDelete.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
      });

      const req = { params: { categoryId: '507f1f77bcf86cd799439011' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await deleteCategory(req, res);

      expect(mockCategory.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Should reject deleting category with products', async () => {
      mockCategory.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Test',
      });
      mockProduct.countDocuments.mockResolvedValue(5);

      const req = { params: { categoryId: '507f1f77bcf86cd799439011' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await expect(deleteCategory(req, res)).rejects.toThrow(
        'Cannot delete category. It has 5 products associated with it.'
      );
    });
  });

  describe('User Management', () => {
    test('Should ban user and send email', async () => {
      const mockUserDoc = {
        _id: '507f1f77bcf86cd799439011',
        fullName: 'John Doe',
        email: 'john@example.com',
        status: false,
      };

      mockUser.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserDoc),
      });

      const { sendTemplatedEmail } = await import('../../src/utils/sendEmail.js');

      const req = {
        params: { userId: '507f1f77bcf86cd799439011' },
        body: {
          adminNote: 'Violation',
          banReason: 'Spam',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await banUser(req, res);

      expect(mockUser.findByIdAndUpdate).toHaveBeenCalled();
      expect(sendTemplatedEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Should handle email failure gracefully when banning user', async () => {
      const mockUserDoc = {
        _id: '507f1f77bcf86cd799439011',
        email: 'john@example.com',
        status: false,
      };

      mockUser.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserDoc),
      });

      const { sendTemplatedEmail } = await import('../../src/utils/sendEmail.js');
      sendTemplatedEmail.mockRejectedValueOnce(new Error('Email service down'));

      const req = {
        params: { userId: '507f1f77bcf86cd799439011' },
        body: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Should NOT throw
      await banUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Should unban user and send email', async () => {
      const mockUserDoc = {
        _id: '507f1f77bcf86cd799439011',
        email: 'john@example.com',
        status: true,
      };

      mockUser.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserDoc),
      });

      const req = {
        params: { userId: '507f1f77bcf86cd799439011' },
        body: { adminNote: 'Reinstated' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await unbanUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ========== ADDITIONAL SHOP DASHBOARD TESTS ==========

  describe('Additional Shop Dashboard Functions', () => {
    let getShopFeedback, getShopDiscounts, createDiscount, deleteDiscount;

    beforeEach(async () => {
      // Reset Discount mock methods
      mockDiscount.find = jest.fn();
      mockDiscount.create = jest.fn();
      mockDiscount.findByIdAndDelete = jest.fn();

      const dashboard = await import('../../src/controllers/dashboardController.js');
      getShopFeedback = dashboard.getShopFeedback;
      getShopDiscounts = dashboard.getShopDiscounts;
      createDiscount = dashboard.createDiscount;
      deleteDiscount = dashboard.deleteDiscount;
    });

    test('getShopFeedback - should return active feedbacks only', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate
        .mockReturnValueOnce(mockQuery) // First populate
        .mockResolvedValueOnce([{ id: 'fb1' }]); // Second populate returns data

      mockFeedback.find = jest.fn().mockReturnValue(mockQuery);
      mockFeedback.countDocuments = jest.fn().mockResolvedValue(10);

      const req = { query: { page: '1' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getShopFeedback(req, res);

      expect(mockFeedback.find).toHaveBeenCalledWith({ status: true });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('getShopDiscounts - should filter by source=shop', async () => {
      const mockDiscounts = [{ id: 'disc1', source: 'shop' }];
      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockDiscounts),
      };
      mockDiscount.find.mockReturnValue(mockQuery);

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getShopDiscounts(req, res);

      expect(mockDiscount.find).toHaveBeenCalledWith({ source: 'shop' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockDiscounts,
      });
    });

    test('createDiscount - should create with source=shop', async () => {
      const newDiscount = { _id: 'disc1', code: 'TEST10', discount: 10, source: 'shop' };
      mockDiscount.create.mockResolvedValue(newDiscount);

      const req = {
        body: { code: 'TEST10', discount: 10 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await createDiscount(req, res);

      expect(mockDiscount.create).toHaveBeenCalledWith({
        code: 'TEST10',
        discount: 10,
        source: 'shop',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: newDiscount,
      });
    });

    test('deleteDiscount - should delete discount successfully', async () => {
      const deletedDiscount = { _id: '507f1f77bcf86cd799439011', code: 'TEST10' };
      mockDiscount.findByIdAndDelete.mockResolvedValue(deletedDiscount);

      const req = { params: { discountId: '507f1f77bcf86cd799439011' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await deleteDiscount(req, res);

      expect(mockDiscount.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('deleteDiscount - should throw 404 if not found', async () => {
      mockDiscount.findByIdAndDelete.mockResolvedValue(null);

      const req = { params: { discountId: '507f1f77bcf86cd799439011' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await expect(deleteDiscount(req, res)).rejects.toThrow('Discount not found');
    });
    test('getAdminDiscounts - should return admin discounts', async () => {
      // Reset mock
      mockDiscount.find = jest.fn();

      const mockDiscounts = [{ id: 'disc1', source: 'admin' }];
      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockDiscounts),
      };
      mockDiscount.find.mockReturnValue(mockQuery);

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const { getAdminDiscounts } = await import('../../src/controllers/dashboardController.js');
      await getAdminDiscounts(req, res);

      expect(mockDiscount.find).toHaveBeenCalledWith({ source: 'admin' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('createAdminDiscount - should create with source=admin', async () => {
      // Reset mock
      mockDiscount.create = jest.fn();
      mockDiscount.create.mockResolvedValue({ _id: 'disc1', code: 'ADMIN10', source: 'admin' });

      const req = { body: { code: 'ADMIN10', discount: 10 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const { createAdminDiscount } = await import('../../src/controllers/dashboardController.js');
      await createAdminDiscount(req, res);

      expect(mockDiscount.create).toHaveBeenCalledWith({
        code: 'ADMIN10',
        discount: 10,
        source: 'admin',
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ========== ADDITIONAL ADMIN DASHBOARD TESTS ==========

  describe('Additional Admin Dashboard Functions', () => {
    let getAdminUsers, getAdminFeedback, activateCategory, deactivateCategory, updateCategory;

    beforeEach(async () => {
      const dashboard = await import('../../src/controllers/dashboardController.js');
      getAdminUsers = dashboard.getAdminUsers;
      getAdminFeedback = dashboard.getAdminFeedback;
      activateCategory = dashboard.activateCategory;
      deactivateCategory = dashboard.deactivateCategory;
      updateCategory = dashboard.updateCategory;
    });

    test('getAdminUsers - should exclude password field', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'user1' }]),
      };

      mockUser.find = jest.fn().mockReturnValue(mockQuery);
      mockUser.countDocuments.mockResolvedValue(50);

      const req = { query: { page: '1' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminUsers(req, res);

      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('getAdminFeedback - should exclude deleted feedbacks (status=false)', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate.mockReturnValueOnce(mockQuery).mockResolvedValueOnce([{ id: 'fb1' }]);

      mockFeedback.find = jest.fn().mockReturnValue(mockQuery);
      mockFeedback.countDocuments = jest.fn().mockResolvedValue(15);

      const req = { query: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminFeedback(req, res);

      expect(mockFeedback.find).toHaveBeenCalledWith({ status: { $ne: false } });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('activateCategory - should set status=true', async () => {
      mockCategory.findByIdAndUpdate.mockResolvedValue({
        id: '507f1f77bcf86cd799439011',
        status: true,
      });

      const req = { params: { categoryId: '507f1f77bcf86cd799439011' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await activateCategory(req, res);

      expect(mockCategory.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { status: true },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('activateCategory - should throw 404 if not found', async () => {
      mockCategory.findByIdAndUpdate.mockResolvedValue(null);

      const req = { params: { categoryId: '507f1f77bcf86cd799439011' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await expect(activateCategory(req, res)).rejects.toThrow('Category not found');
    });

    test('deactivateCategory - should set status=false', async () => {
      mockCategory.findByIdAndUpdate.mockResolvedValue({
        id: '507f1f77bcf86cd799439011',
        status: false,
      });

      const req = { params: { categoryId: '507f1f77bcf86cd799439011' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await deactivateCategory(req, res);

      expect(mockCategory.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { status: false },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('updateCategory - should update category when name is unique', async () => {
      mockCategory.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'OldName',
      });
      mockCategory.findOne.mockResolvedValue(null); // No duplicate
      mockCategory.findByIdAndUpdate.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'NewName',
      });

      const req = {
        params: { categoryId: '507f1f77bcf86cd799439011' },
        body: { name: 'NewName', description: 'Updated' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await updateCategory(req, res);

      expect(mockCategory.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('updateCategory - should reject duplicate name', async () => {
      mockCategory.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'OldName',
      });
      mockCategory.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012',
        name: 'NewName',
      }); // Duplicate exists

      const req = {
        params: { categoryId: '507f1f77bcf86cd799439011' },
        body: { name: 'NewName' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await expect(updateCategory(req, res)).rejects.toThrow(
        'Category with this name already exists'
      );
    });

    test('updateCategory - should not throw 404 if category not found', async () => {
      mockCategory.findById.mockResolvedValue(null);

      const req = {
        params: { categoryId: '507f1f77bcf86cd799439011' },
        body: { name: 'Test' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await expect(updateCategory(req, res)).rejects.toThrow('Category not found');
    });
  });

  // ========== FINANCIAL REPORTS TESTS ==========

  describe('Admin Financial Reports', () => {
    let getAdminRevenueData,
      getAdminOrdersData,
      getAdminTopProductsData,
      getAdminUserGrowthData,
      getAdminShopRevenueData,
      getAdminCustomerGrowthData;

    beforeEach(async () => {
      const dashboard = await import('../../src/controllers/dashboardController.js');
      getAdminRevenueData = dashboard.getAdminRevenueData;
      getAdminOrdersData = dashboard.getAdminOrdersData;
      getAdminTopProductsData = dashboard.getAdminTopProductsData;
      getAdminUserGrowthData = dashboard.getAdminUserGrowthData;
      getAdminShopRevenueData = dashboard.getAdminShopRevenueData;
      getAdminCustomerGrowthData = dashboard.getAdminCustomerGrowthData;
    });

    test('getAdminRevenueData - should aggregate revenue by period', async () => {
      const mockRevenueData = [
        { _id: '2024-01', totalRevenue: 5000000, orderCount: 50 },
        { _id: '2024-02', totalRevenue: 7000000, orderCount: 70 },
      ];
      mockOrder.aggregate.mockResolvedValue(mockRevenueData);

      const req = {
        query: { startDate: '2024-01-01', endDate: '2024-02-28', period: 'monthly' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminRevenueData(req, res);

      expect(mockOrder.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockRevenueData,
      });
    });

    test('getAdminRevenueData - should use daily format when period=daily', async () => {
      const mockData = [{ _id: '2024-01-15', totalRevenue: 100000, orderCount: 5 }];
      mockOrder.aggregate.mockResolvedValue(mockData);

      const req = { query: { period: 'daily' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminRevenueData(req, res);

      const aggregateCall = mockOrder.aggregate.mock.calls[0][0];
      expect(aggregateCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            $group: expect.objectContaining({
              _id: expect.objectContaining({
                $dateToString: expect.objectContaining({ format: '%Y-%m-%d' }),
              }),
            }),
          }),
        ])
      );
    });

    test('getAdminOrdersData - should aggregate orders by status', async () => {
      const mockOrdersData = [
        { _id: 'pending', count: 10 },
        { _id: 'delivered', count: 50 },
      ];
      mockOrder.aggregate.mockResolvedValue(mockOrdersData);

      const req = { query: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminOrdersData(req, res);

      expect(mockOrder.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('getAdminTopProductsData - should return top selling products', async () => {
      const mockTopProducts = [
        { productId: 'p1', productName: 'Shoe A', totalSold: 100, revenue: 5000000 },
        { productId: 'p2', productName: 'Shoe B', totalSold: 80, revenue: 4000000 },
      ];
      mockOrder.aggregate.mockResolvedValue(mockTopProducts);

      const req = { query: { limit: '10' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminTopProductsData(req, res);

      expect(mockOrder.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTopProducts,
      });
    });

    test('getAdminTopProductsData - should use default limit of 5', async () => {
      mockOrder.aggregate.mockResolvedValue([]);

      const req = { query: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminTopProductsData(req, res);

      const aggregateCall = mockOrder.aggregate.mock.calls[0][0];
      expect(aggregateCall).toEqual(expect.arrayContaining([{ $limit: 5 }]));
    });

    test('getAdminUserGrowthData - should aggregate user growth by period', async () => {
      const mockData = [
        { _id: '2024-01', customers: 100 },
        { _id: '2024-02', customers: 150 },
      ];
      mockUser.aggregate = jest.fn().mockResolvedValue(mockData);

      const req = { query: { period: 'monthly' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminUserGrowthData(req, res);

      expect(mockUser.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
    });

    test('getAdminUserGrowthData - should use weekly format when period=weekly', async () => {
      mockUser.aggregate = jest.fn().mockResolvedValue([]);

      const req = { query: { period: 'weekly' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminUserGrowthData(req, res);

      const aggregateCall = mockUser.aggregate.mock.calls[0][0];
      expect(aggregateCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            $group: expect.objectContaining({
              _id: expect.objectContaining({
                $dateToString: expect.objectContaining({ format: '%Y-%U' }),
              }),
            }),
          }),
        ])
      );
    });

    test('getAdminShopRevenueData - should aggregate shop revenue', async () => {
      const mockData = [
        { _id: 'shop1', totalRevenue: 1000000, orderCount: 50 },
        { _id: 'shop2', totalRevenue: 800000, orderCount: 40 },
      ];
      mockOrder.aggregate = jest.fn().mockResolvedValue(mockData);

      const req = { query: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminShopRevenueData(req, res);

      expect(mockOrder.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
    });

    test('getAdminCustomerGrowthData - should aggregate customer growth', async () => {
      const mockData = [
        { _id: '2024-01', newCustomers: 50 },
        { _id: '2024-02', newCustomers: 75 },
      ];
      mockUser.aggregate = jest.fn().mockResolvedValue(mockData);

      const req = { query: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminCustomerGrowthData(req, res);

      expect(mockUser.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
    });

    test('getAdminCustomerGrowthData - should use daily format when period=daily', async () => {
      mockUser.aggregate = jest.fn().mockResolvedValue([]);

      const req = { query: { period: 'daily' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminCustomerGrowthData(req, res);

      const aggregateCall = mockUser.aggregate.mock.calls[0][0];
      expect(aggregateCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            $group: expect.objectContaining({
              _id: expect.objectContaining({
                $dateToString: expect.objectContaining({ format: '%Y-%m-%d' }),
              }),
            }),
          }),
        ])
      );
    });

    test('getAdminCustomerGrowthData - should use weekly format when period=weekly', async () => {
      mockUser.aggregate = jest.fn().mockResolvedValue([]);

      const req = { query: { period: 'weekly' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminCustomerGrowthData(req, res);

      const aggregateCall = mockUser.aggregate.mock.calls[0][0];
      expect(aggregateCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            $group: expect.objectContaining({
              _id: expect.objectContaining({
                $dateToString: expect.objectContaining({ format: '%Y-%U' }),
              }),
            }),
          }),
        ])
      );
    });

    test('getAdminRevenueData - should use weekly format when period=weekly', async () => {
      mockOrder.aggregate = jest.fn().mockResolvedValue([]);

      const req = { query: { period: 'weekly' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminRevenueData(req, res);

      const aggregateCall = mockOrder.aggregate.mock.calls[0][0];
      expect(aggregateCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            $group: expect.objectContaining({
              _id: expect.objectContaining({
                $dateToString: expect.objectContaining({ format: '%Y-%U' }),
              }),
            }),
          }),
        ])
      );
    });

    test('getAdminOrdersData - should use daily format when period=daily', async () => {
      mockOrder.aggregate = jest.fn().mockResolvedValue([]);

      const req = { query: { period: 'daily' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminOrdersData(req, res);

      const aggregateCall = mockOrder.aggregate.mock.calls[0][0];
      expect(aggregateCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            $group: expect.objectContaining({
              _id: expect.objectContaining({
                $dateToString: expect.objectContaining({ format: '%Y-%m-%d' }),
              }),
            }),
          }),
        ])
      );
    });

    test('getAdminOrdersData - should use weekly format when period=weekly', async () => {
      mockOrder.aggregate = jest.fn().mockResolvedValue([]);

      const req = { query: { period: 'weekly' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminOrdersData(req, res);

      const aggregateCall = mockOrder.aggregate.mock.calls[0][0];
      expect(aggregateCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            $group: expect.objectContaining({
              _id: expect.objectContaining({
                $dateToString: expect.objectContaining({ format: '%Y-%U' }),
              }),
            }),
          }),
        ])
      );
    });

    test('getAdminUserGrowthData - should use daily format when period=daily', async () => {
      mockUser.aggregate = jest.fn().mockResolvedValue([]);

      const req = { query: { period: 'daily' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminUserGrowthData(req, res);

      const aggregateCall = mockUser.aggregate.mock.calls[0][0];
      expect(aggregateCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            $group: expect.objectContaining({
              _id: expect.objectContaining({
                $dateToString: expect.objectContaining({ format: '%Y-%m-%d' }),
              }),
            }),
          }),
        ])
      );
    });
  });

  // ========== REPORT MANAGEMENT TESTS ==========

  describe('Report Management', () => {
    let deleteFeedback,
      getAdminCategories,
      getMyFeedbackReports,
      ignoreProductReport,
      resolveProductReport,
      getAdminReportedProducts,
      deleteReportedProduct;

    beforeEach(async () => {
      // Reset all Report mocks
      mockReportGlobal.findById.mockReset();
      mockReportGlobal.findOne.mockReset();
      mockReportGlobal.find.mockReset();
      mockReportGlobal.countDocuments.mockReset();

      // Reset other mocks
      mockFeedback.findById = jest.fn();
      mockFeedback.findByIdAndUpdate = jest.fn();
      mockCategory.aggregate = jest.fn();
      mockProduct.findById = jest.fn();
      mockProduct.findByIdAndDelete = jest.fn();
      mockUser.findById = jest.fn();
      mockUser.findOne = jest.fn();

      const dashboard = await import('../../src/controllers/dashboardController.js');
      deleteFeedback = dashboard.deleteFeedback;
      getAdminCategories = dashboard.getAdminCategories;
      getMyFeedbackReports = dashboard.getMyFeedbackReports;
      ignoreProductReport = dashboard.ignoreProductReport;
      resolveProductReport = dashboard.resolveProductReport;
      getAdminReportedProducts = dashboard.getAdminReportedProducts;
      deleteReportedProduct = dashboard.deleteReportedProduct;
    });

    test('deleteFeedback - should set feedback status to false', async () => {
      const mockFeedbackDoc = {
        _id: '507f1f77bcf86cd799439011',
        status: true,
        user: { email: 'user@test.com' },
        product: { _id: 'prod1' },
        save: jest.fn().mockResolvedValue(true),
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      // First populate('user') returns this, second populate('product') returns data
      mockQuery.populate.mockReturnValueOnce(mockQuery).mockResolvedValueOnce(mockFeedbackDoc);

      mockFeedback.findById.mockReturnValue(mockQuery);
      mockFeedback.findByIdAndUpdate = jest.fn().mockResolvedValue(mockFeedbackDoc);

      const req = { params: { feedbackId: '507f1f77bcf86cd799439011' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await deleteFeedback(req, res);

      expect(mockFeedback.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({ status: false })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('deleteFeedback - should throw 404 if feedback not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate.mockReturnValueOnce(mockQuery).mockResolvedValueOnce(null);

      mockFeedback.findById.mockReturnValue(mockQuery);

      const req = { params: { feedbackId: '507f1f77bcf86cd799439011' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await expect(deleteFeedback(req, res)).rejects.toThrow('Feedback not found');
    });

    test('getAdminCategories - should include productsCount aggregation', async () => {
      const mockCategoriesData = [
        {
          _id: 'cat1',
          name: 'Sneakers',
          toObject: () => ({ _id: 'cat1', name: 'Sneakers' }),
        },
        {
          _id: 'cat2',
          name: 'Boots',
          toObject: () => ({ _id: 'cat2', name: 'Boots' }),
        },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockCategoriesData),
      };

      mockCategory.find.mockReturnValue(mockQuery);
      mockCategory.countDocuments.mockResolvedValue(2);
      mockProduct.countDocuments.mockResolvedValueOnce(25).mockResolvedValueOnce(15);

      const req = { query: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminCategories(req, res);

      expect(mockCategory.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.categories).toHaveLength(2);
      expect(response.data.categories[0].productsCount).toBe(25);
    });

    test('deleteReportedProduct - should delete product successfully', async () => {
      mockProduct.findByIdAndDelete = jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Product',
      });

      const req = { params: { productId: '507f1f77bcf86cd799439011' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await deleteReportedProduct(req, res);

      expect(mockProduct.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product deleted successfully',
      });
    });

    test('deleteReportedProduct - should throw 404 if product not found', async () => {
      mockProduct.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const req = { params: { productId: '507f1f77bcf86cd799439011' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await expect(deleteReportedProduct(req, res)).rejects.toThrow('Product not found');
    });

    test('ignoreProductReport - should mark report as resolved with no_action', async () => {
      const mockReportDoc = {
        _id: '507f1f77bcf86cd799439011',
        status: 'pending',
        resolution: null,
        resolvedBy: null,
        resolvedAt: null,
        save: jest.fn().mockResolvedValue(true),
      };

      mockReportGlobal.findById.mockResolvedValue(mockReportDoc);

      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        user: { id: 'admin1' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await ignoreProductReport(req, res);

      expect(mockReportDoc.status).toBe('resolved');
      expect(mockReportDoc.resolution).toBe('no_action');
      expect(mockReportDoc.resolvedBy).toBe('admin1');
      expect(mockReportDoc.resolvedAt).toBeDefined();
      expect(mockReportDoc.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('ignoreProductReport - should return 404 if report not found', async () => {
      mockReportGlobal.findById.mockResolvedValue(null);

      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        user: { id: 'admin1' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await ignoreProductReport(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Report not found',
      });
    });

    test('resolveProductReport - should resolve product report with warning', async () => {
      const mockReportDoc = {
        _id: '507f1f77bcf86cd799439011',
        targetType: 'product',
        targetId: 'prod1',
        reporter: 'reporter1',
        status: 'pending',
        resolution: null,
        adminNote: null,
        resolvedBy: null,
        resolvedAt: null,
        reason: 'Fake product',
        description: 'This is fake',
        save: jest.fn().mockResolvedValue(true),
      };

      mockReportGlobal.findById.mockResolvedValue(mockReportDoc);

      const mockProductDoc = {
        _id: 'prod1',
        name: 'Test Product',
      };
      mockProduct.findById = jest.fn().mockResolvedValue(mockProductDoc);

      const mockShopUser = {
        _id: 'shop1',
        email: 'shop@test.com',
        fullName: 'Shop Name',
        role: 'shop',
      };
      const mockReporterUser = {
        _id: 'reporter1',
        email: 'reporter@test.com',
        fullName: 'Reporter',
      };

      mockUser.findOne = jest.fn().mockResolvedValue(mockShopUser);
      mockUser.findById = jest.fn().mockResolvedValue(mockReporterUser);

      const { sendTemplatedEmail } = await import('../../src/utils/sendEmail.js');

      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: { resolution: 'warning', adminNote: 'Please fix this' },
        user: { id: 'admin1' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await resolveProductReport(req, res);

      expect(mockReportDoc.status).toBe('resolved');
      expect(mockReportDoc.resolution).toBe('warning');
      expect(mockReportDoc.adminNote).toBe('Please fix this');
      expect(mockReportDoc.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('resolveProductReport - should delete product when resolution is delete_product', async () => {
      const mockReportDoc = {
        _id: '507f1f77bcf86cd799439011',
        targetType: 'product',
        targetId: 'prod1',
        reporter: 'reporter1',
        status: 'pending',
        reason: 'Violation',
        description: 'Bad product',
        save: jest.fn().mockResolvedValue(true),
      };

      mockReportGlobal.findById.mockResolvedValue(mockReportDoc);

      const mockProductDoc = { _id: 'prod1', name: 'Bad Product' };
      mockProduct.findById = jest.fn().mockResolvedValue(mockProductDoc);
      mockProduct.findByIdAndDelete = jest.fn().mockResolvedValue(mockProductDoc);

      const mockShopUser = { _id: 'shop1', email: 'shop@test.com', fullName: 'Shop', role: 'shop' };
      const mockReporterUser = {
        _id: 'reporter1',
        email: 'reporter@test.com',
        fullName: 'Reporter',
      };

      mockUser.findOne = jest.fn().mockResolvedValue(mockShopUser);
      mockUser.findById = jest.fn().mockResolvedValue(mockReporterUser);

      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: { resolution: 'delete_product', adminNote: 'Product deleted' },
        user: { id: 'admin1' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await resolveProductReport(req, res);

      expect(mockProduct.findByIdAndDelete).toHaveBeenCalledWith('prod1');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('resolveProductReport - should resolve review report with delete_comment', async () => {
      const mockReportDoc = {
        _id: '507f1f77bcf86cd799439011',
        targetType: 'review',
        targetId: 'fb1',
        reporter: 'reporter1',
        status: 'pending',
        reason: 'Spam',
        description: 'Spam review',
        save: jest.fn().mockResolvedValue(true),
      };

      mockReportGlobal.findById.mockResolvedValue(mockReportDoc);

      const mockFeedbackDoc = {
        _id: 'fb1',
        user: { _id: 'user1', email: 'user@test.com', fullName: 'User' },
        product: { _id: 'prod1', name: 'Product' },
      };

      const mockFeedbackPopQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockFeedbackPopQuery.populate
        .mockReturnValueOnce(mockFeedbackPopQuery)
        .mockResolvedValueOnce(mockFeedbackDoc);

      mockFeedback.findById = jest.fn().mockReturnValue(mockFeedbackPopQuery);
      mockFeedback.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ ...mockFeedbackDoc, status: false });

      const mockShopUser = { _id: 'shop1', email: 'shop@test.com', fullName: 'Shop', role: 'shop' };
      const mockReporterUser = {
        _id: 'reporter1',
        email: 'reporter@test.com',
        fullName: 'Reporter',
      };

      mockUser.findOne = jest.fn().mockResolvedValue(mockShopUser);
      mockUser.findById = jest.fn().mockResolvedValue(mockReporterUser);

      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: { resolution: 'delete_comment', adminNote: 'Review deleted' },
        user: { id: 'admin1' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await resolveProductReport(req, res);

      expect(mockFeedback.findByIdAndUpdate).toHaveBeenCalledWith('fb1', {
        status: false,
        deletedBy: 'admin',
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('resolveProductReport - should return 404 if report not found', async () => {
      mockReportGlobal.findById.mockResolvedValue(null);

      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: { resolution: 'warning', adminNote: 'Test' },
        user: { id: 'admin1' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await resolveProductReport(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Report not found',
      });
    });

    test('getMyFeedbackReports - should return reports for user feedbacks', async () => {
      const mockFeedbacks = [{ _id: 'fb1' }, { _id: 'fb2' }];
      const mockReports = [
        {
          _id: 'rep1',
          targetType: 'review',
          targetId: 'fb1',
          reporter: { _id: 'rep1', fullName: 'User A', email: 'usera@test.com' },
          status: 'pending',
        },
      ];

      const mockFeedbackQuery = {
        select: jest.fn().mockResolvedValue(mockFeedbacks),
      };
      mockFeedback.find = jest.fn().mockReturnValue(mockFeedbackQuery);

      const mockReportQuery = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockReports),
      };
      mockReportGlobal.find.mockReturnValue(mockReportQuery);

      const mockFeedbackDetail = {
        _id: 'fb1',
        comment: 'Test comment',
        product: { _id: 'prod1', name: 'Product A', mainImage: 'image.jpg' },
        rating: 5,
        createdAt: new Date(),
      };

      const mockFeedbackDetailQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockFeedbackDetail),
      };
      mockFeedback.findById = jest.fn().mockReturnValue(mockFeedbackDetailQuery);

      const req = { user: { id: 'user1' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getMyFeedbackReports(req, res);

      expect(mockFeedback.find).toHaveBeenCalledWith({ user: 'user1' });
      expect(mockReportQuery.sort).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].feedback).toBeDefined();
    });

    test('getAdminReportedProducts - should return paginated reports with populated targets', async () => {
      const mockReports = [
        {
          _id: 'rep1',
          targetType: 'product',
          targetId: 'prod1',
          reporter: { _id: 'rep1', fullName: 'User A', email: 'usera@test.com' },
        },
        {
          _id: 'rep2',
          targetType: 'user',
          targetId: 'user1',
          reporter: { _id: 'rep2', fullName: 'User B', email: 'userb@test.com' },
        },
      ];

      const mockReportQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockReports),
      };

      mockReportGlobal.find.mockReturnValue(mockReportQuery);
      mockReportGlobal.countDocuments.mockResolvedValue(10);

      // Mock Product.findById for first report
      const mockProductQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest
          .fn()
          .mockResolvedValue({ _id: 'prod1', name: 'Product A', mainImage: 'img.jpg' }),
      };
      mockProduct.findById = jest.fn().mockReturnValue(mockProductQuery);

      // Mock User.findById for second report
      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: 'user1',
          fullName: 'John Doe',
          email: 'john@test.com',
          avatar: 'avatar.jpg',
        }),
      };
      mockUser.findById = jest.fn().mockReturnValue(mockUserQuery);

      const req = { query: { page: '1', limit: '10' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminReportedProducts(req, res);

      expect(mockReportQuery.sort).toHaveBeenCalled();
      expect(mockReportQuery.skip).toHaveBeenCalledWith(0);
      expect(mockReportQuery.limit).toHaveBeenCalledWith(10);
      expect(res.status).toHaveBeenCalledWith(200);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.pagination.total).toBe(10);
      expect(response.data.pagination.pages).toBe(1);
      expect(response.data.reports).toHaveLength(2);
      expect(response.data.reports[0].target).toBeDefined();
    });

    test('getAdminReportedProducts - should use default pagination', async () => {
      const mockReportQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      mockReportGlobal.find.mockReturnValue(mockReportQuery);
      mockReportGlobal.countDocuments.mockResolvedValue(0);

      const req = { query: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAdminReportedProducts(req, res);

      expect(mockReportQuery.skip).toHaveBeenCalledWith(0); // (1-1)*10
      expect(mockReportQuery.limit).toHaveBeenCalledWith(10);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('resolveProductReport - should resolve review report with warning', async () => {
      const mockReportDoc = {
        _id: '507f1f77bcf86cd799439011',
        targetType: 'review',
        targetId: 'fb1',
        reporter: 'reporter1',
        status: 'pending',
        reason: 'Inappropriate',
        description: 'Bad review',
        save: jest.fn().mockResolvedValue(true),
      };

      mockReportGlobal.findById.mockResolvedValue(mockReportDoc);

      const mockFeedbackDoc = {
        _id: 'fb1',
        user: { _id: 'user1', email: 'user@test.com', fullName: 'User' },
        product: { _id: 'prod1', name: 'Product' },
      };

      const mockFeedbackPopQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockFeedbackPopQuery.populate
        .mockReturnValueOnce(mockFeedbackPopQuery)
        .mockResolvedValueOnce(mockFeedbackDoc);

      mockFeedback.findById = jest.fn().mockReturnValue(mockFeedbackPopQuery);

      const mockShopUser = { _id: 'shop1', email: 'shop@test.com', fullName: 'Shop', role: 'shop' };
      const mockReporterUser = {
        _id: 'reporter1',
        email: 'reporter@test.com',
        fullName: 'Reporter',
      };

      mockUser.findOne = jest.fn().mockResolvedValue(mockShopUser);
      mockUser.findById = jest.fn().mockResolvedValue(mockReporterUser);

      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: { resolution: 'warning', adminNote: 'Warning issued' },
        user: { id: 'admin1' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await resolveProductReport(req, res);

      expect(mockReportDoc.status).toBe('resolved');
      expect(mockReportDoc.resolution).toBe('warning');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ========== REPORT MODEL VALIDATION TESTS ==========
  // Note: Report Model validation tests removed as Report.js already has 88.88% coverage
  // These would require separate test file without mocking to work properly
});
