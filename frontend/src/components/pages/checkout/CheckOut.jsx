import { useState } from 'react';
import { Layout, Row, Col, Card } from 'antd';
import CheckoutForm from './components/CheckOutForm';
import OrderSummary from './components/OrderSummary';
import OrderDetails from './components/OrderDetails';
import './CheckOut.css';

export default function CheckoutPage() {
  // Dữ liệu demo theo sản phẩm Nike Zoom Vomero 5
  const [products] = useState([
    {
      id: '68592c166b62c151554c73c7',
      name: 'Nike Zoom Vomero 5',
      description: 'Carve out a new lane for yourself in the Zoom Vomero 5. A richly layer…',
      brand: 'Nike',
      sku: 'FJ4151',
      tags: ['Running', 'Boost', 'Sneakers'],
      status: true,
      mainImage: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/1ccfd…',
      rating: 4.5,
      isNew: true,
      price: {
        regular: 135,
        discountPercent: 14,
        isOnSale: true,
      },
      category: 'Hiking',
      stock: 0,
      sales: 0,
      sizes: [38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
      colors: ['Black', 'White', 'Grey'],
      inventory: [
        { size: 38, color: 'Black', quantity: 10, isAvailable: true, sku: 'FJ4151-38-Black' },
        // ... các inventory khác
      ],
      quantity: 1, // demo số lượng đặt hàng
      size: 42, // demo size chọn
      color: 'Black', // demo màu chọn
      // Để OrderDetails dùng đúng key
    },
  ]);
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [discount] = useState(20); // demo discount
  const [tax] = useState(0); // demo tax
  const [notes, setNotes] = useState(''); // Ghi chú đơn hàng
  const [paymentMethod, setPaymentMethod] = useState('creditCard');

  const deliveryCost = deliveryMethod === 'standard' ? 6.99 : 0;
  const subtotal = products.reduce((sum, p) => {
    const price =
      p.price?.isOnSale && p.price?.discountPercent
        ? p.price.regular * (1 - p.price.discountPercent / 100)
        : p.price?.regular || p.price;
    return sum + price * (p.quantity || 1);
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
              products={products}
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
          <OrderDetails products={products} discount={discount} notes={notes} setNotes={setNotes} />
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
