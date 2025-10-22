import {
  CameraOutlined,
  DashboardOutlined,
  FireFilled,
  LockOutlined,
  LogoutOutlined,
  MenuOutlined,
  ReadOutlined,
  SearchOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  VideoCameraOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Input, Layout, Menu, Button, Modal, Badge, message } from 'antd';
import logo from '@assets/Logo.svg';
import { Avatar, Badge, Button, Dropdown, Input, Layout, Menu, Modal, Upload, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../services/axiosInstance';
import { useSelector } from 'react-redux';
import ShipperApplicationModal from './ShipperApplicationModal';
import shipperApplicationService from '../../../services/shipperApplicationService';
import './Header.css';

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
  const [showShipperApplicationModal, setShowShipperApplicationModal] = useState(false);
  const [pendingApplication, setPendingApplication] = useState(null);
  const [loadingApplication, setLoadingApplication] = useState(false);
  const [isVisualSearchModalVisible, setIsVisualSearchModalVisible] = useState(false);
  const [visualSearchFile, setVisualSearchFile] = useState(null);
  const [visualSearchPreview, setVisualSearchPreview] = useState(null);
  const [visualSearchLoading, setVisualSearchLoading] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('userInfo') ? true : false;

  // Get cart items from Redux store
  const cartItems = useSelector(state => state.cart?.items || []);
  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

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

  // Check if user has pending shipper application
  useEffect(() => {
    const checkPendingApplication = async () => {
      if (user?.role === 'customer') {
        try {
          setLoadingApplication(true);
          const response = await shipperApplicationService.getMyApplications();
          if (response.success) {
            // Find pending application
            const pending = response.data.find(app => app.status === 'pending');
            setPendingApplication(pending || null);
          }
        } catch (error) {
          console.error('Error checking application:', error);
        } finally {
          setLoadingApplication(false);
        }
      }
    };
    checkPendingApplication();
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
        (p.category?.name && p.category.name.toLowerCase().includes(search.toLowerCase()))
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

  // Visual Search Functions
  const handleVisualSearchClick = () => {
    setIsVisualSearchModalVisible(true);
  };

  const handleVisualSearchCancel = () => {
    setIsVisualSearchModalVisible(false);
    setVisualSearchFile(null);
    setVisualSearchPreview(null);
  };

  const handleVisualSearchFileChange = info => {
    const file = info.file;
    if (file) {
      setVisualSearchFile(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => setVisualSearchPreview(reader.result);
    }
  };

  const handleVisualSearch = async () => {
    if (!visualSearchFile) {
      message.error('Vui lòng chọn một hình ảnh để tìm kiếm.');
      return;
    }

    setVisualSearchLoading(true);
    const formData = new FormData();
    formData.append('image', visualSearchFile);

    try {
      const response = await axiosInstance.post('/products/visual-search', formData);

      if (response.data.success) {
        message.success('Phân tích ảnh thành công, đang hiển thị kết quả...');
        setIsVisualSearchModalVisible(false);
        setVisualSearchFile(null);
        setVisualSearchPreview(null);

        // Navigate to appropriate category page based on AI analysis
        const category = response.data.data.analyzedKeywords?.category?.toLowerCase();
        const targetRoute = getCategoryRoute(category);

        navigate(targetRoute, {
          state: {
            visualSearchResults: response.data.data,
            isVisualSearch: true,
          },
        });
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Không thể thực hiện tìm kiếm.';
      message.error(errorMessage);
    } finally {
      setVisualSearchLoading(false);
    }
  };

  // Function to determine category route based on AI analysis
  const getCategoryRoute = category => {
    switch (category) {
      case 'shoes':
      case 'sneakers':
      case 'footwear':
        return '/shoes';
      case 'clothing':
      case 'shirt':
      case 't-shirt':
      case 'dress':
      case 'pants':
      case 'jeans':
        return '/clothing';
      case 'accessory':
      case 'accessories':
      case 'bag':
      case 'watch':
      case 'jewelry':
        return '/accessories';
      default:
        return '/other';
    }
  };

  // Menu items using the new API
  const menuItems = [
    {
      key: 'new',
      icon: <FireFilled style={{ color: 'orange', marginRight: 4 }} />,
      label: 'New Drops',
    },
    {
      key: 'shop',
      icon: <ShopOutlined style={{ marginRight: 4 }} />,
      label: 'Shop',
      children: [
        {
          key: 'all-products',
          label: 'All Products',
        },
        {
          key: 'shoes',
          label: 'Shoes',
        },
        {
          key: 'clothing',
          label: 'Clothing',
        },
        {
          key: 'accessories',
          label: 'Accessories',
        },
        {
          key: 'other',
          label: 'Other',
        },
      ],
    },
    {
      key: 'livestream',
      icon: <VideoCameraOutlined style={{ color: 'red', marginRight: 4 }} />,
      label: 'Livestream',
    },
    {
      key: 'blog',
      icon: <ReadOutlined style={{ color: '#2d5bff', marginRight: 4 }} />,
      label: 'Blog',
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
      key: 'shop',
      icon: <ShopOutlined style={{ marginRight: 4 }} />,
      label: 'Shop',
      children: [
        {
          key: 'all-products',
          label: 'All Products',
        },
        {
          key: 'shoes',
          label: 'Shoes',
        },
        {
          key: 'clothing',
          label: 'Clothing',
        },
        {
          key: 'accessories',
          label: 'Accessories',
        },
        {
          key: 'other',
          label: 'Other',
        },
      ],
    },
    {
      key: 'livestream',
      icon: <VideoCameraOutlined style={{ color: 'red', marginRight: 4 }} />,
      label: 'Livestream',
    },
    {
      key: 'blog',
      icon: <ReadOutlined style={{ color: '#2d5bff', marginRight: 4 }} />,
      label: 'Blog',
    },
  ];

  // Determine active menu item based on current location
  const getActiveKey = () => {
    const path = location.pathname;
    if (path === '/blog' || path.startsWith('/blog/')) return 'blog';
    if (path === '/livestream' || path.startsWith('/livestream/')) return 'livestream';
    if (path === '/listing-page' || path.startsWith('/listing-page')) return 'shop';
    if (path === '/shoes' || path === '/clothing' || path === '/accessories' || path === '/other')
      return 'shop';
    if (path === '/' || path === '/home') return null; // Home page
    return null;
  };

  const handleMenuClick = e => {
    if (e.key === 'new') {
      navigate('/listing-page?isNew=true');
    } else if (e.key === 'all-products') {
      navigate('/listing-page');
    } else if (e.key === 'shoes') {
      navigate('/shoes');
    } else if (e.key === 'clothing') {
      navigate('/clothing');
    } else if (e.key === 'accessories') {
      navigate('/accessories');
    } else if (e.key === 'other') {
      navigate('/other');
    } else if (e.key === 'livestream') {
      navigate('/livestream');
    } else if (e.key === 'blog') {
      navigate('/blog');
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
    ...(user?.role === 'shipper'
      ? [
          {
            key: 'shipper-dashboard',
            icon: <DashboardOutlined />,
            label: 'Shipper Dashboard',
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
    if (key === 'shipper-dashboard') {
      navigate('/shipper-dashboard');
      return;
    }
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
      console.log('Using avatar URL:', user.avatar); // Debug log
      return <Avatar src={user.avatar} className="header-avatar" />;
    } else if (user && (user.name || user.fullName)) {
      const displayName = user.name || user.fullName;
      console.log('Using display name:', displayName); // Debug log
      return <Avatar className="header-avatar">{displayName.charAt(0).toUpperCase()}</Avatar>;
    } else {
      console.log('Using default avatar icon'); // Debug log
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
          <Dropdown
            menu={{
              items: dropdownItems.map(item => ({
                ...item,
                children: item.children?.map(child => ({
                  ...child,
                  type: child.key === getActiveKey() ? 'primary' : 'default',
                })),
              })),
              onClick: handleMenuClick,
            }}
            trigger={['click']}
          >
            <MenuOutlined className="menu-icon" />
          </Dropdown>
        ) : (
          <Menu
            mode="horizontal"
            className="header-menu"
            items={menuItems}
            onClick={handleMenuClick}
            selectedKeys={[getActiveKey()].filter(Boolean)}
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
              <>
                <SearchOutlined className="header-icon" onClick={() => setShowInput(true)} />
                <CameraOutlined
                  className="header-icon"
                  onClick={handleVisualSearchClick}
                  style={{ marginLeft: 8, color: '#4A69E2' }}
                  title="Tìm kiếm bằng hình ảnh"
                />
              </>
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
            <Badge
              count={cartItemsCount}
              size="small"
              style={{
                marginRight: 12,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/cart')}
            >
              <ShoppingCartOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
            </Badge>
            {user?.role === 'customer' && (
              <Button
                type="primary"
                icon={<CarOutlined />}
                loading={loadingApplication}
                disabled={!!pendingApplication}
                onClick={() => {
                  if (pendingApplication) {
                    message.info('You already have a pending application. Please wait for approval.');
                    return;
                  }
                  console.log('🚗 Mobile: Become Shipper button clicked!');
                  setShowShipperApplicationModal(true);
                }}
                style={{
                  marginRight: 12,
                  borderRadius: 8,
                  background: pendingApplication ? '#faad14' : '#52c41a',
                  borderColor: pendingApplication ? '#faad14' : '#52c41a',
                }}
                size="small"
              >
                {pendingApplication ? '📋 Pending' : '🚗 Shipper'}
              </Button>
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
              <>
                <SearchOutlined className="header-icon" onClick={() => setShowInput(true)} />
                <CameraOutlined
                  className="header-icon"
                  onClick={handleVisualSearchClick}
                  style={{ marginLeft: 8, color: '#4A69E2' }}
                  title="Tìm kiếm bằng hình ảnh"
                />
              </>
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
              <>
                {user?.role === 'customer' && (
                  <Button
                    type="primary"
                    icon={<CarOutlined />}
                    loading={loadingApplication}
                    disabled={!!pendingApplication}
                    onClick={() => {
                      if (pendingApplication) {
                        message.info('You already have a pending application. Please wait for approval.');
                        return;
                      }
                      console.log('🚗 Desktop: Become Shipper button clicked!');
                      setShowShipperApplicationModal(true);
                    }}
                    style={{
                      marginRight: 12,
                      borderRadius: 8,
                      background: pendingApplication ? '#faad14' : '#52c41a',
                      borderColor: pendingApplication ? '#faad14' : '#52c41a',
                    }}
                  >
                    {pendingApplication ? '📋 Application Pending' : 'Become a Shipper'}
                  </Button>
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
              <div onClick={() => navigate('/login')}>
                <UserOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
              </div>
            )}
            <Badge
              count={cartItemsCount}
              size="small"
              style={{
                marginLeft: 12,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/cart')}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  fontSize: 20,
                  cursor: 'pointer',
                }}
              >
                <ShoppingCartOutlined />
              </div>
            </Badge>
          </>
        )}
      </div>

      {/* Shipper Application Modal */}
      <ShipperApplicationModal
        visible={showShipperApplicationModal}
        onClose={() => setShowShipperApplicationModal(false)}
        onSuccess={async () => {
          // Refresh pending application status
          try {
            const response = await shipperApplicationService.getMyApplications();
            if (response.success) {
              const pending = response.data.find(app => app.status === 'pending');
              setPendingApplication(pending || null);
            }
          } catch (error) {
            console.error('Error refreshing application:', error);
          }
        }}
      />
      {/* Visual Search Modal */}
      <Modal
        title="Tìm Kiếm Bằng Hình Ảnh"
        open={isVisualSearchModalVisible}
        onCancel={handleVisualSearchCancel}
        footer={[
          <Button key="cancel" onClick={handleVisualSearchCancel}>
            Hủy
          </Button>,
          <Button
            key="search"
            type="primary"
            loading={visualSearchLoading}
            onClick={handleVisualSearch}
            disabled={!visualSearchFile}
          >
            {visualSearchLoading ? 'Đang phân tích...' : 'Tìm Kiếm'}
          </Button>,
        ]}
      >
        <Upload.Dragger
          name="file"
          multiple={false}
          showUploadList={false}
          beforeUpload={file => {
            const isJpgOrPng =
              file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
            if (!isJpgOrPng) {
              message.error('Bạn chỉ có thể tải lên file JPG/PNG/WEBP!');
              return false;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
              message.error('Hình ảnh phải nhỏ hơn 5MB!');
              return false;
            }
            handleVisualSearchFileChange({ file });
            return false;
          }}
          style={{ height: 200 }}
        >
          {visualSearchPreview ? (
            <img
              src={visualSearchPreview}
              alt="Preview"
              style={{
                width: '100%',
                maxHeight: '180px',
                objectFit: 'contain',
                borderRadius: 8,
              }}
            />
          ) : (
            <>
              <p className="ant-upload-drag-icon">
                <CameraOutlined style={{ fontSize: 48, color: '#4A69E2' }} />
              </p>
              <p className="ant-upload-text">Nhấn hoặc kéo thả file vào đây</p>
              <p className="ant-upload-hint">
                Tìm kiếm sản phẩm từ hình ảnh. Hỗ trợ PNG, JPG, WEBP (Tối đa 5MB).
              </p>
            </>
          )}
        </Upload.Dragger>
        {visualSearchFile && (
          <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
            Tệp đã chọn: {visualSearchFile.name}
          </div>
        )}
      </Modal>
    </Header>
  );
};

export default AppHeader;
