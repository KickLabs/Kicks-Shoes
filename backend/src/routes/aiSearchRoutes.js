/**
 * @fileoverview AI Search Routes for contextual product search
 * @created 2025-01-27
 * @file aiSearchRoutes.js
 * @description Routes to handle AI-powered contextual product search
 */

import express from 'express';
import { AIProductService } from '../services/aiProductService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// AI-powered contextual search
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body || {};

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    logger.info('AI Search request:', { query, limit });

    // Use AI to analyze the contextual query and get product suggestions
    const suggestions = await AIProductService.getProductSuggestions(query, limit);

    if (suggestions && suggestions.hasResults) {
      return res.json({
        success: true,
        data: {
          query: query,
          suggestions: suggestions.suggestions,
          totalResults: suggestions.suggestions.length,
          searchType: 'ai_contextual',
          aiResponse: suggestions.aiResponse,
        },
      });
    } else {
      // Fallback to regular search if AI doesn't find results
      const fallbackResults = await AIProductService.searchProducts(
        { name: query, brand: query, description: query },
        limit
      );

      // Map fallback results to match the expected format
      const mappedResults = fallbackResults.map(product => ({
        id: product._id,
        name: product.name,
        brand: product.brand,
        price: product.finalPrice || product.price?.regular || 0,
        originalPrice: product.price?.regular || 0,
        discount: product.price?.discountPercent || 0,
        image: product.mainImage,
        rating: product.rating,
        category: product.category?.name,
        productType: product.productType,
        isNew: product.isNew,
        stock: product.stock,
        variants: product.variants,
      }));

      return res.json({
        success: true,
        data: {
          query: query,
          suggestions: mappedResults || [],
          totalResults: mappedResults?.length || 0,
          searchType: 'fallback_search',
          aiResponse: `Không tìm thấy sản phẩm phù hợp với "${query}". Hãy thử từ khóa khác.`,
        },
      });
    }
  } catch (error) {
    logger.error('AI Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message,
    });
  }
});

// Get search suggestions
router.post('/search/suggestions', async (req, res) => {
  try {
    const { query, limit = 5 } = req.body || {};

    if (!query || query.trim() === '') {
      return res.json({
        success: true,
        suggestions: [],
      });
    }

    // Generate contextual search suggestions
    const suggestions = [
      `Tôi muốn tìm giày ${query}`,
      `Cần giày phù hợp cho ${query}`,
      `Tìm giày ${query} chất lượng tốt`,
      `Giày ${query} giá rẻ`,
      `Tôi cần giày để ${query}`,
    ].filter(suggestion => suggestion.toLowerCase().includes(query.toLowerCase()));

    res.json({
      success: true,
      suggestions: suggestions.slice(0, limit),
    });
  } catch (error) {
    logger.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error.message,
    });
  }
});

export default router;
