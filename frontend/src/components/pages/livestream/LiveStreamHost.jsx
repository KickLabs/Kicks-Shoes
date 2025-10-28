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
  Input,
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  EyeOutlined,
  MessageOutlined,
  SettingOutlined,
  ProductOutlined,
  ShareAltOutlined,
  PushpinOutlined,
  PushpinFilled,
  CloseOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useWebRTC } from '../../../hooks/useWebRTC';
import PotentialOrdersPanel from './PotentialOrdersPanel';
import livestreamService from '../../../services/livestreamService';
import BotMessage from './BotMessage';
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
  const [searchText, setSearchText] = useState('');

  const {
    isConnected,
    connectionState,
    error,
    localVideoRef,
    viewerCount,
    messages,
    pinnedMessage,
    botReplies,
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
        try {
          const productsResponse = await livestreamService.getStoreProducts();
          console.log('Products loaded:', productsResponse);
          // Handle both array response and object with products array
          const productsList = Array.isArray(productsResponse)
            ? productsResponse
            : productsResponse.data?.products || productsResponse.products || [];
          setProducts(productsList);
        } catch (error) {
          console.error('Error loading products:', error);
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

  // Auto-start camera if stream is already live when page loads
  useEffect(() => {
    const maybeStartCamera = async () => {
      if (isLive && isConnected) {
        try {
          await startCamera();
        } catch (e) {
          console.error('Auto-start camera failed:', e);
          message.error('Cannot access camera/microphone. Please check permissions.');
        }
      }
    };

    maybeStartCamera();
  }, [isLive, isConnected, startCamera]);

  // If connection becomes ready later, try starting the camera once
  useEffect(() => {
    if (!isLive && isConnected && connectionState === 'connected') {
      // no-op; wait for user to click Start Streaming
      return;
    }
    if (isLive && isConnected && connectionState !== 'camera_ready') {
      startCamera().catch(err => {
        console.error('Retry start camera failed:', err);
      });
    }
  }, [connectionState, isConnected, isLive, startCamera]);

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
  const handleFeatureProduct = async productId => {
    if (!productId) {
      message.warning('Please select a product to feature');
      return;
    }

    try {
      console.log('Featuring product:', productId);
      const response = await livestreamService.addFeaturedProduct(roomId, productId);
      console.log('Feature product response:', response);

      const productData = products.find(p => p._id === productId);
      featureProduct(productData || { _id: productId, name: 'Selected Product' });
      message.success('Product featured successfully');

      // Reload stream data to get updated featured products
      const streamResponse = await livestreamService.getLiveStream(roomId);
      setStreamData(streamResponse.data.liveStream);
    } catch (error) {
      console.error('Error featuring product:', error);
      console.error('Error details:', error.response?.data);
      const errorMsg = error.response?.data?.message || 'Failed to feature product';
      message.error(errorMsg);
    }
  };

  // Filter products based on search text
  const filteredProducts = products.filter(
    product =>
      product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchText.toLowerCase()))
  );

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

  // Handle pin product
  const handlePinProduct = async productId => {
    console.log('Pinning product with ID:', productId);
    if (!productId) {
      message.error('Invalid product ID');
      return;
    }

    try {
      const response = await livestreamService.togglePinProduct(roomId, productId);
      console.log('Pin response:', response);
      message.success('Product pin status updated');

      // Reload stream data
      const streamResponse = await livestreamService.getLiveStream(roomId);
      console.log('Updated stream data:', streamResponse.data.liveStream);
      setStreamData(streamResponse.data.liveStream);
    } catch (error) {
      console.error('Error pinning product:', error);
      console.error('Error details:', error.response?.data);
      message.error(error.response?.data?.message || 'Failed to update pin status');
    }
  };

  // Handle pin/unpin message
  const handlePinMessage = async messageItem => {
    if (!messageItem || !messageItem._id) {
      message.error('Invalid message');
      return;
    }

    try {
      const response = await livestreamService.togglePinMessage(roomId, messageItem._id);
      if (response.data.isPinned) {
        message.success('Message pinned to top');
      } else {
        message.success('Message unpinned');
      }
    } catch (error) {
      console.error('Error pinning message:', error);
      message.error(error.response?.data?.message || 'Failed to pin message');
    }
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

            {/* Pinned Message */}
            {pinnedMessage && (
              <div
                style={{
                  background: '#fffbf0',
                  border: '1px solid #ffd666',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  margin: '8px 12px',
                  position: 'relative',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}
                >
                  <PushpinFilled style={{ color: '#faad14', fontSize: '14px' }} />
                  <span style={{ fontWeight: 600, fontSize: '12px', color: '#ad8b00' }}>
                    Pinned Message
                  </span>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => handlePinMessage(pinnedMessage)}
                    style={{ marginLeft: 'auto', fontSize: '12px' }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: '#595959' }}>
                  <strong>{pinnedMessage.senderId?.username || 'Anonymous'}</strong>:{' '}
                  {pinnedMessage.content}
                </div>
              </div>
            )}

            <div className="chat-messages">
              {messages.length === 0 && botReplies.length === 0 ? (
                <div className="empty-chat">No messages yet</div>
              ) : (
                <>
                  {/* Regular messages */}
                  {messages.map((messageItem, index) => (
                    <div key={`msg-${index}`} className="chat-message-item">
                      <div className="chat-user">
                        <div className="chat-user-left">
                          <strong>{messageItem.senderId?.username || 'Anonymous'}</strong>
                          {messageItem.senderRole === 'host' && (
                            <span className="chat-role-tag chat-role-host">Host</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="chat-time">
                            {new Date(messageItem.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {messageItem.senderRole !== 'system' && (
                            <Button
                              type="text"
                              size="small"
                              icon={<PushpinOutlined />}
                              onClick={() => handlePinMessage(messageItem)}
                              style={{ padding: '0 4px', fontSize: '12px' }}
                              title="Pin this message"
                            />
                          )}
                        </div>
                      </div>
                      <div className="chat-text">{messageItem.content}</div>
                    </div>
                  ))}

                  {/* Bot replies */}
                  {botReplies.map((botReply, index) => (
                    <BotMessage
                      key={`bot-${index}`}
                      originalMessage={botReply.originalMessage}
                      answer={botReply.answer}
                      timestamp={botReply.timestamp}
                    />
                  ))}
                </>
              )}
            </div>
            <div className="chat-input-section">
              <input
                type="text"
                placeholder={!isConnected ? 'Chat is disabled' : 'Type your message...'}
                disabled={!isConnected}
                className="chat-input"
                style={{ width: '90%' }}
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
        onCancel={() => {
          setFeatureModalVisible(false);
          setSearchText('');
          setSelectedProduct(null);
        }}
        footer={null}
        width={900}
      >
        <div style={{ padding: '10px 0' }}>
          {/* Search Bar */}
          <Input
            placeholder="Search products by name or description..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            size="large"
            style={{ marginBottom: '20px' }}
            allowClear
            prefix={<ProductOutlined style={{ color: '#bfbfbf' }} />}
          />

          {/* Products Grid */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ marginBottom: '12px', color: '#262626' }}>
              Available Products ({filteredProducts.length})
            </h4>
            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                paddingRight: '8px',
              }}
            >
              {filteredProducts.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#999',
                    background: '#fafafa',
                    borderRadius: '8px',
                  }}
                >
                  <ProductOutlined
                    style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}
                  />
                  <div>No products found</div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {filteredProducts.map(product => {
                    const isAlreadyFeatured = streamData?.featuredProducts?.some(
                      fp => fp.productId?._id === product._id
                    );

                    // Get product image (mainImage, first colorVariant image, first inventory image, or fallback)
                    const getProductImage = () => {
                      if (product.mainImage) return product.mainImage;
                      if (
                        product.colorVariants &&
                        product.colorVariants.length > 0 &&
                        product.colorVariants[0].images &&
                        product.colorVariants[0].images.length > 0
                      ) {
                        return product.colorVariants[0].images[0];
                      }
                      if (
                        product.inventory &&
                        product.inventory.length > 0 &&
                        product.inventory[0].images &&
                        product.inventory[0].images.length > 0
                      ) {
                        return product.inventory[0].images[0];
                      }
                      return null;
                    };

                    // Format price - always return a string
                    const formatPrice = price => {
                      if (typeof price === 'object' && price !== null && price.regular) {
                        return price.regular.toLocaleString('en-US');
                      }
                      if (typeof price === 'number') {
                        return price.toLocaleString('en-US');
                      }
                      return '0';
                    };

                    const imageUrl = getProductImage();

                    return (
                      <div
                        key={product._id}
                        style={{
                          border: '1px solid #e8e8e8',
                          borderRadius: '8px',
                          padding: '16px',
                          background: '#fff',
                          cursor: isLive && !isAlreadyFeatured ? 'pointer' : 'not-allowed',
                          transition: 'all 0.3s',
                          opacity: isAlreadyFeatured ? 0.6 : 1,
                          position: 'relative',
                        }}
                        onClick={() => {
                          if (isLive && !isAlreadyFeatured) {
                            handleFeatureProduct(product._id);
                          }
                        }}
                        onMouseEnter={e => {
                          if (isLive && !isAlreadyFeatured) {
                            e.currentTarget.style.borderColor = '#1890ff';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(24,144,255,0.2)';
                          }
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#e8e8e8';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {isAlreadyFeatured && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: '#52c41a',
                              color: '#fff',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 500,
                            }}
                          >
                            Featured
                          </div>
                        )}
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            style={{
                              width: '100%',
                              height: '150px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              marginBottom: '12px',
                            }}
                            onError={e => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            width: '100%',
                            height: '150px',
                            background: '#f5f5f5',
                            borderRadius: '6px',
                            marginBottom: '12px',
                            display: imageUrl ? 'none' : 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ProductOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>
                          {product.name}
                        </div>
                        {product.description && (
                          <div
                            style={{
                              fontSize: '13px',
                              color: '#666',
                              marginBottom: '10px',
                              height: '36px',
                              overflow: 'hidden',
                              lineHeight: '18px',
                            }}
                          >
                            {product.description.substring(0, 60)}
                            {product.description.length > 60 ? '...' : ''}
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '8px',
                          }}
                        >
                          <span style={{ fontSize: '18px', fontWeight: 700, color: '#1890ff' }}>
                            {formatPrice(product.price)}đ
                          </span>
                          {!isAlreadyFeatured && isLive && (
                            <Button type="link" size="small" style={{ padding: 0 }}>
                              Feature
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '16px', color: '#262626' }}>
              Currently Featured Products (
              {streamData?.featuredProducts
                ? streamData.featuredProducts.reduce((acc, item) => {
                    const productId = item.productId?._id;
                    if (!productId) return acc;
                    const existingIndex = acc.findIndex(i => i.productId?._id === productId);
                    if (existingIndex === -1) {
                      acc.push(item);
                    } else if (item.isPinned && !acc[existingIndex].isPinned) {
                      acc[existingIndex] = item;
                    }
                    return acc;
                  }, []).length
                : 0}
              ):
            </h4>
            {streamData?.featuredProducts?.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  paddingRight: '8px',
                }}
              >
                {streamData.featuredProducts
                  .reduce((acc, item) => {
                    const productId = item.productId?._id;
                    if (!productId) return acc;

                    // Check if this product already exists
                    const existingIndex = acc.findIndex(i => i.productId?._id === productId);

                    if (existingIndex === -1) {
                      // New product, add it
                      acc.push(item);
                    } else {
                      // Product exists, keep the pinned one if available
                      if (item.isPinned && !acc[existingIndex].isPinned) {
                        acc[existingIndex] = item;
                      }
                    }

                    return acc;
                  }, [])
                  .sort((a, b) => {
                    // Pinned items first: true = 1, false/undefined = 0
                    const aPinned = a.isPinned ? 1 : 0;
                    const bPinned = b.isPinned ? 1 : 0;
                    return bPinned - aPinned;
                  })
                  .map(item => (
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
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px',
                          }}
                        >
                          <strong style={{ color: '#262626' }}>
                            {item.productId?.name || 'Product'}
                          </strong>
                          {item.isPinned && (
                            <Tag color="gold" style={{ margin: 0, fontSize: '11px' }}>
                              <PushpinFilled /> Pinned
                            </Tag>
                          )}
                        </div>
                        {item.productId?.price && (
                          <div style={{ color: '#666', fontSize: '14px' }}>
                            {typeof item.productId.price === 'object' &&
                            item.productId.price.regular
                              ? `${item.productId.price.regular.toLocaleString('en-US')}đ`
                              : typeof item.productId.price === 'number'
                                ? `${item.productId.price.toLocaleString('en-US')}đ`
                                : '0đ'}
                          </div>
                        )}
                      </div>
                      <Space size="small">
                        <Button
                          size="small"
                          icon={item.isPinned ? <PushpinFilled /> : <PushpinOutlined />}
                          type={item.isPinned ? 'primary' : 'default'}
                          onClick={() => {
                            console.log('Pin button clicked for item:', item);
                            console.log('Product ID:', item.productId?._id);
                            handlePinProduct(item.productId?._id);
                          }}
                          title={item.isPinned ? 'Unpin product' : 'Pin product'}
                        />
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
                      </Space>
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
