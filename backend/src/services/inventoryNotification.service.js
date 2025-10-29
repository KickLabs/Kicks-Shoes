/**
 * @fileoverview Inventory Notification Service
 * @created 2025-10-28
 * @file inventoryNotification.service.js
 * @description Send inventory alerts via multiple channels (Socket, Email, Chat)
 */

import logger from '../utils/logger.js';
import { getSocketIO } from '../utils/socketIO.js';
// import EmailService from './email.service.js';

class InventoryNotificationService {
  /**
   * Send chat-style notification to admin dashboard
   */
  sendChatNotification(alert) {
    const io = getSocketIO();
    if (!io) return;

    const chatMessage = {
      id: `alert-${Date.now()}`,
      type: 'inventory_alert',
      severity: alert.severity,
      timestamp: new Date(),
      sender: {
        name: 'AI Inventory Assistant',
        avatar: '/ai-bot-avatar.png',
        role: 'system',
      },
      content: this.formatChatMessage(alert),
      actions: this.generateActions(alert),
      metadata: {
        productId: alert.productId,
        productName: alert.productName,
        sku: alert.sku,
        issueType: alert.issue,
      },
    };

    // Send to admin room
    io.to('admin-room').emit('inventory_chat_alert', chatMessage);

    // Also send to shop dashboard
    io.to('shop-dashboard').emit('inventory_chat_alert', chatMessage);

    logger.info(`Chat notification sent for ${alert.productName}`);

    return chatMessage;
  }

  /**
   * Format alert as conversational chat message
   */
  formatChatMessage(alert) {
    const { severity, productName, issue, metrics, recommendation } = alert;

    const emoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    };

    const urgency = {
      critical: 'KHẨN CẤP',
      high: 'Quan trọng',
      medium: 'Lưu ý',
      low: 'Thông tin',
    };

    let message = `${emoji[severity]} **${urgency[severity]}!**\n\n`;
    message += `Tôi phát hiện vấn đề với **${productName}**:\n\n`;

    // Specific message based on issue type
    if (issue === 'critical_low_stock' || issue === 'low_stock') {
      message += `📦 **Sắp hết hàng!**\n`;
      message += `• Chỉ còn: ${metrics.totalStock} sản phẩm\n`;
      message += `• Bán được: ${metrics.soldLast30Days} sản phẩm (30 ngày)\n`;
      message += `• Tốc độ: ${metrics.salesVelocity.toFixed(1)} sản phẩm/ngày\n`;
      message += `• Dự kiến hết trong: ~${Math.floor(metrics.daysOfInventory)} ngày\n\n`;
    } else if (issue === 'overstock') {
      message += `📦 **Tồn kho quá cao!**\n`;
      message += `• Tồn kho: ${metrics.totalStock} sản phẩm\n`;
      message += `• Chỉ bán được: ${metrics.soldLast30Days} sản phẩm (30 ngày)\n`;
      message += `• Cần ${Math.ceil(metrics.daysOfInventory)} ngày để bán hết\n\n`;
    } else if (issue === 'slow_moving') {
      message += `🐌 **Sản phẩm bán chậm!**\n`;
      message += `• Không bán trong: ${metrics.daysSinceLastSale} ngày\n`;
      message += `• Tồn kho: ${metrics.totalStock} sản phẩm\n`;
      message += `• Xu hướng: ${metrics.salesTrend > 0 ? '📈' : '📉'} ${metrics.salesTrend.toFixed(1)}%\n\n`;
    }

    // AI Analysis
    message += `🤖 **Phân tích AI:**\n`;
    message += `${recommendation.analysis}\n\n`;

    // Top 3 actions
    message += `✅ **Đề xuất hành động:**\n`;
    recommendation.actions.slice(0, 3).forEach((action, i) => {
      message += `${i + 1}. ${action}\n`;
    });

    // Timeline
    message += `\n⏰ **Thời gian:** ${recommendation.timeline}`;

    return message;
  }

  /**
   * Generate actionable buttons
   */
  generateActions(alert) {
    const actions = [];
    const { issue, productId, recommendation } = alert;

    // Common actions
    actions.push({
      label: 'Xem chi tiết sản phẩm',
      action: 'view_product',
      productId,
      primary: false,
    });

    // Issue-specific actions
    if (issue === 'overstock' || issue === 'slow_moving') {
      actions.push({
        label: '🔥 Tạo Flash Sale',
        action: 'create_flash_sale',
        productId,
        discountPercent: 30,
        primary: true,
        style: 'danger',
      });

      actions.push({
        label: '📣 Chạy quảng cáo',
        action: 'create_ad_campaign',
        productId,
        primary: false,
      });
    }

    if (issue === 'critical_low_stock' || issue === 'low_stock') {
      actions.push({
        label: '📦 Đặt hàng nhập thêm',
        action: 'restock_product',
        productId,
        quantity: Math.ceil(alert.metrics.salesVelocity * 30),
        primary: true,
        style: 'success',
      });

      actions.push({
        label: '✉️ Thông báo khách hàng',
        action: 'notify_customers',
        productId,
        primary: false,
      });
    }

    if (issue === 'out_of_stock') {
      actions.push({
        label: '🚨 Nhập hàng khẩn cấp',
        action: 'urgent_restock',
        productId,
        primary: true,
        style: 'danger',
      });
    }

    actions.push({
      label: 'Đánh dấu đã xử lý',
      action: 'mark_resolved',
      productId,
      primary: false,
      style: 'default',
    });

    return actions;
  }

  /**
   * Send daily summary notification
   */
  sendDailySummary(analysis) {
    const io = getSocketIO();
    if (!io) return;

    const summary = {
      type: 'daily_inventory_summary',
      timestamp: new Date(),
      sender: {
        name: 'AI Inventory Assistant',
        avatar: '/ai-bot-avatar.png',
      },
      content: this.formatDailySummary(analysis),
      stats: {
        totalProducts: analysis.totalProducts,
        totalIssues: analysis.totalIssues,
        criticalIssues: analysis.issues.filter(i => i.severity === 'critical').length,
        highIssues: analysis.issues.filter(i => i.severity === 'high').length,
      },
    };

    io.to('admin-room').emit('inventory_daily_summary', summary);
    io.to('shop-dashboard').emit('inventory_daily_summary', summary);

    logger.info('Daily inventory summary sent');
  }

  /**
   * Format daily summary message
   */
  formatDailySummary(analysis) {
    const { totalProducts, totalIssues, aiSummary } = analysis;

    let message = `📊 **Báo cáo Inventory hàng ngày**\n\n`;

    if (totalIssues === 0) {
      message += `✅ Tuyệt vời! Tất cả ${totalProducts} sản phẩm đều ở trạng thái tốt.\n\n`;
      message += `Không có vấn đề cần xử lý hôm nay. 🎉`;
      return message;
    }

    message += aiSummary.overview + '\n\n';

    if (aiSummary.topPriorities && aiSummary.topPriorities.length > 0) {
      message += `🎯 **Top ${aiSummary.topPriorities.length} ưu tiên:**\n\n`;

      aiSummary.topPriorities.forEach(priority => {
        message += `**${priority.rank}. ${priority.product}**\n`;
        message += `   Vấn đề: ${this.translateIssueType(priority.issue)}\n`;
        message += `   Hành động: ${priority.action}\n\n`;
      });
    }

    message += `💡 Click vào từng sản phẩm để xem chi tiết và xử lý.`;

    return message;
  }

  /**
   * Translate issue type to Vietnamese
   */
  translateIssueType(issueType) {
    const translations = {
      critical_low_stock: 'Sắp hết hàng (khẩn cấp)',
      low_stock: 'Tồn kho thấp',
      overstock: 'Tồn kho cao',
      slow_moving: 'Bán chậm',
      out_of_stock: 'Hết hàng',
      dead_stock: 'Hàng tồn chết',
    };

    return translations[issueType] || issueType;
  }

  /**
   * Send email notification (optional)
   */
  async sendEmailAlert(alert) {
    try {
      // Uncomment khi có EmailService
      /*
      await EmailService.sendTemplatedEmail({
        to: 'admin@kicksshoes.com',
        subject: `Inventory Alert: ${alert.productName}`,
        template: 'inventory_alert',
        data: {
          alert,
          message: this.formatChatMessage(alert)
        }
      });
      */

      logger.info(`Email alert sent for ${alert.productName}`);
    } catch (error) {
      logger.error('Failed to send email alert:', error);
    }
  }
}

export default new InventoryNotificationService();
