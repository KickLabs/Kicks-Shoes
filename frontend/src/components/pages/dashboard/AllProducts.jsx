import React, { useState, useContext, useEffect } from "react";
import axios from "axios"; // <-- Import axios
import { Button, Row, Col, Pagination } from "antd";
import "./dashboard.css";
import ProductCard from "./components/ProductCard";
import TabHeader from "../../common/components/TabHeader";
import { ActiveTabContext } from "../../common/components/ActiveTabContext"; 

export default function AllProducts() {
  // const { setActiveTab } = useContext(ActiveTabContext);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);

useEffect(() => {
  axios
    .get(`/api/products?page=${currentPage}&limit=${pageSize}`)
    .then((res) => {
      setProducts(res.data.data.products); // Lấy mảng sản phẩm
      setTotalProducts(res.data.data.total); // Lấy tổng số sản phẩm
    })
    .catch((err) => {
      console.error("Failed to fetch products:", err);
    });
}, [currentPage, pageSize]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="all-products-header">
        <TabHeader breadcrumb="All Products" />
        <Button
          onClick={() => {
            window.location.href = "/dashboard/products/add-new";
          }}
          type="default"
        >
          ADD NEW PRODUCT
        </Button>
      </div>
      <div className="all-products-grid">
        <Row gutter={[24, 24]}>
          {products.map((product) => (
            <Col
              xs={24}
              sm={12}
              md={8}
              lg={8}
              key={`${product.id || product._id}-${product.name}`}
            >
              <ProductCard product={product} />
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