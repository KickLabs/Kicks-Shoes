/**
 * @fileoverview AI Q&A Service for Livestream
 * @file aiQA.service.js
 * @description Detects questions in chat and generates AI answers using Gemini
 */

// Dynamic import of Google GenAI SDK to support both package names
import logger from '../utils/logger.js';
import Product from '../models/Product.js';

class AIQAService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialize();
  }

  async initialize() {
    try {
      const apiKey =
        process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        logger.warn('Google AI API key not configured. AI Q&A will be disabled.');
        return;
      }

      let GoogleGenerativeAIClass = null;
      try {
        ({ GoogleGenerativeAI: GoogleGenerativeAIClass } = await import('@google/generative-ai'));
      } catch (e1) {
        try {
          ({ GoogleGenerativeAI: GoogleGenerativeAIClass } = await import('@google/genai'));
        } catch (e2) {
          logger.warn('Google GenAI SDK not available. Skipping AI Q&A initialization.');
          return;
        }
      }

      this.genAI = new GoogleGenerativeAIClass(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      logger.info('AI Q&A Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI Q&A Service:', error);
    }
  }

  /**
   * Check if a message is a question or product inquiry/request
   */
  isQuestion(message) {
    if (!message || typeof message !== 'string') return false;

    const questionPatterns = [
      /\?$/, // Ends with ?
      /^(có|có thể|có không|được không|ok không)/i, // Vietnamese question starters
      /^(how|what|where|when|why|can|is|do|does)/i, // English question words
      /(như thế nào|thế nào|sao|ntn|bao nhiêu|mấy|có|được|ok)/i, // Vietnamese question words
      /(giá|size|màu|ship|cod|thanh toán|bao lâu|khi nào)/i, // Product-related questions

      // Request/Command patterns (imperative)
      /^(giới thiệu|tư vấn|cho biết|hỏi về|nói về|review|đánh giá)/i, // Vietnamese requests
      /(giới thiệu|tư vấn|cho biết|hỏi|review|đánh giá).*(sản phẩm|sp|giày|này|đó|kia|pin)/i, // Product intro requests
      /^(tell|show|explain|describe|introduce|review)/i, // English requests
      /(tell|show|explain|describe).*(product|shoe|this|that|pinned)/i, // English product requests

      // Order placement questions
      /(cách|làm sao|how to).*(đặt hàng|order|mua|chốt)/i, // How to order
      /^(đặt hàng|order|mua|chốt).*(thế nào|như thế nào|how)/i, // Order how
      /(format|form|cú pháp|syntax).*(đặt hàng|order|chốt)/i, // Order format
      /(viết|tạo|generate|gen).*(đơn|order|form).*(đặt hàng|order)/i, // Generate order
      /^(viết|tạo|gen).*(cho|giúp|dùm).*(đơn|form|đặt)/i, // Help write order

      // SKU questions
      /(sku|mã|code).*(là gì|bao nhiêu|gì|nào|what|which)/i, // What is SKU
      /^(cho biết|cho tôi|show me).*(sku|mã|code)/i, // Show SKU
      /(sản phẩm|sp|giày).*(sku|mã|code).*(gì|nào|what)/i, // Product SKU
      /^(sku|mã).*(sản phẩm|sp|này|đó|pin|featured)/i, // SKU of product
    ];

    return questionPatterns.some(pattern => pattern.test(message.trim()));
  }

  /**
   * Check if question is about pinned product or mentions featured product
   */
  isAboutPinnedProduct(message, context = {}) {
    if (!message || typeof message !== 'string') return false;

    const pinnedProductPatterns = [
      /(sản phẩm|sp).*(pin|đang pin|ghim|đang ghim)/i,
      /(pin|ghim).*(sản phẩm|sp)/i,
      /(sản phẩm|sp).*(này|đó|kia)/i,
      /(cái này|em này|đôi này)/i,
      /(tư vấn).*(sản phẩm|sp).*(pin|này|đang)/i,

      // Generic product intro requests (will trigger for any product mention)
      /^(giới thiệu|tư vấn|review|đánh giá|cho biết).*(sản phẩm|sp|giày)/i,
      /^(introduce|review|tell me about|describe|explain).*(product|shoe)/i,
    ];

    if (pinnedProductPatterns.some(pattern => pattern.test(message.trim()))) {
      return true;
    }

    // Check if message mentions any featured product name
    if (context.featuredProducts && context.featuredProducts.length > 0) {
      const messageLower = message.toLowerCase();
      return context.featuredProducts.some(fp => {
        const productName = fp.productId?.name || '';
        if (productName && messageLower.includes(productName.toLowerCase())) {
          return true;
        }
        return false;
      });
    }

    return false;
  }

  /**
   * Fetch detailed product information
   */
  async getProductDetails(productId) {
    try {
      if (!productId) return null;

      const product = await Product.findById(productId)
        .populate('brand', 'name')
        .populate('category', 'name')
        .lean();

      if (!product) return null;

      return {
        id: product._id,
        name: product.name,
        description: product.description,
        brand: product.brand?.name || 'Unknown',
        category: product.category?.name || 'Unknown',
        price: {
          regular: product.price?.regular,
          sale: product.price?.sale,
          discount: product.price?.discount,
        },
        variants: {
          colors: product.variants?.colors || [],
          sizes: product.variants?.sizes || [],
        },
        stock: product.stock || 0,
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
        features: product.features || [],
        materials: product.materials || [],
        images: product.images || [],
      };
    } catch (error) {
      logger.error('Error fetching product details:', error);
      return null;
    }
  }

  /**
   * Generate AI answer using Gemini
   */
  async generateAnswer(question, context = {}) {
    if (!this.model) {
      return null;
    }

    try {
      const {
        streamTitle = '',
        featuredProducts = [],
        hostName = 'Shop',
        streamDescription = '',
        pinnedProduct = null,
        detailedProduct = null,
      } = context;

      // Build context for AI
      const productsInfo = featuredProducts.map(p => ({
        name: p.productId?.name || 'Unknown',
        price: p.productId?.price?.regular || p.productId?.price || 'N/A',
        colors: p.productId?.variants?.colors || [],
        sizes: p.productId?.variants?.sizes || [],
      }));

      // Add detailed product info if available
      let detailedProductInfo = '';
      if (detailedProduct) {
        detailedProductInfo = `

SẢN PHẨM ĐANG PIN (THÔNG TIN CHI TIẾT):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 TÊN: ${detailedProduct.name}
🏷️ BRAND: ${detailedProduct.brand}
📁 CATEGORY: ${detailedProduct.category}

💰 GIÁ:
   - Giá gốc: ${detailedProduct.price.regular?.toLocaleString('vi-VN')}đ
   ${detailedProduct.price.sale ? `- Giá sale: ${detailedProduct.price.sale.toLocaleString('vi-VN')}đ` : ''}
   ${detailedProduct.price.discount ? `- Giảm: ${detailedProduct.price.discount}%` : ''}

🎨 MÀU SẮC: ${detailedProduct.variants.colors.join(', ') || 'Chưa cập nhật'}
📏 SIZE: ${detailedProduct.variants.sizes.join(', ') || 'Chưa cập nhật'}
📊 TỒN KHO: ${detailedProduct.stock} sản phẩm
⭐ ĐÁNH GIÁ: ${detailedProduct.rating}/5 (${detailedProduct.reviewCount} reviews)

📝 MÔ TẢ: ${detailedProduct.description || 'Chưa có mô tả'}

✨ ĐẶC ĐIỂM NỔI BẬT:
${detailedProduct.features.length > 0 ? detailedProduct.features.map(f => `   - ${f}`).join('\n') : '   - Chưa cập nhật'}

🧵 CHẤT LIỆU:
${detailedProduct.materials.length > 0 ? detailedProduct.materials.map(m => `   - ${m}`).join('\n') : '   - Chưa cập nhật'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
      }

      const systemPrompt = `
You are an AI Shopping Assistant for "${hostName}" shoe livestream.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📺 LIVESTREAM INFO:
- Title: ${streamTitle}
- Description: ${streamDescription}
${detailedProductInfo}

👟 FEATURED PRODUCTS:
${productsInfo.length > 0 ? JSON.stringify(productsInfo, null, 2) : 'No products featured yet'}

📦 SHOP POLICIES:
- COD: Available nationwide
- Shipping: 30,000đ (urban), 40,000đ (rural)
- Payment: COD, Bank Transfer, E-wallet
- Warranty: 6 months (manufacturer defects)
- Returns: 7 days (unused condition)

📝 ORDER FORMAT ON LIVESTREAM:
**Format:** chốt [quantity] [unit] [SKU] màu [color] size [size] [phone]

**Components:**
- quantity: positive integer (1, 2, 3...)
- unit: đôi/cái/chiếc/bộ/combo (optional)
- SKU: 2 letters + 4 digits (HJ6777) OR alphanumeric with dash (NK-HBP-101)
- color: Vietnamese (đen, trắng, đỏ, xanh, vàng, hồng, nâu, xám, cam, tím) OR English (black, white, red, blue, yellow, pink, brown, gray, orange, purple)
- size: Numbers (38-50 for shoes) OR Letters (XS, S, M, L, XL, XXL) OR onesize
- phone: Vietnamese mobile (03/05/07/08/09 + 8 digits)

**Examples:**
- chốt 2 đôi HJ6777 màu black size 41 0386188917
- chốt 1 NK-HBP-101 màu trắng size M 0901234567
- chốt 3 HJ6777 màu red onesize 0888888888
- mua 1 đôi HJ6777 màu blue size 40 0909999999

**Notes:**
- Case insensitive; SKU auto-uppercase
- Unit (đôi/cái) is optional
- If no SKU, system tries to match by product name
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 RESPONSE GUIDELINES:

1. **LANGUAGE DETECTION:**
   - If question is in Vietnamese → respond in Vietnamese
   - If question is in English → respond in English
   - Match the language of the user's question

2. **FORMATTING:**
   - Use **bold** for important info (prices, sizes, colors)
   - Use bullet points (•) for lists
   - Use emojis appropriately (👟💰⭐🔥✅)
   - Keep paragraphs short and scannable
   - Max length: 150 words (200 for pinned product analysis)

3. **GENERAL QUESTIONS:**
   - Ask about usage needs (running, office, casual?)
   - Suggest 2-3 products from featured list
   - Follow up on size/color preferences
   - End with friendly call-to-action

4. **PINNED PRODUCT CONSULTATION:**
   - DEEP ANALYSIS based on detailed data
   - Highlight pros/cons (brand, features, materials, rating)
   - Compare regular price vs sale price (if applicable)
   - Evaluate rating & review count
   - Check available sizes/colors and stock
   - Suggest use cases (running, office, casual...)
   - Give buying recommendation based on data
   - Format with sections and bullet points

5. **PRODUCT QUERIES:**
   - Check product info before answering
   - If info unavailable: "Please wait for host to introduce"
   - Always verify variants (size/color) from data
   - Never fabricate information

6. **ORDER FORMAT QUESTIONS:**
   - If asked "how to order" or "order format":
     * Show the format clearly with example
     * Keep it concise (2-3 examples max)
     * Emphasize key parts: SKU, màu, size, phone
   - If asked to "generate order" or "write order form":
     * Use featured product info (SKU from context if available)
     * Ask for missing info: size, color, phone
     * Generate correct format: chốt [qty] [SKU] màu [color] size [size] [phone]
   - If asked "SKU là gì" or "what is SKU":
     * List all featured products with their SKUs
     * Format: Product Name → SKU
     * Keep it concise and scannable
     * If asking about specific product, show only that SKU
   - Match user's language (Vietnamese/English)

7. **TONE:**
   - Friendly, helpful, professional
   - Enthusiastic about good deals
   - Honest about limitations
   - Build trust with data-backed answers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 RESPONSE EXAMPLES:

**Example 1 - Vietnamese COD question:**
Question: "Có ship COD không?"
Response: "✅ Shop hỗ trợ COD toàn quốc bạn nhé! Phí ship 30k toàn quốc bạn nhé. Bạn muốn đặt hàng không? 😊"

**Example 2 - English product inquiry:**
Question: "Do you have size 42?"
Response: "🔍 Yes! This product is available in sizes 38-43. Size 42 is in stock. Which color would you prefer? 👟"

**Example 3 - Vietnamese pinned product analysis:**
Question: "Tư vấn sản phẩm đang pin"
Response: 
"👟 **Nike Air Zoom Pegasus 40** - Excellent running shoes!

✨ **Key Highlights:**
• Superior bounce with Zoom Air technology
• Lightweight at 280g, highly breathable
• **Rating: 4.8⭐** (2,341 reviews) - highly trusted!
• Premium mesh material, water-resistant

💰 **GREAT DEAL:**
Regular: 2,400,000đ
→ **SALE: 1,920,000đ** (Save 20%! 🔥)

📊 **Availability:**
• Sizes: 39, 40, 41, 42, 43
• Colors: Black, White, Navy Blue
• Stock: 50 pairs

🎯 **Recommendation:**
Perfect for long-distance running and marathons. This price is excellent for the quality! **Highly recommend** if you run regularly! ✅

What size would you like? 😊"

**Example 4 - English general consultation:**
Question: "I need shoes for work"
Response: "👔 Great! For office/work shoes, I'd recommend checking out our business casual collection. 

What's your style preference?
• Classic leather dress shoes?
• Smart casual sneakers?
• Comfortable loafers?

Also, what's your size? I'll help you find the perfect pair! 😊"

**Example 5 - Vietnamese order format question:**
Question: "cách đặt hàng thế nào?"
Response: "📝 **Cách đặt hàng trên livestream:**

**Format:**
chốt [số_lượng] [SKU] màu [màu] size [size] [SĐT]

**Ví dụ:**
• chốt 2 đôi HJ6777 màu black size 41 0386188917
• chốt 1 NK-HBP-101 màu trắng size M 0901234567

**Lưu ý:**
✓ SKU: mã sản phẩm (VD: HJ6777, NK-HBP-101)
✓ Màu: tiếng Việt hoặc tiếng Anh
✓ Size: số (38-50) hoặc chữ (S, M, L, XL)
✓ SĐT: số di động Việt Nam (bắt đầu 03/05/07/08/09)

Bạn cần mình viết form đặt hàng cho sản phẩm nào không? 😊"

**Example 6 - Generate order form:**
Question: "viết cho tôi form đặt hàng Nike Air Max"
Context: Featured product "Nike Air Max" with SKU "NK-AM-999"
Response: "✅ **Form đặt hàng cho Nike Air Max:**

chốt 1 đôi NK-AM-999 màu [MÀU_BẠN_MUỐN] size [SIZE_BẠN_MUỐN] [SỐ_ĐIỆN_THOẠI]

**Bạn cần điền:**
• Màu: đen, trắng, xanh, đỏ... (hoặc black, white, blue, red...)
• Size: 38, 39, 40, 41, 42, 43...
• SĐT: số điện thoại của bạn

**Ví dụ hoàn chỉnh:**
chốt 1 đôi NK-AM-999 màu black size 42 0909123456

Bạn cho mình biết size và màu, mình sẽ viết form hoàn chỉnh! 👟"

**Example 7 - SKU inquiry (all products):**
Question: "cho tôi SKU các sản phẩm"
Context: Featured products: [Nike Air Max (NK-AM-999), Adidas Ultraboost (AD-UB-2024), Jordan 3 Mid (JD-3M-777)]
Response: "📋 **SKU các sản phẩm đang giới thiệu:**

👟 **Nike Air Max** → NK-AM-999
👟 **Adidas Ultraboost** → AD-UB-2024
👟 **Jordan 3 Mid** → JD-3M-777

Copy SKU vào form đặt hàng nhé! 
Format: chốt [số_lượng] [SKU] màu [màu] size [size] [SĐT] 😊"

**Example 8 - SKU inquiry (specific product):**
Question: "SKU Nike Air Max là gì?"
Context: Featured product "Nike Air Max" with SKU "NK-AM-999"
Response: "✅ **SKU của Nike Air Max:**

NK-AM-999

**Form đặt hàng:**
chốt 1 đôi NK-AM-999 màu [màu] size [size] [SĐT]

Bạn muốn đặt hàng không? Cho mình biết size và màu nhé! 👟"

**Example 9 - SKU of pinned product:**
Question: "mã sản phẩm đang pin là gì?"
Context: Pinned product "Jordan 3 Mid TD 1" with SKU "JD-3M-TD1"
Response: "📌 **Mã sản phẩm đang pin:**

**Jordan 3 Mid TD 1** → JD-3M-TD1

**Để đặt hàng:**
chốt [số_lượng] JD-3M-TD1 màu [màu] size [size] [SĐT]

**Ví dụ:**
chốt 1 đôi JD-3M-TD1 màu black size 42 0909123456

Ready để order chưa? 🎉"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Remember: Always match the user's language and format responses clearly!
`;

      const prompt = `${systemPrompt}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nQUESTION: ${question}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nYOUR RESPONSE (remember to match question language):`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text().trim();

      logger.info('AI Q&A generated answer:', {
        question: question.substring(0, 50),
        answerLength: answer.length,
      });

      return answer;
    } catch (error) {
      logger.error('Error generating AI answer:', error);
      return null;
    }
  }

  /**
   * Process a chat message and generate answer if it's a question
   */
  async processMessage(message, context = {}) {
    try {
      const messageContent = message.content || message.text || message;

      // Check if it's a question
      if (!this.isQuestion(messageContent)) {
        return null;
      }

      // Enhanced context for pinned product
      let enhancedContext = { ...context };

      // Check if question is about pinned product (pass context to check product name mentions)
      if (this.isAboutPinnedProduct(messageContent, context)) {
        logger.info('Question is about pinned/featured product, fetching detailed info...');

        // Try to find mentioned product or use most recently featured
        let targetProduct = null;

        // Check if specific product name is mentioned
        if (context.featuredProducts && context.featuredProducts.length > 0) {
          const messageLower = messageContent.toLowerCase();

          // Try to find product by name mention
          targetProduct = context.featuredProducts.find(fp => {
            const productName = fp.productId?.name || '';
            return productName && messageLower.includes(productName.toLowerCase());
          });

          // If no specific product mentioned, use pinned or most recent
          if (!targetProduct) {
            targetProduct =
              context.featuredProducts.find(fp => fp.isPinned) ||
              context.featuredProducts[context.featuredProducts.length - 1];
          }
        }

        if (targetProduct?.productId) {
          const productId = targetProduct.productId._id || targetProduct.productId;
          const detailedProduct = await this.getProductDetails(productId);

          if (detailedProduct) {
            enhancedContext.pinnedProduct = targetProduct;
            enhancedContext.detailedProduct = detailedProduct;
            logger.info('Detailed product info fetched:', detailedProduct.name);
          }
        }
      }

      // Generate answer
      const answer = await this.generateAnswer(messageContent, enhancedContext);

      if (!answer) {
        return null;
      }

      return {
        isQuestion: true,
        question: messageContent,
        answer: answer,
        confidence: 0.9, // High confidence since using Gemini
        respondedAt: new Date(),
      };
    } catch (error) {
      logger.error('Error processing message for Q&A:', error);
      return null;
    }
  }
}

// Export singleton instance
const aiQAService = new AIQAService();
export default aiQAService;
