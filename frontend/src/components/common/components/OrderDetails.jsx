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
import { useContext, useEffect, useState } from 'react';
import { ActiveTabContext } from './ActiveTabContext';
import { useAuth } from '../../../contexts/AuthContext';
import './order-details.css';
import TabHeader from './TabHeader';
import { useLocation } from 'react-router-dom';
import axiosInstance from '@/services/axiosInstance';

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

  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'product',
      key: 'product',
      render: (product, record) => {
        const inventoryItem = product?.inventory?.find(
          inv => inv.size === record.size && inv.color === record.color
        );
        const imageSrc = inventoryItem?.images?.[0] || product?.mainImage || '';
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar src={imageSrc} shape="square" size={32} /> {product?.name || 'N/A'}
          </span>
        );
      },
    },
    {
      title: 'Order ID',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: () => <b style={{ color: '#232321' }}>#{order?.orderNumber}</b>,
    },
    {
      title: 'Size / Color',
      dataIndex: 'sizeColor',
      key: 'sizeColor',
      render: (_, record) => `${record.size || '-'} / ${record.color || '-'}`,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Total',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: val => `$${val?.toFixed ? val.toFixed(2) : '0.00'}`,
    },
  ];

  useEffect(() => {
    setActiveTab('3');
  }, [setActiveTab]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        console.error('No order ID available');
        setError('Order information is not available');
        setOrder(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await axiosInstance.get(`/orders/${orderId}`);

        if (response.data.success) {
          console.log('Order data received:', response.data.data);
          setOrder(response.data.data);
          setNote(response.data.data.notes || '');
        } else {
          throw new Error(response.data.message || 'Failed to fetch order');
        }
      } catch (error) {
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        setError(error.response?.data?.message || 'Failed to fetch order');
        setOrder(null);
        message.error('Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleStatusChange = async value => {
    try {
      setLoading(true);
      const response = await axiosInstance.patch(`/orders/${orderId}/status`, {
        status: value.toLowerCase(),
      });

      if (response.data.success) {
        setOrder(prev => ({ ...prev, status: value.toLowerCase() }));
        message.success('Order status updated successfully');
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

  const handleNoteChange = e => {
    setNote(e.target.value);
  };

  const canCancel =
    user?.role === 'customer' && order?.user?._id === user?._id && order?.status === 'pending';

  const handleCancelOrder = () => {
    message.info('Cancel order');
  };

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
                : `Orders ID: #${order.orderNumber}`
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
                <DatePicker.RangePicker
                  value={[
                    order.createdAt ? dayjs(order.createdAt) : null,
                    order.estimatedDelivery ? dayjs(order.estimatedDelivery) : null,
                  ]}
                  disabled
                />
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
              {showActions && (
                <div className="order-details-header-actions">
                  <Select
                    defaultValue={order.status?.toUpperCase()}
                    style={{ width: 140 }}
                    onChange={handleStatusChange}
                  >
                    <Option value="PENDING">Pending</Option>
                    <Option value="PROCESSING">Processing</Option>
                    <Option value="SHIPPED">Shipped</Option>
                    <Option value="DELIVERED">Delivered</Option>
                    <Option value="CANCELLED">Cancelled</Option>
                    <Option value="REFUNDED">Refunded</Option>
                  </Select>
                  <Button icon={<DownloadOutlined />} />
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

            {showActions && (
              <div className="order-details-actions">
                <Button block>View Customer Profile</Button>
                <Button icon={<DownloadOutlined />} block>
                  Download Order Info
                </Button>
                <Button block>View Delivery Address</Button>
              </div>
            )}

            <div className="order-details-products">
              <div className="order-details-products-title">Products</div>
              <Table
                columns={columns}
                dataSource={order.items?.map((item, index) => ({
                  ...item,
                  key: index,
                }))}
                pagination={false}
                className="order-details-table"
              />
              <div className="order-details-summary">
                <div className="order-details-summary-row">
                  <span>Subtotal</span>
                  <span>${order.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="order-details-summary-row">
                  <span>Tax</span>
                  <span>${order.tax?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="order-details-summary-row">
                  <span>Discount</span>
                  <span>${order.discount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="order-details-total">
                  <span>Total</span>
                  <span>${order.totalPrice?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div>
          <h1>You are not authorized to view this page</h1>
        </div>
      )}
    </>
  );
}
