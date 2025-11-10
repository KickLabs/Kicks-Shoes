/**
 * @fileoverview Admin Analytics Service for admin dashboard queries
 * @created 2025-01-27
 * @file adminAnalyticsService.js
 * @description Service to handle admin-specific analytics and data queries
 */

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import logger from '../utils/logger.js';

export class AdminAnalyticsService {
  /**
   * Get revenue analytics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Revenue data
   */
  static async getRevenueAnalytics(options = {}) {
    try {
      const { startDate, endDate, period = 'month' } = options;

      // Build date filter
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Get orders with date filter
      const orders = await Order.find({
        status: { $in: ['completed', 'delivered'] },
        ...dateFilter,
      }).lean();

      // Calculate revenue metrics
      const totalRevenue = orders.reduce(
        (sum, order) => sum + (order.totalPrice || order.totalAmount || 0),
        0
      );
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Revenue by period
      const revenueByPeriod = {};
      orders.forEach(order => {
        const date = new Date(order.createdAt);
        let key;

        switch (period) {
          case 'day':
            key = date.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'year':
            key = date.getFullYear().toString();
            break;
          default:
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!revenueByPeriod[key]) {
          revenueByPeriod[key] = 0;
        }
        revenueByPeriod[key] += order.totalPrice || order.totalAmount || 0;
      });

      // Top selling products
      const productSales = {};
      orders.forEach(order => {
        order.items?.forEach(item => {
          if (!productSales[item.product]) {
            productSales[item.product] = { quantity: 0, revenue: 0 };
          }
          productSales[item.product].quantity += item.quantity || 0;
          productSales[item.product].revenue += (item.price || 0) * (item.quantity || 0);
        });
      });

      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(([productId, data]) => ({
          productId,
          ...data,
        }));

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        revenueByPeriod,
        topProducts,
        period,
        dateRange: { startDate, endDate },
      };
    } catch (error) {
      logger.error('Error getting revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get inventory analytics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Inventory data
   */
  static async getInventoryAnalytics(options = {}) {
    try {
      const { category, brand, lowStockThreshold = 10 } = options;

      // Build filter
      const filter = { status: true };
      if (category) filter.category = category;
      if (brand) filter.brand = brand;

      const products = await Product.find(filter).populate('category', 'name').lean();

      // Calculate inventory metrics
      const totalProducts = products.length;
      const totalStock = products.reduce((sum, product) => sum + (product.stock || 0), 0);
      const totalValue = products.reduce(
        (sum, product) => sum + product.finalPrice * (product.stock || 0),
        0
      );

      // Low stock products
      const lowStockProducts = products.filter(
        product => (product.stock || 0) <= lowStockThreshold
      );

      // Out of stock products
      const outOfStockProducts = products.filter(product => (product.stock || 0) === 0);

      // Stock by category
      const stockByCategory = {};
      products.forEach(product => {
        const categoryName = product.category?.name || 'Uncategorized';
        if (!stockByCategory[categoryName]) {
          stockByCategory[categoryName] = { count: 0, stock: 0, value: 0 };
        }
        stockByCategory[categoryName].count += 1;
        stockByCategory[categoryName].stock += product.stock || 0;
        stockByCategory[categoryName].value += product.finalPrice * (product.stock || 0);
      });

      // Stock by brand
      const stockByBrand = {};
      products.forEach(product => {
        const brand = product.brand || 'Unknown';
        if (!stockByBrand[brand]) {
          stockByBrand[brand] = { count: 0, stock: 0, value: 0 };
        }
        stockByBrand[brand].count += 1;
        stockByBrand[brand].stock += product.stock || 0;
        stockByBrand[brand].value += product.finalPrice * (product.stock || 0);
      });

      return {
        totalProducts,
        totalStock,
        totalValue,
        lowStockProducts: lowStockProducts.slice(0, 20), // Limit to 20
        outOfStockProducts: outOfStockProducts.slice(0, 20), // Limit to 20
        stockByCategory,
        stockByBrand,
        lowStockThreshold,
      };
    } catch (error) {
      logger.error('Error getting inventory analytics:', error);
      throw error;
    }
  }

  /**
   * Get customer analytics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Customer data
   */
  static async getCustomerAnalytics(options = {}) {
    try {
      const { startDate, endDate } = options;

      // Build date filter
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Get customers
      const customers = await User.find({
        role: 'customer',
        ...dateFilter,
      }).lean();

      // Get orders for customer analysis
      const orders = await Order.find({
        status: { $in: ['completed', 'delivered'] },
        ...dateFilter,
      })
        .populate('user', 'fullName email')
        .lean();

      // Calculate customer metrics
      const totalCustomers = customers.length;
      const totalOrders = orders.length;
      const averageOrdersPerCustomer = totalCustomers > 0 ? totalOrders / totalCustomers : 0;

      // Customer order distribution
      const customerOrderCounts = {};
      orders.forEach(order => {
        const customerId = order.user?._id;
        if (customerId) {
          customerOrderCounts[customerId] = (customerOrderCounts[customerId] || 0) + 1;
        }
      });

      const orderDistribution = {
        '1 order': 0,
        '2-5 orders': 0,
        '6-10 orders': 0,
        '10+ orders': 0,
      };

      Object.values(customerOrderCounts).forEach(count => {
        if (count === 1) orderDistribution['1 order']++;
        else if (count >= 2 && count <= 5) orderDistribution['2-5 orders']++;
        else if (count >= 6 && count <= 10) orderDistribution['6-10 orders']++;
        else orderDistribution['10+ orders']++;
      });

      // Top customers by order value
      const customerRevenue = {};
      orders.forEach(order => {
        const customerId = order.user?._id;
        if (customerId) {
          customerRevenue[customerId] =
            (customerRevenue[customerId] || 0) + (order.totalAmount || 0);
        }
      });

      const topCustomers = Object.entries(customerRevenue)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([customerId, revenue]) => {
          const customer = customers.find(c => c._id.toString() === customerId);
          return {
            customerId,
            name: customer?.fullName || 'Unknown',
            email: customer?.email || 'Unknown',
            revenue,
          };
        });

      return {
        totalCustomers,
        totalOrders,
        averageOrdersPerCustomer,
        orderDistribution,
        topCustomers,
        dateRange: { startDate, endDate },
      };
    } catch (error) {
      logger.error('Error getting customer analytics:', error);
      throw error;
    }
  }

  /**
   * Get sales analytics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Sales data
   */
  static async getSalesAnalytics(options = {}) {
    try {
      const { startDate, endDate, period = 'month' } = options;

      // Build date filter
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const orders = await Order.find({
        ...dateFilter,
      }).lean();

      // Sales by status
      const salesByStatus = {};
      orders.forEach(order => {
        const status = order.status || 'unknown';
        salesByStatus[status] = (salesByStatus[status] || 0) + 1;
      });

      // Sales by period
      const salesByPeriod = {};
      orders.forEach(order => {
        const date = new Date(order.createdAt);
        let key;

        switch (period) {
          case 'day':
            key = date.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'year':
            key = date.getFullYear().toString();
            break;
          default:
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!salesByPeriod[key]) {
          salesByPeriod[key] = 0;
        }
        salesByPeriod[key] += 1;
      });

      // Conversion rate (assuming we have cart abandonment data)
      const completedOrders = orders.filter(order =>
        ['completed', 'delivered'].includes(order.status)
      ).length;
      const conversionRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0;

      return {
        totalOrders: orders.length,
        completedOrders,
        conversionRate,
        salesByStatus,
        salesByPeriod,
        period,
        dateRange: { startDate, endDate },
      };
    } catch (error) {
      logger.error('Error getting sales analytics:', error);
      throw error;
    }
  }

  /**
   * Parse admin query and determine what analytics to fetch
   * @param {string} message - User message
   * @returns {Promise<Object>} Analytics data based on query
   */
  static async parseAdminQuery(message) {
    try {
      const query = message.toLowerCase();

      // Determine query type
      if (
        query.includes('doanh thu') ||
        query.includes('revenue') ||
        query.includes('thống kê doanh thu')
      ) {
        return await this.getRevenueAnalytics();
      }

      if (
        query.includes('tồn kho') ||
        query.includes('inventory') ||
        query.includes('sản phẩm') ||
        query.includes('stock')
      ) {
        return await this.getInventoryAnalytics();
      }

      if (
        query.includes('khách hàng') ||
        query.includes('customer') ||
        query.includes('người dùng')
      ) {
        return await this.getCustomerAnalytics();
      }

      if (query.includes('bán hàng') || query.includes('sales') || query.includes('đơn hàng')) {
        return await this.getSalesAnalytics();
      }

      // Default to revenue if no specific query detected
      return await this.getRevenueAnalytics();
    } catch (error) {
      logger.error('Error parsing admin query:', error);
      throw error;
    }
  }

  /**
   * Generate AI response with admin analytics
   * @param {string} message - User message
   * @param {Object} analytics - Analytics data
   * @returns {string} AI response text
   */
  static generateAdminResponse(message, analytics, language = 'vi') {
    const locale = 'vi-VN';
    const formatCurrency = value => `${Number(value || 0).toLocaleString(locale)}đ`;
    const formatPercentage = value => `${Number(value || 0).toFixed(1)}%`;

    if (language === 'en') {
      let response = '📊 **Analytics Summary**\n\n';

      if (analytics.totalRevenue !== undefined) {
        response += `💰 **Revenue**\n`;
        response += `• Total revenue: ${formatCurrency(analytics.totalRevenue)}\n`;
        response += `• Total orders: ${analytics.totalOrders}\n`;
        response += `• Average order value: ${formatCurrency(analytics.averageOrderValue)}\n\n`;

        if (analytics.topProducts && analytics.topProducts.length > 0) {
          response += '🏆 **Top products**\n';
          analytics.topProducts.slice(0, 5).forEach((product, index) => {
            response += `${index + 1}. Product ID ${product.productId} – revenue ${formatCurrency(product.revenue)}\n`;
          });
          response += '\n';
        }
      }

      if (analytics.totalProducts !== undefined) {
        response += `📦 **Inventory**\n`;
        response += `• Total SKUs: ${analytics.totalProducts}\n`;
        response += `• Units in stock: ${analytics.totalStock}\n`;
        response += `• Stock value: ${formatCurrency(analytics.totalValue)}\n`;
        response += `• Low stock items: ${analytics.lowStockProducts.length}\n`;
        response += `• Out of stock items: ${analytics.outOfStockProducts.length}\n\n`;
      }

      if (analytics.totalCustomers !== undefined) {
        response += `👥 **Customers**\n`;
        response += `• Total customers: ${analytics.totalCustomers}\n`;
        response += `• Total orders: ${analytics.totalOrders}\n`;
        response += `• Avg orders per customer: ${analytics.averageOrdersPerCustomer?.toFixed(1) || '0.0'}\n\n`;
      }

      if (analytics.totalOrders !== undefined && analytics.completedOrders !== undefined) {
        response += `📈 **Sales performance**\n`;
        response += `• Total orders: ${analytics.totalOrders}\n`;
        response += `• Completed orders: ${analytics.completedOrders}\n`;
        response += `• Conversion rate: ${formatPercentage(analytics.conversionRate)}\n\n`;
      }

      response +=
        'Need deeper detail? Ask about revenue over time, stock by category, top customers, or sales status breakdowns.';
      return response;
    }

    let response = '📊 **Báo cáo phân tích dữ liệu:**\n\n';

    if (analytics.totalRevenue !== undefined) {
      response += `💰 **Doanh thu:**\n`;
      response += `• Tổng doanh thu: ${formatCurrency(analytics.totalRevenue)}\n`;
      response += `• Tổng đơn hàng: ${analytics.totalOrders}\n`;
      response += `• Giá trị đơn hàng trung bình: ${formatCurrency(analytics.averageOrderValue)}\n\n`;

      if (analytics.topProducts && analytics.topProducts.length > 0) {
        response += `🏆 **Sản phẩm bán chạy:**\n`;
        analytics.topProducts.slice(0, 5).forEach((product, index) => {
          response += `${index + 1}. Sản phẩm ID ${product.productId} - Doanh thu ${formatCurrency(product.revenue)}\n`;
        });
        response += '\n';
      }
    }

    if (analytics.totalProducts !== undefined) {
      response += `📦 **Tồn kho:**\n`;
      response += `• Tổng sản phẩm: ${analytics.totalProducts}\n`;
      response += `• Tổng tồn kho: ${analytics.totalStock}\n`;
      response += `• Giá trị tồn kho: ${formatCurrency(analytics.totalValue)}\n`;
      response += `• Sản phẩm sắp hết: ${analytics.lowStockProducts.length}\n`;
      response += `• Sản phẩm hết hàng: ${analytics.outOfStockProducts.length}\n\n`;
    }

    if (analytics.totalCustomers !== undefined) {
      response += `👥 **Khách hàng:**\n`;
      response += `• Tổng khách hàng: ${analytics.totalCustomers}\n`;
      response += `• Tổng đơn hàng: ${analytics.totalOrders}\n`;
      response += `• Đơn hàng trung bình/khách: ${analytics.averageOrdersPerCustomer?.toFixed(1) || '0.0'}\n\n`;
    }

    if (analytics.totalOrders !== undefined && analytics.completedOrders !== undefined) {
      response += `📈 **Bán hàng:**\n`;
      response += `• Tổng đơn hàng: ${analytics.totalOrders}\n`;
      response += `• Đơn hàng hoàn thành: ${analytics.completedOrders}\n`;
      response += `• Tỷ lệ chuyển đổi: ${formatPercentage(analytics.conversionRate)}\n\n`;
    }

    response +=
      'Bạn muốn xem sâu hơn phần nào? Bạn có thể hỏi về doanh thu theo thời gian, tồn kho theo danh mục, khách hàng nổi bật, hoặc thống kê trạng thái đơn hàng.';

    return response;
  }
}

export default AdminAnalyticsService;
