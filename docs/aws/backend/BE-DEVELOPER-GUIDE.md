# Backend Developer Guide - AWS Infrastructure

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [What You Need from DevOps](#what-you-need-from-devops)
4. [Deployment Options](#deployment-options)
5. [Environment Variables](#environment-variables)
6. [IAM Permissions Required](#iam-permissions-required)
7. [CI/CD Integration](#cicd-integration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## 🎯 Overview

**Architecture**: User → Route53 → ALB → ECS Fargate → Backend API

**Your Role**: 
- Build Docker image
- Push to ECR (Elastic Container Registry)
- Deploy to ECS (Elastic Container Service)
- Manage environment variables
- Monitor application health

**DevOps Role**: 
- Manage infrastructure (VPC, ALB, ECS, RDS, ElastiCache)
- Setup IAM roles and policies
- Configure auto-scaling
- Setup monitoring and alerts

---

## 🏗️ Architecture

### **High-Level Architecture**

```
┌─────────────┐
│  End User   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────────────────────────────┐
│                    Route53 (DNS)                        │
│              api.kicks-shoes.com → ALB                  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  WAF (Web Application Firewall)         │
│  • Rate Limiting: 2000 req/5min per IP                 │
│  • OWASP Top 10 Protection                              │
│  • SQL Injection, XSS Protection                        │
│  • Geo-blocking (optional)                              │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│         Application Load Balancer (ALB)                 │
│  • HTTPS termination (SSL/TLS)                          │
│  • Health checks                                        │
│  • Target group routing                                 │
│  • Access logging to S3                                 │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    VPC (Virtual Private Cloud)          │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │         Public Subnet (AZ-A)                      │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  NAT Gateway                                 │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │         Private Subnet (Backend) - AZ-A           │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  ECS Fargate Task (Container)               │ │ │
│  │  │  • Node.js Backend API                      │ │ │
│  │  │  • Port 3000                                 │ │ │
│  │  │  • Auto-scaling: 2-10 tasks                 │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │         Private Subnet (Database) - AZ-A          │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  RDS (MongoDB-compatible DocumentDB)        │ │ │
│  │  │  or MongoDB Atlas (external)                │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  ElastiCache (Redis)                        │ │ │
│  │  │  • Session storage                          │ │ │
│  │  │  • Caching layer                            │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              External Services (Outside VPC)            │
│  • S3 (File uploads)                                    │
│  • DynamoDB (NoSQL data)                                │
│  • CloudWatch (Logs & Metrics)                          │
│  • Secrets Manager (Credentials)                        │
│  • ECR (Docker images)                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 What You Need from DevOps

### 1. **ECR Repository Information**

```bash
# ECR Repository URI
ECR_REPOSITORY_URI="123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/kicks-shoes-backend"

# AWS Region
AWS_REGION="ap-southeast-1"

# ECR Repository Name
ECR_REPOSITORY_NAME="kicks-shoes-backend"
```

**How to get it:**
```bash
# List ECR repositories
aws ecr describe-repositories --region ap-southeast-1

# Get specific repository URI
aws ecr describe-repositories \
  --repository-names kicks-shoes-backend \
  --region ap-southeast-1 \
  --query 'repositories[0].repositoryUri' \
  --output text
```

---

### 2. **ECS Cluster Information**

```bash
# ECS Cluster Name
ECS_CLUSTER_NAME="kicks-shoes-cluster"

# ECS Service Name
ECS_SERVICE_NAME="kicks-shoes-backend-service"

# ECS Task Definition Family
ECS_TASK_FAMILY="kicks-shoes-backend-task"
```

**How to get it:**
```bash
# List ECS clusters
aws ecs list-clusters --region ap-southeast-1

# List services in cluster
aws ecs list-services \
  --cluster kicks-shoes-cluster \
  --region ap-southeast-1
```

---

### 3. **Load Balancer Information**

```bash
# ALB DNS Name
ALB_DNS_NAME="kicks-alb-1234567890.ap-southeast-1.elb.amazonaws.com"

# ALB Target Group ARN
TARGET_GROUP_ARN="arn:aws:elasticloadbalancing:ap-southeast-1:123456789012:targetgroup/kicks-backend-tg/1234567890abcdef"

# Custom Domain (if configured)
API_DOMAIN="api.kicks-shoes.com"
```

---

### 4. **Database Connection Strings**

```bash
# MongoDB Connection String (from Secrets Manager)
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/kicks-shoes"

# Or DocumentDB (AWS-managed MongoDB-compatible)
MONGODB_URI="mongodb://username:password@docdb-cluster.cluster-abc123.ap-southeast-1.docdb.amazonaws.com:27017/kicks-shoes?tls=true&replicaSet=rs0"

# Redis Connection (ElastiCache)
REDIS_HOST="kicks-redis.abc123.0001.apse1.cache.amazonaws.com"
REDIS_PORT="6379"
```

---

### 5. **AWS Secrets Manager Secret Names**

```bash
# Secret names for environment variables
SECRET_NAME_DB="kicks-shoes/backend/database"
SECRET_NAME_JWT="kicks-shoes/backend/jwt"
SECRET_NAME_GOOGLE="kicks-shoes/backend/google"
SECRET_NAME_PAYMENT="kicks-shoes/backend/payment"
```

---

### 6. **S3 Bucket for Uploads**

```bash
# S3 Bucket Name
S3_BUCKET_NAME="kicks-shoes-uploads"

# S3 Bucket Region
S3_BUCKET_REGION="ap-southeast-1"
```

---

### 7. **IAM Role ARN for ECS Task**

```bash
# ECS Task Execution Role (for pulling images, logs)
TASK_EXECUTION_ROLE_ARN="arn:aws:iam::123456789012:role/ecsTaskExecutionRole"

# ECS Task Role (for accessing S3, DynamoDB, Secrets Manager)
TASK_ROLE_ARN="arn:aws:iam::123456789012:role/kicks-backend-task-role"
```

---

## 🚀 Deployment Options

### **Option 1: Docker + ECR + ECS (Recommended for Production)**

#### **Step 1: Build Docker Image**

```bash
# Build Docker image
docker build -t kicks-shoes-backend:latest .

# Test locally
docker run -p 3000:3000 --env-file .env kicks-shoes-backend:latest

# Verify
curl http://localhost:3000/api/health
```

---

#### **Step 2: Push to ECR**

```bash
# Login to ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.ap-southeast-1.amazonaws.com

# Tag image
docker tag kicks-shoes-backend:latest \
  123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/kicks-shoes-backend:latest

# Push to ECR
docker push 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/kicks-shoes-backend:latest

# Tag with version (optional)
docker tag kicks-shoes-backend:latest \
  123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/kicks-shoes-backend:v1.0.0

docker push 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/kicks-shoes-backend:v1.0.0
```

---

#### **Step 3: Deploy to ECS**

```bash
# Force new deployment (pulls latest image)
aws ecs update-service \
  --cluster kicks-shoes-cluster \
  --service kicks-shoes-backend-service \
  --force-new-deployment \
  --region ap-southeast-1

# Check deployment status
aws ecs describe-services \
  --cluster kicks-shoes-cluster \
  --services kicks-shoes-backend-service \
  --region ap-southeast-1 \
  --query 'services[0].deployments'
```

---

### **Option 2: Direct EC2 Deployment (Not Recommended)**

If using EC2 instead of ECS:

```bash
# SSH to EC2 instance
ssh -i your-key.pem ec2-user@ec2-instance-ip

# Pull latest code
cd /app/kicks-shoes-backend
git pull origin main

# Install dependencies
npm ci --only=production

# Restart application (using PM2)
pm2 restart kicks-backend

# Or using systemd
sudo systemctl restart kicks-backend
```

---

## 🔧 Environment Variables

### **Environment Variables Structure**

Environment variables should be stored in **AWS Secrets Manager** for security.

#### **1. Server Configuration**
```bash
PORT=3000
NODE_ENV=production
HOST=0.0.0.0
```

#### **2. Database Configuration**
```bash
# MongoDB (from Secrets Manager)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kicks-shoes

# Or DocumentDB
MONGODB_URI=mongodb://username:password@docdb-cluster.cluster-abc123.ap-southeast-1.docdb.amazonaws.com:27017/kicks-shoes?tls=true&replicaSet=rs0
```

#### **3. Redis Configuration**
```bash
REDIS_HOST=kicks-redis.abc123.0001.apse1.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

#### **4. JWT Configuration**
```bash
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_refresh_token_secret_key_here
JWT_REFRESH_EXPIRES_IN=7d
```

#### **5. AWS Configuration**
```bash
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE  # Not needed if using IAM role
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  # Not needed if using IAM role

# S3 Configuration
AWS_S3_BUCKET=kicks-shoes-uploads
USE_S3_UPLOAD=true
UPLOAD_STRATEGY=s3

# DynamoDB Configuration
DYNAMODB_TABLE_NAME=kicks-health
DYNAMODB_TABLE_USERS=kicks-users
DYNAMODB_TABLE_PRODUCTS=kicks-products
DYNAMODB_TABLE_ORDERS=kicks-orders
DYNAMODB_TABLE_SESSIONS=kicks-sessions
```

#### **6. Email Configuration**
```bash
GOOGLE_MAILER_CLIENT_ID=your_google_client_id
GOOGLE_MAILER_CLIENT_SECRET=your_google_client_secret
GOOGLE_MAILER_REFRESH_TOKEN=your_google_refresh_token
FROM_NAME=Kicks Shoes
ADMIN_EMAIL_ADDRESS=admin@kicks-shoes.com
```

#### **7. Frontend URL**
```bash
FRONTEND_URL=https://www.kicks-shoes.com
CLOUDFRONT_URL=https://d3k5cm2ny387y1.cloudfront.net
ALLOW_ANY_CLOUDFRONT=false
```

#### **8. Payment Gateway Configuration**
```bash
# VNPay
VNPAY_HOST=https://sandbox.vnpayment.vn
VNPAY_TMN_CODE=your_vnpay_tmn_code
VNPAY_SECURE_SECRET=your_vnpay_secure_secret
VNPAY_RETURN_URL=https://www.kicks-shoes.com/payment/success
VNPAY_IPN_URL=https://api.kicks-shoes.com/api/payment/vnpay/ipn

# PayOS
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
```

#### **9. Google AI Configuration**
```bash
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_AI_API_KEY=your_google_ai_key
GOOGLE_AI_MODEL=gemini-2.0-flash
```

#### **10. Cloudinary Configuration**
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

### **How to Store Secrets in AWS Secrets Manager**

```bash
# Create secret for database
aws secretsmanager create-secret \
  --name kicks-shoes/backend/database \
  --description "Database connection string" \
  --secret-string '{"MONGODB_URI":"mongodb+srv://..."}' \
  --region ap-southeast-1

# Create secret for JWT
aws secretsmanager create-secret \
  --name kicks-shoes/backend/jwt \
  --description "JWT secrets" \
  --secret-string '{"JWT_SECRET":"...","JWT_REFRESH_SECRET":"..."}' \
  --region ap-southeast-1

# Update secret
aws secretsmanager update-secret \
  --secret-id kicks-shoes/backend/database \
  --secret-string '{"MONGODB_URI":"mongodb+srv://new-connection-string"}' \
  --region ap-southeast-1

# Retrieve secret
aws secretsmanager get-secret-value \
  --secret-id kicks-shoes/backend/database \
  --region ap-southeast-1 \
  --query 'SecretString' \
  --output text
```

---

## 🔐 IAM Permissions Required

### **1. IAM User for CI/CD (be_developer)**

DevOps should create an IAM user with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRAccess",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECSDeployAccess",
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTasks",
        "ecs:ListTasks",
        "ecs:RegisterTaskDefinition",
        "ecs:DescribeTaskDefinition"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMPassRole",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": [
        "arn:aws:iam::*:role/ecsTaskExecutionRole",
        "arn:aws:iam::*:role/kicks-backend-task-role"
      ]
    },
    {
      "Sid": "SecretsManagerReadAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:kicks-shoes/*"
    }
  ]
}
```

---

### **2. ECS Task Role (for Backend Application)**

This role is attached to ECS tasks and allows the backend to access AWS services:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3UploadAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::kicks-shoes-uploads/*"
    },
    {
      "Sid": "S3ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::kicks-shoes-uploads"
    },
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/kicks-health",
        "arn:aws:dynamodb:*:*:table/kicks-users",
        "arn:aws:dynamodb:*:*:table/kicks-products",
        "arn:aws:dynamodb:*:*:table/kicks-orders",
        "arn:aws:dynamodb:*:*:table/kicks-sessions"
      ]
    },
    {
      "Sid": "SecretsManagerAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:kicks-shoes/*"
    },
    {
      "Sid": "CloudWatchLogsAccess",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/ecs/kicks-backend:*"
    }
  ]
}
```

---

## 🤖 CI/CD Integration

### **GitHub Actions Example**

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to AWS ECS

on:
  push:
    branches:
      - main
      - production
    paths:
      - 'backend/**'

env:
  AWS_REGION: ap-southeast-1
  ECR_REPOSITORY: kicks-shoes-backend
  ECS_CLUSTER: kicks-shoes-cluster
  ECS_SERVICE: kicks-shoes-backend-service
  ECS_TASK_DEFINITION: kicks-shoes-backend-task
  CONTAINER_NAME: kicks-backend

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT
      
      - name: Download task definition
        run: |
          aws ecs describe-task-definition \
            --task-definition ${{ env.ECS_TASK_DEFINITION }} \
            --query taskDefinition > task-definition.json
      
      - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ steps.build-image.outputs.image }}
      
      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
      
      - name: Deployment complete
        run: |
          echo "✅ Deployment successful!"
          echo "🌐 API URL: https://api.kicks-shoes.com"
```

---

### **GitLab CI Example**

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - deploy

variables:
  AWS_REGION: ap-southeast-1
  ECR_REPOSITORY: kicks-shoes-backend
  ECS_CLUSTER: kicks-shoes-cluster
  ECS_SERVICE: kicks-shoes-backend-service

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - apk add --no-cache python3 py3-pip
    - pip3 install awscli
    - aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
  script:
    - cd backend
    - docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$CI_COMMIT_SHA .
    - docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$CI_COMMIT_SHA $ECR_REGISTRY/$ECR_REPOSITORY:latest
    - docker push $ECR_REGISTRY/$ECR_REPOSITORY:$CI_COMMIT_SHA
    - docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
  only:
    - main
    - production

deploy:
  stage: deploy
  image: amazon/aws-cli:latest
  script:
    - aws ecs update-service 
        --cluster $ECS_CLUSTER 
        --service $ECS_SERVICE 
        --force-new-deployment 
        --region $AWS_REGION
    - echo "✅ Deployment triggered successfully"
  only:
    - main
    - production
```

---

## 📊 Monitoring & Logging

### **1. CloudWatch Logs**

```bash
# View logs
aws logs tail /ecs/kicks-backend --follow --region ap-southeast-1

# Filter logs by error
aws logs filter-log-events \
  --log-group-name /ecs/kicks-backend \
  --filter-pattern "ERROR" \
  --region ap-southeast-1

# Get logs for specific time range
aws logs filter-log-events \
  --log-group-name /ecs/kicks-backend \
  --start-time $(date -u -d '1 hour ago' +%s)000 \
  --end-time $(date -u +%s)000 \
  --region ap-southeast-1
```

---

### **2. ECS Service Metrics**

```bash
# Check service status
aws ecs describe-services \
  --cluster kicks-shoes-cluster \
  --services kicks-shoes-backend-service \
  --region ap-southeast-1

# List running tasks
aws ecs list-tasks \
  --cluster kicks-shoes-cluster \
  --service-name kicks-shoes-backend-service \
  --region ap-southeast-1

# Describe specific task
aws ecs describe-tasks \
  --cluster kicks-shoes-cluster \
  --tasks <task-id> \
  --region ap-southeast-1
```

---

### **3. Application Health Check**

```bash
# Health check endpoint
curl https://api.kicks-shoes.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-04-23T12:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected"
}
```

---

## 🐛 Troubleshooting

### **Problem 1: "Access Denied" when pushing to ECR**

**Cause:** IAM user doesn't have ECR permissions

**Solution:**
```bash
# Ask DevOps to add ECR permissions
# Or verify credentials
aws sts get-caller-identity
```

---

### **Problem 2: ECS Task keeps restarting**

**Cause:** Application crash, health check failure, or missing environment variables

**Solution:**
```bash
# Check task logs
aws logs tail /ecs/kicks-backend --follow

# Check task stopped reason
aws ecs describe-tasks \
  --cluster kicks-shoes-cluster \
  --tasks <task-id> \
  --query 'tasks[0].stoppedReason'
```

---

### **Problem 3: Cannot connect to database**

**Cause:** Security group rules, wrong connection string, or network configuration

**Solution:**
```bash
# Verify security group allows traffic from ECS tasks
# Check connection string in Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id kicks-shoes/backend/database \
  --query 'SecretString' \
  --output text
```

---

### **Problem 4: High memory/CPU usage**

**Cause:** Memory leak, inefficient code, or insufficient resources

**Solution:**
```bash
# Check CloudWatch metrics
# Ask DevOps to increase task CPU/memory
# Or scale out (increase task count)
```

---

## 🎯 Best Practices

### ✅ DO
- ✅ Use AWS Secrets Manager for sensitive data
- ✅ Use IAM roles instead of access keys
- ✅ Implement health check endpoint
- ✅ Use structured logging (JSON format)
- ✅ Tag Docker images with version/commit SHA
- ✅ Test Docker image locally before pushing
- ✅ Use multi-stage Docker builds
- ✅ Run as non-root user in container
- ✅ Implement graceful shutdown
- ✅ Use connection pooling for database

### ❌ DON'T
- ❌ Don't commit secrets to Git
- ❌ Don't use root user in Docker
- ❌ Don't hardcode environment-specific values
- ❌ Don't skip health checks
- ❌ Don't ignore error logs
- ❌ Don't use `:latest` tag in production (use specific versions)

---

## 📞 Need Help?

### Contact DevOps for:
- AWS credentials (Access Key ID, Secret Access Key)
- ECR repository URI
- ECS cluster and service names
- Database connection strings
- Secrets Manager secret names
- IAM role ARNs
- Load balancer DNS name
- VPC and security group configuration

---

## 🔗 Useful Commands

```bash
# Docker
docker build -t kicks-backend .
docker run -p 3000:3000 --env-file .env kicks-backend
docker logs <container-id>

# AWS ECR
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <ecr-uri>
aws ecr describe-repositories
aws ecr list-images --repository-name kicks-shoes-backend

# AWS ECS
aws ecs list-clusters
aws ecs list-services --cluster kicks-shoes-cluster
aws ecs describe-services --cluster kicks-shoes-cluster --services kicks-shoes-backend-service
aws ecs update-service --cluster kicks-shoes-cluster --service kicks-shoes-backend-service --force-new-deployment

# AWS Secrets Manager
aws secretsmanager list-secrets
aws secretsmanager get-secret-value --secret-id kicks-shoes/backend/database

# AWS CloudWatch Logs
aws logs tail /ecs/kicks-backend --follow
aws logs describe-log-groups
```

---

**Last Updated:** 2024-04-23  
**Version:** 1.0.0
