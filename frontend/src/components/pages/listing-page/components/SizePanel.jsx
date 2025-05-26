// SizePanel.jsx
import React from "react";

const SizePanel = ({ sizes, selectedSize, onSizeSelect }) => {
  return (
    <div className="filter-size-grid">
      {sizes.map((size) => (
        <button
          key={size.value}
          className={`size-button ${
            selectedSize === size.value ? "active" : ""
          }`}
          onClick={() => onSizeSelect(size.value)}
          disabled={size.disabled}
        >
          {size.value}
        </button>
      ))}
    </div>
  );
};

export default SizePanel;
