import {
  CreditCardOutlined,
  DownloadOutlined,
  HomeOutlined,
  UserOutlined,
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
import axios from 'axios';

const { Option } = Select;

export default function OrderDetails() {
  const { setActiveTab } = useContext(ActiveTabContext);
  const { user } = useAuth();
  const location = useLocation();
  const showActions = location.pathname.includes('/dashboard/orders/');
  const orderId = location.pathname.split('/').pop();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');

  const columns = [
    {
      title: '',
      dataIndex: 'checkbox',
      key: 'checkbox',
      render: () => <input type="checkbox" />,
      width: 40,
    },
    {
      title: 'Product Name',
      dataIndex: 'product',
      key: 'product',
      render: product => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar src={product?.images[0]} shape="square" size={32} /> {product?.name}
        </span>
      ),
    },
    {
      title: 'Order ID',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: () => <b style={{ color: '#232321' }}>#{order?.orderNumber}</b>,
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
      render: val => `$${val?.toFixed(2) || '0.00'}`,
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

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.data.success) {
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
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/orders/${orderId}/status`,
        {
          status: value.toLowerCase(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

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

  return (
    <>
      {order?.user?._id === user?._id || user?.role === 'admin' ? (
        <>
          <TabHeader
            breadcrumb="Order Details"
            anotherBreadcrumb={`Orders ID: #${order.orderNumber}`}
          />
          <div className="order-details-container">
            <div className="order-details-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="order-details-title">
                  Orders ID: <span className="order-details-id">#{order.orderNumber}</span>
                </span>
                <Tag color="orange" className="order-details-status">
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
                  <div>
                    Status: <Tag color="orange">{order.status?.toUpperCase()}</Tag>
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
                  <span>Tax (20%)</span>
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
