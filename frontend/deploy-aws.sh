#!/bin/bash

# AWS S3 + CloudFront Deployment Script
# Sử dụng: ./deploy-aws.sh [environment]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  AWS S3 + CloudFront Deployment${NC}"
echo -e "${GREEN}  Environment: $ENVIRONMENT${NC}"
echo -e "${GREEN}========================================${NC}"

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    echo -e "${YELLOW}Loading .env.$ENVIRONMENT${NC}"
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env.$ENVIRONMENT not found${NC}"
    exit 1
fi

# Check required environment variables
if [ -z "$AWS_S3_BUCKET" ]; then
    echo -e "${RED}Error: AWS_S3_BUCKET not set${NC}"
    exit 1
fi

if [ -z "$AWS_CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Warning: AWS_CLOUDFRONT_DISTRIBUTION_ID not set. CloudFront invalidation will be skipped.${NC}"
fi

# Build the application
echo -e "${YELLOW}Building application...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: dist directory not found${NC}"
    exit 1
fi

# Backup current deployment (optional)
if [ "$AWS_ENABLE_BACKUP" = "true" ]; then
    echo -e "${YELLOW}Creating backup...${NC}"
    aws s3 sync s3://$AWS_S3_BUCKET s3://$AWS_S3_BUCKET-backup-$TIMESTAMP --delete
fi

# Upload to S3
echo -e "${YELLOW}Uploading to S3: $AWS_S3_BUCKET${NC}"

# Upload HTML files with no-cache
aws s3 sync dist/ s3://$AWS_S3_BUCKET \
    --exclude "*" \
    --include "*.html" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --metadata-directive REPLACE \
    --delete

# Upload CSS and JS with cache
aws s3 sync dist/ s3://$AWS_S3_BUCKET \
    --exclude "*.html" \
    --cache-control "public, max-age=31536000, immutable" \
    --metadata-directive REPLACE \
    --delete

echo -e "${GREEN}Upload completed!${NC}"

# Invalidate CloudFront cache
if [ -n "$AWS_CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation \
        --distribution-id $AWS_CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/*"
    echo -e "${GREEN}CloudFront invalidation created!${NC}"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"

if [ -n "$AWS_CLOUDFRONT_DOMAIN" ]; then
    echo -e "${GREEN}Your app is available at: https://$AWS_CLOUDFRONT_DOMAIN${NC}"
fi
