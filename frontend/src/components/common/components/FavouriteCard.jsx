import './ProductCard.css';
import { formatPrice } from '../../../utils/StringFormat';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { favouriteService } from '../../../services/favouriteService';
import { addOrUpdateCartItem } from '../../pages/cart/cartService';
import { useDispatch } from 'react-redux';
import { Modal, message, Spin, Alert } from 'antd';
import SizePanel from '../../pages/product/components/SizePanel';
import ProductImageGallery from '../../pages/product/components/ProductImageGallery';
import axiosInstance from '../../../services/axiosInstance';

const FavouriteCard = ({ product, onRemoveFromFavourites }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.variants?.colors?.[0] || 'Black');
  const [selectedSize, setSelectedSize] = useState(null);
  const [productDetail, setProductDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const displayPrice = product.price.isOnSale
    ? product.price.regular * (1 - product.price.discountPercent / 100)
    : product.price.regular;

  const handleRemoveFromFavourites = async () => {
    try {
      // Check if user is logged in before making API call
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        window.location.href = '/login';
        return;
      }
      setIsLoading(true);
      await favouriteService.removeFromFavourites(product._id);
      if (onRemoveFromFavourites) {
        onRemoveFromFavourites(product._id);
      }
    } catch (error) {
      console.error('Error removing from favourites:', error);
      // If error occurs (e.g., token expired), redirect to login
      if (error.message?.includes('Not authorized') || error.message?.includes('401')) {
        window.location.href = '/login';
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    setShowModal(true);
  };

  const handleConfirmAddToCart = async () => {
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
      setIsLoading(true);
      const price =
        productDetail && productDetail.price
          ? productDetail.price.isOnSale
            ? productDetail.price.regular * (1 - productDetail.price.discountPercent / 100)
            : productDetail.price.regular
          : 0;
      const cartItem = {
        product: productDetail._id,
        quantity: 1,
        size: selectedSize,
        color: selectedColor,
        price,
      };
      console.log('Sending cartItem:', cartItem); // Debug log
      await dispatch(addOrUpdateCartItem(cartItem)).unwrap();
      message.success('Added to cart');
      setShowModal(false);
    } catch (error) {
      console.error('Error adding to cart', error);
      message.error('Error adding to cart');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showModal && product._id) {
      setLoadingDetail(true);
      axiosInstance
        .get(`/products/public/${product._id}`)
        .then(res => setProductDetail(res.data.data))
        .catch(() => setProductDetail(null))
        .finally(() => setLoadingDetail(false));
    }
  }, [showModal, product._id]);

  // --- Logic màu/size dựa trên productDetail ---
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
    allSizes = hasInventory
      ? [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
      : safeVariants.sizes || [];
    sizeData = hasInventory
      ? allSizes.map(size => {
          const inventoryEntry = colorInventory.find(item => item.size === size);
          return {
            value: size,
            disabled: !inventoryEntry || inventoryEntry.quantity === 0,
          };
        })
      : allSizes.map(size => ({ value: size, disabled: false }));
    noSizeAvailable = availableSizes.length === 0;
  }

  // Auto set selectedColor nếu không hợp lệ (chỉ khi có productDetail)
  useEffect(() => {
    if (
      productDetail &&
      (!selectedColor || !availableColors.includes(selectedColor)) &&
      availableColors.length > 0
    ) {
      setSelectedColor(availableColors[0]);
    }
    // eslint-disable-next-line
  }, [productDetail, availableColors, selectedColor]);

  return (
    <div className="product-card">
      <div className="product-card__image-container">
        {product.isNew ? (
          <div className="product-card__badge">New</div>
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

        <img
          src={Array.isArray(product.mainImage) ? product.mainImage[0] : product.mainImage}
          alt={product.name}
          className="product-card__image"
        />

        {/* Remove from favourites button */}
        <button
          className="product-card__remove-favourite"
          onClick={handleRemoveFromFavourites}
          disabled={isLoading}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: '#ff4757',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
          title="Remove from favourites"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="#ff4757"
            stroke="none"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>

      <div className="product-card__info">
        <h2 className="product-card__name">{product.name}</h2>
      </div>

      <div className="product-card__footer">
        <button className="product-card__button" onClick={handleAddToCart} disabled={isLoading}>
          <div className="product-card__button-inner">
            <span>ADD TO CART -</span>
            <span className="product-card__price">{formatPrice(displayPrice)}</span>
          </div>
        </button>
      </div>
      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
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
            {/* Gallery bên trái */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {productDetail.inventory && productDetail.inventory.length > 0 ? (
                <ProductImageGallery
                  inventory={productDetail.inventory}
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
            {/* Info bên phải */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Badge */}
              <div style={{ marginBottom: 12 }}>
                {productDetail.isNew && (
                  <div
                    className="product-card__badge"
                    style={{ display: 'inline-block', marginRight: 8 }}
                  >
                    New
                  </div>
                )}
                {productDetail.price.isOnSale && (
                  <div
                    className="product-card__badge"
                    style={{ display: 'inline-block', background: '#FFA52F', width: 70 }}
                  >
                    {productDetail.price.discountPercent}% off
                  </div>
                )}
              </div>
              {/* Tên và giá */}
              <div style={{ fontWeight: 600, fontSize: 28, marginBottom: 8 }}>
                {productDetail.name}
              </div>
              <div style={{ fontWeight: 600, fontSize: 24, color: '#4A69E2', marginBottom: 16 }}>
                {productDetail.price.isOnSale
                  ? formatPrice(
                      productDetail.price.regular * (1 - productDetail.price.discountPercent / 100)
                    )
                  : formatPrice(productDetail.price.regular)}
              </div>
              {/* Chọn màu */}
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
                            selectedColor === color.value ? '2px solid #ff4757' : '1px solid #ccc',
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
                          <span style={{ color: '#ff4757', fontWeight: 700 }}>✔</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              {/* Chọn size */}
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
              {/* Nút xác nhận */}
              <button
                className="product-card__button"
                style={{ width: '100%', marginBottom: 16 }}
                onClick={handleConfirmAddToCart}
                disabled={isLoading || !productDetail || !productDetail._id}
              >
                <div className="product-card__button-inner">
                  <span>ADD TO CART -</span>
                  <span className="product-card__price">{formatPrice(displayPrice)}</span>
                </div>
              </button>
              {/* Mô tả ngắn */}
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
  );
};

export default FavouriteCard;
