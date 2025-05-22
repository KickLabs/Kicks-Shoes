import React from "react";
import { Form, Input, Typography, Divider, Button } from "antd";
import {
  GoogleOutlined,
  AppleOutlined,
  FacebookOutlined,
} from "@ant-design/icons";
import "./Authenticate.css";
import LoginHeader from "../components/LoginHeader";
import RememberCheckbox from "../components/RememberCheckbox";
import EmailLoginButton from "../components/EmailLoginButton";
import SocialButton from "../components/SocialButton";
import JoinClub from "../components/JoinClub";
import Term from "../components/Term";

const { Paragraph } = Typography;

const Login = () => {
  return (
    <>
      <div className="login-page">
        <div className="login-container">
          {/* LOGIN SECTION */}
          <div className="login-box">
            <LoginHeader />

            <RememberCheckbox />
            <EmailLoginButton />

            <Divider style={{ margin: "0px" }}>Or log in with</Divider>

            <SocialButton />
            <Term />
          </div>

          {/* JOIN CLUB SECTION */}
          <JoinClub />
        </div>
      </div>
    </>
  );
};

export default Login;
