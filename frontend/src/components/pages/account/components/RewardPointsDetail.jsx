import React, { useState, useEffect } from 'react';
import { Table, Spin, Typography, Card, Row, Col, Statistic, message } from 'antd';
import { useAuth } from '../../../../contexts/AuthContext';
import TabHeader from '../../../common/components/TabHeader';
import axiosInstance from '../../../../services/axiosInstance';
import RedeemPointsSection from './RedeemPointsSection';
import {
  GiftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

export default function RewardPointsDetail() {
  const [loading, setLoading] = useState(true);
  const [rewardPoints, setRewardPoints] = useState([]);
  const [pointsStats, setPointsStats] = useState({
    totalEarned: 0,
    totalRedeemed: 0,
    totalExpired: 0,
    availablePoints: 0,
  });
  const { user } = useAuth();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, pagination.current, pagination.pageSize]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch user's total points statistics
      const pointsResponse = await axiosInstance.get(`/reward-points/user/${user._id}/total`);

      // Fetch user's reward points history with pagination
      const historyResponse = await axiosInstance.get(`/reward-points/user/${user._id}`, {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
        },
      });

      if (pointsResponse.data.success) {
        setPointsStats(pointsResponse.data.data);
      }

      if (historyResponse.data.success) {
        setRewardPoints(historyResponse.data.data);
        setPagination(prev => ({
          ...prev,
          total: historyResponse.data.pagination.totalRecords,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch reward points data:', error);
      message.error('Failed to load reward points data');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = pagination => {
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total,
    });
  };

  const handleRedeemSuccess = () => {
    fetchData(); // Refresh data after successful redemption
  };

  const getTypeDisplay = type => {
    const typeConfig = {
      earn: { color: '#52c41a', text: 'Earned', icon: '🎁' },
      redeem: { color: '#f5222d', text: 'Redeemed', icon: '🛒' },
      expire: { color: '#faad14', text: 'Expired', icon: '⏰' },
      adjust: { color: '#1890ff', text: 'Adjusted', icon: '⚙️' },
    };
    return typeConfig[type] || { color: '#666', text: type, icon: '❓' };
  };

  const getStatusDisplay = status => {
    const statusConfig = {
      active: { color: '#52c41a', text: 'Active' },
      expired: { color: '#faad14', text: 'Expired' },
      redeemed: { color: '#f5222d', text: 'Redeemed' },
    };
    return statusConfig[status] || { color: '#666', text: status };
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: text =>
        new Date(text).toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: text => <div style={{ maxWidth: 300, wordBreak: 'break-word' }}>{text}</div>,
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      render: (points, record) => {
        const typeConfig = getTypeDisplay(record.type);
        const displayPoints = Math.abs(points); // Use absolute value
        return (
          <span
            style={{
              color: typeConfig.color,
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {record.type === 'earn' ? `+${displayPoints}` : `-${displayPoints}`}
          </span>
        );
      },
      sorter: (a, b) => a.points - b.points,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: type => {
        const typeConfig = getTypeDisplay(type);
        return (
          <span style={{ color: typeConfig.color, fontWeight: 500 }}>
            {typeConfig.icon} {typeConfig.text}
          </span>
        );
      },
      filters: [
        { text: 'Earned', value: 'earn' },
        { text: 'Redeemed', value: 'redeem' },
        { text: 'Expired', value: 'expire' },
        { text: 'Adjusted', value: 'adjust' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        const statusConfig = getStatusDisplay(status);
        return (
          <span style={{ color: statusConfig.color, fontWeight: 500 }}>{statusConfig.text}</span>
        );
      },
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Expired', value: 'expired' },
        { text: 'Redeemed', value: 'redeemed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
      render: order => {
        if (!order) return <span style={{ color: '#999' }}>N/A</span>;
        return <span style={{ color: '#1890ff', fontWeight: 500 }}>#{order.orderNumber}</span>;
      },
    },
  ];

  if (loading && !rewardPoints.length) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <Spin size="large" />
        <div style={{ color: '#666' }}>Loading reward points data...</div>
      </div>
    );
  }

  return (
    <>
      <TabHeader breadcrumb="Reward Points History" />
      <div style={{ padding: '24px' }}>
        {/* Statistics Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e8e8e8',
              }}
            >
              <Statistic
                title="Available Points"
                value={pointsStats.availablePoints}
                prefix={<GiftOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: 24, fontWeight: 600 }}
                suffix="pts"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e8e8e8',
              }}
            >
              <Statistic
                title="Total Earned"
                value={pointsStats.totalEarned}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: 24, fontWeight: 600 }}
                suffix="pts"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e8e8e8',
              }}
            >
              <Statistic
                title="Total Redeemed"
                value={pointsStats.totalRedeemed}
                prefix={<ShoppingOutlined style={{ color: '#f5222d' }} />}
                valueStyle={{ color: '#f5222d', fontSize: 24, fontWeight: 600 }}
                suffix="pts"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e8e8e8',
              }}
            >
              <Statistic
                title="Total Expired"
                value={pointsStats.totalExpired}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontSize: 24, fontWeight: 600 }}
                suffix="pts"
              />
            </Card>
          </Col>
        </Row>

        {/* Transaction History Table */}
        <Card
          style={{
            marginTop: '24px',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e8e8e8',
          }}
          title={
            <div style={{ fontSize: 18, fontWeight: 600, color: '#2c3e50' }}>
              Transaction History
            </div>
          }
        >
          {rewardPoints.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#666',
              }}
            >
              <GiftOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
              <div style={{ fontSize: 16, marginBottom: 8 }}>No reward points yet</div>
              <div style={{ fontSize: 14 }}>Start shopping to earn reward points!</div>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={rewardPoints}
              rowKey="_id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} transactions`,
                pageSizeOptions: ['10', '20', '50'],
              }}
              onChange={handleTableChange}
              loading={loading}
              scroll={{ x: 'max-content' }}
            />
          )}
        </Card>
      </div>

      {/* Redeem Points Section */}
      <RedeemPointsSection
        availablePoints={pointsStats.availablePoints}
        onSuccess={handleRedeemSuccess}
      />
    </>
  );
}
