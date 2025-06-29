const SizePanel = ({ sizes, selectedSize, onSizeSelect }) => {
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
