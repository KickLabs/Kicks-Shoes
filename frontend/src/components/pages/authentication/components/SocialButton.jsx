import React from "react";
import { Button } from "antd";
import google from "../../../../assets/images/google-logo.png";
import apple from "../../../../assets/images/apple-logo.png";
import appleWhite from "../../../../assets/images/apple-logo-white.png";
import facebook from "../../../../assets/images/facebook-logo.png";

const SocialButtons = () => {
  return (
    <div className="social-buttons">
      <Button className="social google" block>
        <img className="social-logo" src={google} alt="google" />
      </Button>
      <Button className="social apple" block>
        <img className="social-logo apple-logo" src={apple} alt="apple" />
        <img
          className="social-logo apple-logo-white"
          src={appleWhite}
          alt="apple"
        />
      </Button>
      <Button className="social facebook" block>
        <img className="social-logo" src={facebook} alt="facebook" />
      </Button>
    </div>
  );
};

export default SocialButtons;
