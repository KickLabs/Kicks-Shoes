import {
  Card,
  Col,
  Divider,
  Row,
  Typography,
  Input,
  Button,
  Space,
  message,
  Tag,
  Modal,
  List,
  Badge,
} from 'antd';
import { useState, useEffect } from 'react';
import { formatPrice } from '../../../../utils/StringFormat';
import { validateDiscountCode, getActiveDiscounts } from '../../../../services/discountService';
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import './OrderSummary.css';
import VoucherPicker from './VoucherPicker';

const { Title, Text } = Typography;

export default function OrderSummary({
  subtotal,
  deliveryCost,
  discount,
  tax,
  total,
  onApplyCoupon,
  cartItems = [],
}) {
  const [coupon, setCoupon] = useState('');
  const [applying, setApplying] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [voucherOpen, setVoucherOpen] = useState(false);

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) {
      message.warning('Please enter a coupon code');
      return;
    }

    // Check if already applied
    if (appliedDiscounts.some(d => d.code === coupon.trim().toUpperCase())) {
      message.warning('This coupon is already applied');
      return;
    }

    setApplying(true);
    try {
      const response = await validateDiscountCode(coupon.trim(), subtotal, cartItems);

      if (response.data.isValid) {
        const newDiscount = {
          code: coupon.trim().toUpperCase(),
          discountAmount: response.data.discountAmount,
          type: response.data.discount.type,
          value: response.data.discount.value,
          description: response.data.discount.description,
        };

        setAppliedDiscounts(prev => [...prev, newDiscount]);
        if (onApplyCoupon) {
          await onApplyCoupon(coupon.trim(), response.data.discountAmount);
        }
        message.success('Coupon applied successfully!');
        setCoupon('');
      } else {
        message.error(response.data.message || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      message.error('Error applying coupon. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const handleRemoveDiscount = codeToRemove => {
    setAppliedDiscounts(prev => prev.filter(d => d.code !== codeToRemove));
    message.success('Coupon removed');
  };

  const handleSelectDiscount = async discount => {
    if (appliedDiscounts.some(d => d.code === discount.code)) {
      message.warning('This coupon is already applied');
      return;
    }

    setApplying(true);
    try {
      const response = await validateDiscountCode(discount.code, subtotal, cartItems);

      if (response.data.isValid) {
        const newDiscount = {
          code: discount.code,
          discountAmount: response.data.discountAmount,
          type: discount.type,
          value: discount.value,
          description: discount.description,
        };

        setAppliedDiscounts(prev => [...prev, newDiscount]);
        if (onApplyCoupon) {
          await onApplyCoupon(discount.code, response.data.discountAmount);
        }
        message.success('Coupon applied successfully!');
        setShowDiscountModal(false);
      } else {
        message.error(response.data.message || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      message.error('Error applying coupon. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const handleVoucherApplied = async payload => {
    // payload: { code, discountAmount, meta }
    setAppliedDiscount({
      discountAmount: payload.discountAmount,
      discount: { code: payload.code },
    });
    if (onApplyCoupon) {
      await onApplyCoupon(payload.code, payload.discountAmount);
    }
  };

  return (
    <Card className="order-summary-card">
      <Title level={4} className="order-summary-title">
        Order Summary
      </Title>

      <Row justify="space-between" className="order-summary-row">
        <Col>
          <Text className="order-summary-text">Subtotal</Text>
        </Col>
        <Col>
          <Text strong style={{ fontSize: 16 }}>
            {formatPrice(subtotal)}
          </Text>
        </Col>
      </Row>

      <Row justify="space-between" className="order-summary-row">
        <Col>
          <Text className="order-summary-text">Delivery</Text>
        </Col>
        <Col>
          <Text strong style={{ fontSize: 16 }}>
            {deliveryCost ? formatPrice(deliveryCost) : 'Free'}
          </Text>
        </Col>
      </Row>

      {/* Applied Discounts */}
      {appliedDiscounts.length > 0 && (
        <>
          {appliedDiscounts.map((discount, index) => (
            <Row key={index} justify="space-between" className="order-summary-row">
              <Col>
                <Space>
                  <Text className="order-summary-text">Discount ({discount.code})</Text>
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveDiscount(discount.code)}
                    style={{ color: '#ff4d4f' }}
                  />
                </Space>
              </Col>
              <Col>
                <Text strong style={{ fontSize: 16, color: 'rgb(74, 105, 226)' }}>
                  - {formatPrice(discount.discountAmount)}
                </Text>
              </Col>
            </Row>
          ))}
        </>
      )}

      {/* Legacy discount display for backward compatibility */}
      {discount > 0 && appliedDiscounts.length === 0 && (
        <Row justify="space-between" className="order-summary-row">
          <Col>
            <Text className="order-summary-text">Discount</Text>
          </Col>
          <Col>
            <Text strong style={{ fontSize: 16, color: 'rgb(74, 105, 226)' }}>
              - {formatPrice(discount)}
            </Text>
          </Col>
        </Row>
      )}

      <Row justify="space-between" className="order-summary-row">
        <Col>
          <Text className="order-summary-text">Sales Tax</Text>
        </Col>
        <Col>
          <Text style={{ fontSize: 16 }}>{tax > 0 ? formatPrice(tax) : '-'}</Text>
        </Col>
      </Row>
      {/* Coupon input */}
      <div className="coupon-row">
        <Input
          placeholder="Enter coupon code"
          value={coupon}
          onChange={e => setCoupon(e.target.value)}
          size="large"
        />
        <Button
          style={{ marginLeft: 5 }}
          type="default"
          size="large"
          loading={applying}
          onClick={handleApplyCoupon}
        >
          Apply
        </Button>
        <Button
          style={{ marginLeft: 5 }}
          type="primary"
          size="large"
          onClick={() => setVoucherOpen(true)}
        >
          Voucher
        </Button>
      </div>

      {/* Applied Discounts Display */}
      {appliedDiscounts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>
            Applied Coupons:
          </Text>
          <Space wrap>
            {appliedDiscounts.map((discount, index) => (
              <Tag
                key={index}
                closable
                onClose={() => handleRemoveDiscount(discount.code)}
                color="green"
                style={{ marginBottom: 4 }}
              >
                <CheckCircleOutlined /> {discount.code}
              </Tag>
            ))}
          </Space>
        </div>
      )}
      <Divider className="order-summary-divider" />

      <Row justify="space-between">
        <Col>
          <Text style={{ fontSize: 24 }} strong>
            Total
          </Text>
        </Col>
        <Col>
          <Text strong style={{ fontSize: 24 }}>
            {formatPrice(total)}
          </Text>
        </Col>
      </Row>
      <VoucherPicker
        open={voucherOpen}
        onClose={() => setVoucherOpen(false)}
        orderAmount={subtotal}
        onApplied={handleVoucherApplied}
      />
    </Card>
  );
}
