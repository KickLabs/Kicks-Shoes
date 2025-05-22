import React from "react";
import { Typography } from "antd";

const Term = () => {
  return (
    <Typography.Paragraph className="terms" style={{ marginTop: "20px" }}>
      By clicking ‘Log in’ you agree to our website KickClub{" "}
      <a href="#" className="text-link" style={{ fontWeight: "bold" }}>
        Terms & Conditions
      </a>
      ,{" "}
      <a href="#" className="text-link" style={{ fontWeight: "bold" }}>
        Kicks Privacy Notice
      </a>{" "}
      and{" "}
      <a href="#" className="text-link" style={{ fontWeight: "bold" }}>
        Terms & Conditions
      </a>
      .
    </Typography.Paragraph>
  );
};

export default Term;
