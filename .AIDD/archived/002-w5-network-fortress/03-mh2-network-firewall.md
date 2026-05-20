# 03 — MH2: AWS Network Firewall

## Architecture

```
Private Subnet (ECS)
  │ 0.0.0.0/0
  ▼
Firewall Endpoint (firewall subnet)
  │ stateful rules
  ▼
NAT Gateway (public subnet)
  │
  ▼
Internet Gateway
```

---

## Terraform — Firewall Subnets

Thêm vào `infra/terraform/environments/dev/01-network/main.tf`:

```hcl
# Firewall subnets
variable "firewall_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.30.0/24", "10.0.31.0/24"]
}

# Thêm vào module vpc
module "vpc" {
  # ... existing config ...
  
  # Thêm firewall subnets
  intra_subnets = var.firewall_subnet_cidrs
  
  intra_subnet_tags = {
    Tier = "firewall"
    Name = "${var.project_name}-firewall-subnet"
  }
}

output "firewall_subnet_ids" {
  value = module.vpc.intra_subnets
}
```

---

## Terraform — Network Firewall

Tạo file mới `infra/terraform/environments/dev/02-app/network-firewall.tf`:

```hcl
# Stateful Rule Group — Domain Allowlist
resource "aws_networkfirewall_rule_group" "domain_allowlist" {
  capacity = 100
  name     = "${var.project_name}-domain-allowlist"
  type     = "STATEFUL"

  rule_group {
    rules_source {
      rules_source_list {
        generated_rules_type = "ALLOWLIST"
        target_types         = ["HTTP_HOST", "TLS_SNI"]
        targets = [
          ".amazonaws.com",           # AWS services
          ".docker.io",               # Docker Hub
          ".docker.com",
          "generativelanguage.googleapis.com",  # Gemini API
          "api.openweathermap.org",   # Weather API
          ".mongodb.net"              # MongoDB Atlas
        ]
      }
    }
    stateful_rule_options {
      rule_order = "STRICT_ORDER"
    }
  }

  tags = local.common_tags
}

# Firewall Policy
resource "aws_networkfirewall_firewall_policy" "main" {
  name = "${var.project_name}-firewall-policy"

  firewall_policy {
    stateless_default_actions          = ["aws:forward_to_sfe"]
    stateless_fragment_default_actions = ["aws:forward_to_sfe"]

    stateful_rule_group_reference {
      resource_arn = aws_networkfirewall_rule_group.domain_allowlist.arn
    }

    stateful_engine_options {
      rule_order = "STRICT_ORDER"
    }
  }

  tags = local.common_tags
}

# Network Firewall
resource "aws_networkfirewall_firewall" "main" {
  name                = "${var.project_name}-firewall"
  firewall_policy_arn = aws_networkfirewall_firewall_policy.main.arn
  vpc_id              = data.terraform_remote_state.network.outputs.vpc_id
  
  # Firewall endpoint trong mỗi firewall subnet
  dynamic "subnet_mapping" {
    for_each = data.terraform_remote_state.network.outputs.firewall_subnet_ids
    content {
      subnet_id = subnet_mapping.value
    }
  }

  tags = local.common_tags
}

# CloudWatch Log Group cho Alert Logs
resource "aws_cloudwatch_log_group" "firewall_alert" {
  name              = "/aws/network-firewall/alert/${var.project_name}"
  retention_in_days = 7
  tags              = local.common_tags
}

# Logging Configuration
resource "aws_networkfirewall_logging_configuration" "main" {
  firewall_arn = aws_networkfirewall_firewall.main.arn

  logging_configuration {
    log_destination_config {
      log_destination = {
        logGroup = aws_cloudwatch_log_group.firewall_alert.name
      }
      log_destination_type = "CloudWatchLogs"
      log_type             = "ALERT"
    }
  }
}

# Outputs
output "firewall_endpoint_ids" {
  value = [for ep in aws_networkfirewall_firewall.main.firewall_status[0].sync_states : ep.attachment[0].endpoint_id]
}
```

---

## Route Table Changes

Cập nhật `infra/terraform/environments/dev/01-network/main.tf`:

```hcl
# Sau khi firewall deployed, cập nhật route tables
# Private subnet route: 0.0.0.0/0 → Firewall Endpoint (thay vì NAT GW)
# Firewall subnet route: 0.0.0.0/0 → NAT GW

# NOTE: Phải apply 02-app trước (tạo firewall), sau đó quay lại 01-network update routes
# Hoặc dùng data source để đọc firewall endpoint ID
```

**Manual step sau khi firewall deployed:**

```bash
# 1. Lấy firewall endpoint ID
aws network-firewall describe-firewall \
  --firewall-name kicks-shoes-dev-firewall \
  --region ap-southeast-1 \
  --query 'FirewallStatus.SyncStates.*.Attachment[0].EndpointId' \
  --output text

# 2. Update route table của private subnets
aws ec2 replace-route \
  --route-table-id <private-rt-id> \
  --destination-cidr-block 0.0.0.0/0 \
  --vpc-endpoint-id <firewall-endpoint-id>
```

---

## Test Allowed Request

```bash
# SSH vào ECS task (hoặc dùng ECS Exec)
aws ecs execute-command \
  --cluster kicks-shoes-dev-cluster \
  --task <task-id> \
  --container app \
  --interactive \
  --command "/bin/sh"

# Trong container
curl -I https://generativelanguage.googleapis.com
# Expected: 200 OK (allowed)
```

Check Flow Logs → thấy ACCEPT.

---

## Test Blocked Request

```bash
# Trong ECS container
curl -I https://example.com
# Expected: timeout hoặc connection refused
```

Check Alert Logs:

```bash
aws logs tail /aws/network-firewall/alert/kicks-shoes-dev --follow
```

Expected: log entry với action REJECT, domain `example.com`.

---

## Evidence Pack — MH2 Section

```markdown
## MH2 — Network Firewall Hardening

**Path chọn:** Path A — AWS Network Firewall

**Rationale:** ECS Fargate ra internet qua NAT GW để:
- Pull Docker image từ ECR public
- Gọi Gemini API (generativelanguage.googleapis.com)
- Gọi Weather API (api.openweathermap.org)

**Architecture:**
- Firewall subnets: 10.0.30.0/24 (AZ-a), 10.0.31.0/24 (AZ-b)
- Firewall endpoint deployed trong mỗi AZ
- Stateful rule group: domain allowlist (chỉ allow domains cần thiết)
- Alert Logs: /aws/network-firewall/alert/kicks-shoes-dev

**Route table flow:**
Private subnet → Firewall endpoint → NAT GW → IGW

[Screenshot: Network Firewall console — firewall status READY]
[Screenshot: Stateful rule group — domain allowlist]
[Screenshot: Flow Logs — 1 request ACCEPT (curl googleapis.com)]
[Screenshot: Alert Logs — 1 request REJECT (curl example.com)]
```
