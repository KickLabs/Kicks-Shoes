import './FilterSidebar.css';
import { Collapse } from 'antd';
import RefinePanel from './RefinePanel';
import SizePanel from './SizePanel';
import ColorPanel from './ColorPanel';
import CategoryPanel from './CategoryPanel';
import PricePanel from './PricePanel';
import SaleFilterPanel from './SaleFilterPanel';
import { useState, useEffect } from 'react';
import axiosInstance from '../../../../services/axiosInstance';

// Filter configurations for each product type
const FILTER_CONFIGS = {
  shoes: {
    sizes: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48],
    showSizeFilter: true,
    showColorFilter: true,
    showCategoryFilter: true,
    sizeLabel: 'SHOE SIZE (EU)',
  },
  clothing: {
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
    showSizeFilter: true,
    showColorFilter: true,
    showCategoryFilter: true,
    sizeLabel: 'CLOTHING SIZE',
  },
  accessory: {
    sizes: ['One Size'],
    showSizeFilter: false, // Most accessories don't have sizes
    showColorFilter: true,
    showCategoryFilter: true,
    sizeLabel: 'SIZE',
  },
  other: {
    sizes: ['One Size', 'S', 'M', 'L', 'XL'],
    showSizeFilter: true,
    showColorFilter: true,
    showCategoryFilter: true,
    sizeLabel: 'SIZE',
  },
  all: {
    sizes: [],
    showSizeFilter: false, // Hide size filter for all products
    showColorFilter: false, // Hide color filter for all products
    showCategoryFilter: false, // Hide type filter for all products
    sizeLabel: 'SIZE',
  },
};

const FilterSidebar = ({ onFiltersChange, productType = 'all' }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState([0, 1000]);
  const [selectedSaleType, setSelectedSaleType] = useState(null);
  const [maxPriceLimit, setMaxPriceLimit] = useState(1000);

  // Get filter config for current product type
  const filterConfig = FILTER_CONFIGS[productType] || FILTER_CONFIGS.all;

  // Fetch max price from products
  useEffect(() => {
    const fetchMaxPrice = async () => {
      try {
        const params = {
          page: 1,
          limit: 1,
          sortBy: 'finalPrice',
          order: 'desc',
        };

        // Add productType filter if not 'all'
        if (productType && productType !== 'all') {
          params.productType = productType;
        }

        const response = await axiosInstance.get('/products', { params });

        if (response.data.success && response.data.data.products?.length > 0) {
          const maxPrice = response.data.data.products[0].finalPrice;
          const roundedMax = Math.ceil(maxPrice / 100) * 100; // Round up to nearest 100
          setMaxPriceLimit(roundedMax);
          setSelectedPrice([0, roundedMax]);
        }
      } catch (error) {
        console.error('Error fetching max price:', error);
      }
    };

    fetchMaxPrice();
  }, [productType]);

  // Debug log
  console.log('FilterSidebar - productType:', productType);
  console.log('FilterSidebar - filterConfig:', filterConfig);

  // Count active filters
  const activeFiltersCount = [
    selectedSize,
    selectedColor,
    selectedBrand,
    selectedCategory,
    selectedPrice[0] > 0 || selectedPrice[1] < maxPriceLimit,
    selectedSaleType,
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
      saleType: selectedSaleType,
    });
  }, [
    selectedSize,
    selectedColor,
    selectedBrand,
    selectedCategory,
    selectedPrice,
    selectedSaleType,
  ]);

  // Reset size when product type changes
  useEffect(() => {
    setSelectedSize(null);
  }, [productType]);

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedSize(null);
    setSelectedColor(null);
    setSelectedBrand(null);
    setSelectedCategory(null);
    setSelectedPrice([0, maxPriceLimit]);
    setSelectedSaleType(null);
  };

  // Define collapse items dynamically based on filter config
  const collapseItems = [
    {
      key: '1',
      label: 'FILTER BY BRAND',
      children: (
        <RefinePanel
          refineOptions={[
            'Nike',
            'Adidas',
            'Puma',
            'Reebok',
            'New Balance',
            'Converse',
            'Vans',
            'Jordan',
          ]}
          selectedRefineOption={selectedBrand}
          onRefineSelect={b => setSelectedBrand(b === selectedBrand ? null : b)}
        />
      ),
    },
    // Conditionally show size filter
    ...(filterConfig.showSizeFilter
      ? [
          {
            key: '2',
            label: filterConfig.sizeLabel,
            children: (
              <SizePanel
                sizes={filterConfig.sizes}
                selectedSize={selectedSize}
                onSizeSelect={s => setSelectedSize(s === selectedSize ? null : s)}
              />
            ),
          },
        ]
      : []),
    // Conditionally show color filter
    ...(filterConfig.showColorFilter
      ? [
          {
            key: '3',
            label: 'COLOR',
            children: (
              <ColorPanel
                colors={[
                  { value: 'Black', hex: '#000000' },
                  { value: 'White', hex: '#FFFFFF' },
                  { value: 'Red', hex: '#FF0000' },
                  { value: 'Blue', hex: '#0000FF' },
                  { value: 'Green', hex: '#008000' },
                  { value: 'Yellow', hex: '#FFFF00' },
                  { value: 'Gray', hex: '#808080' },
                  { value: 'Brown', hex: '#8B4513' },
                  { value: 'Orange', hex: '#FFA500' },
                  { value: 'Pink', hex: '#FFC0CB' },
                ]}
                selectedColor={selectedColor}
                onColorSelect={c => setSelectedColor(c === selectedColor ? null : c)}
              />
            ),
          },
        ]
      : []),
    // Conditionally show category filter
    ...(filterConfig.showCategoryFilter
      ? [
          {
            key: '4',
            label: 'TYPE',
            children: (
              <CategoryPanel
                selectedCategory={selectedCategory}
                onCategorySelect={catId =>
                  setSelectedCategory(catId === selectedCategory ? null : catId)
                }
                productType={productType}
              />
            ),
          },
        ]
      : []),
    {
      key: '5',
      label: 'PRICE',
      children: (
        <PricePanel
          priceRange={selectedPrice}
          maxPrice={maxPriceLimit}
          onPriceChange={price => setSelectedPrice(price)}
        />
      ),
    },
    {
      key: '6',
      label: 'SALE TYPE',
      children: (
        <SaleFilterPanel
          selectedSaleType={selectedSaleType}
          onSaleTypeChange={setSelectedSaleType}
        />
      ),
    },
  ];

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
      <Collapse
        defaultActiveKey={
          productType === 'all'
            ? ['1', '5', '6'] // Only show Brand, Price, Sale Type for all products
            : ['1', '2', '3', '4', '5'] // Show all filters for specific product types
        }
        ghost
        items={collapseItems}
      />
    </div>
  );
};

export default FilterSidebar;
