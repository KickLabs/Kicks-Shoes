import React from "react";
import { Checkbox, Form } from "antd";

const RememberCheckbox = () => {
  return (
    <Form.Item name="remember" valuePropName="checked">
      <>
        <Checkbox id="remember">
          Keep me logged in - applies to all log in options below.
        </Checkbox>
        <a
          href="#"
          className="more-info"
          style={{ fontWeight: "bold" }}
          htmlFor="remember"
        >
          More info
        </a>
      </>
    </Form.Item>
  );
};

export default RememberCheckbox;
