import { useState, useEffect } from 'react';
import { Button, Typography, Modal, message } from 'antd';
import { formatPrice } from '../../../../utils/StringFormat';
import './ProductInfoSection.css';
import SizePanel from './SizePanel';
import { HeartOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { addOrUpdateCartItem } from '../../cart/cartService';

const { Paragraph } = Typography;

const ProductInfoSection = ({ product, selectedColor, setSelectedColor }) => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);

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
      const inventoryItem = product.inventory.find(
        item => item.size === selectedSize && item.color === selectedColor
      );

      if (!inventoryItem || inventoryItem.quantity === 0) {
        message.error('This size and color combination is not available');
        return;
      }

      await dispatch(
        addOrUpdateCartItem({
          productId: product._id,
          quantity: 1,
          size: selectedSize,
          color: selectedColor,
          price: product.price.regular,
        })
      ).unwrap();
      message.success('Added to cart successfully!');
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      message.error('Failed to add to cart.');
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

  // Inventory theo màu đang chọn
  const colorInventory = hasInventory
    ? product.inventory.filter(item => item.color === selectedColor)
    : [];
  // Các size còn hàng với quantity > 0 nếu có inventory, ngược lại lấy toàn bộ từ variants
  const availableSizes = hasInventory
    ? Array.from(new Set(colorInventory.filter(i => i.quantity > 0).map(i => i.size)))
    : safeVariants.sizes || [];
  // Chuẩn hóa danh sách size (30-50)
  const allSizes = hasInventory
    ? [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
    : safeVariants.sizes || [];
  // Dữ liệu size cho SizePanel (disable nếu không có hàng)
  const sizeData = hasInventory
    ? allSizes.map(size => {
        const inventoryEntry = colorInventory.find(item => item.size === size);
        return {
          value: size,
          disabled: !inventoryEntry || inventoryEntry.quantity === 0,
        };
      })
    : allSizes.map(size => ({ value: size, disabled: false }));
  // Nếu không có size khả dụng
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
        {product.isNew && <div className="product-card__badge new-badge">New</div>}
        {product.price.isOnSale && (
          <div
            style={{ backgroundColor: '#FFA52F', width: '70px' }}
            className="product-card__badge"
          >
            {product.price.discountPercent}% off
          </div>
        )}
      </div>

      {/* Name + Price */}
      <h1 style={{ fontSize: '2.5em', fontWeight: 600 }} className="product-name">
        {product.name}
      </h1>
      <h2 style={{ fontSize: '2em', fontWeight: 600, color: '#4A69E2' }} className="product-price">
        {product.price.isOnSale
          ? formatPrice(product.price.regular * (1 - product.price.discountPercent / 100))
          : formatPrice(product.price.regular)}
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
          <h3 className="variant-label">Size</h3>
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
        title="Size Chart"
        open={isModalOpen}
        footer={null}
        onCancel={() => setIsModalOpen(false)}
      >
        <img
          src="https://cdn.shopify.com/s/files/1/0250/7640/4884/files/men-size-chart.jpg"
          alt="Size Chart"
          style={{ width: '100%', borderRadius: 8 }}
        />
      </Modal>

      {/* Buttons */}
      <div className="product-actions">
        <div className="top-actions">
          <Button onClick={() => handleAddCart()} size="large" className="cart-btn">
            ADD TO CART
          </Button>
          <button className="icon-btn">
            <HeartOutlined />
          </button>
        </div>
        <Button size="large" className="buy-now-btn">
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
    </div>
  );
};

export default ProductInfoSection;
