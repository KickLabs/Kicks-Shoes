import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../../contexts/AuthContext';
import './Authenticate.css';
import EmailLoginButton from '../components/EmailLoginButton';

const { Title } = Typography;

const SetPassword = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (_, value) => {
    if (!value) {
      return Promise.reject('Please input your password!');
    }
    if (value.length < 8) {
      return Promise.reject('Password must be at least 8 characters!');
    }
    if (!/[A-Z]/.test(value)) {
      return Promise.reject('Password must contain at least one uppercase letter!');
    }
    if (!/[a-z]/.test(value)) {
      return Promise.reject('Password must contain at least one lowercase letter!');
    }
    if (!/[0-9]/.test(value)) {
      return Promise.reject('Password must contain at least one number!');
    }
    if (!/[@$!%*?&]/.test(value)) {
      return Promise.reject('Password must contain at least one special character (@$!%*?&)!');
    }
    return Promise.resolve();
  };

  const onFinish = async values => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      await axios.post(
        '/api/auth/set-password',
        { password: values.password },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      message.success('Password has been set!');
      navigate('/');
    } catch (error) {
      message.error(error?.response?.data?.message || 'Fail, try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <Title level={2}>Set Your Password</Title>
        <Typography.Paragraph>
          Please set a password to login with the following Email + Password.
        </Typography.Paragraph>
        <Form name="set-password" onFinish={onFinish} layout="vertical">
          <Form.Item name="password" label="Password" rules={[{ validator: validatePassword }]}>
            <Input.Password size="large" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Confirm password"
            dependencies={['password']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password size="large" />
          </Form.Item>
          <Form.Item>
            <EmailLoginButton loading={loading} text="Submit" />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default SetPassword;
