import express from 'express';

const router = express.Router();

// Streams Gemini AI response to the client using gemini-2.5-flash model
router.post('/stream', async (req, res) => {
  try {
    const { message, conversationId } = req.body || {};

    if (!message) {
      return res.status(400).json({ message: 'Missing required field: message' });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return res.status(500).json({ message: 'Google AI API key not configured' });
    }

    // Create product consultation context
    const systemPrompt = `Bạn là AI tư vấn sản phẩm giày chuyên nghiệp. Bạn có kiến thức sâu rộng về:
- Các loại giày: sneaker, boot, sandal, loafer, oxford, etc.
- Các thương hiệu nổi tiếng: Nike, Adidas, Puma, Converse, Vans, etc.
- Chất liệu giày: da, vải, cao su, mesh, etc.
- Kích thước và cách chọn giày phù hợp
- Phong cách thời trang và cách phối đồ với giày
- Giá cả và chất lượng sản phẩm

Hãy tư vấn một cách thân thiện, chuyên nghiệp và hữu ích. Nếu không biết thông tin cụ thể, hãy đề xuất cách tìm hiểu thêm.

Câu hỏi của khách hàng: ${message}`;

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
              // Send final response
              const finalData =
                JSON.stringify({
                  type: 'final',
                  content: {
                    final_response: fullResponse,
                    conversation_id: conversationId || null,
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
    const mockResponse = `Xin chào! Tôi là AI tư vấn sản phẩm giày chuyên nghiệp. 

Về câu hỏi "${message}" của bạn, tôi có thể tư vấn như sau:

1. **Chọn size giày**: Hãy đo chân của bạn và so sánh với bảng size của từng thương hiệu
2. **Chất liệu**: Tùy theo mục đích sử dụng, bạn có thể chọn da thật, vải, hoặc cao su
3. **Thương hiệu**: Nike và Adidas thường có chất lượng tốt, Puma và Converse phù hợp cho phong cách casual
4. **Giá cả**: Dao động từ 500k-3tr tùy theo thương hiệu và chất liệu

Bạn có thể chia sẻ thêm về phong cách và ngân sách để tôi tư vấn cụ thể hơn không?`;

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
        // Send final response
        const finalData =
          JSON.stringify({
            type: 'final',
            content: {
              final_response: mockResponse,
              conversation_id: conversationId || null,
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
