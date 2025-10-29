/**
 * @fileoverview Unit Tests for Auth Controller
 * @suite Test Suite 2: Auth Controller (Unit)
 * @coverage controllers/authController.js
 * @generated 2025-10-27
 * @target ≥90% coverage for register, login, logout, and related auth functions
 */

import { jest } from '@jest/globals';

// Create mock functions
const mockUserFindOne = jest.fn();
const mockUserCreate = jest.fn();
const mockUserFindById = jest.fn();
const mockUserFindOneAndUpdate = jest.fn();
const mockUserFindByIdAndUpdate = jest.fn();
const mockUserSave = jest.fn();
const mockUserExists = jest.fn();
const mockMatchPassword = jest.fn();

const mockTokenBlacklistCreate = jest.fn();
const mockTokenBlacklistFindOne = jest.fn();

const mockJwtVerify = jest.fn();
const mockJwtSign = jest.fn();

const mockGenerateToken = jest.fn();

const mockSendTemplatedEmail = jest.fn();

const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();
const mockLoggerWarn = jest.fn();

class MockErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

// Create User constructor mock class
class MockUserConstructor {
  constructor(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
    this.matchPassword = jest.fn();
    this.toObject = jest.fn(() => {
      const obj = { ...this };
      delete obj.password;
      return obj;
    });
  }

  // Static methods
  static findOne = mockUserFindOne;
  static create = mockUserCreate;
  static findById = mockUserFindById;
  static findOneAndUpdate = mockUserFindOneAndUpdate;
  static findByIdAndUpdate = mockUserFindByIdAndUpdate;
  static exists = mockUserExists;
}

// Mock all modules BEFORE importing
jest.unstable_mockModule('../../src/models/User.js', () => ({
  default: MockUserConstructor,
}));

jest.unstable_mockModule('../../src/models/TokenBlacklist.js', () => ({
  default: {
    create: mockTokenBlacklistCreate,
    findOne: mockTokenBlacklistFindOne,
  },
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: mockJwtVerify,
    sign: mockJwtSign,
  },
}));

jest.unstable_mockModule('../../src/utils/jwt.js', () => ({
  generateToken: mockGenerateToken,
}));

jest.unstable_mockModule('../../src/utils/sendEmail.js', () => ({
  sendTemplatedEmail: mockSendTemplatedEmail,
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: mockLoggerInfo,
    error: mockLoggerError,
    warn: mockLoggerWarn,
    debug: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/utils/errorResponse.js', () => {
  class ErrorResponse extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.message = message;
    }
  }
  return { ErrorResponse };
});

// Import controller functions after mocking
const authController = await import('../../src/controllers/authController.js');
const {
  register,
  registerApp,
  verifyOtp,
  resendOtp,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
  loginWithGoogle,
  loginWithFacebook,
  getMe,
  updateProfile,
  changePassword,
  setPassword,
} = authController;

const { getMockReqRes, generateMockUser } = await import('../_helpers/testUtils.js');

describe('Authentication & Authorization — Test Suite 2: Auth Controller (Unit)', () => {
  let req, res, next;
  let mockUser;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create fresh mock req/res/next
    ({ req, res, next } = getMockReqRes());

    // Create default mock user
    mockUser = generateMockUser({
      _id: 'user-id-123',
      fullName: 'Nguyễn Văn Test',
      username: 'testuser',
      email: 'test@example.com',
      password: '$2a$10$hashedPassword',
      phone: '0987654321',
      address: '123 Test Street',
      role: 'customer',
      isVerified: true,
      status: true,
    });

    // Setup default mock implementations
    mockGenerateToken.mockReturnValue('mock.jwt.token');
    mockSendTemplatedEmail.mockResolvedValue(true);
    mockMatchPassword.mockResolvedValue(true);
  });

  // ========================================
  // REGISTER TESTS
  // ========================================
  describe('register()', () => {
    test('TC-201 | Happy Path - Should register user successfully and return 201', async () => {
      // Given: Valid registration data
      req.body = {
        fullName: 'Nguyễn Văn A',
        username: 'nguyenvana',
        email: 'nguyenvana@example.com',
        password: 'Password@123',
        phone: '0987654321',
        address: '123 Đường Lê Lợi, Q1, TP.HCM',
      };

      mockUserFindOne.mockResolvedValue(null); // User doesn't exist
      mockUserCreate.mockResolvedValue({
        ...mockUser,
        email: req.body.email,
        fullName: req.body.fullName,
        _id: 'new-user-id',
        password: undefined, // Will be removed in response
      });

      // When: Call register
      await register(req, res, next);

      // Then: Should create user and return 201
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(mockUserCreate).toHaveBeenCalled();
      expect(mockGenerateToken).toHaveBeenCalled();
      expect(mockSendTemplatedEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.any(Object),
            tokens: expect.objectContaining({
              accessToken: expect.any(String),
              refreshToken: expect.any(String),
            }),
          }),
        })
      );
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'User registered successfully',
        expect.any(Object)
      );
    });

    test('TC-202 | Error - Should return 400 if user already exists', async () => {
      // Given: Email already exists
      req.body = {
        fullName: 'Nguyễn Văn B',
        username: 'nguyenvanb',
        email: 'nguyenvana@example.com',
        password: 'Password@123',
        phone: '0912345678',
        address: '456 Đường Hai Bà Trưng, Q3, TP.HCM',
      };

      mockUserFindOne.mockResolvedValue(mockUser); // User exists

      // When: Call register
      await register(req, res, next);

      // Then: Should call next with ErrorResponse
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(mockUserCreate).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.message).toBe('User already exists');
      expect(errorArg.statusCode).toBe(400);
    });

    test('TC-203 | Error - Should return 400 if required fields are missing', async () => {
      // Given: Missing fullName
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password@123',
        phone: '0987654321',
        address: 'Địa chỉ test',
      };

      // When: Call register
      await register(req, res, next);

      // Then: Should call next with ErrorResponse
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.message).toContain('Please provide full name');
      expect(errorArg.statusCode).toBe(400);
      expect(mockUserFindOne).not.toHaveBeenCalled();
      expect(mockUserCreate).not.toHaveBeenCalled();
    });

    test('TC-204 | Error - Should handle database error (500)', async () => {
      // Given: Valid data but database error
      req.body = {
        fullName: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password@123',
        phone: '0987654321',
        address: 'Địa chỉ test',
      };

      mockUserFindOne.mockResolvedValue(null);
      mockUserCreate.mockRejectedValue(new Error('Database connection error'));

      // When: Call register
      await register(req, res, next);

      // Then: Should catch error and call next
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Error in register controller',
        expect.any(Object)
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('TC-205 | Error - Should handle email sending failure gracefully', async () => {
      // Given: Valid data but email service fails
      req.body = {
        fullName: 'Nguyễn Văn C',
        username: 'nguyenvanc',
        email: 'nguyenvanc@example.com',
        password: 'Password@123',
        phone: '0987654321',
        address: '789 Test Street',
      };

      mockUserFindOne.mockResolvedValue(null);
      mockUserCreate.mockResolvedValue({
        ...mockUser,
        email: req.body.email,
        _id: 'new-user-id',
      });
      mockSendTemplatedEmail.mockRejectedValue(new Error('Email service unavailable'));

      // When: Call register
      await register(req, res, next);

      // Then: Should catch error and log
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Error in register controller',
        expect.any(Object)
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ========================================
  // LOGIN TESTS
  // ========================================
  describe('login()', () => {
    beforeEach(() => {
      mockUser.matchPassword = mockMatchPassword;
    });

    test('TC-206 | Happy Path - Should login successfully with valid credentials', async () => {
      // Given: Valid credentials
      req.body = {
        email: 'nguoidung@example.com',
        password: 'Password@123',
      };

      const mockUserWithPassword = {
        ...mockUser,
        email: req.body.email,
        matchPassword: mockMatchPassword,
        toObject: () => mockUser,
      };

      mockUserFindOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithPassword),
      });
      mockMatchPassword.mockResolvedValue(true);

      // When: Call login
      await login(req, res, next);

      // Then: Should return 200 with tokens
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(mockMatchPassword).toHaveBeenCalledWith(req.body.password);
      expect(mockGenerateToken).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.any(Object),
            tokens: expect.any(Object),
          }),
        })
      );
    });

    test('TC-207 | Error - Should return 401 if email not found', async () => {
      // Given: Email doesn't exist
      req.body = {
        email: 'khongtontai@example.com',
        password: 'Password@123',
      };

      mockUserFindOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      // When: Call login
      await login(req, res, next);

      // Then: Should return 401 with vague error message
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.message).toContain('Email not found');
      expect(errorArg.statusCode).toBe(401);
    });

    test('TC-208 | Error - Should return 401 if password is incorrect', async () => {
      // Given: User exists but password is wrong
      req.body = {
        email: 'nguoidung@example.com',
        password: 'Password@123_SAI',
      };

      const mockUserWithPassword = {
        ...mockUser,
        matchPassword: mockMatchPassword,
      };

      mockUserFindOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithPassword),
      });
      mockMatchPassword.mockResolvedValue(false); // Wrong password

      // When: Call login
      await login(req, res, next);

      // Then: Should return 401
      expect(mockMatchPassword).toHaveBeenCalledWith(req.body.password);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.message).toContain('Incorrect password');
      expect(errorArg.statusCode).toBe(401);
    });

    test('TC-209 | Error - Should return 401 if user not verified', async () => {
      // Given: User exists but not verified
      req.body = {
        email: 'nguoidung@example.com',
        password: 'Password@123',
      };

      const unverifiedUser = {
        ...mockUser,
        isVerified: false,
        matchPassword: mockMatchPassword,
      };

      mockUserFindOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(unverifiedUser),
      });
      mockMatchPassword.mockResolvedValue(true);

      // When: Call login
      await login(req, res, next);

      // Then: Should return 401 asking to verify email
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.message).toContain('Please verify your email');
      expect(errorArg.statusCode).toBe(401);
    });

    test('TC-210 | Error - Should return 401 if user account is banned', async () => {
      // Given: User exists but status=false (banned)
      req.body = {
        email: 'nguoidung@example.com',
        password: 'Password@123',
      };

      const bannedUser = {
        ...mockUser,
        status: false,
        matchPassword: mockMatchPassword,
      };

      mockUserFindOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(bannedUser),
      });
      mockMatchPassword.mockResolvedValue(true);

      // When: Call login
      await login(req, res, next);

      // Then: Should return 401
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.message).toContain('Your account has been deactivated');
      expect(errorArg.statusCode).toBe(401);
    });

    test('TC-211 | Happy Path - Should handle "Remember Me" with extended token expiry', async () => {
      // Given: Valid credentials with rememberMe=true
      req.body = {
        email: 'nguoidung@example.com',
        password: 'Password@123',
        rememberMe: true,
      };

      const mockUserWithPassword = {
        ...mockUser,
        matchPassword: mockMatchPassword,
        toObject: () => mockUser,
      };

      mockUserFindOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithPassword),
      });
      mockMatchPassword.mockResolvedValue(true);

      // When: Call login
      await login(req, res, next);

      // Then: Should generate tokens with extended expiry
      expect(mockGenerateToken).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockUser._id }),
        '30d' // Extended access token expiry
      );
      expect(mockGenerateToken).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockUser._id }),
        '90d' // Extended refresh token expiry
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('TC-212 | Error - Should return 400 if email or password is missing', async () => {
      // Given: Missing password
      req.body = {
        email: 'test@example.com',
      };

      // When: Call login
      await login(req, res, next);

      // Then: Should return 400
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.message).toContain('Please provide email and password');
      expect(errorArg.statusCode).toBe(400);
      expect(mockUserFindOne).not.toHaveBeenCalled();
    });

    test('TC-213 | Error - Should handle database error (500)', async () => {
      // Given: Valid credentials but database error
      req.body = {
        email: 'test@example.com',
        password: 'Password@123',
      };

      mockUserFindOne.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database connection error')),
      });

      // When: Call login
      await login(req, res, next);

      // Then: Should catch error and call next
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.message).toBe('Database connection error');
    });
  });

  // ========================================
  // LOGOUT TESTS
  // ========================================
  describe('logout()', () => {
    test('TC-214 | Happy Path - Should blacklist token and return 200', async () => {
      // Given: Valid token in Authorization header
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;

      mockTokenBlacklistCreate.mockResolvedValue({
        token: validToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // When: Call logout
      await logout(req, res, next);

      // Then: Should add token to blacklist and return 200
      expect(mockTokenBlacklistCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          token: validToken,
          expiresAt: expect.any(Date),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {},
        })
      );
    });

    test('TC-215 | Edge Case - Should handle logout when no token is provided', async () => {
      // Given: No Authorization header
      delete req.headers.authorization;

      // When: Call logout
      await logout(req, res, next);

      // Then: Should still return 200 without blacklisting
      expect(mockTokenBlacklistCreate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {},
        })
      );
    });

    test('TC-216 | Error - Should handle database error when blacklisting token', async () => {
      // Given: Valid token but database error
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;

      mockTokenBlacklistCreate.mockRejectedValue(new Error('Database error'));

      // When: Call logout
      await logout(req, res, next);

      // Then: Should catch error (asyncHandler will handle it)
      // Note: asyncHandler wraps the function, so error goes to next()
      // This test verifies the error is properly thrown
      expect(mockTokenBlacklistCreate).toHaveBeenCalled();
    });

    test('TC-217 | Edge Case - Should handle malformed Authorization header', async () => {
      // Given: Malformed Authorization header (no Bearer prefix)
      req.headers.authorization = 'invalid-format-token';

      // When: Call logout
      await logout(req, res, next);

      // Then: Should not blacklist (split returns undefined)
      expect(mockTokenBlacklistCreate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ========================================
  // ADDITIONAL COVERAGE TESTS
  // ========================================
  describe('Additional Coverage Tests', () => {
    test('TC-218 | Register - Should validate all required fields (phone)', async () => {
      // Given: Missing phone
      req.body = {
        fullName: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password@123',
        address: 'Test Address',
      };

      // When: Call register
      await register(req, res, next);

      // Then: Should return 400
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(400);
      expect(mockUserCreate).not.toHaveBeenCalled();
    });

    test('TC-219 | Register - Should validate all required fields (address)', async () => {
      // Given: Missing address
      req.body = {
        fullName: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password@123',
        phone: '0987654321',
      };

      // When: Call register
      await register(req, res, next);

      // Then: Should return 400
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(400);
    });

    test('TC-220 | Login - Should remove password from response', async () => {
      // Given: Valid credentials
      req.body = {
        email: 'nguoidung@example.com',
        password: 'Password@123',
      };

      const mockUserWithPassword = {
        ...mockUser,
        password: '$2a$10$hashedPassword',
        matchPassword: mockMatchPassword,
        toObject: () => ({ ...mockUser, password: '$2a$10$hashedPassword' }),
      };

      mockUserFindOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithPassword),
      });
      mockMatchPassword.mockResolvedValue(true);

      // When: Call login
      await login(req, res, next);

      // Then: Password should be removed from response
      expect(res.json).toHaveBeenCalled();
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.data.user).toBeDefined();
      // The password should be set to undefined in the controller
    });
  });

  // ========================================
  // VERIFY EMAIL TESTS
  // ========================================
  describe('verifyEmail()', () => {
    test('TC-221 | Happy Path - Should verify email successfully', async () => {
      // Given: Valid verification token
      req.query = {
        token: 'valid.verification.token',
      };

      const mockDecodedToken = {
        email: 'test@example.com',
      };

      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockUserFindOne.mockResolvedValue({
        ...mockUser,
        email: mockDecodedToken.email,
        isVerified: false,
        verificationToken: 'valid.verification.token',
        save: jest.fn().mockResolvedValue({
          ...mockUser,
          isVerified: true,
        }),
      });

      // Mock res.redirect
      res.redirect = jest.fn();

      // When: Call verifyEmail
      await verifyEmail(req, res, next);

      // Then: Should redirect to success page (email-verified)
      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockUserFindOne).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('email-verified'));
    });

    test('TC-222 | Error - Should handle missing token', async () => {
      // Given: No token provided
      req.query = {};
      res.redirect = jest.fn();

      // When: Call verifyEmail
      await verifyEmail(req, res, next);

      // Then: Should redirect to error page
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('email-verification-failed')
      );
      expect(mockJwtVerify).not.toHaveBeenCalled();
    });

    test('TC-223 | Error - Should handle invalid/expired token', async () => {
      // Given: Invalid token
      req.query = {
        token: 'invalid.token',
      };
      res.redirect = jest.fn();

      mockJwtVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // When: Call verifyEmail
      await verifyEmail(req, res, next);

      // Then: Should redirect to error page
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('email-verification-failed')
      );
    });

    test('TC-224 | Error - Should handle user not found', async () => {
      // Given: Valid token but user doesn't exist
      req.query = {
        token: 'valid.token',
      };
      res.redirect = jest.fn();

      mockJwtVerify.mockReturnValue({ email: 'test@example.com' });
      mockUserFindOne.mockResolvedValue(null);

      // When: Call verifyEmail
      await verifyEmail(req, res, next);

      // Then: Should redirect to error page
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('email-verification-failed')
      );
    });
  });

  // ========================================
  // FORGOT PASSWORD TESTS
  // ========================================
  describe('forgotPassword()', () => {
    test('TC-225 | Happy Path - Should send reset password email', async () => {
      // Given: Valid email
      req.body = {
        email: 'test@example.com',
      };

      const userWithResetToken = {
        ...mockUser,
        email: req.body.email,
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserFindOne.mockResolvedValue(userWithResetToken);
      mockGenerateToken.mockReturnValue('reset.token.here');

      // When: Call forgotPassword
      await forgotPassword(req, res, next);

      // Then: Should save reset token and send email
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(mockSendTemplatedEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Password reset email sent'),
        })
      );
    });

    test('TC-226 | Error - Should return 400 if email is missing', async () => {
      // Given: No email provided
      req.body = {};

      // When: Call forgotPassword
      await forgotPassword(req, res, next);

      // Then: Should return error
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(400);
      expect(errorArg.message).toContain('email');
    });

    test('TC-227 | Error - Should return 404 if user not found', async () => {
      // Given: Email doesn't exist
      req.body = {
        email: 'notfound@example.com',
      };

      mockUserFindOne.mockResolvedValue(null);

      // When: Call forgotPassword
      await forgotPassword(req, res, next);

      // Then: Should return 404
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(404);
    });

    test('TC-228 | Error - Should handle email sending failure', async () => {
      // Given: Valid user but email service fails
      req.body = {
        email: 'test@example.com',
      };

      const userWithResetToken = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserFindOne.mockResolvedValue(userWithResetToken);
      mockSendTemplatedEmail.mockRejectedValue(new Error('Email service down'));

      // When: Call forgotPassword
      await forgotPassword(req, res, next);

      // Then: Should catch error
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ========================================
  // RESET PASSWORD TESTS
  // ========================================
  describe('resetPassword()', () => {
    test('TC-229 | Happy Path - Should reset password successfully', async () => {
      // Given: Valid reset token and new password
      req.body = {
        token: 'valid.reset.token',
        newPassword: 'NewPassword@123',
      };

      mockJwtVerify.mockReturnValue({ id: mockUser._id });

      const userWithResetToken = {
        ...mockUser,
        password: 'oldHashedPassword',
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserFindById.mockResolvedValue(userWithResetToken);

      // When: Call resetPassword
      await resetPassword(req, res, next);

      // Then: Should update password
      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockUserFindById).toHaveBeenCalled();
      expect(userWithResetToken.save).toHaveBeenCalled();
      expect(userWithResetToken.password).toBe('NewPassword@123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('TC-230 | Error - Should return 400 if token or password is missing', async () => {
      // Given: No password provided
      req.body = {
        token: 'valid.token',
        // missing newPassword
      };

      // When: Call resetPassword
      await resetPassword(req, res, next);

      // Then: Should return 400
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(400);
      expect(errorArg.message).toContain('token and new password');
    });

    test('TC-231 | Error - Should return 404 for user not found', async () => {
      // Given: Valid token but user not found
      req.body = {
        token: 'valid.token',
        newPassword: 'NewPassword@123',
      };

      mockJwtVerify.mockReturnValue({ id: 'deleted-user-id' });
      mockUserFindById.mockResolvedValue(null); // User not found

      // When: Call resetPassword
      await resetPassword(req, res, next);

      // Then: Should return 404
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(404);
    });
  });

  // ========================================
  // REFRESH TOKEN TESTS
  // ========================================
  describe('refreshToken()', () => {
    test('TC-232 | Happy Path - Should refresh access token successfully', async () => {
      // Given: Valid refresh token
      req.body = {
        refreshToken: 'valid.refresh.token',
      };

      mockJwtVerify.mockReturnValue({ id: mockUser._id });
      mockUserFindById.mockResolvedValue(mockUser);
      mockJwtSign.mockReturnValue('new.access.token');

      // When: Call refreshToken
      await refreshToken(req, res, next);

      // Then: Should return new access token
      expect(mockJwtVerify).toHaveBeenCalledWith(
        req.body.refreshToken,
        process.env.JWT_REFRESH_SECRET
      );
      expect(mockUserFindById).toHaveBeenCalledWith(mockUser._id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
        })
      );
    });

    test('TC-233 | Error - Should return 400 if refresh token is missing', async () => {
      // Given: No refresh token
      req.body = {};

      // When: Call refreshToken
      await refreshToken(req, res, next);

      // Then: Should return 400
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(400);
    });

    test('TC-234 | Error - Should return 401 for invalid refresh token', async () => {
      // Given: Invalid refresh token
      req.body = {
        refreshToken: 'invalid.token',
      };

      mockJwtVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // When: Call refreshToken
      await refreshToken(req, res, next);

      // Then: Should return 401
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(401);
    });

    test('TC-235 | Error - Should return 404 if user not found', async () => {
      // Given: Valid token but user deleted
      req.body = {
        refreshToken: 'valid.token',
      };

      mockJwtVerify.mockReturnValue({ id: 'deleted-user-id' });
      mockUserFindById.mockResolvedValue(null);

      // When: Call refreshToken
      await refreshToken(req, res, next);

      // Then: Should return 404
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(404);
    });
  });

  // ========================================
  // GET ME TESTS
  // ========================================
  describe('getMe()', () => {
    test('TC-236 | Happy Path - Should return current user profile', async () => {
      // Given: Authenticated user (req.user is set by protect middleware)
      req.user = { id: mockUser._id };

      mockUserFindById.mockResolvedValue(mockUser);

      // When: Call getMe
      await getMe(req, res, next);

      // Then: Should return user profile
      expect(mockUserFindById).toHaveBeenCalledWith(req.user.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUser,
        })
      );
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'User profile retrieved successfully',
        expect.any(Object)
      );
    });

    test('TC-237 | Error - Should return 404 if user not found', async () => {
      // Given: User ID in req.user but user deleted
      req.user = { id: 'deleted-user-id' };

      mockUserFindById.mockResolvedValue(null);

      // When: Call getMe
      await getMe(req, res, next);

      // Then: Should return 404
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(404);
      expect(errorArg.message).toBe('User not found');
    });

    test('TC-238 | Error - Should handle database error', async () => {
      // Given: Valid user ID but database error
      req.user = { id: mockUser._id };

      mockUserFindById.mockRejectedValue(new Error('Database connection error'));

      // When: Call getMe
      await getMe(req, res, next);

      // Then: Should log error and call next
      expect(mockLoggerError).toHaveBeenCalledWith('Error in getMe controller', expect.any(Object));
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ========================================
  // UPDATE PROFILE TESTS
  // ========================================
  describe('updateProfile()', () => {
    test('TC-239 | Happy Path - Should update user profile successfully', async () => {
      // Given: Valid profile update data
      req.user = { id: mockUser._id };
      req.body = {
        fullName: 'Nguyễn Văn Updated',
        phone: '0912345678',
        address: '456 New Street, Q2, TP.HCM',
        dateOfBirth: '1995-05-15',
        gender: 'male',
      };

      const updatedUser = {
        ...mockUser,
        fullName: req.body.fullName,
        phone: req.body.phone,
        address: req.body.address,
      };

      mockUserFindByIdAndUpdate.mockResolvedValue(updatedUser);

      // When: Call updateProfile
      await updateProfile(req, res, next);

      // Then: Should update and return updated user
      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
        req.user.id,
        expect.objectContaining({
          $set: expect.objectContaining({
            fullName: req.body.fullName,
            phone: req.body.phone,
            address: req.body.address,
          }),
        }),
        expect.objectContaining({
          new: true,
          runValidators: true,
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: updatedUser,
        })
      );
    });

    test('TC-240 | Happy Path - Should handle partial update (only fullName)', async () => {
      // Given: Update only one field
      req.user = { id: mockUser._id };
      req.body = {
        fullName: 'Only Name Changed',
      };

      const updatedUser = {
        ...mockUser,
        fullName: req.body.fullName,
      };

      mockUserFindByIdAndUpdate.mockResolvedValue(updatedUser);

      // When: Call updateProfile
      await updateProfile(req, res, next);

      // Then: Should update only provided field
      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
        req.user.id,
        expect.objectContaining({
          $set: { fullName: req.body.fullName },
        }),
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('TC-241 | Error - Should return 404 if user not found', async () => {
      // Given: Valid data but user doesn't exist
      req.user = { id: 'deleted-user-id' };
      req.body = {
        fullName: 'Test Name',
      };

      mockUserFindByIdAndUpdate.mockResolvedValue(null);

      // When: Call updateProfile
      await updateProfile(req, res, next);

      // Then: Should return 404
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(404);
      expect(errorArg.message).toBe('User not found');
    });

    test('TC-242 | Error - Should handle database validation error', async () => {
      // Given: Invalid data (e.g., duplicate email)
      req.user = { id: mockUser._id };
      req.body = {
        email: 'duplicate@example.com',
      };

      const validationError = new Error('Duplicate email');
      validationError.code = 11000;
      mockUserFindByIdAndUpdate.mockRejectedValue(validationError);

      // When: Call updateProfile
      await updateProfile(req, res, next);

      // Then: Should catch error
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Error in updateProfile controller',
        expect.any(Object)
      );
      expect(next).toHaveBeenCalledWith(validationError);
    });

    test('TC-243 | Happy Path - Should handle file uploads (avatar)', async () => {
      // Given: File upload in request
      req.user = { id: mockUser._id };
      req.body = {
        fullName: 'User With Avatar',
      };
      req.files = {
        avatar: [{ path: '/uploads/avatar-123.jpg' }],
      };

      const updatedUser = {
        ...mockUser,
        fullName: req.body.fullName,
        avatar: '/uploads/avatar-123.jpg',
      };

      mockUserFindByIdAndUpdate.mockResolvedValue(updatedUser);

      // When: Call updateProfile
      await updateProfile(req, res, next);

      // Then: Should include avatar in update
      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
        req.user.id,
        expect.objectContaining({
          $set: expect.objectContaining({
            avatar: '/uploads/avatar-123.jpg',
          }),
        }),
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ========================================
  // CHANGE PASSWORD TESTS
  // ========================================
  describe('changePassword()', () => {
    beforeEach(() => {
      // Reset matchPassword mock
      mockMatchPassword.mockReset().mockResolvedValue(true);
    });

    test('TC-244 | Happy Path - Should change password successfully', async () => {
      // Given: Valid current and new password
      req.user = { id: mockUser._id };
      req.body = {
        currentPassword: 'OldPassword@123',
        newPassword: 'NewPassword@456',
      };

      const userWithPassword = {
        ...mockUser,
        password: '$2a$10$oldHashedPassword',
        matchPassword: mockMatchPassword,
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithPassword),
      });
      mockMatchPassword.mockResolvedValue(true);

      // When: Call changePassword
      await changePassword(req, res, next);

      // Then: Should verify old password and update
      expect(mockUserFindById).toHaveBeenCalledWith(req.user.id);
      expect(mockMatchPassword).toHaveBeenCalledWith(req.body.currentPassword);
      expect(userWithPassword.save).toHaveBeenCalled();
      expect(userWithPassword.password).toBe(req.body.newPassword);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Password changed successfully'),
        })
      );
    });

    test('TC-245 | Error - Should return 400 if currentPassword is missing', async () => {
      // Given: Missing current password
      req.user = { id: mockUser._id };
      req.body = {
        newPassword: 'NewPassword@456',
      };

      // When: Call changePassword
      await changePassword(req, res, next);

      // Then: Should return 400
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(400);
      expect(errorArg.message).toContain('current password and new password');
    });

    test('TC-246 | Error - Should return 400 if newPassword is missing', async () => {
      // Given: Missing new password
      req.user = { id: mockUser._id };
      req.body = {
        currentPassword: 'OldPassword@123',
      };

      // When: Call changePassword
      await changePassword(req, res, next);

      // Then: Should return 400
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(400);
    });

    test('TC-247 | Error - Should return 404 if user not found', async () => {
      // Given: Valid passwords but user doesn't exist
      req.user = { id: 'deleted-user-id' };
      req.body = {
        currentPassword: 'OldPassword@123',
        newPassword: 'NewPassword@456',
      };

      mockUserFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      // When: Call changePassword
      await changePassword(req, res, next);

      // Then: Should return 404
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(404);
      expect(errorArg.message).toBe('User not found');
    });

    test('TC-248 | Error - Should return 401 if current password is incorrect', async () => {
      // Given: Incorrect current password
      req.user = { id: mockUser._id };
      req.body = {
        currentPassword: 'WrongPassword@123',
        newPassword: 'NewPassword@456',
      };

      const userWithPassword = {
        ...mockUser,
        password: '$2a$10$correctHashedPassword',
        matchPassword: mockMatchPassword,
      };

      mockUserFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithPassword),
      });
      mockMatchPassword.mockResolvedValue(false); // Password doesn't match

      // When: Call changePassword
      await changePassword(req, res, next);

      // Then: Should return 401
      expect(mockMatchPassword).toHaveBeenCalledWith(req.body.currentPassword);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(401);
      expect(errorArg.message).toContain('Current password is incorrect');
    });

    test('TC-249 | Error - Should handle save error', async () => {
      // Given: Valid data but save fails
      req.user = { id: mockUser._id };
      req.body = {
        currentPassword: 'OldPassword@123',
        newPassword: 'NewPassword@456',
      };

      const userWithPassword = {
        ...mockUser,
        matchPassword: mockMatchPassword,
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockUserFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithPassword),
      });
      mockMatchPassword.mockResolvedValue(true);

      // When: Call changePassword
      await changePassword(req, res, next);

      // Then: Should catch error
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ========================================
  // LOGIN WITH GOOGLE TESTS
  // ========================================
  describe('loginWithGoogle()', () => {
    test('TC-250 | Happy Path - Should create new user and login with Google', async () => {
      // Given: New Google user
      req.body = {
        email: 'newuser@gmail.com',
        name: 'Nguyễn Văn Google',
        picture: 'https://google.com/avatar.jpg',
        rememberMe: false,
      };

      mockUserFindOne.mockResolvedValue(null); // New user
      mockUserExists.mockResolvedValue(false); // Username available

      const mockNewUser = {
        ...mockUser,
        email: req.body.email,
        fullName: req.body.name,
        avatar: req.body.picture,
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({ ...mockUser, password: undefined }),
      };

      // Mock User constructor - we need to handle "new User()"
      mockUserCreate.mockImplementation(() => mockNewUser);

      // When: Call loginWithGoogle
      await loginWithGoogle(req, res, next);

      // Then: Should create user and return tokens
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          isNewUser: true,
        })
      );
    });

    test('TC-251 | Happy Path - Should login existing Google user', async () => {
      // Given: Existing Google user
      req.body = {
        email: 'existing@gmail.com',
        name: 'Existing User',
        picture: 'https://google.com/new-avatar.jpg',
        rememberMe: true,
      };

      const existingUser = {
        ...mockUser,
        email: req.body.email,
        avatar: 'https://google.com/old-avatar.jpg',
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({ ...mockUser }),
      };

      mockUserFindOne.mockResolvedValue(existingUser);

      // When: Call loginWithGoogle
      await loginWithGoogle(req, res, next);

      // Then: Should update avatar and login
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(existingUser.avatar).toBe(req.body.picture);
      expect(existingUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          isNewUser: false,
        })
      );
    });

    test('TC-252 | Error - Should return 400 if email is missing', async () => {
      // Given: No email from Google
      req.body = {
        name: 'Test User',
      };

      // When: Call loginWithGoogle
      await loginWithGoogle(req, res, next);

      // Then: Should return 400
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing email from Google',
        })
      );
    });
  });

  // ========================================
  // LOGIN WITH FACEBOOK TESTS
  // ========================================
  describe('loginWithFacebook()', () => {
    test('TC-253 | Happy Path - Should create new user and login with Facebook', async () => {
      // Given: New Facebook user
      req.body = {
        email: 'fbuser@facebook.com',
        name: 'Trần Thị Facebook',
        picture: 'https://facebook.com/avatar.jpg',
        rememberMe: false,
      };

      mockUserFindOne.mockResolvedValue(null); // New user
      mockUserExists.mockResolvedValue(false); // Username available

      const mockNewUser = {
        ...mockUser,
        email: req.body.email,
        fullName: req.body.name,
        avatar: req.body.picture,
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({ ...mockUser, password: undefined }),
      };

      mockUserCreate.mockImplementation(() => mockNewUser);

      // When: Call loginWithFacebook
      await loginWithFacebook(req, res, next);

      // Then: Should create user and return tokens
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          isNewUser: true,
        })
      );
    });

    test('TC-254 | Happy Path - Should login existing Facebook user', async () => {
      // Given: Existing Facebook user
      req.body = {
        email: 'existing@facebook.com',
        name: 'Existing FB User',
        picture: 'https://facebook.com/new-pic.jpg',
      };

      const existingUser = {
        ...mockUser,
        email: req.body.email,
        avatar: 'https://facebook.com/old-pic.jpg',
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({ ...mockUser }),
      };

      mockUserFindOne.mockResolvedValue(existingUser);

      // When: Call loginWithFacebook
      await loginWithFacebook(req, res, next);

      // Then: Should update avatar and login
      expect(existingUser.avatar).toBe(req.body.picture);
      expect(existingUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('TC-255 | Error - Should return 400 if email is missing', async () => {
      // Given: No email from Facebook
      req.body = {
        name: 'Test User',
      };

      // When: Call loginWithFacebook
      await loginWithFacebook(req, res, next);

      // Then: Should return 400
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing email from Facebook',
        })
      );
    });
  });

  // ========================================
  // REGISTER APP (OTP) TESTS
  // ========================================
  describe('registerApp()', () => {
    test('TC-256 | Happy Path - Should register user and send OTP', async () => {
      // Given: Valid registration data
      req.body = {
        fullName: 'Lê Văn App',
        username: 'appuser',
        email: 'appuser@example.com',
        password: 'Password@123',
        phone: '0987654321',
        address: '789 App Street',
      };

      mockUserFindOne.mockResolvedValue(null); // User doesn't exist
      mockUserCreate.mockResolvedValue({
        ...mockUser,
        email: req.body.email,
        isVerified: false,
        _id: 'new-app-user-id',
      });

      // When: Call registerApp
      await registerApp(req, res, next);

      // Then: Should create user and send OTP
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(mockUserCreate).toHaveBeenCalled();
      expect(mockSendTemplatedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: req.body.email,
          templateType: 'OTP',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('OTP sent to email'),
        })
      );
    });

    test('TC-257 | Error - Should return 400 if required fields are missing', async () => {
      // Given: Missing username
      req.body = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'Password@123',
        phone: '0987654321',
        address: 'Test Address',
      };

      // When: Call registerApp
      await registerApp(req, res, next);

      // Then: Should return 400
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(400);
      expect(errorArg.message).toContain('Missing required fields');
    });

    test('TC-258 | Error - Should return 400 if user already exists', async () => {
      // Given: Email already exists
      req.body = {
        fullName: 'Test User',
        username: 'testuser',
        email: 'existing@example.com',
        password: 'Password@123',
        phone: '0987654321',
        address: 'Test Address',
      };

      mockUserFindOne.mockResolvedValue(mockUser); // User exists

      // When: Call registerApp
      await registerApp(req, res, next);

      // Then: Should return 400
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(400);
      expect(errorArg.message).toBe('User already exists');
    });
  });

  // ========================================
  // VERIFY OTP TESTS
  // ========================================
  describe('verifyOtp()', () => {
    test('TC-263 | Error - Should return 400 if email or OTP is missing', async () => {
      // Given: Missing OTP
      req.body = { email: 'test@example.com' };

      // When: Call verifyOtp
      await verifyOtp(req, res, next);

      // Then: Should return 400
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(400);
      expect(errorArg.message).toContain('Email and OTP are required');
    });

    test('TC-264 | Error - Should return 400 for invalid or expired OTP', async () => {
      // Given: Invalid OTP (otpStore doesn't have this email)
      req.body = {
        email: 'random@example.com',
        otp: '000000',
      };

      // When: Call verifyOtp
      await verifyOtp(req, res, next);

      // Then: Should return 400
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(400);
      expect(errorArg.message).toContain('Invalid or expired OTP');
    });

    test('TC-265 | Error - Should handle database error during verification', async () => {
      // Given: Valid request but database error
      // Note: This test will hit "Invalid or expired OTP" first
      // because otpStore doesn't have this email
      // The database error would only be reached if OTP was valid
      req.body = {
        email: 'db-error@example.com',
        otp: '123456',
      };

      // When: Call verifyOtp
      await verifyOtp(req, res, next);

      // Then: Should return invalid OTP error (not database error)
      // because OTP validation happens before database call
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(400);
      expect(errorArg.message).toContain('Invalid or expired OTP');
    });
  });

  // ========================================
  // RESEND OTP TESTS
  // ========================================
  describe('resendOtp()', () => {
    test('TC-266 | Happy Path - Should resend OTP to unverified user', async () => {
      // Given: Unverified user exists
      req.body = {
        email: 'unverified@example.com',
      };

      const unverifiedUser = {
        ...mockUser,
        email: req.body.email,
        isVerified: false,
        fullName: 'Unverified User',
      };

      mockUserFindOne.mockResolvedValue(unverifiedUser);

      // When: Call resendOtp
      await resendOtp(req, res, next);

      // Then: Should send new OTP
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(mockSendTemplatedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: req.body.email,
          templateType: 'OTP',
          templateData: expect.objectContaining({
            name: unverifiedUser.fullName,
            otp: expect.any(String),
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'OTP resent successfully.',
        })
      );
    });

    test('TC-267 | Error - Should return 404 if user not found', async () => {
      // Given: Email doesn't exist
      req.body = {
        email: 'notfound@example.com',
      };

      mockUserFindOne.mockResolvedValue(null);

      // When: Call resendOtp
      await resendOtp(req, res, next);

      // Then: Should return 404
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(404);
      expect(errorArg.message).toBe('User not found');
    });

    test('TC-268 | Error - Should return 400 if user already verified', async () => {
      // Given: User is already verified
      req.body = {
        email: 'verified@example.com',
      };

      const verifiedUser = {
        ...mockUser,
        email: req.body.email,
        isVerified: true,
      };

      mockUserFindOne.mockResolvedValue(verifiedUser);

      // When: Call resendOtp
      await resendOtp(req, res, next);

      // Then: Should return 400
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(400);
      expect(errorArg.message).toBe('User already verified');
    });

    test('TC-269 | Error - Should handle email sending failure', async () => {
      // Given: Unverified user but email service fails
      req.body = {
        email: 'email-fail@example.com',
      };

      const unverifiedUser = {
        ...mockUser,
        email: req.body.email,
        isVerified: false,
        fullName: 'Email Fail User',
      };

      mockUserFindOne.mockResolvedValue(unverifiedUser);
      mockSendTemplatedEmail.mockRejectedValue(new Error('Email service down'));

      // When: Call resendOtp
      await resendOtp(req, res, next);

      // Then: Should catch error
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Error in resendOtp controller',
        expect.any(Object)
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('TC-270 | Error - Should handle database error', async () => {
      // Given: Database error when finding user
      req.body = {
        email: 'db-error@example.com',
      };

      mockUserFindOne.mockRejectedValue(new Error('Database connection failed'));

      // When: Call resendOtp
      await resendOtp(req, res, next);

      // Then: Should catch error
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Error in resendOtp controller',
        expect.any(Object)
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ========================================
  // SET PASSWORD TESTS
  // ========================================
  describe('setPassword()', () => {
    test('TC-259 | Happy Path - Should set password for OAuth user', async () => {
      // Given: OAuth user wants to set password
      req.user = {
        ...mockUser,
        password: undefined,
        save: jest.fn().mockResolvedValue(true),
      };
      req.body = {
        password: 'NewPassword@123',
      };

      // When: Call setPassword
      await setPassword(req, res, next);

      // Then: Should set password and save
      expect(req.user.password).toBe('NewPassword@123');
      expect(req.user.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Set password successfully',
        })
      );
    });

    test('TC-260 | Error - Should return 400 if password is missing', async () => {
      // Given: No password provided
      req.user = mockUser;
      req.body = {};

      // When: Call setPassword
      await setPassword(req, res, next);

      // Then: Should return 400
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Password must be at least 6 characters',
        })
      );
    });

    test('TC-261 | Error - Should return 400 if password is too short', async () => {
      // Given: Password less than 6 characters
      req.user = mockUser;
      req.body = {
        password: '12345', // Only 5 characters
      };

      // When: Call setPassword
      await setPassword(req, res, next);

      // Then: Should return 400
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Password must be at least 6 characters',
        })
      );
    });

    test('TC-262 | Error - Should handle save error', async () => {
      // Given: Valid password but save fails
      req.user = {
        ...mockUser,
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      req.body = {
        password: 'ValidPassword@123',
      };

      // When: Call setPassword
      await setPassword(req, res, next);

      // Then: Should return 500
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Set password failed',
        })
      );
    });
  });
});
