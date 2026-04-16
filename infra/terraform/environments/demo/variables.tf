variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "name_prefix" {
  description = "Prefix for naming resources"
  type        = string
  default     = "kicks-fargate-demo"
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
  default     = "10.42.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnets used by ALB and ECS tasks"
  type        = list(string)
  default     = ["10.42.1.0/24", "10.42.2.0/24"]

  validation {
    condition     = length(var.public_subnet_cidrs) >= 2
    error_message = "At least two public subnets are required."
  }
}

variable "azs" {
  description = "Optional AZ override. Leave empty to auto-pick first two AZs."
  type        = list(string)
  default     = []
}

variable "container_name" {
  description = "Container name in ECS task definition"
  type        = string
  default     = "kicks-backend"
}

variable "container_image" {
  description = "Container image URI, usually ECR URI with tag"
  type        = string
}

variable "container_port" {
  description = "Application port exposed by container"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "ALB health check path"
  type        = string
  default     = "/api/health"
}

variable "health_check_matcher" {
  description = "ALB health check success codes"
  type        = string
  default     = "200-399"
}

variable "task_cpu" {
  description = "Fargate task CPU units"
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Fargate task memory in MiB"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Initial desired count for service"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum number of tasks for autoscaling"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of tasks for autoscaling"
  type        = number
  default     = 6
}

variable "target_cpu_utilization" {
  description = "Target CPU percentage for target tracking autoscaling"
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

variable "assign_public_ip" {
  description = "Assign public IP to ECS tasks"
  type        = bool
  default     = true
}

variable "health_check_grace_period_seconds" {
  description = "ECS service health check grace period"
  type        = number
  default     = 60
}

variable "environment_variables" {
  description = "Environment variables for the application container"
  type        = map(string)
  default = {
    NODE_ENV = "production"
  }
}

variable "log_retention_days" {
  description = "CloudWatch log retention"
  type        = number
  default     = 14
}

variable "tags" {
  description = "Default resource tags"
  type        = map(string)
  default = {
    Project     = "kicks-shoes"
    ManagedBy   = "terraform"
    Environment = "demo"
  }
}
