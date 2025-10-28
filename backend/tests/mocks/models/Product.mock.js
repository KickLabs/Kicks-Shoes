/**
 * @fileoverview Mock for Product Mongoose Model
 * @module Product.mock
 * @description Provides mocked Product model for testing controllers and services
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Internal state for mock data
let mockProducts = [];
let mockProductData = null;
let nextId = 1;

// Generate ObjectId helper
function generateObjectId() {
  return new mongoose.Types.ObjectId().toString();
}

/**
 * Helper: Set mock data for findById/findOne to return
 * @param {Object} productData - Product data object
 */
function __setMockProduct(productData) {
  mockProductData = productData || {
    _id: generateObjectId(),
    name: 'Mock Product',
    brand: 'Mock Brand',
    price: { regular: 1000000 },
    status: true,
    productType: 'shoes',
    category: generateObjectId(),
    sku: 'MOCK-001',
    stock: 10,
  };

  return mockProductData;
}

/**
 * Helper: Set mock data for find() to return array of products
 * @param {Array<Object>} productsArray - Array of product data objects
 */
function __setMockProducts(productsArray) {
  mockProducts = Array.isArray(productsArray) ? productsArray : [productsArray];
  return mockProducts;
}

/**
 * Helper: Clear all mock data
 */
function __clearMocks() {
  mockProducts = [];
  mockProductData = null;
  nextId = 1;
}

// Static method mocks
const findById = jest.fn();
const findOne = jest.fn();
const find = jest.fn();
const create = jest.fn();
const findOneAndUpdate = jest.fn();
const findByIdAndUpdate = jest.fn();
const findByIdAndDelete = jest.fn();
const deleteOne = jest.fn();
const deleteMany = jest.fn();
const exists = jest.fn();
const countDocuments = jest.fn();

// Chainable query methods mock
const chainableQuery = {
  populate: jest.fn(function (path, select) {
    if (path) {
      this._populate = { path, select };
    }
    return this;
  }),
  select: jest.fn(function (fields) {
    this._select = fields;
    return this;
  }),
  sort: jest.fn(function (sortBy) {
    this._sort = sortBy;
    return this;
  }),
  skip: jest.fn(function (num) {
    this._skip = num;
    return this;
  }),
  limit: jest.fn(function (num) {
    this._limit = num;
    return this;
  }),
  lean: jest.fn(function () {
    return this;
  }),
  exec: jest.fn(async function () {
    return this._data || null;
  }),
  then: jest.fn(async function (resolve, reject) {
    try {
      const result = await this.exec();
      return resolve ? Promise.resolve(result).then(resolve, reject) : Promise.resolve(result);
    } catch (error) {
      return reject ? Promise.reject(error) : Promise.reject(error);
    }
  }),
};

// Default mock implementations
findById.mockImplementation(function (id) {
  const result = mockProducts.find(p => p._id === id) || mockProductData;
  const mockChain = Object.create(chainableQuery);
  mockChain._data = result;
  return mockChain;
});

findOne.mockImplementation(function (query) {
  const result = query
    ? mockProducts.find(
        p =>
          (query._id ? p._id === query._id : true) &&
          (query.sku ? p.sku === query.sku : true) &&
          (query.brand ? p.brand === query.brand : true)
      )
    : mockProductData;

  const mockChain = Object.create(chainableQuery);
  mockChain._data = result || null;
  return mockChain;
});

find.mockImplementation(function (query = {}) {
  let results = [...mockProducts];

  // Apply filters
  if (query._id) {
    results = results.filter(p => p._id === query._id);
  }
  if (query.brand) {
    results = results.filter(p => p.brand === query.brand);
  }
  if (query.category) {
    results = results.filter(p => p.category === query.category);
  }
  if (query.status !== undefined) {
    results = results.filter(p => p.status === query.status);
  }

  const mockChain = Object.create(chainableQuery);
  mockChain._data = results;
  return mockChain;
});

create.mockImplementation(async function (data) {
  const newProduct = {
    _id: data._id || generateObjectId(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };
  mockProducts.push(newProduct);
  return newProduct;
});

findOneAndUpdate.mockImplementation(async function (query, update, options) {
  const product = mockProducts.find(
    p => (query._id ? p._id === query._id : true) && (query.sku ? p.sku === query.sku : true)
  );

  if (product) {
    Object.assign(product, update);
    product.updatedAt = new Date();
    return product;
  }

  return null;
});

findByIdAndUpdate.mockImplementation(async function (id, update) {
  const product = mockProducts.find(p => p._id === id);
  if (product) {
    Object.assign(product, update);
    product.updatedAt = new Date();
    return product;
  }
  return null;
});

findByIdAndDelete.mockImplementation(async function (id) {
  const index = mockProducts.findIndex(p => p._id === id);
  if (index !== -1) {
    return mockProducts.splice(index, 1)[0];
  }
  return null;
});

deleteOne.mockImplementation(async function (query) {
  const index = mockProducts.findIndex(
    p => (query._id ? p._id === query._id : true) && (query.sku ? p.sku === query.sku : true)
  );

  if (index !== -1) {
    mockProducts.splice(index, 1);
    return { deletedCount: 1 };
  }

  return { deletedCount: 0 };
});

deleteMany.mockImplementation(async function (query) {
  const originalLength = mockProducts.length;
  mockProducts = mockProducts.filter(p => {
    if (query.brand && p.brand !== query.brand) return true;
    if (query._id && p._id !== query._id) return true;
    return false;
  });

  return { deletedCount: originalLength - mockProducts.length };
});

exists.mockImplementation(async function (query) {
  const result = mockProducts.find(
    p => (query._id ? p._id === query._id : true) && (query.sku ? p.sku === query.sku : true)
  );
  return result ? true : false;
});

countDocuments.mockImplementation(async function (query) {
  return mockProducts.filter(
    p =>
      (query._id ? p._id === query._id : true) &&
      (query.brand ? p.brand === query.brand : true) &&
      (query.status !== undefined ? p.status === query.status : true)
  ).length;
});

// Export mocked model
const ProductMock = {
  findById,
  findOne,
  find,
  create,
  findOneAndUpdate,
  findByIdAndUpdate,
  findByIdAndDelete,
  deleteOne,
  deleteMany,
  exists,
  countDocuments,

  // Helper methods
  __setMockProduct,
  __setMockProducts,
  __clearMocks,
  __mockData: {
    products: mockProducts,
    get length() {
      return mockProducts.length;
    },
  },
};

export default ProductMock;
