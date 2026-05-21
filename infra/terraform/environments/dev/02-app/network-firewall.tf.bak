# =============================================================================
# W5 MH2 — AWS Network Firewall
# ECS Fargate egresses to internet via NAT GW (ECR pull, Gemini API, Weather API)
# Traffic path: ECS (private) → Firewall Endpoint → NAT GW → IGW → Internet
# =============================================================================

# -----------------------------------------------------------------------------
# Stateful Rule Group — Domain-based egress allowlist
# Only allow outbound to domains the app actually needs
# -----------------------------------------------------------------------------
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
          ".amazonaws.com", # AWS services (ECR, S3, DynamoDB, Secrets Manager)
          ".docker.io",     # Docker Hub
          ".docker.com",
          "generativelanguage.googleapis.com", # Google Gemini API
          "api.openweathermap.org",            # Weather API
          ".mongodb.net",                      # MongoDB Atlas
          ".payos.vn",                         # PayOS payment
          "api.vnappmob.com",                  # Vietnam province API
        ]
      }
    }
    stateful_rule_options {
      rule_order = "STRICT_ORDER"
    }
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Firewall Policy
# -----------------------------------------------------------------------------
resource "aws_networkfirewall_firewall_policy" "main" {
  name = "${var.project_name}-firewall-policy"

  firewall_policy {
    stateless_default_actions          = ["aws:forward_to_sfe"]
    stateless_fragment_default_actions = ["aws:forward_to_sfe"]
    stateful_default_actions           = ["aws:alert_strict"]

    stateful_rule_group_reference {
      resource_arn = aws_networkfirewall_rule_group.domain_allowlist.arn
      priority     = 1
    }

    stateful_engine_options {
      rule_order = "STRICT_ORDER"
    }
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Network Firewall — one endpoint per FIREWALL subnet AZ (Multi-AZ)
#
# W6 FIX (Trainer feedback): Previously used public_subnet_ids which placed
# both endpoints in the same AZ — a hidden HA SPOF. Now uses the dedicated
# intra/firewall subnets (10.0.30.0/24 AZ-a, 10.0.31.0/24 AZ-b) created by
# 01-network, giving true Multi-AZ firewall coverage.
#
# Traffic path: ECS (private) → Firewall Endpoint (intra/firewall) → NAT GW (public) → IGW
# -----------------------------------------------------------------------------
resource "aws_networkfirewall_firewall" "main" {
  name                = "${var.project_name}-firewall"
  firewall_policy_arn = aws_networkfirewall_firewall_policy.main.arn
  vpc_id              = local.vpc_id

  # Use dedicated firewall/intra subnets — one per AZ for true Multi-AZ HA
  # These subnets are tagged Tier=firewall by 01-network module
  dynamic "subnet_mapping" {
    for_each = data.aws_subnets.firewall.ids
    content {
      subnet_id = subnet_mapping.value
    }
  }

  delete_protection = false # dev: allow deletion

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# CloudWatch Log Group — Alert Logs (blocked requests)
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "firewall_alert" {
  name              = "/aws/network-firewall/alert/${var.project_name}"
  retention_in_days = 7
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "firewall_flow" {
  name              = "/aws/network-firewall/flow/${var.project_name}"
  retention_in_days = 7
  tags              = local.common_tags
}

# -----------------------------------------------------------------------------
# Logging Configuration — Alert + Flow logs to CloudWatch
# -----------------------------------------------------------------------------
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

    log_destination_config {
      log_destination = {
        logGroup = aws_cloudwatch_log_group.firewall_flow.name
      }
      log_destination_type = "CloudWatchLogs"
      log_type             = "FLOW"
    }
  }
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------
output "firewall_arn" {
  description = "ARN of the Network Firewall"
  value       = aws_networkfirewall_firewall.main.arn
}

output "firewall_status" {
  description = "Sync state of the Network Firewall"
  value       = aws_networkfirewall_firewall.main.firewall_status
}

output "firewall_alert_log_group" {
  description = "CloudWatch Log Group for firewall alert logs"
  value       = aws_cloudwatch_log_group.firewall_alert.name
}

output "firewall_flow_log_group" {
  description = "CloudWatch Log Group for firewall flow logs"
  value       = aws_cloudwatch_log_group.firewall_flow.name
}
