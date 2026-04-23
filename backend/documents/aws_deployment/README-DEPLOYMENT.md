# Backend Deployment Documentation

## 📚 Documentation Overview

This folder contains all documentation needed for backend deployment to AWS infrastructure using Docker + ECS Fargate.

---

## 📁 Files in This Folder

### 1. **Application Files**

#### `Dockerfile`
- **Purpose**: Multi-stage Docker build for Node.js backend
- **Features**:
  - Multi-stage build (builder + production)
  - Non-root user (nodejs:nodejs)
  - Health check endpoint
  - Optimized for production
- **Base Image**: `node:20-alpine`
- **Exposed Port**: 3000

#### `docker-compose.yml`
- **Purpose**: Local development with Docker Compose
- **Services**: Backend API
- **Networks**: kicks-network (bridge)
- **Health Check**: `/api/health` endpoint

#### `.env.example`
- **Purpose**: Template for environment variables
- **Categories**:
  - Server configuration
  - Database (MongoDB)
  - JWT secrets
  - Email (Google OAuth)
  - Payment gateways (VNPay, PayOS)
  - Google AI APIs
  - AWS services (S3, DynamoDB)
  - Cloudinary

---

### 2. **Developer Documentation**

#### `BE-DEVELOPER-GUIDE.md` (Comprehensive Guide)
- **Target Audience**: Backend Developers
- **Contents**:
  - Architecture overview (VPC, ALB, ECS, RDS)
  - What to get from DevOps
  - Deployment options (Docker + ECR + ECS)
  - Environment variables management
  - IAM permissions required
  - CI/CD integration (GitHub Actions, GitLab CI)
  - Monitoring & logging (CloudWatch)
  - Troubleshooting guide
  - Best practices
- **When to Use**: First-time setup, reference guide

#### `BE-DEPLOYMENT-CHECKLIST.md` (Quick Reference)
- **Target Audience**: Backend Developers
- **Contents**:
  - Pre-deployment checklist
  - Quick deployment steps
  - Automated deployment script
  - Common issues & solutions
  - Monitoring commands
  - Rollback procedure
- **When to Use**: Daily deployments, quick reference

---

### 3. **IAM Configuration** (for DevOps)

#### `IAM-POLICY-FOR-BE-DEVELOPER.json`
- **Purpose**: IAM policy for backend developers
- **Permissions Included**:
  - ECR: Push/pull Docker images
  - ECS: Deploy services, view tasks
  - CloudWatch Logs: Read logs
  - Secrets Manager: Read secrets
  - S3: Upload files (limited to uploads bucket)
  - DynamoDB: Read data (debugging)
  - IAM: PassRole for ECS tasks
- **How to Use**:
  ```bash
  # Create IAM user
  aws iam create-user --user-name be_developer
  
  # Attach policy
  aws iam put-user-policy \
    --user-name be_developer \
    --policy-name BEDeveloperPolicy \
    --policy-document file://IAM-POLICY-FOR-BE-DEVELOPER.json
  
  # Create access key
  aws iam create-access-key --user-name be_developer
  ```

---

## 🚀 Quick Start Guide

### For DevOps Team

#### Step 1: Setup Infrastructure

**Required AWS Resources:**
1. **VPC** with public and private subnets
2. **ECR Repository** for Docker images
3. **ECS Cluster** (Fargate)
4. **Application Load Balancer** (ALB)
5. **RDS** or **DocumentDB** (MongoDB-compatible)
6. **ElastiCache** (Redis)
7. **S3 Bucket** for uploads
8. **DynamoDB Tables** (optional)
9. **Secrets Manager** for credentials
10. **CloudWatch Log Groups**

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name kicks-shoes-backend \
  --region ap-southeast-1

# Create ECS cluster
aws ecs create-cluster \
  --cluster-name kicks-shoes-cluster \
  --region ap-southeast-1

# Create log group
aws logs create-log-group \
  --log-group-name /ecs/kicks-backend \
  --region ap-southeast-1
```

---

#### Step 2: Create IAM Roles

**ECS Task Execution Role** (for pulling images, writing logs):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Attach policies:
- `AmazonECSTaskExecutionRolePolicy`
- `SecretsManagerReadWrite` (for reading secrets)

**ECS Task Role** (for application to access AWS services):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    }
  ]
}
```

---

#### Step 3: Store Secrets in Secrets Manager

```bash
# Database credentials
aws secretsmanager create-secret \
  --name kicks-shoes/backend/database \
  --description "Database connection string" \
  --secret-string '{"MONGODB_URI":"mongodb+srv://..."}' \
  --region ap-southeast-1

# JWT secrets
aws secretsmanager create-secret \
  --name kicks-shoes/backend/jwt \
  --description "JWT secrets" \
  --secret-string '{"JWT_SECRET":"...","JWT_REFRESH_SECRET":"..."}' \
  --region ap-southeast-1

# Payment gateway credentials
aws secretsmanager create-secret \
  --name kicks-shoes/backend/payment \
  --description "Payment gateway credentials" \
  --secret-string '{"VNPAY_TMN_CODE":"...","VNPAY_SECURE_SECRET":"..."}' \
  --region ap-southeast-1
```

---

#### Step 4: Create ECS Task Definition

Create `task-definition.json`:

```json
{
  "family": "kicks-shoes-backend-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/kicks-backend-task-role",
  "containerDefinitions": [
    {
      "name": "kicks-backend",
      "image": "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/kicks-shoes-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        },
        {
          "name": "AWS_REGION",
          "value": "ap-southeast-1"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:kicks-shoes/backend/database:MONGODB_URI::"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:kicks-shoes/backend/jwt:JWT_SECRET::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/kicks-backend",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "node -e \"require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register task definition:
```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json \
  --region ap-southeast-1
```

---

#### Step 5: Create ECS Service

```bash
aws ecs create-service \
  --cluster kicks-shoes-cluster \
  --service-name kicks-shoes-backend-service \
  --task-definition kicks-shoes-backend-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-abc123,subnet-def456],securityGroups=[sg-abc123],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:ap-southeast-1:123456789012:targetgroup/kicks-backend-tg/abc123,containerName=kicks-backend,containerPort=3000" \
  --health-check-grace-period-seconds 60 \
  --region ap-southeast-1
```

---

#### Step 6: Create IAM User for Backend Developer

```bash
# Create user
aws iam create-user --user-name be_developer

# Attach policy
aws iam put-user-policy \
  --user-name be_developer \
  --policy-name BEDeveloperPolicy \
  --policy-document file://IAM-POLICY-FOR-BE-DEVELOPER.json

# Create access key
aws iam create-access-key --user-name be_developer > be_developer_credentials.json

# IMPORTANT: Send credentials securely to backend developer
```

---

#### Step 7: Share Information with Backend Developer

Send to backend developer:
- ✅ AWS Access Key ID
- ✅ AWS Secret Access Key
- ✅ ECR Repository URI
- ✅ ECS Cluster Name
- ✅ ECS Service Name
- ✅ AWS Region
- ✅ API Domain (ALB DNS or custom domain)
- ✅ Link to `BE-DEVELOPER-GUIDE.md`

---

### For Backend Developers

#### Step 1: Get Credentials from DevOps
Ask DevOps for:
- AWS Access Key ID
- AWS Secret Access Key
- ECR Repository URI
- ECS Cluster Name
- ECS Service Name
- AWS Region

#### Step 2: Setup Local Environment
```bash
# Install AWS CLI
brew install awscli  # macOS
# or
choco install awscli  # Windows

# Install Docker
brew install --cask docker  # macOS
# or
choco install docker-desktop  # Windows

# Configure AWS credentials
aws configure
```

#### Step 3: Build and Test Locally
```bash
# Build Docker image
docker build -t kicks-backend:test .

# Run locally
docker run -p 3000:3000 --env-file .env kicks-backend:test

# Test health endpoint
curl http://localhost:3000/api/health
```

#### Step 4: Deploy to AWS
```bash
# Login to ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin <ecr-uri>

# Build and tag
docker build -t kicks-backend:latest .
docker tag kicks-backend:latest <ecr-uri>:latest

# Push to ECR
docker push <ecr-uri>:latest

# Deploy to ECS
aws ecs update-service \
  --cluster kicks-shoes-cluster \
  --service kicks-shoes-backend-service \
  --force-new-deployment \
  --region ap-southeast-1
```

📖 **Full Guide**: See `BE-DEVELOPER-GUIDE.md` for detailed instructions

---

## 🏗️ Architecture Diagram

```
┌─────────────┐
│  End User   │
└──────┬──────┘
       │ HTTPS
       ▼
┌──────────────────────────────────────────┐
│         Route53 (DNS)                    │
│    api.kicks-shoes.com → ALB             │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│    WAF (Web Application Firewall)        │
│  • Rate Limiting                         │
│  • OWASP Top 10 Protection               │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│  Application Load Balancer (ALB)         │
│  • HTTPS termination                     │
│  • Health checks                         │
│  • Target group routing                  │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│              VPC                         │
│  ┌────────────────────────────────────┐ │
│  │  Private Subnet (Backend)          │ │
│  │  ┌──────────────────────────────┐  │ │
│  │  │  ECS Fargate Tasks           │  │ │
│  │  │  • Node.js Backend API       │  │ │
│  │  │  • Auto-scaling: 2-10 tasks  │  │ │
│  │  └──────────────────────────────┘  │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Private Subnet (Database)         │ │
│  │  • RDS/DocumentDB (MongoDB)        │ │
│  │  • ElastiCache (Redis)             │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘

External Services:
• ECR (Docker images)
• S3 (File uploads)
• DynamoDB (NoSQL data)
• Secrets Manager (Credentials)
• CloudWatch (Logs & Metrics)
```

---

## 🔐 Security Features

### ✅ Implemented Security Measures

1. **Network Security**
   - ✅ VPC with private subnets
   - ✅ Security groups (least privilege)
   - ✅ No public IP for ECS tasks
   - ✅ NAT Gateway for outbound traffic

2. **Application Security**
   - ✅ Non-root user in Docker container
   - ✅ Multi-stage Docker build
   - ✅ Health checks enabled
   - ✅ Secrets stored in Secrets Manager
   - ✅ IAM roles (no hardcoded credentials)

3. **Load Balancer Security**
   - ✅ HTTPS termination (TLS 1.2+)
   - ✅ WAF protection (rate limiting, OWASP Top 10)
   - ✅ Access logging to S3

4. **Data Security**
   - ✅ Encryption at rest (RDS, S3, DynamoDB)
   - ✅ Encryption in transit (HTTPS, TLS)
   - ✅ Database in private subnet
   - ✅ Secrets rotation (Secrets Manager)

5. **Access Control**
   - ✅ IAM users with least privilege
   - ✅ MFA for production access
   - ✅ CloudTrail audit logging
   - ✅ VPC Flow Logs

---

## 💰 Cost Estimation

### Monthly Costs (Approximate)

| Service | Usage | Cost |
|---------|-------|------|
| **ECS Fargate** | 2 tasks × 0.5 vCPU × 1 GB × 730 hours | $30.00 |
| **Application Load Balancer** | 1 ALB + 100 GB processed | $22.50 |
| **RDS (db.t3.medium)** | 1 instance × 730 hours | $60.00 |
| **ElastiCache (cache.t3.micro)** | 1 node × 730 hours | $12.00 |
| **ECR Storage** | 10 GB images | $1.00 |
| **S3 Storage** | 100 GB uploads | $2.30 |
| **DynamoDB** | 10 GB + 1M requests | $3.00 |
| **CloudWatch Logs** | 10 GB ingestion + storage | $5.50 |
| **Secrets Manager** | 5 secrets | $2.00 |
| **NAT Gateway** | 1 NAT + 100 GB transfer | $37.00 |
| **Data Transfer** | 100 GB outbound | $9.00 |
| **Total** | | **~$184.30/month** |

**Notes:**
- Costs vary by region and usage
- Auto-scaling can increase costs during peak traffic
- Reserved instances can reduce RDS costs by 40-60%
- Consider using MongoDB Atlas instead of RDS for cost savings

---

## 📊 Performance Metrics

### Expected Performance

| Metric | Value |
|--------|-------|
| **API Latency** | < 200ms (p95) |
| **Availability** | 99.95% (ALB + ECS SLA) |
| **Throughput** | 1000+ req/sec (with auto-scaling) |
| **Container Startup** | < 60 seconds |
| **Health Check** | Every 30 seconds |
| **Auto-scaling** | 2-10 tasks (CPU > 70%) |

---

## 🔄 Update & Maintenance

### Update Application

```bash
# Build new version
docker build -t kicks-backend:v1.0.1 .

# Push to ECR
docker tag kicks-backend:v1.0.1 <ecr-uri>:v1.0.1
docker push <ecr-uri>:v1.0.1

# Deploy
aws ecs update-service \
  --cluster kicks-shoes-cluster \
  --service kicks-shoes-backend-service \
  --force-new-deployment \
  --region ap-southeast-1
```

### Update Environment Variables

```bash
# Update secret in Secrets Manager
aws secretsmanager update-secret \
  --secret-id kicks-shoes/backend/database \
  --secret-string '{"MONGODB_URI":"new-connection-string"}' \
  --region ap-southeast-1

# Force new deployment to pick up changes
aws ecs update-service \
  --cluster kicks-shoes-cluster \
  --service kicks-shoes-backend-service \
  --force-new-deployment \
  --region ap-southeast-1
```

### Scale Service

```bash
# Manual scaling
aws ecs update-service \
  --cluster kicks-shoes-cluster \
  --service kicks-shoes-backend-service \
  --desired-count 5 \
  --region ap-southeast-1

# Auto-scaling (ask DevOps to configure)
```

---

## 📞 Support & Contact

### For DevOps Team
- Infrastructure provisioning
- IAM roles and policies
- VPC and security groups
- Database setup
- Auto-scaling configuration
- Monitoring and alerts

### For Backend Developers
- Deployment issues
- AWS credentials
- ECR push errors
- ECS task failures
- Database connection issues
- Environment variables

---

## 🔗 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [AWS Fargate Documentation](https://docs.aws.amazon.com/fargate/)
- [Docker Documentation](https://docs.docker.com/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)

---

## 📝 Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2024-04-23 | 1.0.0 | Initial documentation |

---

**Maintained by:** DevOps Team  
**Last Updated:** 2024-04-23
