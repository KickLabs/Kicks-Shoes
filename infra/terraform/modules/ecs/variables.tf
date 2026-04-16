variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnets for ECS service ENIs"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "Security group ID from ALB"
  type        = string
}

variable "target_group_arn" {
  description = "Target group ARN for ECS service"
  type        = string
}

variable "container_name" {
  description = "Container name in task definition"
  type        = string
  default     = "app"
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
  description = "Task CPU units"
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Task memory in MiB"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Desired task count"
  type        = number
  default     = 2
}

variable "assign_public_ip" {
  description = "Assign public IP to Fargate tasks"
  type        = bool
  default     = true
}

variable "health_check_grace_period_seconds" {
  description = "Grace period for ALB health checks"
  type        = number
  default     = 60
}

variable "environment_variables" {
  description = "Environment variables injected into container"
  type        = map(string)
  default     = {}
}

variable "log_retention_days" {
  description = "CloudWatch log retention"
  type        = number
  default     = 14
}

variable "tags" {
  description = "Tags applied to all resources"
  type        = map(string)
  default     = {}
}
