import { Slider } from 'antd';
import { formatPrice } from '../../../../utils/StringFormat';

const PricePanel = ({ priceRange = [0, 1000], maxPrice = 1000, onPriceChange }) => {
  const handlePriceChange = value => {
    console.log('New price range (in thousands):', value);
    // Convert to actual VND (multiply by 1000) before sending to parent
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
