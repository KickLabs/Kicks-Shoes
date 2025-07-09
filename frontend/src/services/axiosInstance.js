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

const axiosInstance = axios.create({
  baseURL: '/api',
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

export default axiosInstance;
