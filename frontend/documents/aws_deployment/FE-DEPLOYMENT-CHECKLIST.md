# Frontend Deployment Checklist

## 📋 Quick Reference for FE Developers

### ✅ Before First Deployment

#### 1. Get from DevOps Team
- [ ] AWS Access Key ID
- [ ] AWS Secret Access Key
- [ ] S3 Bucket Name (e.g., `kicks-shoes-frontend`)
- [ ] CloudFront Distribution ID (e.g., `E1234567890ABC`)
- [ ] CloudFront Domain (e.g., `d111111abcdef8.cloudfront.net`)
- [ ] AWS Region (e.g., `ap-southeast-1`)
- [ ] Custom Domain (if configured, e.g., `www.kicks-shoes.com`)

#### 2. Setup Local Environment
```bash
# Install AWS CLI
# macOS
brew install awscli

# Windows
choco install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

#### 3. Configure AWS Credentials
```bash
# Option A: AWS CLI configure
aws configure
# Enter: Access Key ID, Secret Access Key, Region, Output format (json)

# Option B: Environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="ap-southeast-1"
```

#### 4. Create `.env.local` File
```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-southeast-1

# S3 & CloudFront
S3_BUCKET_NAME=kicks-shoes-frontend
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC

# App Environment Variables
VITE_APP_API_URL=https://api.kicks-shoes.com
```

#### 5. Add to `.gitignore`
```
.env.local
.env.*.local
.aws-credentials
```

---

## 🚀 Deployment Steps

### Step 1: Build Frontend
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Verify build output
ls -la dist/
```

### Step 2: Upload to S3
```bash
# Upload all files except index.html (with long cache)
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

### Step 3: Invalidate CloudFront Cache
```bash
# Invalidate all files
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

### Step 4: Verify Deployment
```bash
# Test CloudFront URL
curl -I https://d111111abcdef8.cloudfront.net

# Or open in browser
open https://d111111abcdef8.cloudfront.net
```

---

## 🤖 Automated Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash

# Configuration
S3_BUCKET="kicks-shoes-frontend"
CLOUDFRONT_DIST_ID="E1234567890ABC"
BUILD_DIR="./dist"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Starting deployment..."

# Step 1: Build
echo "📦 Building frontend..."
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"

# Step 2: Upload to S3
echo "☁️  Uploading to S3..."
aws s3 sync $BUILD_DIR s3://$S3_BUCKET \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "*.map"

aws s3 cp $BUILD_DIR/index.html s3://$S3_BUCKET/index.html \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ S3 upload failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ S3 upload successful${NC}"

# Step 3: Invalidate CloudFront
echo "🔄 Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DIST_ID \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ CloudFront invalidation failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ CloudFront invalidation created: $INVALIDATION_ID${NC}"

# Step 4: Get CloudFront URL
CLOUDFRONT_URL=$(aws cloudfront get-distribution \
  --id $CLOUDFRONT_DIST_ID \
  --query 'Distribution.DomainName' \
  --output text)

echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo "🌐 URL: https://$CLOUDFRONT_URL"
echo ""
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🔧 package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "build": "vite build",
    "deploy": "npm run build && ./deploy.sh",
    "deploy:staging": "npm run build:staging && ./deploy-staging.sh",
    "deploy:prod": "npm run build:prod && ./deploy-prod.sh"
  }
}
```

Usage:
```bash
npm run deploy
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Access Denied" when uploading to S3
**Solution:** Ask DevOps to grant `s3:PutObject` permission

### Issue 2: Changes not visible after deployment
**Solution:** Invalidate CloudFront cache
```bash
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"
```

### Issue 3: "InvalidAccessKeyId" error
**Solution:** Verify AWS credentials
```bash
aws sts get-caller-identity
```

### Issue 4: 404 on page refresh (SPA routing)
**Solution:** Already configured in CloudFront (403/404 → index.html)

### Issue 5: Rate limit exceeded (429 error)
**Solution:** Ask DevOps to increase WAF rate limit or whitelist your IP

### Issue 6: Blocked by geo-restriction
**Solution:** Ask DevOps to add your country to whitelist

---

## 📊 Monitoring

### Check CloudFront Cache Status
```bash
# First request after invalidation
curl -I https://d111111abcdef8.cloudfront.net
# x-cache: Miss from cloudfront

# Subsequent requests
curl -I https://d111111abcdef8.cloudfront.net
# x-cache: Hit from cloudfront
```

### View CloudFront Logs
```bash
# List logs
aws s3 ls s3://kicks-shoes-logs/cloudfront/

# Download recent log
aws s3 cp s3://kicks-shoes-logs/cloudfront/E1234567890ABC.2024-04-23-12.abc123.gz ./
gunzip E1234567890ABC.2024-04-23-12.abc123.gz
cat E1234567890ABC.2024-04-23-12.abc123
```

### Check Invalidation Status
```bash
# List invalidations
aws cloudfront list-invalidations --distribution-id E1234567890ABC

# Get specific invalidation
aws cloudfront get-invalidation \
  --distribution-id E1234567890ABC \
  --id I1234567890ABC
```

---

## 🎯 Best Practices

### ✅ DO
- ✅ Always invalidate CloudFront after deployment
- ✅ Use content hash in filenames (e.g., `app.abc123.js`)
- ✅ Set long cache for static assets (JS, CSS, images)
- ✅ Set no cache for `index.html`
- ✅ Exclude source maps from production (`*.map`)
- ✅ Test deployment on staging first
- ✅ Store AWS credentials in CI/CD secrets

### ❌ DON'T
- ❌ Don't commit AWS credentials to Git
- ❌ Don't upload source maps to production
- ❌ Don't skip CloudFront invalidation
- ❌ Don't cache `index.html` (breaks deployments)
- ❌ Don't use `aws s3 cp` for entire folder (use `sync` instead)

---

## 📞 Need Help?

### Contact DevOps for:
- AWS credentials
- S3 bucket name
- CloudFront distribution ID
- Increase WAF rate limit
- Add country to geo-blocking whitelist
- Custom domain setup
- SSL certificate configuration

### Useful Commands
```bash
# Verify AWS credentials
aws sts get-caller-identity

# List S3 buckets
aws s3 ls

# List CloudFront distributions
aws cloudfront list-distributions

# Get CloudFront distribution details
aws cloudfront get-distribution --id E1234567890ABC

# Check S3 bucket contents
aws s3 ls s3://kicks-shoes-frontend --recursive

# Download file from S3
aws s3 cp s3://kicks-shoes-frontend/index.html ./
```

---

## 🔗 Resources

- [Full Developer Guide](./FE-DEVELOPER-GUIDE.md)
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [CloudFront Invalidation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html)
- [S3 Sync Command](https://docs.aws.amazon.com/cli/latest/reference/s3/sync.html)

---

**Quick Deploy:**
```bash
npm run build && \
aws s3 sync ./dist s3://kicks-shoes-frontend --delete --exclude "index.html" && \
aws s3 cp ./dist/index.html s3://kicks-shoes-frontend/index.html --cache-control "no-cache" && \
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"
```
