import { Card, Typography, Form, Input, Row, Col } from 'antd';
import './ShippingAddress.css';

const { Title, Text } = Typography;

export default function ShippingAddress({ form, user }) {
  return (
    <Card className="shipping-address-card">
      <Title level={4} className="shipping-address-title">
        Shipping Address
      </Title>

      <Form layout="vertical" form={form}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="firstName" className="shipping-address-item">
              <Input
                placeholder="First Name*"
                size="large"
                className="shipping-address-input"
                value={user?.fullName}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="lastName" className="shipping-address-item">
              <Input
                placeholder="Last Name*"
                size="large"
                className="shipping-address-input"
                value={user?.lastName}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="address" className="shipping-address-item">
          <Input
            placeholder="Find Delivery Address*"
            size="large"
            className="shipping-address-input"
            value={user?.address}
          />
        </Form.Item>
        <Text type="secondary" className="shipping-address-note">
          Start typing your street address or zip code for suggestion
        </Text>

        <Form.Item name="phone" className="shipping-address-item">
          <Input placeholder="Phone Number*" size="large" className="shipping-address-input" />
        </Form.Item>
        <Text type="secondary" className="shipping-address-note">
          E.g. (123) 456-7890
        </Text>
      </Form>
    </Card>
  );
}
