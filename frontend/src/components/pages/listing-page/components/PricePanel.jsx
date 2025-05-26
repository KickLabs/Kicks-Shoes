import { Slider } from "antd";

const PricePanel = ({ priceRange, isOpen }) => (
  <Slider
    range
    defaultValue={priceRange}
    min={0}
    max={1000}
    tooltip={{ open: isOpen }}
  />
);

export default PricePanel;
