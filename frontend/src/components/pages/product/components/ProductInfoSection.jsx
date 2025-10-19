import { useState, useEffect } from 'react';
import { Button, Typography, Modal, message, Upload, Spin } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { formatPrice } from '../../../../utils/StringFormat';
import './ProductInfoSection.css';
import SizePanel from './SizePanel';
import { HeartOutlined, HeartFilled, ExclamationCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { addOrUpdateCartItem } from '../../cart/cartService';
import { useAuth } from '../../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/services/axiosInstance';
import { useFlashSales } from '../../../../hooks/useFlashSales';
import CountdownTimer from '../../../common/components/CountdownTimer';
// Using Next.js route /api/tryon directly; remove legacy tryonService usage

const { Paragraph } = Typography;

const ProductInfoSection = ({ product, selectedColor, setSelectedColor }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getProductFlashSale } = useFlashSales();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [isFavourite, setIsFavourite] = useState(false);
  const [favouriteLoading, setFavouriteLoading] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('fake_product');
  const [reportDescription, setReportDescription] = useState('');
  const [reportEvidence, setReportEvidence] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  // Try-on state
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [personFile, setPersonFile] = useState(null);
  const [garmentFile, setGarmentFile] = useState(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnImageUrl, setTryOnImageUrl] = useState(null);

  // Flash sale logic
  const flashSaleInfo = getProductFlashSale(product._id);
  const isFlashSaleActive = !!flashSaleInfo;

  // Debug logging
  if (product._id === '68592c166b62c151554c73d6') {
    console.log('Product Detail Debug:', {
      productId: product._id,
      productName: product.name,
      flashSaleInfo,
      isFlashSaleActive,
      finalPrice: product.finalPrice,
      regularPrice: product.price.regular,
    });
  }

  // Helper function to find inventory item based on product type
  const findInventoryItem = (size, color) => {
    if (!product.inventory || !Array.isArray(product.inventory)) return null;

    if (product.productType === 'shoes') {
      return product.inventory.find(item => item.size === size && item.color === color);
    } else if (product.productType === 'clothing') {
      return product.inventory.find(item => item.clothingSize === size && item.color === color);
    } else if (product.productType === 'accessory') {
      return product.inventory.find(item => item.isOneSize === true && item.color === color);
    } else if (product.productType === 'other') {
      return product.inventory.find(
        item =>
          item.color === color &&
          (item.size === size ||
            item.clothingSize === size ||
            (size === 'OneSize' && item.isOneSize))
      );
    }

    // Fallback for unknown product types
    return product.inventory.find(item => item.size === size && item.color === color);
  };

  // Check if product is in favourites on component mount
  useEffect(() => {
    const checkFavouriteStatus = async () => {
      if (!user || !product) return;

      try {
        const response = await axiosInstance.get(`/favourites/check/${product._id}`);
        setIsFavourite(response.data.isFavourite);
      } catch (error) {
        console.error('Error checking favourite status:', error);
      }
    };

    checkFavouriteStatus();
  }, [user, product]);

  const handleToggleFavourite = async () => {
    if (!user) {
      message.error('Please login to add favourites');
      return;
    }

    try {
      setFavouriteLoading(true);

      if (isFavourite) {
        // Remove from favourites
        await axiosInstance.delete(`/favourites/${product._id}`);
        setIsFavourite(false);
        message.success('Removed from favourites');
      } else {
        // Add to favourites
        await axiosInstance.post('/favourites', {
          productId: product._id,
        });
        setIsFavourite(true);
        message.success('Added to favourites');
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
      message.error(
        isFavourite ? 'Failed to remove from favourites' : 'Failed to add to favourites'
      );
    } finally {
      setFavouriteLoading(false);
    }
  };

  const handleAddCart = async () => {
    try {
      // Check if size is selected
      if (!selectedSize) {
        message.error('Please select a size before adding to cart');
        return;
      }

      // Check if color is selected
      if (!selectedColor) {
        message.error('Please select a color before adding to cart');
        return;
      }

      // Check if the selected size and color combination is available
      const inventoryItem = findInventoryItem(selectedSize, selectedColor);

      if (!inventoryItem || inventoryItem.quantity === 0) {
        message.error('This size and color combination is not available');
        return;
      }

      // Lấy giá đã giảm nếu có giảm giá, ngược lại lấy giá gốc
      const finalPrice = product.price.isOnSale
        ? product.price.regular * (1 - product.price.discountPercent / 100)
        : product.price.regular;

      await dispatch(
        addOrUpdateCartItem({
          product: product._id,
          quantity: 1,
          size: selectedSize,
          color: selectedColor,
          price: finalPrice,
        })
      ).unwrap();
      message.success('Added to cart successfully!');
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      message.error('Failed to add to cart.');
    }
  };

  const handleBuyNow = async () => {
    try {
      // Check if user is logged in
      if (!user) {
        message.error('Please login to purchase');
        navigate('/login');
        return;
      }

      // Check if size is selected
      if (!selectedSize) {
        message.error('Please select a size before purchasing');
        return;
      }

      // Check if color is selected
      if (!selectedColor) {
        message.error('Please select a color before purchasing');
        return;
      }

      // Check if the selected size and color combination is available
      const inventoryItem = findInventoryItem(selectedSize, selectedColor);

      if (!inventoryItem || inventoryItem.quantity === 0) {
        message.error('This size and color combination is not available');
        return;
      }

      // Lấy giá đã giảm nếu có giảm giá, ngược lại lấy giá gốc
      const finalPrice = product.price.isOnSale
        ? product.price.regular * (1 - product.price.discountPercent / 100)
        : product.price.regular;

      // Create a temporary cart item for buy now
      const buyNowItem = {
        product: product._id,
        quantity: 1,
        size: selectedSize,
        color: selectedColor,
        price: finalPrice,
        productDetails: {
          name: product.name,
          mainImage: product.mainImage,
          brand: product.brand,
          category: product.category,
          price: {
            regular: product.price.regular,
            isOnSale: product.price.isOnSale,
            discountPercent: product.price.discountPercent,
          },
        },
      };

      // Store buy now item in localStorage for checkout
      localStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));

      // Navigate to checkout
      navigate('/checkout?buyNow=true');
    } catch (error) {
      console.error('Error processing buy now:', error);
      message.error('Failed to process purchase.');
    }
  };

  // Fallback cho product.variants
  const safeVariants =
    product.variants &&
    Array.isArray(product.variants.colors) &&
    Array.isArray(product.variants.sizes)
      ? product.variants
      : { colors: [], sizes: [] };

  // Nếu không có inventory hoặc inventory rỗng, render toàn bộ màu/size từ variants
  const hasInventory = Array.isArray(product.inventory) && product.inventory.length > 0;

  // Lọc danh sách màu chỉ lấy màu có tồn kho nếu có inventory, ngược lại lấy toàn bộ từ variants
  const availableColors = hasInventory
    ? (safeVariants.colors || []).filter(color =>
        product.inventory.some(item => item.color === color && item.quantity > 0)
      )
    : safeVariants.colors || [];
  const noColorAvailable = availableColors.length === 0;

  // HEX mã màu
  const colorHexMap = {
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

  // Màu từ availableColors
  const colorOptions = availableColors.map(color => ({
    value: color,
    hex: colorHexMap[color] || '#CCCCCC',
  }));

  // Get size options based on product type
  const getSizeOptions = () => {
    switch (product.productType) {
      case 'shoes':
        return [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50];
      case 'clothing':
        return ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
      case 'accessory':
        return ['OneSize'];
      case 'other':
        return ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', 'OneSize'];
      default:
        return [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50];
    }
  };

  // Inventory theo màu đang chọn
  const colorInventory = hasInventory
    ? product.inventory.filter(item => item.color === selectedColor)
    : [];

  // Get available sizes from inventory based on product type
  const getAvailableSizesFromInventory = () => {
    if (!hasInventory) return safeVariants.sizes || [];

    const availableSizes = [];
    colorInventory.forEach(item => {
      if (item.quantity > 0) {
        // For shoes, use numeric size
        if (product.productType === 'shoes' && item.size) {
          availableSizes.push(item.size);
        }
        // For clothing, use clothingSize
        else if (product.productType === 'clothing' && item.clothingSize) {
          availableSizes.push(item.clothingSize);
        }
        // For accessories, use isOneSize
        else if (product.productType === 'accessory' && item.isOneSize) {
          availableSizes.push('OneSize');
        }
        // For other, check all size types
        else if (product.productType === 'other') {
          if (item.size) availableSizes.push(item.size);
          if (item.clothingSize) availableSizes.push(item.clothingSize);
          if (item.isOneSize) availableSizes.push('OneSize');
        }
      }
    });
    return Array.from(new Set(availableSizes));
  };

  const availableSizes = getAvailableSizesFromInventory();

  // Get all possible sizes for this product type
  const allSizes = hasInventory ? getSizeOptions() : safeVariants.sizes || [];

  // Create size data for SizePanel
  const sizeData = hasInventory
    ? allSizes.map(size => {
        let inventoryEntry = null;

        // Find inventory entry based on product type
        if (product.productType === 'shoes') {
          inventoryEntry = colorInventory.find(item => item.size === size);
        } else if (product.productType === 'clothing') {
          inventoryEntry = colorInventory.find(item => item.clothingSize === size);
        } else if (product.productType === 'accessory') {
          inventoryEntry = colorInventory.find(item => item.isOneSize === true);
        } else if (product.productType === 'other') {
          inventoryEntry = colorInventory.find(
            item =>
              item.size === size ||
              item.clothingSize === size ||
              (size === 'OneSize' && item.isOneSize)
          );
        }

        return {
          value: size,
          disabled: !inventoryEntry || inventoryEntry.quantity === 0,
        };
      })
    : allSizes.map(size => ({ value: size, disabled: false }));

  // Check if no sizes are available
  const noSizeAvailable = availableSizes.length === 0;

  // Log dữ liệu đầu vào để debug
  console.log('product.variants:', product.variants);

  // Nếu selectedColor không hợp lệ, tự động set lại
  useEffect(() => {
    if (
      (!selectedColor || !availableColors.includes(selectedColor)) &&
      availableColors.length > 0
    ) {
      setSelectedColor(availableColors[0]);
    }
  }, [availableColors, selectedColor, setSelectedColor]);

  return (
    <div className="product-info">
      {/* Badges */}
      <div className="product-tags">
        {isFlashSaleActive ? (
          <div
            style={{ backgroundColor: '#ff4757', width: '80px' }}
            className="product-card__badge"
          >
            Flash Sale
          </div>
        ) : product.isNew ? (
          <div className="product-card__badge new-badge">New</div>
        ) : (
          product.price.isOnSale && (
            <div
              style={{ backgroundColor: '#FFA52F', width: '70px' }}
              className="product-card__badge"
            >
              {product.price.discountPercent}% off
            </div>
          )
        )}
      </div>

      {/* Flash Sale Countdown */}
      {isFlashSaleActive && (
        <div className="flash-sale-countdown">
          <div className="countdown-header">
            <span className="countdown-title">Flash Sale End In:</span>
          </div>
          <CountdownTimer
            endDate={flashSaleInfo.endDate}
            size="medium"
            showLabels={true}
            originalPrice={product.finalPrice || product.price?.regular || 0}
          />
        </div>
      )}

      {/* Name + Price */}

      <h1 style={{ fontSize: '2.5em', fontWeight: 600 }} className="product-name">
        {product.name}{' '}
        <Button
          type="text"
          danger
          icon={<ExclamationCircleOutlined style={{ fontSize: 20 }} />}
          style={{ marginLeft: 8, verticalAlign: 'middle' }}
          onClick={() => setReportModalOpen(true)}
          title="Report product"
        />
      </h1>
      {/* Product Type Info */}
      <div className="variant-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span
            style={{
              fontSize: '12px',
              background: '#4A69E2',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              fontWeight: '500',
            }}
          >
            {product.productType || 'Product'}
          </span>
          {product.attributes?.gender && (
            <span
              style={{
                fontSize: '12px',
                background: '#52C41A',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                textTransform: 'capitalize',
                fontWeight: '500',
              }}
            >
              {product.attributes.gender}
            </span>
          )}
        </div>
      </div>
      <h2
        style={{
          fontSize: '2em',
          fontWeight: 600,
          color: '#4A69E2',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
        className="product-price"
      >
        {isFlashSaleActive ? (
          <>
            <span style={{ color: '#ff4757', fontWeight: 700 }}>
              {formatPrice(flashSaleInfo.flashPrice)}
            </span>
            <span
              style={{
                textDecoration: 'line-through',
                color: '#888',
                fontSize: '0.8em',
                marginLeft: 8,
              }}
            >
              {formatPrice(product.finalPrice || product.price.regular)}
            </span>
          </>
        ) : product.price.isOnSale ? (
          <>
            <span style={{ color: '#4A69E2', fontWeight: 700 }}>
              {formatPrice(product.price.regular * (1 - product.price.discountPercent / 100))}
            </span>
            <span
              style={{
                textDecoration: 'line-through',
                color: '#888',
                fontSize: '0.8em',
                marginLeft: 8,
              }}
            >
              {formatPrice(product.price.regular)}
            </span>
          </>
        ) : (
          <span style={{ color: '#4A69E2', fontWeight: 700 }}>
            {formatPrice(product.finalPrice || product.price.regular)}
          </span>
        )}
      </h2>

      {/* Color Selector */}
      <div className="variant-block">
        <h3 className="variant-label">Color</h3>
        <div className="color-options">
          {noColorAvailable ? (
            <span style={{ color: 'red' }}>No color available</span>
          ) : (
            colorOptions.map(color => (
              <div
                key={color.value}
                className={`color-swatch ${selectedColor === color.value ? 'active' : ''}`}
                style={{ backgroundColor: color.hex }}
                title={color.value}
                onClick={() => {
                  setSelectedColor(color.value);
                  setSelectedSize(null); // reset size khi đổi màu
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Size Selector */}
      <div className="variant-block">
        <div className="size-header">
          <h3 className="variant-label">
            Size
            {product.productType === 'shoes' && (
              <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>(EU)</span>
            )}
            {product.productType === 'clothing' && (
              <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                (Letter Size)
              </span>
            )}
            {product.productType === 'accessory' && (
              <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                (Universal)
              </span>
            )}
          </h3>
          <h4
            className="variant-label"
            style={{
              marginRight: 40,
              cursor: 'pointer',
              textDecorationLine: 'underline',
              fontWeight: 500,
            }}
            onClick={() => setIsModalOpen(true)}
          >
            Size Chart
          </h4>
        </div>
        {noSizeAvailable ? (
          <span style={{ color: 'red' }}>No size available for this color</span>
        ) : (
          <SizePanel sizes={sizeData} selectedSize={selectedSize} onSizeSelect={setSelectedSize} />
        )}
      </div>

      <Modal
        title={`Size Chart - ${product.productType?.charAt(0).toUpperCase() + product.productType?.slice(1) || 'Product'}`}
        open={isModalOpen}
        footer={null}
        onCancel={() => setIsModalOpen(false)}
        width={700}
      >
        {product.productType === 'shoes' && (
          <div>
            <h4 style={{ marginBottom: 16, color: '#4A69E2' }}>EU Shoe Sizes</h4>
            <img
              src="https://cdn.shopify.com/s/files/1/0250/7640/4884/files/men-size-chart.jpg"
              alt="Shoe Size Chart"
              style={{ width: '100%', borderRadius: 8 }}
            />
            <div style={{ marginTop: 12, fontSize: '12px', color: '#666' }}>
              <p>• Sizes are in European (EU) standard</p>
              <p>• For best fit, measure your foot length and compare with the chart</p>
            </div>
          </div>
        )}

        {product.productType === 'clothing' && (
          <div>
            <h4 style={{ marginBottom: 16, color: '#4A69E2' }}>Clothing Size Guide</h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: 16,
              }}
            >
              <div style={{ padding: '8px', background: '#f5f5f5', fontWeight: 'bold' }}>Size</div>
              <div style={{ padding: '8px', background: '#f5f5f5', fontWeight: 'bold' }}>
                Chest (cm)
              </div>
              <div style={{ padding: '8px', background: '#f5f5f5', fontWeight: 'bold' }}>
                Waist (cm)
              </div>
              <div style={{ padding: '8px', background: '#f5f5f5', fontWeight: 'bold' }}>
                Hip (cm)
              </div>

              <div style={{ padding: '8px' }}>XS</div>
              <div style={{ padding: '8px' }}>86-91</div>
              <div style={{ padding: '8px' }}>71-76</div>
              <div style={{ padding: '8px' }}>86-91</div>

              <div style={{ padding: '8px' }}>S</div>
              <div style={{ padding: '8px' }}>91-96</div>
              <div style={{ padding: '8px' }}>76-81</div>
              <div style={{ padding: '8px' }}>91-96</div>

              <div style={{ padding: '8px' }}>M</div>
              <div style={{ padding: '8px' }}>96-101</div>
              <div style={{ padding: '8px' }}>81-86</div>
              <div style={{ padding: '8px' }}>96-101</div>

              <div style={{ padding: '8px' }}>L</div>
              <div style={{ padding: '8px' }}>101-106</div>
              <div style={{ padding: '8px' }}>86-91</div>
              <div style={{ padding: '8px' }}>101-106</div>

              <div style={{ padding: '8px' }}>XL</div>
              <div style={{ padding: '8px' }}>106-111</div>
              <div style={{ padding: '8px' }}>91-96</div>
              <div style={{ padding: '8px' }}>106-111</div>

              <div style={{ padding: '8px' }}>XXL</div>
              <div style={{ padding: '8px' }}>111-116</div>
              <div style={{ padding: '8px' }}>96-101</div>
              <div style={{ padding: '8px' }}>111-116</div>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <p>• Measurements are in centimeters</p>
              <p>• For best fit, measure your body and compare with the chart</p>
            </div>
          </div>
        )}

        {product.productType === 'accessory' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h4 style={{ marginBottom: 16, color: '#4A69E2' }}>Universal Size</h4>
            <div
              style={{
                background: '#f5f7ff',
                padding: '20px',
                borderRadius: '8px',
                border: '2px dashed #4A69E2',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎒</div>
              <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>One Size Fits All</p>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                This accessory is designed to fit universally
              </p>
            </div>
          </div>
        )}

        {(product.productType === 'other' || !product.productType) && (
          <div>
            <h4 style={{ marginBottom: 16, color: '#4A69E2' }}>Size Information</h4>
            <p>Please refer to the product description for specific sizing details.</p>
            <div style={{ fontSize: '12px', color: '#666', marginTop: 16 }}>
              <p>• Contact support for size guidance</p>
              <p>• Check product reviews for fit information</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Buttons */}
      <div className="product-actions">
        <div className="top-actions">
          <Button
            onClick={() => handleAddCart()}
            size="large"
            className="cart-btn"
            disabled={!selectedSize || !selectedColor}
          >
            ADD TO CART
          </Button>
          <Button
            onClick={async () => {
              // Check if user is logged in first
              if (!user) {
                message.warning('You need to login to try on products.');
                navigate('/login');
                return;
              }

              // Auto start try-on using user's profile image and product main image
              try {
                setTryOnImageUrl(null);
                setTryOnOpen(true);
                setTryOnLoading(true);

                const personImageUrl = user?.profileImage || user?.avatar;
                const garmentImageUrl = product?.mainImage;

                if (!personImageUrl) {
                  message.error(
                    'No profile image found. Please upload your profile image in Account > Profile.'
                  );
                  setTryOnLoading(false);
                  return;
                }
                if (!garmentImageUrl) {
                  message.error('Product image not available for try-on.');
                  setTryOnLoading(false);
                  return;
                }

                const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

                const reencodeToJpeg = async (blob, filenameFallback) => {
                  try {
                    const imageBitmap = await createImageBitmap(blob).catch(() => null);
                    if (!imageBitmap) throw new Error('decode_failed');
                    const canvas = document.createElement('canvas');
                    canvas.width = imageBitmap.width;
                    canvas.height = imageBitmap.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(imageBitmap, 0, 0);
                    const reencodedBlob = await new Promise(resolve =>
                      canvas.toBlob(b => resolve(b), 'image/jpeg', 0.92)
                    );
                    if (!reencodedBlob) throw new Error('reencode_failed');
                    return new File([reencodedBlob], filenameFallback, { type: 'image/jpeg' });
                  } catch (e) {
                    return new File([blob], filenameFallback, {
                      type: blob.type || 'application/octet-stream',
                    });
                  }
                };

                const urlToSupportedFile = async (url, filenameFallback) => {
                  const res = await fetch(url, { credentials: 'omit' });
                  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
                  const contentType = res.headers.get('content-type') || '';
                  const blob = await res.blob();
                  const type = blob.type || contentType;
                  if (supportedTypes.includes(type)) {
                    return new File([blob], filenameFallback, { type });
                  }
                  return reencodeToJpeg(
                    blob,
                    filenameFallback.endsWith('.jpg') ? filenameFallback : `${filenameFallback}.jpg`
                  );
                };

                const [personAutoFile, garmentAutoFile] = await Promise.all([
                  urlToSupportedFile(personImageUrl, 'person.jpg'),
                  urlToSupportedFile(garmentImageUrl, 'garment.jpg'),
                ]);

                const formData = new FormData();
                formData.append('userImage', personAutoFile);
                formData.append('clothingImage', garmentAutoFile);

                // Debug: Log the environment and URL being used
                console.log('=== TRYON FRONTEND DEBUG ===');
                console.log('Environment variables:', {
                  VITE_TRYON_API_URL: import.meta.env?.VITE_TRYON_API_URL,
                  VITE_API_BASE_URL: import.meta.env?.VITE_API_BASE_URL,
                  NODE_ENV: import.meta.env?.NODE_ENV,
                  MODE: import.meta.env?.MODE,
                });
                console.log('Current window location:', window.location.href);
                console.log('Current window hostname:', window.location.hostname);

                // Use the backend URL instead of relative path
                const tryOnUrl =
                  (import.meta.env && import.meta.env.VITE_TRYON_API_URL) ||
                  (window.location.hostname === 'localhost'
                    ? 'http://localhost:3000/api/tryon'
                    : 'https://kicks-shoes-backend.azurewebsites.net/api/tryon');

                console.log('Using tryOnUrl:', tryOnUrl);
                console.log('Making fetch request to:', tryOnUrl);
                const res = await fetch(tryOnUrl, {
                  method: 'POST',
                  body: formData,
                });

                console.log('Response status:', res.status);
                console.log('Response headers:', Object.fromEntries(res.headers.entries()));
                console.log('Response ok:', res.ok);

                if (!res.ok) {
                  const responseText = await res.text();
                  console.log('Error response text:', responseText);

                  let errJson;
                  try {
                    errJson = JSON.parse(responseText);
                  } catch (e) {
                    console.log('Failed to parse error response as JSON');
                    errJson = { error: responseText || `Try-on failed (${res.status})` };
                  }

                  throw new Error(errJson?.error || `Try-on failed (${res.status})`);
                }

                const responseText = await res.text();
                console.log('Response text length:', responseText.length);
                console.log('Response text preview:', responseText.substring(0, 200));

                let data;
                try {
                  data = JSON.parse(responseText);
                  console.log('Parsed JSON response:', data);
                } catch (e) {
                  console.error('Failed to parse response as JSON:', e);
                  console.log('Raw response:', responseText);
                  throw new Error('Invalid JSON response from server');
                }
                const url =
                  data?.image ||
                  (data?.imageBase64 ? `data:image/png;base64,${data.imageBase64}` : null);
                if (!url) throw new Error('No image returned from try-on');
                setTryOnImageUrl(url);
              } catch (err) {
                const status = err?.response?.status;
                if (status === 401) message.error('Unauthorized. Please login.');
                else if (status === 402) message.error('Insufficient credits.');
                else if (status === 429)
                  message.error('Too many requests. Please try again later.');
                else message.error(err?.response?.data?.message || err.message || 'Try-on failed');
              } finally {
                setTryOnLoading(false);
              }
            }}
            size="large"
            className="cart-btn"
            style={{ background: '#222', color: '#fff' }}
          >
            TRY ON
          </Button>
          <button
            className="icon-btn"
            onClick={handleToggleFavourite}
            disabled={favouriteLoading}
            style={{
              color: isFavourite ? '#ff4d4f' : '#666',
              transition: 'all 0.3s ease',
            }}
          >
            {isFavourite ? <HeartFilled /> : <HeartOutlined />}
          </button>
        </div>
        <Button
          onClick={handleBuyNow}
          size="large"
          className="buy-now-btn"
          type="primary"
          disabled={!selectedSize || !selectedColor}
        >
          BUY IT NOW
        </Button>
      </div>

      {/* Description */}
      <div className="product-description">
        <h4 type="secondary" className="summary-text">
          {product.summary}
        </h4>
        <ul className="benefit-list">
          <li>{product.description}</li>
          <li>{product.brand}</li>
        </ul>
      </div>

      {/* Report product modal - English */}
      <Modal
        title="Report product violation"
        open={reportModalOpen}
        onCancel={() => setReportModalOpen(false)}
        onOk={async () => {
          if (!user) {
            message.error('You need to login to report this product');
            return;
          }
          if (!reportReason || !reportDescription) {
            message.error('Please select a reason and enter a description');
            return;
          }
          setReportLoading(true);
          try {
            await axiosInstance.post(`/products/${product._id}/report`, {
              reason: reportReason,
              description: reportDescription,
              evidence: reportEvidence ? [reportEvidence] : [],
            });
            message.success('Product reported successfully!');
            setReportModalOpen(false);
            setReportDescription('');
            setReportEvidence('');
          } catch (err) {
            message.error(err.response?.data?.message || 'Report failed');
          } finally {
            setReportLoading(false);
          }
        }}
        confirmLoading={reportLoading}
        okText="Submit report"
        cancelText="Cancel"
      >
        <div style={{ marginBottom: 12 }}>
          <label>Reason:</label>
          <select
            value={reportReason}
            onChange={e => setReportReason(e.target.value)}
            style={{ width: '100%', padding: 6, marginTop: 4 }}
          >
            <option value="fake_product">Fake/Counterfeit</option>
            <option value="inappropriate_content">Inappropriate Content</option>
            <option value="scam">Scam</option>
            <option value="counterfeit">Illegal/Counterfeit</option>
            <option value="harassment">Harassment</option>
            <option value="spam">Spam</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Description:</label>
          <textarea
            value={reportDescription}
            onChange={e => setReportDescription(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: 6, marginTop: 4 }}
            placeholder="Enter details about the violation..."
          />
        </div>
        <div>
          <label>Evidence (image/video link, if any):</label>
          <input
            value={reportEvidence}
            onChange={e => setReportEvidence(e.target.value)}
            style={{ width: '100%', padding: 6, marginTop: 4 }}
            placeholder="Paste evidence link (optional)"
          />
        </div>
      </Modal>

      {/* Try-On Modal */}
      <Modal
        title={
          <div
            style={{
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: '600',
              color: '#1a1a1a',
              paddingBottom: '10px',
              borderBottom: '2px solid #4A69E2',
            }}
          >
            Virtual Try-On
          </div>
        }
        open={tryOnOpen}
        onCancel={() => {
          if (!tryOnLoading) setTryOnOpen(false);
        }}
        footer={null}
        width={600}
        centered
        className="try-on-modal"
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            padding: '20px 0',
          }}
        >
          <Paragraph
            type="secondary"
            style={{
              textAlign: 'center',
              fontSize: '14px',
              margin: 0,
              color: '#666',
            }}
          >
            Using your profile image and this product's image to generate a try-on preview.
          </Paragraph>

          {tryOnLoading && (
            <div
              className="try-on-loading-container"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                padding: '40px 20px',
                background: 'linear-gradient(135deg, #f5f7ff 0%, #e8f0ff 100%)',
                borderRadius: '12px',
                border: '2px dashed #4A69E2',
              }}
            >
              <Spin size="large" style={{ color: '#4A69E2' }} />
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#4A69E2',
                }}
              >
                Generating try-on image...
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#666',
                  textAlign: 'center',
                }}
              >
                This may take a few moments. Please wait.
              </div>
            </div>
          )}

          {tryOnImageUrl && !tryOnLoading && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                className="try-on-result-image"
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(74, 105, 226, 0.15)',
                  border: '3px solid #4A69E2',
                }}
              >
                <img
                  src={tryOnImageUrl}
                  alt="Try-on result"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(74, 105, 226, 0.9)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                >
                  ✨ AI Generated
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'center',
                }}
              >
                <Button
                  type="primary"
                  className="try-on-btn-primary"
                  icon={<ReloadOutlined />}
                  onClick={async () => {
                    // Retry try-on
                    try {
                      setTryOnImageUrl(null);
                      setTryOnLoading(true);

                      const personImageUrl = user?.profileImage || user?.avatar;
                      const garmentImageUrl = product?.mainImage;

                      const urlToSupportedFile = async (url, filenameFallback) => {
                        const res = await fetch(url);
                        if (!res.ok) throw new Error(`fetch_failed: ${res.status}`);
                        const blob = await res.blob();

                        const supportedTypes = [
                          'image/jpeg',
                          'image/jpg',
                          'image/png',
                          'image/webp',
                        ];
                        if (supportedTypes.includes(blob.type)) {
                          return new File([blob], filenameFallback, { type: blob.type });
                        }

                        const reencodeToJpeg = async (blob, filenameFallback) => {
                          try {
                            const imageBitmap = await createImageBitmap(blob).catch(() => null);
                            if (!imageBitmap) throw new Error('decode_failed');
                            const canvas = document.createElement('canvas');
                            canvas.width = imageBitmap.width;
                            canvas.height = imageBitmap.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(imageBitmap, 0, 0);
                            return new Promise(resolve => {
                              canvas.toBlob(resolve, 'image/jpeg', 0.9);
                            }).then(
                              blob => new File([blob], filenameFallback, { type: 'image/jpeg' })
                            );
                          } catch {
                            return new File([blob], filenameFallback, { type: blob.type });
                          }
                        };

                        return reencodeToJpeg(
                          blob,
                          filenameFallback.endsWith('.jpg')
                            ? filenameFallback
                            : `${filenameFallback}.jpg`
                        );
                      };

                      const [personAutoFile, garmentAutoFile] = await Promise.all([
                        urlToSupportedFile(personImageUrl, 'person.jpg'),
                        urlToSupportedFile(garmentImageUrl, 'garment.jpg'),
                      ]);

                      const formData = new FormData();
                      formData.append('userImage', personAutoFile);
                      formData.append('clothingImage', garmentAutoFile);

                      // Use the backend URL instead of relative path
                      const tryOnUrl =
                        (import.meta.env && import.meta.env.VITE_TRYON_API_URL) ||
                        (window.location.hostname === 'localhost'
                          ? 'http://localhost:3000/api/tryon'
                          : 'https://kicks-shoes-backend.azurewebsites.net/api/tryon');
                      const res = await fetch(tryOnUrl, {
                        method: 'POST',
                        body: formData,
                      });

                      if (!res.ok) {
                        const errJson = await res.json().catch(() => ({}));
                        throw new Error(errJson?.error || `Try-on failed (${res.status})`);
                      }

                      const data = await res.json();
                      const url =
                        data?.image ||
                        (data?.imageBase64 ? `data:image/png;base64,${data.imageBase64}` : null);
                      if (!url) throw new Error('No image returned from try-on');
                      setTryOnImageUrl(url);
                    } catch (err) {
                      message.error(err.message || 'Try-on failed');
                    } finally {
                      setTryOnLoading(false);
                    }
                  }}
                  disabled={tryOnLoading}
                  style={{
                    borderRadius: '8px',
                    fontWeight: '500',
                  }}
                >
                  Try Again
                </Button>

                <Button
                  type="default"
                  className="try-on-btn-secondary"
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    // Download image
                    const link = document.createElement('a');
                    link.href = tryOnImageUrl;
                    link.download = `try-on-${product?.name || 'product'}-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    message.success('Image downloaded successfully!');
                  }}
                  style={{
                    borderRadius: '8px',
                    fontWeight: '500',
                  }}
                >
                  Download
                </Button>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              paddingTop: '10px',
            }}
          >
            <Button
              onClick={() => setTryOnOpen(false)}
              disabled={tryOnLoading}
              size="large"
              style={{
                borderRadius: '8px',
                minWidth: '100px',
                fontWeight: '500',
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductInfoSection;
