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
  const [isLoading, setIsLoading] = useState(true);

  // Check if this is a buy now checkout
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const buyNowParam = searchParams.get('buyNow');
    const selectedItemsParam = searchParams.get('selectedItems');

    console.log('Checkout URL params:', {
      buyNowParam,
      selectedItemsParam,
      search: location.search,
    });

    if (buyNowParam === 'true') {
      const buyNowItem = localStorage.getItem('buyNowItem');
      console.log('Buy now item from localStorage:', buyNowItem);

      if (buyNowItem) {
        try {
          const parsedItem = JSON.parse(buyNowItem);
          console.log('Parsed buy now item:', parsedItem);
          setBuyNowItems([parsedItem]);
          setIsBuyNow(true);
          console.log('Set buy now state:', { items: [parsedItem], isBuyNow: true });
        } catch (error) {
          console.error('Error parsing buy now item:', error);
          navigate('/');
        }
      } else {
        // No buy now item found, redirect to home
        console.log('No buy now item found in localStorage');
        navigate('/');
      }
    } else if (selectedItemsParam === 'true') {
      const selectedItems = localStorage.getItem('selectedCartItems');
      console.log('Selected cart items from localStorage:', selectedItems);

      if (selectedItems) {
        try {
          const parsedItems = JSON.parse(selectedItems);
          console.log('Parsed selected cart items:', parsedItems);
          setBuyNowItems(parsedItems);
          setIsBuyNow(true);
          console.log('Set selected items state:', { items: parsedItems, isBuyNow: true });
        } catch (error) {
          console.error('Error parsing selected cart items:', error);
          navigate('/cart');
        }
      } else {
        // No selected items found, redirect to cart
        console.log('No selected cart items found in localStorage');
        navigate('/cart');
      }
    } else {
      console.log('Not a buy now or selected items checkout, using all cart items');
    }

    setIsLoading(false);
  }, [location.search, navigate]);

  // Clean up buy now item from localStorage when component unmounts
  useEffect(() => {
    return () => {
      if (isBuyNow) {
        localStorage.removeItem('buyNowItem');
        localStorage.removeItem('selectedCartItems');
      }
    };
  }, [isBuyNow]);

  const deliveryCost = deliveryMethod === 'standard' ? 30000 : 0;

  // Use buy now items if available, otherwise use cart items
  const itemsToProcess = isBuyNow ? buyNowItems : cartItems;

  console.log('Checkout Debug:', {
    isBuyNow,
    buyNowItems: buyNowItems?.length || 0,
    cartItems: cartItems?.length || 0,
    itemsToProcess: itemsToProcess?.length || 0,
    buyNowItemsData: buyNowItems,
    itemsToProcessData: itemsToProcess,
    locationSearch: location.search,
  });

  // If this is a buy now checkout but we don't have buy now items, redirect
  if (isBuyNow && (!buyNowItems || buyNowItems.length === 0)) {
    console.log('Buy now checkout but no buy now items, redirecting');
    navigate('/');
    return null;
  }

  // Show loading while determining checkout type
  if (isLoading) {
    return <div>Loading checkout...</div>;
  }

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
