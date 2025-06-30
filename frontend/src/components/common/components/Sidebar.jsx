import { Layout, Menu } from 'antd';
import logo from '@assets/images/logo_small.png';
import { useNavigate } from 'react-router-dom';

const { Sider } = Layout;

export default function Sidebar({ activeTab, setActiveTab, tabs }) {
  const navigate = useNavigate();

  const handleMenuClick = key => {
    setActiveTab(key);
    const selected = findTabByKey(tabs, key);
    if (selected) {
      navigate(selected.path);
    }
  };

  // Helper function to find tab by key (including nested tabs)
  const findTabByKey = (tabList, targetKey) => {
    for (const tab of tabList) {
      if (tab.key === targetKey) {
        return tab;
      }
      if (tab.children) {
        const found = findTabByKey(tab.children, targetKey);
        if (found) return found;
      }
    }
    return null;
  };

  // Convert tabs to menu items format with support for nested items
  const convertTabsToMenuItems = tabList => {
    return tabList.map(tab => ({
      key: tab.key,
      icon: tab.icon,
      label: tab.name,
      style: { height: 48 },
      children: tab.children ? convertTabsToMenuItems(tab.children) : undefined,
    }));
  };

  const menuItems = convertTabsToMenuItems(tabs);

  return (
    <Sider width={220} className="sidebar">
      <div className="logo">
        <img className="logo_image" src={logo} alt="Logo" />
      </div>
      <Menu
        style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
        theme="light"
        mode="inline"
        selectedKeys={[activeTab]}
        onClick={({ key }) => handleMenuClick(key)}
        className="sidebar-menu"
        items={menuItems}
        defaultOpenKeys={tabs.filter(tab => tab.children).map(tab => tab.key)}
      />
    </Sider>
  );
}
