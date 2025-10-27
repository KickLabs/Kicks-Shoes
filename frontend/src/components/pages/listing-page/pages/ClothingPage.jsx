import axiosInstance from '@/services/axiosInstance';
import { Empty, Pagination, Select, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../../../common/components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';

const { Text } = Typography;

const ClothingPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isNewParam = queryParams.get('isNew') === 'true';

  // Visual search results from navigation state
  const visualSearchResults = location.state?.visualSearchResults;
  const isVisualSearch = location.state?.isVisualSearch;

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ productType: 'clothing' }); // Default filter for clothing
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

      // Build query parameters - always include clothing filter
      const params = {
        page: newPage,
        limit: pageSize,
        sortBy,
        order: sortOrder,
        productType: 'clothing', // Force clothing filter
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
      console.error('Error fetching clothing:', error);
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = newFilters => {
    const updatedFilters = { ...newFilters, productType: 'clothing' };
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
    if (isVisualSearch && visualSearchResults) {
      // Handle visual search results
      setProducts(visualSearchResults.products || []);
      setTotalProducts(visualSearchResults.products?.length || 0);
      setLoading(false);
    } else {
      fetchProducts(filters, currentPage);
    }
  }, [currentPage, sortBy, sortOrder, filters, isVisualSearch, visualSearchResults]);

  useEffect(() => {
    if (!isVisualSearch) {
      fetchProducts(filters, 1);
      setCurrentPage(1);
    }
  }, [location.search, isVisualSearch]);

  const getCurrentSortValue = () => {
    return (
      sortOptions.find(opt => opt.sortBy === sortBy && opt.sortOrder === sortOrder)?.value ||
      'createdAt-desc'
    );
  };

  return (
    <div style={{ display: 'flex', padding: 32, gap: 32 }}>
      <FilterSidebar onFiltersChange={handleFilterChange} productType="clothing" />

      <div style={{ flex: 1 }}>
        {/* Visual Search Results Alert - Hidden */}
        {/* {isVisualSearch && visualSearchResults && (
          <Alert
            type="info"
            showIcon
            message="Kết quả tìm kiếm quần áo bằng hình ảnh"
            description={
              <div>
                <Text strong>AI đã phân tích hình ảnh quần áo của bạn:</Text>
                <div style={{ marginTop: 8 }}>
                  <Text strong>Thương hiệu: </Text>
                  <Tag color="purple">{visualSearchResults.analyzedKeywords?.brand || 'N/A'}</Tag>
                  <Text strong>Màu sắc: </Text>
                  {visualSearchResults.analyzedKeywords?.colors?.map((color, index) => (
                    <Tag key={index} color="blue">{color}</Tag>
                  ))}
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text strong>Đặc điểm: </Text>
                  {visualSearchResults.analyzedKeywords?.features?.map((feature, index) => (
                    <Tag key={index}>{feature}</Tag>
                  ))}
                </div>
              </div>
            }
            style={{ marginBottom: 24 }}
          />
        )} */}
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
            <Empty description="No clothing found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
                  {totalProducts} Clothing Items
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

export default ClothingPage;
