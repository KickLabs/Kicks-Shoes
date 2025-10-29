/**
 * @fileoverview Payment Cancel Page
 * @created 2025-01-27
 * @file PaymentCancel.jsx
 * @description Page to handle cancelled PayOS payments
 */

import { Button, Result, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../services/axiosInstance';

export default function PaymentCancel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Handle payment cancellation
    const handlePaymentCancellation = async () => {
      const pendingOrder = localStorage.getItem('pendingOrder');
      if (pendingOrder) {
        try {
          const { orderId, paymentMethod } = JSON.parse(pendingOrder);
          console.log(`Payment cancelled for order ${orderId} using ${paymentMethod}`);

          // If it's PayOS payment, try to cancel the order
          if (paymentMethod === 'payos' && orderId) {
            setLoading(true);
            try {
              const response = await axiosInstance.post(`/orders/${orderId}/cancel`, {
                reason: 'Payment cancelled by user',
              });

              if (response.data.success) {
                message.success('Order cancelled successfully');
                console.log('Order cancelled successfully:', response.data);
              } else {
                console.warn('Failed to cancel order:', response.data.message);
              }
            } catch (error) {
              console.error('Error cancelling order:', error);
              // Don't show error to user as order might already be cancelled
            } finally {
              setLoading(false);
            }
          }

          // Clear pending order
          localStorage.removeItem('pendingOrder');
        } catch (error) {
          console.error('Error parsing pending order:', error);
          localStorage.removeItem('pendingOrder');
        }
      }
    };

    handlePaymentCancellation();
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
        subTitle={
          loading
            ? 'Processing cancellation...'
            : 'Your payment has been cancelled. You can retry the payment or continue shopping.'
        }
        extra={[
          <Button type="primary" key="retry" onClick={handleRetryPayment} loading={loading}>
            Retry Payment
          </Button>,
          <Button key="home" onClick={handleContinueShopping} loading={loading}>
            Continue Shopping
          </Button>,
        ]}
      />
    </div>
  );
}
