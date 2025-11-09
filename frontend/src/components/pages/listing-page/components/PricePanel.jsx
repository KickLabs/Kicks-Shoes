import { Slider } from 'antd';

const PricePanel = ({ priceRange = [0, 1000], maxPrice = 1000, onPriceChange }) => {
  const handlePriceChange = value => {
    console.log('New price range:', value);
    onPriceChange(value);
  };

  return (
    <Slider
      range
      min={0}
      max={maxPrice}
      value={priceRange}
      onChange={handlePriceChange}
      tooltip={{
        formatter: value => `${value?.toLocaleString()}₫`,
      }}
    />
  );
};

export default PricePanel;
