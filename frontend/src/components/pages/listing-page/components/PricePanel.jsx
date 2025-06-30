import React, { useState } from 'react';
import { Slider } from 'antd';
import axiosInstance from '@/services/axiosInstance';

const PricePanel = ({ priceRange = [0, 1000], isOpen = false }) => {
  const [selectedPrice, setSelectedPrice] = useState(priceRange);

  const handleAfterChange = async value => {
    setSelectedPrice(value);

    try {
      const response = await axiosInstance.get('/products', {
        params: { priceRange: value },
      });
      console.log('Filtered by price:', response.data);
    } catch (err) {
      console.error('Error filtering by price', err);
    }
  };

  return (
    <Slider
      range
      defaultValue={priceRange}
      min={0}
      max={1000}
      tooltip={{ open: isOpen }}
      onAfterChange={handleAfterChange}
    />
  );
};

export default PricePanel;
