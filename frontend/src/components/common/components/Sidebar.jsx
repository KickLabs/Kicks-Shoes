import { Layout, Menu } from "antd";
import logo from "@assets/images/logo_small.png";
import { useNavigate } from "react-router-dom";

const { Sider } = Layout;

export default function Sidebar({ activeTab, setActiveTab, tabs }) {
  const navigate = useNavigate();

  const handleMenuClick = (key) => {
    setActiveTab(key);
    const selected = tabs.find((tab) => tab.key === key);
    if (selected) {
      navigate(selected.path);
    }
  };

  // Convert tabs to menu items format
  const menuItems = tabs.map(tab => ({
    key: tab.key,
    icon: tab.icon,
    label: tab.name,
    style: { height: 48 }
  }));

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
        items={menuItems}
      />
    </Sider>
  );
}