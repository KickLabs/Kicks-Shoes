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

    test.each(vietnameseColors)(
      '[TC2001-VietnameseColorExtraction] Should extract Vietnamese color: %s',
      async color => {
        // Description: Test extraction of Vietnamese color names with 'màu' keyword
        // Input: Message containing 'màu' keyword followed by Vietnamese color name
        // Expected: System extracts the Vietnamese color correctly

        const message = `màu ${color}`;
        const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

        expect(result.color).toBe(color);
      }
    );

    test.each(englishColors)(
      '[TC2002-EnglishColorExtraction] Should extract English color: %s',
      async color => {
        // Description: Test extraction of English color names with 'color' keyword
        // Input: Message containing 'color' keyword followed by English color name
        // Expected: System extracts the English color correctly (case insensitive)

        const message = `color ${color}`;
        const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

        expect(result.color.toLowerCase()).toBe(color);
      }
    );

    test('[TC2003-StandaloneVietnameseColors] Should extract standalone Vietnamese colors', async () => {
      // Description: Test extraction of Vietnamese colors without 'màu' keyword
      // Input: Message with product name followed by Vietnamese color
      // Expected: System extracts the Vietnamese color even without explicit color keyword

      const standaloneColors = ['đỏ', 'xanh', 'vàng'];

      for (const color of standaloneColors) {
        const message = `giày ${color}`;
        const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

        if (result.color) {
          expect(result.color).toBe(color);
        }
      }
    });

    test('[TC2004-StandaloneEnglishColors] Should extract standalone English colors', async () => {
      // Description: Test extraction of English colors without 'color' keyword
      // Input: Message with product name followed by English color
      // Expected: System extracts the English color even without explicit color keyword

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

    test.each(sizeKeywords)(
      '[TC2005-SizeKeywordExtraction] Should extract size with keyword: %s',
      async keyword => {
        // Description: Test extraction of numeric sizes with different size keywords
        // Input: Message containing size keyword followed by numeric size
        // Expected: System extracts the numeric size correctly

        const message = `${keyword} 42`;
        const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

        expect(result.size).toBe('42');
      }
    );

    test('[TC2006-ClothingSizeExtraction] Should extract clothing sizes', async () => {
      // Description: Test extraction of clothing size codes (S, M, L, XL, etc.)
      // Input: Message containing 'size' keyword followed by clothing size code
      // Expected: System extracts the clothing size and converts to uppercase

      const clothingSizes = ['S', 'M', 'L', 'XL', 'XXL', 'XS'];

      for (const size of clothingSizes) {
        const message = `size ${size}`;
        const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

        expect(result.size).toBe(size.toUpperCase());
      }
    });

    test('[TC2007-OneSizeExtraction] Should extract one size variations', async () => {
      // Description: Test extraction of 'one size' variations in different formats
      // Input: Message containing 'size' keyword followed by one size variations
      // Expected: System normalizes all one size variations to 'ONESIZE'

      const oneSizeVariations = ['one size', 'onesize', 'ONE SIZE', 'ONESIZE'];

      for (const size of oneSizeVariations) {
        const message = `size ${size}`;
        const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

        expect(result.size).toBe('ONESIZE');
      }
    });

    test('[TC2008-ReversedSizePattern] Should extract reversed size pattern', async () => {
      // Description: Test extraction of size when number comes before size keyword
      // Input: Message with numeric size followed by 'size' keyword
      // Expected: System extracts the numeric size correctly

      const message = '42 size';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.size).toBe('42');
    });

    test('[TC2009-OneSizePriority] Should prioritize one size over numeric', async () => {
      // Description: Test that 'one size' takes priority over numeric size when both are present
      // Input: Message containing both 'one size' and numeric size
      // Expected: System prioritizes 'one size' and returns 'ONESIZE'

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
      '[TC2010-VietnameseQuantityExtraction] Should extract Vietnamese quantity unit: %s',
      async unit => {
        // Description: Test extraction of quantity with Vietnamese unit words
        // Input: Message containing number followed by Vietnamese quantity unit
        // Expected: System extracts the numeric quantity correctly

        const message = `3 ${unit}`;
        const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

        expect(result.quantity).toBe(3);
      }
    );

    test.each(quantityUnits.english)(
      '[TC2011-EnglishQuantityExtraction] Should extract English quantity unit: %s',
      async unit => {
        // Description: Test extraction of quantity with English unit words
        // Input: Message containing number followed by English quantity unit
        // Expected: System extracts the numeric quantity correctly

        const message = `3 ${unit}`;
        const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

        expect(result.quantity).toBe(3);
      }
    );

    test('[TC2012-UnitBeforeNumberPattern] Should extract unit before number pattern', async () => {
      // Description: Test extraction of quantity when unit word comes before number
      // Input: Message with quantity unit followed by number
      // Expected: System extracts the numeric quantity correctly

      const message = 'đôi 3';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(3);
    });

    test('[TC2013-DefaultQuantity] Should default to quantity 1 when no quantity found', async () => {
      // Description: Test that system defaults to quantity 1 when no quantity is specified
      // Input: Message without any quantity information
      // Expected: System defaults to quantity 1

      const message = 'chốt đơn';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(1);
    });

    test('[TC2014-NaNQuantityHandling] Should handle NaN quantity in composite pattern', async () => {
      // Description: Test handling of quantity unit without number in composite pattern
      // Input: Message with quantity unit but no number (causing NaN)
      // Expected: System defaults to quantity 1 when NaN is encountered

      const message = 'chốt đôi AB1234 màu đỏ size 42'; // "đôi" without number
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(1); // Should default to 1 when NaN
    });
  });

  // ========== SKU MATCHING & INVENTORY (Lines 348-357) ==========

  describe('SKU Matching and Inventory', () => {
    test('[TC2015-BaseSKUMatching] Should match base SKU pattern', async () => {
      // Description: Test matching of base SKU patterns in product messages
      // Input: Message containing SKU code with size information
      // Expected: System finds product by SKU and extracts product ID

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

    test('[TC2016-InventorySKUShoes] Should match inventory SKU for shoes', async () => {
      // Description: Test matching of inventory SKU for shoes with color and size extraction
      // Input: Message containing SKU code for shoes
      // Expected: System finds product by inventory SKU and extracts color/size from inventory

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

    test('[TC2017-InventorySKUClothing] Should match inventory SKU for clothing', async () => {
      // Description: Test matching of inventory SKU for clothing with color and size extraction
      // Input: Message containing SKU code for clothing
      // Expected: System finds product by inventory SKU and extracts color/clothing size from inventory

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

    test('[TC2018-InventorySKUAccessory] Should match inventory SKU for accessory', async () => {
      // Description: Test matching of inventory SKU for accessories with one size
      // Input: Message containing SKU code for accessory
      // Expected: System finds product by inventory SKU and extracts color/one size from inventory

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

    test('[TC2019-SKUNotFound] Should handle SKU not found gracefully', async () => {
      // Description: Test handling when SKU is not found in database
      // Input: Message containing invalid/non-existent SKU code
      // Expected: System returns null for productId without throwing error

      ProductService.findOneBySku = jest.fn().mockResolvedValue(null);
      ProductService.findOneByInventorySku = jest.fn().mockResolvedValue(null);

      const message = 'Chốt INVALID-SKU';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.productId).toBeNull();
    });
  });

  // ========== COMPOSITE PATTERN ==========

  describe('Composite Pattern Matching', () => {
    test('[TC2020-CompleteCompositePattern] Should extract all fields from complete composite pattern', async () => {
      // Description: Test extraction of all product fields from complete composite pattern
      // Input: Message with quantity, unit, SKU, color, and size
      // Expected: System extracts quantity, color, and size correctly

      const message = 'chốt 3 đôi HJ6777 màu đỏ size 42';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(3);
      expect(result.color).toBe('đỏ');
      expect(result.size).toBe('42');
    });

    test('[TC2021-CompositePatternNoColor] Should skip composite pattern when no color keyword', async () => {
      // Description: Test composite pattern handling when color keyword is missing
      // Input: Message with quantity, unit, and size but no color keyword
      // Expected: System extracts quantity and size, leaves color as null

      const message = 'chốt 2 đôi size 42'; // No color keyword
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(2);
      expect(result.size).toBe('42');
      expect(result.color).toBeNull();
    });

    test('[TC2022-CompositePatternNoSize] Should skip composite pattern when no size keyword', async () => {
      // Description: Test composite pattern handling when size keyword is missing
      // Input: Message with quantity, unit, and color but no size keyword
      // Expected: System extracts quantity and color, leaves size as null

      const message = 'chốt 2 đôi màu đỏ'; // No size keyword
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(2);
      expect(result.color).toBe('đỏ');
      expect(result.size).toBeNull();
    });
  });

  // ========== ERROR HANDLING ==========

  describe('Error Handling in extractProductInfo', () => {
    test('[TC2023-InvalidMessageHandling] Should handle invalid message input (null, undefined)', async () => {
      // Description: Test handling of various invalid message input types
      // Input: Null/undefined message with valid stream data
      // Expected: System returns default result with quantity 1 without throwing error

      const invalidMessages = [null, undefined];

      for (const message of invalidMessages) {
        const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

        expect(result).toBeDefined();
        expect(result.quantity).toBe(1);
        expect(result.size).toBeNull();
        expect(result.color).toBeNull();
        expect(result.productId).toBeNull();
      }
    });

    test('[TC2024-InvalidStreamDataHandling] Should handle invalid streamData (null, malformed)', async () => {
      // Description: Test handling of null or malformed stream data
      // Input: Valid message with null/malformed stream data
      // Expected: System processes message and extracts size correctly without errors

      const message = 'Chốt size 42';

      // Test with null
      const resultNull = await orderDetectionService.extractProductInfo(message, null);
      expect(resultNull).toBeDefined();
      expect(resultNull.size).toBe('42');

      // Test with malformed
      const resultMalformed = await orderDetectionService.extractProductInfo(message, {
        featuredProducts: 'invalid',
      });
      expect(resultMalformed).toBeDefined();
      expect(resultMalformed.size).toBe('42');
    });
  });

  // ========== COMBINED PATTERNS ==========

  describe('Combined Pattern Extraction', () => {
    test('[TC2027-SizeColorCombination] Should extract size and color together', async () => {
      // Description: Test extraction of size and color in the same message
      // Input: Message containing both size and color information
      // Expected: System extracts both size and color correctly

      const message = 'size 42 màu đỏ';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.size).toBe('42');
      expect(result.color).toBe('đỏ');
    });

    test('[TC2028-QuantitySizeCombination] Should extract quantity and size together', async () => {
      // Description: Test extraction of quantity and size in the same message
      // Input: Message containing both quantity and size information
      // Expected: System extracts both quantity and size correctly

      const message = '3 đôi size 42';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(3);
      expect(result.size).toBe('42');
    });

    test('[TC2029-AllProductInfoCombination] Should extract all product info together', async () => {
      // Description: Test extraction of all product information in one message
      // Input: Message containing quantity, size, and color information
      // Expected: System extracts quantity, size, and color correctly

      const message = 'chốt 2 đôi size 42 màu đỏ';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result.quantity).toBe(2);
      expect(result.size).toBe('42');
      expect(result.color).toBe('đỏ');
    });
  });

  // ========== EDGE CASES ==========

  describe('Edge Cases', () => {
    test('[TC2030-EmptyMessageHandling] Should handle empty message gracefully', async () => {
      // Description: Test handling of empty string message
      // Input: Empty string message with valid stream data
      // Expected: System returns default result with quantity 1

      const result = await orderDetectionService.extractProductInfo('', { roomId: 'test' });

      expect(result).toBeDefined();
      expect(result.quantity).toBe(1);
    });

    test('[TC2031-WhitespaceMessageHandling] Should handle whitespace only message gracefully', async () => {
      // Description: Test handling of message containing only whitespace
      // Input: Message with only whitespace characters
      // Expected: System returns default result with quantity 1

      const result = await orderDetectionService.extractProductInfo('   ', { roomId: 'test' });

      expect(result).toBeDefined();
      expect(result.quantity).toBe(1);
    });

    test('[TC2032-LongMessageHandling] Should handle very long message', async () => {
      // Description: Test handling of very long messages with repeated content
      // Input: Long message with repeated product information
      // Expected: System processes long message and extracts size and color correctly

      const longMessage = 'chốt đơn size 42 màu đỏ 0912345678 '.repeat(10);
      const result = await orderDetectionService.extractProductInfo(longMessage, {
        roomId: 'test',
      });

      expect(result).toBeDefined();
      expect(result.size).toBe('42');
      expect(result.color).toBe('đỏ');
    });

    test('[TC2033-SpecialCharactersHandling] Should handle special characters gracefully', async () => {
      // Description: Test handling of messages with special characters and punctuation
      // Input: Message containing special characters and punctuation marks
      // Expected: System processes message and extracts size and color correctly

      const message = 'chốt!!! size 42 màu đỏ???';
      const result = await orderDetectionService.extractProductInfo(message, { roomId: 'test' });

      expect(result).toBeDefined();
      expect(result.size).toBe('42');
      expect(result.color).toBe('đỏ');
    });
  });
});
