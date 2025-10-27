import { Slider } from 'antd';
import { formatPrice } from '../../../../utils/StringFormat';

const PricePanel = ({ priceRange = [0, 3000], onPriceChange }) => {
  const handlePriceChange = value => {
    console.log('New price range (in thousands):', value);
    // Convert to actual VND (multiply by 1000) before sending to parent
    onPriceChange(value);
  };

  const formatter = value => {
    // Display in thousands format (e.g., "500K")
    if (value >= 1000) {
      return `${value / 1000}M`;
    }
    return `${value}K`;
  };

  return (
    <div>
      <Slider
        range
        min={0}
        max={3000}
        step={100}
        value={priceRange}
        onChange={handlePriceChange}
        tooltip={{
          formatter: formatter,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          fontSize: 12,
          color: '#666',
        }}
      >
        <span>{formatPrice(priceRange[0] * 1000)}</span>
        <span>{formatPrice(priceRange[1] * 1000)}</span>
      </div>
    </div>
  );
};

export default PricePanel;
