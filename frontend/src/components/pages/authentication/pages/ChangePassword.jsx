import React, { useState, useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import "./Authenticate.css";
import { useAuth } from "../../../../contexts/AuthContext";

const ChangePassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { changePassword, logout, user } = useAuth();

  useEffect(() => {
    if (!user) {
      message.error("Please login to change password");
      navigate("/login");
    }
  }, [user, navigate]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      console.log(values);
      await changePassword(values.currentPassword, values.newPassword);
      message.success("Password changed successfully!");
      await logout();
      navigate("/login");
    } catch (error) {
      message.error(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="login-page">
      <div className="login-container" style={{ width: "50%" }}>
        <div className="login-box">
          <h2>Change Password</h2>
          <Form
            form={form}
            name="change-password"
            onFinish={onFinish}
            layout="vertical"
          >
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[
                {
                  required: true,
                  message: "Please input your current password!",
                },
              ]}
            >
              <Input.Password
                className="input"
                placeholder="Enter current password"
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                {
                  required: true,
                  message: "Please input your new password!",
                },
                {
                  min: 8,
                  message: "Password must be at least 8 characters!",
                },
              ]}
            >
              <Input.Password
                className="input"
                placeholder="Enter new password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={["newPassword"]}
              rules={[
                {
                  required: true,
                  message: "Please confirm your new password!",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match!"));
                  },
                }),
              ]}
            >
              <Input.Password
                className="input"
                placeholder="Confirm new password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="email-login-btn"
                loading={loading}
                block
              >
                <span className="email-text">Change Password</span>
                <span className="arrow">→</span>
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
