data "terraform_remote_state" "network" {
  backend = "local"
  config = {
    path = "../01-network/terraform.tfstate"
  }
}

# Use existing default VPC instead of creating new one
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

data "aws_route_table" "default" {
  vpc_id = data.aws_vpc.default.id
  
  filter {
    name   = "association.main"
    values = ["true"]
  }
}

data "aws_route53_zone" "main" {
  count        = var.enable_custom_domain ? 1 : 0
  name         = var.domain_name
  private_zone = false
}

data "aws_secretsmanager_secret" "app_config" {
  name = var.app_config_secret_name
  
  depends_on = [aws_secretsmanager_secret.app_config_new]
}

data "aws_secretsmanager_secret_version" "app_config" {
  secret_id = data.aws_secretsmanager_secret.app_config.id
  
  depends_on = [aws_secretsmanager_secret_version.app_config_new]
}

data "aws_caller_identity" "current" {}

# Create Secrets Manager secret if it doesn't exist
resource "aws_secretsmanager_secret" "app_config_new" {
  name        = var.app_config_secret_name
  description = "Application configuration for ${var.project_name}"
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "app_config_new" {
  secret_id = aws_secretsmanager_secret.app_config_new.id
  secret_string = jsonencode({
    JWT_SECRET                  = "change-me-jwt-secret-${random_string.jwt_secret.result}"
    JWT_REFRESH_SECRET          = "change-me-refresh-${random_string.jwt_refresh.result}"
    MONGODB_URI                 = "mongodb://localhost:27017/kicks-shoes"
    GOOGLE_AI_API_KEY          = "change-me-google-ai-key"
    GOOGLE_MAILER_CLIENT_ID    = "change-me-client-id"
    GOOGLE_MAILER_CLIENT_SECRET = "change-me-client-secret"
    GOOGLE_MAILER_REFRESH_TOKEN = "change-me-refresh-token"
  })
}

resource "random_string" "jwt_secret" {
  length  = 32
  special = false
}

resource "random_string" "jwt_refresh" {
  length  = 32
  special = false
}
