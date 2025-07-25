import React from 'react';
import { formatPrice } from '../../../../utils/StringFormat';
import './CartItemCard.css';
import { updateCartItem, removeCartItem, getCart } from '../cartService';
import { useDispatch } from 'react-redux';
import { Checkbox } from 'antd';

const CartItemCard = ({ item, isSelected, onSelectChange }) => {
  const dispatch = useDispatch();

  const handleSizeChange = (itemId, newSize) => {
    dispatch(
      updateCartItem({
        itemId,
        updateData: { size: newSize },
      })
    ).then(() => {
      dispatch(getCart());
    });
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    dispatch(
      updateCartItem({
        itemId,
        updateData: { quantity: newQuantity },
      })
    ).then(() => {
      dispatch(getCart());
    });
  };

  const handleRemove = itemId => {
    dispatch(removeCartItem(itemId)).then(() => {
      dispatch(getCart());
    });
  };

  // Better validation for product data
  if (!item.product) {
    return <div className="cart-item-card">Invalid product data - Product not found</div>;
  }

  // Handle different image structures
  const getProductImage = product => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    if (product.mainImage) {
      return product.mainImage;
    }
    if (product.image) {
      return product.image;
    }
    // Return a placeholder image
    return 'https://via.placeholder.com/150x150?text=No+Image';
  };

  // Handle different price structures
  const getProductPrice = product => {
    if (product.price && typeof product.price === 'object') {
      if (product.price.isOnSale && product.price.discountPercent) {
        return product.price.regular * (1 - product.price.discountPercent / 100);
      }
      return product.price.regular || 0;
    }
    if (typeof product.price === 'number') {
      return product.price;
    }
    return 0;
  };

  // Handle different variants structures
  const getProductSizes = product => {
    if (product.variants && product.variants.sizes && Array.isArray(product.variants.sizes)) {
      return product.variants.sizes;
    }
    if (product.sizes && Array.isArray(product.sizes)) {
      return product.sizes;
    }
    return [];
  };

  const productImage = getProductImage(item.product);
  const productPrice = getProductPrice(item.product);
  const productSizes = getProductSizes(item.product);

  return (
    <div className="cart-item-card">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={e => onSelectChange(item._id, e.target.checked)}
        style={{ marginRight: 12, marginTop: 8 }}
      />
      <img src={productImage} alt={item.product.name || 'Product'} className="item-image" />
      <div className="item-details">
        <div className="item-header">
          <h3>{item.product.name || 'Unknown Product'}</h3>
          <span className="item-price">{formatPrice(productPrice)}</span>
        </div>
        <p className="item-category">
          {item.product.brand || 'Unknown Brand'} - Men's Road Running Shoes
        </p>
        <p className="item-color">{item.color || 'Unknown Color'}</p>
        <div className="item-options">
          <div className="select-group">
            <label>Size</label>
            <select
              value={Number(item.size)}
              onChange={e => handleSizeChange(item._id, Number(e.target.value))}
            >
              <option value="" disabled>
                Choose size
              </option>
              {productSizes.map(size => (
                <option key={size} value={Number(size)}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="select-group">
            <label>Quantity</label>
            <select
              value={item.quantity}
              onChange={e => handleQuantityChange(item._id, Number(e.target.value))}
            >
              {Array.from({ length: Math.min(10, item.product.stock || 10) }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="item-actions">
          <button className="icon-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="33"
              height="32"
              viewBox="0 0 33 32"
              fill="none"
            >
              <path
                d="M22.8765 5C18.819 5 16.819 9 16.819 9C16.819 9 14.819 5 10.7615 5C7.464 5 4.85275 7.75875 4.819 11.0506C4.75025 17.8837 10.2396 22.7431 16.2565 26.8269C16.4224 26.9397 16.6184 27.0001 16.819 27.0001C17.0196 27.0001 17.2156 26.9397 17.3815 26.8269C23.3977 22.7431 28.8871 17.8837 28.819 11.0506C28.7852 7.75875 26.174 5 22.8765 5V5Z"
                stroke="#232321"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="icon-button"
            onClick={() => {
              if (window.confirm('Are you sure you want to remove this item?')) {
                handleRemove(item._id);
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;
