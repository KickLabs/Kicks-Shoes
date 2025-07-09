import { formatPrice } from '../../../../utils/StringFormat';
import './OrderSummary.css';
import { useSelector } from 'react-redux';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export const OrderSummary = ({ selectedItems }) => {
  const navigate = useNavigate();
  const { items, totalPrice, status, error } = useSelector(state => state.cart);

  // Chỉ lấy các item được chọn
  const selectedItemsData = items.filter(item => selectedItems.has(item._id));
  const quantity = selectedItemsData.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = selectedItemsData.reduce(
    (acc, item) => acc + item.quantity * item.product.discountedPrice,
    0
  );
  const delivery = 0; //
  const taxRate = 0; // 0%
  const tax = totalAmount * taxRate;
  const total = totalAmount + delivery + tax;

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item to checkout');
      return;
    }
    localStorage.setItem('selectedCartItems', JSON.stringify(selectedItemsData));
    navigate('/checkout?selectedItems=true');
  };

  return (
    <div className="order-wrapper">
      <div className="order-table">
        <h4>Order Summary</h4>
        <div className="table-body">
          <div className="item-info">
            <p>
              {quantity} item{quantity > 1 ? 's' : ''}
            </p>
            <p>{formatPrice(totalAmount)}</p>
          </div>
          <div className="item-info">
            <p>Delivery</p>
            <p>{formatPrice(delivery)}</p>
          </div>
          <div className="item-info">
            <p>Tax</p>
            <p>{formatPrice(tax)}</p>
          </div>
          <div className="total">
            <p>Total</p>
            <p>{formatPrice(total)}</p>
          </div>
        </div>
        <Button
          style={{ height: 48, width: '100%', marginTop: 16 }}
          type="default"
          onClick={handleCheckout}
          disabled={selectedItems.size === 0}
        >
          Checkout
        </Button>
      </div>
    </div>
  );
};
