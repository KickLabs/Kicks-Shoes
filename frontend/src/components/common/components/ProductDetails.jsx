import {
  DeleteOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  TagsOutlined,
  PictureOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Input,
  message,
  Row,
  Select,
  Upload,
  InputNumber,
  Switch,
  Space,
  Typography,
  Tooltip,
  Form,
} from "antd";
import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import productImg from "../../../assets/images/nikeproduct.png";
import { ActiveTabContext } from "./ActiveTabContext";
import "./order-details.css";
import "./product-details.css";
import TabHeader from "./TabHeader";
import axios from "axios";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const emptyProduct = {
  name: "",
  summary: "",
  description: "",
  brand: "",
  category: "",
  sku: "",
  tags: [],
  status: true,
  price: {
    regular: 0,
    discountPercent: 0,
    isOnSale: false,
  },
  stock: 0,
  sales: 0,
  variants: {
    sizes: [],
    colors: [],
  },
  inventory: [],
  images: [],
  rating: 0,
  isNew: false,
};

const brandOptions = [
  "Nike",
  "Adidas",
  "Puma",
  "Reebok",
  "New Balance",
  "Converse",
  "Vans",
];

const sizeOptions = [
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
];

const colorOptions = [
  { label: "Black", value: "#000000" },
  { label: "White", value: "#FFFFFF" },
  { label: "Red", value: "#FF0000" },
  { label: "Blue", value: "#0000FF" },
  { label: "Green", value: "#008000" },
  { label: "Yellow", value: "#FFFF00" },
  { label: "Gray", value: "#808080" },
  { label: "Brown", value: "#A52A2A" },
];
const mockProduct = {
  name: "Adidas Ultra boost",
  description: "Long distance running requires a lot from athletes.",
  category: "Sneaker",
  brand: "Addidas",
  sku: "#32A53",
  stock: 21,
  regularPrice: 110.4,
  salePrice: 450,
  tags: ["Adidas", "Shoes", "Sneakers", "Ultraboost"],
  images: [productImg, productImg, productImg, productImg],
};
export default function ProductDetails() {
  const { setActiveTab } = useContext(ActiveTabContext);
  const location = useLocation();
  const isAddNew = location.pathname.includes("add-new");
  const [product, setProduct] = useState(emptyProduct);
  const [fileList, setFileList] = useState(
    isAddNew
      ? []
      : mockProduct.images.map((img, idx) => ({
          uid: String(idx),
          name: `Product thumbnail.png`,
          status: "done",
          url: img,
        }))
  );
  const [categories, setCategories] = useState([]);

    useEffect(() => {
    setActiveTab("2");
    // Fetch categories
    axios.get("/api/categories").then((res) => {
      if (res.data && res.data.data) setCategories(res.data.data);
    });
    // Fetch product details if not add-new
    if (!isAddNew) {
      const productId = location.pathname.split("/").pop();
      axios
        .get(`/api/products/${productId}`)
        .then((res) => {
          if (res.data && res.data.data) setProduct(res.data.data);
        })
        .catch(() => message.error("Failed to fetch product details!"));
    }
  }, [setActiveTab, isAddNew, location.pathname]);

  const handleChange = (field, value) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parentField, childField, value) => {
    setProduct((prev) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value,
      },
    }));
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    setProduct((prev) => ({
      ...prev,
      images: newFileList.map((f) => f.url || f.thumbUrl),
    }));
  };

  
  const handleUpdate = async () => {
    try {
      const userInfo = localStorage.getItem("userInfo");
      const token = userInfo ? JSON.parse(userInfo).token : null;
      const productId = product._id || product.id;
      const payload = {
        name: product.name,
        summary: product.summary,
        description: product.description,
        brand: product.brand,
        category: product.category,
        price: {
          regular: Number(product.price.regular),
          discountPercent: Number(product.price.discountPercent),
          isOnSale: Boolean(product.price.isOnSale),
        },
        variants: {
          sizes: product.variants.sizes,
          colors: product.variants.colors,
        },
        inventory: product.inventory,
        images: product.images,
        tags: product.tags,
        status: product.status,
        stock: product.stock,
        isNew: product.isNew,
      };
      await axios.put(`/api/products/${productId}`, payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      message.success("Product updated successfully!");
    } catch (err) {
      message.error("Failed to update product!");
    }
  };

  const handleDelete = async () => {
    try {
      const userInfo = localStorage.getItem("userInfo");
      const token = userInfo ? JSON.parse(userInfo).token : null;
      const productId = product._id || product.id;
      await axios.delete(`/api/products/${productId}/delete`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      message.success("Product deleted successfully!");
      // Optional: redirect or refresh after delete
    } catch (err) {
      message.error("Failed to delete product!");
    }
  };

  const handleCancel = () => {
    message.info("Changes canceled");
  };

  const handleCreate = async () => {
    try {
      const userInfo = localStorage.getItem("userInfo");
      const token = userInfo ? JSON.parse(userInfo).token : null;

      const payload = {
        name: product.name,
        summary: product.summary,
        description: product.description,
        brand: product.brand,
        category: product.category,
        // sku: product.sku,
        price: {
          regular: Number(product.price.regular),
          discountPercent: Number(product.price.discountPercent),
          isOnSale: Boolean(product.price.isOnSale),
        },
        variants: {
          sizes: product.variants.sizes,
          colors: product.variants.colors,
        },
        inventory: product.inventory,
        images: product.images,
        tags: product.tags,
        status: product.status,
        stock: product.stock,
        isNew: product.isNew,
      };

      await axios.post("/api/products/add", payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      message.success("Product created successfully!");
    } catch (err) {
      message.error("Failed to create product!");
    }
  };

  const calculateSalePrice = () => {
    if (product.price.regular && product.price.discountPercent) {
      return product.price.regular * (1 - product.price.discountPercent / 100);
    }
    return 0;
  };

  return (
    <div>
      <TabHeader
        breadcrumb="All Products"
        anotherBreadcrumb={isAddNew ? "Add New Product" : "Product Details"}
      />

      <div
        className="product-details-container"
        style={{ padding: "24px", background: "#f5f5f5" }}>
        <Row gutter={[24, 24]}>
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
                    Product Name *
                  </label>
                  <Input
                    size="large"
                    placeholder="Enter product name"
                    value={product.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </Col>

                <Col span={24}>
                  <label
                    style={{
                      fontWeight: 600,
                      marginBottom: 8,
                      display: "block",
                    }}>
                    Product Summary
                  </label>
                  <Input
                    size="large"
                    placeholder="Brief product summary"
                    value={product.summary}
                    onChange={(e) => handleChange("summary", e.target.value)}
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
                    placeholder="Detailed product description"
                    value={product.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    rows={4}
                    style={{ resize: "none" }}
                  />
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Category"
                    name="category"
                    rules={[
                      { required: true, message: "Please select a category!" },
                    ]}
                    style={{ marginBottom: 16 }}>
                    <Select
                      size="large"
                      placeholder="Select a category"
                      value={product.category}
                      onChange={(value) => handleChange("category", value)}
                      style={{ width: "100%" }}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      aria-label="Product category">
                      {categories.map((cat) => (
                        <Option key={cat._id} value={cat._id}>
                          {cat.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Brand"
                    name="brand"
                    rules={[
                      { required: true, message: "Please select a brand!" },
                    ]}
                    style={{ marginBottom: 16 }}>
                    <Select
                      size="large"
                      placeholder="Select a brand"
                      value={product.brand}
                      onChange={(value) => handleChange("brand", value)}
                      style={{ width: "100%" }}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      aria-label="Product brand">
                      {brandOptions.map((brand) => (
                        <Option key={brand} value={brand}>
                          {brand}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <label
                    style={{
                      fontWeight: 600,
                      marginBottom: 8,
                      display: "block",
                    }}>
                    Stock Quantity *
                  </label>
                  <InputNumber
                    size="large"
                    placeholder="0"
                    min={0}
                    value={product.stock}
                    onChange={(value) => handleChange("stock", value || 0)}
                    style={{ width: "100%" }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Pricing */}
            <Card
              title={
                <Space>
                  <DollarOutlined />
                  <span>Pricing & Sales</span>
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: 12,
                marginBottom: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}>
              <Row gutter={[16, 24]}>
                <Col xs={24} sm={12}>
                  <label
                    style={{
                      fontWeight: 600,
                      marginBottom: 8,
                      display: "block",
                    }}>
                    Regular Price * ($)
                  </label>
                  <InputNumber
                    size="large"
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    value={product.price.regular}
                    onChange={(value) =>
                      handleNestedChange("price", "regular", value || 0)
                    }
                    style={{ width: "100%" }}
                    formatter={(value) =>
                      `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  />
                </Col>

                <Col xs={24} sm={12}>
                  <label
                    style={{
                      fontWeight: 600,
                      marginBottom: 8,
                      display: "block",
                    }}>
                    Discount Percentage (%)
                  </label>
                  <InputNumber
                    size="large"
                    placeholder="0"
                    min={0}
                    max={100}
                    value={product.price.discountPercent}
                    onChange={(value) =>
                      handleNestedChange("price", "discountPercent", value || 0)
                    }
                    style={{ width: "100%" }}
                    formatter={(value) => `${value}%`}
                    parser={(value) => value.replace("%", "")}
                  />
                </Col>

                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <label
                      style={{
                        fontWeight: 600,
                        marginBottom: 8,
                        display: "block",
                      }}>
                      On Sale
                    </label>
                    <Switch
                      checked={product.price.isOnSale}
                      onChange={(checked) =>
                        handleNestedChange("price", "isOnSale", checked)
                      }
                      checkedChildren="Yes"
                      unCheckedChildren="No"
                    />
                  </Space>
                </Col>

                <Col xs={24} sm={12}>
                  <label
                    style={{
                      fontWeight: 600,
                      marginBottom: 8,
                      display: "block",
                    }}>
                    Sale Price ($)
                  </label>
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "#f0f0f0",
                      borderRadius: "6px",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#52c41a",
                    }}>
                    ${calculateSalePrice().toFixed(2)}
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Product Variants */}
            <Card
              title={
                <Space>
                  <SettingOutlined />
                  <span>Product Variants</span>
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
                    Available Sizes
                  </label>
                  <Select
                    mode="multiple"
                    size="large"
                    placeholder="Select available sizes"
                    value={product.variants.sizes}
                    onChange={(sizes) =>
                      handleNestedChange("variants", "sizes", sizes)
                    }
                    style={{ width: "100%" }}
                    options={sizeOptions.map((size) => ({
                      label: size,
                      value: size,
                    }))}
                  />
                </Col>

                <Col span={24}>
                  <label
                    style={{
                      fontWeight: 600,
                      marginBottom: 8,
                      display: "block",
                    }}>
                    Available Colors
                  </label>
                  <Select
                    mode="multiple"
                    size="large"
                    placeholder="Select available colors"
                    value={product.variants.colors}
                    onChange={(colors) =>
                      handleNestedChange("variants", "colors", colors)
                    }
                    style={{ width: "100%" }}>
                    {colorOptions.map((color) => (
                      <Option key={color.value} value={color.value}>
                        <Space>
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              backgroundColor: color.value,
                              border: "1px solid #d9d9d9",
                              borderRadius: 2,
                            }}
                          />
                          {color.label}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </Card>

            {/* Additional Information */}
            <Card
              title={
                <Space>
                  <TagsOutlined />
                  <span>Additional Information</span>
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
                    Product Tags
                  </label>
                  <Select
                    mode="tags"
                    size="large"
                    placeholder="Add tags (press Enter to add)"
                    value={product.tags}
                    onChange={(tags) => handleChange("tags", tags)}
                    style={{ width: "100%" }}
                  />
                </Col>

                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <label
                      style={{
                        fontWeight: 600,
                        marginBottom: 8,
                        display: "block",
                      }}>
                      Product Status
                    </label>
                    <Switch
                      checked={product.status}
                      onChange={(checked) => handleChange("status", checked)}
                      checkedChildren="Active"
                      unCheckedChildren="Inactive"
                    />
                  </Space>
                </Col>

                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <label
                      style={{
                        fontWeight: 600,
                        marginBottom: 8,
                        display: "block",
                      }}>
                      New Product
                    </label>
                    <Switch
                      checked={product.isNew}
                      onChange={(checked) => handleChange("isNew", checked)}
                      checkedChildren="Yes"
                      unCheckedChildren="No"
                    />
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <PictureOutlined />
                  <span>Product Gallery</span>
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}>
              {product.images.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <img
                    style={{
                      width: "100%",
                      borderRadius: "12px",
                      maxHeight: "200px",
                      objectFit: "cover",
                    }}
                    src={product.images[0] || productImg}
                    alt="Product Preview"
                  />
                </div>
              )}

              <Upload.Dragger
                fileList={fileList}
                onChange={handleUploadChange}
                listType="picture"
                accept=".png,.jpg,.jpeg,.webp"
                multiple
                showUploadList={{ showRemoveIcon: true }}
                beforeUpload={() => false}
                style={{
                  borderRadius: 8,
                  border: "2px dashed #d9d9d9",
                  background: "#fafafa",
                }}>
                <p className="ant-upload-drag-icon">
                  <PlusOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                </p>
                <p
                  className="ant-upload-text"
                  style={{ fontSize: 16, margin: "8px 0" }}>
                  <strong>Drop images here</strong> or click to browse
                </p>
                <p
                  className="ant-upload-hint"
                  style={{ color: "#999", fontSize: 14 }}>
                  Support: JPG, PNG, WEBP (Max 5MB each)
                </p>
              </Upload.Dragger>
            </Card>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            marginTop: 24,
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}>
          <Space size="large">
            {isAddNew ? (
              <Button
                type="primary"
                size="large"
                onClick={handleCreate}
                style={{ minWidth: 120, height: 48 }}>
                Create Product
              </Button>
            ) : (
              <>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleUpdate}
                  style={{ minWidth: 120, height: 48 }}>
                  Update Product
                </Button>
                <Button
                  danger
                  size="large"
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  style={{ minWidth: 120, height: 48 }}>
                  Delete
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
      </div>
    </div>
  );
}
