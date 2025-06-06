import React, { useState } from "react";
import { Form, Input, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import "./Authenticate.css";
import EmailLoginButton from "../components/EmailLoginButton";
import { useAuth } from "../../../../contexts/AuthContext";
const { Title } = Typography;

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { requestPasswordReset } = useAuth();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await requestPasswordReset(values.email);
      message.success(
        "Password reset instructions have been sent to your email!"
      );
      navigate("/login");
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      message.error(
        errorMessage || "Failed to send reset instructions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <Title level={2} className="forgot-password-title">
          Forgot Password
        </Title>
        <Typography.Paragraph className="forgot-password-description">
          Enter your email address and we'll send you a link to reset your
          password.
        </Typography.Paragraph>

        <Form
          name="forgot-password"
          onFinish={onFinish}
          layout="vertical"
          validateTrigger="onBlur"
          className="forgot-password-form"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input type="email" size="large" placeholder="Email" />
          </Form.Item>

          <EmailLoginButton loading={loading} text="Send Reset Link" />

          <div className="back-to-login">
            <Typography.Link onClick={() => navigate("/login")}>
              Back to Login
            </Typography.Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default ForgotPassword;
