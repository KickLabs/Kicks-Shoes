import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Spin,
  message,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Input,
  Modal,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  EditOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import axiosInstance from '../../../services/axiosInstance';
import { addOrUpdateCartItem } from '../cart/cartService';
import ProductImageGallery from '../product/components/ProductImageGallery';
import SizePanel from '../product/components/SizePanel';
import { formatPrice } from '../../../utils/StringFormat';
import './OutfitSuggestionPage.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const OutfitSuggestionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [outfitSuggestions, setOutfitSuggestions] = useState(null);
  const [context, setContext] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [newContext, setNewContext] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAddingAllToCart, setIsAddingAllToCart] = useState(false);
  const [showAddAllModal, setShowAddAllModal] = useState(false);
  const [outfitProducts, setOutfitProducts] = useState([]);
  const [selectedOutfitItems, setSelectedOutfitItems] = useState({});

  // Product modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetail, setProductDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    console.log('OutfitSuggestionPage mounted, location.state:', location.state);
    if (location.state?.context) {
      setContext(location.state.context);
      setNewContext(location.state.context);
      generateOutfitSuggestions(location.state.context);
    } else {
      console.log('No context found, redirecting to home');
      navigate('/');
    }
  }, [location.state, navigate]);

  const generateOutfitSuggestions = async context => {
    setLoading(true);

    try {
      // Call AI Gemini API to analyze context and get products
      const response = await axiosInstance.post('/ai/outfit-suggestion', {
        context: context,
        limit: 9, // Get 3 products for each category
      });

      if (response.data.success) {
        setOutfitSuggestions(response.data.data);
      } else {
        throw new Error('Failed to get outfit suggestions');
      }
    } catch (error) {
      console.error('Error generating outfit suggestions:', error);
      message.warning('Using mock data for demonstration');
      // Fallback to mock data
      const suggestions = generateMockSuggestions(context);
      setOutfitSuggestions(suggestions);
    } finally {
      setLoading(false);
    }
  };

  const generateMockSuggestions = context => {
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
              id: '1',
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
          clothing: [
            {
              id: '2',
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
          accessories: [
            {
              id: '3',
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
              id: '1',
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
          clothing: [
            {
              id: '2',
              name: 'Navy Blue Suit',
              brand: 'Hugo Boss',
              price: { regular: 8500000, isOnSale: false, discountPercent: 0 },
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
              description: 'Classic navy blue suit with modern fit',
              variants: { colors: ['Navy', 'Black'], sizes: ['S', 'M', 'L', 'XL'] },
              inventory: [
                { color: 'Navy', size: 'M', quantity: 2 },
                { color: 'Navy', size: 'L', quantity: 1 },
              ],
            },
          ],
          accessories: [
            {
              id: '3',
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
      };
    } else {
      return {
        occasion: 'General Occasion',
        description: 'Versatile look suitable for various activities',
        categories: {
          shoes: [
            {
              id: '4',
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
          clothing: [
            {
              id: '5',
              name: 'Smart Casual Outfit',
              brand: 'Zara',
              price: { regular: 3500000, isOnSale: false, discountPercent: 0 },
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
              description: 'Versatile outfit that works for multiple occasions',
              variants: { colors: ['Blue', 'Gray'], sizes: ['S', 'M', 'L', 'XL'] },
              inventory: [
                { color: 'Blue', size: 'M', quantity: 4 },
                { color: 'Gray', size: 'L', quantity: 3 },
              ],
            },
          ],
          accessories: [
            {
              id: '6',
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
      };
    }
  };

  const handleEditContext = () => {
    setShowEditModal(true);
  };

  const handleUpdateContext = () => {
    if (!newContext.trim()) {
      message.warning('Please enter a context!');
      return;
    }
    setContext(newContext.trim());
    setShowEditModal(false);
    generateOutfitSuggestions(newContext.trim());
  };

  const optimizeContext = async () => {
    if (!context.trim()) {
      message.warning('Please enter a context first!');
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await axiosInstance.post('/ai/optimize-context', {
        context: context.trim(),
      });

      if (response.data.success) {
        const optimizedContext = response.data.data.optimizedContext;
        setContext(optimizedContext);
        message.success('Context optimized successfully!');
      } else {
        throw new Error('Failed to optimize context');
      }
    } catch (error) {
      console.error('Error optimizing context:', error);
      message.error('Failed to optimize context. Using original context.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const addAllToCart = async () => {
    if (!outfitSuggestions?.aiCompleteOutfit?.outfit) {
      message.warning('No complete outfit available to add to cart!');
      return;
    }

    console.log('Outfit suggestions:', outfitSuggestions);
    console.log('AI Complete Outfit:', outfitSuggestions.aiCompleteOutfit);

    // Get all products from the complete outfit
    const outfitItems = outfitSuggestions.aiCompleteOutfit.outfit;

    // Find corresponding products from categories
    const allProducts = [
      ...outfitSuggestions.categories.shoes,
      ...outfitSuggestions.categories.tops,
      ...outfitSuggestions.categories.bottoms,
      ...outfitSuggestions.categories.accessories,
    ];

    console.log('All available products:', allProducts);
    console.log('Outfit items to find:', outfitItems);

    // Find products and prepare for modal
    const productsToAdd = [];
    const initialSelections = {};
    const addedProductIds = new Set(); // Track added products to avoid duplicates

    outfitItems.forEach((outfitItem, index) => {
      console.log('Looking for outfit item:', outfitItem);
      console.log(
        'Available products for matching:',
        allProducts.map(p => ({ name: p.name, brand: p.brand, type: p.productType }))
      );

      // Try multiple matching strategies
      let product = null;

      // Strategy 1: Exact match
      product = allProducts.find(
        p => p.name === outfitItem.name && p.brand.toLowerCase() === outfitItem.brand.toLowerCase()
      );
      console.log('Strategy 1 (Exact match) result:', product?.name);

      // Strategy 2: Partial name match with exact brand
      if (!product) {
        product = allProducts.find(
          p =>
            p.name.toLowerCase().includes(outfitItem.name.toLowerCase()) &&
            p.brand.toLowerCase() === outfitItem.brand.toLowerCase()
        );
        console.log('Strategy 2 (Partial name + exact brand) result:', product?.name);
      }

      // Strategy 3: Reverse partial match (outfit name contains product name)
      if (!product) {
        product = allProducts.find(
          p =>
            outfitItem.name.toLowerCase().includes(p.name.toLowerCase()) &&
            p.brand.toLowerCase() === outfitItem.brand.toLowerCase()
        );
        console.log('Strategy 3 (Reverse partial) result:', product?.name);
      }

      // Strategy 4: Brand match with category
      if (!product) {
        const categoryMap = {
          Shoes: 'shoes',
          Top: 'clothing',
          Bottom: 'clothing',
          Accessory: 'accessory',
        };

        product = allProducts.find(
          p =>
            p.brand.toLowerCase() === outfitItem.brand.toLowerCase() &&
            p.productType === categoryMap[outfitItem.category]
        );
        console.log('Strategy 4 (Brand + category) result:', product?.name);
      }

      // Strategy 5: Just brand match
      if (!product) {
        product = allProducts.find(p => p.brand.toLowerCase() === outfitItem.brand.toLowerCase());
        console.log('Strategy 5 (Just brand) result:', product?.name);
      }

      // Strategy 6: Fuzzy name matching (more flexible)
      if (!product) {
        const outfitNameWords = outfitItem.name.toLowerCase().split(' ');
        product = allProducts.find(p => {
          const productNameWords = p.name.toLowerCase().split(' ');
          const brandMatch = p.brand.toLowerCase() === outfitItem.brand.toLowerCase();
          const hasCommonWords = outfitNameWords.some(word =>
            productNameWords.some(pWord => pWord.includes(word) || word.includes(pWord))
          );
          return brandMatch && hasCommonWords;
        });
        console.log('Strategy 6 (Fuzzy matching) result:', product?.name);
      }

      console.log('Final found product:', product?.name || 'NOT FOUND');

      if (product && !addedProductIds.has(product.id)) {
        // Only add if not already added
        addedProductIds.add(product.id);

        // Determine correct outfit category based on product type
        let correctOutfitCategory;

        if (product.productType === 'shoes') {
          correctOutfitCategory = 'Shoes';
        } else if (product.productType === 'clothing') {
          // For clothing, determine if it's Top or Bottom based on AI suggestion
          correctOutfitCategory = outfitItem.category === 'Bottom' ? 'Bottom' : 'Top';
        } else if (product.productType === 'accessory') {
          correctOutfitCategory = 'Accessory';
        } else {
          // Fallback to AI suggestion
          correctOutfitCategory = outfitItem.category;
        }

        productsToAdd.push({
          ...product,
          outfitCategory: correctOutfitCategory,
        });

        // Set default selections with appropriate size
        let defaultSize = 'One Size';

        // Set appropriate default size based on product type
        if (
          product.productType === 'clothing' ||
          product.outfitCategory === 'Top' ||
          product.outfitCategory === 'Bottom' ||
          product.outfitCategory === 'Clothing'
        ) {
          // For clothing, prefer M size
          const clothingSizes = product.variants?.sizes?.filter(
            size =>
              ![
                '30',
                '31',
                '32',
                '33',
                '34',
                '35',
                '36',
                '37',
                '38',
                '39',
                '40',
                '41',
                '42',
                '43',
                '44',
                '45',
                '46',
                '47',
                '48',
                '49',
                '50',
              ].includes(size.toString())
          );
          defaultSize = clothingSizes?.includes('M')
            ? 'M'
            : clothingSizes?.includes('L')
              ? 'L'
              : clothingSizes?.[0] || 'M';
        } else if (product.productType === 'shoes' || product.outfitCategory === 'Shoes') {
          // For shoes, prefer size 42
          defaultSize = product.variants?.sizes?.includes('42')
            ? '42'
            : product.variants?.sizes?.includes('41')
              ? '41'
              : product.variants?.sizes?.[0] || '42';
        } else if (product.productType === 'accessory' || product.outfitCategory === 'Accessory') {
          // For accessories, use OneSize
          defaultSize = product.variants?.sizes?.includes('OneSize') ? 'OneSize' : 'One Size';
        }

        initialSelections[product.id] = {
          color: product.variants?.colors?.[0] || 'Default',
          size: defaultSize,
          quantity: 1,
        };
      } else {
        console.warn(`Product not found for: ${outfitItem.name} by ${outfitItem.brand}`);
      }
    });

    // Always ensure we have products to show - create virtual products from AI suggestions if needed
    let finalProducts = productsToAdd;

    if (productsToAdd.length === 0) {
      console.log(
        'No products found from outfit items, creating virtual products from AI suggestions'
      );

      // Create virtual products from AI suggestions
      const virtualProducts = [];

      outfitItems.forEach((outfitItem, index) => {
        const categoryMap = {
          Shoes: 'shoes',
          Top: 'clothing',
          Bottom: 'clothing',
          Accessory: 'accessory',
        };

        const virtualProduct = {
          id: `virtual_${outfitItem.category}_${index}`,
          name: outfitItem.name,
          brand: outfitItem.brand,
          productType: categoryMap[outfitItem.category] || 'clothing',
          outfitCategory: outfitItem.category,
          price: {
            regular: 1000000, // Default price
            isOnSale: false,
            discountPercent: 0,
          },
          variants: {
            colors: ['Black', 'White', 'Gray'],
            sizes:
              outfitItem.category === 'Shoes'
                ? ['38', '39', '40', '41', '42', '43', '44', '45']
                : outfitItem.category === 'Accessory'
                  ? ['OneSize']
                  : ['S', 'M', 'L', 'XL'],
          },
          mainImage: '/no-image.png',
          isVirtual: true, // Mark as virtual product
        };

        virtualProducts.push(virtualProduct);

        // Set default selections for virtual products
        let defaultSize = 'One Size';
        if (outfitItem.category === 'Shoes') {
          defaultSize = '42';
        } else if (outfitItem.category === 'Top' || outfitItem.category === 'Bottom') {
          defaultSize = 'M';
        } else if (outfitItem.category === 'Accessory') {
          defaultSize = 'OneSize';
        }

        initialSelections[virtualProduct.id] = {
          color: virtualProduct.variants.colors[0],
          size: defaultSize,
          quantity: 1,
        };
      });

      finalProducts = virtualProducts;
    } else if (productsToAdd.length < outfitItems.length) {
      console.log('Some products not found, creating virtual products for missing items');

      // Find which outfit items are missing by comparing with found products
      const missingOutfitItems = [];

      outfitItems.forEach(outfitItem => {
        const found = productsToAdd.find(
          product =>
            product.name.toLowerCase() === outfitItem.name.toLowerCase() &&
            product.brand.toLowerCase() === outfitItem.brand.toLowerCase()
        );

        if (!found) {
          missingOutfitItems.push(outfitItem);
        }
      });

      console.log('Missing outfit items:', missingOutfitItems);

      // Create virtual products for missing items
      missingOutfitItems.forEach((outfitItem, index) => {
        const categoryMap = {
          Shoes: 'shoes',
          Top: 'clothing',
          Bottom: 'clothing',
          Accessory: 'accessory',
        };

        const virtualProduct = {
          id: `virtual_${outfitItem.category}_${index}`,
          name: outfitItem.name,
          brand: outfitItem.brand,
          productType: categoryMap[outfitItem.category] || 'clothing',
          outfitCategory: outfitItem.category,
          price: {
            regular: 1000000, // Default price
            isOnSale: false,
            discountPercent: 0,
          },
          variants: {
            colors: ['Black', 'White', 'Gray'],
            sizes:
              outfitItem.category === 'Shoes'
                ? ['38', '39', '40', '41', '42', '43', '44', '45']
                : outfitItem.category === 'Accessory'
                  ? ['OneSize']
                  : ['S', 'M', 'L', 'XL'],
          },
          mainImage: '/no-image.png',
          isVirtual: true, // Mark as virtual product
        };

        finalProducts.push(virtualProduct);

        // Set default selections for virtual products
        let defaultSize = 'One Size';
        if (outfitItem.category === 'Shoes') {
          defaultSize = '42';
        } else if (outfitItem.category === 'Top' || outfitItem.category === 'Bottom') {
          defaultSize = 'M';
        } else if (outfitItem.category === 'Accessory') {
          defaultSize = 'OneSize';
        }

        initialSelections[virtualProduct.id] = {
          color: virtualProduct.variants.colors[0],
          size: defaultSize,
          quantity: 1,
        };
      });
    }

    if (finalProducts.length === 0) {
      message.warning('No products available to add to cart!');
      return;
    }

    console.log('Final products to show:', finalProducts);
    setOutfitProducts(finalProducts);
    setSelectedOutfitItems(initialSelections);
    setShowAddAllModal(true);
  };

  const handleAddAllToCartConfirm = async () => {
    setIsAddingAllToCart(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const product of outfitProducts) {
        try {
          // Skip virtual products - they don't exist in the database
          if (product.isVirtual) {
            console.log(`Skipping virtual product: ${product.name}`);
            continue;
          }

          const selection = selectedOutfitItems[product.id];
          if (selection) {
            await addOrUpdateCartItem(dispatch, {
              productId: product.id,
              color: selection.color,
              size: selection.size,
              quantity: selection.quantity,
            });
            successCount++;
          }
        } catch (error) {
          console.error(`Error adding ${product.name} to cart:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        message.success(`Successfully added ${successCount} items to cart!`);
        setShowAddAllModal(false);
      }

      if (errorCount > 0) {
        message.warning(`${errorCount} items could not be added to cart.`);
      }
    } catch (error) {
      console.error('Error adding items to cart:', error);
      message.error('Failed to add items to cart. Please try again.');
    } finally {
      setIsAddingAllToCart(false);
    }
  };

  const handleOutfitItemSelection = (productId, field, value) => {
    setSelectedOutfitItems(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const handleProductClick = product => {
    setSelectedProduct(product);
    setShowProductModal(true);
    setSelectedColor(product.variants?.colors?.[0] || '');
    setSelectedSize(null);
  };

  const handleAddToCart = async () => {
    if (!productDetail || !productDetail._id) {
      message.error('No product detail');
      return;
    }
    if (!selectedColor) {
      message.error('Please select color');
      return;
    }
    if (!selectedSize) {
      message.error('Please select size');
      return;
    }

    try {
      setIsAddingToCart(true);
      const price = productDetail.price.isOnSale
        ? productDetail.price.regular * (1 - productDetail.price.discountPercent / 100)
        : productDetail.price.regular;

      const cartItem = {
        product: productDetail._id,
        quantity: 1,
        size: selectedSize,
        color: selectedColor,
        price,
      };

      await dispatch(addOrUpdateCartItem(cartItem)).unwrap();
      message.success('Added to cart');
      setShowProductModal(false);
    } catch (error) {
      console.error('Error adding to cart', error);
      message.error('Error adding to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  useEffect(() => {
    if (showProductModal && selectedProduct?.id) {
      setLoadingDetail(true);
      axiosInstance
        .get(`/products/public/${selectedProduct.id}`)
        .then(res => setProductDetail(res.data.data))
        .catch(() => setProductDetail(null))
        .finally(() => setLoadingDetail(false));
    }
  }, [showProductModal, selectedProduct?.id]);

  // Color and size logic
  let safeVariants = { colors: [], sizes: [] };
  let hasInventory = false;
  let availableColors = [];
  let noColorAvailable = true;
  let colorHexMap = {
    Black: '#000000',
    White: '#FFFFFF',
    Red: '#FF0000',
    Blue: '#0000FF',
    Green: '#008000',
    Yellow: '#FFFF00',
    Gray: '#808080',
    Brown: '#A52A2A',
    Navy: '#000080',
    Pink: '#FFC0CB',
  };
  let colorOptions = [];
  let colorInventory = [];
  let availableSizes = [];
  let allSizes = [];
  let sizeData = [];
  let noSizeAvailable = true;

  if (productDetail) {
    safeVariants =
      productDetail.variants &&
      Array.isArray(productDetail.variants.colors) &&
      Array.isArray(productDetail.variants.sizes)
        ? productDetail.variants
        : { colors: [], sizes: [] };

    hasInventory = Array.isArray(productDetail.inventory) && productDetail.inventory.length > 0;
    availableColors = hasInventory
      ? (safeVariants.colors || []).filter(color =>
          productDetail.inventory.some(item => item.color === color && item.quantity > 0)
        )
      : safeVariants.colors || [];

    noColorAvailable = availableColors.length === 0;
    colorOptions = availableColors.map(color => ({
      value: color,
      hex: colorHexMap[color] || '#CCCCCC',
    }));

    colorInventory = hasInventory
      ? productDetail.inventory.filter(item => item.color === selectedColor)
      : [];

    availableSizes = hasInventory
      ? Array.from(new Set(colorInventory.filter(i => i.quantity > 0).map(i => i.size)))
      : safeVariants.sizes || [];

    // Determine appropriate sizes based on product type
    if (hasInventory) {
      // For inventory-based products, use all available sizes from variants
      allSizes = safeVariants.sizes || [];
    } else {
      // For non-inventory products, use variants sizes
      allSizes = safeVariants.sizes || [];
    }

    // Filter sizes based on product type
    let filteredSizes = allSizes;
    if (productDetail.productType === 'clothing') {
      // For clothing, filter out shoe sizes
      filteredSizes = allSizes.filter(
        size =>
          ![
            '30',
            '31',
            '32',
            '33',
            '34',
            '35',
            '36',
            '37',
            '38',
            '39',
            '40',
            '41',
            '42',
            '43',
            '44',
            '45',
            '46',
            '47',
            '48',
            '49',
            '50',
          ].includes(size.toString())
      );

      // If no clothing sizes found, use common clothing sizes
      if (filteredSizes.length === 0) {
        filteredSizes = ['S', 'M', 'L', 'XL'];
      }
    } else if (productDetail.productType === 'accessory') {
      // For accessories, use OneSize if available
      if (allSizes.includes('OneSize')) {
        filteredSizes = ['OneSize'];
      } else {
        filteredSizes = ['One Size'];
      }
    }
    // For shoes, use all sizes as they are typically shoe sizes

    sizeData = filteredSizes.map(size => ({
      value: size,
      disabled: false, // Always enable all sizes as per user request
    }));

    noSizeAvailable = availableSizes.length === 0;
  }

  // Auto set selectedColor if invalid
  useEffect(() => {
    if (
      productDetail &&
      (!selectedColor || !availableColors.includes(selectedColor)) &&
      availableColors.length > 0
    ) {
      setSelectedColor(availableColors[0]);
    }
  }, [productDetail, availableColors, selectedColor]);

  const ProductCard = ({ product }) => {
    const displayPrice = product.price.isOnSale
      ? product.price.regular * (1 - product.price.discountPercent / 100)
      : product.price.regular;

    return (
      <div className="outfit-product-card">
        <div className="outfit-product-card__image-container">
          {product.price.isOnSale && (
            <div className="outfit-product-card__badge">{product.price.discountPercent}% off</div>
          )}
          <img src={product.image} alt={product.name} className="outfit-product-card__image" />
        </div>
        <div className="outfit-product-card__info">
          <h3 className="outfit-product-card__name">{product.name}</h3>
          <p className="outfit-product-card__brand">{product.brand}</p>
          <p className="outfit-product-card__description">{product.description}</p>
        </div>
        <div className="outfit-product-card__footer">
          <button
            className="outfit-product-card__button"
            onClick={() => handleProductClick(product)}
          >
            <div className="outfit-product-card__button-inner">
              <span>ADD TO CART -</span>
              <span className="outfit-product-card__price">{formatPrice(displayPrice)}</span>
            </div>
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="outfit-suggestion-page">
        <div className="loading-container">
          <Spin size="large" />
          <Title
            level={3}
            style={{ fontFamily: 'Rubik', marginTop: 20, color: 'var(--Blue, #4a69e2)' }}
          >
            Generating your perfect outfit...
          </Title>
          <Text type="secondary">Analyzing your occasion and preferences</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="outfit-suggestion-page">
      <div className="outfit-suggestion-container-page">
        <div className="page-header">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            className="back-button default"
          >
            Back to Home
          </Button>
          <div className="header-content">
            <Title
              style={{
                textAlign: 'center',
                fontFamily: 'Rubik',
                fontStyle: 'normal',
                fontWeight: 700,
                lineHeight: 'normal',
                textTransform: 'uppercase',
                fontSize: '2.5rem',
              }}
              level={2}
            >
              Outfit Suggestion
            </Title>
            <div className="context-section">
              <div className="context-textarea-container">
                <Text
                  style={{ fontSize: '24px', fontFamily: 'Rubik', marginBottom: '10px' }}
                  type="secondary"
                  className="context-label"
                >
                  Context:
                </Text>
                <TextArea
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="Describe your occasion or activity..."
                  rows={2}
                  maxLength={200}
                  showCount
                  className="context-textarea"
                />
              </div>
              <div className="context-buttons">
                <Button
                  icon={<ThunderboltOutlined />}
                  onClick={optimizeContext}
                  size="small"
                  type="default"
                  className="optimize-button"
                  loading={isOptimizing}
                  style={{ marginRight: '8px' }}
                >
                  Optimize
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => generateOutfitSuggestions(context)}
                  size="small"
                  type="primary"
                  className="regenerate-button"
                >
                  Regenerate
                </Button>
              </div>
            </div>
          </div>
        </div>

        {outfitSuggestions && (
          <div className="suggestion-content">
            <Card className="occasion-card">
              <div className="occasion-header">
                <Title level={3}>{outfitSuggestions.occasion}</Title>
                <Paragraph>{outfitSuggestions.description}</Paragraph>
              </div>
            </Card>

            {/* Shoes Section */}
            <div className="category-section">
              <Title className="category-title" style={{ fontSize: '28px' }}>
                Shoes
              </Title>
              <Row gutter={[24, 24]}>
                {outfitSuggestions.categories.shoes.map(product => (
                  <Col xs={24} sm={12} md={8} key={product.id}>
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>
            </div>

            {/* Tops Section */}
            <div className="category-section">
              <Title className="category-title" style={{ fontSize: '28px' }}>
                Shirts
              </Title>
              <Row gutter={[24, 24]}>
                {outfitSuggestions.categories.tops?.map(product => (
                  <Col xs={24} sm={12} md={8} key={product.id}>
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>
            </div>

            {/* Bottoms Section */}
            <div className="category-section">
              <Title className="category-title" style={{ fontSize: '28px' }}>
                Pants
              </Title>
              <Row gutter={[24, 24]}>
                {outfitSuggestions.categories.bottoms?.map(product => (
                  <Col xs={24} sm={12} md={8} key={product.id}>
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>
            </div>

            {/* Accessories Section */}
            <div className="category-section">
              <Title className="category-title" style={{ fontSize: '28px' }}>
                Accessories
              </Title>
              <Row gutter={[24, 24]}>
                {outfitSuggestions.categories.accessories.map(product => (
                  <Col xs={24} sm={12} md={8} key={product.id}>
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>
            </div>

            {/* AI Complete Outfit Suggestion */}
            <Card className="ai-suggestion-card">
              <div className="ai-suggestion-header">
                <Title style={{ fontFamily: 'Rubik' }} level={3} className="ai-suggestion-title">
                  🤖 AI Complete Outfit Recommendation
                </Title>
                <Paragraph className="ai-suggestion-subtitle">
                  Our AI stylist has curated a complete outfit for you
                </Paragraph>
              </div>

              {outfitSuggestions.aiCompleteOutfit && (
                <div className="ai-outfit-content">
                  <div className="ai-outfit-recommendation">
                    <Title level={4} className="outfit-title">
                      Complete Outfit:
                    </Title>
                    <div className="outfit-items">
                      {outfitSuggestions.aiCompleteOutfit.outfit.map((item, index) => (
                        <div key={index} className="outfit-item">
                          <span className="item-category">{item.category}:</span>
                          <span className="item-name">{item.name}</span>
                          <span className="item-brand">({item.brand})</span>
                        </div>
                      ))}
                    </div>

                    {/* <div className="add-all-to-cart-section">
                      <Button
                        type="primary"
                        size="large"
                        icon={<ShoppingCartOutlined />}
                        onClick={addAllToCart}
                        loading={isAddingAllToCart}
                        className="add-all-to-cart-button"
                      >
                        {isAddingAllToCart ? 'Adding to Cart...' : 'Add Complete Outfit to Cart'}
                      </Button>
                    </div> */}
                  </div>

                  <div className="ai-outfit-explanation">
                    <Title level={4} className="explanation-title">
                      Why This Outfit Works:
                    </Title>
                    <div className="explanation-content">
                      {outfitSuggestions.aiCompleteOutfit.explanation.map((point, index) => (
                        <div key={index} className="explanation-point">
                          <span className="point-number">{index + 1}.</span>
                          <span className="point-text">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* <Card className="tips-card">
              <Title level={4}>Styling Tips</Title>
              <div className="tips-list">
                {outfitSuggestions.tips.map((tip, index) => (
                  <Tag key={index} className="tip-tag">
                    {tip}
                  </Tag>
                ))}
              </div>
            </Card> */}
          </div>
        )}

        {/* Edit Context Modal */}
        <Modal
          title="Edit Context"
          open={showEditModal}
          onOk={handleUpdateContext}
          onCancel={() => setShowEditModal(false)}
          okText="Update"
          cancelText="Cancel"
        >
          <TextArea
            placeholder="Tell us where you're going... (e.g., 'Going to a business meeting', 'Date night at a restaurant', 'Casual day at the mall')"
            value={newContext}
            onChange={e => setNewContext(e.target.value)}
            rows={3}
            maxLength={200}
            showCount
          />
        </Modal>

        {/* Add All to Cart Modal */}
        <Modal
          title="Add Complete Outfit to Cart"
          open={showAddAllModal}
          onOk={handleAddAllToCartConfirm}
          onCancel={() => setShowAddAllModal(false)}
          okText="Add All to Cart"
          cancelText="Cancel"
          width={800}
          okButtonProps={{ loading: isAddingAllToCart }}
        >
          <div className="add-all-modal-content">
            <Paragraph style={{ marginBottom: 24, fontSize: 16 }}>
              Please select size and color for each item in your complete outfit:
            </Paragraph>

            <div className="outfit-selection-list">
              {outfitProducts.map((product, index) => {
                const selection = selectedOutfitItems[product.id] || {};
                return (
                  <div key={product.id} className="outfit-selection-item">
                    <div className="product-info">
                      <img src={product.image} alt={product.name} className="product-thumbnail" />
                      <div className="product-details">
                        <div className="product-name">
                          {product.name}
                          {product.isVirtual && (
                            <span
                              style={{
                                color: '#ff6b35',
                                fontSize: '12px',
                                marginLeft: '8px',
                                fontWeight: 'bold',
                              }}
                            >
                              (Not Available)
                            </span>
                          )}
                        </div>
                        <div className="product-brand">{product.brand}</div>
                        <div className="product-category">{product.outfitCategory}</div>
                        <div className="product-price">
                          {product.price?.isOnSale ? (
                            <>
                              <span className="sale-price">
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND',
                                }).format(
                                  product.price.regular * (1 - product.price.discountPercent / 100)
                                )}
                              </span>
                              <span className="original-price">
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND',
                                }).format(product.price.regular)}
                              </span>
                            </>
                          ) : (
                            <span className="regular-price">
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(product.price?.regular || 0)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="selection-controls">
                      <div className="selection-group">
                        <label>Color:</label>
                        <select
                          value={selection.color || ''}
                          onChange={e =>
                            handleOutfitItemSelection(product.id, 'color', e.target.value)
                          }
                          className="selection-select"
                        >
                          {product.variants?.colors?.map(color => (
                            <option key={color} value={color}>
                              {color}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="selection-group">
                        <label>Size:</label>
                        <select
                          value={selection.size || ''}
                          onChange={e =>
                            handleOutfitItemSelection(product.id, 'size', e.target.value)
                          }
                          className="selection-select"
                        >
                          {(() => {
                            // Get appropriate sizes based on product type
                            let sizes = product.variants?.sizes || [];

                            // For clothing items, filter out shoe sizes and use clothing sizes
                            if (
                              product.productType === 'clothing' ||
                              product.outfitCategory === 'Top' ||
                              product.outfitCategory === 'Bottom' ||
                              product.outfitCategory === 'Clothing'
                            ) {
                              sizes = sizes.filter(
                                size =>
                                  ![
                                    '30',
                                    '31',
                                    '32',
                                    '33',
                                    '34',
                                    '35',
                                    '36',
                                    '37',
                                    '38',
                                    '39',
                                    '40',
                                    '41',
                                    '42',
                                    '43',
                                    '44',
                                    '45',
                                    '46',
                                    '47',
                                    '48',
                                    '49',
                                    '50',
                                  ].includes(size.toString())
                              );

                              // If no clothing sizes found, use common clothing sizes
                              if (sizes.length === 0) {
                                sizes = ['S', 'M', 'L', 'XL'];
                              }
                            }

                            // For accessories, use OneSize if available
                            if (
                              product.productType === 'accessory' ||
                              product.outfitCategory === 'Accessory'
                            ) {
                              if (sizes.includes('OneSize')) {
                                sizes = ['OneSize'];
                              } else {
                                sizes = ['One Size'];
                              }
                            }

                            return sizes.map(size => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>

                      <div className="selection-group">
                        <label>Quantity:</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={selection.quantity || 1}
                          onChange={e =>
                            handleOutfitItemSelection(
                              product.id,
                              'quantity',
                              parseInt(e.target.value)
                            )
                          }
                          className="selection-input"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>

        {/* Product Detail Modal */}
        <Modal
          open={showProductModal}
          onCancel={() => setShowProductModal(false)}
          title={null}
          width={900}
          bodyStyle={{ padding: 32 }}
          footer={null}
        >
          {loadingDetail ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 400,
              }}
            >
              <Spin size="large" />
            </div>
          ) : !productDetail ? (
            <Alert type="error" message="No product detail" />
          ) : (
            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
              {/* Gallery */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {productDetail.colorOptions && productDetail.colorOptions.length > 0 ? (
                  <ProductImageGallery
                    colorOptions={productDetail.colorOptions}
                    selectedColor={selectedColor}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 500,
                      background: '#f7f7f7',
                      borderRadius: 16,
                    }}
                  >
                    <img
                      src={
                        Array.isArray(productDetail.mainImage)
                          ? productDetail.mainImage[0]
                          : productDetail.mainImage || '/no-image.png'
                      }
                      alt={productDetail.name}
                      style={{ width: 300, height: 300, objectFit: 'contain', borderRadius: 16 }}
                    />
                  </div>
                )}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 28, marginBottom: 8 }}>
                  {productDetail.name}
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 24,
                    color: 'var(--Blue, #4a69e2)',
                    marginBottom: 16,
                  }}
                >
                  {productDetail.price.isOnSale
                    ? formatPrice(
                        productDetail.price.regular *
                          (1 - productDetail.price.discountPercent / 100)
                      )
                    : formatPrice(productDetail.price.regular)}
                </div>
                {/* Color Selection */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>COLOR</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {noColorAvailable ? (
                      <span style={{ color: 'red' }}>No available color</span>
                    ) : (
                      colorOptions.map(color => (
                        <div
                          key={color.value}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            border:
                              selectedColor === color.value
                                ? '2px solid var(--Blue, #4a69e2)'
                                : '1px solid #ccc',
                            background: color.hex,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onClick={() => {
                            setSelectedColor(color.value);
                            setSelectedSize(null);
                          }}
                          title={color.value}
                        >
                          {selectedColor === color.value && (
                            <span style={{ color: 'var(--Blue, #4a69e2)', fontWeight: 700 }}>
                              ✔
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {/* Size Selection */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>SIZE</div>
                  {noSizeAvailable ? (
                    <span style={{ color: 'red' }}>No available size for this color</span>
                  ) : (
                    <SizePanel
                      sizes={sizeData}
                      selectedSize={selectedSize}
                      onSizeSelect={setSelectedSize}
                    />
                  )}
                </div>
                {/* Add to Cart Button */}
                <button
                  className="outfit-product-card__button"
                  style={{ width: '100%', marginBottom: 16 }}
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || !productDetail || !productDetail._id}
                >
                  <div className="outfit-product-card__button-inner">
                    <span>ADD TO CART -</span>
                    <span className="outfit-product-card__price">
                      {formatPrice(
                        productDetail.price.isOnSale
                          ? productDetail.price.regular *
                              (1 - productDetail.price.discountPercent / 100)
                          : productDetail.price.regular
                      )}
                    </span>
                  </div>
                </button>
                {/* Description */}
                {productDetail.summary && (
                  <div style={{ fontSize: 15, color: '#555', marginBottom: 12 }}>
                    {productDetail.summary}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default OutfitSuggestionPage;
