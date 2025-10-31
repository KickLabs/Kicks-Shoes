/**
 * @fileoverview Unit tests for Order Model
 * @file order-model.test.js
 * @description Test cases to cover all statements in Order model including validators, virtuals, pre-save hooks, and methods
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import OrderItem from '../src/models/OrderItem.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';

describe('Order Model - Complete Coverage Tests', () => {
  let testUser;
  let testOrderItem;
  let testOrderItem2;
  let testProduct;

  beforeAll(async () => {
    // Kết nối database test với database name riêng để tránh conflict
    const testId = process.env.JEST_WORKER_ID || 'model';
    const mongoUri =
      process.env.MONGODB_URI || `mongodb://localhost:27017/kicks-shoes-test-order-model-${testId}`;

    // Đóng connection cũ nếu có
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    // Xóa dữ liệu cũ - xóa theo thứ tự để tránh reference issues
    await Order.deleteMany({});
    await OrderItem.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // Tạo test user với unique identifier để tránh duplicate key error
    // Sử dụng timestamp + random để đảm bảo unique
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    testUser = await User.create({
      fullName: 'Test User',
      username: `testuser${timestamp}${random}`,
      email: `test${timestamp}${random}@example.com`,
      password: 'Password123!',
      phone: `090512${(timestamp % 10000).toString().padStart(4, '0')}`,
    });

    // Tạo test product để OrderItem có thể populate
    testProduct = await Product.create({
      name: 'Test Product',
      price: { regular: 100000 },
      finalPrice: 100000,
      description: 'Test Description',
      category: new mongoose.Types.ObjectId(),
      brand: 'Test Brand',
      productType: 'shoes',
      images: ['http://example.com/image.jpg'],
      inventory: [{ size: 42, color: 'Black', quantity: 10 }],
    });

    // Tạo test order items với product thực tế
    testOrderItem = await OrderItem.create({
      order: new mongoose.Types.ObjectId(),
      product: testProduct._id,
      quantity: 1,
      price: 100,
      size: '42',
      color: 'Black',
      subtotal: 100,
    });

    testOrderItem2 = await OrderItem.create({
      order: new mongoose.Types.ObjectId(),
      product: testProduct._id,
      quantity: 2,
      price: 150,
      size: '43',
      color: 'White',
      subtotal: 300,
    });
  });

  afterAll(async () => {
    // Cleanup: Xóa tất cả dữ liệu test
    await Order.deleteMany({});
    await OrderItem.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // Đóng connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('estimatedDelivery Validator', () => {
    test('OM-001: Should accept null estimatedDelivery (optional)', async () => {
      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        estimatedDelivery: null,
      });

      await expect(order.save()).resolves.toBeDefined();
      expect(order.estimatedDelivery).toBeNull();
    });

    test('OM-002: Should accept undefined estimatedDelivery (optional)', async () => {
      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        // estimatedDelivery không được set
      });

      await expect(order.save()).resolves.toBeDefined();
      expect(order.estimatedDelivery).toBeUndefined();
    });

    test('OM-003: Should accept future date for estimatedDelivery', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 ngày sau

      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        estimatedDelivery: futureDate,
      });

      await expect(order.save()).resolves.toBeDefined();
      expect(order.estimatedDelivery).toEqual(futureDate);
    });

    test('OM-004: Should reject past date for estimatedDelivery', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // 1 ngày trước

      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        estimatedDelivery: pastDate,
      });

      await expect(order.save()).rejects.toThrow('Estimated delivery date must be in the future');
    });
  });

  describe('Virtual Properties', () => {
    test('OM-005: formattedOrderNumber should return empty string when orderNumber is null', () => {
      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        orderNumber: null,
      });

      expect(order.formattedOrderNumber).toBe('');
    });

    test('OM-006: formattedOrderNumber should return formatted string when orderNumber exists', async () => {
      const order = await Order.create({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
      });

      expect(order.formattedOrderNumber).toBe(`#${order.orderNumber}`);
    });

    test('OM-007: formattedTotalPrice should return "0.00" when totalPrice is null', () => {
      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
      });

      // Set totalPrice to null để test virtual property
      order.totalPrice = null;
      expect(order.formattedTotalPrice).toBe('0.00');
    });

    test('OM-008: formattedTotalPrice should return formatted string when totalPrice exists', () => {
      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 123.45,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
      });

      expect(order.formattedTotalPrice).toBe('123.45');
    });

    test('OM-009: formattedShippingCost should return "0.00" when shippingCost is null/undefined', () => {
      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        shippingCost: null,
      });

      expect(order.formattedShippingCost).toBe('0.00');
    });

    test('OM-010: formattedShippingCost should return formatted string when shippingCost exists', () => {
      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        shippingCost: 25.5,
      });

      expect(order.formattedShippingCost).toBe('25.50');
    });

    test('OM-011: formattedTax should return "0.00" when tax is null/undefined', () => {
      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        tax: null,
      });

      expect(order.formattedTax).toBe('0.00');
    });

    test('OM-012: formattedTax should return formatted string when tax exists', () => {
      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        tax: 10.75,
      });

      expect(order.formattedTax).toBe('10.75');
    });

    test('OM-013: formattedDiscount should return "0.00" when discount is null/undefined', () => {
      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        discount: null,
      });

      expect(order.formattedDiscount).toBe('0.00');
    });

    test('OM-014: formattedDiscount should return formatted string when discount exists', () => {
      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        discount: 15.25,
      });

      expect(order.formattedDiscount).toBe('15.25');
    });

    test('OM-015: formattedSubtotal should return "0.00" when subtotal is null/undefined', () => {
      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
      });

      // Set subtotal to null để test virtual property
      order.subtotal = null;
      expect(order.formattedSubtotal).toBe('0.00');
    });

    test('OM-016: formattedSubtotal should return formatted string when subtotal exists', () => {
      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 99.99,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
      });

      expect(order.formattedSubtotal).toBe('99.99');
    });

    test('OM-017: orderSummary should return formatted summary object', async () => {
      const order = await Order.create({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 135.75,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        shippingCost: 25.5,
        tax: 10.25,
        discount: 0,
      });

      const summary = order.orderSummary;
      expect(summary).toBeDefined();
      expect(summary.subtotal).toBe('100.00');
      expect(summary.shipping).toBe('25.50');
      expect(summary.tax).toBe('10.25');
      expect(summary.discount).toBe('0.00');
      expect(summary.total).toBe('135.75');
    });
  });

  describe('Pre-save Hook: Order Number Generation', () => {
    test('OM-018: Should handle error in order number generation', async () => {
      // Mock countDocuments để throw error
      const originalCountDocuments = Order.countDocuments;
      Order.countDocuments = jest.fn().mockRejectedValue(new Error('Database error'));

      const order = new Order({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
      });

      await expect(order.save()).rejects.toThrow('Database error');

      // Restore
      Order.countDocuments = originalCountDocuments;
    });
  });

  describe('Pre-save Hook: Items Validation', () => {
    test('OM-019: Should skip validation for new documents', async () => {
      // Test với items không rỗng vì schema yêu cầu items là required
      // Hook chỉ validate khi updating, không validate khi creating
      const order = await Order.create({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
      });

      expect(order).toBeDefined();
      // Validation được skip cho new documents, nên không có lỗi
    });

    test('OM-020: Should reject empty items array when updating existing order', async () => {
      const order = await Order.create({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
      });

      // Update với items rỗng
      order.items = [];
      order.markModified('items');

      await expect(order.save()).rejects.toThrow('Order must have at least one item');
    });

    test('OM-021: Should allow non-empty items when updating', async () => {
      const order = await Order.create({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        shippingCost: 0,
        tax: 0,
        discount: 0,
      });

      // Update với items không rỗng và update totalPrice tương ứng
      // testOrderItem có subtotal = 100, testOrderItem2 có subtotal = 300
      // Total calculated = 100 + 300 + 0 + 0 - 0 = 400
      // Nhưng thực tế hook sẽ tính lại từ items trong DB, nên ta cần đảm bảo totalPrice khớp
      const calculatedTotal = testOrderItem.subtotal + testOrderItem2.subtotal + 0 + 0 - 0;
      order.items = [testOrderItem._id, testOrderItem2._id];
      order.totalPrice = calculatedTotal; // Update totalPrice để khớp với tổng mới
      order.markModified('items');
      order.markModified('totalPrice');

      await expect(order.save()).resolves.toBeDefined();
    });
  });

  describe('Pre-save Hook: Total Price Validation', () => {
    test('OM-022: Should skip validation for new documents', async () => {
      const order = await Order.create({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
      });

      expect(order).toBeDefined();
    });

    test('OM-023: Should skip validation when neither totalPrice nor items are modified', async () => {
      const order = await Order.create({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
      });

      // Update field khác, không phải totalPrice hoặc items
      order.status = 'processing';
      // Không markModified totalPrice hoặc items

      await expect(order.save()).resolves.toBeDefined();
    });

    test('OM-024: Should skip validation when items array is empty after query', async () => {
      const order = await Order.create({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
      });

      // Update với item ID không tồn tại trong database
      // Khi query sẽ trả về mảng rỗng, và sẽ skip validation
      const invalidItemId = new mongoose.Types.ObjectId();
      order.items = [invalidItemId];
      order.markModified('items');

      // Vì OrderItem.find sẽ trả về mảng rỗng (không tìm thấy), nên items.length === 0 và sẽ skip validation
      await expect(order.save()).resolves.toBeDefined();
    });

    test('OM-025: Should reject when totalPrice does not match calculated total', async () => {
      const order = await Order.create({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        shippingCost: 10,
        tax: 5,
        discount: 0,
      });

      // Update totalPrice với giá trị không khớp
      // subtotal = 100, shippingCost = 10, tax = 5, discount = 0
      // calculatedTotal = 100 + 10 + 5 - 0 = 115
      order.totalPrice = 200; // Sai lệch
      order.markModified('totalPrice');

      await expect(order.save()).rejects.toThrow('Total price does not match sum of items');
    });

    test('OM-026: Should accept when totalPrice matches calculated total with tolerance', async () => {
      const order = await Order.create({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        shippingCost: 10,
        tax: 5,
        discount: 0,
      });

      // Update totalPrice với giá trị đúng (115)
      order.totalPrice = 115;
      order.markModified('totalPrice');

      await expect(order.save()).resolves.toBeDefined();
    });

    test('OM-027: Should handle error in total price validation', async () => {
      const order = await Order.create({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
      });

      // Mock mongoose.model để return OrderItem với find() throw error khi exec
      const originalModel = mongoose.model;
      const mockOrderItemModel = {
        find: jest.fn().mockImplementation(() => {
          // Return a thenable object that throws error when awaited
          return {
            exec: jest.fn().mockRejectedValue(new Error('Database query error')),
            then: (onFulfilled, onRejected) => {
              return Promise.reject(new Error('Database query error')).then(
                onFulfilled,
                onRejected
              );
            },
            catch: onRejected => {
              return Promise.reject(new Error('Database query error')).catch(onRejected);
            },
          };
        }),
      };
      mongoose.model = jest.fn(modelName => {
        if (modelName === 'OrderItem') {
          return mockOrderItemModel;
        }
        return originalModel(modelName);
      });

      order.totalPrice = 200;
      order.markModified('totalPrice');

      await expect(order.save()).rejects.toThrow('Database query error');

      // Restore
      mongoose.model = originalModel;
    });
  });

  describe('getOrderDetails Method', () => {
    test('OM-028: Should return order details with populated user and items', async () => {
      const order = await Order.create({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        trackingNumber: 'TRACK1234',
        notes: 'Test notes',
      });

      // Reload order từ database để đảm bảo có đầy đủ methods
      const orderDoc = await Order.findById(order._id);
      expect(orderDoc).toBeDefined();

      // Populate sẽ được gọi và trả về order với user và items đã populate
      // Ta sẽ gọi getOrderDetails và kiểm tra kết quả
      const details = await orderDoc.getOrderDetails();

      expect(details).toBeDefined();
      expect(details._id).toEqual(orderDoc._id);
      expect(details.orderNumber).toBe(orderDoc.formattedOrderNumber);
      expect(details.status).toBe(orderDoc.status);
      expect(details.paymentStatus).toBe(orderDoc.paymentStatus);
      expect(details.paymentMethod).toBe(orderDoc.paymentMethod);
      expect(details.shippingAddress).toBe(orderDoc.shippingAddress);
      expect(details.trackingNumber).toBe(orderDoc.trackingNumber);
      expect(details.notes).toBe(orderDoc.notes);
      expect(details.orderSummary).toBeDefined();
      expect(details.createdAt).toBeDefined();
      expect(details.updatedAt).toBeDefined();
    });

    test('OM-029: Should return order details with null/undefined fields', async () => {
      const order = await Order.create({
        user: testUser._id,
        items: [testOrderItem._id],
        totalPrice: 100,
        subtotal: 100,
        shippingAddress: '123 Test Street, District 1, Ho Chi Minh City',
        paymentMethod: 'cash_on_delivery',
        // orderNumber sẽ được tự động generate
        trackingNumber: null,
        estimatedDelivery: null,
        notes: null,
      });

      // Update order để set orderNumber to null
      order.orderNumber = null;
      await order.save();

      // Reload order từ database
      const orderDoc = await Order.findById(order._id);
      expect(orderDoc).toBeDefined();

      const details = await orderDoc.getOrderDetails();

      expect(details).toBeDefined();
      // orderNumber sẽ được format từ formattedOrderNumber virtual (khi null sẽ là '')
      expect(details.orderNumber).toBe(''); // formattedOrderNumber khi orderNumber là null
      expect(details.trackingNumber).toBeNull();
      expect(details.estimatedDelivery).toBeNull();
      expect(details.notes).toBeNull();
    });
  });
});
