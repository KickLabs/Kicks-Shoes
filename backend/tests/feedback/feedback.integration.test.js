/**
 * @fileoverview Integration Tests for Feedback Controller (Email Functionality Removed)
 * @description Tests to cover feedback controller API endpoints without email sending
 * @created 2025-10-28
 * @updated 2025-10-28 - Removed email functionality as requested
 */

import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../src/app.js';
import Feedback from '../../src/models/Feedback.js';
import Order from '../../src/models/Order.js';
import Product from '../../src/models/Product.js';
import Report from '../../src/models/Report.js';
import User from '../../src/models/User.js';

// Mock sendTemplatedEmail
jest.mock('../../src/utils/sendEmail.js', () => ({
  sendTemplatedEmail: jest.fn().mockResolvedValue(true),
}));

const { sendTemplatedEmail } = await import('../../src/utils/sendEmail.js');

describe('Feedback Controller Integration Tests - Basic Functionality', () => {
  let testUser, testShop, adminUser, testProduct, testOrder;
  let userToken, shopToken, adminToken;

  beforeAll(async () => {
    // Clean up any existing data first
    await Report.deleteMany({});
    await Feedback.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // Ensure unique indexes are created
    await Feedback.createIndexes();

    // Create test users with unique identifiers - FIX: Use valid roles
    const timestamp = Date.now();
    testUser = await User.create({
      username: `testuser_${timestamp}`,
      email: `user_${timestamp}@test.com`,
      password: 'password123',
      fullName: 'Test User',
      role: 'customer', // Valid role
      isVerified: true,
    });

    testShop = await User.create({
      username: `testshop_${timestamp}`,
      email: `shop_${timestamp}@test.com`,
      password: 'password123',
      fullName: 'Test Shop',
      role: 'admin', // Changed from 'seller' to valid role
      isVerified: true,
    });

    adminUser = await User.create({
      username: `testadmin_${timestamp}`,
      email: `admin_${timestamp}@test.com`,
      password: 'password123',
      fullName: 'Test Admin',
      role: 'admin',
      isVerified: true,
    });

    // Generate JWT tokens
    const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_123';
    userToken = jwt.sign({ id: testUser._id, role: testUser.role }, JWT_SECRET, {
      expiresIn: '1d',
    });
    shopToken = jwt.sign({ id: testShop._id, role: testShop.role }, JWT_SECRET, {
      expiresIn: '1d',
    });
    adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, JWT_SECRET, {
      expiresIn: '1d',
    });

    // Create test product
    testProduct = await Product.create({
      name: 'Test Product',
      price: { regular: 100000 },
      finalPrice: 100000,
      description: 'Test Description',
      category: new mongoose.Types.ObjectId(),
      brand: 'Test Brand',
      productType: 'shoes',
      images: ['http://example.com/image.jpg'],
      inventory: [{ size: 42, color: 'black', quantity: 10, sku: 'TEST-42' }],
      shop: testShop._id,
    });

    // Create test order
    testOrder = await Order.create({
      user: testUser._id,
      items: [testProduct._id],
      subtotal: 100000,
      totalPrice: 100000,
      status: 'delivered',
      paymentMethod: 'cash_on_delivery',
      shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
    });
  });

  afterAll(async () => {
    await Report.deleteMany({});
    await Feedback.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Feedback Model - Unit Tests', () => {
    describe('1. Feedback Model (Feedback.js)', () => {
      test('Should enforce unique index (user, order, product)', async () => {
        await Feedback.deleteMany({ user: testUser._id, product: testProduct._id });

        const uniqueOrder = await Order.create({
          user: testUser._id,
          items: [testProduct._id],
          subtotal: 100000,
          totalPrice: 100000,
          status: 'delivered',
          paymentMethod: 'cash_on_delivery',
          shippingAddress: 'Unique Test Street',
        });

        const feedback1 = await Feedback.create({
          user: testUser._id,
          product: testProduct._id,
          order: uniqueOrder._id,
          rating: 5,
          comment: 'Great product test',
        });

        await expect(
          Feedback.create({
            user: testUser._id,
            product: testProduct._id,
            order: uniqueOrder._id,
            rating: 4,
            comment: 'Different comment but same user/product/order',
          })
        ).rejects.toThrow(/duplicate key error|E11000/);

        await Feedback.findByIdAndDelete(feedback1._id);
        await Order.findByIdAndDelete(uniqueOrder._id);
      });

      test('Should allow same user to review different products', async () => {
        await Feedback.deleteMany({ user: testUser._id });

        const product2 = await Product.create({
          name: 'Test Product 2',
          price: { regular: 150000 },
          finalPrice: 150000,
          description: 'Test Description 2',
          category: new mongoose.Types.ObjectId(),
          brand: 'Test Brand',
          productType: 'shoes',
          images: ['http://example.com/image2.jpg'],
          inventory: [{ size: 43, color: 'white', quantity: 15, sku: 'TEST-43' }],
          shop: testShop._id,
        });

        const order1 = await Order.create({
          user: testUser._id,
          items: [testProduct._id],
          subtotal: 100000,
          totalPrice: 100000,
          status: 'delivered',
          paymentMethod: 'cash_on_delivery',
          shippingAddress: 'First Test Street',
        });

        const order2 = await Order.create({
          user: testUser._id,
          items: [product2._id],
          subtotal: 150000,
          totalPrice: 150000,
          status: 'delivered',
          paymentMethod: 'cash_on_delivery',
          shippingAddress: 'Second Test Street',
        });

        const feedback1 = await Feedback.create({
          user: testUser._id,
          product: testProduct._id,
          order: order1._id,
          rating: 5,
          comment: 'First product review',
        });

        const feedback2 = await Feedback.create({
          user: testUser._id,
          product: product2._id,
          order: order2._id,
          rating: 4,
          comment: 'Second product review',
        });

        expect(feedback1._id).toBeDefined();
        expect(feedback2._id).toBeDefined();

        await Feedback.deleteMany({ _id: { $in: [feedback1._id, feedback2._id] } });
        await Order.deleteMany({ _id: { $in: [order1._id, order2._id] } });
        await Product.findByIdAndDelete(product2._id);
      });

      test('Should validate required fields', async () => {
        await expect(
          Feedback.create({
            user: testUser._id,
            product: testProduct._id,
            comment: 'Test comment',
          })
        ).rejects.toThrow();
      });

      test('Should validate rating range (1-5)', async () => {
        const newOrder = await Order.create({
          user: testUser._id,
          items: [testProduct._id],
          subtotal: 100000,
          totalPrice: 100000,
          status: 'delivered',
          paymentMethod: 'cash_on_delivery',
          shippingAddress: '789 Test Street',
        });

        await expect(
          Feedback.create({
            user: testUser._id,
            product: testProduct._id,
            order: newOrder._id,
            rating: 0,
            comment: 'Invalid rating low',
          })
        ).rejects.toThrow();

        await expect(
          Feedback.create({
            user: testUser._id,
            product: testProduct._id,
            order: newOrder._id,
            rating: 6,
            comment: 'Invalid rating high',
          })
        ).rejects.toThrow();

        await Order.findByIdAndDelete(newOrder._id);
      });

      test('Should set default values correctly', async () => {
        const newOrder = await Order.create({
          user: testUser._id,
          items: [testProduct._id],
          subtotal: 100000,
          totalPrice: 100000,
          status: 'delivered',
          paymentMethod: 'cash_on_delivery',
          shippingAddress: '101 Test Street',
        });

        const feedback = await Feedback.create({
          user: testUser._id,
          product: testProduct._id,
          order: newOrder._id,
          rating: 5,
          comment: 'Test comment for defaults',
        });

        expect(feedback.status).toBe(true);
        expect(feedback.isVerified).toBe(false);
        expect(feedback.images).toEqual([]);
        expect(feedback.deletedBy).toBeNull();

        await Feedback.findByIdAndDelete(feedback._id);
        await Order.findByIdAndDelete(newOrder._id);
      });
    });
  });

  describe('reportFeedback - Basic Functionality Coverage', () => {
    test('Should create report successfully without emails', async () => {
      const freshOrder = await Order.create({
        user: testUser._id,
        items: [testProduct._id],
        subtotal: 100000,
        totalPrice: 100000,
        status: 'delivered',
        paymentMethod: 'cash_on_delivery',
        shippingAddress: 'Report Test Street',
      });

      const freshFeedback = await Feedback.create({
        user: testUser._id,
        product: testProduct._id,
        order: freshOrder._id,
        rating: 4,
        comment: 'Fresh feedback for testing reports',
      });

      const response = await request(app)
        .post(`/api/feedback/${freshFeedback._id}/report`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reason: 'spam',
          description: 'This review seems inappropriate',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      await Feedback.findByIdAndDelete(freshFeedback._id);
      await Order.findByIdAndDelete(freshOrder._id);
    });

    test('Should return 404 for non-existent feedback', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/feedback/${fakeId}/report`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reason: 'spam',
          description: 'Test description',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('adminApproveFeedback - Basic Functionality Coverage', () => {
    test('Should handle PUT (Approve) request successfully', async () => {
      const freshOrder = await Order.create({
        user: testUser._id,
        items: [testProduct._id],
        subtotal: 100000,
        totalPrice: 100000,
        status: 'delivered',
        paymentMethod: 'cash_on_delivery',
        shippingAddress: 'Approve Test Street',
      });

      const freshFeedback = await Feedback.create({
        user: testUser._id,
        product: testProduct._id,
        order: freshOrder._id,
        rating: 4,
        comment: 'Approve test feedback content',
      });

      // Create a report for this feedback
      const report = await Report.create({
        reporter: testUser._id,
        targetType: 'review',
        targetId: freshFeedback._id,
        reason: 'spam',
        description: 'Test report for admin approval',
        status: 'pending',
      });

      const response = await request(app)
        .put(`/api/feedback/${freshFeedback._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      await Report.findByIdAndDelete(report._id);
      await Feedback.findByIdAndDelete(freshFeedback._id);
      await Order.findByIdAndDelete(freshOrder._id);
    });

    test('Should handle DELETE (Reject) request', async () => {
      const deleteOrder = await Order.create({
        user: testUser._id,
        items: [testProduct._id],
        subtotal: 100000,
        totalPrice: 100000,
        status: 'delivered',
        paymentMethod: 'cash_on_delivery',
        shippingAddress: 'Delete Test Street',
      });

      const deleteFeedback = await Feedback.create({
        user: testUser._id,
        product: testProduct._id,
        order: deleteOrder._id,
        rating: 3,
        comment: 'Test feedback for deletion process',
      });

      // Create a report for this feedback
      const report = await Report.create({
        reporter: testUser._id,
        targetType: 'review',
        targetId: deleteFeedback._id,
        reason: 'spam',
        description: 'Test report for admin deletion',
        status: 'pending',
      });

      const response = await request(app)
        .delete(`/api/feedback/${deleteFeedback._id}/delete`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      await Report.findByIdAndDelete(report._id);
      await Feedback.findByIdAndDelete(deleteFeedback._id);
      await Order.findByIdAndDelete(deleteOrder._id);
    });

    test('Should return 404 for non-existent feedback', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/feedback/${fakeId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    test('Should require admin role', async () => {
      const freshOrder = await Order.create({
        user: testUser._id,
        items: [testProduct._id],
        subtotal: 100000,
        totalPrice: 100000,
        status: 'delivered',
        paymentMethod: 'cash_on_delivery',
        shippingAddress: 'Role Test Street',
      });

      const freshFeedback = await Feedback.create({
        user: testUser._id,
        product: testProduct._id,
        order: freshOrder._id,
        rating: 3,
        comment: 'Role test feedback content',
      });

      // Create a report for this feedback
      const report = await Report.create({
        reporter: testUser._id,
        targetType: 'review',
        targetId: freshFeedback._id,
        reason: 'spam',
        description: 'Test report for role test',
        status: 'pending',
      });

      const response = await request(app)
        .put(`/api/feedback/${freshFeedback._id}/approve`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);

      await Report.findByIdAndDelete(report._id);
      await Feedback.findByIdAndDelete(freshFeedback._id);
      await Order.findByIdAndDelete(freshOrder._id);
    });
  });
});
