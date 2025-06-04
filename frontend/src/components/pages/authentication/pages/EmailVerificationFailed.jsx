import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Card, Typography, Button, Result } from "antd";
import {
  CloseCircleOutlined,
  MailOutlined,
  LoginOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const EmailVerificationFailed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const error = location.state?.error || "Verification failed";
  const email = location.state?.email;
  const showResendButton = location.state?.showResendButton;

  const handleResendVerification = async () => {
    try {
      setIsResending(true);

      if (!email) {
        toast.error("Email address not found");
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/resend-verification`,
        { email }
      );

      toast.success("Verification email sent successfully!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to resend verification email"
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
      <Card className="w-full max-w-md shadow-lg">
        <Result
          status="error"
          title="Email Verification Failed"
          subTitle={error}
          icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
          extra={[
            showResendButton && email && (
              <Button
                type="primary"
                icon={<MailOutlined />}
                loading={isResending}
                onClick={handleResendVerification}
                className="mr-4"
              >
                Resend Verification Email
              </Button>
            ),
            <Button
              type="default"
              icon={<LoginOutlined />}
              onClick={() => navigate("/login")}
            >
              Back to Login
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
};

export default EmailVerificationFailed;
