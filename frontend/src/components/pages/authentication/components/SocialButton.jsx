import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../../../contexts/AuthContext';
import axios from 'axios'; // ✅ Dùng axios riêng, KHÔNG dùng api.js
import { useNavigate } from 'react-router-dom';
import { Button, message, notification } from 'antd';
import google from '../../../../assets/images/google-logo.png';
import apple from '../../../../assets/images/apple-logo.png';
import appleWhite from '../../../../assets/images/apple-logo-white.png';
import facebook from '../../../../assets/images/facebook-logo.png';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
const API_BASE = import.meta.env.VITE_API_URL;

const SocialButtons = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  // -------- GOOGLE LOGIN --------
  // Đã có sẵn ở phần bạn gửi, sửa lại chỗ Google cho đúng luồng:
  const loginGoogle = useGoogleLogin({
    onSuccess: async tokenResponse => {
      try {
        const res = await axios.post(`${API_BASE}/api/auth/google-login`, {
          token: tokenResponse.access_token,
        });

        const result = res.data;
        if (result.success) {
          const userInfo = {
            _id: result.user._id,
            email: result.user.email,
            avatar: result.user.avatar,
            fullName: result.user.fullName,
            role: result.user.role,
          };
          setUser(userInfo);
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
          localStorage.setItem('accessToken', result.token);
          localStorage.setItem('refreshToken', result.refreshToken);
          message.success('Login successful!');
          navigate(result.isNewUser ? '/set-password' : '/');
        } else {
          notification.error({
            message: 'Login failed',
            description: result.message,
          });
        }
      } catch (err) {
        notification.error({
          message: 'Google login error',
          description: err?.response?.data?.message || err.message,
        });
      }
    },
  });

  // Facebook: Giữ nguyên phần callback nhưng sửa thành gửi token về:
  const handleFacebookResponse = async response => {
    try {
      const { accessToken } = response;
      const res = await axios.post(`${API_BASE}/api/auth/facebook-login`, {
        token: accessToken,
      });

      const result = res.data;
      if (result.success) {
        const userInfo = {
          _id: result.user._id,
          email: result.user.email,
          avatar: result.user.avatar,
          fullName: result.user.fullName,
          role: result.user.role,
        };
        setUser(userInfo);
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        localStorage.setItem('accessToken', result.token);
        localStorage.setItem('refreshToken', result.refreshToken);
        message.success('Login successful!');
        navigate(result.isNewUser ? '/set-password' : '/');
      } else {
        notification.error({
          message: 'Login failed',
          description: result.message,
        });
      }
    } catch (error) {
      notification.error({
        message: 'Facebook login error',
        description: error?.response?.data?.message || error.message,
      });
    }
  };

  return (
    <div className="social-buttons">
      <div style={{ width: '100%' }} onClick={() => loginGoogle()}>
        <Button className="social google" block>
          <img className="social-logo" src={google} alt="google" />
        </Button>
      </div>

      <div style={{ width: '100%' }}>
        <Button className="social apple" block>
          <img className="social-logo apple-logo" src={apple} alt="apple" />
          <img className="social-logo apple-logo-white" src={appleWhite} alt="apple" />
        </Button>
      </div>

      {/* Facebook Login (dùng thư viện) */}
      <div style={{ width: '100%' }}>
        <FacebookLogin
          appId={import.meta.env.VITE_FACEBOOK_APP_ID}
          autoLoad={false}
          fields="name,email,picture"
          callback={handleFacebookResponse}
          render={renderProps => (
            <Button className="social facebook" block onClick={renderProps.onClick}>
              <img className="social-logo" src={facebook} alt="facebook" />
            </Button>
          )}
        />
      </div>
    </div>
  );
};

export default SocialButtons;
