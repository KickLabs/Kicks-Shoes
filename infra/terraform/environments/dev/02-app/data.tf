data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "kicks-shoes-tf-state"
    key    = "dev/01-network/terraform.tfstate"
    region = "us-east-1"
  }
}

# Use project VPC from network stack (not default VPC)
data "aws_vpc" "main" {
  id = data.terraform_remote_state.network.outputs.vpc_id
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

data "aws_route_table" "private" {
  subnet_id = data.terraform_remote_state.network.outputs.private_subnet_ids[0]
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

# Secret already exists - created manually
# resource "aws_secretsmanager_secret" "app_config_new" {
#   name        = var.app_config_secret_name
#   description = "Application configuration for ${var.project_name}"
#   
#   tags = local.common_tags
# }

# resource "aws_secretsmanager_secret_version" "app_config_new" {
#   secret_id = aws_secretsmanager_secret.app_config_new.id
#   secret_string = jsonencode({
#     JWT_SECRET                  = "change-me-jwt-secret-${random_string.jwt_secret.result}"
#     JWT_REFRESH_SECRET          = "change-me-refresh-${random_string.jwt_refresh.result}"
#     MONGODB_URI                 = "mongodb://localhost:27017/kicks-shoes"
#     GOOGLE_AI_API_KEY          = "change-me-google-ai-key"
#     GOOGLE_MAILER_CLIENT_ID    = "change-me-client-id"
#     GOOGLE_MAILER_CLIENT_SECRET = "change-me-client-secret"
#     GOOGLE_MAILER_REFRESH_TOKEN = "change-me-refresh-token"
#   })
# }

# resource "random_string" "jwt_secret" {
#   length  = 32
#   special = false
# }

# resource "random_string" "jwt_refresh" {
#   length  = 32
#   special = false
# }
