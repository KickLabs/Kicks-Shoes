import React, { useEffect, useRef, useState } from 'react';
import {
  DownOutlined,
  FireFilled,
  MenuOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  LockOutlined,
  ShoppingCartOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Input, Layout, Menu, Button, Modal } from 'antd';
import logo from '@assets/Logo.svg';
import './Header.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../services/axiosInstance';

const { Header } = Layout;

const NotificationBadgeOnly = ({ count = 0 }) => <div>{count > 99 ? '99+' : count}</div>;

const AppHeader = () => {
  const { logout, user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('userInfo') ? true : false;

  // Fetch all products for search
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/products?limit=1000');
        if (response.data.success) {
          setAllProducts(response.data.data.products || []);
        }
      } catch (error) {
        console.error('Error fetching products for search:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    console.log('Current user:', user); // Debug log
  }, [user]);

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

    const result = allProducts.filter(
      p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
    setShowDropdown(true);
  }, [search, allProducts]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
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

  const handleSeeAllProducts = () => {
    navigate('/listing-page');
    setShowDropdown(false);
    setShowInput(false);
  };

  const handleProductClick = product => {
    navigate(`/product/${product._id}`);
    setShowDropdown(false);
    setShowInput(false);
    setSearch('');
  };

  // Menu items using the new API
  const menuItems = [
    {
      key: 'new',
      icon: <FireFilled style={{ color: 'orange', marginRight: 4 }} />,
      label: 'New Drops',
    },
    {
      key: 'products',
      label: 'Products',
    },
  ];

  // Dropdown menu items (for mobile)
  const dropdownItems = [
    {
      key: 'new',
      icon: <FireFilled style={{ color: 'orange', marginRight: 4 }} />,
      label: 'New Drops',
    },
    {
      key: 'products',
      label: 'Products',
    },
  ];

  const handleMenuClick = e => {
    if (e.key === 'new') {
      navigate('/listing-page?isNew=true');
    } else if (e.key === 'products') {
      navigate('/listing-page');
    }
  };

  const avatarMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    ...(user?.role === 'admin'
      ? [
          {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
          },
        ]
      : []),
    {
      key: 'change-password',
      icon: <LockOutlined />,
      label: 'Change Password',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
    },
  ];

  const handleAvatarMenuClick = ({ key }) => {
    if (key === 'profile') {
      navigate('/account');
    } else if (key === 'logout') {
      try {
        logout();
        navigate('/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    } else if (key === 'change-password') {
      navigate('/change-password');
    } else if (key === 'dashboard') {
      navigate('/dashboard');
    }
  };

  const renderAvatar = () => {
    console.log('Rendering avatar for user:', user); // Debug log
    if (user && user.avatar) {
      return <Avatar src={user.avatar} className="header-avatar" />;
    } else if (user && user.name) {
      return <Avatar className="header-avatar">{user.name.charAt(0).toUpperCase()}</Avatar>;
    } else {
      return <Avatar icon={<UserOutlined />} className="header-avatar" />;
    }
  };

  return (
    <Header className="app-header">
      {showInput && showDropdown && (
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
          <Dropdown menu={{ items: dropdownItems, onClick: handleMenuClick }} trigger={['click']}>
            <MenuOutlined className="menu-icon" />
          </Dropdown>
        ) : (
          <Menu
            mode="horizontal"
            className="header-menu"
            items={menuItems}
            onClick={handleMenuClick}
          />
        )}
      </div>

      <Link to={'/'} className="header-center">
        <img src={logo} alt="Logo" className="logo-img" />
      </Link>

      <div className="header-right" ref={wrapperRef}>
        {isMobile ? (
          <>
            {!showInput && (
              <SearchOutlined className="header-icon" onClick={() => setShowInput(true)} />
            )}
            {showInput && (
              <Input
                ref={inputRef}
                placeholder="Search products..."
                prefix={<SearchOutlined />}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => search && setShowDropdown(true)}
                style={{ width: 180, borderRadius: 8, marginRight: 8 }}
                allowClear
              />
            )}
            <Dropdown
              menu={{
                items: avatarMenuItems,
                onClick: handleAvatarMenuClick,
              }}
              trigger={['click']}
            >
              <div style={{ display: 'inline-block', cursor: 'pointer' }}>{renderAvatar()}</div>
            </Dropdown>
          </>
        ) : (
          <>
            {!showInput && (
              <SearchOutlined className="header-icon" onClick={() => setShowInput(true)} />
            )}
            {showInput && (
              <Input
                ref={inputRef}
                placeholder="Search products..."
                prefix={<SearchOutlined />}
                value={search}
                onChange={e => setSearch(e.target.value)}
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
                <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Products</div>
                {loading ? (
                  <div style={{ color: '#888', padding: '16px 0' }}>Loading...</div>
                ) : filtered.length === 0 ? (
                  <div style={{ color: '#888', padding: '16px 0' }}>No products found.</div>
                ) : (
                  filtered.slice(0, 3).map(p => (
                    <div
                      onClick={() => handleProductClick(p)}
                      key={p._id}
                      className="header-search-result-item"
                    >
                      <img
                        src={p.mainImage || p.images?.[0] || '/placeholder.svg'}
                        alt={p.name}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          objectFit: 'cover',
                        }}
                        onError={e => {
                          e.target.src = '/placeholder.svg';
                        }}
                      />
                      <span style={{ fontWeight: 500, fontSize: 18 }}>{p.name}</span>
                    </div>
                  ))
                )}
                <Button
                  type="link"
                  style={{ color: '#2d5bff', fontWeight: 600, padding: 0 }}
                  onClick={handleSeeAllProducts}
                >
                  See all products
                </Button>
              </div>
            )}
            {isLoggedIn ? (
              <Dropdown
                menu={{
                  items: avatarMenuItems,
                  onClick: handleAvatarMenuClick,
                }}
                trigger={['click']}
              >
                <div style={{ display: 'inline-block', cursor: 'pointer' }}>{renderAvatar()}</div>
              </Dropdown>
            ) : (
              <div onClick={() => navigate('/login')}>
                <UserOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
              </div>
            )}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                marginLeft: 12,
                fontSize: 20,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/cart')}
            >
              <ShoppingCartOutlined />
            </div>
          </>
        )}
      </div>
    </Header>
  );
};

export default AppHeader;
