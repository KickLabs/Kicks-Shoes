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
  tags                  = local.common_tags
}

module "alb" {
  source = "../../modules/alb"

  project_name       = var.project_name
  vpc_id             = module.network.vpc_id
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
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  selected_azs = length(var.azs) > 0 ? var.azs : slice(data.aws_availability_zones.available.names, 0, 2)
}

module "network_secure" {
  source = "../../modules/network_secure"

  name_prefix         = var.name_prefix
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  azs                 = local.selected_azs
  tags                = var.tags
}

module "dynamodb" {
  source = "../../modules/dynamodb"

  name_prefix = var.name_prefix
  table_name  = var.dynamodb_table_name
  tags        = var.tags
}

module "alb_secure" {
  source = "../../modules/alb_secure"

  name_prefix               = var.name_prefix
  vpc_id                    = module.network_secure.vpc_id
  public_subnet_ids         = module.network_secure.public_subnet_ids
  private_subnet_cidrs      = module.network_secure.private_subnet_cidrs
  target_group_port         = var.container_port
  health_check_path         = var.health_check_path
  health_check_matcher      = var.health_check_matcher
  restrict_to_cloudfront    = var.restrict_alb_to_cloudfront
  origin_verify_header_name = var.origin_verify_header_name
  origin_verify_header_value = var.origin_verify_header_value
  tags                      = var.tags
}

module "ecs_secure" {
  source = "../../modules/ecs_secure"

  name_prefix                       = var.name_prefix
  vpc_id                            = module.network_secure.vpc_id
  vpc_cidr                          = var.vpc_cidr
  subnet_ids                        = module.network_secure.private_subnet_ids
  alb_security_group_id             = module.alb_secure.alb_security_group_id
  target_group_arn                  = module.alb_secure.target_group_arn
  container_name                    = var.container_name
  container_image                   = var.container_image
  container_port                    = var.container_port
  task_cpu                          = var.task_cpu
  task_memory                       = var.task_memory
  desired_count                     = var.desired_count
  assign_public_ip                  = var.assign_public_ip
  health_check_grace_period_seconds = var.health_check_grace_period_seconds
  environment_variables             = var.environment_variables
  secret_environment_variables      = var.secret_environment_variables
  app_config_secret_arn             = var.app_config_secret_arn
  app_config_secret_keys            = var.app_config_secret_keys
  secret_access_arns                = var.secret_access_arns
  dynamodb_table_arn                = module.dynamodb.table_arn
  ecr_repository_arn                = var.ecr_repository_arn
  log_retention_days                = var.log_retention_days
  tags                              = var.tags

  depends_on = [module.alb_secure]
}

module "autoscaling" {
  source = "../../modules/autoscaling"

  name_prefix                = var.name_prefix
  cluster_name               = module.ecs_secure.cluster_name
  service_name               = module.ecs_secure.service_name
  min_capacity               = var.min_capacity
  max_capacity               = var.max_capacity
  target_cpu_utilization     = var.target_cpu_utilization
  scale_in_cooldown_seconds  = var.scale_in_cooldown_seconds
  scale_out_cooldown_seconds = var.scale_out_cooldown_seconds
}

module "edge_security" {
  source = "../../modules/edge_security"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  name_prefix                = var.name_prefix
  alb_dns_name               = module.alb_secure.alb_dns_name
  origin_verify_header_name  = var.origin_verify_header_name
  origin_verify_header_value = var.origin_verify_header_value
  tags                       = var.tags
}
