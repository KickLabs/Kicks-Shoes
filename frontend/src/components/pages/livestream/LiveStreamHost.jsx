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
import PotentialOrdersPanel from './PotentialOrdersPanel';
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
  const [featureModalVisible, setFeatureModalVisible] = useState(false);

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
    socket,
  } = useWebRTC(roomId, 'host', user?.id);

  // Load stream data
  useEffect(() => {
    const loadStreamData = async () => {
      try {
        const response = await livestreamService.getLiveStream(roomId);
        setStreamData(response.data.liveStream);
        setIsLive(response.data.isLive);
        setLoading(false);

        // Load products from store
        if (user?.storeId) {
          try {
            const productsResponse = await livestreamService.getStoreProducts(user.storeId);
            setProducts(productsResponse.data.products || []);
          } catch (error) {
            console.error('Error loading products:', error);
          }
        }
      } catch (error) {
        console.error('Error loading stream data:', error);
        message.error('Failed to load livestream data');
        navigate('/shop/dashboard');
      }
    };

    if (roomId && user) {
      loadStreamData();
    }
  }, [roomId, navigate, user]);

  // Handle start streaming
  const handleStartStreaming = async () => {
    try {
      await startCamera();

      // Update stream status in database
      await livestreamService.updateLiveStream(roomId, {
        status: 'live',
        isActive: true,
        startedAt: new Date().toISOString(),
      });

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
      {/* Professional Header */}
      <div className="livestream-header">
        <div className="header-left">
          <Button onClick={() => navigate('/shop/livestream')} className="back-button">
            ← Back to Livestream
          </Button>
        </div>
        <div className="header-center">
          <span className="stream-title">{streamData?.title || 'Livestream Host'}</span>
          {isLive && <span className="live-indicator">LIVE</span>}
        </div>
        <div className="header-right">
          <Space>
            <Button icon={<ShareAltOutlined />} size="small" onClick={handleShareStream}>
              Share
            </Button>
            <Button icon={<SettingOutlined />} size="small" disabled={isLive}>
              Settings
            </Button>
          </Space>
        </div>
      </div>

      {/* Main Content */}
      <div className="livestream-content">
        {/* Video Section */}
        <div className="video-section">
          <div className="video-container">
            <video ref={localVideoRef} autoPlay muted playsInline className="local-video" />
            {!isLive && (
              <div className="video-overlay">
                <PlayCircleOutlined className="video-overlay-icon" />
                <span className="video-overlay-text">Click "Start Streaming" to begin</span>
              </div>
            )}
          </div>

          {error && <Alert message="Connection Error" description={error} type="error" closable />}

          <div className="video-controls">
            {!isLive ? (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleStartStreaming}
                disabled={!isConnected}
                loading={connectionState === 'connecting'}
              >
                Start Streaming
              </Button>
            ) : (
              <Button danger icon={<StopOutlined />} onClick={handleStopStreaming}>
                End Stream
              </Button>
            )}
            <Button
              icon={<ProductOutlined />}
              onClick={() => setFeatureModalVisible(true)}
              disabled={!isLive}
            >
              Feature Products
            </Button>
          </div>

          {/* Statistics */}
          <div className="stats-section">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{viewerCount}</div>
                <div className="stat-label">Live Viewers</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{messages.length}</div>
                <div className="stat-label">Messages</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{isLive ? 'Live' : '0m'}</div>
                <div className="stat-label">Duration</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar-section">
          {/* Potential Orders Panel */}
          <PotentialOrdersPanel streamId={roomId} socket={socket} />

          {/* Live Chat */}
          <div className="chat-section">
            <div className="chat-header">Live Chat</div>
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="empty-chat">No messages yet</div>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className="chat-message-item">
                    <div className="chat-user">
                      <div className="chat-user-left">
                        <strong>{message.senderId?.username || 'Anonymous'}</strong>
                        {message.senderRole === 'host' && (
                          <span className="chat-role-tag chat-role-host">Host</span>
                        )}
                      </div>
                      <span className="chat-time">
                        {new Date(message.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="chat-text">{message.content}</div>
                  </div>
                ))
              )}
            </div>
            <div className="chat-input-section">
              <input
                type="text"
                placeholder={!isConnected ? 'Chat is disabled' : 'Type your message...'}
                disabled={!isConnected}
                className="chat-input"
                onKeyPress={e => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    sendChatMessage(e.target.value.trim());
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Products Modal */}
      <Modal
        title="Feature Products"
        open={featureModalVisible}
        onCancel={() => setFeatureModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: '20px' }}>
            <Select
              placeholder="Select a product to feature"
              style={{ width: '100%', marginBottom: '12px' }}
              value={selectedProduct}
              onChange={setSelectedProduct}
              disabled={!isLive}
              size="large"
            >
              {products.map(product => (
                <Option key={product._id} value={product._id}>
                  {product.name} - ${product.price}
                </Option>
              ))}
            </Select>

            <Button
              type="primary"
              icon={<ProductOutlined />}
              onClick={() => {
                handleFeatureProduct();
                setFeatureModalVisible(false);
              }}
              disabled={!selectedProduct || !isLive}
              size="large"
              block
            >
              Feature Selected Product
            </Button>
          </div>

          <div>
            <h4 style={{ marginBottom: '16px', color: '#262626' }}>Currently Featured Products:</h4>
            {streamData?.featuredProducts?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {streamData.featuredProducts.map(item => (
                  <div
                    key={item._id}
                    style={{
                      padding: '12px 16px',
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px solid #e8e8e8',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#262626' }}>
                        {item.productId?.name || 'Product'}
                      </strong>
                      {item.productId?.price && (
                        <div style={{ color: '#666', fontSize: '14px' }}>
                          ${item.productId.price}
                        </div>
                      )}
                    </div>
                    <Button
                      size="small"
                      danger
                      onClick={() => {
                        // Handle remove featured product
                        console.log('Remove featured product:', item._id);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  color: '#999',
                  fontSize: '14px',
                  padding: '40px',
                  background: '#fafafa',
                  borderRadius: '6px',
                }}
              >
                No products featured yet
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LiveStreamHost;
