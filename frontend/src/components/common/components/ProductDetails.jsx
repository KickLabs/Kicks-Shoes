import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Input,
  message,
  Row,
  Select,
  Upload
} from "antd";
import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import productImg from "../../../assets/images/nikeproduct.png";
import { ActiveTabContext } from "./ActiveTabContext";
import "./order-details.css";
import "./product-details.css";
import TabHeader from "./TabHeader";

const { TextArea } = Input;
const { Option } = Select;

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

const emptyProduct = {
  name: "",
  description: "",
  category: "",
  brand: "",
  sku: "",
  stock: "",
  regularPrice: "",
  salePrice: "",
  tags: [],
  images: [],
};

export default function ProductDetails() {
  const { setActiveTab } = useContext(ActiveTabContext);
  const location = useLocation();
  const isAddNew = location.pathname.includes("add-new");
  const [product, setProduct] = useState(isAddNew ? emptyProduct : mockProduct);
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

  useEffect(() => {
    setActiveTab("2");
  }, [setActiveTab]);

  const handleChange = (field, value) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleTagClose = (removedTag) => {
    setProduct((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== removedTag),
    }));
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    setProduct((prev) => ({
      ...prev,
      images: newFileList.map((f) => f.url || f.thumbUrl),
    }));
  };

  const handleUpdate = () => {
    message.success("Product updated!");
  };
  const handleDelete = () => {
    message.error("Product deleted!");
  };
  const handleCancel = () => {
    message.info("Canceled");
  };
  const handleCreate = () => {
    message.success("Product created!");
  };

  return (
    <div>
      <TabHeader
        breadcrumb="All Products"
        anotherBreadcrumb={isAddNew ? "Add New Product" : "Product Details"}
      />
      <div className="product-details-container">
        <Row gutter={[32, 32]}>
          <Col xs={24} md={16}>
            <Card
              bordered={false}
              style={{ borderRadius: 12, marginBottom: 24 }}
            >
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <label>Product Name</label>
                  <Input
                    value={product.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    style={{ marginBottom: 16 }}
                  />
                </Col>
                <Col span={24}>
                  <label>Description</label>
                  <TextArea
                    value={product.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    rows={3}
                    style={{ marginBottom: 16, height: "150px" }}
                  />
                </Col>
                <Col span={12}>
                  <label>Category</label>
                  <Input
                    value={product.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    style={{ marginBottom: 16 }}
                  />
                </Col>
                <Col span={12}>
                  <label>Brand Name</label>
                  <Input
                    value={product.brand}
                    onChange={(e) => handleChange("brand", e.target.value)}
                    style={{ marginBottom: 16 }}
                  />
                </Col>
                <Col span={12}>
                  <label>SKU</label>
                  <Input
                    value={product.sku}
                    onChange={(e) => handleChange("sku", e.target.value)}
                    style={{ marginBottom: 16 }}
                  />
                </Col>
                <Col span={12}>
                  <label>Stock Quantity</label>
                  <Input
                    type="number"
                    value={product.stock}
                    onChange={(e) => handleChange("stock", e.target.value)}
                    style={{ marginBottom: 16 }}
                  />
                </Col>
                <Col span={12}>
                  <label>Regular Price</label>
                  <Input
                    type="number"
                    value={product.regularPrice}
                    onChange={(e) =>
                      handleChange("regularPrice", e.target.value)
                    }
                    style={{ marginBottom: 16 }}
                  />
                </Col>
                <Col span={12}>
                  <label>Sale Price</label>
                  <Input
                    type="number"
                    value={product.salePrice}
                    onChange={(e) => handleChange("salePrice", e.target.value)}
                    style={{ marginBottom: 16 }}
                  />
                </Col>
                <Col span={24}>
                  <label>Tag</label>
                  <Select
                    mode="tags"
                    style={{ width: "100%", marginBottom: 16 }}
                    placeholder="Enter tags"
                    value={product.tags}
                    onChange={(tags) => handleChange("tags", tags)}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card bordered={false} className="product-details-gallery-card">
              <img
                style={{ width: "100%", borderRadius: "20px" }}
                src={product.images[0] || productImg}
                alt="Product"
              />
              <div className="product-details-gallery-label">
                Product Gallery
              </div>
              <Upload.Dragger
                fileList={fileList}
                onChange={handleUploadChange}
                listType="picture"
                accept=".png,.jpg,.jpeg"
                multiple
                showUploadList={{ showRemoveIcon: true }}
                beforeUpload={() => false}
              >
                <p className="ant-upload-drag-icon">
                  <PlusOutlined />
                </p>
                <p className="ant-upload-text">
                  Drop your image here, or browse
                  <br />
                  Jpeg, png are allowed
                </p>
              </Upload.Dragger>
            </Card>
          </Col>
        </Row>
        <div className="product-details-actions">
          {isAddNew ? (
            <Button type="default" onClick={handleCreate}>
              CREATE
            </Button>
          ) : (
            <>
              <Button type="default" onClick={handleUpdate}>
                UPDATE
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                DELETE
              </Button>
              <Button onClick={handleCancel} type="default">
                CANCEL
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
