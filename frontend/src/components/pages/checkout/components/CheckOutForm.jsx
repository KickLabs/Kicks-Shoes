import { useState } from "react";
import { Form, Typography } from "antd";
import ContactDetails from "./ContactDetails";
import ShippingAddress from "./ShippingAddress";
import DeliveryOptions from "./DeliveryOptions";

const { Text } = Typography;

export default function CheckoutForm() {
  const [form] = Form.useForm();
  const [deliveryMethod, setDeliveryMethod] = useState("standard");

  return (
    <>
      <div style={{ marginBottom: "16px" }}>
        <Text className="checkout-form-title">Login and Checkout faster</Text>
      </div>

      <ContactDetails form={form} />
      <ShippingAddress />
      <DeliveryOptions
        deliveryMethod={deliveryMethod}
        setDeliveryMethod={setDeliveryMethod}
      />
    </>
  );
}
