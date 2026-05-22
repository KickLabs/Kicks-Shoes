# Dynamically locate live VPC and Subnets via Tags to guarantee zero stale state dependency
data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = ["*-vpc"]
  }
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  filter {
    name   = "tag:Tier"
    values = ["public"]
  }
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  filter {
    name   = "tag:Tier"
    values = ["private"]
  }
}

# Find private route table directly via tags
data "aws_route_tables" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  filter {
    name   = "tag:Name"
    values = ["*private*"]
  }
}

data "aws_route_table" "private" {
  route_table_id = data.aws_route_tables.private.ids[0]
}

# Keep default VPC data for backward compat (not used for ECS)
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_subnet" "default" {
  for_each = toset(data.aws_subnets.default.ids)
  id       = each.value
}

data "aws_route53_zone" "main" {
  count        = var.enable_custom_domain ? 1 : 0
  name         = var.domain_name
  private_zone = false
}

data "aws_secretsmanager_secret" "app_config" {
  name = var.app_config_secret_name
}

data "aws_secretsmanager_secret_version" "app_config" {
  secret_id = data.aws_secretsmanager_secret.app_config.id
}

data "aws_caller_identity" "current" {}

# W6 Fix: Firewall subnets (intra tier) — for Multi-AZ Network Firewall endpoints
data "aws_subnets" "firewall" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  filter {
    name   = "tag:Tier"
    values = ["firewall"]
  }
}
