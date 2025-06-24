// import "./FilterSidebar.css";
// import { Collapse } from "antd";
// import RefinePanel from "./RefinePanel";
// import SizePanel from "./SizePanel";
// import ColorPanel from "./ColorPanel";
// import CategoryPanel from "./CategoryPanel";
// import GenderPanel from "./GenderPanel";
// import PricePanel from "./PricePanel";
// import { useState } from "react";

// const { Panel } = Collapse;

// const FilterSidebar = ({
//   refineOptions,
//   sizes,
//   colors,
//   categories,
//   genders,
//   priceRange
// }) => {
//   const [selectedSize, setSelectedSize] = useState(null);

//   const handleSelectSize = (size) => {
//     setSelectedSize(size);
//     if (onSizeChange) {
//       onSizeChange(size);
//     }
//   };
//   return (
//     <div className="filter-sidebar">
//       <h2 className="filter-sidebar__title">Filters</h2>

//       <Collapse defaultActiveKey={["1", "2", "3", "4", "5"]} ghost>
//         <Panel header="REFINE BY" key="1">
//           <RefinePanel refineOptions={refineOptions} />
//         </Panel>

//         <Panel header="SIZE" key="2">
//           <SizePanel
//             sizes={sizes}
//             selectedSize={selectedSize}
//             onSizeSelect={handleSelectSize}
//           />
//         </Panel>

//         <Panel header="COLOR" key="3">
//           <ColorPanel colors={colors} />
//         </Panel>

//         <Panel header="TYPE" key="4">
//           <CategoryPanel categories={categories} />
//         </Panel>

//         <Panel header="PRICE" key="5">
//           <PricePanel priceRange={priceRange} />
//         </Panel>
//       </Collapse>
//     </div>
//   );
// };

// export default FilterSidebar;
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

  const sizeOptions = [38, 39, 40, 41, 42, 43, 44, 45, 46, 47];
  const colorOptions = [
    { label: 'Blue', value: 'Blue', hex: '#5475FB' },
    { label: 'Orange', value: 'Orange', hex: '#FFA52F' },
    { label: 'Dark Gray', value: 'Dark Gray', hex: '#3B3B3B' },
    { label: 'Green', value: 'Green', hex: '#2F4835' },
    { label: 'Black', value: 'Black', hex: '#1F1F1F' },
    { label: 'Brown', value: 'Brown', hex: '#E2774D' },
    { label: 'Light Gray', value: 'Light Gray', hex: '#C4C4C4' },
    { label: 'Gray', value: 'Gray', hex: '#747E8A' },
    { label: 'Tan', value: 'Tan', hex: '#92552A' },
    { label: 'Beige', value: 'Beige', hex: '#B37245' },
  ];
  const brandOptions = ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Converse', 'Vans'];
  const categories = [
    'Casual shoes',
    'Runners',
    'Hiking',
    'Sneaker',
    'Basketball',
    'Golf',
    'Outdoor',
  ];

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

  return (
    <div className="filter-sidebar">
      <h2 className="filter-sidebar__title">Filters</h2>

      <Collapse defaultActiveKey={['1', '2', '3', '4', '5']} ghost>
        <Panel header="FILTER BY BRAND" key="1">
          <RefinePanel
            refineOptions={brandOptions}
            selectedBrand={selectedBrand}
            onBrandSelect={brand => setSelectedBrand(brand === selectedBrand ? null : brand)}
          />
        </Panel>

        <Panel header="SIZE" key="2">
          <SizePanel
            sizes={sizeOptions}
            selectedSize={selectedSize}
            onSizeSelect={size => setSelectedSize(size === selectedSize ? null : size)}
          />
        </Panel>

        <Panel header="COLOR" key="3">
          <ColorPanel
            colors={colorOptions}
            selectedColor={selectedColor}
            onColorSelect={color => setSelectedColor(color === selectedColor ? null : color)}
          />
        </Panel>

        <Panel header="TYPE" key="4">
          <CategoryPanel
            selectedCategory={selectedCategory}
            onCategorySelect={categoryId =>
              setSelectedCategory(categoryId === selectedCategory ? null : categoryId)
            }
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
