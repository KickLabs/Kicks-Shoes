import mongoose from 'mongoose';
import Order from './src/models/Order.js';
import OrderItem from './src/models/OrderItem.js';
import User from './src/models/User.js';
import Product from './src/models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

// Sample data for fake orders
const fakeOrders = [
  // March 2025
  {
    user: '684169e24fae5b169f74e53f',
    status: 'delivered',
    totalPrice: 2450000,
    shippingAddress: 'Nguyen Van A, 123 Le Loi, Hai Chau, Da Nang, 0901234567',
    paymentMethod: 'cash_on_delivery',
    paymentStatus: 'paid',
    notes: 'Giao hàng vào buổi sáng',
    isActive: true,
    shippingMethod: 'standard',
    shippingCost: 30000,
    tax: 0,
    discount: 50000,
    subtotal: 2420000,
    paymentDate: new Date('2025-03-15T08:30:00.000Z'),
    createdAt: new Date('2025-03-15T08:30:00.000Z'),
    updatedAt: new Date('2025-03-15T08:30:00.000Z'),
    orderNumber: '250315-0001',
  },
  {
    user: '684169e24fae5b169f74e53f',
    status: 'processing',
    totalPrice: 1890000,
    shippingAddress: 'Tran Thi B, 456 Nguyen Trai, Cam Le, Da Nang, 0912345678',
    paymentMethod: 'vnpay',
    paymentStatus: 'paid',
    notes: '',
    isActive: true,
    shippingMethod: 'express',
    shippingCost: 50000,
    tax: 0,
    discount: 0,
    subtotal: 1840000,
    paymentDate: new Date('2025-03-22T14:15:00.000Z'),
    createdAt: new Date('2025-03-22T14:15:00.000Z'),
    updatedAt: new Date('2025-03-22T14:15:00.000Z'),
    orderNumber: '250322-0001',
  },
  {
    user: '684169e24fae5b169f74e53f',
    status: 'shipped',
    totalPrice: 3200000,
    shippingAddress: 'Le Van C, 789 Tran Phu, Son Tra, Da Nang, 0923456789',
    paymentMethod: 'cash_on_delivery',
    paymentStatus: 'pending',
    notes: 'Giao hàng vào buổi chiều',
    isActive: true,
    shippingMethod: 'standard',
    shippingCost: 30000,
    tax: 0,
    discount: 100000,
    subtotal: 3130000,
    paymentDate: new Date('2025-03-28T10:45:00.000Z'),
    createdAt: new Date('2025-03-28T10:45:00.000Z'),
    updatedAt: new Date('2025-03-28T10:45:00.000Z'),
    orderNumber: '250328-0001',
  },

  // April 2025
  {
    user: '684169e24fae5b169f74e53f',
    status: 'delivered',
    totalPrice: 1560000,
    shippingAddress: 'Pham Van D, 321 Hoang Dieu, Hai Chau, Da Nang, 0934567890',
    paymentMethod: 'vnpay',
    paymentStatus: 'paid',
    notes: '',
    isActive: true,
    shippingMethod: 'standard',
    shippingCost: 30000,
    tax: 0,
    discount: 0,
    subtotal: 1530000,
    paymentDate: new Date('2025-04-05T09:20:00.000Z'),
    createdAt: new Date('2025-04-05T09:20:00.000Z'),
    updatedAt: new Date('2025-04-05T09:20:00.000Z'),
    orderNumber: '250405-0001',
  },
  {
    user: '684169e24fae5b169f74e53f',
    status: 'delivered',
    totalPrice: 2780000,
    shippingAddress: 'Vo Thi E, 654 Ngo Quyen, Cam Le, Da Nang, 0945678901',
    paymentMethod: 'cash_on_delivery',
    paymentStatus: 'paid',
    notes: 'Giao hàng vào cuối tuần',
    isActive: true,
    shippingMethod: 'express',
    shippingCost: 50000,
    tax: 0,
    discount: 80000,
    subtotal: 2750000,
    paymentDate: new Date('2025-04-12T16:30:00.000Z'),
    createdAt: new Date('2025-04-12T16:30:00.000Z'),
    updatedAt: new Date('2025-04-12T16:30:00.000Z'),
    orderNumber: '250412-0001',
  },
  {
    user: '684169e24fae5b169f74e53f',
    status: 'processing',
    totalPrice: 1980000,
    shippingAddress: 'Hoang Van F, 987 Dien Bien Phu, Son Tra, Da Nang, 0956789012',
    paymentMethod: 'vnpay',
    paymentStatus: 'paid',
    notes: '',
    isActive: true,
    shippingMethod: 'standard',
    shippingCost: 30000,
    tax: 0,
    discount: 50000,
    subtotal: 1950000,
    paymentDate: new Date('2025-04-18T11:15:00.000Z'),
    createdAt: new Date('2025-04-18T11:15:00.000Z'),
    updatedAt: new Date('2025-04-18T11:15:00.000Z'),
    orderNumber: '250418-0001',
  },

  // May 2025
  {
    user: '684169e24fae5b169f74e53f',
    status: 'delivered',
    totalPrice: 3450000,
    shippingAddress: 'Nguyen Thi G, 147 Ly Tu Trong, Hai Chau, Da Nang, 0967890123',
    paymentMethod: 'cash_on_delivery',
    paymentStatus: 'paid',
    notes: 'Giao hàng vào buổi sáng',
    isActive: true,
    shippingMethod: 'standard',
    shippingCost: 30000,
    tax: 0,
    discount: 120000,
    subtotal: 3360000,
    paymentDate: new Date('2025-05-03T08:45:00.000Z'),
    createdAt: new Date('2025-05-03T08:45:00.000Z'),
    updatedAt: new Date('2025-05-03T08:45:00.000Z'),
    orderNumber: '250503-0001',
  },
  {
    user: '684169e24fae5b169f74e53f',
    status: 'shipped',
    totalPrice: 1670000,
    shippingAddress: 'Tran Van H, 258 Bach Dang, Hai Chau, Da Nang, 0978901234',
    paymentMethod: 'vnpay',
    paymentStatus: 'paid',
    notes: '',
    isActive: true,
    shippingMethod: 'express',
    shippingCost: 50000,
    tax: 0,
    discount: 0,
    subtotal: 1620000,
    paymentDate: new Date('2025-05-10T13:20:00.000Z'),
    createdAt: new Date('2025-05-10T13:20:00.000Z'),
    updatedAt: new Date('2025-05-10T13:20:00.000Z'),
    orderNumber: '250510-0001',
  },
  {
    user: '684169e24fae5b169f74e53f',
    status: 'delivered',
    totalPrice: 2890000,
    shippingAddress: 'Le Thi I, 369 Nguyen Van Linh, Son Tra, Da Nang, 0989012345',
    paymentMethod: 'cash_on_delivery',
    paymentStatus: 'paid',
    notes: 'Giao hàng vào buổi chiều',
    isActive: true,
    shippingMethod: 'standard',
    shippingCost: 30000,
    tax: 0,
    discount: 90000,
    subtotal: 2800000,
    paymentDate: new Date('2025-05-17T15:30:00.000Z'),
    createdAt: new Date('2025-05-17T15:30:00.000Z'),
    updatedAt: new Date('2025-05-17T15:30:00.000Z'),
    orderNumber: '250517-0001',
  },

  // June 2025
  {
    user: '684169e24fae5b169f74e53f',
    status: 'processing',
    totalPrice: 2230000,
    shippingAddress: 'Pham Van J, 741 Nguyen Huu Tho, Cam Le, Da Nang, 0990123456',
    paymentMethod: 'vnpay',
    paymentStatus: 'paid',
    notes: '',
    isActive: true,
    shippingMethod: 'standard',
    shippingCost: 30000,
    tax: 0,
    discount: 60000,
    subtotal: 2200000,
    paymentDate: new Date('2025-06-02T10:10:00.000Z'),
    createdAt: new Date('2025-06-02T10:10:00.000Z'),
    updatedAt: new Date('2025-06-02T10:10:00.000Z'),
    orderNumber: '250602-0001',
  },
  {
    user: '684169e24fae5b169f74e53f',
    status: 'delivered',
    totalPrice: 3780000,
    shippingAddress: 'Vo Van K, 852 Le Duan, Hai Chau, Da Nang, 0901234567',
    paymentMethod: 'cash_on_delivery',
    paymentStatus: 'paid',
    notes: 'Giao hàng vào cuối tuần',
    isActive: true,
    shippingMethod: 'express',
    shippingCost: 50000,
    tax: 0,
    discount: 130000,
    subtotal: 3650000,
    paymentDate: new Date('2025-06-08T14:45:00.000Z'),
    createdAt: new Date('2025-06-08T14:45:00.000Z'),
    updatedAt: new Date('2025-06-08T14:45:00.000Z'),
    orderNumber: '250608-0001',
  },
  {
    user: '684169e24fae5b169f74e53f',
    status: 'shipped',
    totalPrice: 1890000,
    shippingAddress: 'Hoang Thi L, 963 Tran Cao Van, Son Tra, Da Nang, 0912345678',
    paymentMethod: 'vnpay',
    paymentStatus: 'paid',
    notes: '',
    isActive: true,
    shippingMethod: 'standard',
    shippingCost: 30000,
    tax: 0,
    discount: 0,
    subtotal: 1860000,
    paymentDate: new Date('2025-06-15T12:30:00.000Z'),
    createdAt: new Date('2025-06-15T12:30:00.000Z'),
    updatedAt: new Date('2025-06-15T12:30:00.000Z'),
    orderNumber: '250615-0001',
  },
];

// Sample order items data
const fakeOrderItems = [
  // March orders
  {
    order: '250315-0001',
    product: '68592c166b62c151554c73cf',
    quantity: 2,
    price: 1161000,
    size: '40',
    color: 'Black',
    subtotal: 2322000,
  },
  {
    order: '250322-0001',
    product: '68592c166b62c151554c73cb',
    quantity: 1,
    price: 1150000,
    size: '42',
    color: 'White',
    subtotal: 1150000,
  },
  {
    order: '250322-0001',
    product: '68592c166b62c151554c73cf',
    quantity: 1,
    price: 1161000,
    size: '41',
    color: 'Red',
    subtotal: 1161000,
  },
  {
    order: '250328-0001',
    product: '68592c166b62c151554c73cb',
    quantity: 2,
    price: 1150000,
    size: '43',
    color: 'Blue',
    subtotal: 2300000,
  },
  {
    order: '250328-0001',
    product: '68592c166b62c151554c73cf',
    quantity: 1,
    price: 1161000,
    size: '39',
    color: 'Black',
    subtotal: 1161000,
  },

  // April orders
  {
    order: '250405-0001',
    product: '68592c166b62c151554c73cf',
    quantity: 1,
    price: 1161000,
    size: '44',
    color: 'White',
    subtotal: 1161000,
  },
  {
    order: '250405-0001',
    product: '68592c166b62c151554c73cb',
    quantity: 1,
    price: 1150000,
    size: '40',
    color: 'Black',
    subtotal: 1150000,
  },
  {
    order: '250412-0001',
    product: '68592c166b62c151554c73cf',
    quantity: 2,
    price: 1161000,
    size: '42',
    color: 'Red',
    subtotal: 2322000,
  },
  {
    order: '250412-0001',
    product: '68592c166b62c151554c73cb',
    quantity: 1,
    price: 1150000,
    size: '41',
    color: 'Blue',
    subtotal: 1150000,
  },
  {
    order: '250418-0001',
    product: '68592c166b62c151554c73cb',
    quantity: 1,
    price: 1150000,
    size: '43',
    color: 'White',
    subtotal: 1150000,
  },
  {
    order: '250418-0001',
    product: '68592c166b62c151554c73cf',
    quantity: 1,
    price: 1161000,
    size: '39',
    color: 'Black',
    subtotal: 1161000,
  },

  // May orders
  {
    order: '250503-0001',
    product: '68592c166b62c151554c73cf',
    quantity: 2,
    price: 1161000,
    size: '40',
    color: 'Red',
    subtotal: 2322000,
  },
  {
    order: '250503-0001',
    product: '68592c166b62c151554c73cb',
    quantity: 1,
    price: 1150000,
    size: '42',
    color: 'Blue',
    subtotal: 1150000,
  },
  {
    order: '250510-0001',
    product: '68592c166b62c151554c73cb',
    quantity: 1,
    price: 1150000,
    size: '41',
    color: 'White',
    subtotal: 1150000,
  },
  {
    order: '250510-0001',
    product: '68592c166b62c151554c73cf',
    quantity: 1,
    price: 1161000,
    size: '44',
    color: 'Black',
    subtotal: 1161000,
  },
  {
    order: '250517-0001',
    product: '68592c166b62c151554c73cf',
    quantity: 2,
    price: 1161000,
    size: '43',
    color: 'Red',
    subtotal: 2322000,
  },
  {
    order: '250517-0001',
    product: '68592c166b62c151554c73cb',
    quantity: 1,
    price: 1150000,
    size: '39',
    color: 'Blue',
    subtotal: 1150000,
  },

  // June orders
  {
    order: '250602-0001',
    product: '68592c166b62c151554c73cb',
    quantity: 1,
    price: 1150000,
    size: '40',
    color: 'White',
    subtotal: 1150000,
  },
  {
    order: '250602-0001',
    product: '68592c166b62c151554c73cf',
    quantity: 1,
    price: 1161000,
    size: '42',
    color: 'Black',
    subtotal: 1161000,
  },
  {
    order: '250608-0001',
    product: '68592c166b62c151554c73cf',
    quantity: 2,
    price: 1161000,
    size: '41',
    color: 'Red',
    subtotal: 2322000,
  },
  {
    order: '250608-0001',
    product: '68592c166b62c151554c73cb',
    quantity: 1,
    price: 1150000,
    size: '43',
    color: 'Blue',
    subtotal: 1150000,
  },
  {
    order: '250615-0001',
    product: '68592c166b62c151554c73cb',
    quantity: 1,
    price: 1150000,
    size: '44',
    color: 'White',
    subtotal: 1150000,
  },
  {
    order: '250615-0001',
    product: '68592c166b62c151554c73cf',
    quantity: 1,
    price: 1161000,
    size: '39',
    color: 'Black',
    subtotal: 1161000,
  },
];

async function generateFakeData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user exists
    const user = await User.findById('684169e24fae5b169f74e53f');
    if (!user) {
      console.error('User not found. Please make sure the user ID exists.');
      return;
    }

    // Check if products exist
    const products = await Product.find({});
    if (products.length === 0) {
      console.error('No products found. Please add products first.');
      return;
    }

    console.log(`Found ${products.length} products`);

    // Create orders
    const createdOrders = [];
    for (const orderData of fakeOrders) {
      const order = new Order(orderData);
      const savedOrder = await order.save();
      createdOrders.push(savedOrder);
      console.log(`Created order: ${savedOrder.orderNumber}`);
    }

    // Create order items
    for (const itemData of fakeOrderItems) {
      const order = createdOrders.find(o => o.orderNumber === itemData.order);
      if (order) {
        const orderItem = new OrderItem({
          order: order._id,
          product: itemData.product,
          quantity: itemData.quantity,
          price: itemData.price,
          size: itemData.size,
          color: itemData.color,
          subtotal: itemData.subtotal,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        });
        await orderItem.save();
        console.log(`Created order item for order: ${itemData.order}`);
      }
    }

    console.log('\n=== Fake Data Summary ===');
    console.log(`Created ${createdOrders.length} orders`);
    console.log(`Created ${fakeOrderItems.length} order items`);

    // Show monthly totals
    const monthlyTotals = {};
    createdOrders.forEach(order => {
      const month = order.createdAt.getMonth() + 1;
      const year = order.createdAt.getFullYear();
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      if (!monthlyTotals[key]) {
        monthlyTotals[key] = { count: 0, total: 0 };
      }
      monthlyTotals[key].count++;
      monthlyTotals[key].total += order.totalPrice;
    });

    console.log('\n=== Monthly Summary ===');
    Object.keys(monthlyTotals)
      .sort()
      .forEach(month => {
        const data = monthlyTotals[month];
        console.log(`${month}: ${data.count} orders, ${data.total.toLocaleString()} VND`);
      });
  } catch (error) {
    console.error('Error generating fake data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

generateFakeData();
