# 02-app — Application Stack

**Path:** `infra/terraform/environments/dev/02-app/`
**State key:** `dev/02-app/terraform.tfstate`

---

## Purpose

Deploy all application-layer resources for dev. Reads VPC outputs from `01-network` via `terraform_remote_state`. Must be applied **after** `01-network`.

---

## File Tree

```
02-app/
├── main.tf                   # all module/resource calls
├── data.tf                   # remote_state + data sources
├── variables.tf
├── outputs.tf
├── providers.tf              # two aliases: ap-southeast-1 + us-east-1 (WAF/ACM for CF)
├── versions.tf
└── terraform.tfvars.example
```

---

## Component Map

| Component | Type | Public Module / Resource |
|-----------|------|--------------------------|
| Security Groups | Resource | `terraform-aws-modules/security-group/aws ~> 5.0` |
| ACM (ALB cert) | Module | `terraform-aws-modules/acm/aws ~> 5.0` — region `ap-southeast-1` |
| ACM (CloudFront cert) | Module | `terraform-aws-modules/acm/aws ~> 5.0` — provider alias `us-east-1` |
| WAF (CloudFront) | Resource | `aws_wafv2_web_acl` — provider alias `us-east-1` |
| ALB | Module | `terraform-aws-modules/alb/aws ~> 9.0` |
| ECS Cluster | Module | `terraform-aws-modules/ecs/aws//modules/cluster ~> 5.0` |
| ECS Service | Module | `terraform-aws-modules/ecs/aws//modules/service ~> 5.0` |
| ElastiCache Redis | Module | `terraform-aws-modules/elasticache/aws ~> 1.0` |
| DynamoDB | Module | `terraform-aws-modules/dynamodb-table/aws ~> 4.0` |
| S3 (image upload) | Module | `terraform-aws-modules/s3-bucket/aws ~> 4.0` |
| CloudFront | Resource | `aws_cloudfront_distribution` |
| Cognito | Resource | `aws_cognito_user_pool` + `aws_cognito_user_pool_client` |
| Route53 records | Module | `terraform-aws-modules/route53/aws ~> 3.0` (records submodule) |
| Secrets Manager | Resource | `aws_secretsmanager_secret` (pre-existing secret, referenced by ARN) |
| CloudWatch Logs | Resource | `aws_cloudwatch_log_group` |
| SNS (alerts) | Resource | `aws_sns_topic` |

---

## Architecture Flow

```
Internet
  │
  ▼
Route53 (DNS) ──→ CloudFront (CDN)
                    │   WAF attached (us-east-1)
                    │   ACM cert (us-east-1)
                    │
                    ├── S3 static frontend (origin 1)
                    │
                    └── ALB (origin 2)
                          │   ACM cert (ap-southeast-1)
                          │   Security Group: 80/443 from 0.0.0.0/0
                          │
                          ▼
                     ECS Fargate (private subnets)
                          │   Auto Scaling: CPU 60% target
                          │   Secrets: Secrets Manager → container env
                          │
                          ├──→ ElastiCache Redis (db subnets)
                          ├──→ DynamoDB (managed service)
                          └──→ S3 image upload bucket

Cognito User Pool ──→ frontend auth flow
CloudWatch ──→ ECS logs + metrics
SNS ──→ CloudWatch alarms notification
```

---

## `providers.tf`

```hcl
provider "aws" {
  region = var.aws_region
  alias  = "main"
}

# Required for CloudFront WAF + ACM
provider "aws" {
  region = "us-east-1"
  alias  = "us_east_1"
}
```

---

## `versions.tf`

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket  = "kicks-shoes-tf-state"
    key     = "dev/02-app/terraform.tfstate"
    region  = "ap-southeast-1"
    encrypt = true
  }
}
```

---

## `data.tf`

```hcl
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

# Existing Secrets Manager secret (pre-created manually or via CLI)
data "aws_secretsmanager_secret" "app_config" {
  name = var.app_config_secret_name
}
```

---

## `main.tf` — Key Blocks

### Security Groups

```hcl
module "sg_alb" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${var.project_name}-alb-sg"
  description = "ALB: allow 80/443 from internet"
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id

  ingress_cidr_blocks = ["0.0.0.0/0"]
  ingress_rules       = ["http-80-tcp", "https-443-tcp"]
  egress_rules        = ["all-all"]
}

module "sg_ecs" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${var.project_name}-ecs-sg"
  description = "ECS: allow traffic from ALB only"
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id

  computed_ingress_with_source_security_group_id = [
    {
      rule                     = "http-3000-tcp"
      source_security_group_id = module.sg_alb.security_group_id
    }
  ]
  number_of_computed_ingress_with_source_security_group_id = 1
  egress_rules = ["all-all"]
}

module "sg_redis" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${var.project_name}-redis-sg"
  description = "Redis: allow 6379 from ECS only"
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id

  computed_ingress_with_source_security_group_id = [
    {
      from_port                = 6379
      to_port                  = 6379
      protocol                 = "tcp"
      source_security_group_id = module.sg_ecs.security_group_id
    }
  ]
  number_of_computed_ingress_with_source_security_group_id = 1
  egress_rules = ["all-all"]
}
```

### ACM Certificates

```hcl
# ALB cert (ap-southeast-1)
module "acm_alb" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 5.0"

  domain_name               = "api.dev.${var.domain_name}"
  zone_id                   = data.aws_route53_zone.main.zone_id
  validation_method         = "DNS"
  wait_for_validation       = true
}

# CloudFront cert (must be us-east-1)
module "acm_cloudfront" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 5.0"
  providers = { aws = aws.us_east_1 }

  domain_name         = "dev.${var.domain_name}"
  zone_id             = data.aws_route53_zone.main.zone_id
  validation_method   = "DNS"
  wait_for_validation = true
}
```

### WAF (CloudFront — us-east-1)

```hcl
resource "aws_wafv2_web_acl" "cloudfront" {
  provider    = aws.us_east_1
  name        = "${var.project_name}-waf"
  description = "WAF for CloudFront - dev"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
    override_action { none {} }

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
}
```

### ALB

```hcl
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
      redirect = {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
    https = {
      port            = 443
      protocol        = "HTTPS"
      certificate_arn = module.acm_alb.acm_certificate_arn
      forward = {
        target_group_key = "ecs"
      }
    }
  }
}
```

### ECS Cluster + Service

```hcl
module "ecs_cluster" {
  source  = "terraform-aws-modules/ecs/aws//modules/cluster"
  version = "~> 5.0"

  cluster_name = "${var.project_name}-cluster"

  cluster_settings = {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 7
  tags              = local.common_tags
}

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
    secrets = aws_iam_policy.ecs_secrets.arn  # inline policy for Secrets Manager access
  }

  create_tasks_iam_role = true
  tasks_iam_role_policies = {
    dynamodb = aws_iam_policy.ecs_dynamodb.arn
    s3       = aws_iam_policy.ecs_s3.arn
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
        { name = "PORT",     value = tostring(var.container_port) }
      ]
      secrets = [
        { name = "JWT_SECRET",         valueFrom = "${data.aws_secretsmanager_secret.app_config.arn}:JWT_SECRET::" },
        { name = "JWT_REFRESH_SECRET", valueFrom = "${data.aws_secretsmanager_secret.app_config.arn}:JWT_REFRESH_SECRET::" },
        { name = "MONGODB_URI",        valueFrom = "${data.aws_secretsmanager_secret.app_config.arn}:MONGODB_URI::" },
        { name = "GOOGLE_AI_API_KEY",  valueFrom = "${data.aws_secretsmanager_secret.app_config.arn}:GOOGLE_AI_API_KEY::" }
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

  load_balancer = {
    service = {
      target_group_arn = module.alb.target_groups["ecs"].arn
      container_name   = "app"
      container_port   = var.container_port
    }
  }
}
```

### ElastiCache Redis

```hcl
module "elasticache" {
  source  = "terraform-aws-modules/elasticache/aws"
  version = "~> 1.0"

  cluster_id               = "${var.project_name}-redis"
  create_replication_group = false  # single node for dev

  engine_version = "7.0"
  node_type      = "cache.t3.micro"
  num_cache_nodes = 1

  subnet_group_name  = "${var.project_name}-redis-subnet-group"
  subnet_ids         = data.terraform_remote_state.network.outputs.db_subnet_ids
  security_group_ids = [module.sg_redis.security_group_id]

  tags = local.common_tags
}
```

### DynamoDB

```hcl
module "dynamodb" {
  source  = "terraform-aws-modules/dynamodb-table/aws"
  version = "~> 4.0"

  name         = "${var.project_name}-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attributes = [
    { name = "pk", type = "S" },
    { name = "sk", type = "S" }
  ]

  point_in_time_recovery_enabled = false  # dev: disabled

  tags = local.common_tags
}
```

### S3 Image Upload Bucket

```hcl
module "s3_uploads" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  bucket = "${var.project_name}-uploads"

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

  tags = local.common_tags
}
```

### CloudFront

```hcl
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} dev CDN"
  aliases             = ["dev.${var.domain_name}"]
  web_acl_id          = aws_wafv2_web_acl.cloudfront.arn
  price_class         = "PriceClass_100"  # US/EU only — cheapest for dev

  viewer_certificate {
    acm_certificate_arn      = module.acm_cloudfront.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # ALB origin (API)
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
      cookies { forward = "none" }
    }
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  tags = local.common_tags
}
```

### Cognito

```hcl
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
  callback_urls                        = ["https://dev.${var.domain_name}/auth/callback"]
  logout_urls                          = ["https://dev.${var.domain_name}/logout"]
  allowed_oauth_flows_user_pool_client = true
  supported_identity_providers         = ["COGNITO"]
}
```

### Route53 Records

```hcl
module "route53_records" {
  source  = "terraform-aws-modules/route53/aws//modules/records"
  version = "~> 3.0"

  zone_id = data.aws_route53_zone.main.zone_id

  records = [
    {
      name = "dev"
      type = "A"
      alias = {
        name                   = aws_cloudfront_distribution.main.domain_name
        zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
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
```

### SNS + CloudWatch Alarm

```hcl
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
    ClusterName = module.ecs_cluster.name
    ServiceName = module.ecs_service.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

---

## `variables.tf`

```hcl
variable "project_name" {
  type    = string
  default = "kicks-shoes-dev"
}

variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "domain_name" {
  type        = string
  description = "Root domain name, e.g. kicks-shoes.com"
}

variable "container_image" {
  type        = string
  description = "ECR image URI, e.g. 123456789.dkr.ecr.ap-southeast-1.amazonaws.com/kicks-shoes-backend:dev-latest"
}

variable "container_port" {
  type    = number
  default = 3000
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "task_cpu" {
  type    = number
  default = 256
}

variable "task_memory" {
  type    = number
  default = 512
}

variable "autoscaling_min" {
  type    = number
  default = 1
}

variable "autoscaling_max" {
  type    = number
  default = 3
}

variable "autoscaling_cpu_target" {
  type    = number
  default = 60
}

variable "app_config_secret_name" {
  type        = string
  description = "Secrets Manager secret name containing app config keys"
  default     = "kicks-shoes-dev/app-config"
}

variable "tags" {
  type    = map(string)
  default = {}
}
```

---

## `outputs.tf`

```hcl
output "alb_dns_name" {
  value = module.alb.dns_name
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "ecs_cluster_name" {
  value = module.ecs_cluster.name
}

output "ecs_service_name" {
  value = module.ecs_service.name
}

output "dynamodb_table_name" {
  value = module.dynamodb.table_id
}

output "s3_uploads_bucket" {
  value = module.s3_uploads.s3_bucket_id
}

output "redis_endpoint" {
  value     = module.elasticache.cluster_cache_nodes[0].address
  sensitive = true
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.frontend.id
}
```

---

## `terraform.tfvars.example`

```hcl
project_name   = "kicks-shoes-dev"
aws_region     = "ap-southeast-1"
domain_name    = "kicks-shoes.com"

container_image        = "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/kicks-shoes-backend:dev-latest"
container_port         = 3000
desired_count          = 1
task_cpu               = 256
task_memory            = 512
autoscaling_min        = 1
autoscaling_max        = 3
autoscaling_cpu_target = 60

app_config_secret_name = "kicks-shoes-dev/app-config"

tags = {
  Owner = "dev-team"
}
```

---

## Deploy Order

```bash
# 1. Apply network first
cd infra/terraform/environments/dev/01-network
terraform init && terraform apply -var-file="terraform.tfvars"

# 2. Apply app stack (reads 01-network remote state)
cd ../02-app
terraform init && terraform apply -var-file="terraform.tfvars"
```

---

## IAM Policies (inline in main.tf)

Three separate `aws_iam_policy` resources to attach to ECS task roles:

| Policy | Permissions | Attached to |
|--------|-------------|-------------|
| `ecs_secrets` | `secretsmanager:GetSecretValue`, `kms:Decrypt` | `task_exec_iam_role` |
| `ecs_dynamodb` | DynamoDB CRUD on table + indexes | `tasks_iam_role` |
| `ecs_s3` | `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on uploads bucket | `tasks_iam_role` |

---

## Prerequisites

| Resource | Action |
|----------|--------|
| S3 bucket `kicks-shoes-tf-state` | Create once before `terraform init` |
| Secrets Manager secret `kicks-shoes-dev/app-config` | Create with all keys from `backend/.env.example` |
| ECR repository `kicks-shoes-backend` | Create + push dev image |
| Route53 hosted zone for `domain_name` | Must already exist |
