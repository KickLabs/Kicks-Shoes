import { useState } from "react";
import { Button, Typography, Modal } from "antd";
import { formatPrice } from "../../../../utils/StringFormat";
import "./ProductInfoSection.css";
import SizePanel from "../../listing-page/components/SizePanel";
import { HeartOutlined } from "@ant-design/icons";

const { Paragraph } = Typography;

const ProductInfoSection = ({ product }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(
    product.variants.colors[0]
  );

  // Danh sách size đầy đủ (ví dụ size EU 38 - 47)
  const allSizes = [38, 39, 40, 41, 42, 43, 44, 45, 46, 47];

  // Lấy các size đang có sẵn (US 7 -> 7)
  const availableSizes = product.variants.sizes.map((s) =>
    parseInt(s.replace("US ", ""))
  );

  const sizeData = allSizes.map((size) => ({
    value: size,
    disabled: !availableSizes.includes(size)
  }));

  return (
    <div className="product-info">
      {/* Badges */}
      <div className="product-tags">
        {product.isNew && (
          <div className="product-card__badge new-badge">New</div>
        )}
        {product.price.isOnSale && (
          <div
            style={{ backgroundColor: "#FFA52F", width: "70px" }}
            className="product-card__badge"
          >
            {product.price.discountPercent}% off
          </div>
        )}
      </div>

      {/* Name + Price */}
      <h1 className="product-name">{product.name}</h1>
      <h2 className="product-price" style={{ color: "#4A69E2" }}>
        {product.price.isOnSale
          ? formatPrice(
              product.price.regular * (1 - product.price.discountPercent / 100)
            )
          : formatPrice(product.price.regular)}
      </h2>

      {/* Color Selector */}
      <div className="variant-block">
        <h3 className="variant-label">Color</h3>
        <div className="color-options">
          {product.variants.colors.map((color) => (
            <div
              key={color}
              className={`color-swatch ${
                selectedColor === color ? "active" : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      </div>

      <div className="variant-block">
        <div className="size-header">
          <h3 className="variant-label">Size</h3>
          <h4
            className="variant-label"
            style={{
              marginRight: 40,
              cursor: "pointer",
              textDecorationLine: "underline",
              fontWeight: 500
            }}
            onClick={() => setIsModalOpen(true)}
          >
            Size Chart
          </h4>
        </div>
        <SizePanel
          sizes={sizeData}
          selectedSize={selectedSize}
          onSizeSelect={setSelectedSize}
        />
      </div>

      <Modal
        title="Size Chart"
        open={isModalOpen}
        footer={null}
        onCancel={() => setIsModalOpen(false)}
      >
        <img
          src="https://cdn.shopify.com/s/files/1/0250/7640/4884/files/men-size-chart.jpg"
          alt="Size Chart"
          style={{ width: "100%", borderRadius: 8 }}
        />
      </Modal>

      {/* Buttons */}
      <div className="product-actions">
        <div className="top-actions">
          <Button size="large" className="cart-btn">
            ADD TO CART
          </Button>
          <button className="icon-btn">
            <HeartOutlined />
          </button>
        </div>
        <Button size="large" className="buy-now-btn">
          BUY IT NOW
        </Button>
      </div>

      {/* Description */}
      <div className="product-description">
        <h4 type="secondary" className="summary-text">
          {product.summary}
        </h4>
        <ul className="benefit-list">
          <li>{product.description}</li>
          <li>{product.brand}</li>
        </ul>
      </div>
    </div>
  );
};

export default ProductInfoSection;
