import {
  Card,
  Typography,
  Row,
  Col,
  Image,
  Space,
  Divider
} from "antd"
import "./OrderDetails.css"
import nikeProductImage from "@assets/images/nikeproduct.png"

const { Title, Text } = Typography

export default function OrderDetails() {
  return (
    <Card>
      <Title level={4} className="order-card-title">
        Order Details
      </Title>

      <Row gutter={16} align="middle">
        <Col span={8}>
          <Image
            src={nikeProductImage}
            alt="DROPSET TRAINER SHOES"
            preview={false}
            className="order-image"
          />
        </Col>
        <Col span={16}>
          <Text strong className="order-product-name">
            DROPSET TRAINER SHOES
          </Text>
          <Text type="secondary" className="order-product-description">
            Men's Road Running Shoes
          </Text>
          <Text type="secondary" className="order-product-color">
            Enamel Blue/University White
          </Text>
          <Space className="order-product-info">
            <Text>Size 10</Text>
            <Divider type="vertical" />
            <Text>Quantity 1</Text>
          </Space>
          <Text strong className="order-product-price">
            $130.00
          </Text>
        </Col>
      </Row>
    </Card>
  )
}
