import React from 'react';
import { Result, Button, Card, Typography, Space, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  StopOutlined,
  MailOutlined,
  HomeOutlined,
  ExclamationCircleOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const Banned = () => {
  const navigate = useNavigate();

  const handleContactSupport = () => {
    window.open('mailto:support@kicksshoes.com?subject=Account Suspension Appeal', '_blank');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          animation: 'fadeInUp 0.8s ease-out',
        }}
      >
        <Card
          style={{
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
          bodyStyle={{ padding: '40px' }}
          className="card-container"
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 8px 24px rgba(255, 77, 79, 0.3)',
              }}
            >
              <StopOutlined style={{ fontSize: '36px', color: 'white' }} />
            </div>

            <Title
              level={2}
              style={{
                color: '#262626',
                marginBottom: '8px',
                fontWeight: '600',
              }}
            >
              Account Suspended
            </Title>

            <Paragraph
              style={{
                fontSize: '16px',
                color: '#8c8c8c',
                marginBottom: '0',
                lineHeight: '1.6',
              }}
            >
              Your account has been temporarily suspended by our administrators.
            </Paragraph>
          </div>

          <Divider style={{ margin: '32px 0' }} />

          <div style={{ marginBottom: '32px' }}>
            <Title
              level={4}
              style={{
                color: '#262626',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
              What happened?
            </Title>

            <Paragraph
              style={{
                fontSize: '14px',
                color: '#595959',
                lineHeight: '1.6',
                marginBottom: '16px',
              }}
            >
              Your account has been suspended due to a violation of our community guidelines or
              terms of service. This action was taken to maintain a safe and respectful environment
              for all users.
            </Paragraph>

            <Title
              level={4}
              style={{
                color: '#262626',
                marginBottom: '16px',
                marginTop: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ClockCircleOutlined style={{ color: '#1890ff' }} />
              What can you do?
            </Title>

            <div
              style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <ul
                style={{
                  margin: '0',
                  paddingLeft: '20px',
                  color: '#595959',
                  lineHeight: '1.6',
                }}
              >
                <li>Contact our support team to understand the reason for suspension</li>
                <li>Provide additional information if you believe this was an error</li>
                <li>Request account restoration if appropriate</li>
                <li>Review our community guidelines to prevent future violations</li>
              </ul>
            </div>
          </div>

          <Divider style={{ margin: '32px 0' }} />

          <div style={{ marginBottom: '32px' }}>
            <Title
              level={4}
              style={{
                color: '#262626',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <PhoneOutlined style={{ color: '#52c41a' }} />
              Contact Information
            </Title>

            <div
              style={{
                background: '#f0f9ff',
                border: '1px solid #91d5ff',
                borderRadius: '8px',
                padding: '20px',
              }}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MailOutlined style={{ color: '#1890ff' }} />
                  <Text strong>Email:</Text>
                  <Text copyable style={{ color: '#1890ff' }}>
                    support@kicksshoes.com
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ClockCircleOutlined style={{ color: '#1890ff' }} />
                  <Text strong>Response time:</Text>
                  <Text>Within 24-48 hours</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Please include your account email in your support request
                  </Text>
                </div>
              </Space>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexDirection: 'row',
            }}
          >
            <Button
              type="primary"
              size="large"
              icon={<MailOutlined />}
              onClick={handleContactSupport}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                fontWeight: '500',
              }}
            >
              Contact Support
            </Button>

            <Button
              size="large"
              icon={<HomeOutlined />}
              onClick={handleGoHome}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '8px',
                border: '1px solid #d9d9d9',
                fontWeight: '500',
              }}
            >
              Go to Homepage
            </Button>
          </div>
        </Card>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 480px) {
          .button-container {
            flex-direction: column !important;
          }

          .card-container {
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Banned;
