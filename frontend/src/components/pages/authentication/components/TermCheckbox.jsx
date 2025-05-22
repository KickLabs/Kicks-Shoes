import React from "react";
import { Checkbox, Form } from "antd";

const TermCheckbox = () => {
  return (
    <Form.Item name="termcheckbox" valuePropName="checked">
      <>
        <Checkbox id="termcheckbox">
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
        </Checkbox>
      </>
    </Form.Item>
  );
};

export default TermCheckbox;
