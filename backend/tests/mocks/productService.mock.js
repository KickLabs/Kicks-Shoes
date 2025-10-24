const productDb = new Map([
  [
    'HJ6777',
    {
      id: 'prod123',
      sku: 'HJ6777',
      price: 3500000,
      inventory: { quantity: 10, available: true },
    },
  ],
  [
    'NK-HBP-101',
    {
      id: 'prod456',
      sku: 'NK-HBP-101',
      price: 2500000,
      inventory: { quantity: 5, available: true },
    },
  ],
]);

const userDb = new Map([
  [
    'user-123',
    {
      _id: 'user-123',
      username: 'buyer01',
      email: 'customer@example.com',
      phoneNumber: '0912345678',
    },
  ],
]);

const orderDb = new Map();

module.exports = {
  // Database management
  __set(key, val) {
    productDb.set(key, val);
  },
  __clear() {
    productDb.clear();
    userDb.clear();
    orderDb.clear();
  },
  __setUser(userId, userData) {
    userDb.set(userId, userData);
  },
  __setOrder(orderId, orderData) {
    orderDb.set(orderId, orderData);
  },

  // Product methods
  findOneBySku(sku) {
    return Promise.resolve(productDb.get(sku) || null);
  },
  findOneByInventorySku(invSku) {
    for (let [, product] of productDb) {
      if (product.inventory && product.inventory.sku === invSku) {
        return Promise.resolve(product);
      }
    }
    return Promise.resolve(null);
  },
  findById(productId) {
    for (let [, product] of productDb) {
      if (product.id === productId) {
        return Promise.resolve(product);
      }
    }
    return Promise.resolve(null);
  },
  checkInventory(productId, options = {}) {
    const product = Array.from(productDb.values()).find(p => p.id === productId);
    if (!product) return Promise.resolve({ available: false, quantity: 0 });

    // Simulate size-specific inventory check
    if (options.size && options.size === '41') {
      return Promise.resolve({
        available: false,
        quantity: 0,
        availableSizes: ['40', '42'],
      });
    }

    return Promise.resolve({
      available: product.inventory.available,
      quantity: product.inventory.quantity,
    });
  },

  // User methods
  findUserById(userId) {
    return Promise.resolve(userDb.get(userId) || null);
  },

  // Order methods
  createOrder(orderData) {
    const orderId = `order-${Date.now()}`;
    const order = {
      _id: orderId,
      ...orderData,
      createdAt: new Date(),
      status: 'pending',
    };
    orderDb.set(orderId, order);
    return Promise.resolve(order);
  },

  // Flash sale methods
  getProductFlashSale(productId) {
    const product = Array.from(productDb.values()).find(p => p.id === productId);
    if (product && product.activeFlashSale) {
      return Promise.resolve({
        flashPrice: product.flashPrice || product.price * 0.7,
        active: true,
      });
    }
    return Promise.resolve(null);
  },

  // Email methods
  sendTemplatedEmail(email, template, data) {
    // Mock successful email sending
    return Promise.resolve({
      messageId: `email-${Date.now()}`,
      email,
      template,
      data,
    });
  },
};
