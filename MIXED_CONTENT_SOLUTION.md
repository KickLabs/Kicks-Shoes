# Mixed Content Issue - HTTPS Frontend → HTTP Backend

## 🔴 Vấn đề

Frontend đang chạy trên **HTTPS** (CloudFront) nhưng backend chỉ có **HTTP** (ALB), dẫn đến browser block requests vì Mixed Content Policy.

```
❌ https://d3k5cm2ny387y1.cloudfront.net → http://kicks-shoes-dev-alb-...amazonaws.com
   (HTTPS)                                    (HTTP)
   Browser blocks this!
```

## ✅ Giải pháp

### Option 1: Dùng HTTP CloudFront (Tạm thời - Để test)

**Ưu điểm:**
- Nhanh, không cần certificate
- Phù hợp cho development/testing

**Nhược điểm:**
- Không secure
- Không nên dùng cho production

**Cách làm:**

1. Truy cập HTTP CloudFront URL trực tiếp:
```
http://d3k5cm2ny387y1.cloudfront.net
```

2. Hoặc update CloudFront để allow HTTP:
```bash
# Update CloudFormation template
# Thay đổi ViewerProtocolPolicy từ "redirect-to-https" sang "allow-all"
```

### Option 2: Enable HTTPS cho Backend (Khuyến nghị)

**Ưu điểm:**
- Secure
- Production-ready
- Best practice

**Nhược điểm:**
- Cần custom domain hoặc dùng ALB default certificate
- Mất thời gian setup

#### Bước 1: Request ACM Certificate

**Nếu có custom domain:**
```bash
# Request certificate
aws acm request-certificate \
  --domain-name api.kicks-shoes.com \
  --validation-method DNS \
  --region ap-southeast-1

# Validate qua DNS
# Add CNAME records vào DNS provider
```

**Nếu không có custom domain:**
Dùng self-signed certificate hoặc ALB default certificate (không khuyến nghị cho production)

#### Bước 2: Update Backend CloudFormation

Thêm HTTPS listener vào ALB:

```yaml
# backend/cloudformation/02-app.yaml

ALBListenerHTTPS:
  Type: AWS::ElasticLoadBalancingV2::Listener
  Properties:
    LoadBalancerArn: !Ref ApplicationLoadBalancer
    Port: 443
    Protocol: HTTPS
    Certificates:
      - CertificateArn: !Ref CertificateArn  # ACM Certificate ARN
    DefaultActions:
      - Type: forward
        TargetGroupArn: !Ref ALBTargetGroup
```

Update Security Group để allow port 443:

```yaml
ALBSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0
        Description: Allow HTTPS from anywhere
```

#### Bước 3: Deploy Backend Update

```bash
cd backend/cloudformation

aws cloudformation deploy \
  --template-file 02-app.yaml \
  --stack-name dev-app-stack \
  --parameter-overrides \
    CertificateArn=arn:aws:acm:... \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-1
```

#### Bước 4: Update Frontend .env

```bash
# frontend/.env
VITE_API_URL=https://kicks-shoes-dev-alb-1014392323.ap-southeast-1.elb.amazonaws.com
VITE_API_BASE_URL=https://kicks-shoes-dev-alb-1014392323.ap-southeast-1.elb.amazonaws.com/api
VITE_SOCKET_URL=https://kicks-shoes-dev-alb-1014392323.ap-southeast-1.elb.amazonaws.com
```

#### Bước 5: Rebuild & Redeploy Frontend

```bash
cd frontend
npm run build
aws s3 sync dist/ s3://kicks-shoes-frontend/ --delete
aws cloudfront create-invalidation --distribution-id E162EDNQ72TJYT --paths "/*"
```

### Option 3: Dùng CloudFront như Proxy (Advanced)

Setup CloudFront để proxy requests tới backend:

```yaml
# CloudFront Origin
Origins:
  - Id: BackendOrigin
    DomainName: kicks-shoes-dev-alb-1014392323.ap-southeast-1.elb.amazonaws.com
    CustomOriginConfig:
      HTTPPort: 80
      OriginProtocolPolicy: http-only

# Cache Behavior cho /api/*
CacheBehaviors:
  - PathPattern: /api/*
    TargetOriginId: BackendOrigin
    ViewerProtocolPolicy: https-only
```

Frontend gọi API qua CloudFront:
```javascript
// Thay vì:
VITE_API_BASE_URL=http://alb-url.amazonaws.com/api

// Dùng:
VITE_API_BASE_URL=https://d3k5cm2ny387y1.cloudfront.net/api
```

## 🚀 Quick Fix (Để test ngay)

### Cách 1: Test với HTTP CloudFront

Mở browser và truy cập:
```
http://d3k5cm2ny387y1.cloudfront.net
```

**Lưu ý:** CloudFront sẽ redirect sang HTTPS, cần update CloudFormation để disable redirect.

### Cách 2: Disable Mixed Content Check (Chrome)

**Chỉ dùng để test local:**

1. Mở Chrome với flag:
```bash
chrome.exe --disable-web-security --user-data-dir="C:/temp/chrome-dev"
```

2. Hoặc install extension: "Allow CORS"

### Cách 3: Dùng ngrok cho Backend (Temporary)

```bash
# Install ngrok
# https://ngrok.com/download

# Expose backend ALB
ngrok http kicks-shoes-dev-alb-1014392323.ap-southeast-1.elb.amazonaws.com:80

# Update frontend .env với ngrok HTTPS URL
VITE_API_BASE_URL=https://abc123.ngrok.io/api
```

## 📋 Recommended Approach

### Cho Development:
1. ✅ Dùng HTTP CloudFront (update CloudFormation)
2. ✅ Hoặc dùng ngrok cho backend

### Cho Production:
1. ✅ Request ACM certificate cho custom domain
2. ✅ Enable HTTPS listener trên ALB
3. ✅ Update frontend với HTTPS backend URL
4. ✅ Setup Route53 cho custom domain

## 🔧 Implementation Plan

### Phase 1: Quick Fix (Ngay)
```bash
# Option A: Update CloudFront để allow HTTP
# Edit frontend/cloudformation-main.yaml
ViewerProtocolPolicy: allow-all  # Thay vì redirect-to-https

# Deploy
aws cloudformation deploy \
  --template-file frontend/cloudformation-main.yaml \
  --stack-name kicks-shoes-frontend \
  --region ap-southeast-1

# Test với HTTP
http://d3k5cm2ny387y1.cloudfront.net
```

### Phase 2: Proper Solution (1-2 ngày)
```bash
# 1. Request ACM certificate
# 2. Update backend CloudFormation với HTTPS listener
# 3. Deploy backend update
# 4. Update frontend .env với HTTPS URL
# 5. Rebuild và deploy frontend
```

## 🆘 Current Status

- ✅ Frontend deployed: https://d3k5cm2ny387y1.cloudfront.net
- ✅ Backend deployed: http://kicks-shoes-dev-alb-1014392323.ap-southeast-1.elb.amazonaws.com
- ❌ Mixed Content: HTTPS → HTTP blocked
- ⏳ Need: Enable HTTPS on backend OR allow HTTP on frontend

## Next Steps

**Immediate (để test ngay):**
1. Update CloudFront ViewerProtocolPolicy to "allow-all"
2. Deploy CloudFormation update
3. Test với http://d3k5cm2ny387y1.cloudfront.net

**Long-term (production-ready):**
1. Get custom domain (api.kicks-shoes.com)
2. Request ACM certificate
3. Update backend với HTTPS listener
4. Update frontend với HTTPS backend URL
5. Setup Route53 DNS

Bạn muốn làm cách nào?
