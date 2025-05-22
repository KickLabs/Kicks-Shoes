import React from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  WalletOutlined,
  MessageOutlined,
  UserOutlined,
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
      case "4":
        navigate("/dashboard/discounts");
        break;
      case "5":
        navigate("/dashboard/users");
        break;
      case "6":
        navigate("/dashboard/chat");
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
        <Menu.Item style={{ height: 48 }} key="4" icon={<WalletOutlined />}>
          Discount Management
        </Menu.Item>
        <Menu.Item style={{ height: 48 }} key="5" icon={<UserOutlined />}>
          User Management
        </Menu.Item>
        <Menu.Item style={{ height: 48 }} key="6" icon={<MessageOutlined />}>
          Chat
        </Menu.Item>
      </Menu>
      <div style={{ color: "#fff", margin: 16 }}>Categories</div>
    </Sider>
  );
}
