import { useState, createContext } from "react";
import { Layout } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../../common/components/Sidebar";
import "./account.css";
import { ActiveTabContext } from "../../common/components/ActiveTabContext";
import {
  DashboardOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  MessageOutlined,
} from "@ant-design/icons";

const { Content } = Layout;

const accountTabs = [
  {
    key: "1",
    name: "My Account",
    icon: <DashboardOutlined />,
    path: "/account/profile",
  },
  {
    key: "3",
    name: "Order List",
    icon: <UnorderedListOutlined />,
    path: "/account/orders",
  },
  { key: "4", name: "Chat", icon: <MessageOutlined />, path: "/account/chat" },
];

export default function Account() {
  const [activeTab, setActiveTab] = useState("1");
  const location = useLocation();
  console.log(location.pathname);

  return (
    <ActiveTabContext.Provider value={{ activeTab, setActiveTab }}>
      <Layout
        className="account-layout"
        style={{ minHeight: "100vh", backgroundColor: "#e7e7e3" }}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={accountTabs}
        />
        <Layout>
          <Content style={{ margin: "24px 16px 0" }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ActiveTabContext.Provider>
  );
}
