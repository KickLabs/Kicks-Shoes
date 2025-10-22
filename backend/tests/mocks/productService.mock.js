const productDb = new Map([
  ['HJ6777', { id: 'prod123', _id: 'prod123', sku: 'HJ6777', price: 3500000 }],
]);

const productService = {
  __set(key, val) {
    // Ensure _id is set if id is provided
    if (val.id && !val._id) {
      val._id = val.id;
    }
    productDb.set(key, val);
  },
  __clear() {
    productDb.clear();
  },
  findOneBySku(sku) {
    return Promise.resolve(productDb.get(sku) || null);
  },
  findOneByInventorySku(invSku) {
    return Promise.resolve(null);
  },
  findById(id) {
    const product = Array.from(productDb.values()).find(p => p.id === id || p._id === id);
    return Promise.resolve(product || null);
  },
};

export default productService;
