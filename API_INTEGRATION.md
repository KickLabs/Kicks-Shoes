# Hướng dẫn tích hợp Frontend với Backend API

## 1. Cấu trúc API

### Base URL

- Development: `http://localhost:5000/api`
- Production: `https://api.kicks-shoes.com/api`

### Authentication

- Tất cả các request cần xác thực (trừ login/register) phải gửi kèm token trong header:

```
Authorization: Bearer <token>
```

## 2. Các Endpoint chính

### Authentication

```javascript
POST / auth / login;
POST / auth / register;
POST / auth / refresh - token;
POST / auth / logout;
```

### Products

```javascript
GET /products
GET /products/:id
GET /products/category/:categoryId
GET /products/search?q=<query>
```

### Categories

```javascript
GET /categories
GET /categories/:id
```

### Cart

```javascript
GET /cart
POST /cart/add
PUT /cart/update/:itemId
DELETE /cart/remove/:itemId
```

### Orders

```javascript
POST /orders
GET /orders
GET /orders/:id
```

## 3. Cách tích hợp Frontend

### 1. Cấu hình API Client

```javascript
// src/config/api.config.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động thêm token vào header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 2. Tạo API Services

```javascript
// src/services/auth.service.js
import api from "../config/api.config";

export const authService = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  logout: async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("token");
  },
};

// src/services/product.service.js
export const productService = {
  getAll: async () => {
    const response = await api.get("/products");
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
};
```

### 3. Sử dụng trong Components

```javascript
// src/components/ProductList.jsx
import { useEffect, useState } from "react";
import { productService } from "../services/product.service";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getAll();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products.map((product) => (
        <div key={product._id}>
          <h3>{product.name}</h3>
          <p>{product.price}</p>
        </div>
      ))}
    </div>
  );
};
```

## 4. Xử lý lỗi và Loading States

### Error Handling

```javascript
// src/utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server trả về response với status code ngoài range 2xx
    switch (error.response.status) {
      case 401:
        // Unauthorized - chuyển về trang login
        localStorage.removeItem("token");
        window.location.href = "/login";
        break;
      case 403:
        // Forbidden
        return "Bạn không có quyền thực hiện hành động này";
      case 404:
        return "Không tìm thấy tài nguyên";
      case 500:
        return "Lỗi server, vui lòng thử lại sau";
      default:
        return error.response.data.message || "Có lỗi xảy ra";
    }
  }
  return "Không thể kết nối đến server";
};
```

### Loading States

```javascript
// src/hooks/useApi.js
import { useState, useCallback } from "react";

export const useApi = (apiFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...params) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction(...params);
        setData(result);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  return { data, loading, error, execute };
};
```

## 5. Các best practices

1. **Error Handling**

   - Luôn xử lý lỗi trong try-catch
   - Hiển thị thông báo lỗi thân thiện với người dùng
   - Log lỗi để debug

2. **Loading States**

   - Hiển thị loading indicator khi đang fetch data
   - Disable các nút submit khi đang xử lý request
   - Sử dụng skeleton loading cho UX tốt hơn

3. **Caching**

   - Cache data khi có thể
   - Implement stale-while-revalidate pattern
   - Sử dụng React Query hoặc SWR cho data fetching

4. **Security**

   - Không lưu sensitive data trong localStorage
   - Validate data trước khi gửi lên server
   - Implement CSRF protection
   - Sử dụng HTTPS

5. **Performance**
   - Implement pagination cho danh sách dài
   - Lazy load images
   - Compress data khi có thể
   - Sử dụng debounce cho search input

## 6. Testing API Integration

```javascript
// src/services/__tests__/product.service.test.js
import { productService } from "../product.service";
import api from "../../config/api.config";

jest.mock("../../config/api.config");

describe("Product Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch all products", async () => {
    const mockProducts = [{ id: 1, name: "Test Product" }];
    api.get.mockResolvedValueOnce({ data: mockProducts });

    const result = await productService.getAll();
    expect(result).toEqual(mockProducts);
    expect(api.get).toHaveBeenCalledWith("/products");
  });
});
```

## 7. Deployment Checklist

1. **Environment Variables**

   - Kiểm tra tất cả biến môi trường đã được cấu hình
   - Đảm bảo các secret key được bảo vệ
   - Cập nhật API URL cho production

2. **CORS**

   - Cấu hình CORS cho production domain
   - Kiểm tra các HTTP methods được phép
   - Verify credentials handling

3. **Security**

   - Enable HTTPS
   - Implement rate limiting
   - Setup proper authentication
   - Configure security headers

4. **Monitoring**

   - Setup error tracking (e.g., Sentry)
   - Implement logging
   - Monitor API performance
   - Setup alerts cho critical errors

5. **Documentation**
   - Cập nhật API documentation
   - Document deployment process
   - Maintain changelog
