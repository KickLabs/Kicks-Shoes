/**
 * @fileoverview Mock for Favourite Mongoose Model
 * @module Favourite.mock
 * @description Provides mocked Favourite model for testing controllers and services
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Internal state for mock data
let mockFavourites = [];
let mockFavouriteData = null;
let nextId = 1;

// Generate ObjectId helper
function generateObjectId() {
  return new mongoose.Types.ObjectId().toString();
}

/**
 * Helper: Set mock data for findOne/findById to return
 * @param {Object} favouriteData - Favourite data object
 */
function __setMockFavourite(favouriteData) {
  mockFavouriteData = favouriteData || {
    _id: generateObjectId(),
    user: generateObjectId(),
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return mockFavouriteData;
}

/**
 * Helper: Set mock data for find() to return array of favourites
 * @param {Array<Object>} favouritesArray - Array of favourite data objects
 */
function __setMockFavourites(favouritesArray) {
  mockFavourites = Array.isArray(favouritesArray) ? favouritesArray : [favouritesArray];
  return mockFavourites;
}

/**
 * Helper: Clear all mock data
 */
function __clearMocks() {
  mockFavourites = [];
  mockFavouriteData = null;
  nextId = 1;
}

// Static method mocks
const findOne = jest.fn();
const find = jest.fn();
const findById = jest.fn();
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
findOne.mockImplementation(function (query) {
  const result = query
    ? mockFavourites.find(
        fav =>
          (query._id ? fav._id === query._id : true) &&
          (query.user ? fav.user === query.user : true)
      )
    : mockFavouriteData;

  const mockChain = Object.create(chainableQuery);
  mockChain._data = result || null;
  return mockChain;
});

find.mockImplementation(function (query = {}) {
  let results = [...mockFavourites];

  // Apply filters
  if (query._id) {
    results = results.filter(fav => fav._id === query._id);
  }
  if (query.user) {
    results = results.filter(fav => fav.user === query.user);
  }

  const mockChain = Object.create(chainableQuery);
  mockChain._data = results;
  return mockChain;
});

findById.mockImplementation(function (id) {
  const result = mockFavourites.find(fav => fav._id === id) || mockFavouriteData;
  const mockChain = Object.create(chainableQuery);
  mockChain._data = result;
  return mockChain;
});

create.mockImplementation(async function (data) {
  const newFavourite = {
    _id: data._id || generateObjectId(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    products: data.products || [],
  };
  mockFavourites.push(newFavourite);
  return newFavourite;
});

findOneAndUpdate.mockImplementation(async function (query, update, options) {
  const favourite = mockFavourites.find(
    fav =>
      (query._id ? fav._id === query._id : true) && (query.user ? fav.user === query.user : true)
  );

  if (favourite) {
    Object.assign(favourite, update);
    favourite.updatedAt = new Date();
    return favourite;
  }

  return null;
});

findByIdAndUpdate.mockImplementation(async function (id, update) {
  const favourite = mockFavourites.find(fav => fav._id === id);
  if (favourite) {
    Object.assign(favourite, update);
    favourite.updatedAt = new Date();
    return favourite;
  }
  return null;
});

findByIdAndDelete.mockImplementation(async function (id) {
  const index = mockFavourites.findIndex(fav => fav._id === id);
  if (index !== -1) {
    return mockFavourites.splice(index, 1)[0];
  }
  return null;
});

deleteOne.mockImplementation(async function (query) {
  const index = mockFavourites.findIndex(
    fav =>
      (query._id ? fav._id === query._id : true) && (query.user ? fav.user === query.user : true)
  );

  if (index !== -1) {
    mockFavourites.splice(index, 1);
    return { deletedCount: 1 };
  }

  return { deletedCount: 0 };
});

deleteMany.mockImplementation(async function (query) {
  const originalLength = mockFavourites.length;
  mockFavourites = mockFavourites.filter(fav => {
    if (query.user && fav.user !== query.user) return true;
    if (query._id && fav._id !== query._id) return true;
    return false;
  });

  return { deletedCount: originalLength - mockFavourites.length };
});

exists.mockImplementation(async function (query) {
  const result = mockFavourites.find(
    fav =>
      (query._id ? fav._id === query._id : true) && (query.user ? fav.user === query.user : true)
  );
  return result ? true : false;
});

countDocuments.mockImplementation(async function (query) {
  return mockFavourites.filter(
    fav =>
      (query._id ? fav._id === query._id : true) && (query.user ? fav.user === query.user : true)
  ).length;
});

// Export mocked model
const FavouriteMock = {
  findOne,
  find,
  findById,
  create,
  findOneAndUpdate,
  findByIdAndUpdate,
  findByIdAndDelete,
  deleteOne,
  deleteMany,
  exists,
  countDocuments,

  // Helper methods
  __setMockFavourite,
  __setMockFavourites,
  __clearMocks,
  __mockData: {
    favourites: mockFavourites,
    get length() {
      return mockFavourites.length;
    },
  },
};

export default FavouriteMock;
