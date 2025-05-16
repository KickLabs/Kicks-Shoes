import React from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import logo from "../../../../assets/images/logo_small.png";
import { useNavigate } from "react-router-dom";

const { Sider } = Layout;

export default function Sidebar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();

  const handleMenuClick = (key) => {
    setActiveTab(key);
    switch (key) {
      case "1":
        navigate("/dashboard");
        break;
      case "2":
        navigate("/dashboard/products");
        break;
      case "3":
        navigate("/dashboard/orders");
        break;
      default:
        navigate("/dashboard");
    }
  };

  return (
    <Sider width={220} className="sidebar">
      <div className="logo">
        <img className="logo_image" src={logo} alt="Logo" />
      </div>
      <Menu
        style={{ display: "flex", flexDirection: "column", gap: "6px" }}
        theme="light"
        mode="inline"
        selectedKeys={[activeTab]}
        onClick={({ key }) => handleMenuClick(key)}
        className="sidebar-menu"
      >
        <Menu.Item style={{ height: 48 }} key="1" icon={<DashboardOutlined />}>
          Dashboard
        </Menu.Item>
        <Menu.Item style={{ height: 48 }} key="2" icon={<AppstoreOutlined />}>
          All Products
        </Menu.Item>
        <Menu.Item
          style={{ height: 48 }}
          key="3"
          icon={<UnorderedListOutlined />}
        >
          Order List
        </Menu.Item>
      </Menu>
      <div style={{ color: "#fff", margin: 16 }}>Categories</div>
    </Sider>
  );
}
