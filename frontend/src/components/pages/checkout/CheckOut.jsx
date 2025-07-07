import { useState, useEffect } from 'react';
import { Layout, Row, Col, Card } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import CheckoutForm from './components/CheckOutForm';
import OrderSummary from './components/OrderSummary';
import OrderDetails from './components/OrderDetails';
import './CheckOut.css';
import { useSelector } from 'react-redux';

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const cartItems = useSelector(state => state.cart.items);
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [discount] = useState(0);
  const [tax] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [orderStatus, setOrderStatus] = useState('pending');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [buyNowItems, setBuyNowItems] = useState([]);
  const [isBuyNow, setIsBuyNow] = useState(false);

  // Check if this is a buy now checkout
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const buyNowParam = searchParams.get('buyNow');

    if (buyNowParam === 'true') {
      const buyNowItem = localStorage.getItem('buyNowItem');
      if (buyNowItem) {
        try {
          const parsedItem = JSON.parse(buyNowItem);
          setBuyNowItems([parsedItem]);
          setIsBuyNow(true);
        } catch (error) {
          console.error('Error parsing buy now item:', error);
          navigate('/');
        }
      } else {
        // No buy now item found, redirect to home
        navigate('/');
      }
    }
  }, [location.search, navigate]);

  // Clean up buy now item from localStorage when component unmounts
  useEffect(() => {
    return () => {
      if (isBuyNow) {
        localStorage.removeItem('buyNowItem');
      }
    };
  }, [isBuyNow]);

  const deliveryCost = deliveryMethod === 'standard' ? 30000 : 0;

  // Use buy now items if available, otherwise use cart items
  const itemsToProcess = isBuyNow ? buyNowItems : cartItems;

  const subtotal = itemsToProcess.reduce((sum, item) => {
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

  // If no items to process, redirect to home
  if (itemsToProcess.length === 0) {
    navigate('/');
    return null;
  }

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
              products={itemsToProcess}
              subtotal={subtotal}
              deliveryCost={deliveryCost}
              discount={discount}
              tax={tax}
              total={total}
              notes={notes}
              setNotes={setNotes}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              isBuyNow={isBuyNow}
            />
          </Card>
        </Col>

        <Col xs={{ span: 24, order: 1 }} md={{ span: 8, order: 2 }} className="checkout-right-col">
          <OrderDetails
            products={itemsToProcess}
            discount={discount}
            notes={notes}
            setNotes={setNotes}
            status={orderStatus}
            paymentStatus={paymentStatus}
            isBuyNow={isBuyNow}
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
