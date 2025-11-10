import axiosInstance from '@/services/axiosInstance';
import { Empty, Pagination, Select, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../../../common/components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';

const { Text } = Typography;

const ListingPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isNewParam = queryParams.get('isNew') === 'true';
  const isFlashSaleParam = queryParams.get('isFlashSale') === 'true';

  // Visual search results from navigation state
  const visualSearchResults = location.state?.visualSearchResults;
  const isVisualSearch = location.state?.isVisualSearch;

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});
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

      // Build query parameters
      const params = {
        page: newPage,
        limit: pageSize,
        sortBy,
        order: sortOrder,
      };

      // Add filters only if they have values
      if (newFilters.size) params.size = newFilters.size;
      if (newFilters.color) params.color = newFilters.color;
      if (newFilters.brand) params.brand = newFilters.brand;
      if (newFilters.category) params.category = newFilters.category;
      if (newFilters.minPrice !== undefined && newFilters.minPrice > 0)
        params.minPrice = newFilters.minPrice;
      if (newFilters.maxPrice !== undefined) params.maxPrice = newFilters.maxPrice;
      if (newFilters.saleType) params.saleType = newFilters.saleType;
      if (isNewParam) params.isNew = true;
      if (isFlashSaleParam) params.saleType = 'flash-sale';

      const response = await axiosInstance.get('/products', { params });

      if (response.data.success) {
        setProducts(response.data.data.products || []);
        setTotalProducts(response.data.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching products', err);
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
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
    // eslint-disable-next-line
  }, [
    filters,
    currentPage,
    isNewParam,
    isFlashSaleParam,
    sortBy,
    sortOrder,
    isVisualSearch,
    visualSearchResults,
  ]);

  const handleFilterChange = newFilters => {
    console.log('Filter changed:', newFilters);
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  const handleSortChange = value => {
    const selectedOption = sortOptions.find(option => option.value === value);
    if (selectedOption) {
      console.log('Sort change:', selectedOption);
      setSortBy(selectedOption.sortBy);
      setSortOrder(selectedOption.sortOrder);
      setCurrentPage(1); // Reset to page 1 when sort changes
    }
  };

  const getCurrentSortValue = () => {
    return (
      sortOptions.find(option => option.sortBy === sortBy && option.sortOrder === sortOrder)
        ?.value || 'createdAt-desc'
    );
  };

  return (
    <div style={{ display: 'flex', padding: 32, gap: 32 }}>
      <FilterSidebar onFiltersChange={handleFilterChange} productType="all" />

      <div style={{ flex: 1 }}>
        {/* Visual Search Results Alert - Hidden */}
        {/* {isVisualSearch && visualSearchResults && (
          <Alert
            type="info"
            showIcon
            message="Kết quả tìm kiếm bằng hình ảnh"
            description={
              <div>
                <Text strong>AI đã phân tích hình ảnh của bạn:</Text>
                <div style={{ marginTop: 8 }}>
                  <Text strong>Danh mục: </Text>
                  <Tag color="geekblue">{visualSearchResults.analyzedKeywords?.category || 'N/A'}</Tag>
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
            <Empty description="No products found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
                  {totalProducts} Products
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
                <span style={{ fontSize: 14, color: '#666' }}>Sort by:</span>
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

export default ListingPage;
