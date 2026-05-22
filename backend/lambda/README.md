# Lambda Functions

This directory contains AWS Lambda functions for the Kicks Shoes project.

## 📁 Structure

```
lambda/
├── bedrock-chat/          # Bedrock Knowledge Base chat processor
│   ├── index.js          # Lambda handler
│   ├── package.json      # Dependencies
│   ├── build.sh          # Build script (Linux/Mac)
│   ├── build.ps1         # Build script (Windows)
│   └── README.md         # Documentation
└── README.md             # This file
```

## 🚀 Functions

### bedrock-chat

**Purpose:** Process chat messages using AWS Bedrock Knowledge Base

**Trigger:** DynamoDB Stream (INSERT events)

**Runtime:** Node.js 20.x

**Region:** us-west-2 (same as Bedrock KB)

**Key Features:**
- Receives messages from DynamoDB Stream
- Calls Bedrock Knowledge Base (ID: QVO2CHQ1MF)
- Saves AI responses back to DynamoDB
- Logs to CloudWatch

**Documentation:** See `bedrock-chat/README.md`

## 🔨 Build

### Build Single Function

**Windows:**
```powershell
cd bedrock-chat
.\build.ps1
```

**Linux/Mac:**
```bash
cd bedrock-chat
chmod +x build.sh
./build.sh
```

### Build All Functions

**Windows:**
```powershell
cd ..
.\deploy-week3.ps1
```

**Linux/Mac:**
```bash
cd ..
./deploy-week3.sh
```

## 📦 Deployment

Lambda functions are deployed via Terraform:

```bash
cd ../../infra/terraform/environments/dev/02-app
terraform init
terraform plan
terraform apply
```

## 🧪 Testing

### Test Locally

```bash
cd bedrock-chat
node test-local.js
```

### Test in AWS

```bash
# Invoke function
aws lambda invoke \
  --function-name kicks-shoes-bedrock-chat \
  --region us-west-2 \
  --payload '{"Records":[...]}' \
  response.json

# Check logs
aws logs tail /aws/lambda/kicks-shoes-bedrock-chat --follow --region us-west-2
```

## 📊 Monitoring

### CloudWatch Logs

- **bedrock-chat:** `/aws/lambda/kicks-shoes-bedrock-chat`

### Metrics

- Invocations
- Duration
- Errors
- Throttles
- Concurrent Executions

## 🔒 Security

All Lambda functions follow security best practices:

- ✅ Least privilege IAM policies
- ✅ No wildcard resources
- ✅ Encryption at rest
- ✅ VPC configuration (optional)
- ✅ Environment variable encryption

## 📚 Documentation

- **Quick Start:** `../../WEEK3-QUICKSTART.md`
- **Full Guide:** `../documents/aws_deployment/LAMBDA-BEDROCK-DEPLOYMENT.md`
- **Implementation Summary:** `../../.AIDD/WEEK3-IMPLEMENTATION-SUMMARY.md`

## 💡 Tips

1. Lambda logs are in **us-west-2** (same region as Bedrock)
2. DynamoDB is in **ap-southeast-1** (same region as backend)
3. Use `deploy-week3.ps1` for quick build + deploy
4. Check CloudWatch Logs for debugging

## 🐛 Troubleshooting

### Lambda not triggered

```bash
# Check event source mapping
aws lambda list-event-source-mappings \
  --function-name kicks-shoes-bedrock-chat \
  --region us-west-2
```

### Bedrock access denied

```bash
# Check IAM policy
aws iam get-role-policy \
  --role-name kicks-shoes-lambda-bedrock-chat-role \
  --policy-name bedrock-access \
  --region us-west-2
```

### DynamoDB write error

```bash
# Check IAM policy
aws iam get-role-policy \
  --role-name kicks-shoes-lambda-bedrock-chat-role \
  --policy-name dynamodb-access \
  --region us-west-2
```

## 📈 Performance

| Function | Memory | Timeout | Avg Duration | Cost/1M |
|----------|--------|---------|--------------|---------|
| bedrock-chat | 512 MB | 60s | ~3s | $10 |

## 🎯 Week 3 Requirements

- ✅ Lambda function deployed
- ✅ Bedrock integration
- ✅ DynamoDB Stream trigger
- ✅ CloudWatch Logs
- ✅ IAM least privilege
- ✅ No wildcard resources

---

**For detailed documentation, see individual function README files.**
