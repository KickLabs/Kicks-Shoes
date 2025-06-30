import './CartList.css';
import CartItemCard from './CartItemCard';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getCart } from '../cartService';
import { useNavigate } from 'react-router-dom';

export const CartList = () => {
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

  return (
    <>
      <div className="cart-wrapper">
        <div className="cart-text">
          <h2>Your Bag</h2>
          <p>Items in your bag not reserved — check out now to make them yours.</p>
        </div>

        {status === 'loading' && <p>Loading...</p>}
        {status === 'failed' && <p className="error-text">{error}</p>}

        <div className="cart-items-scroll">
          {items && items.length > 0 ? (
            items.map((item, index) => <CartItemCard key={item._id || index} item={item} />)
          ) : (
            <p>Your cart is empty.</p>
          )}
        </div>
      </div>
    </>
  );
};
