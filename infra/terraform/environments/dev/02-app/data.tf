# Read 01-network outputs
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "kicks-shoes-tf-state"
    key    = "dev/01-network/terraform.tfstate"
    region = "ap-southeast-1"
  }
}

# Existing Route53 hosted zone
data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# Existing Secrets Manager secret
data "aws_secretsmanager_secret" "app_config" {
  name = var.app_config_secret_name
}
