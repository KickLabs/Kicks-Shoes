import {
  CreditCardOutlined,
  DownloadOutlined,
  HomeOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  TruckOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
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
  Modal,
} from 'antd';
import dayjs from 'dayjs';
import React, { useContext, useEffect, useState } from 'react';
import { ActiveTabContext } from './ActiveTabContext';
import { useAuth } from '../../../contexts/AuthContext';
import './order-details.css';
import TabHeader from './TabHeader';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '@/services/axiosInstance';
import FeedbackModal from './Feedback';
import { formatPrice } from '../../../utils/StringFormat';

const { Option } = Select;

export default function OrderDetails() {
  const { setActiveTab } = useContext(ActiveTabContext);
  const { user } = useAuth();
  const navigate = useNavigate();
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

  // **Shipper assignment state**
  const [shippers, setShippers] = useState([]);
  const [shipperModalVisible, setShipperModalVisible] = useState(false);
  const [selectedShipper, setSelectedShipper] = useState(null);
  const [assigningShipper, setAssigningShipper] = useState(false);

  // **Delivery tracking state**
  const [deliveryTracking, setDeliveryTracking] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);

  // **Report issue state**
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportType, setReportType] = useState('not_received');
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

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
    { title: 'Total', dataIndex: 'subtotal', key: 'subtotal', render: v => formatPrice(v || 0) },
    // Only show Review column for order owner
    ...(order?.user?._id === user?._id || order?.user === user?._id
      ? [
          {
            title: 'Review',
            key: 'review',
            render: (_, record) => {
              // Check if this is the first occurrence of this product in the order
              const productId = record.product._id;
              const isFirstOccurrence =
                order?.items?.findIndex(item => item.product._id === productId) ===
                order?.items?.findIndex(item => item._id === record._id);

              // Only show review for the first occurrence of each product
              if (!isFirstOccurrence) {
                return null; // Don't render anything for subsequent occurrences
              }

              const feedbackKey = `${productId}_${orderId}`;
              const fb = existingFeedbacks[feedbackKey];
              const canReview = order?.status === 'delivered';

              if (!canReview) {
                return <span style={{ color: '#999', fontSize: '12px' }}>Not available yet</span>;
              }

              // Check if feedback exists and is deleted by admin (status = false and deletedBy = 'admin')
              if (fb && fb.status === false && fb.deletedBy === 'admin') {
                return (
                  <span style={{ color: '#ff4d4f', fontSize: '12px', fontWeight: '500' }}>
                    Your comment has violated the policy
                  </span>
                );
              }

              // If feedback doesn't exist (was hard deleted by user), allow them to review again
              if (!fb) {
                return (
                  <Button
                    type="link"
                    className="feedback-btn"
                    onClick={() => openFeedbackModal(productId)}
                  >
                    Leave Review
                  </Button>
                );
              }

              return fb ? (
                <>
                  <Button type="link" onClick={() => openFeedbackModal(productId, fb._id)}>
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
                  onClick={() => openFeedbackModal(productId)}
                >
                  Leave Review
                </Button>
              );
            },
          },
        ]
      : []),
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

          // If order has delivery info, set it
          if (response.data.data.delivery) {
            setDeliveryTracking(response.data.data.delivery);
          }
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

  // Fetch delivery tracking if order has shipper assigned
  useEffect(() => {
    const fetchDeliveryTracking = async () => {
      if (!order?.shipper || deliveryTracking) return;

      try {
        setLoadingTracking(true);
        const response = await axiosInstance.get(`/orders/${orderId}/tracking`);
        if (response.data.success) {
          setDeliveryTracking(response.data.data);
        }
      } catch (err) {
        console.log('No delivery tracking available yet');
      } finally {
        setLoadingTracking(false);
      }
    };

    if (order?.shipper) {
      fetchDeliveryTracking();
    }
  }, [order?.shipper, orderId, deliveryTracking]);

  // **Load all feedbacks for this order**
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await axiosInstance.get(`/feedback/all-including-deleted?order=${orderId}`);
        const map = {};
        (res.data.data || []).forEach(fb => {
          // Use combination of product and order to allow multiple reviews for same product
          const key = `${fb.product}_${fb.order}`;
          map[key] = fb;
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
      const res = await axiosInstance.get(`/feedback/all-including-deleted?order=${orderId}`);
      const map = {};
      (res.data.data || []).forEach(fb => {
        // Use combination of product and order to allow multiple reviews for same product
        const key = `${fb.product}_${fb.order}`;
        map[key] = fb;
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

  // Handle confirm order received
  const handleConfirmOrderReceived = async () => {
    Modal.confirm({
      title: 'Confirm Order Received',
      content: 'Are you sure you have received this order? This action will complete the order.',
      okText: 'Yes, I received it',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await axiosInstance.post(`/orders/${orderId}/confirm`);
          if (response.data.success) {
            message.success('Order confirmed successfully! Thank you for your purchase.');
            // Refresh order details
            window.location.reload();
          } else {
            message.error(response.data.message || 'Failed to confirm order');
          }
        } catch (error) {
          console.error('Error confirming order:', error);
          message.error(error.response?.data?.message || 'Failed to confirm order');
        }
      },
    });
  };

  // Handle buy again - add all order items to cart and navigate to checkout
  const handleBuyAgain = async () => {
    try {
      if (!order || !order.items || order.items.length === 0) {
        message.error('No items found in this order');
        return;
      }

      // Prepare items for checkout similar to buyNow format
      const selectedItems = order.items.map(item => {
        // Get the correct image from inventory
        const inv = item.product?.inventory?.find(
          inv => inv.size === item.size && inv.color === item.color
        );
        const image = inv?.images?.[0] || item.product?.mainImage || '';

        return {
          product: item.product._id,
          productDetails: {
            _id: item.product._id,
            name: item.product.name,
            mainImage: image,
            price: {
              regular: item.price,
              isOnSale: item.product.price?.isOnSale || false,
              discountPercent: item.product.price?.discountPercent || 0,
            },
            inventory: item.product.inventory,
          },
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.price,
        };
      });

      // Save to localStorage for checkout page
      localStorage.setItem('selectedCartItems', JSON.stringify(selectedItems));

      message.success(`Preparing ${selectedItems.length} item(s) for checkout`);

      // Navigate to checkout with selectedItems parameter
      navigate('/checkout?selectedItems=true');
    } catch (error) {
      console.error('Error preparing buy again:', error);
      message.error('Failed to prepare items for checkout');
    }
  };

  // Handle report delivery issue
  const handleReportIssue = () => {
    setReportModalVisible(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      message.error('Please provide a reason for the report');
      return;
    }

    try {
      setSubmittingReport(true);
      const response = await axiosInstance.post(`/orders/${orderId}/report-issue`, {
        reportType,
        reason: reportReason,
        description: reportDescription,
      });

      if (response.data.success) {
        message.success(
          'Report submitted successfully. Our team will investigate and contact you soon.'
        );
        setReportModalVisible(false);
        setReportType('not_received');
        setReportReason('');
        setReportDescription('');
        // Refresh order details
        window.location.reload();
      } else {
        message.error(response.data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      message.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleCancelReport = () => {
    setReportModalVisible(false);
    setReportType('not_received');
    setReportReason('');
    setReportDescription('');
  };

  // Fetch available shippers
  const fetchAvailableShippers = async () => {
    try {
      console.log('Fetching shippers from /orders/shippers/available');
      const response = await axiosInstance.get('/orders/shippers/available');
      console.log('Shippers response:', response.data);

      if (response.data.success) {
        if (response.data.data && response.data.data.length > 0) {
          setShippers(response.data.data);
          console.log('Set shippers:', response.data.data);
        } else {
          console.warn('No shippers found in response');
          message.warning('No available shipper found');
        }
      }
    } catch (err) {
      console.error('Failed to fetch shippers:', err);
      console.error('Error response:', err.response?.data);
      message.error(err.response?.data?.message || 'Failed to fetch available shippers');
    }
  };

  // Assign shipper manually
  const handleAssignShipper = async () => {
    if (!selectedShipper) {
      message.error('Please select a shipper');
      return;
    }

    try {
      setAssigningShipper(true);
      const response = await axiosInstance.post(`/orders/${orderId}/assign-shipper`, {
        shipperId: selectedShipper,
      });

      if (response.data.success) {
        message.success('Shipper assigned successfully');
        setShipperModalVisible(false);
        setSelectedShipper(null);
        // Reload order
        const orderResponse = await axiosInstance.get(`/orders/${orderId}`);
        if (orderResponse.data.success) {
          setOrder(orderResponse.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to assign shipper:', err);
      message.error(err.response?.data?.message || 'Failed to assign shipper');
    } finally {
      setAssigningShipper(false);
    }
  };

  // Auto-assign shipper
  const handleAutoAssignShipper = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(`/orders/${orderId}/auto-assign-shipper`);

      if (response.data.success) {
        message.success(`Shipper ${response.data.data.shipper.fullName} assigned successfully`);
        // Reload order
        const orderResponse = await axiosInstance.get(`/orders/${orderId}`);
        if (orderResponse.data.success) {
          setOrder(orderResponse.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to auto-assign shipper:', err);
      message.error(err.response?.data?.message || 'Failed to auto-assign shipper');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async newStatus => {
    try {
      setLoading(true);

      // Shop can only change pending -> processing
      // Shipper handles shipping and delivery
      const currentStatus = order.status;
      const validTransitions = {
        pending: ['processing', 'cancelled'],
        processing: ['cancelled'], // Shop can only cancel, not ship
        delivered: ['refunded'],
        cancelled: [],
        refunded: [],
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

  // Check if order owner can cancel order (processing or pending status)
  const canCancel =
    (order?.user?._id === user?._id || order?.user === user?._id) &&
    (order?.status === 'processing' || order?.status === 'pending');

  // Check if order owner can refund order
  const canRefund = () => {
    // Check if user is the order owner
    const isOrderOwner = order?.user?._id === user?._id || order?.user === user?._id;
    if (!isOrderOwner) {
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

    // Case 2: Shipped and paid orders (any payment method) within 3 days
    if (order?.paymentStatus === 'paid' && order?.status === 'shipped') {
      if (order?.shippedAt) {
        const shippedDate = new Date(order.shippedAt);
        const currentDate = new Date();
        const daysDiff = (currentDate - shippedDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 3; // Refund available within 3 days of shipping
      }
      // If no shippedAt date, don't allow refund
      return false;
    }

    // Case 3: Delivered and paid orders (any payment method) within 3 days
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

    // Case 4: Completed and paid orders (any payment method) within 3 days of completion
    if (order?.paymentStatus === 'paid' && order?.status === 'completed') {
      if (order?.completedAt) {
        const completedDate = new Date(order.completedAt);
        const currentDate = new Date();
        const daysDiff = (currentDate - completedDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 3; // Refund available within 3 days of completion
      }
      // If no completedAt date, don't allow refund
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
    delivered_pending_confirmation: 'gold',
    completed: 'cyan',
    under_investigation: 'volcano',
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
    completedAt: order.completedAt,
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
    isCompletedAndPaidWithin3Days:
      order?.paymentStatus === 'paid' &&
      order?.status === 'completed' &&
      order?.completedAt &&
      new Date() - new Date(order.completedAt) <= 3 * 24 * 60 * 60 * 1000,
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                {/* Left side: Order ID and Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
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

                {/* Right side: Action Buttons */}
                <div
                  style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}
                >
                  {/* Buy Again Button */}
                  {(() => {
                    const isOrderOwner =
                      order?.user?._id === user?._id || order?.user === user?._id;
                    const canBuyAgain = [
                      'shipped',
                      'delivered',
                      'delivered_pending_confirmation',
                      'completed',
                    ].includes(order?.status);

                    // Show buy again for order owner on shipped/delivered/completed orders (not pending/processing)
                    return isOrderOwner && canBuyAgain;
                  })() && (
                    <Button
                      type="primary"
                      onClick={handleBuyAgain}
                      icon={<ShoppingCartOutlined />}
                      style={{
                        background: '#4A69E2',
                        borderColor: '#4A69E2',
                        fontWeight: 500,
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      Buy Again
                    </Button>
                  )}

                  {/* Refund Button */}
                  {shouldShowRefund && (
                    <Button
                      type="primary"
                      danger
                      onClick={handleRefundOrder}
                      icon={<ExclamationCircleOutlined />}
                      style={{
                        fontWeight: 500,
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      Request Refund
                    </Button>
                  )}

                  {/* Cancel Button */}
                  {canCancel && (
                    <Button
                      danger
                      onClick={handleCancelOrder}
                      icon={<ExclamationCircleOutlined />}
                      style={{
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      Cancel Order
                    </Button>
                  )}
                </div>
              </div>

              {/* Refund Info Banner */}
              {shouldShowRefund && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '10px 16px',
                    background: '#fff7e6',
                    border: '1px solid #ffd666',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#ad6800',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginLeft: '8px',
                  }}
                >
                  {order?.status === 'shipped' && order?.shippedAt && (
                    <>
                      {(() => {
                        const shippedDate = new Date(order.shippedAt);
                        const currentDate = new Date();
                        const daysDiff = (currentDate - shippedDate) / (1000 * 60 * 60 * 24);
                        const remainingDays = Math.max(0, 3 - Math.ceil(daysDiff));
                        return `⏰ Refund available for ${remainingDays} more day${remainingDays !== 1 ? 's' : ''} (since shipped)`;
                      })()}
                    </>
                  )}
                  {order?.status === 'delivered' && order?.deliveredAt && (
                    <>
                      {(() => {
                        const deliveredDate = new Date(order.deliveredAt);
                        const currentDate = new Date();
                        const daysDiff = (currentDate - deliveredDate) / (1000 * 60 * 60 * 24);
                        const remainingDays = Math.max(0, 3 - Math.ceil(daysDiff));
                        return `⏰ Refund available for ${remainingDays} more day${remainingDays !== 1 ? 's' : ''}`;
                      })()}
                    </>
                  )}
                  {order?.status === 'completed' && order?.completedAt && (
                    <>
                      {(() => {
                        const completedDate = new Date(order.completedAt);
                        const currentDate = new Date();
                        const daysDiff = (currentDate - completedDate) / (1000 * 60 * 60 * 24);
                        const remainingDays = Math.max(0, 3 - Math.ceil(daysDiff));
                        return `⏰ Refund available for ${remainingDays} more day${remainingDays !== 1 ? 's' : ''} (since completion)`;
                      })()}
                    </>
                  )}
                </div>
              )}

              {/* Order Owner Confirmation Banner for delivered_pending_confirmation */}
              {(() => {
                const isOrderOwner = order?.user?._id === user?._id || order?.user === user?._id;
                const isDeliveredPending = order?.status === 'delivered_pending_confirmation';

                return isOrderOwner && isDeliveredPending;
              })() && (
                <div style={{ marginTop: '12px' }}>
                  <div
                    style={{
                      padding: '12px',
                      background: '#fff7e6',
                      border: '1px solid #ffd666',
                      borderRadius: '4px',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: '#ad6800',
                        marginBottom: '4px',
                        fontSize: '14px',
                      }}
                    >
                      ⏰ Action Required
                    </div>
                    <div style={{ fontSize: '12px', color: '#ad6800' }}>
                      Please confirm whether you have received this order.
                      {order?.autoCompleteDueAt && (
                        <div style={{ marginTop: '4px' }}>
                          Auto-complete in:{' '}
                          {Math.max(
                            0,
                            Math.ceil(
                              (new Date(order.autoCompleteDueAt) - new Date()) /
                                (1000 * 60 * 60 * 24)
                            )
                          )}{' '}
                          days
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      type="primary"
                      onClick={handleConfirmOrderReceived}
                      style={{ flex: 1, background: '#52c41a', borderColor: '#52c41a' }}
                      icon={<span>✓</span>}
                    >
                      Yes, I Received the Order
                    </Button>
                    <Button
                      danger
                      onClick={handleReportIssue}
                      style={{ flex: 1 }}
                      icon={<span>⚠</span>}
                    >
                      I Didn't Receive It / Report Issue
                    </Button>
                  </div>
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

                    {/* Processing -> Assign Shipper */}
                    {order.status === 'processing' && !order.shipper && (
                      <>
                        <Button
                          type="primary"
                          icon={<TeamOutlined />}
                          onClick={() => {
                            fetchAvailableShippers();
                            setShipperModalVisible(true);
                          }}
                          loading={loading}
                        >
                          Assign Shipper
                        </Button>
                        <Button
                          type="default"
                          icon={<TruckOutlined />}
                          onClick={handleAutoAssignShipper}
                          loading={loading}
                        >
                          Auto Assign
                        </Button>
                      </>
                    )}

                    {/* Show shipper info if assigned */}
                    {order.shipper && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#52c41a',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <TruckOutlined />
                        Shipper: {order.shipper?.fullName || 'Assigned'}
                      </div>
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

            {/* Order Summary Section */}
            <div className="order-details-summary">
              <div className="order-details-products-title">Order Summary</div>
              <Card bordered={false} className="order-details-card">
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <div className="order-details-summary-row">
                      <span>Subtotal:</span>
                      <span>{formatPrice(order.subtotal || 0)}</span>
                    </div>
                    {order.shippingCost > 0 && (
                      <div className="order-details-summary-row">
                        <span>Shipping Cost:</span>
                        <span>{formatPrice(order.shippingCost)}</span>
                      </div>
                    )}
                    {order.tax > 0 && (
                      <div className="order-details-summary-row">
                        <span>Tax:</span>
                        <span>{formatPrice(order.tax)}</span>
                      </div>
                    )}
                    {order.discount > 0 && (
                      <div className="order-details-summary-row" style={{ color: '#52c41a' }}>
                        <span>Discount:</span>
                        <span>-{formatPrice(order.discount)}</span>
                      </div>
                    )}
                    <div className="order-details-total">
                      <span>Total:</span>
                      <span style={{ color: '#4A69E2' }}>{formatPrice(order.totalPrice || 0)}</span>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div
                      style={{
                        background: '#f8f9fa',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e8e8e8',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Payment Details</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        <div>Payment Method: {order.paymentMethod}</div>
                        <div>
                          Payment Status:
                          <Tag
                            color={paymentStatusColorMap[order.paymentStatus] || 'orange'}
                            style={{ marginLeft: '8px' }}
                          >
                            {(order.paymentStatus || 'pending').toUpperCase()}
                          </Tag>
                        </div>
                        {order.paymentMethod === 'vnpay' && order.transactionId && (
                          <div>Transaction ID: {order.transactionId}</div>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </div>

            {/* Delivery Tracking Timeline */}
            {deliveryTracking && deliveryTracking.timeline && (
              <div className="order-details-tracking">
                <div className="order-details-products-title">
                  <TruckOutlined style={{ marginRight: 8 }} />
                  Delivery Tracking
                </div>
                <Card bordered={false} className="order-details-card">
                  {loadingTracking ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Spin />
                    </div>
                  ) : (
                    <>
                      {/* Shipper Info */}
                      {deliveryTracking.shipper && (
                        <div
                          style={{
                            marginBottom: 24,
                            padding: 16,
                            background: '#f8f9fa',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <Avatar
                            src={deliveryTracking.shipper.avatar}
                            size={48}
                            icon={<UserOutlined />}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 16 }}>
                              {deliveryTracking.shipper.fullName}
                            </div>
                            <div style={{ color: '#666', fontSize: 14 }}>
                              {deliveryTracking.shipper.phone}
                            </div>
                            {deliveryTracking.shipper.vehicleType && (
                              <Tag style={{ marginTop: 4 }}>
                                {deliveryTracking.shipper.vehicleType}
                              </Tag>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="delivery-timeline">
                        {deliveryTracking.timeline.map((step, index) => {
                          const isLatest =
                            step.completed &&
                            index === deliveryTracking.timeline.filter(s => s.completed).length - 1;

                          return (
                            <div
                              key={step.status}
                              className={`timeline-step ${step.completed ? 'completed' : 'pending'} ${
                                isLatest ? 'latest' : ''
                              }`}
                            >
                              <div className="timeline-step-icon">
                                {step.completed ? (
                                  <div className="timeline-icon-completed">✓</div>
                                ) : (
                                  <div className="timeline-icon-pending">•</div>
                                )}
                              </div>
                              <div className="timeline-step-content">
                                <div className="timeline-step-label">{step.label}</div>
                                {step.timestamp && (
                                  <div className="timeline-step-time">
                                    {dayjs(step.timestamp).format('DD/MM/YYYY HH:mm')}
                                  </div>
                                )}
                                {step.recipientName && (
                                  <div className="timeline-step-detail">
                                    Recipient: {step.recipientName}
                                  </div>
                                )}
                                {step.failureReason && (
                                  <div className="timeline-step-detail error">
                                    Reason: {step.failureReason}
                                  </div>
                                )}
                              </div>
                              {!step.completed && index < deliveryTracking.timeline.length - 1 && (
                                <div className="timeline-connector pending"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Status History Accordion */}
                      {deliveryTracking.statusHistory &&
                        deliveryTracking.statusHistory.length > 0 && (
                          <div style={{ marginTop: 24 }}>
                            <details>
                              <summary
                                style={{
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  color: '#4A69E2',
                                  marginBottom: 12,
                                }}
                              >
                                View detailed update history
                              </summary>
                              <div className="status-history">
                                {[...deliveryTracking.statusHistory]
                                  .reverse()
                                  .map((history, index) => (
                                    <div key={index} className="status-history-item">
                                      <Tag color="blue">{history.status}</Tag>
                                      <span style={{ flex: 1 }}>
                                        {history.note || 'Status updated'}
                                      </span>
                                      <span style={{ color: '#999', fontSize: 12 }}>
                                        {dayjs(history.timestamp).format('DD/MM/YYYY HH:mm:ss')}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </details>
                          </div>
                        )}
                    </>
                  )}
                </Card>
              </div>
            )}
          </div>
          <FeedbackModal
            visible={feedbackVisible}
            onCancel={closeFeedbackModal}
            onSaved={handleFeedbackSaved}
            orderId={orderId}
            productId={selectedProduct}
            feedbackId={selectedFeedbackId} // **added**
          />

          {/* Shipper Assignment Modal */}
          <Modal
            title="Assign Shipper to Order"
            open={shipperModalVisible}
            onOk={handleAssignShipper}
            onCancel={() => {
              setShipperModalVisible(false);
              setSelectedShipper(null);
            }}
            confirmLoading={assigningShipper}
            okText="Assign"
          >
            <div style={{ marginBottom: 16 }}>
              <p>Select a shipper for order #{order?.orderNumber}</p>
            </div>
            <Select
              style={{ width: '100%' }}
              placeholder="Select a shipper"
              value={selectedShipper}
              onChange={value => setSelectedShipper(value)}
              showSearch
              optionFilterProp="children"
            >
              {shippers.map(shipper => (
                <Select.Option key={shipper._id} value={shipper._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      {shipper.fullName} ({shipper.vehicleType || 'N/A'})
                    </span>
                    <span style={{ color: '#999', fontSize: '12px' }}>
                      Active: {shipper.currentDeliveryCount} orders
                    </span>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Modal>

          {/* Report Delivery Issue Modal */}
          <Modal
            title={
              <div>
                <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                Report Delivery Issue
              </div>
            }
            open={reportModalVisible}
            onOk={handleSubmitReport}
            onCancel={handleCancelReport}
            confirmLoading={submittingReport}
            okText="Submit Report"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#666', marginBottom: 16 }}>
                Please provide details about the issue with your delivery. Our team will investigate
                and contact you soon.
              </p>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Issue Type <span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <Select
                  style={{ width: '100%' }}
                  value={reportType}
                  onChange={value => setReportType(value)}
                >
                  <Select.Option value="not_received">Not Received</Select.Option>
                  <Select.Option value="damaged">Damaged Product</Select.Option>
                  <Select.Option value="wrong_item">Wrong Item</Select.Option>
                  <Select.Option value="incomplete">Incomplete Order</Select.Option>
                  <Select.Option value="other">Other</Select.Option>
                </Select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Reason <span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <Input.TextArea
                  placeholder="Please describe the issue briefly (required)"
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  showCount
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Additional Details (Optional)
                </label>
                <Input.TextArea
                  placeholder="Provide any additional information that might help us resolve the issue"
                  value={reportDescription}
                  onChange={e => setReportDescription(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  showCount
                />
              </div>

              <div
                style={{
                  background: '#fff7e6',
                  padding: '12px',
                  borderRadius: '4px',
                  border: '1px solid #ffd666',
                }}
              >
                <div style={{ fontSize: '12px', color: '#ad6800' }}>
                  <strong>Note:</strong> Submitting this report will change your order status to
                  "Under Investigation". Our support team will review and contact you within 24-48
                  hours.
                </div>
              </div>
            </div>
          </Modal>
        </>
      ) : (
        <div>
          <h1>You are not authorized to view this page</h1>
        </div>
      )}
    </>
  );
}
