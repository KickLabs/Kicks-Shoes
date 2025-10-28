/**
 * @fileoverview Unit Tests for Role Middleware
 * @suite Test Suite 4: Role Middleware (Unit)
 * @coverage middlewares/role.middleware.js
 * @generated 2025-10-27
 */

import { jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('../../src/utils/errorResponse.js', () => ({
  ErrorResponse: jest.fn((message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.message = message;
    return error;
  }),
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
const {
  ROLES,
  checkRoleLevel,
  requireCustomer,
  requireShop,
  requireAdmin,
  requireExactRole,
  requireRoles,
  authorize,
} = await import('../../src/middlewares/role.middleware.js');
const { ErrorResponse } = await import('../../src/utils/errorResponse.js');
const logger = (await import('../../src/utils/logger.js')).default;
const { getMockReqRes, generateMockUser } = await import('../_helpers/testUtils.js');

describe('Authentication & Authorization — Test Suite 4: Role Middleware (Unit)', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ req, res, next } = getMockReqRes());

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
  // requireExactRole() Tests
  // ========================================
  describe('requireExactRole() (TC-401, TC-403)', () => {
    test('TC-401 | Should allow access for authorized role', () => {
      // Given: User with admin role, route requires admin
      req.user = generateMockUser({ role: 'admin' });
      const authorizeAdmin = requireExactRole('admin');

      // When: authorize middleware được gọi
      authorizeAdmin(req, res, next);

      // Then: next() called without error
      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    test('TC-403 | Should deny access for unauthorized role', () => {
      // Given: User with customer role, route requires admin
      req.user = generateMockUser({ role: 'customer' });
      const authorizeAdmin = requireExactRole('admin');

      // When: authorize middleware được gọi
      authorizeAdmin(req, res, next);

      // Then: Returns 403 error
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(403);
      expect(errorArg.message).toContain('Only admin can access this route');
    });

    test('TC-404 | Should throw error when req.user is missing', () => {
      // Given: req.user is undefined
      req.user = undefined;
      const authorizeAdmin = requireExactRole('admin');

      // When: authorize middleware được gọi
      authorizeAdmin(req, res, next);

      // Then: Returns 401 error
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(401);
      expect(errorArg.message).toContain('Authentication required');
    });

    test('TC-405 | Should deny access when req.user.role is null', () => {
      // Given: User with role = null
      req.user = generateMockUser({ role: null });

      // When: requireExactRole được gọi
      const requireRole = requireExactRole('admin');
      requireRole(req, res, next);

      // Then: Returns 403 error
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(403);
      expect(errorArg.message).toContain('Only admin can access this route');
    });
  });

  // ========================================
  // authorize() - Alias for requireExactRole
  // ========================================
  describe('authorize() (alias)', () => {
    test('TC-402 | Should allow access for multiple roles', () => {
      // Given: User with shop role, route allows admin/shop
      req.user = generateMockUser({ role: 'shop' });
      const authorizeShop = authorize('shop');

      // When: authorize middleware được gọi
      authorizeShop(req, res, next);

      // Then: next() called without error
      expect(next).toHaveBeenCalledWith();
    });
  });

  // ========================================
  // requireRoles() Tests
  // ========================================
  describe('requireRoles() (TC-409, TC-410)', () => {
    test('TC-409 | Should allow access when user has one of multiple allowed roles', () => {
      // Given: User with shop role, route allows admin/shop/moderator
      req.user = generateMockUser({ role: 'shop' });
      const requireMultiple = requireRoles('admin', 'shop', 'moderator');

      // When: requireRoles middleware được gọi
      requireMultiple(req, res, next);

      // Then: next() called without error
      expect(next).toHaveBeenCalledWith();
    });

    test('TC-410 | Should return 401 JSON when req.user is missing', () => {
      // Given: req.user is undefined
      req.user = undefined;
      const requireMultiple = requireRoles('admin');

      // When: requireRoles middleware được gọi
      requireMultiple(req, res, next);

      // Then: Returns 401 JSON response
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
    });

    test('Should deny access for unauthorized role', () => {
      // Given: User with customer role, route requires shop/admin
      req.user = generateMockUser({ role: 'customer' });
      const requireMultiple = requireRoles('shop', 'admin');

      // When: requireRoles middleware được gọi
      requireMultiple(req, res, next);

      // Then: Returns 403 JSON response
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Role customer is not authorized to access this route. Required roles: shop, admin',
      });
    });
  });

  // ========================================
  // checkRoleLevel() Tests
  // ========================================
  describe('checkRoleLevel() Hierarchy (TC-406, TC-407, TC-408)', () => {
    test('TC-406 | Should allow access when user role level >= required level', () => {
      // Given: User with admin role (level 3), route requires customer (level 1)
      req.user = generateMockUser({ role: 'admin' });

      // When: requireCustomer middleware được gọi
      requireCustomer(req, res, next);

      // Then: next() called (admin level 3 >= customer level 1)
      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    test('TC-407 | Should deny access when user role level < required level', () => {
      // Given: User with customer role (level 1), route requires shop (level 2)
      req.user = generateMockUser({ role: 'customer' });

      // When: requireShop middleware được gọi
      requireShop(req, res, next);

      // Then: Returns 403 error
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(403);
      expect(errorArg.message).toContain('Role customer is not authorized');
    });

    test('TC-408 | Should deny access when user role is not in ROLE_HIERARCHY', () => {
      // Given: User with invalid role 'superadmin'
      req.user = generateMockUser({ role: 'superadmin' });

      // When: requireCustomer middleware được gọi
      requireCustomer(req, res, next);

      // Then: Returns 403 error with message about invalid role
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(403);
      expect(errorArg.message).toContain('Invalid user role');
      expect(logger.error).toHaveBeenCalledWith(
        'Invalid user role',
        expect.objectContaining({ role: 'superadmin' })
      );
    });
  });

  // ========================================
  // Predefined Role Middlewares
  // ========================================
  describe('Predefined Role Middlewares', () => {
    test('Should allow shop access to requireShop middleware', () => {
      // Given: User with shop role
      req.user = generateMockUser({ role: 'shop' });

      // When: requireShop middleware được gọi
      requireShop(req, res, next);

      // Then: next() called
      expect(next).toHaveBeenCalledWith();
    });

    test('Should deny customer access to requireShop middleware', () => {
      // Given: User with customer role
      req.user = generateMockUser({ role: 'customer' });

      // When: requireShop middleware được gọi
      requireShop(req, res, next);

      // Then: Returns 403 error
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(403);
    });

    test('Should allow admin access to requireAdmin middleware', () => {
      // Given: User with admin role
      req.user = generateMockUser({ role: 'admin' });

      // When: requireAdmin middleware được gọi
      requireAdmin(req, res, next);

      // Then: next() called
      expect(next).toHaveBeenCalledWith();
    });

    test('Should deny shop access to requireAdmin middleware', () => {
      // Given: User with shop role
      req.user = generateMockUser({ role: 'shop' });

      // When: requireAdmin middleware được gọi
      requireAdmin(req, res, next);

      // Then: Returns 403 error
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(403);
      expect(errorArg.message).toContain('Role shop is not authorized');
    });
  });

  // ========================================
  // Edge Cases and Error Handling
  // ========================================
  describe('Edge Cases and Error Handling', () => {
    test('Should handle error in middleware execution', () => {
      // Given: Error occurs during execution
      req.user = generateMockUser({ role: 'admin' });
      const customError = new Error('Custom error');

      // Mock checkRoleLevel to throw an error
      const requireRole = checkRoleLevel(1);

      // Create a bad req.user that will cause an error
      req.user = { role: undefined };

      // When: Middleware executes
      requireRole(req, res, next);

      // Then: Error is logged
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('Should handle missing req.user with custom error message', () => {
      // Given: req.user is missing
      req.user = undefined;
      const requireLevel1 = checkRoleLevel(1);

      // When: Middleware được gọi
      requireLevel1(req, res, next);

      // Then: Returns 401 with authentication required
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = next.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(401);
      expect(errorArg.message).toContain('Authentication required');
    });

    test('Should check exact role equality for multiple roles', () => {
      // Given: User with moderator role (not in allowed list)
      req.user = generateMockUser({ role: 'moderator' });
      const requireShopOrAdmin = requireRoles('shop', 'admin');

      // When: requireRoles middleware được gọi
      requireShopOrAdmin(req, res, next);

      // Then: Denied access
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Required roles: shop, admin'),
        })
      );
    });
  });

  // ========================================
  // ROLES Constants Tests
  // ========================================
  describe('ROLES Constants', () => {
    test('Should have correct role constants', () => {
      // Then: ROLES object has all expected roles
      expect(ROLES).toHaveProperty('GUEST', 'guest');
      expect(ROLES).toHaveProperty('CUSTOMER', 'customer');
      expect(ROLES).toHaveProperty('SHOP', 'shop');
      expect(ROLES).toHaveProperty('ADMIN', 'admin');
    });
  });
});
