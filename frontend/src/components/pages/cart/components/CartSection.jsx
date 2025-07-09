import './CartSection.css';
import { useState } from 'react';
import { CartList } from './CartList';
import { OrderSummary } from './OrderSummary';
import { useSelector } from 'react-redux';

export const CartSection = () => {
  const { items } = useSelector(state => state.cart);
  const [selectedItems, setSelectedItems] = useState(new Set());

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

  return (
    <div className="cart-section">
      <CartList
        selectedItems={selectedItems}
        handleItemSelect={handleItemSelect}
        handleSelectAll={handleSelectAll}
      />
      <OrderSummary selectedItems={selectedItems} />
    </div>
  );
};
