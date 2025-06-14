import React, { useState, useEffect } from 'react';
import { Table, Spin, Typography, Card, Row, Col, Statistic } from 'antd';
import { useAuth } from '../../../../contexts/AuthContext';
import TabHeader from '../../../common/components/TabHeader';
import axios from 'axios';
import { GiftOutlined, CheckCircleOutlined, ClockCircleOutlined, ShoppingOutlined } from '@ant-design/icons';

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
      const [pointsResponse, historyResponse] = await Promise.all([
        axios.get(`/api/reward-points/user/${user._id}/total`),
        axios.get(`/api/reward-points/user/${user._id}`, {
          params: {
            page: pagination.current,
            limit: pagination.pageSize,
          },
        }),
      ]);

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
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      render: (points, record) => (
        <span style={{ 
          color: record.type === 'earn' ? '#52c41a' : 
                 record.type === 'redeem' ? '#f5222d' : 
                 record.type === 'expired' ? '#faad14' : '#1890ff'
        }}>
          {record.type === 'earn' ? `+${points}` : `-${points}`}
        </span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeConfig = {
          earn: { color: '#52c41a', text: 'Earned' },
          redeem: { color: '#f5222d', text: 'Redeemed' },
          expired: { color: '#faad14', text: 'Expired' },
          adjust: { color: '#1890ff', text: 'Adjusted' },
        };
        return (
          <span style={{ color: typeConfig[type]?.color }}>
            {typeConfig[type]?.text || type}
          </span>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          active: { color: '#52c41a', text: 'Active' },
          expired: { color: '#faad14', text: 'Expired' },
          redeemed: { color: '#f5222d', text: 'Redeemed' },
        };
        return (
          <span style={{ color: statusConfig[status]?.color }}>
            {statusConfig[status]?.text || status}
          </span>
        );
      },
    },
  ];

  if (loading && !rewardPoints.length) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <TabHeader breadcrumb="Reward Points History" />
      <div style={{ padding: '24px' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Available Points"
                value={pointsStats.availablePoints}
                prefix={<GiftOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Earned"
                value={pointsStats.totalEarned}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Redeemed"
                value={pointsStats.totalRedeemed}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Expired"
                value={pointsStats.totalExpired}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Card style={{ marginTop: '24px' }}>
          <Table
            columns={columns}
            dataSource={rewardPoints}
            rowKey="_id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} transactions`,
            }}
            onChange={handleTableChange}
            loading={loading}
          />
        </Card>
      </div>
    </>
  );
}
