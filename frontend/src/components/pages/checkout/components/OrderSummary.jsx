import { Card, Col, Divider, Row, Typography, Input, Button, Space } from 'antd';
import { useState } from 'react';
import { formatPrice } from '../../../../utils/StringFormat';
import './OrderSummary.css';

const { Title, Text } = Typography;

export default function OrderSummary({
  subtotal,
  deliveryCost,
  discount,
  tax,
  total,
  onApplyCoupon,
}) {
  const [coupon, setCoupon] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setApplying(true);
    if (onApplyCoupon) {
      await onApplyCoupon(coupon.trim());
    }
    setApplying(false);
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

      {discount > 0 && (
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
