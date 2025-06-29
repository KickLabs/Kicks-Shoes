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
      message.success('Mật khẩu đã được thiết lập!');
      navigate('/');
    } catch (error) {
      message.error(error?.response?.data?.message || 'Thất bại, thử lại.');
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
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
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
                  return Promise.reject(new Error('Mật khẩu không khớp!'));
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
