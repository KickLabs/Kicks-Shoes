import { formatPrice } from '../../../../utils/StringFormat';
import './OrderSummary.css';
import { useSelector } from 'react-redux';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export const OrderSummary = ({ selectedItems }) => {
  const navigate = useNavigate();
  const { items, totalPrice, status, error } = useSelector(state => state.cart);

  // Calculate totals for selected items only
  const selectedItemsData = items.filter(item => selectedItems.has(item._id));
  const quantity = selectedItemsData.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = selectedItemsData.reduce((acc, item) => {
    const price = item.product?.price?.isOnSale
      ? item.product.price.regular * (1 - item.product.price.discountPercent / 100)
      : item.product?.price?.regular || item.price || 0;
    return acc + item.quantity * price;
  }, 0);
  const delivery = 30000; // Fixed delivery cost
  const taxRate = 0; // 0%
  const tax = totalAmount * taxRate;
  const total = totalAmount + delivery + tax;

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
    <div className="order-wrapper">
      <div className="order-table">
        <h4>Order Summary</h4>

        {/* Selection controls */}
        {items.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={selectedItems.size === items.length && items.length > 0}
                onChange={e => handleSelectAll(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Select All ({selectedItems.size}/{items.length})
            </label>
          </div>
        )}

        <div className="table-body">
          <div className="item-info">
            <p>
              {quantity} item{quantity > 1 ? 's' : ''} selected
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

        {/* Checkout buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {selectedItems.size > 0 && (
            <Button
              style={{ height: 48, width: '100%' }}
              type="primary"
              onClick={handleCheckoutSelected}
            >
              Checkout Selected ({selectedItems.size} items)
            </Button>
          )}
          <Button
            style={{ height: 48, width: '100%' }}
            type="default"
            onClick={() => navigate('/checkout')}
          >
            Checkout All Items
          </Button>
        </div>
      </div>
    </div>
  );
};
