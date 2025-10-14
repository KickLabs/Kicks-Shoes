/**
 * @fileoverview Payment Cancel Page
 * @created 2025-01-27
 * @file PaymentCancel.jsx
 * @description Page to handle cancelled PayOS payments
 */

import { Button, Result } from 'antd';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentCancel() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any pending order data when payment is cancelled
    const pendingOrder = localStorage.getItem('pendingOrder');
    if (pendingOrder) {
      try {
        const { orderId, paymentMethod } = JSON.parse(pendingOrder);
        console.log(`Payment cancelled for order ${orderId} using ${paymentMethod}`);

        // Clear pending order
        localStorage.removeItem('pendingOrder');
      } catch (error) {
        console.error('Error parsing pending order:', error);
        localStorage.removeItem('pendingOrder');
      }
    }
  }, []);

  const handleRetryPayment = () => {
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Result
        status="warning"
        title="Payment Cancelled"
        subTitle="Your payment has been cancelled. You can retry the payment or continue shopping."
        extra={[
          <Button type="primary" key="retry" onClick={handleRetryPayment}>
            Retry Payment
          </Button>,
          <Button key="home" onClick={handleContinueShopping}>
            Continue Shopping
          </Button>,
        ]}
      />
    </div>
  );
}
