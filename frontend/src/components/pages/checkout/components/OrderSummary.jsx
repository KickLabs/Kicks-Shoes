import { Card, Col, Divider, Row, Typography, Input, Button, Space, message } from 'antd';
import { useState } from 'react';
import { formatPrice } from '../../../../utils/StringFormat';
import { validateDiscountCode } from '../../../../services/discountService';
import './OrderSummary.css';

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

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) {
      message.warning('Please enter a coupon code');
      return;
    }

    setApplying(true);
    try {
      const response = await validateDiscountCode(coupon.trim(), subtotal, cartItems);

      if (response.data.isValid) {
        setAppliedDiscount(response.data);
        if (onApplyCoupon) {
          await onApplyCoupon(coupon.trim(), response.data.discountAmount);
        }
        message.success('Coupon applied successfully!');
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

      {(discount > 0 || appliedDiscount) && (
        <Row justify="space-between" className="order-summary-row">
          <Col>
            <Text className="order-summary-text">
              Discount {appliedDiscount && `(${appliedDiscount.discount.code})`}
            </Text>
          </Col>
          <Col>
            <Text strong style={{ fontSize: 16, color: 'rgb(74, 105, 226)' }}>
              - {formatPrice(appliedDiscount ? appliedDiscount.discountAmount : discount)}
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
        <Button type="default" size="large" loading={applying} onClick={handleApplyCoupon}>
          Apply
        </Button>
      </div>
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
    </Card>
  );
}
