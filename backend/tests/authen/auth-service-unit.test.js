/**
 * @fileoverview Unit Tests for Auth Service
 * @suite Test Suite 4: Auth Service (Unit)
 * @coverage services/auth.service.js
 * @generated 2025-10-27
 */

import { jest } from '@jest/globals';

// Mock User as a constructor
const mockUserSave = jest.fn();
const mockUserToObject = jest.fn();
class MockUser {
  constructor(data) {
    Object.assign(this, data);
    this.save = mockUserSave;
    this.toObject = mockUserToObject;
  }
  static findOne = jest.fn();
  static findById = jest.fn();
}

// Mock all dependencies BEFORE importing
jest.unstable_mockModule('../../src/models/User.js', () => ({
  default: MockUser,
}));

jest.unstable_mockModule('../../src/models/TokenBlacklist.js', () => ({
  default: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  },
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    genSalt: jest.fn(),
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/utils/validation.js', () => ({
  validateEmail: jest.fn(),
  validatePhone: jest.fn(),
}));

jest.unstable_mockModule('../../src/services/email.service.js', () => ({
  default: {
    sendTemplatedEmail: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocking
const AuthService = (await import('../../src/services/auth.service.js')).default;
const User = (await import('../../src/models/User.js')).default;
const TokenBlacklist = (await import('../../src/models/TokenBlacklist.js')).default;
const jwt = (await import('jsonwebtoken')).default;
const bcrypt = (await import('bcryptjs')).default;
const { validateEmail, validatePhone } = await import('../../src/utils/validation.js');
const EmailService = (await import('../../src/services/email.service.js')).default;
const logger = (await import('../../src/utils/logger.js')).default;

describe('Authentication & Authorization — Test Suite 4: Auth Service (Unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default environment variables
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1d';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // register() Tests
  // ========================================
  describe('register()', () => {
    test('TC-401 | Happy Path - Should register user successfully', async () => {
      // Given: Valid user data
      const userData = {
        name: 'Nguyễn Văn Test',
        email: 'test@example.com',
        phone: '0987654321',
        password: 'Password123!',
        address: {
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          city: 'TP.HCM',
        },
      };

      validateEmail.mockReturnValue(true);
      validatePhone.mockReturnValue(true);
      MockUser.findOne.mockResolvedValue(null); // No existing user
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');

      mockUserSave.mockResolvedValue(true);
      mockUserToObject.mockReturnValue({
        _id: 'user-id-123',
        name: userData.name,
        email: userData.email,
      });

      jwt.sign.mockReturnValue('mock-token');
      EmailService.sendTemplatedEmail.mockResolvedValue(true);

      // When: Register user
      const result = await AuthService.register(userData);

      // Then: Should return user with tokens
      expect(validateEmail).toHaveBeenCalledWith(userData.email);
      expect(validatePhone).toHaveBeenCalledWith(userData.phone);
      expect(MockUser.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 'salt');
      expect(mockUserSave).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
    });

    test('TC-402 | Error - Should throw error for missing required fields', async () => {
      // Given: Missing required fields
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        // Missing phone and password
      };

      // When & Then: Should throw error
      await expect(AuthService.register(userData)).rejects.toThrow(
        'Missing required fields: name, email, phone, password'
      );
    });

    test('TC-403 | Error - Should throw error for invalid email', async () => {
      // Given: Invalid email
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        phone: '0987654321',
        password: 'Password123!',
        address: {
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          city: 'TP.HCM',
        },
      };

      validateEmail.mockReturnValue(false);
      validatePhone.mockReturnValue(true);

      // When & Then: Should throw error
      await expect(AuthService.register(userData)).rejects.toThrow('Invalid email format');
    });

    test('TC-404 | Error - Should throw error for existing user', async () => {
      // Given: User already exists
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        phone: '0987654321',
        password: 'Password123!',
        address: {
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          city: 'TP.HCM',
        },
      };

      validateEmail.mockReturnValue(true);
      validatePhone.mockReturnValue(true);
      MockUser.findOne.mockResolvedValue({ email: userData.email }); // User exists

      // When & Then: Should throw error
      await expect(AuthService.register(userData)).rejects.toThrow('User already exists');
    });
  });

  // ========================================
  // login() Tests
  // ========================================
  describe('login()', () => {
    test('TC-405 | Happy Path - Should login successfully', async () => {
      // Given: Valid credentials
      const email = 'test@example.com';
      const password = 'Password123!';

      const mockUser = {
        _id: 'user-id-123',
        email,
        password: 'hashedPassword',
        isBanned: false,
        toObject: jest.fn(() => ({ _id: 'user-id-123', email })),
      };

      MockUser.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-token');

      // When: Login
      const result = await AuthService.login(email, password);

      // Then: Should return user with tokens
      expect(MockUser.findOne).toHaveBeenCalledWith({ email });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
    });

    test('TC-406 | Error - Should throw error for invalid email', async () => {
      // Given: User not found
      MockUser.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      // When & Then: Should throw error
      await expect(AuthService.login('nonexistent@example.com', 'password')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    test('TC-407 | Error - Should throw error for banned user', async () => {
      // Given: Banned user
      const mockUser = {
        _id: 'user-id-123',
        email: 'banned@example.com',
        isBanned: true,
      };

      MockUser.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      // When & Then: Should throw error
      await expect(AuthService.login('banned@example.com', 'password')).rejects.toThrow(
        'Account has been banned'
      );
    });

    test('TC-408 | Error - Should throw error for invalid password', async () => {
      // Given: Invalid password
      const mockUser = {
        _id: 'user-id-123',
        email: 'test@example.com',
        password: 'hashedPassword',
        isBanned: false,
      };

      MockUser.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      bcrypt.compare.mockResolvedValue(false); // Wrong password

      // When & Then: Should throw error
      await expect(AuthService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  // ========================================
  // verifyEmail() Tests
  // ========================================
  describe('verifyEmail()', () => {
    test('TC-409 | Happy Path - Should verify email successfully', async () => {
      // Given: Valid verification token
      const token = 'valid-token';
      const mockUser = {
        _id: 'user-id-123',
        email: 'test@example.com',
        isVerified: false,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn(() => ({
          _id: 'user-id-123',
          email: 'test@example.com',
          isVerified: true,
        })),
      };

      jwt.verify.mockReturnValue({ userId: 'user-id-123' });
      MockUser.findById.mockResolvedValue(mockUser);

      // When: Verify email
      const result = await AuthService.verifyEmail(token);

      // Then: Should set isVerified to true
      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(MockUser.findById).toHaveBeenCalledWith('user-id-123');
      expect(mockUser.isVerified).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('TC-410 | Error - Should throw error for user not found', async () => {
      // Given: User not found
      jwt.verify.mockReturnValue({ userId: 'nonexistent-id' });
      User.findById.mockResolvedValue(null);

      // When & Then: Should throw error
      await expect(AuthService.verifyEmail('token')).rejects.toThrow('User not found');
    });
  });

  // ========================================
  // getUserProfile() Tests
  // ========================================
  describe('getUserProfile()', () => {
    test('TC-411 | Happy Path - Should get user profile successfully', async () => {
      // Given: Valid user ID
      const userId = 'user-id-123';
      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        name: 'Test User',
        toObject: jest.fn(() => ({ _id: userId, email: 'test@example.com', name: 'Test User' })),
      };

      MockUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      // When: Get profile
      const result = await AuthService.getUserProfile(userId);

      // Then: Should return user profile
      expect(MockUser.findById).toHaveBeenCalledWith(userId);
      expect(result).toHaveProperty('_id', userId);
    });

    test('TC-412 | Error - Should throw error for user not found', async () => {
      // Given: User not found
      MockUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      // When & Then: Should throw error
      await expect(AuthService.getUserProfile('nonexistent-id')).rejects.toThrow('User not found');
    });
  });

  // ========================================
  // logout() Tests
  // ========================================
  describe('logout()', () => {
    test('TC-413 | Happy Path - Should logout successfully', async () => {
      // Given: Valid user and token
      const userId = 'user-id-123';
      const token = 'valid-token';
      const mockUser = { _id: userId, email: 'test@example.com' };

      MockUser.findById.mockResolvedValue(mockUser);
      jwt.decode.mockReturnValue({ exp: 1234567890 });
      TokenBlacklist.create.mockResolvedValue(true);

      // When: Logout
      const result = await AuthService.logout(userId, token);

      // Then: Should blacklist token
      expect(MockUser.findById).toHaveBeenCalledWith(userId);
      expect(jwt.decode).toHaveBeenCalledWith(token);
      expect(TokenBlacklist.create).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    test('TC-414 | Error - Should throw error for user not found', async () => {
      // Given: User not found
      MockUser.findById.mockResolvedValue(null);

      // When & Then: Should throw error
      await expect(AuthService.logout('nonexistent-id', 'token')).rejects.toThrow('User not found');
    });

    test('TC-415 | Error - Should throw error for invalid token', async () => {
      // Given: Invalid token
      const mockUser = { _id: 'user-id-123' };
      MockUser.findById.mockResolvedValue(mockUser);
      jwt.decode.mockReturnValue(null); // Invalid token

      // When & Then: Should throw error
      await expect(AuthService.logout('user-id-123', 'invalid-token')).rejects.toThrow(
        'Invalid token'
      );
    });
  });

  // ========================================
  // resetPassword() Tests
  // ========================================
  describe('resetPassword()', () => {
    test('TC-416 | Happy Path - Should reset password successfully', async () => {
      // Given: Valid reset token and new password
      const token = 'valid-reset-token';
      const newPassword = 'NewPassword123!';
      const mockUser = {
        _id: 'user-id-123',
        email: 'test@example.com',
        save: jest.fn().mockResolvedValue(true),
      };

      jwt.verify.mockReturnValue({ userId: 'user-id-123' });
      MockUser.findById.mockResolvedValue(mockUser);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedNewPassword');

      // When: Reset password
      const result = await AuthService.resetPassword(token, newPassword);

      // Then: Should update password
      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(MockUser.findById).toHaveBeenCalledWith('user-id-123');
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 'salt');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'Password reset successfully' });
    });

    test('TC-417 | Error - Should throw error for missing token', async () => {
      // When & Then: Should throw error
      await expect(AuthService.resetPassword(null, 'newPassword')).rejects.toThrow(
        'Token and new password are required'
      );
    });

    test('TC-418 | Error - Should throw error for short password', async () => {
      // Given: Password too short
      const token = 'valid-token';
      const newPassword = 'short';
      const mockUser = { _id: 'user-id-123' };

      jwt.verify.mockReturnValue({ userId: 'user-id-123' });
      User.findById.mockResolvedValue(mockUser);

      // When & Then: Should throw error
      await expect(AuthService.resetPassword(token, newPassword)).rejects.toThrow(
        'Password must be at least 8 characters long'
      );
    });
  });

  // ========================================
  // refreshToken() Tests
  // ========================================
  describe('refreshToken()', () => {
    test('TC-419 | Happy Path - Should refresh token successfully', async () => {
      // Given: Valid refresh token
      const refreshToken = 'valid-refresh-token';
      const mockUser = { _id: 'user-id-123', email: 'test@example.com' };

      jwt.verify.mockReturnValue({ userId: 'user-id-123' });
      MockUser.findById.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('new-access-token');

      // When: Refresh token
      const result = await AuthService.refreshToken(refreshToken);

      // Then: Should return new access token
      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, process.env.JWT_REFRESH_SECRET);
      expect(MockUser.findById).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual({ token: 'new-access-token' });
    });

    test('TC-420 | Error - Should throw error for user not found', async () => {
      // Given: User not found
      jwt.verify.mockReturnValue({ userId: 'nonexistent-id' });
      User.findById.mockResolvedValue(null);

      // When & Then: Should throw error
      await expect(AuthService.refreshToken('refresh-token')).rejects.toThrow(
        'Failed to refresh token: User not found'
      );
    });
  });

  // ========================================
  // Token Generation Tests
  // ========================================
  describe('Token Generation', () => {
    test('TC-421 | Should generate access token', () => {
      // Given: User ID
      const userId = 'user-id-123';
      jwt.sign.mockReturnValue('access-token');

      // When: Generate token
      const token = AuthService.generateToken(userId);

      // Then: Should call jwt.sign with correct params
      expect(jwt.sign).toHaveBeenCalledWith({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });
      expect(token).toBe('access-token');
    });

    test('TC-422 | Should generate refresh token', () => {
      // Given: User ID
      const userId = 'user-id-123';
      jwt.sign.mockReturnValue('refresh-token');

      // When: Generate refresh token
      const token = AuthService.generateRefreshToken(userId);

      // Then: Should call jwt.sign with correct params
      expect(jwt.sign).toHaveBeenCalledWith({ userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      });
      expect(token).toBe('refresh-token');
    });
  });

  // ========================================
  // formatUserResponse() Tests
  // ========================================
  describe('formatUserResponse()', () => {
    test('TC-423 | Should remove password from user object', () => {
      // Given: User object with password
      const mockUser = {
        toObject: jest.fn(() => ({
          _id: 'user-id-123',
          email: 'test@example.com',
          password: 'hashedPassword',
        })),
      };

      // When: Format user response
      const result = AuthService.formatUserResponse(mockUser);

      // Then: Should not include password
      expect(result).toHaveProperty('_id');
      expect(result).toHaveProperty('email');
      expect(result).not.toHaveProperty('password');
    });
  });

  // ========================================
  // isTokenBlacklisted() Tests
  // ========================================
  describe('isTokenBlacklisted()', () => {
    test('TC-424 | Should return true for blacklisted token', async () => {
      // Given: Blacklisted token
      const token = 'blacklisted-token';
      TokenBlacklist.findOne.mockResolvedValue({ token });

      // When: Check if blacklisted
      const result = await AuthService.isTokenBlacklisted(token);

      // Then: Should return true
      expect(TokenBlacklist.findOne).toHaveBeenCalledWith({ token });
      expect(result).toBe(true);
    });

    test('TC-425 | Should return false for non-blacklisted token', async () => {
      // Given: Non-blacklisted token
      const token = 'valid-token';
      TokenBlacklist.findOne.mockResolvedValue(null);

      // When: Check if blacklisted
      const result = await AuthService.isTokenBlacklisted(token);

      // Then: Should return false
      expect(TokenBlacklist.findOne).toHaveBeenCalledWith({ token });
      expect(result).toBe(false);
    });
  });

  // ========================================
  // updateProfile() Tests
  // ========================================
  describe('updateProfile()', () => {
    test('TC-426 | Happy Path - Should update user profile successfully', async () => {
      // Given: Valid update data
      const userId = 'user-id-123';
      const updateData = {
        dob: new Date('1990-01-01'),
        gender: 'male',
        avatar: 'https://example.com/new-avatar.jpg',
        phone: '0999888777',
      };

      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        dob: updateData.dob,
        gender: updateData.gender,
        avatar: updateData.avatar,
        phone: updateData.phone,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn(() => ({ _id: userId, ...updateData })),
      };

      MockUser.findById.mockResolvedValue(mockUser);

      // When: Update profile
      const result = await AuthService.updateProfile(userId, updateData);

      // Then: Should update and return user
      expect(MockUser.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toHaveProperty('_id', userId);
    });

    test('TC-427 | Error - Should throw error for user not found', async () => {
      // Given: User not found
      MockUser.findById.mockResolvedValue(null);

      // When & Then: Should throw error
      await expect(AuthService.updateProfile('nonexistent-id', {})).rejects.toThrow(
        'User not found'
      );
    });
  });

  // ========================================
  // sendVerificationEmail() Tests
  // ========================================
  describe('sendVerificationEmail()', () => {
    test('TC-428 | Happy Path - Should send verification email', async () => {
      // Given: Valid user email
      const email = 'test@example.com';
      const mockUser = {
        _id: 'user-id-123',
        email,
        name: 'Test User',
        isVerified: false,
      };

      MockUser.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('verification-token');
      EmailService.sendTemplatedEmail.mockResolvedValue(true);

      // When: Send verification email
      const result = await AuthService.sendVerificationEmail(email);

      // Then: Should send email
      expect(MockUser.findOne).toHaveBeenCalledWith({ email });
      expect(EmailService.sendTemplatedEmail).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    test('TC-429 | Error - Should throw error for already verified user', async () => {
      // Given: Already verified user
      const mockUser = {
        _id: 'user-id-123',
        email: 'test@example.com',
        isVerified: true,
      };

      MockUser.findOne.mockResolvedValue(mockUser);

      // When & Then: Should throw error
      await expect(AuthService.sendVerificationEmail('test@example.com')).rejects.toThrow(
        'User already verified'
      );
    });
  });

  // ========================================
  // resendVerificationEmail() Tests
  // ========================================
  describe('resendVerificationEmail()', () => {
    test('TC-430 | Happy Path - Should resend verification email', async () => {
      // Given: Valid unverified user
      const email = 'test@example.com';
      const mockUser = {
        _id: 'user-id-123',
        email,
        name: 'Test User',
        isVerified: false,
      };

      MockUser.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('verification-token');
      EmailService.sendTemplatedEmail.mockResolvedValue(true);

      // When: Resend verification email
      const result = await AuthService.resendVerificationEmail(email);

      // Then: Should send email
      expect(MockUser.findOne).toHaveBeenCalledWith({ email });
      expect(EmailService.sendTemplatedEmail).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  // ========================================
  // changePassword() Tests
  // ========================================
  describe('changePassword()', () => {
    test('TC-431 | Happy Path - Should change password successfully', async () => {
      // Given: Valid email and new password
      const email = 'test@example.com';
      const newPassword = 'NewPassword123!';
      const mockUser = {
        _id: 'user-id-123',
        email,
        save: jest.fn().mockResolvedValue(true),
      };

      MockUser.findOne.mockResolvedValue(mockUser);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedNewPassword');

      // When: Change password
      const result = await AuthService.changePassword(email, newPassword);

      // Then: Should update password
      expect(MockUser.findOne).toHaveBeenCalledWith({ email });
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 'salt');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    test('TC-432 | Error - Should throw error for user not found', async () => {
      // Given: User not found
      MockUser.findOne.mockResolvedValue(null);

      // When & Then: Should throw error
      await expect(
        AuthService.changePassword('nonexistent@example.com', 'newPassword')
      ).rejects.toThrow('User not found');
    });
  });

  // ========================================
  // forgotPassword() Tests
  // ========================================
  describe('forgotPassword()', () => {
    test('TC-433 | Happy Path - Should send password reset email', async () => {
      // Given: Valid user email
      const email = 'test@example.com';
      const mockUser = {
        _id: 'user-id-123',
        email,
        name: 'Test User',
      };

      MockUser.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('reset-token');
      EmailService.sendTemplatedEmail.mockResolvedValue(true);

      // When: Forgot password
      const result = await AuthService.forgotPassword(email);

      // Then: Should send reset email
      expect(MockUser.findOne).toHaveBeenCalledWith({ email });
      expect(EmailService.sendTemplatedEmail).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    test('TC-434 | Error - Should throw error for user not found', async () => {
      // Given: User not found
      MockUser.findOne.mockResolvedValue(null);

      // When & Then: Should throw error
      await expect(AuthService.forgotPassword('nonexistent@example.com')).rejects.toThrow(
        'User not found'
      );
    });
  });

  // ========================================
  // revokeToken() Tests
  // ========================================
  describe('revokeToken()', () => {
    test('TC-435 | Happy Path - Should revoke token successfully', async () => {
      // Given: Valid refresh token
      const token = 'valid-refresh-token';
      const mockUser = { _id: 'user-id-123' };

      jwt.verify.mockReturnValue({ userId: 'user-id-123', exp: 1234567890 });
      MockUser.findById.mockResolvedValue(mockUser);
      TokenBlacklist.create.mockResolvedValue(true);

      // When: Revoke token
      const result = await AuthService.revokeToken(token);

      // Then: Should blacklist token
      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_REFRESH_SECRET);
      expect(MockUser.findById).toHaveBeenCalledWith('user-id-123');
      expect(TokenBlacklist.create).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    test('TC-436 | Error - Should throw error for user not found', async () => {
      // Given: User not found
      jwt.verify.mockReturnValue({ userId: 'nonexistent-id' });
      MockUser.findById.mockResolvedValue(null);

      // When & Then: Should throw error
      await expect(AuthService.revokeToken('token')).rejects.toThrow(
        'Failed to revoke token: User not found'
      );
    });
  });

  // ========================================
  // Additional Edge Cases for register()
  // ========================================
  describe('register() - Additional Edge Cases', () => {
    test('TC-437 | Error - Should throw error for missing address fields', async () => {
      // Given: Missing address ward field
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '0987654321',
        password: 'Password123!',
        address: {
          street: '123 Test St',
          // Missing ward
          district: 'District 1',
          city: 'TP.HCM',
        },
      };

      // When & Then: Should throw error
      await expect(AuthService.register(userData)).rejects.toThrow(
        'Missing required address fields'
      );
    });

    test('TC-438 | Error - Should throw error for invalid phone', async () => {
      // Given: Invalid phone
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: 'invalid-phone',
        password: 'Password123!',
        address: {
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          city: 'TP.HCM',
        },
      };

      validateEmail.mockReturnValue(true);
      validatePhone.mockReturnValue(false); // Invalid phone

      // When & Then: Should throw error
      await expect(AuthService.register(userData)).rejects.toThrow('Invalid phone format');
    });
  });
});
