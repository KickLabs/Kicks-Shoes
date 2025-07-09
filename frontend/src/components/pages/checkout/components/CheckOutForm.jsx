import { useState, useEffect } from 'react';
import { Form, Typography, Button, message, Radio } from 'antd';
import ContactDetails from './ContactDetails';
import ShippingAddress from './ShippingAddress';
import DeliveryOptions from './DeliveryOptions';
import orderService from '../../../../services/orderService';
import VNPayService from '../../../../services/vnpayService';
import { useAuth } from '../../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

function splitFullName(fullName = '') {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1).join(' '),
  };
}

export default function CheckoutForm({
  deliveryMethod,
  setDeliveryMethod,
  products,
  subtotal,
  deliveryCost,
  discount,
  discountCode,
  tax,
  total,
  notes,
  setNotes,
  paymentMethod,
  setPaymentMethod,
  isBuyNow = false,
}) {
  const [form] = Form.useForm();
  const [shippingForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({ email: user.email });
      let firstName = user.firstName || '';
      let lastName = user.lastName || '';
      if ((!firstName || !lastName) && user.fullName) {
        const split = splitFullName(user.fullName);
        firstName = split.firstName;
        lastName = split.lastName;
      }
      shippingForm.setFieldsValue({
        firstName,
        lastName,
        address: user.address || '',
        phone: user.phone || '',
      });
    }
    // Check for existing pending order
    const pendingOrder = localStorage.getItem('pendingOrder');
    if (pendingOrder) {
      try {
        const { orderData } = JSON.parse(pendingOrder);
        // Pre-fill form with existing order data if available
        if (orderData) {
          // You can pre-fill form fields here if needed
          console.log('Found pending order:', orderData);
        }
      } catch (error) {
        console.error('Error parsing pending order:', error);
        localStorage.removeItem('pendingOrder');
      }
    }
  }, [user]);

  const validateForm = () => {
    const email = form.getFieldValue('email');
    const shippingValues = shippingForm.getFieldsValue();

    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      message.error('Please enter a valid email address.');
      return false;
    }
    if (!shippingValues.firstName || !shippingValues.lastName) {
      message.error('Please enter your full name.');
      return false;
    }
    if (!shippingValues.address) {
      message.error('Please enter your shipping address.');
      return false;
    }
    if (!shippingValues.phone || !/^\d{9,15}$/.test(shippingValues.phone)) {
      message.error('Please enter a valid phone number.');
      return false;
    }
    if (!paymentMethod) {
      message.error('Please select a payment method.');
      return false;
    }
    return true;
  };

  const prepareOrderData = () => {
    const orderProducts = (products || []).map(p => {
      // Handle different price structures for both cart items and buy now items
      let price = 0;

      if (isBuyNow && p.productDetails) {
        // Buy now item - use the stored price
        price = Number(p.price);
      } else if (p.product?.price) {
        if (typeof p.product.price === 'object') {
          // Price object with regular, discountPercent, etc.
          if (p.product.price.isOnSale && p.product.price.discountPercent) {
            price = Number(
              (p.product.price.regular * (1 - p.product.price.discountPercent / 100)).toFixed(2)
            );
          } else {
            price = Number(p.product.price.regular || 0);
          }
        } else {
          // Direct price number
          price = Number(p.product.price);
        }
      } else if (p.price) {
        // Fallback to item price
        price = Number(p.price);
      }

      // Get product ID - handle both cart items and buy now items
      let productId;
      if (isBuyNow && p.productDetails) {
        productId = p.product; // For buy now, product ID is stored directly
      } else {
        productId = p.product?._id || p.id;
      }

      // Validate that we have a valid product ID
      if (!productId) {
        throw new Error(
          `Missing product ID for item: ${p.product?.name || p.productDetails?.name || 'Unknown product'}`
        );
      }

      return {
        id: productId,
        quantity: p.quantity || 1,
        price,
        size: p.size,
        color: p.color,
      };
    });

    const subtotalNum = orderProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const deliveryCostNum = Number(deliveryCost);
    const taxNum = Number(tax);
    const discountNum = Number(discount);
    const totalNum = subtotalNum + deliveryCostNum + taxNum - discountNum;

    if ([subtotalNum, totalNum, deliveryCostNum, taxNum, discountNum].some(v => isNaN(v))) {
      throw new Error('Invalid number value');
    }

    const shippingValues = shippingForm.getFieldsValue();
    const shippingAddress =
      `${shippingValues.firstName || ''} ${shippingValues.lastName || ''}, ${shippingValues.address || ''}, ${shippingValues.phone || ''}`.trim();

    const orderData = {
      products: orderProducts,
      subtotal: subtotalNum,
      totalPrice: totalNum,
      totalAmount: totalNum,
      paymentMethod,
      shippingAddress,
      shippingMethod: deliveryMethod,
      shippingCost: deliveryCostNum,
      tax: taxNum,
      discount: discountNum,
      discountCode: discountCode || '',
      notes: notes || '',
    };

    // Debug logging
    console.log('Prepared order data:', orderData);
    console.log('Original products:', products);
    console.log('Order products:', orderProducts);
    console.log('Delivery method:', deliveryMethod);
    console.log('Is buy now:', isBuyNow);

    return orderData;
  };

  const handlePaymentMethodChange = method => {
    setPaymentMethod(method);
  };

  const clearPendingOrder = () => {
    localStorage.removeItem('pendingOrder');
    message.info('Previous order cleared. You can create a new order.');
  };

  const getButtonText = () => {
    const pendingOrder = localStorage.getItem('pendingOrder');
    if (pendingOrder && paymentMethod === 'vnpay') {
      return 'RETRY VNPAY PAYMENT';
    }
    if (paymentMethod === 'vnpay') {
      return 'PAY WITH VNPAY';
    }
    if (paymentMethod === 'cash_on_delivery') {
      return 'PLACE ORDER (CASH ON DELIVERY)';
    }
    return 'REVIEW AND PAY';
  };

  const handleVNPayPayment = async () => {
    try {
      setLoading(true);

      // Check if user is authenticated
      if (!user) {
        message.error('Please login to continue with payment');
        return;
      }

      // Check for existing pending order
      const existingPendingOrder = localStorage.getItem('pendingOrder');
      let orderId;
      let orderData;

      if (existingPendingOrder) {
        try {
          const parsed = JSON.parse(existingPendingOrder);
          orderId = parsed.orderId;
          orderData = parsed.orderData;
        } catch (error) {
          console.error('Error parsing existing pending order:', error);
          localStorage.removeItem('pendingOrder');
        }
      }

      // If no existing order, create new one
      if (!orderId) {
        // Prepare order data with pending status
        orderData = prepareOrderData();
        orderData.status = 'pending';
        orderData.paymentStatus = 'pending';

        // Create order first with pending status
        const orderResponse = await orderService.createOrder(orderData);
        if (orderResponse.success === false) {
          throw new Error(orderResponse.message || 'Failed to create order');
        }
        const createdOrder = orderResponse.data || orderResponse;
        orderId = createdOrder._id; // Always use _id
        if (!orderId) {
          throw new Error('Order created but no ID returned');
        }
      }

      // Create payment data for VNPay
      const paymentData = {
        amount: total,
        orderId: orderId, // Use the created order _id
        orderInfo: `Payment for order ${orderId} - ${products.length} items`,
        returnUrl: `${window.location.origin}/payment/return`,
        ipAddr: '127.0.0.1', // In production, get real IP
      };

      // Call VNPay service to create payment
      const response = await VNPayService.createPayment(paymentData);

      if (response.success && response.data.paymentUrl) {
        // Store order info for payment return page
        localStorage.setItem(
          'pendingOrder',
          JSON.stringify({
            orderId,
            orderData,
            txnRef: orderId, // Always use _id as txnRef
            paymentUrl: response.data.paymentUrl,
          })
        );

        // Redirect to VNPay payment page
        VNPayService.redirectToPayment(response.data.paymentUrl);
      } else {
        message.error('Failed to create payment. Please try again.');
      }
    } catch (error) {
      console.error('VNPay payment error:', error);
      message.error('Payment initialization failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCashOnDelivery = async orderData => {
    try {
      setLoading(true);

      // For COD, set payment status as 'paid' since customer will pay on delivery
      const codOrderData = {
        ...orderData,
        paymentStatus: 'paid',
        status: 'processing',
        paymentMethod: 'cash_on_delivery',
        paymentDate: new Date().toISOString(),
      };

      const result = await orderService.createOrder(codOrderData);

      if (result.success) {
        message.success('Order created successfully! Payment will be collected on delivery.');
        navigate('/account/orders');
      } else {
        throw new Error(result.message || 'Failed to create order');
      }
    } catch (err) {
      console.error('Cash on delivery error:', err);
      let errorMsg = 'Order creation failed';
      if (err?.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err?.response?.data?.errors) {
        errorMsg = err.response.data.errors.map(e => e.msg || e.message || e).join(', ');
      } else if (err?.message) {
        errorMsg = err.message;
      }
      console.log('Error message to display:', errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check if user is authenticated
    if (!user) {
      message.error('Please login to continue with payment');
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === 'vnpay') {
        await handleVNPayPayment();
        return;
      }

      if (paymentMethod === 'cash_on_delivery') {
        // Handle Cash on Delivery
        const orderData = prepareOrderData();
        await handleCashOnDelivery(orderData);
        return;
      }

      // Handle other payment methods here
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Handle successful payment
      const orderData = prepareOrderData();
      await handleCashOnDelivery(orderData);
    } catch (error) {
      console.error('Payment error:', error);
      message.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ContactDetails form={form} user={user} />
      <ShippingAddress form={shippingForm} user={user} />
      <DeliveryOptions
        deliveryMethod={deliveryMethod}
        setDeliveryMethod={setDeliveryMethod}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />
      <Button
        type="default"
        size="large"
        block
        loading={loading}
        className="review-button"
        onClick={handleSubmit}
        style={{ height: 48, width: '100%', color: 'white', margin: 0 }}
      >
        {getButtonText()}
      </Button>

      {localStorage.getItem('pendingOrder') && paymentMethod === 'vnpay' && (
        <Button
          type="text"
          size="small"
          onClick={clearPendingOrder}
          style={{ marginTop: 8, color: '#666' }}
        >
          Clear Previous Order
        </Button>
      )}
    </>
  );
}
