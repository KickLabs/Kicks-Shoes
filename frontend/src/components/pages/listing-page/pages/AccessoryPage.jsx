import { useEffect, useState } from 'react';
import { Pagination, Spin, Empty, Select } from 'antd';
import FilterSidebar from '../components/FilterSidebar';
import ProductCard from '../../../common/components/ProductCard';
import axiosInstance from '@/services/axiosInstance';
import { useLocation } from 'react-router-dom';

const AccessoryPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isNewParam = queryParams.get('isNew') === 'true';

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ productType: 'accessory' }); // Default filter for accessories
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const pageSize = 9;

  const sortOptions = [
    { value: 'createdAt-desc', label: 'Latest', sortBy: 'createdAt', sortOrder: 'desc' },
    { value: 'price-asc', label: 'Price: Low to High', sortBy: 'finalPrice', sortOrder: 'asc' },
    {
      value: 'price-desc',
      label: 'Price: High to Low',
      sortBy: 'finalPrice',
      sortOrder: 'desc',
    },
    { value: 'name-asc', label: 'Name: A-Z', sortBy: 'name', sortOrder: 'asc' },
    { value: 'name-desc', label: 'Name: Z-A', sortBy: 'name', sortOrder: 'desc' },
    { value: 'sales-desc', label: 'Best Selling', sortBy: 'sales', sortOrder: 'desc' },
  ];

  const fetchProducts = async (newFilters, newPage = 1) => {
    try {
      setLoading(true);

      // Build query parameters - always include accessory filter
      const params = {
        page: newPage,
        limit: pageSize,
        sortBy,
        order: sortOrder,
        productType: 'accessory', // Force accessory filter
      };

      // Add other filters only if they have values
      Object.keys(newFilters).forEach(key => {
        if (newFilters[key] && newFilters[key] !== '' && key !== 'productType') {
          // Only add price filters if they're not default values
          if (key === 'minPrice' && newFilters[key] === 0) return;
          if (key === 'maxPrice' && newFilters[key] === 3000000) return;
          params[key] = newFilters[key];
        }
      });

      // Add isNew filter if present in URL
      if (isNewParam) {
        params.isNew = true;
      }

      const response = await axiosInstance.get('/products', { params });

      if (response.data.success) {
        setProducts(response.data.data.products || []);
        setTotalProducts(response.data.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching accessories:', error);
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = newFilters => {
    const updatedFilters = { ...newFilters, productType: 'accessory' };
    setFilters(updatedFilters);
    setCurrentPage(1);
  };

  const handleSortChange = value => {
    const option = sortOptions.find(opt => opt.value === value);
    if (option) {
      setSortBy(option.sortBy);
      setSortOrder(option.sortOrder);
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    fetchProducts(filters, currentPage);
  }, [currentPage, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchProducts(filters, 1);
    setCurrentPage(1);
  }, [location.search]);

  const getCurrentSortValue = () => {
    return (
      sortOptions.find(opt => opt.sortBy === sortBy && opt.sortOrder === sortOrder)?.value ||
      'createdAt-desc'
    );
  };

  return (
    <div style={{ display: 'flex', padding: 32, gap: 32 }}>
      <FilterSidebar onFiltersChange={handleFilterChange} productType="accessory" />

      <div style={{ flex: 1 }}>
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 400,
            }}
          >
            <Spin size="large" />
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 400,
            }}
          >
            <Empty description="No accessories found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <>
            {/* Sort Section */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
                padding: '16px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>
                  {totalProducts} Accessories
                </span>
                {isNewParam && (
                  <span
                    style={{
                      background: '#4A69E2',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    New Drops
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Select
                  value={getCurrentSortValue()}
                  onChange={handleSortChange}
                  style={{ width: 200 }}
                  options={sortOptions}
                  placeholder="Select sort option"
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 24,
                justifyItems: 'center',
              }}
            >
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
              <Pagination
                current={currentPage}
                total={totalProducts}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AccessoryPage;
