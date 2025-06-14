import {
  TagsOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Input, message, Row, Space, Spin } from "antd";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import TabHeader from "../../common/components/TabHeader";

const { TextArea } = Input;

const emptyCategory = {
  name: "",
  description: "",
  slug: "",
};

export default function CategoryDetails() {
  const location = useLocation();
  const isAddNew = location.pathname.includes("add-new");
  const [category, setCategory] = useState(emptyCategory);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!isAddNew);

  useEffect(() => {
    if (!isAddNew) {
      fetchCategoryDetails();
    }
  }, [isAddNew, location.pathname]);

  const fetchCategoryDetails = async () => {
    try {
      const categoryId = location.pathname.split("/").pop();
      console.log("Fetching category details for ID:", categoryId);

      const response = await axios.get(`/api/categories/${categoryId}`);

      if (response.data.success) {
        const categoryData = response.data.data;
        setCategory(categoryData);
      }
    } catch (error) {
      console.error("Failed to fetch category details:", error);
      message.error("Failed to load category details");
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setCategory((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-generate slug from name
  const handleNameChange = (value) => {
    setCategory((prev) => ({
      ...prev,
      name: value,
    }));
  };

  // Validate form data before submission
  const validateForm = () => {
    const errors = [];

    if (!category.name || category.name.trim().length === 0) {
      errors.push("Category name is required");
    }

    return errors;
  };

  const handleCreate = async () => {
    // Validate form before submission
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => message.error(error));
      return;
    }

    setLoading(true);
    try {
      // Get auth headers
      const getAuthHeaders = () => {
        const userInfo = localStorage.getItem("userInfo");
        const token = userInfo ? JSON.parse(userInfo).token : null;
        return token ? { Authorization: `Bearer ${token}` } : {};
      };

      const payload = {
        name: category.name.trim(),
        description: category.description.trim(),
      };

      console.log("Creating category with payload:", payload);

      const response = await axios.post("/api/categories", payload, {
        headers: getAuthHeaders(),
      });

      console.log("Create response:", response.data);

      if (response.data.success) {
        message.success("Category created successfully!");
        // Reset form
        setCategory(emptyCategory);

        // Redirect to categories list
        setTimeout(() => {
          window.location.href = "/dashboard/categories";
        }, 1500);
      } else {
        message.error(response.data.message || "Failed to create category");
      }
    } catch (error) {
      console.error("Failed to create category:", error);

      if (error.response?.status === 404) {
        message.error(
          "API endpoint not found. Please check if the server is running and the route is configured."
        );
      } else if (error.response?.status === 401) {
        message.error("Unauthorized. Please login to create categories.");
      } else if (error.response?.status === 403) {
        message.error("You don't have permission to create categories");
      } else if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err) => {
          message.error(`${err.field}: ${err.message}`);
        });
      } else if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error(
          "Failed to create category. Please check your connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    // Validate form before submission
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => message.error(error));
      return;
    }

    setLoading(true);
    try {
      const categoryId = category._id || category.id;

      // Get auth headers
      const getAuthHeaders = () => {
        const userInfo = localStorage.getItem("userInfo");
        const token = userInfo ? JSON.parse(userInfo).token : null;
        return token ? { Authorization: `Bearer ${token}` } : {};
      };

      const payload = {
        name: category.name.trim(),
        description: category.description.trim(),
      };

      console.log("Updating category with payload:", payload);

      const response = await axios.put(
        `/api/categories/${categoryId}`,
        payload,
        {
          headers: getAuthHeaders(),
        }
      );

      console.log("Update response:", response.data);

      if (response.data.success) {
        message.success("Category updated successfully!");
        setTimeout(() => {
          window.location.href = "/dashboard/categories";
        }, 1500);
      } else {
        message.error(response.data.message || "Failed to update category");
      }
    } catch (error) {
      console.error("Failed to update category:", error);

      if (error.response?.status === 404) {
        message.error("Category not found or endpoint not available");
      } else if (error.response?.status === 401) {
        message.error("Unauthorized. Please login again.");
      } else if (error.response?.status === 403) {
        message.error("You don't have permission to update categories");
      } else if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Failed to update category. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const categoryId = category._id || category.id;

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

      console.log("Delete response:", response.data);

      if (response.data.success) {
        message.success("Category deleted successfully!");
        setTimeout(() => {
          window.location.href = "/dashboard/categories";
        }, 1500);
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
        message.error("Failed to delete category!");
      }
    }
  };

  const handleCancel = () => {
    message.info("Changes canceled");
    window.location.href = "/dashboard/categories";
  };

  if (pageLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <TabHeader
        breadcrumb="All Categories"
        anotherBreadcrumb={isAddNew ? "Add New Category" : "Category Details"}
      />

      <div
        className="category-details-container"
        style={{ padding: "24px", background: "#f5f5f5" }}>
        <Row gutter={[24, 24]} justify="center">
          {/* Main Content */}
          <Col xs={24} lg={16}>
            {/* Basic Information */}
            <Card
              title={
                <Space>
                  <InfoCircleOutlined />
                  <span>Basic Information</span>
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: 12,
                marginBottom: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}>
              <Row gutter={[16, 24]}>
                <Col span={24}>
                  <label
                    style={{
                      fontWeight: 600,
                      marginBottom: 8,
                      display: "block",
                    }}>
                    Category Name
                  </label>
                  <Input
                    size="large"
                    placeholder="Enter category name"
                    value={category.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    prefix={<TagsOutlined />}
                  />
                </Col>

                <Col span={24}>
                  <label
                    style={{
                      fontWeight: 600,
                      marginBottom: 8,
                      display: "block",
                    }}>
                    Description
                  </label>
                  <TextArea
                    placeholder="Enter category description (optional)"
                    value={category.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    rows={4}
                    showCount
                    maxLength={500}
                    style={{ resize: "none" }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Action Buttons */}
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}>
              <Space size="large">
                {isAddNew ? (
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleCreate}
                    loading={loading}
                    style={{ minWidth: 120, height: 48 }}>
                    Create Category
                  </Button>
                ) : (
                  <>
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleUpdate}
                      loading={loading}
                      style={{ minWidth: 120, height: 48 }}>
                      Update Category
                    </Button>
                  </>
                )}
                <Button
                  size="large"
                  onClick={handleCancel}
                  style={{ minWidth: 120, height: 48 }}>
                  Cancel
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
