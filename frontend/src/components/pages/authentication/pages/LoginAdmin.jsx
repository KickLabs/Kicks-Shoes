import React, { useState } from 'react';
import { Form, Input, Divider } from 'antd';
import './Authenticate.css';
import LoginHeader from '../components/LoginHeader';
import RememberCheckbox from '../components/RememberCheckbox';
import EmailLoginButton from '../components/EmailLoginButton';
import SocialButton from '../components/SocialButton';
import Term from '../components/Term';
import imagesdn from '../../../../assets/images/loginadminbanner.png';
import { useAuth } from '../../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

const LoginAdmin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async values => {
    try {
      setLoading(true);
      const response = await login(values);
      if (response.role === 'admin') {
        message.success('Login successful!');
        navigate('/dashboard');
      } else {
        message.error('You are not authorized to access the admin panel');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container-admin">
      <div className="login-image-half-admin">
        <img src={imagesdn} alt="Sneakers" className="login-image-admin" />
      </div>

      <div className="login-box-admin">
        <Form name="login-admin" onFinish={onFinish} layout="vertical" validateTrigger="onBlur">
          <LoginHeader />

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input type="email" size="large" placeholder="Email" className="input" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              {
                min: 6,
                message: 'Password must be at least 6 characters!',
              },
            ]}
          >
            <Input.Password size="large" placeholder="Password" className="input" />
          </Form.Item>

          <RememberCheckbox />
          <EmailLoginButton text="LOGIN" loading={loading} />
          <Divider style={{ margin: '0px' }}>Or log in with</Divider>
          <SocialButton />
          <Term />
        </Form>
      </div>
    </div>
  );
};

export default LoginAdmin;
