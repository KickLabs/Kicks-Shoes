/**
 * @fileoverview LiveStream Management Component for Shop Dashboard
 * @created 2025-01-02
 * @file LiveStreamManagement.jsx
 * @description Component for managing livestreams in shop dashboard
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Popconfirm,
  Modal,
  Statistic,
  Row,
  Col,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  StopOutlined,
  EyeOutlined,
  DeleteOutlined,
  BarChartOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import livestreamService from '../../../services/livestreamService';

const { Title, Text } = Typography;

const LiveStreamManagement = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyticsModal, setAnalyticsModal] = useState(false);
  const [selectedStream, setSelectedStream] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const response = await livestreamService.getMyLiveStreams();
      setStreams(response.data.streams || []);
    } catch (error) {
      console.error('Error fetching streams:', error);
      message.error('Failed to load livestreams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStream = () => {
    navigate('/shop/livestream/create');
  };

  const handleJoinAsHost = roomId => {
    navigate(`/shop/livestream/host/${roomId}`);
  };

  const handleEndStream = async roomId => {
    try {
      await livestreamService.endLiveStream(roomId);
      message.success('Stream ended successfully');
      fetchStreams();
    } catch (error) {
      console.error('Error ending stream:', error);
      message.error('Failed to end stream');
    }
  };

  const handleDeleteStream = async roomId => {
    try {
      await livestreamService.deleteLiveStream(roomId);
      message.success('Stream deleted successfully');
      fetchStreams();
    } catch (error) {
      console.error('Error deleting stream:', error);
      message.error('Failed to delete stream');
    }
  };

  const handleViewAnalytics = async stream => {
    try {
      setSelectedStream(stream);
      const response = await livestreamService.getLiveStreamAnalytics(stream.roomId);
      setAnalytics(response.data);
      setAnalyticsModal(true);
    } catch (error) {
      console.error('Error loading analytics:', error);
      message.error('Failed to load analytics');
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'live':
        return 'red';
      case 'scheduled':
        return 'blue';
      case 'ended':
        return 'green';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDuration = seconds => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div>
              <Text type="secondary" ellipsis style={{ fontSize: '12px' }}>
                {record.description}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Tag color={getStatusColor(status)} style={{ textTransform: 'uppercase' }}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Viewers',
      key: 'viewers',
      render: (_, record) => (
        <div>
          <Text>{record.currentViewers || 0} current</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.stats?.peakViewers || 0} peak
          </Text>
        </div>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => <Text>{formatDuration(record.stats?.duration)}</Text>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'live' ? (
            <Popconfirm
              title="End Stream"
              description="Are you sure you want to end this livestream?"
              onConfirm={() => handleEndStream(record.roomId)}
              okText="Yes"
              cancelText="No"
            >
              <Button size="small" danger icon={<StopOutlined />}>
                End
              </Button>
            </Popconfirm>
          ) : record.status === 'scheduled' ? (
            <Button
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleJoinAsHost(record.roomId)}
            >
              Start
            </Button>
          ) : null}

          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => window.open(`/livestream/${record.roomId}`, '_blank')}
          >
            View
          </Button>

          <Button
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => handleViewAnalytics(record)}
          >
            Analytics
          </Button>

          {record.status !== 'live' && (
            <Popconfirm
              title="Delete Stream"
              description="Are you sure you want to delete this livestream?"
              onConfirm={() => handleDeleteStream(record.roomId)}
              okText="Yes"
              cancelText="No"
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const liveStreams = streams.filter(s => s.status === 'live');
  const totalViewers = liveStreams.reduce((sum, s) => sum + (s.currentViewers || 0), 0);
  const totalStreams = streams.length;
  const completedStreams = streams.filter(s => s.status === 'ended').length;

  return (
    <div>
      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Live Streams"
              value={liveStreams.length}
              prefix={<VideoCameraOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Current Viewers"
              value={totalViewers}
              prefix={<EyeOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Streams"
              value={totalStreams}
              suffix={`(${completedStreams} completed)`}
            />
          </Card>
        </Col>
      </Row>

      {/* Streams Table */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <VideoCameraOutlined />
            <span>My Livestreams</span>
          </div>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateStream}>
            Create Stream
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={streams}
          rowKey="_id"
          loading={loading}
          locale={{
            emptyText: (
              <Empty description="No livestreams yet" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateStream}>
                  Create Your First Stream
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Analytics Modal */}
      <Modal
        title={`Analytics - ${selectedStream?.title}`}
        open={analyticsModal}
        onCancel={() => setAnalyticsModal(false)}
        footer={null}
        width={800}
      >
        {analytics && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Peak Viewers"
                    value={analytics.viewers.peakViewers}
                    prefix={<EyeOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Total Messages"
                    value={analytics.chat.totalMessages}
                    prefix={<VideoCameraOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="Duration" value={analytics.stream.formattedDuration} />
                </Card>
              </Col>
            </Row>

            <Card title="Stream Details" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>Status: </Text>
                  <Tag color={getStatusColor(analytics.stream.status)}>
                    {analytics.stream.status.toUpperCase()}
                  </Tag>
                </Col>
                <Col span={12}>
                  <Text strong>Started: </Text>
                  <Text>
                    {analytics.stream.startedAt
                      ? new Date(analytics.stream.startedAt).toLocaleString()
                      : 'Not started'}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text strong>Ended: </Text>
                  <Text>
                    {analytics.stream.endedAt
                      ? new Date(analytics.stream.endedAt).toLocaleString()
                      : 'Not ended'}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text strong>Featured Products: </Text>
                  <Text>{analytics.products.featuredCount}</Text>
                </Col>
              </Row>
            </Card>

            <Card title="Chat Statistics">
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Text strong>Host Messages: </Text>
                  <Text>{analytics.chat.messagesByRole.host || 0}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>Viewer Messages: </Text>
                  <Text>{analytics.chat.messagesByRole.viewer || 0}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>System Messages: </Text>
                  <Text>{analytics.chat.messagesByRole.system || 0}</Text>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LiveStreamManagement;
