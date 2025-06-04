import { useLocation, useNavigate } from "react-router-dom";
import { Card, Typography, Button, Result } from "antd";
import { CheckCircleOutlined, LoginOutlined } from "@ant-design/icons";

const { Text } = Typography;

const EmailVerified = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, isVerified } = location.state || {};

  if (!email || !isVerified) {
    navigate("/email-verification-failed", {
      state: { error: "Invalid verification state" },
    });
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
      <Card className="w-full max-w-md shadow-lg">
        <Result
          status="success"
          title="Email Verified Successfully!"
          subTitle={`Your email ${email} has been verified. You can now log in to your account.`}
          icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
          extra={[
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={() => navigate("/login")}
            >
              Go to Login
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
};

export default EmailVerified;
