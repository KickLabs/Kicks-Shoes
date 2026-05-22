# =============================================================================
# W6 MH-SEC — Self-Healing Security Guard
# Detects S3 bucket made public → re-enables Block Public Access
# Trigger: EventBridge rule on CloudTrail PutBucketPolicy/PutBucketAcl/DeletePublicAccessBlock
# Fallback: daily cron scan at 21:00 UTC
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

  filename         = "${path.module}/../../../../../backend/lambda/security-guard/security-guard.zip"
  source_code_hash = fileexists("${path.module}/../../../../../backend/lambda/security-guard/security-guard.zip") ? filebase64sha256("${path.module}/../../../../../backend/lambda/security-guard/security-guard.zip") : null

  environment {
    variables = {
      PROJECT_NAME = var.project_name
    }
  }

  depends_on = [aws_cloudwatch_log_group.security_guard]
  tags       = local.common_tags
}

# EventBridge rule — CloudTrail S3 public access events
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

# Fallback: daily cron scan at 21:00 VN
resource "aws_scheduler_schedule" "security_guard_daily" {
  name       = "${var.project_name}-security-guard-daily"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "cron(0 21 * * ? *)"
  schedule_expression_timezone = "Asia/Ho_Chi_Minh"

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

  tags = local.common_tags
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

# Outputs
output "security_guard_function_name" {
  description = "Security Guard Lambda function name"
  value       = aws_lambda_function.security_guard.function_name
}

output "security_guard_function_arn" {
  description = "Security Guard Lambda function ARN"
  value       = aws_lambda_function.security_guard.arn
}
