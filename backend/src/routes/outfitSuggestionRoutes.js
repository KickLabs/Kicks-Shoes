import express from 'express';
import { AIProductService } from '../services/aiProductService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route POST /api/ai/outfit-suggestion
 * @desc Generate outfit suggestions based on context using AI Gemini
 * @access Public
 */
router.post('/outfit-suggestion', async (req, res) => {
  try {
    const { context, limit = 9 } = req.body;

    if (!context || !context.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Context is required',
      });
    }

    logger.info(`Generating outfit suggestions for context: ${context}`);

    // Use AI Gemini to analyze context and get product suggestions
    const outfitSuggestions = await AIProductService.generateOutfitSuggestions(context, limit);

    res.json({
      success: true,
      data: outfitSuggestions,
    });
  } catch (error) {
    logger.error('Outfit suggestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate outfit suggestions',
      error: error.message,
    });
  }
});

/**
 * @route POST /api/ai/optimize-context
 * @desc Optimize user context for better outfit suggestions
 * @access Public
 */
router.post('/optimize-context', async (req, res) => {
  try {
    const { context } = req.body;

    if (!context || !context.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Context is required',
      });
    }

    logger.info(`Optimizing context: ${context}`);

    // Use AI to optimize the context
    const optimizedContext = await AIProductService.optimizeContext(context);

    res.json({
      success: true,
      data: {
        originalContext: context,
        optimizedContext: optimizedContext,
      },
    });
  } catch (error) {
    logger.error('Context optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize context',
      error: error.message,
    });
  }
});

export default router;
