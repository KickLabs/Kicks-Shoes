import { useState, useEffect } from 'react';
import { Form, Typography, Button, message, Radio } from 'antd';
import ContactDetails from './ContactDetails';
import ShippingAddress from './ShippingAddress';
import DeliveryOptions from './DeliveryOptions';
import orderService from '../../../../services/orderService';
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
  tax,
  total,
  notes,
}) {
  const [form] = Form.useForm();
  const [shippingForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
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
  }, [user]);

  const handleSubmit = async () => {
    try {
      const email = form.getFieldValue('email');
      const shippingValues = shippingForm.getFieldsValue();
      if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        message.error('Please enter a valid email address.');
        return;
      }
      if (!shippingValues.firstName || !shippingValues.lastName) {
        message.error('Please enter your full name.');
        return;
      }
      if (!shippingValues.address) {
        message.error('Please enter your shipping address.');
        return;
      }
      if (!shippingValues.phone || !/^\d{9,15}$/.test(shippingValues.phone)) {
        message.error('Please enter a valid phone number.');
        return;
      }
      if (!paymentMethod) {
        message.error('Please select a payment method.');
        return;
      }
      const orderProducts = (products || []).map(p => ({
        id: p.id,
        quantity: p.quantity || 1,
        price:
          p.price?.isOnSale && p.price?.discountPercent
            ? Number((p.price.regular * (1 - p.price.discountPercent / 100)).toFixed(2))
            : Number(p.price?.regular || p.price),
        size: p.size,
        color: p.color,
      }));
      const subtotalNum = orderProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
      const deliveryCostNum = Number(deliveryCost);
      const taxNum = Number(tax);
      const discountNum = Number(discount);
      const totalNum = subtotalNum + deliveryCostNum + taxNum - discountNum;
      if ([subtotalNum, totalNum, deliveryCostNum, taxNum, discountNum].some(v => isNaN(v))) {
        message.error('Invalid number value');
        return;
      }
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
        notes: notes || '',
      };
      console.log('orderData:', orderData);
      setLoading(true);
      await orderService.createOrder(orderData);
      message.success('Order created successfully');
      navigate('/account/orders');
    } catch (err) {
      let errorMsg = 'Order creation failed';
      if (err?.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err?.response?.data?.errors) {
        errorMsg = err.response.data.errors.map(e => e.msg || e.message || e).join(', ');
      } else if (err?.message) {
        errorMsg = err.message;
      }
      message.error(errorMsg);
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
        REVIEW AND PAY
      </Button>
    </>
  );
}
