import React, { useEffect, useRef, useState } from 'react';
import {
  DownOutlined,
  FireFilled,
  MenuOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Dropdown, Input, Layout, Menu, Button } from 'antd';
import logo from '@assets/Logo.svg';
import './Header.css';

const { Header } = Layout;

const NotificationBadgeOnly = ({ count = 0 }) => (
  <div>{count > 99 ? '99+' : count}</div>
);

const AppHeader = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFiltered([]);
      setShowDropdown(false);
      return;
    }
    const result = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
    setShowDropdown(true);
  }, [search]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
        setShowInput(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const dropdownMenu = (
    <Menu>
      <Menu.Item
        key="new"
        icon={<FireFilled style={{ color: 'orange', marginRight: 4 }} />}
      >
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

  return (
    <Header className="app-header">
      {(showInput && showDropdown) && (
        <div
          onClick={() => {
            setShowDropdown(false);
            setShowInput(false);
            setSearch('');
          }}
        />
      )}

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

      
      <div className="header-right" ref={wrapperRef}>
  {isMobile ? (
    <>
      {!showInput && (
        <SearchOutlined
          className="header-icon"
          onClick={() => setShowInput(true)}
        />
      )}
      {showInput && (
        <Input
          ref={inputRef}
          placeholder="Search products..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => search && setShowDropdown(true)}
          style={{ width: 180, borderRadius: 8, marginRight: 8 }}
          allowClear
        />
      )}
      <Avatar icon={<UserOutlined />} className="header-avatar" />
    </>
  ) : (
    <>
      {!showInput && (
        <SearchOutlined
          className="header-icon"
          onClick={() => setShowInput(true)}
        />
      )}
      {showInput && (
        <Input
          ref={inputRef}
          placeholder="Search products..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => search && setShowDropdown(true)}
          style={{ width: 220, borderRadius: 8, marginRight: 8 }}
          allowClear
        />
      )}
      {showInput && showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: 72,
            right: 160,
            width: 320,
            background: '#fff',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            borderRadius: 16,
            zIndex: 100,
            padding: 20,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>
            Products
          </div>
          {filtered.length === 0 ? (
            <div style={{ color: '#888', padding: '16px 0' }}>
              No products found.
            </div>
          ) : (
            filtered.slice(0, 3).map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <img
                  src={`/assets/images/${p.image}`}
                  alt={p.name}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    objectFit: 'cover',
                  }}
                />
                <span style={{ fontWeight: 500, fontSize: 18 }}>
                  {p.name}
                </span>
              </div>
            ))
          )}
          <a
            href="/dashboard/products"
            style={{ color: '#2d5bff', fontWeight: 600 }}
          >
            See all products
          </a>
        </div>
      )}
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
        <NotificationBadgeOnly count={8} />
      </div>
    </>
  )}
</div>

    </Header>
  );
};

export default AppHeader;
