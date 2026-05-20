# 06 — MH5: Async Lambda + Dead Letter Queue

## Pattern Chọn: Async Invocation + DLQ

**Lambda target:** `bedrock-chat` — đã được trigger async bởi DynamoDB Streams. Thêm DLQ (SQS) để catch failed invocations.

**Lý do chọn pattern này:**
- `bedrock-chat` đã là async (DynamoDB Streams trigger = async invocation)
- Không cần thay đổi trigger, chỉ thêm DLQ
- Phù hợp nhất với architecture hiện tại
- Demo failure dễ: mock Bedrock error hoặc invalid payload

---

## Terraform — SQS DLQ

Thêm vào `infra/terraform/environments/dev/02-app/lambda.tf` (hoặc tạo mới):

```hcl
# SQS Dead Letter Queue
resource "aws_sqs_queue" "bedrock_dlq" {
  name                      = "${var.project_name}-bedrock-dlq"
  message_retention_seconds = 1209600  # 14 ngày
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-bedrock-dlq"
  })
}

# IAM Policy cho Lambda gửi message vào DLQ
resource "aws_iam_role_policy" "lambda_dlq" {
  name = "${var.project_name}-lambda-dlq-policy"
  role = aws_iam_role.lambda_bedrock.id  # role của bedrock-chat Lambda

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sqs:SendMessage"]
      Resource = aws_sqs_queue.bedrock_dlq.arn
    }]
  })
}

# Cập nhật Lambda bedrock-chat — thêm DLQ + retry config
resource "aws_lambda_function" "bedrock_chat" {
  # ... existing config ...

  dead_letter_config {
    target_arn = aws_sqs_queue.bedrock_dlq.arn
  }
}

# Event Source Mapping (DynamoDB Streams) — thêm retry config
resource "aws_lambda_event_source_mapping" "dynamodb_stream" {
  event_source_arn  = module.dynamodb.stream_arn
  function_name     = aws_lambda_function.bedrock_chat.arn
  starting_position = "LATEST"
  
  maximum_retry_attempts = 2  # retry 2 lần trước khi vào DLQ
  
  destination_config {
    on_failure {
      destination_arn = aws_sqs_queue.bedrock_dlq.arn
    }
  }
}

output "bedrock_dlq_url" {
  value = aws_sqs_queue.bedrock_dlq.url
}

output "bedrock_dlq_arn" {
  value = aws_sqs_queue.bedrock_dlq.arn
}
```

**Note:** DynamoDB Streams dùng `destination_config.on_failure` thay vì `dead_letter_config` trực tiếp. Cả hai đều cần cấu hình.

---

## Enable DynamoDB Streams

Cập nhật DynamoDB module trong `main.tf`:

```hcl
module "dynamodb" {
  # ... existing config ...
  
  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"
}
```

---

## Demo Failure Flow

### Cách 1: Mock Bedrock error (đơn giản nhất)

Tạm thời set `BEDROCK_KB_ID` sai trong Lambda environment:

```bash
aws lambda update-function-configuration \
  --function-name kicks-shoes-dev-bedrock-chat \
  --environment Variables='{BEDROCK_KB_ID=invalid-kb-id,DYNAMODB_TABLE_NAME=kicks-shoes-dev-table}' \
  --region ap-southeast-1
```

Sau đó gửi message vào DynamoDB để trigger Lambda:

```bash
aws dynamodb put-item \
  --table-name kicks-shoes-dev-table \
  --item '{
    "pk": {"S": "CONV#test-failure-demo"},
    "sk": {"S": "MSG#1715000000"},
    "content": {"S": "test message for DLQ demo"},
    "messageType": {"S": "user"},
    "conversationId": {"S": "test-failure-demo"}
  }' \
  --region ap-southeast-1
```

Lambda sẽ fail (invalid KB ID) → retry 2 lần → message vào DLQ.

### Cách 2: Check DLQ message

```bash
# Receive message từ DLQ
aws sqs receive-message \
  --queue-url <dlq-url> \
  --attribute-names All \
  --message-attribute-names All \
  --region ap-southeast-1
```

Expected output:
```json
{
  "Messages": [{
    "Body": "{\"requestContext\":{\"condition\":\"RetriesExhausted\",...},\"DDBStreamBatchInfo\":{...}}",
    "Attributes": {
      "ApproximateReceiveCount": "1",
      "SentTimestamp": "..."
    }
  }]
}
```

**Restore sau demo:**

```bash
aws lambda update-function-configuration \
  --function-name kicks-shoes-dev-bedrock-chat \
  --environment Variables='{BEDROCK_KB_ID=<real-kb-id>,DYNAMODB_TABLE_NAME=kicks-shoes-dev-table}' \
  --region ap-southeast-1
```

---

## CloudWatch Evidence

```bash
# Xem Lambda errors
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=kicks-shoes-dev-bedrock-chat \
  --start-time 2026-05-13T00:00:00Z \
  --end-time 2026-05-14T00:00:00Z \
  --period 3600 \
  --statistics Sum

# Xem DLQ message count
aws cloudwatch get-metric-statistics \
  --namespace AWS/SQS \
  --metric-name NumberOfMessagesSent \
  --dimensions Name=QueueName,Value=kicks-shoes-dev-bedrock-dlq \
  --start-time 2026-05-13T00:00:00Z \
  --end-time 2026-05-14T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

---

## Evidence Pack — MH5 Section

```markdown
## MH5 — Serverless Scaling Pattern

**Pattern chọn:** Async Invocation + Dead Letter Queue

**Lambda:** kicks-shoes-dev-bedrock-chat
**Trigger:** DynamoDB Streams (async, INSERT events)
**DLQ:** SQS queue kicks-shoes-dev-bedrock-dlq
**Retry:** MaximumRetryAttempts = 2

**Rationale:** bedrock-chat đã là async trigger. DLQ đảm bảo failed AI processing không bị mất — message được giữ 14 ngày để debug hoặc reprocess.

[Screenshot: Lambda configuration — DLQ config]
[Screenshot: Event source mapping — retry config]
[Screenshot: SQS DLQ console — message count > 0]
[Screenshot: DLQ message body với error details]
[Screenshot: CloudWatch Lambda Errors metric]

**Demo flow:**
1. Set BEDROCK_KB_ID = invalid → Lambda fails
2. DynamoDB Streams trigger Lambda → fail → retry 2 lần
3. Sau 2 retry → message vào DLQ
4. aws sqs receive-message → thấy failed event với error details
```
