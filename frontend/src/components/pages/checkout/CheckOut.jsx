import { Layout, Row, Col } from "antd";
import CheckoutForm from "./components/CheckOutForm";
import OrderSummary from "./components/OrderSummary";
import OrderDetails from "./components/OrderDetails";
import "./CheckOut.css";

export default function CheckoutPage() {
  return (
    <Layout className="checkout-layout">
      <Row gutter={[24, 24]} wrap>
        {/* CheckoutForm - mobile: order 3, desktop: order 1 */}
        <Col xs={{ span: 24, order: 3 }} md={{ span: 16, order: 1 }}>
          <CheckoutForm />
        </Col>

        {/* Right Column: OrderSummary + OrderDetails */}
        <Col
          xs={{ span: 24, order: 1 }}
          md={{ span: 8, order: 2 }}
          className="checkout-right-col"
        >
          <OrderSummary />
          <OrderDetails />
        </Col>
      </Row>
    </Layout>
  );
}
