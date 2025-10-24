import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Modal,
  Input,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Spin,
  Descriptions,
  Badge,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import shipperApplicationService from '../../../../services/shipperApplicationService';
import './shipper-applications.css';

const { TextArea } = Input;

const ShipperApplications = () => {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewAction, setReviewAction] = useState(null); // 'approve' or 'reject'
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({ status: null });

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [pagination.current, pagination.pageSize, filters.status]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...(filters.status && { status: filters.status }),
      };
      const response = await shipperApplicationService.getAllApplications(params);
      setApplications(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
      message.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await shipperApplicationService.getApplicationStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewDetails = (record) => {
    setSelectedApplication(record);
    setDetailModalVisible(true);
  };

  const handleOpenReviewModal = (application, action) => {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewNote('');
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedApplication) return;

    // Validate rejection requires note
    if (reviewAction === 'reject' && !reviewNote.trim()) {
      message.error('Please provide a reason for rejection');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Submitting review:', {
        action: reviewAction,
        applicationId: selectedApplication._id,
        reviewNote,
      });

      if (reviewAction === 'approve') {
        await shipperApplicationService.approveApplication(selectedApplication._id, reviewNote);
        message.success('Application approved! User is now a shipper.');
      } else {
        await shipperApplicationService.rejectApplication(selectedApplication._id, reviewNote);
        message.success('Application rejected');
      }
      
      setReviewModalVisible(false);
      setSelectedApplication(null);
      setReviewNote('');
      fetchApplications();
      fetchStats();
    } catch (error) {
      console.error('Error reviewing application:', error);
      console.error('Error details:', error.response?.data);
      message.error(error.response?.data?.message || error.response?.data?.error || 'Failed to process application');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'gold', icon: <ClockCircleOutlined />, text: 'Pending' },
      approved: { color: 'green', icon: <CheckCircleOutlined />, text: 'Approved' },
      rejected: { color: 'red', icon: <CloseCircleOutlined />, text: 'Rejected' },
    };
    const config = statusConfig[status];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const getVehicleTypeDisplay = (type) => {
    const types = {
      motorcycle: 'Motorcycle 🏍️',
      bicycle: 'Bicycle 🚲',
      car: 'Car 🚗',
      truck: 'Truck 🚚',
    };
    return types[type] || type;
  };

  const columns = [
    {
      title: 'Applicant',
      dataIndex: ['user', 'fullName'],
      key: 'applicant',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.phone}</div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Vehicle',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      render: (type) => getVehicleTypeDisplay(type),
    },
    {
      title: 'Applied Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                style={{ color: '#52c41a' }}
                icon={<CheckCircleOutlined />}
                onClick={() => handleOpenReviewModal(record, 'approve')}
              >
                Approve
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleOpenReviewModal(record, 'reject')}
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
    <div className="shipper-applications-container">
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
        Shipper Applications
      </h2>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Pending Applications"
              value={stats.pending}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Approved"
              value={stats.approved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Rejected"
              value={stats.rejected}
              valueStyle={{ color: '#f5222d' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Applications Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={applications}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} applications`,
          }}
          onChange={(newPagination, filters) => {
            setPagination(newPagination);
            setFilters({ status: filters.status?.[0] || null });
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Application Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          ...(selectedApplication?.status === 'pending'
            ? [
                <Button
                  key="reject"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    setDetailModalVisible(false);
                    handleOpenReviewModal(selectedApplication, 'reject');
                  }}
                >
                  Reject
                </Button>,
                <Button
                  key="approve"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  onClick={() => {
                    setDetailModalVisible(false);
                    handleOpenReviewModal(selectedApplication, 'approve');
                  }}
                >
                  Approve
                </Button>,
              ]
            : []),
        ]}
        width={700}
      >
        {selectedApplication && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Applicant Name">
              {selectedApplication.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {selectedApplication.phone}
            </Descriptions.Item>
            <Descriptions.Item label="Email">{selectedApplication.email}</Descriptions.Item>
            <Descriptions.Item label="Address">
              {selectedApplication.address}
            </Descriptions.Item>
            <Descriptions.Item label="Identity Card">
              {selectedApplication.identityCard}
            </Descriptions.Item>
            <Descriptions.Item label="Vehicle Type">
              {getVehicleTypeDisplay(selectedApplication.vehicleType)}
            </Descriptions.Item>
            <Descriptions.Item label="Vehicle Plate">
              {selectedApplication.vehiclePlate || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Experience">
              {selectedApplication.experience || 'No experience provided'}
            </Descriptions.Item>
            <Descriptions.Item label="Reason">
              {selectedApplication.reason}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {getStatusTag(selectedApplication.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Applied Date">
              {new Date(selectedApplication.createdAt).toLocaleString('vi-VN')}
            </Descriptions.Item>
            {selectedApplication.reviewedAt && (
              <>
                <Descriptions.Item label="Reviewed Date">
                  {new Date(selectedApplication.reviewedAt).toLocaleString('vi-VN')}
                </Descriptions.Item>
                <Descriptions.Item label="Reviewed By">
                  {selectedApplication.reviewedBy?.fullName || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Review Note">
                  {selectedApplication.reviewNote || 'No note provided'}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal
        title={
          reviewAction === 'approve'
            ? 'Approve Shipper Application'
            : 'Reject Shipper Application'
        }
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        onOk={handleSubmitReview}
        confirmLoading={submitting}
        okText={reviewAction === 'approve' ? 'Approve' : 'Reject'}
        okButtonProps={{
          danger: reviewAction === 'reject',
          style:
            reviewAction === 'approve'
              ? { background: '#52c41a', borderColor: '#52c41a' }
              : {},
        }}
      >
        <p style={{ marginBottom: 16 }}>
          {reviewAction === 'approve'
            ? 'Are you sure you want to approve this application? The user will become a shipper immediately.'
            : 'Please provide a reason for rejecting this application:'}
        </p>
        <TextArea
          rows={4}
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          placeholder={
            reviewAction === 'approve'
              ? 'Add an optional note (e.g., Welcome to the team!)'
              : 'Enter rejection reason...'
          }
          required={reviewAction === 'reject'}
        />
      </Modal>
    </div>
  );
};

export default ShipperApplications;

