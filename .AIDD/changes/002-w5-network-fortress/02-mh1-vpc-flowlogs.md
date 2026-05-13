# 02 — MH1: Single-VPC Justification + VPC Flow Logs

## Path Chọn: Path C — Justified Single-VPC

### Justification (bắt buộc viết cụ thể)

**Kicks Shoes là single-tenant e-commerce platform.** Tất cả components (ALB, ECS, DynamoDB, Lambda, ElastiCache) phục vụ cùng một business domain và cùng một nhóm operator. Không có:
- Môi trường staging/prod cần network isolation (account-level isolation đủ)
- Partner/third-party workload cần tách blast radius
- Compliance requirement (PCI-DSS, HIPAA) đòi network segmentation cứng

**Subnet-level isolation đã đủ:**
- Public subnet: ALB only
- Private subnet: ECS tasks only (SG chỉ allow từ ALB)
- DB subnet: ElastiCache only (SG chỉ allow từ ECS)
- Firewall subnet (W5 mới): Network Firewall endpoints

**Trigger thêm VPC thứ hai:**
1. Thêm môi trường staging cần network isolation hoàn toàn với prod
2. Tích hợp partner API cần dedicated peering connection
3. Tách data processing pipeline (Bedrock batch jobs) khỏi serving layer

**Multi-AZ đã có từ W1:** public ×2, private ×2, db ×2 — không cần thay đổi.

---

## VPC Flow Logs — Terraform

Thêm vào `infra/terraform/environments/dev/01-network/main.tf`:

```hcl
# CloudWatch Log Group cho Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/vpc/${var.project_name}/flow-logs"
  retention_in_days = 7
  tags              = local.common_tags
}

# IAM Role cho Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name = "${var.project_name}-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "vpc-flow-logs.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "${var.project_name}-vpc-flow-logs-policy"
  role = aws_iam_role.vpc_flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "*"
    }]
  })
}

# VPC Flow Logs — bật trên toàn VPC
resource "aws_flow_log" "vpc" {
  vpc_id          = module.vpc.vpc_id
  traffic_type    = "ALL"   # ACCEPT + REJECT
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-flow-logs"
  })
}
```

Thêm output vào `outputs.tf`:

```hcl
output "flow_log_group_name" {
  value = aws_cloudwatch_log_group.vpc_flow_logs.name
}
```

---

## Verify Flow Logs

```bash
# Xem log streams
aws logs describe-log-streams \
  --log-group-name "/vpc/kicks-shoes-dev/flow-logs" \
  --region ap-southeast-1 \
  --order-by LastEventTime \
  --descending \
  --max-items 5

# Xem log events (thay <stream-name> bằng stream thật)
aws logs get-log-events \
  --log-group-name "/vpc/kicks-shoes-dev/flow-logs" \
  --log-stream-name "<stream-name>" \
  --region ap-southeast-1 \
  --limit 20
```

### Sample Flow Log Entry (format)

```
2 123456789012 eni-abc12345 10.0.10.5 52.94.76.1 443 54321 6 10 840 1715000000 1715000060 ACCEPT OK
2 123456789012 eni-abc12345 10.0.10.5 1.2.3.4 80 12345 6 1 40 1715000000 1715000060 REJECT OK
```

Fields: version, account-id, interface-id, srcaddr, dstaddr, srcport, dstport, protocol, packets, bytes, start, end, action, log-status

**Chụp screenshot** ít nhất 1 ACCEPT và 1 REJECT entry cho Evidence Pack.

---

## Evidence Pack — MH1 Section

```markdown
## MH1 — Multi-VPC Connectivity

**Path chọn:** Path C — Justified Single-VPC

**Justification:**
[Copy từ section trên]

**Subnet architecture:**
- Public: 10.0.0.0/24 (AZ-a), 10.0.1.0/24 (AZ-b) — ALB
- Private: 10.0.10.0/24 (AZ-a), 10.0.11.0/24 (AZ-b) — ECS
- DB: 10.0.20.0/24 (AZ-a), 10.0.21.0/24 (AZ-b) — ElastiCache
- Firewall: 10.0.30.0/24 (AZ-a), 10.0.31.0/24 (AZ-b) — Network Firewall

**VPC Flow Logs:** bật trên vpc-xxxxxxxx, publish về /vpc/kicks-shoes-dev/flow-logs

[Screenshot: CloudWatch log group với entries]
[Screenshot: Sample ACCEPT entry]
[Screenshot: Sample REJECT entry]

**Trigger thêm VPC thứ hai:**
1. Staging environment cần network isolation
2. Partner API integration
3. Batch processing pipeline tách khỏi serving layer
```
