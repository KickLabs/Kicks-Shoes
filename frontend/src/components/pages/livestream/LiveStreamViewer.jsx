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
  Modal,
} from 'antd';
import {
  EyeOutlined,
  MessageOutlined,
  UserOutlined,
  ShopOutlined,
  HeartOutlined,
  ShareAltOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useWebRTC } from '../../../hooks/useWebRTC';
import livestreamService from '../../../services/livestreamService';
import axiosInstance from '../../../services/axiosInstance';
import { message as antMessage } from 'antd';
import BotMessage from './BotMessage';
import PersonalNotification from './PersonalNotification';
import LivestreamDebugOverlay from './LivestreamDebugOverlay';
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
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showAllProductsModal, setShowAllProductsModal] = useState(false);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const {
    isConnected,
    connectionState,
    error,
    remoteVideoRef,
    viewerCount,
    messages,
    pinnedMessage,
    botReplies,
    personalNotification,
    sendChatMessage,
    remoteStream,
    retryConnection,
    dismissNotification,
    socket,
  } = useWebRTC(roomId, 'viewer', user?.id);

  // Load stream data
  useEffect(() => {
    const loadStreamData = async () => {
      try {
        console.log('Loading stream data for roomId:', roomId);
        const response = await livestreamService.getLiveStream(roomId);
        console.log('Stream data response:', response.data);
        console.log('Featured products:', response.data.liveStream?.featuredProducts);
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

    // Poll for updates every 30 seconds to get featured products
    const interval = setInterval(() => {
      if (roomId && isLive) {
        loadStreamData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [roomId, isLive]);

  // Listen for host disconnect
  useEffect(() => {
    if (connectionState === 'host_disconnected') {
      setHostLeft(true);
      setIsLive(false);
    }
  }, [connectionState]);

  // Force play video when remote stream is available
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('🎬 Remote stream detected, forcing video play');
      const video = remoteVideoRef.current;

      // Check if video is already playing
      if (!video.paused && video.readyState >= 2) {
        console.log('✅ Video is already playing');
        return;
      }

      // Multiple attempts to ensure video plays
      const attemptPlay = (attempt = 1) => {
        console.log(`🎬 Attempt ${attempt}: Playing video`);

        // Ensure video is muted for autoplay
        video.muted = true;

        // Check video state
        console.log('📹 Video state:', {
          paused: video.paused,
          readyState: video.readyState,
          networkState: video.networkState,
          currentTime: video.currentTime,
          duration: video.duration,
          srcObject: !!video.srcObject,
        });

        video
          .play()
          .then(() => {
            console.log(`✅ Video play successful on attempt ${attempt}`);
            // Check if video is actually playing
            setTimeout(() => {
              console.log('📹 Post-play state:', {
                paused: video.paused,
                currentTime: video.currentTime,
                readyState: video.readyState,
              });
            }, 100);
          })
          .catch(err => {
            console.warn(`⚠️ Play attempt ${attempt} failed:`, err?.message || err);
            if (attempt < 5) {
              setTimeout(() => attemptPlay(attempt + 1), 1000 * attempt);
            } else {
              console.error('❌ All play attempts failed, video may need user interaction');
            }
          });
      };

      // Wait a bit for stream to be ready
      setTimeout(() => {
        attemptPlay();
      }, 500);
    }
  }, [remoteStream]);

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

  // Handle product click - open add to cart modal
  const handleProductClick = async product => {
    if (!user) {
      antMessage.warning('Please login to add products to cart');
      navigate('/login');
      return;
    }

    // Fetch full product details to get variants
    try {
      const response = await axiosInstance.get(`/products/public/${product._id}`);
      const fullProduct = response.data.data;
      console.log('Full product data:', fullProduct);
      setSelectedProduct(fullProduct);
      setSelectedSize(null);
      setSelectedColor(null);
      setQuantity(1);
      setShowAddToCartModal(true);
    } catch (error) {
      console.error('Error fetching product details:', error);
      antMessage.error('Failed to load product details');
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    if (!selectedSize) {
      antMessage.error('Please select a size');
      return;
    }
    if (!selectedColor) {
      antMessage.error('Please select a color');
      return;
    }

    try {
      setAddingToCart(true);
      const price =
        selectedProduct.price && typeof selectedProduct.price === 'object'
          ? selectedProduct.price.regular
          : selectedProduct.price || 0;

      const cartItem = {
        product: selectedProduct._id,
        quantity: quantity,
        size: selectedSize,
        color: selectedColor,
        price: price,
      };

      await axiosInstance.post('/cart', cartItem);
      antMessage.success('Added to cart successfully!');
      setShowAddToCartModal(false);
    } catch (error) {
      console.error('Error adding to cart:', error);
      antMessage.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
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
    <div className="viewer-container">
      {/* Professional Header */}
      <div className="viewer-header">
        <div className="viewer-header-content">
          <div className="viewer-stream-info">
            <h1 className="viewer-stream-title">{streamData.title}</h1>
            <div className="viewer-stream-meta">
              <div className="viewer-host-info">
                <Avatar src={streamData.hostId?.avatar} icon={<UserOutlined />} size="small" />
                <span className="viewer-host-name">{streamData.hostId?.username || 'Host'}</span>
              </div>
              <div className="viewer-status-tags">
                <span className={`viewer-connection-status ${getConnectionStatusColor()}`}>
                  {getConnectionStatusText()}
                </span>
                {isLive && !hostLeft && <span className="viewer-live-badge">LIVE</span>}
              </div>
              <div className="viewer-count">
                <EyeOutlined />
                <span>{viewerCount} viewers</span>
              </div>
            </div>
          </div>
          <div className="viewer-header-actions">
            <Button
              icon={<ShareAltOutlined />}
              onClick={handleShareStream}
              size="small"
              className="viewer-action-btn"
            >
              Share
            </Button>
            <Button icon={<HeartOutlined />} size="small" className="viewer-action-btn">
              Like
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="viewer-content">
        {/* Video Section */}
        <div className="viewer-video-section">
          <div className="viewer-video-container">
            <video
              ref={remoteVideoRef}
              autoPlay
              muted
              playsInline
              controls
              className="viewer-remote-video"
              onLoadStart={() => console.log('📹 Video load started')}
              onLoadedMetadata={() => console.log('📹 Video metadata loaded')}
              onCanPlay={() => {
                console.log('📹 Video can play');
                setVideoPlaying(true);
              }}
              onPlay={() => {
                console.log('📹 Video started playing');
                setVideoPlaying(true);
              }}
              onPause={() => {
                console.log('📹 Video paused');
                setVideoPlaying(false);
              }}
              onError={e => {
                console.error('📹 Video error:', e);
                setVideoPlaying(false);
              }}
              onWaiting={() => {
                console.log('📹 Video waiting for data');
                setVideoPlaying(false);
              }}
              onPlaying={() => {
                console.log('📹 Video is playing');
                setVideoPlaying(true);
              }}
            />
            {(!isLive || hostLeft) && (
              <div className="viewer-video-overlay">
                <div className="viewer-overlay-content">
                  {hostLeft ? (
                    <>
                      <span className="viewer-overlay-title">Stream has ended</span>
                      <span className="viewer-overlay-subtitle">The host has disconnected</span>
                    </>
                  ) : (
                    <>
                      <span className="viewer-overlay-title">Stream is not live</span>
                      <span className="viewer-overlay-subtitle">
                        Waiting for host to start streaming...
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
            {isLive && !hostLeft && !videoPlaying && (
              <div className="viewer-video-overlay">
                <div className="viewer-overlay-content">
                  <span className="viewer-overlay-title">Connecting to stream...</span>
                  <span className="viewer-overlay-subtitle">Video is loading, please wait</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <Alert
              message="Connection Error"
              description={
                <div>
                  <p>{error}</p>
                  <Button
                    type="primary"
                    size="small"
                    onClick={retryConnection}
                    style={{ marginTop: '8px' }}
                  >
                    Retry Connection
                  </Button>
                </div>
              }
              type="error"
              className="viewer-error-alert"
              closable
            />
          )}

          {/* Stream Description */}
          {streamData.description && (
            <div className="viewer-stream-description">
              <p>{streamData.description}</p>
            </div>
          )}

          {/* Stream Statistics */}
          <div className="viewer-stats-section">
            <div className="viewer-stats-grid">
              <div className="viewer-stat-item">
                <div className="viewer-stat-value">{viewerCount}</div>
                <div className="viewer-stat-label">Viewers</div>
              </div>
              <div className="viewer-stat-item">
                <div className="viewer-stat-value">{messages.length}</div>
                <div className="viewer-stat-label">Messages</div>
              </div>
              <div className="viewer-stat-item">
                <div className="viewer-stat-value">
                  {isLive && !hostLeft ? 'Live' : streamData.formattedDuration || '0m'}
                </div>
                <div className="viewer-stat-label">Duration</div>
              </div>
              <div className="viewer-stat-item">
                <div className="viewer-stat-value">{streamData.status}</div>
                <div className="viewer-stat-label">Status</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="viewer-sidebar">
          {/* Shop Information
          <div className="viewer-shop-card">
            <div className="viewer-shop-header">
              <Avatar src="images/logoavt.png" size="large" />
              <div className="viewer-shop-info">
                <h3 className="viewer-shop-name">Kicks Shoes Store</h3>
                <span className="viewer-shop-description">Premium Footwear Collection</span>
              </div>
            </div>
            <Button type="default" onClick={handleVisitStore} className="viewer-shop-btn">
              Shop Now
            </Button>
          </div> */}

          {/* Featured Products */}
          <div className="viewer-products-card">
            <div className="viewer-products-header">
              <span>Featured Products</span>
              <Space size="small">
                <Button
                  size="small"
                  icon={<AppstoreOutlined />}
                  onClick={() => setShowAllProductsModal(true)}
                >
                  View All
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    const loadStreamData = async () => {
                      try {
                        const response = await livestreamService.getLiveStream(roomId);
                        setStreamData(response.data.liveStream);
                        console.log(
                          'Refreshed featured products:',
                          response.data.liveStream?.featuredProducts
                        );
                      } catch (error) {
                        console.error('Error refreshing:', error);
                      }
                    };
                    loadStreamData();
                  }}
                >
                  Refresh
                </Button>
              </Space>
            </div>
            <div className="viewer-products-list">
              {streamData?.featuredProducts && streamData.featuredProducts.length > 0 ? (
                streamData.featuredProducts
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
                    <div key={item._id} className="viewer-product-item">
                      <div className="viewer-product-content">
                        {item.productId?.images?.[0] && (
                          <img
                            src={item.productId.images[0]}
                            alt={item.productId.name}
                            className="viewer-product-image"
                          />
                        )}
                        <div className="viewer-product-details">
                          <div className="viewer-product-name">
                            {item.productId?.name || 'Product'}
                            {item.isPinned && (
                              <Tag
                                color="gold"
                                style={{ marginLeft: '6px', fontSize: '10px', padding: '0 4px' }}
                              >
                                Pinned
                              </Tag>
                            )}
                          </div>
                          <div className="viewer-product-price">
                            {item.productId?.price
                              ? typeof item.productId.price === 'object' &&
                                item.productId.price.regular
                                ? `${item.productId.price.regular.toLocaleString('en-US')}đ`
                                : typeof item.productId.price === 'number'
                                  ? `${item.productId.price.toLocaleString('en-US')}đ`
                                  : 'N/A'
                              : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="viewer-empty-products">
                  <span>No featured products yet</span>
                  {/* <small style={{ display: 'block', marginTop: '4px', color: '#999' }}>
                    Waiting for host to feature products during the livestream...
                  </small> */}
                </div>
              )}
            </div>
          </div>

          {/* Live Chat */}
          <div className="viewer-chat-section">
            <div className="viewer-chat-header">Live Chat</div>

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
                  <Tag color="gold" style={{ margin: 0, fontSize: '11px' }}>
                    📌 Pinned
                  </Tag>
                </div>
                <div style={{ fontSize: '12px', color: '#595959' }}>
                  <strong>{pinnedMessage.senderId?.username || 'Anonymous'}</strong>:{' '}
                  {pinnedMessage.content}
                </div>
              </div>
            )}

            <div className="viewer-chat-messages">
              {messages.length === 0 && botReplies.length === 0 ? (
                <div className="viewer-empty-chat">No messages yet</div>
              ) : (
                <>
                  {/* Regular messages */}
                  {messages.map((message, index) => (
                    <div key={`msg-${index}`} className="viewer-chat-message">
                      <div className="viewer-chat-user">
                        <div className="viewer-chat-user-left">
                          <strong>{message.senderId?.username || 'Anonymous'}</strong>
                          {message.senderRole === 'host' && (
                            <span className="viewer-role-tag viewer-role-host">Host</span>
                          )}
                        </div>
                        <span className="viewer-chat-time">
                          {new Date(message.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="viewer-chat-text">{message.content}</div>
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
            <div className="viewer-chat-input-section">
              <input
                type="text"
                placeholder={!isConnected || !user ? 'Sign in to chat' : 'Type your message...'}
                disabled={!isConnected || !user}
                className="viewer-chat-input"
                onKeyPress={e => {
                  if (e.key === 'Enter' && e.target.value.trim() && user) {
                    sendChatMessage(e.target.value.trim());
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>

          {!user && (
            <div className="viewer-signin-alert">
              <span>Sign in to participate in chat</span>
              <Button type="primary" size="small" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Personal Bot Notification */}
      {personalNotification && (
        <PersonalNotification
          question={personalNotification.question}
          answer={personalNotification.answer}
          onDismiss={dismissNotification}
          onViewInChat={() => {
            // Scroll to chat section
            document.querySelector('.viewer-chat-messages')?.scrollTo({
              top: document.querySelector('.viewer-chat-messages').scrollHeight,
              behavior: 'smooth',
            });
            dismissNotification();
          }}
        />
      )}

      {/* All Featured Products Modal */}
      <Modal
        title={`All Featured Products (${
          streamData?.featuredProducts
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
            : 0
        })`}
        open={showAllProductsModal}
        onCancel={() => setShowAllProductsModal(false)}
        footer={null}
        width={900}
      >
        <div style={{ padding: '10px 0' }}>
          {streamData?.featuredProducts && streamData.featuredProducts.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '16px',
                maxHeight: '600px',
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
                .map(item => {
                  const product = item.productId;
                  if (!product) return null;

                  // Get product image - try multiple sources
                  const getProductImage = () => {
                    console.log('Product image sources:', {
                      name: product.name,
                      mainImage: product.mainImage,
                      colorVariants: product.colorVariants,
                      inventory: product.inventory,
                      images: product.images,
                    });

                    // Try mainImage first
                    if (product.mainImage) return product.mainImage;

                    // Try colorVariants
                    if (product.colorVariants && product.colorVariants.length > 0) {
                      const firstVariant = product.colorVariants[0];
                      if (firstVariant.colorMainImage) return firstVariant.colorMainImage;
                      if (firstVariant.images && firstVariant.images.length > 0) {
                        return firstVariant.images[0];
                      }
                    }

                    // Try inventory
                    if (product.inventory && product.inventory.length > 0) {
                      const firstInventory = product.inventory[0];
                      if (firstInventory.images && firstInventory.images.length > 0) {
                        return firstInventory.images[0];
                      }
                    }

                    // Try images array (legacy)
                    if (product.images && product.images.length > 0) {
                      return product.images[0];
                    }

                    return null;
                  };

                  const imageUrl = getProductImage();

                  return (
                    <div
                      key={item._id}
                      style={{
                        border: '1px solid #e8e8e8',
                        borderRadius: '8px',
                        padding: '16px',
                        background: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                      }}
                      onClick={() => handleProductClick(product)}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#1890ff';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(24,144,255,0.2)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e8e8e8';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '180px',
                          background: '#f5f5f5',
                          borderRadius: '6px',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                            onError={e => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <ShopOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                        )}
                        {!imageUrl && (
                          <ShopOutlined
                            style={{
                              fontSize: '48px',
                              color: '#d9d9d9',
                              position: 'absolute',
                            }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '15px',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>{product.name}</span>
                        {item.isPinned && (
                          <Tag color="gold" style={{ margin: 0, fontSize: '11px' }}>
                            Pinned
                          </Tag>
                        )}
                      </div>
                      {product.description && (
                        <div
                          style={{
                            fontSize: '13px',
                            color: '#666',
                            marginBottom: '12px',
                            height: '40px',
                            overflow: 'hidden',
                            lineHeight: '20px',
                          }}
                        >
                          {product.description.substring(0, 80)}
                          {product.description.length > 80 ? '...' : ''}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: '18px',
                          fontWeight: 700,
                          color: '#1890ff',
                        }}
                      >
                        {product.price
                          ? typeof product.price === 'object' && product.price.regular
                            ? `${product.price.regular.toLocaleString('en-US')}đ`
                            : typeof product.price === 'number'
                              ? `${product.price.toLocaleString('en-US')}đ`
                              : 'N/A'
                          : 'N/A'}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#999',
              }}
            >
              <ShopOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
              <div>No featured products yet</div>
            </div>
          )}
        </div>
      </Modal>

      {/* Add to Cart Modal */}
      <Modal
        title="Add to Cart"
        open={showAddToCartModal}
        onCancel={() => setShowAddToCartModal(false)}
        onOk={handleAddToCart}
        okText="Add to Cart"
        cancelText="Cancel"
        confirmLoading={addingToCart}
        width={600}
      >
        {selectedProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Product Info */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <img
                src={
                  selectedProduct.mainImage ||
                  selectedProduct.colorVariants?.[0]?.images?.[0] ||
                  selectedProduct.inventory?.[0]?.images?.[0] ||
                  selectedProduct.images?.[0]
                }
                alt={selectedProduct.name}
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{selectedProduct.name}</h3>
                <p style={{ color: '#1890ff', fontSize: '18px', fontWeight: 600, margin: 0 }}>
                  {typeof selectedProduct.price === 'object' && selectedProduct.price.regular
                    ? `${selectedProduct.price.regular.toLocaleString('en-US')}đ`
                    : typeof selectedProduct.price === 'number'
                      ? `${selectedProduct.price.toLocaleString('en-US')}đ`
                      : 'N/A'}
                </p>
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Select Size: <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedProduct.variants?.sizes && selectedProduct.variants.sizes.length > 0 ? (
                  selectedProduct.variants.sizes.map(size => (
                    <Button
                      key={size}
                      type={selectedSize === size ? 'primary' : 'default'}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </Button>
                  ))
                ) : (
                  <span style={{ color: '#999' }}>No sizes available</span>
                )}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Select Color: <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedProduct.variants?.colors && selectedProduct.variants.colors.length > 0 ? (
                  selectedProduct.variants.colors.map(color => (
                    <Button
                      key={color}
                      type={selectedColor === color ? 'primary' : 'default'}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        borderColor: selectedColor === color ? '#1890ff' : '#d9d9d9',
                      }}
                    >
                      {color}
                    </Button>
                  ))
                ) : (
                  <span style={{ color: '#999' }}>No colors available</span>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Quantity:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Button
                  icon={<MinusOutlined />}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                />
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    minWidth: '40px',
                    textAlign: 'center',
                  }}
                >
                  {quantity}
                </span>
                <Button icon={<PlusOutlined />} onClick={() => setQuantity(quantity + 1)} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Debug overlay (enable via ?debug=1 or VITE_DEBUG_LIVESTREAM=1) */}
      {(new URLSearchParams(window.location.search).get('debug') === '1' ||
        import.meta.env.VITE_DEBUG_LIVESTREAM === '1') && (
        <LivestreamDebugOverlay
          roomId={roomId}
          userId={user?.id}
          socket={socket}
          isConnected={isConnected}
          sendChatMessage={sendChatMessage}
        />
      )}
    </div>
  );
};

export default LiveStreamViewer;
