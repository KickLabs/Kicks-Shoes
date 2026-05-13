#!/usr/bin/env bash
# =============================================================================
# deploy-dev.sh — Manual deploy script for dev environment
# Usage: ./scripts/deploy-dev.sh [--skip-build] [--skip-network] [--plan-only]
#
# Prerequisites:
#   - AWS CLI configured (aws configure or env vars)
#   - Terraform >= 1.5.0
#   - Docker running
#   - jq installed
# =============================================================================
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
AWS_REGION="${AWS_REGION:-ap-southeast-1}"
TF_STATE_BUCKET="${TF_STATE_BUCKET:-kicks-shoes-tf-state}"
ECR_REPOSITORY="${ECR_REPOSITORY:-kicks-shoes-backend}"
TF_NETWORK_DIR="infra/terraform/environments/dev/01-network"
TF_APP_DIR="infra/terraform/environments/dev/02-app"
AUTHORIZER_DIR="backend/lambda/jwt-authorizer"

SKIP_BUILD=false
SKIP_NETWORK=false
PLAN_ONLY=false

for arg in "$@"; do
  case $arg in
    --skip-build)   SKIP_BUILD=true ;;
    --skip-network) SKIP_NETWORK=true ;;
    --plan-only)    PLAN_ONLY=true ;;
  esac
done

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Preflight ─────────────────────────────────────────────────────────────────
info "Checking prerequisites..."
command -v aws       >/dev/null || error "aws CLI not found"
command -v terraform >/dev/null || error "terraform not found"
command -v docker    >/dev/null || error "docker not found"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
success "AWS Account: $ACCOUNT_ID | Region: $AWS_REGION"

# ── Terraform state bucket ────────────────────────────────────────────────────
info "Ensuring Terraform state bucket: $TF_STATE_BUCKET"
if ! aws s3api head-bucket --bucket "$TF_STATE_BUCKET" 2>/dev/null; then
  aws s3api create-bucket \
    --bucket "$TF_STATE_BUCKET" \
    --region "$AWS_REGION" \
    --create-bucket-configuration LocationConstraint="$AWS_REGION"
  aws s3api put-bucket-versioning \
    --bucket "$TF_STATE_BUCKET" \
    --versioning-configuration Status=Enabled
  success "State bucket created: $TF_STATE_BUCKET"
else
  success "State bucket exists: $TF_STATE_BUCKET"
fi

# ── Build JWT Authorizer ──────────────────────────────────────────────────────
if [ -f "$AUTHORIZER_DIR/package.json" ]; then
  info "Building JWT Authorizer Lambda..."
  (cd "$AUTHORIZER_DIR" && npm install --omit=dev && zip -r authorizer.zip index.js node_modules/)
  success "authorizer.zip built"
fi

# ── Build & push Docker image ─────────────────────────────────────────────────
IMAGE_URI=""
if [ "$SKIP_BUILD" = false ]; then
  info "Ensuring ECR repository: $ECR_REPOSITORY"
  aws ecr describe-repositories --repository-names "$ECR_REPOSITORY" >/dev/null 2>&1 || \
    aws ecr create-repository --repository-name "$ECR_REPOSITORY" >/dev/null

  ECR_REGISTRY="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
  aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "$ECR_REGISTRY"

  COMMIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo 'local')"
  IMAGE_URI="$ECR_REGISTRY/$ECR_REPOSITORY:dev-$COMMIT_SHA"

  info "Building Docker image: $IMAGE_URI"
  docker build -f backend/Dockerfile -t "$IMAGE_URI" -t "$ECR_REGISTRY/$ECR_REPOSITORY:dev-latest" ./backend
  docker push "$IMAGE_URI"
  docker push "$ECR_REGISTRY/$ECR_REPOSITORY:dev-latest"
  success "Image pushed: $IMAGE_URI"
else
  # Use latest image from ECR
  ECR_REGISTRY="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
  IMAGE_URI="$ECR_REGISTRY/$ECR_REPOSITORY:dev-latest"
  warn "Skipping build — using: $IMAGE_URI"
fi

# ── Helper: terraform init ────────────────────────────────────────────────────
tf_init() {
  local dir="$1"
  local key="$2"
  terraform -chdir="$dir" init -reconfigure \
    -backend-config="bucket=$TF_STATE_BUCKET" \
    -backend-config="key=$key" \
    -backend-config="region=$AWS_REGION" \
    -backend-config="encrypt=true"
}

# ── 01-network ────────────────────────────────────────────────────────────────
if [ "$SKIP_NETWORK" = false ]; then
  info "=== Deploying 01-network ==="
  tf_init "$TF_NETWORK_DIR" "dev/01-network/terraform.tfstate"

  if [ "$PLAN_ONLY" = true ]; then
    terraform -chdir="$TF_NETWORK_DIR" plan -var-file="terraform.tfvars"
    info "Plan only — stopping after 01-network plan."
    exit 0
  fi

  terraform -chdir="$TF_NETWORK_DIR" apply -auto-approve -var-file="terraform.tfvars"
  success "01-network deployed"
else
  warn "Skipping 01-network"
fi

# ── 02-app ────────────────────────────────────────────────────────────────────
info "=== Deploying 02-app ==="
tf_init "$TF_APP_DIR" "dev/02-app/terraform.tfstate"

PLAN_ARGS=(
  "-var=container_image=$IMAGE_URI"
  "-var-file=terraform.tfvars"
)

if [ "$PLAN_ONLY" = true ]; then
  terraform -chdir="$TF_APP_DIR" plan "${PLAN_ARGS[@]}"
  info "Plan only — done."
  exit 0
fi

terraform -chdir="$TF_APP_DIR" apply -auto-approve "${PLAN_ARGS[@]}"
success "02-app deployed"

# ── Outputs ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}=== W5 Deployment Complete ===${NC}"
terraform -chdir="$TF_APP_DIR" output -json 2>/dev/null | \
  jq -r 'to_entries[] | "  \(.key): \(.value.value)"' 2>/dev/null || \
  terraform -chdir="$TF_APP_DIR" output 2>/dev/null || true

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Copy api_gateway_invoke_url → set VITE_BEDROCK_API_URL in frontend/.env"
echo "  2. Test health: curl http://\$(terraform -chdir=$TF_APP_DIR output -raw alb_dns_name)/api/health"
echo "  3. Test EFS:    curl -X POST http://<alb>/api/efs/write -H 'Content-Type: application/json' -d '{\"filename\":\"w5-test.txt\"}'"
echo "  4. Build JWT authorizer zip if not done: cd $AUTHORIZER_DIR && ./build.sh"
