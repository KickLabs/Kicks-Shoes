# Hướng dẫn Deploy Frontend lên AWS (S3 + CloudFront + WAF)

## Tổng quan kiến trúc

```
GitHub Actions (CI/CD)
        │
        ▼
   npm run build  ──►  dist/
        │
        ▼
   AWS S3 Bucket  (kicks-shoes-frontend)
        │
        ▼
  CloudFront CDN  ──►  WAF Web ACL (bảo vệ)
        │
        ▼
   Người dùng cuối
```

Luồng hoạt động:
- Code push lên branch `main` hoặc `production` → GitHub Actions tự động chạy
- Build Vite app với các biến môi trường từ GitHub Secrets
- Upload file lên S3 (phân biệt cache strategy cho HTML vs static assets)
- Invalidate CloudFront cache để người dùng nhận bản mới nhất

---

## Tại sao có 2 file CloudFormation?

Đây là điểm quan trọng nhất cần hiểu trước khi deploy.

### Ràng buộc của AWS WAF + CloudFront

AWS WAF (Web Application Firewall) khi dùng với CloudFront **bắt buộc phải được tạo ở region `us-east-1` (N. Virginia)**. Đây là giới hạn cứng của AWS, không thể thay đổi.

Trong khi đó, stack chính (S3 + CloudFront) có thể deploy ở bất kỳ region nào (dự án này dùng `ap-southeast-1` - Singapore).

Vì CloudFormation không cho phép một stack tạo resource ở 2 region khác nhau cùng lúc, nên phải **tách thành 2 stack riêng biệt**:

| File | Region | Mục đích |
|------|--------|----------|
| `cloudformation-waf.yaml` | `us-east-1` | Tạo WAF Web ACL trước |
| `cloudformation-main.yaml` | `ap-southeast-1` | Tạo S3 + CloudFront, nhận WAF ARN từ stack trên |

### Thứ tự deploy bắt buộc

```
Bước 1: Deploy cloudformation-waf.yaml  (us-east-1)
                    │
                    │  Output: WAFWebACLArn
                    ▼
Bước 2: Deploy cloudformation-main.yaml (ap-southeast-1)
         với tham số WAFWebACLArn = <ARN từ bước 1>
```

---

## Chi tiết từng file CloudFormation

### 1. `cloudformation-waf.yaml` — WAF Stack

**Deploy ở: `us-east-1`**

#### Parameters

| Tham số | Mặc định | Mô tả |
|---------|----------|-------|
| `ProjectName` | `kicks-shoes` | Tiền tố đặt tên resource |

#### Resources được tạo

**`WAFWebACL`** — Web Application Firewall với 4 rules theo thứ tự ưu tiên:

| Priority | Rule | Hành động | Giải thích |
|----------|------|-----------|------------|
| 1 | `RateLimitRule` | Block | Chặn IP gửi quá **2000 request/5 phút**. Chống DDoS, brute force |
| 2 | `AWSManagedRulesCommonRuleSet` | None (monitor) | Bộ rule chung của AWS: chặn SQLi, XSS, path traversal... |
| 3 | `AWSManagedRulesKnownBadInputsRuleSet` | None (monitor) | Chặn các input độc hại đã biết (Log4Shell, SSRF...) |
| 4 | `GeoBlockRule` | Block | Chỉ cho phép traffic từ: VN, US, SG, JP, KR, AU. Chặn tất cả nước còn lại |

> `OverrideAction: None` nghĩa là dùng hành động mặc định của rule group (thường là Block/Count tùy rule).

#### Outputs

| Output | Mô tả | Dùng để |
|--------|-------|---------|
| `WAFWebACLId` | ID của WAF ACL | Tham khảo |
| `WAFWebACLArn` | ARN đầy đủ | **Truyền vào cloudformation-main.yaml** |

---

### 2. `cloudformation-main.yaml` — Main Stack

**Deploy ở: `ap-southeast-1`**

#### Parameters

| Tham số | Mặc định | Mô tả |
|---------|----------|-------|
| `ProjectName` | `kicks-shoes` | Tiền tố đặt tên resource |
| `DomainName` | _(rỗng)_ | Custom domain (vd: `www.kicks.vn`), để trống nếu chưa có |
| `CertificateArn` | _(rỗng)_ | ARN của SSL cert từ ACM (phải ở `us-east-1`) |
| `WAFWebACLArn` | _(rỗng)_ | ARN lấy từ output của WAF stack |

#### Conditions (điều kiện)

```yaml
HasCustomDomain: true  # nếu DomainName != ''
HasCertificate:  true  # nếu CertificateArn != ''
HasWAF:          true  # nếu WAFWebACLArn != ''
```

Các condition này kiểm soát việc có gắn domain/cert/WAF vào CloudFront hay không.

#### Resources được tạo

**`FrontendBucket`** — S3 lưu file build

- `PublicAccessBlockConfiguration`: Chặn hoàn toàn public access. File chỉ được đọc qua CloudFront (OAC), không ai truy cập S3 trực tiếp được
- `BucketEncryption: AES256`: Mã hóa file khi lưu trữ
- `VersioningConfiguration: Enabled`: Giữ lại các version cũ, hỗ trợ rollback
- `LifecycleConfiguration`: Tự xóa version cũ sau **30 ngày** để tiết kiệm chi phí

**`FrontendBucketPolicy`** — Policy cho phép CloudFront đọc S3

```yaml
Principal:
  Service: cloudfront.amazonaws.com
Action: s3:GetObject
Condition:
  StringEquals:
    AWS:SourceArn: <CloudFront Distribution ARN>
```

Chỉ đúng CloudFront distribution này mới được đọc bucket, không phải bất kỳ CloudFront nào.

**`CloudFrontOAC`** — Origin Access Control

Cơ chế xác thực mới của AWS (thay thế OAI cũ). CloudFront ký request bằng `sigv4` khi lấy file từ S3, đảm bảo chỉ CloudFront hợp lệ mới truy cập được.

**`CloudFrontDistribution`** — CDN phân phối nội dung

Cấu hình quan trọng:

| Config | Giá trị | Lý do |
|--------|---------|-------|
| `DefaultRootObject` | `index.html` | Trả về index.html khi truy cập `/` |
| `HttpVersion` | `http2and3` | Hỗ trợ HTTP/3 (QUIC) cho tốc độ tốt hơn |
| `PriceClass` | `PriceClass_All` | Dùng tất cả edge locations toàn cầu |
| `ViewerProtocolPolicy` | `redirect-to-https` | Tự redirect HTTP → HTTPS |
| `CachePolicyId` | `658327ea...` (CachingOptimized) | Cache tối ưu cho static files |
| `OriginRequestPolicyId` | `88a5eaf4...` (CORS-S3Origin) | Xử lý CORS khi lấy file từ S3 |
| `Compress: true` | — | Gzip/Brotli tự động, giảm bandwidth |

**Custom Error Responses** — Quan trọng cho SPA (Single Page App):

```yaml
ErrorCode: 403  →  ResponseCode: 200  →  /index.html
ErrorCode: 404  →  ResponseCode: 200  →  /index.html
```

Khi user truy cập `/products/123`, S3 không có file đó nên trả 404. CloudFront bắt lỗi này và trả về `index.html` để React Router xử lý routing phía client.

**`SecurityHeadersPolicy`** — HTTP Security Headers

| Header | Giá trị | Bảo vệ khỏi |
|--------|---------|-------------|
| `Strict-Transport-Security` | max-age=63072000 (2 năm) | Buộc HTTPS, chống MITM |
| `X-Content-Type-Options` | nosniff | Chống MIME sniffing |
| `X-Frame-Options` | DENY | Chống Clickjacking |
| `X-XSS-Protection` | 1; mode=block | Chống XSS (browser cũ) |
| `Referrer-Policy` | strict-origin-when-cross-origin | Kiểm soát thông tin referrer |
| `Permissions-Policy` | geolocation=(), microphone=(), camera=() | Chặn truy cập hardware nhạy cảm |

**`LoggingBucket`** — S3 lưu access logs CloudFront

- Logs tự xóa sau **90 ngày**
- `ObjectOwnership: BucketOwnerPreferred`: Cần thiết để CloudFront có thể ghi log vào bucket

#### Outputs

| Output | Mô tả |
|--------|-------|
| `S3BucketName` | Tên bucket (dùng trong GitHub Actions) |
| `CloudFrontDistributionId` | ID distribution (dùng để invalidate cache) |
| `CloudFrontDomainName` | Domain dạng `xxxx.cloudfront.net` |
| `CloudFrontURL` | URL đầy đủ để truy cập |
| `CloudFrontDistributionArn` | ARN (dùng khi cần gắn WAF sau) |

---

## Cấu hình IAM

### IAM User/Role cho GitHub Actions

Tạo IAM User (hoặc Role nếu dùng OIDC) với policy sau:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3DeployAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::kicks-shoes-frontend",
        "arn:aws:s3:::kicks-shoes-frontend/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>"
    }
  ]
}
```

> Nguyên tắc Least Privilege: chỉ cấp đúng quyền cần thiết, không dùng `AdministratorAccess`.

### IAM cho CloudFormation (nếu deploy thủ công)

Người deploy CloudFormation stack cần thêm quyền:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "s3:CreateBucket",
        "s3:PutBucketPolicy",
        "s3:PutBucketEncryption",
        "s3:PutBucketVersioning",
        "s3:PutLifecycleConfiguration",
        "cloudfront:CreateDistribution",
        "cloudfront:UpdateDistribution",
        "cloudfront:CreateOriginAccessControl",
        "cloudfront:CreateResponseHeadersPolicy",
        "wafv2:CreateWebACL",
        "wafv2:GetWebACL"
      ],
      "Resource": "*"
    }
  ]
}
```

### GitHub Secrets cần cấu hình

Vào `GitHub Repo → Settings → Secrets and variables → Actions`:

| Secret | Giá trị | Lấy từ đâu |
|--------|---------|------------|
| `AWS_ACCESS_KEY_ID` | Access key của IAM User | IAM Console |
| `AWS_SECRET_ACCESS_KEY` | Secret key của IAM User | IAM Console (chỉ hiện 1 lần) |
| `AWS_REGION` | `ap-southeast-1` | Cố định |
| `AWS_S3_BUCKET` | `kicks-shoes-frontend` | Output của CloudFormation main stack |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | `EXXXXXXXXXX` | Output của CloudFormation main stack |
| `AWS_CLOUDFRONT_DOMAIN` | `xxxx.cloudfront.net` | Output của CloudFormation main stack |
| `VITE_API_URL` | URL backend production | Backend deployment |
| `VITE_API_BASE_URL` | URL backend + `/api` | Backend deployment |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Google Cloud Console |
| `VITE_FACEBOOK_APP_ID` | Facebook App ID | Meta Developer Console |
| `VITE_SOCKET_URL` | URL WebSocket backend | Backend deployment |
| `VITE_GEMINI_API_KEY` | Gemini API Key | Google AI Studio |
| `VITE_GEMINI_MODEL` | `gemini-2.5-flash-preview-05-20` | Cố định |
| `VITE_AI_USE_PROXY` | `false` | Cố định |
| `VITE_STUN_URL` | `stun:stun.l.google.com:19302` | Cố định |
| `VITE_STUN_URL_2` | `stun:stun1.l.google.com:19302` | Cố định |
| `VITE_TURN_URL` | TURN server URL | ExpressTurn dashboard |
| `VITE_TURN_USERNAME` | TURN username | ExpressTurn dashboard |
| `VITE_TURN_CREDENTIAL` | TURN credential | ExpressTurn dashboard |
| `VITE_XIRYS_TURN_URL` | Xirsys TURN URL | Xirsys dashboard |
| `VITE_XIRYS_TURN_USERNAME` | Xirsys username | Xirsys dashboard |
| `VITE_XIRYS_TURN_CREDENTIAL` | Xirsys credential | Xirsys dashboard |
| `VITE_WEBRTC_FORCE_TURN` | `0` | Cố định |
| `VITE_TINYMCE_API_KEY` | TinyMCE API Key | TinyMCE dashboard |

---

## Hướng dẫn deploy từng bước

### Bước 1: Tạo IAM User cho GitHub Actions

1. Vào AWS Console → IAM → Users → Create user
2. Tên: `github-actions-frontend-deploy`
3. Chọn "Attach policies directly" → tạo inline policy với JSON ở phần IAM trên
4. Tạo Access Key: User → Security credentials → Create access key → chọn "Application running outside AWS"
5. Lưu `Access Key ID` và `Secret Access Key`

### Bước 2: Deploy WAF Stack (us-east-1)

```bash
aws cloudformation deploy \
  --template-file frontend/cloudformation-waf.yaml \
  --stack-name kicks-shoes-waf \
  --region us-east-1 \
  --capabilities CAPABILITY_IAM
```

Lấy WAF ARN từ output:

```bash
aws cloudformation describe-stacks \
  --stack-name kicks-shoes-waf \
  --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='WAFWebACLArn'].OutputValue" \
  --output text
```

Kết quả dạng: `arn:aws:wafv2:us-east-1:<ACCOUNT_ID>:global/webacl/kicks-shoes-waf/<ID>`

### Bước 3: Deploy Main Stack (ap-southeast-1)

```bash
aws cloudformation deploy \
  --template-file frontend/cloudformation-main.yaml \
  --stack-name kicks-shoes-main \
  --region ap-southeast-1 \
  --parameter-overrides \
    ProjectName=kicks-shoes \
    WAFWebACLArn=<ARN từ bước 2> \
  --capabilities CAPABILITY_IAM
```

> Nếu có custom domain và SSL cert, thêm:
> ```
> DomainName=www.kicks.vn \
> CertificateArn=arn:aws:acm:us-east-1:<ACCOUNT_ID>:certificate/<CERT_ID>
> ```

### Bước 4: Lấy thông tin từ Main Stack

```bash
aws cloudformation describe-stacks \
  --stack-name kicks-shoes-main \
  --region ap-southeast-1 \
  --query "Stacks[0].Outputs"
```

Ghi lại:
- `S3BucketName` → `AWS_S3_BUCKET`
- `CloudFrontDistributionId` → `AWS_CLOUDFRONT_DISTRIBUTION_ID`
- `CloudFrontDomainName` → `AWS_CLOUDFRONT_DOMAIN`

### Bước 5: Cấu hình GitHub Secrets

Vào `Settings → Secrets and variables → Actions` và thêm tất cả secrets theo bảng ở trên.

### Bước 6: Trigger deploy

Push code lên branch `main` hoặc `production`:

```bash
git push origin main
```

Hoặc trigger thủ công: `Actions → Deploy Frontend to AWS S3 + CloudFront → Run workflow`

---

## Chi tiết GitHub Actions Workflow

File: `.github/workflows/deploy-frontend.yml`

### Trigger conditions

```yaml
on:
  push:
    branches: [main, production]
    paths: ['frontend/**']   # Chỉ chạy khi có thay đổi trong thư mục frontend
  workflow_dispatch:          # Cho phép trigger thủ công
```

`paths: ['frontend/**']` rất quan trọng — tránh deploy lại FE khi chỉ thay đổi backend.

### Các bước trong job

**1. Checkout + Setup Node 18**
- Cache `node_modules` dựa trên `package-lock.json` để tăng tốc CI

**2. `npm ci`**
- Dùng `ci` thay vì `install` để đảm bảo cài đúng version trong lockfile, không tự update

**3. `npm run lint`**
- `continue-on-error: true` — lint fail không chặn deploy (nên đổi thành `false` khi production ổn định)

**4. `npm run build`**
- Inject tất cả biến môi trường từ GitHub Secrets vào quá trình build Vite
- Vite embed các biến `VITE_*` vào bundle tại build time (không phải runtime)

**5. Upload HTML files (no-cache)**

```bash
aws s3 sync dist/ s3://BUCKET \
  --include "*.html" \
  --cache-control "no-cache, no-store, must-revalidate"
```

HTML files không được cache vì chúng chứa link đến các asset mới nhất. Nếu cache HTML cũ, user sẽ load JS/CSS cũ.

**6. Upload static assets (long cache)**

```bash
aws s3 sync dist/ s3://BUCKET \
  --exclude "*.html" \
  --cache-control "public, max-age=31536000, immutable"
```

JS/CSS/images được cache 1 năm (`31536000` giây). Vite tự thêm content hash vào tên file (vd: `main.a3f2c1.js`), nên khi code thay đổi, tên file thay đổi → browser tự fetch file mới.

**7. CloudFront Invalidation**

```bash
aws cloudfront create-invalidation \
  --distribution-id DIST_ID \
  --paths "/*"
```

Xóa cache toàn bộ CloudFront edge locations để người dùng nhận HTML mới nhất ngay lập tức.

---

## Trạng thái hiện tại

Dựa trên cấu hình trong repo, **đã deploy** các thành phần sau:

| Thành phần | Trạng thái | Ghi chú |
|------------|------------|---------|
| CloudFormation WAF Stack | Đã deploy | Region `us-east-1` |
| CloudFormation Main Stack | Đã deploy | Region `ap-southeast-1` |
| S3 Bucket | Đã tạo | `kicks-shoes-frontend` |
| CloudFront Distribution | Đã tạo | Có WAF gắn kèm |
| GitHub Actions Workflow | Đã cấu hình | Auto-deploy khi push `main`/`production` |
| GitHub Secrets | Cần verify | Kiểm tra đủ secrets chưa |

Dấu hiệu đã deploy: file `.env.aws` tồn tại với cấu hình production, workflow file đã có đầy đủ secrets references, và `.firebase/hosting.ZnJvbnRlbmRcZGlzdA.cache` cho thấy trước đây từng dùng Firebase Hosting (đã migrate sang AWS).

---

## Lưu ý bảo mật

> **QUAN TRỌNG**: File `frontend/.env.aws` đang chứa các credentials thật (API keys, TURN credentials). File này **không nên commit lên git**. Kiểm tra `.gitignore` để đảm bảo file này bị ignore.

Các giá trị cần rotate ngay nếu đã bị lộ:
- `VITE_GEMINI_API_KEY`
- `VITE_TURN_CREDENTIAL` / `VITE_XIRYS_TURN_CREDENTIAL`
- `VITE_TINYMCE_API_KEY`
- `VITE_GOOGLE_CLIENT_ID` / `VITE_FACEBOOK_APP_ID` (nếu bị lộ)
