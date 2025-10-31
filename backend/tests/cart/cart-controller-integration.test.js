/**
 * Cart Controller - Integration Tests
 * Tests controller functions with real database operations
 *
 * Coverage:
 * - getCart (3 tests)
 * - addOrUpdateItem (12 tests)
 * - updateCartItem (6 tests)
 * - removeCartItem (3 tests)
 * - removeOrderedItems (4 tests)
 */

import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Cart from '../../src/models/Cart.js';
import User from '../../src/models/User.js';
import Product from '../../src/models/Product.js';
import {
  getCart,
  addOrUpdateItem,
  updateCartItem,
  removeCartItem,
  removeOrderedItems,
} from '../../src/controllers/cartController.js';

describe('Cart Controller — Integration Tests', () => {
  let mongoServer;
  let testUser;
  let testProduct;

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
    // Clear collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    // Create test user
    testUser = await User.create({
      fullName: 'Test User Cart',
      username: 'testusercart',
      email: 'testcart@example.com',
      password: 'Password123!',
      role: 'customer',
      isVerified: true,
    });

    // Create test product
    testProduct = await Product.create({
      name: 'Nike Air Max 90 Test',
      brand: 'Nike',
      category: new mongoose.Types.ObjectId(),
      productType: 'shoes',
      price: {
        regular: 2000000,
        isOnSale: false,
        discountPercent: 0,
      },
      stock: 100,
      inventory: [
        { size: 42, color: 'Black', quantity: 50 },
        { size: 43, color: 'Red', quantity: 30 },
      ],
    });
  });

  // Helper to create mock request/response
  const createMockReq = (userId, body = {}, params = {}) => ({
    user: { id: userId },
    body,
    params,
  });

  const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  // ============================================================================
  // getCart()
  // ============================================================================

  describe('getCart()', () => {
    test('Should return existing cart with items', async () => {
      // Given: User has cart with items
      await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 2,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });

      const req = createMockReq(testUser._id);
      const res = createMockRes();

      // When
      await getCart(req, res);

      // Then
      expect(res.json).toHaveBeenCalled();
      const cart = res.json.mock.calls[0][0];
      expect(cart.items).toHaveLength(1);
      expect(cart.totalPrice).toBe(4000000);
    });

    test('Should create new empty cart if not exists', async () => {
      // Given: User has no cart
      const req = createMockReq(testUser._id);
      const res = createMockRes();

      // When
      await getCart(req, res);

      // Then
      expect(res.json).toHaveBeenCalled();
      const cart = res.json.mock.calls[0][0];
      expect(cart.items).toHaveLength(0);
      expect(cart.totalPrice).toBe(0);
    });

    test('Should cleanup items with deleted products', async () => {
      // Given: Cart with deleted product
      const deletedProductId = new mongoose.Types.ObjectId();
      await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
          {
            product: deletedProductId, // Not exists
            quantity: 1,
            size: '43',
            color: 'Red',
            price: 1500000,
          },
        ],
      });

      const req = createMockReq(testUser._id);
      const res = createMockRes();

      // When
      await getCart(req, res);

      // Then
      const cart = res.json.mock.calls[0][0];
      expect(cart.items).toHaveLength(1); // Only valid item
      expect(cart.totalPrice).toBe(2000000);
    });

    test('Should handle database errors gracefully', async () => {
      // Given: Invalid user ID causing DB error
      const req = createMockReq('invalid_user_id');
      const res = createMockRes();

      // When
      await getCart(req, res);

      // Then: Should return 500 error
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // addOrUpdateItem()
  // ============================================================================

  describe('addOrUpdateItem()', () => {
    test('Should add new item to cart', async () => {
      // Given: Empty cart
      const req = createMockReq(testUser._id, {
        product: testProduct._id.toString(),
        quantity: 2,
        size: '42',
        color: 'Black',
        price: 2000000,
      });
      const res = createMockRes();

      // When
      await addOrUpdateItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(200);
      const cart = res.json.mock.calls[0][0];
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.totalPrice).toBe(4000000);
    });

    test('Should merge quantity for duplicate items', async () => {
      // Given: Cart already has the item
      await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });

      const req = createMockReq(testUser._id, {
        product: testProduct._id.toString(),
        quantity: 2,
        size: '42',
        color: 'Black',
        price: 2000000,
      });
      const res = createMockRes();

      // When
      await addOrUpdateItem(req, res);

      // Then
      const cart = res.json.mock.calls[0][0];
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(3); // 1 + 2 merged
      expect(cart.totalPrice).toBe(6000000);
    });

    test('Should update image when merging duplicate items', async () => {
      // Given: Cart has item without image
      await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });

      const req = createMockReq(testUser._id, {
        product: testProduct._id.toString(),
        quantity: 2,
        size: '42',
        color: 'Black',
        price: 2000000,
        image: 'https://example.com/new-image.jpg',
      });
      const res = createMockRes();

      // When
      await addOrUpdateItem(req, res);

      // Then: Image should be updated (line 89)
      const cart = res.json.mock.calls[0][0];
      expect(cart.items[0].image).toBe('https://example.com/new-image.jpg');
      expect(cart.items[0].quantity).toBe(3);
    });

    test('Should add as separate item if different size', async () => {
      // Given: Cart has item with size 42
      await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });

      const req = createMockReq(testUser._id, {
        product: testProduct._id.toString(),
        quantity: 1,
        size: '43', // Different size
        color: 'Black',
        price: 2000000,
      });
      const res = createMockRes();

      // When
      await addOrUpdateItem(req, res);

      // Then
      const cart = res.json.mock.calls[0][0];
      expect(cart.items).toHaveLength(2); // 2 separate items
    });

    test('Should return 400 if product missing', async () => {
      // Given: Missing product field
      const req = createMockReq(testUser._id, {
        quantity: 1,
        size: '42',
        color: 'Black',
        price: 2000000,
      });
      const res = createMockRes();

      // When
      await addOrUpdateItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Product is required' });
    });

    test('Should return 400 if quantity missing', async () => {
      // Given: Missing quantity
      const req = createMockReq(testUser._id, {
        product: testProduct._id.toString(),
        size: '42',
        color: 'Black',
        price: 2000000,
      });
      const res = createMockRes();

      // When
      await addOrUpdateItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Valid quantity is required' });
    });

    test('Should return 400 if quantity is 0', async () => {
      // Given: Quantity = 0
      const req = createMockReq(testUser._id, {
        product: testProduct._id.toString(),
        quantity: 0,
        size: '42',
        color: 'Black',
        price: 2000000,
      });
      const res = createMockRes();

      // When
      await addOrUpdateItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Should return 400 if size missing', async () => {
      // Given: Missing size
      const req = createMockReq(testUser._id, {
        product: testProduct._id.toString(),
        quantity: 1,
        color: 'Black',
        price: 2000000,
      });
      const res = createMockRes();

      // When
      await addOrUpdateItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Size is required' });
    });

    test('Should return 400 if color missing', async () => {
      // Given: Missing color
      const req = createMockReq(testUser._id, {
        product: testProduct._id.toString(),
        quantity: 1,
        size: '42',
        price: 2000000,
      });
      const res = createMockRes();

      // When
      await addOrUpdateItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Color is required' });
    });

    test('Should return 400 if price missing', async () => {
      // Given: Missing price
      const req = createMockReq(testUser._id, {
        product: testProduct._id.toString(),
        quantity: 1,
        size: '42',
        color: 'Black',
      });
      const res = createMockRes();

      // When
      await addOrUpdateItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Valid price is required' });
    });

    test('Should return 400 if price is negative', async () => {
      // Given: Negative price
      const req = createMockReq(testUser._id, {
        product: testProduct._id.toString(),
        quantity: 1,
        size: '42',
        color: 'Black',
        price: -100,
      });
      const res = createMockRes();

      // When
      await addOrUpdateItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
    });

    // Note: price = 0 currently rejected by controller (line 67: !price)
    // This is a known bug in the controller validation logic

    test('Should handle optional image field', async () => {
      // Given: With image
      const req = createMockReq(testUser._id, {
        product: testProduct._id.toString(),
        quantity: 1,
        size: '42',
        color: 'Black',
        price: 2000000,
        image: 'https://example.com/image.jpg',
      });
      const res = createMockRes();

      // When
      await addOrUpdateItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(200);
      const cart = res.json.mock.calls[0][0];
      expect(cart.items[0].image).toBe('https://example.com/image.jpg');
    });

    test('Should handle database errors in addOrUpdateItem', async () => {
      // Given: Invalid product ID
      const req = createMockReq(testUser._id, {
        product: 'invalid_product_id',
        quantity: 1,
        size: '42',
        color: 'Black',
        price: 2000000,
      });
      const res = createMockRes();

      // When
      await addOrUpdateItem(req, res);

      // Then: Should handle error gracefully
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // updateCartItem()
  // ============================================================================

  describe('updateCartItem()', () => {
    test('Should update item quantity', async () => {
      // Given: Cart with item
      const cart = await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 2,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });

      const req = createMockReq(
        testUser._id,
        { quantity: 5 },
        { itemId: cart.items[0]._id.toString() }
      );
      const res = createMockRes();

      // When
      await updateCartItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(200);
      const updatedCart = res.json.mock.calls[0][0];
      expect(updatedCart.items[0].quantity).toBe(5);
      expect(updatedCart.totalPrice).toBe(10000000);
    });

    test('Should update item price', async () => {
      // Given: Cart with item
      const cart = await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 2,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });

      const req = createMockReq(
        testUser._id,
        { price: 2500000 },
        { itemId: cart.items[0]._id.toString() }
      );
      const res = createMockRes();

      // When
      await updateCartItem(req, res);

      // Then: Price should be updated (line 130)
      expect(res.status).toHaveBeenCalledWith(200);
      const updatedCart = res.json.mock.calls[0][0];
      expect(updatedCart.items[0].price).toBe(2500000);
      expect(updatedCart.totalPrice).toBe(5000000); // 2 * 2500000
    });

    test('Should update item color', async () => {
      // Given: Cart with item
      const cart = await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 2,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });

      const req = createMockReq(
        testUser._id,
        { color: 'Red' },
        { itemId: cart.items[0]._id.toString() }
      );
      const res = createMockRes();

      // When
      await updateCartItem(req, res);

      // Then: Color should be updated (line 129)
      expect(res.status).toHaveBeenCalledWith(200);
      const updatedCart = res.json.mock.calls[0][0];
      expect(updatedCart.items[0].color).toBe('Red');
    });

    test('Should update item size', async () => {
      // Given: Cart with item
      const cart = await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 2,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });

      const req = createMockReq(
        testUser._id,
        { size: '43' },
        { itemId: cart.items[0]._id.toString() }
      );
      const res = createMockRes();

      // When
      await updateCartItem(req, res);

      // Then
      const updatedCart = res.json.mock.calls[0][0];
      expect(updatedCart.items[0].size).toBe('43');
    });

    test('Should update multiple fields', async () => {
      // Given: Cart with item
      const cart = await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 2,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });

      const req = createMockReq(
        testUser._id,
        { quantity: 3, size: '44', color: 'Blue' },
        { itemId: cart.items[0]._id.toString() }
      );
      const res = createMockRes();

      // When
      await updateCartItem(req, res);

      // Then
      const updatedCart = res.json.mock.calls[0][0];
      expect(updatedCart.items[0].quantity).toBe(3);
      expect(updatedCart.items[0].size).toBe('44');
      expect(updatedCart.items[0].color).toBe('Blue');
    });

    test('Should return 404 if cart not found', async () => {
      // Given: No cart
      const req = createMockReq(
        testUser._id,
        { quantity: 5 },
        { itemId: new mongoose.Types.ObjectId().toString() }
      );
      const res = createMockRes();

      // When
      await updateCartItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cart not found' });
    });

    test('Should return 404 if item not found', async () => {
      // Given: Cart exists but item doesn't
      await Cart.create({
        user: testUser._id,
        items: [],
      });

      const req = createMockReq(
        testUser._id,
        { quantity: 5 },
        { itemId: new mongoose.Types.ObjectId().toString() }
      );
      const res = createMockRes();

      // When
      await updateCartItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Item not found' });
    });

    test('Should handle empty update body', async () => {
      // Given: Cart with item
      const cart = await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 2,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });

      const req = createMockReq(testUser._id, {}, { itemId: cart.items[0]._id.toString() });
      const res = createMockRes();

      // When
      await updateCartItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(200);
      const updatedCart = res.json.mock.calls[0][0];
      expect(updatedCart.items[0].quantity).toBe(2); // Unchanged
    });

    test('Should handle invalid itemId format', async () => {
      // Given: Invalid itemId format results in 404 (not found)
      const req = createMockReq(
        testUser._id,
        { quantity: 5 },
        { itemId: 'invalid_item_id_format' }
      );
      const res = createMockRes();

      // When
      await updateCartItem(req, res);

      // Then: Returns 404 cart not found (mongoose can't find with invalid ID)
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // removeCartItem()
  // ============================================================================

  describe('removeCartItem()', () => {
    test('Should remove item from cart', async () => {
      // Given: Cart with 2 items
      const cart = await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
          {
            product: testProduct._id,
            quantity: 2,
            size: '43',
            color: 'Red',
            price: 2000000,
          },
        ],
      });

      const req = createMockReq(testUser._id, {}, { itemId: cart.items[0]._id.toString() });
      const res = createMockRes();

      // When
      await removeCartItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(200);
      const updatedCart = res.json.mock.calls[0][0];
      expect(updatedCart.items).toHaveLength(1);
      expect(updatedCart.totalPrice).toBe(4000000);
    });

    test('Should return 404 if cart not found', async () => {
      // Given: No cart
      const req = createMockReq(
        testUser._id,
        {},
        { itemId: new mongoose.Types.ObjectId().toString() }
      );
      const res = createMockRes();

      // When
      await removeCartItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cart not found' });
    });

    test('Should handle removing non-existent item gracefully', async () => {
      // Given: Cart exists but item doesn't
      await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });

      const req = createMockReq(
        testUser._id,
        {},
        { itemId: new mongoose.Types.ObjectId().toString() }
      );
      const res = createMockRes();

      // When
      await removeCartItem(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(200);
      const cart = res.json.mock.calls[0][0];
      expect(cart.items).toHaveLength(1); // Unchanged
    });

    test('Should handle invalid itemId format', async () => {
      // Given: Invalid itemId format results in 404
      const req = createMockReq(testUser._id, {}, { itemId: 'invalid_item_id' });
      const res = createMockRes();

      // When
      await removeCartItem(req, res);

      // Then: Returns 404 cart not found
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // removeOrderedItems()
  // ============================================================================

  describe('removeOrderedItems()', () => {
    test('Should remove ordered items', async () => {
      // Given: Cart with 3 items
      const cart = await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
          {
            product: testProduct._id,
            quantity: 2,
            size: '43',
            color: 'Red',
            price: 2000000,
          },
          {
            product: testProduct._id,
            quantity: 1,
            size: '44',
            color: 'Blue',
            price: 2000000,
          },
        ],
      });

      const req = createMockReq(testUser._id, {
        orderedItems: [{ _id: cart.items[0]._id }, { _id: cart.items[1]._id }],
      });
      const res = createMockRes();

      // When
      await removeOrderedItems(req, res);

      // Then
      const updatedCart = res.json.mock.calls[0][0];
      expect(updatedCart.items).toHaveLength(1);
      expect(updatedCart.totalPrice).toBe(2000000);
    });

    test('Should return 400 if orderedItems not array', async () => {
      // Given: Invalid orderedItems
      const req = createMockReq(testUser._id, {
        orderedItems: 'not_an_array',
      });
      const res = createMockRes();

      // When
      await removeOrderedItems(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Ordered items array is required' });
    });

    test('Should return 400 if orderedItems missing', async () => {
      // Given: Missing orderedItems
      const req = createMockReq(testUser._id, {});
      const res = createMockRes();

      // When
      await removeOrderedItems(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Should handle empty orderedItems array', async () => {
      // Given: Empty array - valid input
      await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });

      const req = createMockReq(testUser._id, { orderedItems: [] });
      const res = createMockRes();

      // When
      await removeOrderedItems(req, res);

      // Then: Should process successfully with empty array (lines 197-211)
      expect(res.json).toHaveBeenCalled();
      const cart = res.json.mock.calls[0][0];
      expect(cart.items).toHaveLength(1); // No items removed
    });

    test('Should create new cart if not exists', async () => {
      // Given: User with no cart
      const newUser = await User.create({
        email: `nocart-${Date.now()}@test.com`,
        password: 'Password123!',
        fullName: 'No Cart User',
        username: `nocart${Date.now()}`,
        role: 'customer',
      });

      const req = createMockReq(newUser._id, { orderedItems: [] });
      const res = createMockRes();

      // When
      await removeOrderedItems(req, res);

      // Then: Should create empty cart (lines 191-194)
      expect(res.json).toHaveBeenCalled();
      const cart = res.json.mock.calls[0][0];
      expect(cart.user.toString()).toBe(newUser._id.toString());
      expect(cart.items).toHaveLength(0);
    });

    test('Should handle mixed _id and id formats', async () => {
      // Given: Cart with items
      const cart = await Cart.create({
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
          {
            product: testProduct._id,
            quantity: 2,
            size: '43',
            color: 'Red',
            price: 2000000,
          },
        ],
      });

      const req = createMockReq(testUser._id, {
        orderedItems: [{ _id: cart.items[0]._id }, { id: cart.items[1]._id }],
      });
      const res = createMockRes();

      // When
      await removeOrderedItems(req, res);

      // Then
      const updatedCart = res.json.mock.calls[0][0];
      expect(updatedCart.items).toHaveLength(0);
    });
  });
});
