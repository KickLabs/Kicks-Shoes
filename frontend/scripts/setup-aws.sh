#!/bin/bash

# Script tự động setup AWS infrastructure
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  AWS Infrastructure Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI not found. Please install it first.${NC}"
    echo "Visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}AWS credentials not configured.${NC}"
    echo "Run: aws configure"
    exit 1
fi

# Get parameters
read -p "Enter project name [kicks-shoes]: " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-kicks-shoes}

read -p "Enter AWS region [ap-southeast-1]: " AWS_REGION
AWS_REGION=${AWS_REGION:-ap-southeast-1}

read -p "Do you have a custom domain? (y/n) [n]: " HAS_DOMAIN
HAS_DOMAIN=${HAS_DOMAIN:-n}

PARAMS="ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME"

if [ "$HAS_DOMAIN" = "y" ]; then
    read -p "Enter domain name (e.g., www.example.com): " DOMAIN_NAME
    read -p "Enter ACM Certificate ARN (must be in us-east-1): " CERT_ARN
    
    PARAMS="$PARAMS ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME ParameterKey=CertificateArn,ParameterValue=$CERT_ARN"
fi

echo -e "${YELLOW}Creating CloudFormation stack...${NC}"
echo "Stack name: ${PROJECT_NAME}-frontend"
echo "Region: $AWS_REGION"

aws cloudformation create-stack \
    --stack-name ${PROJECT_NAME}-frontend \
    --template-body file://cloudformation-template.yaml \
    --parameters $PARAMS \
    --region $AWS_REGION \
    --capabilities CAPABILITY_IAM

echo -e "${YELLOW}Waiting for stack creation (this may take 10-15 minutes)...${NC}"

aws cloudformation wait stack-create-complete \
    --stack-name ${PROJECT_NAME}-frontend \
    --region $AWS_REGION

echo -e "${GREEN}Stack created successfully!${NC}"

# Get outputs
echo -e "${YELLOW}Retrieving stack outputs...${NC}"

OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name ${PROJECT_NAME}-frontend \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs' \
    --output json)

S3_BUCKET=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="S3BucketName") | .OutputValue')
CF_DIST_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="CloudFrontDistributionId") | .OutputValue')
CF_DOMAIN=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="CloudFrontDomainName") | .OutputValue')

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "S3 Bucket: $S3_BUCKET"
echo "CloudFront Distribution ID: $CF_DIST_ID"
echo "CloudFront Domain: $CF_DOMAIN"
echo "URL: https://$CF_DOMAIN"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update .env.aws with the values above"
echo "2. Run: ./deploy-aws.sh aws"
echo ""

# Update .env.aws
if [ -f ".env.aws" ]; then
    echo -e "${YELLOW}Updating .env.aws...${NC}"
    sed -i "s/AWS_S3_BUCKET=.*/AWS_S3_BUCKET=$S3_BUCKET/" .env.aws
    sed -i "s/AWS_CLOUDFRONT_DISTRIBUTION_ID=.*/AWS_CLOUDFRONT_DISTRIBUTION_ID=$CF_DIST_ID/" .env.aws
    sed -i "s/AWS_CLOUDFRONT_DOMAIN=.*/AWS_CLOUDFRONT_DOMAIN=$CF_DOMAIN/" .env.aws
    sed -i "s/AWS_REGION=.*/AWS_REGION=$AWS_REGION/" .env.aws
    echo -e "${GREEN}.env.aws updated!${NC}"
fi
