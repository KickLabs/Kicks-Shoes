import { Slider } from 'antd';

const PricePanel = ({ priceRange = [0, 1000], onPriceChange }) => {
  const handlePriceChange = value => {
    console.log('New price range:', value);
    onPriceChange(value);
  };

  return <Slider range min={0} max={1000} value={priceRange} onChange={handlePriceChange} />;
};

export default PricePanel;
