import { useState } from 'react';
import { Slider } from 'antd';
import axios from 'axios';

const PricePanel = ({ priceRange = [0, 1000], isOpen = false }) => {
  const [selectedPrice, setSelectedPrice] = useState(priceRange);

  const handleAfterChange = async value => {
    setSelectedPrice(value);

    try {
      const response = await axios.get('/api/products', {
        params: {
          minPrice: value[0],
          maxPrice: value[1],
        },
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
