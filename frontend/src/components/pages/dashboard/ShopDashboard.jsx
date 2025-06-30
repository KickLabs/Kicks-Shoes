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

const { Search } = Input;
const { TextArea } = Input;
const { Option } = Select;

export default function ShopDashboard() {
  const location = useLocation();

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

  // Determine current view from URL path
  const getCurrentView = () => {
    const path = location.pathname;
    if (path === '/shop' || path === '/shop/dashboard') return 'dashboard';
    if (path === '/shop/products') return 'products';
    if (path === '/shop/orders') return 'orders';
    if (path === '/shop/feedback') return 'feedback';
    if (path === '/shop/discounts') return 'discounts';
    if (path === '/shop/settings') return 'settings';
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
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchSalesData = async () => {
    try {
      const response = await getShopSalesData('monthly');
      setSalesData(response.data || []);
    } catch (err) {
      console.error('Error fetching sales data:', err);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await getShopOrders(1, 5);
      setOrders(response.data?.orders || []);
    } catch (err) {
      console.error('Error fetching recent orders:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await getShopOrders(1, 10);
      setOrders(response.data?.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchRecentFeedback = async () => {
    try {
      const response = await getShopFeedback(1, 5);
      setFeedback(response.data?.feedback || []);
    } catch (err) {
      console.error('Error fetching recent feedback:', err);
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await getShopFeedback(1, 10);
      setFeedback(response.data?.feedback || []);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const response = await getShopDiscounts();
      setDiscounts(response.data?.discounts || []);
    } catch (err) {
      console.error('Error fetching discounts:', err);
    }
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
      await createDiscount(values);
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

  // Store Settings
  const handleUpdateStoreInfo = values => {
    message.success('Store information updated successfully');
    setIsEditStoreModalVisible(false);
  };

  // Table columns
  const orderColumns = [
    {
      title: 'Customer',
      dataIndex: 'user',
      key: 'customer',
      render: user => (
        <Space>
          <Avatar size="small">{user?.fullName?.charAt(0) || 'U'}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{user?.fullName || 'Unknown'}</div>
            <div style={{ color: '#666', fontSize: 12 }}>{user?.email || 'N/A'}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Order',
      dataIndex: 'orderNumber',
      key: 'order',
      render: orderNumber => <span style={{ fontWeight: 500 }}>{orderNumber}</span>,
    },
    {
      title: 'Amount',
      dataIndex: 'totalPrice',
      key: 'amount',
      render: amount => (
        <span style={{ fontWeight: 600, color: '#52c41a' }}>${amount?.toFixed(2) || '0.00'}</span>
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
          <Avatar size="small">{user?.fullName?.charAt(0) || 'U'}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{user?.fullName || 'Unknown'}</div>
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
  ];

  const discountColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: code => <span style={{ fontWeight: 600, color: '#1890ff' }}>{code}</span>,
    },
    {
      title: 'Discount',
      dataIndex: 'discountPercent',
      key: 'discount',
      render: percent => <span style={{ fontWeight: 600, color: '#52c41a' }}>{percent}%</span>,
    },
    {
      title: 'Valid Until',
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: date => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Usage',
      dataIndex: 'usage',
      key: 'usage',
      render: (usage, record) => `${usage || 0}/${record.maxUsage || 100}`,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      render: isActive => (
        <Tag color={isActive ? 'green' : 'red'} style={{ borderRadius: 12 }}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />}>
            Edit
          </Button>
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
                    value={stats?.totalRevenue?.value || 0}
                    prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a', fontSize: 24, fontWeight: 600 }}
                    suffix={
                      <span style={{ fontSize: 14, color: '#52c41a' }}>
                        <RiseOutlined /> +{stats?.totalRevenue?.change || 0}%
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
                        <RiseOutlined /> +{stats?.totalOrders?.change || 0}%
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
                    title="Total Customers"
                    value={stats?.totalCustomers?.value || 0}
                    prefix={<UserOutlined style={{ color: '#722ed1' }} />}
                    valueStyle={{ color: '#722ed1', fontSize: 24, fontWeight: 600 }}
                    suffix={
                      <span style={{ fontSize: 14, color: '#722ed1' }}>
                        <RiseOutlined /> +{stats?.totalCustomers?.change || 0}%
                      </span>
                    }
                  />
                  <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
                    +{stats?.newCustomersToday || 0} new customers today
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
                  style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  <Pie
                    data={stats?.orderStatusDistribution || []}
                    angleField="value"
                    colorField="status"
                    radius={0.8}
                    height={300}
                    label={{
                      type: 'outer',
                      content: '{name} {percentage}',
                    }}
                    interactions={[
                      {
                        type: 'element-active',
                      },
                    ]}
                  />
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
                  <List
                    dataSource={stats?.topProducts || []}
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
                                ${item.price?.regular?.toFixed(2) || '0.00'} • {item.sales || 0}{' '}
                                sold
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
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
                  order.user?.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
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
                type="primary"
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

      case 'settings':
        return (
          <Card
            title={<div style={{ fontSize: 20, fontWeight: 600 }}>Store Settings</div>}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            extra={
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="large"
                onClick={() => setIsEditStoreModalVisible(true)}
                style={{ borderRadius: 8 }}
              >
                Edit Store Info
              </Button>
            }
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card title="Store Information" size="small" style={{ borderRadius: 8 }}>
                  <div style={{ lineHeight: 2 }}>
                    <div>
                      <strong>Store Name:</strong> {stats?.storeInfo?.name || 'Sports Store'}
                    </div>
                    <div>
                      <strong>Description:</strong>{' '}
                      {stats?.storeInfo?.description || 'Premium sports shoes and athletic wear'}
                    </div>
                    <div>
                      <strong>Address:</strong>{' '}
                      {stats?.storeInfo?.address || '123 Main St, City, State'}
                    </div>
                    <div>
                      <strong>Phone:</strong> {stats?.storeInfo?.phone || '(555) 123-4567'}
                    </div>
                    <div>
                      <strong>Email:</strong> {stats?.storeInfo?.email || 'contact@sportsstore.com'}
                    </div>
                    <div>
                      <strong>Website:</strong> {stats?.storeInfo?.website || 'www.sportsstore.com'}
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Store Statistics" size="small" style={{ borderRadius: 8 }}>
                  <div style={{ textAlign: 'center' }}>
                    <Row gutter={[16, 16]}>
                      <Col span={8}>
                        <div style={{ fontSize: '2em', color: '#1890ff' }}>
                          <ShoppingOutlined />
                        </div>
                        <div style={{ fontSize: '1.5em', fontWeight: 600 }}>
                          {stats?.totalProducts?.value || 0}
                        </div>
                        <div style={{ color: '#666' }}>Products</div>
                      </Col>
                      <Col span={8}>
                        <div style={{ fontSize: '2em', color: '#52c41a' }}>
                          <DollarOutlined />
                        </div>
                        <div style={{ fontSize: '1.5em', fontWeight: 600 }}>
                          ${stats?.totalRevenue?.value?.toLocaleString() || 0}
                        </div>
                        <div style={{ color: '#666' }}>Revenue</div>
                      </Col>
                      <Col span={8}>
                        <div style={{ fontSize: '2em', color: '#722ed1' }}>
                          <UserOutlined />
                        </div>
                        <div style={{ fontSize: '1.5em', fontWeight: 600 }}>
                          {stats?.totalOrders?.value || 0}
                        </div>
                        <div style={{ color: '#666' }}>Orders</div>
                      </Col>
                    </Row>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        );

      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
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
        width={600}
      >
        <Form form={discountForm} layout="vertical" onFinish={handleAddDiscount}>
          <Form.Item
            name="code"
            label="Discount Code"
            rules={[{ required: true, message: 'Please enter discount code!' }]}
          >
            <Input placeholder="e.g., SUMMER20" />
          </Form.Item>
          <Form.Item
            name="discountPercent"
            label="Discount Percentage"
            rules={[{ required: true, message: 'Please enter discount percentage!' }]}
          >
            <InputNumber
              min={1}
              max={100}
              placeholder="20"
              style={{ width: '100%' }}
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
            />
          </Form.Item>
          <Form.Item
            name="maxUsage"
            label="Maximum Usage"
            rules={[{ required: true, message: 'Please enter maximum usage!' }]}
          >
            <InputNumber min={1} placeholder="100" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="validUntil"
            label="Valid Until"
            rules={[{ required: true, message: 'Please select valid until date!' }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Discount
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Store Modal */}
      <Modal
        title="Edit Store Information"
        open={isEditStoreModalVisible}
        onCancel={() => setIsEditStoreModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={storeForm} layout="vertical" onFinish={handleUpdateStoreInfo}>
          <Form.Item
            name="name"
            label="Store Name"
            rules={[{ required: true, message: 'Please enter store name!' }]}
          >
            <Input placeholder="Store Name" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description!' }]}
          >
            <TextArea rows={3} placeholder="Store description" />
          </Form.Item>
          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter address!' }]}
          >
            <Input placeholder="Store address" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: 'Please enter phone number!' }]}
          >
            <Input placeholder="Phone number" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Please enter email!' }]}
          >
            <Input placeholder="Email address" />
          </Form.Item>
          <Form.Item name="website" label="Website">
            <Input placeholder="Website URL" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Update Store Info
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
