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
  const loginGoogle = useGoogleLogin({
    onSuccess: async tokenResponse => {
      try {
        // Lấy thông tin user từ Google
        const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (!data?.email) {
          return notification.error({
            message: 'Google Login',
            description: 'Cannot get email from Google',
          });
        }

        // Gửi lên server để login hoặc tạo tài khoản
        const res = await axios.post(`${API_BASE}/api/auth/google-login`, {
          email: data.email,
          name: data.name,
          picture: data.picture,
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

          message.success('Login with Google successful!');
          navigate(result.isNewUser ? '/set-password' : '/');
        } else {
          notification.error({
            message: 'Login Failed',
            description: result.message || 'Login Google failed!',
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
      if (!response.email) {
        return notification.error({
          message: 'Facebook Login',
          description: 'Cannot get email from Facebook',
        });
      }

      const res = await axios.post(`${API_BASE}/api/auth/facebook-login`, {
        email: response.email,
        name: response.name,
        picture: response.picture?.data?.url,
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

        message.success('Login with Facebook successful!');
        navigate(result.isNewUser ? '/set-password' : '/');
      } else {
        notification.error({
          message: 'Login Failed',
          description: result.message || 'Login Facebook failed!',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Login Facebook error',
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
