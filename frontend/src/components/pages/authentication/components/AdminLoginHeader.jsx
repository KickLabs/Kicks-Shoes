import React from 'react';
import { Typography } from 'antd';

const { Title, Text } = Typography;

const AdminLoginHeader = () => {
  return (
    <>
      <Title level={2}>Admin & Shop Login</Title>
      <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
        Access your admin or shop dashboard
      </Text>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 'fit-content',
        }}
      >
        <a
          href="/forgot-password"
          className="text-link"
          style={{ fontWeight: 'bold', marginBottom: 8 }}
        >
          Forgot your password?
        </a>

        <a href="/login" className="text-link" style={{ fontWeight: 'bold' }}>
          Back to Customer Login
        </a>
      </div>
    </>
  );
};

export default AdminLoginHeader;
