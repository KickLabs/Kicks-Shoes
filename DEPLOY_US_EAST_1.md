# Hướng Dẫn Deploy Lại Infrastructure Lên US-EAST-1

## Tổng Quan

Tài liệu này hướng dẫn deploy lại toàn bộ infrastructure của Kicks Shoes lên AWS region **us-east-1** (Virginia).

## Điều Kiện Tiên Quyết

### 1. AWS CLI đã cấu hình
```bash
aws configure
# Nhập AWS Access Key ID, Secret Access Key, và region: us-east-1
```

### 2. Terraform đã cài đặt
```bash
terraform --version
# Yêu cầu: >= 1.0
```

### 3. Secrets Manager đã có app-config
Đảm bảo secret `kicks-shoes-dev-tientp/app-config` đã tồn tại trong us-east-1:
```bash
aws secretsmanager describe-secret --secret-id kicks-shoes-dev-tientp/app-config --region us-east-1
```

Nếu chưa có, tạo secret:
```bash
aws secretsmanager create-secret \
  --name kicks-shoes-dev-tientp/app-config \
  --description "App configuration for Kicks Shoes Dev" \
  --secret-string '{
    "JWT_SECRET": "your-jwt-secret-here",
    "JWT_REFRESH_SECRET": "your-refresh-secret-here",
    "MONGODB_URI": "mongodb+srv://...",
    "GOOGLE_AI_API_KEY": "your-google-ai-key",
    "GOOGLE_MAILER_CLIENT_ID": "your-client-id",
    "GOOGLE_MAILER_CLIENT_SECRET": "your-client-secret",
    "GOOGLE_MAILER_REFRESH_TOKEN": "your-refresh-token"
  }' \
  --region us-east-1
```

### 4. ECR Repository và Docker Image
Đảm bảo ECR repository tồn tại và có image:
```bash
# Kiểm tra repository
aws ecr describe-repositories --repository-names kicks-shoes-backend --region us-east-1

# Nếu chưa có, tạo repository
aws ecr create-repository --repository-name kicks-shoes-backend --region us-east-1

# Build và push image
cd backend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 318662970982.dkr.ecr.us-east-1.amazonaws.com
docker build -t kicks-shoes-backend:dev-latest .
docker tag kicks-shoes-backend:dev-latest 318662970982.dkr.ecr.us-east-1.amazonaws.com/kicks-shoes-backend:dev-latest
docker push 318662970982.dkr.ecr.us-east-1.amazonaws.com/kicks-shoes-backend:dev-latest
```

## Bước 1: Xóa Infrastructure Cũ (Nếu Có)

### 1.1. Xóa App Layer (02-app)
```bash
cd infra/terraform/environments/dev/02-app
terraform init
terraform destroy -auto-approve
```

### 1.2. Xóa Network Layer (01-network)
```bash
cd ../01-network
terraform init
terraform destroy -auto-approve
```

**Lưu ý:** Nếu có lỗi khi destroy, có thể cần xóa thủ công một số resources qua AWS Console:
- Network Firewall
- EFS Mount Targets
- NAT Gateway
- Elastic IPs

## Bước 2: Deploy Network Layer (01-network)

```bash
cd infra/terraform/environments/dev/01-network

# Khởi tạo Terraform
terraform init

# Xem plan
terraform plan

# Apply
terraform apply -auto-approve
```

**Thời gian ước tính:** 5-10 phút

**Resources được tạo:**
- VPC với CIDR 10.0.0.0/16
- 2 Public Subnets (10.0.0.0/24, 10.0.1.0/24)
- 2 Private Subnets (10.0.10.0/24, 10.0.11.0/24)
- 2 DB Subnets (10.0.20.0/24, 10.0.21.0/24)
- 2 Firewall Subnets (10.0.30.0/24, 10.0.31.0/24)
- NAT Gateway
- Internet Gateway
- VPC Flow Logs
- Network Firewall (nếu có trong config)

## Bước 3: Deploy App Layer (02-app)

```bash
cd ../02-app

# Khởi tạo Terraform
terraform init

# Xem plan
terraform plan

# Apply
terraform apply -auto-approve
```

**Thời gian ước tính:** 15-20 phút

**Resources được tạo:**
- Application Load Balancer (ALB)
- ECS Cluster (Fargate)
- ECS Service với Auto Scaling
- DynamoDB Table (chat messages)
- S3 Bucket (uploads)
- ElastiCache Redis
- EFS File System
- Lambda Function (Bedrock chat)
- CloudWatch Log Groups
- Security Groups
- VPC Endpoints (S3, DynamoDB)
- Cognito User Pool
- SNS Topic (alerts)
- CloudWatch Alarms
- (Optional) CloudFront Distribution
- (Optional) Route53 Records
- (Optional) ACM Certificates

## Bước 4: Verify Deployment

### 4.1. Kiểm tra ECS Service
```bash
aws ecs describe-services \
  --cluster kicks-shoes-dev-tientp-cluster \
  --services kicks-shoes-dev-tientp-service \
  --region us-east-1 \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'
```

### 4.2. Kiểm tra ALB Health
```bash
# Lấy ALB DNS name
terraform output alb_dns_name

# Test health endpoint
curl http://<alb-dns-name>/api/health
```

### 4.3. Kiểm tra Logs
```bash
# ECS logs
aws logs tail /ecs/kicks-shoes-dev-tientp --follow --region us-east-1

# Lambda logs
aws logs tail /aws/lambda/kicks-shoes-dev-tientp-bedrock-chat --follow --region us-east-1
```

## Bước 5: Cập Nhật Frontend Config (Nếu Cần)

Nếu ALB DNS name thay đổi, cập nhật frontend `.env`:

```bash
cd frontend
# Cập nhật VITE_API_URL với ALB DNS mới
echo "VITE_API_URL=http://<new-alb-dns-name>" >> .env
```

## Troubleshooting

### Lỗi: "Secret not found"
```bash
# Tạo lại secret
aws secretsmanager create-secret \
  --name kicks-shoes-dev-tientp/app-config \
  --secret-string '{"JWT_SECRET":"..."}' \
  --region us-east-1
```

### Lỗi: "Image not found in ECR"
```bash
# Build và push lại image
cd backend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 318662970982.dkr.ecr.us-east-1.amazonaws.com
docker build -t kicks-shoes-backend:dev-latest .
docker tag kicks-shoes-backend:dev-latest 318662970982.dkr.ecr.us-east-1.amazonaws.com/kicks-shoes-backend:dev-latest
docker push 318662970982.dkr.ecr.us-east-1.amazonaws.com/kicks-shoes-backend:dev-latest
```

### Lỗi: "VPC already exists"
```bash
# Xóa VPC cũ thủ công hoặc import vào state
terraform import module.vpc.aws_vpc.this <vpc-id>
```

### Lỗi: Network Firewall routing
```bash
# Kiểm tra firewall status
aws network-firewall describe-firewall \
  --firewall-name kicks-shoes-dev-tientp-firewall \
  --region us-east-1

# Nếu cần, update route table thủ công
aws ec2 replace-route \
  --route-table-id <private-rt-id> \
  --destination-cidr-block 0.0.0.0/0 \
  --vpc-endpoint-id <firewall-endpoint-id> \
  --region us-east-1
```

## Outputs Quan Trọng

Sau khi deploy xong, lấy các outputs:

```bash
cd infra/terraform/environments/dev/02-app
terraform output
```

Các outputs quan trọng:
- `alb_dns_name` - ALB endpoint để gọi API
- `ecs_cluster_name` - Tên ECS cluster
- `dynamodb_table_name` - Tên DynamoDB table
- `s3_bucket_name` - Tên S3 bucket
- `redis_endpoint` - Redis endpoint
- `cognito_user_pool_id` - Cognito User Pool ID

## Chi Phí Ước Tính (us-east-1)

**Hàng tháng:**
- ECS Fargate (1 task, 0.25 vCPU, 0.5 GB): ~$10
- NAT Gateway: ~$32
- ALB: ~$16
- ElastiCache (t3.micro): ~$12
- EFS: ~$0.30/GB
- DynamoDB (on-demand): ~$1-5
- Lambda: ~$0-1
- CloudWatch Logs: ~$0.50
- Network Firewall: ~$350/month (nếu enable)

**Tổng (không bao gồm Network Firewall):** ~$70-80/tháng

## Lưu Ý Quan Trọng

1. **Region:** Tất cả resources đều ở `us-east-1`
2. **Bedrock Knowledge Base:** Đảm bảo KB ID `3MR7O4U9IC` tồn tại trong us-east-1
3. **Custom Domain:** Nếu muốn dùng custom domain, set `enable_custom_domain = true` trong terraform.tfvars
4. **Network Firewall:** Tốn kém (~$350/tháng), chỉ enable khi cần thiết
5. **Auto Scaling:** ECS service sẽ scale từ 1-3 tasks dựa trên CPU utilization

## Checklist Sau Deploy

- [ ] ECS service đang chạy (running count = desired count)
- [ ] ALB health check pass
- [ ] DynamoDB table đã tạo
- [ ] S3 bucket đã tạo
- [ ] Redis cluster đang available
- [ ] Lambda function đã deploy
- [ ] VPC Flow Logs đang ghi
- [ ] CloudWatch alarms đã active
- [ ] Secrets Manager có đủ secrets
- [ ] ECR có image mới nhất

## Liên Hệ

Nếu gặp vấn đề, kiểm tra:
1. CloudWatch Logs: `/ecs/kicks-shoes-dev-tientp`
2. ECS Service Events trong AWS Console
3. Terraform state: `terraform show`
