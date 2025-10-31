/**
 * @fileoverview Service for interacting with the Google Gemini API using a direct fetch call.
 * @created 2025-10-19
 * @file gemini.service.js
 * @description Bypasses the @google/generative-ai library to resolve environment issues.
 */

// Không cần import thư viện @google/generative-ai nữa

export async function analyzeProductImage(imageBuffer, mimeType) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not set in the environment variables.');
  }

  // Sử dụng model từ env hoặc fallback
  const model = process.env.GOOGLE_AI_MODEL || 'gemini-2.0-flash-exp';
  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
  const prompt = `
      You are a fashion product analysis assistant.
      Your task is to analyze the given image of a clothing or footwear item and return clear, structured information about it.
      Always respond in strict JSON format without any extra text, comments, or explanation.

      Analyze this image and identify the following attributes of the product shown:

      brand: choose only one value from this list → ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Converse', 'Vans'].
      If the brand cannot be clearly identified, return "Unknown".

      type: choose only one value from this list → ['shoes', 'clothing', 'accessory', 'other'].

      color: choose only one dominant color from this list → ['Black', 'Blue', 'Red', 'White', 'Gray', 'Yellow', 'Green', 'Pink', 'Navy', 'Brown'].

      Respond only with a valid JSON object in this exact format:

      {
        "brand": "",
        "type": "",
        "color": ""
      }
    `;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBuffer.toString('base64'),
            },
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('API Error Response:', errorBody);
      throw new Error(
        `API request failed with status ${response.status}: ${errorBody.error.message}`
      );
    }

    const result = await response.json();

    // Trích xuất text từ cấu trúc response của REST API
    const text = result.candidates[0].content.parts[0].text;
    const jsonString = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // Parse JSON response với format mới
    const parsedResult = JSON.parse(jsonString);

    // Chuyển đổi format để tương thích với hệ thống hiện tại
    return {
      category: parsedResult.type,
      product_name: `${parsedResult.color} ${parsedResult.brand} ${parsedResult.type}`,
      brand: parsedResult.brand,
      colors: [parsedResult.color],
      features: [],
      style_tags: [],
    };
  } catch (error) {
    console.error('Error calling Gemini API via fetch:', error);
    throw new Error('Failed to analyze image with Gemini API.');
  }
}
