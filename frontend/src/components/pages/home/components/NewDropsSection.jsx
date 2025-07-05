import './NewDropsSection.css';
import ProductCard from '../../../common/components/ProductCard';
import { useEffect, useState } from 'react';
import { Button, Pagination } from 'antd'; // Dùng Button từ Ant Design
import axios from 'axios';

export const NewDropsSection = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const pageSize = 4; // Mỗi trang chỉ hiển thị tối đa 4 sản phẩm

  const fetchProducts = async (newFilters, newPage = 1) => {
    try {
      const response = await axios.get('/api/products', {
        params: {
          ...newFilters,
          page: newPage,
          limit: pageSize, // Giới hạn số sản phẩm mỗi trang
        },
      });
      setProducts(response.data.data.products);
      setTotalProducts(response.data.data.total);
    } catch (err) {
      console.error('Error fetching products', err);
    }
  };

  useEffect(() => {
    const newProducts = products.filter(product => product.isNew);
    setFilteredProducts(newProducts);
  }, [products]);

  useEffect(() => {
    fetchProducts({ isNew: true }, currentPage);
  }, [currentPage]);

  const totalPages = Math.ceil(totalProducts / pageSize);

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  return (
    <div className="new-drops-wrapper">
      <div className="new-drops-header">
        <h4>
          <span className="line">Don't miss out </span>
          <span className="line">new drops</span>
        </h4>
        <Button onClick={handleShopNewDrops}>Shop new drops</Button>
      </div>

      <div className="new-drops-list">
        <div className="card-wrapper">
          {filteredProducts.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>

      {/* Phân trang */}
      <div className="pagination">
        <Pagination
          current={currentPage}
          total={totalProducts}
          pageSize={pageSize}
          onChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
