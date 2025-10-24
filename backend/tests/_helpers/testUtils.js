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
    _id: 'user123',
    username: 'buyer01',
    ...overrides,
  };
}

export function makePotentialOrder(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId().toString(),
    chatMessageId: new mongoose.Types.ObjectId().toString(),
    streamId: new mongoose.Types.ObjectId().toString(),
    status: 'pending',
    confidence: 0.85,
    customerInfo: {
      userId: new mongoose.Types.ObjectId().toString(),
      phoneNumber: '0912345678',
      address: '123 Nguyễn Huệ, Q1, TPHCM',
    },
    productInfo: {
      productId: 'prod-123',
      extractedSize: '42',
      extractedColor: 'đen',
      quantity: 1,
    },
    detectionData: {
      detectedKeywords: ['chốt', 'đơn', 'size'],
      rawMessage: 'Chốt đơn HJ6777 size 42 sđt 0912345678',
      extractedPhoneNumbers: ['0912345678'],
    },
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
