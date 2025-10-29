/**
 * @fileoverview AI Inventory Dashboard
 * @created 2025-10-28
 * @file AIInventoryDashboard.jsx
 * @description Dashboard hiển thị AI inventory alerts và recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Alert,
  Timeline,
  Badge,
  Tag,
  Modal,
  Space,
  Divider,
  Spin,
  message,
  Tooltip,
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  ShoppingOutlined,
  SyncOutlined,
  RobotOutlined,
  FireOutlined,
  BellOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import axiosInstance from '@/services/axiosInstance';
import { io } from 'socket.io-client';
import { formatPrice } from '@/utils/StringFormat';
import './AIInventoryDashboard.css';

const AIInventoryDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [socket, setSocket] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    setupSocket();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const setupSocket = () => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

    newSocket.on('connect', () => {
      console.log('Socket connected for inventory alerts');
      newSocket.emit('join_room', 'admin-room');
    });

    // Realtime chat-style alerts
    newSocket.on('inventory_chat_alert', chatMessage => {
      console.log('Received inventory alert:', chatMessage);
      setAlerts(prev => [chatMessage, ...prev]);

      // Show notification
      showAlertNotification(chatMessage);
    });

    // Daily summary
    newSocket.on('inventory_daily_summary', summary => {
      console.log('Daily summary:', summary);
      message.info({
        content: 'Đã nhận báo cáo inventory hàng ngày',
        duration: 5,
      });
    });

    setSocket(newSocket);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/ai/inventory/dashboard');
      setDashboardData(data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data } = await axiosInstance.post('/ai/inventory/analyze');

      message.success({
        content: `Phân tích hoàn tất! Tìm thấy ${data.data.totalIssues} vấn đề.`,
        duration: 5,
      });

      // Refresh dashboard
      await fetchDashboardData();

      // Show issues as alerts
      if (data.data.issues && data.data.issues.length > 0) {
        Modal.info({
          title: '🤖 Kết quả Phân tích AI',
          width: 700,
          content: (
            <div>
              <p>{data.data.aiSummary.overview}</p>
              <Divider />
              <Timeline>
                {data.data.issues.slice(0, 5).map((issue, index) => (
                  <Timeline.Item
                    key={index}
                    color={getSeverityColor(issue.severity)}
                    dot={getSeverityIcon(issue.severity)}
                  >
                    <strong>{issue.productName}</strong>
                    <br />
                    <span style={{ fontSize: 12, color: '#666' }}>
                      {issue.issue} - {issue.recommendation.analysis}
                    </span>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          ),
        });
      }
    } catch (error) {
      console.error('Error running analysis:', error);
      message.error('Có lỗi khi phân tích inventory');
    } finally {
      setAnalyzing(false);
    }
  };

  const showAlertNotification = chatMessage => {
    const key = `alert-${chatMessage.id}`;

    message.warning({
      key,
      content: (
        <div>
          <strong>{chatMessage.sender.name}</strong>
          <br />
          <span style={{ fontSize: 12 }}>
            {chatMessage.metadata.productName} - {chatMessage.metadata.issueType}
          </span>
        </div>
      ),
      duration: 10,
      onClick: () => {
        // Show full alert modal
        showAlertDetail(chatMessage);
        message.destroy(key);
      },
    });
  };

  const showAlertDetail = alertData => {
    Modal.warning({
      title: (
        <Space>
          <RobotOutlined />
          AI Inventory Alert
        </Space>
      ),
      width: 650,
      content: (
        <div className="alert-detail">
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{alertData.content}</pre>

          <Divider />

          <Space wrap>
            {alertData.actions?.map((action, index) => (
              <Button
                key={index}
                type={action.primary ? 'primary' : 'default'}
                danger={action.style === 'danger'}
                onClick={() => handleAction(action)}
              >
                {action.label}
              </Button>
            ))}
          </Space>
        </div>
      ),
    });
  };

  const handleAction = async action => {
    console.log('Action triggered:', action);

    switch (action.action) {
      case 'create_flash_sale':
        await createFlashSale(action.productId, action.discountPercent);
        break;
      case 'view_product':
        window.open(`/admin/products/${action.productId}`, '_blank');
        break;
      case 'restock_product':
        message.info('Chức năng đặt hàng nhập thêm đang được phát triển');
        break;
      default:
        message.info(`Action: ${action.action}`);
    }
  };

  const createFlashSale = async (productId, discountPercent) => {
    try {
      await axiosInstance.post(`/ai/inventory/auto-sale/${productId}`, {
        discountPercent,
      });

      message.success(`Đã tạo flash sale ${discountPercent}% cho sản phẩm!`);
    } catch (error) {
      console.error('Error creating flash sale:', error);
      message.error('Không thể tạo flash sale');
    }
  };

  const getSeverityColor = severity => {
    const colors = {
      critical: 'red',
      high: 'orange',
      medium: 'gold',
      low: 'green',
    };
    return colors[severity] || 'blue';
  };

  const getSeverityIcon = severity => {
    if (severity === 'critical') return <WarningOutlined />;
    if (severity === 'high') return <WarningOutlined />;
    return <CheckCircleOutlined />;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="ai-inventory-dashboard">
      {/* Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Space size="large">
                  <RobotOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                  <div>
                    <h2 style={{ margin: 0 }}>🤖 AI Inventory Intelligence</h2>
                    <p style={{ margin: 0, color: '#666' }}>
                      Phân tích thông minh và gợi ý xử lý tồn kho
                    </p>
                  </div>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button icon={<SyncOutlined />} onClick={fetchDashboardData}>
                    Làm mới
                  </Button>
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    loading={analyzing}
                    onClick={runAnalysis}
                  >
                    Phân tích ngay
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Stats Cards */}
      {dashboardData && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng sản phẩm"
                value={dashboardData.summary.totalProducts}
                prefix={<ShoppingOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tồn kho thấp"
                value={dashboardData.summary.lowStock}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Hết hàng"
                value={dashboardData.summary.outOfStock}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<InboxOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tồn kho cao"
                value={dashboardData.summary.highStock}
                valueStyle={{ color: '#52c41a' }}
                prefix={<FireOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Realtime Alerts */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <BellOutlined />
                Cảnh báo Realtime
                <Badge count={alerts.length} showZero />
              </Space>
            }
          >
            {alerts.length === 0 ? (
              <Alert
                message="Không có cảnh báo mới"
                description="Tất cả sản phẩm đang trong tình trạng tốt. AI sẽ tự động thông báo khi phát hiện vấn đề."
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            ) : (
              <Timeline mode="left">
                {alerts.map((alert, index) => (
                  <Timeline.Item
                    key={alert.id}
                    color={getSeverityColor(alert.severity)}
                    label={new Date(alert.timestamp).toLocaleTimeString('vi-VN')}
                  >
                    <Card
                      size="small"
                      hoverable
                      onClick={() => showAlertDetail(alert)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Tag color={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Tag>
                          <strong>{alert.metadata.productName}</strong>
                          <span style={{ fontSize: 12, color: '#666' }}>
                            ({alert.metadata.sku})
                          </span>
                        </Space>

                        <div
                          style={{
                            fontSize: 13,
                            color: '#666',
                            maxHeight: 100,
                            overflow: 'hidden',
                          }}
                        >
                          {alert.content.substring(0, 200)}...
                        </div>

                        <Space wrap>
                          {alert.actions?.slice(0, 2).map((action, i) => (
                            <Button
                              key={i}
                              size="small"
                              type={action.primary ? 'primary' : 'default'}
                              onClick={e => {
                                e.stopPropagation();
                                handleAction(action);
                              }}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </Space>
                      </Space>
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AIInventoryDashboard;
