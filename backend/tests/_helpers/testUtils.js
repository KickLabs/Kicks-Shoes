// FILE: tests/_helpers/testUtils.js
import { ObjectId } from 'mongodb';

export function makeMessage(content, overrides = {}) {
  return {
    content,
    _id: new ObjectId(),
    streamId: new ObjectId(),
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

export function normalizePhone(vnPhoneStr) {
  // Simple normalization for VN phone numbers
  return vnPhoneStr.replace(/\s+/g, '');
}

export function perf(fn) {
  return async (...args) => {
    const start = Date.now();
    const result = await fn(...args);
    const duration = Date.now() - start;
    console.log(`Function took ${duration}ms`);
    return result;
  };
}
