---
inclusion: manual
---

# AWS Infrastructure Guide

## Architecture Overview

```
Internet → CloudFront → ALB → ECS Fargate (Backend)
                    ↓
              S3 (Frontend static files)

ECS Fargate → MongoDB Atlas (external)
           → DynamoDB (chat messages)
           → S3 (file uploads)
           → Lambda (Bedrock AI chat processor)
           → Bedrock Knowledge Base (AI/RAG)
```

## Terraform Structure

```
infra/terraform/
├── environments/
│   ├── dev/
│   │   ├── 01-network/   # VPC, subnets, security groups (deploy first)
│   │   └── 02-app/       # ECS, ALB, Lambda, DynamoDB (deploy second)
│   ├── demo/
│   └── production/
└── modules/
    ├── network/          # VPC, public/private subnets, IGW, NAT
    ├── alb/              # Application Load Balancer + target groups
    ├── ecs/              # ECS cluster, task definition, service
    ├── autoscaling/      # ECS auto scaling policies
    ├── dynamodb/         # DynamoDB tables + GSIs
    ├── lambda/           # Lambda function + IAM role
    └── iam-roles/        # Shared IAM roles
```

## Deployment Order

Always deploy in this order to avoid dependency issues:

```bash
# 1. Network layer first
cd infra/terraform/environments/dev/01-network
terraform init && terraform apply

# 2. App layer second (depends on network outputs)
cd infra/terraform/environments/dev/02-app
terraform init && terraform apply
```

## GitHub Actions Workflows

| Workflow | File | Trigger | Description |
|---|---|---|---|
| Deploy Dev (two-stack) | `deploy-dev-two-stack.yml` | Manual / push | Deploys network + app stacks to dev |
| Deploy Frontend | `deploy-frontend.yml` | Manual / push | Builds and deploys frontend to S3+CloudFront |
| Deploy | `deploy.yml` | Push to main | Full deployment pipeline |
| Zero TF Deploy | `zero-tf-deploy.yml` | Manual | Destroys all Terraform resources |

## Lambda: Bedrock Chat Processor

- **Location**: `backend/lambda/bedrock-chat/`
- **Trigger**: DynamoDB Streams (INSERT events only)
- **Runtime**: Node.js 20.x
- **Purpose**: Processes user chat messages through Bedrock Knowledge Base and saves AI responses back to DynamoDB

### Build & Deploy Lambda

```bash
# Windows
cd backend/lambda/bedrock-chat
./build.ps1

# Linux/Mac
cd backend/lambda/bedrock-chat
./build.sh
```

### Required Lambda Environment Variables

| Variable | Description |
|---|---|
| `BEDROCK_REGION` | AWS region for Bedrock (e.g., `us-west-2`) |
| `BEDROCK_KB_ID` | Bedrock Knowledge Base ID |
| `BEDROCK_MODEL` | Model ID (e.g., `amazon.nova-2-lite-v1:0`) |
| `DYNAMODB_TABLE_NAME` | DynamoDB table name |
| `AWS_REGION` | AWS region for DynamoDB |

## IAM Policies

- `infra/policy.json` — Base Lambda IAM policy (Bedrock + DynamoDB + CloudWatch)
- `infra/new_policy.json` — Updated policy with `bedrock:GetInferenceProfile` added
- `docs/aws/backend/IAM-POLICY-FOR-BE-DEVELOPER.json` — Policy for backend developers
- `docs/aws/frontend/IAM-POLICY-FOR-FE-DEVELOPER.json` — Policy for frontend developers

## CloudFront

- Config template: `infra/cf-config.json`
- Points to ALB origin for backend API
- Frontend served from S3 via separate CloudFront distribution

## DynamoDB Schema (Chat Messages)

Primary key pattern:
- **PK**: `CONV#<conversationId>`
- **SK**: `MSG#<timestamp>`

GSI available for querying by userId. TTL set to 90 days.

## Useful Scripts

```bash
# Deploy everything (PowerShell)
./scripts/deploy-all.ps1

# Redeploy backend ECS service only
./scripts/redeploy-backend.ps1

# Run k6 load test
k6 run scripts/k6-loadtest.js

# Run all Week 3 AWS tests
./scripts/test-week3-all.ps1
```
