data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "kicks-shoes-tf-state"
    key    = "dev/01-network/terraform.tfstate"
    region = "ap-southeast-1"
  }
}

data "aws_route53_zone" "main" {
  count        = var.enable_custom_domain ? 1 : 0
  name         = var.domain_name
  private_zone = false
}

data "aws_secretsmanager_secret" "app_config" {
  name = var.app_config_secret_name
}

data "aws_caller_identity" "current" {}
