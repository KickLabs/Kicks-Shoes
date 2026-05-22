# =============================================================================
# W6 MH-COST-A — AWS Budgets $150 monthly cap → SNS → Lambda cost-guard
# =============================================================================

resource "aws_budgets_budget" "monthly_cost_cap" {
  name         = "${var.project_name}-monthly-150-cap"
  budget_type  = "COST"
  limit_amount = "150"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.alerts.arn]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.alerts.arn]
  }
}

resource "aws_budgets_budget" "daily_cost_cap" {
  name         = "${var.project_name}-daily-50-cap"
  budget_type  = "COST"
  limit_amount = "50"
  limit_unit   = "USD"
  time_unit    = "DAILY"

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.alerts.arn]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.alerts.arn]
  }
}

# SNS topic policy — allow Budgets service to publish
resource "aws_sns_topic_policy" "alerts_budgets" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowBudgetsPublish"
        Effect = "Allow"
        Principal = {
          Service = "budgets.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# =============================================================================
# W6 MH-COST-V — AWS Cost Anomaly Detection
# =============================================================================

resource "aws_ce_anomaly_monitor" "service_monitor" {
  name              = "${var.project_name}-service-monitor"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
  tags              = local.common_tags
}

resource "aws_ce_anomaly_subscription" "sns_alert" {
  name             = "${var.project_name}-anomaly-alert"
  frequency        = "IMMEDIATE"
  monitor_arn_list = [aws_ce_anomaly_monitor.service_monitor.arn]
  tags             = local.common_tags

  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      match_options = ["GREATER_THAN_OR_EQUAL"]
      values        = ["5"]
    }
  }

  subscriber {
    type    = "SNS"
    address = aws_sns_topic.alerts.arn
  }
}
