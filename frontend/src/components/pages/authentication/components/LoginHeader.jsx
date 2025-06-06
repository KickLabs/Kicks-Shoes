import React from "react";
import { Typography } from "antd";

const { Title } = Typography;

const LoginHeader = () => {
  return (
    <>
      <Title level={2}>Login</Title>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "fit-content",
        }}
      >
        <a
          href="/forgot-password"
          className="text-link"
          style={{ fontWeight: "bold", marginBottom: 8 }}
        >
          Forgot your password?
        </a>

        <a
          href="/register"
          className="text-link"
          style={{ fontWeight: "bold" }}
        >
          Register
        </a>
      </div>
    </>
  );
};

export default LoginHeader;
