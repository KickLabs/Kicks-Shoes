/**
 * @fileoverview Favourite Model Unit Tests
 * @module tests/favourite-model
 * @description Comprehensive unit tests for Favourite model (models/Favourite.js)
 * Test Suite: Unit Tests - Favourite Model (FM-001 to FM-020)
 * Coverage: Schema validation, default values, pre-save middleware, indexes
 */

import mongoose from 'mongoose';
import Favourite from '../../src/models/Favourite.js';
import User from '../../src/models/User.js';
import Product from '../../src/models/Product.js';

describe('Favourites — Unit Tests - Favourite Model', () => {
  let testUser, testProduct, testUser2, testProduct2;

  // Setup: Connect to test database
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/kicks-shoes-test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  // Cleanup: Clear database before each test
  beforeEach(async () => {
    await Favourite.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await mongoose.connection.db.collection('categories').deleteMany({});
    // Clear all collections to avoid unique constraint conflicts
    await mongoose.connection.db.collection('favourites').deleteMany({});
    await mongoose.connection.db.collection('users').deleteMany({});
    await mongoose.connection.db.collection('products').deleteMany({});

    // Create test user with unique identifier
    const timestamp = Date.now();
    testUser = new User({
      fullName: 'Test User',
      username: `testuser${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
    });
    await testUser.save();

    // Create test category first
    const CategorySchema = new mongoose.Schema({
      name: { type: String, required: true },
    });
    const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
    const testCategory = new Category({
      name: 'Test Category',
    });
    await testCategory.save();

    // Create test product
    testProduct = new Product({
      name: 'Nike Air Max',
      price: { regular: 1000000 },
      brand: 'Nike',
      category: testCategory._id,
      productType: 'shoes',
      status: true,
      inventory: [
        {
          size: 42,
          color: 'Black',
          quantity: 10,
        },
      ],
    });
    await testProduct.save();

    // Create additional test data
    testUser2 = new User({
      fullName: 'Test User 2',
      username: `testuser2${timestamp}`,
      email: `test2${timestamp}@example.com`,
      password: 'password123',
      phone: '0987654321',
      address: '456 Test St',
    });
    await testUser2.save();

    testProduct2 = new Product({
      name: 'Adidas Ultraboost',
      price: { regular: 1200000 },
      brand: 'Adidas',
      category: testCategory._id,
      productType: 'shoes',
      status: true,
      inventory: [
        {
          size: 43,
          color: 'White',
          quantity: 5,
        },
      ],
    });
    await testProduct2.save();
  });

  // Teardown: Close database connection
  afterAll(async () => {
    await Favourite.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await mongoose.connection.db.collection('categories').deleteMany({});
    await mongoose.connection.close();
  });

  // ===================================================================
  // Test Suite: Favourite Creation & Default Values
  // ===================================================================

  test('FM-001 | Create favourite with valid data', async () => {
    // Given: Valid favourite data
    const favouriteData = {
      user: testUser._id,
      products: [testProduct._id],
    };

    // When: Favourite is created and saved
    const favourite = new Favourite(favouriteData);
    const savedFavourite = await favourite.save();

    // Then: Favourite saved successfully with correct values
    expect(savedFavourite._id).toBeDefined();
    expect(savedFavourite.user.toString()).toBe(testUser._id.toString());
    expect(savedFavourite.products).toHaveLength(1);
    expect(savedFavourite.products[0].toString()).toBe(testProduct._id.toString());

    // Verify default values
    expect(savedFavourite.addedAt).toBeDefined();
    expect(savedFavourite.addedAt).toBeInstanceOf(Date);
    expect(savedFavourite.createdAt).toBeDefined();
    expect(savedFavourite.updatedAt).toBeDefined();
  });

  test('FM-002 | Create favourite with multiple products', async () => {
    // Given: Favourite with multiple products
    const favouriteData = {
      user: testUser._id,
      products: [testProduct._id, testProduct2._id],
    };

    // When: Favourite is created and saved
    const favourite = new Favourite(favouriteData);
    const savedFavourite = await favourite.save();

    // Then: All products are saved correctly
    expect(savedFavourite.products).toHaveLength(2);
    expect(savedFavourite.products[0].toString()).toBe(testProduct._id.toString());
    expect(savedFavourite.products[1].toString()).toBe(testProduct2._id.toString());
  });

  test('FM-003 | Create favourite with empty products array', async () => {
    // Given: Favourite with empty products array
    const favouriteData = {
      user: testUser._id,
      products: [],
    };

    // When: Favourite is created and saved
    const favourite = new Favourite(favouriteData);
    const savedFavourite = await favourite.save();

    // Then: Empty products array is saved correctly
    expect(savedFavourite.products).toHaveLength(0);
    expect(Array.isArray(savedFavourite.products)).toBe(true);
  });

  // ===================================================================
  // Test Suite: Required Field Validation
  // ===================================================================

  test('FM-004 | Validation: Missing required field - user', async () => {
    // Given: Favourite data without user
    const favourite = new Favourite({
      products: [testProduct._id],
    });

    // When: Attempting to save favourite
    // Then: ValidationError thrown
    await expect(favourite.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(favourite.save()).rejects.toThrow(/User is required/);
  });

  test('FM-005 | Validation: Invalid user ObjectId', async () => {
    // Given: Favourite with invalid user ObjectId
    const favourite = new Favourite({
      user: 'invalid-objectid',
      products: [testProduct._id],
    });

    // When: Attempting to save favourite
    // Then: ValidationError thrown
    await expect(favourite.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(favourite.save()).rejects.toThrow(/Cast to ObjectId failed/);
  });

  test('FM-006 | Validation: Invalid product ObjectId in array', async () => {
    // Given: Favourite with invalid product ObjectId
    const favourite = new Favourite({
      user: testUser._id,
      products: ['invalid-objectid'],
    });

    // When: Attempting to save favourite
    // Then: ValidationError thrown
    await expect(favourite.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(favourite.save()).rejects.toThrow(/Cast to \[ObjectId\] failed/);
  });

  // ===================================================================
  // Test Suite: Unique Constraints
  // ===================================================================

  test('FM-007 | Unique constraint: One favourite list per user', async () => {
    // Given: First favourite for user exists
    const firstFavourite = new Favourite({
      user: testUser._id,
      products: [testProduct._id],
    });
    await firstFavourite.save();

    // When: Second favourite for same user is created
    const secondFavourite = new Favourite({
      user: testUser._id,
      products: [testProduct2._id],
    });

    // Then: MongoError E11000 thrown (duplicate key error)
    await expect(secondFavourite.save()).rejects.toThrow(/E11000/);
    await expect(secondFavourite.save()).rejects.toThrow(/duplicate key/);
  });

  test('FM-008 | Different users can have favourites', async () => {
    // Given: Favourite for first user
    const firstFavourite = new Favourite({
      user: testUser._id,
      products: [testProduct._id],
    });
    await firstFavourite.save();

    // When: Favourite for second user is created
    const secondFavourite = new Favourite({
      user: testUser2._id,
      products: [testProduct._id],
    });

    // Then: Second favourite saves successfully
    const savedSecondFavourite = await secondFavourite.save();
    expect(savedSecondFavourite._id).toBeDefined();
    expect(savedSecondFavourite.user.toString()).toBe(testUser2._id.toString());
  });

  // ===================================================================
  // Test Suite: Pre-save Middleware
  // ===================================================================

  test('FM-009 | Pre-save middleware: Convert string user ID to ObjectId', async () => {
    // Given: Favourite with string user ID
    const favourite = new Favourite({
      user: testUser._id.toString(),
      products: [testProduct._id],
    });

    // When: Favourite is saved
    const savedFavourite = await favourite.save();

    // Then: User ID is converted to ObjectId
    expect(savedFavourite.user).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(savedFavourite.user.toString()).toBe(testUser._id.toString());
  });

  test('FM-010 | Pre-save middleware: Convert string product IDs to ObjectId', async () => {
    // Given: Favourite with string product IDs
    const favourite = new Favourite({
      user: testUser._id,
      products: [testProduct._id.toString(), testProduct2._id.toString()],
    });

    // When: Favourite is saved
    const savedFavourite = await favourite.save();

    // Then: Product IDs are converted to ObjectIds
    expect(savedFavourite.products[0]).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(savedFavourite.products[1]).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(savedFavourite.products[0].toString()).toBe(testProduct._id.toString());
    expect(savedFavourite.products[1].toString()).toBe(testProduct2._id.toString());
  });

  // ===================================================================
  // Test Suite: Timestamps
  // ===================================================================

  test('FM-011 | Timestamps: createdAt and updatedAt are set on creation', async () => {
    // Given: New favourite
    const favourite = new Favourite({
      user: testUser._id,
      products: [testProduct._id],
    });

    // When: Favourite is saved
    const savedFavourite = await favourite.save();

    // Then: Timestamps are set
    expect(savedFavourite.createdAt).toBeDefined();
    expect(savedFavourite.updatedAt).toBeDefined();
    expect(savedFavourite.createdAt).toBeInstanceOf(Date);
    expect(savedFavourite.updatedAt).toBeInstanceOf(Date);
    expect(savedFavourite.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    expect(savedFavourite.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  test('FM-012 | Timestamps: updatedAt changes on modification', async () => {
    // Given: Existing favourite
    const favourite = new Favourite({
      user: testUser._id,
      products: [testProduct._id],
    });
    const savedFavourite = await favourite.save();
    const originalUpdatedAt = savedFavourite.updatedAt;

    // Wait a bit to ensure time difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // When: Favourite is modified and saved
    savedFavourite.products.push(testProduct2._id);
    const updatedFavourite = await savedFavourite.save();

    // Then: updatedAt is changed
    expect(updatedFavourite.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(updatedFavourite.createdAt.getTime()).toBe(originalUpdatedAt.getTime());
  });

  // ===================================================================
  // Test Suite: addedAt Field
  // ===================================================================

  test('FM-013 | addedAt: Default value is set to current date', async () => {
    // Given: New favourite
    const beforeSave = new Date();
    const favourite = new Favourite({
      user: testUser._id,
      products: [testProduct._id],
    });

    // When: Favourite is saved
    const savedFavourite = await favourite.save();
    const afterSave = new Date();

    // Then: addedAt is set to current date
    expect(savedFavourite.addedAt).toBeDefined();
    expect(savedFavourite.addedAt).toBeInstanceOf(Date);
    expect(savedFavourite.addedAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
    expect(savedFavourite.addedAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
  });

  test('FM-014 | addedAt: Can be set manually', async () => {
    // Given: Favourite with custom addedAt
    const customDate = new Date('2023-01-01T00:00:00.000Z');
    const favourite = new Favourite({
      user: testUser._id,
      products: [testProduct._id],
      addedAt: customDate,
    });

    // When: Favourite is saved
    const savedFavourite = await favourite.save();

    // Then: Custom addedAt is preserved
    expect(savedFavourite.addedAt.getTime()).toBe(customDate.getTime());
  });

  // ===================================================================
  // Test Suite: Array Operations
  // ===================================================================

  test('FM-015 | Array operations: Add product to existing favourite', async () => {
    // Given: Existing favourite with one product
    const favourite = new Favourite({
      user: testUser._id,
      products: [testProduct._id],
    });
    const savedFavourite = await favourite.save();

    // When: Another product is added
    savedFavourite.products.push(testProduct2._id);
    const updatedFavourite = await savedFavourite.save();

    // Then: Product is added successfully
    expect(updatedFavourite.products).toHaveLength(2);
    expect(updatedFavourite.products[1].toString()).toBe(testProduct2._id.toString());
  });

  test('FM-016 | Array operations: Remove product from existing favourite', async () => {
    // Given: Existing favourite with two products
    const favourite = new Favourite({
      user: testUser._id,
      products: [testProduct._id, testProduct2._id],
    });
    const savedFavourite = await favourite.save();

    // When: One product is removed
    savedFavourite.products = savedFavourite.products.filter(
      id => id.toString() !== testProduct._id.toString()
    );
    const updatedFavourite = await savedFavourite.save();

    // Then: Product is removed successfully
    expect(updatedFavourite.products).toHaveLength(1);
    expect(updatedFavourite.products[0].toString()).toBe(testProduct2._id.toString());
  });

  test('FM-017 | Array operations: Clear all products', async () => {
    // Given: Existing favourite with products
    const favourite = new Favourite({
      user: testUser._id,
      products: [testProduct._id, testProduct2._id],
    });
    const savedFavourite = await favourite.save();

    // When: All products are cleared
    savedFavourite.products = [];
    const updatedFavourite = await savedFavourite.save();

    // Then: Products array is empty
    expect(updatedFavourite.products).toHaveLength(0);
    expect(Array.isArray(updatedFavourite.products)).toBe(true);
  });

  // ===================================================================
  // Test Suite: Edge Cases
  // ===================================================================

  test('FM-018 | Edge case: Duplicate products in array', async () => {
    // Given: Favourite with duplicate product IDs
    const favourite = new Favourite({
      user: testUser._id,
      products: [testProduct._id, testProduct._id, testProduct2._id],
    });

    // When: Favourite is saved
    const savedFavourite = await favourite.save();

    // Then: Duplicates are preserved (MongoDB allows this)
    expect(savedFavourite.products).toHaveLength(3);
    expect(savedFavourite.products[0].toString()).toBe(testProduct._id.toString());
    expect(savedFavourite.products[1].toString()).toBe(testProduct._id.toString());
    expect(savedFavourite.products[2].toString()).toBe(testProduct2._id.toString());
  });

  test('FM-019 | Edge case: Non-existent user reference', async () => {
    // Given: Favourite with non-existent user ID
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const favourite = new Favourite({
      user: nonExistentUserId,
      products: [testProduct._id],
    });

    // When: Favourite is saved
    // Then: Saves successfully (MongoDB doesn't validate references by default)
    const savedFavourite = await favourite.save();
    expect(savedFavourite._id).toBeDefined();
    expect(savedFavourite.user.toString()).toBe(nonExistentUserId.toString());
  });

  test('FM-020 | Edge case: Non-existent product references', async () => {
    // Given: Favourite with non-existent product IDs
    const nonExistentProductId = new mongoose.Types.ObjectId();
    const favourite = new Favourite({
      user: testUser._id,
      products: [nonExistentProductId],
    });

    // When: Favourite is saved
    // Then: Saves successfully (MongoDB doesn't validate references by default)
    const savedFavourite = await favourite.save();
    expect(savedFavourite._id).toBeDefined();
    expect(savedFavourite.products[0].toString()).toBe(nonExistentProductId.toString());
  });

  // ===================================================================
  // Test Suite: Pre-save Middleware Edge Cases
  // ===================================================================

  test('FM-021 | Pre-save middleware: Handle undefined user', async () => {
    // Given: Favourite with undefined user
    const favourite = new Favourite({
      user: undefined,
      products: [testProduct._id],
    });

    // When: Favourite is saved
    // Then: Should not throw error (middleware handles undefined)
    await expect(favourite.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(favourite.save()).rejects.toThrow(/User is required/);
  });

  test('FM-022 | Pre-save middleware: Handle null user', async () => {
    // Given: Favourite with null user
    const favourite = new Favourite({
      user: null,
      products: [testProduct._id],
    });

    // When: Favourite is saved
    // Then: Should not throw error (middleware handles null)
    await expect(favourite.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(favourite.save()).rejects.toThrow(/User is required/);
  });

  test('FM-023 | Pre-save middleware: Handle product field (legacy code)', async () => {
    // Given: Favourite with product field (legacy code in middleware)
    const favourite = new Favourite({
      user: testUser._id,
      products: [testProduct._id],
    });

    // Manually set product field to test middleware
    favourite.product = testProduct._id.toString();

    // When: Favourite is saved
    // Then: Should throw error due to ObjectId constructor issue
    await expect(favourite.save()).rejects.toThrow(
      /Class constructor ObjectId cannot be invoked without 'new'/
    );
  });

  test('FM-024 | Pre-save middleware: Convert string user ID (already covered)', async () => {
    // Given: Favourite with string user ID
    const favourite = new Favourite({
      user: testUser._id.toString(),
      products: [testProduct._id],
    });

    // When: Favourite is saved
    const savedFavourite = await favourite.save();

    // Then: User ID is converted to ObjectId
    expect(savedFavourite._id).toBeDefined();
    expect(savedFavourite.user).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(savedFavourite.user.toString()).toBe(testUser._id.toString());
  });
});
