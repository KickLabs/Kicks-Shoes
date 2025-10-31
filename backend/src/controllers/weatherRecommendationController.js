import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from '../models/Product.js';
import logger from '../utils/logger.js';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Get current weather data from OpenWeather API
 * @route GET /api/weather/current
 * @access Public
 */
export const getCurrentWeather = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    // Call OpenWeather API
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'vi',
      },
    });

    const weatherData = {
      temperature: Math.round(response.data.main.temp),
      feelsLike: Math.round(response.data.main.feels_like),
      humidity: response.data.main.humidity,
      description: response.data.weather[0].description,
      main: response.data.weather[0].main,
      icon: response.data.weather[0].icon,
      windSpeed: response.data.wind.speed,
      location: response.data.name,
    };

    logger.info('Weather data fetched successfully', { location: weatherData.location });

    res.json({
      success: true,
      data: weatherData,
    });
  } catch (error) {
    logger.error('Error fetching weather data', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weather data',
      error: error.message,
    });
  }
};

/**
 * Get AI-powered outfit recommendations based on weather and gender
 * @route POST /api/weather/recommendations
 * @access Public
 */
export const getOutfitRecommendations = async (req, res) => {
  try {
    const { temperature, weather, gender, humidity, windSpeed } = req.body;

    if (!temperature || !weather || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Temperature, weather, and gender are required',
      });
    }

    logger.info('Getting outfit recommendations', {
      temperature,
      weather,
      gender,
    });

    // Get ALL active products from database - let AI analyze and choose
    const products = await Product.find({ status: true })
      .populate('category')
      .select(
        'name summary category price finalPrice mainImage colorOptions brand gender rating reviewCount'
      )
      .lean()
      .limit(100); // Increase limit to give AI more options

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products available',
      });
    }

    logger.info(`Found ${products.length} products for AI analysis`);

    // Use Gemini AI to analyze and recommend products
    const apiKey = process.env.GOOGLE_AI_API_KEY_WEATHER;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY_WEATHER is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GOOGLE_AI_MODEL_WEATHER || 'gemini-2.0-flash-exp',
    });

    const prompt = `You are a fashion consultant expert. Analyze the weather and suggest appropriate outfits.

Weather Information:
- Temperature: ${temperature}°C
- Weather: ${weather}
- Humidity: ${humidity}%
- Wind Speed: ${windSpeed} m/s
- Gender: ${gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Unisex'}

Available Products List (JSON):
${JSON.stringify(
  products.map(p => ({
    id: p._id,
    name: p.name,
    category: p.category?.name || 'Unknown',
    summary: p.summary || '',
    price: p.finalPrice || p.price,
    images: p.images?.[0] || '',
    brand: p.brand,
    gender: p.gender || 'unisex',
  })),
  null,
  2
)}

Requirements:
1. Analyze the weather and provide outfit advice (2-3 sentences)
2. From the product list above, select 6-8 MOST SUITABLE products considering:
   - Current temperature and weather conditions
   - Specified gender
   - Comfort and style
3. Prioritize products matching the gender (${gender}) or unisex items
4. Ensure diverse combinations: shoes, clothing, accessories

Return JSON in this format (NO markdown, pure JSON only):
{
  "advice": "Outfit advice...",
  "recommendedProducts": [
    {
      "productId": "product id",
      "reason": "Recommendation reason (1-2 short sentences)"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse AI response
    let aiResponse;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      aiResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      logger.error('Error parsing AI response', { error: parseError.message });
      throw new Error('Failed to parse AI response');
    }

    // Map recommended products with full details
    const recommendedProducts = aiResponse.recommendedProducts
      .map(rec => {
        const product = products.find(p => p._id.toString() === rec.productId);
        if (!product) return null;

        // Handle price structure (could be object or number)
        const regularPrice = product.price?.regular || product.price || 0;
        const finalPrice = product.finalPrice || regularPrice;

        // Extract images from product structure
        let images = [];
        if (product.mainImage) {
          images.push(product.mainImage);
        }
        // Add images from first color option if available
        if (product.colorOptions && product.colorOptions.length > 0) {
          const firstColorImages = product.colorOptions[0].images || [];
          images = [...images, ...firstColorImages];
        }

        return {
          _id: product._id,
          name: product.name,
          summary: product.summary,
          price: regularPrice,
          finalPrice: finalPrice,
          images: images,
          category: product.category,
          brand: product.brand,
          gender: product.gender,
          rating: product.rating || 0,
          reviewCount: product.reviewCount || 0,
          reason: rec.reason,
        };
      })
      .filter(Boolean);

    logger.info('Outfit recommendations generated successfully', {
      count: recommendedProducts.length,
    });

    res.json({
      success: true,
      data: {
        advice: aiResponse.advice,
        products: recommendedProducts,
        weatherContext: {
          temperature,
          weather,
          humidity,
          windSpeed,
        },
      },
    });
  } catch (error) {
    logger.error('Error generating outfit recommendations', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message,
    });
  }
};
