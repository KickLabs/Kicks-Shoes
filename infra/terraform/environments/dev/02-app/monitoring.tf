# =============================================================================
# W6 MH-OBS — CloudWatch Dashboard + Alarms
# Custom metric: KicksShoes/Operations :: BedrockQueryLatencyMs
# Standard metrics: ECS CPU, Lambda Errors, API Gateway 4XX
# =============================================================================

# CloudWatch Dashboard — 4 widgets
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-operations"

  dashboard_body = jsonencode({
    widgets = [
      # Widget 1 — Custom metric: Bedrock Query Latency (W6 MH-OBS)
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "Bedrock Query Latency (Custom Metric)"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [[
            "KicksShoes/Operations",
            "BedrockQueryLatencyMs",
            "Environment", "dev",
            "Application", "KicksShoes"
          ]]
          period = 60
          stat   = "Average"
          yAxis  = { left = { label = "ms", min = 0 } }
        }
      },
      # Widget 2 — Standard: ECS CPU Utilization
      {
        type   = "metric"
        x      = 8
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "ECS CPU Utilization"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [[
            "AWS/ECS",
            "CPUUtilization",
            "ClusterName", "${var.project_name}-cluster",
            "ServiceName", "${var.project_name}-service"
          ]]
          period = 60
          stat   = "Average"
          yAxis  = { left = { label = "%", min = 0, max = 100 } }
        }
      },
      # Widget 3 — Standard: Lambda Errors (bedrock-chat)
      {
        type   = "metric"
        x      = 16
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "Lambda Errors (bedrock-chat)"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [[
            "AWS/Lambda",
            "Errors",
            "FunctionName", "${var.project_name}-bedrock-chat"
          ]]
          period = 60
          stat   = "Sum"
          yAxis  = { left = { label = "count", min = 0 } }
        }
      },
      # Widget 4 — Standard: API Gateway 4XX Errors
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "API Gateway 4XX Errors"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [[
            "AWS/ApiGateway",
            "4XXError",
            "ApiId", aws_apigatewayv2_api.bedrock.id
          ]]
          period = 60
          stat   = "Sum"
          yAxis  = { left = { label = "count", min = 0 } }
        }
      },
      # Widget 5 — Custom: Bedrock Query Count
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Bedrock Query Count"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            [
              "KicksShoes/Operations",
              "BedrockQueryCount",
              "Environment", "dev",
              "Application", "KicksShoes",
              { "stat" = "Sum", "label" = "Queries" }
            ],
            [
              "KicksShoes/Operations",
              "BedrockQueryErrors",
              "Environment", "dev",
              "Application", "KicksShoes",
              { "stat" = "Sum", "label" = "Errors", "color" = "#d62728" }
            ]
          ]
          period = 60
        }
      }
    ]
  })
}

# Alarm — Lambda Errors (drives ALARM state for evidence)
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = "${var.project_name}-bedrock-chat"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# Alarm — Bedrock Query Latency high (custom metric)
resource "aws_cloudwatch_metric_alarm" "bedrock_latency" {
  alarm_name          = "${var.project_name}-bedrock-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "BedrockQueryLatencyMs"
  namespace           = "KicksShoes/Operations"
  period              = 300
  statistic           = "Average"
  threshold           = 5000
  treat_missing_data  = "notBreaching"

  dimensions = {
    Environment = "dev"
    Application = "KicksShoes"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# Outputs
output "cloudwatch_dashboard_name" {
  description = "CloudWatch Dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}
