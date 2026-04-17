locals {
  common_tags = merge(var.tags, {
    Environment = "dev"
    Project     = var.project_name
    ManagedBy   = "terraform"
  })
}

# Security Groups
module "sg_alb" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${var.project_name}-alb-sg"
  description = "ALB: allow 80/443 from internet"
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id

  ingress_cidr_blocks = ["0.0.0.0/0"]
  ingress_rules       = ["http-80-tcp", "https-443-tcp"]
  egress_rules        = ["all-all"]

  tags = local.common_tags
}

module "sg_ecs" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${var.project_name}-ecs-sg"
  description = "ECS: allow traffic from ALB only"
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id

  computed_ingress_with_source_security_group_id = [
    {
      from_port                = var.container_port
      to_port                  = var.container_port
      protocol                 = "tcp"
      source_security_group_id = module.sg_alb.security_group_id
    }
  ]
  number_of_computed_ingress_with_source_security_group_id = 1
  egress_rules = ["all-all"]

  tags = local.common_tags
}

# ALB
module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 9.0"

  name               = "${var.project_name}-alb"
  load_balancer_type = "application"
  vpc_id             = data.terraform_remote_state.network.outputs.vpc_id
  subnets            = data.terraform_remote_state.network.outputs.public_subnet_ids
  security_groups    = [module.sg_alb.security_group_id]

  target_groups = {
    ecs = {
      name              = "${var.project_name}-tg"
      backend_protocol  = "HTTP"
      backend_port      = var.container_port
      target_type       = "ip"
      create_attachment = false
      health_check = {
        path    = "/api/health"
        matcher = "200-399"
      }
    }
  }

  listeners = {
    http = {
      port     = 80
      protocol = "HTTP"
      forward = {
        target_group_key = "ecs"
      }
    }
  }

  tags = local.common_tags
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 7
  tags              = local.common_tags
}

# ECS Cluster
module "ecs_cluster" {
  source  = "terraform-aws-modules/ecs/aws//modules/cluster"
  version = "~> 5.0"

  cluster_name = "${var.project_name}-cluster"

  cluster_settings = {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

# IAM Policy for Secrets Manager
resource "aws_iam_policy" "ecs_secrets" {
  name        = "${var.project_name}-ecs-secrets"
  description = "Allow ECS tasks to read Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "${data.aws_secretsmanager_secret.app_config.arn}"
      }
    ]
  })

  tags = local.common_tags
}

# ECS Service
module "ecs_service" {
  source  = "terraform-aws-modules/ecs/aws//modules/service"
  version = "~> 5.0"

  name        = "${var.project_name}-service"
  cluster_arn = module.ecs_cluster.arn

  desired_count = var.desired_count
  launch_type   = "FARGATE"
  cpu           = var.task_cpu
  memory        = var.task_memory

  subnet_ids         = data.terraform_remote_state.network.outputs.private_subnet_ids
  security_group_ids = [module.sg_ecs.security_group_id]
  assign_public_ip   = false

  create_task_exec_iam_role = true
  task_exec_iam_role_policies = {
    secrets = aws_iam_policy.ecs_secrets.arn
  }

  enable_autoscaling       = true
  autoscaling_min_capacity = var.autoscaling_min
  autoscaling_max_capacity = var.autoscaling_max

  autoscaling_policies = {
    cpu = {
      policy_type = "TargetTrackingScaling"
      target_tracking_scaling_policy_configuration = {
        predefined_metric_specification = {
          predefined_metric_type = "ECSServiceAverageCPUUtilization"
        }
        target_value       = var.autoscaling_cpu_target
        scale_in_cooldown  = 120
        scale_out_cooldown = 60
      }
    }
  }

  container_definitions = {
    app = {
      image     = var.container_image
      essential = true
      port_mappings = [{
        containerPort = var.container_port
        protocol      = "tcp"
      }]
      environment = [
        { name = "NODE_ENV", value = "development" },
        { name = "PORT", value = tostring(var.container_port) }
      ]
      secrets = [
        { name = "JWT_SECRET", valueFrom = "${data.aws_secretsmanager_secret.app_config.arn}:JWT_SECRET::" },
        { name = "JWT_REFRESH_SECRET", valueFrom = "${data.aws_secretsmanager_secret.app_config.arn}:JWT_REFRESH_SECRET::" },
        { name = "MONGODB_URI", valueFrom = "${data.aws_secretsmanager_secret.app_config.arn}:MONGODB_URI::" },
        { name = "GOOGLE_AI_API_KEY", valueFrom = "${data.aws_secretsmanager_secret.app_config.arn}:GOOGLE_AI_API_KEY::" }
      ]
      log_configuration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  }

  load_balancer = {
    service = {
      target_group_arn = module.alb.target_groups["ecs"].arn
      container_name   = "app"
      container_port   = var.container_port
    }
  }

  tags = local.common_tags
}
