#!/bin/bash

# Script to verify region configuration for us-east-1 migration
# Usage: ./scripts/verify-region-config.sh

set -e

echo "=========================================="
echo "Region Configuration Verification"
echo "=========================================="
echo ""

TARGET_REGION="us-east-1"
OLD_REGION="ap-southeast-1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗${NC} File not found: $file"
        return 1
    fi
    
    if grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✓${NC} $description: $file"
        return 0
    else
        echo -e "${RED}✗${NC} $description: $file"
        return 1
    fi
}

check_no_old_region() {
    local file=$1
    local description=$2
    
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠${NC} File not found: $file"
        return 0
    fi
    
    if grep -q "$OLD_REGION" "$file"; then
        echo -e "${RED}✗${NC} Still contains $OLD_REGION: $file"
        grep -n "$OLD_REGION" "$file" | head -5
        return 1
    else
        echo -e "${GREEN}✓${NC} No old region found: $file"
        return 0
    fi
}

echo "1. Checking Terraform Configuration Files"
echo "----------------------------------------"

check_file "infra/terraform/environments/dev/01-network/terraform.tfvars" \
    "aws_region.*=.*\"$TARGET_REGION\"" \
    "Dev network tfvars"

check_file "infra/terraform/environments/dev/01-network/variables.tf" \
    "default.*=.*\"$TARGET_REGION\"" \
    "Dev network variables"

check_file "infra/terraform/environments/dev/02-app/terraform.tfvars" \
    "aws_region.*=.*\"$TARGET_REGION\"" \
    "Dev app tfvars"

check_file "infra/terraform/environments/dev/02-app/variables.tf" \
    "default.*=.*\"$TARGET_REGION\"" \
    "Dev app variables"

check_file "infra/terraform/environments/production/variables.tf" \
    "default.*=.*\"$TARGET_REGION\"" \
    "Production variables"

echo ""
echo "2. Checking GitHub Actions Workflows"
echo "----------------------------------------"

check_file ".github/workflows/deploy-dev-two-stack.yml" \
    "AWS_REGION:.*$TARGET_REGION" \
    "Dev deployment workflow"

check_file ".github/workflows/deploy.yml" \
    "AWS_REGION:.*$TARGET_REGION" \
    "Production deployment workflow"

echo ""
echo "3. Checking Backend Configuration"
echo "----------------------------------------"

check_file "backend/.env.example" \
    "AWS_REGION=$TARGET_REGION" \
    "Backend .env.example"

echo ""
echo "4. Checking for Old Region References"
echo "----------------------------------------"

# Check critical files for old region
check_no_old_region "infra/terraform/environments/dev/01-network/terraform.tfvars" "Dev network tfvars"
check_no_old_region "infra/terraform/environments/dev/02-app/terraform.tfvars" "Dev app tfvars"
check_no_old_region ".github/workflows/deploy-dev-two-stack.yml" "Dev workflow"
check_no_old_region ".github/workflows/deploy.yml" "Production workflow"

echo ""
echo "5. AWS CLI Configuration Check"
echo "----------------------------------------"

if command -v aws &> /dev/null; then
    CURRENT_REGION=$(aws configure get region 2>/dev/null || echo "not set")
    echo "Current AWS CLI region: $CURRENT_REGION"
    
    if [ "$CURRENT_REGION" = "$TARGET_REGION" ]; then
        echo -e "${GREEN}✓${NC} AWS CLI configured for $TARGET_REGION"
    else
        echo -e "${YELLOW}⚠${NC} AWS CLI region is $CURRENT_REGION, not $TARGET_REGION"
        echo "  Run: aws configure set region $TARGET_REGION"
    fi
    
    # Check credentials
    if aws sts get-caller-identity --region $TARGET_REGION &>/dev/null; then
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region $TARGET_REGION)
        echo -e "${GREEN}✓${NC} AWS credentials valid for $TARGET_REGION"
        echo "  Account ID: $ACCOUNT_ID"
    else
        echo -e "${RED}✗${NC} Cannot authenticate to AWS in $TARGET_REGION"
        echo "  Check your AWS credentials"
    fi
else
    echo -e "${YELLOW}⚠${NC} AWS CLI not installed"
fi

echo ""
echo "6. Checking Required AWS Resources"
echo "----------------------------------------"

if command -v aws &> /dev/null && aws sts get-caller-identity --region $TARGET_REGION &>/dev/null; then
    
    # Check ECR repository
    if aws ecr describe-repositories --repository-names kicks-shoes-backend --region $TARGET_REGION &>/dev/null; then
        echo -e "${GREEN}✓${NC} ECR repository exists in $TARGET_REGION"
    else
        echo -e "${YELLOW}⚠${NC} ECR repository not found in $TARGET_REGION"
        echo "  Run: aws ecr create-repository --repository-name kicks-shoes-backend --region $TARGET_REGION"
    fi
    
    # Check Secrets Manager
    SECRET_NAME="kicks-shoes-dev-tientp/app-config"
    if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region $TARGET_REGION &>/dev/null; then
        echo -e "${GREEN}✓${NC} Secrets Manager secret exists: $SECRET_NAME"
    else
        echo -e "${YELLOW}⚠${NC} Secrets Manager secret not found: $SECRET_NAME"
        echo "  Create secret in $TARGET_REGION before deployment"
    fi
    
    # Check S3 state bucket
    STATE_BUCKET="kicks-shoes-tf-state"
    if aws s3api head-bucket --bucket "$STATE_BUCKET" --region $TARGET_REGION 2>/dev/null; then
        BUCKET_REGION=$(aws s3api get-bucket-location --bucket "$STATE_BUCKET" --query 'LocationConstraint' --output text 2>/dev/null || echo "us-east-1")
        [ "$BUCKET_REGION" = "None" ] && BUCKET_REGION="us-east-1"
        
        if [ "$BUCKET_REGION" = "$TARGET_REGION" ]; then
            echo -e "${GREEN}✓${NC} Terraform state bucket exists in $TARGET_REGION"
        else
            echo -e "${YELLOW}⚠${NC} Terraform state bucket is in $BUCKET_REGION, not $TARGET_REGION"
        fi
    else
        echo -e "${YELLOW}⚠${NC} Terraform state bucket not found: $STATE_BUCKET"
        echo "  Will be created automatically during deployment"
    fi
    
else
    echo -e "${YELLOW}⚠${NC} Skipping AWS resource checks (AWS CLI not configured)"
fi

echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo ""
echo "Target Region: $TARGET_REGION"
echo ""
echo "Next Steps:"
echo "1. Review any warnings or errors above"
echo "2. Create missing AWS resources (ECR, Secrets Manager)"
echo "3. Deploy using GitHub Actions or manual Terraform"
echo "4. See MIGRATION_US_EAST_1.md for detailed instructions"
echo ""
