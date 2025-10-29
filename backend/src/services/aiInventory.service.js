/**
 * @fileoverview AI Inventory Intelligence Service
 * @created 2025-10-28
 * @file aiInventory.service.js
 * @description AI-powered inventory analysis and recommendations
 */

import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';

class AIInventoryService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialize();

    // Thresholds for inventory alerts
    this.THRESHOLDS = {
      HIGH_STOCK: 50, // > 50 items = tồn kho nhiều
      LOW_STOCK: 10, // < 10 items = sắp hết hàng
      CRITICAL_STOCK: 3, // < 3 items = nguy cấp
      OVERSTOCK_RATIO: 3.0, // Tồn kho > 3x tốc độ bán = overstocked
      SLOW_MOVING_DAYS: 60, // Không bán trong 60 ngày = slow moving
    };
  }

  initialize() {
    try {
      if (process.env.GOOGLE_AI_API_KEY) {
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        logger.info('AI Inventory Service initialized');
      }
    } catch (error) {
      logger.error('Failed to initialize AI Inventory Service:', error);
    }
  }

  /**
   * Phân tích toàn bộ inventory và đưa ra recommendations
   */
  async analyzeAllInventory() {
    try {
      logger.info('Starting full inventory analysis...');

      // Lấy tất cả sản phẩm active
      const products = await Product.find({ status: true }).populate('category').lean();

      const issues = [];
      const recommendations = [];

      for (const product of products) {
        const analysis = await this.analyzeProduct(product);

        if (analysis.hasIssue) {
          issues.push({
            productId: product._id,
            productName: product.name,
            sku: product.sku,
            issue: analysis.issue,
            severity: analysis.severity,
            recommendation: analysis.recommendation,
            metrics: analysis.metrics,
          });

          recommendations.push(analysis.recommendation);
        }
      }

      // AI tổng hợp và prioritize
      const aiSummary = await this.generateAISummary(issues);

      return {
        timestamp: new Date(),
        totalProducts: products.length,
        totalIssues: issues.length,
        issues: issues.sort((a, b) => {
          const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        }),
        aiSummary,
        recommendations,
      };
    } catch (error) {
      logger.error('Error analyzing inventory:', error);
      throw error;
    }
  }

  /**
   * Phân tích 1 sản phẩm cụ thể
   */
  async analyzeProduct(product) {
    try {
      // Calculate metrics
      const metrics = await this.calculateProductMetrics(product);

      // Detect issues
      const issue = this.detectInventoryIssue(metrics);

      if (!issue) {
        return { hasIssue: false };
      }

      // Generate AI recommendation
      const recommendation = await this.generateRecommendation(product, metrics, issue);

      return {
        hasIssue: true,
        issue: issue.type,
        severity: issue.severity,
        metrics,
        recommendation,
      };
    } catch (error) {
      logger.error(`Error analyzing product ${product._id}:`, error);
      return { hasIssue: false };
    }
  }

  /**
   * Tính toán các metrics quan trọng
   */
  async calculateProductMetrics(product) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

    // Tổng tồn kho
    const totalStock = product.stock || 0;

    // Đã bán (30 ngày gần đây)
    const recentSales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $in: ['completed', 'processing', 'shipped'] },
        },
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.product': product._id,
        },
      },
      {
        $group: {
          _id: null,
          totalSold: { $sum: '$items.quantity' },
        },
      },
    ]);

    const soldLast30Days = recentSales[0]?.totalSold || 0;

    // Sales velocity (đơn vị/ngày)
    const salesVelocity = soldLast30Days / 30;

    // Days of inventory left
    const daysOfInventory = salesVelocity > 0 ? totalStock / salesVelocity : 999;

    // Ngày bán gần nhất
    const lastSale = await Order.findOne({
      'items.product': product._id,
      status: { $in: ['completed', 'processing', 'shipped'] },
    })
      .sort({ createdAt: -1 })
      .select('createdAt');

    const daysSinceLastSale = lastSale
      ? Math.floor((now - lastSale.createdAt) / (24 * 60 * 60 * 1000))
      : 999;

    // Sales trend (so sánh 30 ngày vs 60 ngày trước)
    const salesLast60Days = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
          status: { $in: ['completed', 'processing', 'shipped'] },
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.product': product._id } },
      { $group: { _id: null, totalSold: { $sum: '$items.quantity' } } },
    ]);

    const soldPrevious30Days = salesLast60Days[0]?.totalSold || 0;
    const salesTrend =
      soldPrevious30Days > 0
        ? ((soldLast30Days - soldPrevious30Days) / soldPrevious30Days) * 100
        : soldLast30Days > 0
          ? 100
          : 0;

    // Stock turnover ratio
    const turnoverRatio = soldLast30Days > 0 ? totalStock / soldLast30Days : 999;

    return {
      totalStock,
      soldLast30Days,
      salesVelocity,
      daysOfInventory,
      daysSinceLastSale,
      salesTrend,
      turnoverRatio,
      price: product.finalPrice,
      isOnSale: product.price?.isOnSale || false,
    };
  }

  /**
   * Phát hiện vấn đề inventory
   */
  detectInventoryIssue(metrics) {
    const { totalStock, salesVelocity, daysSinceLastSale, daysOfInventory, turnoverRatio } =
      metrics;

    // CRITICAL: Sắp hết hàng
    if (totalStock > 0 && totalStock <= this.THRESHOLDS.CRITICAL_STOCK && salesVelocity > 0.5) {
      return {
        type: 'critical_low_stock',
        severity: 'critical',
        message: `Chỉ còn ${totalStock} sản phẩm! Sắp hết hàng.`,
      };
    }

    // HIGH: Tồn kho thấp
    if (totalStock > 0 && totalStock <= this.THRESHOLDS.LOW_STOCK && salesVelocity > 0.3) {
      return {
        type: 'low_stock',
        severity: 'high',
        message: `Tồn kho thấp (${totalStock} sản phẩm), cần nhập thêm.`,
      };
    }

    // HIGH: Tồn kho quá cao
    if (
      totalStock > this.THRESHOLDS.HIGH_STOCK &&
      turnoverRatio > this.THRESHOLDS.OVERSTOCK_RATIO
    ) {
      return {
        type: 'overstock',
        severity: 'high',
        message: `Tồn kho quá cao (${totalStock} sản phẩm). Bán chậm.`,
      };
    }

    // MEDIUM: Slow moving
    if (daysSinceLastSale > this.THRESHOLDS.SLOW_MOVING_DAYS && totalStock > 20) {
      return {
        type: 'slow_moving',
        severity: 'medium',
        message: `Không bán được trong ${daysSinceLastSale} ngày.`,
      };
    }

    // MEDIUM: Hết hàng hoàn toàn
    if (totalStock === 0 && salesVelocity > 1) {
      return {
        type: 'out_of_stock',
        severity: 'medium',
        message: 'Hết hàng hoàn toàn. Sản phẩm bán chạy.',
      };
    }

    // LOW: Dead stock
    if (totalStock > 10 && daysSinceLastSale > 90) {
      return {
        type: 'dead_stock',
        severity: 'low',
        message: `Không bán được trong ${daysSinceLastSale} ngày. Có thể ngừng kinh doanh.`,
      };
    }

    return null;
  }

  /**
   * AI tạo recommendation chi tiết
   */
  async generateRecommendation(product, metrics, issue) {
    try {
      const prompt = `
Bạn là AI chuyên gia quản lý inventory cho cửa hàng giày và thời trang.

THÔNG TIN SẢN PHẨM:
- Tên: ${product.name}
- SKU: ${product.sku}
- Giá: ${metrics.price.toLocaleString()}đ
- Tồn kho hiện tại: ${metrics.totalStock} sản phẩm
- Đã bán (30 ngày): ${metrics.soldLast30Days} sản phẩm
- Tốc độ bán: ${metrics.salesVelocity.toFixed(2)} sản phẩm/ngày
- Xu hướng bán hàng: ${metrics.salesTrend > 0 ? '+' : ''}${metrics.salesTrend.toFixed(1)}%
- Ngày còn lại trước khi hết: ${Math.floor(metrics.daysOfInventory)} ngày
- Ngày chưa bán: ${metrics.daysSinceLastSale} ngày
- Đang sale: ${metrics.isOnSale ? 'Có' : 'Không'}

VẤN ĐỀ PHÁT HIỆN:
Loại: ${issue.type}
Mức độ: ${issue.severity}
Mô tả: ${issue.message}

HÃY ĐƯA RA:
1. **Phân tích:** Giải thích chi tiết vấn đề (2-3 câu)
2. **Hành động đề xuất:** Danh sách cụ thể cần làm gì (3-5 điểm)
3. **Chiến lược giá:** Gợi ý về giá/discount (nếu cần)
4. **Timeline:** Nên thực hiện khi nào
5. **Dự đoán:** Kết quả mong đợi

Format JSON:
{
  "analysis": "...",
  "actions": ["...", "..."],
  "pricingStrategy": "...",
  "timeline": "...",
  "expectedOutcome": "..."
}
`;

      if (!this.model) {
        return this.getFallbackRecommendation(issue.type, metrics);
      }

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Parse JSON từ response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiRecommendation = JSON.parse(jsonMatch[0]);
        return {
          ...aiRecommendation,
          issueType: issue.type,
          severity: issue.severity,
        };
      }

      return this.getFallbackRecommendation(issue.type, metrics);
    } catch (error) {
      logger.error('Error generating AI recommendation:', error);
      return this.getFallbackRecommendation(issue.type, metrics);
    }
  }

  /**
   * Fallback recommendation nếu AI không available
   */
  getFallbackRecommendation(issueType, metrics) {
    const recommendations = {
      critical_low_stock: {
        analysis: `Sản phẩm sắp hết hàng (${metrics.totalStock} sản phẩm) với tốc độ bán ${metrics.salesVelocity.toFixed(1)}/ngày. Cần nhập hàng gấp!`,
        actions: [
          'Liên hệ nhà cung cấp ngay để đặt hàng',
          `Đặt tối thiểu ${Math.ceil(metrics.salesVelocity * 30)} sản phẩm cho 30 ngày`,
          'Tạm ẩn sản phẩm nếu không nhập kịp',
          'Gửi email thông báo cho khách "sắp về hàng"',
        ],
        pricingStrategy: 'Giữ nguyên giá. Không tăng giá vì sắp hết.',
        timeline: 'NGAY LẬP TỨC (trong 24h)',
        expectedOutcome: 'Tránh mất doanh thu từ sản phẩm bán chạy',
      },
      low_stock: {
        analysis: `Tồn kho thấp (${metrics.totalStock} sản phẩm). Cần bổ sung trước khi hết hàng.`,
        actions: [
          'Kiểm tra lead time nhà cung cấp',
          `Đặt hàng ${Math.ceil(metrics.salesVelocity * 45)} sản phẩm`,
          'Set up thông báo tự động khi < 5 sản phẩm',
        ],
        pricingStrategy: 'Giữ giá hiện tại',
        timeline: 'Trong 3-5 ngày',
        expectedOutcome: 'Đảm bảo không bị out of stock',
      },
      overstock: {
        analysis: `Tồn kho quá cao (${metrics.totalStock} sản phẩm) so với tốc độ bán (${metrics.salesVelocity.toFixed(1)}/ngày). Cần xử lý.`,
        actions: [
          `Tạo flash sale giảm 20-30% trong 7 ngày`,
          'Chạy quảng cáo Facebook/Google cho sản phẩm này',
          'Bundle với sản phẩm khác',
          'Đưa vào chương trình "Mua 2 giảm 15%"',
          'Consider thanh lý nếu không bán được sau 30 ngày',
        ],
        pricingStrategy: `Giảm từ ${metrics.price.toLocaleString()}đ xuống ${Math.floor(metrics.price * 0.7).toLocaleString()}đ (-30%)`,
        timeline: 'Bắt đầu trong tuần này',
        expectedOutcome: `Giảm tồn kho xuống còn ${Math.ceil(metrics.totalStock * 0.4)} sản phẩm trong 30 ngày`,
      },
      slow_moving: {
        analysis: `Sản phẩm không bán trong ${metrics.daysSinceLastSale} ngày. Có thể là vấn đề về giá, marketing, hoặc sản phẩm lỗi thời.`,
        actions: [
          'Kiểm tra giá đối thủ - có thể giá cao hơn',
          'Chụp lại ảnh sản phẩm chất lượng cao hơn',
          'Viết lại description hấp dẫn hơn',
          'Tạo video review/unboxing',
          'Flash sale 40% trong 3 ngày để test',
        ],
        pricingStrategy: `Giảm giá test: ${Math.floor(metrics.price * 0.6).toLocaleString()}đ (-40%)`,
        timeline: 'Test trong 7 ngày',
        expectedOutcome: 'Xác định có nên tiếp tục kinh doanh sản phẩm này không',
      },
      out_of_stock: {
        analysis: 'Hết hàng hoàn toàn nhưng sản phẩm bán chạy. Đang mất doanh thu!',
        actions: [
          'Nhập hàng gấp từ nhà cung cấp',
          'Tạo form "Thông báo khi có hàng"',
          'Gửi email marketing khi về hàng',
          'Tạm thời suggest sản phẩm thay thế',
        ],
        pricingStrategy: 'Có thể tăng giá 5-10% khi về hàng (nếu demand cao)',
        timeline: 'Trong 1-2 ngày',
        expectedOutcome: 'Đáp ứng nhu cầu khách hàng, tăng doanh thu',
      },
      dead_stock: {
        analysis: `Hàng tồn chết. Không bán trong ${metrics.daysSinceLastSale} ngày. Cần thanh lý.`,
        actions: [
          'Thanh lý giảm 50-70%',
          'Bán bundle "3 sản phẩm giá 1"',
          'Quyên góp từ thiện (tax deduction)',
          'Ngừng kinh doanh mẫu này',
          'Phân tích lý do thất bại để học kinh nghiệm',
        ],
        pricingStrategy: `Thanh lý: ${Math.floor(metrics.price * 0.3).toLocaleString()}đ (-70%)`,
        timeline: 'Bắt đầu ngay, kết thúc trong 14 ngày',
        expectedOutcome: 'Thu hồi vốn, giải phóng kho',
      },
    };

    return recommendations[issueType] || recommendations.slow_moving;
  }

  /**
   * AI tạo summary tổng quan
   */
  async generateAISummary(issues) {
    if (!issues || issues.length === 0) {
      return {
        overview: '✅ Inventory đang trong tình trạng tốt! Không phát hiện vấn đề nghiêm trọng.',
        topPriorities: [],
        estimatedImpact: {
          revenue: 0,
          cost: 0,
        },
      };
    }

    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;

    const overview = `
Phát hiện ${issues.length} vấn đề inventory:
- 🔴 Critical: ${criticalCount}
- 🟠 High: ${highCount}
- 🟡 Medium: ${issues.filter(i => i.severity === 'medium').length}
- 🟢 Low: ${issues.filter(i => i.severity === 'low').length}

Cần xử lý ngay ${criticalCount + highCount} sản phẩm ưu tiên cao!
    `.trim();

    const topPriorities = issues.slice(0, 5).map((issue, index) => ({
      rank: index + 1,
      product: issue.productName,
      issue: issue.issue,
      action: issue.recommendation.actions[0],
    }));

    return {
      overview,
      topPriorities,
      timestamp: new Date(),
    };
  }

  /**
   * Gửi alerts qua các kênh
   */
  async sendInventoryAlerts(analysis) {
    const alerts = [];

    for (const issue of analysis.issues) {
      // Chỉ gửi alert cho critical và high severity
      if (issue.severity === 'critical' || issue.severity === 'high') {
        const alert = {
          type: 'inventory_alert',
          severity: issue.severity,
          productId: issue.productId,
          productName: issue.productName,
          sku: issue.sku,
          issue: issue.issue,
          message: this.formatAlertMessage(issue),
          recommendation: issue.recommendation,
          metrics: issue.metrics, // ADD metrics for notification service
          timestamp: new Date(),
        };

        alerts.push(alert);

        // Gửi qua các channels
        await this.sendToChannels(alert);
      }
    }

    return alerts;
  }

  /**
   * Format alert message
   */
  formatAlertMessage(issue) {
    const emoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    };

    return `
${emoji[issue.severity]} **INVENTORY ALERT**

Sản phẩm: **${issue.productName}**
SKU: ${issue.sku}
Vấn đề: ${issue.issue}

${issue.metrics.totalStock} sản phẩm còn lại
Bán: ${issue.metrics.soldLast30Days} sản phẩm (30 ngày)

🤖 AI Recommendation:
${issue.recommendation.analysis}

✅ Hành động đề xuất:
${issue.recommendation.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Timeline: ${issue.recommendation.timeline}
    `.trim();
  }

  /**
   * Gửi alerts qua các channels (Chat, Email, Telegram...)
   */
  async sendToChannels(alert) {
    try {
      // 1. Send chat notification via Socket.IO
      const inventoryNotificationService = (await import('./inventoryNotification.service.js'))
        .default;
      inventoryNotificationService.sendChatNotification(alert);

      // 2. Save to database for dashboard (TODO: implement InventoryAlert model)
      // await InventoryAlert.create(alert);

      // 3. Send email to admins (TODO: implement when needed)
      // await inventoryNotificationService.sendEmailAlert(alert);

      // 4. Send to Telegram bot (if configured)
      // await TelegramService.sendMessage(alert.message);

      logger.info(`Inventory alert sent: ${alert.productName} - ${alert.issue}`);
    } catch (error) {
      logger.error('Error sending inventory alerts:', error);
    }
  }

  /**
   * Tạo flash sale tự động cho sản phẩm overstock
   */
  async createAutoFlashSale(productId, discountPercent = 30) {
    try {
      const product = await Product.findById(productId);
      if (!product) return null;

      // Tạo flash sale 7 ngày
      const flashSale = {
        productId: product._id,
        originalPrice: product.finalPrice,
        flashPrice: Math.floor(product.finalPrice * (1 - discountPercent / 100)),
        discountPercent,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        reason: 'AI Auto-generated: Overstock clearance',
        autoGenerated: true,
      };

      // Import FlashSale model and create
      const FlashSale = (await import('../models/FlashSale.js')).default;
      const created = await FlashSale.create(flashSale);

      logger.info(
        `Auto flash sale created for ${product.name}: ${discountPercent}% off for 7 days`
      );

      return created;
    } catch (error) {
      logger.error('Error creating auto flash sale:', error);
      return null;
    }
  }
}

export default new AIInventoryService();
