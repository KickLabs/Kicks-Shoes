provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  selected_azs = length(var.azs) > 0 ? var.azs : slice(data.aws_availability_zones.available.names, 0, 2)
}

module "network" {
  source = "../../modules/network"

  name_prefix         = var.name_prefix
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  azs                 = local.selected_azs
  tags                = var.tags
}

module "alb" {
  source = "../../modules/alb"

  name_prefix          = var.name_prefix
  vpc_id               = module.network.vpc_id
  public_subnet_ids    = module.network.public_subnet_ids
  target_group_port    = var.container_port
  health_check_path    = var.health_check_path
  health_check_matcher = var.health_check_matcher
  tags                 = var.tags
}

module "ecs" {
  source = "../../modules/ecs"

  name_prefix                       = var.name_prefix
  vpc_id                            = module.network.vpc_id
  subnet_ids                        = module.network.public_subnet_ids
  alb_security_group_id             = module.alb.alb_security_group_id
  target_group_arn                  = module.alb.target_group_arn
  container_name                    = var.container_name
  container_image                   = var.container_image
  container_port                    = var.container_port
  task_cpu                          = var.task_cpu
  task_memory                       = var.task_memory
  desired_count                     = var.desired_count
  assign_public_ip                  = var.assign_public_ip
  health_check_grace_period_seconds = var.health_check_grace_period_seconds
  environment_variables             = var.environment_variables
  log_retention_days                = var.log_retention_days
  tags                              = var.tags

  depends_on = [module.alb]
}

module "autoscaling" {
  source = "../../modules/autoscaling"

  name_prefix                = var.name_prefix
  cluster_name               = module.ecs.cluster_name
  service_name               = module.ecs.service_name
  min_capacity               = var.min_capacity
  max_capacity               = var.max_capacity
  target_cpu_utilization     = var.target_cpu_utilization
  scale_in_cooldown_seconds  = var.scale_in_cooldown_seconds
  scale_out_cooldown_seconds = var.scale_out_cooldown_seconds
}
