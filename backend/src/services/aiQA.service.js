// services/aiQA.service.js
import logger from '../utils/logger.js';
import Product from '../models/Product.js';
import nlpFallbackService from './nlpFallback.service.js'; // Import dịch vụ NLP Fallback

// Dynamic import of Google GenAI SDK to support both package names
class AIQAService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialize();
  }

  async initialize() {
    try {
      logger.info('🔍 AI Q&A Service - Checking environment variables...');
      logger.info('Environment variables available:', {
        GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY
          ? '✅ SET (length: ' + process.env.GOOGLE_AI_API_KEY.length + ')'
          : '❌ NOT SET',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY
          ? '✅ SET (length: ' + process.env.GEMINI_API_KEY.length + ')'
          : '❌ NOT SET',
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY
          ? '✅ SET (length: ' + process.env.GOOGLE_API_KEY.length + ')'
          : '❌ NOT SET',
        NODE_ENV: process.env.NODE_ENV || 'not set',
      });

      const apiKey =
        process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

      if (!apiKey) {
        logger.error(
          '❌ CRITICAL: No Google AI API key found in environment variables!\n' +
            '   Required: GOOGLE_AI_API_KEY, GEMINI_API_KEY, or GOOGLE_API_KEY\n' +
            '   AI Q&A will be DISABLED and fallback to NLP rule-based system.'
        );
        this.model = null;
        return; // Không khởi tạo Gemini, sẽ dùng NLP Fallback
      }

      logger.info('✅ API Key found! Attempting to initialize Gemini SDK...');

      // Import @google/generative-ai (standard package)
      let GoogleGenerativeAI;
      try {
        ({ GoogleGenerativeAI } = await import('@google/generative-ai'));
        logger.info('✅ Successfully imported @google/generative-ai SDK');
      } catch (error) {
        logger.error(
          '❌ CRITICAL: @google/generative-ai SDK not available!\n' +
            '   Please install: npm install @google/generative-ai\n' +
            '   Error details:',
          error.message
        );
        this.model = null;
        return; // Không khởi tạo Gemini, sẽ dùng NLP Fallback
      }

      // Initialize Gemini with API key
      logger.info('Creating Gemini instance...');
      this.genAI = new GoogleGenerativeAI(apiKey);
      const modelName = 'gemini-2.0-flash-exp';
      logger.info(`Initializing Gemini model: ${modelName}`);
      this.model = this.genAI.getGenerativeModel({ model: modelName });

      logger.info('🎉 ✅ AI Q&A Service initialized successfully with Gemini!');
      logger.info('Model details:', {
        modelName: modelName,
        hasModel: !!this.model,
        hasGenAI: !!this.genAI,
      });
    } catch (error) {
      logger.error(
        '❌ FATAL ERROR: Failed to initialize AI Q&A Service with Gemini!\n' +
          '   Will fallback to NLP rule-based system.\n' +
          '   Error details:',
        error
      );
      this.model = null; // Đảm bảo model là null nếu có lỗi khởi tạo
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
      /(format|form|cú pháp|cấu trúc|template|mẫu|syntax).*(đặt hàng|đặt sản phẩm|order|chốt)/i, // Order format (expanded)
      /^(cho|xin)\s*(tôi|mình|giúp)?.*(cấu trúc|mẫu|template|format).*(đặt hàng|đặt sản phẩm|order|chốt)/i, // Vietnamese imperative request for format
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
        sku: product.sku,
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
   * Generate AI answer using Gemini or fallback to NLP
   */
  async generateAnswer(question, context = {}) {
    logger.info('🤖 generateAnswer called', {
      questionLength: question?.length || 0,
      questionPreview: question?.substring(0, 50) || '',
      hasModel: !!this.model,
      hasContext: !!context,
      contextKeys: Object.keys(context || {}),
    });

    if (!this.model) {
      logger.warn('⚠️ Gemini model NOT available (this.model is null/undefined)');
      logger.warn('🔄 Falling back to NLP rule-based system');
      return nlpFallbackService.processNLP(question, context);
    }

    logger.info('✅ Gemini model IS available, attempting to generate AI answer...');

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
        sku: p.productId?.sku || p.productId?.productSku || 'Unknown',
        price: p.productId?.price?.regular || p.productId?.price || 'N/A',
        colors: p.productId?.variants?.colors || [],
        sizes: p.productId?.variants?.sizes || [],
      }));

      const pinnedProductInfo = pinnedProduct?.productId
        ? `📌 PINNED PRODUCT: ${pinnedProduct.productId.name} → SKU: ${pinnedProduct.productId.sku || 'Unknown'}`
        : '📌 PINNED PRODUCT: None';

      // Add detailed product info if available
      let detailedProductInfo = '';
      if (detailedProduct) {
        detailedProductInfo = `SẢN PHẨM ĐANG PIN (THÔNG TIN CHI TIẾT):
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📦 TÊN: ${detailedProduct.name}
  🆔 SKU: ${detailedProduct.sku || 'Chưa cập nhật'}
        🏷️ BRAND: ${detailedProduct.brand}
        📁 CATEGORY: ${detailedProduct.category}
        💰 GIÁ: - Giá gốc: ${detailedProduct.price.regular?.toLocaleString('vi-VN')}đ ${detailedProduct.price.sale ? `- Giá sale: ${detailedProduct.price.sale.toLocaleString('vi-VN')}đ` : ''} ${detailedProduct.price.discount ? `- Giảm: ${detailedProduct.price.discount}%` : ''}
        🎨 MÀU SẮC: ${detailedProduct.variants.colors.join(', ') || 'Chưa cập nhật'}
        📏 SIZE: ${detailedProduct.variants.sizes.join(', ') || 'Chưa cập nhật'}
        📊 TỒN KHO: ${detailedProduct.stock} sản phẩm
        ⭐ ĐÁNH GIÁ: ${detailedProduct.rating}/5 (${detailedProduct.reviewCount} reviews)
        📝 MÔ TẢ: ${detailedProduct.description || 'Chưa có mô tả'}
        ✨ ĐẶC ĐIỂM NỔI BẬT: ${detailedProduct.features.length > 0 ? detailedProduct.features.map(f => `- ${f}`).join('\n') : ' - Chưa cập nhật'}
        🧵 CHẤT LIỆU: ${detailedProduct.materials.length > 0 ? detailedProduct.materials.map(m => `- ${m}`).join('\n') : ' - Chưa cập nhật'}
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      }

      const systemPrompt = `You are an AI Shopping Assistant for "${hostName}" shoe livestream.
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📺 LIVESTREAM INFO:
        - Title: ${streamTitle}
        - Description: ${streamDescription}
        ${detailedProductInfo}
        👟 FEATURED PRODUCTS: ${productsInfo.length > 0 ? JSON.stringify(productsInfo, null, 2) : 'No products featured yet'}
  ${pinnedProductInfo}
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
        Response: "👟 **Nike Air Zoom Pegasus 40** - Excellent running shoes! ✨ **Key Highlights:** • Superior bounce with Zoom Air technology • Lightweight at 280g, highly breathable • **Rating: 4.8⭐** (2,341 reviews) - highly trusted! • Premium mesh material, water-resistant 💰 **GREAT DEAL:** Regular: 2,400,000đ → **SALE: 1,920,000đ** (Save 20%! 🔥) 📊 **Availability:** • Sizes: 39, 40, 41, 42, 43 • Colors: Black, White, Navy Blue • Stock: 50 pairs 🎯 **Recommendation:** Perfect for long-distance running and marathons. This price is excellent for the quality! **Highly recommend** if you run regularly! ✅ What size would you like? 😊"
        **Example 4 - English general consultation:**
        Question: "I need shoes for work"
        Response: "👔 Great! For office/work shoes, I'd recommend checking out our business casual collection. What's your style preference? • Classic leather dress shoes? • Smart casual sneakers? • Comfortable loafers? Also, what's your size? I'll help you find the perfect pair! 😊"
        **Example 5 - Vietnamese order format question:**
        Question: "cách đặt hàng thế nào?"
        Response: "📝 **Cách đặt hàng trên livestream:** **Format:** chốt [số_lượng] [SKU] màu [màu] size [size] [SĐT] **Ví dụ:** • chốt 2 đôi HJ6777 màu black size 41 0386188917 • chốt 1 NK-HBP-101 màu trắng size M 0901234567 **Lưu ý:** ✓ SKU: mã sản phẩm (VD: HJ6777, NK-HBP-101) ✓ Màu: tiếng Việt hoặc tiếng Anh ✓ Size: số (38-50) hoặc chữ (S, M, L, XL) ✓ SĐT: số di động Việt Nam (bắt đầu 03/05/07/08/09) Bạn cần mình viết form đặt hàng cho sản phẩm nào không? 😊"
        **Example 6 - Generate order form:**
        Question: "viết cho tôi form đặt hàng Nike Air Max"
        Context: Featured product "Nike Air Max" with SKU "NK-AM-999"
        Response: "✅ **Form đặt hàng cho Nike Air Max:** chốt 1 đôi NK-AM-999 màu [MÀU_BẠN_MUỐN] size [SIZE_BẠN_MUỐN] [SỐ_ĐIỆN_THOẠI] **Bạn cần điền:** • Màu: đen, trắng, xanh, đỏ... (hoặc black, white, blue, red...) • Size: 38, 39, 40, 41, 42, 43... • SĐT: số điện thoại của bạn **Ví dụ hoàn chỉnh:** chốt 1 đôi NK-AM-999 màu black size 42 0909123456 Bạn cho mình biết size và màu, mình sẽ viết form hoàn chỉnh! 👟"
        **Example 7 - SKU inquiry (all products):**
        Question: "cho tôi SKU các sản phẩm"
        Context: Featured products: [Nike Air Max (NK-AM-999), Adidas Ultraboost (AD-UB-2024), Jordan 3 Mid (JD-3M-777)]
        Response: "📋 **SKU các sản phẩm đang giới thiệu:** 👟 **Nike Air Max** → NK-AM-999 👟 **Adidas Ultraboost** → AD-UB-2024 👟 **Jordan 3 Mid** → JD-3M-777 Copy SKU vào form đặt hàng nhé! Format: chốt [số_lượng] [SKU] màu [màu] size [size] [SĐT] 😊"
        **Example 8 - SKU inquiry (specific product):**
        Question: "SKU Nike Air Max là gì?"
        Context: Featured product "Nike Air Max" with SKU "NK-AM-999"
        Response: "✅ **SKU của Nike Air Max:** NK-AM-999 **Form đặt hàng:** chốt 1 đôi NK-AM-999 màu [màu] size [size] [SĐT] Bạn muốn đặt hàng không? Cho mình biết size và màu nhé! 👟"
  **Example 9 - SKU of pinned product:**
  Question: "mã sản phẩm đang pin là gì?"
  Context: Pinned product "[PRODUCT_NAME]" with SKU "[PRODUCT_SKU]"
  Response: "📌 **Mã sản phẩm đang pin:** **[PRODUCT_NAME]** → [PRODUCT_SKU] **Để đặt hàng:** chốt [số_lượng] [PRODUCT_SKU] màu [màu] size [size] [SĐT] **Ví dụ:** chốt 1 đôi [PRODUCT_SKU] màu black size 42 0909123456 Ready để order chưa? 🎉"
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        Remember: Always match the user's language and format responses clearly!`;

      const prompt = `${systemPrompt}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nQUESTION: ${question}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nYOUR RESPONSE (remember to match question language):`;

      logger.info('📤 Sending prompt to Gemini API...', {
        promptLength: prompt.length,
        systemPromptLength: systemPrompt.length,
        questionLength: question.length,
      });

      const result = await this.model.generateContent(prompt);

      logger.info('📥 Received response from Gemini API', {
        hasResult: !!result,
        resultType: typeof result,
      });

      const response = await result.response;

      logger.info('📋 Processing Gemini response...', {
        hasResponse: !!response,
        hasCandidates: !!response?.candidates,
        candidatesCount: response?.candidates?.length || 0,
      });

      let answer = '';
      try {
        if (typeof response.text === 'function') {
          answer = response.text().trim();
          logger.info('✅ Extracted answer using response.text() method', {
            answerLength: answer.length,
          });
        }
      } catch (err) {
        logger.warn('⚠️ response.text() method failed, trying alternative extraction...', {
          error: err.message,
        });
      }

      // Fallback extraction for SDK variants that return candidates array
      if (!answer && response?.candidates?.length) {
        logger.info('🔄 Attempting fallback extraction from candidates array...');
        const parts = response.candidates[0]?.content?.parts || [];
        const textPart = parts.find(p => typeof p.text === 'string');
        if (textPart?.text) {
          answer = String(textPart.text).trim();
          logger.info('✅ Extracted answer from candidates array', {
            answerLength: answer.length,
          });
        }
      }

      // If still empty or AI response seems generic/unhelpful, use rule-based fallback
      if (!answer || (typeof answer === 'string' && answer.length < 10)) {
        logger.warn('⚠️ Gemini returned empty or too short answer!', {
          hasAnswer: !!answer,
          answerLength: answer?.length || 0,
          answerPreview: answer || '(empty)',
        });
        logger.warn('🔄 Falling back to NLP rule-based system');
        answer = await nlpFallbackService.processNLP(question, context);
      }

      logger.info('✅ 🎉 AI Q&A successfully generated answer via Gemini!', {
        questionPreview: question.substring(0, 50),
        answerLength: answer.length,
        answerPreview: answer.substring(0, 100) + '...',
        source: 'Gemini AI',
      });
      return answer;
    } catch (error) {
      logger.error('❌ CRITICAL ERROR: Failed to generate AI answer with Gemini!', {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
      });
      logger.warn('🔄 Falling back to NLP rule-based system');
      return nlpFallbackService.processNLP(question, context);
    }
  }

  /**
   * Process a chat message and generate answer if it's a question
   */
  async processMessage(message, context = {}) {
    try {
      const messageContent = message.content || message.text || message;
      logger.info('💬 AIQA processMessage called', {
        messageType: typeof messageContent,
        length: typeof messageContent === 'string' ? messageContent.length : 0,
        preview: typeof messageContent === 'string' ? messageContent.slice(0, 60) : '',
        hasModel: !!this.model,
        modelStatus: this.model ? 'Gemini AI Ready ✅' : 'NLP Fallback Only ⚠️',
      });

      const isQuestion = this.isQuestion(messageContent);
      logger.info('🔍 Question detection:', {
        isQuestion: isQuestion,
        messagePreview: messageContent.substring(0, 50),
      });

      if (!isQuestion) {
        logger.info('⚠️ AIQA: Not a classic question pattern detected');
        // Nếu không phải câu hỏi, và Gemini không được bật, không cần trả lời
        if (!this.model) {
          logger.info('❌ Gemini not available and message is not a question → returning null');
          return null;
        }
        logger.info('✅ Gemini available → attempting AI anyway for non-question message');
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
      let answer = await this.generateAnswer(messageContent, enhancedContext);

      // Ensure we always have a non-empty answer (NLP Fallback should guarantee this)
      if (!answer || (typeof answer === 'string' && !answer.trim())) {
        logger.warn('⚠️ CRITICAL: Final answer is empty after all attempts!', {
          hasAnswer: !!answer,
          answerLength: answer?.length || 0,
        });
        logger.warn('🔄 Returning generic NLP fallback as last resort');
        answer = await nlpFallbackService.processNLP(messageContent, enhancedContext);
      }

      logger.info('✅ 🎉 Successfully processed message and generated answer!', {
        questionPreview: messageContent.substring(0, 50),
        answerLength: answer.length,
        confidence: this.model ? 0.9 : 0.7,
        source: this.model ? 'Gemini AI' : 'NLP Fallback',
      });

      return {
        isQuestion: true,
        question: messageContent,
        answer: answer,
        confidence: this.model ? 0.9 : 0.7,
        respondedAt: new Date(),
      };
    } catch (error) {
      logger.error('❌ FATAL ERROR in processMessage!', {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
      });
      logger.warn('🔄 Using emergency NLP fallback');

      // Fallback to NLP if something catastrophic happens during processing
      const fallbackAnswer = await nlpFallbackService.processNLP(
        message.content || message.text || message,
        context
      );

      logger.info('✅ Emergency fallback completed', {
        fallbackAnswerLength: fallbackAnswer.length,
      });

      return {
        isQuestion: true,
        question: message.content || message.text || message,
        answer: fallbackAnswer,
        confidence: 0.5, // Lowest confidence for catch-all fallback
        respondedAt: new Date(),
      };
    }
  }
}

// Export singleton instance
const aiQAService = new AIQAService();
export default aiQAService;
