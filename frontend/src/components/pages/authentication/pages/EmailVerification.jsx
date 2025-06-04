import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Spin, Card, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get("token");
        if (!token) {
          throw new Error("Verification token is missing");
        }

        const response = await axios.get(`/verify-email?token=${token}`);

        if (response.data.success) {
          toast.success("Email verified successfully!");
          navigate("/email-verified", {
            state: {
              email: response.data.data.email,
              isVerified: response.data.data.isVerified,
            },
          });
        }
      } catch (error) {
        console.error("Verification error:", error);
        toast.error(error.response?.data?.error || "Email verification failed");
        navigate("/email-verification-failed", {
          state: {
            error: error.response?.data?.error || "Verification failed",
          },
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <Card className="w-full max-w-md shadow-lg">
          <div className="text-center">
            <Spin
              indicator={
                <LoadingOutlined
                  style={{ fontSize: 40, color: "#1890ff" }}
                  spin
                />
              }
              className="mb-4"
            />
            <Title level={3} className="text-gray-800">
              Verifying Your Email
            </Title>
            <Text className="text-gray-600">
              Please wait while we verify your email address...
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

export default EmailVerification;
