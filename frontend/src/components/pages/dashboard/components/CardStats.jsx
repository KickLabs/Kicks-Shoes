import React from "react";
import { Card } from "antd";
import {
  ShoppingOutlined,
  MoreOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";

const stats = [
  { title: "Total Orders", value: "$126.500", percent: 34.7 },
  { title: "Active Orders", value: "$126.500", percent: 34.7 },
  { title: "Shipped Orders", value: "$126.500", percent: 34.7 },
];

export default function CardStats() {
  return (
    <div className="card-stats">
      {stats.map((s, i) => (
        <Card className="stat-card" key={i} bordered={false}>
          <div className="stat-card-row">
            <div className="stat-card-icon">
              <ShoppingOutlined />
            </div>
            <MoreOutlined className="stat-card-more" />
          </div>
          <div className="stat-card-title">{s.title}</div>
          <div className="stat-card-main">
            <span className="stat-card-value">{s.value}</span>
            <span className="stat-card-percent">
              <ArrowUpOutlined /> {s.percent}%
            </span>
          </div>
          <div className="stat-card-desc">Compared to Jan 2022</div>
        </Card>
      ))}
    </div>
  );
}
