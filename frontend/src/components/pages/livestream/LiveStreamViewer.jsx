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
  const [videoPlaying, setVideoPlaying] = useState(false);

  const {
    isConnected,
    connectionState,
    error,
    remoteVideoRef,
    viewerCount,
    messages,
    sendChatMessage,
    remoteStream,
    retryConnection,
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
          {/* Shop Information */}
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
          </div>

          {/* Featured Products */}
          <div className="viewer-products-card">
            <div className="viewer-products-header">
              <span>Featured Products</span>
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
            </div>
            <div className="viewer-products-list">
              {streamData?.featuredProducts && streamData.featuredProducts.length > 0 ? (
                streamData.featuredProducts.map(item => (
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
                        </div>
                        <div className="viewer-product-price">
                          ${item.productId?.price || 'N/A'}
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
            <div className="viewer-chat-messages">
              {messages.length === 0 ? (
                <div className="viewer-empty-chat">No messages yet</div>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className="viewer-chat-message">
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
                ))
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
    </div>
  );
};

export default LiveStreamViewer;
