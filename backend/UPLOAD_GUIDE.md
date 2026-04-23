# Upload Configuration Guide

## Tổng quan

Backend hỗ trợ 2 phương thức upload ảnh:
1. **Cloudinary** (mặc định) - Cloud storage với image transformation
2. **AWS S3** - AWS object storage với giá rẻ hơn khi scale

## Quick Start

### 1. Install AWS Dependencies (nếu dùng S3)

**Windows PowerShell:**
```powershell
.\install-aws-deps.ps1
```

**Linux/Mac:**
```bash
chmod +x install-aws-deps.sh
./install-aws-deps.sh
```

**Hoặc manual:**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner
```

### 2. Configure Environment

Copy `.env.example` sang `.env` và cấu hình:

#### Option A: Dùng Cloudinary (Default)
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Upload Strategy
UPLOAD_STRATEGY=cloudinary
```

#### Option B: Dùng AWS S3
```env
# AWS Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# S3 Configuration
AWS_S3_BUCKET=kicks-shoes-uploads

# Upload Strategy
UPLOAD_STRATEGY=s3
```

### 3. Start Server
```bash
npm start
```

## So sánh Cloudinary vs S3

| Feature | Cloudinary | AWS S3 |
|---------|-----------|--------|
| **Setup** | Dễ, chỉ cần API keys | Cần tạo bucket, IAM, CORS |
| **Image Transform** | Built-in (resize, crop, format) | Cần Lambda hoặc service riêng |
| **CDN** | Built-in global CDN | Cần setup CloudFront |
| **Pricing** | Free: 25GB storage, 25GB bandwidth | Pay as you go, rẻ hơn khi scale |
| **Best for** | MVP, prototype, small-medium apps | Production, high-traffic apps |

## Usage trong Code

### Import Strategy Middleware
```javascript
import { 
  uploadAvatar, 
  uploadProductImages, 
  uploadDeliveryProof 
} from './middlewares/upload.strategy.middleware.js';
```

### Sử dụng trong Routes
```javascript
// Upload avatar - tự động chọn Cloudinary hoặc S3
router.post('/avatar', uploadAvatar, async (req, res) => {
  // req.file.path chứa URL của ảnh (Cloudinary hoặc S3)
  const imageUrl = req.file.path;
  res.json({ url: imageUrl });
});

// Upload nhiều ảnh sản phẩm
router.post('/products', uploadProductImages, async (req, res) => {
  // req.files là array các file đã upload
  const imageUrls = req.files.map(f => f.path);
  res.json({ urls: imageUrls });
});
```

### Custom Upload
```javascript
import { uploadSingle, uploadMultiple } from './middlewares/upload.strategy.middleware.js';

// Single file với custom field name và folder
router.post('/blog', uploadSingle('thumbnail', 'blogs'), controller.createBlog);

// Multiple files
router.post('/gallery', uploadMultiple('photos', 20, 'gallery'), controller.uploadGallery);
```

## API Response Format

Cả Cloudinary và S3 đều trả về format giống nhau:

```javascript
// Single file
req.file = {
  path: 'https://...', // URL của ảnh
  originalname: 'photo.jpg',
  mimetype: 'image/jpeg',
  size: 123456,
  // S3 specific (nếu dùng S3)
  s3Url: 'https://...',
  s3Key: 'avatars/123-abc.jpg'
}

// Multiple files
req.files = [
  { path: 'https://...', ... },
  { path: 'https://...', ... }
]
```

## Health Checks

### Check S3 Connection
```bash
curl http://localhost:3000/api/health/s3
```

Response:
```json
{
  "status": "healthy",
  "service": "s3",
  "bucket": "kicks-shoes-uploads",
  "region": "ap-southeast-1"
}
```

### Check All AWS Services
```bash
curl http://localhost:3000/api/health/aws
```

Response:
```json
{
  "status": "healthy",
  "services": {
    "s3": { "status": "healthy" },
    "dynamodb": { "status": "healthy" }
  }
}
```

## Folders Structure

### Cloudinary
```
kicks-shoes/
├── avatars/          # User avatars
└── delivery-proofs/  # Delivery proof images
```

### S3
```
kicks-shoes-uploads/
├── avatars/          # User avatars
├── products/         # Product images
├── delivery-proofs/  # Delivery proof images
├── blogs/            # Blog images
└── temp/             # Temporary uploads
```

## Migration từ Cloudinary sang S3

Nếu đã có data trên Cloudinary và muốn chuyển sang S3:

1. Tạo migration script (sẽ tạo sau nếu cần)
2. Download tất cả ảnh từ Cloudinary
3. Upload lên S3
4. Update database với URLs mới
5. Switch `UPLOAD_STRATEGY=s3`

## Troubleshooting

### Lỗi: "Failed to upload file to S3"
- Check AWS credentials trong `.env`
- Check S3 bucket tồn tại: `aws s3 ls s3://kicks-shoes-uploads`
- Check IAM permissions

### Lỗi: "Cloudinary configuration incomplete"
- Check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` trong `.env`

### Upload chậm
- **Cloudinary**: Check network, có thể do CDN
- **S3**: 
  - Check region (nên dùng region gần nhất)
  - Consider dùng CloudFront
  - Check file size (nên resize trước khi upload)

### File không public
- **Cloudinary**: Mặc định public
- **S3**: 
  - Check bucket policy
  - Hoặc dùng presigned URLs (đã có trong `s3.js`)

## Advanced: CloudFront với S3

Để tăng tốc độ load ảnh từ S3:

1. Tạo CloudFront distribution
2. Point origin tới S3 bucket
3. Update code để return CloudFront URL:

```javascript
// backend/src/config/s3.js
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL;

export const uploadToS3 = async (...) => {
  // ... upload logic
  
  // Return CloudFront URL thay vì S3 URL
  const url = CLOUDFRONT_URL 
    ? `${CLOUDFRONT_URL}/${key}`
    : `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;
    
  return { url, key };
};
```

## Security Best Practices

1. **Không commit credentials** vào git
2. **Dùng IAM roles** khi deploy lên EC2/Lambda (không cần ACCESS_KEY)
3. **Limit file size** (đã set 10MB)
4. **Validate file types** (chỉ cho phép images)
5. **S3 bucket không nên public** - dùng presigned URLs hoặc CloudFront
6. **Enable CORS** đúng cách

## Support

Xem thêm:
- [AWS_SETUP.md](./AWS_SETUP.md) - Chi tiết setup AWS
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [AWS S3 Docs](https://docs.aws.amazon.com/s3/)
