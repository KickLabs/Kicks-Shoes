import mongoose from 'mongoose';

export function makeMessage(content, overrides = {}) {
  return {
    content,
    _id: new mongoose.Types.ObjectId(),
    streamId: new mongoose.Types.ObjectId(),
    ...overrides,
  };
}

export function makeStream(overrides = {}) {
  return {
    roomId: 'test-room-123',
    featuredProducts: [],
    ...overrides,
  };
}

export function makeUser(overrides = {}) {
  return {
    fullName: 'Test User',
    username: 'testuser_' + Math.random().toString(36).substring(7),
    email: 'test_' + Math.random().toString(36).substring(7) + '@test.com',
    password: 'password123',
    role: 'customer',
    ...overrides,
  };
}

export function makePotentialOrder(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    chatMessageId: new mongoose.Types.ObjectId(),
    streamId: new mongoose.Types.ObjectId(),
    roomId: 'room-001',
    status: 'pending',
    confidence: 0.85,
    customerInfo: {
      userId: new mongoose.Types.ObjectId(),
      customerName: 'Nguyễn Văn A',
      phoneNumber: '0912345678',
    },
    productInfo: {
      originalMessage: 'Chốt đơn HJ6777 size 42 sđt 0912345678',
      productId: new mongoose.Types.ObjectId(),
      extractedSize: '42',
      extractedColor: 'đen',
      extractedQuantity: 1,
    },
    detectionData: {
      confidence: 0.85,
      detectedKeywords: ['chốt', 'đơn', 'size'],
      phoneMatches: ['0912345678'],
      timestamp: new Date(),
    },
    priority: 'medium',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    hostActions: {
      viewedAt: null,
      contactedAt: null,
      notes: null,
      confirmedBy: null,
      confirmedAt: null,
    },
    convertedOrderId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

export function normalizePhone(vnPhoneStr) {
  return (vnPhoneStr || '').replace(/\D+/g, '');
}

export async function perf(fn, ...args) {
  const start = Date.now();
  const result = await fn(...args);
  const ms = Date.now() - start;
  return { result, ms };
}

/**
 * Create mock Vietnamese order keywords for testing
 * @returns {Array<string>} Array of Vietnamese order keywords
 */
export function getOrderKeywords() {
  return [
    'chốt',
    'đơn',
    'mua',
    'đặt',
    'order',
    'chốt đơn',
    'ship',
    'giao',
    'cod',
    'ship gấp',
    'giao gấp',
    'size',
    'cỡ',
    'số',
    'màu',
    'color',
    'đôi',
    'cái',
    'chiếc',
    'combo',
    'bộ',
  ];
}

/**
 * Create mock Vietnamese phone number variations for testing
 * @returns {Array<string>} Array of phone number formats
 */
export function getPhoneVariations() {
  return [
    '0912345678',
    '0912 345 678',
    '0912.345.678',
    '0912-345-678',
    '091 234 5678',
    '091.234.5678',
    '091-234-5678',
  ];
}

/**
 * Create mock Vietnamese size variations
 * @returns {Array<string>} Array of size formats
 */
export function getSizeVariations() {
  return [
    '42',
    '40',
    '41',
    '43',
    '44',
    'XL',
    'XXL',
    'S',
    'M',
    'L',
    'ONESIZE',
    'one size',
    'ONE SIZE',
    'size 42',
    'cỡ 42',
    '42 size',
  ];
}

/**
 * Create mock Vietnamese color variations
 * @returns {Array<string>} Array of color names
 */
export function getColorVariations() {
  return [
    'đen',
    'trắng',
    'đỏ',
    'xanh',
    'vàng',
    'hồng',
    'nâu',
    'xám',
    'xanh navy',
    'xanh dương',
    'màu đen',
    'màu trắng',
    'màu đỏ',
    'màu xanh',
  ];
}

/**
 * Wait for specified duration (for testing async operations)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create mock order data for Order Auto-Creation testing
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock order data
 */
export function makeOrder(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    orderNumber: `ORD-${Date.now()}`,
    user: new mongoose.Types.ObjectId(),
    products: [
      {
        id: new mongoose.Types.ObjectId(),
        quantity: 1,
        price: 3500000,
        size: '42',
        color: 'đen',
      },
    ],
    totalAmount: 3500000,
    paymentMethod: 'cash_on_delivery',
    shippingAddress: '123 Nguyễn Huệ, Q1, TPHCM',
    notes: 'Auto-created from potential order',
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock product data for Order Auto-Creation testing
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock product data
 */
export function makeProduct(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: 'Nike Air Max 270',
    sku: 'HJ6777',
    brand: 'Nike',
    category: new mongoose.Types.ObjectId(),
    finalPrice: 3500000,
    price: { regular: 3500000 },
    productType: 'shoes',
    inventory: [
      { size: '42', color: 'đen', quantity: 5 },
      { size: '40', color: 'đen', quantity: 3 },
      { size: '41', color: 'trắng', quantity: 8 },
    ],
    checkInventory: function (options = {}) {
      if (options.size) {
        const sizeInventory = this.inventory.find(inv => inv.size === options.size);
        if (!sizeInventory) {
          return {
            available: false,
            quantity: 0,
            availableSizes: this.inventory.map(inv => inv.size),
          };
        }
        return {
          available: sizeInventory.quantity > 0,
          quantity: sizeInventory.quantity,
        };
      }
      const totalQuantity = this.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
      return {
        available: totalQuantity > 0,
        quantity: totalQuantity,
      };
    },
    ...overrides,
  };
}

/**
 * Create mock flash sale data
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock flash sale data
 */
export function makeFlashSale(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId().toString(),
    title: 'Flash Sale 30%',
    status: 'active',
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
    products: [
      {
        productId: new mongoose.Types.ObjectId().toString(),
        flashPrice: 500000,
        discountPercent: 30,
      },
    ],
    ...overrides,
  };
}

/**
 * Create mock email response
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock email response
 */
export function makeEmailResponse(overrides = {}) {
  return {
    messageId: `email-${Date.now()}`,
    email: 'customer@example.com',
    template: 'LIVESTREAM_ORDER_SUCCESS',
    data: {
      name: 'Nguyễn Văn A',
      orderNumber: 'ORD-123456',
    },
    ...overrides,
  };
}

/**
 * Create mock inventory check result
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock inventory check result
 */
export function makeInventoryCheck(overrides = {}) {
  return {
    available: true,
    quantity: 5,
    availableSizes: ['40', '42', '43'],
    ...overrides,
  };
}

/**
 * Create mock order creation request data
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock order creation request
 */
export function makeOrderCreationRequest(overrides = {}) {
  return {
    user: new mongoose.Types.ObjectId().toString(),
    products: [
      {
        id: new mongoose.Types.ObjectId().toString(),
        quantity: 1,
        price: 3500000,
        size: '42',
        color: 'đen',
      },
    ],
    totalAmount: 3500000,
    paymentMethod: 'cash_on_delivery',
    shippingAddress: '123 Nguyễn Huệ, Q1, TPHCM',
    notes: 'Auto-created from potential order',
    status: 'pending',
    paymentStatus: 'pending',
    ...overrides,
  };
}

/**
 * Create mock request object for controller testing
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock request object
 */
export function makeRequest(overrides = {}) {
  return {
    params: { id: new mongoose.Types.ObjectId().toString() },
    body: { status: 'confirmed' },
    user: { id: new mongoose.Types.ObjectId().toString() },
    ...overrides,
  };
}

/**
 * Create mock response object for controller testing
 * @returns {Object} Mock response object
 */
export function makeResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
    setHeader: jest.fn(),
  };
}

/**
 * Create mock next function for middleware testing
 * @returns {Function} Mock next function
 */
export function makeNext() {
  return jest.fn();
}
