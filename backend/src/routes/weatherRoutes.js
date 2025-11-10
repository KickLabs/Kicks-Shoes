import express from 'express';
import {
  getCurrentWeather,
  getOutfitRecommendations,
} from '../controllers/weatherRecommendationController.js';

const router = express.Router();

/**
 * @route   GET /api/weather/current
 * @desc    Get current weather data
 * @access  Public
 */
router.get('/current', getCurrentWeather);

/**
 * @route   POST /api/weather/recommendations
 * @desc    Get AI-powered outfit recommendations based on weather
 * @access  Public
 */
router.post('/recommendations', getOutfitRecommendations);

export default router;
