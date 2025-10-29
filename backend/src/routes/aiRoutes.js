import express from 'express';
import { AIProductService } from '../services/aiProductService.js';
import { AdminAnalyticsService } from '../services/adminAnalyticsService.js';

const router = express.Router();

// Streams Gemini AI response to the client using gemini-2.5-flash model
router.post('/stream', async (req, res) => {
  try {
    const { message, conversationId, userRole } = req.body || {};

    if (!message) {
      return res.status(400).json({ message: 'Missing required field: message' });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return res.status(500).json({ message: 'Google AI API key not configured' });
    }

    let systemPrompt = '';
    let analyticsData = null;

    // Check if user is admin/shop and asking for analytics
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
          systemPrompt = `Bạn là AI trợ lý quản trị cửa hàng giày. Bạn có thể giúp phân tích:
- Doanh thu và thống kê bán hàng
- Tình trạng tồn kho sản phẩm
- Thông tin khách hàng
- Báo cáo hiệu suất kinh doanh

Hãy trình bày dữ liệu một cách rõ ràng, chuyên nghiệp và dễ hiểu.`;
        } catch (error) {
          console.error('Error getting analytics:', error);
          systemPrompt = `Bạn là AI tư vấn sản phẩm giày chuyên nghiệp.`;
        }
      } else {
        systemPrompt = `Bạn là AI tư vấn sản phẩm giày chuyên nghiệp. Bạn có kiến thức sâu rộng về:
- Các loại giày: sneaker, boot, sandal, loafer, oxford, etc.
- Các thương hiệu nổi tiếng: Nike, Adidas, Puma, Converse, Vans, etc.
- Chất liệu giày: da, vải, cao su, mesh, etc.
- Kích thước và cách chọn giày phù hợp
- Phong cách thời trang và cách phối đồ với giày
- Giá cả và chất lượng sản phẩm

Hãy tư vấn một cách thân thiện, chuyên nghiệp và hữu ích.`;
      }
    } else {
      // Customer role - use product-focused system prompt
      systemPrompt = `Bạn là AI tư vấn sản phẩm giày chuyên nghiệp. Bạn có kiến thức sâu rộng về:
- Các loại giày: sneaker, boot, sandal, loafer, oxford, etc.
- Các thương hiệu nổi tiếng: Nike, Adidas, Puma, Converse, Vans, etc.
- Chất liệu giày: da, vải, cao su, mesh, etc.
- Kích thước và cách chọn giày phù hợp
- Phong cách thời trang và cách phối đồ với giày
- Giá cả và chất lượng sản phẩm

Hãy tư vấn một cách thân thiện, chuyên nghiệp và hữu ích.`;
    }

    // Get product suggestions for customers or when not asking for analytics
    let suggestions = null;
    if ((userRole !== 'shop' && userRole !== 'admin') || !analyticsData) {
      suggestions = await AIProductService.getProductSuggestions(message, 5);
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
                parts: [{ text: systemPrompt }],
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

              // Send next chunk after small delay
              setTimeout(sendChunk, 100);
            } else {
              // Send final response with product suggestions
              const finalData =
                JSON.stringify({
                  type: 'final',
                  content: {
                    final_response: fullResponse,
                    conversation_id: conversationId || null,
                    product_suggestions: res.locals.productSuggestions || [],
                    analytics_data: analyticsData || null,
                    user_role: userRole || 'customer',
                  },
                }) + '\n';

              res.write(finalData);
              res.end();
            }
          };

          // Start streaming
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

    // Fallback to mock response if API fails
    console.log('Using fallback mock response');
    let mockResponse = '';

    if (analyticsData) {
      // Generate admin analytics response
      mockResponse = AdminAnalyticsService.generateAdminResponse(message, analyticsData);
    } else {
      // Generate customer product response
      mockResponse = `Xin chào! Tôi là AI tư vấn sản phẩm giày chuyên nghiệp. 

Về câu hỏi "${message}" của bạn, tôi có thể tư vấn như sau:`;

      // Add product suggestions to fallback response
      if (suggestions && suggestions.hasResults && suggestions.suggestions.length > 0) {
        mockResponse += `\n\nTôi đã tìm thấy ${suggestions.suggestions.length} sản phẩm phù hợp:\n`;
        suggestions.suggestions.forEach((product, index) => {
          mockResponse += `${index + 1}. **${product.name}** - ${product.brand} (${product.price.toLocaleString('vi-VN')}đ)\n`;
        });
        mockResponse += '\nBạn có muốn xem chi tiết sản phẩm nào không?';
      } else {
        mockResponse += `\n\n1. **Chọn size giày**: Hãy đo chân của bạn và so sánh với bảng size của từng thương hiệu
2. **Chất liệu**: Tùy theo mục đích sử dụng, bạn có thể chọn da thật, vải, hoặc cao su
3. **Thương hiệu**: Nike và Adidas thường có chất lượng tốt, Puma và Converse phù hợp cho phong cách casual
4. **Giá cả**: Dao động từ 500k-3tr tùy theo thương hiệu và chất liệu

Bạn có thể chia sẻ thêm về phong cách và ngân sách để tôi tư vấn cụ thể hơn không?`;
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

        // Send next chunk after small delay
        setTimeout(sendChunk, 100);
      } else {
        // Send final response with analytics data
        const finalData =
          JSON.stringify({
            type: 'final',
            content: {
              final_response: mockResponse,
              conversation_id: conversationId || null,
              product_suggestions: suggestions?.suggestions || [],
              analytics_data: analyticsData || null,
              user_role: userRole || 'customer',
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

    // Send error response
    const errorData =
      JSON.stringify({
        type: 'error',
        content: 'AI gặp sự cố, vui lòng thử lại sau.',
        error: error.message,
      }) + '\n';

    res.write(errorData);
    res.end();
  }
});

export default router;
