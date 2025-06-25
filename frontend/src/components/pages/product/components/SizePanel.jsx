import React from 'react';

const SizePanel = ({ sizes, selectedSize, onSizeSelect }) => {
  return (
    <div className="size-options">
      {sizes.map(item => {
        const { value, disabled } = item;

        return (
          <button
            key={value}
            className={`size-btn ${selectedSize === value ? 'active' : ''}`}
            disabled={disabled}
            onClick={() => {
              if (!disabled) onSizeSelect(value);
            }}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
};

export default SizePanel;
