import React, { useState } from 'react';
import axios from 'axios';

const ColorPanel = ({ colors }) => {
  const [selectedColor, setSelectedColor] = useState(null);

  const handleSelectColor = async color => {
    const newColor = selectedColor === color ? null : color;
    setSelectedColor(newColor);

    try {
      const response = await axios.get('/api/products', {
        params: { color: newColor },
      });
      console.log('Filtered by color:', response.data);
    } catch (err) {
      console.error('Error filtering by color', err);
    }
  };

  return (
    <div className="filter-color-grid">
      {colors.map((item, index) => {
        const value = typeof item === 'object' ? item.value : item;
        const hex = typeof item === 'object' ? item.hex : item;

        return (
          <button
            key={value ?? index}
            className={`color-button ${selectedColor === value ? 'selected' : ''}`}
            style={{
              backgroundColor: hex,
              borderColor: value === 'White' ? '#ccc' : selectedColor === value ? 'black' : '#ccc',
            }}
            onClick={() => handleSelectColor(value)}
          />
        );
      })}
    </div>
  );
};

export default ColorPanel;
