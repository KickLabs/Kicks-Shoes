import {
  Card,
  Typography,
  Radio,
  Space,
  Row,
  Col,
  Form,
  Checkbox,
  Button,
} from "antd";
import "./DeliveryOptions.css";

const { Title, Text } = Typography;

export default function DeliveryOptions({ deliveryMethod, setDeliveryMethod }) {
  return (
    <Card className="delivery-card">
      <Title level={4} className="delivery-title">
        Delivery Options
      </Title>

      <Radio.Group
        value={deliveryMethod}
        onChange={(e) => setDeliveryMethod(e.target.value)}
        className="delivery-radio-group"
      >
        <Space direction="vertical" className="delivery-radio-space">
          <Card
            onClick={() => setDeliveryMethod("standard")}
            className="delivery-option-card"
            style={{
              borderColor: deliveryMethod === "standard" ? "black" : "#d9d9d9",
              backgroundColor:
                deliveryMethod === "standard" ? "#e7e7e3" : "#ffffff",
            }}
          >
            <Row
              justify="space-between"
              align="middle"
              className="delivery-row"
            >
              <Col>
                <Text className="delivery-text">Standard Delivery</Text>
                <div>
                  <Text type="secondary">
                    Enter your address to see when you'll get your order
                  </Text>
                </div>
              </Col>
              <Col>
                <Text style={{ color: "#4a69e2" }} strong>
                  $6.99
                </Text>
              </Col>
            </Row>
          </Card>

          <Card
            onClick={() => setDeliveryMethod("store")}
            className="delivery-option-card"
            style={{
              borderColor: deliveryMethod === "store" ? "black" : "#d9d9d9",
              backgroundColor:
                deliveryMethod === "store" ? "#e7e7e3" : "#ffffff",
            }}
          >
            <Row
              justify="space-between"
              align="middle"
              className="delivery-row"
            >
              <Col>
                <Text className="delivery-text">Collect in store</Text>
                <div>
                  <Text type="secondary">Pay now, collect in store</Text>
                </div>
              </Col>
              <Col>
                <Text strong>Free</Text>
              </Col>
            </Row>
          </Card>
        </Space>
      </Radio.Group>

      <Form layout="vertical" className="delivery-form">
        <Form.Item name="sameAddress">
          <Checkbox>My billing and delivery information are the same</Checkbox>
        </Form.Item>

        <Form.Item name="ageVerification">
          <Checkbox>I'm 13+ year old</Checkbox>
        </Form.Item>

        <div className="delivery-updates-text">
          <Text className="delivery-updates-text-paragraph">
            Also want product updates with our newsletter?
          </Text>
        </div>

        <Form.Item name="newsletter">
          <Checkbox>
            Yes, I'd like to receive emails about exclusive sales and more.
          </Checkbox>
        </Form.Item>
      </Form>

      <Button
        type="default"
        size="large"
        block
        className="review-button"
        onClick={() => navigate("/checkout")}
        style={{ height: 48, width: "100%", marginTop: 16, color: "white" }}
      >
        REVIEW AND PAY
      </Button>
    </Card>
  );
}
