import axiosInstance from './axiosInstance';

// Add response interceptor
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Only handle token expiration (401) for non-auth endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/refresh-token') &&
      !originalRequest.url.includes('/change-password') &&
      !originalRequest.url.includes('/login')
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axiosInstance.post(`/auth/refresh-token`, {
          refreshToken,
        });

        if (response.data.success) {
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

const authService = {
  // Register new user
  async register(userData) {
    try {
      const response = await axiosInstance.post(`/auth/register`, userData);
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        // Store tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        // Store user info
        localStorage.setItem('userInfo', JSON.stringify(user));
        return user;
      }
      throw new Error(response.data.message || 'Registration failed');
    } catch (error) {
      throw error;
    }
  },

  // Login user
  async login(credentials) {
    try {
      console.log('Attempting login with:', { email: credentials.email });
      const response = await axiosInstance.post(`/auth/login`, credentials);
      console.log('Login response:', response.data);

      if (response.data.success) {
        const { user, tokens } = response.data.data;
        // Store tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        // Store user info
        localStorage.setItem('userInfo', JSON.stringify(user));
        return user;
      }
      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.message === 'Network Error') {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }
      throw error;
    }
  },

  // Logout user
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
  },

  // Get current user
  getCurrentUser() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  getAccessToken() {
    return localStorage.getItem('accessToken');
  },

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  },

  // Update user profile
  async updateProfile(userData) {
    try {
      // Đối với FormData, không cần thiết lập Content-Type, Axios sẽ tự xử lý
      const response = await axiosInstance.put(`/auth/update-profile`, userData);

      console.log('Profile update response:', response.data);

      if (response.data.success) {
        const updatedUser = response.data.data;
        // Update stored user info
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        return updatedUser;
      }
      throw new Error(response.data.message || 'Profile update failed');
    } catch (error) {
      console.error('Profile update error:', error.response?.data || error.message);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.message === 'Network Error') {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }
      throw error;
    }
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await axiosInstance.put(`/auth/change-password`, {
        currentPassword,
        newPassword,
      });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Password change failed');
    } catch (error) {
      throw error;
    }
  },

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await axiosInstance.post(`/auth/forgot-password`, {
        email,
      });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Forgot password request failed');
    } catch (error) {
      throw error;
    }
  },

  // Request password reset (alias for forgotPassword)
  async requestPasswordReset(email) {
    return this.forgotPassword(email);
  },

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      const response = await axiosInstance.post(`/auth/reset-password`, {
        token,
        newPassword,
      });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Password reset failed');
    } catch (error) {
      throw error;
    }
  },

  // Verify email
  async verifyEmail(token) {
    try {
      const response = await axiosInstance.get(`/auth/verify-email?token=${token}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Email verification failed');
    } catch (error) {
      throw error;
    }
  },

  // Resend verification email
  async resendVerification(email) {
    try {
      const response = await axiosInstance.post(`/auth/resend-verification`, {
        email,
      });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Resend verification failed');
    } catch (error) {
      throw error;
    }
  },

  // Refresh token
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await axiosInstance.post(`/auth/refresh-token`, {
        refreshToken,
      });
      if (response.data.success) {
        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        return accessToken;
      }
      throw new Error(response.data.message || 'Token refresh failed');
    } catch (error) {
      throw error;
    }
  },
};

export default authService;
