/**
 * @fileoverview Order Detection Service
 * @created 2025-01-15
 * @file orderDetection.service.js
 * @description Service to detect potential orders from livestream chat messages using Vietnamese patterns
 */

import PotentialOrder from '../models/PotentialOrder.js';
import { ProductService } from './product.service.js';
import logger from '../utils/logger.js';

class OrderDetectionService {
  constructor(potentialOrderModel = PotentialOrder) {
    this.PotentialOrder = potentialOrderModel;

    // Vietnamese phone number patterns
    this.phoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/g;

    // Order keywords in Vietnamese
    this.orderKeywords = [
      // Direct purchase intent
      'mua',
      'chốt',
      'đặt',
      'lấy',
      'order',
      'book',
      'đặt hàng',
      'đơn',

      // Interest/inquiry
      'có',
      'còn',
      'bao nhiêu',
      'giá',
      'price',
      'ship',

      // Confirmation words
      'ok',
      'oke',
      'được',
      'đồng ý',
      'yes',
      'có luôn',

      // Size/color related
      'size',
      'cỡ',
      'màu',
      'color',
      'số',

      // Quantity
      'đôi',
      'cái',
      'chiếc',
      'bộ',
      'combo',

      // Payment and shipping keywords
      'cod',
      'giao hàng',
      'thanh toán',
      'chuyển khoản',

      // Multi-word phrases
      'chốt đơn',
      'mua ngay',
      'ship gấp',
    ];

    // Size patterns (Vietnamese + English)
    this.sizePatterns = [
      // One size (check first)
      /(one\s*size|onesize)/i,

      // Clothing sizes (check before numeric to avoid matching digits in XL as 78)
      /size\s*([xsmlXSML]+)/i,
      /cỡ\s*([xsmlXSML]+)/i,
      /([xsmlXSML]+)\s*(?:size|cỡ)/i,

      // Shoe sizes
      /size\s*(\d{2})/i,
      /cỡ\s*(\d{2})/i,
      /số\s*(\d{2})/i,
      /(\d{2})\s*(?:size|cỡ|số)/i,
    ];

    // Color patterns (Vietnamese colors)
    this.colorPatterns = [
      /màu\s*(đen|trắng|đỏ|xanh|vàng|hồng|nâu|xám|cam|tím)/i,
      /color\s*(black|white|red|blue|yellow|pink|brown|gray|orange|purple)/i,
      /(đen|trắng|đỏ|xanh|vàng|hồng|nâu|xám|cam|tím)/i,
      /(black|white|red|blue|yellow|pink|brown|gray|orange|purple)/i,
    ];

    // Quantity patterns
    this.quantityPatterns = [
      /(\d+)\s*(?:đôi|cái|chiếc|bộ|combo)/i,
      /(?:đôi|cái|chiếc|bộ|combo)\s*(\d+)/i,
      /(\d+)\s*(?:pair|piece|set)/i,
    ];

    // SKU patterns: HJ6777 (2 letters + 4 digits), NK-HBP-101 (alphanum with dashes)
    this.skuPatterns = [/\b[A-Z]{2}[0-9]{4}\b/g, /\b[A-Z0-9]+(?:-[A-Z0-9]+)+\b/g];

    // High confidence phrases
    this.highConfidenceKeywords = [
      'chốt đơn',
      'đặt hàng',
      'mua ngay',
      'order ngay',
      'ship cho',
      'giao hàng',
      'thanh toán',
      'chuyển khoản',
      'cod',
    ];
  }

  /**
   * Analyze a chat message for potential order information
   * @param {Object} messageData - Chat message data
   * @param {Object} streamData - Stream information
   * @param {Object} userData - User information
   * @returns {Object|null} Detection result or null if no order detected
   */
  async analyzeMessage(messageData, streamData, userData) {
    try {
      // Validate input
      if (!messageData || !messageData.content || typeof messageData.content !== 'string') {
        return null;
      }

      const message = messageData.content.toLowerCase().trim();

      // Extract phone numbers
      const phoneNumbers = this.extractPhoneNumbers(messageData.content);

      // Check for order keywords
      const detectedKeywords = this.detectOrderKeywords(message);

      // Calculate base confidence
      let confidence = this.calculateConfidence(message, phoneNumbers, detectedKeywords);

      // Must have phone number and order keywords to be considered
      if (phoneNumbers.length === 0 || detectedKeywords.length === 0) {
        return null;
      }

      // Extract product information
      const productInfo = await this.extractProductInfo(messageData.content, streamData);

      // Boost confidence if product info found
      if (productInfo.size || productInfo.color || productInfo.productId) {
        confidence += 0.2;
      }

      // Must meet minimum confidence threshold
      if (confidence < 0.3) {
        return null;
      }

      const detectionResult = {
        isOrder: true,
        confidence: Math.min(confidence, 1.0),
        data: {
          customerInfo: {
            userId: userData._id,
            customerName: userData.username || userData.fullName,
            phoneNumber: phoneNumbers[0], // Use first phone number found
            phoneNumbers: phoneNumbers, // All phone numbers found
          },
          productInfo: {
            originalMessage: messageData.content,
            productId: productInfo.productId,
            extractedSize: productInfo.size,
            extractedColor: productInfo.color,
            extractedQuantity: productInfo.quantity,
            quantity: productInfo.quantity, // Alias for compatibility
          },
          detectionData: {
            confidence: Math.min(confidence, 1.0),
            detectedKeywords,
            phoneMatches: phoneNumbers,
            timestamp: new Date(),
          },
          streamId: streamData._id,
          roomId: streamData.roomId,
          chatMessageId: messageData._id,
        },
      };

      logger.info(`Order detected with confidence ${confidence.toFixed(2)}:`, {
        user: userData.username,
        message: messageData.content,
        phone: phoneNumbers[0],
        keywords: detectedKeywords,
      });

      return detectionResult;
    } catch (error) {
      logger.error('Error analyzing message for orders:', error);
      return null;
    }
  }

  /**
   * Extract phone numbers from message
   */
  extractPhoneNumbers(message) {
    const matches = message.match(this.phoneRegex);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Detect order-related keywords
   */
  detectOrderKeywords(message) {
    const detected = [];

    this.orderKeywords.forEach(keyword => {
      if (message.includes(keyword)) {
        detected.push(keyword);
      }
    });

    return detected;
  }

  /**
   * Calculate confidence score based on various factors
   */
  calculateConfidence(message, phoneNumbers, keywords) {
    let confidence = 0;

    // Base confidence for having phone + keywords
    if (phoneNumbers.length > 0 && keywords.length > 0) {
      confidence = 0.4;
    }

    // Boost for multiple keywords
    confidence += Math.min(keywords.length * 0.05, 0.2);

    // Boost for high confidence phrases
    this.highConfidenceKeywords.forEach(phrase => {
      if (message.includes(phrase)) {
        confidence += 0.3;
      }
    });

    // Boost for specific patterns
    if (message.includes('ship') || message.includes('giao')) {
      confidence += 0.1;
    }

    if (message.includes('cod') || message.includes('chuyển khoản')) {
      confidence += 0.2;
    }

    // Penalty for very short messages
    if (message.length < 10) {
      confidence -= 0.1;
    }

    // Cap confidence between 0 and 1
    return Math.max(0, Math.min(confidence, 1.0));
  }

  /**
   * Extract product information from message
   * Optimized version with early returns and better error handling
   */
  async extractProductInfo(rawMessage, streamData) {
    if (!rawMessage || typeof rawMessage !== 'string') {
      return {
        size: null,
        color: null,
        quantity: 1,
        productId: null,
      };
    }

    const message = rawMessage.toLowerCase();
    const result = {
      size: null,
      color: null,
      quantity: 1,
      productId: null,
    };

    try {
      // Parse composite pattern: chốt <qty> <unit> <SKU> màu <color> size <size|onesize>
      const hasColorKeyword = /màu|color/i.test(rawMessage);
      const hasSizeKeyword = /size|cỡ|số/i.test(rawMessage);

      if (hasColorKeyword && hasSizeKeyword) {
        const compositeRegex =
          /(chốt|dat|đặt|mua)?\s*(\d+)\s*(đôi|cái|chiếc|bộ|combo)?\s*([A-Z]{2,6}[0-9]{2,6}|[A-Z0-9]+(?:-[A-Z0-9]+)+)\s*(?:màu|color)\s*([a-zA-ZđĐáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]+)\s*(?:size|cỡ)?\s*(\d{2}|[XSML]{1,3}|ONE\s*SIZE|ONESIZE)?/i;
        const compositeMatch = compositeRegex.exec(rawMessage.toUpperCase());
        if (compositeMatch) {
          const qty = parseInt(compositeMatch[2]);
          if (!isNaN(qty)) result.quantity = qty;
          const skuCandidate = compositeMatch[4];
          if (skuCandidate) {
            const skuProduct = await ProductService.findOneBySku(skuCandidate);
            if (skuProduct) {
              result.productId = skuProduct._id;
            }
          }
          const clr = compositeMatch[5];
          if (clr) result.color = clr.toLowerCase();
          const sz = compositeMatch[6];
          if (sz) result.size = sz.replace(/\s+/g, '').toUpperCase();

          return result;
        }
      }

      // Extract size (fallbacks)
      for (const pattern of this.sizePatterns) {
        const match = pattern.exec(message);
        if (match) {
          const v = match[1] || match[0];
          result.size = v.toString().replace(/\s+/g, '').toUpperCase();
          break;
        }
      }

      // Extract color
      for (const pattern of this.colorPatterns) {
        const match = pattern.exec(message);
        if (match) {
          result.color = match[1];
          break;
        }
      }

      // Extract quantity
      for (const pattern of this.quantityPatterns) {
        const match = pattern.exec(message);
        if (match) {
          result.quantity = parseInt(match[1]) || 1;
          break;
        }
      }

      // Try to match SKU first - Skip if productId already set from composite pattern
      if (!result.productId) {
        const upper = rawMessage.toUpperCase();
        let matchedSku = null;

        // Optimize: Use single combined regex instead of loop
        // Flexible pattern: 2-6 letters followed by 2-6 numbers, or alphanumeric with dashes
        const combinedSkuPattern = /\b([A-Z]{2,6}[0-9]{2,6}|[A-Z0-9]+(?:-[A-Z0-9]+)+)\b/g;
        const skuMatches = upper.match(combinedSkuPattern);

        if (skuMatches && skuMatches.length > 0) {
          matchedSku = skuMatches[0]; // Use first match

          // Try base SKU first
          let skuProduct = await ProductService.findOneBySku(matchedSku);
          if (!skuProduct) {
            // Fallback to variant/inventory SKU
            skuProduct = await ProductService.findOneByInventorySku(matchedSku);
            // If inventory SKU matched and size/color not parsed yet, try to infer from inventory
            if (skuProduct && (!result.size || !result.color)) {
              const inv = (skuProduct.inventory || []).find(i => i.sku === matchedSku);
              if (inv) {
                if (!result.color && inv.color) result.color = String(inv.color).toLowerCase();
                if (!result.size) {
                  if (skuProduct.productType === 'shoes' && inv.size != null) {
                    result.size = String(inv.size);
                  } else if (skuProduct.productType === 'clothing' && inv.clothingSize) {
                    result.size = inv.clothingSize;
                  } else if (skuProduct.productType === 'accessory' && inv.isOneSize) {
                    result.size = 'ONESIZE';
                  }
                }
              }
            }
          }
          if (skuProduct) {
            result.productId = skuProduct._id;
          }
        }
      }

      // If not found by SKU, try to match with featured products in the stream
      // Optimize: Only check if productId not found yet
      if (
        !result.productId &&
        streamData &&
        streamData.featuredProducts &&
        streamData.featuredProducts.length > 0
      ) {
        const latestFeatured = streamData.featuredProducts[streamData.featuredProducts.length - 1];
        if (latestFeatured.productId) {
          // Quick check for reference keywords first (avoid DB call if not needed)
          const hasProductReference = /này|cái này|sản phẩm/i.test(message);

          if (hasProductReference) {
            // Check if message mentions the product
            const product = await ProductService.getProductById(
              latestFeatured.productId,
              'name brand'
            );

            if (product) {
              const productName = product.name.toLowerCase();
              const productBrand = product.brand?.toLowerCase();

              if (
                message.includes(productName) ||
                (productBrand && message.includes(productBrand)) ||
                hasProductReference
              ) {
                result.productId = product._id;
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error extracting product info:', error);
    }

    return result;
  }

  /**
   * Save potential order to database
   */
  async savePotentialOrder(detectionResult) {
    try {
      const potentialOrder = new this.PotentialOrder(detectionResult.data);
      await potentialOrder.save();

      logger.info(`Potential order saved:`, {
        id: potentialOrder._id,
        customer: potentialOrder.customerInfo.customerName,
        phone: potentialOrder.customerInfo.phoneNumber,
      });

      return potentialOrder;
    } catch (error) {
      logger.error('Error saving potential order:', error);
      throw error;
    }
  }

  /**
   * Get pending orders for a specific stream
   */
  async getPendingOrdersForStream(streamId) {
    try {
      return await this.PotentialOrder.getPendingOrdersForStream(streamId);
    } catch (error) {
      logger.error('Error getting pending orders:', error);
      throw error;
    }
  }

  /**
   * Get orders for a specific host
   */
  async getOrdersForHost(hostId, limit = 50) {
    try {
      const orders = await this.PotentialOrder.getOrdersByHost(hostId, limit);
      return orders.filter(order => order.streamId); // Filter out orders where stream doesn't match host
    } catch (error) {
      logger.error('Error getting orders for host:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status, hostId, notes) {
    try {
      const order = await this.PotentialOrder.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      order.status = status;
      order.hostActions = order.hostActions || {};

      if (notes) {
        order.hostActions.notes = notes;
      }

      order.hostActions.confirmedBy = hostId;
      order.hostActions.confirmedAt = new Date();

      await order.save();

      logger.info(`Order status updated:`, {
        orderId,
        status,
        hostId,
        notes: notes || 'No notes',
      });

      return order;
    } catch (error) {
      logger.error('Error updating order status:', error);
      throw error;
    }
  }
}

export { OrderDetectionService };
export default new OrderDetectionService();
