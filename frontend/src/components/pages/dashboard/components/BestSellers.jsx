import React from "react";
import { Button } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import shoe from "../../../../assets/images/nikeproduct.png";
import { products } from "../../../../data/mockData";

export default function BestSellers() {
  // Get top 3 products by sales
  const bestSellers = [...products]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 3);

  return (
    <div className="best-sellers">
      <div className="best-sellers-header">
        <h4 className="best-seller-title">Best Sellers</h4>
        <MoreOutlined className="best-sellers-more" />
      </div>
      <div className="best-sellers-list">
        {bestSellers.map((item) => (
          <div className="best-seller-item" key={item.id}>
            <img className="best-seller-avatar" src={shoe} alt={item.name} />
            <div className="best-seller-info">
              <div className="best-seller-name">{item.name}</div>
              <div className="best-seller-price">
                ${item.price.regular.toFixed(2)}
              </div>
            </div>
            <div className="best-seller-meta">
              <div className="best-seller-price-bold">
                ${item.price.regular.toFixed(2)}
              </div>
              <div className="best-seller-sales">{item.sales} sales</div>
            </div>
          </div>
        ))}
      </div>
      <Button className="best-seller-report" block>
        REPORT
      </Button>
    </div>
  );
}
