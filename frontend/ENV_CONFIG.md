# Frontend Environment Configuration

## Tổng quan

Project có nhiều file .env cho các môi trường khác nhau:

```
frontend/
├── .env                    # Local development (localhost backend)
├── .env.dev               # AWS Development (ECS EC2 backend)
├── .env.production        # AWS Production
├── .env.aws               # AWS deployment config
└── .env.example           # Template
```

## Cấu hình hiện tại

### Backend URLs

| Environment | Backend URL | Frontend URL |
|-------------|-------------|--------------|
| Local | http://localhost:3000 | http://localhost:5173 |
| AWS Dev | http://kicks-shoes-dev-alb-1014392323.ap-southeast-1.elb.amazonaws.com | https://d3k5cm2ny387y1.cloudfront.net |
| AWS Prod | TBD | TBD |

### File .env.dev (AWS Development)

```bash
# Backend API (ECS EC2 với ALB)
VITE_API_URL=http://kicks-shoes-dev-alb-1014392323.ap-southeast-1.elb.amazonaws.com
VITE_API_BASE_URL=http://kicks-shoes-dev-alb-1014392323.ap-southeast-1.elb.amazonaws.com/api

# Socket.IO
VITE_SOCKET_URL=http://kicks-shoes-dev-alb-1014392323.ap-southeast-1.elb.amazonaws.com

# Mobile App
VITE_MOBILE_API_URL=http://kicks-shoes-dev-alb-1014392323.ap-southeast-1.elb.amazonaws.com
VITE_MOBILE_API_BASE_URL=http://kicks-shoes-dev-alb-1014392323.ap-southeast-1.elb.amazonaws.com/api
```

## Sử dụng

### 1. Local Development

```bash
# Sử dụng .env (localhost backend)
npm run dev
```

### 2. Build cho AWS Development

```bash
# Copy .env.dev thành .env
cp .env.dev .env

# Build
npm run build

# Deploy lên S3/CloudFront
npm run deploy:aws
# hoặc
./deploy-aws.sh
```

### 3. Build cho AWS Production

```bash
# Copy .env.production thành .env
cp .env.production .env

# Build
npm run build

# Deploy
npm run deploy:aws
```

## Kiểm tra kết nối

### Test Backend API

```bash
# Health check
curl http://kicks-shoes-dev-alb-1014392323.ap-southeast-1.elb.amazonaws.com/api/health

# Test API endpoint
curl http://kicks-shoes-dev-alb-1014392323.ap-southeast-1.elb.amazonaws.com/api/products
```

### Test từ Frontend

Mở browser console và chạy:

```javascript
// Check API URL
console.log(import.meta.env.VITE_API_BASE_URL);

// Test fetch
fetch(import.meta.env.VITE_API_BASE_URL + '/health')
  .then(r => r.json())
  .then(console.log);
```

## CORS Configuration

Backend cần allow frontend domain trong CORS:

```javascript
// backend/src/config/cors.config.js
const allowedOrigins = [
  'http://localhost:5173',
  'https://d3k5cm2ny387y1.cloudfront.net',
  // Add more domains as needed
];
```

## Troubleshooting

### 1. CORS Error

**Lỗi:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Giải pháp:**
- Kiểm tra backend CORS config
- Thêm CloudFront domain vào allowedOrigins
- Restart backend service

### 2. Socket.IO Connection Failed

**Lỗi:** `WebSocket connection failed`

**Giải pháp:**
- Verify VITE_SOCKET_URL đúng
- Check backend Socket.IO config
- Ensure ALB allows WebSocket connections

### 3. API 404 Not Found

**Lỗi:** `GET /api/... 404`

**Giải pháp:**
- Verify VITE_API_BASE_URL có `/api` suffix
- Check backend routes
- Test API directly với curl

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend base URL | http://...elb.amazonaws.com |
| VITE_API_BASE_URL | Backend API URL with /api | http://...elb.amazonaws.com/api |
| VITE_SOCKET_URL | Socket.IO server URL | http://...elb.amazonaws.com |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_MOBILE_API_URL | Mobile app backend URL | Same as VITE_API_URL |
| VITE_GOOGLE_CLIENT_ID | Google OAuth Client ID | - |
| VITE_FACEBOOK_APP_ID | Facebook App ID | - |
| VITE_GEMINI_API_KEY | Google Gemini API Key | - |
| VITE_TINYMCE_API_KEY | TinyMCE Editor API Key | - |

## Security Notes

⚠️ **Important:**
- Never commit `.env` files với sensitive data
- Use `.env.example` as template
- Store secrets in AWS Secrets Manager
- Rotate API keys regularly

## Deploy Script

Script `deploy-aws.sh` tự động:
1. Load environment variables từ `.env.aws`
2. Build frontend với production config
3. Upload lên S3
4. Invalidate CloudFront cache

```bash
# Deploy với .env.dev config
cp .env.dev .env
./deploy-aws.sh

# Deploy với .env.production config
cp .env.production .env
./deploy-aws.sh
```

## Next Steps

1. ✅ Update .env files với backend URL mới
2. ⏳ Test API connectivity
3. ⏳ Build và deploy frontend
4. ⏳ Verify CORS configuration
5. ⏳ Test Socket.IO connection
6. ⏳ Setup custom domain (optional)

## Support

Nếu gặp vấn đề:
1. Check browser console for errors
2. Verify environment variables: `console.log(import.meta.env)`
3. Test backend API directly với curl
4. Check CloudWatch logs cho backend errors
