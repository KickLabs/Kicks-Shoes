import React from "react";
import { Form } from "antd";
import "./Authenticate.css";
import LoginHeader from "../components/LoginHeader";
import RememberCheckbox from "../components/RememberCheckbox";
import EmailLoginButton from "../components/EmailLoginButton";
import SocialButton from "../components/SocialButton";
import Term from "../components/Term";
import imagesdn from "../../../../assets/images/loginadminbanner.png";

const LoginAdmin = () => {
  return (
    <div className="login-container-admin">
      {/* Club box with image + branding */}
      <div className="login-image-half-admin">
        <img src={imagesdn} alt="Sneakers" className="login-image-admin" />
      </div>

      {/* Login form */}
      <div className="login-box-admin">
        <Form layout="vertical">
          <LoginHeader />
          <RememberCheckbox />
          <EmailLoginButton />
          <SocialButton />
          <Term />
        </Form>
      </div>
    </div>
  );
};

export default LoginAdmin;
