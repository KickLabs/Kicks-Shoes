# Backend Deployment Checklist

## 📋 Quick Reference for Backend Developers

### ✅ Before First Deployment

#### 1. Get from DevOps Team
- [ ] AWS Access Key ID
- [ ] AWS Secret Access Key  
- [ ] ECR Repository URI (e.g., `123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/kicks-shoes-backend`)
- [ ] ECS Cluster Name (e.g., `kicks-shoes-cluster`)
- [ ] ECS Service Name (e.g., `kicks-shoes-backend-service`)
- [ ] AWS Region (e.g., `ap-southeast-1`)
- [ ] API Domain (e.g., `api.kicks-shoes.com`)
- [ ] Database connection string (from Secrets Manager)
- [ ] Redis connection details

#### 2. Setup Local Environment
```bash
# Install AWS CLI
# macOS
brew install awscli

# Windows
choco install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version

# Install Docker
# macOS
brew install --cask docker

# Windows
choco install docker-desktop

# Linux
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

#### 3. Configure AWS Credentials
```bash
# Option A: AWS CLI configure
aws configure
# Enter: Access Key ID, Secret Access Key, Region (ap-southeast-1), Output format (json)

# Option B: Environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="ap-southeast-1"
```

#### 4. Create `.env` File
```bash
# Copy from example
cp .env.example .env

# Edit with your values
nano .env
```

#### 5. Add to `.gitignore`
```
.env
.env.local
.env.*.local
.aws-credentials
node_modules/
logs/
uploads/
```

---

## 🚀 Deployment Steps

### Step 1: Test Locally with Docker
```bash
# Build Docker image
docker build -t kicks-backend:test .

# Run container locally
docker run -p 3000:3000 --env-file .env kicks-backend:test

# Test health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":...}
```

### Step 2: Login to ECR
```bash
# Get ECR login command
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.ap-southeast-1.amazonaws.com
```

### Step 3: Build and Tag Image
```bash
# Set variables
ECR_URI="123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/kicks-shoes-backend"
VERSION="v1.0.0"  # or use git commit SHA

# Build image
docker build -t kicks-backend:latest .

# Tag for ECR
docker tag kicks-backend:latest $ECR_URI:latest
docker tag kicks-backend:latest $ECR_URI:$VERSION
```

### Step 4: Push to ECR
```bash
# Push images
docker push $ECR_URI:latest
docker push $ECR_URI:$VERSION

# Verify push
aws ecr list-images --repository-name kicks-shoes-backend --region ap-southeast-1
```

### Step 5: Deploy to ECS
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

### Step 6: Verify Deployment
```bash
# Wait for deployment to complete (2-5 minutes)
# Check service status
aws ecs describe-services \
  --cluster kicks-shoes-cluster \
  --services kicks-shoes-backend-service \
  --region ap-southeast-1 \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'

# Test API endpoint
curl https://api.kicks-shoes.com/api/health

# Check logs
aws logs tail /ecs/kicks-backend --follow --region ap-southeast-1
```

---

## 🤖 Automated Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash

# Configuration
ECR_URI="123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/kicks-shoes-backend"
ECS_CLUSTER="kicks-shoes-cluster"
ECS_SERVICE="kicks-shoes-backend-service"
AWS_REGION="ap-southeast-1"
VERSION=$(git rev-parse --short HEAD)

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Starting backend deployment..."
echo "📦 Version: $VERSION"

# Step 1: Build Docker image
echo "🔨 Building Docker image..."
docker build -t kicks-backend:$VERSION .
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Docker build failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Docker build successful${NC}"

# Step 2: Test image locally
echo "🧪 Testing Docker image..."
CONTAINER_ID=$(docker run -d -p 3001:3000 --env-file .env kicks-backend:$VERSION)
sleep 5
HEALTH_CHECK=$(curl -s http://localhost:3001/api/health | grep -o '"status":"ok"')
docker stop $CONTAINER_ID > /dev/null 2>&1
docker rm $CONTAINER_ID > /dev/null 2>&1

if [ -z "$HEALTH_CHECK" ]; then
  echo -e "${RED}❌ Health check failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Health check passed${NC}"

# Step 3: Login to ECR
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_URI
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ ECR login failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ ECR login successful${NC}"

# Step 4: Tag and push image
echo "📤 Pushing image to ECR..."
docker tag kicks-backend:$VERSION $ECR_URI:$VERSION
docker tag kicks-backend:$VERSION $ECR_URI:latest

docker push $ECR_URI:$VERSION
docker push $ECR_URI:latest

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ ECR push failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Image pushed to ECR${NC}"

# Step 5: Deploy to ECS
echo "🚢 Deploying to ECS..."
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --force-new-deployment \
  --region $AWS_REGION \
  --output json > /dev/null

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ ECS deployment failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ ECS deployment triggered${NC}"

# Step 6: Wait for deployment
echo "⏳ Waiting for deployment to complete..."
echo -e "${YELLOW}This may take 2-5 minutes...${NC}"

for i in {1..30}; do
  RUNNING_COUNT=$(aws ecs describe-services \
    --cluster $ECS_CLUSTER \
    --services $ECS_SERVICE \
    --region $AWS_REGION \
    --query 'services[0].runningCount' \
    --output text)
  
  DESIRED_COUNT=$(aws ecs describe-services \
    --cluster $ECS_CLUSTER \
    --services $ECS_SERVICE \
    --region $AWS_REGION \
    --query 'services[0].desiredCount' \
    --output text)
  
  if [ "$RUNNING_COUNT" == "$DESIRED_COUNT" ]; then
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    break
  fi
  
  echo "⏳ Running: $RUNNING_COUNT / Desired: $DESIRED_COUNT"
  sleep 10
done

# Step 7: Verify deployment
echo "🔍 Verifying deployment..."
sleep 5
API_HEALTH=$(curl -s https://api.kicks-shoes.com/api/health | grep -o '"status":"ok"')

if [ -z "$API_HEALTH" ]; then
  echo -e "${RED}❌ API health check failed${NC}"
  echo "Check logs: aws logs tail /ecs/kicks-backend --follow --region $AWS_REGION"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo "🌐 API URL: https://api.kicks-shoes.com"
echo "📊 Logs: aws logs tail /ecs/kicks-backend --follow --region $AWS_REGION"
echo "📦 Version: $VERSION"
echo ""
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🔧 package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "docker:build": "docker build -t kicks-backend:latest .",
    "docker:run": "docker run -p 3000:3000 --env-file .env kicks-backend:latest",
    "docker:test": "docker run -p 3000:3000 --env-file .env kicks-backend:latest npm test",
    "deploy": "./deploy.sh",
    "deploy:staging": "./deploy-staging.sh",
    "deploy:prod": "./deploy-prod.sh",
    "logs": "aws logs tail /ecs/kicks-backend --follow --region ap-southeast-1"
  }
}
```

Usage:
```bash
npm run deploy
npm run logs
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Access Denied" when pushing to ECR
**Solution:** 
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Re-login to ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin <ecr-uri>
```

### Issue 2: ECS task keeps restarting
**Solution:**
```bash
# Check logs
aws logs tail /ecs/kicks-backend --follow --region ap-southeast-1

# Check task stopped reason
aws ecs describe-tasks \
  --cluster kicks-shoes-cluster \
  --tasks <task-id> \
  --region ap-southeast-1 \
  --query 'tasks[0].stoppedReason'

# Common causes:
# - Missing environment variables
# - Database connection failure
# - Health check failure
# - Out of memory
```

### Issue 3: Cannot connect to database
**Solution:**
```bash
# Verify connection string in Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id kicks-shoes/backend/database \
  --region ap-southeast-1 \
  --query 'SecretString' \
  --output text

# Check security group rules (ask DevOps)
# Verify VPC configuration (ask DevOps)
```

### Issue 4: Docker build fails
**Solution:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t kicks-backend:latest .

# Check Dockerfile syntax
docker build --progress=plain -t kicks-backend:latest .
```

### Issue 5: Health check fails
**Solution:**
```bash
# Test locally
docker run -p 3000:3000 --env-file .env kicks-backend:latest

# Check health endpoint
curl http://localhost:3000/api/health

# Check logs
docker logs <container-id>
```

### Issue 6: Deployment takes too long
**Solution:**
```bash
# Check deployment status
aws ecs describe-services \
  --cluster kicks-shoes-cluster \
  --services kicks-shoes-backend-service \
  --region ap-southeast-1 \
  --query 'services[0].deployments'

# Check task events
aws ecs describe-services \
  --cluster kicks-shoes-cluster \
  --services kicks-shoes-backend-service \
  --region ap-southeast-1 \
  --query 'services[0].events[0:10]'
```

---

## 📊 Monitoring

### Check Service Status
```bash
# Service overview
aws ecs describe-services \
  --cluster kicks-shoes-cluster \
  --services kicks-shoes-backend-service \
  --region ap-southeast-1 \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Pending:pendingCount}'

# List running tasks
aws ecs list-tasks \
  --cluster kicks-shoes-cluster \
  --service-name kicks-shoes-backend-service \
  --region ap-southeast-1
```

### View Logs
```bash
# Tail logs (follow)
aws logs tail /ecs/kicks-backend --follow --region ap-southeast-1

# Filter by error
aws logs tail /ecs/kicks-backend --follow --filter-pattern "ERROR" --region ap-southeast-1

# Get logs from last hour
aws logs tail /ecs/kicks-backend --since 1h --region ap-southeast-1
```

### Check API Health
```bash
# Health check
curl https://api.kicks-shoes.com/api/health

# With headers
curl -I https://api.kicks-shoes.com/api/health

# Test specific endpoint
curl https://api.kicks-shoes.com/api/products
```

---

## 🎯 Best Practices

### ✅ DO
- ✅ Test Docker image locally before pushing
- ✅ Use semantic versioning (v1.0.0, v1.0.1, etc.)
- ✅ Tag images with git commit SHA
- ✅ Check logs after deployment
- ✅ Verify health endpoint after deployment
- ✅ Use multi-stage Docker builds
- ✅ Run as non-root user in container
- ✅ Implement graceful shutdown
- ✅ Use environment variables for configuration
- ✅ Store secrets in AWS Secrets Manager

### ❌ DON'T
- ❌ Don't commit `.env` file to Git
- ❌ Don't use root user in Docker
- ❌ Don't skip health checks
- ❌ Don't use `:latest` tag in production (use specific versions)
- ❌ Don't hardcode environment-specific values
- ❌ Don't ignore error logs
- ❌ Don't deploy without testing locally first
- ❌ Don't skip database migrations

---

## 🔄 Rollback Procedure

### Rollback to Previous Version

```bash
# List recent images
aws ecr describe-images \
  --repository-name kicks-shoes-backend \
  --region ap-southeast-1 \
  --query 'sort_by(imageDetails,& imagePushedAt)[-5:]' \
  --output table

# Update task definition to use previous image
# (Ask DevOps or use AWS Console)

# Or redeploy previous version
docker pull $ECR_URI:v1.0.0
docker tag $ECR_URI:v1.0.0 $ECR_URI:latest
docker push $ECR_URI:latest

aws ecs update-service \
  --cluster kicks-shoes-cluster \
  --service kicks-shoes-backend-service \
  --force-new-deployment \
  --region ap-southeast-1
```

---

## 📞 Need Help?

### Contact DevOps for:
- AWS credentials
- ECR repository URI
- ECS cluster and service names
- Database connection strings
- Secrets Manager access
- IAM role configuration
- VPC and security group issues
- Load balancer configuration
- Auto-scaling settings

### Useful Commands
```bash
# AWS
aws sts get-caller-identity
aws ecr describe-repositories --region ap-southeast-1
aws ecs list-clusters --region ap-southeast-1
aws ecs list-services --cluster kicks-shoes-cluster --region ap-southeast-1
aws secretsmanager list-secrets --region ap-southeast-1

# Docker
docker ps
docker images
docker logs <container-id>
docker exec -it <container-id> /bin/sh
docker system prune -a

# ECS
aws ecs describe-services --cluster kicks-shoes-cluster --services kicks-shoes-backend-service --region ap-southeast-1
aws ecs list-tasks --cluster kicks-shoes-cluster --region ap-southeast-1
aws ecs describe-tasks --cluster kicks-shoes-cluster --tasks <task-id> --region ap-southeast-1

# Logs
aws logs tail /ecs/kicks-backend --follow --region ap-southeast-1
aws logs describe-log-groups --region ap-southeast-1
```

---

## 🔗 Resources

- [Full Developer Guide](./BE-DEVELOPER-GUIDE.md)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [Docker Documentation](https://docs.docker.com/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)

---

**Quick Deploy:**
```bash
# One-liner deployment
docker build -t kicks-backend . && \
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <ecr-uri> && \
docker tag kicks-backend:latest <ecr-uri>:latest && \
docker push <ecr-uri>:latest && \
aws ecs update-service --cluster kicks-shoes-cluster --service kicks-shoes-backend-service --force-new-deployment --region ap-southeast-1
```
