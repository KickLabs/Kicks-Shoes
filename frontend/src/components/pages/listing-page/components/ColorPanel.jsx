import React from 'react';

const ColorPanel = ({ colors, selectedColor, onColorSelect }) => {
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
            onClick={() => onColorSelect(value === selectedColor ? null : value)}
          />
        );
      })}
    </div>
  );
};

export default ColorPanel;
