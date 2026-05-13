# Bedrock Chat Lambda Function

This Lambda function processes chat messages using AWS Bedrock Knowledge Base.

## Architecture

```
DynamoDB Stream (INSERT) → Lambda → Bedrock KB → DynamoDB (AI Response)
```

## Environment Variables

- `BEDROCK_KB_ID`: Bedrock Knowledge Base ID (e.g., `QVO2CHQ1MF`)
- `BEDROCK_REGION`: AWS region for Bedrock (e.g., `us-west-2`)
- `DYNAMODB_TABLE_NAME`: DynamoDB table name for chat messages
- `AWS_REGION`: AWS region for DynamoDB (auto-set by Lambda)

## Build & Deploy

### Build Lambda package:
```bash
cd backend/lambda/bedrock-chat
npm install
zip -r ../bedrock-chat.zip .
```

### Deploy with Terraform:
```bash
cd infra/terraform/environments/dev/02-app
terraform init
terraform plan
terraform apply
```

## Testing

### Test locally with sample event:
```bash
node test-local.js
```

### Test in AWS Console:
1. Go to Lambda console
2. Select `kicks-shoes-bedrock-chat` function
3. Create test event with DynamoDB Stream format
4. Click "Test"

## Monitoring

### CloudWatch Logs:
```
/aws/lambda/kicks-shoes-bedrock-chat
```

### Key Metrics:
- Invocations
- Duration
- Errors
- Throttles
- DynamoDB Stream iterator age

## IAM Permissions

The Lambda function has the following permissions:
- `bedrock:Retrieve` - Query Knowledge Base
- `bedrock:RetrieveAndGenerate` - Generate responses
- `bedrock:InvokeModel` - Use foundation models
- `dynamodb:GetRecords` - Read from stream
- `dynamodb:PutItem` - Save AI responses
- `logs:CreateLogGroup` - Create log groups
- `logs:CreateLogStream` - Create log streams
- `logs:PutLogEvents` - Write logs

## Error Handling

- Lambda retries failed records up to 3 times
- Errors are logged to CloudWatch
- Error messages are saved to DynamoDB with `messageType: 'ai'`

## Performance

- Timeout: 60 seconds
- Memory: 512 MB
- Batch size: 10 messages
- Batching window: 5 seconds

## Security

- All IAM policies follow least privilege principle
- No wildcard resources (`*`)
- Encryption at rest enabled
- VPC configuration optional (for MongoDB access)
