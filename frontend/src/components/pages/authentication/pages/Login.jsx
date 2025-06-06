import React, { useState } from "react";
import { Form, Input, Typography, Divider, message } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import "./Authenticate.css";
import LoginHeader from "../components/LoginHeader";
import RememberCheckbox from "../components/RememberCheckbox";
import EmailLoginButton from "../components/EmailLoginButton";
import SocialButton from "../components/SocialButton";
import JoinClub from "../components/JoinClub";
import Term from "../components/Term";
import { useAuth } from "../../../../contexts/AuthContext";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, resendVerification } = useAuth();

  const from = location.state?.from?.pathname || "/";

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await login(values);
      message.success("Login successful!");
      navigate(from, { replace: true });
    } catch (error) {
      // Handle specific error cases
      const errorMessage = error.response?.data?.error || error.message;

      if (errorMessage.includes("verify your email")) {
        message.error({
          content: (
            <div>
              <p>Please verify your email before logging in.</p>
              <p>Check your email for verification link or</p>
              <a
                onClick={() => handleResendVerification(values.email)}
                style={{
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  pointerEvents: loading ? "none" : "auto",
                }}
              >
                {loading
                  ? "Sending..."
                  : "Click here to resend verification email"}
              </a>
              {resendStatus === "success" && (
                <div style={{ color: "#52c41a", marginTop: 8 }}>
                  Verification email sent successfully!
                </div>
              )}
              {resendStatus === "error" && (
                <div style={{ color: "#ff4d4f", marginTop: 8 }}>
                  Failed to send verification email. Please try again.
                </div>
              )}
            </div>
          ),
          duration: 5,
        });
      } else if (
        errorMessage.includes("Incorrect password") ||
        errorMessage.includes("Invalid credentials")
      ) {
        message.error({
          content: (
            <div>
              <p>{errorMessage}</p>
              <a href="/forgot-password">Forgot your password?</a>
            </div>
          ),
          duration: 5,
        });
      } else {
        message.error(
          errorMessage || "An error occurred during login. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (email) => {
    try {
      setLoading(true);
      setResendStatus(null);
      await resendVerification(email);
      setResendStatus("success");
      message.success("Verification email has been resent successfully!");
    } catch (error) {
      setResendStatus("error");
      message.error(
        error.response?.data?.message ||
          "Failed to resend verification email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-page">
        <div className="login-container">
          <div className="login-box">
            <LoginHeader />

            <Form
              name="login"
              onFinish={onFinish}
              layout="vertical"
              validateTrigger="onBlur"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
              >
                <Input
                  type="email"
                  size="large"
                  placeholder="Email"
                  className="input"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Please input your password!" },
                  {
                    min: 6,
                    message: "Password must be at least 6 characters!",
                  },
                ]}
              >
                <Input.Password
                  size="large"
                  placeholder="Password"
                  className="input"
                />
              </Form.Item>

              <RememberCheckbox />
              <EmailLoginButton loading={loading} text="LOGIN" />

              <Divider style={{ margin: "0px" }}>Or log in with</Divider>

              <SocialButton />
              <Term />
            </Form>
          </div>

          <JoinClub />
        </div>
      </div>
    </>
  );
};

export default Login;
