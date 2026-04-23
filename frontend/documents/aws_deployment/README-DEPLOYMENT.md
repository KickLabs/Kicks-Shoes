# Frontend Deployment Documentation

## 📚 Documentation Overview

This folder contains all documentation needed for frontend deployment to AWS infrastructure.

---

## 📁 Files in This Folder

### 1. **CloudFormation Templates** (for DevOps)

#### `cloudformation-main.yaml`
- **Purpose**: Main infrastructure stack (S3 + CloudFront + Logging)
- **Resources Created**:
  - S3 Bucket (private, versioned, encrypted)
  - CloudFront Distribution (CDN with OAC)
  - CloudFront Origin Access Control (OAC)
  - Security Headers Policy
  - S3 Logging Bucket (with tiered storage)
  - SNS Topic for S3 events
  - CloudWatch Log Group
- **Deploy Command**:
  ```bash
  aws cloudformation deploy \
    --template-file cloudformation-main.yaml \
    --stack-name kicks-shoes-frontend \
    --region ap-southeast-1 \
    --capabilities CAPABILITY_NAMED_IAM
  ```

#### `cloudformation-waf.yaml`
- **Purpose**: Web Application Firewall for CloudFront
- **Resources Created**:
  - WAF Web ACL with 4 rules:
    1. Rate limiting (2000 req/5min per IP)
    2. AWS Managed Rules - Core Rule Set (OWASP Top 10)
    3. AWS Managed Rules - Known Bad Inputs
    4. Geo-blocking (whitelist: VN, US, SG, JP, KR, AU)
- **Deploy Command**:
  ```bash
  aws cloudformation deploy \
    --template-file cloudformation-waf.yaml \
    --stack-name kicks-shoes-waf \
    --region us-east-1
  ```
  ⚠️ **MUST be deployed in us-east-1** (CloudFront requirement)

---

### 2. **Developer Documentation**

#### `FE-DEVELOPER-GUIDE.md` (Comprehensive Guide)
- **Target Audience**: Frontend Developers
- **Contents**:
  - Architecture overview
  - What to get from DevOps
  - Deployment workflow (step-by-step)
  - IAM permissions required
  - Environment variables setup
  - CI/CD integration (GitHub Actions, GitLab CI)
  - Troubleshooting guide
  - Monitoring & logs
  - Best practices
- **When to Use**: First-time setup, reference guide

#### `FE-DEPLOYMENT-CHECKLIST.md` (Quick Reference)
- **Target Audience**: Frontend Developers
- **Contents**:
  - Pre-deployment checklist
  - Quick deployment steps
  - Automated deployment script
  - Common issues & solutions
  - Useful commands
- **When to Use**: Daily deployments, quick reference

---

### 3. **IAM Configuration** (for DevOps)

#### `IAM-POLICY-FOR-FE-DEVELOPER.json`
- **Purpose**: IAM policy for frontend developers
- **Permissions Included**:
  - S3: List bucket, upload/download/delete objects
  - CloudFront: Create invalidations, read distribution info
  - CloudWatch Logs: Read logs (debugging)
  - STS: Get caller identity (verify credentials)
- **How to Use**:
  ```bash
  # Create IAM user
  aws iam create-user --user-name fe_developer
  
  # Attach policy
  aws iam put-user-policy \
    --user-name fe_developer \
    --policy-name FEDeveloperPolicy \
    --policy-document file://IAM-POLICY-FOR-FE-DEVELOPER.json
  
  # Create access key
  aws iam create-access-key --user-name fe_developer
  ```

---

## 🚀 Quick Start Guide

### For DevOps Team

#### Step 1: Deploy Infrastructure
```bash
# 1. Deploy WAF (us-east-1)
aws cloudformation deploy \
  --template-file cloudformation-waf.yaml \
  --stack-name kicks-shoes-waf \
  --region us-east-1

# Get WAF ARN
WAF_ARN=$(aws cloudformation describe-stacks \
  --stack-name kicks-shoes-waf \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`WAFWebACLArn`].OutputValue' \
  --output text)

# 2. Deploy main stack (your region)
aws cloudformation deploy \
  --template-file cloudformation-main.yaml \
  --stack-name kicks-shoes-frontend \
  --region ap-southeast-1 \
  --parameter-overrides WAFWebACLArn=$WAF_ARN \
  --capabilities CAPABILITY_NAMED_IAM
```

#### Step 2: Create IAM User for FE Developer
```bash
# Create user
aws iam create-user --user-name fe_developer

# Attach policy
aws iam put-user-policy \
  --user-name fe_developer \
  --policy-name FEDeveloperPolicy \
  --policy-document file://IAM-POLICY-FOR-FE-DEVELOPER.json

# Create access key
aws iam create-access-key --user-name fe_developer > fe_developer_credentials.json

# IMPORTANT: Send credentials securely to FE developer
```

#### Step 3: Get Stack Outputs
```bash
# Get all outputs
aws cloudformation describe-stacks \
  --stack-name kicks-shoes-frontend \
  --query 'Stacks[0].Outputs' \
  --output table

# Get specific values
S3_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name kicks-shoes-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
  --output text)

CLOUDFRONT_ID=$(aws cloudformation describe-stacks \
  --stack-name kicks-shoes-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)

CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name kicks-shoes-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
  --output text)

echo "S3 Bucket: $S3_BUCKET"
echo "CloudFront ID: $CLOUDFRONT_ID"
echo "CloudFront Domain: $CLOUDFRONT_DOMAIN"
```

#### Step 4: Share with FE Developer
Send to FE developer:
- ✅ AWS Access Key ID (from step 2)
- ✅ AWS Secret Access Key (from step 2)
- ✅ S3 Bucket Name (from step 3)
- ✅ CloudFront Distribution ID (from step 3)
- ✅ CloudFront Domain (from step 3)
- ✅ AWS Region (e.g., ap-southeast-1)
- ✅ Link to `FE-DEVELOPER-GUIDE.md`

---

### For Frontend Developers

#### Step 1: Get Credentials from DevOps
Ask DevOps for:
- AWS Access Key ID
- AWS Secret Access Key
- S3 Bucket Name
- CloudFront Distribution ID
- CloudFront Domain
- AWS Region

#### Step 2: Setup Local Environment
```bash
# Install AWS CLI
brew install awscli  # macOS
# or
choco install awscli  # Windows

# Configure credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region, Output format (json)
```

#### Step 3: Deploy
```bash
# Build
npm run build

# Upload to S3
aws s3 sync ./dist s3://kicks-shoes-frontend \
  --delete \
  --exclude "index.html"

aws s3 cp ./dist/index.html s3://kicks-shoes-frontend/index.html \
  --cache-control "no-cache"

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

📖 **Full Guide**: See `FE-DEVELOPER-GUIDE.md` for detailed instructions

---

## 🏗️ Architecture Diagram

```
┌─────────────┐
│  End User   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────────────────────────────┐
│                    Route53 (DNS)                        │
│              www.kicks-shoes.com → CloudFront           │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  WAF (Web Application Firewall)         │
│  • Rate Limiting: 2000 req/5min per IP                 │
│  • OWASP Top 10 Protection                              │
│  • Known Bad Inputs Blocking                            │
│  • Geo-blocking: Allow VN, US, SG, JP, KR, AU          │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              CloudFront (Global CDN)                    │
│  • HTTP/2 and HTTP/3 support                            │
│  • IPv6 enabled                                         │
│  • HTTPS redirect (HTTP → HTTPS)                        │
│  • Security headers (HSTS, XSS, etc.)                   │
│  • Custom error pages (403/404 → index.html)            │
│  • Access logging to S3                                 │
└──────────────────────────┬──────────────────────────────┘
                           │ Origin Access Control (OAC)
                           │ SigV4 signing
                           ▼
┌─────────────────────────────────────────────────────────┐
│           S3 Bucket (kicks-shoes-frontend)              │
│  • Private (Block All Public Access)                    │
│  • Versioning: Enabled (rollback capability)            │
│  • Encryption: SSE-S3 (AES-256)                         │
│  • Lifecycle: Delete old versions after 30 days         │
│  • Event notifications to SNS                           │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                SNS Topic (S3 Events)                    │
│  • Captures: ObjectCreated, ObjectRemoved               │
│  • Destination: CloudWatch Logs                         │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              CloudWatch Logs (Audit Trail)              │
│  • S3 event logs (who deployed what and when)           │
│  • Retention: 90 days                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│           S3 Bucket (kicks-shoes-logs)                  │
│  • CloudFront access logs                               │
│  • Tiered storage:                                      │
│    - Days 0-30: STANDARD                                │
│    - Days 31-90: STANDARD_IA                            │
│    - Days 91-730: GLACIER_IR                            │
│    - After 2 years: DELETE                              │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Features

### ✅ Implemented Security Measures

1. **S3 Bucket Security**
   - ✅ Block All Public Access (enforced)
   - ✅ Encryption at rest (SSE-S3 AES-256)
   - ✅ Versioning enabled (rollback capability)
   - ✅ Bucket policy: ONLY CloudFront can access
   - ✅ Event notifications (audit trail)

2. **CloudFront Security**
   - ✅ Origin Access Control (OAC) with SigV4 signing
   - ✅ HTTPS redirect (HTTP → HTTPS)
   - ✅ TLS 1.2+ only (MinimumProtocolVersion)
   - ✅ Security headers:
     - HSTS (Strict-Transport-Security)
     - X-Content-Type-Options
     - X-Frame-Options (prevent clickjacking)
     - X-XSS-Protection
     - Referrer-Policy
     - Permissions-Policy

3. **WAF Protection**
   - ✅ Rate limiting (DDoS protection)
   - ✅ OWASP Top 10 protection (SQLi, XSS, etc.)
   - ✅ Known bad inputs blocking
   - ✅ Geo-blocking (country whitelist)

4. **Access Control**
   - ✅ IAM user with least privilege
   - ✅ No public S3 access
   - ✅ CloudFront OAC (not OAI)
   - ✅ Region-restricted S3 access

5. **Monitoring & Logging**
   - ✅ CloudFront access logs
   - ✅ S3 event notifications
   - ✅ CloudWatch metrics
   - ✅ WAF sampled requests

---

## 💰 Cost Estimation

### Monthly Costs (Approximate)

| Service | Usage | Cost |
|---------|-------|------|
| **S3 Storage** | 1 GB | $0.023 |
| **S3 Requests** | 10,000 PUT | $0.05 |
| **CloudFront** | 100 GB transfer | $8.50 |
| **CloudFront Requests** | 1M requests | $1.00 |
| **CloudFront Invalidations** | 1,000/month | FREE |
| **WAF** | Base + 1M requests | $6.00 |
| **S3 Logs** | 10 GB (tiered) | $0.10 |
| **CloudWatch Logs** | 5 GB | $2.50 |
| **SNS** | 1,000 notifications | $0.50 |
| **Total** | | **~$18.73/month** |

**Notes:**
- Costs vary by region and usage
- First 1,000 CloudFront invalidations/month are FREE
- S3 tiered storage reduces log costs by 83%
- WAF costs scale with traffic

---

## 📊 Performance Metrics

### Expected Performance

| Metric | Value |
|--------|-------|
| **Global Latency** | < 100ms (CloudFront edge locations) |
| **Cache Hit Ratio** | > 90% (after warm-up) |
| **Availability** | 99.99% (CloudFront SLA) |
| **SSL/TLS** | TLS 1.2+ (A+ rating) |
| **HTTP Version** | HTTP/2, HTTP/3 (QUIC) |
| **Compression** | gzip, brotli (automatic) |

---

## 🔄 Update & Maintenance

### Update CloudFormation Stack

```bash
# Update main stack
aws cloudformation deploy \
  --template-file cloudformation-main.yaml \
  --stack-name kicks-shoes-frontend \
  --region ap-southeast-1 \
  --capabilities CAPABILITY_NAMED_IAM

# Update WAF stack
aws cloudformation deploy \
  --template-file cloudformation-waf.yaml \
  --stack-name kicks-shoes-waf \
  --region us-east-1
```

### Delete Stack (Cleanup)

```bash
# Delete main stack
aws cloudformation delete-stack \
  --stack-name kicks-shoes-frontend \
  --region ap-southeast-1

# Delete WAF stack
aws cloudformation delete-stack \
  --stack-name kicks-shoes-waf \
  --region us-east-1

# Delete IAM user
aws iam delete-access-key --user-name fe_developer --access-key-id AKIAIOSFODNN7EXAMPLE
aws iam delete-user-policy --user-name fe_developer --policy-name FEDeveloperPolicy
aws iam delete-user --user-name fe_developer
```

---

## 📞 Support & Contact

### For DevOps Team
- Infrastructure issues
- CloudFormation stack updates
- IAM permission changes
- WAF rule adjustments
- Custom domain setup
- SSL certificate management

### For Frontend Developers
- Deployment issues
- AWS credentials
- S3 upload errors
- CloudFront invalidation
- Access denied errors

---

## 🔗 Additional Resources

- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [AWS WAF Documentation](https://docs.aws.amazon.com/waf/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)

---

## 📝 Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2024-04-23 | 1.0.0 | Initial documentation |

---

**Maintained by:** DevOps Team  
**Last Updated:** 2024-04-23
