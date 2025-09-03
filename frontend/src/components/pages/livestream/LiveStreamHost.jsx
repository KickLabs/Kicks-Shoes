/**
 * @fileoverview LiveStream Host Component
 * @created 2025-01-02
 * @file LiveStreamHost.jsx
 * @description Host interface for managing livestream broadcasts
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Space,
  Statistic,
  Alert,
  Modal,
  message,
  Spin,
  Tag,
  Select,
  Divider,
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  EyeOutlined,
  MessageOutlined,
  SettingOutlined,
  ProductOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useWebRTC } from '../../../hooks/useWebRTC';
import ChatBox from '../../livestream/ChatBox';
import livestreamService from '../../../services/livestreamService';
import './LiveStreamHost.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const LiveStreamHost = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const {
    isConnected,
    connectionState,
    error,
    localVideoRef,
    viewerCount,
    messages,
    startCamera,
    stopCamera,
    sendChatMessage,
    featureProduct,
  } = useWebRTC(roomId, 'host', user?.id);

  // Load stream data
  useEffect(() => {
    const loadStreamData = async () => {
      try {
        const response = await livestreamService.getLiveStream(roomId);
        setStreamData(response.data.liveStream);
        setIsLive(response.data.isLive);
        setLoading(false);

        // Load featured products
        setProducts(response.data.liveStream.featuredProducts || []);
      } catch (error) {
        console.error('Error loading stream data:', error);
        message.error('Failed to load livestream data');
        navigate('/shop/dashboard');
      }
    };

    if (roomId) {
      loadStreamData();
    }
  }, [roomId, navigate]);

  // Handle start streaming
  const handleStartStreaming = async () => {
    try {
      await startCamera();
      setIsLive(true);
      message.success('Livestream started successfully!');
    } catch (error) {
      console.error('Error starting stream:', error);
      message.error('Failed to start livestream. Please check your camera and microphone.');
    }
  };

  // Handle stop streaming
  const handleStopStreaming = () => {
    Modal.confirm({
      title: 'End Livestream',
      content: 'Are you sure you want to end this livestream? This action cannot be undone.',
      okText: 'End Stream',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await livestreamService.endLiveStream(roomId);
          stopCamera();
          setIsLive(false);
          message.success('Livestream ended successfully');
          navigate('/shop/dashboard');
        } catch (error) {
          console.error('Error ending stream:', error);
          message.error('Failed to end livestream');
        }
      },
    });
  };

  // Handle feature product
  const handleFeatureProduct = async () => {
    if (!selectedProduct) {
      message.warning('Please select a product to feature');
      return;
    }

    try {
      await livestreamService.addFeaturedProduct(roomId, selectedProduct);
      featureProduct({ _id: selectedProduct, name: 'Selected Product' }); // You might want to get full product data
      message.success('Product featured successfully');
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error featuring product:', error);
      message.error('Failed to feature product');
    }
  };

  // Handle share stream
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

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <Text>Loading livestream...</Text>
      </div>
    );
  }

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'success';
      case 'camera_ready':
        return 'processing';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Connected';
      case 'camera_ready':
        return 'Camera Ready';
      case 'error':
        return 'Error';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Connecting...';
    }
  };

  return (
    <div className="livestream-host">
      <Row gutter={[24, 24]}>
        {/* Main Video Area */}
        <Col xs={24} lg={16}>
          <Card className="video-card">
            <div className="video-header">
              <Space>
                <Title level={4} style={{ margin: 0 }}>
                  {streamData?.title}
                </Title>
                <Tag color={getConnectionStatusColor()}>{getConnectionStatusText()}</Tag>
                {isLive && <Tag color="red">LIVE</Tag>}
              </Space>
              <Space>
                <Button
                  icon={<ShareAltOutlined />}
                  onClick={handleShareStream}
                  type="default"
                  size="small"
                >
                  Share
                </Button>
                <Button icon={<SettingOutlined />} type="default" size="small" disabled={isLive}>
                  Settings
                </Button>
              </Space>
            </div>

            <div className="video-container">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="local-video"
                style={{
                  width: '100%',
                  height: '400px',
                  backgroundColor: '#000',
                  borderRadius: '8px',
                }}
              />
              {!isLive && (
                <div className="video-overlay">
                  <div className="overlay-content">
                    <PlayCircleOutlined style={{ fontSize: '48px', color: '#fff' }} />
                    <Text style={{ color: '#fff', marginTop: '16px' }}>
                      Click "Start Streaming" to begin
                    </Text>
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

            <div className="video-controls">
              <Space size="large">
                {!isLive ? (
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    onClick={handleStartStreaming}
                    disabled={!isConnected}
                    loading={connectionState === 'connecting'}
                  >
                    Start Streaming
                  </Button>
                ) : (
                  <Button danger size="large" icon={<StopOutlined />} onClick={handleStopStreaming}>
                    End Stream
                  </Button>
                )}
              </Space>
            </div>
          </Card>

          {/* Stream Statistics */}
          <Card title="Stream Statistics" className="stats-card">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Live Viewers"
                  value={viewerCount}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total Messages"
                  value={messages.length}
                  prefix={<MessageOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Duration"
                  value={isLive ? 'Live' : '0m'}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          {/* Product Management */}
          <Card title="Feature Products" className="product-card" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                placeholder="Select a product to feature"
                style={{ width: '100%' }}
                value={selectedProduct}
                onChange={setSelectedProduct}
                disabled={!isLive}
              >
                {products.map(product => (
                  <Option key={product._id} value={product._id}>
                    {product.name}
                  </Option>
                ))}
              </Select>
              <Button
                type="primary"
                icon={<ProductOutlined />}
                onClick={handleFeatureProduct}
                disabled={!selectedProduct || !isLive}
                block
              >
                Feature Product
              </Button>
            </Space>

            <Divider />

            <div className="featured-products">
              <Text strong>Currently Featured:</Text>
              {streamData?.featuredProducts?.length > 0 ? (
                <div className="featured-list">
                  {streamData.featuredProducts.map(item => (
                    <div key={item._id} className="featured-item">
                      <Text>{item.productId?.name || 'Product'}</Text>
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="secondary">No products featured yet</Text>
              )}
            </div>
          </Card>

          {/* Live Chat */}
          <ChatBox
            messages={messages}
            onSendMessage={sendChatMessage}
            disabled={!isConnected}
            className="host-chat"
          />
        </Col>
      </Row>
    </div>
  );
};

export default LiveStreamHost;
