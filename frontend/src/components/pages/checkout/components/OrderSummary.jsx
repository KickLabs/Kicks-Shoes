import { Card, Col, Divider, Row, Typography } from "antd";
import "./OrderSummary.css";

const { Title, Text } = Typography;

export default function OrderSummary() {
  return (
    <Card className="order-summary-card">
      <Title level={4} className="order-summary-title">
        Order Summary
      </Title>

      <Row justify="space-between" className="order-summary-row">
        <Col>
          <Text className="order-summary-text">1 ITEM</Text>
        </Col>
        <Col>
          <Text strong>$130.00</Text>
        </Col>
      </Row>

      <Row justify="space-between" className="order-summary-row">
        <Col>
          <Text className="order-summary-text">Delivery</Text>
        </Col>
        <Col>
          <Text>$6.99</Text>
        </Col>
      </Row>

      <Row justify="space-between" className="order-summary-row">
        <Col>
          <Text className="order-summary-text">Sales Tax</Text>
        </Col>
        <Col>
          <Text>-</Text>
        </Col>
      </Row>

      <Divider className="order-summary-divider" />

      <Row justify="space-between">
        <Col>
          <Text strong>Total</Text>
        </Col>
        <Col>
          <Text style={{ fontSize: "18px" }}>$130.00</Text>
        </Col>
      </Row>
    </Card>
  );
}
