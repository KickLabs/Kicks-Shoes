/**
 * @fileoverview Payment Success Page
 * @created 2025-01-27
 * @file PaymentSuccess.jsx
 * @description Page to handle successful PayOS payments
 */

import { Button, Card, Result, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import orderService from '../../../services/orderService';
import { useDispatch, useSelector } from 'react-redux';
import { removeOrderedItems } from '../cart/cartSlice';

export default function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart?.items || []);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        // Get order info from localStorage
        const pendingOrder = localStorage.getItem('pendingOrder');

        if (!pendingOrder) {
          setError('No pending order found');
          setLoading(false);
          return;
        }

        const { orderId, orderData, paymentMethod } = JSON.parse(pendingOrder);

        if (paymentMethod === 'payos') {
          // For PayOS, we need to verify payment status
          // In a real implementation, you would call your backend to verify the payment
          // For now, we'll simulate a successful payment

          // Update order status to paid
          const updateData = {
            paymentStatus: 'paid',
            status: 'processing',
            paymentDate: new Date().toISOString(),
          };

          const result = await orderService.updateOrder(orderId, updateData);

          if (result.success) {
            setOrderInfo({
              orderId,
              orderNumber: result.data.orderNumber,
              totalPrice: result.data.totalPrice,
              paymentMethod: 'PayOS',
            });

            // Clear pending order and remove ordered items from cart
            localStorage.removeItem('pendingOrder');
            if (orderData && orderData.products) {
              // Map order products back to cart items for removal
              const cartItemsToRemove = cartItems.filter(p => {
                const productId = p.product?._id || p.id;
                return orderData.products.some(
                  op => op.id === productId && op.size === p.size && op.color === p.color
                );
              });
              dispatch(removeOrderedItems(cartItemsToRemove));
            }
          } else {
            setError('Failed to update order status');
          }
        } else {
          // Handle other payment methods
          setOrderInfo({
            orderId,
            paymentMethod: paymentMethod || 'Unknown',
          });
          localStorage.removeItem('pendingOrder');
          if (orderData && orderData.products) {
            // Map order products back to cart items for removal
            const cartItemsToRemove = cartItems.filter(p => {
              const productId = p.product?._id || p.id;
              return orderData.products.some(
                op => op.id === productId && op.size === p.size && op.color === p.color
              );
            });
            dispatch(removeOrderedItems(cartItemsToRemove));
          }
        }
      } catch (err) {
        console.error('Payment success handling error:', err);
        setError('An error occurred while processing your payment');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, []);

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleViewOrders = () => {
    navigate('/account/orders');
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <Result
          status="error"
          title="Payment Processing Error"
          subTitle={error}
          extra={[
            <Button type="primary" key="home" onClick={handleContinueShopping}>
              Continue Shopping
            </Button>,
            <Button key="orders" onClick={handleViewOrders}>
              View Orders
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Result
        status="success"
        title="Payment Successful!"
        subTitle={
          orderInfo ? (
            <div>
              <p>Your order has been successfully processed.</p>
              <Card style={{ marginTop: '20px', textAlign: 'left' }}>
                <p>
                  <strong>Order ID:</strong> {orderInfo.orderId}
                </p>
                {orderInfo.orderNumber && (
                  <p>
                    <strong>Order Number:</strong> {orderInfo.orderNumber}
                  </p>
                )}
                {orderInfo.totalPrice && (
                  <p>
                    <strong>Total Amount:</strong> {orderInfo.totalPrice.toLocaleString('vi-VN')}{' '}
                    VND
                  </p>
                )}
                <p>
                  <strong>Payment Method:</strong> {orderInfo.paymentMethod}
                </p>
                <p>
                  <strong>Status:</strong> Processing
                </p>
              </Card>
            </div>
          ) : (
            'Your payment has been processed successfully.'
          )
        }
        extra={[
          <Button type="primary" key="home" onClick={handleContinueShopping}>
            Continue Shopping
          </Button>,
          <Button key="orders" onClick={handleViewOrders}>
            View My Orders
          </Button>,
        ]}
      />
    </div>
  );
}
