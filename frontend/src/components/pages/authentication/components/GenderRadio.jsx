import React from "react";
import { Form, Radio } from "antd";

const GenderRadio = () => {
  return (
    <Form.Item name="gender">
      <Radio.Group className="gender-radio-group">
        <Radio value="male">Male</Radio>
        <Radio value="female">Female</Radio>
        <Radio value="other">Other</Radio>
      </Radio.Group>
    </Form.Item>
  );
};

export default GenderRadio;
