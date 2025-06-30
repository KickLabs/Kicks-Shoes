import React, { useEffect, useState } from 'react';
import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  ExclamationCircleTwoTone,
  LoadingOutlined,
} from '@ant-design/icons';
import { Button, Card, Typography, Descriptions, Spin, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import VNPayService from '../../../services/vnpayService';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;

const PRIMARY_COLOR = '#4A69E2';
const SUCCESS_COLOR = '#52c41a';
const ERROR_COLOR = '#ff4d4f';
const WARNING_COLOR = '#faad14';

function getStatusInfo(responseCode) {
  if (responseCode === '00') {
    return {
      status: 'success',
      title: 'Payment Successful',
      icon: <CheckCircleTwoTone twoToneColor={SUCCESS_COLOR} style={{ fontSize: 64 }} />,
      message: 'Your payment was successful. Thank you for your purchase!',
      color: SUCCESS_COLOR,
    };
  }
  if (responseCode === '24') {
    return {
      status: 'cancel',
      title: 'Payment Cancelled',
      icon: <ExclamationCircleTwoTone twoToneColor={WARNING_COLOR} style={{ fontSize: 64 }} />,
      message: 'You have cancelled the payment. No money was deducted.',
      color: WARNING_COLOR,
    };
  }
  return {
    status: 'fail',
    title: 'Payment Failed',
    icon: <CloseCircleTwoTone twoToneColor={ERROR_COLOR} style={{ fontSize: 64 }} />,
    message: 'Your payment was not successful. Please try again or contact support.',
    color: ERROR_COLOR,
  };
}

function useQuery() {
  return React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const obj = {};
    for (const [key, value] of params.entries()) {
      obj[key] = value;
    }
    return obj;
  }, [window.location.search]);
}

export default function PaymentStatus() {
  const query = useQuery();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [error, setError] = useState(null);

  const statusInfo = getStatusInfo(query.vnp_ResponseCode);

  useEffect(() => {
    const handlePaymentReturn = async (retryCount = 0) => {
      try {
        console.log('=== Payment Status Component Started ===');
        console.log('Retry count:', retryCount);

        // Check if this is a VNPay return
        if (query.vnp_ResponseCode) {
          console.log('VNPay return detected, response code:', query.vnp_ResponseCode);
          console.log('Transaction reference:', query.vnp_TxnRef);

          // Get pending order data from localStorage
          const pendingOrder = localStorage.getItem('pendingOrder');
          let pendingOrderData = null;

          if (pendingOrder) {
            try {
              pendingOrderData = JSON.parse(pendingOrder);
              console.log('Pending order data from localStorage:', pendingOrderData);
            } catch (error) {
              console.error('Error parsing pending order:', error);
            }
          } else {
            console.log('No pending order found in localStorage');
          }

          console.log('About to call VNPayService.verifyPaymentReturn...');

          // Verify payment return
          const result = await VNPayService.verifyPaymentReturn(query, pendingOrderData);
          console.log('VNPayService.verifyPaymentReturn result:', result);

          if (result.success) {
            console.log('Payment verification successful');
            setProcessingComplete(true);

            // Only remove pending order from localStorage after backend has successfully processed
            localStorage.removeItem('pendingOrder');
            console.log('Pending order removed from localStorage');

            if (result.data.paymentSuccess) {
              console.log('Payment successful, showing success message');
              message.success('Payment successful! Order updated.');
            } else {
              console.log('Payment failed, showing warning message');
              message.warning('Payment failed. Order status updated to cancelled.');
            }
          } else {
            console.log('Payment verification failed');
            // Retry up to 3 times if verification fails
            if (retryCount < 3) {
              console.log(`Retrying payment verification (attempt ${retryCount + 1}/3)...`);
              setTimeout(() => handlePaymentReturn(retryCount + 1), 1000);
              return;
            }
            setError('Payment verification failed after multiple attempts');
          }
        } else {
          console.log('No VNPay response code found, invalid payment return');
          setError('Invalid payment return');
        }
      } catch (error) {
        console.error('=== Payment Status Component Error ===');
        console.error('Payment return error:', error);

        // Retry up to 3 times if there's an error
        if (retryCount < 3) {
          console.log(
            `Retrying payment verification due to error (attempt ${retryCount + 1}/3)...`
          );
          setTimeout(() => handlePaymentReturn(retryCount + 1), 1000);
          return;
        }

        setError('Failed to process payment return after multiple attempts');
      } finally {
        if (retryCount === 0) {
          console.log('Payment return processing completed, setting loading to false');
          setLoading(false);
        }
      }
    };

    console.log('PaymentStatus component useEffect triggered');
    handlePaymentReturn();
  }, [query, user]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        <Card
          style={{
            maxWidth: 480,
            width: '100%',
            borderRadius: 18,
            boxShadow: '0 4px 32px 0 rgba(74,105,226,0.10)',
            border: `1.5px solid ${PRIMARY_COLOR}`,
            padding: 0,
          }}
          bodyStyle={{ padding: 32, paddingBottom: 24 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Spin
              size="large"
              indicator={<LoadingOutlined style={{ fontSize: 64, color: PRIMARY_COLOR }} />}
            />
            <Title
              level={2}
              style={{ marginTop: 16, color: PRIMARY_COLOR, fontWeight: 800, letterSpacing: 0.5 }}
            >
              Processing Payment...
            </Title>
            <Text type="secondary" style={{ fontSize: 16, color: '#222', fontWeight: 500 }}>
              Please wait while we verify your payment
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        <Card
          style={{
            maxWidth: 480,
            width: '100%',
            borderRadius: 18,
            boxShadow: '0 4px 32px 0 rgba(74,105,226,0.10)',
            border: `1.5px solid ${ERROR_COLOR}`,
            padding: 0,
          }}
          bodyStyle={{ padding: 32, paddingBottom: 24 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <CloseCircleTwoTone twoToneColor={ERROR_COLOR} style={{ fontSize: 64 }} />
            <Title
              level={2}
              style={{ marginTop: 16, color: PRIMARY_COLOR, fontWeight: 800, letterSpacing: 0.5 }}
            >
              Payment Error
            </Title>
            <Text type="secondary" style={{ fontSize: 16, color: '#222', fontWeight: 500 }}>
              {error}
            </Text>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 32, justifyContent: 'center' }}>
            <Button
              type="primary"
              size="large"
              style={{
                background: PRIMARY_COLOR,
                borderColor: PRIMARY_COLOR,
                fontWeight: 700,
                minWidth: 140,
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(74,105,226,0.08)',
              }}
              onClick={() => navigate('/checkout')}
            >
              Try Again
            </Button>
            <Button
              size="large"
              style={{
                color: PRIMARY_COLOR,
                borderColor: PRIMARY_COLOR,
                fontWeight: 700,
                minWidth: 140,
                borderRadius: 8,
                background: '#fff',
              }}
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      <Card
        style={{
          maxWidth: 480,
          width: '100%',
          borderRadius: 18,
          boxShadow: '0 4px 32px 0 rgba(74,105,226,0.10)',
          border: `1.5px solid ${statusInfo.color}`,
          padding: 0,
        }}
        bodyStyle={{ padding: 32, paddingBottom: 24 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {statusInfo.icon}
          <Title
            level={2}
            style={{ marginTop: 16, color: PRIMARY_COLOR, fontWeight: 800, letterSpacing: 0.5 }}
          >
            {statusInfo.title}
          </Title>
          <Text type="secondary" style={{ fontSize: 16, color: '#222', fontWeight: 500 }}>
            {statusInfo.message}
          </Text>
        </div>
        <Descriptions
          column={1}
          bordered
          size="middle"
          labelStyle={{
            width: 160,
            background: '#f0f6ff',
            color: PRIMARY_COLOR,
            fontWeight: 600,
            fontSize: 15,
          }}
          contentStyle={{ fontWeight: 500, fontSize: 15, color: '#232321', background: '#fff' }}
          style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}
        >
          <Descriptions.Item label="Order Info">{query.vnp_OrderInfo}</Descriptions.Item>
          <Descriptions.Item label="Amount">
            <span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>
              {Number(query.vnp_Amount) / 100} VND
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Bank Code">{query.vnp_BankCode}</Descriptions.Item>
          <Descriptions.Item label="Transaction No.">{query.vnp_TransactionNo}</Descriptions.Item>
          <Descriptions.Item label="Transaction Time">{query.vnp_PayDate}</Descriptions.Item>
          <Descriptions.Item label="Status Code">{query.vnp_ResponseCode}</Descriptions.Item>
        </Descriptions>
        <div style={{ display: 'flex', gap: 14, marginTop: 32, justifyContent: 'center' }}>
          <Button
            type="primary"
            size="large"
            style={{
              background: PRIMARY_COLOR,
              borderColor: PRIMARY_COLOR,
              fontWeight: 700,
              minWidth: 140,
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(74,105,226,0.08)',
            }}
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
          <Button
            size="large"
            style={{
              color: PRIMARY_COLOR,
              borderColor: PRIMARY_COLOR,
              fontWeight: 700,
              minWidth: 140,
              borderRadius: 8,
              background: '#fff',
            }}
            onClick={() => navigate('/account/orders')}
          >
            My Orders
          </Button>
        </div>
      </Card>
    </div>
  );
}
