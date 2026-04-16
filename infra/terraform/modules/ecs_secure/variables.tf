variable "name_prefix" {
  description = "Prefix for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR, used for restricted DNS egress"
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for ECS service"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "ALB security group ID"
  type        = string
}

variable "target_group_arn" {
  description = "ALB target group ARN"
  type        = string
}

variable "container_name" {
  description = "Container name"
  type        = string
  default     = "kicks-backend"
}

variable "container_image" {
  description = "Container image URI"
  type        = string
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 3000
}

variable "task_cpu" {
  description = "Fargate task CPU"
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Fargate task memory (MiB)"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Desired ECS task count"
  type        = number
  default     = 2
}

variable "assign_public_ip" {
  description = "Assign public IP to ECS tasks"
  type        = bool
  default     = false
}

variable "health_check_grace_period_seconds" {
  description = "Health check grace period"
  type        = number
  default     = 60
}

variable "environment_variables" {
  description = "Plain environment variables"
  type        = map(string)
  default     = {}
}

variable "secret_environment_variables" {
  description = "Direct ECS secret mapping (name => Secrets Manager valueFrom ARN/ref)"
  type        = map(string)
  default     = {}
}

variable "app_config_secret_arn" {
  description = "Single Secrets Manager ARN storing JSON object for multiple env vars"
  type        = string
  default     = ""
}

variable "app_config_secret_keys" {
  description = "Keys inside app_config_secret_arn to expose as env vars"
  type        = list(string)
  default     = []
}

variable "secret_access_arns" {
  description = "Extra secret ARNs allowed for execution role"
  type        = list(string)
  default     = []
}

variable "ecr_repository_arn" {
  description = "ECR repository ARN for image pull permissions"
  type        = string
  default     = ""
}

variable "dynamodb_table_arn" {
  description = "Primary DynamoDB table ARN"
  type        = string
}

variable "dynamodb_actions" {
  description = "Least-privilege DynamoDB actions for task role"
  type        = list(string)
  default = [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem",
    "dynamodb:DeleteItem",
    "dynamodb:Query",
    "dynamodb:Scan",
    "dynamodb:BatchGetItem",
    "dynamodb:BatchWriteItem",
    "dynamodb:ConditionCheckItem",
    "dynamodb:DescribeTable"
  ]
}

variable "log_retention_days" {
  description = "CloudWatch log retention"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags applied to all resources"
  type        = map(string)
  default     = {}
}
