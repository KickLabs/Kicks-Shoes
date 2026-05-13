# Frontend Deploy Checklist (S3 + CloudFront)

## Thứ tự thực hiện

---

## BƯỚC 1 — Chuẩn bị AWS credentials

> Nếu đã có IAM user từ backend deploy thì dùng lại, chỉ cần thêm quyền.

### 1.1 Tạo IAM User (nếu chưa có)
```bash
aws iam create-user --user-name kicks-shoes-deployer
aws iam create-access-key --user-name kicks-shoes-deployer
# Lưu lại AccessKeyId và SecretAccessKey
```

### 1.2 Gắn policy cho user
```bash
aws iam attach-user-policy \
  --user-name kicks-shoes-deployer \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-user-policy \
  --user-name kicks-shoes-deployer \
  --policy-arn arn:aws:iam::aws:policy/CloudFrontFullAccess

aws iam attach-user-policy \
  --user-name kicks-shoes-deployer \
  --policy-arn arn:aws:iam::aws:policy/AWSCloudFormationFullAccess

aws iam attach-user-policy \
  --user-name kicks-shoes-deployer \
  --policy-arn arn:aws:iam::aws:policy/AmazonSNSFullAccess

aws iam attach-user-policy \
  --user-name kicks-shoes-deployer \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess

aws iam attach-user-policy \
  --user-name kicks-shoes-deployer \
  --policy-arn arn:aws:iam::aws:policy/IAMFullAccess
```

---

## BƯỚC 2 — (Tùy chọn) Deploy WAF trước ở us-east-1

> WAF bắt buộc phải ở us-east-1. Bỏ qua bước này nếu chưa cần WAF.

```bash
aws cloudformation create-stack \
  --stack-name kicks-shoes-waf \
  --template-body file://frontend/cloudformation-waf.yaml \
  --parameters ParameterKey=ProjectName,ParameterValue=kicks-shoes \
  --region us-east-1

# Chờ xong
aws cloudformation wait stack-create-complete \
  --stack-name kicks-shoes-waf \
  --region us-east-1

# Lấy WAF ARN
aws cloudformation describe-stacks \
  --stack-name kicks-shoes-waf \
  --query 'Stacks[0].Outputs[?OutputKey==`WAFWebACLArn`].OutputValue' \
  --output text \
  --region us-east-1
# → Lưu lại giá trị này (dùng ở bước 3 nếu muốn gắn WAF)
```

---

## BƯỚC 3 — Deploy CloudFormation stack (S3 + CloudFront)

```bash
# Không có WAF
aws cloudformation create-stack \
  --stack-name kicks-shoes-frontend \
  --template-body file://frontend/cloudformation-main.yaml \
  --parameters ParameterKey=ProjectName,ParameterValue=kicks-shoes \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-1

# Hoặc có WAF (thay WAF_ARN bằng giá trị lấy ở bước 2)
aws cloudformation create-stack \
  --stack-name kicks-shoes-frontend \
  --template-body file://frontend/cloudformation-main.yaml \
  --parameters \
    ParameterKey=ProjectName,ParameterValue=kicks-shoes \
    ParameterKey=WAFWebACLArn,ParameterValue=WAF_ARN \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-1
```

### Theo dõi tiến trình (CloudFront mất ~15-20 phút)
```bash
aws cloudformation wait stack-create-complete \
  --stack-name kicks-shoes-frontend \
  --region ap-southeast-1
```

### Lấy outputs — cần cho bước tiếp theo
```bash
aws cloudformation describe-stacks \
  --stack-name kicks-shoes-frontend \
  --query 'Stacks[0].Outputs' \
  --output table \
  --region ap-southeast-1
```

Ghi lại 3 giá trị:
- `S3BucketName` → `kicks-shoes-frontend`
- `CloudFrontDistributionId` → `E...`
- `CloudFrontDomainName` → `d....cloudfront.net`

---

## BƯỚC 4 — Điền file .env.production

Mở file `frontend/.env.production` và điền:

| Biến | Lấy từ đâu |
|------|-----------|
| `VITE_API_URL` | ALB DNS từ Terraform output (backend) |
| `VITE_API_BASE_URL` | ALB DNS + `/api` |
| `VITE_SOCKET_URL` | ALB DNS |
| `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console |
| `VITE_FACEBOOK_APP_ID` | Facebook Developer Console |
| `VITE_GEMINI_API_KEY` | Google AI Studio |
| `VITE_TINYMCE_API_KEY` | TinyMCE dashboard |
| `VITE_TURN_*` | Nhà cung cấp TURN server |

---

## BƯỚC 5 — Set GitHub Secrets

Vào: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

### AWS Secrets
| Secret name | Giá trị |
|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AccessKeyId từ bước 1 |
| `AWS_SECRET_ACCESS_KEY` | SecretAccessKey từ bước 1 |
| `AWS_S3_BUCKET` | `kicks-shoes-frontend` |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | Distribution ID từ bước 3 |
| `AWS_CLOUDFRONT_DOMAIN` | Domain từ bước 3 (không có https://) |

### App Secrets (copy từ .env.production)
| Secret name | Biến tương ứng |
|-------------|---------------|
| `VITE_API_URL` | `VITE_API_URL` |
| `VITE_API_BASE_URL` | `VITE_API_BASE_URL` |
| `VITE_SOCKET_URL` | `VITE_SOCKET_URL` |
| `VITE_GOOGLE_CLIENT_ID` | `VITE_GOOGLE_CLIENT_ID` |
| `VITE_FACEBOOK_APP_ID` | `VITE_FACEBOOK_APP_ID` |
| `VITE_GEMINI_API_KEY` | `VITE_GEMINI_API_KEY` |
| `VITE_GEMINI_MODEL` | `VITE_GEMINI_MODEL` |
| `VITE_TINYMCE_API_KEY` | `VITE_TINYMCE_API_KEY` |
| `VITE_AI_USE_PROXY` | `VITE_AI_USE_PROXY` |
| `VITE_STUN_URL` | `VITE_STUN_URL` |
| `VITE_STUN_URL_2` | `VITE_STUN_URL_2` |
| `VITE_TURN_URL` | `VITE_TURN_URL` |
| `VITE_TURN_USERNAME` | `VITE_TURN_USERNAME` |
| `VITE_TURN_CREDENTIAL` | `VITE_TURN_CREDENTIAL` |
| `VITE_XIRYS_TURN_URL` | `VITE_XIRYS_TURN_URL` |
| `VITE_XIRYS_TURN_USERNAME` | `VITE_XIRYS_TURN_USERNAME` |
| `VITE_XIRYS_TURN_CREDENTIAL` | `VITE_XIRYS_TURN_CREDENTIAL` |
| `VITE_WEBRTC_FORCE_TURN` | `VITE_WEBRTC_FORCE_TURN` |

---

## BƯỚC 6 — Fix nhỏ trong CloudFormation template (khuyến nghị)

File `frontend/cloudformation-main.yaml` đang để `ViewerProtocolPolicy: allow-all`.
Đổi thành `redirect-to-https` cho production:

```yaml
# Dòng ~130 trong cloudformation-main.yaml
ViewerProtocolPolicy: redirect-to-https   # thay vì allow-all
```

Nếu stack đã tạo rồi thì update:
```bash
aws cloudformation update-stack \
  --stack-name kicks-shoes-frontend \
  --template-body file://frontend/cloudformation-main.yaml \
  --parameters ParameterKey=ProjectName,ParameterValue=kicks-shoes \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-1
```

---

## BƯỚC 7 — Trigger deploy lần đầu

```bash
# Push lên branch kicks-production để trigger workflow
git add .
git commit -m "chore: configure frontend production deployment"
git push origin kicks-production
```

Hoặc trigger thủ công: **GitHub → Actions → Deploy Frontend to AWS S3 + CloudFront → Run workflow**

---

## BƯỚC 8 — Verify

```bash
# Kiểm tra S3 có file chưa
aws s3 ls s3://kicks-shoes-frontend --region ap-southeast-1

# Test CloudFront
curl -I https://CLOUDFRONT_DOMAIN/index.html
# Expect: HTTP/2 200, x-cache: Hit from cloudfront (lần 2)

# Kiểm tra security headers
curl -I https://CLOUDFRONT_DOMAIN | grep -E "strict-transport|x-frame|x-content"
```

---

## Lưu ý quan trọng

- `frontend/.env.production` đã có trong `.gitignore` — KHÔNG commit file này
- `AWS_SESSION_TOKEN` chỉ cần nếu dùng IAM role tạm thời (STS), IAM user thường thì không cần
- CloudFront propagation mất 5-10 phút sau invalidation — bình thường
- Lần đầu tạo stack mất ~20 phút do CloudFront distribution
