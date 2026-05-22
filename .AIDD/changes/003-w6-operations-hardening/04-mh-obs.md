# 04 — MH-OBS: CloudWatch Monitoring

## Vấn đề hiện tại

1. `api-gateway.tf` — access log format chỉ có `$context.requestId` → không đủ để query có ý nghĩa
2. Không có custom metric từ application layer
3. Không có CloudWatch Dashboard
4. Alarm `ecs-cpu-high` có thể ở INSUFFICIENT_DATA nếu ECS chưa generate CPU data

---

## Fix 1: API Gateway Access Log Format

Sửa trong `api-gateway.tf`:

```hcl
access_log_settings {
  destination_arn = aws_cloudwatch_log_group.api_gateway.arn
  format = jsonencode({
    requestId         = "$context.requestId"
    ip                = "$context.identity.sourceIp"
    requestTime       = "$context.requestTime"
    httpMethod        = "$context.httpMethod"
    routeKey          = "$context.routeKey"
    status            = "$context.status"
    responseLatency   = "$context.responseLatency"
    integrationLatency = "$context.integrationLatency"
    errorMessage      = "$context.error.message"
  })
}
```

---

## Fix 2: Custom Metric trong Lambda bedrock-chat

Thêm vào `backend/lambda/bedrock-chat/index.js`:

```javascript
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function publishMetric(metricName, value, unit = 'Milliseconds') {
  try {
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'KicksShoes/Operations',
      MetricData: [{
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Dimensions: [
          { Name: 'Environment', Value: process.env.NODE_ENV || 'dev' },
          { Name: 'Application', Value: 'KicksShoes' }
        ]
      }]
    }));
  } catch (err) {
    console.error('Failed to publish metric:', err);
    // Non-blocking — don't fail the main handler
  }
}

// Trong handler, wrap Bedrock call:
exports.handler = async (event) => {
  const startTime = Date.now();
  
  try {
    // ... existing Bedrock call logic ...
    const result = await callBedrock(event);
    
    const latencyMs = Date.now() - startTime;
    await publishMetric('BedrockQueryLatencyMs', latencyMs);
    await publishMetric('BedrockQueryCount', 1, 'Count');
    
    return result;
  } catch (err) {
    await publishMetric('BedrockQueryErrors', 1, 'Count');
    throw err;
  }
};
```

**IAM permission cần thêm** vào Lambda execution role trong `modules/lambda/main.tf`:

```hcl
resource "aws_iam_role_policy" "cloudwatch_metrics" {
  name = "cloudwatch-metrics"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "PutMetrics"
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
```

---

## Fix 3: monitoring.tf (tạo mới)

```hcl
# =============================================================================
# W6 MH-OBS — CloudWatch Dashboard + Alarms + Metric Filters
# =============================================================================

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-operations"

  dashboard_body = jsonencode({
    widgets = [
      # Widget 1 — Custom metric: Bedrock Query Latency
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
          yAxis  = { left = { label = "ms" } }
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
        }
      },
      # Widget 3 — Standard: Lambda Errors
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
        }
      },
      # Widget 4 — API Gateway 4XX errors
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
        }
      }
    ]
  })
}

# Alarm — Lambda Errors (sẽ có data sau khi invoke Lambda với bad input)
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

# Alarm — Bedrock Query Latency (custom metric)
resource "aws_cloudwatch_metric_alarm" "bedrock_latency" {
  alarm_name          = "${var.project_name}-bedrock-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "BedrockQueryLatencyMs"
  namespace           = "KicksShoes/Operations"
  period              = 300
  statistic           = "Average"
  threshold           = 5000  # 5 seconds
  treat_missing_data  = "notBreaching"

  dimensions = {
    Environment = "dev"
    Application = "KicksShoes"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}
```

---

## Log Insights Saved Queries

Tạo thủ công trong CloudWatch console → Logs Insights → Saved Queries:

### Query 1 — Lambda Error Spikes (log group: `/aws/lambda/kicks-shoes-dev-bedrock-chat`)
```
fields @timestamp, @message
| filter @message like /ERROR/
| stats count(*) as error_count by bin(5m)
| sort @timestamp desc
| limit 20
```

### Query 2 — API Gateway Slow Requests (log group: `/aws/apigateway/kicks-shoes-dev-bedrock-api`)
```
fields @timestamp, routeKey, status, responseLatency, ip
| filter ispresent(responseLatency)
| stats avg(responseLatency) as avg_latency, max(responseLatency) as max_latency, count(*) as request_count by routeKey
| sort avg_latency desc
| limit 10
```

### Query 3 — VPC Flow Logs REJECT (log group: `/vpc/kicks-shoes-dev/flow-logs`)
```
fields @timestamp, srcAddr, dstAddr, dstPort, action
| filter action = "REJECT"
| stats count(*) as reject_count by srcAddr
| sort reject_count desc
| limit 10
```

---

## Checklist trước Friday

- [ ] Invoke Lambda bedrock-chat ít nhất 10 lần (kể cả lần lỗi) để có data points
- [ ] Verify alarm `lambda-errors` ở OK hoặc ALARM (không phải INSUFFICIENT_DATA)
- [ ] Dashboard hiển thị data points thật (không empty widgets)
- [ ] Saved queries chạy được và có ≥5 result rows
