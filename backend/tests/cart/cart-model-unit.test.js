/**
 * Cart Feature - Unit Tests for Model & Schema
 * Model Validation, Pre-save Hooks, Schema Constraints
 *
 * Coverage:
 * - Pre-save hook (1 test)
 * - Model validations (4 tests)
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Cart from '../../src/models/Cart.js';
import User from '../../src/models/User.js';
import Product from '../../src/models/Product.js';

describe('Cart Feature — Unit Tests: Model & Schema', () => {
  let mongoServer;

  beforeAll(async () => {
    // Setup in-memory MongoDB
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

  // ============================================================================
  // Test Suite: Pre-save Hook
  // ============================================================================

  describe('Pre-save Hook', () => {
    test('CART-UNIT-047 | Auto calculate totalPrice on save', async () => {
      // Given: Cart with items
      const user = new User({
        fullName: 'Test User 047',
        username: 'testuser047',
        email: 'test047@example.com',
        password: 'Password123!',
        role: 'customer',
        isVerified: true,
      });
      await user.save();

      const product = new Product({
        name: 'Nike Air Max',
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
          {
            size: 42,
            color: 'Black',
            quantity: 10,
          },
        ],
      });
      await product.save();

      const cart = new Cart({
        user: user._id,
        items: [
          {
            product: product._id,
            quantity: 2,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
          {
            product: product._id,
            quantity: 1,
            size: '43',
            color: 'Red',
            price: 2000000,
          },
        ],
      });

      // When: Save cart
      await cart.save();

      // Then: Pre-save hook calculated totalPrice
      expect(cart.totalPrice).toBe(6000000); // 2*2000000 + 1*2000000
    });
  });

  // ============================================================================
  // Test Suite: Model Validations
  // ============================================================================

  describe('Model Validations', () => {
    test('CART-UNIT-048 | Validate user field required', async () => {
      // Given: Cart without user
      const cart = new Cart({
        items: [],
      });

      // When: Attempt to save
      let error;
      try {
        await cart.save();
      } catch (err) {
        error = err;
      }

      // Then: Validation error
      expect(error).toBeDefined();
      expect(error.errors.user).toBeDefined();
      expect(error.errors.user.message).toContain('User is required');
    });

    test('CART-UNIT-049 | Validate item product required', async () => {
      // Given: Cart item without product
      const user = new User({
        fullName: 'Test User 049',
        username: 'testuser049',
        email: 'test049@example.com',
        password: 'Password123!',
        role: 'customer',
        isVerified: true,
      });
      await user.save();

      const cart = new Cart({
        user: user._id,
        items: [
          {
            // product missing
            quantity: 1,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });

      // When: Attempt to save
      let error;
      try {
        await cart.save();
      } catch (err) {
        error = err;
      }

      // Then: Validation error
      expect(error).toBeDefined();
      expect(error.errors['items.0.product']).toBeDefined();
      expect(error.errors['items.0.product'].message).toContain('Product is required');
    });

    test('CART-UNIT-050 | Validate item quantity >= 1', async () => {
      // Given: Cart item with quantity 0
      const user = new User({
        fullName: 'Test User 050',
        username: 'testuser050',
        email: 'test050@example.com',
        password: 'Password123!',
        role: 'customer',
        isVerified: true,
      });
      await user.save();

      const cart = new Cart({
        user: user._id,
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 0, // Invalid: must be >= 1
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });

      // When: Attempt to save
      let error;
      try {
        await cart.save();
      } catch (err) {
        error = err;
      }

      // Then: Validation error
      expect(error).toBeDefined();
      expect(error.errors['items.0.quantity']).toBeDefined();
      expect(error.errors['items.0.quantity'].message).toContain('Quantity must be at least 1');
    });

    test('CART-UNIT-051 | Validate price >= 0', async () => {
      // Given: Cart item with negative price
      const user = new User({
        fullName: 'Test User 051',
        username: 'testuser051',
        email: 'test051@example.com',
        password: 'Password123!',
        role: 'customer',
        isVerified: true,
      });
      await user.save();

      const cart = new Cart({
        user: user._id,
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            size: '42',
            color: 'Black',
            price: -100, // Invalid: must be >= 0
          },
        ],
      });

      // When: Attempt to save
      let error;
      try {
        await cart.save();
      } catch (err) {
        error = err;
      }

      // Then: Validation error
      expect(error).toBeDefined();
      expect(error.errors['items.0.price']).toBeDefined();
      expect(error.errors['items.0.price'].message).toContain('Price cannot be negative');
    });
  });

  // ============================================================================
  // Additional Model Tests
  // ============================================================================

  describe('Additional Model Tests', () => {
    test('Should create cart successfully with valid data', async () => {
      // Given: Valid cart data
      const user = new User({
        fullName: 'Test User Success',
        username: 'testusersucc',
        email: 'testsuccess@example.com',
        password: 'Password123!',
        role: 'customer',
        isVerified: true,
      });
      await user.save();

      const product = new Product({
        name: 'Nike Air Max',
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
          {
            size: 42,
            color: 'Black',
            quantity: 10,
          },
        ],
      });
      await product.save();

      const cart = new Cart({
        user: user._id,
        items: [
          {
            product: product._id,
            quantity: 2,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });

      // When: Save cart
      const savedCart = await cart.save();

      // Then: Cart saved successfully
      expect(savedCart._id).toBeDefined();
      expect(savedCart.user.toString()).toBe(user._id.toString());
      expect(savedCart.items).toHaveLength(1);
      expect(savedCart.totalPrice).toBe(4000000);
    });

    test('Should handle empty cart (no items)', async () => {
      // Given: Cart with no items
      const user = new User({
        fullName: 'Test User Empty',
        username: 'testuserempty',
        email: 'testempty@example.com',
        password: 'Password123!',
        role: 'customer',
        isVerified: true,
      });
      await user.save();

      const cart = new Cart({
        user: user._id,
        items: [],
      });

      // When: Save cart
      const savedCart = await cart.save();

      // Then: Cart saved with totalPrice 0
      expect(savedCart._id).toBeDefined();
      expect(savedCart.items).toHaveLength(0);
      expect(savedCart.totalPrice).toBe(0);
    });

    test('Should update totalPrice when items change', async () => {
      // Given: Cart with initial items
      const user = new User({
        fullName: 'Test User Update',
        username: 'testuserupdate',
        email: 'testupdate@example.com',
        password: 'Password123!',
        role: 'customer',
        isVerified: true,
      });
      await user.save();

      const product = new Product({
        name: 'Nike Air Max',
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
          {
            size: 42,
            color: 'Black',
            quantity: 10,
          },
        ],
      });
      await product.save();

      const cart = new Cart({
        user: user._id,
        items: [
          {
            product: product._id,
            quantity: 1,
            size: '42',
            color: 'Black',
            price: 2000000,
          },
        ],
      });
      await cart.save();

      expect(cart.totalPrice).toBe(2000000);

      // When: Add more items
      cart.items.push({
        product: product._id,
        quantity: 2,
        size: '43',
        color: 'Red',
        price: 2000000,
      });
      await cart.save();

      // Then: TotalPrice updated
      expect(cart.totalPrice).toBe(6000000); // 1*2000000 + 2*2000000
    });

    test('Should handle timestamps correctly', async () => {
      // Given: New cart
      const user = new User({
        fullName: 'Test User Timestamp',
        username: 'testusertime',
        email: 'testtime@example.com',
        password: 'Password123!',
        role: 'customer',
        isVerified: true,
      });
      await user.save();

      const cart = new Cart({
        user: user._id,
        items: [],
      });

      // When: Save cart
      const savedCart = await cart.save();

      // Then: Timestamps created
      expect(savedCart.createdAt).toBeDefined();
      expect(savedCart.updatedAt).toBeDefined();
      expect(savedCart.createdAt).toEqual(savedCart.updatedAt);
    });
  });
});
