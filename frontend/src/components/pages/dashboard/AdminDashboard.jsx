import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  message,
  Input,
  Select,
  Spin,
  Alert,
  Form,
  InputNumber,
  DatePicker,
} from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  ShoppingOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  MessageOutlined,
  SettingOutlined,
  PlusOutlined,
  AppstoreOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Line, Bar } from '@ant-design/charts';
import TableUsers from './components/TableUsers';
import TableCategories from './components/TableCategories';
import {
  getAdminStats,
  getAdminUsers,
  getAdminReportedProducts,
  getAdminFeedback,
  getAdminRevenueData,
  getAdminUserGrowthData,
  getAdminCategories,
  banUser,
  unbanUser,
  deleteReportedProduct,
  deleteFeedback,
  getAdminOrdersData,
  getAdminTopProductsData,
  getAdminShopRevenueData,
  getAdminCustomerGrowthData,
  createDiscount,
  deleteDiscount,
  getAdminDiscounts,
  createAdminDiscount,
} from '../../../services/dashboardService';
import TabHeader from '../../common/components/TabHeader';
import axiosInstance from '../../../services/axiosInstance';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

export default function AdminDashboard() {
  const location = useLocation();

  // State for real data
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reportedProducts, setReportedProducts] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New states for Financial Reports
  const [ordersData, setOrdersData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [shopRevenueData, setShopRevenueData] = useState([]);
  const [customerGrowthData, setCustomerGrowthData] = useState([]);
  const [financialLoading, setFinancialLoading] = useState(false);

  // UI State
  const [searchText, setSearchText] = useState('');

  // Modal reply admin
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyReport, setReplyReport] = useState(null);
  const [replyResolution, setReplyResolution] = useState('no_action');
  const [replyNote, setReplyNote] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Discount Management State
  const [discounts, setDiscounts] = useState([]);
  const [isAddDiscountModalVisible, setIsAddDiscountModalVisible] = useState(false);
  const [discountForm] = Form.useForm();

  // Determine current view from URL path
  const getCurrentView = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/dashboard') return 'dashboard';
    if (path === '/admin/users') return 'users';
    if (path === '/admin/categories') return 'categories';
    if (path === '/admin/moderation') return 'moderation';
    if (path === '/admin/financial') return 'financial';
    if (path === '/admin/feedback') return 'feedback';
    if (path === '/admin/discounts') return 'discounts';
    return 'dashboard';
  };

  const currentView = getCurrentView();

  // Fetch data based on current view
  useEffect(() => {
    fetchData();
  }, [currentView]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      switch (currentView) {
        case 'dashboard':
          await Promise.all([fetchStats(), fetchRevenueData(), fetchUserGrowthData()]);
          break;
        case 'financial':
          setFinancialLoading(true);
          try {
            await Promise.all([
              fetchRevenueData(),
              fetchOrdersData(),
              fetchTopProductsData(),
              fetchShopRevenueData(),
              fetchCustomerGrowthData(),
            ]);
          } finally {
            setFinancialLoading(false);
          }
          break;
        case 'users':
          await fetchUsers();
          break;
        case 'categories':
          await fetchCategories();
          break;
        case 'moderation':
          await fetchReportedProducts();
          break;
        case 'feedback':
          await fetchFeedback();
          break;
        case 'discounts':
          await fetchDiscounts();
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getAdminStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getAdminUsers(1, 10);
      setUsers(response.data?.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getAdminCategories(1, 10);
      setCategories(response.data?.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchReportedProducts = async () => {
    try {
      const response = await getAdminReportedProducts(1, 10);
      setReportedProducts(response.data?.reports || []);
    } catch (err) {
      console.error('Error fetching reported products:', err);
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await getAdminFeedback(1, 10);
      setFeedback(response.data?.feedback || []);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const response = await getAdminRevenueData('monthly');
      // Format data for Line chart
      const formattedData = (response.data || []).map(item => ({
        month: item._id || item.month,
        revenue: item.totalRevenue || item.revenue || 0,
      }));
      setRevenueData(formattedData);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      // Fallback to mock data if API fails
      setRevenueData([
        { month: 'Jan', revenue: 1500000 },
        { month: 'Feb', revenue: 1800000 },
        { month: 'Mar', revenue: 2200000 },
        { month: 'Apr', revenue: 1900000 },
        { month: 'May', revenue: 2500000 },
        { month: 'Jun', revenue: 2800000 },
      ]);
    }
  };

  const fetchUserGrowthData = async () => {
    try {
      const response = await getAdminUserGrowthData('monthly');
      setUserGrowthData(response.data || []);
    } catch (err) {
      console.error('Error fetching user growth data:', err);
    }
  };

  // New fetch functions for Financial Reports
  const fetchOrdersData = async () => {
    try {
      const response = await getAdminOrdersData('monthly');
      // Format data for Bar chart
      const formattedData = (response.data || []).map(item => ({
        month: item._id || item.month,
        orders: item.orders || 0,
      }));
      setOrdersData(formattedData);
    } catch (err) {
      console.error('Error fetching orders data:', err);
      // Fallback to mock data if API fails
      setOrdersData([
        { month: 'Jan', orders: 45 },
        { month: 'Feb', orders: 52 },
        { month: 'Mar', orders: 68 },
        { month: 'Apr', orders: 61 },
        { month: 'May', orders: 75 },
        { month: 'Jun', orders: 82 },
      ]);
    }
  };

  const fetchTopProductsData = async () => {
    try {
      const response = await getAdminTopProductsData(5);
      setTopProductsData(response.data || []);
    } catch (err) {
      console.error('Error fetching top products data:', err);
      // Fallback to mock data if API fails
      setTopProductsData([
        { productName: 'Nike Air Max', sales: 125 },
        { productName: 'Adidas Ultraboost', sales: 98 },
        { productName: 'Jordan Retro', sales: 87 },
        { productName: 'Converse Chuck', sales: 76 },
        { productName: 'Vans Old Skool', sales: 65 },
      ]);
    }
  };

  const fetchShopRevenueData = async () => {
    try {
      const response = await getAdminShopRevenueData();
      setShopRevenueData(response.data || []);
    } catch (err) {
      console.error('Error fetching shop revenue data:', err);
      // Fallback to mock data if API fails
      setShopRevenueData([
        { shopName: 'Nike Store', revenue: 850000 },
        { shopName: 'Adidas Hub', revenue: 720000 },
        { shopName: 'Jordan World', revenue: 680000 },
        { shopName: 'Converse Corner', revenue: 450000 },
        { shopName: 'Vans Zone', revenue: 380000 },
      ]);
    }
  };

  const fetchCustomerGrowthData = async () => {
    try {
      const response = await getAdminCustomerGrowthData('monthly');
      // Format data for Line chart
      const formattedData = (response.data || []).map(item => ({
        month: item._id || item.month,
        customers: item.customers || 0,
      }));
      setCustomerGrowthData(formattedData);
    } catch (err) {
      console.error('Error fetching customer growth data:', err);
      // Fallback to mock data if API fails
      setCustomerGrowthData([
        { month: 'Jan', customers: 120 },
        { month: 'Feb', customers: 145 },
        { month: 'Mar', customers: 178 },
        { month: 'Apr', customers: 165 },
        { month: 'May', customers: 192 },
        { month: 'Jun', customers: 210 },
      ]);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const response = await getAdminDiscounts();
      setDiscounts(response.data || []);
    } catch (err) {
      console.error('Error fetching discounts:', err);
    }
  };

  // User Management
  const handleBanUser = async userId => {
    Modal.confirm({
      title: 'Ban User',
      content: 'Are you sure you want to ban this user?',
      onOk: async () => {
        try {
          await banUser(userId);
          message.success('User banned successfully');
          fetchUsers(); // Refresh data
        } catch (err) {
          console.error('Error banning user:', err);
          message.error('Failed to ban user');
        }
      },
    });
  };

  const handleUnbanUser = async userId => {
    Modal.confirm({
      title: 'Unban User',
      content: 'Are you sure you want to unban this user?',
      onOk: async () => {
        try {
          await unbanUser(userId);
          message.success('User unbanned successfully');
          fetchUsers(); // Refresh data
        } catch (err) {
          console.error('Error unbanning user:', err);
          message.error('Failed to unban user');
        }
      },
    });
  };

  const handleDeleteProduct = async productId => {
    Modal.confirm({
      title: 'Delete Product',
      content: 'Are you sure you want to delete this product?',
      onOk: async () => {
        try {
          await deleteReportedProduct(productId);
          message.success('Product deleted successfully');
          fetchReportedProducts(); // Refresh data
        } catch (err) {
          console.error('Error deleting product:', err);
          message.error('Failed to delete product');
        }
      },
    });
  };

  const handleDeleteFeedback = async feedbackId => {
    Modal.confirm({
      title: 'Delete Feedback',
      content: 'Are you sure you want to delete this feedback? This action cannot be undone.',
      okText: 'Delete',
      cancelText: 'Cancel',
      okType: 'danger',
      onOk: async () => {
        try {
          console.log('Deleting feedback with ID:', feedbackId);
          console.log('Current feedback list before delete:', feedback);

          await deleteFeedback(feedbackId);
          message.success('Feedback deleted successfully');

          // Remove from local state immediately for better UX
          setFeedback(prev => {
            const filtered = prev.filter(item => item._id !== feedbackId);
            console.log('Feedback list after filtering:', filtered);
            return filtered;
          });
        } catch (err) {
          console.error('Error deleting feedback:', err);
          message.error(err.response?.data?.message || 'Failed to delete feedback');
          // Refresh data if local update fails
          fetchFeedback();
        }
      },
    });
  };

  // Discount Management
  const handleAddDiscount = async values => {
    try {
      // Validate ngày
      if (
        values.startDate &&
        values.endDate &&
        new Date(values.startDate) >= new Date(values.endDate)
      ) {
        message.error('End date must be after start date!');
        return;
      }
      // Validate value
      if (values.type === 'percentage' && values.value > 100) {
        message.error('Percentage discount cannot exceed 100%!');
        return;
      }
      // Chuyển đổi ngày sang ISO string và set status = 'active'
      const payload = {
        ...values,
        status: 'active', // Luôn active khi tạo mới
        startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
      };
      await createAdminDiscount(payload);
      message.success('Discount created successfully');
      setIsAddDiscountModalVisible(false);
      discountForm.resetFields();
      fetchDiscounts(); // Refresh data
    } catch (err) {
      console.error('Error creating discount:', err);
      message.error('Failed to create discount');
    }
  };

  const handleDeleteDiscount = async discountId => {
    Modal.confirm({
      title: 'Delete Discount',
      content: 'Are you sure you want to delete this discount?',
      onOk: async () => {
        try {
          await deleteDiscount(discountId);
          message.success('Discount deleted successfully');
          fetchDiscounts(); // Refresh data
        } catch (err) {
          console.error('Error deleting discount:', err);
          message.error('Failed to delete discount');
        }
      },
    });
  };

  // Table columns for other views
  const productColumns = [
    {
      title: 'Type',
      dataIndex: 'targetType',
      key: 'type',
      align: 'center',
      render: type => (
        <Tag
          color={type === 'product' ? 'blue' : type === 'review' ? 'orange' : 'default'}
          style={{ borderRadius: 8, fontWeight: 600, fontSize: 14, padding: '4px 16px' }}
        >
          {type === 'product' ? 'PRODUCT' : type === 'review' ? 'REVIEW' : type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Reporter',
      dataIndex: 'reporter',
      key: 'reporter',
      render: reporter => (reporter ? `${reporter.fullName} (${reporter.email})` : 'N/A'),
      align: 'center',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      align: 'center',
      render: text => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      align: 'center',
      render: text => (
        <span
          style={{ maxWidth: 320, display: 'inline-block', whiteSpace: 'pre-line', fontSize: 15 }}
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: status => (
        <Tag
          color={status === 'pending' ? 'orange' : status === 'resolved' ? 'green' : 'blue'}
          style={{ borderRadius: 8, fontWeight: 500 }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Button
          icon={<EditOutlined />}
          size="small"
          style={{
            fontWeight: 600,
            borderRadius: 8,
            background: '#f5f7fa',
            color: '#4A69E2',
            border: '1px solid #dbeafe',
          }}
          onClick={() => {
            setReplyReport(record);
            setReplyResolution('no_action');
            setReplyNote('');
            setReplyModalOpen(true);
          }}
          title="Reply to report"
        >
          Reply
        </Button>
      ),
    },
  ];

  const feedbackColumns = [
    {
      title: 'Customer',
      dataIndex: 'user',
      key: 'customer',
      render: user => (
        <div>
          <div style={{ fontWeight: 600, color: '#1890ff' }}>
            {user?.fullName || user?.name || 'N/A'}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>{user?.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      render: product => (
        <div>
          <div style={{ fontWeight: 600 }}>{product?.name || 'N/A'}</div>
          {product?.mainImage && (
            <img
              src={product.mainImage}
              alt={product.name}
              style={{
                width: 40,
                height: 40,
                objectFit: 'cover',
                borderRadius: 4,
                marginTop: 4,
              }}
            />
          )}
        </div>
      ),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      align: 'center',
      render: rating => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 4 }}>
            {[...Array(5)].map((_, i) => (
              <span key={i} style={{ color: i < rating ? '#faad14' : '#d9d9d9', fontSize: 16 }}>
                ★
              </span>
            ))}
          </div>
          <span style={{ fontSize: 12, color: '#666' }}>({rating})</span>
        </div>
      ),
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
      render: comment => (
        <div style={{ maxWidth: 300, wordBreak: 'break-word' }}>{comment || 'N/A'}</div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      align: 'center',
      render: date => (
        <span style={{ fontSize: 12 }}>
          {new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteFeedback(record._id)}
          style={{
            fontWeight: 600,
            borderRadius: 6,
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  // Discount columns (đồng bộ với model Discount)
  const discountColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: code => <span style={{ fontWeight: 600, color: '#1890ff' }}>{code}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type, record) => (
        <span>
          {type === 'percentage' ? `${record.value}%` : `₫${record.value.toLocaleString()}`}
        </span>
      ),
    },
    {
      title: 'Max Discount',
      dataIndex: 'maxDiscount',
      key: 'maxDiscount',
      render: value => (value ? `₫${value.toLocaleString()}` : '-'),
    },
    {
      title: 'Min Purchase',
      dataIndex: 'minPurchase',
      key: 'minPurchase',
      render: value => (value > 0 ? `₫${value.toLocaleString()}` : 'No minimum'),
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_, record) => (
        <span>
          {record.usedCount} / {record.usageLimit}
        </span>
      ),
    },
    {
      title: 'Per User',
      dataIndex: 'perUserLimit',
      key: 'perUserLimit',
      render: value => value || 1,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Tag
          color={status === 'active' ? 'green' : status === 'inactive' ? 'orange' : 'red'}
          style={{ borderRadius: 12 }}
        >
          {status?.toUpperCase() || 'UNKNOWN'}
        </Tag>
      ),
    },
    {
      title: 'Valid Period',
      key: 'validPeriod',
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          <div>From: {new Date(record.startDate).toLocaleDateString()}</div>
          <div>To: {new Date(record.endDate).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: desc => <span style={{ fontSize: 12 }}>{desc}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteDiscount(record._id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // Render different views based on currentView
  const renderView = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <div>
            {/* Statistics Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <Statistic
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ color: '#1890ff', fontSize: 24, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <Statistic
                    title="Total Revenue"
                    value={stats?.totalRevenue || 0}
                    prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a', fontSize: 24, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <Statistic
                    title="Total Orders"
                    value={stats?.totalOrders || 0}
                    prefix={<ShoppingOutlined style={{ color: '#722ed1' }} />}
                    valueStyle={{ color: '#722ed1', fontSize: 24, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <Statistic
                    title="Total Products"
                    value={stats?.totalProducts || 0}
                    prefix={<AppstoreOutlined style={{ color: '#faad14' }} />}
                    valueStyle={{ color: '#faad14', fontSize: 24, fontWeight: 600 }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Charts */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} lg={12}>
                <Card
                  title="Revenue Trend"
                  style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  <Line
                    data={revenueData}
                    xField="month"
                    yField="revenue"
                    smooth
                    point={{
                      size: 5,
                      shape: 'diamond',
                      style: {
                        fill: '#1890ff',
                        stroke: '#fff',
                        lineWidth: 2,
                      },
                    }}
                    lineStyle={{
                      stroke: '#1890ff',
                      lineWidth: 3,
                    }}
                    height={300}
                  />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card
                  title="User Growth"
                  style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  <Bar data={userGrowthData} xField="_id" yField="customers" height={300} />
                </Card>
              </Col>
            </Row>
          </div>
        );

      case 'users':
        return (
          <>
            <TabHeader breadcrumb="User Management" />
            <TableUsers title="All Users" users={users} onReload={fetchUsers} />
          </>
        );

      case 'categories':
        return (
          <>
            <TabHeader breadcrumb="Category Management" />
            <TableCategories
              title="All Categories"
              categories={categories}
              onReload={fetchCategories}
            />
          </>
        );

      case 'moderation':
        return (
          <>
            <TabHeader breadcrumb="Moderation Management" />
            <Card
              title={<div style={{ fontSize: 20, fontWeight: 600 }}>Moderation Management</div>}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <Table
                columns={productColumns}
                dataSource={reportedProducts}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </>
        );

      case 'financial':
        if (financialLoading) {
          return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16, color: '#666' }}>Loading Financial Reports...</div>
            </div>
          );
        }

        return (
          <div>
            <TabHeader breadcrumb="Financial Reports" />
            <Card
              title={<div style={{ fontSize: 20, fontWeight: 600 }}>Financial Reports</div>}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card
                    title="Monthly Revenue"
                    size="small"
                    style={{ borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  >
                    <Line
                      data={revenueData}
                      xField="month"
                      yField="revenue"
                      smooth
                      point={{
                        size: 5,
                        shape: 'diamond',
                        style: {
                          fill: '#1890ff',
                          stroke: '#fff',
                          lineWidth: 2,
                        },
                      }}
                      lineStyle={{
                        stroke: '#1890ff',
                        lineWidth: 3,
                      }}
                      height={250}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card
                    title="Orders per Month"
                    size="small"
                    style={{ borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  >
                    <Bar
                      data={ordersData}
                      xField="month"
                      yField="orders"
                      color="#52c41a"
                      height={250}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                  <Card
                    title="Top 5 Best-Selling Products"
                    size="small"
                    style={{ borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  >
                    <Bar
                      data={topProductsData}
                      xField="sales"
                      yField="productName"
                      color="#722ed1"
                      height={250}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card
                    title="Revenue by Shop"
                    size="small"
                    style={{ borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  >
                    <Bar
                      data={shopRevenueData}
                      xField="revenue"
                      yField="shopName"
                      color="#faad14"
                      height={250}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24}>
                  <Card
                    title="Customer Growth Trend"
                    size="small"
                    style={{ borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  >
                    <Line
                      data={customerGrowthData}
                      xField="month"
                      yField="customers"
                      smooth
                      point={{
                        size: 5,
                        shape: 'diamond',
                        style: {
                          fill: '#f5222d',
                          stroke: '#fff',
                          lineWidth: 2,
                        },
                      }}
                      lineStyle={{
                        stroke: '#f5222d',
                        lineWidth: 3,
                      }}
                      height={250}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>
          </div>
        );

      case 'feedback':
        return (
          <>
            <TabHeader breadcrumb="Feedback Management" />
            <Card
              title={<div style={{ fontSize: 20, fontWeight: 600 }}>Feedback Management</div>}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <Table
                columns={feedbackColumns}
                dataSource={feedback}
                rowKey="_id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} feedback`,
                  pageSizeOptions: ['10', '20', '50'],
                }}
                loading={loading}
                scroll={{ x: 'max-content' }}
              />
            </Card>
          </>
        );

      case 'discounts':
        return (
          <>
            <TabHeader breadcrumb="Discount Management" />
            <Card
              title={<div style={{ fontSize: 20, fontWeight: 600 }}>Manage Discounts</div>}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              extra={
                <Button
                  type="default"
                  icon={<PlusOutlined />}
                  size="large"
                  onClick={() => setIsAddDiscountModalVisible(true)}
                  style={{ borderRadius: 8 }}
                >
                  Create New Discount
                </Button>
              }
            >
              <Table
                columns={discountColumns}
                dataSource={discounts}
                rowKey="_id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} discounts`,
                }}
                style={{ borderRadius: 8 }}
              />
            </Card>
          </>
        );

      default:
        return <div>Page not found</div>;
    }
  };

  const handleDisableProduct = async productId => {
    Modal.confirm({
      title: 'Ẩn sản phẩm',
      content: 'Bạn có chắc muốn ẩn sản phẩm này không?',
      onOk: async () => {
        try {
          await axiosInstance.put(`/products/${productId}`, { status: false });
          message.success('Đã ẩn sản phẩm');
          fetchReportedProducts();
        } catch (err) {
          message.error('Ẩn sản phẩm thất bại');
        }
      },
    });
  };

  const handleIgnoreReport = async reportId => {
    Modal.confirm({
      title: 'Bỏ qua báo cáo',
      content: 'Bạn có chắc muốn bỏ qua báo cáo này không?',
      onOk: async () => {
        try {
          await axiosInstance.put(`/dashboard/admin/reports/${reportId}/ignore`);
          message.success('Đã bỏ qua báo cáo');
          fetchReportedProducts();
        } catch (err) {
          message.error('Bỏ qua báo cáo thất bại');
        }
      },
    });
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {renderView()}
      {/* Modal reply admin */}
      <Modal
        open={replyModalOpen}
        onCancel={() => setReplyModalOpen(false)}
        title={
          <span style={{ fontWeight: 700, fontSize: 20 }}>
            {replyReport?.status === 'pending' ? 'Reply to Report' : 'Admin Resolution'}
          </span>
        }
        okText={replyReport?.status === 'pending' ? 'Submit' : 'Close'}
        cancelText="Cancel"
        onOk={async () => {
          if (replyReport?.status !== 'pending') {
            setReplyModalOpen(false);
            return;
          }
          setReplyLoading(true);
          try {
            await axiosInstance.put(`/dashboard/admin/reports/${replyReport._id}/resolve`, {
              resolution: replyResolution,
              adminNote: replyNote,
            });
            message.success('Report resolved!');
            setReplyModalOpen(false);
            fetchReportedProducts();
          } catch (err) {
            message.error('Failed to resolve report');
          } finally {
            setReplyLoading(false);
          }
        }}
        confirmLoading={replyLoading}
        footer={replyReport?.status === 'pending' ? undefined : null}
        bodyStyle={{ padding: 24 }}
        style={{ borderRadius: 16 }}
      >
        {replyReport && replyReport.status === 'pending' ? (
          <div style={{ lineHeight: 2 }}>
            <div style={{ marginBottom: 16 }}>
              <b>Resolution:</b>
              <select
                value={replyResolution}
                onChange={e => setReplyResolution(e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  marginTop: 6,
                  borderRadius: 8,
                  border: '1px solid #dbeafe',
                  fontSize: 15,
                }}
              >
                <option value="no_action">No Action</option>
                <option value="warning">Warning</option>
                {replyReport?.targetType === 'product' && (
                  <option value="delete_product">Delete Product</option>
                )}
                {replyReport?.targetType === 'review' && (
                  <option value="delete_comment">Delete Comment</option>
                )}
              </select>
            </div>
            <div>
              <b>Admin Note:</b>
              <textarea
                value={replyNote}
                onChange={e => setReplyNote(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: 8,
                  marginTop: 6,
                  borderRadius: 8,
                  border: '1px solid #dbeafe',
                  fontSize: 15,
                }}
                placeholder="Enter admin note..."
              />
            </div>
          </div>
        ) : replyReport ? (
          <div style={{ lineHeight: 2 }}>
            <div>
              <b>Resolution:</b>{' '}
              {replyReport.resolution === 'no_action'
                ? 'No Action'
                : replyReport.resolution === 'warning'
                  ? 'Warning'
                  : replyReport.resolution === 'delete_product'
                    ? 'Delete Product'
                    : replyReport.resolution === 'delete_comment'
                      ? 'Delete Comment'
                      : replyReport.resolution || 'N/A'}
            </div>
            <div>
              <b>Admin Note:</b> {replyReport.adminNote || 'N/A'}
            </div>
            <div>
              <b>Resolved By:</b>{' '}
              {replyReport.resolvedBy
                ? replyReport.resolvedBy.fullName ||
                  replyReport.resolvedBy.email ||
                  replyReport.resolvedBy
                : 'N/A'}
            </div>
            <div>
              <b>Resolved At:</b>{' '}
              {replyReport.resolvedAt ? new Date(replyReport.resolvedAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Add Discount Modal */}
      <Modal
        title="Create New Discount"
        open={isAddDiscountModalVisible}
        onCancel={() => {
          setIsAddDiscountModalVisible(false);
          discountForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={discountForm}
          layout="vertical"
          onFinish={handleAddDiscount}
          initialValues={{
            type: 'percentage',
            status: 'active',
            usageLimit: 100,
            minPurchase: 0,
            perUserLimit: 1,
          }}
        >
          <Form.Item
            name="code"
            label="Discount Code"
            rules={[{ required: true, message: 'Please enter discount code!' }]}
          >
            <Input placeholder="e.g., SUMMER20" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description!' }]}
          >
            <TextArea rows={2} placeholder="Discount description" />
          </Form.Item>
          <Form.Item
            name="type"
            label="Discount Type"
            rules={[{ required: true, message: 'Please select discount type!' }]}
          >
            <Select
              onChange={value => {
                // Reset value when type changes
                discountForm.setFieldsValue({ value: undefined });
              }}
            >
              <Option value="percentage">Percentage (%)</Option>
              <Option value="fixed">Fixed Amount (VND)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              return (
                <Form.Item
                  name="value"
                  label={`Discount Value ${type === 'percentage' ? '(%)' : '(VND)'}`}
                  rules={[
                    { required: true, message: 'Please enter discount value!' },
                    { type: 'number', min: 0, message: 'Value must be at least 0!' },
                    {
                      validator: (_, value) => {
                        if (type === 'percentage' && value > 100) {
                          return Promise.reject(
                            new Error('Percentage discount cannot exceed 100%')
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    max={type === 'percentage' ? 100 : undefined}
                    placeholder={type === 'percentage' ? '20' : '50000'}
                    formatter={value => {
                      if (!value) return '';
                      return type === 'percentage' ? `${value}%` : `₫${value.toLocaleString()}`;
                    }}
                    parser={value => value.replace(/[^\d]/g, '')}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              return type === 'percentage' ? (
                <Form.Item name="maxDiscount" label="Maximum Discount Amount (Optional)">
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="Maximum discount amount"
                    formatter={value => `₫${value.toLocaleString()}`}
                    parser={value => value.replace(/[^\d]/g, '')}
                  />
                </Form.Item>
              ) : null;
            }}
          </Form.Item>
          <Form.Item
            name="minPurchase"
            label="Minimum Purchase Amount"
            rules={[
              { required: true, message: 'Please enter minimum purchase amount!' },
              { type: 'number', min: 0, message: 'Minimum purchase must be at least 0!' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="0"
              formatter={value => `₫${value.toLocaleString()}`}
              parser={value => value.replace(/[^\d]/g, '')}
            />
          </Form.Item>
          <Form.Item
            name="usageLimit"
            label="Usage Limit"
            rules={[
              { required: true, message: 'Please enter usage limit!' },
              { type: 'number', min: 1, message: 'Usage limit must be at least 1!' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="100" />
          </Form.Item>
          <Form.Item
            name="perUserLimit"
            label="Per User Limit"
            rules={[
              { required: true, message: 'Please enter per user limit!' },
              { type: 'number', min: 1, message: 'Per user limit must be at least 1!' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="1" />
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[
              { required: true, message: 'Please select start date!' },
              {
                validator: (_, value) => {
                  if (value && value.isBefore(new Date(), 'day')) {
                    return Promise.reject(new Error('Start date cannot be in the past!'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="DD/MM/YYYY"
              disabledDate={current => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return current && current.isBefore(today, 'day');
              }}
            />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="End Date"
            rules={[
              { required: true, message: 'Please select end date!' },
              ({ getFieldValue }) => ({
                validator: (_, value) => {
                  const startDate = getFieldValue('startDate');
                  if (value && startDate) {
                    const start = startDate.toDate();
                    const end = value.toDate();
                    if (end <= start) {
                      return Promise.reject(new Error('End date must be after start date!'));
                    }
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="DD/MM/YYYY"
              disabledDate={current => {
                const startDate = discountForm.getFieldValue('startDate');
                if (!startDate) return false;
                return current && current.isBefore(startDate, 'day');
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Discount
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
