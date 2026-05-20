# 01 — Carry-Forward: Deploy lại App End-to-End

## Mục tiêu

Deploy lại toàn bộ stack Kicks Shoes trên AWS account mới (account reset mỗi tuần). App phải chạy end-to-end trước khi làm bất kỳ MH nào.

---

## Checklist Deploy Lại

### Bước 1 — Chuẩn bị account mới

```bash
# 1. Tạo S3 bucket cho Terraform state
aws s3api create-bucket \
  --bucket kicks-shoes-tf-state \
  --region ap-southeast-1 \
  --create-bucket-configuration LocationConstraint=ap-southeast-1

aws s3api put-bucket-versioning \
  --bucket kicks-shoes-tf-state \
  --versioning-configuration Status=Enabled

# 2. Tạo Secrets Manager secret
aws secretsmanager create-secret \
  --name kicks-shoes-dev/app-config \
  --region ap-southeast-1 \
  --secret-string file://backend/.env

# 3. Tạo ECR repo và push image
aws ecr create-repository --repository-name kicks-shoes-backend --region ap-southeast-1
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com
docker build -t kicks-shoes-backend ./backend
docker tag kicks-shoes-backend:latest <ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/kicks-shoes-backend:dev-latest
docker push <ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/kicks-shoes-backend:dev-latest
```

### Bước 2 — Deploy 01-network

```bash
cd infra/terraform/environments/dev/01-network
cp terraform.tfvars.example terraform.tfvars
# Điền giá trị vào terraform.tfvars

terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars" -auto-approve
```

**Verify:** outputs `vpc_id`, `public_subnet_ids`, `private_subnet_ids` có giá trị.

### Bước 3 — Deploy 02-app

```bash
cd infra/terraform/environments/dev/02-app
cp terraform.tfvars.example terraform.tfvars
# Điền container_image, domain_name, account_id

terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars" -auto-approve
```

**Verify:**
```bash
# Health check
curl https://api.dev.<domain>/api/health
# Expected: {"status":"ok"}

# ALB direct
curl http://<alb-dns>/api/health
```

### Bước 4 — Verify end-to-end actions

Demo 2 action đại diện cho presentation:
1. **Product listing**: `GET /api/v1/products` → trả danh sách sản phẩm
2. **AI Chat**: `POST /api/v1/chat` với message → Bedrock trả lời

---

## Architecture Diagram Update

Diagram W5 phải bổ sung so với W4:

```
Internet
  │
  ▼
CloudFront (WAF) ──→ S3 (frontend)
  │
  ▼
ALB (HTTPS)
  │
  ▼
ECS Fargate (private subnet)
  │   ├── EFS mount /mnt/efs  ← MH3 mới
  │   └── SG: chỉ từ ALB
  │
  ├──→ [Firewall Endpoint] ──→ NAT GW ──→ Internet  ← MH2 mới
  │
  ├──→ DynamoDB (chat messages)
  │       └── Stream ──→ Lambda bedrock-chat
  │                         ↑
  │                    API Gateway HTTP API  ← MH4 mới
  │                    (JWT Authorizer, throttling)
  │                         │
  │                    DLQ (SQS)  ← MH5 mới
  │
  ├──→ MongoDB Atlas (external)
  └──→ S3 (uploads)

VPC Flow Logs ──→ CloudWatch  ← MH1 mới
Network Firewall Alert Logs ──→ CloudWatch  ← MH2 mới
AWS Backup Vault ──→ EFS + DynamoDB  ← MH3 mới
```

---

## Feedback W4 → W5 Fix

> **Điền vào đây sau khi nhận feedback từ trainer W4.**

Ví dụ format:
- **Feedback W4**: "Lambda invoke trực tiếp từ app, không có auth layer"
- **W5 Fix**: Đặt API Gateway HTTP API với Lambda Authorizer trước Lambda bedrock-chat (MH4)
