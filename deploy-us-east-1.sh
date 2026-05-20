#!/bin/bash
# Deploy Kicks Shoes Infrastructure to US-EAST-1
# Usage: ./deploy-us-east-1.sh [--destroy] [--skip-network] [--skip-app] [--auto-approve]

set -e

DESTROY=false
SKIP_NETWORK=false
SKIP_APP=false
AUTO_APPROVE=false
REGION="us-east-1"
PROJECT_NAME="kicks-shoes-dev-tientp"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --destroy)
            DESTROY=true
            shift
            ;;
        --skip-network)
            SKIP_NETWORK=true
            shift
            ;;
        --skip-app)
            SKIP_APP=true
            shift
            ;;
        --auto-approve)
            AUTO_APPROVE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--destroy] [--skip-network] [--skip-app] [--auto-approve]"
            exit 1
            ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================"
echo -e "Kicks Shoes - Deploy to US-EAST-1"
echo -e "========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check AWS CLI
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version)
    echo -e "${GREEN}✓ AWS CLI: $AWS_VERSION${NC}"
else
    echo -e "${RED}✗ AWS CLI not found. Please install AWS CLI first.${NC}"
    exit 1
fi

# Check Terraform
if command -v terraform &> /dev/null; then
    TF_VERSION=$(terraform version -json | jq -r '.terraform_version')
    echo -e "${GREEN}✓ Terraform: $TF_VERSION${NC}"
else
    echo -e "${RED}✗ Terraform not found. Please install Terraform first.${NC}"
    exit 1
fi

# Check AWS credentials
if aws sts get-caller-identity --region $REGION &> /dev/null; then
    ACCOUNT=$(aws sts get-caller-identity --region $REGION --query 'Account' --output text)
    ARN=$(aws sts get-caller-identity --region $REGION --query 'Arn' --output text)
    echo -e "${GREEN}✓ AWS Account: $ACCOUNT${NC}"
    echo -e "${GREEN}✓ AWS User: $ARN${NC}"
else
    echo -e "${RED}✗ AWS credentials not configured. Run 'aws configure' first.${NC}"
    exit 1
fi

echo ""

# Function to run terraform
run_terraform() {
    local ACTION=$1
    local LAYER=$2
    local PATH=$3
    
    echo -e "${CYAN}========================================"
    echo -e "$ACTION $LAYER Layer"
    echo -e "========================================${NC}"
    
    cd "$PATH"
    
    # Initialize
    echo -e "${YELLOW}Running terraform init...${NC}"
    terraform init
    
    # Plan
    echo -e "${YELLOW}Running terraform plan...${NC}"
    if [ "$ACTION" = "Destroy" ]; then
        terraform plan -destroy
    else
        terraform plan
    fi
    
    # Apply or Destroy
    if [ "$AUTO_APPROVE" = true ]; then
        CONFIRM="y"
    else
        echo ""
        read -p "Do you want to proceed? (y/n) " CONFIRM
    fi
    
    if [ "$CONFIRM" = "y" ]; then
        echo -e "${YELLOW}Running terraform $ACTION...${NC}"
        if [ "$ACTION" = "Destroy" ]; then
            terraform destroy -auto-approve
        else
            terraform apply -auto-approve
        fi
        echo -e "${GREEN}✓ $LAYER layer $ACTION completed successfully!${NC}"
    else
        echo -e "${YELLOW}Skipped $LAYER layer${NC}"
    fi
    
    cd - > /dev/null
    echo ""
}

# Main deployment logic
if [ "$DESTROY" = true ]; then
    echo -e "${RED}WARNING: This will DESTROY all infrastructure in us-east-1!${NC}"
    echo ""
    
    # Destroy in reverse order: App first, then Network
    if [ "$SKIP_APP" = false ]; then
        run_terraform "Destroy" "App (02-app)" "infra/terraform/environments/dev/02-app"
    fi
    
    if [ "$SKIP_NETWORK" = false ]; then
        run_terraform "Destroy" "Network (01-network)" "infra/terraform/environments/dev/01-network"
    fi
    
    echo -e "${GREEN}========================================"
    echo -e "Destroy completed!"
    echo -e "========================================${NC}"
else
    # Deploy in order: Network first, then App
    if [ "$SKIP_NETWORK" = false ]; then
        run_terraform "Apply" "Network (01-network)" "infra/terraform/environments/dev/01-network"
    fi
    
    if [ "$SKIP_APP" = false ]; then
        # Check if ECR image exists
        echo -e "${YELLOW}Checking ECR image...${NC}"
        if aws ecr describe-images \
            --repository-name kicks-shoes-backend \
            --image-ids imageTag=dev-latest \
            --region $REGION &> /dev/null; then
            echo -e "${GREEN}✓ ECR image found${NC}"
        else
            echo -e "${RED}✗ ECR image not found. Please build and push the image first:${NC}"
            echo -e "${YELLOW}  cd backend${NC}"
            echo -e "${YELLOW}  aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin 318662970982.dkr.ecr.$REGION.amazonaws.com${NC}"
            echo -e "${YELLOW}  docker build -t kicks-shoes-backend:dev-latest .${NC}"
            echo -e "${YELLOW}  docker tag kicks-shoes-backend:dev-latest 318662970982.dkr.ecr.$REGION.amazonaws.com/kicks-shoes-backend:dev-latest${NC}"
            echo -e "${YELLOW}  docker push 318662970982.dkr.ecr.$REGION.amazonaws.com/kicks-shoes-backend:dev-latest${NC}"
            echo ""
            read -p "Continue anyway? (y/n) " CONTINUE
            if [ "$CONTINUE" != "y" ]; then
                exit 1
            fi
        fi
        
        # Check if Secrets Manager secret exists
        echo -e "${YELLOW}Checking Secrets Manager...${NC}"
        if aws secretsmanager describe-secret \
            --secret-id "$PROJECT_NAME/app-config" \
            --region $REGION &> /dev/null; then
            echo -e "${GREEN}✓ Secrets Manager secret found${NC}"
        else
            echo -e "${RED}✗ Secrets Manager secret not found. Please create it first:${NC}"
            echo -e "${YELLOW}  aws secretsmanager create-secret --name $PROJECT_NAME/app-config --region $REGION --secret-string '{...}'${NC}"
            echo ""
            read -p "Continue anyway? (y/n) " CONTINUE
            if [ "$CONTINUE" != "y" ]; then
                exit 1
            fi
        fi
        
        echo ""
        run_terraform "Apply" "App (02-app)" "infra/terraform/environments/dev/02-app"
    fi
    
    echo -e "${GREEN}========================================"
    echo -e "Deployment completed!"
    echo -e "========================================${NC}"
    echo ""
    
    # Show outputs
    if [ "$SKIP_APP" = false ]; then
        echo -e "${YELLOW}Getting outputs...${NC}"
        cd "infra/terraform/environments/dev/02-app"
        terraform output
        cd - > /dev/null
        echo ""
    fi
    
    echo -e "${CYAN}Next steps:${NC}"
    echo -e "${NC}1. Check ECS service status:${NC}"
    echo -e "   aws ecs describe-services --cluster $PROJECT_NAME-cluster --services $PROJECT_NAME-service --region $REGION"
    echo -e "${NC}2. Check logs:${NC}"
    echo -e "   aws logs tail /ecs/$PROJECT_NAME --follow --region $REGION"
    echo -e "${NC}3. Test API health:${NC}"
    echo -e "   curl http://<alb-dns-name>/api/health"
fi
