import React, { useState } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Button,
  message,
  Row,
  Col,
  Typography,
  Divider,
  Alert,
} from 'antd';
import { GiftOutlined, DollarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import axiosInstance from '../../../../services/axiosInstance';

const { Text, Title } = Typography;

export default function RedeemPointsSection({ availablePoints, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  // Logic kinh tế: 1 điểm = 1000 VND, với các mức đổi khác nhau
  const redemptionOptions = [
    {
      id: 'small',
      name: 'Small Discount',
      points: 50,
      discount: 50000, // 50,000 VND
      description: 'Perfect for small purchases',
      ratio: 1000, // 1 point = 1000 VND
    },
    {
      id: 'medium',
      name: 'Medium Discount',
      points: 100,
      discount: 120000, // 120,000 VND (bonus 20%)
      description: 'Great value for medium orders',
      ratio: 1200, // 1 point = 1200 VND (20% bonus)
    },
    {
      id: 'large',
      name: 'Large Discount',
      points: 200,
      discount: 250000, // 250,000 VND (25% bonus)
      description: 'Best value for large orders',
      ratio: 1250, // 1 point = 1250 VND (25% bonus)
    },
    {
      id: 'premium',
      name: 'Premium Discount',
      points: 500,
      discount: 650000, // 650,000 VND (30% bonus)
      description: 'Maximum value for premium orders',
      ratio: 1300, // 1 point = 1300 VND (30% bonus)
    },
  ];

  const handleOptionSelect = option => {
    setSelectedOption(option);
    form.setFieldsValue({
      points: option.points,
      discount: option.discount,
    });
  };

  const handleCustomPoints = points => {
    if (points < 10) {
      form.setFieldsValue({ discount: points * 1000 });
    } else if (points < 50) {
      form.setFieldsValue({ discount: points * 1100 }); // 10% bonus
    } else if (points < 100) {
      form.setFieldsValue({ discount: points * 1200 }); // 20% bonus
    } else if (points < 200) {
      form.setFieldsValue({ discount: points * 1250 }); // 25% bonus
    } else {
      form.setFieldsValue({ discount: points * 1300 }); // 30% bonus
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await axiosInstance.post('/reward-points/redeem', {
        points: values.points,
        discountAmount: values.discount,
        description: `Redeemed ${values.points} points for ${values.discount.toLocaleString()} VND discount`,
      });

      if (response.data.success) {
        const discountData = response.data.data.discount;
        message.success(
          `Points redeemed successfully! Your discount code ${discountData.code} has been sent to your email.`
        );
        form.resetFields();
        setSelectedOption(null);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        message.error(response.data.message || 'Failed to redeem points');
      }
    } catch (error) {
      console.error('Error redeeming points:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to redeem points. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (availablePoints < 10) {
    return (
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e8e8e8',
        }}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <GiftOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Title level={4} style={{ color: '#666', marginBottom: 8 }}>
            Need More Points to Redeem
          </Title>
          <Text type="secondary">
            You need at least 10 points to redeem for discounts. Keep shopping to earn more points!
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e8e8e8',
        margin: 30,
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarOutlined style={{ color: '#1890ff' }} />
          <span>Redeem Points for Discount</span>
        </div>
      }
    >
      {/* Available Points Info */}
      <Alert
        message={`Available Points: ${availablePoints.toLocaleString()} points`}
        type="info"
        showIcon
        icon={<GiftOutlined />}
        style={{ marginBottom: 24 }}
      />

      {/* Redemption Options */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          Choose Redemption Option
        </Title>
        <Row gutter={[16, 16]}>
          {redemptionOptions.map(option => (
            <Col xs={24} sm={12} md={6} key={option.id}>
              <Card
                hoverable
                size="small"
                style={{
                  border:
                    selectedOption?.id === option.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onClick={() => handleOptionSelect(option)}
              >
                <div style={{ textAlign: 'center' }}>
                  <Title level={5} style={{ color: '#1890ff', marginBottom: 8 }}>
                    {option.name}
                  </Title>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                      {option.points} points
                    </Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 18, color: '#f5222d' }}>
                      {formatCurrency(option.discount)}
                    </Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {option.description}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Rate: 1 point = {formatCurrency(option.ratio)}
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Custom Redemption */}
      <Divider>Or Custom Amount</Divider>

      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="points"
              label="Points to Redeem"
              rules={[
                { required: true, message: 'Please enter points to redeem' },
                { type: 'number', min: 10, message: 'Minimum 10 points required' },
                {
                  validator: (_, value) => {
                    if (value > availablePoints) {
                      return Promise.reject('Not enough points available');
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter points"
                min={10}
                max={availablePoints}
                onChange={handleCustomPoints}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="discount" label="Discount Amount (VND)">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Calculated automatically"
                disabled
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Info Section */}
        <Card
          style={{
            marginTop: 16,
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <InfoCircleOutlined style={{ color: '#52c41a', marginTop: 2 }} />
            <div>
              <Text strong style={{ color: '#52c41a' }}>
                How it works:
              </Text>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 16 }}>
                <li>10-49 points: 1 point = 1,000 VND</li>
                <li>50-99 points: 1 point = 1,100 VND (10% bonus)</li>
                <li>100-199 points: 1 point = 1,200 VND (20% bonus)</li>
                <li>200+ points: 1 point = 1,250 VND (25% bonus)</li>
                <li>500+ points: 1 point = 1,300 VND (30% bonus)</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            disabled={!form.getFieldValue('points')}
            size="large"
          >
            Redeem Points
          </Button>
        </div>
      </Form>
    </Card>
  );
}
