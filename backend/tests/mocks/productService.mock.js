const productDb = new Map([
  [
    'HJ6777',
    {
      _id: new mongoose.Types.ObjectId('prod123'),
      id: 'prod123',
      sku: 'HJ6777',
      name: 'Nike Air Max 270',
      price: { regular: 3500000 },
      finalPrice: 3500000,
      productType: 'shoes',
      inventory: [
        { size: '42', color: 'đen', quantity: 10 },
        { size: '40', color: 'đen', quantity: 5 },
        { size: '41', color: 'trắng', quantity: 8 },
      ],
      checkInventory: jest.fn().mockReturnValue({ available: true, quantity: 10 }),
    },
  ],
  [
    'NK-HBP-101',
    {
      _id: new mongoose.Types.ObjectId('prod456'),
      id: 'prod456',
      sku: 'NK-HBP-101',
      name: 'Nike Air Force 1',
      price: { regular: 2500000 },
      finalPrice: 2500000,
      productType: 'shoes',
      inventory: [
        { size: '42', color: 'đen', quantity: 5 },
        { size: '40', color: 'trắng', quantity: 3 },
      ],
      checkInventory: jest.fn().mockReturnValue({ available: true, quantity: 5 }),
    },
  ],
  [
    'prod-123',
    {
      _id: new mongoose.Types.ObjectId('prod-123'),
      id: 'prod-123',
      sku: 'Nike Air Max 270',
      name: 'Nike Air Max 270',
      price: { regular: 3500000 },
      finalPrice: 3500000,
      productType: 'shoes',
      inventory: [
        { size: '42', color: 'đen', quantity: 5 },
        { size: '40', color: 'trắng', quantity: 3 },
      ],
      checkInventory: jest.fn().mockReturnValue({ available: true, quantity: 5 }),
    },
  ],
  [
    'flash-sale-product',
    {
      _id: new mongoose.Types.ObjectId('flash-sale-product'),
      id: 'flash-sale-product',
      sku: 'Flash Sale Product',
      name: 'Flash Sale Product',
      price: { regular: 3500000 },
      finalPrice: 500000,
      productType: 'shoes',
      activeFlashSale: true,
      inventory: [
        { size: '42', color: 'đen', quantity: 3 },
        { size: '40', color: 'trắng', quantity: 2 },
      ],
      checkInventory: jest.fn().mockReturnValue({ available: true, quantity: 3 }),
    },
  ],
]);

const userDb = new Map([
  [
    'user-123',
    {
      _id: new mongoose.Types.ObjectId('user-123'),
      username: 'buyer01',
      email: 'customer@example.com',
      phoneNumber: '0912345678',
      fullName: 'Nguyễn Văn A',
      address: '123 Nguyễn Huệ, Q1, TPHCM',
    },
  ],
  [
    'customer-user-id',
    {
      _id: new mongoose.Types.ObjectId('customer-user-id'),
      fullName: 'Nguyễn Văn A',
      email: 'customer@example.com',
      phone: '0912345678',
      address: '123 Nguyễn Huệ, Q1, TPHCM',
    },
  ],
  [
    'host-user-id',
    {
      _id: new mongoose.Types.ObjectId('host-user-id'),
      username: 'host01',
      email: 'host@example.com',
      role: 'host',
      fullName: 'Host User',
      address: '456 Lê Lợi, Q1, TPHCM',
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

    // Handle inventory array structure
    if (Array.isArray(product.inventory)) {
      // Simulate size-specific inventory check
      if (options.size) {
        const sizeInventory = product.inventory.find(inv => inv.size === options.size);
        if (!sizeInventory) {
          return Promise.resolve({
            available: false,
            quantity: 0,
            availableSizes: product.inventory.map(inv => inv.size),
          });
        }

        // Simulate size 41 out of stock
        if (options.size === '41') {
          return Promise.resolve({
            available: false,
            quantity: 0,
            availableSizes: product.inventory.map(inv => inv.size),
          });
        }

        return Promise.resolve({
          available: sizeInventory.quantity > 0,
          quantity: sizeInventory.quantity,
        });
      }

      // Return total available quantity
      const totalQuantity = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
      return Promise.resolve({
        available: totalQuantity > 0,
        quantity: totalQuantity,
      });
    }

    // Fallback for old structure
    return Promise.resolve({
      available: product.inventory?.available || false,
      quantity: product.inventory?.quantity || 0,
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
        flashPrice: product.finalPrice || product.price * 0.7,
        discountPercent: 30,
        flashSaleId: 'flash-sale-123',
        flashSaleTitle: 'Flash Sale 30%',
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
