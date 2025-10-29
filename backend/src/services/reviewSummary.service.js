/**
 * @fileoverview AI Review Summarizer Service
 * @created 2025-01-28
 * @file reviewSummary.service.js
 * @description Service to summarize product reviews using Gemini AI
 */

import logger from '../utils/logger.js';

class ReviewSummaryService {
  /**
   * Analyze and summarize all reviews for a product
   * @param {Array} reviews - Array of review objects
   * @returns {Promise<Object>} Summary with sentiment, highlights, and insights
   */
  static async summarizeReviews(reviews) {
    try {
      if (!reviews || reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          summary: 'Chưa có đánh giá nào cho sản phẩm này.',
          sentiment: {
            positive: 0,
            neutral: 0,
            negative: 0,
          },
          highlights: {
            pros: [],
            cons: [],
          },
          topicAnalysis: {},
          ratingDistribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
          },
        };
      }

      logger.info(`Summarizing ${reviews.length} reviews using AI`);

      // Calculate statistics
      const stats = this.calculateReviewStats(reviews);

      // Use Gemini AI for intelligent summarization
      const aiSummary = await this.generateAISummary(reviews);

      return {
        totalReviews: reviews.length,
        averageRating: stats.averageRating,
        summary: aiSummary.summary,
        sentiment: aiSummary.sentiment,
        highlights: aiSummary.highlights,
        topicAnalysis: aiSummary.topicAnalysis,
        ratingDistribution: stats.ratingDistribution,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error('Error summarizing reviews:', error);
      throw error;
    }
  }

  /**
   * Calculate review statistics
   * @param {Array} reviews - Array of review objects
   * @returns {Object} Statistics
   */
  static calculateReviewStats(reviews) {
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;

    reviews.forEach(review => {
      const rating = review.rating || 0;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
        totalRating += rating;
      }
    });

    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    return {
      averageRating: parseFloat(averageRating),
      ratingDistribution,
    };
  }

  /**
   * Generate AI summary using Gemini
   * @param {Array} reviews - Array of review objects
   * @returns {Promise<Object>} AI-generated summary
   */
  static async generateAISummary(reviews) {
    try {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        logger.warn('Google AI API key not configured, using fallback summary');
        return this.generateFallbackSummary(reviews);
      }

      // Prepare reviews text for AI analysis
      const reviewsText = reviews
        .map((review, index) => {
          return `Review ${index + 1} (${review.rating}⭐): ${review.comment}`;
        })
        .join('\n\n');

      const prompt = `
Bạn là một AI phân tích đánh giá sản phẩm chuyên nghiệp. Hãy phân tích ${reviews.length} đánh giá sau về sản phẩm giày/thời trang và tạo báo cáo tóm tắt.

ĐÁNH GIÁ:
${reviewsText}

Hãy phân tích và trả về JSON với format chính xác sau (không thêm text nào khác):

{
  "summary": "Tóm tắt tổng quan về sản phẩm (2-3 câu ngắn gọn, súc tích)",
  "sentiment": {
    "positive": <phần trăm đánh giá tích cực 0-100>,
    "neutral": <phần trăm đánh giá trung lập 0-100>,
    "negative": <phần trăm đánh giá tiêu cực 0-100>
  },
  "highlights": {
    "pros": [
      "Ưu điểm 1 (ngắn gọn)",
      "Ưu điểm 2 (ngắn gọn)",
      "Ưu điểm 3 (ngắn gọn)"
    ],
    "cons": [
      "Nhược điểm 1 (ngắn gọn)",
      "Nhược điểm 2 (ngắn gọn)"
    ]
  },
  "topicAnalysis": {
    "comfort": {
      "score": <điểm 0-5>,
      "mentions": <số lần nhắc đến>,
      "summary": "Tóm tắt ngắn về độ thoải mái"
    },
    "quality": {
      "score": <điểm 0-5>,
      "mentions": <số lần nhắc đến>,
      "summary": "Tóm tắt ngắn về chất lượng"
    },
    "design": {
      "score": <điểm 0-5>,
      "mentions": <số lần nhắc đến>,
      "summary": "Tóm tắt ngắn về thiết kế"
    },
    "sizing": {
      "score": <điểm 0-5>,
      "mentions": <số lần nhắc đến>,
      "summary": "Tóm tắt về size (vừa vặn, rộng, chật)"
    },
    "value": {
      "score": <điểm 0-5>,
      "mentions": <số lần nhắc đến>,
      "summary": "Tóm tắt về giá trị/giá cả"
    }
  }
}

Lưu ý:
- Pros và Cons phải ngắn gọn, mỗi điểm tối đa 10 từ
- Sentiment phải tổng = 100%
- Topic scores dựa trên nội dung đánh giá thực tế
- Nếu không có thông tin về topic nào, đặt score = 0, mentions = 0
- Chỉ trả về JSON, không thêm text giải thích
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
              temperature: 0.7,
              topP: 0.8,
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
        const summary = JSON.parse(jsonMatch[0]);
        logger.info('AI summary generated successfully');
        return summary;
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    } catch (error) {
      logger.error('AI summary generation error:', error);
      // Fallback to rule-based summary
      return this.generateFallbackSummary(reviews);
    }
  }

  /**
   * Generate fallback summary without AI
   * @param {Array} reviews - Array of review objects
   * @returns {Object} Basic summary
   */
  static generateFallbackSummary(reviews) {
    const positive = reviews.filter(r => r.rating >= 4).length;
    const neutral = reviews.filter(r => r.rating === 3).length;
    const negative = reviews.filter(r => r.rating <= 2).length;

    const total = reviews.length;
    const positivePercent = Math.round((positive / total) * 100);
    const neutralPercent = Math.round((neutral / total) * 100);
    const negativePercent = Math.round((negative / total) * 100);

    let summaryText = '';
    if (positivePercent >= 70) {
      summaryText = `Sản phẩm nhận được ${positivePercent}% đánh giá tích cực. Khách hàng đánh giá cao chất lượng và thiết kế của sản phẩm.`;
    } else if (positivePercent >= 50) {
      summaryText = `Sản phẩm nhận được đánh giá khá tích cực với ${positivePercent}% khách hàng hài lòng. Vẫn có một số điểm cần cải thiện.`;
    } else {
      summaryText = `Sản phẩm nhận được đánh giá trái chiều. ${positivePercent}% tích cực, ${negativePercent}% tiêu cực. Nên xem xét kỹ trước khi mua.`;
    }

    return {
      summary: summaryText,
      sentiment: {
        positive: positivePercent,
        neutral: neutralPercent,
        negative: negativePercent,
      },
      highlights: {
        pros: positive > 0 ? ['Được nhiều khách hàng đánh giá tích cực'] : [],
        cons: negative > 0 ? ['Một số khách hàng chưa hài lòng'] : [],
      },
      topicAnalysis: {
        comfort: { score: 0, mentions: 0, summary: 'Chưa có đủ dữ liệu phân tích' },
        quality: { score: 0, mentions: 0, summary: 'Chưa có đủ dữ liệu phân tích' },
        design: { score: 0, mentions: 0, summary: 'Chưa có đủ dữ liệu phân tích' },
        sizing: { score: 0, mentions: 0, summary: 'Chưa có đủ dữ liệu phân tích' },
        value: { score: 0, mentions: 0, summary: 'Chưa có đủ dữ liệu phân tích' },
      },
    };
  }
}

export default ReviewSummaryService;
