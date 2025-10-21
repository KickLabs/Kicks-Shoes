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
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);

  // Load available discounts on component mount
  useEffect(() => {
    loadAvailableDiscounts();
  }, []);

  const loadAvailableDiscounts = async () => {
    setLoadingDiscounts(true);
    try {
      const response = await getActiveDiscounts();
      setAvailableDiscounts(response.data || []);
    } catch (error) {
      console.error('Error loading discounts:', error);
    } finally {
      setLoadingDiscounts(false);
    }
  };
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

        // ✅ Thay vì cộng thêm, chỉ giữ 1 voucher
        setAppliedDiscounts([newDiscount]);

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

        // ✅ Chỉ giữ 1 voucher duy nhất
        setAppliedDiscounts([newDiscount]);

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

  const getTotalDiscountAmount = () => {
    return appliedDiscounts.reduce((sum, discount) => sum + discount.discountAmount, 0);
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
      {/* Enhanced Coupon Section */}
      <div style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
          <Input
            placeholder="Enter coupon code"
            value={coupon}
            onChange={e => setCoupon(e.target.value)}
            size="large"
            onPressEnter={handleApplyCoupon}
          />
          <Button
            style={{ marginLeft: 7 }}
            type="default"
            size="large"
            loading={applying}
            onClick={handleApplyCoupon}
          >
            Apply
          </Button>
        </Space.Compact>

        <Button
          type="dashed"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => setShowDiscountModal(true)}
          style={{ width: '100%' }}
        >
          Browse Available Coupons
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

      {/* Available Coupons Modal */}
      <Modal
        title="Available Coupons"
        open={showDiscountModal}
        onCancel={() => setShowDiscountModal(false)}
        footer={null}
        width={600}
      >
        <List
          loading={loadingDiscounts}
          dataSource={availableDiscounts}
          renderItem={discount => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleSelectDiscount(discount)}
                  loading={applying}
                  disabled={appliedDiscounts.some(d => d.code === discount.code)}
                >
                  {appliedDiscounts.some(d => d.code === discount.code) ? 'Applied' : 'Apply'}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{discount.code}</Text>
                    {appliedDiscounts.some(d => d.code === discount.code) && (
                      <Badge status="success" text="Applied" />
                    )}
                  </Space>
                }
                description={
                  <div>
                    <div>{discount.description}</div>
                    <div style={{ marginTop: 4 }}>
                      <Tag color="blue">
                        {discount.type === 'percentage'
                          ? `${discount.value}% off`
                          : `${formatPrice(discount.value)} off`}
                      </Tag>
                      {discount.minPurchase > 0 && (
                        <Tag color="orange">Min: {formatPrice(discount.minPurchase)}</Tag>
                      )}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </Card>
  );
}
