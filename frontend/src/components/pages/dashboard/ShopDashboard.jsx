import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { formatPrice } from '../../../utils/StringFormat';
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
  InputNumber,
  Form,
  Upload,
  Image,
  Select,
  Progress,
  Avatar,
  List,
  Divider,
  Spin,
  Alert,
  DatePicker,
} from 'antd';
import {
  ShoppingOutlined,
  DollarOutlined,
  UserOutlined,
  StarOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CarOutlined,
  ShopOutlined,
  TagsOutlined,
  SettingOutlined,
  EyeOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Line, Bar, Pie } from '@ant-design/charts';
import AllProducts from './AllProducts';
import {
  getShopStats,
  getShopOrders,
  getShopFeedback,
  getShopDiscounts,
  getShopSalesData,
  updateOrderStatus,
  createDiscount,
  deleteDiscount,
} from '../../../services/dashboardService';
import axiosInstance from '../../../services/axiosInstance';
import { formatCompactVND, formatVND } from '../../../utils/currency';
import ChatPage from '../../common/components/ChatPage';
import { MessageOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';

const { Search } = Input;
const { TextArea } = Input;
const { Option } = Select;

export default function ShopDashboard() {
  const location = useLocation();
  const { user } = useAuth();

  // State for real data
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI State
  const [searchText, setSearchText] = useState('');
  const [isAddDiscountModalVisible, setIsAddDiscountModalVisible] = useState(false);
  const [isEditStoreModalVisible, setIsEditStoreModalVisible] = useState(false);
  const [discountForm] = Form.useForm();
  const [storeForm] = Form.useForm();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportFeedbackId, setReportFeedbackId] = useState(null);
  const [reportReason, setReportReason] = useState('inappropriate_content');
  const [reportDescription, setReportDescription] = useState('');
  const [reportEvidence, setReportEvidence] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Determine current view from URL path
  const getCurrentView = () => {
    const path = location.pathname;
    if (path === '/shop' || path === '/shop/dashboard') return 'dashboard';
    if (path === '/shop/products') return 'products';
    if (path === '/shop/orders') return 'orders';
    if (path === '/shop/feedback') return 'feedback';
    if (path === '/shop/discounts') return 'discounts';
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
          await Promise.all([
            fetchStats(),
            fetchSalesData(),
            fetchRecentOrders(),
            fetchRecentFeedback(),
          ]);
          break;
        case 'orders':
          await fetchOrders();
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
      const response = await getShopStats();
      console.log('Shop stats response:', response);

      // Transform the data to match the expected structure
      const transformedStats = {
        totalRevenue: {
          value: response.data.totalRevenue || 0,
          change: response.data.totalRevenueChange || 0,
        },
        totalOrders: {
          value: response.data.totalOrders || 0,
          change: 0, // TODO: Calculate order change if needed
        },
        totalCustomers: {
          value: response.data.totalCustomers || 0,
          change: 0, // TODO: Calculate customer change if needed
        },
        averageRating: {
          value: response.data.averageRating || 0,
        },
        totalProducts: {
          value: response.data.totalProducts || 0,
        },
        newOrdersToday: response.data.newOrdersToday || 0,
        newCustomersToday: response.data.newCustomersToday || 0,
        totalReviews: response.data.totalReviews || 0,
        orderStatusDistribution: response.data.orderStatusDistribution || [],
        topProducts: response.data.topProducts || [],
        storeInfo: response.data.storeInfo || {},
      };

      setStats(transformedStats);
      console.log('Order Status Distribution:', transformedStats.orderStatusDistribution);
      console.log('Top Products:', transformedStats.topProducts);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchSalesData = async () => {
    try {
      const response = await getShopSalesData('monthly');
      console.log('Sales data response:', response);

      // Transform sales data to match chart format
      const transformedSalesData = (response.data || []).map(item => ({
        month: item._id,
        sales: item.totalSales || 0,
        orders: item.orderCount || 0,
      }));

      setSalesData(transformedSalesData);
    } catch (err) {
      console.error('Error fetching sales data:', err);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await getShopOrders(1, 5);
      console.log('Recent orders response:', response);
      setOrders(response.data?.orders || []);
    } catch (err) {
      console.error('Error fetching recent orders:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await getShopOrders(1, 10);
      console.log('Orders response:', response);
      setOrders(response.data?.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchRecentFeedback = async () => {
    try {
      const response = await getShopFeedback(1, 5);
      console.log('Recent feedback response:', response);
      setFeedback(response.data?.feedback || []);
    } catch (err) {
      console.error('Error fetching recent feedback:', err);
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await getShopFeedback(1, 10);
      console.log('Feedback response:', response);
      setFeedback(response.data?.feedback || []);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const response = await getShopDiscounts();
      console.log('Discounts response:', response);
      console.log('Discounts data:', response.data);
      if (response.data && response.data.length > 0) {
        console.log('First discount:', response.data[0]);
      }
      setDiscounts(response.data || []);
    } catch (err) {
      console.error('Error fetching discounts:', err);
    }
  };

  // Function to format large numbers with abbreviations
  const formatNumber = num => {
    return formatCompactVND(num, { showSymbol: false });
  };

  // Order Management
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      message.success(`Order status updated to ${newStatus}`);
      fetchOrders(); // Refresh data
    } catch (err) {
      console.error('Error updating order status:', err);
      message.error('Failed to update order status');
    }
  };

  const handleConfirmOrder = orderId => {
    handleUpdateOrderStatus(orderId, 'processing');
  };

  const handleViewOrderDetails = order => {
    // Navigate to order details page
    window.location.href = `/shop/orders/${order._id}`;
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
      await createDiscount(payload);
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

  // Table columns
  const orderColumns = [
    {
      title: 'Customer',
      dataIndex: 'user',
      key: 'customer',
      render: user => (
        <Space>
          <Avatar size="small">{user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{user?.fullName || user?.email || 'Unknown'}</div>
            <div style={{ color: '#666', fontSize: 12 }}>{user?.email || 'N/A'}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Order',
      dataIndex: 'orderNumber',
      key: 'order',
      render: orderNumber => <span style={{ fontWeight: 500 }}>{orderNumber || 'N/A'}</span>,
    },
    {
      title: 'Amount',
      dataIndex: 'totalPrice',
      key: 'amount',
      render: amount => (
        <span style={{ fontWeight: 600, color: '#52c41a' }}>{formatPrice(amount || 0)}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        const statusConfig = {
          pending: { color: 'orange', icon: <ClockCircleOutlined /> },
          processing: { color: 'blue', icon: <CheckCircleOutlined /> },
          shipped: { color: 'purple', icon: <CarOutlined /> },
          delivered: { color: 'green', icon: <CheckCircleOutlined /> },
          cancelled: { color: 'red', icon: <DeleteOutlined /> },
        };
        const config = statusConfig[status] || { color: 'default', icon: null };
        return (
          <Tag color={config.color} icon={config.icon} style={{ borderRadius: 12 }}>
            {status?.toUpperCase() || 'UNKNOWN'}
          </Tag>
        );
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: date => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="default"
            icon={<EyeOutlined />}
            onClick={() => handleViewOrderDetails(record)}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleConfirmOrder(record._id)}
            >
              Confirm
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const feedbackColumns = [
    {
      title: 'Customer',
      dataIndex: 'user',
      key: 'customer',
      render: user => (
        <Space>
          <Avatar size="small">{user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{user?.fullName || user?.email || 'Unknown'}</div>
            <div style={{ color: '#666', fontSize: 12 }}>{user?.email || 'N/A'}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      render: product => <span style={{ fontWeight: 500 }}>{product?.name || 'N/A'}</span>,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: rating => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[...Array(5)].map((_, i) => (
            <StarOutlined key={i} style={{ color: i < rating ? '#faad14' : '#d9d9d9' }} />
          ))}
          <span style={{ marginLeft: 4 }}>({rating})</span>
        </div>
      ),
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
      render: comment => (
        <div
          style={{
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {comment || 'No comment'}
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: date => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
            onClick={() => {
              setReportFeedbackId(record._id);
              setReportModalOpen(true);
            }}
            title="Report feedback"
          >
            Report
          </Button>
        </Space>
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
        <span>{type === 'percentage' ? `${record.value}%` : formatVND(record.value)}</span>
      ),
    },
    {
      title: 'Max Discount',
      dataIndex: 'maxDiscount',
      key: 'maxDiscount',
      render: value => (value ? formatVND(value) : '-'),
    },
    {
      title: 'Min Purchase',
      dataIndex: 'minPurchase',
      key: 'minPurchase',
      render: value => (value > 0 ? formatVND(value) : 'No minimum'),
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
                    title="Total Revenue"
                    value={formatCompactVND(stats?.totalRevenue?.value || 0)}
                    valueStyle={{
                      color: '#52c41a',
                      fontSize: 24,
                      fontWeight: 600,
                    }}
                    suffix={
                      <span style={{ fontSize: 14, color: '#52c41a' }}>
                        <RiseOutlined /> +
                        {Math.round((stats?.totalRevenue?.change || 0) * 100) / 100}%
                      </span>
                    }
                  />
                  <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
                    Compared to last month
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <Statistic
                    title="Total Orders"
                    value={stats?.totalOrders?.value || 0}
                    prefix={<ShoppingOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ color: '#1890ff', fontSize: 24, fontWeight: 600 }}
                    suffix={
                      <span style={{ fontSize: 14, color: '#1890ff' }}>
                        <RiseOutlined /> +
                        {Math.round((stats?.totalOrders?.change || 0) * 100) / 100}%
                      </span>
                    }
                  />
                  <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
                    +{stats?.newOrdersToday || 0} new orders today
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <Statistic
                    title="Total Products"
                    value={stats?.totalProducts?.value || 0}
                    prefix={<TagsOutlined style={{ color: '#722ed1' }} />}
                    valueStyle={{ color: '#722ed1', fontSize: 24, fontWeight: 600 }}
                    suffix={
                      <span style={{ fontSize: 14, color: '#722ed1' }}>
                        <RiseOutlined /> +
                        {Math.round((stats?.totalProducts?.change || 0) * 100) / 100}%
                      </span>
                    }
                  />
                  <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
                    Active products in store
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <Statistic
                    title="Average Rating"
                    value={stats?.averageRating?.value || 0}
                    prefix={<StarOutlined style={{ color: '#faad14' }} />}
                    valueStyle={{ color: '#faad14', fontSize: 24, fontWeight: 600 }}
                    suffix="/ 5"
                  />
                  <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
                    Based on {stats?.totalReviews || 0} reviews
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Charts */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} lg={16}>
                <Card
                  title="Sales Trend"
                  style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  <Line
                    data={salesData}
                    xField="month"
                    yField="sales"
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
                    areaStyle={{
                      fill: 'l(270) 0:#1890ff 1:#fff',
                    }}
                    height={300}
                  />
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card
                  title="Order Status Distribution"
                  style={{
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    minHeight: '300px',
                  }}
                >
                  {stats?.orderStatusDistribution && stats.orderStatusDistribution.length > 0 ? (
                    <Pie
                      data={stats.orderStatusDistribution}
                      angleField="value"
                      colorField="name"
                      radius={0.7}
                      height={300}
                      color={['#1890ff', '#52c41a', '#faad14', '#f5222d']}
                      label={{
                        type: 'inner',
                        offset: '-30%',
                        content: '{percentage}',
                        style: {
                          fontSize: 16,
                          fontWeight: 600,
                          textAlign: 'center',
                        },
                      }}
                      legend={{
                        position: 'bottom',
                        itemWidth: 120,
                      }}
                      interactions={[
                        {
                          type: 'element-active',
                        },
                      ]}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
                      No order data available
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            {/* Recent Orders and Top Products */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <Card
                  title="Recent Orders"
                  style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  extra={
                    <Button type="link" onClick={() => (window.location.href = '/shop/orders')}>
                      View All
                    </Button>
                  }
                >
                  <Table
                    columns={orderColumns.slice(0, -1)} // Remove Actions column for dashboard
                    dataSource={orders}
                    rowKey="_id"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card
                  title="Top Selling Products"
                  style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  {stats?.topProducts && stats.topProducts.length > 0 ? (
                    <List
                      dataSource={stats.topProducts}
                      renderItem={item => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <Image
                                width={40}
                                height={40}
                                src={item.mainImage || '/placeholder.svg'}
                                alt={item.name}
                                style={{ borderRadius: 8 }}
                              />
                            }
                            title={<div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>}
                            description={
                              <div>
                                <div style={{ color: '#666', fontSize: 12 }}>{item.category}</div>
                                <div style={{ color: '#1890ff', fontWeight: 600 }}>
                                  {formatPrice(item.price?.regular || 0)} • {item.sales || 0} sold
                                </div>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      <div style={{ marginBottom: '10px' }}>No product data available</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        Debug: {stats?.topProducts?.length || 0} products found
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        );

      case 'products':
        return <AllProducts />;

      case 'orders':
        return (
          <Card
            title={<div style={{ fontSize: 20, fontWeight: 600 }}>Order Management</div>}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            <div style={{ marginBottom: 16 }}>
              <Search
                placeholder="Search orders by customer name, order number..."
                allowClear
                size="large"
                style={{ width: 400 }}
                onChange={e => setSearchText(e.target.value)}
              />
            </div>

            <Table
              columns={orderColumns}
              dataSource={orders.filter(
                order =>
                  order.user?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                  order.user?.email?.toLowerCase().includes(searchText.toLowerCase()) ||
                  order.orderNumber?.toLowerCase().includes(searchText.toLowerCase())
              )}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
              }}
              style={{ borderRadius: 8 }}
            />
          </Card>
        );

      case 'feedback':
        return (
          <Card
            title={<div style={{ fontSize: 20, fontWeight: 600 }}>Customer Feedback</div>}
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
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} reviews`,
              }}
              style={{ borderRadius: 8 }}
            />
          </Card>
        );

      case 'discounts':
        return (
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
        );

      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div
      style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh', position: 'relative' }}
    >
      {/* Nút mở chat nổi ở góc phải */}
      <Button
        type="primary"
        shape="circle"
        icon={<MessageOutlined />}
        size="large"
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1001,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
        onClick={() => setChatOpen(true)}
      />
      {/* Popup chat */}
      {chatOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 90,
            right: 32,
            width: 400,
            height: 600,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            zIndex: 1002,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: 8,
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 16 }}>Shop Chat</span>
            <Button type="text" onClick={() => setChatOpen(false)}>
              Đóng
            </Button>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ChatPage role="shop" shopId={user?._id} />
          </div>
        </div>
      )}
      {renderView()}

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
                      return type === 'percentage' ? `${value}%` : formatVND(value);
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
                    formatter={value => formatVND(value)}
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
              formatter={value => formatVND(value)}
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

      {/* Modal báo cáo feedback */}
      <Modal
        title="Report Feedback Violation"
        open={reportModalOpen}
        onCancel={() => setReportModalOpen(false)}
        onOk={async () => {
          if (!reportReason || !reportDescription) {
            message.error('Please select a reason and enter a description');
            return;
          }
          setReportLoading(true);
          try {
            await axiosInstance.post(`/feedback/${reportFeedbackId}/report`, {
              reason: reportReason,
              description: reportDescription,
              evidence: reportEvidence ? [reportEvidence] : [],
            });
            message.success('Feedback reported successfully!');
            setReportModalOpen(false);
            setReportDescription('');
            setReportEvidence('');
          } catch (err) {
            message.error(err.response?.data?.message || 'Report failed');
          } finally {
            setReportLoading(false);
          }
        }}
        confirmLoading={reportLoading}
        okText="Submit report"
        cancelText="Cancel"
      >
        <div style={{ marginBottom: 12 }}>
          <label>Reason:</label>
          <select
            value={reportReason}
            onChange={e => setReportReason(e.target.value)}
            style={{ width: '100%', padding: 6, marginTop: 4 }}
          >
            <option value="inappropriate_content">Inappropriate Content</option>
            <option value="harassment">Harassment</option>
            <option value="spam">Spam</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Description:</label>
          <textarea
            value={reportDescription}
            onChange={e => setReportDescription(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: 6, marginTop: 4 }}
            placeholder="Enter details about the violation..."
          />
        </div>
        <div>
          <label>Evidence (image/video link, if any):</label>
          <input
            value={reportEvidence}
            onChange={e => setReportEvidence(e.target.value)}
            style={{ width: '100%', padding: 6, marginTop: 4 }}
            placeholder="Paste evidence link (optional)"
          />
        </div>
      </Modal>
    </div>
  );
}
