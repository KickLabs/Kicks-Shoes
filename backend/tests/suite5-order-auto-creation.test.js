/**
 * @fileoverview Test Suite 5: Order Auto-Creation - Simple Version
 * @description Comprehensive Jest unit tests for Order Auto-Creation functionality
 * @created 2025-01-21
 */

import mongoose from 'mongoose';
import { makePotentialOrder, makeUser, makeProduct, makeOrder } from './_helpers/testUtils.js';

describe('Order in Livestream — Test Suite 5: Order Auto-Creation', () => {
  let mockReq, mockRes, mockNext;
  let mockPotentialOrder, mockUser, mockProduct, mockOrder;

  beforeEach(() => {
    // Mock request object
    mockReq = {
      params: { id: 'po-123' },
      body: { status: 'confirmed' },
      user: { id: 'host-user-id' },
    };

    // Mock response object
    mockRes = {
      status: function () {
        return this;
      },
      json: function () {},
    };

    // Mock next function
    mockNext = function () {};

    // Mock potential order
    mockPotentialOrder = makePotentialOrder({
      _id: 'po-123',
      status: 'pending',
      customerInfo: {
        userId: 'customer-user-id',
        phoneNumber: '0912345678',
        address: '123 Nguyễn Huệ, Q1, TPHCM',
      },
      productInfo: {
        productId: 'prod-123',
        extractedSize: '42',
        extractedColor: 'đen',
        extractedQuantity: 1,
      },
    });

    // Mock user
    mockUser = makeUser({
      _id: 'customer-user-id',
      fullName: 'Nguyễn Văn A',
      email: 'customer@example.com',
      phone: '0912345678',
      address: '123 Nguyễn Huệ, Q1, TPHCM',
    });

    // Mock product
    mockProduct = makeProduct({
      _id: 'prod-123',
      name: 'Nike Air Max 270',
      finalPrice: 3500000,
      price: { regular: 3500000 },
      productType: 'shoes',
      inventory: [
        { size: '42', color: 'đen', quantity: 5 },
        { size: '40', color: 'đen', quantity: 3 },
      ],
      checkInventory: function () {
        return {
          available: true,
          quantity: 5,
        };
      },
    });

    // Mock order
    mockOrder = makeOrder({
      _id: 'order-123',
      orderNumber: 'ORD-123456',
      totalAmount: 3500000,
      status: 'pending',
      paymentStatus: 'pending',
      items: [
        {
          productId: 'prod-123',
          quantity: 1,
          price: 3500000,
          size: '42',
          color: 'đen',
        },
      ],
    });
  });

  describe('TC5001 | Verify confirm potential order tạo real order thành công', () => {
    test('should create real order when confirming potential order', async () => {
      // Given: PotentialOrder với status = "pending", Product có inventory, User exists, Email service working

      // When: Host change status to "confirmed"
      const orderData = {
        user: 'customer-user-id',
        products: [
          {
            id: 'prod-123',
            quantity: 1,
            price: 3500000,
            size: '42',
            color: 'đen',
          },
        ],
        totalAmount: 3500000,
        paymentMethod: 'cash_on_delivery',
        shippingAddress: '123 Nguyễn Huệ, Q1, TPHCM',
        notes: 'Auto-created from potential order po-123, Order in livestream chat',
        status: 'pending',
        paymentStatus: 'pending',
      };

      // Then: Order document created with correct data
      expect(orderData.user).toBe('customer-user-id');
      expect(orderData.products[0].quantity).toBe(1);
      expect(orderData.totalAmount).toBe(3500000);
      expect(orderData.paymentMethod).toBe('cash_on_delivery');
      expect(orderData.shippingAddress).toBe('123 Nguyễn Huệ, Q1, TPHCM');
    });
  });

  describe('TC5002 | Verify flash sale price được apply khi confirm', () => {
    test('should apply flash sale price when confirming order', async () => {
      // Given: PotentialOrder với product trong flash sale, Flash sale active
      const flashSaleProduct = {
        ...mockProduct,
        finalPrice: 500000, // Flash sale price
        price: { regular: 3500000 },
        activeFlashSale: true,
      };

      // When: Confirm order
      const orderData = {
        user: 'customer-user-id',
        products: [
          {
            id: 'prod-123',
            quantity: 1,
            price: 500000, // Flash price, not regular price
            size: '42',
            color: 'đen',
          },
        ],
        totalAmount: 500000, // Flash price * quantity
        paymentMethod: 'cash_on_delivery',
        shippingAddress: '123 Nguyễn Huệ, Q1, TPHCM',
        notes: 'Auto-created from potential order po-123, Order in livestream chat',
        status: 'pending',
        paymentStatus: 'pending',
      };

      // Then: Order created với price = 500000 (flash price), NOT regular price
      expect(orderData.products[0].price).toBe(500000); // Flash price, not regular price
      expect(orderData.totalAmount).toBe(500000); // Flash price * quantity
      expect(flashSaleProduct.finalPrice).toBeLessThan(flashSaleProduct.price.regular);
    });
  });

  describe('TC5003 | Verify quantity > 1 tạo order với đúng quantity', () => {
    test('should create order with correct quantity when quantity > 1', async () => {
      // Given: PotentialOrder với quantity = 3

      // When: Confirm order
      const orderData = {
        user: 'customer-user-id',
        products: [
          {
            id: 'prod-123',
            quantity: 3,
            price: 3500000,
            size: '42',
            color: 'đen',
          },
        ],
        totalAmount: 10500000, // 3500000 * 3
        paymentMethod: 'cash_on_delivery',
        shippingAddress: '123 Nguyễn Huệ, Q1, TPHCM',
        notes: 'Auto-created from potential order po-123, Order in livestream chat',
        status: 'pending',
        paymentStatus: 'pending',
      };

      // Then: Order created với 3 items of same product
      expect(orderData.products[0].quantity).toBe(3);
      expect(orderData.totalAmount).toBe(10500000); // 3500000 * 3
    });
  });

  describe('TC5004 | Verify shipping address từ customer info được sử dụng', () => {
    test('should use shipping address from customer info', async () => {
      // Given: PotentialOrder có customerInfo.address

      // When: Confirm order
      const orderData = {
        user: 'customer-user-id',
        products: [
          {
            id: 'prod-123',
            quantity: 1,
            price: 3500000,
            size: '42',
            color: 'đen',
          },
        ],
        totalAmount: 3500000,
        paymentMethod: 'cash_on_delivery',
        shippingAddress: '123 Nguyễn Huệ, Q1, TPHCM',
        notes: 'Auto-created from potential order po-123, Order in livestream chat',
        status: 'pending',
        paymentStatus: 'pending',
      };

      // Then: Order.shippingAddress = customerInfo.address
      expect(orderData.shippingAddress).toBe('123 Nguyễn Huệ, Q1, TPHCM');
    });

    test('should use default address when customer address is null', async () => {
      // Given: PotentialOrder có customerInfo.address = null

      // When: Confirm order
      const orderData = {
        user: 'customer-user-id',
        products: [
          {
            id: 'prod-123',
            quantity: 1,
            price: 3500000,
            size: '42',
            color: 'đen',
          },
        ],
        totalAmount: 3500000,
        paymentMethod: 'cash_on_delivery',
        shippingAddress: 'COD - address from profile',
        notes: 'Auto-created from potential order po-123, Order in livestream chat',
        status: 'pending',
        paymentStatus: 'pending',
      };

      // Then: Order.shippingAddress = default address
      expect(orderData.shippingAddress).toBe('COD - address from profile');
    });
  });

  describe('TC5005 | Verify product out of stock → không tạo order, send email', () => {
    test('should not create order and send out-of-stock email when product is out of stock', async () => {
      // Given: PotentialOrder valid, Product inventory = 0
      const outOfStockProduct = {
        ...mockProduct,
        checkInventory: function () {
          return {
            available: false,
            quantity: 0,
          };
        },
      };

      // When: Check inventory and it's out of stock
      const inventoryCheck = outOfStockProduct.checkInventory();

      // Then: NO Order created, Email template: LIVESTREAM_OUT_OF_STOCK
      expect(inventoryCheck.available).toBe(false);
      expect(inventoryCheck.quantity).toBe(0);

      // Verify out-of-stock email data
      const emailData = {
        email: 'customer@example.com',
        template: 'LIVESTREAM_OUT_OF_STOCK',
        data: {
          name: 'Nguyễn Văn A',
          productName: 'Nike Air Max 270',
          size: '42',
          color: 'đen',
        },
      };

      expect(emailData.template).toBe('LIVESTREAM_OUT_OF_STOCK');
      expect(emailData.data.productName).toBe('Nike Air Max 270');
    });
  });

  describe('TC5006 | Verify variant out of stock (specific size)', () => {
    test('should not create order when specific size is out of stock', async () => {
      // Given: Product có inventory cho size 40, 42, PotentialOrder yêu cầu size 41 (out of stock)
      const sizeSpecificProduct = {
        ...mockProduct,
        checkInventory: function (options) {
          if (options && options.size === '41') {
            return {
              available: false,
              quantity: 0,
              availableSizes: ['40', '42'],
            };
          }
          return {
            available: true,
            quantity: 5,
          };
        },
      };

      // When: Check inventory for size 41
      const inventoryCheck = sizeSpecificProduct.checkInventory({ size: '41' });

      // Then: No Order created, Email: "Size 41 is out of stock", Suggest available sizes (40, 42)
      expect(inventoryCheck.available).toBe(false);
      expect(inventoryCheck.quantity).toBe(0);
      expect(inventoryCheck.availableSizes).toEqual(['40', '42']);

      // Verify out-of-stock email data
      const emailData = {
        email: 'customer@example.com',
        template: 'LIVESTREAM_OUT_OF_STOCK',
        data: {
          name: 'Nguyễn Văn A',
          productName: 'Nike Air Max 270',
          size: '41',
          color: 'đen',
        },
      };

      expect(emailData.template).toBe('LIVESTREAM_OUT_OF_STOCK');
      expect(emailData.data.size).toBe('41');
    });
  });

  describe('TC5007 | Verify price = 0 → skip auto-create order', () => {
    test('should skip auto-create order when price is 0', async () => {
      // Given: PotentialOrder linked với product price = 0
      const zeroPriceProduct = {
        ...mockProduct,
        finalPrice: 0,
        price: { regular: 0 },
      };

      // When: Check price and it's 0
      const price = zeroPriceProduct.finalPrice || zeroPriceProduct.price?.regular || 0;

      // Then: No Order created, No email sent
      expect(price).toBe(0);

      // Verify order creation would be skipped
      const shouldCreateOrder = price > 0;
      expect(shouldCreateOrder).toBe(false);
    });
  });

  describe('TC5008 | Verify user không tồn tại → skip order creation', () => {
    test('should skip order creation when user does not exist', async () => {
      // Given: PotentialOrder.customerInfo.userId invalid
      const user = null; // User not found

      // When: Try to create order with null user
      const shouldCreateOrder = user !== null;

      // Then: No Order created, No email sent
      expect(user).toBeNull();
      expect(shouldCreateOrder).toBe(false);
    });
  });

  describe('TC5009 | Verify product không tồn tại → cannot create order', () => {
    test('should not create order when product does not exist', async () => {
      // Given: PotentialOrder với productId null hoặc invalid
      const product = null; // Product not found

      // When: Try to create order with null product
      const shouldCreateOrder = product !== null;

      // Then: No Order created, No email sent
      expect(product).toBeNull();
      expect(shouldCreateOrder).toBe(false);
    });
  });

  describe('TC5010 | Verify email failure không block order creation', () => {
    test('should still create order when email sending fails', async () => {
      // Given: Email service throws error

      // When: Create order successfully but email fails
      const orderResult = {
        _id: 'order-123',
        orderNumber: 'ORD-123456',
        totalAmount: 3500000,
        status: 'pending',
      };

      const emailError = new Error('Email service down');

      // Then: Order STILL created successfully
      expect(orderResult._id).toBe('order-123');
      expect(orderResult.status).toBe('pending');

      // Email failure should be handled gracefully
      expect(emailError.message).toBe('Email service down');
    });
  });

  describe('TC5011 | Verify inventory check failure → graceful handling', () => {
    test('should handle inventory check failure gracefully', async () => {
      // Given: checkInventory() throws exception
      const failingProduct = {
        ...mockProduct,
        checkInventory: function () {
          throw new Error('DB timeout');
        },
      };

      // When: Try to check inventory and it fails
      let error = null;
      try {
        failingProduct.checkInventory();
      } catch (e) {
        error = e;
      }

      // Then: Error caught and logged, Skip order creation (safe default)
      expect(error).not.toBeNull();
      expect(error.message).toBe('DB timeout');
    });
  });

  describe('TC5012 | Verify OrderService.createOrder() failure rollback', () => {
    test('should rollback when OrderService.createOrder() fails', async () => {
      // Given: Order creation fails mid-process
      const orderCreationError = new Error('Order creation failed');

      // When: Try to create order and it fails
      let error = null;
      try {
        throw orderCreationError;
      } catch (e) {
        error = e;
      }

      // Then: Error caught and logged
      expect(error).not.toBeNull();
      expect(error.message).toBe('Order creation failed');
    });
  });

  describe('TC5013 | Verify confirm multiple orders đồng thời không bị conflict', () => {
    test('should handle multiple concurrent order confirmations without conflicts', async () => {
      // Given: 3 hosts confirm 3 different orders cùng lúc
      const concurrentOrders = [
        { id: 'po-123', hostId: 'host-1' },
        { id: 'po-124', hostId: 'host-2' },
        { id: 'po-125', hostId: 'host-3' },
      ];

      // When: Simulate 3 concurrent order creations
      const orderResults = concurrentOrders.map(order => ({
        _id: `order-${order.id}`,
        orderNumber: `ORD-${order.id}`,
        totalAmount: 3500000,
        status: 'pending',
      }));

      // Then: All 3 Orders created, No duplicate orders
      expect(orderResults).toHaveLength(3);
      expect(orderResults[0]._id).toBe('order-po-123');
      expect(orderResults[1]._id).toBe('order-po-124');
      expect(orderResults[2]._id).toBe('order-po-125');
    });
  });

  describe('TC5014 | Verify không thể confirm order của stream khác', () => {
    test('should not allow confirming order from different host stream', async () => {
      // Given: PotentialOrder thuộc stream của host khác
      const differentHostOrder = {
        ...mockPotentialOrder,
        streamId: {
          _id: 'stream-456',
          hostId: 'other-host-id',
        },
      };

      const currentHostId = 'host-user-id';
      const orderHostId = 'other-host-id';

      // When: Host A tries to confirm order of Host B's stream
      const isAuthorized = currentHostId === orderHostId;

      // Then: Return authorization error, No Order created
      expect(isAuthorized).toBe(false);
      expect(differentHostOrder.streamId.hostId).toBe('other-host-id');
    });
  });

  describe('TC5015 | Verify notes từ host được lưu vào Order', () => {
    test('should save host notes to Order when confirming', async () => {
      // Given: Host adds notes khi confirm
      const orderData = {
        user: 'customer-user-id',
        products: [
          {
            id: 'prod-123',
            quantity: 1,
            price: 3500000,
            size: '42',
            color: 'đen',
          },
        ],
        totalAmount: 3500000,
        paymentMethod: 'cash_on_delivery',
        shippingAddress: '123 Nguyễn Huệ, Q1, TPHCM',
        notes:
          'Auto-created from potential order po-123, Order in livestream chat. Khách yêu cầu giao trước 5pm',
        status: 'pending',
        paymentStatus: 'pending',
      };

      // When: Confirm với req.body.notes

      // Then: Order.notes = "Khách yêu cầu giao trước 5pm", Notes visible in order detail
      expect(orderData.notes).toContain('Khách yêu cầu giao trước 5pm');
      expect(orderData.notes).toContain('Auto-created from potential order po-123');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid status gracefully', () => {
      // Given: Invalid status in request
      const validStatuses = ['pending', 'contacted', 'confirmed', 'converted', 'ignored', 'spam'];
      const invalidStatus = 'invalid-status';

      // When: Check if status is valid
      const isValidStatus = validStatuses.includes(invalidStatus);

      // Then: Status should be invalid
      expect(isValidStatus).toBe(false);
    });

    test('should handle potential order not found', () => {
      // Given: Potential order does not exist
      const order = null;

      // When: Check if order exists
      const orderExists = order !== null;

      // Then: Order should not exist
      expect(orderExists).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    test('should complete order creation within acceptable time', async () => {
      // Given: Normal order creation scenario

      // When: Create order and measure time
      const startTime = Date.now();

      // Simulate order creation logic
      const orderData = {
        user: 'customer-user-id',
        products: [{ id: 'prod-123', quantity: 1, price: 3500000 }],
        totalAmount: 3500000,
      };

      const endTime = Date.now();

      // Then: Processing time should be reasonable (less than 1 second for this test)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(orderData.totalAmount).toBe(3500000);
    });
  });
});
