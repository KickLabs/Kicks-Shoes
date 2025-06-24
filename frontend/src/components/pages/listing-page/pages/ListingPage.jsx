import { useEffect, useState } from 'react';
import { Pagination } from 'antd';
import FilterSidebar from '../components/FilterSidebar';
import ProductCard from '../../../common/components/ProductCard';
import axios from 'axios';

const ListingPage = () => {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});
  const pageSize = 9;

  const fetchProducts = async (newFilters, newPage = 1) => {
    try {
      const response = await axios.get('/api/products', {
        params: {
          ...newFilters,
          page: newPage,
          limit: pageSize,
        },
      });
      setProducts(response.data.data.products);
      setTotalProducts(response.data.data.total);
    } catch (err) {
      console.error('Error fetching products', err);
    }
  };

  useEffect(() => {
    fetchProducts(filters, currentPage);
  }, [filters, currentPage]);

  const handleFilterChange = newFilters => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  return (
    <div style={{ display: 'flex', padding: 32, gap: 32 }}>
      <FilterSidebar onFiltersChange={handleFilterChange} />

      <div style={{ flex: 1 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 24,
            justifyContent: 'center',
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
          />
        </div>
      </div>
    </div>
  );
};

export default ListingPage;
