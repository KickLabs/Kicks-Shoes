# Hướng Dẫn Deploy Frontend Lên AWS (CloudFormation)

## 📋 Mục Lục

1. [Yêu Cầu Trước Khi Deploy](#yêu-cầu-trước-khi-deploy)
2. [Bước 1: Tạo IAM User](#bước-1-tạo-iam-user)
3. [Bước 2: Cấu Hình AWS CLI](#bước-2-cấu-hình-aws-cli)
4. [Bước 3: Deploy Infrastructure](#bước-3-deploy-infrastructure)
5. [Bước 4: Deploy Application](#bước-4-deploy-application)
6. [Bước 5: Truy Cập Website](#bước-5-truy-cập-website)
7. [Troubleshooting](#troubleshooting)

---

## Yêu Cầu Trước Khi Deploy

### Phần Mềm Cần Thiết

- ✅ **Node.js** (v18 trở lên)
- ✅ **npm** hoặc **yarn**
- ✅ **AWS CLI** (v2)
- ✅ **PowerShell** (Windows) hoặc **Bash** (Linux/Mac)
- ✅ **Git**

### Kiểm Tra Cài Đặt

```powershell
# Kiểm tra Node.js
node --version

# Kiểm tra npm
npm --version

# Kiểm tra AWS CLI
aws --version

# Kiểm tra PowerShell
$PSVersionTable.PSVersion
```

---

## Bước 1: Tạo IAM User

### 1.1. Đăng Nhập AWS Console

1. Truy cập: https://console.aws.amazon.com
2. Đăng nhập với tài khoản **root** hoặc **admin**

### 1.2. Tạo IAM User Mới

1. Vào **IAM** → **Users** → **Create user**
2. Nhập tên user: `fe-dev` (hoặc tên bạn muốn)
3. Chọn **Attach policies directly**
4. **KHÔNG** chọn managed policy nào (sẽ tạo custom policy)
5. Click **Next** → **Create user**

### 1.3. Tạo Access Key

1. Click vào user `fe-dev` vừa tạo
2. Tab **Security credentials**
3. Click **Create access key**
4. Chọn **Command Line Interface (CLI)**
5. Tick vào "I understand..."
6. Click **Next** → **Create access key**
7. **LƯU LẠI** Access Key ID và Secret Access Key (chỉ hiện 1 lần!)

```
Access Key ID:     AKIAXXXXXXXXXXXXXXXX
Secret Access Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 1.4. Tạo IAM Policy

1. Vào **IAM** → **Policies** → **Create policy**
2. Chọn tab **JSON**
3. Copy nội dung từ file `IAM-POLICY-SIMPLE.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFormationFullAccess",
      "Effect": "Allow",
      "Action": "cloudformation:*",
      "Resource": "*"
    },
    {
      "Sid": "S3FullAccess",
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::kicks-shoes-*",
        "arn:aws:s3:::kicks-shoes-*/*"
      ]
    },
    {
      "Sid": "CloudFrontFullAccess",
      "Effect": "Allow",
      "Action": "cloudfront:*",
      "Resource": "*"
    },
    {
      "Sid": "WAFFullAccess",
      "Effect": "Allow",
      "Action": "wafv2:*",
      "Resource": "*"
    },
    {
      "Sid": "IAMFullAccess",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:ListAttachedRolePolicies",
        "iam:ListRolePolicies",
        "iam:TagRole",
        "iam:UntagRole"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchLogsFullAccess",
      "Effect": "Allow",
      "Action": "logs:*",
      "Resource": "*"
    },
    {
      "Sid": "SNSFullAccess",
      "Effect": "Allow",
      "Action": "sns:*",
      "Resource": "*"
    },
    {
      "Sid": "STSGetCallerIdentity",
      "Effect": "Allow",
      "Action": "sts:GetCallerIdentity",
      "Resource": "*"
    }
  ]
}
```

4. Click **Next**
5. Nhập tên policy: `FrontendDeploymentPolicy`
6. Click **Create policy**

### 1.5. Gắn Policy Vào User

1. Vào **IAM** → **Users** → `fe-dev`
2. Tab **Permissions** → **Add permissions** → **Attach policies directly**
3. Tìm và chọn `FrontendDeploymentPolicy`
4. Click **Add permissions**

---

## Bước 2: Cấu Hình AWS CLI

### 2.1. Cài Đặt AWS CLI

**Windows:**
```powershell
# Download từ: https://awscli.amazonaws.com/AWSCLIV2.msi
# Hoặc dùng winget:
winget install Amazon.AWSCLI
```

**macOS:**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### 2.2. Cấu Hình Credentials

```powershell
aws configure
```

Nhập thông tin:
```
AWS Access Key ID [None]: AKIAXXXXXXXXXXXXXXXX
AWS Secret Access Key [None]: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Default region name [None]: us-east-1
Default output format [None]: json
```

### 2.3. Kiểm Tra Cấu Hình

```powershell
# Kiểm tra credentials
aws sts get-caller-identity
```

Kết quả mong đợi:
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/fe-dev"
}
```

---

## Bước 3: Deploy Infrastructure

### 3.1. Clone Repository

```powershell
git clone <repository-url>
cd Kicks-Shoes-AWS/frontend
```

### 3.2. Kiểm Tra Files

Đảm bảo có các files sau:
```
frontend/
├── cloudformation-waf.yaml
├── cloudformation-main.yaml
├── deploy-infrastructure.ps1
├── deploy-aws.ps1
└── .env.production (sẽ được tạo tự động)
```

### 3.3. Deploy Infrastructure

```powershell
# Vào thư mục frontend
cd frontend

# Deploy WAF + S3 + CloudFront (10-15 phút)
.\deploy-infrastructure.ps1 -ProjectName "kicks-shoes" -Region "us-east-1"
```

**Quá trình deploy:**
1. ✅ Verify AWS credentials
2. ✅ Deploy WAF Stack (2-3 phút)
3. ✅ Deploy Frontend Stack (10-15 phút)
4. ✅ Update `.env.production`

### 3.4. Kiểm Tra Kết Quả

Sau khi deploy xong, bạn sẽ thấy:

```
============================================
  🎉 Infrastructure Deployment Complete!
============================================

Stack Outputs:
  S3 Bucket:              kicks-shoes-frontend
  CloudFront Dist ID:     E3GQ3FZAHYJULV
  CloudFront Domain:      d2xizc17m7z38g.cloudfront.net
  CloudFront URL:         https://d2xizc17m7z38g.cloudfront.net
========================================

Next Steps:
  1. Review .env.production and add your application variables
  2. Run: .\deploy-aws.ps1 production
  3. Access your app at: https://d2xizc17m7z38g.cloudfront.net
```

### 3.5. Kiểm Tra `.env.production`

File `.env.production` sẽ được tạo tự động với nội dung:

```env
# AWS Deployment Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET=kicks-shoes-frontend
AWS_CLOUDFRONT_DISTRIBUTION_ID=E3GQ3FZAHYJULV
AWS_CLOUDFRONT_DOMAIN=d2xizc17m7z38g.cloudfront.net
AWS_ENABLE_BACKUP=false

# Application Configuration
VITE_API_URL=http://your-backend-url
VITE_API_BASE_URL=http://your-backend-url/api
# ... (các biến khác)
```

**Cập nhật các biến môi trường khác** (API URL, OAuth keys, etc.) nếu cần.

---

## Bước 4: Deploy Application

### 4.1. Cài Đặt Dependencies

```powershell
# Cài đặt packages
npm install
```

### 4.2. Build Application

```powershell
# Build production
npm run build
```

Kết quả:
```
✓ 5969 modules transformed.
dist/index.html                    1.02 kB
dist/assets/index-DnT4CSHb.css   188.76 kB
dist/assets/index-3W0YRiCw.js  3,668.64 kB
✓ built in 2m 34s
```

### 4.3. Deploy Lên S3 + CloudFront

```powershell
# Deploy application
.\deploy-aws.ps1 production
```

**Quá trình deploy:**
1. ✅ Load `.env.production`
2. ✅ Build application (nếu chưa build)
3. ✅ Upload files lên S3
4. ✅ Invalidate CloudFront cache

Kết quả:
```
========================================
  Deployment completed successfully!
========================================
Your app is available at: https://d2xizc17m7z38g.cloudfront.net
```

---

## Bước 5: Truy Cập Website

### 5.1. Mở Trình Duyệt

```
https://d2xizc17m7z38g.cloudfront.net
```

**Lưu ý:** CloudFront cache invalidation mất **2-5 phút**. Nếu thấy nội dung cũ hoặc lỗi, đợi thêm vài phút.

### 5.2. Kiểm Tra CloudFront Status

```powershell
# Kiểm tra distribution status
aws cloudfront get-distribution --id E3GQ3FZAHYJULV --query 'Distribution.Status' --output text
```

Kết quả mong đợi: `Deployed`

### 5.3. Kiểm Tra Invalidation Status

```powershell
# Kiểm tra invalidation status
aws cloudfront list-invalidations --distribution-id E3GQ3FZAHYJULV --query 'InvalidationList.Items[0].[Id,Status]' --output table
```

Kết quả mong đợi: `Completed`

---

## Deploy Lại Sau Này

### Chỉ Deploy Application (Không Thay Đổi Infrastructure)

```powershell
cd frontend
.\deploy-aws.ps1 production
```

### Deploy Lại Toàn Bộ (Infrastructure + Application)

```powershell
cd frontend
.\deploy-full.ps1
```

### Chỉ Deploy Infrastructure (Không Deploy Application)

```powershell
cd frontend
.\deploy-infrastructure.ps1 -ProjectName "kicks-shoes" -Region "us-east-1"
```

---

## Xóa Toàn Bộ Infrastructure

### Xóa CloudFormation Stacks

```powershell
# Xóa Frontend Stack
aws cloudformation delete-stack --stack-name kicks-shoes-frontend --region us-east-1

# Đợi xóa xong
aws cloudformation wait stack-delete-complete --stack-name kicks-shoes-frontend --region us-east-1

# Xóa WAF Stack
aws cloudformation delete-stack --stack-name kicks-shoes-waf --region us-east-1

# Đợi xóa xong
aws cloudformation wait stack-delete-complete --stack-name kicks-shoes-waf --region us-east-1
```

### Xóa S3 Buckets (Nếu Còn)

```powershell
# Xóa tất cả objects trong bucket
aws s3 rm s3://kicks-shoes-frontend --recursive --region us-east-1
aws s3 rm s3://kicks-shoes-logs --recursive --region us-east-1

# Xóa buckets
aws s3 rb s3://kicks-shoes-frontend --region us-east-1
aws s3 rb s3://kicks-shoes-logs --region us-east-1
```

---

## Troubleshooting

### Lỗi: "AccessDenied" khi deploy

**Nguyên nhân:** IAM policy chưa đủ quyền

**Giải pháp:**
1. Kiểm tra IAM policy đã attach vào user `fe-dev`
2. Đảm bảo dùng policy từ `IAM-POLICY-SIMPLE.json`
3. Đợi 30 giây sau khi update policy

### Lỗi: "Service Control Policy" deny

**Nguyên nhân:** AWS Organization có SCP chặn CloudFormation

**Giải pháp:**
1. Liên hệ AWS Organization Administrator
2. Yêu cầu cho phép CloudFormation operations
3. Hoặc thử deploy ở region khác (us-west-2, eu-west-1)

### Lỗi: "Stack is in DELETE_FAILED state"

**Nguyên nhân:** Stack xóa không thành công do thiếu quyền

**Giải pháp:**
```powershell
# Xóa lại stack
aws cloudformation delete-stack --stack-name kicks-shoes-frontend --region us-east-1

# Nếu vẫn lỗi, xóa thủ công trên AWS Console
```

### Lỗi: "Bucket already exists"

**Nguyên nhân:** S3 bucket name đã được dùng (global namespace)

**Giải pháp:**
1. Đổi `ProjectName` thành tên khác:
```powershell
.\deploy-infrastructure.ps1 -ProjectName "kicks-shoes-v2" -Region "us-east-1"
```

### Website hiển thị nội dung cũ

**Nguyên nhân:** CloudFront cache chưa invalidate xong

**Giải pháp:**
```powershell
# Tạo invalidation mới
aws cloudfront create-invalidation --distribution-id E3GQ3FZAHYJULV --paths "/*"

# Đợi 2-5 phút
```

### Build bị lỗi

**Nguyên nhân:** Dependencies chưa cài đặt hoặc lỗi code

**Giải pháp:**
```powershell
# Xóa node_modules và cài lại
Remove-Item -Recurse -Force node_modules
npm install

# Build lại
npm run build
```

---

## Kiến Trúc Hệ Thống

```
User (Browser)
    ↓ HTTPS
CloudFront (CDN)
    ↓ (Origin Access Control)
S3 Bucket (Private)
    ↓ (Logs)
S3 Logs Bucket
    ↓ (Notifications)
SNS Topic
    ↓
CloudWatch Logs

WAF (Web Application Firewall)
    ↓ (Attached to CloudFront)
Rate Limiting, Geo-blocking, IP filtering
```

---

## Resources Được Tạo

### WAF Stack (us-east-1)
- ✅ WAF Web ACL
- ✅ AWS Managed Rule Sets (Core, Known Bad Inputs)
- ✅ Rate Limiting Rule (2000 requests/5min)

### Frontend Stack (us-east-1)
- ✅ S3 Bucket (Frontend)
- ✅ S3 Bucket (Logs)
- ✅ CloudFront Distribution
- ✅ CloudFront Origin Access Control (OAC)
- ✅ CloudFront Response Headers Policy (Security Headers)
- ✅ SNS Topic (S3 Notifications)
- ✅ CloudWatch Log Group
- ✅ IAM Role (SNS Delivery Logging)

---

## Chi Phí Ước Tính

### Miễn Phí (Free Tier)
- CloudFront: 1 TB data transfer/tháng
- S3: 5 GB storage, 20,000 GET requests
- CloudWatch Logs: 5 GB ingestion
- WAF: 1 Web ACL, 10 rules

### Sau Free Tier (Ước tính cho 10,000 users/tháng)
- CloudFront: ~$10-20/tháng
- S3: ~$1-5/tháng
- WAF: ~$5-10/tháng
- CloudWatch: ~$1-3/tháng

**Tổng:** ~$17-38/tháng

---

## Bảo Mật

### Đã Được Bảo Vệ
- ✅ HTTPS only (redirect HTTP → HTTPS)
- ✅ WAF protection (DDoS, rate limiting)
- ✅ S3 bucket private (không public)
- ✅ CloudFront OAC (chỉ CloudFront truy cập S3)
- ✅ Security headers (HSTS, XSS protection, etc.)
- ✅ Encryption at rest (S3 SSE-AES256)
- ✅ Encryption in transit (TLS 1.2+)

### Khuyến Nghị Thêm
- 🔒 Dùng custom domain + ACM certificate
- 🔒 Enable CloudFront access logs
- 🔒 Enable S3 versioning (đã có)
- 🔒 Setup CloudWatch alarms
- 🔒 Enable AWS CloudTrail

---

## Liên Hệ & Hỗ Trợ

- **Documentation:** `frontend/documents/aws_deployment/`
- **IAM Policy:** `IAM-POLICY-SIMPLE.json`
- **CloudFormation Templates:** `cloudformation-waf.yaml`, `cloudformation-main.yaml`
- **Deployment Scripts:** `deploy-infrastructure.ps1`, `deploy-aws.ps1`

---

**Chúc bạn deploy thành công! 🚀**
