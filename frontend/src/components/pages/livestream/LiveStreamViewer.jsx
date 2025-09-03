/**
 * @fileoverview LiveStream Viewer Component
 * @created 2025-01-02
 * @file LiveStreamViewer.jsx
 * @description Viewer interface for watching livestreams
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Statistic,
  Alert,
  Button,
  Avatar,
  Tag,
  Spin,
  Empty,
  Divider,
} from 'antd';
import {
  EyeOutlined,
  MessageOutlined,
  UserOutlined,
  ShopOutlined,
  HeartOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useWebRTC } from '../../../hooks/useWebRTC';
import ChatBox from '../../livestream/ChatBox';
import livestreamService from '../../../services/livestreamService';
import './LiveStreamViewer.css';

const { Title, Text, Paragraph } = Typography;

const LiveStreamViewer = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [hostLeft, setHostLeft] = useState(false);

  const {
    isConnected,
    connectionState,
    error,
    remoteVideoRef,
    viewerCount,
    messages,
    sendChatMessage,
  } = useWebRTC(roomId, 'viewer', user?.id);

  // Load stream data
  useEffect(() => {
    const loadStreamData = async () => {
      try {
        console.log('Loading stream data for roomId:', roomId);
        const response = await livestreamService.getLiveStream(roomId);
        console.log('Stream data response:', response.data);
        setStreamData(response.data.liveStream);
        setIsLive(response.data.isLive);
        setLoading(false);

        // Debug log
        console.log('Stream status:', {
          isActive: response.data.liveStream.isActive,
          status: response.data.liveStream.status,
          isLive: response.data.isLive,
          roomStatus: response.data.roomStatus,
        });
      } catch (error) {
        console.error('Error loading stream data:', error);
        setLoading(false);
        // Don't navigate away, let user see the error
      }
    };

    if (roomId) {
      loadStreamData();
    }
  }, [roomId]);

  // Listen for host disconnect
  useEffect(() => {
    if (connectionState === 'host_disconnected') {
      setHostLeft(true);
      setIsLive(false);
    }
  }, [connectionState]);

  const handleShareStream = () => {
    const streamUrl = `${window.location.origin}/livestream/${roomId}`;
    navigator.clipboard
      .writeText(streamUrl)
      .then(() => {
        message.success('Stream URL copied to clipboard!');
      })
      .catch(() => {
        message.error('Failed to copy URL');
      });
  };

  const handleVisitStore = () => {
    // Navigate to main products page since there's only one shop
    navigate('/listing-page');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <Text>Loading livestream...</Text>
      </div>
    );
  }

  if (!streamData) {
    return (
      <div className="error-container">
        <Empty description="Livestream not found" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={() => navigate('/')}>
            Go Home
          </Button>
        </Empty>
      </div>
    );
  }

  const getConnectionStatusColor = () => {
    if (hostLeft) return 'error';
    switch (connectionState) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'processing';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConnectionStatusText = () => {
    if (hostLeft) return 'Host Disconnected';
    switch (connectionState) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Connecting...';
    }
  };

  return (
    <div className="livestream-viewer">
      <Row gutter={[24, 24]}>
        {/* Main Video Area */}
        <Col xs={24} lg={16}>
          <Card className="video-card">
            {/* Stream Header */}
            <div className="stream-header">
              <div className="stream-info">
                <Title level={3} style={{ margin: 0 }}>
                  {streamData.title}
                </Title>
                <Space style={{ marginTop: '8px' }}>
                  <Avatar src={streamData.hostId?.avatar} icon={<UserOutlined />} size="small" />
                  <Text strong>{streamData.hostId?.username || 'Host'}</Text>
                  <Tag color={getConnectionStatusColor()}>{getConnectionStatusText()}</Tag>
                  {isLive && !hostLeft && <Tag color="red">LIVE</Tag>}
                </Space>
              </div>
              <div className="stream-actions">
                <Space>
                  <Button
                    icon={<ShareAltOutlined />}
                    onClick={handleShareStream}
                    type="default"
                    size="small"
                  >
                    Share
                  </Button>
                  <Button icon={<HeartOutlined />} type="default" size="small">
                    Like
                  </Button>
                </Space>
              </div>
            </div>

            {/* Video Container */}
            <div className="video-container">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                controls
                className="remote-video"
                style={{
                  width: '100%',
                  height: '500px',
                  backgroundColor: '#000',
                  borderRadius: '8px',
                }}
              />
              {(!isLive || hostLeft) && (
                <div className="video-overlay">
                  <div className="overlay-content">
                    {hostLeft ? (
                      <>
                        <Text style={{ color: '#fff', fontSize: '18px' }}>Stream has ended</Text>
                        <Text style={{ color: '#fff', marginTop: '8px' }}>
                          The host has disconnected
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={{ color: '#fff', fontSize: '18px' }}>Stream is not live</Text>
                        <Text style={{ color: '#fff', marginTop: '8px' }}>
                          Waiting for host to start streaming...
                        </Text>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <Alert
                message="Connection Error"
                description={error}
                type="error"
                style={{ marginTop: '16px' }}
                closable
              />
            )}

            {/* Stream Description */}
            {streamData.description && (
              <div className="stream-description">
                <Paragraph>{streamData.description}</Paragraph>
              </div>
            )}
          </Card>

          {/* Stream Statistics */}
          <Card title="Stream Information" className="stats-card">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Viewers"
                  value={viewerCount}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Messages"
                  value={messages.length}
                  prefix={<MessageOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Duration"
                  value={isLive && !hostLeft ? 'Live' : streamData.formattedDuration || '0m'}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Status"
                  value={streamData.status}
                  valueStyle={{
                    color: streamData.status === 'live' ? '#52c41a' : '#8c8c8c',
                  }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          {/* Shop Information */}
          <Card className="store-card" style={{ marginBottom: '16px', height: '67vh' }}>
            <div className="store-info">
              <Space>
                <Avatar icon={<ShopOutlined />} size="large" />
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    Kicks Shoes Store
                  </Title>
                  <Text type="secondary">Premium Footwear Collection</Text>
                </div>
              </Space>
              <Button
                type="default"
                onClick={handleVisitStore}
                style={{ marginTop: '12px', width: '100%' }}
              >
                Shop Now
              </Button>
            </div>
          </Card>

          {/* Featured Products */}
          {streamData.featuredProducts && streamData.featuredProducts.length > 0 && (
            <Card
              title="Featured Products"
              className="products-card"
              style={{ marginBottom: '16px' }}
            >
              <div className="featured-products">
                {streamData.featuredProducts.map(item => (
                  <div key={item._id} className="product-item">
                    <Space>
                      {item.productId?.images?.[0] && (
                        <img
                          src={item.productId.images[0]}
                          alt={item.productId.name}
                          className="product-image"
                        />
                      )}
                      <div>
                        <Text strong>{item.productId?.name || 'Product'}</Text>
                        <br />
                        <Text type="secondary">${item.productId?.price || 'N/A'}</Text>
                      </div>
                    </Space>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Live Chat */}
          <ChatBox
            messages={messages}
            onSendMessage={sendChatMessage}
            disabled={!isConnected || !user}
            className="viewer-chat"
          />

          {!user && (
            <Alert
              message="Sign in to participate in chat"
              type="info"
              style={{ marginTop: '12px' }}
              action={
                <Button type="primary" size="small" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
              }
            />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default LiveStreamViewer;
