/**
 * @fileoverview LiveStream Page Component
 * @created 2025-01-02
 * @file LiveStreamPage.jsx
 * @description Main livestream page showing active and upcoming streams
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Button,
  Avatar,
  Tag,
  Spin,
  Empty,
  Tabs,
  message,
} from 'antd';
import {
  EyeOutlined,
  UserOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import livestreamService from '../../../services/livestreamService';
import './LiveStreamPage.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const LiveStreamPage = () => {
  const [activeStreams, setActiveStreams] = useState([]);
  const [upcomingStreams, setUpcomingStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    try {
      setLoading(true);
      const [activeResponse, upcomingResponse] = await Promise.all([
        livestreamService.getActiveLiveStreams(),
        livestreamService.getUpcomingLiveStreams(),
      ]);

      setActiveStreams(activeResponse.data.streams || []);
      setUpcomingStreams(upcomingResponse.data || []);
    } catch (error) {
      console.error('Error loading streams:', error);
      message.error('Failed to load livestreams');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinStream = roomId => {
    navigate(`/livestream/${roomId}`);
  };

  const formatTime = dateString => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStreamCard = (stream, isLive = false) => (
    <Card
      key={stream._id}
      className={`stream-card ${isLive ? 'live-stream' : 'upcoming-stream'}`}
      cover={
        <div className="stream-thumbnail">
          {stream.thumbnail ? (
            <img src={stream.thumbnail} alt={stream.title} />
          ) : (
            <div className="placeholder-thumbnail">
              <VideoCameraOutlined style={{ fontSize: '48px', color: '#ccc' }} />
            </div>
          )}
          {isLive && (
            <div className="live-badge">
              <Tag color="red" className="live-tag">
                LIVE
              </Tag>
            </div>
          )}
          {!isLive && stream.scheduledAt && (
            <div className="scheduled-badge">
              <Tag color="blue" className="scheduled-tag">
                <ClockCircleOutlined /> {formatTime(stream.scheduledAt)}
              </Tag>
            </div>
          )}
        </div>
      }
      actions={[
        <Button
          key="join"
          type={isLive ? 'primary' : 'default'}
          icon={<PlayCircleOutlined />}
          onClick={() => handleJoinStream(stream.roomId)}
          disabled={!isLive && stream.status !== 'scheduled'}
        >
          {isLive ? 'Join Stream' : 'View Details'}
        </Button>,
      ]}
    >
      <Card.Meta
        title={
          <div className="stream-title">
            <Text strong>{stream.title}</Text>
          </div>
        }
        description={
          <div className="stream-info">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space>
                <Avatar src={stream.hostId?.avatar} icon={<UserOutlined />} size="small" />
                <Text type="secondary">{stream.hostId?.username || 'Host'}</Text>
              </Space>
              {stream.description && (
                <Text type="secondary" ellipsis>
                  {stream.description}
                </Text>
              )}
              {isLive && (
                <Space>
                  <EyeOutlined />
                  <Text type="secondary">{stream.currentViewers || 0} viewers</Text>
                </Space>
              )}
            </Space>
          </div>
        }
      />
    </Card>
  );

  if (loading) {
    return (
      <div className="livestream-page">
        <div className="loading-container">
          <Spin size="large" />
          <Text>Loading livestreams...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="livestream-page">
      <div className="page-header">
        <Title level={2}>
          <VideoCameraOutlined style={{ marginRight: '12px', color: '#ff4d4f' }} />
          Livestreams
        </Title>
        <Text type="secondary">Watch live product demonstrations and interact with hosts</Text>
      </div>

      <Tabs defaultActiveKey="live" className="stream-tabs">
        <TabPane
          tab={
            <span>
              <PlayCircleOutlined />
              <span>Live Now ({activeStreams.length})</span>
            </span>
          }
          key="live"
        >
          {activeStreams.length > 0 ? (
            <Row gutter={[24, 24]}>
              {activeStreams.map(stream => (
                <Col xs={24} sm={12} lg={8} xl={6} key={stream._id}>
                  {renderStreamCard(stream, true)}
                </Col>
              ))}
            </Row>
          ) : (
            <Empty
              description={
                <div>
                  <Title level={4}>No Live Streams</Title>
                  <Text type="secondary">
                    There are no live streams at the moment. Check back later or browse upcoming
                    streams!
                  </Text>
                </div>
              }
            />
          )}
        </TabPane>

        <TabPane
          tab={
            <span>
              <ClockCircleOutlined />
              <span>Upcoming ({upcomingStreams.length})</span>
            </span>
          }
          key="upcoming"
        >
          {upcomingStreams.length > 0 ? (
            <Row gutter={[24, 24]}>
              {upcomingStreams.map(stream => (
                <Col xs={24} sm={12} lg={8} xl={6} key={stream._id}>
                  {renderStreamCard(stream, false)}
                </Col>
              ))}
            </Row>
          ) : (
            <Empty
              description={
                <div>
                  <Title level={4}>No Upcoming Streams</Title>
                  <Text type="secondary">
                    No streams are scheduled at the moment. Follow us for updates on new streams!
                  </Text>
                </div>
              }
            />
          )}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default LiveStreamPage;
