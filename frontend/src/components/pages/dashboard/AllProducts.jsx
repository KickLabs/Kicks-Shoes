import React, { useState, useContext, useEffect } from "react";
import { Button, Row, Col, Pagination } from "antd";
import "./dashboard.css";
import ProductCard from "./components/ProductCard";
import TabHeader from "./components/TabHeader";
import { ActiveTabContext } from "./Dashboard";
import { getProducts, getTotalProducts } from "../../../data/mockData";

export default function AllProducts() {
  const { setActiveTab } = useContext(ActiveTabContext);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const currentProducts = getProducts(currentPage, pageSize);
  const totalProducts = getTotalProducts();

  useEffect(() => {
    setActiveTab("2");
  }, [setActiveTab]);

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
          {currentProducts.map((product) => (
            <Col
              xs={24}
              sm={12}
              md={8}
              lg={8}
              key={`${product.id}-${product.name}`}
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
