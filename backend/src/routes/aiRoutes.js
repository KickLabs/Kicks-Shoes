import express from 'express';
import { AIProductService } from '../services/aiProductService.js';
import { AdminAnalyticsService } from '../services/adminAnalyticsService.js';

const router = express.Router();

/**
 * Basic language detection to mirror user language.
 * Returns 'vi' or 'en'.
 */
const detectLanguage = text => {
  if (!text) return 'en';

  // Vietnamese diacritics
  const vietnameseRegex = /[\u00C0-\u1EF9]/;

  // Common Vietnamese keywords (normalized)
  const vietnameseKeywords = [
    'xin chao',
    'chao ban',
    'tu van',
    'giay',
    'mau sac',
    'kich thuoc',
    'don hang',
    'khuyen mai',
    'nguoi dung',
    'khach hang',
    'doanh thu',
    'thong ke',
    'bao cao',
    'ton kho',
    'ban hang',
    'don hang',
  ];

  if (vietnameseRegex.test(text)) return 'vi';

  const normalized = text.toLowerCase();
  if (vietnameseKeywords.some(keyword => normalized.includes(keyword))) {
    return 'vi';
  }

  return 'en';
};

// Test endpoint to verify code version
router.get('/test-version', (req, res) => {
  res.json({
    version: '2.1-en-prompts-lang-lock',
    timestamp: new Date().toISOString(),
    features: [
      'all-prompts-in-english',
      'reply-language-mirroring',
      'product-search-fallback',
      'brand-only-search',
      'improved-prompts',
    ],
  });
});

// Streams Gemini AI response to the client using gemini-2.5-flash model
router.post('/stream', async (req, res) => {
  let userLang = 'en';

  try {
    const { message, conversationId, userRole } = req.body || {};

    if (!message) {
      return res.status(400).json({ message: 'Missing required field: message' });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return res.status(500).json({ message: 'Google AI API key not configured' });
    }

    // === Language detection & policy ===
    userLang = detectLanguage(message); // 'vi' | 'en'
    const respondInVietnamese = userLang === 'vi';
    const replyIn = respondInVietnamese ? 'Vietnamese' : 'English';

    // === System prompts (all ENGLISH) ===
    let systemPrompt = '';
    let analyticsData = null;

    // Helper: language policy to force reply language
    const languagePolicy = `
LANGUAGE POLICY:
- Detect the user's language automatically.
- If the user writes in Vietnamese, reply ONLY in Vietnamese.
- If the user writes in English, reply ONLY in English.
- Do NOT translate the user's text unless explicitly asked.
- Do NOT ask the user for additional data unless the message clearly states that data is missing.
- Your final answer must be written in ${replyIn}.`.trim();

    // Admin/shop analytics intent detection
    if (userRole === 'shop' || userRole === 'admin') {
      const analyticsKeywords = [
        'doanh thu',
        'revenue',
        'thống kê',
        'analytics',
        'báo cáo',
        'tồn kho',
        'inventory',
        'stock',
        'sản phẩm',
        'khách hàng',
        'customer',
        'người dùng',
        'bán hàng',
        'sales',
        'đơn hàng',
        'order',
      ];

      const isAnalyticsQuery = analyticsKeywords.some(keyword =>
        message.toLowerCase().includes(keyword)
      );

      if (isAnalyticsQuery) {
        try {
          analyticsData = await AdminAnalyticsService.parseAdminQuery(message);
          systemPrompt = `
You are a store admin analytics assistant for a footwear shop. You can help with:
- Revenue and sales analytics
- Product inventory status
- Customer information
- Business performance reporting

Present data clearly, professionally, and concisely.
${languagePolicy}`.trim();
        } catch (error) {
          console.error('Error getting analytics:', error);
          systemPrompt = `
You are a professional footwear product advisor.
You have deep knowledge of:
- Shoe types: sneaker, boot, sandal, loafer, oxford, etc.
- Popular brands: Nike, Adidas, Puma, Converse, Vans, etc.
- Materials: leather, fabric, rubber, mesh, etc.
- Sizing and fit guidance
- Styling and outfit pairing with shoes
- Pricing and value assessment

Be friendly, helpful, and practical.
${languagePolicy}`.trim();
        }
      } else {
        systemPrompt = `
You are a professional footwear product advisor.
You have deep knowledge of:
- Shoe types: sneaker, boot, sandal, loafer, oxford, etc.
- Popular brands: Nike, Adidas, Puma, Converse, Vans, etc.
- Materials: leather, fabric, rubber, mesh, etc.
- Sizing and fit guidance
- Styling and outfit pairing with shoes
- Pricing and value assessment

Be friendly, helpful, and practical.
${languagePolicy}`.trim();
      }
    } else {
      // Customer role – product-focused prompt
      systemPrompt = `
You are a professional footwear product advisor.
You have deep knowledge of:
- Shoe types: sneaker, boot, sandal, loafer, oxford, etc.
- Popular brands: Nike, Adidas, Puma, Converse, Vans, etc.
- Materials: leather, fabric, rubber, mesh, etc.
- Sizing and fit guidance
- Styling and outfit pairing with shoes
- Pricing and value assessment

Be friendly, helpful, and practical.
${languagePolicy}`.trim();
    }

    // Get product suggestions for customers or when not asking for analytics
    let suggestions = null;
    if ((userRole !== 'shop' && userRole !== 'admin') || !analyticsData) {
      console.log('🔍 Searching products for:', message);
      suggestions = await AIProductService.getProductSuggestions(message, 5);
      console.log('📦 Found products:', suggestions?.suggestions?.length || 0);
      if (suggestions?.suggestions?.length > 0) {
        console.log(
          '✅ Product list:',
          suggestions.suggestions.map(p => `${p.name} - ${p.brand}`)
        );
      } else {
        console.log('⚠️  No products found in database!');
      }
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Try to call Gemini API with gemini-2.5-flash model
    try {
      console.log('Calling Gemini API with model: gemini-2.5-flash');

      // Build comprehensive prompt (all ENGLISH)
      let fullPrompt = systemPrompt + '\n\n';

      // Product suggestions context (kept in English; output language controlled by policy)
      if (suggestions?.suggestions && suggestions.suggestions.length > 0) {
        fullPrompt += `**SYSTEM PRODUCT SUGGESTIONS (context only):**
Based on the user's request, the system found ${suggestions.suggestions.length} relevant products.

Provide an expert, concise comparison focusing on fit, use-cases, pros/cons, and value for money. Tailor advice to the user's message. Then end with a friendly follow-up question to clarify needs.

PRODUCTS:
`;
        suggestions.suggestions.forEach((product, index) => {
          fullPrompt += `${index + 1}. ${product.name}
   - Brand: ${product.brand}
   - Price: ${product.price?.toLocaleString('vi-VN')} VND${
     product.discount > 0
       ? ` (Discount ${product.discount}% from ${product.originalPrice?.toLocaleString('vi-VN')} VND)`
       : ''
   }
${product.rating ? `   - Rating: ${product.rating}/5` : ''}
${product.category ? `   - Category: ${product.category}` : ''}
`;
        });

        fullPrompt += `
TASKS:
1) Analyze the user's message: "${message}"
2) Recommend and explain suitable products from the list above
3) Give professional advice (pros/cons, who it's for, when to wear)
4) Compare price/value if multiple choices exist
5) End with a friendly question to better understand the user's needs

Remember: Final answer must be in ${replyIn}.
`;
      }

      if (analyticsData) {
        fullPrompt += `
**ANALYTICS DATA (context only):**
${JSON.stringify(analyticsData, null, 2)}

TASKS:
- Use ONLY this data to interpret and summarize insights.
- Provide clear takeaways, key highlights, and recommended actions.
- Present the numbers directly; do not ask the user to supply more data.
- Keep it concise, structured, and tailored to the query.
- Final answer must be in ${replyIn}.
`;
      }

      fullPrompt += `\n**USER MESSAGE:** "${message}"\n`;

      console.log(
        '📝 Prompt includes products:',
        suggestions?.suggestions?.length > 0 ? 'YES ✅' : 'NO ❌'
      );
      console.log('🚀 Calling Gemini API...');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: fullPrompt }],
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const fullResponse = data.candidates[0].content.parts[0].text;
          console.log('✅ Gemini API success!');

          // Stream the response
          const chunkSize = 50;
          let index = 0;

          const sendChunk = () => {
            if (index < fullResponse.length) {
              const chunk = fullResponse.slice(index, index + chunkSize);
              const chunkData =
                JSON.stringify({
                  type: 'message',
                  content: chunk,
                  conversationId: conversationId || null,
                }) + '\n';

              res.write(chunkData);
              index += chunkSize;

              setTimeout(sendChunk, 100);
            } else {
              const finalData =
                JSON.stringify({
                  type: 'final',
                  content: {
                    final_response: fullResponse,
                    conversation_id: conversationId || null,
                    product_suggestions: suggestions?.suggestions || [],
                    analytics_data: analyticsData || null,
                    user_role: userRole || 'customer',
                    reply_language: userLang,
                  },
                }) + '\n';

              res.write(finalData);
              res.end();
            }
          };

          sendChunk();
          return;
        }
      } else {
        const errorData = await response.text();
        console.log(`❌ Gemini API failed: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.log(`❌ Gemini API error:`, error.message);
    }

    // ===== Fallback to mock response if API fails (localized) =====
    console.log('Using fallback mock response');
    console.log(
      '⚠️  Gemini API failed - using fallback with products:',
      suggestions?.suggestions?.length || 0
    );

    const t =
      userLang === 'vi'
        ? {
            hi: 'Chào bạn! 👋',
            basedOn: msg => `Dựa trên yêu cầu **"${msg}"**, tôi đã tìm thấy`,
            productsCount: n => `**${n} sản phẩm** phù hợp cho bạn:\n`,
            brand: '• Thương hiệu',
            price: '• Giá',
            discount: (d, o) => ` (Giảm ${d}% từ ${o}đ) 🔥`,
            rating: '• Đánh giá',
            category: '• Phân loại',
            tipsTitle: '💡 **Lời khuyên:**',
            tips: [
              'Tất cả sản phẩm trên phù hợp với yêu cầu của bạn',
              'Bạn có thể nhấn vào sản phẩm bên dưới để xem chi tiết',
              'Nếu cần tư vấn thêm về size, màu sắc hay phối đồ, cứ nhắn tôi nhé! 😊',
            ],
            noProductIntro: msg =>
              `Xin chào! Tôi là AI tư vấn sản phẩm giày.\n\nVới câu hỏi "${msg}", hiện tôi chưa tìm thấy sản phẩm chính xác phù hợp.\n\nTư vấn nhanh:`,
            noProductBullets: [
              '**Chọn size:** đo chân và so với bảng size từng thương hiệu',
              '**Chất liệu:** chọn da/vải/cao su tuỳ mục đích sử dụng',
              '**Thương hiệu:** Nike/Adidas chất lượng tốt; Puma/Converse casual',
              '**Giá:** thường 500k–3tr tuỳ chất liệu & thương hiệu',
            ],
          }
        : {
            hi: 'Hi there! 👋',
            basedOn: msg => `Based on your request **"${msg}"**, I found`,
            productsCount: n => `**${n} product(s)** that fit your needs:\n`,
            brand: '• Brand',
            price: '• Price',
            discount: (d, o) => ` (Save ${d}% from ${o} VND) 🔥`,
            rating: '• Rating',
            category: '• Category',
            tipsTitle: '💡 **Tips:**',
            tips: [
              'All items above match your criteria',
              'Click a product below to view more details',
              'Need sizing, color, or styling advice? I’m here to help! 😊',
            ],
            noProductIntro: msg =>
              `Hello! I’m your footwear advisor.\n\nFor your query "${msg}", I couldn’t find an exact match right now.\n\nQuick guidance:`,
            noProductBullets: [
              '**Sizing:** measure your foot and compare with each brand’s size chart',
              '**Materials:** choose leather/fabric/rubber depending on use',
              '**Brands:** Nike/Adidas = strong quality; Puma/Converse = casual',
              '**Price:** typically 500k–3m VND depending on brand & materials',
            ],
          };

    let mockResponse = '';

    if (analyticsData) {
      // Keep analytics mock via your service (it should already produce natural language).
      mockResponse = AdminAnalyticsService.generateAdminResponse(
        message,
        analyticsData,
        respondInVietnamese ? 'vi' : 'en'
      );
    } else {
      if (suggestions?.suggestions && suggestions.suggestions.length > 0) {
        mockResponse = `${t.hi}\n\n${t.basedOn(message)} ${t.productsCount(suggestions.suggestions.length)}`;
        suggestions.suggestions.forEach((product, index) => {
          mockResponse += `${index + 1}. **${product.name}**\n`;
          mockResponse += `   ${t.brand}: ${product.brand}\n`;
          mockResponse += `   ${t.price}: ${product.price?.toLocaleString('vi-VN')} VND`;
          if (product.discount > 0) {
            mockResponse += t.discount(
              product.discount,
              product.originalPrice?.toLocaleString('vi-VN')
            );
          }
          mockResponse += `\n`;
          if (product.rating) {
            mockResponse += `   ${t.rating}: ${product.rating}/5 ⭐\n`;
          }
          if (product.category) {
            mockResponse += `   ${t.category}: ${product.category}\n`;
          }
          mockResponse += `\n`;
        });
        mockResponse += `\n${t.tipsTitle}\n`;
        mockResponse += t.tips.map(s => `• ${s}`).join('\n');
      } else {
        mockResponse = `${t.noProductIntro(message)}\n\n${t.noProductBullets.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
      }
    }

    // Simulate streaming response
    const chunkSize = 50;
    let index = 0;

    const sendChunk = () => {
      if (index < mockResponse.length) {
        const chunk = mockResponse.slice(index, index + chunkSize);
        const chunkData =
          JSON.stringify({
            type: 'message',
            content: chunk,
            conversationId: conversationId || null,
          }) + '\n';

        res.write(chunkData);
        index += chunkSize;

        setTimeout(sendChunk, 100);
      } else {
        const finalData =
          JSON.stringify({
            type: 'final',
            content: {
              final_response: mockResponse,
              conversation_id: conversationId || null,
              product_suggestions: suggestions?.suggestions || [],
              analytics_data: analyticsData || null,
              user_role: userRole || 'customer',
              reply_language: userLang,
            },
          }) + '\n';

        res.write(finalData);
        res.end();
      }
    };

    // Start streaming
    sendChunk();
  } catch (error) {
    console.error('AI Chat error:', error);

    const errorData =
      JSON.stringify({
        type: 'error',
        content:
          userLang === 'vi'
            ? 'AI gặp sự cố, vui lòng thử lại sau.'
            : 'AI encountered an issue, please try again later.',
        error: error.message,
      }) + '\n';

    res.write(errorData);
    res.end();
  }
});

export default router;
