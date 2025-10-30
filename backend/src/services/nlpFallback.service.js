// services/nlpFallback.service.js
import logger from '../utils/logger.js';
import Product from '../models/Product.js';

class NLPFallbackService {
  constructor() {
    logger.info('NLP Fallback Service initialized.');
  }

  /**
   * Deterministic fallback answer when AI model is unavailable or fails.
   * This method now explicitly handles rule-based answers.
   */
  async generateRuleBasedAnswer(question, context = {}) {
    const q = (question || '').toLowerCase();

    // Order format guidance (VN and EN keywords)
    if (
      /(cách|làm sao|đặt|chốt).*\b(hàng|order|mua|chốt)\b/.test(q) ||
      /how.*(order|buy)/.test(q) ||
      q.includes('cách chốt')
    ) {
      return (
        '📝 Cách đặt hàng trên livestream:\n' +
        '**Format:** chốt [số_lượng] [SKU] màu [màu] size [size] [SĐT]\n' +
        'Ví dụ:\n' +
        '• chốt 2 đôi HJ6777 màu black size 41 0386188917\n' +
        '• chốt 1 NK-AM-999 màu trắng size 42 0909123456\n' +
        'Bạn cho mình biết size và màu bạn muốn nhé!'
      );
    }

    // Shipping/COD
    if (/cod|ship|giao hàng|vận chuyển/.test(q)) {
      return '✅ Shop hỗ trợ COD toàn quốc. Phí ship 30k cho toàn quốc. Bạn muốn chốt sản phẩm nào ạ?';
    }

    // Size/stock
    if (/size|cỡ|kích thước/.test(q)) {
      return '🔎 Size còn hàng tùy màu/sản phẩm. Bạn cho mình biết mẫu và size bạn cần để mình kiểm tra nhanh nhé!';
    }

    // Pinned product quick intro if we have details
    if (context?.detailedProduct) {
      const p = context.detailedProduct;
      const price = p.price?.sale || p.price?.regular || p.price || 'N/A';
      const sizes = Array.isArray(p.variants?.sizes)
        ? p.variants.sizes.join(', ')
        : 'Đang cập nhật';
      const colors = Array.isArray(p.variants?.colors)
        ? p.variants.colors.join(', ')
        : 'Đang cập nhật';
      return (
        `👟 ${p.name} — Giới thiệu nhanh\n` +
        `• Giá: ${typeof price === 'number' ? price.toLocaleString('vi-VN') + 'đ' : price}\n` +
        `• Size: ${sizes}\n` +
        `• Màu: ${colors}\n` +
        `Bạn muốn mình tư vấn size/màu phù hợp không?`
      );
    }

    // Generic fallback
    const host = context.hostName || 'Shop';
    return `👋 ${host} sẵn sàng hỗ trợ! Bạn muốn hỏi về sản phẩm, size, màu, giá hay cách đặt hàng?`;
  }

  /**
   * Placeholder for more advanced NLP processing if needed in the future.
   * Currently, it just calls the rule-based answer.
   */
  async processNLP(question, context = {}) {
    logger.info('NLP Fallback: Processing question with rule-based system.');
    return this.generateRuleBasedAnswer(question, context);
  }
}

export default new NLPFallbackService();
