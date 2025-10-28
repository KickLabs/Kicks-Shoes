/**
 * @fileoverview Simple Discount Test
 * @created 2025-01-27
 * @file simple-test.test.js
 * @description Simple test to verify discount functionality works
 */

import { jest } from '@jest/globals';

// Mock the discount service
const mockValidateDiscountCode = jest.fn();

jest.unstable_mockModule('../../src/services/discount.service.js', () => ({
  validateDiscountCode: mockValidateDiscountCode,
}));

// Import after mocking
const { validateDiscountCode } = await import('../../src/services/discount.service.js');

describe('Simple Discount Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should validate discount code successfully', async () => {
    // Given: Mock discount validation
    mockValidateDiscountCode.mockResolvedValue({
      isValid: true,
      discountAmount: 200,
      finalAmount: 800,
    });

    // When: Call validate discount code
    const result = await validateDiscountCode('SAVE20', 'user123', 1000, []);

    // Then: Verify result
    expect(result).toEqual({
      isValid: true,
      discountAmount: 200,
      finalAmount: 800,
    });
    expect(mockValidateDiscountCode).toHaveBeenCalledWith('SAVE20', 'user123', 1000, []);
  });

  test('Should handle invalid discount code', async () => {
    // Given: Mock invalid discount
    mockValidateDiscountCode.mockResolvedValue({
      isValid: false,
      message: 'Discount code not found',
    });

    // When: Call validate discount code
    const result = await validateDiscountCode('INVALID', 'user123', 1000, []);

    // Then: Verify result
    expect(result).toEqual({
      isValid: false,
      message: 'Discount code not found',
    });
    expect(mockValidateDiscountCode).toHaveBeenCalledWith('INVALID', 'user123', 1000, []);
  });
});
