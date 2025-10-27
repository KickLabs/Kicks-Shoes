/**
 * @fileoverview Unit Tests for Auth Middleware
 * @suite Test Suite 3: Auth Middleware (Unit)
 * @coverage middlewares/auth.middleware.js
 * @generated 2025-10-27
 */

import { jest } from '@jest/globals';

// Mock all dependencies BEFORE importing
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: jest.fn(),
    sign: jest.fn(),
  },
  verify: jest.fn(),
  sign: jest.fn(),
}));

jest.unstable_mockModule('../../src/models/User.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/models/TokenBlacklist.js', () => ({
  default: {
    findOne: jest.fn(),
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

jest.unstable_mockModule('../../src/utils/errorResponse.js', () => ({
  ErrorResponse: jest.fn((message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.message = message;
    return error;
  }),
}));

// Import after mocking
const { protect, optionalAuth, authorize, requireAdmin } = await import(
  '../../src/middlewares/auth.middleware.js'
);
const { ErrorResponse } = await import('../../src/utils/errorResponse.js');
const jwt = (await import('jsonwebtoken')).default;
const User = (await import('../../src/models/User.js')).default;
const TokenBlacklist = (await import('../../src/models/TokenBlacklist.js')).default;
const logger = (await import('../../src/utils/logger.js')).default;
const { getMockReqRes, generateMockUser } = await import('../_helpers/testUtils.js');

describe('Authentication & Authorization — Test Suite 3: Auth Middleware (Unit)', () => {
  let req, res, next;
  let mockUser;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create fresh mock req/res/next for each test
    ({ req, res, next } = getMockReqRes());

    // Create default mock user
    mockUser = generateMockUser({
      _id: 'user-id-123',
      email: 'nguoidung@example.com',
      role: 'user',
      isVerified: true,
      status: true,
    });

    // Setup default ErrorResponse mock
    ErrorResponse.mockImplementation((message, statusCode) => {
      const error = new Error(message);
      error.statusCode = statusCode;
      error.message = message;
      return error;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // TC-301: Happy Path - Valid Token
  // ========================================
  test('TC-301 | Xác thực token hợp lệ qua middleware protect', async () => {
    // Given: Request có Authorization header với valid token
    const validToken = 'valid.jwt.token';
    req.headers.authorization = `Bearer ${validToken}`;

    const decodedToken = {
      id: 'user-id-123',
      iat: 1234567890,
      exp: 1234654290,
    };

    jwt.verify.mockReturnValue(decodedToken);
    TokenBlacklist.findOne.mockResolvedValue(null); // Token not blacklisted
    User.findById.mockResolvedValue(mockUser);

    // When: Middleware protect được gọi
    await protect(req, res, next);

    // Then: req.user được set, gọi next() không có error
    expect(jwt.verify).toHaveBeenCalledWith(validToken, process.env.JWT_SECRET);
    expect(TokenBlacklist.findOne).toHaveBeenCalledWith({ token: validToken });
    expect(User.findById).toHaveBeenCalledWith('user-id-123');
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalledWith(); // Called without error
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });

  // ========================================
  // TC-302: Error Handling - Missing Authorization Header
  // ========================================
  test('TC-302 | Request thiếu Authorization header', async () => {
    // Given: Request không có Authorization header
    delete req.headers.authorization;

    // When: Middleware protect được gọi
    await protect(req, res, next);

    // Then: Trả về 401 error
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(401);
    expect(errorArg.message).toContain('No valid token provided');
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  // ========================================
  // TC-303: Error Handling - Missing "Bearer " prefix
  // ========================================
  test('TC-303 | Authorization header thiếu prefix "Bearer "', async () => {
    // Given: Authorization header không có "Bearer " prefix
    req.headers.authorization = 'valid.jwt.token';

    // When: Middleware protect được gọi
    await protect(req, res, next);

    // Then: Trả về 401
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(401);
    expect(errorArg.message).toContain('No valid token provided');
  });

  // ========================================
  // TC-304: Edge Case - Lowercase "bearer"
  // ========================================
  test('TC-304 | Authorization header với "bearer" viết thường', async () => {
    // Given: Authorization header với "bearer" lowercase
    req.headers.authorization = 'bearer valid.jwt.token';

    // When: Middleware protect được gọi
    await protect(req, res, next);

    // Then: Kiểm tra xem middleware có xử lý case-insensitive không
    // Current implementation: Only accepts "Bearer " (uppercase B)
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(401);
  });

  // ========================================
  // TC-305: Edge Case - Token value = "undefined"
  // ========================================
  test('TC-305 | Token value là chuỗi "undefined"', async () => {
    // Given: Authorization header với token = "undefined"
    req.headers.authorization = 'Bearer undefined';

    // When: Middleware protect được gọi
    await protect(req, res, next);

    // Then: Trả về 401
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(401);
    expect(errorArg.message).toContain('No valid token provided');
  });

  // ========================================
  // TC-306: Edge Case - Empty token
  // ========================================
  test('TC-306 | Token value là chuỗi rỗng', async () => {
    // Given: Authorization header với token rỗng
    req.headers.authorization = 'Bearer ';

    // When: Middleware protect được gọi
    await protect(req, res, next);

    // Then: Trả về 401
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(401);
    expect(errorArg.message).toContain('No valid token provided');
  });

  // ========================================
  // TC-307: Error Handling - Expired Token
  // ========================================
  test('TC-307 | Token đã hết hạn', async () => {
    // Given: Token đã hết hạn
    const expiredToken = 'expired.jwt.token';
    req.headers.authorization = `Bearer ${expiredToken}`;

    const tokenExpiredError = new Error('jwt expired');
    tokenExpiredError.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => {
      throw tokenExpiredError;
    });

    TokenBlacklist.findOne.mockResolvedValue(null);

    // When: Middleware protect được gọi
    await protect(req, res, next);

    // Then: Trả về 401
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(401);
    expect(errorArg.message).toContain('Not authorized to access this route');
    expect(logger.error).toHaveBeenCalled();
  });

  // ========================================
  // TC-308: Error Handling - Malformed Token
  // ========================================
  test('TC-308 | Token bị malformed', async () => {
    // Given: Token malformed
    const malformedToken = 'not.a.real.token';
    req.headers.authorization = `Bearer ${malformedToken}`;

    const malformedError = new Error('jwt malformed');
    malformedError.name = 'JsonWebTokenError';
    jwt.verify.mockImplementation(() => {
      throw malformedError;
    });

    TokenBlacklist.findOne.mockResolvedValue(null);

    // When: Middleware protect được gọi
    await protect(req, res, next);

    // Then: Trả về 401
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(401);
    expect(errorArg.message).toContain('Not authorized to access this route');
    expect(logger.error).toHaveBeenCalled();
  });

  // ========================================
  // TC-309: Error Handling - Wrong Secret
  // ========================================
  test('TC-309 | Token từ môi trường khác (wrong secret)', async () => {
    // Given: Token ký bằng secret key khác
    const invalidSignatureToken = 'invalid.signature.token';
    req.headers.authorization = `Bearer ${invalidSignatureToken}`;

    const invalidSignatureError = new Error('invalid signature');
    invalidSignatureError.name = 'JsonWebTokenError';
    jwt.verify.mockImplementation(() => {
      throw invalidSignatureError;
    });

    TokenBlacklist.findOne.mockResolvedValue(null);

    // When: Middleware protect được gọi
    await protect(req, res, next);

    // Then: Trả về 401
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(401);
    expect(errorArg.message).toContain('Not authorized to access this route');
    expect(logger.error).toHaveBeenCalled();
  });

  // ========================================
  // TC-310: Error Handling - Blacklisted Token
  // ========================================
  test('TC-310 | Token đã bị blacklist (logout)', async () => {
    // Given: Token tồn tại trong TokenBlacklist
    const blacklistedToken = 'blacklisted.jwt.token';
    req.headers.authorization = `Bearer ${blacklistedToken}`;

    TokenBlacklist.findOne.mockResolvedValue({
      _id: 'blacklist-id-123',
      token: blacklistedToken,
      expiresAt: new Date(Date.now() + 86400000),
    });

    // When: Middleware protect được gọi
    await protect(req, res, next);

    // Then: Trả về 401 "Token has been invalidated"
    expect(TokenBlacklist.findOne).toHaveBeenCalledWith({ token: blacklistedToken });
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(401);
    expect(errorArg.message).toContain('Token has been invalidated');
    expect(jwt.verify).not.toHaveBeenCalled(); // Should not verify if blacklisted
  });

  // ========================================
  // TC-311: Error Handling - User Not Found
  // ========================================
  test('TC-311 | User không tồn tại (đã bị xóa sau khi token phát hành)', async () => {
    // Given: Token hợp lệ nhưng user đã bị xóa
    const validToken = 'valid.jwt.token';
    req.headers.authorization = `Bearer ${validToken}`;

    const decodedToken = {
      id: 'deleted-user-id',
      iat: 1234567890,
      exp: 1234654290,
    };

    jwt.verify.mockReturnValue(decodedToken);
    TokenBlacklist.findOne.mockResolvedValue(null);
    User.findById.mockResolvedValue(null); // User not found

    // When: Middleware protect được gọi
    await protect(req, res, next);

    // Then: Trả về 404
    expect(User.findById).toHaveBeenCalledWith('deleted-user-id');
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(404);
    expect(errorArg.message).toContain('User not found');
    expect(logger.error).not.toHaveBeenCalled(); // 404 is not logged as error in token verification
  });

  // ========================================
  // TC-312: Error Handling - User Not Verified
  // ========================================
  test('TC-312 | User chưa xác thực email', async () => {
    // Given: Token hợp lệ, user.isVerified=false
    const validToken = 'valid.jwt.token';
    req.headers.authorization = `Bearer ${validToken}`;

    const unverifiedUser = generateMockUser({
      _id: 'user-id-123',
      email: 'unverified@example.com',
      isVerified: false,
      status: true,
    });

    const decodedToken = {
      id: 'user-id-123',
      iat: 1234567890,
      exp: 1234654290,
    };

    jwt.verify.mockReturnValue(decodedToken);
    TokenBlacklist.findOne.mockResolvedValue(null);
    User.findById.mockResolvedValue(unverifiedUser);

    // When: Middleware protect được gọi
    await protect(req, res, next);

    // Then: Trả về 401 "Please verify your email"
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(401);
    expect(errorArg.message).toContain('Please verify your email before accessing this route');
  });

  // ========================================
  // Bonus Test: User Banned (from analysis)
  // ========================================
  test('BONUS | User bị banned (status=false)', async () => {
    // Given: Token hợp lệ, user.status=false
    const validToken = 'valid.jwt.token';
    req.headers.authorization = `Bearer ${validToken}`;

    const bannedUser = generateMockUser({
      _id: 'user-id-123',
      email: 'banned@example.com',
      isVerified: true,
      status: false, // Banned
    });

    const decodedToken = {
      id: 'user-id-123',
      iat: 1234567890,
      exp: 1234654290,
    };

    jwt.verify.mockReturnValue(decodedToken);
    TokenBlacklist.findOne.mockResolvedValue(null);
    User.findById.mockResolvedValue(bannedUser);

    // When: Middleware protect được gọi
    await protect(req, res, next);

    // Then: Trả về 403 "Account has been deactivated"
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(403);
    expect(errorArg.message).toContain('Your account has been deactivated');
  });

  // ========================================
  // optionalAuth() - Allow guest and authenticated users
  // ========================================
  describe('optionalAuth() middleware', () => {
    test('TC-313 | Should continue as guest when no token provided', async () => {
      // Given: No Authorization header
      req.headers.authorization = undefined;

      // When: optionalAuth middleware được gọi
      await optionalAuth(req, res, next);

      // Then: req.user = null, next() called
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    test('TC-314 | Should set req.user for valid authenticated user', async () => {
      // Given: Valid token with verified user
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;

      const verifiedUser = generateMockUser({
        _id: 'user-id-123',
        email: 'verified@example.com',
        isVerified: true,
        status: true,
      });

      const decodedToken = { id: 'user-id-123', iat: 1234567890, exp: 1234654290 };

      jwt.verify.mockReturnValue(decodedToken);
      TokenBlacklist.findOne.mockResolvedValue(null);
      User.findById.mockResolvedValue(verifiedUser);

      // When: optionalAuth middleware được gọi
      await optionalAuth(req, res, next);

      // Then: req.user is set
      expect(req.user).toBeDefined();
      expect(req.user._id).toBe('user-id-123');
      expect(next).toHaveBeenCalledWith();
    });

    test('TC-315 | Should continue as guest for blacklisted token', async () => {
      // Given: Blacklisted token
      const blacklistedToken = 'blacklisted.jwt.token';
      req.headers.authorization = `Bearer ${blacklistedToken}`;

      TokenBlacklist.findOne.mockResolvedValue({ token: blacklistedToken });

      // When: optionalAuth middleware được gọi
      await optionalAuth(req, res, next);

      // Then: req.user = null, continues as guest
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    test('TC-316 | Should continue as guest for unverified user', async () => {
      // Given: Token with unverified user
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;

      const unverifiedUser = generateMockUser({
        _id: 'user-id-123',
        email: 'unverified@example.com',
        isVerified: false,
        status: true,
      });

      const decodedToken = { id: 'user-id-123', iat: 1234567890, exp: 1234654290 };

      jwt.verify.mockReturnValue(decodedToken);
      TokenBlacklist.findOne.mockResolvedValue(null);
      User.findById.mockResolvedValue(unverifiedUser);

      // When: optionalAuth middleware được gọi
      await optionalAuth(req, res, next);

      // Then: req.user = null (user not verified)
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    test('TC-317 | Should continue as guest for invalid token', async () => {
      // Given: Invalid token
      const invalidToken = 'invalid.jwt.token';
      req.headers.authorization = `Bearer ${invalidToken}`;

      jwt.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      // When: optionalAuth middleware được gọi
      await optionalAuth(req, res, next);

      // Then: req.user = null, continues as guest
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });
  });

  // ========================================
  // authorize() - Role-based access control
  // ========================================
  describe('authorize() middleware', () => {
    test('TC-318 | Should allow access for authorized role', () => {
      // Given: User with admin role, route requires admin
      req.user = generateMockUser({ role: 'admin' });
      const authorizeAdmin = authorize('admin', 'superadmin');

      // When: authorize middleware được gọi
      authorizeAdmin(req, res, next);

      // Then: next() called without error
      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    test('TC-319 | Should deny access for unauthorized role', () => {
      // Given: User with customer role, route requires admin
      req.user = generateMockUser({ role: 'customer' });
      const authorizeAdmin = authorize('admin', 'superadmin');

      // When: authorize middleware được gọi
      authorizeAdmin(req, res, next);

      // Then: Returns 403 error
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(403);
      expect(errorArg.message).toContain('User role customer is not authorized');
    });

    test('TC-320 | Should allow multiple roles', () => {
      // Given: User with staff role, route allows admin/staff/seller
      req.user = generateMockUser({ role: 'staff' });
      const authorizeMultiple = authorize('admin', 'staff', 'seller');

      // When: authorize middleware được gọi
      authorizeMultiple(req, res, next);

      // Then: next() called without error
      expect(next).toHaveBeenCalledWith();
    });
  });

  // ========================================
  // requireAdmin() - Admin-only access
  // ========================================
  describe('requireAdmin() middleware', () => {
    test('TC-321 | Should allow access for admin', () => {
      // Given: User with admin role
      req.user = generateMockUser({ role: 'admin' });

      // When: requireAdmin middleware được gọi
      requireAdmin(req, res, next);

      // Then: next() called
      expect(next).toHaveBeenCalledWith();
    });

    test('TC-322 | Should allow access for superadmin', () => {
      // Given: User with superadmin role
      req.user = generateMockUser({ role: 'superadmin' });

      // When: requireAdmin middleware được gọi
      requireAdmin(req, res, next);

      // Then: next() called
      expect(next).toHaveBeenCalledWith();
    });

    test('TC-323 | Should deny access for non-admin users', () => {
      // Given: User with customer role
      req.user = generateMockUser({ role: 'customer' });

      // When: requireAdmin middleware được gọi
      requireAdmin(req, res, next);

      // Then: Returns 403 JSON response
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required',
      });
    });

    test('TC-324 | Should deny access when no user in request', () => {
      // Given: req.user is undefined
      req.user = undefined;

      // When: requireAdmin middleware được gọi
      requireAdmin(req, res, next);

      // Then: Returns 403 JSON response
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required',
      });
    });
  });
});
