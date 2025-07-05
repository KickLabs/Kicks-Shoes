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
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState([0, 1000]);

  // Count active filters
  const activeFiltersCount = [
    selectedSize,
    selectedColor,
    selectedBrand,
    selectedCategory,
    selectedPrice[0] > 0 || selectedPrice[1] < 1000,
  ].filter(Boolean).length;

  // Pass selected filter values to parent
  useEffect(() => {
    onFiltersChange({
      size: selectedSize,
      color: selectedColor,
      brand: selectedBrand,
      category: selectedCategory,
      minPrice: selectedPrice[0],
      maxPrice: selectedPrice[1],
    });
  }, [selectedSize, selectedColor, selectedBrand, selectedCategory, selectedPrice]);

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedSize(null);
    setSelectedColor(null);
    setSelectedBrand(null);
    setSelectedCategory(null);
    setSelectedPrice([0, 1000]);
  };

  return (
    <div className="filter-sidebar">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2 className="filter-sidebar__title">Filters</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {activeFiltersCount > 0 && (
            <>
              <span
                style={{
                  background: '#4A69E2',
                  color: 'white',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 'bold',
                }}
              >
                {activeFiltersCount}
              </span>
              <button
                onClick={clearAllFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4A69E2',
                  fontSize: 12,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Clear all
              </button>
            </>
          )}
        </div>
      </div>
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
            onSizeSelect={s => setSelectedSize(s === selectedSize ? null : s)}
          />
        </Panel>
        <Panel header="COLOR" key="3">
          <ColorPanel
            colors={[
              { value: 'Black', hex: '#000000' },
              { value: 'White', hex: '#FFFFFF' },
              { value: 'Red', hex: '#FF0000' },
              { value: 'Blue', hex: '#0000FF' },
              { value: 'Green', hex: '#008000' },
              { value: 'Yellow', hex: '#FFFF00' },
              { value: 'Gray', hex: '#808080' },
            ]}
            selectedColor={selectedColor}
            onColorSelect={c => setSelectedColor(c === selectedColor ? null : c)}
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
