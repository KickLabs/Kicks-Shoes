import {
  DownOutlined,
  FireFilled,
  MenuOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons';
import logo from '@assets/Logo.svg';
import { Avatar, Badge, Dropdown, Layout, Menu } from 'antd';
import { useEffect, useState } from 'react';
import './Header.css';

const { Header } = Layout;

const AppHeader = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // khởi tạo
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dropdownMenu = (
    <Menu>
      <Menu.Item key="new" icon={<FireFilled style={{ color: 'orange', marginRight: 4 }} />}>
        New Drops
      </Menu.Item>
      <Menu.SubMenu key="men" title="Men">
        <Menu.Item key="sneakers">Sneakers</Menu.Item>
        <Menu.Item key="apparel">Apparel</Menu.Item>
      </Menu.SubMenu>
      <Menu.SubMenu key="women" title="Women">
        <Menu.Item key="sneakers-w">Sneakers</Menu.Item>
        <Menu.Item key="accessories">Accessories</Menu.Item>
      </Menu.SubMenu>
    </Menu>
  );
const NotificationBadgeOnly = ({ count = 0 }) => {
  return (
    <div>
      {count > 99 ? '99+' : count}
    </div>
  );
};
  return (
    <Header className="app-header">
      <div className="header-left">
        {isMobile ? (
          <Dropdown overlay={dropdownMenu} trigger={['click']}>
            <MenuOutlined className="menu-icon" />
          </Dropdown>
        ) : (
          <Menu mode="horizontal" className="header-menu">
            <Menu.Item key="new">
              <FireFilled style={{ color: 'orange', marginRight: 4 }} />
              New Drops
            </Menu.Item>
            <Menu.SubMenu
              key="men"
              title={
                <span>
                  Men <DownOutlined style={{ fontSize: 10 }} />
                </span>
              }
            >
              <Menu.Item key="sneakers">Sneakers</Menu.Item>
              <Menu.Item key="apparel">Apparel</Menu.Item>
            </Menu.SubMenu>
            <Menu.SubMenu
              key="women"
              title={
                <span>
                  Women <DownOutlined style={{ fontSize: 10 }} />
                </span>
              }
            >
              <Menu.Item key="sneakers-w">Sneakers</Menu.Item>
              <Menu.Item key="accessories">Accessories</Menu.Item>
            </Menu.SubMenu>
          </Menu>
        )}
      </div>

      <div className="header-center">
        <img src={logo} alt="Logo" className="logo-img" />
      </div>

      <div className="header-right">
        <SearchOutlined className="header-icon" />
        <Avatar icon={<UserOutlined />} className="header-avatar" />
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#ff9800',
            marginLeft: 12,
          }}
        >
          <NotificationBadgeOnly count={8} className="noti" />
        </div>
      </div>
    </Header>
  );
};

export default AppHeader;
