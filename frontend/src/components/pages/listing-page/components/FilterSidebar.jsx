import './FilterSidebar.css';
import { Collapse } from 'antd';
import RefinePanel from './RefinePanel';
import SizePanel from './SizePanel';
import ColorPanel from './ColorPanel';
import CategoryPanel from './CategoryPanel';
import PricePanel from './PricePanel';
import { useState, useEffect } from 'react';

const { Panel } = Collapse;

const FilterSidebar = ({ onFiltersChange }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null); // Brand filter
  const [selectedCategory, setSelectedCategory] = useState(null); // Category filter
  const [selectedPrice, setSelectedPrice] = useState([0, 1000]);

  // Pass selected filter values to parent
  useEffect(() => {
    onFiltersChange({
      size: selectedSize,
      color: selectedColor,
      brand: selectedBrand, // Send brand filter
      category: selectedCategory, // Send category filter
      minPrice: selectedPrice[0],
      maxPrice: selectedPrice[1],
    });
  }, [selectedSize, selectedColor, selectedBrand, selectedCategory, selectedPrice]);

  return (
    <div className="filter-sidebar">
      <h2 className="filter-sidebar__title">Filters</h2>
      <Collapse defaultActiveKey={['1', '2', '3', '4', '5']} ghost>
        <Panel header="FILTER BY BRAND" key="1">
          <RefinePanel
            refineOptions={['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance']} // List brand options here
            selectedRefineOption={selectedBrand} // Brand filter state
            onRefineSelect={b => setSelectedBrand(b === selectedBrand ? null : b)} // Toggle brand filter
          />
        </Panel>
        <Panel header="SIZE" key="2">
          <SizePanel
            sizes={[
              30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
            ]}
            selectedSize={selectedSize}
            onSizeSelect={s => setSelectedSize(s === selectedSize ? null : s)} // Toggle size selection
          />
        </Panel>
        <Panel header="COLOR" key="3">
          <ColorPanel
            colors={['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Gray']}
            selectedColor={selectedColor}
            onColorSelect={c => setSelectedColor(c === selectedColor ? null : c)} // Toggle color selection
          />
        </Panel>
        <Panel header="TYPE" key="4">
          <CategoryPanel
            selectedCategory={selectedCategory}
            onCategorySelect={catId =>
              setSelectedCategory(catId === selectedCategory ? null : catId)
            } // Toggle category selection
          />
        </Panel>
        <Panel header="PRICE" key="5">
          <PricePanel priceRange={selectedPrice} onPriceChange={price => setSelectedPrice(price)} />
        </Panel>
      </Collapse>
    </div>
  );
};

export default FilterSidebar;
