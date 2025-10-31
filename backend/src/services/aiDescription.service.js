/**
 * @fileoverview AI Product Description Generator Service
 * @created 2025-01-28
 * @file aiDescription.service.js
 * @description Service to generate product descriptions using Gemini AI
 */

import logger from '../utils/logger.js';

class AIDescriptionService {
  /**
   * Generate product description using AI
   * @param {Object} productInfo - Product information
   * @returns {Promise<Object>} Generated description and summary
   */
  static async generateDescription(productInfo) {
    try {
      const { name, brand, productType, category, price, colors, sizes } = productInfo;

      logger.info(`Generating description for product: ${name}`);

      const apiKey = process.env.GOOGLE_AI_API_KEY_DESCRIPTION;
      if (!apiKey) {
        logger.warn('Google AI API key not configured, using fallback description');
        return this.generateFallbackDescription(productInfo);
      }

      const prompt = `
You are a professional product copywriter for an e-commerce fashion store specializing in shoes, clothing, and accessories.

Generate a compelling, SEO-optimized product description for the following product:

**Product Information:**
- Name: ${name}
- Brand: ${brand || 'N/A'}
- Type: ${productType || 'shoes'}
- Category: ${category || 'N/A'}
- Price: ${price ? `${price.toLocaleString()}đ` : 'N/A'}
- Available Colors: ${colors && colors.length > 0 ? colors.join(', ') : 'Various colors'}
- Available Sizes: ${sizes && sizes.length > 0 ? sizes.join(', ') : 'Multiple sizes'}

**Requirements:**
1. **Summary (50-100 characters)**: A catchy one-liner highlighting the product's main appeal
2. **Description (150-500 words)**: 
   - Start with an engaging hook
   - Highlight key features and benefits
   - Describe materials, comfort, style
   - Mention versatility and occasions
   - Include care instructions if relevant
   - Use persuasive, engaging language
   - Focus on customer benefits
   - Be specific about quality and craftsmanship

**Tone:** Professional, enthusiastic, trustworthy, and customer-focused

**Format:** Return ONLY a JSON object (no markdown, no extra text):

{
  "summary": "Catchy one-liner summary (50-100 chars)",
  "description": "Full product description (150-500 words, use \\n for paragraphs)"
}

Generate compelling copy that sells the product and helps customers make informed decisions.
`;

      const model = process.env.GOOGLE_AI_MODEL_DESCRIPTION || 'gemini-2.0-flash-exp';

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.8,
              topP: 0.9,
              topK: 40,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiResponse) {
        throw new Error('No response from Gemini API');
      }

      // Parse JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        logger.info('AI description generated successfully');
        return {
          success: true,
          summary: result.summary || '',
          description: result.description || '',
        };
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    } catch (error) {
      logger.error('AI description generation error:', error);
      // Fallback to template-based description
      return this.generateFallbackDescription(productInfo);
    }
  }

  /**
   * Generate fallback description without AI
   * @param {Object} productInfo - Product information
   * @returns {Object} Basic description
   */
  static generateFallbackDescription(productInfo) {
    const { name, brand, productType, price } = productInfo;

    const summary = `${brand || 'Premium'} ${name} - ${productType === 'shoes' ? 'Quality Footwear' : productType === 'clothing' ? 'Stylish Apparel' : 'Quality Accessory'}`;

    let description = `Introducing the ${brand} ${name}, a premium ${productType} designed for style and comfort.\n\n`;

    if (productType === 'shoes') {
      description += `These shoes combine cutting-edge design with superior craftsmanship. Perfect for daily wear, they offer exceptional comfort and durability. `;
      description += `Featuring high-quality materials and attention to detail, these shoes are built to last.\n\n`;
      description += `Key Features:\n`;
      description += `• Premium materials for long-lasting durability\n`;
      description += `• Comfortable fit for all-day wear\n`;
      description += `• Versatile style suitable for various occasions\n`;
      description += `• Available in multiple colors and sizes\n\n`;
    } else if (productType === 'clothing') {
      description += `This clothing item combines style with comfort, perfect for any wardrobe. Made with quality materials for lasting wear.\n\n`;
      description += `Key Features:\n`;
      description += `• Quality fabric for comfort and durability\n`;
      description += `• Modern design suitable for various occasions\n`;
      description += `• Available in multiple sizes\n\n`;
    } else {
      description += `A must-have accessory that adds the perfect finishing touch to any outfit.\n\n`;
      description += `Key Features:\n`;
      description += `• High-quality construction\n`;
      description += `• Versatile and practical design\n`;
      description += `• Perfect for everyday use\n\n`;
    }

    if (price) {
      description += `Price: ${price.toLocaleString()}đ\n\n`;
    }

    description += `Shop now and elevate your style with ${brand || 'our'} ${name}!`;

    return {
      success: true,
      summary: summary.substring(0, 100),
      description,
      fallback: true,
    };
  }
}

export default AIDescriptionService;
