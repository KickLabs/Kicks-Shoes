/**
 * Test Suite 2: Product Information Extraction (UNIT TEST)
 *
 * NOTE: This is a PURE UNIT TEST - no real database connections, all dependencies mocked
 */

import { jest } from '@jest/globals';
import orderDetectionService from '../src/services/orderDetection.service.js';

// Mock logger
jest.mock('../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock ProductService
jest.mock('../src/services/product.service.js', () => ({
  ProductService: {
    findOneBySku: jest.fn(),
    findOneByInventorySku: jest.fn(),
    getProductById: jest.fn(),
  },
}));

// Get the mocked ProductService
import { ProductService } from '../src/services/product.service.js';

// Helper function to create mock ObjectId
const createMockObjectId = (id = null) => {
  const mockId = id || Math.random().toString(36).substring(7);
  return {
    toString: () => mockId,
    _id: mockId,
  };
};

describe('Order Detection - Product Information Extraction (Unit Tests)', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Set default mock implementations to prevent real DB calls
    ProductService.findOneBySku = jest.fn().mockResolvedValue(null);
    ProductService.findOneByInventorySku = jest.fn().mockResolvedValue(null);
    ProductService.getProductById = jest.fn().mockResolvedValue(null);
  });

  // ========== COLOR EXTRACTION ==========

  describe('Color Pattern Detection', () => {
    const vietnameseColors = [
      'đỏ',
      'xanh',
      'vàng',
      'đen',
      'trắng',
      'hồng',
      'nâu',
      'xám',
      'cam',
      'tím',
    ];

    const englishColors = [
      'red',
      'blue',
      'yellow',
      'black',
      'white',
      'pink',
      'brown',
      'gray',
      'orange',
      'purple',
    ];

    test.each(vietnameseColors)('should extract Vietnamese color: %s', async color => {
      const message = `màu ${color}`;
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.color).toBe(color);
    });

    test.each(englishColors)('should extract English color: %s', async color => {
      const message = `color ${color}`;
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.color.toLowerCase()).toBe(color);
    });

    test('should extract standalone Vietnamese colors', async () => {
      const standaloneColors = ['đỏ', 'xanh', 'vàng'];

      for (const color of standaloneColors) {
        const message = `giày ${color}`;
        const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

        if (result.color) {
          expect(result.color).toBe(color);
        }
      }
    });

    test('should extract standalone English colors', async () => {
      const standaloneColors = ['red', 'blue', 'yellow'];

      for (const color of standaloneColors) {
        const message = `shoes ${color}`;
        const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

        if (result.color) {
          expect(result.color.toLowerCase()).toBe(color);
        }
      }
    });
  });

  // ========== SIZE EXTRACTION ==========

  describe('Size Pattern Detection', () => {
    const sizeKeywords = ['size', 'cỡ', 'số'];

    test.each(sizeKeywords)('should extract size with keyword: %s', async keyword => {
      const message = `${keyword} 42`;
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.size).toBe('42');
    });

    test('should extract clothing sizes', async () => {
      const clothingSizes = ['S', 'M', 'L', 'XL', 'XXL', 'XS'];

      for (const size of clothingSizes) {
        const message = `size ${size}`;
        const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

        expect(result.size).toBe(size.toUpperCase());
      }
    });

    test('should extract one size', async () => {
      const oneSizeVariations = ['one size', 'onesize', 'ONE SIZE', 'ONESIZE'];

      for (const size of oneSizeVariations) {
        const message = `size ${size}`;
        const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

        expect(result.size).toBe('ONESIZE');
      }
    });

    test('should extract reversed size pattern', async () => {
      const message = '42 size';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.size).toBe('42');
    });

    test('should prioritize one size over numeric', async () => {
      const message = 'one size 42';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.size).toBe('ONESIZE');
    });
  });

  // ========== QUANTITY EXTRACTION ==========

  describe('Quantity Pattern Detection', () => {
    const quantityUnits = {
      vietnamese: ['đôi', 'cái', 'chiếc', 'bộ', 'combo'],
      english: ['pair', 'piece', 'set'],
    };

    test.each(quantityUnits.vietnamese)(
      'should extract Vietnamese quantity unit: %s',
      async unit => {
        const message = `3 ${unit}`;
        const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

        expect(result.quantity).toBe(3);
      }
    );

    test.each(quantityUnits.english)('should extract English quantity unit: %s', async unit => {
      const message = `3 ${unit}`;
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(3);
    });

    test('should extract unit before number pattern', async () => {
      const message = 'đôi 3';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(3);
    });

    test('should default to quantity 1 when no quantity found', async () => {
      const message = 'chốt đơn';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(1);
    });

    test('should handle NaN quantity in composite pattern', async () => {
      const message = 'chốt đôi AB1234 màu đỏ size 42'; // "đôi" without number
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(1); // Should default to 1 when NaN
    });
  });

  // ========== SKU MATCHING & INVENTORY (Lines 348-357) ==========

  describe('SKU Matching and Inventory', () => {
    test('should match base SKU pattern', async () => {
      const mockProductId = createMockObjectId('product-sku-123');
      const mockProduct = {
        _id: mockProductId,
        productType: 'shoes',
      };

      ProductService.findOneBySku = jest.fn().mockResolvedValue(mockProduct);

      const message = 'Chốt HJ6777 size 42';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.productId.toString()).toBe(mockProductId.toString());
      expect(ProductService.findOneBySku).toHaveBeenCalledWith('HJ6777');
    });

    test('should match inventory SKU for shoes', async () => {
      const mockProductId = createMockObjectId('product-shoes-456');
      const mockProduct = {
        _id: mockProductId,
        productType: 'shoes',
        inventory: [
          {
            sku: 'HJ6777',
            color: 'red',
            size: 42,
          },
        ],
      };

      // Mock both methods to ensure the right one is called
      ProductService.findOneBySku = jest.fn().mockResolvedValue(null);
      ProductService.findOneByInventorySku = jest.fn().mockResolvedValue(mockProduct);

      const message = 'Chốt HJ6777';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.productId.toString()).toBe(mockProductId.toString());
      expect(result.color).toBe('red');
      expect(result.size).toBe('42');
      expect(ProductService.findOneBySku).toHaveBeenCalledWith('HJ6777');
      expect(ProductService.findOneByInventorySku).toHaveBeenCalledWith('HJ6777');
    });

    test('should match inventory SKU for clothing', async () => {
      const mockProductId = createMockObjectId('product-clothing-789');
      const mockProduct = {
        _id: mockProductId,
        productType: 'clothing',
        inventory: [
          {
            sku: 'SHIRT-BLUE-L',
            color: 'blue',
            clothingSize: 'L',
          },
        ],
      };

      ProductService.findOneBySku = jest.fn().mockResolvedValue(null);
      ProductService.findOneByInventorySku = jest.fn().mockResolvedValue(mockProduct);

      const message = 'Chốt SHIRT-BLUE-L';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.productId.toString()).toBe(mockProductId.toString());
      expect(result.color).toBe('blue');
      expect(result.size).toBe('L');
    });

    test('should match inventory SKU for accessory', async () => {
      const mockProductId = createMockObjectId('product-accessory-999');
      const mockProduct = {
        _id: mockProductId,
        productType: 'accessory',
        inventory: [
          {
            sku: 'BAG-BLACK-ONESIZE',
            color: 'black',
            isOneSize: true,
          },
        ],
      };

      ProductService.findOneBySku = jest.fn().mockResolvedValue(null);
      ProductService.findOneByInventorySku = jest.fn().mockResolvedValue(mockProduct);

      const message = 'Chốt BAG-BLACK-ONESIZE';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.productId.toString()).toBe(mockProductId.toString());
      expect(result.color).toBe('black');
      expect(result.size).toBe('ONESIZE');
    });

    test('should handle SKU not found', async () => {
      ProductService.findOneBySku = jest.fn().mockResolvedValue(null);
      ProductService.findOneByInventorySku = jest.fn().mockResolvedValue(null);

      const message = 'Chốt INVALID-SKU';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.productId).toBeNull();
    });
  });

  // ========== COMPOSITE PATTERN ==========

  describe('Composite Pattern Matching', () => {
    test('should extract all fields from complete composite pattern', async () => {
      const message = 'chốt 3 đôi HJ6777 màu đỏ size 42';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(3);
      expect(result.color).toBe('đỏ');
      expect(result.size).toBe('42');
    });

    test('should skip composite pattern when no color keyword', async () => {
      const message = 'chốt 2 đôi size 42'; // No color keyword
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(2);
      expect(result.size).toBe('42');
      expect(result.color).toBeNull();
    });

    test('should skip composite pattern when no size keyword', async () => {
      const message = 'chốt 2 đôi màu đỏ'; // No size keyword
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(2);
      expect(result.color).toBe('đỏ');
      expect(result.size).toBeNull();
    });
  });

  // ========== ERROR HANDLING ==========

  describe('Error Handling in ExtractProductInfo', () => {
    test('should handle null message', async () => {
      const result = await orderDetectionService.extractProductInfo(null, { roomId: 'test' });

      expect(result).toBeDefined();
      expect(result.quantity).toBe(1);
    });

    test('should handle undefined message', async () => {
      const result = await orderDetectionService.extractProductInfo(undefined, { roomId: 'test' });

      expect(result).toBeDefined();
      expect(result.quantity).toBe(1);
    });

    test('should handle null streamData', async () => {
      const message = 'Chốt size 42';
      const result = await orderDetectionService.extractProductInfo(message, null);

      expect(result).toBeDefined();
      expect(result.size).toBe('42');
    });

    test('should handle malformed streamData', async () => {
      const message = 'Chốt size 42';
      const result = await orderDetectionService.extractProductInfo(message, {
        featuredProducts: 'invalid',
      });

      expect(result).toBeDefined();
      expect(result.size).toBe('42');
    });
  });

  // ========== COMBINED PATTERNS ==========

  describe('Combined Pattern Extraction', () => {
    test('should extract size and color together', async () => {
      const message = 'size 42 màu đỏ';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.size).toBe('42');
      expect(result.color).toBe('đỏ');
    });

    test('should extract quantity and size together', async () => {
      const message = '3 đôi size 42';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(3);
      expect(result.size).toBe('42');
    });

    test('should extract all product info together', async () => {
      const message = 'chốt 2 đôi size 42 màu đỏ';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(2);
      expect(result.size).toBe('42');
      expect(result.color).toBe('đỏ');
    });
  });

  // ========== EDGE CASES ==========

  describe('Edge Cases', () => {
    test('should handle empty message', async () => {
      const result = await orderDetectionService.extractProductInfo('', { roomId: 'test' });

      expect(result).toBeDefined();
      expect(result.quantity).toBe(1);
    });

    test('should handle whitespace only message', async () => {
      const result = await orderDetectionService.extractProductInfo('   ', { roomId: 'test' });

      expect(result).toBeDefined();
      expect(result.quantity).toBe(1);
    });

    test('should handle very long message', async () => {
      const longMessage = 'chốt đơn size 42 màu đỏ 0912345678 '.repeat(10);
      const result = await orderDetectionService.extractProductInfo(longMessage, {
        roomId: 'test',
      });

      expect(result).toBeDefined();
      expect(result.size).toBe('42');
      expect(result.color).toBe('đỏ');
    });

    test('should handle special characters', async () => {
      const message = 'chốt!!! size 42 màu đỏ???';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result).toBeDefined();
      expect(result.size).toBe('42');
      expect(result.color).toBe('đỏ');
    });
  });
});
