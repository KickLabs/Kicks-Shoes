/**
 * Mock Inventory DAO for testing
 * Provides mock data for inventory operations
 */

export const mockInventoryData = {
  shoes: [
    {
      sku: 'HJ6777-RED-42',
      color: 'red',
      size: 42,
      productType: 'shoes',
    },
    {
      sku: 'HJ6777-BLUE-40',
      color: 'blue',
      size: 40,
      productType: 'shoes',
    },
  ],
  clothing: [
    {
      sku: 'SHIRT-BLUE-L',
      color: 'blue',
      clothingSize: 'L',
      productType: 'clothing',
    },
    {
      sku: 'SHIRT-RED-M',
      color: 'red',
      clothingSize: 'M',
      productType: 'clothing',
    },
  ],
  accessory: [
    {
      sku: 'BAG-BLACK-ONESIZE',
      color: 'black',
      isOneSize: true,
      productType: 'accessory',
    },
    {
      sku: 'WATCH-SILVER-ONESIZE',
      color: 'silver',
      isOneSize: true,
      productType: 'accessory',
    },
  ],
};

export const mockProductData = {
  HJ6777: {
    _id: '507f1f77bcf86cd799439011',
    name: 'Nike Air Max',
    brand: 'Nike',
    productType: 'shoes',
    inventory: mockInventoryData.shoes,
  },
  'SHIRT-BLUE': {
    _id: '507f1f77bcf86cd799439012',
    name: 'Adidas T-Shirt',
    brand: 'Adidas',
    productType: 'clothing',
    inventory: mockInventoryData.clothing,
  },
  'BAG-BLACK': {
    _id: '507f1f77bcf86cd799439013',
    name: 'Nike Backpack',
    brand: 'Nike',
    productType: 'accessory',
    inventory: mockInventoryData.accessory,
  },
};

export default {
  mockInventoryData,
  mockProductData,
};
