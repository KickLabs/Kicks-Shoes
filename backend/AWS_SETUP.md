# AWS Setup Guide

## Overview
Backend hiện hỗ trợ upload ảnh lên cả **Cloudinary** và **AWS S3**, cùng với **DynamoDB** cho database.

## 1. AWS S3 Configuration (Upload ảnh)

### Tạo S3 Bucket
```bash
# Tạo bucket
aws s3 mb s3://kicks-shoes-uploads --region ap-southeast-1

# Set public access (nếu cần)
aws s3api put-public-access-block \
  --bucket kicks-shoes-uploads \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

### Bucket Policy (Optional - cho public read)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::kicks-shoes-uploads/*"
    }
  ]
}
```

### CORS Configuration
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Environment Variables
```env
# AWS Credentials
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# S3 Configuration
AWS_S3_BUCKET=kicks-shoes-uploads

# Upload Strategy
UPLOAD_STRATEGY=s3  # hoặc 'cloudinary'
```

## 2. DynamoDB Configuration

### Tạo Tables

#### Health Check Table
```bash
aws dynamodb create-table \
  --table-name kicks-health \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-1
```

#### Users Table
```bash
aws dynamodb create-table \
  --table-name kicks-users \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes \
    "[{\"IndexName\":\"EmailIndex\",\"KeySchema\":[{\"AttributeName\":\"email\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-1
```

#### Products Table
```bash
aws dynamodb create-table \
  --table-name kicks-products \
  --attribute-definitions \
    AttributeName=productId,AttributeType=S \
    AttributeName=category,AttributeType=S \
  --key-schema \
    AttributeName=productId,KeyType=HASH \
  --global-secondary-indexes \
    "[{\"IndexName\":\"CategoryIndex\",\"KeySchema\":[{\"AttributeName\":\"category\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-1
```

#### Orders Table
```bash
aws dynamodb create-table \
  --table-name kicks-orders \
  --attribute-definitions \
    AttributeName=orderId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=N \
  --key-schema \
    AttributeName=orderId,KeyType=HASH \
  --global-secondary-indexes \
    "[{\"IndexName\":\"UserOrdersIndex\",\"KeySchema\":[{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-1
```

### Environment Variables
```env
# DynamoDB Configuration
DYNAMODB_TABLE_NAME=kicks-health
DYNAMODB_TABLE_USERS=kicks-users
DYNAMODB_TABLE_PRODUCTS=kicks-products
DYNAMODB_TABLE_ORDERS=kicks-orders
DYNAMODB_TABLE_SESSIONS=kicks-sessions

# For local DynamoDB (optional)
DYNAMODB_ENDPOINT=http://localhost:8000
```

## 3. IAM Permissions

### S3 Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::kicks-shoes-uploads",
        "arn:aws:s3:::kicks-shoes-uploads/*"
      ]
    }
  ]
}
```

### DynamoDB Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-southeast-1:*:table/kicks-*"
      ]
    }
  ]
}
```

## 4. Usage

### Switch Upload Strategy
Trong `.env`:
```env
# Dùng Cloudinary (default)
UPLOAD_STRATEGY=cloudinary

# Dùng S3
UPLOAD_STRATEGY=s3
```

### Code Example
```javascript
// Import strategy middleware
import { uploadAvatar, uploadProductImages } from './middlewares/upload.strategy.middleware.js';

// Sử dụng trong routes - tự động chọn Cloudinary hoặc S3
router.post('/avatar', uploadAvatar, controller.updateAvatar);
router.post('/products', uploadProductImages, controller.createProduct);
```

## 5. Testing

### Test S3 Connection
```bash
curl http://localhost:3000/api/health/s3
```

### Test DynamoDB Connection
```bash
curl http://localhost:3000/api/health/dynamodb
```

### Test Upload
```bash
curl -X POST http://localhost:3000/api/upload/test \
  -F "image=@test.jpg"
```

## 6. Local Development

### DynamoDB Local
```bash
# Download DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Set endpoint in .env
DYNAMODB_ENDPOINT=http://localhost:8000
```

### LocalStack (S3 + DynamoDB)
```bash
docker run -p 4566:4566 localstack/localstack

# Set endpoints
AWS_ENDPOINT=http://localhost:4566
DYNAMODB_ENDPOINT=http://localhost:4566
```

## 7. CloudFront (Optional)

Để tăng tốc độ load ảnh, nên dùng CloudFront:

```env
# CloudFront URL
CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

Cập nhật S3 config để return CloudFront URL thay vì S3 URL.

## 8. Migration từ Cloudinary sang S3

Tạo script migration:
```bash
node scripts/migrate-cloudinary-to-s3.js
```

## Notes

- **Cloudinary**: Dễ setup, có transform ảnh built-in, free tier 25GB
- **S3**: Rẻ hơn cho scale lớn, cần setup CloudFront cho CDN, cần xử lý resize ảnh riêng
- **DynamoDB**: NoSQL, scale tốt, phù hợp cho high-traffic
- **MongoDB**: Document-based, dễ query phức tạp, phù hợp cho development

## Troubleshooting

### S3 Upload fails
- Check IAM permissions
- Check bucket CORS
- Check AWS credentials

### DynamoDB connection fails
- Check table exists
- Check region
- Check IAM permissions
