# Lambda Module for Bedrock Chat Processing
# This module creates Lambda function to process chat messages with AWS Bedrock

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Lambda Function
resource "aws_lambda_function" "bedrock_chat" {
  function_name = "${var.project_name}-bedrock-chat"
  description   = "Process chat messages using AWS Bedrock Knowledge Base"
  
  # Deployment package
  filename         = var.lambda_zip_path
  source_code_hash = fileexists(var.lambda_zip_path) ? filebase64sha256(var.lambda_zip_path) : null
  
  # Runtime configuration
  runtime = "nodejs20.x"
  handler = "index.handler"
  timeout = 60
  memory_size = 512
  
  # IAM role
  role = aws_iam_role.lambda_execution.arn
  
  # Environment variables
  environment {
    variables = {
      BEDROCK_KB_ID           = var.bedrock_kb_id
      BEDROCK_REGION          = var.bedrock_region
      DYNAMODB_TABLE_NAME     = var.dynamodb_table_name
      MONGODB_URI             = var.mongodb_uri
      NODE_ENV                = var.environment
    }
  }
  
  # VPC configuration (optional - for accessing MongoDB in VPC)
  dynamic "vpc_config" {
    for_each = var.vpc_config_enabled ? [1] : []
    content {
      subnet_ids         = var.subnet_ids
      security_group_ids = var.security_group_ids
    }
  }
  
  # CloudWatch Logs
  depends_on = [
    aws_cloudwatch_log_group.lambda_logs,
    aws_iam_role_policy_attachment.lambda_logs,
  ]
  
  tags = var.tags
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_name}-bedrock-chat"
  retention_in_days = var.log_retention_days
  
  tags = var.tags
}

# IAM Role for Lambda Execution
resource "aws_iam_role" "lambda_execution" {
  name               = "${var.project_name}-lambda-bedrock-chat-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  
  tags = var.tags
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"
    
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    
    actions = ["sts:AssumeRole"]
  }
}

# IAM Policy for Lambda - Bedrock Access
resource "aws_iam_role_policy" "bedrock_access" {
  name   = "bedrock-access"
  role   = aws_iam_role.lambda_execution.id
  policy = data.aws_iam_policy_document.bedrock_access.json
}

data "aws_iam_policy_document" "bedrock_access" {
  # Bedrock Knowledge Base - Retrieve and Generate
  statement {
    sid    = "BedrockKnowledgeBaseAccess"
    effect = "Allow"
    actions = [
      "bedrock:Retrieve",
      "bedrock:RetrieveAndGenerate"
    ]
    resources = [
      "arn:aws:bedrock:${var.bedrock_region}:${data.aws_caller_identity.current.account_id}:knowledge-base/${var.bedrock_kb_id}"
    ]
  }
  
  # Bedrock Model Invocation (for RetrieveAndGenerate)
  statement {
    sid    = "BedrockModelInvoke"
    effect = "Allow"
    actions = [
      "bedrock:InvokeModel"
    ]
    resources = [
      "arn:aws:bedrock:${var.bedrock_region}::foundation-model/*"
    ]
  }
}

# IAM Policy for Lambda - DynamoDB Access
resource "aws_iam_role_policy" "dynamodb_access" {
  name   = "dynamodb-access"
  role   = aws_iam_role.lambda_execution.id
  policy = data.aws_iam_policy_document.dynamodb_access.json
}

data "aws_iam_policy_document" "dynamodb_access" {
  statement {
    sid    = "DynamoDBStreamRead"
    effect = "Allow"
    actions = [
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:DescribeStream",
      "dynamodb:ListStreams"
    ]
    resources = [
      "${var.dynamodb_table_arn}/stream/*"
    ]
  }
  
  statement {
    sid    = "DynamoDBTableWrite"
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query"
    ]
    resources = [
      var.dynamodb_table_arn,
      "${var.dynamodb_table_arn}/index/*"
    ]
  }
}

# IAM Policy for Lambda - CloudWatch Logs
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# IAM Policy for Lambda - VPC Access (if enabled)
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  count      = var.vpc_config_enabled ? 1 : 0
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# =============================================================================
# W6 MH-OBS: IAM Policy for Lambda — CloudWatch PutMetricData
# Allows bedrock-chat to publish custom metrics (BedrockQueryLatencyMs, etc.)
# =============================================================================
resource "aws_iam_role_policy" "cloudwatch_metrics" {
  name = "cloudwatch-metrics"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "PutCustomMetrics"
      Effect   = "Allow"
      Action   = ["cloudwatch:PutMetricData"]
      Resource = "*"
      Condition = {
        StringEquals = {
          "cloudwatch:namespace" = "KicksShoes/Operations"
        }
      }
    }]
  })
}

# DynamoDB Event Source Mapping
resource "aws_lambda_event_source_mapping" "dynamodb_stream" {
  event_source_arn  = var.dynamodb_stream_arn
  function_name     = aws_lambda_function.bedrock_chat.arn
  starting_position = "LATEST"

  # Batch configuration
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5

  # W5 MH5: retry 2 times then send to DLQ
  maximum_retry_attempts = 2

  # W5 MH5: failed events go to SQS DLQ
  destination_config {
    on_failure {
      destination_arn = aws_sqs_queue.bedrock_dlq.arn
    }
  }

  # Filter only INSERT events (new messages)
  filter_criteria {
    filter {
      pattern = jsonencode({
        eventName = ["INSERT"]
      })
    }
  }

  depends_on = [
    aws_iam_role_policy.dynamodb_access,
    aws_iam_role_policy.dlq_access,
  ]
}

# =============================================================================
# W5 MH5 — Async Invocation + Dead Letter Queue
# bedrock-chat is already async (DynamoDB Streams trigger)
# Add SQS DLQ to catch failed invocations after retries exhausted
# =============================================================================

resource "aws_sqs_queue" "bedrock_dlq" {
  name                      = "${var.project_name}-bedrock-dlq"
  message_retention_seconds = 1209600 # 14 days
  visibility_timeout_seconds = 300

  tags = merge(var.tags, {
    Name    = "${var.project_name}-bedrock-dlq"
    Purpose = "Dead Letter Queue for failed bedrock-chat Lambda invocations"
  })
}

# IAM policy — allow Lambda to send messages to DLQ
resource "aws_iam_role_policy" "dlq_access" {
  name = "dlq-access"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "SendToDLQ"
      Effect   = "Allow"
      Action   = ["sqs:SendMessage"]
      Resource = aws_sqs_queue.bedrock_dlq.arn
    }]
  })
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}
