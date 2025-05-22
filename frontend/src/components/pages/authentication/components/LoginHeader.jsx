import React from "react";
import { Typography, Form, Input } from "antd";

const { Title } = Typography;

const LoginHeader = () => {
  return (
    <>
      <Title level={2}>Login</Title>
      <a href="#" className="text-link" style={{ fontWeight: "bold" }}>
        Forgot your password?
      </a>

      <Form layout="vertical">
        <Form.Item>
          <Input className="input" placeholder="Email" />
        </Form.Item>

        <Form.Item>
          <Input.Password className="input" placeholder="Password" />
        </Form.Item>
      </Form>
    </>
  );
};

export default LoginHeader;
