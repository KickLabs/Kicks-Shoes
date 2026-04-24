data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  common_tags = merge(var.tags, {
    Environment = "dev"
    Project     = var.project_name
    ManagedBy   = "terraform"
  })
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project_name}-vpc"
  cidr = var.vpc_cidr

  azs              = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnets   = var.public_subnet_cidrs
  private_subnets  = var.private_subnet_cidrs
  database_subnets = var.db_subnet_cidrs

  enable_nat_gateway     = true
  single_nat_gateway     = true   # dev: 1 NAT GW for cost saving
  one_nat_gateway_per_az = false

  enable_dns_hostnames = true
  enable_dns_support   = true

  create_database_subnet_group       = true
  create_database_subnet_route_table = true

  tags = local.common_tags

  public_subnet_tags = {
    Tier = "public"
  }
  private_subnet_tags = {
    Tier = "private"
  }
  database_subnet_tags = {
    Tier = "database"
  }
}
