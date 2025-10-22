import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Input,
  Select,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Spin,
  Badge,
  Descriptions,
  Divider,
  Avatar,
} from 'antd';
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import deliveryReportService from '../../../../services/deliveryReportService';
import './delivery-reports.css';

const { TextArea } = Input;
const { Option } = Select;

const DeliveryReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    reportType: '',
  });

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolution, setResolution] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [updateOrderStatus, setUpdateOrderStatus] = useState('completed');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
      };

      const data = await deliveryReportService.getAllReports(params);
      setReports(data.data);
      setPagination({
        ...pagination,
        total: data.pagination.total,
      });
    } catch (error) {
      message.error('Failed to fetch delivery reports');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await deliveryReportService.getStats();
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, current: 1 });
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  const handleStartInvestigation = async (report) => {
    try {
      await deliveryReportService.updateStatus(report._id, {
        status: 'investigating',
      });
      message.success('Investigation started');
      fetchReports();
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleOpenResolve = (report) => {
    setSelectedReport(report);
    setResolution('');
    setUpdateOrderStatus('completed');
    setResolveModalVisible(true);
  };

  const handleResolve = async () => {
    if (!resolution.trim()) {
      message.error('Please provide a resolution');
      return;
    }

    try {
      setSubmitting(true);
      await deliveryReportService.resolveReport(selectedReport._id, {
        resolution,
        updateOrderStatus,
      });
      message.success('Report resolved successfully');
      setResolveModalVisible(false);
      setDetailModalVisible(false);
      fetchReports();
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to resolve report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReject = (report) => {
    setSelectedReport(report);
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      message.error('Please provide a reason for rejection');
      return;
    }

    try {
      setSubmitting(true);
      await deliveryReportService.rejectReport(selectedReport._id, {
        reason: rejectionReason,
      });
      message.success('Report rejected');
      setRejectModalVisible(false);
      setDetailModalVisible(false);
      fetchReports();
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reject report');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriorityChange = async (reportId, priority) => {
    try {
      await deliveryReportService.updatePriority(reportId, priority);
      message.success('Priority updated');
      fetchReports();
    } catch (error) {
      message.error('Failed to update priority');
    }
  };

  const statusColorMap = {
    pending: 'orange',
    investigating: 'blue',
    resolved: 'green',
    rejected: 'red',
  };

  const priorityColorMap = {
    low: 'default',
    medium: 'blue',
    high: 'orange',
    urgent: 'red',
  };

  const reportTypeLabels = {
    not_received: 'Not Received',
    damaged: 'Damaged Product',
    wrong_item: 'Wrong Item',
    incomplete: 'Incomplete Order',
    other: 'Other',
  };

  const columns = [
    {
      title: 'Report ID',
      dataIndex: '_id',
      key: '_id',
      width: 120,
      render: (id) => `#${id.slice(-6)}`,
    },
    {
      title: 'Order',
      dataIndex: ['order', 'orderNumber'],
      key: 'orderNumber',
      render: (orderNumber) => <strong>#{orderNumber}</strong>,
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'fullName'],
      key: 'customer',
      render: (name, record) => (
        <div>
          <div>{name}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.customer?.email}</div>
        </div>
      ),
    },
    {
      title: 'Issue Type',
      dataIndex: 'reportType',
      key: 'reportType',
      render: (type) => reportTypeLabels[type] || type,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority, record) => (
        <Select
          value={priority}
          onChange={(value) => handlePriorityChange(record._id, value)}
          size="small"
          style={{ width: 100 }}
        >
          <Option value="low">
            <Tag color={priorityColorMap.low}>Low</Tag>
          </Option>
          <Option value="medium">
            <Tag color={priorityColorMap.medium}>Medium</Tag>
          </Option>
          <Option value="high">
            <Tag color={priorityColorMap.high}>High</Tag>
          </Option>
          <Option value="urgent">
            <Tag color={priorityColorMap.urgent}>Urgent</Tag>
          </Option>
        </Select>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColorMap[status]} style={{ textTransform: 'capitalize' }}>
          {status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            size="small"
          >
            View
          </Button>
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleStartInvestigation(record)}
            >
              Investigate
            </Button>
          )}
          {(record.status === 'pending' || record.status === 'investigating') && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleOpenResolve(record)}
                icon={<CheckCircleOutlined />}
              >
                Resolve
              </Button>
              <Button
                danger
                size="small"
                onClick={() => handleOpenReject(record)}
                icon={<CloseCircleOutlined />}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="delivery-reports-container">
      <div className="delivery-reports-header">
        <h2>Delivery Issue Reports</h2>
        <Button icon={<ReloadOutlined />} onClick={fetchReports}>
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending"
                value={stats.pendingCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Investigating"
                value={stats.byStatus.find((s) => s._id === 'investigating')?.count || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Resolved"
                value={stats.byStatus.find((s) => s._id === 'resolved')?.count || 0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Rejected"
                value={stats.byStatus.find((s) => s._id === 'rejected')?.count || 0}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle">
          <span>
            <FilterOutlined /> Filters:
          </span>
          <Select
            placeholder="Status"
            style={{ width: 150 }}
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            allowClear
          >
            <Option value="">All</Option>
            <Option value="pending">Pending</Option>
            <Option value="investigating">Investigating</Option>
            <Option value="resolved">Resolved</Option>
            <Option value="rejected">Rejected</Option>
          </Select>
          <Select
            placeholder="Priority"
            style={{ width: 150 }}
            value={filters.priority}
            onChange={(value) => handleFilterChange('priority', value)}
            allowClear
          >
            <Option value="">All</Option>
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
            <Option value="urgent">Urgent</Option>
          </Select>
          <Select
            placeholder="Issue Type"
            style={{ width: 200 }}
            value={filters.reportType}
            onChange={(value) => handleFilterChange('reportType', value)}
            allowClear
          >
            <Option value="">All</Option>
            <Option value="not_received">Not Received</Option>
            <Option value="damaged">Damaged Product</Option>
            <Option value="wrong_item">Wrong Item</Option>
            <Option value="incomplete">Incomplete Order</Option>
            <Option value="other">Other</Option>
          </Select>
        </Space>
      </Card>

      {/* Reports Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={reports}
          loading={loading}
          rowKey="_id"
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <span>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            Delivery Issue Report Details
          </span>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedReport && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Report ID" span={2}>
                #{selectedReport._id}
              </Descriptions.Item>
              <Descriptions.Item label="Order Number">
                #{selectedReport.order?.orderNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Order Status">
                <Tag color="orange">{selectedReport.order?.status?.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {selectedReport.customer?.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Customer Email">
                {selectedReport.customer?.email}
              </Descriptions.Item>
              <Descriptions.Item label="Customer Phone">
                {selectedReport.customer?.phone || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Shipper">
                {selectedReport.shipper?.fullName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Issue Type">
                <Tag>{reportTypeLabels[selectedReport.reportType]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={priorityColorMap[selectedReport.priority]}>
                  {selectedReport.priority?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColorMap[selectedReport.status]}>
                  {selectedReport.status?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {new Date(selectedReport.createdAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Issue Details</Divider>
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
              <p>
                <strong>Reason:</strong>
              </p>
              <p>{selectedReport.reason}</p>
              {selectedReport.description && (
                <>
                  <p>
                    <strong>Additional Description:</strong>
                  </p>
                  <p>{selectedReport.description}</p>
                </>
              )}
            </div>

            {selectedReport.resolution && (
              <>
                <Divider>Resolution</Divider>
                <div style={{ background: '#f0f5ff', padding: 16, borderRadius: 4 }}>
                  <p>{selectedReport.resolution}</p>
                  {selectedReport.resolvedBy && (
                    <p style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                      Resolved by: {selectedReport.resolvedBy.fullName} on{' '}
                      {new Date(selectedReport.resolvedAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              </>
            )}

            {(selectedReport.status === 'pending' || selectedReport.status === 'investigating') && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => handleOpenReject(selectedReport)} danger>
                    Reject Report
                  </Button>
                  <Button type="primary" onClick={() => handleOpenResolve(selectedReport)}>
                    Resolve Report
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Resolve Modal */}
      <Modal
        title="Resolve Delivery Issue"
        open={resolveModalVisible}
        onOk={handleResolve}
        onCancel={() => setResolveModalVisible(false)}
        confirmLoading={submitting}
        okText="Resolve"
        okButtonProps={{ icon: <CheckCircleOutlined /> }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Resolution Details <span style={{ color: '#ff4d4f' }}>*</span>
          </label>
          <TextArea
            rows={4}
            placeholder="Describe how the issue was resolved..."
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            maxLength={1000}
            showCount
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Update Order Status
          </label>
          <Select
            style={{ width: '100%' }}
            value={updateOrderStatus}
            onChange={setUpdateOrderStatus}
          >
            <Option value="completed">Mark as Completed</Option>
            <Option value="delivered_pending_confirmation">
              Return to Pending Confirmation
            </Option>
            <Option value="">Don't Change</Option>
          </Select>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Delivery Issue Report"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        confirmLoading={submitting}
        okText="Reject"
        okButtonProps={{ danger: true, icon: <CloseCircleOutlined /> }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Rejection Reason <span style={{ color: '#ff4d4f' }}>*</span>
          </label>
          <TextArea
            rows={4}
            placeholder="Explain why this report is being rejected..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            maxLength={1000}
            showCount
          />
        </div>
        <div
          style={{
            background: '#fff7e6',
            padding: 12,
            borderRadius: 4,
            border: '1px solid #ffd666',
          }}
        >
          <small style={{ color: '#ad6800' }}>
            <strong>Note:</strong> The customer will be notified of the rejection reason. The order
            status will be returned to "Delivered Pending Confirmation".
          </small>
        </div>
      </Modal>
    </div>
  );
};

export default DeliveryReports;

