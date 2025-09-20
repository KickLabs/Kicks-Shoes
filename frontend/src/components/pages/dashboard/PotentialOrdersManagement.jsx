/**
 * @fileoverview Potential Orders Management Page for Shop Dashboard
 * @created 2025-01-15
 * @file PotentialOrdersManagement.jsx
 * @description Standalone page for managing all potential orders in shop dashboard.
 * Features table view, grouped-by-livestream view with individual pagination,
 * filtering, and modals for details and notes.
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Modal,
  Input,
  Select,
  Avatar,
  Tooltip,
  DatePicker,
  Row,
  Col,
  Statistic,
  Empty,
  Spin,
  Collapse,
  Descriptions,
} from 'antd';
import {
  PhoneOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  FilterOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import axios from '../../../services/axiosInstance'; // Make sure this path is correct

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const PotentialOrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    dateRange: null,
    searchText: '',
  });

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    contacted: 0,
    confirmed: 0,
    converted: 0,
    ignored: 0,
    spam: 0,
  });

  const [grouped, setGrouped] = useState([]);
  const [viewMode, setViewMode] = useState('table');

  // State to manage pagination for each group in the Collapse view
  const [groupPagination, setGroupPagination] = useState({});
  const [hideSpam, setHideSpam] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch both data sets in parallel for efficiency
      const [ordersResponse, groupedResponse] = await Promise.all([
        axios.get('/potential-orders', {
          params: {
            page: 1,
            limit: 100,
            ...filters,
            dateRange: filters.dateRange
              ? {
                  start: filters.dateRange[0]?.format('YYYY-MM-DD'),
                  end: filters.dateRange[1]?.format('YYYY-MM-DD'),
                }
              : undefined,
          },
        }),
        viewMode === 'grouped'
          ? axios.get('/potential-orders/grouped-by-stream')
          : Promise.resolve({ data: { data: grouped } }),
      ]);

      const ordersData = ordersResponse.data.data || [];
      setOrders(ordersData);
      setGrouped(groupedResponse.data.data || []);

      // Calculate statistics based on the main filtered list
      const newStats = ordersData.reduce(
        (acc, order) => {
          acc.total++;
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        },
        { total: 0, pending: 0, contacted: 0, confirmed: 0, converted: 0, ignored: 0, spam: 0 }
      );
      setStats(newStats);
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters, viewMode]);

  // Handler for changing pages within a group's table
  const handleGroupTableChange = (pagination, streamId) => {
    setGroupPagination(prev => ({
      ...prev,
      [streamId]: {
        current: pagination.current,
        pageSize: pagination.pageSize,
      },
    }));
  };

  const updateOrderStatus = async (orderId, nextStatus, notes = null) => {
    try {
      setUpdating(true);
      await axios.put(`/potential-orders/${orderId}/status`, { status: nextStatus, notes });

      // Optimistically update flat list (or remove if spam)
      setOrders(prev => {
        if (nextStatus === 'spam') {
          return prev.filter(o => o._id !== orderId);
        }
        return prev.map(order =>
          order._id === orderId
            ? { ...order, status: nextStatus, hostActions: { ...order.hostActions, notes } }
            : order
        );
      });

      // Optimistically update grouped view and stats
      setGrouped(prevGroups =>
        prevGroups.map(group => {
          const idx = group.orders.findIndex(o => o._id === orderId);
          if (idx === -1) return group;

          const prevStatus = group.orders[idx].status;
          let newOrders;
          if (nextStatus === 'spam') {
            newOrders = group.orders.filter(o => o._id !== orderId);
          } else {
            newOrders = group.orders.map(o =>
              o._id === orderId
                ? { ...o, status: nextStatus, hostActions: { ...o.hostActions, notes } }
                : o
            );
          }

          const newStats = { ...group.stats };
          if (prevStatus && newStats[prevStatus] !== undefined) {
            newStats[prevStatus] = Math.max(0, (newStats[prevStatus] || 0) - 1);
          }
          if (nextStatus !== 'spam' && newStats[nextStatus] !== undefined) {
            newStats[nextStatus] = (newStats[nextStatus] || 0) + 1;
          }
          // total should decrease when removing spam from list
          if (nextStatus === 'spam' && typeof newStats.total === 'number') {
            newStats.total = Math.max(0, (newStats.total || 0) - 1);
          }

          return { ...group, orders: newOrders, stats: newStats };
        })
      );

      // Close modals and notify
      message.success('Order status updated successfully');
      setModalVisible(false);
      setNoteModalVisible(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      message.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getPriorityColor = priority => {
    switch (priority) {
      case 'urgent':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'pending':
        return 'gold';
      case 'contacted':
        return 'blue';
      case 'confirmed':
        return 'green';
      case 'converted':
        return 'cyan';
      case 'ignored':
        return 'default';
      case 'spam':
        return 'red';
      default:
        return 'default';
    }
  };

  const formatPhone = phone => {
    if (phone && phone.length === 10) {
      return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
    }
    return phone;
  };

  const showOrderDetails = order => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const showNoteModal = order => {
    setSelectedOrder(order);
    setNote(order.hostActions?.notes || '');
    setNoteModalVisible(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ status: 'all', priority: 'all', dateRange: null, searchText: '' });
  };

  const exportOrders = async () => {
    try {
      message.loading('Đang xuất file Excel...', 0);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('status', filters.status);
      params.append('priority', filters.priority);
      if (filters.searchText) {
        params.append('searchText', filters.searchText);
      }
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.append('dateRange', JSON.stringify(filters.dateRange));
      }

      // Make API call to export endpoint
      const response = await axios.get(`/potential-orders/export?${params.toString()}`, {
        responseType: 'blob',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'potential-orders.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.destroy();
      message.success('Xuất file Excel thành công!');
    } catch (error) {
      message.destroy();
      console.error('Export error:', error);
      message.error('Có lỗi xảy ra khi xuất file Excel');
    }
  };

  // Apply search/status/priority/date and hideSpam to a list
  const applyFilters = list => {
    return list.filter(order => {
      if (hideSpam && order.status === 'spam') return false;
      if (filters.status !== 'all' && order.status !== filters.status) return false;
      if (filters.priority !== 'all' && order.priority !== filters.priority) return false;
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const inName = order.customerInfo.customerName.toLowerCase().includes(searchLower);
        const inPhone = order.customerInfo.phoneNumber.includes(searchLower);
        const inMsg = order.productInfo.originalMessage.toLowerCase().includes(searchLower);
        if (!inName && !inPhone && !inMsg) return false;
      }
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        const d = new Date(order.createdAt).getTime();
        const s = new Date(filters.dateRange[0].format('YYYY-MM-DD')).getTime();
        const e = new Date(filters.dateRange[1].format('YYYY-MM-DD')).getTime();
        if (d < s || d > e) return false;
      }
      return true;
    });
  };

  const columns = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_, order) => (
        <Space>
          <Avatar src={order.customerInfo.userId?.avatar} icon={<UserOutlined />} />
          <div>
            <Text strong>{order.customerInfo.customerName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {formatPhone(order.customerInfo.phoneNumber)}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Message',
      dataIndex: ['productInfo', 'originalMessage'],
      key: 'message',
      width: 360,
      render: msg => (
        <Text style={{ maxWidth: 300, display: 'inline-block' }} ellipsis={{ tooltip: msg }}>
          {msg}
        </Text>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: priority => <Tag color={getPriorityColor(priority)}>{priority?.toUpperCase()}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <Tag color={getStatusColor(status)}>{status?.toUpperCase()}</Tag>,
    },
    {
      title: 'Confidence',
      key: 'confidence',
      render: (_, order) => <Text>{(order.detectionData.confidence * 100).toFixed(1)}%</Text>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => new Date(date).toLocaleDateString('vi-VN'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, order) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showOrderDetails(order)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Add Note">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => showNoteModal(order)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Confirm Order">
            <Button
              type="text"
              icon={<CheckOutlined />}
              onClick={() => updateOrderStatus(order._id, 'confirmed')}
              disabled={['confirmed', 'converted'].includes(order.status)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Mark as Spam">
            <Button
              type="text"
              icon={<CloseOutlined />}
              danger
              onClick={() => updateOrderStatus(order._id, 'spam')}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Page Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Potential Orders Management
          </Title>
          <Text type="secondary">Manage and track all potential orders from livestreams.</Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Refresh
            </Button>
            <Button icon={<DownloadOutlined />} onClick={exportOrders} type="default">
              Export
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Statistics Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} lg={4}>
          <Card variant="outlined" style={{ borderRadius: 12 }}>
            <Statistic title="Total Orders" value={stats.total} loading={loading} />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card variant="outlined" style={{ borderRadius: 12 }}>
            <Statistic
              title="Pending"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card variant="outlined" style={{ borderRadius: 12 }}>
            <Statistic
              title="Confirmed"
              value={stats.confirmed}
              valueStyle={{ color: '#52c41a' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card variant="outlined" style={{ borderRadius: 12 }}>
            <Statistic
              title="Contacted"
              value={stats.contacted}
              valueStyle={{ color: '#1890ff' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card variant="outlined" style={{ borderRadius: 12 }}>
            <Statistic
              title="Converted"
              value={stats.converted}
              valueStyle={{ color: '#13c2c2' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card variant="outlined" style={{ borderRadius: 12 }}>
            <Statistic
              title="Spam"
              value={stats.spam}
              valueStyle={{ color: '#f5222d' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content: Filters & Table */}
      <Card variant="outlined" style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        {/* Filter Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <Row gutter={[16, 16]} justify="space-between" align="middle">
            <Col xs={24} lg={18}>
              <Space wrap>
                <Input
                  placeholder="Search customer, phone..."
                  value={filters.searchText}
                  onChange={e => handleFilterChange('searchText', e.target.value)}
                  allowClear
                  style={{ width: 250 }}
                />
                <Select
                  value={filters.status}
                  onChange={value => handleFilterChange('status', value)}
                  style={{ width: 150 }}
                >
                  <Option value="all">All Status</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="contacted">Contacted</Option>
                  <Option value="confirmed">Confirmed</Option>
                  <Option value="converted">Converted</Option>
                  <Option value="ignored">Ignored</Option>
                  <Option value="spam">Spam</Option>
                </Select>
                <Select
                  value={filters.priority}
                  onChange={value => handleFilterChange('priority', value)}
                  style={{ width: 150 }}
                >
                  <Option value="all">All Priority</Option>
                  <Option value="urgent">Urgent</Option>
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
                <RangePicker
                  value={filters.dateRange}
                  onChange={value => handleFilterChange('dateRange', value)}
                />
                <Button icon={<FilterOutlined />} onClick={resetFilters}>
                  Reset
                </Button>
                <Button
                  type={hideSpam ? 'default' : 'default'}
                  onClick={() => setHideSpam(v => !v)}
                >
                  {hideSpam ? 'Hide Spam: ON' : 'Hide Spam: OFF'}
                </Button>
              </Space>
            </Col>
            <Col xs={24} lg={6} style={{ textAlign: 'right' }}>
              <Select
                value={viewMode}
                onChange={setViewMode}
                style={{ width: '100%', maxWidth: '200px' }}
              >
                <Option value="table">View as Table</Option>
                <Option value="grouped">Group by Livestream</Option>
              </Select>
            </Col>
          </Row>
        </div>

        {/* Orders View */}
        <div style={{ padding: viewMode === 'table' ? '0' : '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 50 }}>
              <Spin size="large" />
            </div>
          ) : viewMode === 'table' ? (
            <Table
              columns={columns}
              dataSource={applyFilters(orders)}
              rowKey="_id"
              pagination={{ pageSize: 20, showSizeChanger: true }}
              tableLayout="auto"
            />
          ) : grouped.length === 0 ? (
            <Empty
              description="No streams found to group by"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Collapse accordion bordered={false} style={{ background: 'transparent' }}>
              {grouped.map(group => {
                const streamId = group.stream._id;
                const currentPagination = groupPagination[streamId] || { current: 1, pageSize: 5 }; // Default to 5 items per page

                return (
                  <Panel
                    key={streamId}
                    header={
                      <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                        <Col>
                          <Space>
                            <Text strong>{group.stream.title || 'Livestream'}</Text>
                            <Text type="secondary">{group.stream.roomId}</Text>
                          </Space>
                        </Col>
                        <Col>
                          <Space size={8} wrap>
                            <Tag>Total: {group.stats.total}</Tag>
                            <Tag color="gold">Pending: {group.stats.pending}</Tag>
                            <Tag color="green">Confirmed: {group.stats.confirmed}</Tag>
                          </Space>
                        </Col>
                      </Row>
                    }
                    style={{ background: '#fff', borderRadius: '8px', marginBottom: '16px' }}
                  >
                    <Table
                      columns={columns.filter(col => col.key !== 'stream')} // Hide stream column in this view
                      dataSource={applyFilters(group.orders)}
                      rowKey="_id"
                      size="small"
                      pagination={{
                        ...currentPagination,
                        total: applyFilters(group.orders).length,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
                      }}
                      onChange={pagination => handleGroupTableChange(pagination, streamId)}
                      tableLayout="auto"
                    />
                  </Panel>
                );
              })}
            </Collapse>
          )}
        </div>
      </Card>

      {/* Order Details Modal */}
      <Modal
        title="Potential Order Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={760}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', padding: 16 } }}
      >
        {selectedOrder && (
          <>
            <Descriptions
              title="Customer Information"
              bordered
              column={1}
              size="small"
              style={{ marginBottom: 20 }}
            >
              <Descriptions.Item label="Name">
                {selectedOrder.customerInfo.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {formatPhone(selectedOrder.customerInfo.phoneNumber)}
              </Descriptions.Item>
              <Descriptions.Item label="User ID">
                {selectedOrder.customerInfo.userId?.username || 'N/A'}
              </Descriptions.Item>
            </Descriptions>
            <Descriptions
              title="Order Information"
              bordered
              column={1}
              size="small"
              style={{ marginBottom: 20 }}
            >
              <Descriptions.Item label="Original Message">
                {selectedOrder.productInfo.originalMessage}
              </Descriptions.Item>
              {selectedOrder.productInfo.productId && (
                <>
                  <Descriptions.Item label="Product Name">
                    {selectedOrder.productInfo.productId?.name}
                  </Descriptions.Item>
                  {selectedOrder.productInfo.productId?.sku && (
                    <Descriptions.Item label="SKU">
                      {selectedOrder.productInfo.productId.sku}
                    </Descriptions.Item>
                  )}
                  {selectedOrder.productInfo.productId?.brand && (
                    <Descriptions.Item label="Brand">
                      {selectedOrder.productInfo.productId.brand}
                    </Descriptions.Item>
                  )}
                  {selectedOrder.productInfo.productId?.price !== undefined && (
                    <Descriptions.Item label="Price">
                      {selectedOrder.productInfo.productId.price}
                    </Descriptions.Item>
                  )}
                </>
              )}
              <Descriptions.Item label="Detected Quantity">
                {selectedOrder.productInfo.extractedQuantity}
              </Descriptions.Item>
              {selectedOrder.productInfo.extractedSize && (
                <Descriptions.Item label="Detected Size">
                  {selectedOrder.productInfo.extractedSize}
                </Descriptions.Item>
              )}
              {selectedOrder.productInfo.extractedColor && (
                <Descriptions.Item label="Detected Color">
                  {selectedOrder.productInfo.extractedColor}
                </Descriptions.Item>
              )}
            </Descriptions>
            <Descriptions
              title="Detection & Status"
              bordered
              column={1}
              size="small"
              style={{ marginBottom: 20 }}
            >
              <Descriptions.Item label="Confidence">
                {(selectedOrder.detectionData.confidence * 100).toFixed(1)}%
              </Descriptions.Item>
              <Descriptions.Item label="Keywords">
                {selectedOrder.detectionData.detectedKeywords.join(', ')}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={getPriorityColor(selectedOrder.priority)}>
                  {selectedOrder.priority.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            {selectedOrder.hostActions?.notes && (
              <Descriptions title="Host Notes" bordered column={1} size="small">
                <Descriptions.Item label="Note">
                  {selectedOrder.hostActions.notes}
                </Descriptions.Item>
              </Descriptions>
            )}
          </>
        )}
      </Modal>

      {/* Add Note Modal */}
      <Modal
        title="Add/Edit Note"
        open={noteModalVisible}
        onCancel={() => setNoteModalVisible(false)}
        onOk={() => updateOrderStatus(selectedOrder?._id, selectedOrder?.status, note)}
        confirmLoading={updating}
      >
        <TextArea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add notes about customer interactions..."
          rows={4}
        />
      </Modal>
    </div>
  );
};

export default PotentialOrdersManagement;
