import { useState } from 'react';
import { Layout, Row, Col, Card } from 'antd';
import CheckoutForm from './components/CheckOutForm';
import OrderSummary from './components/OrderSummary';
import OrderDetails from './components/OrderDetails';
import './CheckOut.css';
import { useSelector } from 'react-redux';

export default function CheckoutPage() {
  const cartItems = useSelector(state => state.cart.items);
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [discount] = useState(20);
  const [tax] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [orderStatus, setOrderStatus] = useState('pending');
  const [paymentStatus, setPaymentStatus] = useState('pending');

  const deliveryCost = deliveryMethod === 'standard' ? 6.99 : 0;
  const subtotal = cartItems.reduce((sum, item) => {
    let price = 0;
    if (item.product && item.product.price) {
      if (item.product.price.isOnSale && item.product.price.discountPercent) {
        price = item.product.price.regular * (1 - item.product.price.discountPercent / 100);
      } else {
        price = item.product.price.regular;
      }
    } else if (item.price) {
      price = item.price;
    }
    return sum + price * (item.quantity || 1);
  }, 0);
  const total = subtotal + deliveryCost + tax - discount;

  return (
    <Layout className="checkout-layout">
      <Row gutter={[24, 24]} wrap>
        <Col xs={{ span: 24, order: 3 }} md={{ span: 16, order: 1 }}>
          <Card
            style={{
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              border: 'none',
            }}
          >
            <CheckoutForm
              deliveryMethod={deliveryMethod}
              setDeliveryMethod={setDeliveryMethod}
              products={cartItems}
              subtotal={subtotal}
              deliveryCost={deliveryCost}
              discount={discount}
              tax={tax}
              total={total}
              notes={notes}
              setNotes={setNotes}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />
          </Card>
        </Col>

        <Col xs={{ span: 24, order: 1 }} md={{ span: 8, order: 2 }} className="checkout-right-col">
          <OrderDetails
            products={cartItems}
            discount={discount}
            notes={notes}
            setNotes={setNotes}
            status={orderStatus}
            paymentStatus={paymentStatus}
          />
          <OrderSummary
            subtotal={subtotal}
            deliveryCost={deliveryCost}
            discount={discount}
            tax={tax}
            total={total}
          />
        </Col>
      </Row>
    </Layout>
  );
}
