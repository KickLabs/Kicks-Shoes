  import React, { useState, createContext } from "react";
  import { Layout } from "antd";
  import { Outlet, useLocation } from "react-router-dom";
  import Sidebar from "../../common/components/Sidebar";
  import Header from "./components/Header";
  import Footer from "./components/Footer";
  import CardStats from "./components/CardStats";
  import SaleGraph from "./components/SaleGraph";
  import BestSellers from "./components/BestSellers";
  import TableOrders from "./components/TableOrders";
  import "./dashboard.css";
  import { getOrders } from "../../../data/mockData";
  import { ActiveTabContext } from "../../common/components/ActiveTabContext";
  import {
    DashboardOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    WalletOutlined,
    MessageOutlined,
    UserOutlined,
  } from "@ant-design/icons";

  const { Content } = Layout;

  export const DashboardContent = () => {
    const pageSize = 5;
    const currentOrders = getOrders(1, pageSize);

    return (
      <>
        <CardStats />
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 2 }}>
            <SaleGraph />
          </div>
          <div style={{ flex: 1 }}>
            <BestSellers />
          </div>
        </div>
        <TableOrders orders={currentOrders} title="Recent Orders" dashboard={true}/>
      </>
    );
  };

  const dashboardTabs = [
    { key: "1", name: "Dashboard", icon: <DashboardOutlined />, path: "/dashboard" },
    { key: "2", name: "All Products", icon: <AppstoreOutlined />, path: "/dashboard/products" },
    { key: "3", name: "Order List", icon: <UnorderedListOutlined />, path: "/dashboard/orders" },
    { key: "4", name: "Discount Management", icon: <WalletOutlined />, path: "/dashboard/discounts" },
    { key: "5", name: "User Management", icon: <UserOutlined />, path: "/dashboard/users" },
    { key: "6", name: "Chat", icon: <MessageOutlined />, path: "/dashboard/chat" },
  ];

  export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("1");
    const location = useLocation();

    return (
      <ActiveTabContext.Provider value={{ activeTab, setActiveTab }}>
        <Layout style={{ minHeight: "100vh" }}>
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={dashboardTabs}/>
          <Layout>
            <Header />
            <Content style={{ margin: "24px 16px 0" }}>
              <Outlet />
            </Content>
            <Footer />
          </Layout>
        </Layout>
      </ActiveTabContext.Provider>
    );
  }
