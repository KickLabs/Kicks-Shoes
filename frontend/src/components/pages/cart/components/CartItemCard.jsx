import React from 'react';
import './CartItemCard.css';
import { updateCartItem, removeCartItem, getCart } from '../cartService';
import { useDispatch } from 'react-redux';

const CartItemCard = ({ item }) => {
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
      <img src={productImage} alt={item.product.name || 'Product'} className="item-image" />
      <div className="item-details">
        <div className="item-header">
          <h3>{item.product.name || 'Unknown Product'}</h3>
          <span className="item-price">${productPrice.toFixed(2)}</span>
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
              width="33"
              height="32"
              viewBox="0 0 33 32"
              fill="none"
            >
              <path
                d="M27.8184 9L26.0265 26.2337C25.9692 26.7203 25.7353 27.169 25.3692 27.4946C25.0031 27.8201 24.5302 28 24.0402 28H9.59711C9.10716 28 8.63426 27.8201 8.26813 27.4946C7.90201 27.169 7.66812 26.7203 7.61086 26.2337L5.81836 9"
                stroke="#232321"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M29.8184 4H3.81836C3.26607 4 2.81836 4.44772 2.81836 5V8C2.81836 8.55228 3.26607 9 3.81836 9H29.8184C30.3706 9 30.8184 8.55228 30.8184 8V5C30.8184 4.44772 30.3706 4 29.8184 4Z"
                stroke="#232321"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.3184 15L13.3184 22M20.3184 22L13.3184 15"
                stroke="#232321"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;
