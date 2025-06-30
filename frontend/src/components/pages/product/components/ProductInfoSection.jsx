import { useState } from 'react';
import { Button, Typography, Modal } from 'antd';
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
      await dispatch(
        addOrUpdateCartItem({
          productId: product._id,
          quantity: 1,
          size: product.variants.sizes[0],
          color: selectedColor,
          price: product.price.regular,
        })
      ).unwrap();
      alert('Added to cart successfully!');
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      alert('Failed to add to cart.');
    }
  };

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

  // Màu từ variants.colors
  const colorOptions = product.variants.colors.map(color => ({
    value: color,
    hex: colorHexMap[color] || '#CCCCCC',
  }));

  // Danh sách size chuẩn
  const allSizes = [
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
  ];

  // Inventory theo màu đang chọn
  const colorInventory = product.inventory.filter(item => item.color === selectedColor);

  // Các size đang có với quantity > 0
  const availableSizes = Array.from(new Set(colorInventory.map(i => i.size)));

  // Dữ liệu size cho SizePanel (disable nếu quantity = 0 hoặc không tồn tại)
  const sizeData = allSizes.map(size => {
    const inventoryEntry = colorInventory.find(item => item.size === size);
    return {
      value: size,
      disabled: !inventoryEntry || inventoryEntry.quantity === 0,
    };
  });

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
      <h1 className="product-name">{product.name}</h1>
      <h2 className="product-price" style={{ color: '#4A69E2' }}>
        {product.price.isOnSale
          ? formatPrice(product.price.regular * (1 - product.price.discountPercent / 100))
          : formatPrice(product.price.regular)}
      </h2>

      {/* Color Selector */}
      <div className="variant-block">
        <h3 className="variant-label">Color</h3>
        <div className="color-options">
          {colorOptions.map(color => (
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
          ))}
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
        <SizePanel sizes={sizeData} selectedSize={selectedSize} onSizeSelect={setSelectedSize} />
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
