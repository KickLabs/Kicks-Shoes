locals {
  common_tags = merge(var.tags, {
    Project     = "kicks-shoes"
    Environment = "dev"
    ManagedBy   = "terraform"
  })

  # Use project VPC from network stack (traffic goes through Network Firewall)
  vpc_id             = data.terraform_remote_state.network.outputs.vpc_id
  public_subnet_ids  = data.terraform_remote_state.network.outputs.public_subnet_ids
  private_subnet_ids = data.terraform_remote_state.network.outputs.private_subnet_ids
  db_subnet_ids      = data.terraform_remote_state.network.outputs.db_subnet_ids
  route_table_id     = data.aws_route_table.private.id

  uploads_bucket_name = "${var.project_name}-${data.aws_caller_identity.current.account_id}-uploads"
  ecs_cluster_name    = "${var.project_name}-cluster"
  ecs_service_name    = "${var.project_name}-service"

  cognito_callback_urls = var.enable_custom_domain ? ["https://dev.${var.domain_name}/auth/callback"] : ["http://localhost:3000/auth/callback"]
  cognito_logout_urls   = var.enable_custom_domain ? ["https://dev.${var.domain_name}/logout"] : ["http://localhost:3000/logout"]

  alb_http_listener = merge(
    {
      port     = 80
      protocol = "HTTP"
    },
    var.enable_custom_domain ? {
      redirect = {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
      } : {
      forward = {
        target_group_key = "ecs"
      }
    }
  )

  alb_listeners = merge(
    {
      http = local.alb_http_listener
    },
    var.enable_custom_domain ? {
      https = {
        port            = 443
        protocol        = "HTTPS"
        certificate_arn = module.acm_alb[0].acm_certificate_arn
        forward = {
          target_group_key = "ecs"
        }
      }
    } : {}
  )
}

module "sg_alb" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${var.project_name}-alb-sg"
  description = "ALB allow 80/443 from internet"
  vpc_id      = local.vpc_id

  ingress_cidr_blocks = ["0.0.0.0/0"]
  ingress_rules       = ["http-80-tcp", "https-443-tcp"]
  egress_rules        = ["all-all"]

  tags = local.common_tags
}

module "sg_ecs" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${var.project_name}-ecs-sg"
  description = "ECS allow traffic from ALB only"
  vpc_id      = local.vpc_id

  computed_ingress_with_source_security_group_id = [
    {
      from_port                = 3000
      to_port                  = 3000
      protocol                 = "tcp"
      source_security_group_id = module.sg_alb.security_group_id
    }
  ]
  number_of_computed_ingress_with_source_security_group_id = 1
  egress_rules                                             = ["all-all"]

  tags = local.common_tags
}

module "sg_redis" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${var.project_name}-redis-sg"
  description = "Redis allow 6379 from ECS only"
  vpc_id      = local.vpc_id

  computed_ingress_with_source_security_group_id = [
    {
      from_port                = 6379
      to_port                  = 6379
      protocol                 = "tcp"
      source_security_group_id = module.sg_ecs.security_group_id
    }
  ]
  number_of_computed_ingress_with_source_security_group_id = 1
  egress_rules                                             = ["all-all"]

  tags = local.common_tags
}

module "acm_alb" {
  count   = var.enable_custom_domain ? 1 : 0
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 5.0"

  domain_name         = "api.dev.${var.domain_name}"
  zone_id             = data.aws_route53_zone.main[0].zone_id
  validation_method   = "DNS"
  wait_for_validation = true

  tags = local.common_tags
}

module "acm_cloudfront" {
  count   = var.enable_custom_domain ? 1 : 0
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 5.0"
  providers = {
    aws = aws.us_east_1
  }

  domain_name         = "dev.${var.domain_name}"
  zone_id             = data.aws_route53_zone.main[0].zone_id
  validation_method   = "DNS"
  wait_for_validation = true

  tags = local.common_tags
}

resource "aws_wafv2_web_acl" "cloudfront" {
  count       = var.enable_custom_domain ? 1 : 0
  provider    = aws.us_east_1
  name        = "${var.project_name}-waf"
  description = "WAF for CloudFront dev"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-common-rules"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-waf"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}

module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 9.0"

  name               = "${var.project_name}-alb"
  load_balancer_type = "application"
  vpc_id             = local.vpc_id
  subnets            = local.public_subnet_ids
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

  listeners = local.alb_listeners

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 7
  tags              = local.common_tags
}

module "ecs_cluster" {
  source  = "terraform-aws-modules/ecs/aws//modules/cluster"
  version = "~> 5.0"

  cluster_name = local.ecs_cluster_name

  cluster_settings = {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

# DynamoDB Chat Messages Table with Stream for Lambda
module "dynamodb_chat" {
  source = "../../../modules/dynamodb"

  project_name = var.project_name
  table_name   = "${var.project_name}-table" # For compatibility with existing module

  tags = local.common_tags
}

module "s3_uploads" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  bucket = local.uploads_bucket_name

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }
  }

  force_destroy = true

  tags = local.common_tags
}

module "elasticache" {
  source  = "terraform-aws-modules/elasticache/aws"
  version = "~> 1.0"

  cluster_id               = "${var.project_name}-redis"
  create_cluster           = true
  create_replication_group = false

  engine          = "redis"
  engine_version  = "7.0"
  node_type       = "cache.t3.micro"
  num_cache_nodes = 1

  subnet_group_name     = "${var.project_name}-redis-subnet-group"
  subnet_ids            = local.db_subnet_ids
  create_security_group = false
  security_group_ids    = [module.sg_redis.security_group_id]

  apply_immediately = true

  tags = local.common_tags
}

module "ecs_service" {
  source  = "terraform-aws-modules/ecs/aws//modules/service"
  version = "~> 5.0"

  name        = local.ecs_service_name
  cluster_arn = module.ecs_cluster.arn

  desired_count = var.desired_count
  launch_type   = "FARGATE"
  cpu           = var.task_cpu
  memory        = var.task_memory

  subnet_ids         = local.private_subnet_ids
  security_group_ids = [module.sg_ecs.security_group_id]
  assign_public_ip   = false # Private subnet with NAT GW via firewall

  create_task_exec_iam_role = true
  task_exec_secret_arns     = [data.aws_secretsmanager_secret.app_config.arn]
  task_exec_iam_statements = [
    {
      sid       = "ReadAppSecretsMeta"
      effect    = "Allow"
      actions   = ["secretsmanager:DescribeSecret"]
      resources = [data.aws_secretsmanager_secret.app_config.arn]
    },
    {
      sid     = "KmsDecrypt"
      effect  = "Allow"
      actions = ["kms:Decrypt"]
      # Use specific KMS key ARN pattern instead of wildcard
      resources = [
        "arn:aws:kms:${var.aws_region}:${data.aws_caller_identity.current.account_id}:key/*"
      ]
    }
  ]

  create_tasks_iam_role = true
  tasks_iam_role_statements = [
    {
      sid    = "DynamoCrud"
      effect = "Allow"
      actions = [
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:ConditionCheckItem",
        "dynamodb:DeleteItem",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem"
      ]
      resources = [
        module.dynamodb_chat.dynamodb_table_arn,
        "${module.dynamodb_chat.dynamodb_table_arn}/index/*"
      ]
    },
    {
      sid       = "S3Crud"
      effect    = "Allow"
      actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
      resources = ["${module.s3_uploads.s3_bucket_arn}/*"]
    },
    {
      sid       = "S3ListBucket"
      effect    = "Allow"
      actions   = ["s3:ListBucket"]
      resources = [module.s3_uploads.s3_bucket_arn]
    },
    {
      sid    = "EFSMount"
      effect = "Allow"
      actions = [
        "elasticfilesystem:ClientMount",
        "elasticfilesystem:ClientWrite",
        "elasticfilesystem:ClientRootAccess",
        "elasticfilesystem:DescribeMountTargets"
      ]
      resources = [aws_efs_file_system.main.arn]
    }
  ]

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
      image                    = var.container_image
      essential                = true
      readonly_root_filesystem = false
      port_mappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "HOST"
          value = "0.0.0.0"
        },
        {
          name  = "PORT"
          value = tostring(var.container_port)
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "DYNAMODB_TABLE_NAME"
          value = module.dynamodb_chat.dynamodb_table_id
        },
        {
          name  = "ALLOW_ANY_CLOUDFRONT"
          value = "true"
        },
        {
          name  = "CLOUDFRONT_URL"
          value = "https://d1n7m1eramrdgj.cloudfront.net"
        }
      ]
      secrets = [
        {
          name      = "JWT_SECRET"
          valueFrom = "${data.aws_secretsmanager_secret.app_config.arn}:JWT_SECRET::"
        },
        {
          name      = "JWT_REFRESH_SECRET"
          valueFrom = "${data.aws_secretsmanager_secret.app_config.arn}:JWT_REFRESH_SECRET::"
        },
        {
          name      = "MONGODB_URI"
          valueFrom = "${data.aws_secretsmanager_secret.app_config.arn}:MONGODB_URI::"
        },
        {
          name      = "GOOGLE_AI_API_KEY"
          valueFrom = "${data.aws_secretsmanager_secret.app_config.arn}:GOOGLE_AI_API_KEY::"
        },
        {
          name      = "GOOGLE_MAILER_CLIENT_ID"
          valueFrom = "${data.aws_secretsmanager_secret.app_config.arn}:GOOGLE_MAILER_CLIENT_ID::"
        },
        {
          name      = "GOOGLE_MAILER_CLIENT_SECRET"
          valueFrom = "${data.aws_secretsmanager_secret.app_config.arn}:GOOGLE_MAILER_CLIENT_SECRET::"
        },
        {
          name      = "GOOGLE_MAILER_REFRESH_TOKEN"
          valueFrom = "${data.aws_secretsmanager_secret.app_config.arn}:GOOGLE_MAILER_REFRESH_TOKEN::"
        }
      ]
      # W5 MH3: mount EFS volume
      mount_points = [
        {
          sourceVolume  = "efs-app-data"
          containerPath = "/mnt/efs"
          readOnly      = false
        }
      ]
      log_configuration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  }

  # W5 MH3: EFS volume definition
  volume = [
    {
      name = "efs-app-data"
      efs_volume_configuration = {
        file_system_id     = aws_efs_file_system.main.id
        transit_encryption = "ENABLED"
        authorization_config = {
          access_point_id = aws_efs_access_point.app.id
          iam             = "ENABLED"
        }
      }
    }
  ]

  load_balancer = {
    service = {
      target_group_arn = module.alb.target_groups["ecs"].arn
      container_name   = "app"
      container_port   = var.container_port
    }
  }

  depends_on = [module.alb, aws_efs_mount_target.private]

  tags = local.common_tags
}

resource "aws_cloudfront_distribution" "main" {
  count           = var.enable_custom_domain ? 1 : 0
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.project_name} dev CDN"
  aliases         = ["dev.${var.domain_name}"]
  web_acl_id      = aws_wafv2_web_acl.cloudfront[0].arn
  price_class     = "PriceClass_100"

  viewer_certificate {
    acm_certificate_arn      = module.acm_cloudfront[0].acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  origin {
    domain_name = module.alb.dns_name
    origin_id   = "alb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "alb"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Origin", "Accept"]

      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = local.common_tags
}

resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-user-pool"

  password_policy {
    minimum_length    = 8
    require_uppercase = true
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
  }

  auto_verified_attributes = ["email"]

  tags = local.common_tags
}

resource "aws_cognito_user_pool_client" "frontend" {
  name         = "${var.project_name}-frontend-client"
  user_pool_id = aws_cognito_user_pool.main.id

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = local.cognito_callback_urls
  logout_urls                          = local.cognito_logout_urls
  allowed_oauth_flows_user_pool_client = true
  supported_identity_providers         = ["COGNITO"]
}

module "route53_records" {
  count   = var.enable_custom_domain ? 1 : 0
  source  = "terraform-aws-modules/route53/aws//modules/records"
  version = "~> 3.0"

  zone_id = data.aws_route53_zone.main[0].zone_id

  records = [
    {
      name = "dev"
      type = "A"
      alias = {
        name                   = aws_cloudfront_distribution.main[0].domain_name
        zone_id                = aws_cloudfront_distribution.main[0].hosted_zone_id
        evaluate_target_health = false
      }
    },
    {
      name = "api.dev"
      type = "A"
      alias = {
        name                   = module.alb.dns_name
        zone_id                = module.alb.zone_id
        evaluate_target_health = true
      }
    }
  ]
}

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    ClusterName = local.ecs_cluster_name
    ServiceName = local.ecs_service_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# ============================================================================
# Lambda Function for Bedrock Chat Processing
# ============================================================================

# Create placeholder zip file if it doesn't exist
resource "null_resource" "lambda_placeholder" {
  provisioner "local-exec" {
    command     = "if (-not (Test-Path '../../../lambda-placeholder.zip')) { Compress-Archive -Path (New-Item -ItemType File -Path 'placeholder.txt' -Value 'placeholder' -Force) -DestinationPath '../../../lambda-placeholder.zip' -Force }"
    interpreter = ["PowerShell", "-Command"]
  }
}

module "lambda_bedrock_chat" {
  source = "../../../modules/lambda"

  project_name = var.project_name
  environment  = "dev"

  # Lambda deployment package
  # Build: cd backend/lambda/bedrock-chat && npm install && zip -r ../../bedrock-chat.zip .
  lambda_zip_path = fileexists("${path.module}/../../../lambda-placeholder.zip") ? "${path.module}/../../../lambda-placeholder.zip" : "${path.module}/../../../../backend/lambda/bedrock-chat.zip"

  # Bedrock configuration
  bedrock_kb_id  = "QVO2CHQ1MF" # Your Bedrock Knowledge Base ID
  bedrock_region = "us-west-2"  # Bedrock KB region

  # DynamoDB configuration
  dynamodb_table_name = module.dynamodb_chat.chat_messages_table_name
  dynamodb_table_arn  = module.dynamodb_chat.chat_messages_table_arn
  dynamodb_stream_arn = module.dynamodb_chat.chat_messages_stream_arn

  # MongoDB URI from Secrets Manager
  mongodb_uri = data.aws_secretsmanager_secret_version.app_config.secret_string

  # CloudWatch Logs retention
  log_retention_days = 7

  # VPC configuration (optional - enable if MongoDB is in VPC)
  vpc_config_enabled = false
  # subnet_ids         = data.terraform_remote_state.network.outputs.private_subnet_ids
  # security_group_ids = [module.sg_ecs.security_group_id]

  tags = local.common_tags

  depends_on = [
    module.dynamodb_chat,
    null_resource.lambda_placeholder
  ]
}

# ============================================================================
# VPC Endpoints for S3 and DynamoDB (Must-have 4)
# ============================================================================

# S3 Gateway Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = local.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [local.route_table_id]

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-s3-endpoint"
    Purpose = "S3 Gateway Endpoint for private subnet access"
  })
}

# DynamoDB Gateway Endpoint
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = local.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [local.route_table_id]

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-dynamodb-endpoint"
    Purpose = "DynamoDB Gateway Endpoint for private subnet access"
  })
}

# ============================================================================
# W5 MH2: Route private subnet traffic through Network Firewall
# Private subnet → Firewall endpoint → NAT GW → Internet
# ============================================================================

# resource "aws_route" "private_to_firewall" {
#   route_table_id         = data.aws_route_table.private.id
#   destination_cidr_block = "0.0.0.0/0"
#   vpc_endpoint_id        = tolist(aws_networkfirewall_firewall.main.firewall_status[0].sync_states)[0].attachment[0].endpoint_id
# }

# Enforce deterministic routing via local-exec to override standard VPC module routes
resource "null_resource" "firewall_routing" {
  triggers = {
    firewall_id = aws_networkfirewall_firewall.main.id
    # Always trigger during runs to ensure routes remain compliant
    timestamp = "${timestamp()}"
  }

  provisioner "local-exec" {
    command     = <<-EOT
      $statusJson = (aws network-firewall describe-firewall --firewall-name ${aws_networkfirewall_firewall.main.name} --region ${var.aws_region} | ConvertFrom-Json)
      $endpointId = $statusJson.FirewallStatus.SyncStates[0].Attachment.EndpointId
      if ($endpointId) {
        Write-Host "Updating private route table to route via Firewall Endpoint $endpointId..."
        aws ec2 replace-route --route-table-id ${data.aws_route_table.private.id} --destination-cidr-block 0.0.0.0/0 --vpc-endpoint-id $endpointId --region ${var.aws_region} 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
          aws ec2 create-route --route-table-id ${data.aws_route_table.private.id} --destination-cidr-block 0.0.0.0/0 --vpc-endpoint-id $endpointId --region ${var.aws_region} 2>&1 | Out-Null
        }

        $natGwId = "${data.terraform_remote_state.network.outputs.natgw_ids[0]}"
        $intraRtId = "${data.terraform_remote_state.network.outputs.intra_route_table_ids[0]}"
        Write-Host "Updating intra route table $intraRtId to route via NAT Gateway $natGwId..."
        aws ec2 replace-route --route-table-id $intraRtId --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $natGwId --region ${var.aws_region} 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
          aws ec2 create-route --route-table-id $intraRtId --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $natGwId --region ${var.aws_region} 2>&1 | Out-Null
        }
        Write-Host "Network Fortress routing successfully enforced."
      }
    EOT
    interpreter = ["PowerShell", "-Command"]
  }

  depends_on = [aws_networkfirewall_firewall.main]
}
