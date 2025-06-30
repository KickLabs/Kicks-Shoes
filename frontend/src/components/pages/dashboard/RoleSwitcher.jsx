import React, { useState } from 'react';
import { Card, Button, Space, Alert, Typography, Divider } from 'antd';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function RoleSwitcher() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  const switchToAdmin = () => {
    try {
      const adminUser = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      };

      // Update localStorage
      localStorage.setItem('userInfo', JSON.stringify(adminUser));

      // Update context
      setUser(adminUser);

      setMessage('Switched to Admin role! You can now access the Admin Dashboard.');

      // Auto navigate to admin dashboard after 2 seconds
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (error) {
      console.error('Error switching to Admin:', error);
      setMessage('An error occurred while switching roles!');
    }
  };

  const switchToShopOwner = () => {
    try {
      const shopUser = {
        id: 2,
        name: 'Shop Owner',
        email: 'shop@example.com',
        role: 'shop',
      };

      // Update localStorage
      localStorage.setItem('userInfo', JSON.stringify(shopUser));

      // Update context
      setUser(shopUser);

      setMessage('Switched to Shop Owner role! You can now access the Shop Dashboard.');

      // Auto navigate to shop dashboard after 2 seconds
      setTimeout(() => {
        navigate('/shop');
      }, 2000);
    } catch (error) {
      console.error('Error switching to Shop Owner:', error);
      setMessage('An error occurred while switching roles!');
    }
  };

  const switchToCustomer = () => {
    try {
      const customerUser = {
        id: 3,
        name: 'Customer',
        email: 'customer@example.com',
        role: 'customer',
      };

      // Update localStorage
      localStorage.setItem('userInfo', JSON.stringify(customerUser));

      // Update context
      setUser(customerUser);

      setMessage('Switched to Customer role!');
    } catch (error) {
      console.error('Error switching to Customer:', error);
      setMessage('An error occurred while switching roles!');
    }
  };

  const goToDemo = () => {
    navigate('/dashboard-new');
  };

  const goToAdminDashboard = () => {
    navigate('/admin');
  };

  const goToShopDashboard = () => {
    navigate('/shop');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
        🔄 Role Switcher - Switch User Roles
      </Title>

      <Card title="Current User Information" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="small">
          <Text>
            <strong>Name:</strong> {user?.name || 'Not logged in'}
          </Text>
          <Text>
            <strong>Email:</strong> {user?.email || 'N/A'}
          </Text>
          <Text>
            <strong>Role:</strong> {user?.role || 'CUSTOMER'}
          </Text>
        </Space>
      </Card>

      {message && (
        <Alert
          message={message}
          type="success"
          showIcon
          style={{ marginBottom: '24px' }}
          closable
          onClose={() => setMessage('')}
        />
      )}

      <Card title="Switch Roles" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>👑 Admin Role</Title>
            <Text>Access Admin Dashboard with full system management features</Text>
            <br />
            <Space style={{ marginTop: '8px' }}>
              <Button type="primary" onClick={switchToAdmin}>
                Switch to Admin
              </Button>
              <Button onClick={goToAdminDashboard}>Go to Admin Dashboard</Button>
            </Space>
          </div>

          <Divider />

          <div>
            <Title level={4}>🏪 Shop Owner Role</Title>
            <Text>Access Shop Dashboard to manage your store</Text>
            <br />
            <Space style={{ marginTop: '8px' }}>
              <Button type="primary" onClick={switchToShopOwner}>
                Switch to Shop Owner
              </Button>
              <Button onClick={goToShopDashboard}>Go to Shop Dashboard</Button>
            </Space>
          </div>

          <Divider />

          <div>
            <Title level={4}>👤 Customer Role</Title>
            <Text>Regular customer role</Text>
            <br />
            <Button onClick={switchToCustomer} style={{ marginTop: '8px' }}>
              Switch to Customer
            </Button>
          </div>

          <Divider />

          <div>
            <Title level={4}>📋 Demo Dashboard</Title>
            <Text>View system overview demo page</Text>
            <br />
            <Button type="dashed" onClick={goToDemo} style={{ marginTop: '8px' }}>
              View Demo Dashboard
            </Button>
          </div>
        </Space>
      </Card>

      <Card title="📋 Quick Guide">
        <Space direction="vertical" size="small">
          <Text>1. Select the role you want to test</Text>
          <Text>2. System will automatically navigate to the corresponding dashboard</Text>
          <Text>3. Or access manually:</Text>
          <Text style={{ marginLeft: '16px' }}>
            • Admin: <code>/admin</code>
          </Text>
          <Text style={{ marginLeft: '16px' }}>
            • Shop Owner: <code>/shop</code>
          </Text>
          <Text style={{ marginLeft: '16px' }}>
            • Demo: <code>/dashboard-new</code>
          </Text>
        </Space>
      </Card>
    </div>
  );
}
