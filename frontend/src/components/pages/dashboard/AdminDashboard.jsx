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
} from '../../../services/dashboardService';
import TabHeader from '../../common/components/TabHeader';
import axiosInstance from '../../../services/axiosInstance';

const { Search } = Input;
const { Option } = Select;

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

  // UI State
  const [searchText, setSearchText] = useState('');

  // Modal reply admin
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyReport, setReplyReport] = useState(null);
  const [replyResolution, setReplyResolution] = useState('no_action');
  const [replyNote, setReplyNote] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

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
      setRevenueData(response.data || []);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
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
      content: 'Are you sure you want to delete this feedback?',
      onOk: async () => {
        try {
          await deleteFeedback(feedbackId);
          message.success('Feedback deleted successfully');
          fetchFeedback(); // Refresh data
        } catch (err) {
          console.error('Error deleting feedback:', err);
          message.error('Failed to delete feedback');
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
          color={
            type === 'product'
              ? 'blue'
              : type === 'feedback'
                ? 'orange'
                : type === 'comment'
                  ? 'purple'
                  : 'default'
          }
          style={{ borderRadius: 8, fontWeight: 600, fontSize: 14, padding: '4px 16px' }}
        >
          {type.toUpperCase()}
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
    { title: 'Product', dataIndex: 'product', key: 'product' },
    { title: 'Shop', dataIndex: 'shop', key: 'shop' },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: rating => (
        <Space>
          {[...Array(5)].map((_, i) => (
            <span key={i} style={{ color: i < rating ? '#faad14' : '#d9d9d9' }}>
              ★
            </span>
          ))}
        </Space>
      ),
    },
    { title: 'Comment', dataIndex: 'comment', key: 'comment' },
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteFeedback(record.id)}
        >
          Delete
        </Button>
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
                    xField="_id"
                    yField="totalRevenue"
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
        return (
          <Card
            title={<div style={{ fontSize: 20, fontWeight: 600 }}>Financial Reports</div>}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Monthly Revenue" size="small">
                  <Line
                    data={revenueData}
                    xField="month"
                    yField="revenue"
                    smooth
                    point={{
                      size: 5,
                      shape: 'diamond',
                    }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Revenue by Category" size="small">
                  <Bar
                    data={[
                      { category: 'Sneakers', revenue: 15000 },
                      { category: 'Running', revenue: 12000 },
                      { category: 'Casual', revenue: 8000 },
                      { category: 'Sports', revenue: 6000 },
                    ]}
                    xField="revenue"
                    yField="category"
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        );

      case 'feedback':
        return (
          <Card
            title={<div style={{ fontSize: 20, fontWeight: 600 }}>Feedback Management</div>}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            <Table
              columns={feedbackColumns}
              dataSource={feedback}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
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
                <option value="warning">Warning</option>
                <option value="suspension">Suspension</option>
                <option value="ban">Ban</option>
                <option value="no_action">No Action</option>
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
              <b>Resolution:</b> {replyReport.resolution || 'N/A'}
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
    </div>
  );
}
