/**
 * @fileoverview User Model Unit Tests
 * @module tests/user-model
 * @description Comprehensive unit tests for User model (models/User.js)
 * Test Suite: Unit Tests - User Model (UM-001 to UM-020)
 * Coverage: Schema validation, password hashing, matchPassword, default values
 */

import mongoose from 'mongoose';
import User from '../../src/models/User.js';
import bcrypt from 'bcryptjs';

describe('Users — Unit Tests - User Model', () => {
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
    await User.deleteMany({});
  });

  // Teardown: Close database connection
  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // ===================================================================
  // Test Suite: User Creation & Default Values
  // ===================================================================

  test('UM-001 | Create user with valid data', async () => {
    // Given: Database is empty with valid user data
    const userData = {
      fullName: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Main St',
    };

    // When: User is created and saved
    const user = new User(userData);
    const savedUser = await user.save();

    // Then: User saved successfully with correct default values
    expect(savedUser._id).toBeDefined();
    expect(savedUser.fullName).toBe('John Doe');
    expect(savedUser.username).toBe('johndoe');
    expect(savedUser.email).toBe('john@example.com');
    expect(savedUser.phone).toBe('1234567890');
    expect(savedUser.address).toBe('123 Main St');

    // Verify default values
    expect(savedUser.status).toBe(true);
    expect(savedUser.isVerified).toBe(false);
    expect(savedUser.reward_point).toBe(0);
    expect(savedUser.role).toBe('customer');
    expect(savedUser.avatar).toBe(
      'https://static.vecteezy.com/system/resources/previews/019/896/008/original/male-user-avatar-icon-in-flat-design-style-person-signs-illustration-png.png'
    );

    // Verify password is hashed
    expect(savedUser.password).not.toBe('password123');
    expect(savedUser.password).toMatch(/^\$2a\$10\$/);
  });

  // ===================================================================
  // Test Suite: Password Hashing
  // ===================================================================

  test('UM-002 | Password hashing on save', async () => {
    // Given: User document with plain password
    const user = new User({
      fullName: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
    });

    // When: User is saved to database
    const savedUser = await user.save();

    // Then: Password field contains bcrypt hash
    expect(savedUser.password).not.toBe('password123');
    expect(savedUser.password).toMatch(/^\$2a\$10\$/);
    expect(savedUser.password.length).toBeGreaterThan(50);

    // Verify hash is valid
    const isMatch = await bcrypt.compare('password123', savedUser.password);
    expect(isMatch).toBe(true);
  });

  test('UM-003 | Password not hashed when not modified', async () => {
    // Given: Existing user in database
    const user = new User({
      fullName: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
    });
    await user.save();
    const originalPasswordHash = user.password;

    // When: Non-password field is updated
    user.fullName = 'Updated Name';
    await user.save();

    // Then: Password hash remains unchanged
    expect(user.password).toBe(originalPasswordHash);
    expect(user.fullName).toBe('Updated Name');
  });

  // ===================================================================
  // Test Suite: Password Matching
  // ===================================================================

  test('UM-004 | matchPassword returns true for correct password', async () => {
    // Given: User exists with hashed password
    const user = new User({
      fullName: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
    });
    await user.save();

    // When: matchPassword is called with correct password
    const isMatch = await user.matchPassword('password123');

    // Then: Returns true
    expect(isMatch).toBe(true);
  });

  test('UM-005 | matchPassword returns false for incorrect password', async () => {
    // Given: User exists with hashed password
    const user = new User({
      fullName: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
    });
    await user.save();

    // When: matchPassword is called with incorrect password
    const isMatch = await user.matchPassword('wrongpassword');

    // Then: Returns false
    expect(isMatch).toBe(false);
  });

  test('UM-006 | matchPassword handles empty password', async () => {
    // Given: User exists with hashed password
    const user = new User({
      fullName: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
    });
    await user.save();

    // When: matchPassword is called with empty string
    const isMatch = await user.matchPassword('');

    // Then: Returns false without throwing error
    expect(isMatch).toBe(false);
  });

  // ===================================================================
  // Test Suite: Required Field Validation
  // ===================================================================

  test('UM-007 | Validation: Missing required field - fullName', async () => {
    // Given: User data without fullName
    const user = new User({
      username: 'test',
      email: 'test@example.com',
      password: 'pass',
    });

    // When: Attempting to save user
    // Then: ValidationError thrown
    await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(user.save()).rejects.toThrow(/Full name is required/);
  });

  test('UM-008 | Validation: Missing required field - username', async () => {
    // Given: User data without username
    const user = new User({
      fullName: 'Test',
      email: 'test@example.com',
      password: 'pass',
    });

    // When: Attempting to save user
    // Then: ValidationError thrown
    await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(user.save()).rejects.toThrow(/Username is required/);
  });

  test('UM-009 | Validation: Missing required field - email', async () => {
    // Given: User data without email
    const user = new User({
      fullName: 'Test',
      username: 'test',
      password: 'pass',
    });

    // When: Attempting to save user
    // Then: ValidationError thrown
    await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(user.save()).rejects.toThrow(/Email is required/);
  });

  // ===================================================================
  // Test Suite: Email Validation
  // ===================================================================

  test('UM-010 | Validation: Invalid email format', async () => {
    // Given: User with invalid email format
    const user = new User({
      fullName: 'Test User',
      username: 'testuser',
      email: 'invalid-email-format',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
    });

    // When: Attempting to save user
    // Then: ValidationError thrown
    await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(user.save()).rejects.toThrow(/Please enter a valid email/);
  });

  test('UM-011 | Validation: Email converted to lowercase', async () => {
    // Given: User with uppercase email
    const user = new User({
      fullName: 'Test User',
      username: 'testuser',
      email: 'John@EXAMPLE.COM',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
    });

    // When: User is saved
    const savedUser = await user.save();

    // Then: Email stored as lowercase
    expect(savedUser.email).toBe('john@example.com');
  });

  // ===================================================================
  // Test Suite: Username Validation
  // ===================================================================

  test('UM-012 | Validation: Username too short', async () => {
    // Given: User with 2-character username
    const user = new User({
      fullName: 'Test User',
      username: 'ab',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
    });

    // When: Attempting to save user
    // Then: ValidationError thrown
    await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(user.save()).rejects.toThrow(/Username must be at least 3 characters long/);
  });

  test('UM-013 | Validation: Username too long', async () => {
    // Given: User with 31-character username
    const user = new User({
      fullName: 'Test User',
      username: 'a'.repeat(31),
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
    });

    // When: Attempting to save user
    // Then: ValidationError thrown
    await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(user.save()).rejects.toThrow(/Username cannot exceed 30 characters/);
  });

  // ===================================================================
  // Test Suite: Full Name Validation
  // ===================================================================

  test('UM-014 | Validation: Full name too short', async () => {
    // Given: User with 1-character fullName
    const user = new User({
      fullName: 'A',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
    });

    // When: Attempting to save user
    // Then: ValidationError thrown
    await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(user.save()).rejects.toThrow(/Full name must be at least 2 characters long/);
  });

  test('UM-015 | Validation: Full name too long', async () => {
    // Given: User with 51-character fullName
    const user = new User({
      fullName: 'a'.repeat(51),
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
    });

    // When: Attempting to save user
    // Then: ValidationError thrown
    await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(user.save()).rejects.toThrow(/Full name cannot exceed 50 characters/);
  });

  // ===================================================================
  // Test Suite: Phone Validation
  // ===================================================================

  test('UM-016 | Validation: Invalid phone format', async () => {
    // Given: User with 5-digit phone
    const user = new User({
      fullName: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      phone: '12345',
      address: '123 Test St',
    });

    // When: Attempting to save user
    // Then: ValidationError thrown
    await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(user.save()).rejects.toThrow(/Please enter a valid phone number/);
  });

  // ===================================================================
  // Test Suite: About Me Validation
  // ===================================================================

  test('UM-017 | Validation: About me exceeds max length', async () => {
    // Given: User with 501-character aboutMe
    const user = new User({
      fullName: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
      aboutMe: 'a'.repeat(501),
    });

    // When: Attempting to save user
    // Then: ValidationError thrown
    await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(user.save()).rejects.toThrow(/About me cannot exceed 500 characters/);
  });

  // ===================================================================
  // Test Suite: Enum Validation
  // ===================================================================

  test('UM-018 | Validation: Invalid gender enum', async () => {
    // Given: User with invalid gender value
    const user = new User({
      fullName: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
      gender: 'unknown',
    });

    // When: Attempting to save user
    // Then: ValidationError thrown
    await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(user.save()).rejects.toThrow(/unknown is not a valid gender/);
  });

  test('UM-019 | Validation: Invalid role enum', async () => {
    // Given: User with invalid role value
    const user = new User({
      fullName: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
      role: 'superuser',
    });

    // When: Attempting to save user
    // Then: ValidationError thrown
    await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    await expect(user.save()).rejects.toThrow(/superuser is not a valid role/);
  });

  // ===================================================================
  // Test Suite: Unique Constraints
  // ===================================================================

  test('UM-020 | Duplicate email rejected', async () => {
    // Given: First user with email exists
    const firstUser = new User({
      fullName: 'First User',
      username: 'firstuser',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
    });
    await firstUser.save();

    // When: Second user with same email is created
    const secondUser = new User({
      fullName: 'Second User',
      username: 'seconduser',
      email: 'test@example.com',
      password: 'password456',
      phone: '0987654321',
      address: '456 Oak Ave',
    });

    // Then: MongoError E11000 thrown (duplicate key error)
    await expect(secondUser.save()).rejects.toThrow(/E11000/);
    await expect(secondUser.save()).rejects.toThrow(/duplicate key/);
  });
});
