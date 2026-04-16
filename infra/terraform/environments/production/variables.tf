variable "aws_region" {
  description = "AWS region for VPC/ECS/DynamoDB"
  type        = string
  default     = "ap-southeast-1"
}

variable "name_prefix" {
  description = "Prefix for naming resources"
  type        = string
  default     = "kicks-prod"
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
  default     = "10.60.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Exactly 2 public subnets for ALB and NAT"
  type        = list(string)
  default     = ["10.60.1.0/24", "10.60.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Exactly 2 private subnets for ECS"
  type        = list(string)
  default     = ["10.60.11.0/24", "10.60.12.0/24"]
}

variable "azs" {
  description = "Optional AZ override. Leave empty to auto-pick first 2 AZs."
  type        = list(string)
  default     = []
}

variable "container_name" {
  description = "Container name"
  type        = string
  default     = "kicks-backend"
}

variable "container_image" {
  description = "Container image URI from ECR"
  type        = string
}

variable "ecr_repository_arn" {
  description = "ECR repository ARN used by least-privilege execution role"
  type        = string
  default     = ""
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "ALB health check path"
  type        = string
  default     = "/api/health"
}

variable "health_check_matcher" {
  description = "ALB health check matcher"
  type        = string
  default     = "200-399"
}

variable "task_cpu" {
  description = "Fargate CPU units"
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Fargate memory in MiB"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Initial ECS desired count"
  type        = number
  default     = 2
}

variable "assign_public_ip" {
  description = "Should remain false for private subnet deployment"
  type        = bool
  default     = false
}

variable "health_check_grace_period_seconds" {
  description = "ECS health check grace period"
  type        = number
  default     = 60
}

variable "min_capacity" {
  description = "Minimum ECS task count"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum ECS task count"
  type        = number
  default     = 8
}

variable "target_cpu_utilization" {
  description = "Auto Scaling CPU target"
  type        = number
  default     = 60
}

variable "scale_in_cooldown_seconds" {
  description = "Scale-in cooldown"
  type        = number
  default     = 180
}

variable "scale_out_cooldown_seconds" {
  description = "Scale-out cooldown"
  type        = number
  default     = 60
}

variable "environment_variables" {
  description = "Plain environment variables"
  type        = map(string)
  default = {
    NODE_ENV = "production"
    PORT     = "3000"
  }
}

variable "secret_environment_variables" {
  description = "Direct secret mapping (ENV_VAR => Secrets Manager valueFrom ref)"
  type        = map(string)
  default     = {}
}

variable "app_config_secret_arn" {
  description = "Single JSON Secrets Manager ARN for grouped app secrets"
  type        = string
  default     = ""
}

variable "app_config_secret_keys" {
  description = "Secret keys read from app_config_secret_arn and injected into ECS"
  type        = list(string)
  default     = []
}

variable "secret_access_arns" {
  description = "Additional secret ARNs for execution role access"
  type        = list(string)
  default     = []
}

variable "dynamodb_table_name" {
  description = "Primary DynamoDB table name"
  type        = string
  default     = "kicks-shoes-app"
}

variable "origin_verify_header_name" {
  description = "Header name used by CloudFront to call ALB"
  type        = string
  default     = "x-origin-verify"
}

variable "origin_verify_header_value" {
  description = "Header value used by CloudFront to call ALB"
  type        = string
  sensitive   = true
}

variable "restrict_alb_to_cloudfront" {
  description = "Restrict ALB ingress to CloudFront managed prefix list"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch logs retention days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Default resource tags"
  type        = map(string)
  default = {
    Project     = "kicks-shoes"
    ManagedBy   = "terraform"
    Environment = "production"
  }
}
