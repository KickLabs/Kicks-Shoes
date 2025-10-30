/**
 * @fileoverview AI Product Service for intelligent product recommendations
 * @created 2025-01-27
 * @file aiProductService.js
 * @description Service to analyze user queries and suggest relevant products from database
 */

import Product from '../models/Product.js';
import Category from '../models/Category.js';
import logger from '../utils/logger.js';

export class AIProductService {
  /**
   * Analyze user message and extract product search criteria
   * @param {string} message - User's message
   * @returns {Object} Search criteria object
   */
  static analyzeUserQuery(message) {
    const query = message.toLowerCase();
    const searchCriteria = {
      keywords: [],
      brands: [],
      categories: [],
      priceRange: null,
      sizes: [],
      colors: [],
      productType: null,
      gender: null,
      style: null,
      material: null,
    };

    // Extract brands
    const brandKeywords = {
      nike: 'Nike',
      adidas: 'Adidas',
      puma: 'Puma',
      converse: 'Converse',
      vans: 'Vans',
      jordan: 'Jordan',
      'new balance': 'New Balance',
      reebok: 'Reebok',
      asics: 'Asics',
      'under armour': 'Under Armour',
    };

    for (const [keyword, brand] of Object.entries(brandKeywords)) {
      if (query.includes(keyword)) {
        searchCriteria.brands.push(brand);
      }
    }

    // Extract product types
    if (query.includes('giày') || query.includes('sneaker') || query.includes('shoe')) {
      searchCriteria.productType = 'shoes';
    } else if (query.includes('áo') || query.includes('quần') || query.includes('clothing')) {
      searchCriteria.productType = 'clothing';
    } else if (query.includes('phụ kiện') || query.includes('accessory')) {
      searchCriteria.productType = 'accessory';
    }

    // Extract categories
    const categoryKeywords = {
      sneaker: 'Sneaker',
      boot: 'Boot',
      sandal: 'Sandal',
      loafer: 'Loafer',
      oxford: 'Oxford',
      running: 'Running',
      basketball: 'Basketball',
      football: 'Football',
      casual: 'Casual',
      formal: 'Formal',
      sport: 'Sport',
      'thể dục': 'Sport',
      gym: 'Sport',
      'chạy bộ': 'Running',
      'đi bộ': 'Casual',
      'leo núi': 'Hiking',
      'bóng đá': 'Football',
      tennis: 'Tennis',
      golf: 'Golf',
      hiking: 'Hiking',
      outdoor: 'Outdoor',
      runners: 'Running',
    };

    for (const [keyword, category] of Object.entries(categoryKeywords)) {
      if (query.includes(keyword)) {
        searchCriteria.categories.push(category);
      }
    }

    // Extract sizes
    const sizePattern = /size\s*(\d+)|size\s*([a-z]+)|(\d+)\s*size/i;
    const sizeMatch = query.match(sizePattern);
    if (sizeMatch) {
      const size = sizeMatch[1] || sizeMatch[2] || sizeMatch[3];
      if (size) {
        searchCriteria.sizes.push(size);
      }
    }

    // Extract colors
    const colorKeywords = {
      đen: 'black',
      trắng: 'white',
      xanh: 'blue',
      đỏ: 'red',
      vàng: 'yellow',
      'xanh lá': 'green',
      hồng: 'pink',
      tím: 'purple',
      cam: 'orange',
      nâu: 'brown',
      xám: 'gray',
      black: 'black',
      white: 'white',
      blue: 'blue',
      red: 'red',
      yellow: 'yellow',
      green: 'green',
      pink: 'pink',
      purple: 'purple',
      orange: 'orange',
      brown: 'brown',
      gray: 'gray',
    };

    for (const [keyword, color] of Object.entries(colorKeywords)) {
      if (query.includes(keyword)) {
        searchCriteria.colors.push(color);
      }
    }

    // Extract price range
    const pricePatterns = [
      /dưới\s*(\d+)\s*k|dưới\s*(\d+)\s*000/i,
      /trên\s*(\d+)\s*k|trên\s*(\d+)\s*000/i,
      /từ\s*(\d+)\s*đến\s*(\d+)\s*k|từ\s*(\d+)\s*đến\s*(\d+)\s*000/i,
      /(\d+)\s*k\s*đến\s*(\d+)\s*k|(\d+)\s*000\s*đến\s*(\d+)\s*000/i,
    ];

    for (const pattern of pricePatterns) {
      const match = query.match(pattern);
      if (match) {
        if (match[1] && match[2]) {
          // Range: từ X đến Y
          searchCriteria.priceRange = {
            min: parseInt(match[1]) * 1000,
            max: parseInt(match[2]) * 1000,
          };
        } else if (match[1]) {
          // Single value: dưới X hoặc trên X
          if (query.includes('dưới')) {
            searchCriteria.priceRange = { max: parseInt(match[1]) * 1000 };
          } else if (query.includes('trên')) {
            searchCriteria.priceRange = { min: parseInt(match[1]) * 1000 };
          }
        }
        break;
      }
    }

    // Extract gender
    if (query.includes('nam') || query.includes('male') || query.includes('men')) {
      searchCriteria.gender = 'male';
    } else if (query.includes('nữ') || query.includes('female') || query.includes('women')) {
      searchCriteria.gender = 'female';
    } else if (query.includes('unisex')) {
      searchCriteria.gender = 'unisex';
    }

    // Extract style
    if (query.includes('casual') || query.includes('thường ngày')) {
      searchCriteria.style = 'casual';
    } else if (query.includes('formal') || query.includes('công sở')) {
      searchCriteria.style = 'formal';
    } else if (query.includes('sport') || query.includes('thể thao')) {
      searchCriteria.style = 'sport';
    }

    // Extract material
    if (query.includes('da') || query.includes('leather')) {
      searchCriteria.material = 'leather';
    } else if (query.includes('vải') || query.includes('fabric')) {
      searchCriteria.material = 'fabric';
    } else if (query.includes('mesh')) {
      searchCriteria.material = 'mesh';
    }

    // Extract general keywords
    const words = query.split(/\s+/).filter(word => word.length > 2);
    searchCriteria.keywords = words.slice(0, 5); // Limit to 5 keywords

    return searchCriteria;
  }

  /**
   * Search products based on analyzed criteria
   * @param {Object} searchCriteria - Criteria from analyzeUserQuery
   * @param {number} limit - Maximum number of products to return
   * @returns {Promise<Array>} Array of matching products
   */
  static async searchProducts(searchCriteria, limit = 5) {
    try {
      const filter = { status: true };

      // Apply brand filter
      if (searchCriteria.brands && searchCriteria.brands.length > 0) {
        filter.brand = { $in: searchCriteria.brands };
      }

      // Apply product type filter
      if (searchCriteria.productType) {
        filter.productType = searchCriteria.productType;
      }

      // Apply gender filter
      if (searchCriteria.gender) {
        filter['attributes.gender'] = { $in: [searchCriteria.gender, 'unisex'] };
      }

      // Apply price range filter
      if (searchCriteria.priceRange) {
        filter.finalPrice = {};
        if (searchCriteria.priceRange.min) {
          filter.finalPrice.$gte = searchCriteria.priceRange.min;
        }
        if (searchCriteria.priceRange.max) {
          filter.finalPrice.$lte = searchCriteria.priceRange.max;
        }
      }

      // Apply size filter
      if (searchCriteria.sizes && searchCriteria.sizes.length > 0) {
        filter.$or = [
          { 'variants.sizes': { $in: searchCriteria.sizes } },
          {
            'inventory.size': {
              $in: searchCriteria.sizes.map(s => parseInt(s)).filter(s => !isNaN(s)),
            },
          },
          { 'inventory.clothingSize': { $in: searchCriteria.sizes } },
        ];
      }

      // Apply color filter
      if (searchCriteria.colors && searchCriteria.colors.length > 0) {
        if (filter.$or) {
          filter.$and = [
            { $or: filter.$or },
            {
              $or: [
                { 'variants.colors': { $in: searchCriteria.colors } },
                { 'inventory.color': { $in: searchCriteria.colors } },
              ],
            },
          ];
          delete filter.$or;
        } else {
          filter.$or = [
            { 'variants.colors': { $in: searchCriteria.colors } },
            { 'inventory.color': { $in: searchCriteria.colors } },
          ];
        }
      }

      // Apply material filter
      if (searchCriteria.material) {
        filter['attributes.material'] = { $regex: searchCriteria.material, $options: 'i' };
      }

      // Apply style filter
      if (searchCriteria.style && Array.isArray(searchCriteria.style)) {
        filter['attributes.style'] = { $in: searchCriteria.style };
      } else if (searchCriteria.style) {
        filter['attributes.style'] = { $regex: searchCriteria.style, $options: 'i' };
      }

      // Text search for keywords - improved to work without brand
      if (searchCriteria.keywords && searchCriteria.keywords.length > 0) {
        const keywordConditions = searchCriteria.keywords.map(keyword => ({
          $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
            { brand: { $regex: keyword, $options: 'i' } },
            { 'category.name': { $regex: keyword, $options: 'i' } },
          ],
        }));

        if (filter.$and) {
          filter.$and.push({ $and: keywordConditions });
        } else {
          filter.$and = keywordConditions;
        }
      }

      logger.info('Searching products with criteria:', searchCriteria);

      const products = await Product.find(filter)
        .populate('category', 'name')
        .sort({
          rating: -1,
          sales: -1,
          finalPrice: 1,
        })
        .limit(limit)
        .lean();

      logger.info(`Found ${products.length} products matching criteria`);
      return products;
    } catch (error) {
      logger.error('Error searching products:', error);
      return [];
    }
  }

  /**
   * Get product suggestions based on user message
   * @param {string} message - User's message
   * @param {number} limit - Maximum number of suggestions
   * @returns {Promise<Object>} Object containing suggestions and analysis
   */
  static async getProductSuggestions(message, limit = 5) {
    try {
      const searchCriteria = this.analyzeUserQuery(message);
      let products = await this.searchProducts(searchCriteria, limit);

      // If no products found and user requested specific sizes, retry without size filter
      // to provide helpful suggestions instead of returning empty list.
      if (
        (!products || products.length === 0) &&
        searchCriteria.sizes &&
        searchCriteria.sizes.length > 0
      ) {
        logger.warn(
          'No products found for sizes:',
          searchCriteria.sizes,
          ' - retrying without size filter'
        );
        const fallbackCriteria = { ...searchCriteria, sizes: [] };
        products = await this.searchProducts(fallbackCriteria, limit);
        // Mark that this is a fallback (optional: included in aiResponse)
        searchCriteria._fallbackNoSize = true;
      }

      const suggestions = products.map(product => ({
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

      return {
        searchCriteria,
        products,
        hasResults: products.length > 0,
        suggestions,
        aiResponse: this.generateAIResponseWithProducts(message, {
          hasResults: products.length > 0,
          suggestions,
        }),
      };
    } catch (error) {
      logger.error('Error getting product suggestions:', error);
      return {
        searchCriteria: {},
        products: [],
        hasResults: false,
        suggestions: [],
        aiResponse: `Xin lỗi, tôi không thể tìm thấy sản phẩm phù hợp với "${message}". Vui lòng thử lại với từ khóa khác.`,
      };
    }
  }

  /**
   * Generate outfit suggestions based on context using AI Gemini
   * @param {string} context - User's context/occasion
   * @param {number} limit - Maximum number of products per category
   * @returns {Promise<Object>} Outfit suggestions with categorized products
   */
  static async generateOutfitSuggestions(context, limit = 9) {
    try {
      logger.info(`Generating outfit suggestions for: ${context}`);

      // First, get all available products for research
      const allProducts = await this.getAllAvailableProducts();
      logger.info(`Found ${allProducts.length} total products in database`);

      if (allProducts.length === 0) {
        logger.warn('No products found in database, returning mock data');
        return this.generateMockSuggestions(context);
      }

      // Try to use AI Gemini for analysis first
      let occasionAnalysis;
      try {
        occasionAnalysis = await this.analyzeOccasionWithAI(context, allProducts);
        logger.info('AI analysis completed successfully');
      } catch (aiError) {
        logger.warn('AI analysis failed, falling back to rule-based analysis:', aiError.message);
        occasionAnalysis = this.analyzeOccasion(context);
      }

      // Get products for each category with improved search
      const [shoes, tops, bottoms, accessories] = await Promise.all([
        this.getProductsForCategoryImproved(
          'shoes',
          occasionAnalysis,
          Math.ceil(limit / 4),
          allProducts
        ),
        this.getProductsForCategoryImproved(
          'tops',
          occasionAnalysis,
          Math.ceil(limit / 4),
          allProducts
        ),
        this.getProductsForCategoryImproved(
          'bottoms',
          occasionAnalysis,
          Math.ceil(limit / 4),
          allProducts
        ),
        this.getProductsForCategoryImproved(
          'accessories',
          occasionAnalysis,
          Math.ceil(limit / 4),
          allProducts
        ),
      ]);

      // Generate styling tips based on occasion
      const tips = this.generateStylingTips(occasionAnalysis);

      // Ensure aiCompleteOutfit is always included
      let aiCompleteOutfit = occasionAnalysis.aiCompleteOutfit;
      if (!aiCompleteOutfit) {
        // Generate a complete outfit from the selected products
        aiCompleteOutfit = this.generateCompleteOutfitFromProducts(
          shoes,
          tops,
          bottoms,
          accessories,
          occasionAnalysis
        );
      }

      return {
        occasion: occasionAnalysis.name,
        description: occasionAnalysis.description,
        categories: {
          shoes: shoes,
          tops: tops,
          bottoms: bottoms,
          accessories: accessories,
        },
        tips: tips,
        aiCompleteOutfit: aiCompleteOutfit,
      };
    } catch (error) {
      logger.error('Error generating outfit suggestions:', error);
      // Return mock data as fallback
      return this.generateMockSuggestions(context);
    }
  }

  /**
   * Analyze occasion using AI Gemini
   * @param {string} context - User's context
   * @param {Array} allProducts - All available products
   * @returns {Promise<Object>} Occasion analysis from AI
   */
  static async analyzeOccasionWithAI(context, allProducts) {
    try {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_AI_API_KEY not configured');
      }

      // Get product names for context
      const productNames = allProducts.map(p => p.name).slice(0, 50); // Limit to avoid token limit
      const brands = [...new Set(allProducts.map(p => p.brand))].slice(0, 20);

      const prompt = `
You are a professional fashion stylist and AI assistant. Please analyze the user's context and provide comprehensive outfit suggestions.

User Context: "${context}"

Available products in the store:
- Brands: ${brands.join(', ')}
- Sample products: ${productNames.join(', ')}

Please analyze and return JSON with this format:
{
  "name": "Occasion/Activity Name",
  "description": "Brief description of this occasion",
  "keywords": ["relevant", "keywords", "for", "this", "occasion"],
  "colors": ["suitable", "colors"],
  "styles": ["appropriate", "styles"],
  "productSuggestions": {
    "shoes": ["shoe suggestions"],
    "tops": ["top suggestions"], 
    "bottoms": ["bottom suggestions"],
    "accessories": ["accessory suggestions"]
  },
  "aiCompleteOutfit": {
    "outfit": [
      {"category": "Shoes", "name": "Product Name", "brand": "Brand Name"},
      {"category": "Top", "name": "Product Name", "brand": "Brand Name"},
      {"category": "Bottom", "name": "Product Name", "brand": "Brand Name"},
      {"category": "Accessory", "name": "Product Name", "brand": "Brand Name"}
    ],
    "explanation": [
      "Why this shoe choice works for the occasion",
      "How the top complements the overall look",
      "Why this bottom style is perfect",
      "How the accessory completes the outfit",
      "Overall styling philosophy and color coordination"
    ]
  }
}

Analysis should be based on:
1. Type of activity/occasion
2. Appropriate style level
3. Suitable colors
4. Specific products from available list
5. Complete outfit coordination
6. Professional styling explanation
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

      // Parse AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiAnalysis = JSON.parse(jsonMatch[0]);
        logger.info('AI analysis result:', aiAnalysis);
        return aiAnalysis;
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    } catch (error) {
      logger.error('AI analysis error:', error);
      throw error;
    }
  }

  /**
   * Analyze occasion from context (rule-based fallback)
   * @param {string} context - User's context
   * @returns {Object} Occasion analysis
   */
  static analyzeOccasion(context) {
    const lowerContext = context.toLowerCase();

    if (
      lowerContext.includes('business') ||
      lowerContext.includes('meeting') ||
      lowerContext.includes('interview')
    ) {
      return {
        name: 'Business Meeting',
        description: 'Professional and sophisticated look for important meetings',
        keywords: ['formal', 'professional', 'business', 'suit', 'dress shoes', 'briefcase'],
        colors: ['black', 'navy', 'charcoal', 'white'],
        styles: ['formal', 'professional'],
      };
    } else if (
      lowerContext.includes('date') ||
      lowerContext.includes('restaurant') ||
      lowerContext.includes('romantic')
    ) {
      return {
        name: 'Date Night',
        description: 'Elegant and charming look for a special evening',
        keywords: ['elegant', 'romantic', 'evening', 'blazer', 'loafers', 'wallet'],
        colors: ['dark', 'elegant', 'sophisticated'],
        styles: ['smart casual', 'elegant'],
      };
    } else if (
      lowerContext.includes('gym') ||
      lowerContext.includes('workout') ||
      lowerContext.includes('fitness')
    ) {
      return {
        name: 'Gym Workout',
        description: 'Comfortable and functional athletic wear',
        keywords: ['athletic', 'sport', 'running', 'sneakers', 'gym', 'workout'],
        colors: ['bright', 'athletic', 'performance'],
        styles: ['athletic', 'sport'],
      };
    } else if (
      lowerContext.includes('casual') ||
      lowerContext.includes('mall') ||
      lowerContext.includes('shopping')
    ) {
      return {
        name: 'Casual Day Out',
        description: 'Comfortable and stylish look for everyday activities',
        keywords: ['casual', 'comfortable', 'everyday', 'sneakers', 'jeans', 'tote'],
        colors: ['neutral', 'casual', 'versatile'],
        styles: ['casual', 'comfortable'],
      };
    } else {
      return {
        name: 'General Occasion',
        description: 'Versatile look suitable for various activities',
        keywords: ['versatile', 'general', 'multi-purpose', 'sneakers', 'outfit', 'bag'],
        colors: ['neutral', 'versatile'],
        styles: ['versatile', 'general'],
      };
    }
  }

  /**
   * Get all available products for research
   * @returns {Promise<Array>} Array of all products
   */
  static async getAllAvailableProducts() {
    try {
      const products = await Product.find({ status: true })
        .populate('category', 'name')
        .select(
          '_id name brand price finalPrice mainImage description summary variants inventory productType rating sales'
        )
        .lean();

      logger.info(`Retrieved ${products.length} products from database`);
      return products;
    } catch (error) {
      logger.error('Error getting all products:', error);
      return [];
    }
  }

  /**
   * Get products for specific category with improved search
   * @param {string} category - Product category
   * @param {Object} occasionAnalysis - Occasion analysis
   * @param {number} limit - Number of products to return
   * @param {Array} allProducts - All available products
   * @returns {Promise<Array>} Array of products
   */
  static async getProductsForCategoryImproved(category, occasionAnalysis, limit, allProducts) {
    try {
      // Filter products by category
      let categoryProducts = allProducts.filter(product => {
        // Map category names to productType
        const categoryMap = {
          shoes: 'shoes',
          tops: 'clothing',
          bottoms: 'clothing',
          accessories: 'accessory',
        };

        if (category === 'tops' || category === 'bottoms') {
          // For clothing, further filter by product name/description
          if (product.productType !== 'clothing') return false;

          const productName = product.name.toLowerCase();
          const productDesc = (product.description || '').toLowerCase();

          if (category === 'tops') {
            // Tops: shirts, tees, hoodies, jackets, sweaters
            return (
              productName.includes('tee') ||
              productName.includes('shirt') ||
              productName.includes('hoodie') ||
              productName.includes('jacket') ||
              productName.includes('sweater') ||
              productName.includes('top') ||
              productDesc.includes('tee') ||
              productDesc.includes('shirt') ||
              productDesc.includes('hoodie') ||
              productDesc.includes('jacket') ||
              productDesc.includes('sweater')
            );
          } else if (category === 'bottoms') {
            // Bottoms: pants, shorts, tights, leggings
            return (
              productName.includes('pant') ||
              productName.includes('short') ||
              productName.includes('tight') ||
              productName.includes('legging') ||
              productName.includes('bottom') ||
              productDesc.includes('pant') ||
              productDesc.includes('short') ||
              productDesc.includes('tight') ||
              productDesc.includes('legging')
            );
          }
        }

        return product.productType === categoryMap[category];
      });

      logger.info(`Found ${categoryProducts.length} products for category: ${category}`);

      if (categoryProducts.length === 0) {
        logger.warn(`No products found for category: ${category}`);
        return [];
      }

      // Score products based on occasion relevance
      const scoredProducts = categoryProducts.map(product => {
        let score = 0;

        // Base score
        score += 1;

        // Brand relevance
        if (
          product.brand &&
          occasionAnalysis.keywords.some(keyword =>
            product.brand.toLowerCase().includes(keyword.toLowerCase())
          )
        ) {
          score += 2;
        }

        // Name relevance
        if (
          product.name &&
          occasionAnalysis.keywords.some(keyword =>
            product.name.toLowerCase().includes(keyword.toLowerCase())
          )
        ) {
          score += 3;
        }

        // Description relevance
        if (
          product.description &&
          occasionAnalysis.keywords.some(keyword =>
            product.description.toLowerCase().includes(keyword.toLowerCase())
          )
        ) {
          score += 2;
        }

        // Rating bonus
        if (product.rating && product.rating > 4) {
          score += 1;
        }

        // Sales bonus
        if (product.sales && product.sales > 0) {
          score += 1;
        }

        return { ...product, relevanceScore: score };
      });

      // Sort by relevance score and take top products
      const topProducts = scoredProducts
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      logger.info(`Selected ${topProducts.length} products for ${category} category`);

      // Map products to expected format
      return topProducts.map(product => ({
        id: product._id,
        name: product.name,
        brand: product.brand,
        price: {
          regular: product.price?.regular || product.finalPrice || 0,
          isOnSale: product.price?.isOnSale || false,
          discountPercent: product.price?.discountPercent || 0,
        },
        image: product.mainImage || '/no-image.png',
        description: product.description || product.summary || '',
        variants: product.variants || { colors: [], sizes: [] },
        inventory: product.inventory || [],
      }));
    } catch (error) {
      logger.error(`Error getting products for category ${category}:`, error);
      return [];
    }
  }

  /**
   * Get products for specific category based on occasion (legacy method)
   * @param {string} category - Product category
   * @param {Object} occasionAnalysis - Occasion analysis
   * @param {number} limit - Number of products to return
   * @returns {Promise<Array>} Array of products
   */
  static async getProductsForCategory(category, occasionAnalysis, limit) {
    try {
      // Build search criteria based on category and occasion
      const searchCriteria = {
        keywords: [...occasionAnalysis.keywords, category],
        categories: [category],
        brands: [],
        priceRange: null,
        sizes: [],
        colors: occasionAnalysis.colors,
        productType: category,
        gender: null,
        style: occasionAnalysis.styles,
        material: null,
      };

      const products = await this.searchProducts(searchCriteria, limit);

      // Map products to expected format
      return products.map(product => ({
        id: product._id,
        name: product.name,
        brand: product.brand,
        price: {
          regular: product.price?.regular || product.finalPrice || 0,
          isOnSale: product.price?.isOnSale || false,
          discountPercent: product.price?.discountPercent || 0,
        },
        image: product.mainImage || '/no-image.png',
        description: product.description || product.summary || '',
        variants: product.variants || { colors: [], sizes: [] },
        inventory: product.inventory || [],
      }));
    } catch (error) {
      logger.error(`Error getting products for category ${category}:`, error);
      return [];
    }
  }

  /**
   * Generate styling tips based on occasion
   * @param {Object} occasionAnalysis - Occasion analysis
   * @returns {Array} Array of styling tips
   */
  static generateStylingTips(occasionAnalysis) {
    const tipsMap = {
      'Business Meeting': [
        'Choose neutral colors like navy, black, or charcoal',
        'Ensure proper fit - not too tight or loose',
        'Polish your shoes and iron your shirt',
        'Keep accessories minimal and professional',
      ],
      'Date Night': [
        'Choose colors that complement your skin tone',
        'Add a subtle cologne or fragrance',
        'Ensure your outfit is clean and well-pressed',
        "Consider the restaurant's dress code",
      ],
      'Gym Workout': [
        'Choose moisture-wicking fabrics',
        'Ensure proper shoe fit for your activity',
        'Bring a water bottle and towel',
        'Layer clothing for temperature changes',
      ],
      'Casual Day Out': [
        'Choose comfortable, breathable fabrics',
        'Mix and match colors that complement each other',
        'Add a light jacket for changing weather',
        'Keep accessories simple and functional',
      ],
      'General Occasion': [
        'Choose versatile pieces that can be mixed and matched',
        'Consider the weather and activity level',
        'Keep colors neutral for maximum versatility',
        'Add personal touches with accessories',
      ],
    };

    return tipsMap[occasionAnalysis.name] || tipsMap['General Occasion'];
  }

  /**
   * Generate AI response with product suggestions
   * @param {string} message - User's message
   * @param {Object} suggestions - Product suggestions
   * @returns {string} AI response text
   */
  static generateAIResponseWithProducts(message, suggestions) {
    let response = '';

    if (suggestions.hasResults && suggestions.suggestions.length > 0) {
      response += `Dựa trên yêu cầu của bạn, tôi đã tìm thấy ${suggestions.suggestions.length} sản phẩm phù hợp:\n\n`;

      suggestions.suggestions.forEach((product, index) => {
        response += `${index + 1}. **${product.name}** - ${product.brand}\n`;
        response += `   💰 Giá: ${product.price.toLocaleString('vi-VN')}đ`;
        if (product.discount > 0) {
          response += ` (Giảm ${product.discount}%)`;
        }
        response += `\n`;
        response += `   ⭐ Đánh giá: ${product.rating}/5\n`;
        response += `   📦 Còn lại: ${product.stock} sản phẩm\n\n`;
      });

      response +=
        'Bạn có muốn xem chi tiết sản phẩm nào không? Hoặc có thể chia sẻ thêm về phong cách và ngân sách để tôi tư vấn cụ thể hơn.';
    } else {
      response += `Tôi hiểu bạn đang tìm kiếm sản phẩm liên quan đến "${message}". `;
      response += `Hiện tại tôi chưa tìm thấy sản phẩm phù hợp với tiêu chí của bạn. `;
      response += `Bạn có thể thử:\n\n`;
      response += `• Mở rộng phạm vi tìm kiếm\n`;
      response += `• Thay đổi thương hiệu hoặc loại sản phẩm\n`;
      response += `• Điều chỉnh khoảng giá\n\n`;
      response += `Hoặc bạn có thể chia sẻ thêm về phong cách và sở thích để tôi tư vấn tốt hơn.`;
    }

    return response;
  }

  /**
   * Generate complete outfit from selected products
   * @param {Array} shoes - Selected shoes
   * @param {Array} tops - Selected tops
   * @param {Array} bottoms - Selected bottoms
   * @param {Array} accessories - Selected accessories
   * @param {Object} occasionAnalysis - Occasion analysis
   * @returns {Object} Complete outfit suggestion
   */
  static generateCompleteOutfitFromProducts(shoes, tops, bottoms, accessories, occasionAnalysis) {
    const outfit = [];
    const explanation = [];

    // Add shoes
    if (shoes.length > 0) {
      const shoe = shoes[0];
      outfit.push({
        category: 'Shoes',
        name: shoe.name,
        brand: shoe.brand,
      });
      explanation.push(
        `The ${shoe.brand} ${shoe.name} provides excellent support and style for ${occasionAnalysis.name.toLowerCase()}`
      );
    }

    // Add top
    if (tops.length > 0) {
      const top = tops[0];
      outfit.push({
        category: 'Top',
        name: top.name,
        brand: top.brand,
      });
      explanation.push(
        `The ${top.brand} ${top.name} offers comfort and complements the overall look perfectly`
      );
    }

    // Add bottom
    if (bottoms.length > 0) {
      const bottom = bottoms[0];
      outfit.push({
        category: 'Bottom',
        name: bottom.name,
        brand: bottom.brand,
      });
      explanation.push(
        `The ${bottom.brand} ${bottom.name} provides the right fit and style for this occasion`
      );
    }

    // Add accessory
    if (accessories.length > 0) {
      const accessory = accessories[0];
      outfit.push({
        category: 'Accessory',
        name: accessory.name,
        brand: accessory.brand,
      });
      explanation.push(
        `The ${accessory.brand} ${accessory.name} completes the outfit with functionality and style`
      );
    }

    // Add overall explanation
    explanation.push(
      `This coordinated ensemble balances style, comfort, and functionality for ${occasionAnalysis.name.toLowerCase()}`
    );

    return {
      outfit: outfit,
      explanation: explanation,
    };
  }

  /**
   * Optimize user context for better outfit suggestions
   * @param {string} context - User's original context
   * @returns {Promise<string>} Optimized context
   */
  static async optimizeContext(context) {
    try {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_AI_API_KEY not configured');
      }

      const prompt = `
You are a professional fashion stylist and AI assistant. Please optimize the user's context to provide the best outfit suggestions.

Original Context: "${context}"

Please optimize this context by:
1. Clarifying the type of activity/occasion
2. Adding desired style information
3. Including weather factors if applicable
4. Clarifying age/gender if possible
5. Adding formality level (casual, smart casual, formal)
6. Including time of day if relevant

Return the optimized context, concise but comprehensive (max 200 characters).

Examples:
- "Basketball game" → "Professional basketball game - athletic sportswear needed, comfortable for intense movement, suitable for indoor court"
- "Going out" → "Weekend outing - casual comfortable style, suitable for outdoor activities and photos"
- "Going to work" → "Office work - business casual style, professional but not overly formal, suitable for corporate environment"

Optimized context:`;

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

      // Clean up the response and limit to 200 characters
      const optimizedContext = aiResponse.trim().substring(0, 200);
      logger.info('Context optimized:', { original: context, optimized: optimizedContext });

      return optimizedContext;
    } catch (error) {
      logger.error('Context optimization error:', error);
      // Return original context if optimization fails
      return context;
    }
  }

  /**
   * Generate mock suggestions when no products are found
   * @param {string} context - User's context
   * @returns {Object} Mock outfit suggestions
   */
  static generateMockSuggestions(context) {
    const lowerContext = context.toLowerCase();

    if (
      lowerContext.includes('chạy bộ') ||
      lowerContext.includes('running') ||
      lowerContext.includes('gym') ||
      lowerContext.includes('workout') ||
      lowerContext.includes('fitness')
    ) {
      return {
        occasion: 'Gym Workout',
        description: 'Comfortable and functional athletic wear for running',
        categories: {
          shoes: [
            {
              id: 'mock-1',
              name: 'Nike Air Zoom Pegasus 40',
              brand: 'Nike',
              price: { regular: 3200000, isOnSale: false, discountPercent: 0 },
              image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300',
              description: 'Lightweight running shoes with responsive cushioning',
              variants: { colors: ['Black', 'White'], sizes: [38, 39, 40, 41, 42, 43, 44, 45] },
              inventory: [
                { color: 'Black', size: 40, quantity: 8 },
                { color: 'Black', size: 41, quantity: 5 },
                { color: 'White', size: 40, quantity: 6 },
              ],
            },
          ],
          tops: [
            {
              id: 'mock-2',
              name: 'Adidas Running T-Shirt',
              brand: 'Adidas',
              price: { regular: 450000, isOnSale: false, discountPercent: 0 },
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
              description: 'Moisture-wicking athletic t-shirt for running',
              variants: { colors: ['Black', 'White', 'Blue'], sizes: ['S', 'M', 'L', 'XL'] },
              inventory: [
                { color: 'Black', size: 'M', quantity: 4 },
                { color: 'White', size: 'L', quantity: 3 },
              ],
            },
          ],
          bottoms: [
            {
              id: 'mock-3',
              name: 'Nike Running Shorts',
              brand: 'Nike',
              price: { regular: 350000, isOnSale: false, discountPercent: 0 },
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
              description: 'Comfortable running shorts with moisture-wicking fabric',
              variants: { colors: ['Black', 'Navy'], sizes: ['S', 'M', 'L', 'XL'] },
              inventory: [
                { color: 'Black', size: 'M', quantity: 5 },
                { color: 'Navy', size: 'L', quantity: 3 },
              ],
            },
          ],
          accessories: [
            {
              id: 'mock-4',
              name: 'Running Water Bottle',
              brand: 'Nike',
              price: { regular: 250000, isOnSale: false, discountPercent: 0 },
              image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300',
              description: 'Insulated water bottle for hydration during runs',
              variants: { colors: ['Black', 'Blue'], sizes: ['One Size'] },
              inventory: [{ color: 'Black', size: 'One Size', quantity: 2 }],
            },
          ],
        },
        tips: [
          'Choose moisture-wicking fabrics for comfort',
          'Ensure proper shoe fit for your running style',
          'Stay hydrated with a water bottle',
          'Layer clothing for temperature changes',
        ],
        aiCompleteOutfit: {
          outfit: [
            { category: 'Shoes', name: 'Nike Air Zoom Pegasus 40', brand: 'Nike' },
            { category: 'Top', name: 'Adidas Running T-Shirt', brand: 'Adidas' },
            { category: 'Bottom', name: 'Nike Running Shorts', brand: 'Nike' },
            { category: 'Accessory', name: 'Running Water Bottle', brand: 'Nike' },
          ],
          explanation: [
            'The Nike Air Zoom Pegasus provides excellent cushioning and responsiveness for running',
            'The Adidas moisture-wicking t-shirt keeps you dry and comfortable during intense workouts',
            'Nike running shorts offer freedom of movement and breathability for athletic performance',
            'A water bottle ensures proper hydration throughout your training session',
            'This athletic ensemble prioritizes performance, comfort, and functionality for serious runners',
          ],
        },
      };
    } else if (
      lowerContext.includes('business') ||
      lowerContext.includes('meeting') ||
      lowerContext.includes('interview')
    ) {
      return {
        occasion: 'Business Meeting',
        description: 'Professional and sophisticated look for important meetings',
        categories: {
          shoes: [
            {
              id: 'mock-4',
              name: 'Classic Oxford Dress Shoes',
              brand: 'Cole Haan',
              price: { regular: 2500000, isOnSale: false, discountPercent: 0 },
              image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300',
              description: 'Black leather oxford shoes perfect for formal occasions',
              variants: { colors: ['Black', 'Brown'], sizes: [38, 39, 40, 41, 42, 43, 44, 45] },
              inventory: [
                { color: 'Black', size: 40, quantity: 5 },
                { color: 'Black', size: 41, quantity: 3 },
                { color: 'Brown', size: 40, quantity: 2 },
              ],
            },
          ],
          tops: [
            {
              id: 'mock-5',
              name: 'Business Dress Shirt',
              brand: 'Hugo Boss',
              price: { regular: 1200000, isOnSale: false, discountPercent: 0 },
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
              description: 'Classic white dress shirt for formal occasions',
              variants: { colors: ['White', 'Blue'], sizes: ['S', 'M', 'L', 'XL'] },
              inventory: [
                { color: 'White', size: 'M', quantity: 4 },
                { color: 'Blue', size: 'L', quantity: 3 },
              ],
            },
          ],
          bottoms: [
            {
              id: 'mock-6',
              name: 'Navy Dress Pants',
              brand: 'Hugo Boss',
              price: { regular: 1800000, isOnSale: false, discountPercent: 0 },
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
              description: 'Classic navy dress pants with modern fit',
              variants: { colors: ['Navy', 'Black'], sizes: ['S', 'M', 'L', 'XL'] },
              inventory: [
                { color: 'Navy', size: 'M', quantity: 2 },
                { color: 'Navy', size: 'L', quantity: 1 },
              ],
            },
          ],
          accessories: [
            {
              id: 'mock-7',
              name: 'Leather Briefcase',
              brand: 'Tumi',
              price: { regular: 12000000, isOnSale: false, discountPercent: 0 },
              image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300',
              description: 'Professional leather briefcase for documents',
              variants: { colors: ['Black', 'Brown'], sizes: ['One Size'] },
              inventory: [{ color: 'Black', size: 'One Size', quantity: 3 }],
            },
          ],
        },
        tips: [
          'Choose neutral colors like navy, black, or charcoal',
          'Ensure proper fit - not too tight or loose',
          'Polish your shoes and iron your shirt',
          'Keep accessories minimal and professional',
        ],
        aiCompleteOutfit: {
          outfit: [
            { category: 'Shoes', name: 'Classic Oxford Dress Shoes', brand: 'Cole Haan' },
            { category: 'Top', name: 'Business Dress Shirt', brand: 'Hugo Boss' },
            { category: 'Bottom', name: 'Navy Dress Pants', brand: 'Hugo Boss' },
            { category: 'Accessory', name: 'Leather Briefcase', brand: 'Tumi' },
          ],
          explanation: [
            'Oxford dress shoes provide classic elegance and professional polish for business settings',
            'A crisp white dress shirt conveys professionalism and attention to detail',
            'Navy dress pants offer versatility and sophistication while maintaining comfort',
            'A quality leather briefcase completes the professional look and provides functionality',
            'This business ensemble balances professionalism with comfort for all-day corporate wear',
          ],
        },
      };
    } else {
      return {
        occasion: 'General Occasion',
        description: 'Versatile look suitable for various activities',
        categories: {
          shoes: [
            {
              id: 'mock-7',
              name: 'Versatile Sneakers',
              brand: 'Adidas',
              price: { regular: 2800000, isOnSale: false, discountPercent: 0 },
              image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300',
              description: 'Comfortable sneakers suitable for various occasions',
              variants: { colors: ['White', 'Black'], sizes: [38, 39, 40, 41, 42, 43, 44, 45] },
              inventory: [
                { color: 'White', size: 40, quantity: 8 },
                { color: 'White', size: 41, quantity: 5 },
                { color: 'Black', size: 40, quantity: 6 },
              ],
            },
          ],
          tops: [
            {
              id: 'mock-8',
              name: 'Casual T-Shirt',
              brand: 'Zara',
              price: { regular: 350000, isOnSale: false, discountPercent: 0 },
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
              description: 'Versatile casual t-shirt for everyday wear',
              variants: { colors: ['Blue', 'Gray'], sizes: ['S', 'M', 'L', 'XL'] },
              inventory: [
                { color: 'Blue', size: 'M', quantity: 4 },
                { color: 'Gray', size: 'L', quantity: 3 },
              ],
            },
          ],
          bottoms: [
            {
              id: 'mock-9',
              name: 'Casual Jeans',
              brand: 'Zara',
              price: { regular: 800000, isOnSale: false, discountPercent: 0 },
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
              description: 'Comfortable jeans for casual occasions',
              variants: { colors: ['Blue', 'Black'], sizes: ['S', 'M', 'L', 'XL'] },
              inventory: [
                { color: 'Blue', size: 'M', quantity: 4 },
                { color: 'Black', size: 'L', quantity: 3 },
              ],
            },
          ],
          accessories: [
            {
              id: 'mock-10',
              name: 'Crossbody Bag',
              brand: 'Coach',
              price: { regular: 4500000, isOnSale: false, discountPercent: 0 },
              image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300',
              description: 'Practical crossbody bag for hands-free convenience',
              variants: { colors: ['Black', 'Brown'], sizes: ['One Size'] },
              inventory: [{ color: 'Black', size: 'One Size', quantity: 2 }],
            },
          ],
        },
        tips: [
          'Choose versatile pieces that can be mixed and matched',
          'Consider the weather and activity level',
          'Keep colors neutral for maximum versatility',
          'Add personal touches with accessories',
        ],
        aiCompleteOutfit: {
          outfit: [
            { category: 'Shoes', name: 'Versatile Sneakers', brand: 'Adidas' },
            { category: 'Top', name: 'Casual T-Shirt', brand: 'Zara' },
            { category: 'Bottom', name: 'Casual Jeans', brand: 'Zara' },
            { category: 'Accessory', name: 'Crossbody Bag', brand: 'Coach' },
          ],
          explanation: [
            'Versatile sneakers provide comfort and style for various activities and terrains',
            'A quality casual t-shirt offers comfort while maintaining a polished appearance',
            'Classic jeans provide timeless style and versatility for multiple occasions',
            'A crossbody bag adds functionality and style while keeping hands free',
            'This versatile ensemble works for casual outings, shopping, or relaxed social events',
          ],
        },
      };
    }
  }
}

export default AIProductService;
