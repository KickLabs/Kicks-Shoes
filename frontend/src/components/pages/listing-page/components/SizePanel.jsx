import React, { useState } from 'react';
import axiosInstance from '@/services/axiosInstance';

const SizePanel = ({ sizes }) => {
  const [selectedSize, setSelectedSize] = useState(null);

  const handleSelectSize = async size => {
    const newSize = selectedSize === size ? null : size;
    setSelectedSize(newSize);

    try {
      const response = await axiosInstance.get('/products', {
        params: { size: newSize },
      });
      console.log('Filtered by size:', response.data);
    } catch (err) {
      console.error('Error filtering by size', err);
    }
  };
  return (
    <div className="filter-size-grid">
      {sizes.map((value, index) => (
        <button
          key={value ?? index}
          className={`size-button ${selectedSize === value ? 'active' : ''}`}
          onClick={() => onSizeSelect(value === selectedSize ? null : value)}
        >
          {value}
        </button>
      ))}
    </div>
  );
};

export default SizePanel;
