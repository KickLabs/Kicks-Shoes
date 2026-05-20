# =============================================================================
# W6 MH-COST-A — Automated Cost Guard
# Lambda stops dev EC2/RDS not tagged keep=true
# Triggers: (1) daily EventBridge Scheduler 20:00 UTC, (2) Budgets SNS
# =============================================================================

# IAM Role — least privilege
resource "aws_iam_role" "cost_guard" {
  name = "${var.project_name}-cost-guard-role"

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

resource "aws_iam_role_policy_attachment" "cost_guard_basic" {
  role       = aws_iam_role.cost_guard.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "cost_guard_actions" {
  name = "${var.project_name}-cost-guard-policy"
  role = aws_iam_role.cost_guard.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "StopEC2"
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:StopInstances"
        ]
        Resource = "*"
      },
      {
        Sid    = "StopRDS"
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:StopDBInstance",
          "rds:ListTagsForResource"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "cost_guard" {
  name              = "/aws/lambda/${var.project_name}-cost-guard"
  retention_in_days = 7
  tags              = local.common_tags
}

# Lambda Function
resource "aws_lambda_function" "cost_guard" {
  function_name = "${var.project_name}-cost-guard"
  description   = "Stops dev EC2/RDS not tagged keep=true — daily + Budgets trigger"
  role          = aws_iam_role.cost_guard.arn
  handler       = "index.handler"
  runtime       = "python3.12"
  timeout       = 60
  memory_size   = 128

  filename         = "${path.module}/../../../../../backend/lambda/cost-guard/cost-guard.zip"
  source_code_hash = fileexists("${path.module}/../../../../../backend/lambda/cost-guard/cost-guard.zip") ? filebase64sha256("${path.module}/../../../../../backend/lambda/cost-guard/cost-guard.zip") : null

  depends_on = [aws_cloudwatch_log_group.cost_guard]
  tags       = local.common_tags
}

# EventBridge Scheduler — daily 20:00 UTC
resource "aws_scheduler_schedule" "cost_guard_daily" {
  name       = "${var.project_name}-cost-guard-daily"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "cron(0 20 * * ? *)"

  target {
    arn      = aws_lambda_function.cost_guard.arn
    role_arn = aws_iam_role.scheduler_cost_guard.arn
    input    = jsonencode({ source = "scheduled" })
  }
}

resource "aws_iam_role" "scheduler_cost_guard" {
  name = "${var.project_name}-scheduler-cost-guard-role"

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

resource "aws_iam_role_policy" "scheduler_invoke_cost_guard" {
  name = "invoke-cost-guard"
  role = aws_iam_role.scheduler_cost_guard.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunction"
      Resource = aws_lambda_function.cost_guard.arn
    }]
  })
}

# SNS subscription — Budgets → Lambda cost-guard
resource "aws_sns_topic_subscription" "budgets_to_cost_guard" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.cost_guard.arn
}

resource "aws_lambda_permission" "sns_invoke_cost_guard" {
  statement_id  = "AllowSNSInvokeCostGuard"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cost_guard.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.alerts.arn
}

# Outputs
output "cost_guard_function_name" {
  description = "Cost Guard Lambda function name"
  value       = aws_lambda_function.cost_guard.function_name
}

output "cost_guard_function_arn" {
  description = "Cost Guard Lambda function ARN"
  value       = aws_lambda_function.cost_guard.arn
}
