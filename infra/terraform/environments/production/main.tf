data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  common_tags = merge(var.tags, {
    Project     = var.project_name
    Environment = "production"
    ManagedBy   = "terraform"
  })
}

module "network" {
  source = "../../modules/network"

  project_name          = var.project_name
  vpc_cidr              = var.vpc_cidr
  azs                   = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs
  nat_gateway_count     = var.nat_gateway_count
  tags                  = local.common_tags
}

module "alb" {
  source = "../../modules/alb"

  project_name       = var.project_name
  vpc_id             = module.network.vpc_id
  vpc_cidr           = var.vpc_cidr
  public_subnet_ids  = module.network.public_subnet_ids
  container_port     = var.container_port
  health_check_path  = "/api/health"
  tags               = local.common_tags
}

module "dynamodb" {
  source = "../../modules/dynamodb"

  table_name = var.dynamodb_table_name
  tags       = local.common_tags
}

module "ecs" {
  source = "../../modules/ecs"

  project_name            = var.project_name
  aws_region              = var.aws_region
  container_image         = var.container_image
  container_port          = var.container_port
  desired_count           = var.desired_count
  task_cpu                = var.task_cpu
  task_memory             = var.task_memory
  vpc_id                  = module.network.vpc_id
  private_subnet_ids      = module.network.private_subnet_ids
  alb_security_group_id   = module.alb.alb_security_group_id
  target_group_arn        = module.alb.target_group_arn
  dynamodb_table_arn      = module.dynamodb.table_arn
  app_config_secret_arn   = var.app_config_secret_arn
  app_config_secret_keys  = var.app_config_secret_keys
  tags                    = local.common_tags
}

module "autoscaling" {
  source = "../../modules/autoscaling"

  cluster_name = module.ecs.cluster_name
  service_name = module.ecs.service_name
  min_capacity = var.autoscaling_min
  max_capacity = var.autoscaling_max
  cpu_target   = var.autoscaling_cpu_target
}
