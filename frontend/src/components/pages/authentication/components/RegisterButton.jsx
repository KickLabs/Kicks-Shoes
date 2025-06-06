import React from "react";
import { Button, Form } from "antd";

const RegisterButton = ({ loading }) => {
  return (
    <Form.Item>
      <Button
        type="primary"
        block
        className="email-login-btn"
        htmlType="submit"
        loading={loading}
      >
        <span className="email-text">Register</span>
        <span className="arrow">&rarr;</span>
      </Button>
    </Form.Item>
  );
};

export default RegisterButton;
