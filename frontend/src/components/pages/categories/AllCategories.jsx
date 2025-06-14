import { useState, useEffect } from "react";
import axios from "axios";
import { Button, Row, Col, Pagination, message, Input, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import "./categories.css";
import CategoryCard from "./components/CategoryCard";
import TabHeader from "../../common/components/TabHeader";

export default function AllCategories() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [totalCategories, setTotalCategories] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/categories");
      if (response.data.success) {
        setCategories(response.data.data);
        setFilteredCategories(response.data.data);
        setTotalCategories(response.data.data.length);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      message.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = categories.filter(
        (category) =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (category.description &&
            category.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
      setFilteredCategories(filtered);
      setTotalCategories(filtered.length);
      setCurrentPage(1); // Reset to first page when searching
    } else {
      setFilteredCategories(categories);
      setTotalCategories(categories.length);
    }
  }, [searchTerm, categories]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      // Get auth headers
      const getAuthHeaders = () => {
        const userInfo = localStorage.getItem("userInfo");
        const token = userInfo ? JSON.parse(userInfo).token : null;
        return token ? { Authorization: `Bearer ${token}` } : {};
      };

      console.log("Deleting category with ID:", categoryId);

      const response = await axios.delete(`/api/categories/${categoryId}`, {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        message.success("Category deleted successfully");
        fetchCategories(); // Refresh the list
      } else {
        message.error(response.data.message || "Failed to delete category");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);

      if (error.response?.status === 404) {
        message.error("Category not found or endpoint not available");
      } else if (error.response?.status === 401) {
        message.error("Unauthorized. Please login again.");
      } else if (error.response?.status === 403) {
        message.error("You don't have permission to delete categories");
      } else {
        message.error("Failed to delete category");
      }
    }
  };

  // Get categories for current page
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentCategories = filteredCategories.slice(startIndex, endIndex);

  return (
    <div>
      <div className="all-categories-header">
        <TabHeader breadcrumb="All Categories" />
        <Space>
          <Input
            placeholder="Search by name or description..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Button
            onClick={() => {
              window.location.href = "/dashboard/categories/add-new";
            }}
            type="primary"
            style={{ background: "black" }}>
            ADD NEW CATEGORY
          </Button>
        </Space>
      </div>
      <div className="all-categories-grid">
        <Row gutter={[24, 24]} loading={loading}>
          {currentCategories.map((category) => (
            <Col xs={24} sm={12} md={8} lg={6} key={category._id}>
              <CategoryCard
                category={category}
                onDelete={handleDeleteCategory}
              />
            </Col>
          ))}
        </Row>
      </div>
      <div className="pagination-container">
        <Pagination
          current={currentPage}
          total={totalCategories}
          pageSize={pageSize}
          onChange={handlePageChange}
          showSizeChanger={false}
          showQuickJumper
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} categories`
          }
        />
      </div>
    </div>
  );
}
