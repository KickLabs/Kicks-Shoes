import React from "react";
import { Button, Form } from "antd";

const RegisterButton = () => {
  return (
    <Form.Item>
      <Button type="primary" block className="email-login-btn">
        <span className="email-text">Register</span>
        <span className="arrow">&rarr;</span>
      </Button>
    </Form.Item>
  );
};

export default RegisterButton;
