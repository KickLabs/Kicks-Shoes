import './CartList.css';
import CartItemCard from './CartItemCard';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getCart } from '../cartService';
import { useNavigate } from 'react-router-dom';

export const CartList = ({ selectedItems, handleItemSelect, handleSelectAll }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalPrice, status, error } = useSelector(state => state.cart);

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
          <div className="cart-actions" style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={selectedItems.size === items.length && items.length > 0}
                onChange={e => handleSelectAll(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Select All ({selectedItems.size}/{items.length})
            </label>
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
