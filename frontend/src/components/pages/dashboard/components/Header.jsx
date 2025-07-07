import React, { useState, useRef, useEffect } from 'react';
import { Layout, Button, Input, Dropdown, Menu } from 'antd';
import {
  SearchOutlined,
  BellOutlined,
  LogoutOutlined,
  RightOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { products } from '../../../../data/mockData';
import { useAuth } from '../../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
const { Header: AntHeader } = Layout;

export default function Header({ userRole = 'ADMIN' }) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const wrapperRef = useRef(null);
  const accountBtnRef = useRef(null);
  const accountMenuRef = useRef(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (search.trim() === '') {
      setFiltered([]);
      setShowDropdown(false);
      return;
    }
    const result = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
    setShowDropdown(true);
  }, [search]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        (!accountMenuRef.current || !accountMenuRef.current.contains(event.target)) &&
        (!accountBtnRef.current || !accountBtnRef.current.contains(event.target))
      ) {
        setShowDropdown(false);
        setShowInput(false);
        setSearch('');
        setShowAccountMenu(false);
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

  const handleSearchIconClick = () => {
    setShowInput(true);
  };

  const handleInputClear = () => {
    setSearch('');
    setShowDropdown(false);
    setShowInput(false);
  };

  const handleOverlayClick = () => {
    setShowDropdown(false);
    setShowInput(false);
    setSearch('');
    setShowAccountMenu(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate(userRole === 'ADMIN' ? '/login-admin' : '/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleNewDrop = () => {
    console.log('New Drop clicked! Navigating to /listing-page?isNew=true');
    navigate('/listing-page?isNew=true');
  };

  // Account menu items based on role
  const getAccountMenuItems = () => {
    const baseItems = [
      {
        key: 'profile',
        label: 'View Profile',
        icon: <UserOutlined />,
        onClick: handleViewProfile,
      },
      {
        key: 'edit-profile',
        label: 'Edit Profile',
        icon: <SettingOutlined />,
        onClick: handleEditProfile,
      },
      {
        key: 'change-password',
        label: 'Change Password',
        icon: <SettingOutlined />,
        onClick: handleChangePassword,
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        label: 'Logout',
        icon: <LogoutOutlined />,
        onClick: handleLogout,
      },
    ];

    // For admin, we might want to show different options
    if (userRole === 'ADMIN') {
      return [
        {
          key: 'change-password',
          label: 'Change Password',
          icon: <SettingOutlined />,
          onClick: handleChangePassword,
        },
        {
          type: 'divider',
        },
        {
          key: 'logout',
          label: 'Logout',
          icon: <LogoutOutlined />,
          onClick: handleLogout,
        },
      ];
    }

    return baseItems;
  };

  const accountMenu = (
    <Menu
      items={getAccountMenuItems()}
      style={{
        minWidth: 200,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        borderRadius: 8,
      }}
    />
  );

  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'ADMIN':
        return 'ADMIN';
      case 'SHOP_OWNER':
        return 'SHOP OWNER';
      default:
        return 'USER';
    }
  };

  const getUserDisplayName = () => {
    return user?.name || user?.email || 'User';
  };

  return (
    <AntHeader
      className="header"
      style={{
        background: '#fff',
        margin: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '0px',
        padding: '0 24px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Left side - Search */}
      <div
        ref={wrapperRef}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {!showInput && (
          <SearchOutlined
            style={{ fontSize: 20, cursor: 'pointer' }}
            onClick={handleSearchIconClick}
          />
        )}
        {showInput && (
          <Input
            ref={inputRef}
            placeholder="Search products..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => search && setShowDropdown(true)}
            style={{ width: 220, borderRadius: 8, marginLeft: 4 }}
            allowClear
            onClear={handleInputClear}
          />
        )}
        {showInput && showDropdown && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: 40,
              left: 0,
              width: 320,
              background: '#fff',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
              borderRadius: 16,
              zIndex: 100,
              padding: 20,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Products</div>
            {filtered.length === 0 ? (
              <div style={{ color: '#888', padding: '16px 0' }}>No products found.</div>
            ) : (
              filtered.slice(0, 3).map(p => (
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
                  <span style={{ fontWeight: 500, fontSize: 18 }}>{p.name}</span>
                </div>
              ))
            )}
            <a href="/dashboard/products" style={{ color: '#2d5bff', fontWeight: 600 }}>
              See all products
            </a>
          </div>
        )}
      </div>

      {/* Right side - Notifications and Account */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />

        <Dropdown overlay={accountMenu} trigger={['click']} placement="bottomRight">
          <Button
            type="default"
            ref={accountBtnRef}
            style={{
              fontWeight: 600,
              letterSpacing: 1,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <UserOutlined />
            {getUserDisplayName()}
            <span style={{ fontSize: 12, opacity: 0.7 }}>({getRoleDisplayName()})</span>
            <span style={{ marginLeft: 4 }}>▼</span>
          </Button>
        </Dropdown>
      </div>

      {/* Overlay for closing dropdowns */}
      {showInput && showDropdown ? (
        <div
          onClick={handleOverlayClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.18)',
            zIndex: 99,
          }}
        />
      ) : null}
    </AntHeader>
  );
}
