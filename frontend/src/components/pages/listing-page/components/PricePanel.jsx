import React from 'react';
import { Slider } from 'antd';

const PricePanel = ({ priceRange = [0, 1000], onPriceChange }) => {
  return (
    <Slider
      range
      defaultValue={priceRange}
      min={0}
      max={1000}
      onAfterChange={onPriceChange}
      value={priceRange}
    />
  );
};

export default PricePanel;
