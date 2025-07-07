import {
  CreditCardOutlined,
  DownloadOutlined,
  HomeOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Table,
  Tag,
  Spin,
  message,
} from 'antd';
import dayjs from 'dayjs';
import React, { useContext, useEffect, useState } from 'react';
import { ActiveTabContext } from './ActiveTabContext';
import { useAuth } from '../../../contexts/AuthContext';
import './order-details.css';
import TabHeader from './TabHeader';
import { useLocation } from 'react-router-dom';
import axiosInstance from '@/services/axiosInstance';
import FeedbackModal from './Feedback';

const { Option } = Select;

export default function OrderDetails() {
  const { setActiveTab } = useContext(ActiveTabContext);
  const { user } = useAuth();
  const location = useLocation();
  const showActions =
    location.pathname.includes('/dashboard/orders/') ||
    user?.role === 'admin' ||
    user?.role === 'shop';
  const orderId = location.pathname.split('/').pop();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');

  // **Feedback-related state added**
  const [existingFeedbacks, setExistingFeedbacks] = useState({});
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(null);

  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'product',
      key: 'product',
      render: (product, record) => {
        const inv = product?.inventory?.find(
          inv => inv.size === record.size && inv.color === record.color
        );
        const img = inv?.images?.[0] || product?.mainImage || '';
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar src={img} shape="square" size={32} /> {product?.name}
          </span>
        );
      },
    },
    {
      title: 'Order ID',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: () => `#${order.orderNumber}`,
    },
    {
      title: 'Size / Color',
      dataIndex: 'sizeColor',
      key: 'sizeColor',
      render: (_, r) => `${r.size} / ${r.color}`,
    },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Total', dataIndex: 'subtotal', key: 'subtotal', render: v => `$${v?.toFixed(2)}` },
    {
      title: 'Review',
      key: 'review',
      render: (_, record) => {
        const fb = existingFeedbacks[record.product._id];
        return fb ? (
          <>
            <Button type="link" onClick={() => openFeedbackModal(record.product._id, fb._id)}>
              Edit
            </Button>
            <Button type="link" danger onClick={() => handleDeleteFeedback(fb._id)}>
              Delete
            </Button>
          </>
        ) : (
          <Button
            type="link"
            className="feedback-btn"
            onClick={() => openFeedbackModal(record.product._id)}
          >
            Leave Review
          </Button>
        );
      },
    },
  ];

  useEffect(() => {
    setActiveTab('3');
  }, [setActiveTab]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order information is not available');
        setOrder(null);
        return;
      }
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/orders/${orderId}`);
        if (response.data.success) {
          setOrder(response.data.data);
          setNote(response.data.data.notes || '');
        } else {
          throw new Error(response.data.message);
        }
      } catch (err) {
        setError('Failed to fetch order details');
        message.error('Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  // **Load all feedbacks for this order**
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await axiosInstance.get(`/feedback?order=${orderId}`);
        const map = {};
        (res.data.data || []).forEach(fb => {
          map[fb.product] = fb;
        });
        setExistingFeedbacks(map);
      } catch {
        // ignore
      }
    };
    fetchFeedbacks();
  }, [orderId]);

  const openFeedbackModal = (productId, feedbackId = null) => {
    setSelectedProduct(productId);
    setSelectedFeedbackId(feedbackId);
    setFeedbackVisible(true);
  };

  const closeFeedbackModal = () => {
    setFeedbackVisible(false);
    setSelectedProduct(null);
    setSelectedFeedbackId(null);
  };
  const refreshFeedbacks = async () => {
    try {
      const res = await axiosInstance.get(`/feedback?order=${orderId}`);
      const map = {};
      (res.data.data || []).forEach(fb => {
        map[fb.product] = fb;
      });
      setExistingFeedbacks(map);
    } catch {
      // ignore
    }
  };

  const handleFeedbackSaved = () => {
    message.success('Review saved');
    closeFeedbackModal();
    refreshFeedbacks();
  };

  const handleDeleteFeedback = async id => {
    try {
      await axiosInstance.delete(`/feedback/${id}`);
      message.success('Review deleted');
      refreshFeedbacks();
    } catch {
      message.error('Failed to delete review');
    }
  };

  const handleStatusChange = async newStatus => {
    try {
      setLoading(true);

      // Validate status transition
      const currentStatus = order.status;
      const validTransitions = {
        pending: ['processing', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered'],
        delivered: ['refunded'],
        cancelled: [], // No further transitions
        refunded: [], // No further transitions
      };

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        message.error(`Cannot change status from ${currentStatus} to ${newStatus}`);
        return;
      }

      const response = await axiosInstance.patch(`/orders/${orderId}/status`, {
        status: newStatus,
      });

      if (response.data.success) {
        setOrder(prev => ({ ...prev, status: newStatus }));
        message.success(`Order status updated to ${newStatus}`);
      } else {
        throw new Error(response.data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      message.error('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const handleNoteChange = e => setNote(e.target.value);

  const handleCancelOrder = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(`/orders/${orderId}/cancel`, {
        reason: 'Customer requested cancellation',
      });

      if (response.data.success) {
        setOrder(prev => ({ ...prev, status: 'cancelled' }));
        message.success('Order cancelled successfully');
      } else {
        throw new Error(response.data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      message.error('Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundOrder = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(`/orders/${orderId}/refund`, {
        reason: 'Customer requested refund',
        amount: order.totalPrice,
      });

      if (response.data.success) {
        setOrder(prev => ({ ...prev, status: 'refunded' }));
        message.success('Order refunded successfully');
      } else {
        throw new Error(response.data.message || 'Failed to refund order');
      }
    } catch (error) {
      console.error('Error refunding order:', error);
      message.error('Failed to refund order');
    } finally {
      setLoading(false);
    }
  };

  // Check if customer can cancel order (processing or pending status)
  const canCancel =
    user?.role === 'customer' &&
    order?.user?._id === user?._id &&
    (order?.status === 'processing' || order?.status === 'pending');

  // Check if customer can refund order
  const canRefund = () => {
    if (user?.role !== 'customer' || order?.user?._id !== user?._id) {
      return false;
    }

    // Case 1: Cancelled and paid orders with VNPay payment method
    if (
      order?.paymentStatus === 'paid' &&
      order?.status === 'cancelled' &&
      order?.paymentMethod === 'vnpay'
    ) {
      return true;
    }

    // Case 2: Delivered and paid orders (any payment method) within 3 days
    if (order?.paymentStatus === 'paid' && order?.status === 'delivered') {
      if (order?.deliveredAt) {
        const deliveredDate = new Date(order.deliveredAt);
        const currentDate = new Date();
        const daysDiff = (currentDate - deliveredDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 3; // Refund available within 3 days of delivery
      }
      // If no deliveredAt date, don't allow refund
      return false;
    }

    return false;
  };

  const shouldShowRefund = canRefund();

  const statusColorMap = {
    pending: 'orange',
    processing: 'blue',
    shipped: 'purple',
    delivered: 'green',
    cancelled: 'red',
    refunded: 'default',
  };

  const paymentStatusColorMap = {
    pending: 'orange',
    paid: 'green',
    failed: 'red',
    refunded: 'gold',
  };
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!order) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  // Debug log
  console.log('Rendering order details:', {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    deliveredAt: order.deliveredAt,
    updatedAt: order.updatedAt,
    canCancel,
    shouldShowRefund,
    userRole: user?.role,
    userId: user?._id,
    orderUserId: order?.user?._id,
    // Refund eligibility check
    isCancelledAndPaidVNPay:
      order?.paymentStatus === 'paid' &&
      order?.status === 'cancelled' &&
      order?.paymentMethod === 'vnpay',
    isDeliveredAndPaidWithin3Days:
      order?.paymentStatus === 'paid' &&
      order?.status === 'delivered' &&
      order?.deliveredAt &&
      new Date() - new Date(order.deliveredAt) <= 3 * 24 * 60 * 60 * 1000,
  });

  return (
    <>
      {order?.user?._id === user?._id || user?.role === 'admin' || user?.role === 'shop' ? (
        <>
          <TabHeader
            breadcrumb={user?.role === 'shop' ? 'Shop Dashboard' : 'Order Details'}
            anotherBreadcrumb={
              user?.role === 'shop'
                ? `Orders / #${order.orderNumber}`
                : `Order #${order.orderNumber}`
            }
          />
          <div className="order-details-container">
            <div className="order-details-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {user?.role === 'shop' && (
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => (window.location.href = '/shop/orders')}
                    style={{ marginRight: 8 }}
                  >
                    Back to Orders
                  </Button>
                )}
                <span className="order-details-title">
                  Orders ID: <span className="order-details-id">#{order.orderNumber}</span>
                </span>

                <Tag
                  color={statusColorMap[order.status] || 'orange'}
                  className="order-details-status"
                >
                  {order.status?.toUpperCase()}
                </Tag>
              </div>
              {canCancel && (
                <div className="order-details-actions">
                  <Button
                    danger
                    block
                    onClick={handleCancelOrder}
                    className="order-cancel-btn"
                    icon={<ExclamationCircleOutlined className="order-cancel-btn-icon" />}
                  >
                    Cancel Order
                  </Button>
                </div>
              )}
              {shouldShowRefund && (
                <div className="order-details-actions">
                  {order?.status === 'delivered' && order?.deliveredAt && (
                    <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
                      {(() => {
                        const deliveredDate = new Date(order.deliveredAt);
                        const currentDate = new Date();
                        const daysDiff = (currentDate - deliveredDate) / (1000 * 60 * 60 * 24);
                        const remainingDays = Math.max(0, 3 - Math.ceil(daysDiff));
                        return `Refund available for ${remainingDays} more day${remainingDays !== 1 ? 's' : ''}`;
                      })()}
                    </div>
                  )}
                  <Button
                    type="primary"
                    danger
                    block
                    onClick={handleRefundOrder}
                    className="order-refund-btn"
                    icon={<ExclamationCircleOutlined className="order-refund-btn-icon" />}
                  >
                    Request Refund
                  </Button>
                </div>
              )}
              {showActions && (
                <div className="order-details-header-actions">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Status flow indicator */}
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#666',
                        marginRight: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>Status Flow:</span>
                      <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                        {order.status?.toUpperCase()}
                      </span>
                    </div>

                    {/* Pending -> Processing */}
                    {order.status === 'pending' && (
                      <Button
                        type="primary"
                        onClick={() => handleStatusChange('processing')}
                        loading={loading}
                      >
                        Start Processing
                      </Button>
                    )}

                    {/* Processing -> Shipped */}
                    {order.status === 'processing' && (
                      <Button
                        type="primary"
                        onClick={() => handleStatusChange('shipped')}
                        loading={loading}
                      >
                        Mark as Shipped
                      </Button>
                    )}

                    {/* Shipped -> Delivered */}
                    {order.status === 'shipped' && (
                      <Button
                        type="primary"
                        onClick={() => handleStatusChange('delivered')}
                        loading={loading}
                      >
                        Mark as Delivered
                      </Button>
                    )}

                    {/* Cancel button for pending and processing orders */}
                    {(order.status === 'pending' || order.status === 'processing') && (
                      <Button
                        danger
                        onClick={() => handleStatusChange('cancelled')}
                        loading={loading}
                      >
                        Cancel Order
                      </Button>
                    )}

                    {/* Refund button for delivered orders */}
                    {order.status === 'delivered' && order.paymentStatus === 'paid' && (
                      <Button
                        type="primary"
                        danger
                        onClick={() => handleStatusChange('refunded')}
                        loading={loading}
                      >
                        Process Refund
                      </Button>
                    )}

                    {/* Final status indicator */}
                    {(order.status === 'cancelled' || order.status === 'refunded') && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#52c41a',
                          fontWeight: 'bold',
                        }}
                      >
                        ✓ Order {order.status === 'cancelled' ? 'Cancelled' : 'Refunded'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Row gutter={[16, 16]} className="order-details-info-row">
              <Col span={8}>
                <Card bordered={false} className="order-details-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <UserOutlined style={{ fontSize: 28, color: '#4A69E2' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>Customer</div>
                      <div>Full Name: {order.user?.fullName}</div>
                      <div>Email: {order.user?.email}</div>
                      <div>Phone: {order.user?.phone}</div>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="order-details-card">
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Order Info</div>
                  <div>Shipping: {order.shippingMethod}</div>
                  <div>Payment Method: {order.paymentMethod}</div>
                  <div style={{ marginTop: 8 }}>
                    Order Status:{' '}
                    <Tag
                      color={statusColorMap[order.status] || 'orange'}
                      style={{ fontWeight: 600 }}
                    >
                      {order.status?.toUpperCase()}
                    </Tag>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    Payment Status:{' '}
                    <Tag
                      color={paymentStatusColorMap[order.paymentStatus] || 'orange'}
                      style={{ fontWeight: 600 }}
                    >
                      {(order.paymentStatus || 'pending').toUpperCase()}
                    </Tag>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="order-details-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <HomeOutlined style={{ fontSize: 28, color: '#4A69E2' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>Deliver to</div>
                      <div>Address: {order.shippingAddress}</div>
                    </div>
                  </div>
                </Card>
              </Col>
              {/* <Col span={8}>
                <Card bordered={false} className="order-details-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <CreditCardOutlined
                      style={{ fontSize: 28, color: "#E94E3C" }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>Payment Info</div>
                      <div>Card: {order.paymentDetails?.cardNumber}</div>
                      <div>Name: {order.paymentDetails?.cardHolderName}</div>
                      <div>Expiry: {order.paymentDetails?.expiryDate}</div>
                    </div>
                  </div>
                </Card>
              </Col> */}
              <Col span={16}>
                <Card bordered={false} className="order-details-card">
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Note</div>
                  <Input.TextArea
                    placeholder="Type some notes"
                    autoSize={{ minRows: 3, maxRows: 3 }}
                    value={order?.notes || note}
                    onChange={handleNoteChange}
                    disabled
                  />
                </Card>
              </Col>
            </Row>
            <div className="order-details-products">
              <div className="order-details-products-title">Products</div>
              <Table
                columns={columns}
                dataSource={(order.items || []).map((it, i) => ({ ...it, key: i }))}
                pagination={false}
              />
            </div>
          </div>
          <FeedbackModal
            visible={feedbackVisible}
            onCancel={closeFeedbackModal}
            onSaved={handleFeedbackSaved}
            orderId={orderId}
            productId={selectedProduct}
            feedbackId={selectedFeedbackId} // **added**
          />
        </>
      ) : (
        <div>
          <h1>You are not authorized to view this page</h1>
        </div>
      )}
    </>
  );
}
