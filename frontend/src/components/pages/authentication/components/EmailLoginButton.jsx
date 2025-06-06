import React from "react";
import { Button, Form } from "antd";

const EmailLoginButton = ({ loading, text }) => {
  return (
    <Form.Item>
      <Button
        type="default"
        block
        className="email-login-btn"
        htmlType="submit"
        loading={loading}
      >
        <span className="email-text">{text}</span>
        <span className="arrow">&rarr;</span>
      </Button>
    </Form.Item>
  );
};

export default EmailLoginButton;
