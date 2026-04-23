# Frontend Developer Guide - AWS Infrastructure

## 📋 Table of Contents
1. [Overview](#overview)
2. [What You Need from DevOps](#what-you-need-from-devops)
3. [Deployment Workflow](#deployment-workflow)
4. [IAM Permissions Required](#iam-permissions-required)
5. [Environment Variables](#environment-variables)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**Architecture**: User → Route53 (DNS) → CloudFront (CDN) → S3 Bucket (Private)

**Your Role**: Build frontend → Upload to S3 → Invalidate CloudFront cache

**DevOps Role**: Manage infrastructure (S3, CloudFront, WAF, IAM)

---

## 📦 What You Need from DevOps

### 1. **S3 Bucket Information**
After DevOps deploys `cloudformation-main.yaml`, you need:

```bash
# S3 Bucket Name
S3_BUCKET_NAME="kicks-shoes-frontend"

# AWS Region
AWS_REGION="ap-southeast-1"  # or your region
```

**How to get it:**
```bash
# From CloudFormation Outputs
aws cloudformation describe-stacks \
  --stack-name kicks-shoes-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
  --output text
```

---

### 2. **CloudFront Distribution Information**

```bash
# CloudFront Distribution ID (for cache invalidation)
CLOUDFRONT_DISTRIBUTION_ID="E1234567890ABC"

# CloudFront Domain Name (for testing)
CLOUDFRONT_DOMAIN="d111111abcdef8.cloudfront.net"

# CloudFront URL (HTTPS)
CLOUDFRONT_URL="https://d111111abcdef8.cloudfront.net"

# Custom Domain (if configured)
CUSTOM_DOMAIN="www.kicks-shoes.com"
```

**How to get it:**
```bash
# CloudFront Distribution ID
aws cloudformation describe-stacks \
  --stack-name kicks-shoes-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text

# CloudFront Domain Name
aws cloudformation describe-stacks \
  --stack-name kicks-shoes-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
  --output text
```

---

### 3. **IAM User/Role for Deployment**

DevOps should create an IAM user `fe_developer` with these permissions:

#### **Required Permissions:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3UploadAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
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
      "Resource": "arn:aws:cloudfront::*:distribution/*"
    }
  ]
}
```

**What you need from DevOps:**
```bash
# AWS Access Key ID
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"

# AWS Secret Access Key
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
```

⚠️ **Security**: Store these in CI/CD secrets, NOT in code!

---

### 4. **WAF Configuration (Optional)**

If DevOps enabled WAF, you should know:

```bash
# Rate Limit
RATE_LIMIT="2000 requests per 5 minutes per IP"
# = ~7 requests per second per user

# Allowed Countries (Geo-blocking)
ALLOWED_COUNTRIES="VN, US, SG, JP, KR, AU"

# Blocked Countries
BLOCKED_COUNTRIES="All others"
```

**Impact on Development:**
- If you're testing from a blocked country, ask DevOps to add your country
- If rate limit is too strict, ask DevOps to increase it

---

## 🚀 Deployment Workflow

### **Step 1: Build Frontend**

```bash
# Example: React/Vue/Angular build
npm run build
# Output: dist/ or build/ folder
```

---

### **Step 2: Upload to S3**

#### **Option A: AWS CLI (Recommended)**

```bash
# Sync build folder to S3
aws s3 sync ./dist s3://kicks-shoes-frontend \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "*.map"

# Upload index.html separately (no cache)
aws s3 cp ./dist/index.html s3://kicks-shoes-frontend/index.html \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"
```

**Explanation:**
- `--delete`: Remove old files from S3
- `--cache-control`: Set cache headers
  - Static assets (JS/CSS): Cache for 1 year
  - index.html: No cache (always fetch latest)
- `--exclude "*.map"`: Don't upload source maps (security)

---

#### **Option B: Using npm package (s3-deploy)**

```bash
# Install
npm install --save-dev s3-deploy

# package.json
{
  "scripts": {
    "deploy": "s3-deploy './dist/**' --cwd './dist/' --region ap-southeast-1 --bucket kicks-shoes-frontend --deleteRemoved"
  }
}

# Deploy
npm run deploy
```

---

### **Step 3: Invalidate CloudFront Cache**

After uploading to S3, you MUST invalidate CloudFront cache:

```bash
# Invalidate all files
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"

# Invalidate specific files
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/index.html" "/static/js/*"
```

**Why?**
- CloudFront caches files at edge locations
- Without invalidation, users see old version for 24 hours
- Invalidation forces CloudFront to fetch new files from S3

**Cost:**
- First 1,000 invalidations/month: FREE
- After that: $0.005 per path

---

### **Step 4: Verify Deployment**

```bash
# Test CloudFront URL
curl -I https://d111111abcdef8.cloudfront.net

# Expected response:
# HTTP/2 200
# x-cache: Miss from cloudfront (first request after invalidation)
# x-cache: Hit from cloudfront (subsequent requests)
```

---

## 🔐 IAM Permissions Required

### **Minimum Permissions for FE Developer**

Create IAM user `fe_developer` with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3BucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::kicks-shoes-frontend"
    },
    {
      "Sid": "S3ObjectAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::kicks-shoes-frontend/*"
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 🔧 Environment Variables

### **For Local Development**

Create `.env.local`:

```bash
# AWS Credentials (from DevOps)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-southeast-1

# S3 Bucket
S3_BUCKET_NAME=kicks-shoes-frontend

# CloudFront
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
CLOUDFRONT_DOMAIN=d111111abcdef8.cloudfront.net

# Custom Domain (if configured)
VITE_APP_DOMAIN=https://www.kicks-shoes.com
# or for React: REACT_APP_DOMAIN=https://www.kicks-shoes.com
```

⚠️ **Add to `.gitignore`:**
```
.env.local
.env.*.local
```

---

### **For CI/CD (GitHub Actions / GitLab CI)**

Store as **secrets** in your CI/CD platform:

**GitHub Actions:**
- Settings → Secrets and variables → Actions → New repository secret

**GitLab CI:**
- Settings → CI/CD → Variables → Add variable

**Required Secrets:**
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
S3_BUCKET_NAME
CLOUDFRONT_DISTRIBUTION_ID
```

---

## 🤖 CI/CD Integration

### **GitHub Actions Example**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Frontend to AWS

on:
  push:
    branches:
      - main
      - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build frontend
        run: npm run build
        env:
          VITE_APP_API_URL: ${{ secrets.API_URL }}
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}
      
      - name: Upload to S3
        run: |
          # Upload static assets with long cache
          aws s3 sync ./dist s3://${{ secrets.S3_BUCKET_NAME }} \
            --delete \
            --cache-control "public, max-age=31536000, immutable" \
            --exclude "index.html" \
            --exclude "*.map"
          
          # Upload index.html with no cache
          aws s3 cp ./dist/index.html s3://${{ secrets.S3_BUCKET_NAME }}/index.html \
            --cache-control "no-cache, no-store, must-revalidate" \
            --content-type "text/html"
      
      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
      
      - name: Deployment complete
        run: |
          echo "✅ Deployment successful!"
          echo "🌐 URL: https://${{ secrets.CLOUDFRONT_DOMAIN }}"
```

---

### **GitLab CI Example**

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - deploy

variables:
  NODE_VERSION: "18"

build:
  stage: build
  image: node:${NODE_VERSION}
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

deploy:
  stage: deploy
  image: amazon/aws-cli:latest
  dependencies:
    - build
  script:
    # Upload static assets
    - aws s3 sync ./dist s3://${S3_BUCKET_NAME} 
        --delete 
        --cache-control "public, max-age=31536000, immutable" 
        --exclude "index.html" 
        --exclude "*.map"
    
    # Upload index.html
    - aws s3 cp ./dist/index.html s3://${S3_BUCKET_NAME}/index.html 
        --cache-control "no-cache, no-store, must-revalidate" 
        --content-type "text/html"
    
    # Invalidate CloudFront
    - aws cloudfront create-invalidation 
        --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} 
        --paths "/*"
  only:
    - main
    - production
```

---

## 🐛 Troubleshooting

### **Problem 1: "Access Denied" when uploading to S3**

**Cause:** IAM user doesn't have `s3:PutObject` permission

**Solution:**
```bash
# Ask DevOps to add this policy to your IAM user
{
  "Effect": "Allow",
  "Action": ["s3:PutObject", "s3:PutObjectAcl"],
  "Resource": "arn:aws:s3:::kicks-shoes-frontend/*"
}
```

---

### **Problem 2: "InvalidAccessKeyId" error**

**Cause:** Wrong AWS credentials

**Solution:**
```bash
# Verify credentials
aws sts get-caller-identity

# Expected output:
{
  "UserId": "AIDAI...",
  "Account": "123456789012",
  "Arn": "arn:aws:iam::123456789012:user/fe_developer"
}
```

---

### **Problem 3: Changes not visible after deployment**

**Cause:** CloudFront cache not invalidated

**Solution:**
```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"

# Check invalidation status
aws cloudfront get-invalidation \
  --distribution-id E1234567890ABC \
  --id I1234567890ABC
```

---

### **Problem 4: "Rate limit exceeded" (429 error)**

**Cause:** WAF rate limiting (2000 req/5min per IP)

**Solution:**
- Normal users won't hit this limit
- If testing/development triggers it, ask DevOps to:
  - Increase rate limit
  - Whitelist your IP address
  - Temporarily disable rate limiting

---

### **Problem 5: "Forbidden" from certain countries**

**Cause:** WAF geo-blocking

**Solution:**
```bash
# Ask DevOps to add your country to whitelist
# Current whitelist: VN, US, SG, JP, KR, AU

# DevOps needs to update cloudformation-waf.yaml:
CountryCodes:
  - VN
  - US
  - SG
  - JP
  - KR
  - AU
  - GB  # Add your country code
```

---

### **Problem 6: SPA routing not working (404 on refresh)**

**Cause:** CloudFront not configured for SPA

**Solution:**
✅ Already configured in `cloudformation-main.yaml`:
```yaml
CustomErrorResponses:
  - ErrorCode: 403
    ResponseCode: 200
    ResponsePagePath: /index.html
  - ErrorCode: 404
    ResponseCode: 200
    ResponsePagePath: /index.html
```

If still not working, ask DevOps to verify CloudFront configuration.

---

## 📊 Monitoring & Logs

### **CloudFront Access Logs**

Logs are stored in: `s3://kicks-shoes-logs/cloudfront/`

**View logs:**
```bash
# List log files
aws s3 ls s3://kicks-shoes-logs/cloudfront/

# Download recent logs
aws s3 cp s3://kicks-shoes-logs/cloudfront/E1234567890ABC.2024-04-23-12.abc123.gz ./

# Extract and view
gunzip E1234567890ABC.2024-04-23-12.abc123.gz
cat E1234567890ABC.2024-04-23-12.abc123
```

---

### **WAF Logs (if enabled)**

**View blocked requests:**
```bash
# CloudWatch Logs Insights query
aws logs start-query \
  --log-group-name aws-waf-logs-kicks-shoes \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s) \
  --query-string 'fields @timestamp, httpRequest.clientIp, action | filter action = "BLOCK"'
```

---

## 🎓 Best Practices

### **1. Cache Strategy**

```bash
# Static assets (JS, CSS, images): Long cache
Cache-Control: public, max-age=31536000, immutable

# HTML files: No cache
Cache-Control: no-cache, no-store, must-revalidate

# API responses: Short cache
Cache-Control: public, max-age=300
```

---

### **2. File Naming for Cache Busting**

Use content hash in filenames:

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
}
```

Result: `app.abc123.js` → Change code → `app.def456.js` (new file)

---

### **3. Security Headers**

Already configured in CloudFront:
- ✅ Strict-Transport-Security (HSTS)
- ✅ X-Content-Type-Options
- ✅ X-Frame-Options (prevent clickjacking)
- ✅ X-XSS-Protection
- ✅ Referrer-Policy
- ✅ Permissions-Policy

---

### **4. Environment-Specific Builds**

```bash
# Development
npm run build:dev

# Staging
npm run build:staging

# Production
npm run build:prod
```

Use different API URLs per environment:
```javascript
// .env.development
VITE_APP_API_URL=http://localhost:3000

// .env.staging
VITE_APP_API_URL=https://api-staging.kicks-shoes.com

// .env.production
VITE_APP_API_URL=https://api.kicks-shoes.com
```

---

## 📞 Contact DevOps

If you need:
- ✅ AWS credentials (Access Key ID, Secret Access Key)
- ✅ S3 bucket name
- ✅ CloudFront distribution ID
- ✅ Increase WAF rate limit
- ✅ Add country to geo-blocking whitelist
- ✅ Custom domain configuration
- ✅ SSL certificate setup

**Contact:** DevOps team or Infrastructure team

---

## 🔗 Useful Links

- [AWS CLI Installation](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [CloudFront Invalidation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html)
- [S3 Sync Command](https://docs.aws.amazon.com/cli/latest/reference/s3/sync.html)
- [Cache-Control Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)

---

**Last Updated:** 2024-04-23
**Version:** 1.0.0
