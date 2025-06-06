import React, { useState } from "react";
import { Form, Input, Typography, message } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Authenticate.css";
import EmailLoginButton from "../components/EmailLoginButton";
import { useAuth } from "../../../../contexts/AuthContext";
const { Title } = Typography;

const ResetPasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const token = searchParams.get("token");

  const onFinish = async (values) => {
    if (!token) {
      message.error("Invalid or missing reset token");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(token, values.password);
      message.success("Password has been reset successfully!");
      navigate("/login");
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      message.error(
        errorMessage || "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-box">
          <div className="invalid-link-container">
            <Title level={2} className="invalid-link-title">
              Invalid Reset Link
            </Title>
            <Typography.Paragraph className="invalid-link-description">
              This password reset link is invalid or has expired. Please request
              a new password reset link.
            </Typography.Paragraph>
            <Typography.Link
              onClick={() => navigate("/forgot-password")}
              className="request-new-link"
            >
              Request New Reset Link
            </Typography.Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-box">
        <Title level={2} className="reset-password-title">
          Reset Password
        </Title>
        <Typography.Paragraph className="reset-password-description">
          Please enter your new password below.
        </Typography.Paragraph>

        <Form
          name="reset-password"
          onFinish={onFinish}
          layout="vertical"
          validateTrigger="onBlur"
          className="reset-password-form"
        >
          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Please input your new password!" },
              { min: 6, message: "Password must be at least 6 characters!" },
            ]}
          >
            <Input.Password size="large" placeholder="New Password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password size="large" placeholder="Confirm New Password" />
          </Form.Item>

          <EmailLoginButton loading={loading} text="Reset Password" />
        </Form>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
