# W5 Deploy Guide — Kicks Shoes Dev

Hướng dẫn deploy lại app trên AWS account mới cho W5.

---

## Cách 1 — GitHub Actions (Khuyến nghị)

### Bước 1: Set GitHub Secrets

Vào **Settings → Secrets and variables → Actions** của repo, thêm:

| Secret | Giá trị |
|--------|---------|
| `AWS_ACCESS_KEY_ID` | Access key của account mới |
| `AWS_SECRET_ACCESS_KEY` | Secret key |
| `AWS_SESSION_TOKEN` | Session token (nếu dùng workshop account) |

### Bước 2: Set GitHub Variables (optional)

| Variable | Default | Mô tả |
|----------|---------|-------|
| `DEV_APP_CONFIG_SECRET_NAME` | `kicks-shoes-dev/app-config` | Tên secret trong Secrets Manager |
| `DEV_DOMAIN_NAME` | `kicks-shoes.com` | Domain name |
| `DEV_ENABLE_CUSTOM_DOMAIN` | `false` | Bật HTTPS/CloudFront |

### Bước 3: Trigger workflow

```
GitHub → Actions → "Deploy Dev Two Stack" → Run workflow
```

Hoặc push lên branch `kicks-production`.

---

## Cách 2 — Deploy thủ công (Local)

### Prerequisites

```bash
# Kiểm tra tools
aws --version          # >= 2.x
terraform --version    # >= 1.5.0
docker --version       # running
```

### Windows (PowerShell)

```powershell
# Set AWS credentials
$env:AWS_ACCESS_KEY_ID     = "ASIA..."
$env:AWS_SECRET_ACCESS_KEY = "..."
$env:AWS_SESSION_TOKEN     = "..."  # nếu có

# Deploy full stack
.\scripts\deploy-dev.ps1

# Chỉ plan (không apply)
.\scripts\deploy-dev.ps1 -PlanOnly

# Skip build image (dùng image cũ)
.\scripts\deploy-dev.ps1 -SkipBuild

# Skip network stack (chỉ deploy app)
.\scripts\deploy-dev.ps1 -SkipNetwork
```

### Linux/Mac (Bash)

```bash
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."  # nếu có

chmod +x scripts/deploy-dev.sh
./scripts/deploy-dev.sh

# Options
./scripts/deploy-dev.sh --skip-build    # dùng image cũ
./scripts/deploy-dev.sh --skip-network  # chỉ deploy app
./scripts/deploy-dev.sh --plan-only     # chỉ plan
```

---

## Thứ tự deploy

```
1. Build JWT Authorizer zip (tự động trong script)
2. Build & push Docker image → ECR
3. terraform apply 01-network  (VPC, subnets, Flow Logs, Firewall subnets)
4. terraform apply 02-app      (ECS, ALB, DynamoDB, Lambda, EFS, Backup, API GW, Firewall)
5. Health check: GET /api/health
```

---

## Sau khi deploy xong

### 1. Lấy outputs

```bash
cd infra/terraform/environments/dev/02-app
terraform output
```

Key outputs:
- `alb_dns_name` — URL của app
- `api_gateway_invoke_url` — URL API Gateway (MH4)
- `efs_file_system_id` — EFS ID (MH3)
- `backup_vault_name` — Backup vault (MH3)
- `bedrock_dlq_url` — SQS DLQ URL (MH5)
- `network_firewall_arn` — Firewall ARN (MH2)
- `flow_log_group_name` — CloudWatch log group (MH1)

### 2. Set frontend env

```bash
# Lấy API Gateway URL
API_GW_URL=$(terraform -chdir=infra/terraform/environments/dev/02-app output -raw api_gateway_invoke_url)

# Thêm vào frontend/.env
echo "VITE_BEDROCK_API_URL=$API_GW_URL" >> frontend/.env
```

### 3. Test health check

```bash
ALB_DNS=$(terraform -chdir=infra/terraform/environments/dev/02-app output -raw alb_dns_name)
curl http://$ALB_DNS/api/health
# Expected: {"status":"healthy",...}
```

### 4. Test EFS (MH3 evidence)

```bash
# Ghi file
curl -X POST http://$ALB_DNS/api/efs/write \
  -H "Content-Type: application/json" \
  -d '{"filename":"w5-evidence.txt","content":"W5 EFS test - 2026-05-15"}'

# Đọc lại
curl http://$ALB_DNS/api/efs/read/w5-evidence.txt
```

### 5. Test API Gateway (MH4 evidence)

```bash
# Lấy JWT token
TOKEN=$(curl -s -X POST http://$ALB_DNS/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}' \
  | jq -r '.token')

# Test authenticated → 200
curl -X POST $API_GW_URL/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"What shoes do you recommend?"}' \
  -w "\nHTTP Status: %{http_code}"

# Test no auth → 403
curl -X POST $API_GW_URL/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' \
  -w "\nHTTP Status: %{http_code}"
```

### 6. Trigger manual backup (MH3 evidence)

```bash
EFS_ARN=$(aws efs describe-file-systems \
  --query 'FileSystems[?Name==`kicks-shoes-dev-efs`].FileSystemArn' \
  --output text --region ap-southeast-1)

BACKUP_ROLE_ARN=$(terraform -chdir=infra/terraform/environments/dev/02-app output -raw backup_role_arn)

aws backup start-backup-job \
  --backup-vault-name kicks-shoes-dev-backup-vault \
  --resource-arn $EFS_ARN \
  --iam-role-arn $BACKUP_ROLE_ARN \
  --region ap-southeast-1
```

### 7. Test DLQ (MH5 evidence)

```bash
# Set invalid KB ID để trigger failure
aws lambda update-function-configuration \
  --function-name kicks-shoes-dev-bedrock-chat \
  --environment Variables='{BEDROCK_KB_ID=invalid-test,DYNAMODB_TABLE_NAME=kicks-shoes-dev-chat-messages}' \
  --region ap-southeast-1

# Insert message vào DynamoDB để trigger Lambda
aws dynamodb put-item \
  --table-name kicks-shoes-dev-chat-messages \
  --item '{"pk":{"S":"CONV#dlq-test"},"sk":{"S":"MSG#1715000000"},"content":{"S":"DLQ test"},"messageType":{"S":"user"},"conversationId":{"S":"dlq-test"}}' \
  --region ap-southeast-1

# Đợi 30s rồi check DLQ
sleep 30
DLQ_URL=$(terraform -chdir=infra/terraform/environments/dev/02-app output -raw bedrock_dlq_url)
aws sqs receive-message --queue-url $DLQ_URL --region ap-southeast-1

# Restore KB ID
aws lambda update-function-configuration \
  --function-name kicks-shoes-dev-bedrock-chat \
  --environment Variables='{BEDROCK_KB_ID=QVO2CHQ1MF,DYNAMODB_TABLE_NAME=kicks-shoes-dev-chat-messages}' \
  --region ap-southeast-1
```

---

## Troubleshooting

### ECS task không start

```bash
# Xem logs
aws logs tail /ecs/kicks-shoes-dev --follow --region ap-southeast-1

# Xem task failures
aws ecs describe-tasks \
  --cluster kicks-shoes-dev-cluster \
  --tasks $(aws ecs list-tasks --cluster kicks-shoes-dev-cluster --query 'taskArns[0]' --output text) \
  --region ap-southeast-1
```

### Terraform state conflict

```bash
# Xóa state lock nếu bị stuck
aws dynamodb delete-item \
  --table-name kicks-shoes-tf-locks \
  --key '{"LockID":{"S":"dev/02-app/terraform.tfstate"}}' \
  --region ap-southeast-1
```

### Network Firewall route table

Sau khi firewall deployed, cần update route table thủ công nếu Terraform không tự làm:

```bash
# Lấy firewall endpoint ID
FIREWALL_ENDPOINT=$(aws network-firewall describe-firewall \
  --firewall-name kicks-shoes-dev-firewall \
  --query 'FirewallStatus.SyncStates.*.Attachment[0].EndpointId' \
  --output text --region ap-southeast-1 | head -1)

# Lấy private route table ID
PRIVATE_RT=$(aws ec2 describe-route-tables \
  --filters "Name=tag:Tier,Values=private" \
  --query 'RouteTables[0].RouteTableId' \
  --output text --region ap-southeast-1)

# Update route
aws ec2 replace-route \
  --route-table-id $PRIVATE_RT \
  --destination-cidr-block 0.0.0.0/0 \
  --vpc-endpoint-id $FIREWALL_ENDPOINT \
  --region ap-southeast-1
```
