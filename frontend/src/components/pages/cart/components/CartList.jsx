import './CartList.css';
import CartItemCard from './CartItemCard';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getCart } from '../cartService';
import { useNavigate } from 'react-router-dom';

export const CartList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalPrice, status, error } = useSelector(state => state.cart);
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    dispatch(getCart());
  }, [dispatch]);

  // Debug logging
  useEffect(() => {
    console.log('Cart state:', { items, totalPrice, status, error });
    if (items && items.length > 0) {
      console.log('Cart items:', items);
      items.forEach((item, index) => {
        console.log(`Item ${index}:`, item);
        if (item.product) {
          console.log(`Item ${index} product:`, item.product);
        }
      });
    }
  }, [items, totalPrice, status, error]);

  const handleItemSelect = (itemId, isSelected) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = isSelected => {
    if (isSelected) {
      setSelectedItems(new Set(items.map(item => item._id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleCheckoutSelected = () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item to checkout');
      return;
    }

    const selectedItemsData = items.filter(item => selectedItems.has(item._id));
    localStorage.setItem('selectedCartItems', JSON.stringify(selectedItemsData));
    navigate('/checkout?selectedItems=true');
  };

  return (
    <>
      <div className="cart-wrapper">
        <div className="cart-text">
          <h2>Your Bag</h2>
          <p>Items in your bag not reserved — check out now to make them yours.</p>
        </div>

        {status === 'loading' && <p>Loading...</p>}
        {status === 'failed' && <p className="error-text">{error}</p>}

        {items && items.length > 0 && (
          <div className="cart-actions">
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}
            >
              <input
                type="checkbox"
                checked={selectedItems.size === items.length && items.length > 0}
                onChange={e => handleSelectAll(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Select All ({selectedItems.size}/{items.length})
            </label>
            {selectedItems.size > 0 && (
              <button
                onClick={handleCheckoutSelected}
                style={{
                  background: '#4A69E2',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                }}
              >
                Checkout Selected ({selectedItems.size} items)
              </button>
            )}
          </div>
        )}

        <div className="cart-items-scroll">
          {items && items.length > 0 ? (
            items.map((item, index) => (
              <CartItemCard
                key={item._id || index}
                item={item}
                isSelected={selectedItems.has(item._id)}
                onSelectChange={handleItemSelect}
              />
            ))
          ) : (
            <p>Your cart is empty.</p>
          )}
        </div>
      </div>
    </>
  );
};
