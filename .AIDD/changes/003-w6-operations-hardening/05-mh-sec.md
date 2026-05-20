# 05 — MH-SEC: Self-Healing Security Guard

## Lựa chọn: S3 Public Access Guard + KMS CMK

**Lý do chọn S3 path:**
- S3 uploads bucket đã có trong stack (`kicks-shoes-*-uploads`)
- Block Public Access đã ON — dễ demo bằng cách tắt rồi bật lại
- Remediation API `PutPublicAccessBlock` rõ ràng, deterministic
- Phù hợp với business domain: bucket chứa product images — không được public

---

## Lambda Code (Python)

File: `backend/lambda/security-guard/index.py`

```python
import boto3
import json
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')

def handler(event, context):
    """
    Security Guard Lambda — detects S3 bucket made public and re-enables Block Public Access.
    Triggered by EventBridge rule on CloudTrail PutBucketPolicy / PutBucketAcl events.
    Also works as daily cron scan.
    """
    logger.info(f"Security Guard triggered. Event: {json.dumps(event)}")
    
    remediated = []
    
    # Extract bucket name from CloudTrail event (if triggered by EventBridge)
    buckets_to_check = []
    
    if 'detail' in event and 'requestParameters' in event.get('detail', {}):
        # Triggered by CloudTrail event
        bucket_name = event['detail']['requestParameters'].get('bucketName')
        if bucket_name:
            buckets_to_check = [bucket_name]
            logger.info(f"Checking specific bucket from CloudTrail event: {bucket_name}")
    
    if not buckets_to_check:
        # Scheduled scan — check all project buckets
        project_name = os.environ.get('PROJECT_NAME', 'kicks-shoes')
        response = s3.list_buckets()
        buckets_to_check = [
            b['Name'] for b in response['Buckets']
            if project_name in b['Name']
        ]
        logger.info(f"Scheduled scan — checking {len(buckets_to_check)} project buckets")
    
    for bucket_name in buckets_to_check:
        try:
            # Check current Block Public Access status
            bpa = s3.get_public_access_block(Bucket=bucket_name)
            config = bpa['PublicAccessBlockConfiguration']
            
            is_public = not all([
                config.get('BlockPublicAcls', False),
                config.get('IgnorePublicAcls', False),
                config.get('BlockPublicPolicy', False),
                config.get('RestrictPublicBuckets', False)
            ])
            
            if is_public:
                logger.warning(f"VIOLATION: Bucket {bucket_name} has public access enabled. Remediating...")
                
                # Re-enable all Block Public Access settings
                s3.put_public_access_block(
                    Bucket=bucket_name,
                    PublicAccessBlockConfiguration={
                        'BlockPublicAcls': True,
                        'IgnorePublicAcls': True,
                        'BlockPublicPolicy': True,
                        'RestrictPublicBuckets': True
                    }
                )
                
                logger.info(f"REMEDIATED: Block Public Access re-enabled on {bucket_name}")
                remediated.append(bucket_name)
            else:
                logger.info(f"OK: Bucket {bucket_name} Block Public Access is ON")
                
        except s3.exceptions.NoSuchPublicAccessBlockConfiguration:
            # No BPA config exists — create it
            logger.warning(f"VIOLATION: Bucket {bucket_name} has no Block Public Access config. Creating...")
            s3.put_public_access_block(
                Bucket=bucket_name,
                PublicAccessBlockConfiguration={
                    'BlockPublicAcls': True,
                    'IgnorePublicAcls': True,
                    'BlockPublicPolicy': True,
                    'RestrictPublicBuckets': True
                }
            )
            remediated.append(bucket_name)
        except Exception as e:
            logger.error(f"Error checking bucket {bucket_name}: {e}")
    
    result = {
        'statusCode': 200,
        'remediated': remediated,
        'count': len(remediated)
    }
    logger.info(f"Security Guard complete. Remediated {len(remediated)} buckets: {remediated}")
    return result
```

---

## Terraform: security-guard.tf

```hcl
# =============================================================================
# W6 MH-SEC — Self-Healing Security Guard
# Detects S3 bucket made public → re-enables Block Public Access
# Trigger: EventBridge rule on CloudTrail PutBucketPolicy/PutBucketAcl
# =============================================================================

# IAM Role — least privilege
resource "aws_iam_role" "security_guard" {
  name = "${var.project_name}-security-guard-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "security_guard_basic" {
  role       = aws_iam_role.security_guard.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "security_guard_s3" {
  name = "${var.project_name}-security-guard-s3-policy"
  role = aws_iam_role.security_guard.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3BlockPublicAccess"
        Effect = "Allow"
        Action = [
          "s3:PutPublicAccessBlock",
          "s3:GetPublicAccessBlock",
          "s3:ListAllMyBuckets"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "security_guard" {
  name              = "/aws/lambda/${var.project_name}-security-guard"
  retention_in_days = 7
  tags              = local.common_tags
}

# Lambda Function
resource "aws_lambda_function" "security_guard" {
  function_name = "${var.project_name}-security-guard"
  description   = "Detects S3 public access violations and auto-remediates"
  role          = aws_iam_role.security_guard.arn
  handler       = "index.handler"
  runtime       = "python3.12"
  timeout       = 60
  memory_size   = 128

  filename         = "${path.module}/../../../../backend/lambda/security-guard/security-guard.zip"
  source_code_hash = filebase64sha256("${path.module}/../../../../backend/lambda/security-guard/security-guard.zip")

  environment {
    variables = {
      PROJECT_NAME = var.project_name
    }
  }

  depends_on = [aws_cloudwatch_log_group.security_guard]
  tags       = local.common_tags
}

# EventBridge rule — CloudTrail S3 public access events
# Requires CloudTrail to be enabled (it is by default in workshop accounts)
resource "aws_cloudwatch_event_rule" "s3_public_access" {
  name        = "${var.project_name}-s3-public-access-guard"
  description = "Trigger security guard when S3 bucket policy or ACL changes"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["s3.amazonaws.com"]
      eventName   = ["PutBucketPolicy", "PutBucketAcl", "DeletePublicAccessBlock"]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "security_guard" {
  rule      = aws_cloudwatch_event_rule.s3_public_access.name
  target_id = "SecurityGuardLambda"
  arn       = aws_lambda_function.security_guard.arn
}

resource "aws_lambda_permission" "eventbridge_security_guard" {
  statement_id  = "AllowEventBridgeInvokeSecurityGuard"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.security_guard.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.s3_public_access.arn
}

# Fallback: daily cron scan (same pattern as cost guard)
resource "aws_scheduler_schedule" "security_guard_daily" {
  name       = "${var.project_name}-security-guard-daily"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "cron(0 21 * * ? *)"

  target {
    arn      = aws_lambda_function.security_guard.arn
    role_arn = aws_iam_role.scheduler_security_guard.arn
    input    = jsonencode({ source = "scheduled-scan" })
  }
}

resource "aws_iam_role" "scheduler_security_guard" {
  name = "${var.project_name}-scheduler-security-guard-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "scheduler.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "scheduler_invoke_security_guard" {
  name = "invoke-security-guard"
  role = aws_iam_role.scheduler_security_guard.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunction"
      Resource = aws_lambda_function.security_guard.arn
    }]
  })
}
```

---

## Terraform: kms.tf (Supporting Control — Path A)

```hcl
# =============================================================================
# W6 MH-SEC Supporting Control — KMS Customer Managed Key
# Apply to S3 uploads bucket for audit trail on data access
# =============================================================================

resource "aws_kms_key" "s3_uploads" {
  description             = "CMK for ${var.project_name} S3 uploads bucket"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-s3-cmk"
  })
}

resource "aws_kms_alias" "s3_uploads" {
  name          = "alias/${var.project_name}-s3-uploads"
  target_key_id = aws_kms_key.s3_uploads.key_id
}

output "kms_key_arn" {
  description = "KMS CMK ARN for S3 uploads bucket"
  value       = aws_kms_key.s3_uploads.arn
}

output "kms_key_alias" {
  description = "KMS CMK alias"
  value       = aws_kms_alias.s3_uploads.name
}
```

**Sửa `main.tf` — S3 bucket dùng CMK thay AES256:**

```hcl
module "s3_uploads" {
  # ... existing config ...

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = aws_kms_key.s3_uploads.arn  # CMK thay vì AES256
      }
      bucket_key_enabled = true  # Giảm KMS API calls và cost
    }
  }
}
```

---

## Demo Loop

```bash
# Step 1 — Chụp BEFORE screenshot (Block Public Access ON)
aws s3api get-public-access-block --bucket kicks-shoes-<account-id>-uploads

# Step 2 — Tạo violation (tắt Block Public Access)
aws s3api delete-public-access-block --bucket kicks-shoes-<account-id>-uploads
# Chụp screenshot BEFORE (insecure)

# Step 3 — Trigger Lambda (hoặc chờ EventBridge rule fire)
aws lambda invoke \
  --function-name kicks-shoes-dev-security-guard \
  --payload '{"source":"manual-test"}' \
  response.json

# Step 4 — Verify AFTER (Block Public Access ON lại)
aws s3api get-public-access-block --bucket kicks-shoes-<account-id>-uploads
# Chụp screenshot AFTER (remediated)

# Step 5 — CloudTrail evidence
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=PutPublicAccessBlock \
  --max-results 5
```

---

## Security-Cost Trade-off Statement

**KMS CMK cost:** $1/month per key + $0.03 per 10,000 API calls.

**Justification:** S3 uploads bucket chứa product images và user-uploaded content. CMK cung cấp audit trail đầy đủ — mỗi `kms:Decrypt` event được log trong CloudTrail với IAM principal, timestamp, và resource. Trong trường hợp data breach, audit trail này là bằng chứng pháp lý và compliance requirement. Chi phí $1/month là không đáng kể so với giá trị của audit capability.

**Blast radius nếu không có guard:** Nếu S3 bucket bị make public (do misconfiguration hoặc insider threat), toàn bộ product images và user uploads sẽ accessible publicly — ảnh hưởng đến brand reputation và có thể vi phạm GDPR nếu có PII trong uploads.
