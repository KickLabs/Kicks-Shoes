import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Row, Col, Pagination, message } from 'antd';
import './dashboard.css';
import styles from './AllProducts.module.css';
import ProductCard from '../../common/components/ProductCard';
import TabHeader from '../../common/components/TabHeader';
import { Popconfirm } from 'antd';

export default function AllProducts() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchProducts = () => {
    axios
      .get(`/api/products?page=${currentPage}&limit=${pageSize}`)
      .then(res => {
        setProducts(res.data.data.products);
        setTotalProducts(res.data.data.total);
      })
      .catch(err => {
        console.error('Failed to fetch products:', err);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const handleRemoveViolation = async productId => {
    try {
      await axios.delete(`/api/products/violation/${productId}`);
      message.success('Product removed successfully');
      fetchProducts(); // Refresh the product list
    } catch (err) {
      console.error('Failed to remove product:', err);
      message.error('Failed to remove product');
    }
  };

  const handlePageChange = page => setCurrentPage(page);

  return (
    <div>
      <div className="all-products-header">
        <TabHeader breadcrumb="All Products" />
        <Button
          onClick={() => (window.location.href = '/dashboard/products/add-new')}
          type="default"
        >
          ADD NEW PRODUCT
        </Button>
      </div>
      <div className="all-products-grid">
        <Row gutter={[24, 24]}>
          {products.map(product => (
            <Col xs={24} sm={12} md={8} lg={8} key={product._id}>
              <div className={styles.productWrapper}>
                <ProductCard product={product} />
                <Popconfirm
                  title="Are you sure you want to remove this violating product?"
                  onConfirm={() => handleRemoveViolation(product._id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <button className={styles.removeBtn}>REMOVE VIOLATION</button>
                </Popconfirm>
              </div>
            </Col>
          ))}
        </Row>
      </div>
      <div className="pagination-container">
        <Pagination
          current={currentPage}
          total={totalProducts}
          pageSize={pageSize}
          onChange={handlePageChange}
        />
      </div>
    </div>
  );
}
