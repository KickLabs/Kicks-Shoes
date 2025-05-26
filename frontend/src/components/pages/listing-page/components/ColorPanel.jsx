import { useState } from "react";

const ColorPanel = ({ colors }) => {
  const [selectedColor, setSelectedColor] = useState(null);

  return (
    <div className="filter-color-grid">
      {colors.map((color) => (
        <button
          key={color}
          className={`color-button ${
            selectedColor === color ? "selected" : ""
          }`}
          style={{ backgroundColor: color }}
          onClick={() => setSelectedColor(color)}
        />
      ))}
    </div>
  );
};

export default ColorPanel;
