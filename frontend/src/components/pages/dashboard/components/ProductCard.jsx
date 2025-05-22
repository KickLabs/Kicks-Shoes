import React from "react";
import { EllipsisOutlined } from "@ant-design/icons";
import nikeproduct from "../../../../assets/images/nikeproduct.png";

const ProductCard = ({ product }) => {
  return (
    <div className="custom-product-card">
      <div className="custom-product-card-header">
        <div className="custom-product-image">
          <img src={nikeproduct} alt={product.name} />
        </div>
        <div className="custom-product-info">
          <div className="custom-product-title-row">
            <div>
              <div className="custom-product-name">{product.name}</div>
              <div className="custom-product-type">{product.type}</div>
              <div className="custom-product-price">
                ${product.price.regular.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
        <div className="custom-product-actions">
          <div
            className="custom-product-ellipsis"
            onClick={() => {
              window.location.href = `/dashboard/products/${product.id}`;
            }}
          >
            <EllipsisOutlined />
          </div>
        </div>
      </div>
      <div className="custom-product-summary-block">
        <div className="custom-product-summary-label">Summary</div>
        <div className="custom-product-summary">{product.summary}</div>
      </div>
      <div className="custom-product-stats-box">
        <div className="custom-product-stats-row">
          <div className="custom-product-stats-label">Sales</div>
          <div className="custom-product-stats-value orange">
            <span className="custom-product-arrow">↑</span> {product.sales}
          </div>
        </div>
        <div className="custom-product-divider" />
        <div className="custom-product-stats-row">
          <div className="custom-product-stats-label">Remaining Products</div>
          <div className="custom-product-progress-bar">
            <div className="custom-product-progress-inner" />
            <span className="custom-product-progress-value">
              {product.remaining}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
