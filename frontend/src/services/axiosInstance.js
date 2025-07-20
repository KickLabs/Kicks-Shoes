// import axios from 'axios';

// const axiosInstance = axios.create({
//   baseURL: '/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// axiosInstance.interceptors.request.use(config => {
//   const token = localStorage.getItem('accessToken');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default axiosInstance;
// src/services/axiosInstance.js
import axios from 'axios';

const getBaseURL = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  return '/api';
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(config => {
  // Đừng đặt Content-Type cho multipart/form-data vì Axios sẽ tự đặt boundary
  if (config.data instanceof FormData) {
    // Khi gửi FormData, để Axios tự động thiết lập Content-Type với boundary
    delete config.headers['Content-Type'];
  }

  // 1) ưu tiên lấy từ accessToken
  let token = localStorage.getItem('accessToken');
  // 2) nếu không có, thử lấy từ key 'token'
  if (!token) {
    token = localStorage.getItem('token');
  }
  // 3) nếu không có, thử lấy từ userInfo.token
  if (!token) {
    const info = localStorage.getItem('userInfo');
    token = info ? JSON.parse(info).token : null;
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Add response interceptor
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Handle user banned (403)
    if (error.response?.status === 403) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
      window.location.href = '/banned';
      return Promise.reject(error);
    }

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
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
