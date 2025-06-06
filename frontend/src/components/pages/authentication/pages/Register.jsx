import React, { useState } from "react";
import { Form, Input, Checkbox, message } from "antd";
import { useNavigate } from "react-router-dom";
import SocialButton from "../components/SocialButton";
import RegisterButton from "../components/RegisterButton";
import RememberCheckbox from "../components/RememberCheckbox";
import TermCheckbox from "../components/TermCheckbox";
import JoinClub from "../components/JoinClub";
import GenderRadio from "../components/GenderRadio";
import { useAuth } from "../../../../contexts/AuthContext";
import "./Authenticate.css";

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { register } = useAuth();

  const validatePassword = (_, value) => {
    if (!value) {
      return Promise.reject("Please input your password!");
    }
    if (value.length < 8) {
      return Promise.reject("Password must be at least 8 characters!");
    }
    if (!/[A-Z]/.test(value)) {
      return Promise.reject(
        "Password must contain at least one uppercase letter!"
      );
    }
    if (!/[a-z]/.test(value)) {
      return Promise.reject(
        "Password must contain at least one lowercase letter!"
      );
    }
    if (!/[0-9]/.test(value)) {
      return Promise.reject("Password must contain at least one number!");
    }
    if (!/[@$!%*?&]/.test(value)) {
      return Promise.reject(
        "Password must contain at least one special character (@$!%*?&)!"
      );
    }
    return Promise.resolve();
  };

  const onFinish = async (values) => {
    try {
      // Combine firstName and lastName into fullName
      const formData = {
        ...values,
        fullName: `${values.firstName} ${values.lastName}`,
      };
      delete formData.firstName;
      delete formData.lastName;

      setLoading(true);
      await register(formData);
      message.success("Registration successful! Please verify your email.");
      navigate("/login");
    } catch (error) {
      if (error.response?.data?.error?.includes("duplicate key error")) {
        message.error(
          "Username already exists. Please choose a different username."
        );
      } else {
        message.error(error.response?.data?.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box" style={{ color: "black" }}>
          <h2 style={{ fontWeight: "bold" }}>Register</h2>
          <p style={{ fontWeight: "bold" }}> Sign up with</p>
          <SocialButton />
          <p style={{ fontWeight: "bold" }}>OR</p>

          <Form form={form} layout="vertical" onFinish={onFinish}>
            <div className="form-label">Your Name</div>
            <Form.Item
              name="firstName"
              rules={[
                { required: true, message: "Please input your first name!" },
              ]}
            >
              <Input className="input" placeholder="First Name" />
            </Form.Item>

            <Form.Item
              name="lastName"
              rules={[
                { required: true, message: "Please input your last name!" },
              ]}
            >
              <Input className="input" placeholder="Last Name" />
            </Form.Item>

            <div className="form-label">Username</div>
            <Form.Item
              name="username"
              rules={[
                { required: true, message: "Please input your username!" },
                { min: 3, message: "Username must be at least 3 characters!" },
                { max: 20, message: "Username must be at most 20 characters!" },
                {
                  pattern: /^[a-zA-Z0-9_]+$/,
                  message:
                    "Username can only contain letters, numbers and underscore!",
                },
              ]}
            >
              <Input className="input" placeholder="Username" />
            </Form.Item>

            <div className="form-label">Phone Number</div>
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: "Please input your phone number!" },
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Please enter a valid 10-digit phone number!",
                },
              ]}
            >
              <Input className="input" placeholder="Phone Number" />
            </Form.Item>

            <div className="form-label">Address</div>
            <Form.Item
              name="address"
              rules={[
                { required: true, message: "Please input your address!" },
              ]}
            >
              <Input className="input" placeholder="Address" />
            </Form.Item>

            <div className="form-label">Gender</div>
            <Form.Item
              name="gender"
              rules={[
                { required: true, message: "Please select your gender!" },
              ]}
              style={{ marginBottom: "0px" }}
            >
              <GenderRadio />
            </Form.Item>

            <div className="form-label">Login Details</div>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input className="input" placeholder="Email" type="email" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
                { validator: validatePassword },
              ]}
            >
              <Input.Password
                className="input"
                placeholder="Password"
                type="password"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const password = getFieldValue("password");
                    if (!value || password === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("The two passwords do not match!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                className="input"
                placeholder="Confirm Password"
                type="password"
                autoComplete="new-password"
              />
            </Form.Item>

            <TermCheckbox />
            <RememberCheckbox />
            <RegisterButton loading={loading} />
          </Form>
        </div>

        <JoinClub />
      </div>
    </div>
  );
};

export default RegisterPage;
