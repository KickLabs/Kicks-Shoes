import { Pagination } from 'antd';
import { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TableOrders from '../../pages/dashboard/components/TableOrders';
import { ActiveTabContext } from './ActiveTabContext';
import TabHeader from './TabHeader';
import { Dropdown, Button, Menu, message } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';

const OrderList = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const pageSize = 9;

  const { setActiveTab } = useContext(ActiveTabContext);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    setActiveTab('4');
  }, [setActiveTab]);

  const fetchOrders = async () => {
    if (!user?._id) {
      console.error('No user ID available in auth context');
      setError('User information is not available');
      setOrders([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/orders/user/${user._id}`, {
        params: {
          page: currentPage,
          limit: pageSize,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        const { orders: ordersData, pagination } = response.data.data;
        if (Array.isArray(ordersData)) {
          setOrders(ordersData);
          setTotalOrders(pagination?.total || 0);
        } else {
          console.error('Invalid orders data format:', ordersData);
          setError('Invalid orders data format');
          setOrders([]);
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersAdmin = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/orders`, {
        params: {
          page: currentPage,
          limit: pageSize,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        const { orders: ordersData, pagination } = response.data.data;
        if (Array.isArray(ordersData)) {
          setOrders(ordersData);
          setTotalOrders(pagination?.total || 0);
        } else {
          console.error('Invalid orders data format:', ordersData);
          setError('Invalid orders data format');
          setOrders([]);
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDashboard) {
      fetchOrdersAdmin();
    } else {
      fetchOrders();
    }
  }, [currentPage, user?._id, isDashboard]);

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setLoading(true);
      const response = await axios.patch(
        `/api/orders/${orderId}/status`,
        { status: newStatus.toLowerCase() },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        message.success('Order status updated successfully');
        // Refresh orders list
        if (isDashboard) {
          fetchOrdersAdmin();
        } else {
          fetchOrders();
        }
      } else {
        throw new Error(response.data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      message.error(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const statusMenu = orderId => (
    <Menu
      items={[
        { label: 'Pending', key: 'pending' },
        { label: 'Processing', key: 'processing' },
        { label: 'Shipped', key: 'shipped' },
        { label: 'Delivered', key: 'delivered' },
        { label: 'Cancelled', key: 'cancelled' },
        { label: 'Refunded', key: 'refunded' },
      ]}
      onClick={({ key }) => handleStatusUpdate(orderId, key)}
    />
  );

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h3>Error: {error}</h3>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TabHeader breadcrumb="Order List" />
        {isDashboard && user?.role === 'admin' && selectedOrderId && (
          <Dropdown overlay={statusMenu(selectedOrderId)} trigger={['click']}>
            <Button style={{ height: 45 }}>
              Change Status <DownOutlined />
            </Button>
          </Dropdown>
        )}
      </div>

      <TableOrders
        title="Recent Purchases"
        orders={orders}
        dashboard={isDashboard}
        loading={loading}
        onOrderSelect={setSelectedOrderId}
      />
      <div className="pagination-container">
        <Pagination
          current={currentPage}
          total={totalOrders}
          pageSize={pageSize}
          onChange={handlePageChange}
        />
      </div>
    </>
  );
};

export default OrderList;
