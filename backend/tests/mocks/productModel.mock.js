/**
 * Product Model Mock
 * In-memory mock module for the Product model (Mongoose)
 */

const mockData = {
  products: [],
  nextId: 1,
};

// Mock implementation functions (not jest.fn wrapped yet)
const createImpl = async productData => {
  const newProduct = {
    _id: `mock-id-${mockData.nextId++}`,
    ...productData,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: async () => true,
  };
  mockData.products.push(newProduct);
  return newProduct;
};

const ProductModelMock = {
  // Mock data store
  __mockData: mockData,

  // Helper to set mock data
  __setMockData: data => {
    mockData.products = Array.isArray(data) ? data : [data];
  },

  // Helper to clear all mocks
  __clearMocks: () => {
    mockData.products = [];
    mockData.nextId = 1;
  },

  // Mock functions
  create: createImpl,

  find: (query = {}) => {
    let results = [...mockData.products];

    // Apply filters
    if (query._id) {
      results = results.filter(p => p._id === query._id);
    }
    if (query.sku) {
      results = results.filter(p => p.sku === query.sku);
    }
    if (query.brand) {
      results = results.filter(p => p.brand === query.brand);
    }
    if (query.category) {
      results = results.filter(p => p.category === query.category);
    }

    const chain = {
      populate: () => chain,
      sort: () => chain,
      skip: () => chain,
      limit: () => chain,
      exec: async () => results,
      then: resolve => resolve(results),
    };

    return chain;
  },

  findById: id => {
    const product = mockData.products.find(p => p._id === id);
    // Return null instead of undefined when not found (Mongoose behavior)
    const result = product || null;

    const chain = {
      populate: () => chain,
      exec: async () => result,
      then: resolve => resolve(result),
    };

    return chain;
  },

  findOne: query => {
    const product = mockData.products.find(p => {
      if (query._id && p._id !== query._id) return false;
      if (query.sku && p.sku !== query.sku) return false;
      if (query.brand && p.brand !== query.brand) return false;
      return true;
    });
    // Return null instead of undefined when not found (Mongoose behavior)
    const result = product || null;

    const chain = {
      populate: () => chain,
      exec: async () => result,
      then: resolve => resolve(result),
    };

    return chain;
  },

  findByIdAndUpdate: (id, update, options = {}) => {
    const index = mockData.products.findIndex(p => p._id === id);

    let returnDoc = null;
    if (index !== -1) {
      const updateData = update.$set || update;
      const oldProduct = { ...mockData.products[index] };
      const updatedProduct = {
        ...oldProduct,
        ...updateData,
        updatedAt: new Date(),
      };

      mockData.products[index] = updatedProduct;
      returnDoc = options.new ? updatedProduct : oldProduct;
    }

    const chain = {
      populate: () => chain,
      exec: async () => returnDoc,
      then: resolve => resolve(returnDoc),
    };

    return chain;
  },

  findByIdAndDelete: async id => {
    const index = mockData.products.findIndex(p => p._id === id);
    if (index === -1) return null;

    const deletedProduct = mockData.products[index];
    mockData.products.splice(index, 1);
    return deletedProduct;
  },

  countDocuments: async (query = {}) => {
    let results = [...mockData.products];

    // Apply filters
    if (query.brand) {
      results = results.filter(p => p.brand === query.brand);
    }
    if (query.category) {
      results = results.filter(p => p.category === query.category);
    }

    return results.length;
  },

  deleteMany: async query => {
    const beforeCount = mockData.products.length;
    mockData.products = mockData.products.filter(p => {
      if (query._id && p._id === query._id) return false;
      if (query.brand && p.brand === query.brand) return false;
      return true;
    });
    const deletedCount = beforeCount - mockData.products.length;
    return { deletedCount };
  },
};

export default ProductModelMock;
