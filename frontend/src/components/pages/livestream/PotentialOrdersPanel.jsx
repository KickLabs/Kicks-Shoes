/**
 * @fileoverview Potential Orders Panel Component
 * @created 2025-01-15
 * @file PotentialOrdersPanel.jsx
 * @description Panel to display and manage potential orders detected from livestream chat
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Badge,
  Button,
  Space,
  Avatar,
  Typography,
  Tag,
  Modal,
  Input,
  Select,
  message,
  Tooltip,
  Empty,
  Spin,
} from 'antd';
import {
  PhoneOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import axios from '../../../services/axiosInstance';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const PotentialOrdersPanel = ({ streamId, socket }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  // Load orders on component mount
  useEffect(() => {
    if (streamId) {
      loadOrders();
    }
  }, [streamId]);

  // Listen for new potential orders via socket
  useEffect(() => {
    if (socket) {
      socket.on('potential_order_detected', handleNewOrder);

      return () => {
        socket.off('potential_order_detected', handleNewOrder);
      };
    }
  }, [socket]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/potential-orders/stream/${streamId}`);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error loading potential orders:', error);
      message.error('Failed to load potential orders');
    } finally {
      setLoading(false);
    }
  };

  const exportOrders = async () => {
    try {
      message.loading('Đang xuất file Excel...', 0);

      // Make API call to export endpoint for this stream
      const response = await axios.get(`/potential-orders/stream/${streamId}/export`, {
        responseType: 'blob',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `potential-orders-${streamId}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.destroy();
      message.success('Xuất file Excel thành công!');
    } catch (error) {
      message.destroy();
      console.error('Export error:', error);
      message.error('Có lỗi xảy ra khi xuất file Excel');
    }
  };

  const handleNewOrder = data => {
    if (data.type === 'potential_order' && data.roomId === streamId) {
      // Add new order to the beginning of the list
      setOrders(prev => [data.order, ...prev]);

      // Show notification
      message.success(`New potential order detected from ${data.order.customerInfo.customerName}!`);
    }
  };

  const updateOrderStatus = async (orderId, status, notes = null) => {
    try {
      setUpdating(true);
      await axios.put(`/potential-orders/${orderId}/status`, {
        status,
        notes,
      });

      // Update local state
      setOrders(prev =>
        prev.map(order =>
          order._id === orderId
            ? { ...order, status, hostActions: { ...order.hostActions, notes } }
            : order
        )
      );

      message.success('Order status updated successfully');
      setModalVisible(false);
      setNoteModalVisible(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      message.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const markAsViewed = async orderId => {
    try {
      await axios.put(`/potential-orders/${orderId}/viewed`);

      // Update local state
      setOrders(prev =>
        prev.map(order =>
          order._id === orderId
            ? {
                ...order,
                status: 'contacted',
                hostActions: { ...order.hostActions, viewedAt: new Date() },
              }
            : order
        )
      );
    } catch (error) {
      console.error('Error marking as viewed:', error);
    }
  };

  const getPriorityColor = priority => {
    switch (priority) {
      case 'urgent':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'blue';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'pending':
        return 'gold';
      case 'contacted':
        return 'blue';
      case 'confirmed':
        return 'green';
      case 'converted':
        return 'success';
      case 'ignored':
        return 'default';
      case 'spam':
        return 'red';
      default:
        return 'default';
    }
  };

  const formatPhone = phone => {
    if (phone && phone.length === 10) {
      return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
    }
    return phone;
  };

  const showOrderDetails = order => {
    setSelectedOrder(order);
    setModalVisible(true);

    // Mark as viewed if pending
    if (order.status === 'pending') {
      markAsViewed(order._id);
    }
  };

  const showNoteModal = order => {
    setSelectedOrder(order);
    setNote(order.hostActions?.notes || '');
    setNoteModalVisible(true);
  };

  if (loading) {
    return (
      <Card title="Potential Orders" style={{ height: '400px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px',
          }}
        >
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="potential-orders-card">
        <div className="potential-orders-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="potential-orders-title">Potential Orders</span>
            <Badge
              count={orders.filter(o => o.status === 'pending').length}
              style={{ backgroundColor: '#1890ff' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="small" icon={<DownloadOutlined />} onClick={exportOrders}>
              Export
            </Button>
            <Button size="small" onClick={loadOrders}>
              Refresh
            </Button>
          </div>
        </div>
        <div className="potential-orders-body">
          {orders.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Empty
                description="No potential orders detected yet"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : (
            <div style={{ padding: '12px', overflow: 'auto', flex: 1 }}>
              {orders.map(order => (
                <div key={order._id} className="order-item">
                  <div className="order-header">
                    <div className="customer-info">
                      <Avatar
                        src={order.customerInfo.userId?.avatar}
                        icon={<UserOutlined />}
                        size="small"
                      />
                      <span className="customer-name">{order.customerInfo.customerName}</span>
                    </div>
                    <div className="order-tags">
                      <span className={`priority-tag priority-${order.priority}`}>
                        {order.priority.toUpperCase()}
                      </span>
                      <span className={`status-tag status-${order.status}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="order-details">
                    <div className="phone-info">
                      <PhoneOutlined />
                      <span>{formatPhone(order.customerInfo.phoneNumber)}</span>
                    </div>
                    <div className="message-info">{order.productInfo.originalMessage}</div>
                    <div className="time-info">{new Date(order.createdAt).toLocaleString()}</div>
                  </div>

                  <div className="order-actions">
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => showOrderDetails(order)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => showNoteModal(order)}
                    >
                      Note
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => updateOrderStatus(order._id, 'confirmed')}
                      disabled={order.status === 'confirmed' || order.status === 'converted'}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => updateOrderStatus(order._id, 'spam')}
                    >
                      Spam
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      <Modal
        title="Order Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={updating}
            onClick={() => updateOrderStatus(selectedOrder?._id, 'confirmed')}
            disabled={
              selectedOrder?.status === 'confirmed' || selectedOrder?.status === 'converted'
            }
          >
            Confirm Order
          </Button>,
        ]}
        width={600}
      >
        {selectedOrder && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Card size="small" title="Customer Information">
              <Space direction="vertical">
                <Text>
                  <strong>Name:</strong> {selectedOrder.customerInfo.customerName}
                </Text>
                <Text>
                  <strong>Phone:</strong> {formatPhone(selectedOrder.customerInfo.phoneNumber)}
                </Text>
                <Text>
                  <strong>User ID:</strong> {selectedOrder.customerInfo.userId?.username}
                </Text>
              </Space>
            </Card>

            <Card size="small" title="Product Information">
              <Space direction="vertical">
                <Text>
                  <strong>Message:</strong> {selectedOrder.productInfo.originalMessage}
                </Text>
                {selectedOrder.productInfo.extractedSize && (
                  <Text>
                    <strong>Size:</strong> {selectedOrder.productInfo.extractedSize}
                  </Text>
                )}
                {selectedOrder.productInfo.extractedColor && (
                  <Text>
                    <strong>Color:</strong> {selectedOrder.productInfo.extractedColor}
                  </Text>
                )}
                <Text>
                  <strong>Quantity:</strong> {selectedOrder.productInfo.extractedQuantity}
                </Text>
              </Space>
            </Card>

            <Card size="small" title="Detection Data">
              <Space direction="vertical">
                <Text>
                  <strong>Confidence:</strong>{' '}
                  {(selectedOrder.detectionData.confidence * 100).toFixed(1)}%
                </Text>
                <Text>
                  <strong>Keywords:</strong>{' '}
                  {selectedOrder.detectionData.detectedKeywords.join(', ')}
                </Text>
                <Text>
                  <strong>Priority:</strong>
                  <Tag color={getPriorityColor(selectedOrder.priority)} style={{ marginLeft: 8 }}>
                    {selectedOrder.priority.toUpperCase()}
                  </Tag>
                </Text>
              </Space>
            </Card>

            {selectedOrder.hostActions?.notes && (
              <Card size="small" title="Host Notes">
                <Text>{selectedOrder.hostActions.notes}</Text>
              </Card>
            )}
          </Space>
        )}
      </Modal>

      {/* Add Note Modal */}
      <Modal
        title="Add Note"
        open={noteModalVisible}
        onCancel={() => setNoteModalVisible(false)}
        onOk={() => updateOrderStatus(selectedOrder?._id, selectedOrder?.status, note)}
        confirmLoading={updating}
      >
        <TextArea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add notes about this order..."
          rows={4}
        />
      </Modal>
    </>
  );
};

export default PotentialOrdersPanel;
