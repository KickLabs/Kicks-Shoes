# 03 — MH-COST-A: Cost Guard Lambda

## Lambda Code (Python)

File: `backend/lambda/cost-guard/index.py`

```python
import boto3
import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ec2 = boto3.client('ec2')
rds = boto3.client('rds')

def handler(event, context):
    """
    Cost Guard Lambda — stops EC2/RDS instances NOT tagged keep=true.
    Triggered by:
    1. EventBridge Scheduler (daily cron)
    2. SNS from AWS Budgets (cost-driven path)
    """
    logger.info(f"Cost Guard triggered. Event: {json.dumps(event)}")
    
    stopped_resources = []
    
    # --- Stop EC2 instances ---
    ec2_response = ec2.describe_instances(
        Filters=[
            {'Name': 'instance-state-name', 'Values': ['running']},
            {'Name': 'tag:Environment', 'Values': ['dev']}
        ]
    )
    
    for reservation in ec2_response['Reservations']:
        for instance in reservation['Instances']:
            instance_id = instance['InstanceId']
            tags = {t['Key']: t['Value'] for t in instance.get('Tags', [])}
            
            # Skip instances tagged keep=true
            if tags.get('keep', '').lower() == 'true':
                logger.info(f"Skipping EC2 {instance_id} (keep=true)")
                continue
            
            logger.info(f"Stopping EC2 instance: {instance_id}")
            ec2.stop_instances(InstanceIds=[instance_id])
            stopped_resources.append({'type': 'EC2', 'id': instance_id})
    
    # --- Stop RDS instances ---
    rds_response = rds.describe_db_instances()
    
    for db in rds_response['DBInstances']:
        if db['DBInstanceStatus'] != 'available':
            continue
        
        db_id = db['DBInstanceIdentifier']
        tags_response = rds.list_tags_for_resource(ResourceName=db['DBInstanceArn'])
        tags = {t['Key']: t['Value'] for t in tags_response['TagList']}
        
        # Only stop dev instances not tagged keep=true
        if tags.get('Environment', '') == 'dev' and tags.get('keep', '').lower() != 'true':
            logger.info(f"Stopping RDS instance: {db_id}")
            rds.stop_db_instance(DBInstanceIdentifier=db_id)
            stopped_resources.append({'type': 'RDS', 'id': db_id})
    
    result = {
        'statusCode': 200,
        'stopped': stopped_resources,
        'count': len(stopped_resources)
    }
    logger.info(f"Cost Guard complete. Stopped {len(stopped_resources)} resources: {stopped_resources}")
    return result
```

## Terraform: cost-guard.tf

```hcl
# =============================================================================
# W6 MH-COST-A — Automated Cost Guard
# Lambda stops dev EC2/RDS not tagged keep=true
# Triggers: (1) daily EventBridge cron, (2) Budgets SNS
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
        Condition = {
          StringEquals = {
            "ec2:ResourceTag/Environment" = "dev"
          }
        }
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

  filename         = "${path.module}/../../../../backend/lambda/cost-guard/cost-guard.zip"
  source_code_hash = filebase64sha256("${path.module}/../../../../backend/lambda/cost-guard/cost-guard.zip")

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

# SNS subscription — Budgets → Lambda
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
```

## Terraform: budgets.tf

```hcl
# =============================================================================
# W6 MH-COST-A — AWS Budgets daily $150 → SNS → Lambda cost-guard
# =============================================================================

resource "aws_budgets_budget" "daily_cost_cap" {
  name         = "${var.project_name}-daily-150-cap"
  budget_type  = "COST"
  limit_amount = "150"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"  # DAILY không available cho cost budgets — dùng MONTHLY

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns  = [aws_sns_topic.alerts.arn]
  }
}

# SNS topic policy — allow Budgets to publish
resource "aws_sns_topic_policy" "alerts_budgets" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowBudgetsPublish"
      Effect = "Allow"
      Principal = {
        Service = "budgets.amazonaws.com"
      }
      Action   = "SNS:Publish"
      Resource = aws_sns_topic.alerts.arn
    }]
  })
}
```

## ADR — Cost Data Latency

**Context:** AWS cost data lags ~8–24h. Trong 48h workshop account, Budgets cost-driven trigger sẽ KHÔNG fire vì không đủ thời gian tích lũy cost data.

**Decision:** Wire chain đầy đủ (Budgets → SNS → Lambda) nhưng demo bằng cách publish test message lên SNS thủ công:
```bash
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:<account>:kicks-shoes-dev-alerts \
  --message '{"AlarmName":"BudgetTest","NewStateValue":"ALARM"}' \
  --region us-east-1
```

**Consequence:** Lambda stop resource → CloudTrail evidence. Production behavior: cost-driven trigger sẽ fire sau 8–24h khi cost data available.
